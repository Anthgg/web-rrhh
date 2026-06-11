import { backendRequest } from "@/lib/api/backend-client";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { isUuid } from "@/lib/api/worker-ids";

export async function GET(
 request: Request,
 { params }: { params: Promise<{ workerId: string }> },
) {
 try {
 const { workerId } = await params;
 if (!isUuid(workerId)) {
 return jsonResponse(
 {
 message:
 "Este registro todavia no tiene un ID de trabajador valido para consultar contratos.",
 status: 400,
 },
 400,
 );
 }

 const context = await getSessionContext();

 const response = await backendRequest({
 pathCandidates: [`/api/workers/${workerId}/contracts`],
 accessToken: context.accessToken,
 refreshToken: context.refreshToken,
 });

 return jsonResponse(response.data);
 } catch (error) {
 return handleRouteError(error);
 }
}
