import { BackendApiError, backendRequest } from "@/lib/api/backend-client";
import { normalizeRequestDetail } from "@/lib/api/normalizers";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { backendRoutes } from "@/lib/config/backend-routes";

type ReviewRouteContext = { params: Promise<{ requestId: string }> };

const getDecisionRoutes = (requestId: string, decision: string) => {
 if (decision === "approve") return backendRoutes.requests.approve(requestId);
 if (decision === "reject") return backendRoutes.requests.reject(requestId);
 if (decision === "observe") return backendRoutes.requests.observe(requestId);
 return [];
};

export async function POST(request: Request, context: ReviewRouteContext) {
 try {
 const { requestId } = await context.params;
 const payload = (await request.json()) as { action: string; reason?: string };
 const sessionContext = await getSessionContext();

 try {
 const response = await backendRequest({
 pathCandidates: backendRoutes.requests.review(requestId),
 method: "POST",
 body: payload,
 accessToken: sessionContext.accessToken,
 refreshToken: sessionContext.refreshToken,
 });

 return jsonResponse(normalizeRequestDetail(response.data));
 } catch (error) {
 if (!(error instanceof BackendApiError) || ![404, 405].includes(error.status)) {
 throw error;
 }
 }

 const decisionRoutes = getDecisionRoutes(requestId, payload.action);

 if (!decisionRoutes.length) {
 throw new BackendApiError("Decision de solicitud no soportada por el frontend.", 400, {
 action: payload.action,
 });
 }

 const response = await backendRequest({
 pathCandidates: decisionRoutes,
 method: "PATCH",
 body: {
 reason: payload.reason,
 },
 accessToken: sessionContext.accessToken,
 refreshToken: sessionContext.refreshToken,
 });

 return jsonResponse(normalizeRequestDetail(response.data));
 } catch (error) {
 return handleRouteError(error);
 }
}
