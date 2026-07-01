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
  return Object.entries(map).flatMap(([mapKey, value]) => {
    if (!value) return [];
    const dayKey = mapKey.includes("T") ? mapKey.split("T")[0] : mapKey;
    const records = Array.isArray(value) ? value : [value];
    return records.map((record) => ({
      ...record,
      dateKey: dayKey,
      dayKey,
      calendarDate: dayKey,
    }));
  });
}

function getCanonicalRecords(raw: unknown): AttendanceSummary[] {
  if (!raw) return [];

  const { recordsByDate, calendarByDate } = getResponseMaps(raw);
  const mappedRecords = flattenRecordsByDate(recordsByDate ?? calendarByDate);
  if (mappedRecords.length) return mappedRecords;

  const response = raw as Record<string, unknown>;
  if (Array.isArray(response.records)) return response.records as AttendanceSummary[];
  if (Array.isArray(response.data)) return response.data as AttendanceSummary[];
  return [];
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
    return getCanonicalRecords(query.data);
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
    return getCanonicalRecords(raw);
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
