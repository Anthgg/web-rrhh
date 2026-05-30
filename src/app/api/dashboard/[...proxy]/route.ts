import { BackendApiError, backendRequest } from "@/lib/api/backend-client";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ proxy: string[] }> | { proxy: string[] } }
) {
  const resolvedParams = await Promise.resolve(params);
  const joinedProxy = resolvedParams.proxy.join("/");

  try {
    const context = await getSessionContext();
    const pathWithApi = `/api/dashboard/${joinedProxy}`;
    const pathWithoutApi = `/dashboard/${joinedProxy}`;
    const pathCandidates = [pathWithApi, pathWithoutApi];

    if (joinedProxy.startsWith("daily-status-list")) {
      pathCandidates.push("/api/dashboard/worker-status", "/dashboard/worker-status", "/api/workers/status-today");
    }
    if (joinedProxy.startsWith("weekly-chart")) {
      pathCandidates.push("/api/dashboard/worked-hours-today", "/dashboard/worked-hours-today", "/api/dashboard/weekly-hours", "/api/dashboard/project-summary");
    }

    const url = new URL(request.url);
    const query = Object.fromEntries(url.searchParams.entries());

    const response = await backendRequest({
      pathCandidates,
      query,
      accessToken: context.accessToken,
      refreshToken: context.refreshToken,
    });

    return jsonResponse(response.data);
  } catch (error) {
    if (
      joinedProxy.startsWith("alerts") &&
      error instanceof BackendApiError &&
      ![401, 403].includes(error.status)
    ) {
      return jsonResponse({
        data: {
          alerts: [],
        },
      });
    }

    return handleRouteError(error);
  }
}
