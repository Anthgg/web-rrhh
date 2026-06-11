import { Eye } from "lucide-react";

import { EmptyState } from "@/components/shared/states";
import { Card } from "@/components/ui/card";
import type { RequestReportColumn } from "@/types/requests";

interface ReportPreviewTableProps {
 columns: RequestReportColumn[];
 rows: Array<Record<string, string>>;
}

export function ReportPreviewTable({ columns, rows }: ReportPreviewTableProps) {
 if (!columns.length) {
 return (
 <EmptyState
 title="Selecciona columnas para la vista previa"
 description="Marca al menos un campo para construir la tabla que se exportara en el reporte."
 />
 );
 }

 if (!rows.length) {
 return (
 <EmptyState
 title="No hay registros para la vista previa"
 description="Los filtros aplicados no devolvieron resultados para este reporte."
 />
 );
 }

 return (
 <Card className="grid gap-4 p-5">
 <div className="flex items-center gap-2">
 <Eye className="size-4 text-primary" />
 <h3 className="text-lg font-semibold text-foreground">Vista previa del reporte</h3>
 </div>

 <div className="overflow-x-auto">
 <table className="min-w-full border-collapse">
 <thead className="bg-card-muted text-left">
 <tr>
 {columns.map((column) => (
 <th
 key={column.id}
 className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-foreground-soft"
 >
 {column.label}
 </th>
 ))}
 </tr>
 </thead>
 <tbody className="divide-y divide-border bg-card">
 {rows.map((row) => {
 const rowKey = columns.map((column) => row[column.id] || "").join("|");
 return (
 <tr key={rowKey} className="align-top hover:bg-muted/70">
 {columns.map((column) => (
 <td key={column.id} className="p-4 text-sm text-foreground">
 <div className="max-w-xs whitespace-pre-line text-sm leading-6 text-foreground">
 {row[column.id] || "-"}
 </div>
 </td>
 ))}
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </Card>
 );
}
