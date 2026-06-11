"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { ErrorState } from "@/components/reports/ErrorState";
import { ReportFiltersPanel } from "@/components/reports/ReportFiltersPanel";
import { ReportsLayout } from "@/components/reports/ReportsLayout";
import { ReportSummaryCards } from "@/components/reports/ReportSummaryCards";
import { RequestChartsPanel } from "@/components/reports/RequestChartsPanel";
import { useReportCharts } from "@/hooks/useReportCharts";
import { useReportFilters } from "@/hooks/useReportFilters";
import { reportsApi } from "@/services/reportsApi";
import { requestsService } from "@/services/requests.service";
import { workersService } from "@/services/workers.service";
import { useSession } from "@/features/auth/auth-provider";
import type { ChartConfig } from "@/types/report.types";
import { isAdminRequestManager } from "@/lib/utils/requests";

function getErrorMessage(error: unknown) {
 return error instanceof Error ? error.message : "No se pudo completar la operacion.";
}

export function ReportsDashboardPage() {
 const { user } = useSession();
 const isManager = isAdminRequestManager(user?.role);
 const { filters, setFilters, resetFilters } = useReportFilters();
 const [chartConfig, setChartConfig] = useState<ChartConfig>({
 groupBy: "worker",
 metric: "total_requests",
 limit: 10,
 });

 const { data: requestTypes } = useQuery({
 queryKey: ["report-request-types"],
 queryFn: requestsService.getTypes,
 staleTime: 5 * 60_000,
 });
 const { data: workersResponse } = useQuery({
 queryKey: ["report-workers"],
 queryFn: () => workersService.list({ page: 1, pageSize: 100 }),
 enabled: isManager,
 staleTime: 5 * 60_000,
 });
 const {
 data: summary,
 error: summaryError,
 isError: isSummaryError,
 isLoading: isSummaryLoading,
 refetch: refetchSummary,
 } = useQuery({
 queryKey: ["report-summary", filters],
 queryFn: () => reportsApi.getSummary(filters),
 refetchOnWindowFocus: false,
 });
 const {
 data: chart,
 error: chartError,
 isError: isChartError,
 isLoading: isChartLoading,
 refetch: refetchChart,
 } = useReportCharts(filters, chartConfig);

 const workers = useMemo(() => workersResponse?.items ?? [], [workersResponse]);

 return (
 <ReportsLayout
 title="Dashboard de solicitudes"
 description="Mide volumen, aprobaciones y tendencias antes de tomar decisiones operativas o descargar reportes."
 >
 <div className="grid gap-6">
 <ReportFiltersPanel
 filters={filters}
 requestTypes={requestTypes ?? []}
 workers={workers}
 showWorkerFilter={isManager}
 onChange={(patch) => setFilters((current) => ({ ...current, ...patch }))}
 onReset={resetFilters}
 />

 {isSummaryError ? (
 <ErrorState
 title="No se pudieron cargar las metricas"
 description={getErrorMessage(summaryError)}
 onRetry={() => void refetchSummary()}
 />
 ) : (
 <ReportSummaryCards summary={summary?.data} isLoading={isSummaryLoading} />
 )}

 {isChartError ? (
 <ErrorState
 title="No se pudo cargar el grafico"
 description={getErrorMessage(chartError)}
 onRetry={() => void refetchChart()}
 />
 ) : (
 <RequestChartsPanel
 chart={chart?.data}
 chartConfig={chartConfig}
 isLoading={isChartLoading}
 onConfigChange={(patch) => setChartConfig((current) => ({ ...current, ...patch }))}
 />
 )}
 </div>
 </ReportsLayout>
 );
}
