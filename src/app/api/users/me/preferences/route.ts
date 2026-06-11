import { backendRequest } from "@/lib/api/backend-client";
import { normalizeVisualPreferences } from "@/lib/api/normalizers";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { setSessionCookies, setSessionSnapshot } from "@/lib/auth/cookies";
import { backendRoutes } from "@/lib/config/backend-routes";

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

 await syncSessionPreferences(response.data);
 return jsonResponse(response.data);
 } catch (error) {
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

 await syncSessionPreferences(response.data);
 return jsonResponse(response.data);
 } catch (error) {
 return handleRouteError(error);
 }
}
