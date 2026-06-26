import { apiClient } from "@/lib/api/client";
import { webApiEndpoints } from "@/lib/api/endpoints";
import type {
  AttendanceSummary,
  AttendanceMonthlySummary,
  AttendanceHistoryParams,
  AttendanceAnalyticsResponse,
  AttendanceRecalculateResponse,
} from "@/types/schedule";

export interface AttendancePayload {
 latitude: number;
 longitude: number;
 accuracy: number;
 photo_url?: string;
 device_info: {
 platform: string;
 browser: string;
 userAgent: string;
 };
}

export interface AttendanceResponse {
 workLocationId?: string;
 workLocation?: string;
 distanceMeters?: number;
 allowedRadiusMeters?: number;
 isLocationValid?: boolean;
 message?: string;
}

export const attendanceService = {
 checkIn: (payload: AttendancePayload) => {
 return apiClient<AttendanceResponse>(webApiEndpoints.attendance.checkIn, {
 method: "POST",
 body: payload,
 });
 },

 checkOut: (payload: AttendancePayload) => {
 return apiClient<AttendanceResponse>(webApiEndpoints.attendance.checkOut, {
 method: "POST",
 body: payload,
 });
 },

 /**
  * GET /api/attendance/history?month=7&year=2026[&status=VACATION,MEDICAL_LEAVE]
  * Returns individual day records for the given month/year, optionally filtered by status.
  * Multiple statuses are passed as a comma-separated string.
  */
 getHistory: (params: AttendanceHistoryParams) => {
  const query: Record<string, string | number> = {
   month: params.month,
   year: params.year,
  };
  if (params.status) {
   query.status = params.status;
  }
  return apiClient<AttendanceSummary[]>(webApiEndpoints.attendance.history, { query });
 },

 /**
  * GET /api/attendance/summary?month=7&year=2026
  * Returns aggregate counters: absentDays, vacationDays, medicalLeaveDays, unpaidLeaveDays, …
  */
  getMonthlySummary: (params: { month: number; year: number }) => {
   return apiClient<AttendanceMonthlySummary>(webApiEndpoints.attendance.summary, {
    query: { month: params.month, year: params.year },
   });
  },

  getAnalyticsDashboard: (query: Record<string, string | number | undefined | null>, signal?: AbortSignal) => {
    // Filter out undefined and null values from query
    const cleanedQuery: Record<string, string | number> = {};
    Object.entries(query).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        cleanedQuery[key] = val;
      }
    });
    return apiClient<AttendanceAnalyticsResponse>(webApiEndpoints.attendance.analyticsDashboard, {
      query: cleanedQuery,
      signal,
    });
  },

  getAnalyticsTable: (query: Record<string, string | number | boolean | undefined | null>, signal?: AbortSignal) => {
    const cleanedQuery: Record<string, string | number | boolean> = {};
    Object.entries(query).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        cleanedQuery[key] = val;
      }
    });
    return apiClient<{ success: boolean; data: { items: any[]; total: number; page: number; pageSize: number } }>(
      webApiEndpoints.attendance.analyticsTable,
      { query: cleanedQuery, signal }
    );
  },

  getAnalyticsWorker: (workerId: string, query: Record<string, string | number | undefined | null>, signal?: AbortSignal) => {
    const cleanedQuery: Record<string, string | number> = {};
    Object.entries(query).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        cleanedQuery[key] = val;
      }
    });
    return apiClient<{ success: boolean; data: { worker: any; summary: any; calendar: any[] } }>(
      webApiEndpoints.attendance.analyticsWorker(workerId),
      { query: cleanedQuery, signal }
    );
  },

  getAnalyticsArea: (areaId: string, query: Record<string, string | number | undefined | null>, signal?: AbortSignal) => {
    const cleanedQuery: Record<string, string | number> = {};
    Object.entries(query).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        cleanedQuery[key] = val;
      }
    });
    return apiClient<{ success: boolean; data: { entity: any; summary: any; trend: any[]; statusDistribution: any[]; topAbsentWorkers: any[]; topLateWorkers: any[]; bestAttendanceWorkers: any[] } }>(
      webApiEndpoints.attendance.analyticsArea(areaId),
      { query: cleanedQuery, signal }
    );
  },

  getAnalyticsWorkLocation: (workLocationId: string, query: Record<string, string | number | undefined | null>, signal?: AbortSignal) => {
    const cleanedQuery: Record<string, string | number> = {};
    Object.entries(query).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        cleanedQuery[key] = val;
      }
    });
    return apiClient<{ success: boolean; data: { entity: any; summary: any; trend: any[]; statusDistribution: any[]; topAbsentWorkers: any[]; topLateWorkers: any[]; bestAttendanceWorkers: any[] } }>(
      webApiEndpoints.attendance.analyticsWorkLocation(workLocationId),
      { query: cleanedQuery, signal }
    );
  },

  getAnalyticsCrew: (crewId: string, query: Record<string, string | number | undefined | null>, signal?: AbortSignal) => {
    const cleanedQuery: Record<string, string | number> = {};
    Object.entries(query).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        cleanedQuery[key] = val;
      }
    });
    return apiClient<{ success: boolean; data: { entity: any; summary: any; trend: any[]; statusDistribution: any[]; topAbsentWorkers: any[]; topLateWorkers: any[]; bestAttendanceWorkers: any[] } }>(
      webApiEndpoints.attendance.analyticsCrew(crewId),
      { query: cleanedQuery, signal }
    );
  },

  exportAnalytics: async (
    query: Record<string, string | number | undefined | null>,
    method: "GET" | "POST" = "POST"
  ) => {
    const cleanedParams: Record<string, string | number> = {};
    Object.entries(query).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        cleanedParams[key] = val;
      }
    });

    const url = webApiEndpoints.attendance.analyticsExport;
    let response: Response;

    if (method === "POST") {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanedParams),
      });
    } else {
      const queryString = new URLSearchParams(cleanedParams as any).toString();
      response = await fetch(`${url}?${queryString}`, {
        method: "GET",
      });
    }
    
    if (!response.ok) {
      throw new Error("No se pudo exportar el reporte.");
    }
    
    const blob = await response.blob();
    const contentDisposition = response.headers.get("content-disposition");
    
    let filename = `reporte-${query.scope || "dashboard"}.xlsx`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) {
        filename = match[1].replace(/['"]/g, "");
      }
    }
    
    return { blob, filename };
  },

  getExportFilters: (query?: Record<string, string | number | undefined | null>, signal?: AbortSignal) => {
    const cleanedQuery: Record<string, string | number> = {};
    if (query) {
      Object.entries(query).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          cleanedQuery[key] = val;
        }
      });
    }
    return apiClient<{
      success: boolean;
      data: {
        formats: Record<string, string>;
        scopes: Record<string, string>;
        statuses: Array<{ value: string; label: string }>;
        sortOptions: Array<{ value: string; label: string }>;
        dimensions: {
          workers?: any[];
          areas?: any[];
          departments?: any[];
          positions?: any[];
          workLocations?: any[];
          crews?: any[];
        };
        activeFilters: any;
      };
    }>(webApiEndpoints.attendance.analyticsExportFilters, { query: cleanedQuery, signal });
  },

  recalculateAnalytics: (query?: Record<string, string | number | undefined | null>) => {
    const cleanedQuery: Record<string, string | number> = {};
    if (query) {
      Object.entries(query).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          cleanedQuery[key] = val;
        }
      });
    }
    return apiClient<AttendanceRecalculateResponse>(webApiEndpoints.attendance.recalculateAnalytics, {
      method: "POST",
      query: cleanedQuery,
    });
  },
};
