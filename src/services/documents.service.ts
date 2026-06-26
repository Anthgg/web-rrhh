import { apiClient } from "@/lib/api/client";
import { webApiEndpoints } from "@/lib/api/endpoints";
import type { DocumentFilters, DocumentRecord, PaginatedResponse } from "@/types";

export function normalizeDocumentRecord(raw: any): DocumentRecord {
  if (!raw) return {} as DocumentRecord;
  return {
    id: raw.id || raw.documentId || raw.document_id,
    workerId: raw.workerId || raw.worker_id,
    workerName: raw.workerName || raw.worker_name || raw.worker_fullName || "",
    type: raw.type || raw.documentType || raw.document_type,
    documentType: raw.documentType || raw.document_type || raw.type,
    title: raw.title || "",
    status: raw.status || "missing",
    fileName: raw.fileName || raw.file_name || null,
    mimeType: raw.mimeType || raw.mime_type || null,
    sizeBytes: raw.sizeBytes !== undefined ? raw.sizeBytes : (raw.size_bytes !== undefined ? raw.size_bytes : null),
    fileUrl: raw.fileUrl || raw.file_url || null,
    uploadedAt: raw.uploadedAt || raw.uploaded_at || null,
    reviewedAt: raw.reviewedAt || raw.reviewed_at || null,
    reviewComment: raw.reviewComment || raw.review_comment || null,
    canDelete: raw.canDelete !== undefined ? raw.canDelete : (raw.can_delete !== undefined ? raw.can_delete : false),
    canReplace: raw.canReplace !== undefined ? raw.canReplace : (raw.can_replace !== undefined ? raw.can_replace : false),
  };
}

export const documentsService = {
  list: async (filters: DocumentFilters): Promise<PaginatedResponse<DocumentRecord>> => {
    const query: Record<string, any> = {};
    if (filters.page !== undefined) query.page = filters.page;
    if (filters.pageSize !== undefined) {
      query.pageSize = filters.pageSize;
      query.limit = filters.pageSize;
    }
    if (filters.limit !== undefined) {
      query.limit = filters.limit;
      query.pageSize = filters.limit;
    }
    if (filters.search !== undefined) query.search = filters.search;
    if (filters.status !== undefined) query.status = filters.status;
    
    const typeValue = filters.type || filters.documentType || filters.document_type;
    if (typeValue !== undefined) {
      query.type = typeValue;
      query.documentType = typeValue;
      query.document_type = typeValue;
    }

    const workerIdValue = filters.workerId || filters.worker_id;
    if (workerIdValue !== undefined) {
      query.workerId = workerIdValue;
      query.worker_id = workerIdValue;
    }

    const response = await apiClient<any>(webApiEndpoints.documents.list, { query });
    
    const rawData = response?.data?.documents || response?.data?.items || response?.data || [];
    const documents = Array.isArray(rawData) ? rawData.map(normalizeDocumentRecord) : [];

    const pagination = response?.data?.pagination || {
      total: documents.length,
      page: filters.page || 1,
      limit: filters.pageSize || 20,
      pageSize: filters.pageSize || 20,
      totalPages: 1
    };

    return {
      items: documents,
      total: pagination.total ?? documents.length,
      page: pagination.page ?? 1,
      pageSize: pagination.pageSize ?? pagination.limit ?? 20,
      source: "api",
    };
  },

  getTypes: async (): Promise<string[]> => {
    const response = await apiClient<any>(webApiEndpoints.documents.types);
    const data = response?.data ?? response ?? [];
    if (Array.isArray(data)) {
      return data.map((item: any) => {
        if (typeof item === "string") return item;
        return item?.type || item?.name || "";
      }).filter(Boolean);
    }
    return [];
  },

  getById: async (documentId: string): Promise<DocumentRecord> => {
    const response = await apiClient<any>(webApiEndpoints.documents.detail(documentId));
    const raw = response?.data ?? response;
    return normalizeDocumentRecord(raw);
  },

  upload: async (
    workerId: string,
    payload: {
      file: File;
      type: string;
      title: string;
      description?: string;
      documentId?: string;
    }
  ): Promise<any> => {
    const formData = new FormData();
    formData.append("file", payload.file);
    formData.append("document", payload.file);
    formData.append("documents", payload.file);
    formData.append("type", payload.type);
    formData.append("documentType", payload.type);
    formData.append("document_type", payload.type);
    formData.append("title", payload.title);
    if (payload.description) {
      formData.append("description", payload.description);
    }
    if (payload.documentId) {
      formData.append("documentId", payload.documentId);
    }

    return apiClient<any>(webApiEndpoints.documents.upload(workerId), {
      method: "POST",
      body: formData,
    });
  },

  review: async (
    documentId: string,
    payload: {
      status: "approved" | "rejected" | "observed" | "pending" | "expired";
      reviewComment?: string;
    }
  ): Promise<any> => {
    return apiClient<any>(webApiEndpoints.documents.review(documentId), {
      method: "PATCH",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
      },
    });
  },

  delete: async (documentId: string): Promise<any> => {
    return apiClient<any>(webApiEndpoints.documents.delete(documentId), {
      method: "DELETE",
    });
  },
};
