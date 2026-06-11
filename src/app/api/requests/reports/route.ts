import { backendRequest } from "@/lib/api/backend-client";
import { normalizeRequestReportPreview } from "@/lib/api/normalizers";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { backendRoutes } from "@/lib/config/backend-routes";
import { getRequestReportFilters } from "@/app/api/requests/request-route-utils";

export async function GET(request: Request) {
 try {
 const url = new URL(request.url);
 const filters = getRequestReportFilters(url.searchParams);
 const context = await getSessionContext();

 const response = await backendRequest({
 pathCandidates: backendRoutes.requests.reports,
 accessToken: context.accessToken,
 refreshToken: context.refreshToken,
 query: filters,
 });

 return jsonResponse(normalizeRequestReportPreview(response.data));
 } catch (error) {
 return handleRouteError(error);
 }
}
