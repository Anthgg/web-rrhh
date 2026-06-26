"use client";

import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { AttendanceStatusBadge } from "@/components/attendance/AttendanceStatusBadge";
import { formatDateLocal, normalizeAttendanceStatus, getStatusExplanation, STATUS_LABELS } from "@/lib/utils/attendance";
import type { WorkerAttendanceSummary, AttendanceDayStatus } from "@/types/schedule";

interface WorkerAttendanceHeaderProps {
  worker: WorkerAttendanceSummary;
  dominantStatus: AttendanceDayStatus;
  startDate: string;
  endDate: string;
}

export function WorkerAttendanceHeader({
  worker,
  dominantStatus,
  startDate,
  endDate,
}: WorkerAttendanceHeaderProps) {
  // Calculate counts for the period
  const counts = { present: 0, late: 0, absent: 0, incomplete: 0 };
  for (const r of worker.records) {
    const s = normalizeAttendanceStatus(r as unknown as Record<string, unknown>);
    if (s in counts) counts[s as keyof typeof counts]++;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Left: avatar + info */}
        <div className="flex items-start gap-4">
          <UserAvatar
            src={worker.profilePhotoUrl}
            fullName={worker.worker_name}
            size="xl"
            className="ring-4 ring-primary/10 shrink-0"
          />
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground truncate">
              {worker.worker_name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              {worker.worker_document && (
                <span className="text-sm text-muted-foreground">
                  DNI: <span className="font-medium text-foreground">{worker.worker_document}</span>
                </span>
              )}
              {worker.worker_position && (
                <span className="text-sm text-muted-foreground truncate">
                  Rol: <span className="font-medium text-foreground">{worker.worker_position}</span>
                </span>
              )}
            </div>
            
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <AttendanceStatusBadge status={dominantStatus} />
              <span className="text-sm text-muted-foreground font-medium">
                {formatDateLocal(startDate)} – {formatDateLocal(endDate)}
              </span>
            </div>

            {/* Status counts */}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Asistió: {counts.present}</span>
              <span className="text-amber-600 dark:text-amber-400 font-medium">Tardanzas: {counts.late}</span>
              <span className="text-rose-600 dark:text-rose-400 font-medium">Faltas: {counts.absent}</span>
              <span className="text-orange-600 dark:text-orange-400 font-medium">Incompletas: {counts.incomplete}</span>
            </div>
          </div>
        </div>

        {/* Right: back button */}
        <Link
          href="/dashboard/schedule/attendance-summary"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors self-start"
        >
          <ArrowLeft className="size-4" />
          Volver al resumen
        </Link>
      </div>

      {/* Motivo del estado */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex gap-3 items-start max-w-4xl">
        <Info className="size-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-bold text-foreground">
            Motivo del estado: <span className="text-muted-foreground font-medium">{STATUS_LABELS[dominantStatus] ?? "Desconocido"}</span>
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {getStatusExplanation(dominantStatus)}
          </p>
        </div>
      </div>
    </div>
  );
}
