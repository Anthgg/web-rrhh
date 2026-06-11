import { useMutation } from "@tanstack/react-query";

import { reportsApi } from "@/services/reportsApi";
import type { ReportExportFormat, ReportFilters, ReportColumnKey } from "@/types/report.types";

export function useReportExport() {
 return useMutation({
 mutationFn: (payload: {
 format: ReportExportFormat;
 filters: ReportFilters;
 columns: ReportColumnKey[];
 templateId?: string;
 }) =>
 reportsApi.export(payload.format, {
 filters: payload.filters,
 columns: payload.columns,
 templateId: payload.templateId,
 }),
 });
}
