"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, Filter } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { FieldFrame, Input, Select } from "@/components/ui/fields";
import { requestReportColumnsCatalog } from "@/features/requests/requests-config";
import { formatDate, formatDateTime } from "@/lib/utils/format";
import { requestStatusLabels, requestStatusOptions } from "@/lib/utils/requests";
import { downloadReportPdf } from "@/services/reports/downloadReportPdf";
import { requestsService } from "@/services/requests.service";
import { useSession } from "@/features/auth/auth-provider";
import { useReportTemplates } from "@/hooks/useReportTemplates";
import { reportTemplatesApi } from "@/services/reportTemplatesApi";
import { ReportTemplateSelector } from "@/components/reports/ReportTemplateSelector";
import { SaveTemplateModal } from "@/components/reports/SaveTemplateModal";
import type {
 RequestReportColumn,
 RequestReportDownloadFormat,
 RequestReportFilters,
 RequestScope,
 RequestType,
} from "@/types/requests";
import type { ReportColumnKey } from "@/types/report.types";

import { ReportColumnSelector } from "@/components/requests/ReportColumnSelector";
import { ReportDownloadActions } from "@/components/requests/ReportDownloadActions";
import { ReportPreviewTable } from "@/components/requests/ReportPreviewTable";

interface RequestReportsPanelProps {
 requestTypes: RequestType[];
 scope: RequestScope;
}

const initialFilters: RequestReportFilters = {
 dateFrom: "",
 dateTo: "",
 typeId: "",
 status: "all",
 worker: "",
 department: "",
 company: "",
 approver: "",
 search: "",
 page: 1,
 pageSize: 50,
};

function getDefaultSelectedColumns(columns: RequestReportColumn[]) {
 const defaults = columns.filter((column) => column.defaultSelected).map((column) => column.id);
 return defaults.length ? defaults : columns.slice(0, 8).map((column) => column.id);
}

function formatPreviewCellValue(columnId: string, value: string) {
 if (!value || value === "-") return "-";

 if (columnId === "status") {
 const normalizedStatus = value.trim().toLowerCase();
 return requestStatusLabels[normalizedStatus as keyof typeof requestStatusLabels] ?? value;
 }

 if (["createdAt", "approvedAt", "created_at", "approved_at"].includes(columnId)) {
 return formatDateTime(value);
 }

 if (["startDate", "endDate", "start_date", "end_date"].includes(columnId)) {
 return formatDate(value);
 }

 return value;
}

function getErrorMessage(error: unknown) {
 return error instanceof Error ? error.message : "No se pudo completar la operacion.";
}

function normalizeFilterValue(value?: string) {
 return value?.trim() || "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
 return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getStringValue(record: Record<string, unknown>, key: string) {
 const value = record[key];
 return typeof value === "string" ? value : "";
}

function getTemplateStatus(value: unknown): RequestReportFilters["status"] {
 const allowedStatuses = new Set<RequestReportFilters["status"]>([
 "all",
 "draft",
 "pending",
 "approved",
 "observed",
 "rejected",
 "cancelled",
 "resubmitted",
 "unknown",
 ]);

 return typeof value === "string" && allowedStatuses.has(value as RequestReportFilters["status"]) ? value as RequestReportFilters["status"] : "all";
}

export function RequestReportsPanel({
 requestTypes,
 scope,
}: RequestReportsPanelProps) {
 const { user } = useSession();
 const queryClient = useQueryClient();
 const searchParams = useSearchParams();
 const urlTemplateId = searchParams.get("templateId");
 const [filters, setFilters] = useState<RequestReportFilters>(initialFilters);
 const [debouncedFilters, setDebouncedFilters] = useState<RequestReportFilters>(initialFilters);
 const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
 const [saveModalOpen, setSaveModalOpen] = useState(false);

 const prevQuickFieldsRef = useRef({
 dateFrom: filters.dateFrom,
 dateTo: filters.dateTo,
 typeId: filters.typeId,
 status: filters.status,
 });
 const prevQuickFields = prevQuickFieldsRef.current;

 const quickFieldsChanged =
 filters.dateFrom !== prevQuickFields.dateFrom ||
 filters.dateTo !== prevQuickFields.dateTo ||
 filters.typeId !== prevQuickFields.typeId ||
 filters.status !== prevQuickFields.status;

 if (quickFieldsChanged) {
 prevQuickFieldsRef.current = {
 dateFrom: filters.dateFrom,
 dateTo: filters.dateTo,
 typeId: filters.typeId,
 status: filters.status,
 };
 setDebouncedFilters(filters);
 }

 useEffect(() => {
 const timer = setTimeout(() => {
 setDebouncedFilters(filters);
 }, 400);

 return () => clearTimeout(timer);
 }, [filters]);

 const {
 data: reportColumns,
 isError: isReportColumnsError,
 } = useQuery({
 queryKey: ["request-report-columns"],
 queryFn: () => requestsService.getReportColumns(),
 staleTime: 300_000,
 });

 const { data: templates } = useReportTemplates();

 const saveTemplateMutation = useMutation({
 mutationFn: reportTemplatesApi.create,
 onSuccess: () => {
 toast.success("Plantilla guardada correctamente.");
 setSaveModalOpen(false);
 void queryClient.invalidateQueries({ queryKey: ["report-templates", "requests"] });
 },
 onError: (error) => toast.error(getErrorMessage(error)),
 });

 const availableColumns = useMemo(
 () => (reportColumns?.length ? reportColumns : requestReportColumnsCatalog),
 [reportColumns],
 );
 const [selectedColumns, setSelectedColumns] = useState<string[]>(() =>
 getDefaultSelectedColumns(requestReportColumnsCatalog),
 );
 const effectiveSelectedColumns = useMemo(() => {
 const availableIds = new Set(availableColumns.map((column) => column.id));
 const nextSelection = selectedColumns.filter((columnId) => availableIds.has(columnId));
 return nextSelection.length ? nextSelection : getDefaultSelectedColumns(availableColumns);
 }, [availableColumns, selectedColumns]);

 const selectedColumnDefinitions = useMemo(
 () => availableColumns.filter((column) => effectiveSelectedColumns.includes(column.id)),
 [availableColumns, effectiveSelectedColumns],
 );

 const {
 data: preview,
 error: previewError,
 isError: isPreviewError,
 isFetching: isPreviewFetching,
 isLoading: isPreviewLoading,
 refetch: refetchPreview,
 } = useQuery({
 queryKey: ["request-report-preview", scope, debouncedFilters, effectiveSelectedColumns],
 queryFn: () => requestsService.getReportPreview(scope, debouncedFilters, effectiveSelectedColumns),
 placeholderData: keepPreviousData,
 });

 const previewRows = useMemo(
 () =>
 (preview?.items ?? []).map((item) =>
 Object.fromEntries(
 effectiveSelectedColumns.map((columnId) => [
 columnId,
 formatPreviewCellValue(columnId, item.values[columnId] ?? "-"),
 ]),
 ),
 ),
 [effectiveSelectedColumns, preview?.items],
 );

 const downloadMutation = useMutation({
 mutationFn: async (format: RequestReportDownloadFormat) => {
 if (format === "pdf") {
 const columns = selectedColumnDefinitions.map((col) => ({
 key: col.id,
 label: col.label,
 }));

 await downloadReportPdf({
 endpoint: "/api/reports/requests/pdf",
 filename: "reporte-solicitudes.pdf",
 filters: debouncedFilters as Record<string, unknown>,
 customData: {
 columns,
 rows: previewRows,
 },
 });
 } else {
 await requestsService.downloadReport(format, scope, debouncedFilters, effectiveSelectedColumns);
 }
 },
 onSuccess: () => {
 void queryClient.invalidateQueries({ queryKey: ["request-report-preview"] });
 toast.success("La descarga del reporte se inicio correctamente.");
 },
 onError: (error) => {
 toast.error(getErrorMessage(error));
 },
 });

 const templateColumns = useMemo(
 () => effectiveSelectedColumns as ReportColumnKey[],
 [effectiveSelectedColumns],
 );

 const applyTemplate = useCallback((templateId: string) => {
 setSelectedTemplateId(templateId || null);
 if (!templateId) return;

 const template = templates?.find((entry) => entry.id === templateId);
 if (!template) return;

 const tFilters = isRecord(template.filters) ? template.filters : {};

 setFilters({
 dateFrom: getStringValue(tFilters, "dateFrom"),
 dateTo: getStringValue(tFilters, "dateTo"),
 typeId: getStringValue(tFilters, "typeId") || getStringValue(tFilters, "requestType"),
 status: getTemplateStatus(tFilters.status),
 worker: getStringValue(tFilters, "worker"),
 department: getStringValue(tFilters, "department"),
 company: getStringValue(tFilters, "company"),
 approver: getStringValue(tFilters, "approver"),
 search: getStringValue(tFilters, "search"),
 page: 1,
 pageSize: 50,
 });

 if (template.columns?.length) {
 setSelectedColumns(template.columns);
 }
 toast.success(`Plantilla "${template.name}" aplicada.`);
 }, [templates]);

 const prevUrlTemplateIdRef = useRef(urlTemplateId);
 const prevTemplatesDataRef = useRef(templates);

 if (urlTemplateId !== prevUrlTemplateIdRef.current || templates !== prevTemplatesDataRef.current) {
 prevUrlTemplateIdRef.current = urlTemplateId;
 prevTemplatesDataRef.current = templates;

 if (urlTemplateId && templates?.some((entry) => entry.id === urlTemplateId)) {
 const template = templates.find((entry) => entry.id === urlTemplateId);
 if (template) {
 setSelectedTemplateId(template.id);
 const tFilters = isRecord(template.filters) ? template.filters : {};
 setFilters({
 dateFrom: getStringValue(tFilters, "dateFrom"),
 dateTo: getStringValue(tFilters, "dateTo"),
 typeId: getStringValue(tFilters, "typeId") || getStringValue(tFilters, "requestType"),
 status: getTemplateStatus(tFilters.status),
 worker: getStringValue(tFilters, "worker"),
 department: getStringValue(tFilters, "department"),
 company: getStringValue(tFilters, "company"),
 approver: getStringValue(tFilters, "approver"),
 search: getStringValue(tFilters, "search"),
 page: 1,
 pageSize: 50,
 });

 if (template.columns?.length) {
 setSelectedColumns(template.columns);
 }
 }
 }
 }

 const filtersSummary = useMemo(() => {
 const summary: string[] = [];

 if (filters.dateFrom || filters.dateTo) {
 summary.push(`Registro: ${filters.dateFrom || "inicio"} - ${filters.dateTo || "hoy"}`);
 }
 if (filters.typeId) {
 const type = requestTypes.find((item) => item.id === filters.typeId);
 if (type) summary.push(`Tipo: ${type.name}`);
 }
 if (filters.status && filters.status !== "all") {
 summary.push(
 `Estado: ${requestStatusLabels[filters.status as keyof typeof requestStatusLabels] ?? filters.status}`,
 );
 }
 if (normalizeFilterValue(filters.worker)) summary.push(`Trabajador: ${normalizeFilterValue(filters.worker)}`);
 if (normalizeFilterValue(filters.department)) summary.push(`Area: ${normalizeFilterValue(filters.department)}`);
 if (normalizeFilterValue(filters.company)) summary.push(`Empresa/Sede: ${normalizeFilterValue(filters.company)}`);
 if (normalizeFilterValue(filters.approver)) summary.push(`Aprobador: ${normalizeFilterValue(filters.approver)}`);
 if (normalizeFilterValue(filters.search)) summary.push(`Keyword: ${normalizeFilterValue(filters.search)}`);

 return summary;
 }, [filters, requestTypes]);

 return (
 <div className="grid gap-6">
 <ReportTemplateSelector
 templates={templates ?? []}
 selectedTemplateId={selectedTemplateId}
 onSelect={applyTemplate}
 />

 <Card className="grid gap-5 p-5">
 <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
 <div className="grid gap-1">
 <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
 <BarChart3 className="size-3.5" />
 Reportes de solicitudes
 </div>
 <p className="text-sm text-foreground-soft">
 Filtra informacion real, selecciona columnas y revisa la vista previa antes de exportar.
 </p>
 </div>
 <div className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
 {preview?.total ?? 0} resultado(s)
 </div>
 </div>

 {isReportColumnsError ? (
 <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
 No se pudo cargar el catalogo de columnas desde la API. Se usara la configuracion base del frontend.
 </div>
 ) : null}

 <div className="grid gap-4 xl:grid-cols-4">
 <FieldFrame label="Rango de fechas desde">
 <Input
 type="date"
 value={filters.dateFrom ?? ""}
 onChange={(event) =>
 setFilters((current) => ({ ...current, dateFrom: event.target.value, page: 1 }))
 }
 />
 </FieldFrame>

 <FieldFrame label="Rango de fechas hasta">
 <Input
 type="date"
 value={filters.dateTo ?? ""}
 onChange={(event) =>
 setFilters((current) => ({ ...current, dateTo: event.target.value, page: 1 }))
 }
 />
 </FieldFrame>

 <FieldFrame label="Tipo de solicitud">
 <Select
 value={filters.typeId ?? ""}
 onChange={(event) =>
 setFilters((current) => ({ ...current, typeId: event.target.value, page: 1 }))
 }
 >
 <option value="">Todos</option>
 {requestTypes.map((type) => (
 <option key={type.id} value={type.id}>
 {type.name}
 </option>
 ))}
 </Select>
 </FieldFrame>

 <FieldFrame label="Estado de solicitud">
 <Select
 value={filters.status ?? "all"}
 onChange={(event) =>
 setFilters((current) => ({
 ...current,
 status: event.target.value as RequestReportFilters["status"],
 page: 1,
 }))
 }
 >
 {requestStatusOptions.map((option) => (
 <option key={option.value} value={option.value}>
 {option.label}
 </option>
 ))}
 </Select>
 </FieldFrame>
 </div>

 <div className="grid gap-4 xl:grid-cols-4">
 <FieldFrame label="Trabajador">
 <Input
 value={filters.worker ?? ""}
 onChange={(event) =>
 setFilters((current) => ({ ...current, worker: event.target.value, page: 1 }))
 }
 placeholder="Nombre del trabajador"
 />
 </FieldFrame>

 <FieldFrame label="Area o departamento">
 <Input
 value={filters.department ?? ""}
 onChange={(event) =>
 setFilters((current) => ({ ...current, department: event.target.value, page: 1 }))
 }
 placeholder="Area operativa"
 />
 </FieldFrame>

 <FieldFrame label="Empresa o sede">
 <Input
 value={filters.company ?? ""}
 onChange={(event) =>
 setFilters((current) => ({ ...current, company: event.target.value, page: 1 }))
 }
 placeholder="Empresa o sede"
 />
 </FieldFrame>

 <FieldFrame label="Responsable de aprobacion">
 <Input
 value={filters.approver ?? ""}
 onChange={(event) =>
 setFilters((current) => ({ ...current, approver: event.target.value, page: 1 }))
 }
 placeholder="Aprobador"
 />
 </FieldFrame>
 </div>

 <div className="grid gap-4 xl:grid-cols-[1fr_auto]">
 <FieldFrame label="Busqueda por palabra clave">
 <Input
 value={filters.search ?? ""}
 onChange={(event) =>
 setFilters((current) => ({ ...current, search: event.target.value, page: 1 }))
 }
 placeholder="Codigo, trabajador, motivo o comentario"
 />
 </FieldFrame>

 <div className="flex items-end">
 <button
 type="button"
 onClick={() => {
 setFilters(initialFilters);
 setSelectedTemplateId(null);
 }}
 className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
 >
 <Filter className="mr-2 size-4" />
 Limpiar filtros
 </button>
 </div>
 </div>
 </Card>

 <ReportColumnSelector
 columns={availableColumns}
 selectedColumns={effectiveSelectedColumns}
 onToggleColumn={(columnId) =>
 setSelectedColumns((current) =>
 current.includes(columnId)
 ? current.filter((item) => item !== columnId)
 : [...current, columnId],
 )
 }
 onSelectAll={() => setSelectedColumns(availableColumns.map((column) => column.id))}
 onClearSelection={() => setSelectedColumns([])}
 />

 <ReportDownloadActions
 totalRecords={preview?.total ?? 0}
 selectedColumnsCount={effectiveSelectedColumns.length}
 filtersSummary={filtersSummary}
 onDownload={(format) => {
 if (!effectiveSelectedColumns.length) {
 toast.error("Selecciona al menos una columna antes de descargar el reporte.");
 return;
 }

 downloadMutation.mutate(format);
 }}
 onSaveTemplate={() => setSaveModalOpen(true)}
 />

 <div className="relative">
 {isPreviewFetching && (
 <div className="absolute -top-12 right-0 flex items-center gap-1.5 rounded-full bg-muted/90 backdrop-blur-xs px-3 py-1.5 text-xs font-semibold text-foreground animate-pulse border border-border shadow-sm z-10">
 <span className="size-2 rounded-full bg-primary animate-ping" />
 Actualizando vista previa...
 </div>
 )}
 <div className={`transition-all duration-300 ${isPreviewFetching ? "opacity-60 pointer-events-none filter blur-[0.5px]" : ""}`}>
 {isPreviewLoading && !preview ? (
 <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-3xl bg-muted gap-3">
 <span className="size-8 rounded-full border-4 border-border border-t-brand animate-spin" />
 <p className="text-sm font-medium text-foreground-soft">Cargando vista previa de datos...</p>
 </div>
 ) : isPreviewError && !preview ? (
 <div className="flex flex-col items-center justify-center p-8 border border-red-100 rounded-3xl bg-red-50/50 gap-4">
 <div className="grid gap-1 text-center">
 <p className="text-sm font-semibold text-red-900">No se pudo cargar la vista previa</p>
 <p className="text-xs text-red-700/80 max-w-md">{getErrorMessage(previewError)}</p>
 </div>
 <button
 type="button"
 onClick={() => void refetchPreview()}
 className="inline-flex h-9 items-center justify-center rounded-xl bg-red-100 px-4 text-xs font-semibold text-red-800 hover:bg-red-200 transition"
 >
 Reintentar
 </button>
 </div>
 ) : (
 <ReportPreviewTable columns={selectedColumnDefinitions} rows={previewRows} />
 )}
 </div>
 </div>

 <SaveTemplateModal
 isOpen={saveModalOpen}
 isSubmitting={saveTemplateMutation.isPending}
 isDefaultAllowed={Boolean(user?.role === "admin" || user?.role === "hr")}
 filters={filters}
 columns={templateColumns}
 onClose={() => setSaveModalOpen(false)}
 onSubmit={(payload) => {
 saveTemplateMutation.mutate({
 ...payload,
 reportType: "requests",
 });
 }}
 />
 </div>
 );
}
