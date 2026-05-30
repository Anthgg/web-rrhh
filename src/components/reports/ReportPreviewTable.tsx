import { Eye } from "lucide-react";

import { EmptyState } from "@/components/reports/EmptyState";
import { Card } from "@/components/ui/card";
import type { ReportColumnKey, ReportPreviewResponse } from "@/types/report.types";

export function ReportPreviewTable({
  columns,
  preview,
  isLoading = false,
}: {
  columns: Array<{ key: ReportColumnKey; label: string }>;
  preview?: ReportPreviewResponse | null;
  isLoading?: boolean;
}) {
  if (!columns.length) {
    return (
      <EmptyState
        title="Selecciona columnas para la vista previa"
        description="No puedes previsualizar ni exportar hasta elegir al menos una columna."
      />
    );
  }

  if (isLoading && !preview) {
    return (
      <Card className="grid gap-4 p-5">
        <div className="h-5 w-40 animate-pulse rounded-full bg-surface-muted" />
        <div className="grid gap-3">
          <div className="h-14 animate-pulse rounded-3xl bg-surface-muted" />
          <div className="h-14 animate-pulse rounded-3xl bg-surface-muted" />
          <div className="h-14 animate-pulse rounded-3xl bg-surface-muted" />
        </div>
      </Card>
    );
  }

  if (!preview?.data.length) {
    return (
      <EmptyState
        title="No se encontraron registros para los filtros aplicados."
        description="Ajusta filtros o columnas y vuelve a ejecutar la previsualizacion."
      />
    );
  }

  return (
    <Card className="grid gap-4 border-border bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Eye className="size-4 text-brand" />
          <h3 className="text-lg font-semibold text-ink">Vista previa del reporte</h3>
        </div>
        <span className="text-sm text-ink-soft">
          Mostrando {preview.data.length} de {preview.total} registros
        </span>
      </div>

      <div className="overflow-x-auto rounded-[1.5rem] border border-border">
        <table className="min-w-full border-collapse">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-white">
            {preview.data.map((row, index) => (
              <tr key={`preview-${index}`} className="align-top hover:bg-slate-50/80">
                {columns.map((column) => (
                  <td key={column.key} className="p-4 text-sm text-ink">
                    <div className="max-w-sm whitespace-pre-line leading-6">
                      {String(row[column.key] ?? "-")}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
