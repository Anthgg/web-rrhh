import { apiClient } from "@/lib/api/client";
import { webApiEndpoints } from "@/lib/api/endpoints";
import type {
  SchedulePolicy,
  Shift,
  ShiftPayload,
  ScheduleAssignment,
  ScheduleAssignmentPayload,
  WorkerSchedule,
  WorkerRestDaysResponse,
  SetRestDayResponse,
  RemoveRestDayResponse,
  AttendanceSummary,
  AttendanceSummaryApiResponse,
  AttendanceRecordsByDate,
} from "@/types/schedule";

function unwrapResponse<T>(raw: unknown): T | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (obj.data && typeof obj.data === "object" && "data" in (obj.data as Record<string, unknown>)) {
    return (obj.data as Record<string, unknown>).data as T;
  }
  if (obj.data) return obj.data as T;
  return raw as T;
}

function unwrapArray<T>(raw: unknown): T[] {
  if (!raw || typeof raw !== "object") return [];
  const obj = raw as Record<string, unknown>;
  if (obj.data && typeof obj.data === "object" && "data" in (obj.data as Record<string, unknown>)) {
    const inner = (obj.data as Record<string, unknown>).data;
    return Array.isArray(inner) ? inner as T[] : [];
  }
  if (obj.data && Array.isArray(obj.data)) return obj.data as T[];
  if (Array.isArray(raw)) return raw as T[];
  return [];
}

function unwrapAttendanceRecords(raw: unknown): AttendanceSummary[] {
  const outer = getObjectCandidate(raw);
  const nested = getNestedObject(raw);
  const summary = getObjectCandidate(outer?.summary) ?? getObjectCandidate(nested?.summary);

  if (Array.isArray(outer?.records)) return outer.records as AttendanceSummary[];
  if (Array.isArray(nested?.records)) return nested.records as AttendanceSummary[];
  if (Array.isArray(summary?.records)) return summary.records as AttendanceSummary[];

  return unwrapArray<AttendanceSummary>(raw);
}

function getObjectCandidate(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null;
  return raw as Record<string, unknown>;
}

function getNestedObject(raw: unknown): Record<string, unknown> | null {
  const outer = getObjectCandidate(raw);
  if (!outer) return null;

  const data = getObjectCandidate(outer.data);
  const nestedData = getObjectCandidate(data?.data);
  return nestedData ?? data ?? outer;
}

function getAttendanceRecordMap(source: unknown, key: "recordsByDate" | "calendarByDate"): AttendanceRecordsByDate | undefined {
  const candidates = [
    getObjectCandidate(source),
    getNestedObject(source),
    getObjectCandidate(getObjectCandidate(source)?.summary),
    getObjectCandidate(getNestedObject(source)?.summary),
  ];

  for (const candidate of candidates) {
    const value = candidate?.[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value as AttendanceRecordsByDate;
    }
  }

  return undefined;
}

function normalizeMapDayKey(dayKey: string | null | undefined): string | null {
  if (!dayKey) return null;
  return dayKey.includes("T") ? dayKey.split("T")[0] : dayKey;
}

function withCanonicalDayKey(record: AttendanceSummary, mapKey: string): AttendanceSummary {
  const dayKey = normalizeMapDayKey(mapKey);
  if (!dayKey) return record;

  return {
    ...record,
    dateKey: dayKey,
    dayKey,
    calendarDate: dayKey,
  };
}

function unwrapRecordsFromDateMap(map?: AttendanceRecordsByDate): AttendanceSummary[] {
  if (!map) return [];

  return Object.entries(map).flatMap(([mapKey, value]) => {
    if (!value) return [];
    const records = Array.isArray(value) ? value : [value];
    return records.map((record) => withCanonicalDayKey(record, mapKey));
  });
}

function getRecordWorkerId(record: AttendanceSummary): string | undefined {
  const row = record as unknown as Record<string, unknown>;
  return String(record.worker_id ?? row.workerId ?? row.worker_id ?? "").trim() || undefined;
}

function filterRecordsByWorker(records: AttendanceSummary[], workerId?: string): AttendanceSummary[] {
  if (!workerId) return records;
  const hasWorkerScopedRows = records.some((record) => Boolean(getRecordWorkerId(record)));
  if (!hasWorkerScopedRows) return records;

  return records.filter((record) => {
    const recordWorkerId = getRecordWorkerId(record);
    return !recordWorkerId || recordWorkerId === workerId;
  });
}

function filterRecordMapByWorker(map: AttendanceRecordsByDate | undefined, workerId?: string): AttendanceRecordsByDate | undefined {
  if (!map || !workerId) return map;

  const filtered: AttendanceRecordsByDate = {};
  for (const [mapKey, value] of Object.entries(map)) {
    if (!value) continue;

    const records = Array.isArray(value) ? value : [value];
    const scopedRecords = filterRecordsByWorker(records, workerId);
    if (!scopedRecords.length) continue;

    filtered[mapKey] = Array.isArray(value) ? scopedRecords : scopedRecords[0];
  }

  return Object.keys(filtered).length ? filtered : undefined;
}

function normalizeAttendanceSummaryResponse(raw: unknown, workerId?: string): AttendanceSummaryApiResponse {
  const outer = getObjectCandidate(raw);
  const nested = getNestedObject(raw);
  const meta = (outer?.meta ?? nested?.meta) as { total?: number; start_date?: string; end_date?: string } | undefined;
  const summary = (outer?.summary ?? nested?.summary) as AttendanceSummaryApiResponse["summary"];
  const recordsByDate = filterRecordMapByWorker(getAttendanceRecordMap(raw, "recordsByDate"), workerId);
  const calendarByDate = filterRecordMapByWorker(getAttendanceRecordMap(raw, "calendarByDate"), workerId);
  const recordsFromMap = unwrapRecordsFromDateMap(recordsByDate ?? calendarByDate);
  const records = filterRecordsByWorker(recordsFromMap.length ? recordsFromMap : unwrapAttendanceRecords(raw), workerId);

  return {
    success: Boolean(outer?.success ?? nested?.success ?? true),
    records,
    data: records,
    recordsByDate,
    calendarByDate,
    meta,
    summary,
  };
}

export const scheduleService = {
  getSchedulePolicies: async () => {
    try {
      console.log("[schedule-policies] GET → /api/schedule/policies");
      const raw = await apiClient<unknown>(webApiEndpoints.schedule.policies);
      const data = unwrapResponse<SchedulePolicy>(raw);
      console.log("[schedule-policies] GET ← respuesta:", data);
      return data;
    } catch (err) {
      console.warn("[schedule-policies] GET ✗ error:", err);
      return null;
    }
  },

  updateSchedulePolicies: async (payload: SchedulePolicy) => {
    try {
      console.log("[schedule-policies] PUT → /api/schedule/policies", payload);
      const raw = await apiClient<unknown>(webApiEndpoints.schedule.policies, {
        method: "PUT",
        body: payload,
      });
      const data = unwrapResponse<SchedulePolicy>(raw);
      console.log("[schedule-policies] PUT ← respuesta:", data);
      return data ?? payload;
    } catch (err) {
      console.warn("[schedule-policies] PUT ✗ error:", err);
      return payload;
    }
  },

  getShifts: (params?: { search?: string; is_active?: boolean }) => {
    return apiClient<Shift[]>(webApiEndpoints.schedule.shifts, {
      query: params,
    });
  },

  createShift: (payload: ShiftPayload) => {
    return apiClient<Shift>(webApiEndpoints.schedule.shifts, {
      method: "POST",
      body: payload,
    });
  },

  getShiftById: (id: string) => {
    return apiClient<Shift>(webApiEndpoints.schedule.shiftDetail(id));
  },

  updateShift: (id: string, payload: ShiftPayload) => {
    return apiClient<Shift>(webApiEndpoints.schedule.shiftDetail(id), {
      method: "PUT",
      body: payload,
    });
  },

  deleteShift: (id: string) => {
    return apiClient<{ message: string; success: boolean }>(webApiEndpoints.schedule.shiftDetail(id), {
      method: "DELETE",
    });
  },

  getAssignments: (params?: { worker_id?: string; shift_id?: string; is_active?: boolean }) => {
    return apiClient<ScheduleAssignment[]>(webApiEndpoints.schedule.assignments, {
      query: params,
    });
  },

  createAssignment: (payload: ScheduleAssignmentPayload) => {
    return apiClient<ScheduleAssignment>(webApiEndpoints.schedule.assignments, {
      method: "POST",
      body: payload,
    });
  },

  updateAssignment: (id: string, payload: ScheduleAssignmentPayload) => {
    return apiClient<ScheduleAssignment>(webApiEndpoints.schedule.assignmentDetail(id), {
      method: "PUT",
      body: payload,
    });
  },

  deleteAssignment: (id: string) => {
    return apiClient<{ message: string; success: boolean }>(webApiEndpoints.schedule.assignmentDetail(id), {
      method: "DELETE",
    });
  },

  assignWorkerShift: (workerId: string, shiftId: string, startDate: string, endDate?: string) => {
    return apiClient<{ success: boolean; data: ScheduleAssignment; message: string }>(
      `/api/schedule/workers/${workerId}/shift`,
      {
        method: "PUT",
        body: { shiftId, startDate, endDate },
      }
    );
  },

  getWorkerSchedule: (workerId: string, date: string) => {
    return apiClient<{ success?: boolean; data: WorkerSchedule }>(webApiEndpoints.schedule.workerSchedule(workerId), {
      query: { date },
    }).then((res) => res.data || (res as unknown as WorkerSchedule));
  },

  /**
   * Fetch all rest days and national holidays for a worker in a date range.
   * Uses GET /api/schedule/workers/:workerId/rest-days
   * Defaults: start_date = start of current month, end_date = 12 months ahead
   */
  getWorkerRestDays: (
    workerId: string,
    params?: { start_date?: string; end_date?: string }
  ) => {
    return apiClient<{ success: boolean; data: WorkerRestDaysResponse }>(
      webApiEndpoints.schedule.workerRestDays(workerId),
      { query: params }
    );
  },

  getMySchedule: (date: string) => {
    return apiClient<{ success?: boolean; data: WorkerSchedule }>(webApiEndpoints.schedule.mySchedule, {
      query: { date },
    }).then((res) => res.data || (res as unknown as WorkerSchedule));
  },

  getAttendanceSummary: (params: { start_date: string; end_date: string; worker_id?: string }) => {
    return apiClient<unknown>(webApiEndpoints.schedule.attendanceSummary, {
      query: params,
    }).then((raw) => normalizeAttendanceSummaryResponse(raw, params.worker_id));
  },

  /**
   * Fetch attendance detail for a single worker.
   * Currently uses the same endpoint filtered by worker_id.
   * When a dedicated endpoint exists, replace the implementation below:
   * GET /api/schedule/attendance-summary/workers/:workerId?start_date=...&end_date=...
   */
  getWorkerAttendanceSummary: (
    workerId: string,
    params: { start_date: string; end_date: string }
  ) => {
    return apiClient<unknown>(webApiEndpoints.schedule.attendanceSummary, {
      query: { ...params, worker_id: workerId },
    }).then((raw) => normalizeAttendanceSummaryResponse(raw, workerId));
  },

  correctAttendance: async (payload: {
    worker_id: string;
    date: string;
    check_in_time?: string;
    check_out_time?: string;
    status?: string;
    reason?: string;
  }) => {
    return apiClient<{ success: boolean; message: string; data: unknown }>("/api/attendance/correction", {
      method: "POST",
      body: payload,
    });
  },

  /**
   * Assign a rest day to a worker.
   * POST /api/schedule/workers/:workerId/rest-days
   *
   * The backend accepts multiple field aliases; we normalise here:
   *   - "fijo"     → requires day_of_week (number 1-7)
   *   - "rotativo" → no day_of_week needed
   *   - "manual"   → requires date (exact day)
   *
   * Response includes rest_days[] with all materialised dates so the
   * calendar can be updated immediately without a second GET.
   */
  setRestDay: (workerId: string, payloadOrDate: string | Record<string, unknown>, type = "manual") => {
    let body: Record<string, unknown>;
    if (typeof payloadOrDate === "string") {
      body = { date: payloadOrDate, type };
    } else {
      body = { ...payloadOrDate };
    }
    // Ensure day_of_week is always a NUMBER, never a string
    if (body.day_of_week !== undefined) {
      body.day_of_week = Number(body.day_of_week);
    }

    return apiClient<{ success: boolean; message: string; data: SetRestDayResponse }>(
      webApiEndpoints.schedule.workerRestDays(workerId),
      { method: "POST", body }
    );
  },

  removeRestDay: (workerId: string, date: string) => {
    return apiClient<{ success: boolean; message: string; data: RemoveRestDayResponse }>(
      webApiEndpoints.schedule.workerRestDays(workerId),
      { method: "DELETE", body: { date } }
    );
  },
};
