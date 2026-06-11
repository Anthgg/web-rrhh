import { backendRequest } from "@/lib/api/backend-client";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";

export async function GET(
 request: Request,
 { params }: { params: Promise<{ areaId: string }> },
) {
 try {
 const { areaId } = await params;
 const context = await getSessionContext();
 const response = await backendRequest({
 pathCandidates: [`/api/job-positions/by-area/${areaId}`],
 accessToken: context.accessToken,
 refreshToken: context.refreshToken,
 });

 return jsonResponse(response.data);
 } catch (error) {
 return handleRouteError(error);
 }
}
