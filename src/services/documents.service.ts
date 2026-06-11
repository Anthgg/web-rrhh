import { apiClient } from "@/lib/api/client";
import { webApiEndpoints } from "@/lib/api/endpoints";
import type { DocumentFilters, DocumentRecord, PaginatedResponse } from "@/types";

export const documentsService = {
 list: (filters: DocumentFilters) =>
 apiClient<PaginatedResponse<DocumentRecord>>(webApiEndpoints.documents, { query: filters }),
};
