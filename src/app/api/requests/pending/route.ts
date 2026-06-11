import { BackendApiError, backendRequest } from "@/lib/api/backend-client";
import { normalizePaginated, normalizeRequestItem } from "@/lib/api/normalizers";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { backendRoutes } from "@/lib/config/backend-routes";
import { getRequestQueryFilters } from "@/app/api/requests/request-route-utils";

export async function GET(request: Request) {
 const url = new URL(request.url);
 const filters = getRequestQueryFilters(url.searchParams);
 const softFail = url.searchParams.get("softFail") === "1";

 try {
 const context = await getSessionContext();

 const response = await backendRequest({
 pathCandidates: backendRoutes.requests.pending,
 accessToken: context.accessToken,
 refreshToken: context.refreshToken,
 query: filters,
 });

 return jsonResponse(normalizePaginated(response.data, normalizeRequestItem));
 } catch (error) {
 if (softFail && error instanceof BackendApiError && ![401, 403].includes(error.status)) {
 return jsonResponse({
 items: [],
 total: 0,
 page: Number(filters.page ?? 1),
 pageSize: Number(filters.limit ?? 10),
 source: "api" as const,
 });
 }

 return handleRouteError(error);
 }
}
