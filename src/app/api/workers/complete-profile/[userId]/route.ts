import { backendRequest } from "@/lib/api/backend-client";
import { appConfig } from "@/lib/config/app-config";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { logger } from "@/lib/logger";

const completeProfilePathCandidates = (userId: string) => [
 `/api/workers/complete-profile/${userId}`,
 `/api/admin/workers/complete-profile/${userId}`,
 `/api/workers/${userId}/complete-profile`,
];

export async function GET(
 _request: Request,
 { params }: { params: Promise<{ userId: string }> },
) {
 const { userId } = await params;
 try {
 const context = await getSessionContext();
 if (process.env.NODE_ENV !== "production") {
 logger.log("[workers/complete-profile] GET backend", {
 baseUrl: appConfig.backendBaseUrl,
 userId,
 });
 }

 const response = await backendRequest({
 pathCandidates: completeProfilePathCandidates(userId),
 accessToken: context.accessToken,
 refreshToken: context.refreshToken,
 });

 // ── DIAGNOSTIC: log role-related fields from backend response ──────────────
 if (process.env.NODE_ENV !== "production") {
 const data = response.data as Record<string, unknown> | null;
 const user = (data?.user ?? data) as Record<string, unknown> | null;
 if (user) {
 logger.log("[complete-profile GET] role fields from backend:", {
 role: user.role,
 roleId: user.roleId,
 role_id: user.role_id,
 systemRole: user.systemRole,
 system_role: user.system_role,
 roles: user.roles,
 });
 }
 }
 // ── END DIAGNOSTIC ──────────────────────────────────────────────────────────

 return jsonResponse(response.data);
 } catch (error) {
 return handleRouteError(error);
 }
}

export async function PUT(
 request: Request,
 { params }: { params: Promise<{ userId: string }> },
) {
 const { userId } = await params;
 try {
 const payload = await request.json();
 const context = await getSessionContext();
 if (process.env.NODE_ENV !== "production") {
 logger.log("[workers/complete-profile] PUT backend", {
 baseUrl: appConfig.backendBaseUrl,
 userId,
 });
 }

 const response = await backendRequest({
 pathCandidates: completeProfilePathCandidates(userId),
 method: "PUT",
 body: payload,
 accessToken: context.accessToken,
 refreshToken: context.refreshToken,
 });

 return jsonResponse(response.data);
 } catch (error) {
 return handleRouteError(error);
 }
}
