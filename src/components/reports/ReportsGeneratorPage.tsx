"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { EditTemplateModal } from "@/components/reports/EditTemplateModal";
import { ErrorState } from "@/components/reports/ErrorState";
import { ReportColumnSelector } from "@/components/reports/ReportColumnSelector";
import { ReportExportActions } from "@/components/reports/ReportExportActions";
import { ReportFiltersPanel } from "@/components/reports/ReportFiltersPanel";
import { ReportPreviewTable } from "@/components/reports/ReportPreviewTable";
import { ReportsLayout } from "@/components/reports/ReportsLayout";
import { ReportTemplateSelector } from "@/components/reports/ReportTemplateSelector";
import { SaveTemplateModal } from "@/components/reports/SaveTemplateModal";
import { useReportExport } from "@/hooks/useReportExport";
import { useReportFilters } from "@/hooks/useReportFilters";
import { useReportPreview } from "@/hooks/useReportPreview";
import { useReportTemplates } from "@/hooks/useReportTemplates";
import { REPORT_COLUMNS, DEFAULT_REPORT_COLUMNS } from "@/features/reports/report-config";
import { reportTemplatesApi } from "@/services/reportTemplatesApi";
import { requestsService } from "@/services/requests.service";
import { workersService } from "@/services/workers.service";
import { useSession } from "@/features/auth/auth-provider";
import { isAdminRequestManager } from "@/lib/utils/requests";
import type {
 ChartConfig,
 ReportColumnKey,
 ReportPreviewRequest,
 ReportTemplate,
 SaveReportTemplatePayload,
} from "@/types/report.types";

function getErrorMessage(error: unknown) {
 return error instanceof Error ? error.message : "No se pudo completar la operacion.";
}

export function ReportsGeneratorPage() {
 const { user } = useSession();
 const isManager = isAdminRequestManager(user?.role);
 const queryClient = useQueryClient();
 const searchParams = useSearchParams();
 const selectedTemplateFromQuery = searchParams.get("templateId");
 const { filters, setFilters, resetFilters } = useReportFilters();
 const [selectedColumns, setSelectedColumns] = useState<ReportColumnKey[]>(DEFAULT_REPORT_COLUMNS);
 const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(selectedTemplateFromQuery);
 const [chartConfig, setChartConfig] = useState<ChartConfig>({
 groupBy: "worker",
 metric: "total_requests",
 limit: 10,
 });
 const [previewRequest, setPreviewRequest] = useState<ReportPreviewRequest | null>(null);
 const [saveModalOpen, setSaveModalOpen] = useState(false);
 const [editTemplate, setEditTemplate] = useState<ReportTemplate | null>(null);

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
 const { data: templates } = useReportTemplates();
 const {
 data: preview,
 error: previewError,
 isError: isPreviewError,
 isLoading: isPreviewLoading,
 refetch: refetchPreview,
 } = useReportPreview(previewRequest);
 const exportMutation = useReportExport();

 const saveTemplateMutation = useMutation({
 mutationFn: reportTemplatesApi.create,
 onSuccess: () => {
 toast.success("Plantilla guardada correctamente.");
 setSaveModalOpen(false);
 void queryClient.invalidateQueries({ queryKey: ["report-templates", "requests"] });
 },
 onError: (error) => toast.error(getErrorMessage(error)),
 });
 const updateTemplateMutation = useMutation({
 mutationFn: ({ id, payload }: { id: string; payload: SaveReportTemplatePayload }) =>
 reportTemplatesApi.update(id, payload),
 onSuccess: () => {
 toast.success("Plantilla actualizada correctamente.");
 setEditTemplate(null);
 void queryClient.invalidateQueries({ queryKey: ["report-templates", "requests"] });
 },
 onError: (error) => toast.error(getErrorMessage(error)),
 });

 const workers = useMemo(() => workersResponse?.items ?? [], [workersResponse]);

 const prevTemplateFromQueryRef = useRef(selectedTemplateFromQuery);
 const prevTemplatesDataRef = useRef(templates);

 if (
 selectedTemplateFromQuery !== prevTemplateFromQueryRef.current ||
 templates !== prevTemplatesDataRef.current
 ) {
 prevTemplateFromQueryRef.current = selectedTemplateFromQuery;
 prevTemplatesDataRef.current = templates;

 if (selectedTemplateFromQuery && templates?.length) {
 const template = templates.find((entry) => entry.id === selectedTemplateFromQuery);
 if (template) {
 setSelectedTemplateId(template.id);
 setFilters({
 ...template.filters,
 });
 setSelectedColumns(template.columns.length ? template.columns : DEFAULT_REPORT_COLUMNS);
 setChartConfig(template.chartConfig ?? { groupBy: "worker", metric: "total_requests", limit: 10 });
 }
 }
 }

 const selectedColumnDefinitions = useMemo(
 () => REPORT_COLUMNS.filter((column) => selectedColumns.includes(column.key)),
 [selectedColumns],
 );

 const filtersSummary = useMemo(() => {
 const summary: string[] = [];

 if (filters.dateFrom || filters.dateTo) {
 summary.push(`Rango: ${filters.dateFrom || "inicio"} - ${filters.dateTo || "hoy"}`);
 }
 if (filters.status) summary.push(`Estado: ${filters.status}`);
 if (filters.requestType) {
 const type = requestTypes?.find((entry) => entry.id === filters.requestType);
 summary.push(`Tipo: ${type?.name ?? filters.requestType}`);
 }
 if (filters.areaId) summary.push(`Area: ${filters.areaId}`);
 if (isManager && filters.workerId) {
 const worker = workers.find((entry) => entry.id === filters.workerId);
 summary.push(`Trabajador: ${worker?.fullName ?? filters.workerId}`);
 }

 return summary;
 }, [filters, isManager, requestTypes, workers]);

 const applyTemplate = (templateId: string) => {
 setSelectedTemplateId(templateId || null);
 if (!templateId) return;

 const template = templates?.find((entry) => entry.id === templateId);
 if (!template) return;

 setFilters({ ...template.filters });
 setSelectedColumns(template.columns.length ? template.columns : DEFAULT_REPORT_COLUMNS);
 setChartConfig(template.chartConfig ?? { groupBy: "worker", metric: "total_requests", limit: 10 });
 setPreviewRequest({
 filters: template.filters,
 columns: template.columns.length ? template.columns : DEFAULT_REPORT_COLUMNS,
 limit: 20,
 page: 1,
 templateId: template.id,
 });
 toast.success(`Plantilla "${template.name}" aplicada.`);
 };

 const runPreview = () => {
 if (!selectedColumns.length) {
 toast.error("Selecciona al menos una columna antes de previsualizar.");
 return;
 }

 setPreviewRequest({
 filters,
 columns: selectedColumns,
 limit: 20,
 page: 1,
 templateId: selectedTemplateId ?? undefined,
 });
 };

 const handleExport = (format: "xlsx" | "pdf") => {
 if (!selectedColumns.length) {
 toast.error("Selecciona al menos una columna antes de descargar.");
 return;
 }

 toast.message("Generando reporte...");
 exportMutation.mutate(
 {
 format,
 filters,
 columns: selectedColumns,
 templateId: selectedTemplateId ?? undefined,
 },
 {
 onSuccess: () => toast.success("Reporte descargado correctamente."),
 onError: (error) => toast.error(getErrorMessage(error)),
 },
 );
 };

 return (
 <ReportsLayout
 title="Generador dinamico de reportes"
 description="Previsualiza exactamente los datos que se exportaran y guarda configuraciones reutilizables por equipo o usuario."
 >
 <div className="grid gap-6">
 <ReportTemplateSelector
 templates={templates ?? []}
 selectedTemplateId={selectedTemplateId}
 onSelect={applyTemplate}
 />

 <ReportFiltersPanel
 filters={filters}
 requestTypes={requestTypes ?? []}
 workers={workers}
 showWorkerFilter={isManager}
 onChange={(patch) => setFilters((current) => ({ ...current, ...patch }))}
 onReset={() => {
 resetFilters();
 setSelectedColumns(DEFAULT_REPORT_COLUMNS);
 setSelectedTemplateId(null);
 }}
 />

 <ReportColumnSelector
 columns={REPORT_COLUMNS}
 selectedColumns={selectedColumns}
 onToggleColumn={(columnId) =>
 setSelectedColumns((current) =>
 current.includes(columnId)
 ? current.filter((entry) => entry !== columnId)
 : [...current, columnId],
 )
 }
 onSelectAll={() => setSelectedColumns(REPORT_COLUMNS.map((column) => column.key))}
 onClearSelection={() => setSelectedColumns([])}
 />

 <ReportExportActions
 totalRecords={preview?.total ?? 0}
 selectedColumnsCount={selectedColumns.length}
 filtersSummary={filtersSummary}
 isExporting={exportMutation.isPending}
 onPreview={runPreview}
 onExportExcel={() => handleExport("xlsx")}
 onExportPdf={() => handleExport("pdf")}
 onSaveTemplate={() => setSaveModalOpen(true)}
 />

 {isPreviewError ? (
 <ErrorState
 title="No se pudo cargar la previsualizacion del reporte."
 description={getErrorMessage(previewError)}
 onRetry={() => refetchPreview()}
 />
 ) : (
 <ReportPreviewTable
 columns={selectedColumnDefinitions.map((column) => ({
 key: column.key,
 label: column.label,
 }))}
 preview={preview}
 isLoading={isPreviewLoading}
 />
 )}
 </div>

 <SaveTemplateModal
 isOpen={saveModalOpen}
 isSubmitting={saveTemplateMutation.isPending}
 isDefaultAllowed={Boolean(user?.role === "admin" || user?.role === "hr")}
 filters={filters}
 columns={selectedColumns}
 chartConfig={chartConfig}
 onClose={() => setSaveModalOpen(false)}
 onSubmit={(payload) => saveTemplateMutation.mutate(payload)}
 />

 <EditTemplateModal
 template={editTemplate}
 isOpen={Boolean(editTemplate)}
 isSubmitting={updateTemplateMutation.isPending}
 isDefaultAllowed={Boolean(user?.role === "admin" || user?.role === "hr")}
 filters={filters}
 columns={selectedColumns}
 chartConfig={chartConfig}
 onClose={() => setEditTemplate(null)}
 onSubmit={(payload) => {
 if (!editTemplate) return;
 updateTemplateMutation.mutate({ id: editTemplate.id, payload });
 }}
 />
 </ReportsLayout>
 );
}
