import { CheckCheck, Columns3, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { RequestReportColumn } from "@/types/requests";

interface ReportColumnSelectorProps {
  columns: RequestReportColumn[];
  selectedColumns: string[];
  onToggleColumn: (columnId: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
}

export function ReportColumnSelector({
  columns,
  selectedColumns,
  onToggleColumn,
  onSelectAll,
  onClearSelection,
}: ReportColumnSelectorProps) {
  return (
    <Card className="grid gap-5 p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid gap-1">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand">
            <Columns3 className="size-3.5" />
            Seleccion de columnas
          </div>
          <p className="text-sm text-ink-soft">
            Marca solo los campos que deben verse en la vista previa y en la exportacion.
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
          const checked = selectedColumns.includes(column.id);

          return (
            <label
              key={column.id}
              className={`flex items-start gap-3 rounded-[1.5rem] border p-4 transition ${
                checked
                  ? "border-brand/20 bg-brand-soft/40"
                  : "border-border bg-white hover:border-brand/20 hover:bg-slate-50/80"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggleColumn(column.id)}
                className="mt-1 size-4 rounded border-border text-brand focus:ring-brand/20"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{column.label}</p>
                {column.description ? (
                  <p className="mt-1 text-xs leading-5 text-ink-soft">{column.description}</p>
                ) : null}
              </div>
            </label>
          );
        })}
      </div>
    </Card>
  );
}
