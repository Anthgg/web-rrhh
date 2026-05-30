"use client";

import { LayoutTemplate } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/fields";
import { getTemplateOwnerLabel } from "@/features/reports/report-config";
import type { ReportTemplate } from "@/types/report.types";

export function ReportTemplateSelector({
  templates,
  selectedTemplateId,
  onSelect,
}: {
  templates: ReportTemplate[];
  selectedTemplateId?: string | null;
  onSelect: (templateId: string) => void;
}) {
  return (
    <Card className="grid gap-4 border-border bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="grid gap-1">
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand">
          <LayoutTemplate className="size-3.5" />
          Plantillas de reporte
        </div>
        <p className="text-sm text-ink-soft">
          Aplica una configuracion guardada para reutilizar filtros, columnas y graficos.
        </p>
      </div>

      <Select value={selectedTemplateId ?? ""} onChange={(event) => onSelect(event.target.value)}>
        <option value="">Sin plantilla</option>
        {templates.map((template) => (
          <option key={template.id} value={template.id}>
            {template.name} · {getTemplateOwnerLabel(template)}
          </option>
        ))}
      </Select>
    </Card>
  );
}
