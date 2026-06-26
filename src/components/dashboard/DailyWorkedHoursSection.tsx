"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { BarChart3, Loader2, TrendingUp } from "lucide-react";

import { Panel, SectionHeading } from "@/components/dashboard/primitives";
import { tone } from "@/components/dashboard/_tokens";
import { cn } from "@/lib/utils/cn";

const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    ),
  },
);
const BarChart = dynamic(() => import("recharts").then((mod) => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((mod) => mod.Bar), { ssr: false });
const Cell = dynamic(() => import("recharts").then((mod) => mod.Cell), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((mod) => mod.CartesianGrid), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });

export interface WeeklyChartItem {
  dayName: string;
  date: string;
  totalPresent: number;
  totalLate: number;
  totalHours: number;
}

const DAY_MAP: Record<string, string> = {
  monday: "Lun", tuesday: "Mar", wednesday: "Mié", thursday: "Jue",
  friday: "Vie", saturday: "Sáb", sunday: "Dom",
  lunes: "Lun", martes: "Mar", miércoles: "Mié", miercoles: "Mié",
  jueves: "Jue", viernes: "Vie", sábado: "Sáb", sabado: "Sáb", domingo: "Dom",
};

const RANGE_OPTIONS = [
  { key: 7, label: "7 días", enabled: true },
  { key: 15, label: "15 días", enabled: false },
  { key: 30, label: "30 días", enabled: false },
] as const;

function translateDay(name: string) {
  return DAY_MAP[name.toLowerCase()] || name.slice(0, 3);
}

interface TooltipPayload {
  payload: { day: string; hours: number; present: number; late: number };
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-popover-foreground">{data.day}</p>
      <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
        <span className="size-2 rounded-full" style={{ background: tone.present.fill }} />
        <span className="tabular-nums font-semibold text-foreground">{data.hours.toFixed(1)}h</span> trabajadas
      </p>
      {data.present > 0 ? (
        <p className="text-muted-foreground">
          <span className="tabular-nums font-semibold text-foreground">{data.present}</span> presentes
        </p>
      ) : null}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-background px-3 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("section-title mt-0.5 text-lg font-semibold tabular-nums", accent ? "text-primary" : "text-foreground")}>
        {value}
      </p>
    </div>
  );
}

export function DailyWorkedHoursSection({ weeklyChart }: { weeklyChart: WeeklyChartItem[] }) {
  const [range, setRange] = useState<number>(7);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const data = weeklyChart.map((day) => ({
    day: translateDay(day.dayName),
    hours: Number(day.totalHours) || 0,
    present: day.totalPresent,
    late: day.totalLate,
  }));

  const hasData = data.some((d) => d.hours > 0);
  const totalHours = data.reduce((acc, d) => acc + d.hours, 0);
  const avgHours = data.length ? totalHours / data.length : 0;
  const best = data.reduce((acc, d) => (d.hours > acc.hours ? d : acc), { day: "—", hours: 0 });
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
                title={option.enabled ? undefined : "Requiere ampliar el rango en el backend"}
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
          {mounted ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <BarChart
              data={data}
              margin={{ top: 8, right: 4, left: -16, bottom: 0 }}
              barCategoryGap="28%"
              onMouseMove={(state: any) => {
                setActiveIndex(typeof state?.activeTooltipIndex === "number" ? state.activeTooltipIndex : null);
              }}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <defs>
                {/* Degradado vivo que rota colores: se aplica a la barra más cercana al cursor. */}
                <linearGradient id="barHover" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={tone.people.fill}>
                    <animate
                      attributeName="stop-color"
                      values={`${tone.people.fill};${tone.info.fill};${tone.present.fill};${tone.people.fill}`}
                      dur="3s"
                      repeatCount="indefinite"
                    />
                  </stop>
                  <stop offset="100%" stopColor={tone.info.fill}>
                    <animate
                      attributeName="stop-color"
                      values={`${tone.info.fill};${tone.present.fill};${tone.people.fill};${tone.info.fill}`}
                      dur="3s"
                      repeatCount="indefinite"
                    />
                  </stop>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={36}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickFormatter={(value: number) => `${value}h`}
              />
              <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.4 }} content={<ChartTooltip />} />
              <Bar dataKey="hours" radius={[6, 6, 0, 0]} maxBarSize={44} isAnimationActive={false}>
                {data.map((entry, index) => {
                  const isMax = entry.hours === maxHours && maxHours > 0;
                  const isActive = index === activeIndex;
                  const isNear = activeIndex !== null && Math.abs(index - activeIndex) === 1;
                  const hovering = activeIndex !== null;
                  return (
                    <Cell
                      key={entry.day}
                      fill={isActive ? "url(#barHover)" : isMax ? tone.present.fill : "var(--primary)"}
                      opacity={isActive ? 1 : isNear ? 0.75 : hovering ? 0.3 : isMax ? 1 : 0.55}
                      style={{
                        transition: "opacity 250ms ease, fill 250ms ease",
                        filter: isActive ? `drop-shadow(0 4px 14px ${tone.people.fill}66)` : undefined,
                      }}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          )}
        </div>
      ) : (
        <div className="grid h-56 place-items-center rounded-xl border border-dashed border-border bg-background text-center">
          <div className="grid gap-1.5">
            <TrendingUp className="mx-auto size-7 text-muted-foreground/50" />
            <p className="text-sm font-semibold text-foreground">Sin horas registradas</p>
            <p className="text-sm text-muted-foreground">
              Las jornadas aparecerán aquí cuando se registren marcaciones completas.
            </p>
          </div>
        </div>
      )}
    </Panel>
  );
}
