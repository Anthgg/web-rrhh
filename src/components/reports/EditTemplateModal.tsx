"use client";

import { SaveTemplateModal } from "@/components/reports/SaveTemplateModal";
import type { ChartConfig, ReportColumnKey, ReportFilters, ReportTemplate, SaveReportTemplatePayload } from "@/types/report.types";

export function EditTemplateModal({
  template,
  isOpen,
  isSubmitting = false,
  isDefaultAllowed,
  filters,
  columns,
  chartConfig,
  onClose,
  onSubmit,
}: {
  template: ReportTemplate | null;
  isOpen: boolean;
  isSubmitting?: boolean;
  isDefaultAllowed: boolean;
  filters: ReportFilters;
  columns: ReportColumnKey[];
  chartConfig?: ChartConfig;
  onClose: () => void;
  onSubmit: (payload: SaveReportTemplatePayload) => void;
}) {
  return (
    <SaveTemplateModal
      isOpen={isOpen}
      isSubmitting={isSubmitting}
      isDefaultAllowed={isDefaultAllowed}
      initialValue={template ?? undefined}
      filters={filters}
      columns={columns}
      chartConfig={chartConfig}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}
