import { useQuery } from "@tanstack/react-query";

import { reportsApi } from "@/services/reportsApi";
import type { ChartConfig, ReportFilters } from "@/types/report.types";

export function useReportCharts(filters: ReportFilters, chartConfig: ChartConfig) {
 return useQuery({
 queryKey: ["report-charts", filters, chartConfig],
 queryFn: () => reportsApi.getCharts(filters, chartConfig),
 staleTime: 60_000,
 refetchOnWindowFocus: false,
 });
}
