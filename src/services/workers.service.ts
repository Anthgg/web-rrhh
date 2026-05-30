import { apiClient } from "@/lib/api/client";
import { webApiEndpoints } from "@/lib/api/endpoints";
import type { PaginatedResponse, WorkerFilters, WorkerRecord } from "@/types";

export interface LaborAssignmentPayload {
  sede_id?: string;
  internal_department_id?: string;
  area_id?: string;
  position_id?: string;
  work_location_id?: string;
}

export const workersService = {
  list: (filters: WorkerFilters) =>
    apiClient<PaginatedResponse<WorkerRecord>>(webApiEndpoints.workers.list, { query: filters }),
  detail: (workerId: string) =>
    apiClient<WorkerRecord>(`${webApiEndpoints.workers.list}/${workerId}`),
  updateLaborAssignment: (workerId: string, payload: LaborAssignmentPayload) =>
    apiClient<void>(webApiEndpoints.workers.laborAssignment(workerId), {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};
