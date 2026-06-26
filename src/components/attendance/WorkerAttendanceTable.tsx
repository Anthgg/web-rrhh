"use client";

import Link from "next/link";
import { ChevronRight, CalendarDays } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { AttendanceStatusBadge } from "@/components/attendance/AttendanceStatusBadge";
import { formatTimeDuration, formatMinutes, formatCurrency, normalizeAttendanceStatus } from "@/lib/utils/attendance";
import type { WorkerAttendanceSummary, AttendanceDayStatus } from "@/types/schedule";

interface WorkerAttendanceTableProps {
  workers: WorkerAttendanceSummary[];
  startDate: string;
  endDate: string;
  statusFilter: AttendanceDayStatus | "all";
}

export function WorkerAttendanceTable({
  workers,
  startDate,
  endDate,
  statusFilter,
}: WorkerAttendanceTableProps) {
  const filtered = statusFilter === "all"
    ? workers
    : workers.filter((w) => {
        const s = normalizeAttendanceStatus({ status: w.dominant_status } as unknown as Record<string, unknown>);
        return s === statusFilter;
      });

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16 text-center">
        <div className="rounded-full bg-muted p-4 text-muted-foreground mb-4">
          <CalendarDays className="size-8" />
        </div>
        <p className="text-base font-semibold text-foreground">Sin colaboradores</p>
        <p className="mt-1 text-sm text-muted-foreground max-w-xs">
          No se encontraron registros de asistencia para los filtros seleccionados.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
      {/* Header */}
      <div className="border-b border-border/60 px-6 py-4 bg-muted/20 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">Colaboradores</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filtered.length} colaborador{filtered.length !== 1 ? "es" : ""} en el periodo seleccionado
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3">Colaborador</th>
              <th className="px-5 py-3 text-center">Trabajadas</th>
              <th className="px-5 py-3 text-center">Efectivas</th>
              <th className="px-5 py-3 text-center">H. Extra</th>
              <th className="px-5 py-3 text-center">Tardanza</th>
              <th className="px-5 py-3 text-center">Faltas</th>
              <th className="px-5 py-3 text-right">Sueldo Base</th>
              <th className="px-5 py-3 text-right">Total Generado</th>
              <th className="px-5 py-3 text-center">Estado</th>
              <th className="px-5 py-3 text-center">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {filtered.map((w) => {
              const status = normalizeAttendanceStatus({ status: w.dominant_status } as unknown as Record<string, unknown>);
              const detailUrl = `/dashboard/schedule/attendance-summary/${w.worker_id}?start_date=${startDate}&end_date=${endDate}`;
              return (
                <tr
                  key={w.worker_id}
                  className="group hover:bg-muted/40 transition-colors duration-150 cursor-pointer"
                  onClick={() => window.location.href = detailUrl}
                >
                  {/* Worker */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar
                        src={w.profilePhotoUrl}
                        fullName={w.worker_name}
                        size="sm"
                        className="ring-2 ring-primary/10 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground text-sm">{w.worker_name}</p>
                        <div className="flex flex-col mt-0.5">
                          {w.worker_document && (
                            <span className="truncate text-[11px] text-muted-foreground/90">
                              DNI: <span className="font-medium">{w.worker_document}</span>
                            </span>
                          )}
                          {w.worker_position && (
                            <span className="truncate text-[11px] text-muted-foreground/90">
                              Rol: <span className="font-medium">{w.worker_position}</span>
                            </span>
                          )}
                          {(!w.worker_document && !w.worker_position) && (
                            <span className="text-[11px] text-muted-foreground/50">—</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  {/* Hours */}
                  <td className="px-5 py-4 text-center text-foreground font-medium">
                    {formatTimeDuration(w.worked_hours)}
                  </td>
                  <td className="px-5 py-4 text-center text-indigo-600 dark:text-indigo-400 font-medium">
                    {formatTimeDuration(w.effective_worked_hours)}
                  </td>
                  <td className="px-5 py-4 text-center">
                    {w.overtime_hours > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                        +{formatTimeDuration(w.overtime_hours)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-center">
                    {w.late_minutes > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                        {formatMinutes(w.late_minutes)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-center">
                    {w.absent_days > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                        {w.absent_days}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  {/* Financials */}
                  <td className="px-5 py-4 text-right text-muted-foreground text-sm">
                    {w.base_salary ? formatCurrency(w.base_salary) : "—"}
                  </td>
                  <td className="px-5 py-4 text-right font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                    {formatCurrency(w.total_earnings)}
                  </td>
                  {/* Status */}
                  <td className="px-5 py-4 text-center">
                    {w.is_active ? (
                      <span className="inline-flex items-center rounded-md bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-rose-500/15 px-2 py-1 text-xs font-medium text-rose-700 dark:text-rose-400 border border-rose-500/30">
                        Inactivo
                      </span>
                    )}
                  </td>
                  {/* Action */}
                  <td className="px-5 py-4 text-center">
                    <Link
                      href={detailUrl}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors duration-150"
                    >
                      Ver asistencia
                      <ChevronRight className="size-3" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
