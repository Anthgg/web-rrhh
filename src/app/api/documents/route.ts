import { backendRequest } from "@/lib/api/backend-client";
import { normalizeDocumentRecord, normalizePaginated } from "@/lib/api/normalizers";
import { getSessionContext } from "@/lib/api/session-context";
import { getPagingParams, handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { backendRoutes } from "@/lib/config/backend-routes";

export async function GET(request: Request) {
 try {
 const url = new URL(request.url);
 const filters = {
 search: url.searchParams.get("search") ?? undefined,
 status: url.searchParams.get("status") ?? undefined,
 ...getPagingParams(url.searchParams),
 };

 const context = await getSessionContext();
 const response = await backendRequest({
 pathCandidates: backendRoutes.documents.list,
 accessToken: context.accessToken,
 refreshToken: context.refreshToken,
 query: filters,
 });

 return jsonResponse(normalizePaginated(response.data, normalizeDocumentRecord));
 } catch (error) {
 return handleRouteError(error);
 }
}
