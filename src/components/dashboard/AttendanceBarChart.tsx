"use client";

/**
 * Inner bar chart — importado exclusivamente via dynamic({ ssr: false }).
 * Al vivir en su propio módulo, recharts se carga UNA sola vez como bloque
 * y el ResizeObserver de ResponsiveContainer sólo corre cuando el navegador
 * ya pintó el contenedor, eliminando el warning "width(-1) height(-1)".
 */

import { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { tone } from "@/components/dashboard/_tokens";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChartEntry {
  day: string;
  hours: number;
  present: number;
  late: number;
}

interface TooltipPayload {
  payload: ChartEntry;
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-popover-foreground">{data.day}</p>
      <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
        <span
          className="size-2 rounded-full"
          style={{ background: tone.present.fill }}
        />
        <span className="tabular-nums font-semibold text-foreground">
          {data.hours.toFixed(1)}h
        </span>{" "}
        trabajadas
      </p>
      {data.present > 0 ? (
        <p className="text-muted-foreground">
          <span className="tabular-nums font-semibold text-foreground">
            {data.present}
          </span>{" "}
          presentes
        </p>
      ) : null}
    </div>
  );
}

// ─── Chart ────────────────────────────────────────────────────────────────────

export interface AttendanceBarChartProps {
  data: ChartEntry[];
  maxHours: number;
}

export default function AttendanceBarChart({
  data,
  maxHours,
}: AttendanceBarChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 8, right: 4, left: -16, bottom: 0 }}
        barCategoryGap="28%"
        onMouseMove={(state) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const idx = (state as any)?.activeTooltipIndex;
          setActiveIndex(typeof idx === "number" ? idx : null);
        }}
        onMouseLeave={() => setActiveIndex(null)}
      >
        <defs>
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

        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="var(--border)"
        />
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
        <Tooltip
          cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          content={<ChartTooltip />}
        />
        <Bar
          dataKey="hours"
          radius={[6, 6, 0, 0]}
          maxBarSize={44}
          isAnimationActive={false}
        >
          {data.map((entry, index) => {
            const isMax = entry.hours === maxHours && maxHours > 0;
            const isActive = index === activeIndex;
            const isNear =
              activeIndex !== null && Math.abs(index - activeIndex) === 1;
            const hovering = activeIndex !== null;
            return (
              <Cell
                key={entry.day}
                fill={
                  isActive
                    ? "url(#barHover)"
                    : isMax
                      ? tone.present.fill
                      : "var(--primary)"
                }
                opacity={
                  isActive ? 1 : isNear ? 0.75 : hovering ? 0.3 : isMax ? 1 : 0.55
                }
                style={{
                  transition: "opacity 250ms ease, fill 250ms ease",
                  filter: isActive
                    ? `drop-shadow(0 4px 14px ${tone.people.fill}66)`
                    : undefined,
                }}
              />
            );
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
