"use client";

import { useQuery } from "@tanstack/react-query";
import { attendanceService } from "@/services/attendance.service";
import type { AttendanceHistoryParams } from "@/types/schedule";

interface UseAttendanceHistoryOptions extends AttendanceHistoryParams {
  enabled?: boolean;
}

/**
 * Fetches day-level attendance records for a given month/year.
 * Supports optional comma-separated status filter, e.g. "VACATION,MEDICAL_LEAVE".
 *
 * Key rule: filtering by VACATION/MEDICAL_LEAVE/UNPAID_LEAVE never returns absent records.
 */
export function useAttendanceHistory({
  month,
  year,
  status,
  enabled = true,
}: UseAttendanceHistoryOptions) {
  return useQuery({
    queryKey: ["attendance-history", month, year, status ?? "all"],
    queryFn: () => attendanceService.getHistory({ month, year, status }),
    enabled,
    staleTime: 2 * 60_000,
  });
}

interface UseAttendanceSummaryOptions {
  month: number;
  year: number;
  enabled?: boolean;
}

/**
 * Fetches the monthly attendance summary with separate counters:
 * absentDays, vacationDays, medicalLeaveDays, unpaidLeaveDays.
 */
export function useAttendanceMonthlySummary({
  month,
  year,
  enabled = true,
}: UseAttendanceSummaryOptions) {
  return useQuery({
    queryKey: ["attendance-summary", month, year],
    queryFn: () => attendanceService.getMonthlySummary({ month, year }),
    enabled,
    staleTime: 2 * 60_000,
  });
}
