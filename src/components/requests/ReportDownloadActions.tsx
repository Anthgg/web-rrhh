import { Download, FileSpreadsheet, FileText, Files, Save, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { RequestReportDownloadFormat } from "@/types/requests";

interface ReportDownloadActionsProps {
  totalRecords: number;
  selectedColumnsCount: number;
  filtersSummary: string[];
  onDownload: (format: RequestReportDownloadFormat) => void;
  onSaveTemplate?: () => void;
}

const downloadButtons: Array<{
  format: RequestReportDownloadFormat;
  label: string;
  icon: LucideIcon;
}> = [
  { format: "xlsx", label: "Descargar Excel", icon: FileSpreadsheet },
  { format: "pdf", label: "Descargar PDF", icon: FileText },
  { format: "csv", label: "Descargar CSV", icon: Files },
];

export function ReportDownloadActions({
  totalRecords,
  selectedColumnsCount,
  filtersSummary,
  onDownload,
  onSaveTemplate,
}: ReportDownloadActionsProps) {
  return (
    <Card className="grid gap-5 p-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid gap-1">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand">
            <Download className="size-3.5" />
            Descarga del reporte
          </div>
          <p className="text-sm text-ink-soft">
            {totalRecords} registro(s) encontrados · {selectedColumnsCount} columna(s) seleccionada(s)
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {downloadButtons.map((button) => {
            const Icon = button.icon;

            return (
              <Button
                key={button.format}
                variant={button.format === "pdf" ? "secondary" : "primary"}
                className="h-10 px-4"
                onClick={() => onDownload(button.format)}
              >
                <Icon className="mr-2 size-4" />
                {button.label}
              </Button>
            );
          })}
          {onSaveTemplate && (
            <Button
              variant="ghost"
              className="h-10 px-4 text-slate-700 hover:bg-slate-50 border border-slate-200"
              onClick={onSaveTemplate}
            >
              <Save className="mr-2 size-4" />
              Guardar plantilla
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
          Resumen de filtros aplicados
        </p>
        <div className="flex flex-wrap gap-2">
          {filtersSummary.length ? (
            filtersSummary.map((item) => (
              <span
                key={item}
                className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
              >
                {item}
              </span>
            ))
          ) : (
            <span className="text-sm text-ink-soft">Sin filtros adicionales aplicados.</span>
          )}
        </div>
      </div>
    </Card>
  );
}
