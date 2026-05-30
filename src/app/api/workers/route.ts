import { backendRequest } from "@/lib/api/backend-client";
import { normalizePaginated, normalizeWorkerRecord } from "@/lib/api/normalizers";
import { getSessionContext } from "@/lib/api/session-context";
import { getPagingParams, handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { backendRoutes } from "@/lib/config/backend-routes";
import { getCatalogs, populateWorkerData } from "@/lib/api/workers-helper";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const filters = {
      search: url.searchParams.get("search") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      project: url.searchParams.get("project") ?? undefined,
      ...getPagingParams(url.searchParams),
    };

    const context = await getSessionContext();
    const response = await backendRequest<any>({
      pathCandidates: backendRoutes.workers.list,
      accessToken: context.accessToken,
      refreshToken: context.refreshToken,
      query: filters,
    });

    const catalogs = await getCatalogs(context);
    const rawWorkers = Array.isArray(response.data?.data) ? response.data.data : [];
    const populatedWorkers = rawWorkers.map((worker: any) => populateWorkerData(worker, catalogs));

    const populatedResponse = {
      ...response.data,
      data: populatedWorkers,
    };

    return jsonResponse(normalizePaginated(populatedResponse, normalizeWorkerRecord));
  } catch (error) {
    return handleRouteError(error);
  }
}
