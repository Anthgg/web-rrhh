import { backendRequest } from "@/lib/api/backend-client";
import { normalizeRequestDetail } from "@/lib/api/normalizers";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { backendRoutes } from "@/lib/config/backend-routes";

type RouteContext = { params: Promise<{ requestId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { requestId } = await context.params;
    const sessionContext = await getSessionContext();

    const response = await backendRequest({
      pathCandidates: backendRoutes.requests.generateDocument(requestId),
      method: "POST",
      accessToken: sessionContext.accessToken,
      refreshToken: sessionContext.refreshToken,
    });

    return jsonResponse(normalizeRequestDetail(response.data));
  } catch (error) {
    return handleRouteError(error);
  }
}
