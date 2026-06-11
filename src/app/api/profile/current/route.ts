import { BackendApiError, backendRequest } from "@/lib/api/backend-client";
import { normalizeSession } from "@/lib/api/normalizers";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { setSessionCookies, setSessionSnapshot } from "@/lib/auth/cookies";
import { backendRoutes } from "@/lib/config/backend-routes";
import type { SessionData } from "@/types";

function mergeSessionData(baseSession: SessionData, nextSession: SessionData): SessionData {
 return {
 source: "api",
 user: {
 ...baseSession.user,
 ...nextSession.user,
 fullName:
 nextSession.user.fullName && nextSession.user.fullName !== "No informado"
 ? nextSession.user.fullName
 : baseSession.user.fullName,
 email:
 nextSession.user.email && nextSession.user.email !== "No informado"
 ? nextSession.user.email
 : baseSession.user.email,
 role: nextSession.user.role !== "unknown" ? nextSession.user.role : baseSession.user.role,
 position:
 nextSession.user.position && nextSession.user.position !== "No informado"
 ? nextSession.user.position
 : baseSession.user.position,
 project: nextSession.user.project ?? baseSession.user.project,
 department: nextSession.user.department ?? baseSession.user.department,
 phone: nextSession.user.phone ?? baseSession.user.phone,
 birthDate: nextSession.user.birthDate ?? baseSession.user.birthDate,
 avatarUrl: nextSession.user.avatarUrl ?? baseSession.user.avatarUrl,
 preferences: nextSession.user.preferences ?? baseSession.user.preferences,
 forcePasswordChange:
 nextSession.user.forcePasswordChange ?? baseSession.user.forcePasswordChange,
 status: nextSession.user.status !== "unknown" ? nextSession.user.status : baseSession.user.status,
 permissions: nextSession.user.permissions.length
 ? nextSession.user.permissions
 : baseSession.user.permissions,
 },
 };
}

export async function GET() {
 const context = await getSessionContext();

 try {
 const response = await backendRequest({
 pathCandidates: backendRoutes.profile.current,
 accessToken: context.accessToken,
 refreshToken: context.refreshToken,
 });

 if (response.refreshedTokens) {
 await setSessionCookies(response.refreshedTokens);
 }

 const session = mergeSessionData(context.session, normalizeSession(response.data));
 await setSessionSnapshot(session);

 return jsonResponse(response.data);
 } catch (error) {
 if (error instanceof BackendApiError && ![401, 403].includes(error.status)) {
 try {
 const fallbackResponse = await backendRequest({
 pathCandidates: backendRoutes.auth.profile,
 accessToken: context.accessToken,
 refreshToken: context.refreshToken,
 });

 if (fallbackResponse.refreshedTokens) {
 await setSessionCookies(fallbackResponse.refreshedTokens);
 }

 const session = mergeSessionData(context.session, normalizeSession(fallbackResponse.data));
 await setSessionSnapshot(session);

 return jsonResponse(fallbackResponse.data);
 } catch (fallbackError) {
 if (fallbackError instanceof BackendApiError && ![401, 403].includes(fallbackError.status)) {
 return jsonResponse(context.session);
 }

 return handleRouteError(fallbackError);
 }
 }

 return handleRouteError(error);
 }
}

export async function PATCH(request: Request) {
 try {
 const payload = (await request.json()) as Record<string, unknown>;
 const context = await getSessionContext();

 const response = await backendRequest({
 pathCandidates: backendRoutes.profile.update,
 method: "PATCH",
 body: payload,
 accessToken: context.accessToken,
 refreshToken: context.refreshToken,
 });

 const session = mergeSessionData(context.session, normalizeSession(response.data));
 await setSessionSnapshot(session);
 return jsonResponse(response.data);
 } catch (error) {
 if (error instanceof BackendApiError && error.status === 404) {
 return jsonResponse(
 {
 message:
 "La API no expone una ruta confirmada para actualizar perfil. Ajusta los paths de autenticacion.",
 status: 501,
 },
 501,
 );
 }

 return handleRouteError(error);
 }
}
