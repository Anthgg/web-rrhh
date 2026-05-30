"use client";

import { CheckCheck, Columns3, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ReportColumnKey } from "@/types/report.types";

export function ReportColumnSelector({
  columns,
  selectedColumns,
  onToggleColumn,
  onSelectAll,
  onClearSelection,
}: {
  columns: Array<{ key: ReportColumnKey; label: string; description: string }>;
  selectedColumns: ReportColumnKey[];
  onToggleColumn: (columnId: ReportColumnKey) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
}) {
  return (
    <Card className="grid gap-5 border-border bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid gap-1">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand">
            <Columns3 className="size-3.5" />
            Columnas del reporte
          </div>
          <p className="text-sm text-ink-soft">
            La previsualizacion y la descarga usan exactamente esta seleccion.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" className="h-10 px-3" onClick={onSelectAll}>
            <CheckCheck className="mr-2 size-4" />
            Seleccionar todo
          </Button>
          <Button variant="secondary" className="h-10 px-3" onClick={onClearSelection}>
            <RotateCcw className="mr-2 size-4" />
            Limpiar
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {columns.map((column) => {
          const checked = selectedColumns.includes(column.key);

          return (
            <label
              key={column.key}
              className={`flex items-start gap-3 rounded-[1.5rem] border p-4 transition ${
                checked
                  ? "border-brand/25 bg-brand-soft/40"
                  : "border-border bg-white hover:border-brand/20 hover:bg-slate-50/80"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggleColumn(column.key)}
                className="mt-1 size-4 rounded border-border text-brand focus:ring-brand/20"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{column.label}</p>
                <p className="mt-1 text-xs leading-5 text-ink-soft">{column.description}</p>
              </div>
            </label>
          );
        })}
      </div>
    </Card>
  );
}
