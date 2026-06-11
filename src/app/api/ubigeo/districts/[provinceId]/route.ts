import { backendRequest } from "@/lib/api/backend-client";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";

export async function GET(
 request: Request,
 { params }: { params: Promise<{ provinceId: string }> },
) {
 try {
 const { provinceId } = await params;
 const context = await getSessionContext();
 const response = await backendRequest({
 pathCandidates: [`/api/ubigeo/districts/${provinceId}`],
 accessToken: context.accessToken,
 refreshToken: context.refreshToken,
 });

 return jsonResponse(response.data);
 } catch (error) {
 return handleRouteError(error);
 }
}
