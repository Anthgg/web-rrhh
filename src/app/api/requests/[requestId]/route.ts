import { backendRequest } from "@/lib/api/backend-client";
import { normalizeRequestDetail } from "@/lib/api/normalizers";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { backendRoutes } from "@/lib/config/backend-routes";
import { parseProxyBody } from "@/app/api/requests/request-route-utils";

type RequestRouteContext = { params: Promise<{ requestId: string }> };

async function updateRequest(
  request: Request,
  context: RequestRouteContext,
  method: "PATCH" | "PUT",
) {
  try {
    const payload = await parseProxyBody(request);
    const { requestId } = await context.params;
    const sessionContext = await getSessionContext();

    const response = await backendRequest({
      pathCandidates: backendRoutes.requests.detail(requestId),
      method,
      body: payload,
      accessToken: sessionContext.accessToken,
      refreshToken: sessionContext.refreshToken,
    });

    return jsonResponse(normalizeRequestDetail(response.data));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function GET(_request: Request, context: RequestRouteContext) {
  try {
    const { requestId } = await context.params;
    const sessionContext = await getSessionContext();

    const response = await backendRequest({
      pathCandidates: backendRoutes.requests.detail(requestId),
      accessToken: sessionContext.accessToken,
      refreshToken: sessionContext.refreshToken,
    });

    return jsonResponse(normalizeRequestDetail(response.data));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, context: RequestRouteContext) {
  return updateRequest(request, context, "PATCH");
}

export async function PUT(request: Request, context: RequestRouteContext) {
  return updateRequest(request, context, "PUT");
}
