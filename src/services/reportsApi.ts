"use client";

import { ApiClientError, apiClient } from "@/lib/api/client";
import { webApiEndpoints } from "@/lib/api/endpoints";
import type {
 ChartConfig,
 ReportExportFormat,
 ReportFilters,
 ReportPreviewRequest,
 ReportPreviewResponse,
 ReportSummaryResponse,
 ReportChartResponse,
 ReportColumnKey,
} from "@/types/report.types";

interface ReportRequestPayload {
 filters: ReportFilters;
 columns?: ReportColumnKey[];
 limit?: number;
 page?: number;
 templateId?: string;
}

function buildJsonBody(payload: unknown) {
 return JSON.stringify(payload);
}

function triggerUnauthorized() {
 if (typeof window !== "undefined") {
 window.dispatchEvent(new CustomEvent("auth:unauthorized"));
 }
}

async function parseErrorResponse(response: Response) {
 const payload = await response.json().catch(() => null) as
 | { message?: string; details?: unknown }
 | null;

 if (response.status === 401) {
 triggerUnauthorized();
 }

 throw new ApiClientError(
 payload?.message ?? "La solicitud no pudo completarse.",
 response.status,
 payload?.details,
 );
}

function resolveDownloadFilename(response: Response, fallback: string) {
 const disposition = response.headers.get("content-disposition") ?? "";
 const match = disposition.match(/filename\*?=(?:UTF-8''|")?([^\";]+)/i);
 return match?.[1] ? decodeURIComponent(match[1].replace(/"/g, "")) : fallback;
}

async function downloadBlob(endpoint: string, payload: ReportRequestPayload, fallbackName: string) {
 const response = await fetch(endpoint, {
 method: "POST",
 credentials: "same-origin",
 headers: {
 Accept: "*/*",
 "Content-Type": "application/json",
 },
 body: buildJsonBody(payload),
 cache: "no-store",
 });

 if (!response.ok) {
 return parseErrorResponse(response);
 }

 const blob = await response.blob();
 if (!blob.size) {
 throw new ApiClientError("No hay datos para descargar con los filtros seleccionados.", 422);
 }

 const objectUrl = URL.createObjectURL(blob);
 const anchor = document.createElement("a");
 anchor.href = objectUrl;
 anchor.download = resolveDownloadFilename(response, fallbackName);
 document.body.appendChild(anchor);
 anchor.click();
 anchor.remove();
 window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1200);
}

export const reportsApi = {
 getSummary: (filters: ReportFilters) =>
 apiClient<ReportSummaryResponse>(webApiEndpoints.requests.reportSummary, {
 method: "POST",
 body: { filters },
 }),
 getCharts: (filters: ReportFilters, chartConfig: ChartConfig) =>
 apiClient<ReportChartResponse>(webApiEndpoints.requests.reportCharts, {
 method: "POST",
 body: {
 filters,
 ...chartConfig,
 },
 }),
 getPreview: (payload: ReportPreviewRequest) =>
 apiClient<ReportPreviewResponse>(webApiEndpoints.requests.reportPreview, {
 method: "POST",
 body: payload,
 }),
 export: (format: ReportExportFormat, payload: ReportRequestPayload) =>
 downloadBlob(
 webApiEndpoints.requests.reportExport(format),
 payload,
 `reporte_solicitudes_${new Date().toISOString().slice(0, 10).replace(/-/g, "_")}.${format}`,
 ),
};
