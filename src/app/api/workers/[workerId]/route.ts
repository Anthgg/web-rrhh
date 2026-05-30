import { backendRequest } from "@/lib/api/backend-client";
import { normalizeWorkerRecord } from "@/lib/api/normalizers";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { getCatalogs, populateWorkerData } from "@/lib/api/workers-helper";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ workerId: string }> },
) {
  try {
    const { workerId } = await params;
    const context = await getSessionContext();

    const response = await backendRequest<any>({
      pathCandidates: [`/api/workers/${workerId}`],
      accessToken: context.accessToken,
      refreshToken: context.refreshToken,
    });

    const catalogs = await getCatalogs(context);
    const worker = response.data?.data;
    const populatedWorker = populateWorkerData(worker, catalogs);

    const populatedResponse = {
      ...response.data,
      data: populatedWorker,
    };

    return jsonResponse(normalizeWorkerRecord(populatedResponse));
  } catch (error) {
    return handleRouteError(error);
  }
}
