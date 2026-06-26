"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { scheduleService } from "@/services/schedule.service";
import { groupRecordsByWorker } from "@/lib/utils/attendance";
import type { AttendanceRecordsByDate, AttendanceSummary, WorkerAttendanceSummary } from "@/types/schedule";

interface UseSummaryParams {
  startDate: string;
  endDate: string;
  workerId?: string;
}

function getResponseMaps(raw: unknown): {
  recordsByDate?: AttendanceRecordsByDate;
  calendarByDate?: AttendanceRecordsByDate;
} {
  if (!raw || typeof raw !== "object") return {};
  const response = raw as {
    recordsByDate?: AttendanceRecordsByDate;
    calendarByDate?: AttendanceRecordsByDate;
    summary?: {
      recordsByDate?: AttendanceRecordsByDate;
      calendarByDate?: AttendanceRecordsByDate;
    };
  };

  return {
    recordsByDate: response.recordsByDate ?? response.summary?.recordsByDate,
    calendarByDate: response.calendarByDate ?? response.summary?.calendarByDate,
  };
}

function flattenRecordsByDate(map?: AttendanceRecordsByDate): AttendanceSummary[] {
  if (!map) return [];
  return Object.values(map).flatMap((value) => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  });
}

export function useAttendanceSummary({ startDate, endDate, workerId }: UseSummaryParams) {
  const query = useQuery({
    queryKey: ["attendance-summary", startDate, endDate, workerId ?? "all"],
    queryFn: () =>
      scheduleService.getAttendanceSummary({
        start_date: startDate,
        end_date: endDate,
        worker_id: workerId || undefined,
      }),
    enabled: Boolean(startDate && endDate),
    staleTime: 30_000,
  });

  const records: AttendanceSummary[] = useMemo(() => {
    const raw = query.data;
    if (!raw) return [];
    const r = raw as unknown as Record<string, unknown>;
    if (Array.isArray(r.records)) return r.records as AttendanceSummary[];
    if (Array.isArray(r.data)) return r.data as AttendanceSummary[];
    const { recordsByDate, calendarByDate } = getResponseMaps(raw);
    return flattenRecordsByDate(recordsByDate ?? calendarByDate);
  }, [query.data]);

  const { recordsByDate, calendarByDate } = useMemo(
    () => getResponseMaps(query.data),
    [query.data]
  );

  const grouped: WorkerAttendanceSummary[] = useMemo(
    () => groupRecordsByWorker(records),
    [records]
  );

  const meta = (query.data as Record<string, unknown> | undefined)?.meta as
    | { total?: number; start_date?: string; end_date?: string }
    | undefined;

  return { ...query, records, grouped, meta, recordsByDate, calendarByDate };
}

export function useWorkerAttendanceDetail(
  workerId: string,
  { startDate, endDate }: { startDate: string; endDate: string }
) {
  const query = useQuery({
    queryKey: ["worker-attendance-detail", workerId, startDate, endDate],
    queryFn: () =>
      scheduleService.getWorkerAttendanceSummary(workerId, {
        start_date: startDate,
        end_date: endDate,
      }),
    enabled: Boolean(workerId && startDate && endDate),
    staleTime: 30_000,
  });

  const records: AttendanceSummary[] = useMemo(() => {
    const raw = query.data;
    if (!raw) return [];
    const r = raw as unknown as Record<string, unknown>;
    const list = Array.isArray(r.records)
      ? (r.records as AttendanceSummary[])
      : Array.isArray(r.data)
      ? (r.data as AttendanceSummary[])
      : flattenRecordsByDate(getResponseMaps(raw).recordsByDate ?? getResponseMaps(raw).calendarByDate);
    // Debug: log ALL fields including null values to find actual check-in time
    if (list.length > 0) {
      const record = list[0] as unknown as Record<string, unknown>;
      const allKeys = Object.keys(record);
      const timeRelated: Record<string, unknown> = {};
      for (const k of allKeys) {
        const v = record[k];
        // Show all fields + specifically flag time-looking values
        timeRelated[k] = v;
      }
      console.log("[worker-detail] TODOS los campos del primer registro:", timeRelated);
      console.log("[worker-detail] Campos potenciales de hora:", {
        check_in: record.check_in,
        check_out: record.check_out,
        checkIn: record.checkIn,
        checkOut: record.checkOut,
        actual_check_in: record.actual_check_in,
        actual_check_out: record.actual_check_out,
        check_in_time: record.check_in_time,
        check_out_time: record.check_out_time,
        entry_time: record.entry_time,
        exit_time: record.exit_time,
        marked_at: record.marked_at,
        schedule_keys: Object.keys((record.schedule as object) ?? {}),
      });
    }
    return list;
  }, [query.data]);

  const { recordsByDate, calendarByDate } = useMemo(
    () => getResponseMaps(query.data),
    [query.data]
  );

  const worker: WorkerAttendanceSummary | null = useMemo(() => {
    if (!records.length) return null;
    const grouped = groupRecordsByWorker(records);
    return grouped.find((w) => w.worker_id === workerId) ?? grouped[0] ?? null;
  }, [records, workerId]);

  return { ...query, records, worker, recordsByDate, calendarByDate };
}
