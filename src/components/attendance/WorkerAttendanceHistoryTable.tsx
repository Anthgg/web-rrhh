"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { AttendanceStatusBadge } from "@/components/attendance/AttendanceStatusBadge";
import { PaymentTypeBadge } from "@/components/attendance/PaymentTypeBadge";
import { normalizeAttendanceStatus, formatDateLocal, formatTime, formatTimeDuration, formatMinutes, formatCurrency, getRecordCheckTime, getDayReason, getRecordStatusLabel, getSalaryIndicator } from "@/lib/utils/attendance";
import type { AttendanceSummary } from "@/types/schedule";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface WorkerAttendanceHistoryTableProps {
  records: AttendanceSummary[];
  onRowClick?: (record: AttendanceSummary) => void;
}

const PAGE_SIZE = 15;

function getHistoryDayKey(record: AttendanceSummary): string {
  return (
    record.dateKey ??
    record.dayKey ??
    record.calendarDate ??
    record.localDate ??
    record.dateTime?.split("T")[0] ??
    record.calendarDateTime?.split("T")[0] ??
    ""
  );
}

function getHistoryRowKey(record: AttendanceSummary): string {
  return [
    record.id,
    record.worker_id,
    getHistoryDayKey(record),
    record.check_in ?? record.checkIn,
    record.check_out ?? record.checkOut,
    record.statusKey ?? record.status_key ?? record.status,
  ]
    .filter(Boolean)
    .join("-");
}

export function WorkerAttendanceHistoryTable({ records, onRowClick }: WorkerAttendanceHistoryTableProps) {
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    const sortedRecords = Array.from(records);
    sortedRecords.sort((a, b) => {
      const aKey = getHistoryDayKey(a);
      const bKey = getHistoryDayKey(b);
      return bKey.localeCompare(aKey);
    });
    return sortedRecords;
  }, [records]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageRecords = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
      <div className="border-b border-border/60 px-5 py-4 bg-muted/20">
        <h3 className="text-sm font-bold text-foreground">Historial de asistencia</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {records.length} registro{records.length !== 1 ? "s" : ""} en el periodo
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3 text-center">Fecha</th>
              <th className="px-5 py-3">Estado</th>
              <th className="px-5 py-3">Motivo</th>
              <th className="px-5 py-3 text-center">Entrada</th>
              <th className="px-5 py-3 text-center">Salida</th>
              <th className="px-5 py-3 text-right">Trabajadas</th>
              <th className="px-5 py-3 text-right">Efectivas</th>
              <th className="px-5 py-3 text-right">Tardanza</th>
              <th className="px-5 py-3 text-right">H. Extra</th>
              <th className="px-5 py-3 text-right">Descuento</th>
              <th className="px-5 py-3 text-right">Generado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {pageRecords.map((r) => {
              const status = normalizeAttendanceStatus(r as unknown as Record<string, unknown>);
              const checkIn = getRecordCheckTime(r, "in");
              const checkOut = getRecordCheckTime(r, "out");
              const dayKey = getHistoryDayKey(r);
              return (
                <tr
                  key={getHistoryRowKey(r)}
                  className="even:bg-muted/10 hover:bg-muted/40 transition-colors duration-150 cursor-pointer"
                  onClick={() => onRowClick?.(r)}
                >
                  <td className="px-5 py-3 font-semibold text-foreground whitespace-nowrap text-center">
                    {formatDateLocal(dayKey)}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <div className="flex flex-col items-start gap-1">
                      <AttendanceStatusBadge status={status} label={getRecordStatusLabel(r, status)} />
                      <PaymentTypeBadge paymentType={r.paymentType || r.payment_type} />
                      {(() => {
                        const indicator = getSalaryIndicator(r, status);
                        if (!indicator) return null;
                        const badgeStyle = indicator === "Percibe"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                          : "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20";
                        return (
                          <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", badgeStyle)}>
                            {indicator}
                          </span>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground text-xs font-medium whitespace-nowrap">
                    {getDayReason(status)}
                  </td>
                  <td className="px-5 py-3 text-center text-emerald-600 dark:text-emerald-400 font-medium">
                    {checkIn ? formatTime(checkIn) : "—"}
                  </td>
                  <td className="px-5 py-3 text-center text-indigo-600 dark:text-indigo-400 font-medium">
                    {checkOut ? formatTime(checkOut) : "—"}
                  </td>
                  <td className="px-5 py-3 text-right text-foreground">
                    {formatTimeDuration(r.worked_hours)}
                  </td>
                  <td className="px-5 py-3 text-right text-indigo-600 dark:text-indigo-400">
                    {formatTimeDuration(r.effective_worked_hours)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {(r.late_minutes ?? 0) > 0 ? (
                      <span className="text-rose-500 text-xs font-semibold">
                        {formatMinutes(r.late_minutes)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {(r.overtime_hours ?? 0) > 0 ? (
                      <span className="text-amber-600 dark:text-amber-400 text-xs font-semibold">
                        +{formatTimeDuration(r.overtime_hours)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right text-rose-500 font-medium text-xs">
                    {(r.estimated_discounts ?? 0) > 0 ? formatCurrency(r.estimated_discounts) : "—"}
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                    {formatCurrency(r.total_earnings)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-5 py-3 bg-muted/20">
          <p className="text-xs text-muted-foreground">
            Página {page} de {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={(e) => { e.stopPropagation(); setPage((p) => p - 1); }}
              className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={(e) => { e.stopPropagation(); setPage((p) => p + 1); }}
              className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
