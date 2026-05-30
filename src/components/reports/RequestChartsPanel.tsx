"use client";

import dynamic from "next/dynamic";
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, Loader2 } from "lucide-react";

const ResponsiveContainer = dynamic(() => import("recharts").then(mod => mod.ResponsiveContainer), { ssr: false, loading: () => <div className="flex h-full items-center justify-center"><Loader2 className="size-6 animate-spin text-brand" /></div> });
const Bar = dynamic(() => import("recharts").then(mod => mod.Bar), { ssr: false });
const BarChart = dynamic(() => import("recharts").then(mod => mod.BarChart), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then(mod => mod.CartesianGrid), { ssr: false });
const Cell = dynamic(() => import("recharts").then(mod => mod.Cell), { ssr: false });
const Legend = dynamic(() => import("recharts").then(mod => mod.Legend), { ssr: false });
const Line = dynamic(() => import("recharts").then(mod => mod.Line), { ssr: false });
const LineChart = dynamic(() => import("recharts").then(mod => mod.LineChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then(mod => mod.Pie), { ssr: false });
const PieChart = dynamic(() => import("recharts").then(mod => mod.PieChart), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then(mod => mod.Tooltip), { ssr: false });
const XAxis = dynamic(() => import("recharts").then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then(mod => mod.YAxis), { ssr: false });


import { EmptyState } from "@/components/reports/EmptyState";
import { Card } from "@/components/ui/card";
import { REPORT_CHART_GROUP_OPTIONS, REPORT_CHART_METRIC_OPTIONS } from "@/features/reports/report-config";
import type { ChartConfig, ReportChartResponse } from "@/types/report.types";
import { FieldFrame, Select } from "@/components/ui/fields";

const chartColors = ["#8b5cf6", "#06b6d4", "#34d399", "#f59e0b", "#fb7185", "#60a5fa", "#a78bfa"];

function buildChartData(chart: ReportChartResponse["data"]) {
  return chart.labels.map((label, index) => ({
    label,
    value: chart.datasets[0]?.data[index] ?? 0,
  }));
}

function resolveChartKind(config: ChartConfig) {
  if (config.groupBy === "status") return "pie";
  if (config.groupBy === "month") return "line";
  if (config.groupBy === "area") return "horizontal";
  return "bar";
}

export function RequestChartsPanel({
  chart,
  chartConfig,
  isLoading = false,
  onConfigChange,
}: {
  chart?: ReportChartResponse["data"];
  chartConfig: ChartConfig;
  isLoading?: boolean;
  onConfigChange: (patch: Partial<ChartConfig>) => void;
}) {
  const chartData = chart ? buildChartData(chart) : [];
  const chartKind = resolveChartKind(chartConfig);
  const chartSummaryEntries = Object.entries(chart?.summary ?? {});

  return (
    <Card className="grid gap-5 border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(15,23,42,0.82))] p-5 text-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid gap-1">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-200">
            <BarChart3 className="size-3.5 text-cyan-300" />
            Graficos estadisticos
          </div>
          <h3 className="text-2xl font-semibold text-white">{chart?.title ?? "Analitica de solicitudes"}</h3>
          <p className="text-sm text-slate-300">
            Cambia el agrupamiento y la metrica para explorar los patrones reales del backend.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FieldFrame label="Agrupar por">
            <Select
              value={chartConfig.groupBy}
              onChange={(event) => onConfigChange({ groupBy: event.target.value as ChartConfig["groupBy"] })}
              className="border-white/10 bg-white/5 text-white"
            >
              {REPORT_CHART_GROUP_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="text-slate-900">
                  {option.label}
                </option>
              ))}
            </Select>
          </FieldFrame>

          <FieldFrame label="Metrica">
            <Select
              value={chartConfig.metric}
              onChange={(event) => onConfigChange({ metric: event.target.value as ChartConfig["metric"] })}
              className="border-white/10 bg-white/5 text-white"
            >
              {REPORT_CHART_METRIC_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="text-slate-900">
                  {option.label}
                </option>
              ))}
            </Select>
          </FieldFrame>

          <FieldFrame label="Top / limite">
            <Select
              value={String(chartConfig.limit ?? 10)}
              onChange={(event) => onConfigChange({ limit: Number(event.target.value) })}
              className="border-white/10 bg-white/5 text-white"
            >
              {[5, 10, 15, 20].map((value) => (
                <option key={value} value={value} className="text-slate-900">
                  {value}
                </option>
              ))}
            </Select>
          </FieldFrame>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          <div className="h-[320px] animate-pulse rounded-[1.75rem] bg-white/5" />
        </div>
      ) : !chartData.length ? (
        <EmptyState
          title="No hay datos para los graficos"
          description="Ajusta los filtros o el agrupamiento para visualizar informacion estadistica."
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="h-[360px] rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-4">
            <ResponsiveContainer width="100%" height="100%">
              {chartKind === "pie" ? (
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="label" innerRadius={72} outerRadius={112}>
                    {chartData.map((entry, index) => (
                      <Cell key={`${entry.label}-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              ) : chartKind === "line" ? (
                <LineChart data={chartData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
                  <XAxis dataKey="label" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              ) : (
                <BarChart data={chartData} layout={chartKind === "horizontal" ? "vertical" : "horizontal"}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
                  <XAxis
                    type={chartKind === "horizontal" ? "number" : "category"}
                    dataKey={chartKind === "horizontal" ? undefined : "label"}
                    stroke="#94a3b8"
                  />
                  <YAxis
                    type={chartKind === "horizontal" ? "category" : "number"}
                    dataKey={chartKind === "horizontal" ? "label" : undefined}
                    stroke="#94a3b8"
                    width={chartKind === "horizontal" ? 120 : 40}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="#06b6d4" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="grid gap-4 rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2">
              {chartKind === "line" ? (
                <LineChartIcon className="size-4 text-cyan-300" />
              ) : chartKind === "pie" ? (
                <PieChartIcon className="size-4 text-cyan-300" />
              ) : (
                <BarChart3 className="size-4 text-cyan-300" />
              )}
              <strong className="text-sm font-semibold text-white">Resumen numerico</strong>
            </div>

            <div className="grid gap-3">
              {chartSummaryEntries.map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-4 py-3"
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    {key}
                  </span>
                  <p className="mt-1 text-lg font-semibold text-white">{String(value ?? "-")}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
