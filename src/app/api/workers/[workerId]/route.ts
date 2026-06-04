import { backendRequest } from "@/lib/api/backend-client";
import { normalizeWorkerRecord } from "@/lib/api/normalizers";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { getCatalogs, populateWorkerData } from "@/lib/api/workers-helper";
import { isUuid } from "@/lib/api/worker-ids";

type WorkerDetailPayload = {
  data?: unknown;
  [key: string]: unknown;
};

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
            "Este registro todavia no tiene un ID de trabajador valido. Completa o actualiza la ficha laboral primero.",
          status: 400,
        },
        400,
      );
    }

    const context = await getSessionContext();

    const response = await backendRequest<WorkerDetailPayload>({
      pathCandidates: [`/api/workers/${workerId}`],
      accessToken: context.accessToken,
      refreshToken: context.refreshToken,
    });

    const catalogs = await getCatalogs(context);
    const worker = response.data.data;
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
