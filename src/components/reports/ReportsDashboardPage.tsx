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

  const requestTypesQuery = useQuery({
    queryKey: ["report-request-types"],
    queryFn: requestsService.getTypes,
    staleTime: 5 * 60_000,
  });
  const workersQuery = useQuery({
    queryKey: ["report-workers"],
    queryFn: () => workersService.list({ page: 1, pageSize: 100 }),
    enabled: isManager,
    staleTime: 5 * 60_000,
  });
  const summaryQuery = useQuery({
    queryKey: ["report-summary", filters],
    queryFn: () => reportsApi.getSummary(filters),
    refetchOnWindowFocus: false,
  });
  const chartsQuery = useReportCharts(filters, chartConfig);

  const workers = useMemo(() => workersQuery.data?.items ?? [], [workersQuery.data]);

  return (
    <ReportsLayout
      title="Dashboard de solicitudes"
      description="Mide volumen, aprobaciones y tendencias antes de tomar decisiones operativas o descargar reportes."
    >
      <div className="grid gap-6">
        <ReportFiltersPanel
          filters={filters}
          requestTypes={requestTypesQuery.data ?? []}
          workers={workers}
          showWorkerFilter={isManager}
          onChange={(patch) => setFilters((current) => ({ ...current, ...patch }))}
          onReset={resetFilters}
        />

        {summaryQuery.isError ? (
          <ErrorState
            title="No se pudieron cargar las metricas"
            description={getErrorMessage(summaryQuery.error)}
            onRetry={() => void summaryQuery.refetch()}
          />
        ) : (
          <ReportSummaryCards summary={summaryQuery.data?.data} isLoading={summaryQuery.isLoading} />
        )}

        {chartsQuery.isError ? (
          <ErrorState
            title="No se pudo cargar el grafico"
            description={getErrorMessage(chartsQuery.error)}
            onRetry={() => void chartsQuery.refetch()}
          />
        ) : (
          <RequestChartsPanel
            chart={chartsQuery.data?.data}
            chartConfig={chartConfig}
            isLoading={chartsQuery.isLoading}
            onConfigChange={(patch) => setChartConfig((current) => ({ ...current, ...patch }))}
          />
        )}
      </div>
    </ReportsLayout>
  );
}
