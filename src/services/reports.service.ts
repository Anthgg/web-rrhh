import axios from "axios";
import { apiClient } from "@/lib/api/client";
import { webApiEndpoints } from "@/lib/api/endpoints";
import type { ReportRecord } from "@/types";
export { extractBlobErrorCode } from "@/lib/api/error-handlers";

export const reportsService = {
 list: () => apiClient<ReportRecord[]>(webApiEndpoints.reports),
};

export interface DownloadWorkerLocationHistoryPdfParams {
 workerId: string;
 startDate?: string | null;
 endDate?: string | null;
}

const UUID_REGEX =
 /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DATE_YYYY_MM_DD_REGEX =
 /^\d{4}-\d{2}-\d{2}$/;

export function isUuid(value?: string | null): boolean {
 return typeof value === "string" && UUID_REGEX.test(value);
}

export function isValidDateParam(value?: string | null): boolean {
 if (!value) return true;
 return DATE_YYYY_MM_DD_REGEX.test(value);
}

export function isValidDateRange(
 startDate?: string | null,
 endDate?: string | null
): boolean {
 if (!isValidDateParam(startDate) || !isValidDateParam(endDate)) {
 return false;
 }

 if (startDate && endDate) {
 return startDate <= endDate;
 }

 return true;
}

export async function downloadWorkerLocationHistoryPdf({
 workerId,
 startDate,
 endDate,
}: DownloadWorkerLocationHistoryPdfParams) {
 if (!isUuid(workerId)) {
 throw new Error("INVALID_WORKER_ID");
 }

 if (!isValidDateRange(startDate, endDate)) {
 throw new Error("INVALID_DATE_RANGE");
 }

 const response = await axios.get(
 `/api/reports/workers/${workerId}/location-history/pdf`,
 {
 params: {
 ...(startDate ? { startDate } : {}),
 ...(endDate ? { endDate } : {}),
 },
 responseType: "blob",
 }
 );

 return response;
}

export function getFilenameFromContentDisposition(
 contentDisposition?: string | null,
 fallback = "historial_movimientos.pdf"
): string {
 if (!contentDisposition) return fallback;

 const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
 if (utf8Match?.[1]) {
 return decodeURIComponent(utf8Match[1].replace(/["]/g, ""));
 }

 const asciiMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
 if (asciiMatch?.[1]) {
 return asciiMatch[1].replace(/["]/g, "");
 }

 return fallback;
}

export function downloadBlob(blob: Blob, filename: string) {
 const url = window.URL.createObjectURL(blob);

 const link = document.createElement("a");
 link.href = url;
 link.download = filename;
 document.body.appendChild(link);
 link.click();

 link.remove();
 window.URL.revokeObjectURL(url);
}

export async function handleDownloadWorkerLocationHistoryPdf({
 workerId,
 startDate,
 endDate,
}: DownloadWorkerLocationHistoryPdfParams) {
 const response = await downloadWorkerLocationHistoryPdf({
 workerId,
 startDate,
 endDate,
 });

 const contentType = response.headers?.["content-type"] ?? response.headers?.["Content-Type"];

 if (contentType && !String(contentType).includes("application/pdf")) {
 throw new Error("INVALID_PDF_RESPONSE");
 }

 const contentDisposition =
 response.headers?.["content-disposition"] ??
 response.headers?.["Content-Disposition"];

 const filename = getFilenameFromContentDisposition(
 contentDisposition,
 `historial_movimientos_${workerId}.pdf`
 );

 const blob = new Blob([response.data], {
 type: "application/pdf",
 });

 downloadBlob(blob, filename);
}

export const WORKER_LOCATION_HISTORY_PDF_ERROR_MESSAGES: Record<string, string> = {
 INVALID_WORKER_ID: "El trabajador seleccionado no tiene un ID válido.",
 INVALID_DATE_RANGE: "El rango de fechas no es válido. Usa el formato YYYY-MM-DD o asegúrate de que la fecha de inicio sea menor o igual a la fecha de fin.",
 REPORT_FORBIDDEN: "No tienes permisos para descargar este reporte.",
 WORKER_NOT_FOUND: "No se encontró el trabajador seleccionado.",
 INVALID_PDF_RESPONSE: "El servidor no devolvió un PDF válido.",
};
