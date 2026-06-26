import { BackendApiError, backendRequest } from "@/lib/api/backend-client";
import { normalizeVisualPreferences } from "@/lib/api/normalizers";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { setSessionCookies, setSessionSnapshot } from "@/lib/auth/cookies";
import { backendRoutes } from "@/lib/config/backend-routes";

function unwrapPreferencesData(raw: unknown): Record<string, unknown> {
 if (!raw || typeof raw !== "object") return {};
 const obj = raw as Record<string, unknown>;
 if (obj.data && typeof obj.data === "object" && "data" in (obj.data as Record<string, unknown>)) {
  return (obj.data as Record<string, unknown>).data as Record<string, unknown>;
 }
 if (obj.data && typeof obj.data === "object") {
  return obj.data as Record<string, unknown>;
 }
 return obj;
}

const DEFAULT_PREFERENCES = {
 theme: "system" as const,
 language: "es" as const,
 sidebarCollapsed: false,
 density: "comfortable" as const,
 accentColor: "green" as const,
};

async function syncSessionPreferences(responseData: unknown) {
 const preferences = normalizeVisualPreferences(responseData);
 if (!preferences) return;

 const context = await getSessionContext();
 await setSessionSnapshot({
 ...context.session,
 user: {
 ...context.session.user,
 preferences,
 },
 });
}

function isEmptyObject(obj: unknown): boolean {
 return Boolean(obj) && typeof obj === "object" && Object.keys(obj as Record<string, unknown>).length === 0;
}

export async function GET() {
 try {
 const context = await getSessionContext();
 const response = await backendRequest({
 pathCandidates: backendRoutes.users.preferences,
 accessToken: context.accessToken,
 refreshToken: context.refreshToken,
 });

 if (response.refreshedTokens) {
 await setSessionCookies(response.refreshedTokens);
 }

 const unwrapped = unwrapPreferencesData(response.data);
 const data = isEmptyObject(unwrapped) ? DEFAULT_PREFERENCES : unwrapped;
 await syncSessionPreferences(data);
 return jsonResponse(data);
 } catch (error) {
 if (error && typeof error === "object" && "status" in error && error.status === 404) {
 return jsonResponse(DEFAULT_PREFERENCES);
 }
 return handleRouteError(error);
 }
}

export async function PUT(request: Request) {
 try {
 const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
 const context = await getSessionContext();
 const response = await backendRequest({
 pathCandidates: backendRoutes.users.preferences,
 method: "PUT",
 body: payload,
 accessToken: context.accessToken,
 refreshToken: context.refreshToken,
 });

 if (response.refreshedTokens) {
 await setSessionCookies(response.refreshedTokens);
 }

 const unwrapped = unwrapPreferencesData(response.data);
 const data = isEmptyObject(unwrapped) ? DEFAULT_PREFERENCES : unwrapped;
 await syncSessionPreferences(data);
 return jsonResponse(data);
 } catch (error) {
 if (error && typeof error === "object" && "status" in error && error.status === 404) {
 return jsonResponse(DEFAULT_PREFERENCES);
 }
 return handleRouteError(error);
 }
}
