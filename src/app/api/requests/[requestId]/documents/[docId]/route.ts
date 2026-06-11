import { backendRequest } from "@/lib/api/backend-client";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { backendRoutes } from "@/lib/config/backend-routes";

type DocumentRouteContext = { params: Promise<{ requestId: string; docId: string }> };

export async function DELETE(_request: Request, context: DocumentRouteContext) {
 try {
 const { requestId, docId } = await context.params;
 const sessionContext = await getSessionContext();

 const response = await backendRequest({
 pathCandidates: backendRoutes.requests.document(requestId, docId),
 method: "DELETE",
 accessToken: sessionContext.accessToken,
 refreshToken: sessionContext.refreshToken,
 });

 return jsonResponse(response.data);
 } catch (error) {
 return handleRouteError(error);
 }
}
