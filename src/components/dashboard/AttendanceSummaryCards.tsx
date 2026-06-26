import { AlarmClock, BellRing, UserCheck, UserX, UsersRound } from "lucide-react";

import { MetricCard } from "@/components/dashboard/MetricCard";
import { getEstimatedAbsences, type DashboardSummary } from "@/components/dashboard/_metrics";
import type { SemanticTone } from "@/components/dashboard/_tokens";

/**
 * Fila de KPIs principales. Cinco métricas operativas con color semántico.
 * "Faltas" se deriva en el front (empleados − asistencias) y se marca como
 * estimado, porque el backend aún no expone ese conteo como dato propio.
 */
export function AttendanceSummaryCards({ summary }: { summary: DashboardSummary }) {
  const absences = getEstimatedAbsences(summary);
  const present = Math.max(0, summary.totalRecords - summary.totalLate);

  const cards: {
    key: string;
    label: string;
    value: number;
    icon: typeof UsersRound;
    tone: SemanticTone;
    hint?: string;
    estimatedNote?: string;
  }[] = [
    {
      key: "activeWorkers",
      label: "Total empleados",
      value: summary.activeWorkers,
      icon: UsersRound,
      tone: "people",
      hint: "activos",
    },
    {
      key: "present",
      label: "Presentes hoy",
      value: present,
      icon: UserCheck,
      tone: "present",
      hint: `${summary.totalRecords} marcaciones`,
    },
    {
      key: "totalLate",
      label: "Tardanzas hoy",
      value: summary.totalLate,
      icon: AlarmClock,
      tone: "late",
    },
    {
      key: "absences",
      label: "Faltas hoy",
      value: absences,
      icon: UserX,
      tone: "absent",
      estimatedNote: "Estimado: empleados activos sin marcación registrada hoy.",
    },
    {
      key: "fakeGpsAlerts",
      label: "Alertas GPS",
      value: summary.fakeGpsAlerts,
      icon: BellRing,
      tone: summary.fakeGpsAlerts > 0 ? "absent" : "neutral",
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      {cards.map((card, index) => (
        <MetricCard
          key={card.key}
          label={card.label}
          value={card.value}
          icon={card.icon}
          tone={card.tone}
          hint={card.hint}
          estimatedNote={card.estimatedNote}
          style={{ animationDelay: `${index * 45}ms` }}
        />
      ))}
    </section>
  );
}
