import {
  FileSpreadsheet,
  FileText,
  FileType2,
  Library,
  type LucideIcon,
  Power,
  PowerOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils/format";
import type { RequestTemplateItem, RequestTemplateFormat } from "@/types/requests";

const formatLabels: Record<RequestTemplateFormat, string> = {
  word: "Word",
  pdf: "PDF",
  excel: "Excel",
};

const formatIcons: Record<RequestTemplateFormat, LucideIcon> = {
  word: FileType2,
  pdf: FileText,
  excel: FileSpreadsheet,
};

interface RequestTemplateCardProps {
  template: RequestTemplateItem;
  onDownload: (template: RequestTemplateItem) => void;
}

export function RequestTemplateCard({
  template,
  onDownload,
}: RequestTemplateCardProps) {
  return (
    <Card className="grid gap-5 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-2">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand">
            <Library className="size-3.5" />
            {template.requestType}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-ink">{template.name}</h3>
            <p className="mt-2 text-sm leading-6 text-ink-soft">{template.description}</p>
          </div>
        </div>

        <div
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
            template.status === "active"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-200 text-slate-700"
          }`}
        >
          {template.status === "active" ? (
            <Power className="size-3.5" />
          ) : (
            <PowerOff className="size-3.5" />
          )}
          {template.status === "active" ? "Activa" : "Inactiva"}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {template.formats.map((format) => {
          const Icon = formatIcons[format];

          return (
            <span
              key={format}
              className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
            >
              <Icon className="size-3.5" />
              {formatLabels[format]}
            </span>
          );
        })}
      </div>

      <div className="rounded-[1.5rem] border border-border bg-slate-50/80 px-4 py-3 text-sm text-ink-soft">
        Ultima actualizacion: {formatDate(template.updatedAt)}
      </div>

      <Button
        variant={template.status === "active" ? "primary" : "secondary"}
        disabled={template.status !== "active"}
        onClick={() => onDownload(template)}
      >
        Descargar plantilla
      </Button>
    </Card>
  );
}
