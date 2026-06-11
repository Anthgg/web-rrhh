import { backendRequest } from "@/lib/api/backend-client";
import { normalizeReportSummary } from "@/lib/api/normalizers";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { backendRoutes } from "@/lib/config/backend-routes";

export async function POST(request: Request) {
 try {
 const body = await request.json().catch(() => ({}));
 const context = await getSessionContext();

 const response = await backendRequest({
 pathCandidates: backendRoutes.requests.reportSummary,
 method: "POST",
 body,
 accessToken: context.accessToken,
 refreshToken: context.refreshToken,
 });

 return jsonResponse(normalizeReportSummary(response.data));
 } catch (error) {
 return handleRouteError(error);
 }
}
