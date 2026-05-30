import axios from "axios";
import { getClientAccessToken } from "@/lib/auth/client-token";

export interface CustomDataPayload {
  reportTitle?: string;
  documentType?: string;
  internalLabel?: string;
  columns: Array<{ key: string; label: string; widthRatio?: number }>;
  rows: Array<Record<string, unknown>>;
  summary?: Record<string, unknown>;
}

export interface DownloadReportParams {
  endpoint: string;
  filename?: string;
  filters?: Record<string, unknown>;
  reportTitle?: string;
  documentType?: string;
  internalLabel?: string;
  customData?: CustomDataPayload;
}

export class DownloadReportError extends Error {
  status?: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status?: number, code?: string, details?: unknown) {
    super(message);
    this.name = "DownloadReportError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Convierte un Blob de tipo de error a texto/JSON y lanza un error descriptivo.
 */
async function parseErrorBlob(blob: Blob, status: number): Promise<never> {
  let message = "Ocurrió un error al generar el reporte PDF corporativo.";
  let code = "UNKNOWN_ERROR";
  let details: unknown = null;

  try {
    const text = await blob.text();
    if (text) {
      try {
        const json = JSON.parse(text);
        if (json && typeof json === "object") {
          message = json.message || json.error || message;
          code = json.code || code;
          details = json.details || null;
        }
      } catch {
        // Si no es JSON, usamos el texto directo si no es gigante
        if (text.length < 500) {
          message = text;
        }
      }
    }
  } catch {
    // Error al leer el blob
  }

  // Mapeos adicionales según código de estado si el mensaje es genérico o no se extrajo nada
  if (status === 401) {
    message = "Sesión expirada o no válida. Por favor, vuelve a iniciar sesión.";
    code = "UNAUTHORIZED";
  } else if (status === 403) {
    message = "No tienes permisos para descargar este reporte corporativo.";
    code = "FORBIDDEN";
  } else if (status === 429) {
    message = "Has realizado demasiadas descargas seguidas. Por favor, espera un momento.";
    code = "RATE_LIMIT_EXCEEDED";
  } else if (status === 500 && (message === "Ocurrió un error al generar el reporte PDF corporativo." || message.includes("Internal Server Error"))) {
    message = "Error en el servidor de reportes de FABRYOR. Por favor, intente más tarde.";
    code = "INTERNAL_SERVER_ERROR";
  }

  throw new DownloadReportError(message, status, code, details);
}

/**
 * Realiza la descarga física de un reporte corporativo en PDF.
 */
export async function downloadReportPdf({
  endpoint,
  filename,
  filters,
  reportTitle,
  documentType,
  internalLabel,
  customData,
}: DownloadReportParams): Promise<void> {
  const token = getClientAccessToken();

  // Preparar el cuerpo del request envolviendo los filtros en el objeto "filters" como requiere el backend.
  // Si se envían tanto filtros como customData (Flujo B con contexto de filtros), se incluyen ambos.
  const payload: Record<string, unknown> = {};

  if (filters) {
    const normalizedFilters: Record<string, unknown> = { ...filters };
    // Normalizar filtros si vienen de la UI del workspace o panel de reportes de solicitudes
    if (
      "startDateFrom" in filters ||
      "startDateTo" in filters ||
      "submittedDateFrom" in filters ||
      "submittedDateTo" in filters ||
      "dateFrom" in filters ||
      "dateTo" in filters
    ) {
      normalizedFilters.start_date = (filters["startDateFrom"] || filters["submittedDateFrom"] || filters["dateFrom"] || "") as string;
      normalizedFilters.end_date = (filters["startDateTo"] || filters["submittedDateTo"] || filters["dateTo"] || "") as string;
      normalizedFilters.status = filters["status"] === "all" ? "" : ((filters["status"] as string) || "");
      normalizedFilters.worker_id = (filters["workerId"] || filters["worker_id"] || "") as string;
    }
    payload.filters = normalizedFilters;
  } else {
    payload.filters = {};
  }

  if (reportTitle) {
    payload.reportTitle = reportTitle;
  }
  if (documentType) {
    payload.documentType = documentType;
  }
  if (internalLabel) {
    payload.internalLabel = internalLabel;
  }

  if (customData) {
    payload.customData = customData;
  }

  try {
    const response = await axios.post(endpoint, payload, {
      responseType: "blob",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const blob = response.data;

    // Verificar si por error se devolvió un JSON en lugar del archivo binario
    if (blob.type === "application/json") {
      await parseErrorBlob(blob, response.status);
    }

    // Leer nombre del archivo desde Content-Disposition (ej. "reporte_asistencia_2026-05-20.pdf")
    const contentDisposition = response.headers["content-disposition"];
    let finalFilename = filename || "reporte.pdf";
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
      if (filenameMatch && filenameMatch[1]) {
        finalFilename = filenameMatch[1];
      } else {
        const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''(.+?)$/i);
        if (filenameStarMatch && filenameStarMatch[1]) {
          finalFilename = decodeURIComponent(filenameStarMatch[1]);
        }
      }
    }

    // Trigger para iniciar la descarga del PDF en el navegador
    const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", finalFilename.endsWith(".pdf") ? finalFilename : `${finalFilename}.pdf`);
    document.body.appendChild(link);
    link.click();

    // Cleanup del DOM y revocación de URL temporal
    if (link.parentNode) {
      link.parentNode.removeChild(link);
    }
    window.URL.revokeObjectURL(url);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const response = error.response;
      if (response && response.data instanceof Blob) {
        await parseErrorBlob(response.data, response.status || 500);
      }

      const status = response?.status;
      let message = "No se pudo conectar con el servidor de reportes.";
      if (status === 401) {
        message = "Sesión expirada o no válida. Por favor, vuelve a iniciar sesión.";
      } else if (status === 403) {
        message = "No tienes permisos para descargar este reporte corporativo.";
      } else if (status === 429) {
        message = "Has realizado demasiadas descargas seguidas. Por favor, espera un momento.";
      } else if (status === 500) {
        message = "Error en el servidor de reportes de FABRYOR. Por favor, intente más tarde.";
      }
      throw new DownloadReportError(message, status, undefined, response?.data);
    }

    throw new DownloadReportError(
      error instanceof Error ? error.message : "Error al descargar el PDF corporativo."
    );
  }
}
