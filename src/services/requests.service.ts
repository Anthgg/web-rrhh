import { ApiClientError, apiClient } from "@/lib/api/client";
import { webApiEndpoints } from "@/lib/api/endpoints";
import { buildRequestQueryFilters, requestDefaultStats } from "@/lib/utils/requests";
import type {
  CreateRequestPayload,
  PaginatedRequestReportRowsResponse,
  PaginatedRequestsResponse,
  RequestAttachment,
  RequestDetail,
  RequestListFilters,
  RequestReportColumn,
  RequestReportDownloadFormat,
  RequestReportFilters,
  RequestScope,
  RequestStats,
  RequestTemplateItem,
  RequestType,
  ResubmitRequestPayload,
  ReviewRequestPayload,
  UpdateRequestPayload,
  UploadRequestDocumentsPayload,
} from "@/types/requests";

const requestStatsCache = new Map<string, { expiresAt: number; value: RequestStats }>();
const inflightRequestStats = new Map<string, Promise<RequestStats>>();
const requestStatsTtlMs = 60_000;

function buildQuery(input?: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(input ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

function resolveListEndpoint(scope: RequestScope) {
  if (scope === "my") return webApiEndpoints.requests.my;
  if (scope === "pending") return webApiEndpoints.requests.pending;
  return webApiEndpoints.requests.list;
}

function createRequestBody(payload: CreateRequestPayload) {
  if (!payload.documents?.length) {
    return {
      requestTypeId: payload.requestTypeId,
      startDate: payload.startDate,
      endDate: payload.endDate,
      reason: payload.reason,
    };
  }

  const formData = new FormData();
  formData.set("requestTypeId", payload.requestTypeId);
  formData.set("startDate", payload.startDate);
  formData.set("reason", payload.reason);

  if (payload.endDate) {
    formData.set("endDate", payload.endDate);
  }

  payload.documents.forEach((document) => {
    formData.append("documents", document);
  });

  return formData;
}

function createUpdateBody(payload: UpdateRequestPayload) {
  return {
    requestTypeId: payload.requestTypeId,
    startDate: payload.startDate,
    endDate: payload.endDate,
    reason: payload.reason,
  };
}

function createDocumentsFormData(payload: UploadRequestDocumentsPayload) {
  const formData = new FormData();

  payload.documents.forEach((document) => {
    formData.append("documents", document);
  });

  if (payload.documentType) {
    formData.set("documentType", payload.documentType);
  }

  return formData;
}

function buildRequestReportQuery(
  filters: RequestReportFilters,
  scope: RequestScope,
  columns?: string[],
) {
  return {
    page: filters.page,
    limit: filters.pageSize,
    scope,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    status: filters.status && filters.status !== "all" ? filters.status : undefined,
    requestTypeId: filters.typeId || undefined,
    typeId: filters.typeId || undefined,
    worker: filters.worker?.trim() || undefined,
    department: filters.department?.trim() || undefined,
    company: filters.company?.trim() || undefined,
    approver: filters.approver?.trim() || undefined,
    search: filters.search?.trim() || undefined,
    columns: columns?.length ? columns.join(",") : undefined,
  };
}

function resolveDownloadFileName(
  disposition: string | null,
  fallback: string,
) {
  if (!disposition) return fallback;

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const basicMatch = disposition.match(/filename="?([^"]+)"?/i);
  return basicMatch?.[1] ?? fallback;
}

async function downloadFile(endpoint: string, fallbackFileName: string) {
  const response = await fetch(endpoint, {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string; details?: unknown } | null;
    throw new ApiClientError(
      payload?.message ?? "No se pudo completar la descarga.",
      response.status,
      payload?.details,
    );
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = resolveDownloadFileName(
    response.headers.get("content-disposition"),
    fallbackFileName,
  );
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

async function downloadFilePost(endpoint: string, body: unknown, fallbackFileName: string) {
  const response = await fetch(endpoint, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      Accept: "*/*",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string; details?: unknown } | null;
    throw new ApiClientError(
      payload?.message ?? "No se pudo completar la descarga.",
      response.status,
      payload?.details,
    );
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = resolveDownloadFileName(
    response.headers.get("content-disposition"),
    fallbackFileName,
  );
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

async function listByScope(scope: RequestScope, filters: RequestListFilters) {
  return apiClient<PaginatedRequestsResponse>(resolveListEndpoint(scope), {
    query: buildRequestQueryFilters(filters),
  });
}

function buildRequestStatsCacheKey(scope: RequestScope, filters: RequestListFilters) {
  const normalizedFilters = { ...filters };
  delete normalizedFilters.page;
  delete normalizedFilters.pageSize;
  return JSON.stringify({ scope, filters: normalizedFilters });
}

function sleep(ms: number) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms));
}

export const requestsService = {
  list: (scope: RequestScope, filters: RequestListFilters) => listByScope(scope, filters),
  getStats: async (scope: RequestScope, filters: RequestListFilters): Promise<RequestStats> => {
    const baseFilters = {
      ...filters,
      page: 1,
      pageSize: 1,
      status: "all" as const,
    };
    const cacheKey = buildRequestStatsCacheKey(scope, baseFilters);
    const now = Date.now();
    const cached = requestStatsCache.get(cacheKey);

    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    const inflight = inflightRequestStats.get(cacheKey);
    if (inflight) {
      return inflight;
    }

    const fetchStatsPromise = (async () => {
      try {
        const total = await listByScope(scope, baseFilters);
        const nextStats: RequestStats = {
          total: total.total,
          pending: 0,
          approved: 0,
          rejected: 0,
          observed: 0,
          cancelled: 0,
        };

        const statuses: Array<keyof Omit<RequestStats, "total">> = [
          "pending",
          "approved",
          "rejected",
          "observed",
          "cancelled",
        ];

        // NOTE: Las llamadas se hacen de forma secuencial con un delay intencional
        // entre cada una para evitar errores 429 del backend. No paralelizar.
        for (const status of statuses) {
          try {
            const response = await listByScope(scope, { ...baseFilters, status });
            nextStats[status] = response.total;
          } catch (error) {
            if (error instanceof ApiClientError && error.status === 429) {
              const fallback = requestStatsCache.get(cacheKey)?.value ?? cached?.value;
              return fallback
                ? fallback
                : {
                    ...nextStats,
                    total: total.total,
                  };
            }
          }

          // Pausa entre requests para respetar el rate-limit del servidor
          await sleep(180);
        }

        requestStatsCache.set(cacheKey, {
          expiresAt: Date.now() + requestStatsTtlMs,
          value: nextStats,
        });

        return nextStats;
      } catch {
        return cached?.value ?? requestDefaultStats;
      } finally {
        inflightRequestStats.delete(cacheKey);
      }
    })();

    inflightRequestStats.set(cacheKey, fetchStatsPromise);
    return fetchStatsPromise;
  },
  getTypes: () => apiClient<RequestType[]>(webApiEndpoints.requests.types),
  getReportColumns: () =>
    apiClient<RequestReportColumn[]>(webApiEndpoints.requests.reportColumns),
  getReportPreview: (scope: RequestScope, filters: RequestReportFilters, columns?: string[]) =>
    apiClient<PaginatedRequestReportRowsResponse>(webApiEndpoints.requests.reports, {
      query: buildRequestReportQuery(filters, scope, columns),
    }),
  downloadReport: (
    format: RequestReportDownloadFormat,
    scope: RequestScope,
    filters: RequestReportFilters,
    columns: string[]
  ) => {
    const apiFilters = {
      dateFrom: filters.dateFrom || null,
      dateTo: filters.dateTo || null,
      status: filters.status && filters.status !== "all" ? filters.status : null,
      requestType: filters.typeId || null,
      workerId: filters.worker || null,
      department: filters.department || null,
      company: filters.company || null,
      approver: filters.approver || null,
      search: filters.search || null,
    };

    return downloadFilePost(
      `${webApiEndpoints.requests.reportExport(format)}?scope=${scope}`,
      {
        filters: apiFilters,
        columns,
      },
      `solicitudes_${new Date().toISOString().slice(0, 10).replace(/-/g, "_")}.${format}`
    );
  },
  getTemplates: () => apiClient<RequestTemplateItem[]>(webApiEndpoints.requests.templates),
  downloadTemplate: (templateId: string) =>
    downloadFile(
      webApiEndpoints.requests.templateDownload(templateId),
      `plantilla-${templateId}`,
    ),
  getById: (requestId: string) => apiClient<RequestDetail>(webApiEndpoints.requests.detail(requestId)),
  create: (payload: CreateRequestPayload) =>
    apiClient<RequestDetail>(webApiEndpoints.requests.list, {
      method: "POST",
      body: createRequestBody(payload),
    }),
  update: (requestId: string, payload: UpdateRequestPayload) =>
    apiClient<RequestDetail>(webApiEndpoints.requests.detail(requestId), {
      method: "PUT",
      body: createUpdateBody(payload),
    }),
  cancel: (requestId: string) =>
    apiClient<RequestDetail>(webApiEndpoints.requests.cancel(requestId), {
      method: "POST",
    }),
  review: (requestId: string, payload: ReviewRequestPayload) =>
    apiClient<RequestDetail>(webApiEndpoints.requests.review(requestId), {
      method: "POST",
      body: payload,
    }),
  approve: (requestId: string, reason?: string) =>
    apiClient<RequestDetail>(webApiEndpoints.requests.approve(requestId), {
      method: "PATCH",
      body: reason ? { reason } : undefined,
    }),
  reject: (requestId: string, reason: string) =>
    apiClient<RequestDetail>(webApiEndpoints.requests.reject(requestId), {
      method: "PATCH",
      body: { reason },
    }),
  observe: (requestId: string, reason: string) =>
    apiClient<RequestDetail>(webApiEndpoints.requests.observe(requestId), {
      method: "PATCH",
      body: { reason },
    }),
  resubmit: (requestId: string, payload?: ResubmitRequestPayload) =>
    apiClient<RequestDetail>(webApiEndpoints.requests.resubmit(requestId), {
      method: "PATCH",
      body: payload
        ? {
            reason: payload.reason,
            start_date: payload.startDate,
            end_date: payload.endDate,
          }
        : undefined,
    }),
  uploadDocuments: (requestId: string, payload: UploadRequestDocumentsPayload) =>
    apiClient<RequestAttachment[]>(webApiEndpoints.requests.documents(requestId), {
      method: "POST",
      body: createDocumentsFormData(payload),
    }),
  deleteDocument: (requestId: string, documentId: string) =>
    apiClient<{ id: string; deleted: boolean }>(
      webApiEndpoints.requests.document(requestId, documentId),
      {
        method: "DELETE",
      },
    ),
};
