import { backendRequest } from "@/lib/api/backend-client";
import { normalizeRequestDocuments } from "@/lib/api/normalizers";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { backendRoutes } from "@/lib/config/backend-routes";
import { parseProxyBody } from "@/app/api/requests/request-route-utils";

type DocumentsRouteContext = { params: Promise<{ requestId: string }> };

export async function GET(_request: Request, context: DocumentsRouteContext) {
  try {
    const { requestId } = await context.params;
    const sessionContext = await getSessionContext();

    const response = await backendRequest({
      pathCandidates: backendRoutes.requests.documents(requestId),
      accessToken: sessionContext.accessToken,
      refreshToken: sessionContext.refreshToken,
    });

    return jsonResponse(normalizeRequestDocuments(response.data));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request, context: DocumentsRouteContext) {
  try {
    const payload = await parseProxyBody(request);
    const { requestId } = await context.params;
    const sessionContext = await getSessionContext();

    const response = await backendRequest({
      pathCandidates: backendRoutes.requests.documents(requestId),
      method: "POST",
      body: payload,
      accessToken: sessionContext.accessToken,
      refreshToken: sessionContext.refreshToken,
    });

    return jsonResponse(normalizeRequestDocuments(response.data), 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
