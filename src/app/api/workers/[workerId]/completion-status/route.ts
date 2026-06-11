import { BackendApiError, backendRequest } from "@/lib/api/backend-client";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { isUuid } from "@/lib/api/worker-ids";

const paths = (workerId: string) => [
 `/api/workers/${workerId}/completion-status`,
 `/api/workers/${workerId}/onboarding-status`,
 `/api/workers/${workerId}/profile-completion`,
 `/api/admin/workers/${workerId}/completion-status`,
];

export async function GET(_: Request, props: { params: Promise<{ workerId: string }> }) {
 try {
 const { workerId } = await props.params;
 if (!isUuid(workerId)) {
 return jsonResponse(
 {
 missingFields: ["workerId"],
 message:
 "Este registro todavia no tiene un ID de trabajador valido. Completa o actualiza la ficha laboral primero.",
 },
 400,
 );
 }

 const context = await getSessionContext();
 const response = await backendRequest({
 pathCandidates: paths(workerId),
 accessToken: context.accessToken,
 refreshToken: context.refreshToken,
 });

 return jsonResponse(response.data);
 } catch (error) {
 if (error instanceof BackendApiError && error.status === 404) {
 return jsonResponse({ missingFields: [] });
 }
 return handleRouteError(error);
 }
}
