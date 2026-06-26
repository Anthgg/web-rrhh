import { apiClient } from "@/lib/api/client";
import { webApiEndpoints } from "@/lib/api/endpoints";
import type { VacationBalance } from "@/types/schedule";

export const vacationsService = {
  /** GET /api/vacations/me/balance — balance for the currently logged-in worker */
  getMyBalance: () =>
    apiClient<VacationBalance>(webApiEndpoints.vacations.myBalance),

  /** GET /api/vacations/workers/:workerId/balance — balance for a specific worker */
  getWorkerBalance: (workerId: string) =>
    apiClient<VacationBalance>(webApiEndpoints.vacations.workerBalance(workerId)),
};
