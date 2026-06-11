import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError } from "@/lib/api/server-utils";
import { proxyBackendFileResponse } from "@/app/api/requests/request-route-utils";

export async function GET(
 request: Request,
 { params }: { params: Promise<{ contractId: string }> },
) {
 try {
 const { contractId } = await params;
 const context = await getSessionContext();

 return await proxyBackendFileResponse({
 pathCandidates: [`/api/contracts/${contractId}/download`],
 accessToken: context.accessToken,
 method: "GET",
 });
 } catch (error) {
 return handleRouteError(error);
 }
}
