import { BackendApiError, backendRequest } from "@/lib/api/backend-client";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { setSessionCookies, setSessionSnapshot } from "@/lib/auth/cookies";
import { normalizeSession } from "@/lib/api/normalizers";
import { backendRoutes } from "@/lib/config/backend-routes";

export async function GET() {
 try {
 const context = await getSessionContext();

 const response = await backendRequest({
 pathCandidates: [...backendRoutes.profile.current, ...backendRoutes.auth.profile],
 accessToken: context.accessToken,
 refreshToken: context.refreshToken,
 });

 if (response.refreshedTokens) {
 await setSessionCookies(response.refreshedTokens);
 }

 const session = normalizeSession(response.data);
 await setSessionSnapshot(session);

 return jsonResponse(response.data);
 } catch (error) {
 if (error instanceof BackendApiError && ![401, 403].includes(error.status)) {
 const context = await getSessionContext();
 return jsonResponse({ user: context.session.user, source: "session-fallback" });
 }

 return handleRouteError(error);
 }
}
