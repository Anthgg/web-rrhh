"use client";

import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { BarChart3, Filter, FileText, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { FieldFrame, Input, Select } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
import { workCrewsService } from "@/services/work-crews.service";
import { organizationService } from "@/services/organization.service";
import { ReportColumnSelector } from "@/components/requests/ReportColumnSelector";
import { ReportPreviewTable } from "@/components/requests/ReportPreviewTable";
import { extractArray } from "@/lib/utils/extract-array";
import { CorporateExportModal } from "./CorporateExportModal";

const assignmentTypeOptions = [
 { value: "all", label: "Todos" },
 { value: "main_location", label: "Obra Principal" },
 { value: "temporary_transfer", label: "Transferido Temporal" },
];

const DEFAULT_COLUMNS = [
 "worker_name",
 "worker_document",
 "crew_name",
 "current_location_name",
 "assignment_status",
 "assigned_date",
 "assigned_time",
 "temporary_end_date",
 "temporary_end_time"
];

const REPORT_COLUMN_LABELS: Record<string, string> = {
 worker_name: "Trabajador",
 worker_document: "Documento",
 crew_name: "Cuadrilla",
 current_location_name: "Obra actual",
 assignment_status: "Estado asignacion",
 assigned_date: "Fecha ingreso",
 assigned_time: "Hora ingreso",
 temporary_end_date: "Fecha fin",
 temporary_end_time: "Hora fin",
};

const LEGACY_COLUMN_ALIASES: Record<string, string> = {
 document: "worker_document",
 start_date: "assigned_date",
 start_time: "assigned_time",
 end_date: "temporary_end_date",
 end_time: "temporary_end_time",
 assigned_at: "assigned_date",
};

const normalizeColumnKey = (key: string) => LEGACY_COLUMN_ALIASES[key] ?? key;

const formatPreviewValue = (value: unknown) => {
 if (value === null || value === undefined || value === "") return "-";
 if (value === "-") return "-";
 return String(value);
};

export function WorkCrewsReportBuilder() {
 const [filters, setFilters] = useState({
 search: "",
 crew_id: "",
 work_location_id: "",
 assignment_type: "all",
 date_range_start: "",
 date_range_end: "",
 page: 1,
 pageSize: 50,
 });

 const [debouncedFilters, setDebouncedFilters] = useState(filters);
 const [isExportPdfOpen, setIsExportPdfOpen] = useState(false);
 const [isExportExcelOpen, setIsExportExcelOpen] = useState(false);

 useEffect(() => {
 const timer = setTimeout(() => {
 setDebouncedFilters(filters);
 }, 400);
 return () => clearTimeout(timer);
 }, [filters]);

 const { data: crews } = useQuery({
 queryKey: ["work-crews"],
 queryFn: async () => {
 const data = await workCrewsService.getWorkCrews();
 return extractArray(data);
 },
 });

 const { data: locations } = useQuery({
 queryKey: ["work-locations"],
 queryFn: async () => {
 const data = await organizationService.getWorkLocations();
 return extractArray(data);
 },
 });

 const { data: reportColumns } = useQuery({
 queryKey: ["work-crews-report-columns"],
 queryFn: () => workCrewsService.getReportColumns(),
 staleTime: 300_000,
 });

 const availableColumns = useMemo(() => {
 const columnsByKey = new Map<string, { key: string; label: string; description?: string }>();

 for (const column of extractArray(reportColumns)) {
 const rawKey = String((column as any).key ?? (column as any).id ?? "");
 const key = normalizeColumnKey(rawKey);
 if (!key || key === "assigned_at") continue;

 columnsByKey.set(key, {
 key,
 label: REPORT_COLUMN_LABELS[key] ?? (column as any).label ?? key,
 description: (column as any).description,
 });
 }

 for (const key of DEFAULT_COLUMNS) {
 if (!columnsByKey.has(key)) {
 columnsByKey.set(key, {
 key,
 label: REPORT_COLUMN_LABELS[key] ?? key,
 });
 }
 }

 const recommendedColumns = DEFAULT_COLUMNS.map((key) => columnsByKey.get(key)).filter(
 (column): column is { key: string; label: string; description?: string } => Boolean(column),
 );
 const extraColumns = Array.from(columnsByKey.values()).filter(
 (column) => !DEFAULT_COLUMNS.includes(column.key),
 );

 return [...recommendedColumns, ...extraColumns];
 }, [reportColumns]);
 const [selectedColumnsOverride, setSelectedColumnsOverride] = useState<string[] | null>(null);
 const defaultSelectedColumns = useMemo(() => {
 if (!availableColumns.length) return [];
 const defaultColsToSelect = DEFAULT_COLUMNS.filter((col) =>
 availableColumns.some((c: any) => c.key === col)
 );
 return defaultColsToSelect.length > 0
 ? defaultColsToSelect
 : availableColumns.map((c: any) => c.key);
 }, [availableColumns]);
 const selectedColumns = selectedColumnsOverride ?? defaultSelectedColumns;

 const effectiveSelectedColumns = useMemo(() => {
 return availableColumns.filter((c: any) => selectedColumns.includes(c.key));
 }, [availableColumns, selectedColumns]);

 const payload = useMemo(() => ({
 filters: {
 search: debouncedFilters.search,
 crew_id: debouncedFilters.crew_id || null,
 work_location_id: debouncedFilters.work_location_id || null,
 assignment_type: debouncedFilters.assignment_type,
 date_range: {
 start: debouncedFilters.date_range_start || null,
 end: debouncedFilters.date_range_end || null,
 },
 },
 columns: selectedColumns,
 page: debouncedFilters.page,
 pageSize: debouncedFilters.pageSize,
 }), [debouncedFilters, selectedColumns]);

 const filterLabels = useMemo(() => {
 const crew = crews?.find((entry: any) => entry.id === debouncedFilters.crew_id);
 const location = locations?.find((entry: any) => entry.id === debouncedFilters.work_location_id);
 const assignmentType = assignmentTypeOptions.find((entry) => entry.value === debouncedFilters.assignment_type);

 return {
 crew_id: crew?.name ?? debouncedFilters.crew_id,
 work_location_id: location?.name ?? debouncedFilters.work_location_id,
 assignment_type: assignmentType?.label ?? debouncedFilters.assignment_type,
 date_range: [
 debouncedFilters.date_range_start || "inicio",
 debouncedFilters.date_range_end || "hoy",
 ].join(" - "),
 };
 }, [crews, debouncedFilters, locations]);

 const {
 data: preview,
 isError: isPreviewError,
 isFetching: isPreviewFetching,
 isLoading: isPreviewLoading,
 } = useQuery({
 queryKey: ["work-crews-report-preview", payload],
 queryFn: () => workCrewsService.getReportPreview(payload),
 placeholderData: keepPreviousData,
 enabled: selectedColumns.length > 0,
 });

 const previewRows = useMemo(() => {
 return (preview?.data || []).map((item: any) => {
 const row: Record<string, string> = {};
 effectiveSelectedColumns.forEach((col: any) => {
 row[col.key] = formatPreviewValue(item[col.key]);
 });
 return row;
 });
 }, [preview, effectiveSelectedColumns]);

 const handleExportPDF = async () => {
 if (selectedColumns.length === 0) {
 toast.error("Selecciona al menos una columna.");
 return;
 }
 setIsExportPdfOpen(true);
 };

 const handleExportExcel = async () => {
 if (selectedColumns.length === 0) {
 toast.error("Selecciona al menos una columna.");
 return;
 }
 setIsExportExcelOpen(true);
 };

 return (
 <div className="grid gap-6">
 <Card className="grid gap-5 p-5">
 <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
 <div className="grid gap-1">
 <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
 <BarChart3 className="size-3.5" />
 Reportes de Cuadrillas
 </div>
 <p className="text-sm text-foreground-soft">
 Filtra movimientos y trabajadores, selecciona columnas y revisa la vista previa antes de exportar.
 </p>
 </div>
 <div className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
 {preview?.total ?? 0} resultado(s)
 </div>
 </div>

 <div className="grid gap-4 xl:grid-cols-4">
 <FieldFrame label="Fecha Ingreso/Fin desde">
 <Input
 type="date"
 value={filters.date_range_start}
 onChange={(e) => setFilters(s => ({ ...s, date_range_start: e.target.value, page: 1 }))}
 />
 </FieldFrame>
 <FieldFrame label="Fecha Ingreso/Fin hasta">
 <Input
 type="date"
 value={filters.date_range_end}
 onChange={(e) => setFilters(s => ({ ...s, date_range_end: e.target.value, page: 1 }))}
 />
 </FieldFrame>
 <FieldFrame label="Cuadrilla Base">
 <Select
 value={filters.crew_id}
 onChange={(e) => setFilters(s => ({ ...s, crew_id: e.target.value, page: 1 }))}
 >
 <option value="">Todas</option>
 {crews?.map((c: any) => (
 <option key={c.id} value={c.id}>{c.name}</option>
 ))}
 </Select>
 </FieldFrame>
 <FieldFrame label="Obra Actual">
 <Select
 value={filters.work_location_id}
 onChange={(e) => setFilters(s => ({ ...s, work_location_id: e.target.value, page: 1 }))}
 >
 <option value="">Todas</option>
 {locations?.map((l: any) => (
 <option key={l.id} value={l.id}>{l.name}</option>
 ))}
 </Select>
 </FieldFrame>
 </div>

 <div className="grid gap-4 xl:grid-cols-[1fr_1fr_auto]">
 <FieldFrame label="BÃºsqueda libre">
 <Input
 value={filters.search}
 onChange={(e) => setFilters(s => ({ ...s, search: e.target.value, page: 1 }))}
 placeholder="Nombre, documento, correo..."
 />
 </FieldFrame>
 <FieldFrame label="Tipo de AsignaciÃ³n">
 <Select
 value={filters.assignment_type}
 onChange={(e) => setFilters(s => ({ ...s, assignment_type: e.target.value, page: 1 }))}
 >
 {assignmentTypeOptions.map((opt) => (
 <option key={opt.value} value={opt.value}>{opt.label}</option>
 ))}
 </Select>
 </FieldFrame>
 <div className="flex items-end">
 <button
 type="button"
 onClick={() => setFilters({
 search: "", crew_id: "", work_location_id: "", assignment_type: "all",
 date_range_start: "", date_range_end: "", page: 1, pageSize: 50
 })}
 className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
 >
 <Filter className="mr-2 size-4" />
 Limpiar filtros
 </button>
 </div>
 </div>
 </Card>

 {availableColumns.length > 0 && (
 <ReportColumnSelector
 columns={availableColumns.map((c: any) => ({ id: c.key, label: c.label }))}
 selectedColumns={selectedColumns}
 onToggleColumn={(colId) => setSelectedColumnsOverride((curr) => {
 const current = curr ?? selectedColumns;
 return current.includes(colId) ? current.filter(id => id !== colId) : [...current, colId];
 })}
 onSelectAll={() => setSelectedColumnsOverride(availableColumns.map((c: any) => c.key))}
 onClearSelection={() => setSelectedColumnsOverride([])}
 />
 )}

 <div className="flex flex-col sm:flex-row items-center gap-3 justify-end rounded-2xl border border-border bg-card p-4">
 <div className="mr-auto hidden text-sm font-semibold text-foreground sm:block">
 Exportar reporte
 </div>
 <Button variant="secondary" onClick={handleExportExcel} className="w-full gap-2 border-emerald-200 bg-card text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 sm:w-auto">
 <FileSpreadsheet className="size-4" />
 Descargar Excel
 </Button>
 <Button onClick={handleExportPDF} className="w-full sm:w-auto gap-2 bg-rose-600 hover:bg-rose-700 text-white border-transparent">
 <FileText className="size-4" />
 Descargar PDF
 </Button>
 </div>

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
 <p className="text-sm font-semibold text-red-900">No se pudo cargar la vista previa</p>
 </div>
 ) : (
 <ReportPreviewTable 
 columns={effectiveSelectedColumns.map((c: any) => ({ id: c.key, label: c.label }))} 
 rows={previewRows} 
 />
 )}
 </div>
 </div>
 <CorporateExportModal
 isOpen={isExportPdfOpen}
 onClose={() => setIsExportPdfOpen(false)}
 reportType="work-crews"
 exportFormat="pdf"
 activeFilters={payload.filters}
 activeFilterLabels={filterLabels}
 tableData={previewRows}
 tableColumns={effectiveSelectedColumns.map((c: any) => ({ key: c.key, label: c.label }))}
 tableSummary={{ total: preview?.total ?? previewRows.length }}
 filename="reporte-cuadrillas-movimientos.pdf"
 />
 <CorporateExportModal
 isOpen={isExportExcelOpen}
 onClose={() => setIsExportExcelOpen(false)}
 reportType="work-crews"
 exportFormat="excel"
 activeFilters={payload.filters}
 activeFilterLabels={filterLabels}
 tableData={previewRows}
 tableColumns={effectiveSelectedColumns.map((c: any) => ({ key: c.key, label: c.label }))}
 tableSummary={{ total: preview?.total ?? previewRows.length }}
 filename="reporte-cuadrillas-movimientos.xlsx"
 onDownload={({ filters, customData }) =>
 workCrewsService.downloadReport("excel", {
 filters,
 columns: customData?.columns.map((column) => column.key) ?? selectedColumns,
 customData,
 page: payload.page,
 pageSize: payload.pageSize,
 })
 }
 />
 </div>
 );
}
