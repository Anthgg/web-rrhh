import { Activity } from "lucide-react";

import { Panel, SectionHeading } from "@/components/dashboard/primitives";
import { tone, type SemanticTone } from "@/components/dashboard/_tokens";
import {
  getEstimatedAbsences,
  getStatusBreakdown,
  type DashboardSummary,
} from "@/components/dashboard/_metrics";
import type { WorkerStatus } from "@/services/dashboard.service";
import { cn } from "@/lib/utils/cn";

/**
 * Resumen operativo del día como mini-métricas. Da a RRHH/Admin el estado
 * general de un vistazo. Los valores derivados de agregados (presentes, faltas,
 * tardanzas, sin marcar, alertas) son exactos; los que dependen del listado
 * paginado se anotan como "en lista".
 */
export function OperationalSummaryCard({
  summary,
  workers,
  pendingRequests,
}: {
  summary: DashboardSummary;
  workers: WorkerStatus[];
  pendingRequests?: number;
}) {
  const breakdown = getStatusBreakdown(workers);
  const present = Math.max(0, summary.totalRecords - summary.totalLate);
  const absences = getEstimatedAbsences(summary);

  const stats: {
    label: string;
    value: number | string;
    tone: SemanticTone;
    note?: string;
  }[] = [
    { label: "Presentes", value: present, tone: "present" },
    { label: "Tardanzas", value: summary.totalLate, tone: "late" },
    { label: "Faltas", value: absences, tone: "absent", note: "estimado" },
    { label: "Sin marcar", value: Math.max(0, summary.activeWorkers - summary.totalRecords), tone: "unmarked" },
    { label: "Jornada completa", value: breakdown.completed, tone: "info", note: "en lista" },
    { label: "Alertas GPS", value: summary.fakeGpsAlerts, tone: summary.fakeGpsAlerts > 0 ? "absent" : "neutral" },
  ];

  if (typeof pendingRequests === "number") {
    stats.push({ label: "Solicitudes", value: pendingRequests, tone: "people" });
  }

  return (
    <Panel className="grid h-full content-start gap-4">
      <SectionHeading
        title="Resumen operativo"
        subtitle="Estado general del día de un vistazo"
        icon={Activity}
        iconTone="present"
      />

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="relative overflow-hidden rounded-xl border border-border bg-background p-3"
          >
            <span aria-hidden className={cn("absolute inset-y-0 left-0 w-1", tone[stat.tone].bar)} />
            <div className="pl-1.5">
              <p className="section-title text-xl font-semibold tabular-nums text-foreground">
                {stat.value}
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                {stat.label}
                {stat.note ? (
                  <span className="ml-1 text-[10px] uppercase tracking-wide text-muted-foreground/60">
                    {stat.note}
                  </span>
                ) : null}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
