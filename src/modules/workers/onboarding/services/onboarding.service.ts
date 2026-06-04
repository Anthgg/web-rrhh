import { apiClient } from "@/lib/api/client";
import type {
  CreateOnboardingPayload,
  CompleteProfilePayload,
  CompleteProfileResponse,
  CompleteProfileSaveResponse,
  CompleteProfileUserPayload,
  ContractDownloadResponse,
  OnboardingSuccessResponse,
  SuggestCredentialsPayload,
  SuggestCredentialsResponse,
  GenerateContractPayload,
  GenerateContractResponse,
  OnboardingStatusResponse,
  OnboardingPrefillResponse,
  CatalogItem,
  WorkerContractRecord,
} from "../types/onboarding.types";
import { normalizeCatalogItems } from "../utils/catalog-options";

const getCatalog = (endpoint: string) =>
  apiClient<unknown>(endpoint).then((payload) => normalizeCatalogItems(payload));

export const onboardingService = {
  getDni: (dni: string) =>
    apiClient<{
      success: boolean;
      data: {
        dni: string;
        first_name: string;
        paternal_last_name: string;
        maternal_last_name?: string;
        full_name: string;
      };
    }>(`/api/dni/${dni}`),

  suggestCredentials: (payload: SuggestCredentialsPayload) =>
    apiClient<SuggestCredentialsResponse>("/api/users/suggest-credentials", {
      method: "POST",
      body: payload,
    }),

  createOnboarding: (payload: CreateOnboardingPayload) =>
    apiClient<OnboardingSuccessResponse>("/api/workers/onboarding", {
      method: "POST",
      body: payload,
    }),

  getCompleteProfile: (userId: string) =>
    apiClient<CompleteProfileResponse>(`/api/workers/complete-profile/${userId}`),

  completeProfile: (userId: string, payload: CompleteProfilePayload) =>
    apiClient<CompleteProfileSaveResponse>(`/api/workers/complete-profile/${userId}`, {
      method: "PUT",
      body: payload,
    }),

  updateCompleteProfileUser: (userId: string, payload: CompleteProfileUserPayload) =>
    apiClient<unknown>(`/api/users/${userId}`, {
      method: "PUT",
      body: payload,
    }),

  getOnboardingPrefill: (params: { userId?: string | null; workerId?: string | null }) =>
    apiClient<OnboardingPrefillResponse>("/api/workers/onboarding-prefill", {
      query: {
        ...(params.userId ? { userId: params.userId } : {}),
        ...(params.workerId ? { workerId: params.workerId } : {}),
      },
    }),

  listContracts: (workerId: string) =>
    apiClient<WorkerContractRecord[] | { success?: boolean; data?: WorkerContractRecord[] }>(
      `/api/workers/${workerId}/contracts`,
    ),

  generateContract: (workerId: string, payload: GenerateContractPayload) =>
    apiClient<GenerateContractResponse>(
      `/api/workers/${workerId}/contracts/generate`,
      {
        method: "POST",
        body: payload,
      }
    ),

  getContractDownload: (contractId: string) =>
    apiClient<ContractDownloadResponse>(`/api/contracts/${contractId}/download`),

  uploadSignedContract: (workerId: string, formData: FormData) =>
    apiClient<{ success: boolean; message: string }>(
      `/api/workers/${workerId}/contracts/signed`,
      {
        method: "POST",
        body: formData,
      }
    ),

  getOnboardingStatus: (workerId: string) =>
    apiClient<OnboardingStatusResponse>(`/api/workers/${workerId}/onboarding-status`),

  // Catalogs are normalized so select values are UUIDs, never visible labels/codes.
  getCompanies: (): Promise<CatalogItem[]> => getCatalog("/api/workers/companies"),
  getBranches: (): Promise<CatalogItem[]> => getCatalog("/api/workers/branches"),
  getDepartments: (): Promise<CatalogItem[]> => getCatalog("/api/departments"),
  getRoles: (): Promise<CatalogItem[]> => getCatalog("/api/catalog-roles"),
  getAreas: (): Promise<CatalogItem[]> => getCatalog("/api/areas"),
  getAreasByDepartment: (departmentId: string): Promise<CatalogItem[]> =>
    getCatalog(`/api/areas/by-department/${departmentId}`),
  getPositionsByArea: (areaId: string): Promise<CatalogItem[]> =>
    getCatalog(`/api/job-positions/by-area/${areaId}`),
  getWorkLocations: (): Promise<CatalogItem[]> => getCatalog("/api/work-locations"),
  getWorkerTypes: (): Promise<CatalogItem[]> => getCatalog("/api/workers/types"),
  getShifts: (): Promise<CatalogItem[]> => getCatalog("/api/workers/shifts"),
  getSupervisors: (): Promise<CatalogItem[]> => getCatalog("/api/workers/supervisors"),
  getCostCenters: (): Promise<CatalogItem[]> => getCatalog("/api/contracts/cost-centers"),
};
