import { backendRequest } from "@/lib/api/backend-client";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { backendRoutes } from "@/lib/config/backend-routes";

export async function POST(request: Request) {
 try {
 const context = await getSessionContext();
 const body = await request.json();

 const response = await backendRequest({
 pathCandidates: backendRoutes.reports.workCrewsPreview,
 accessToken: context.accessToken,
 refreshToken: context.refreshToken,
 method: "POST",
 body,
 });

 return jsonResponse(response.data);
 } catch (error) {
 return handleRouteError(error);
 }
}
