import { backendRequest } from "@/lib/api/backend-client";
import { normalizeRequestDetail } from "@/lib/api/normalizers";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { backendRoutes } from "@/lib/config/backend-routes";

type CancelRouteContext = { params: Promise<{ requestId: string }> };

async function cancelRequest(context: CancelRouteContext, method: "POST" | "PATCH") {
  try {
    const { requestId } = await context.params;
    const sessionContext = await getSessionContext();

    const response = await backendRequest({
      pathCandidates: backendRoutes.requests.cancel(requestId),
      method,
      accessToken: sessionContext.accessToken,
      refreshToken: sessionContext.refreshToken,
    });

    return jsonResponse(normalizeRequestDetail(response.data));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(_request: Request, context: CancelRouteContext) {
  return cancelRequest(context, "POST");
}

export async function PATCH(_request: Request, context: CancelRouteContext) {
  return cancelRequest(context, "PATCH");
}

export async function DELETE(_request: Request, context: CancelRouteContext) {
  return cancelRequest(context, "PATCH");
}
