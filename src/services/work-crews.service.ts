import { ApiClientError, apiClient } from "@/lib/api/client";

function resolveDownloadFileName(
  disposition: string | null,
  fallback: string,
) {
  if (!disposition) return fallback;

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const basicMatch = disposition.match(/filename="?([^"]+)"?/i);
  return basicMatch?.[1] ?? fallback;
}

async function downloadFilePost(endpoint: string, body: unknown, fallbackFileName: string) {
  const token = typeof window !== "undefined" ? (window.localStorage.getItem("token") || window.localStorage.getItem("accessToken") || window.sessionStorage.getItem("token") || window.sessionStorage.getItem("accessToken")) : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "*/*",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    credentials: "same-origin",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string; details?: unknown } | null;
    throw new ApiClientError(
      payload?.message ?? "No se pudo completar la descarga.",
      response.status,
      payload?.details,
    );
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = resolveDownloadFileName(
    response.headers.get("content-disposition"),
    fallbackFileName,
  );
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}


export interface WorkCrew {
  id: string;
  name: string;
  description?: string;
  supervisor_id: string;
  supervisor_name?: string;
  supervisor_email?: string;
  work_location_id: string;
  work_location_name?: string;
  work_location_address?: string;
  work_location_latitude?: number;
  work_location_longitude?: number;
  active_workers_count?: number;
  total_movements?: number;
  temporarily_moved_workers_count?: number;
  last_updated_at?: string;
  is_active: boolean;
}

export interface WorkCrewPayload {
  name: string;
  description?: string;
  supervisor_id: string;
  work_location_id: string;
  is_active: boolean;
}

export interface WorkCrewUpdatePayload {
  name?: string;
  description?: string;
  supervisor_id?: string;
  work_location_id?: string;
}

export interface CrewWorker {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  personal_id: string;
  crew_id: string;
  assigned_at: string;
  active_assignment?: {
    source: "temporary_assignment" | "crew_location" | "direct_worker_location" | "individual_temporary_location_assignment" | "individual_permanent_location_assignment";
    work_location_id?: string;
    work_location_name?: string;
    start_date?: string;
    end_date?: string;
    reason?: string;
  };
}

export const workCrewsService = {
  getWorkCrews: () =>
    apiClient<WorkCrew[]>("/api/work-crews"),

  getWorkCrew: (id: string) =>
    apiClient<WorkCrew>(`/api/work-crews/${id}`),

  createWorkCrew: (payload: WorkCrewPayload) =>
    apiClient<WorkCrew>("/api/work-crews", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateWorkCrew: (id: string, payload: WorkCrewUpdatePayload) =>
    apiClient<WorkCrew>(`/api/work-crews/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  updateWorkCrewStatus: (id: string, isActive: boolean) =>
    apiClient<WorkCrew>(`/api/work-crews/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: isActive }),
    }),

  changeWorkCrewLocation: (id: string, locationId: string, reason: string) =>
    apiClient<WorkCrew>(`/api/work-crews/${id}/work-location`, {
      method: "PUT",
      body: JSON.stringify({ work_location_id: locationId, reason }),
    }),

  getWorkCrewWorkers: (id: string) =>
    apiClient<CrewWorker[]>(`/api/work-crews/${id}/workers`),

  addWorkersToCrew: (id: string, workerIds: string[], reason: string) =>
    apiClient<void>(`/api/work-crews/${id}/workers`, {
      method: "POST",
      body: JSON.stringify({ worker_ids: workerIds, reason }),
    }),

  removeWorkerFromCrew: (id: string, workerId: string, reason?: string) =>
    apiClient<void>(`/api/work-crews/${id}/workers/${workerId}`, {
      method: "DELETE",
      body: reason ? JSON.stringify({ reason }) : undefined,
    }),

  getReportColumns: () =>
    apiClient<any[]>("/api/reports/work-crews/columns"),

  getReportPreview: (payload: any) =>
    apiClient<any>("/api/reports/work-crews/preview", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  downloadReport: (format: "pdf" | "excel", payload: any) => {
    const endpoint = format === "pdf" ? "/api/reports/work-crews/export/pdf" : "/api/reports/work-crews/export/excel";
    return downloadFilePost(
      endpoint,
      payload,
      `reporte-cuadrillas-movimientos.${format === "pdf" ? "pdf" : "xlsx"}`
    );
  },
};
