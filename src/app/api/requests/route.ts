import { backendRequest } from "@/lib/api/backend-client";
import { normalizePaginated, normalizeRequestDetail, normalizeRequestItem } from "@/lib/api/normalizers";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { backendRoutes } from "@/lib/config/backend-routes";
import { getRequestQueryFilters, parseProxyBody } from "@/app/api/requests/request-route-utils";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const filters = getRequestQueryFilters(url.searchParams);

    const context = await getSessionContext();
    const response = await backendRequest({
      pathCandidates: backendRoutes.requests.list,
      accessToken: context.accessToken,
      refreshToken: context.refreshToken,
      query: filters,
    });

    return jsonResponse(normalizePaginated(response.data, normalizeRequestItem));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = await parseProxyBody(request);
    const context = await getSessionContext();

    const response = await backendRequest({
      pathCandidates: backendRoutes.requests.list,
      method: "POST",
      body: payload,
      accessToken: context.accessToken,
      refreshToken: context.refreshToken,
    });

    return jsonResponse(normalizeRequestDetail(response.data), 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
