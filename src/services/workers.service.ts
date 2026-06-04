import { apiClient } from "@/lib/api/client";
import { webApiEndpoints } from "@/lib/api/endpoints";
import type { PaginatedResponse, WorkerFilters, WorkerLaborInfoPayload, WorkerRecord } from "@/types";
import { isUuid } from "@/lib/api/worker-ids";

export interface WorkerActiveLocation {
  worker_id: string;
  source: "temporary_assignment" | "crew_location" | "direct_worker_location";
  work_location?: {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    allowed_radius_meters: number;
  };
  crew?: {
    id: string;
    name: string;
    supervisor_id: string;
  };
  assignment?: {
    id: string;
    type: "temporary" | "permanent";
    start_date: string;
    end_date?: string;
    reason?: string;
  };
}

export interface WorkerAssignmentHistory {
  changed_at: string;
  change_type: string;
  assignment_type: string;
  previous_work_location_name?: string;
  new_work_location_name?: string;
  previous_crew_name?: string;
  new_crew_name?: string;
  changed_by_name?: string;
  reason?: string;
  start_date?: string;
  end_date?: string;
}

export interface WorkerAssignmentPayload {
  work_location_id: string;
  assignment_type: "temporary" | "permanent";
  start_date: string;
  end_date?: string;
  reason?: string;
}

export interface LaborAssignmentPayload {
  assignment_type: "temporary" | "permanent";
  work_location_id: string;
  reason?: string;
  end_date?: string | null;
  auto_return?: boolean;
}

export const workersService = {
  list: (filters: WorkerFilters) =>
    apiClient<PaginatedResponse<WorkerRecord>>(webApiEndpoints.workers.list, { query: filters }),
  detail: (workerId: string) => {
    if (!isUuid(workerId)) {
      return Promise.reject(new Error("INVALID_WORKER_ID"));
    }
    return apiClient<WorkerRecord>(`${webApiEndpoints.workers.list}/${workerId}`);
  },
  getCompletionStatus: (workerId: string) => {
    if (!isUuid(workerId)) {
      return Promise.reject(new Error("INVALID_WORKER_ID"));
    }
    return apiClient<{ missingFields?: string[] }>(`/api/workers/${workerId}/completion-status`);
  },
  updateLaborInfo: (workerId: string, payload: WorkerLaborInfoPayload) => {
    if (!isUuid(workerId)) {
      return Promise.reject(new Error("INVALID_WORKER_ID"));
    }
    return apiClient<WorkerRecord>(`/api/workers/${workerId}/labor-info`, {
      method: "PUT",
      body: payload,
    });
  },
  updateLaborAssignment: (workerId: string, payload: LaborAssignmentPayload) => {
    if (!isUuid(workerId)) {
      return Promise.reject(new Error("INVALID_WORKER_ID"));
    }
    return apiClient<void>(webApiEndpoints.workers.laborAssignment(workerId), {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  getSupervisors: () =>
    apiClient<WorkerRecord[]>("/api/workers/supervisors"),

  getWorkerActiveLocation: (workerId: string) => {
    if (!isUuid(workerId)) {
      return Promise.reject(new Error("INVALID_WORKER_ID"));
    }
    return apiClient<WorkerActiveLocation>(`/api/workers/${workerId}/location-assignment/active`);
  },

  getWorkerLocationHistory: (workerId: string) => {
    if (!isUuid(workerId)) {
      return Promise.reject(new Error("INVALID_WORKER_ID"));
    }
    return apiClient<WorkerAssignmentHistory[]>(webApiEndpoints.workers.locationHistory(workerId));
  },

  assignWorkerLocation: (workerId: string, payload: WorkerAssignmentPayload) => {
    if (!isUuid(workerId)) {
      return Promise.reject(new Error("INVALID_WORKER_ID"));
    }
    return apiClient<void>(`/api/workers/${workerId}/location-assignment`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  cancelWorkerLocationAssignment: (assignmentId: string, reason: string) =>
    apiClient<void>(`/api/worker-location-assignments/${assignmentId}/cancel`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    }),

  moveWorkerToCrew: (workerId: string, crewId: string, reason: string) => {
    if (!isUuid(workerId)) {
      return Promise.reject(new Error("INVALID_WORKER_ID"));
    }
    return apiClient<void>(`/api/workers/${workerId}/crew`, {
      method: "PUT",
      body: JSON.stringify({ crew_id: crewId, reason }),
    });
  },
};
