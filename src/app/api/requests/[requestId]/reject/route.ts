import { backendRequest } from "@/lib/api/backend-client";
import { normalizeRequestDetail } from "@/lib/api/normalizers";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { backendRoutes } from "@/lib/config/backend-routes";
import { parseProxyBody } from "@/app/api/requests/request-route-utils";

type ActionRouteContext = { params: Promise<{ requestId: string }> };

export async function PATCH(request: Request, context: ActionRouteContext) {
  try {
    const payload = await parseProxyBody(request);
    const { requestId } = await context.params;
    const sessionContext = await getSessionContext();

    const response = await backendRequest({
      pathCandidates: backendRoutes.requests.reject(requestId),
      method: "PATCH",
      body: payload,
      accessToken: sessionContext.accessToken,
      refreshToken: sessionContext.refreshToken,
    });

    return jsonResponse(normalizeRequestDetail(response.data));
  } catch (error) {
    return handleRouteError(error);
  }
}
