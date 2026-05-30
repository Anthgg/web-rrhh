import { AlarmClock, BellRing, UserCheck, UsersRound } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/DashboardCard";

export function AttendanceSummaryCards({
  summary,
}: {
  summary: {
    activeWorkers: number;
    totalRecords: number;
    totalLate: number;
    fakeGpsAlerts: number;
  };
}) {
  const cards = [
    {
      key: "activeWorkers",
      label: "Total Empleados",
      value: summary.activeWorkers,
      accent: "text-slate-700 bg-slate-100",
      icon: UsersRound,
    },
    {
      key: "totalRecords",
      label: "Asistencias Hoy",
      value: summary.totalRecords,
      accent: "text-emerald-700 bg-emerald-100",
      icon: UserCheck,
    },
    {
      key: "totalLate",
      label: "Tardanzas Hoy",
      value: summary.totalLate,
      accent: "text-orange-700 bg-orange-100",
      icon: AlarmClock,
    },
    {
      key: "fakeGpsAlerts",
      label: "Alertas GPS",
      value: summary.fakeGpsAlerts,
      accent: "text-rose-700 bg-rose-100",
      icon: BellRing,
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((item, index) => {
        const Icon = item.icon;

        return (
          <DashboardCard
            key={item.key}
            className="grid gap-4"
            style={{ animationDelay: `${index * 45}ms` } as React.CSSProperties}
          >
            <div className="flex items-start justify-between gap-4">
              <div className={`rounded-2xl p-3 ${item.accent}`}>
                <Icon className="size-5" />
              </div>
              <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-ink-soft">
                Hoy
              </span>
            </div>
            <div className="grid gap-1">
              <strong className="section-title text-3xl font-semibold text-ink">
                {item.value}
              </strong>
              <span className="text-sm text-ink-soft">{item.label}</span>
            </div>
          </DashboardCard>
        );
      })}
    </section>
  );
}

