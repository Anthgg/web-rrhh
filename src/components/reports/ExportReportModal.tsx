"use client";

import { useRef, useState } from "react";
import { RequestModalShell } from "@/components/requests/request-modal-shell";
import { Button } from "@/components/ui/button";
import { useDownloadReportPdf } from "@/hooks/reports/useDownloadReportPdf";
import { type ReportPdfType } from "@/constants/reportEndpoints";
import { 
  FileText, 
  Loader2, 
  Filter, 
  Table, 
  Info,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: ReportPdfType;
  activeFilters?: object;
  tableData?: object[];
  tableColumns?: Array<{ key: string; label: string; widthRatio?: number }>;
  tableSummary?: Record<string, unknown>;
  filename?: string;
}

// Defaults estables a nivel de módulo — evitan crear nuevas referencias en cada render
const EMPTY_FILTERS = {} as object;
const EMPTY_TABLE_DATA: object[] = [];
const EMPTY_TABLE_COLUMNS: Array<{ key: string; label: string; widthRatio?: number }> = [];

const getRowValue = (row: object, key: string): unknown =>
  Object.prototype.hasOwnProperty.call(row, key) ? (row as Record<string, unknown>)[key] : undefined;

export function ExportReportModal({
  isOpen,
  onClose,
  reportType,
  activeFilters = EMPTY_FILTERS,
  tableData = EMPTY_TABLE_DATA,
  tableColumns = EMPTY_TABLE_COLUMNS,
  tableSummary,
  filename,
}: ExportReportModalProps) {
  const [exportMode, setExportMode] = useState<"filters" | "table">("filters");
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const activeFilterEntries = Object.entries(activeFilters);
  const activeFilterPayload = Object.fromEntries(activeFilterEntries);

  // useRef en lugar de useState para tracking — el valor solo se muta, nunca se lee en el render
  const prevIsOpenRef = useRef(isOpen);
  const prevTableColumnsRef = useRef(tableColumns);

  if (isOpen !== prevIsOpenRef.current || tableColumns !== prevTableColumnsRef.current) {
    prevIsOpenRef.current = isOpen;
    prevTableColumnsRef.current = tableColumns;
    if (isOpen) {
      setExportMode("filters");
      setSelectedColumns(tableColumns.map((c) => c.key));
    }
  }

  // Habilitado si hay datos y columnas de la tabla disponibles
  const isTableModeAvailable = tableData.length > 0 && tableColumns.length > 0;

  const { download, isDownloading } = useDownloadReportPdf(reportType, {
    onSuccess: () => {
      onClose();
    }
  });

  const handleToggleColumn = (key: string) => {
    setSelectedColumns(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleSelectAllColumns = () => {
    setSelectedColumns(tableColumns.map(c => c.key));
  };

  const handleDeselectAllColumns = () => {
    setSelectedColumns([]);
  };

  const handleConfirmDownload = () => {
    if (exportMode === "filters") {
      // Flujo A: Enviar filtros directamente
        download({
          filename,
        filters: activeFilterPayload,
      });
    } else {
      // Flujo B: Preparar y enviar estructura personalizada de datos
      const activeCols = tableColumns.filter(c => selectedColumns.includes(c.key));
      
      const customData = {
        columns: activeCols.map(c => ({
          key: c.key,
          label: c.label,
          widthRatio: c.widthRatio,
        })),
        rows: tableData.map(row => {
          const rowData: Record<string, unknown> = {};
          activeCols.forEach(col => {
            rowData[col.key] = getRowValue(row, col.key);
          });
          return rowData;
        }),
        summary: tableSummary,
      };

      download({
        filename,
        filters: activeFilterPayload,
        customData,
      });
    }
  };

  // Filtrar filtros vacíos o de control interno (ej. page, pageSize) para mostrarlos
  const visibleFilters = activeFilterEntries.filter(([key, val]) => {
    if (["page", "pageSize", "sortBy", "source"].includes(key)) return false;
    return val !== undefined && val !== null && val !== "" && val !== "all";
  });

  const modalFooter = (
    <div className="flex items-center justify-end gap-3">
      <Button variant="ghost" onClick={onClose} disabled={isDownloading} className="rounded-xl">
        Cancelar
      </Button>
      <Button
        onClick={handleConfirmDownload}
        disabled={isDownloading || (exportMode === "table" && selectedColumns.length === 0)}
        className="rounded-xl bg-blue-900 text-white hover:bg-blue-950 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isDownloading ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Generando PDF...
          </>
        ) : (
          <>
            <FileText className="mr-2 size-4" />
            Generar PDF corporativo
          </>
        )}
      </Button>
    </div>
  );

  return (
    <RequestModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Exportar reporte corporativo"
      subtitle="El documento se generará usando la plantilla oficial configurada para FABRYOR."
      size="lg"
      footer={modalFooter}
    >
      <div className="grid gap-6">
        {/* Selección de Modalidad */}
        <div className="grid gap-3">
          <span
            id="export-mode-label"
            className="text-sm font-semibold text-ink"
          >
            Modalidad de exportación
          </span>
          <div
            role="group"
            aria-labelledby="export-mode-label"
            className="grid gap-4 md:grid-cols-2"
          >
            {/* Opción A: Filtros */}
            <button
              type="button"
              onClick={() => setExportMode("filters")}
              className={cn(
                "flex flex-col text-left gap-2 rounded-2xl border p-4 transition-all duration-200 hover:scale-[1.01] hover:shadow-md",
                exportMode === "filters"
                  ? "border-brand bg-brand/5 ring-1 ring-brand"
                  : "border-slate-200 bg-white"
              )}
            >
              <div className="flex items-center gap-2">
                <div className={cn(
                  "flex size-8 items-center justify-center rounded-xl",
                  exportMode === "filters" ? "bg-brand/10 text-brand" : "bg-slate-100 text-slate-500"
                )}>
                  <Filter className="size-4" />
                </div>
                <span className="font-semibold text-ink">Usar filtros actuales</span>
              </div>
              <p className="text-xs text-ink-soft leading-5">
                Genera el reporte PDF consultando la base de datos con los filtros aplicados en el panel.
              </p>
            </button>

            {/* Opción B: Datos de Tabla */}
            <button
              type="button"
              disabled={!isTableModeAvailable}
              onClick={() => setExportMode("table")}
              className={cn(
                "flex flex-col text-left gap-2 rounded-2xl border p-4 transition-all duration-200",
                !isTableModeAvailable && "opacity-50 cursor-not-allowed bg-slate-50 border-slate-200",
                isTableModeAvailable && exportMode === "table"
                  ? "border-brand bg-brand/5 ring-1 ring-brand hover:scale-[1.01] hover:shadow-md"
                  : isTableModeAvailable && "border-slate-200 bg-white hover:scale-[1.01] hover:shadow-md"
              )}
            >
              <div className="flex items-center gap-2">
                <div className={cn(
                  "flex size-8 items-center justify-center rounded-xl",
                  exportMode === "table" ? "bg-brand/10 text-brand" : "bg-slate-100 text-slate-500"
                )}>
                  <Table className="size-4" />
                </div>
                <span className="font-semibold text-ink">Usar datos de la tabla</span>
              </div>
              <p className="text-xs text-ink-soft leading-5">
                Genera el PDF usando solo los datos cargados en pantalla, respetando columnas y orden actual.
              </p>
            </button>
          </div>
        </div>

        {/* Sección condicional: Filtros Activos (Modo Filtros) */}
        {exportMode === "filters" && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              <Filter className="size-3" />
              Filtros activos que se aplicarán
            </h4>
            {visibleFilters.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {visibleFilters.map(([key, val]) => (
                  <div key={key} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600">
                    <span className="font-medium text-slate-400 capitalize">{key.replace("_", " ")}:</span>
                    <span className="font-semibold text-slate-800">{String(val)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-ink-soft italic">Ningún filtro activo (se exportará todo el listado oficial).</p>
            )}

            <div className="mt-4 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-xl p-3 border border-amber-200/50">
              <Info className="size-4 shrink-0 mt-0.5" />
              <p className="leading-5">
                El backend procesará la consulta y generará el PDF corporativo completo basándose en estos filtros.
              </p>
            </div>
          </div>
        )}

        {/* Sección condicional: Selector de Columnas (Modo Tabla) */}
        {exportMode === "table" && isTableModeAvailable && (
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <span id="columns-selector-label" className="text-sm font-semibold text-ink">Seleccionar columnas a exportar</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllColumns}
                  className="text-xs font-semibold text-brand hover:underline"
                >
                  Seleccionar todas
                </button>
                <span className="text-xs text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleDeselectAllColumns}
                  className="text-xs font-semibold text-brand hover:underline"
                >
                  Limpiar
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {tableColumns.map(col => {
                const isChecked = selectedColumns.includes(col.key);
                return (
                  <label
                    key={col.key}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3 hover:bg-slate-50 transition cursor-pointer select-none",
                      isChecked ? "border-slate-300 bg-slate-50/70" : "border-slate-200 bg-white"
                    )}
                  >
                    <input
                      type="checkbox"
                      className="size-4.5 rounded border-slate-300 text-brand focus:ring-brand accent-brand"
                      checked={isChecked}
                      onChange={() => handleToggleColumn(col.key)}
                    />
                    <span className="text-xs font-medium text-ink">{col.label}</span>
                  </label>
                );
              })}
            </div>

            <div className="mt-2 rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-ink-soft flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              <span>
                Exportando <strong>{tableData.length}</strong> registros con <strong>{selectedColumns.length}</strong> columnas seleccionadas.
              </span>
            </div>
          </div>
        )}
      </div>
    </RequestModalShell>
  );
}
