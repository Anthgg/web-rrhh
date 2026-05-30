import { getSessionContext } from "@/lib/api/session-context";
import { proxyBackendFileResponse } from "@/app/api/requests/request-route-utils";

export async function proxyCorporatePdfReport(request: Request, pathCandidates: readonly string[]) {
  const [sessionContext, body] = await Promise.all([
    getSessionContext(),
    request.json().catch(() => ({})),
  ]);

  return proxyBackendFileResponse({
    pathCandidates,
    accessToken: sessionContext.accessToken,
    method: "POST",
    body,
  });
}
