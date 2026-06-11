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
 <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
 <Columns3 className="size-3.5" />
 Seleccion de columnas
 </div>
 <p className="text-sm text-foreground-soft">
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
 ? "border-primary/20 bg-primary-soft/40"
 : "border-border bg-card hover:border-primary/20 hover:bg-muted/80"
 }`}
 >
 <input
 type="checkbox"
 checked={checked}
 onChange={() => onToggleColumn(column.id)}
 className="mt-1 size-4 rounded border-border text-primary focus:ring-primary/20"
 />
 <div className="min-w-0">
 <p className="text-sm font-semibold text-foreground">{column.label}</p>
 {column.description ? (
 <p className="mt-1 text-xs leading-5 text-foreground-soft">{column.description}</p>
 ) : null}
 </div>
 </label>
 );
 })}
 </div>
 </Card>
 );
}
