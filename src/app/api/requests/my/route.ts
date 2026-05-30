import { backendRequest } from "@/lib/api/backend-client";
import { normalizePaginated, normalizeRequestItem } from "@/lib/api/normalizers";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { backendRoutes } from "@/lib/config/backend-routes";
import { getRequestQueryFilters } from "@/app/api/requests/request-route-utils";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const filters = getRequestQueryFilters(url.searchParams);
    const context = await getSessionContext();

    const response = await backendRequest({
      pathCandidates: backendRoutes.requests.my,
      accessToken: context.accessToken,
      refreshToken: context.refreshToken,
      query: filters,
    });

    return jsonResponse(normalizePaginated(response.data, normalizeRequestItem));
  } catch (error) {
    return handleRouteError(error);
  }
}
