"use client";

import { Download, FileSpreadsheet, FileText, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function ReportExportActions({
 totalRecords,
 selectedColumnsCount,
 filtersSummary,
 isExporting = false,
 onPreview,
 onExportExcel,
 onExportPdf,
 onSaveTemplate,
}: {
 totalRecords: number;
 selectedColumnsCount: number;
 filtersSummary: string[];
 isExporting?: boolean;
 onPreview: () => void;
 onExportExcel: () => void;
 onExportPdf: () => void;
 onSaveTemplate: () => void;
}) {
 return (
 <Card className="grid gap-4 border-border bg-card/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
 <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
 <div className="grid gap-1">
 <h3 className="text-lg font-semibold text-foreground">Resumen previo a la exportacion</h3>
 <p className="text-sm text-foreground-soft">
 Confirma el alcance del reporte antes de descargar o guardar la plantilla.
 </p>
 </div>

 <div className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
 {totalRecords} registro(s) · {selectedColumnsCount} columna(s)
 </div>
 </div>

 {filtersSummary.length ? (
 <div className="flex flex-wrap gap-2">
 {filtersSummary.map((item) => (
 <span
 key={item}
 className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-foreground-soft"
 >
 {item}
 </span>
 ))}
 </div>
 ) : (
 <p className="text-sm text-foreground-soft">Sin filtros activos. Se consultara todo el alcance permitido.</p>
 )}

 <div className="flex flex-wrap gap-2">
 <Button onClick={onPreview}>
 <Download className="mr-2 size-4" />
 Previsualizar reporte
 </Button>
 <Button variant="secondary" onClick={onExportExcel} disabled={isExporting}>
 <FileSpreadsheet className="mr-2 size-4" />
 Exportar Excel
 </Button>
 <Button variant="secondary" onClick={onExportPdf} disabled={isExporting}>
 <FileText className="mr-2 size-4" />
 Exportar PDF
 </Button>
 <Button variant="ghost" onClick={onSaveTemplate}>
 <Save className="mr-2 size-4" />
 Guardar plantilla
 </Button>
 </div>
 </Card>
 );
}
