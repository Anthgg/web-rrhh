import { apiClient } from "@/lib/api/client";
import { webApiEndpoints } from "@/lib/api/endpoints";
import type {
  PaginatedResponse,
  TemporaryPasswordResetResult,
  UserFilters,
  UserProfile,
  UserUpdatePayload,
  WorkerGeneratedDocument,
} from "@/types";
import { downloadCorporatePdf, downloadCorporateExcel, downloadPdfFile } from "./reportPdf.service";

const filenameSafe = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "Usuario";

export { filenameSafe };

const toPdfFilters = (filters: UserFilters) =>
  Object.fromEntries(Object.entries(filters)) as Record<string, string | number | boolean | null | undefined>;

export const usersService = {
  list: (filters: UserFilters) =>
    apiClient<PaginatedResponse<UserProfile>>(webApiEndpoints.users, { query: filters }),
  detail: (id: string) =>
    apiClient<UserProfile>(`${webApiEndpoints.users}/${id}`),
  update: (id: string, payload: UserUpdatePayload) =>
    apiClient<UserProfile>(`${webApiEndpoints.users}/${id}`, { method: "PUT", body: payload }),
  exportPdf: (filters: UserFilters, customData?: unknown) =>
    downloadCorporatePdf("/api/users/export/pdf", "Reporte_Usuarios.pdf", toPdfFilters(filters), customData),
  exportExcel: (filters: UserFilters, customData?: unknown) =>
    downloadCorporateExcel("/api/users/export/excel", "Reporte_Usuarios.xlsx", toPdfFilters(filters), customData),
  exportProfilePdf: (id: string, fullName?: string) =>
    downloadPdfFile(
      `${webApiEndpoints.users}/${id}/export-pdf`,
      `Perfil_Usuario_${filenameSafe(fullName ?? id)}.pdf`,
    ),
  blockUser: (id: string) =>
    apiClient<void>(`${webApiEndpoints.users}/${id}/block`, { method: "PATCH" }),
  disableUser: (id: string) =>
    apiClient<void>(`${webApiEndpoints.users}/${id}/disable`, { method: "PATCH" }),
  enableUser: (id: string) =>
    apiClient<void>(`${webApiEndpoints.users}/${id}/enable`, { method: "PATCH" }),
  resetPassword: (id: string) =>
    apiClient<TemporaryPasswordResetResult>(`${webApiEndpoints.users}/${id}/reset-password`, { method: "POST" }),
  linkWorker: (id: string, workerId: string) =>
    apiClient<void>(`${webApiEndpoints.users}/${id}/link-worker`, { method: "POST", body: { workerId } }),
  listWorkerDocuments: (workerId: string) =>
    apiClient<WorkerGeneratedDocument[]>(`/api/workers/${workerId}/documents`),
  saveWorkerDocument: (workerId: string, payload: {
    name: string;
    type: string;
    fileName: string;
    mimeType: string;
    base64: string;
  }) =>
    apiClient<WorkerGeneratedDocument>(`/api/workers/${workerId}/documents`, { method: "POST", body: payload }),
};
