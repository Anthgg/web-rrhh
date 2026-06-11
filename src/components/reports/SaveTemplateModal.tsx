"use client";

import { useEffect, useState, useRef } from "react";

import { RequestModalShell } from "@/components/requests/request-modal-shell";
import { Button } from "@/components/ui/button";
import { FieldFrame, Input, Select, Textarea } from "@/components/ui/fields";
import { REPORT_TEMPLATE_REPORT_TYPES } from "@/features/reports/report-config";
import type { ChartConfig, ReportColumnKey, ReportFilters, SaveReportTemplatePayload } from "@/types/report.types";

export function SaveTemplateModal({
 isOpen,
 isSubmitting = false,
 isDefaultAllowed,
 initialValue,
 filters,
 columns,
 chartConfig,
 onClose,
 onSubmit,
}: {
 isOpen: boolean;
 isSubmitting?: boolean;
 isDefaultAllowed: boolean;
 initialValue?: Partial<SaveReportTemplatePayload> & { id?: string };
 filters: ReportFilters;
 columns: ReportColumnKey[];
 chartConfig?: ChartConfig;
 onClose: () => void;
 onSubmit: (payload: SaveReportTemplatePayload) => void;
}) {
 const [name, setName] = useState(initialValue?.name ?? "");
 const [description, setDescription] = useState(initialValue?.description ?? "");
 const [reportType, setReportType] = useState(initialValue?.reportType ?? "requests_excel");
 const [isDefault, setIsDefault] = useState(Boolean(initialValue?.isDefault));

 const prevIsOpen = useRef(isOpen);
 const prevInitialValue = useRef(initialValue);

 if (isOpen !== prevIsOpen.current || initialValue !== prevInitialValue.current) {
 prevIsOpen.current = isOpen;
 prevInitialValue.current = initialValue;

 if (isOpen) {
 setName(initialValue?.name ?? "");
 setDescription(initialValue?.description ?? "");
 setReportType(initialValue?.reportType ?? "requests_excel");
 setIsDefault(Boolean(initialValue?.isDefault));
 }
 }

 return (
 <RequestModalShell
 isOpen={isOpen}
 onClose={onClose}
 title={initialValue?.id ? "Editar plantilla" : "Guardar plantilla"}
 subtitle="Guarda esta configuracion para reutilizar filtros, columnas y graficos."
 size="lg"
 footer={
 <div className="flex justify-end gap-2">
 <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
 Cancelar
 </Button>
 <Button
 onClick={() =>
 onSubmit({
 name,
 description,
 module: "requests",
 reportType,
 filters,
 columns,
 chartConfig,
 isDefault: isDefaultAllowed ? isDefault : false,
 })
 }
 disabled={isSubmitting || !name.trim() || !columns.length}
 >
 {initialValue?.id ? "Guardar cambios" : "Guardar plantilla"}
 </Button>
 </div>
 }
 >
 <div className="grid gap-4">
 <div className="grid gap-4 md:grid-cols-2">
 <FieldFrame label="Nombre de plantilla">
 <Input value={name} onChange={(event) => setName(event.target.value)} />
 </FieldFrame>

 <FieldFrame label="Tipo de reporte">
 <Select value={reportType} onChange={(event) => setReportType(event.target.value)}>
 {REPORT_TEMPLATE_REPORT_TYPES.map((option) => (
 <option key={option.value} value={option.value}>
 {option.label}
 </option>
 ))}
 </Select>
 </FieldFrame>
 </div>

 <FieldFrame label="Descripcion">
 <Textarea
 value={description}
 onChange={(event) => setDescription(event.target.value)}
 placeholder="Explica para que sirve esta plantilla y cuando deberia reutilizarse."
 />
 </FieldFrame>

 {isDefaultAllowed ? (
 <label className="flex items-center gap-3 rounded-[1.5rem] border border-border bg-muted px-4 py-3 text-sm text-foreground">
 <input
 type="checkbox"
 checked={isDefault}
 onChange={(event) => setIsDefault(event.target.checked)}
 className="size-4 rounded border-border text-primary focus:ring-primary/20"
 />
 Marcar como plantilla por defecto
 </label>
 ) : null}

 </div>
 </RequestModalShell>
 );
}
