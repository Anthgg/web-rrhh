import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError } from "@/lib/api/server-utils";
import { backendRoutes } from "@/lib/config/backend-routes";
import { proxyBackendFileResponse } from "@/app/api/requests/request-route-utils";

type RequestRouteContext = {
  params: Promise<{ templateId: string }>;
};

export async function GET(_request: Request, context: RequestRouteContext) {
  try {
    const { templateId } = await context.params;
    const sessionContext = await getSessionContext();

    return proxyBackendFileResponse({
      pathCandidates: backendRoutes.requests.templateDownload(templateId),
      accessToken: sessionContext.accessToken,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
