import { apiClient } from "@/lib/api/client";
import { webApiEndpoints } from "@/lib/api/endpoints";
import type { ReportTemplate, SaveReportTemplatePayload } from "@/types/report.types";

export const reportTemplatesApi = {
  list: (module?: string) =>
    apiClient<ReportTemplate[]>(webApiEndpoints.reportTemplates.list, {
      query: module ? { module } : undefined,
    }),
  create: (payload: SaveReportTemplatePayload) =>
    apiClient<ReportTemplate>(webApiEndpoints.reportTemplates.list, {
      method: "POST",
      body: payload,
    }),
  update: (templateId: string, payload: SaveReportTemplatePayload) =>
    apiClient<ReportTemplate>(webApiEndpoints.reportTemplates.detail(templateId), {
      method: "PUT",
      body: payload,
    }),
  remove: (templateId: string) =>
    apiClient<{ success: boolean }>(webApiEndpoints.reportTemplates.detail(templateId), {
      method: "DELETE",
    }),
};
