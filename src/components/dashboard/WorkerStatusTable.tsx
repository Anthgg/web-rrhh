"use client";

import { useMemo, useState } from "react";
import { Clock, RefreshCw, Search, Users, Zap } from "lucide-react";

import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { OvertimeActivationModal } from "@/components/dashboard/OvertimeActivationModal";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { cn } from "@/lib/utils/cn";

export interface WorkerStatus {
  attendanceId: string;
  workerId: string;
  workerName: string;
  projectName: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  lateMinutes: number;
  overtimeMinutes?: number;
  avatarUrl?: string;
}

type FilterKey = "all" | "present" | "late" | "absent" | "in-shift" | "unmarked";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "present", label: "Presentes" },
  { key: "late", label: "Tardanzas" },
  { key: "absent", label: "Faltas" },
  { key: "in-shift", label: "En turno" },
  { key: "unmarked", label: "Sin marcar" },
];

function formatTime(isoString: string | null | undefined): string {
  if (!isoString) return "--:--";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return isoString;
  }
}

function canAuthorizeOvertime(worker: WorkerStatus): boolean {
  return Boolean(worker.attendanceId) && Boolean(worker.checkIn) && !worker.checkOut;
}

function matchesFilter(worker: WorkerStatus, filter: FilterKey): boolean {
  switch (filter) {
    case "all":
      return true;
    case "present":
      return (
        worker.status === "present" ||
        worker.status === "completed" ||
        worker.status === "late" ||
        worker.status === "pending-checkout" ||
        worker.status === "incomplete"
      );
    case "late":
      return worker.status === "late" || worker.lateMinutes > 0;
    case "absent":
      return worker.status === "absent";
    case "in-shift":
      return Boolean(worker.checkIn) && !worker.checkOut;
    case "unmarked":
      return !worker.checkIn;
    default:
      return true;
  }
}

function EmptyRows({ hasWorkers, onRefresh }: { hasWorkers: boolean; onRefresh?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
        <Users className="size-7" />
      </span>
      <div className="grid gap-1">
        <p className="text-sm font-semibold text-foreground">
          {hasWorkers ? "Sin coincidencias para este filtro" : "Sin registros de asistencia hoy"}
        </p>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          {hasWorkers
            ? "Ajusta la búsqueda o cambia el filtro para ver a otros trabajadores."
            : "Cuando los trabajadores marquen asistencia, aparecerán aquí en vivo."}
        </p>
      </div>
      {!hasWorkers && onRefresh ? (
        <button
          type="button"
          onClick={onRefresh}
          className="mt-1 inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
        >
          <RefreshCw className="size-4" />
          Actualizar
        </button>
      ) : null}
    </div>
  );
}

export function WorkerStatusTable({
  workers,
  authorizedBy,
  onOvertimeSuccess,
  onRefresh,
}: {
  workers: WorkerStatus[];
  authorizedBy?: string;
  onOvertimeSuccess?: () => void;
  onRefresh?: () => void;
}) {
  const [otTarget, setOtTarget] = useState<WorkerStatus | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return workers.filter((worker) => {
      if (!matchesFilter(worker, filter)) return false;
      if (!normalizedQuery) return true;
      return (
        worker.workerName.toLowerCase().includes(normalizedQuery) ||
        worker.projectName.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [workers, query, filter]);

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_3px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.04)]">
        {/* Toolbar: búsqueda + filtros */}
        <div className="grid gap-3 border-b border-border p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Buscar trabajador por nombre o proyecto"
              placeholder="Buscar por nombre o proyecto…"
              className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((item) => {
              const count = workers.filter((worker) => matchesFilter(worker, item.key)).length;
              const active = filter === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {item.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-[10px] tabular-nums",
                      active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cabecera de columnas (desktop) */}
        <div className="hidden grid-cols-[1.4fr_1fr_0.7fr_0.7fr_0.9fr_0.6fr] gap-4 border-b border-border bg-muted/40 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground lg:grid">
          <span>Trabajador</span>
          <span>Proyecto / obra</span>
          <span>Entrada</span>
          <span>Salida</span>
          <span>Estado</span>
          <span className="text-right">Acciones</span>
        </div>

        {/* Filas */}
        <div className="divide-y divide-border">
          {filtered.length === 0 ? (
            <EmptyRows hasWorkers={workers.length > 0} onRefresh={onRefresh} />
          ) : (
            filtered.map((worker, idx) => (
              <div
                key={worker.attendanceId || worker.workerId || `worker-${idx}`}
                className="grid gap-3 px-5 py-4 text-sm transition-colors hover:bg-muted/40 lg:grid-cols-[1.4fr_1fr_0.7fr_0.7fr_0.9fr_0.6fr] lg:items-center lg:gap-4"
              >
                {/* Trabajador */}
                <div className="flex items-center gap-3">
                  <UserAvatar src={worker.avatarUrl} fullName={worker.workerName} size="sm" />
                  <div className="min-w-0 grid gap-0.5">
                    <strong className="block truncate font-semibold text-foreground">
                      {worker.workerName}
                    </strong>
                    {worker.lateMinutes > 0 ? (
                      <span className="inline-flex w-fit items-center gap-1 rounded-md bg-rose-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                        <Clock className="size-3 shrink-0" />
                        {worker.lateMinutes}m tarde
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Proyecto */}
                <span className="block truncate font-medium text-muted-foreground">
                  {worker.projectName || "Sin proyecto"}
                </span>

                {/* Entrada */}
                <span
                  className={cn(
                    "inline-flex w-fit items-center rounded-lg px-2.5 py-1 font-mono text-xs",
                    worker.checkIn
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {formatTime(worker.checkIn)}
                </span>

                {/* Salida */}
                <span
                  className={cn(
                    "inline-flex w-fit items-center rounded-lg px-2.5 py-1 font-mono text-xs",
                    worker.checkOut
                      ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {worker.checkOut ? formatTime(worker.checkOut) : "Pendiente"}
                </span>

                {/* Estado */}
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={worker.status} />
                  {worker.overtimeMinutes && worker.overtimeMinutes > 0 ? (
                    <span
                      title="Horas extra aprobadas/trabajadas"
                      className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400"
                    >
                      <Zap className="size-3 fill-amber-500 text-amber-500" />
                      +{worker.overtimeMinutes >= 60 ? `${(worker.overtimeMinutes / 60).toFixed(1)}h` : `${worker.overtimeMinutes}m`}
                    </span>
                  ) : null}
                </div>

                {/* Acciones */}
                <div className="flex justify-start lg:justify-end">
                  {canAuthorizeOvertime(worker) ? (
                    <button
                      type="button"
                      id={`ot-btn-${worker.attendanceId}`}
                      onClick={() => setOtTarget(worker)}
                      title="Autorizar horas extra"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-600 transition hover:border-amber-500/60 hover:bg-amber-500/20 dark:text-amber-400"
                    >
                      <Zap className="size-3.5 fill-amber-500 text-amber-500" />
                      H. Extra
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground/40">—</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {otTarget ? (
        <OvertimeActivationModal
          attendanceId={otTarget.attendanceId}
          workerName={otTarget.workerName}
          authorizedBy={authorizedBy}
          onClose={() => setOtTarget(null)}
          onSuccess={() => {
            setOtTarget(null);
            onOvertimeSuccess?.();
          }}
        />
      ) : null}
    </>
  );
}
