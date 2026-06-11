"use client";

import { useState } from "react";
import { RequestModalShell } from "@/components/requests/request-modal-shell";
import { Button } from "@/components/ui/button";
import { useDownloadReportPdf } from "@/hooks/reports/useDownloadReportPdf";
import { type ReportPdfType } from "@/constants/reportEndpoints";
import {
 FileText,
 FileSpreadsheet,
 Loader2, 
 Filter, 
 Table, 
 Info,
 CheckCircle2,
 UsersRound,
 Building2,
 HardHat,
 ArrowRightLeft,
 ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { workCrewsService } from "@/services/work-crews.service";
import { toast } from "sonner";

export interface CorporateExportModalProps {
 isOpen: boolean;
 onClose: () => void;
 reportType: ReportPdfType;
 exportFormat?: "pdf" | "excel";
 activeFilters?: object;
 activeFilterLabels?: Record<string, string>;
 tableData?: object[];
 tableColumns?: Array<{ key: string; label: string; widthRatio?: number }>;
 tableSummary?: Record<string, unknown>;
 filename?: string;
 onDownload?: (payload: {
 filename?: string;
 filters: Record<string, unknown>;
 customData?: {
 columns: Array<{ key: string; label: string; widthRatio?: number }>;
 rows: Array<Record<string, unknown>>;
 summary?: Record<string, unknown>;
 };
 }) => Promise<void> | void;
}

const REPORT_TYPES = [
 { id: "crews", icon: UsersRound, label: "Reporte general de cuadrillas", desc: "Listado principal con supervisores y obras asignadas." },
 { id: "locations", icon: Building2, label: "Reporte por obras", desc: "Incluye trabajadores base, temporales recibidos, enviados y movimientos." },
 { id: "workers", icon: HardHat, label: "Reporte de trabajadores asignados", desc: "Listado de todo el personal activo en el sistema." },
 { id: "movements", icon: ArrowRightLeft, label: "Reporte de movimientos", desc: "Historial completo de transferencias entre cuadrillas u obras." },
 { id: "temp", icon: ArrowRight, label: "Reporte de movidos temporalmente", desc: "Solo el personal fuera de su ubicación base." },
];

const PDF_SECTIONS = [
 { id: "cover", label: "Portada corporativa" },
 { id: "summary", label: "Resumen ejecutivo" },
 { id: "metrics", label: "Métricas generales" },
 { id: "locations", label: "Detalle de obras" },
 { id: "workers", label: "Trabajadores por obra" },
 { id: "movements", label: "Movimientos laborales" },
 { id: "filters", label: "Filtros aplicados" },
 { id: "footer", label: "Firmas y pie corporativo" },
];

const EMPTY_FILTERS: Record<string, unknown> = {};
const EMPTY_FILTER_LABELS: Record<string, string> = {};
const EMPTY_TABLE_DATA: object[] = [];
const EMPTY_TABLE_COLUMNS: Array<{ key: string; label: string; widthRatio?: number }> = [];

const defaultFilterLabel = (key: string) =>
 key.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export function CorporateExportModal({
 isOpen,
 onClose,
 reportType: _unused,
 exportFormat: initialFormat = "excel",
 activeFilters = EMPTY_FILTERS,
 activeFilterLabels = EMPTY_FILTER_LABELS,
 tableData = EMPTY_TABLE_DATA,
 tableColumns = EMPTY_TABLE_COLUMNS,
 tableSummary,
 filename: defaultFilename,
 onDownload,
}: CorporateExportModalProps) {
 const [selectedFormat, setSelectedFormat] = useState<"pdf" | "excel">(initialFormat);
 const [exportMode, setExportMode] = useState<"filters" | "table">("filters");
 const [selectedReportType, setSelectedReportType] = useState("crews");
 const [selectedColumns, setSelectedColumns] = useState<string[]>(() => tableColumns.map(c => c.key));
 const [selectedPdfSections, setSelectedPdfSections] = useState<string[]>(() => PDF_SECTIONS.map(s => s.id));
 const [isBusy, setIsBusy] = useState(false);

 const activeFilterEntries = Object.entries(activeFilters);
 const activeFilterPayload = Object.fromEntries(activeFilterEntries);

 const isTableModeAvailable = tableData.length > 0 && tableColumns.length > 0;

 const handleClose = () => {
 setExportMode("filters");
 setSelectedReportType("crews");
 onClose();
 };

 const { download } = useDownloadReportPdf("work-crews", {
 onSuccess: () => {
 handleClose();
 setIsBusy(false);
 toast.success("Reporte generado correctamente.");
 },
 onError: () => {
 setIsBusy(false);
 toast.error("No se pudo generar el reporte. Inténtalo nuevamente.");
 }
 });

 const handleConfirmDownload = async () => {
 setIsBusy(true);

 try {
 const activeCols = tableColumns.filter(c => selectedColumns.includes(c.key));
 const customData = exportMode === "table" ? {
 columns: activeCols.map(c => ({ key: c.key, label: c.label, widthRatio: c.widthRatio })),
 rows: tableData.map(row => {
 const rowData: Record<string, unknown> = {};
 activeCols.forEach(col => {
 rowData[col.key] = (row as any)[col.key];
 });
 return rowData;
 }),
 summary: tableSummary,
 } : undefined;

 const dynamicFilename = defaultFilename || `reporte-${selectedReportType}-fabryor-${new Date().toISOString().split('T')[0]}.${selectedFormat}`;

 if (selectedFormat === "excel" && onDownload) {
 await onDownload({
 filename: dynamicFilename,
 filters: activeFilterPayload,
 customData,
 });
 toast.success("Reporte Excel generado correctamente.");
 handleClose();
 } else {
 download({
 filename: dynamicFilename,
 filters: activeFilterPayload,
 customData,
 });
 // success handled by hook
 }
 } catch (error) {
 toast.error("No se pudo generar el reporte. Inténtalo nuevamente.");
 } finally {
 if (selectedFormat === "excel") setIsBusy(false);
 }
 };

 const visibleFilters = activeFilterEntries.filter(([key, val]) => {
 if (["page", "pageSize", "sortBy", "source"].includes(key)) return false;
 return val !== undefined && val !== null && val !== "" && val !== "all" && val !== false;
 });

 const isReady = selectedFormat === "excel" ? selectedColumns.length > 0 : selectedPdfSections.length > 0;

 return (
 <RequestModalShell
 isOpen={isOpen}
 onClose={handleClose}
 title={`Exportar reporte corporativo en ${selectedFormat === 'excel' ? 'Excel' : 'PDF'}`}
 subtitle="El documento se generará usando la plantilla oficial configurada para FABRYOR."
 size="xl"
 footer={
 <div className="flex items-center justify-between w-full">
 <p className="text-xs text-muted-foreground hidden sm:block">
 Formato corporativo oficial de FABRYOR v2.0
 </p>
 <div className="flex items-center gap-3 ml-auto">
 <Button variant="ghost" onClick={handleClose} disabled={isBusy} className="rounded-xl">
 Cancelar
 </Button>
 <Button
 onClick={handleConfirmDownload}
 disabled={isBusy || !isReady}
 className={cn(
 "rounded-xl text-white font-medium shadow-sm transition-all",
 selectedFormat === "excel" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
 )}
 >
 {isBusy ? (
 <><Loader2 className="mr-2 size-4 animate-spin" /> Generando {selectedFormat.toUpperCase()}...</>
 ) : (
 <>
 {selectedFormat === "excel" ? <FileSpreadsheet className="mr-2 size-4" /> : <FileText className="mr-2 size-4" />}
 Generar {selectedFormat === "excel" ? "Excel" : "PDF"} corporativo
 </>
 )}
 </Button>
 </div>
 </div>
 }
 >
 <div className="grid lg:grid-cols-[1fr_300px] gap-8">
 <div className="flex flex-col gap-8">
 
 {/* Tipo de Reporte */}
 <section>
 <h4 className="text-sm font-bold text-foreground mb-3">1. Tipo de reporte</h4>
 <div className="grid sm:grid-cols-2 gap-3">
 {REPORT_TYPES.map(type => {
 const Icon = type.icon;
 const isSelected = selectedReportType === type.id;
 return (
 <button
 key={type.id}
 onClick={() => setSelectedReportType(type.id)}
 className={cn(
 "flex items-start gap-3 p-3 rounded-xl border text-left transition-all hover:shadow-sm",
 isSelected ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600/20" : "border-border bg-card hover:border-slate-300"
 )}
 >
 <div className={cn("p-2 rounded-lg mt-0.5", isSelected ? "bg-indigo-100 text-indigo-700" : "bg-muted text-muted-foreground")}>
 <Icon className="size-4" />
 </div>
 <div>
 <p className={cn("text-sm font-semibold", isSelected ? "text-indigo-900" : "text-foreground")}>{type.label}</p>
 <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{type.desc}</p>
 </div>
 </button>
 );
 })}
 </div>
 </section>

 {/* Modalidad de Exportación */}
 <section>
 <h4 className="text-sm font-bold text-foreground mb-3">2. Modalidad de datos</h4>
 <div className="grid sm:grid-cols-2 gap-3">
 <button
 onClick={() => setExportMode("filters")}
 className={cn(
 "p-4 rounded-xl border text-left transition-all",
 exportMode === "filters" ? "border-border bg-foreground text-white shadow-md" : "border-border bg-card text-muted-foreground hover:bg-muted"
 )}
 >
 <div className="flex items-center justify-between mb-1">
 <span className="font-semibold text-sm flex items-center gap-2">
 <Filter className="size-4" /> Usar filtros actuales
 </span>
 {exportMode === "filters" && <CheckCircle2 className="size-4 text-emerald-400" />}
 </div>
 <p className={cn("text-xs leading-relaxed", exportMode === "filters" ? "text-slate-300" : "text-muted-foreground")}>
 Genera el reporte consultando la base de datos con los filtros aplicados en el panel de forma completa.
 </p>
 </button>

 <button
 disabled={!isTableModeAvailable}
 onClick={() => setExportMode("table")}
 className={cn(
 "p-4 rounded-xl border text-left transition-all",
 !isTableModeAvailable && "opacity-50 cursor-not-allowed bg-muted",
 isTableModeAvailable && exportMode === "table" ? "border-border bg-foreground text-white shadow-md" : "border-border bg-card text-muted-foreground hover:bg-muted"
 )}
 >
 <div className="flex items-center justify-between mb-1">
 <span className="font-semibold text-sm flex items-center gap-2">
 <Table className="size-4" /> Usar datos de la tabla
 </span>
 {exportMode === "table" && <CheckCircle2 className="size-4 text-emerald-400" />}
 </div>
 <p className={cn("text-xs leading-relaxed", exportMode === "table" ? "text-slate-300" : "text-muted-foreground")}>
 Genera el reporte usando solo los datos visibles actualmente en pantalla (WYSIWYG).
 </p>
 </button>
 </div>
 </section>

 {/* Configuración Dinámica */}
 <section>
 <div className="flex items-center justify-between mb-3">
 <h4 className="text-sm font-bold text-foreground">
 3. {selectedFormat === "excel" ? "Columnas a incluir" : "Secciones a incluir en el PDF"}
 </h4>
 <button 
 onClick={() => selectedFormat === "excel" ? setSelectedColumns(tableColumns.map(c=>c.key)) : setSelectedPdfSections(PDF_SECTIONS.map(s=>s.id))}
 className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
 >
 Seleccionar todas
 </button>
 </div>
 
 <div className="bg-muted border border-border rounded-xl p-4">
 {selectedFormat === "excel" ? (
 <div className="flex flex-wrap gap-2">
 {tableColumns.map(col => {
 const checked = selectedColumns.includes(col.key);
 return (
 <label key={col.key} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer select-none transition-colors", checked ? "bg-card border-indigo-200 shadow-sm" : "bg-transparent border-transparent text-muted-foreground hover:bg-slate-200/50")}>
 <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-600" checked={checked} onChange={() => {
 setSelectedColumns(prev => prev.includes(col.key) ? prev.filter(k => k !== col.key) : [...prev, col.key]);
 }} />
 <span className="text-xs font-medium">{col.label}</span>
 </label>
 );
 })}
 {tableColumns.length === 0 && <p className="text-xs text-muted-foreground italic p-2">No hay columnas configuradas para seleccionar.</p>}
 </div>
 ) : (
 <div className="grid grid-cols-2 gap-2">
 {PDF_SECTIONS.map(sec => {
 const checked = selectedPdfSections.includes(sec.id);
 return (
 <label key={sec.id} className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer select-none transition-colors", checked ? "bg-card border-rose-200 shadow-sm" : "bg-transparent border-transparent text-muted-foreground hover:bg-slate-200/50")}>
 <input type="checkbox" className="rounded text-rose-600 focus:ring-rose-600" checked={checked} onChange={() => {
 setSelectedPdfSections(prev => prev.includes(sec.id) ? prev.filter(k => k !== sec.id) : [...prev, sec.id]);
 }} />
 <span className="text-xs font-medium">{sec.label}</span>
 </label>
 );
 })}
 </div>
 )}
 </div>
 </section>

 </div>

 {/* Sidebar Summary */}
 <div className="flex flex-col gap-6">
 
 <div className="bg-muted rounded-2xl p-5 border border-border">
 <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
 <Filter className="size-3.5" /> Filtros aplicados
 </h4>
 
 {visibleFilters.length > 0 ? (
 <div className="flex flex-col gap-2">
 {visibleFilters.map(([key, val]) => (
 <div key={key} className="flex flex-col bg-card border border-border p-2 rounded-lg">
 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{activeFilterLabels[key] || defaultFilterLabel(key)}</span>
 <span className="text-xs font-medium text-foreground truncate" title={String(val)}>{String(val)}</span>
 </div>
 ))}
 </div>
 ) : (
 <div className="text-center p-4 bg-card rounded-xl border border-border">
 <p className="text-xs text-muted-foreground font-medium">No hay filtros activos.</p>
 <p className="text-[11px] text-muted-foreground mt-1">Se exportarÃ¡ toda la informaciÃ³n disponible en la base de datos.</p>
 </div>
 )}
 </div>

 <div className="bg-indigo-900 rounded-2xl p-5 border border-indigo-950 text-white shadow-inner flex flex-col h-full">
 <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-4">Resumen de ExportaciÃ³n</h4>
 
 <div className="flex flex-col gap-3 flex-1 text-sm text-indigo-100">
 <div className="flex justify-between border-b border-indigo-800/50 pb-2">
 <span className="text-indigo-300">Formato:</span>
 <span className="font-bold uppercase">{selectedFormat} Corporativo</span>
 </div>
 <div className="flex justify-between border-b border-indigo-800/50 pb-2">
 <span className="text-indigo-300">Reporte:</span>
 <span className="font-medium text-right max-w-[150px] truncate" title={REPORT_TYPES.find(t=>t.id===selectedReportType)?.label}>
 {REPORT_TYPES.find(t=>t.id===selectedReportType)?.label}
 </span>
 </div>
 <div className="flex justify-between border-b border-indigo-800/50 pb-2">
 <span className="text-indigo-300">Origen:</span>
 <span className="font-medium text-right">{exportMode === "table" ? "Tabla actual" : "Base de datos (Filtros)"}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-indigo-300">Seleccionado:</span>
 <span className="font-medium text-right">
 {selectedFormat === "excel" ? `${selectedColumns.length} columnas` : `${selectedPdfSections.length} secciones`}
 </span>
 </div>
 </div>

 <div className="mt-6 pt-4 border-t border-indigo-800">
 <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold mb-1">Archivo a generar</p>
 <p className="text-xs font-medium text-indigo-200 truncate" title={`reporte-${selectedReportType}-fabryor.${selectedFormat}`}>
 reporte-{selectedReportType}-fabryor.{selectedFormat}
 </p>
 </div>
 </div>

 </div>
 </div>
 </RequestModalShell>
 );
}
