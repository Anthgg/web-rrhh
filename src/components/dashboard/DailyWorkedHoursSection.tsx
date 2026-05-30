import { BarChart3, Timer } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/DashboardCard";

export interface WeeklyChartItem {
  dayName: string;
  date: string;
  totalPresent: number;
  totalLate: number;
  totalHours: number;
}

export function DailyWorkedHoursSection({
  weeklyChart,
}: {
  weeklyChart: WeeklyChartItem[];
}) {
  const totalWeekHours = weeklyChart.reduce((acc, curr) => acc + curr.totalHours, 0);
  const avgWeekHours = weeklyChart.length ? Math.round(totalWeekHours / weeklyChart.length) : 0;
  
  const maxHours = Math.max(...weeklyChart.map((d) => d.totalHours), 1);

  return (
    <DashboardCard className="grid gap-5 self-start">
      <div className="grid gap-4 2xl:grid-cols-[1fr_auto] 2xl:items-end">
        <div className="grid gap-1">
          <h2 className="section-title text-2xl font-semibold text-ink">Horas trabajadas (Semana)</h2>
          <p className="text-sm text-ink-soft">
            Histórico de horas trabajadas en los últimos 7 días.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl bg-brand-soft p-4 text-brand">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em]">
              <Timer className="size-4" />
              Total Semanal
            </div>
            <strong className="mt-2 block text-2xl font-semibold">{totalWeekHours.toFixed(1)}h</strong>
          </div>
          <div className="rounded-3xl bg-surface-muted p-4 text-ink">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
              <BarChart3 className="size-4" />
              Promedio Diar.
            </div>
            <strong className="mt-2 block text-2xl font-semibold">{avgWeekHours.toFixed(1)}h</strong>
          </div>
        </div>
      </div>

      <div className="mt-2 flex h-48 items-end gap-2 rounded-2xl border border-border bg-surface-muted p-4 sm:gap-4 md:h-60">
        {weeklyChart.map((day, idx) => {
          const heightPercent = Math.max((day.totalHours / maxHours) * 100, 5);
          return (
            <div key={idx} className="group relative flex h-full flex-1 flex-col items-center justify-end gap-2">
              <div 
                className="w-full rounded-t-md bg-brand transition-all duration-300 hover:bg-brand/80 sm:w-12 md:w-16"
                style={{ height: `${heightPercent}%` }}
              >
                <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-ink px-2 py-1 text-xs text-white opacity-0 transition-opacity whitespace-nowrap group-hover:opacity-100">
                  {day.totalHours}h
                </div>
              </div>
              <span className="text-xs font-medium text-ink-soft capitalize">{day.dayName.slice(0, 3)}</span>
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
}
