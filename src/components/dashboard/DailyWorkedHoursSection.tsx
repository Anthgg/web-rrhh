"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { BarChart3, Loader2, TrendingUp } from "lucide-react";

import { Panel, SectionHeading } from "@/components/dashboard/primitives";
import { cn } from "@/lib/utils/cn";

export interface WeeklyChartItem {
  dayName: string;
  date: string;
  totalPresent: number;
  totalLate: number;
  totalHours: number;
}

// ─── Lazy chart ───────────────────────────────────────────────────────────────
// The entire recharts tree (including ResponsiveContainer) lives in a separate
// module and is loaded with ssr:false.  That way recharts' ResizeObserver fires
// only AFTER the browser has painted the container, which eliminates the
// "width(-1) height(-1)" console warning.
const AttendanceBarChart = dynamic(
  () => import("@/components/dashboard/AttendanceBarChart"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    ),
  },
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAY_MAP: Record<string, string> = {
  monday: "Lun",
  tuesday: "Mar",
  wednesday: "Mié",
  thursday: "Jue",
  friday: "Vie",
  saturday: "Sáb",
  sunday: "Dom",
  lunes: "Lun",
  martes: "Mar",
  miércoles: "Mié",
  miercoles: "Mié",
  jueves: "Jue",
  viernes: "Vie",
  sábado: "Sáb",
  sabado: "Sáb",
  domingo: "Dom",
};

const RANGE_OPTIONS = [
  { key: 7, label: "7 días", enabled: true },
  { key: 15, label: "15 días", enabled: false },
  { key: 30, label: "30 días", enabled: false },
] as const;

function translateDay(name: string) {
  return DAY_MAP[name.toLowerCase()] || name.slice(0, 3);
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-background px-3 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "section-title mt-0.5 text-lg font-semibold tabular-nums",
          accent ? "text-primary" : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}

// ─── Public export ────────────────────────────────────────────────────────────

export function DailyWorkedHoursSection({
  weeklyChart,
}: {
  weeklyChart: WeeklyChartItem[];
}) {
  const [range, setRange] = useState<number>(7);

  const data = weeklyChart.map((day) => ({
    day: translateDay(day.dayName),
    hours: Number(day.totalHours) || 0,
    present: day.totalPresent,
    late: day.totalLate,
  }));

  const hasData = data.some((d) => d.hours > 0);
  const totalHours = data.reduce((acc, d) => acc + d.hours, 0);
  const avgHours = data.length ? totalHours / data.length : 0;
  const best = data.reduce(
    (acc, d) => (d.hours > acc.hours ? d : acc),
    { day: "—", hours: 0 },
  );
  const maxHours = Math.max(...data.map((d) => d.hours), 0);

  return (
    <Panel className="grid gap-5">
      <SectionHeading
        title="Horas trabajadas"
        subtitle="Histórico de jornadas del personal"
        icon={BarChart3}
        iconTone="people"
        action={
          <div className="flex rounded-lg border border-border bg-background p-0.5">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                disabled={!option.enabled}
                onClick={() => option.enabled && setRange(option.key)}
                title={
                  option.enabled
                    ? undefined
                    : "Requiere ampliar el rango en el backend"
                }
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-semibold transition",
                  range === option.key && option.enabled
                    ? "bg-primary text-primary-foreground"
                    : option.enabled
                      ? "text-muted-foreground hover:text-foreground"
                      : "cursor-not-allowed text-muted-foreground/40",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-2.5">
        <Stat label="Total" value={`${totalHours.toFixed(1)}h`} accent />
        <Stat label="Promedio" value={`${avgHours.toFixed(1)}h`} />
        <Stat label="Mejor día" value={best.hours > 0 ? best.day : "—"} />
      </div>

      {hasData ? (
        <div className="h-56 w-full">
          <AttendanceBarChart data={data} maxHours={maxHours} />
        </div>
      ) : (
        <div className="grid h-56 place-items-center rounded-xl border border-dashed border-border bg-background text-center">
          <div className="grid gap-1.5">
            <TrendingUp className="mx-auto size-7 text-muted-foreground/50" />
            <p className="text-sm font-semibold text-foreground">
              Sin horas registradas
            </p>
            <p className="text-sm text-muted-foreground">
              Las jornadas aparecerán aquí cuando se registren marcaciones
              completas.
            </p>
          </div>
        </div>
      )}
    </Panel>
  );
}
