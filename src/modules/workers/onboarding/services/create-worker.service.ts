import { apiClient } from "@/lib/api/client";
import type { CatalogItem } from "../types/onboarding.types";
import type {
  ApiEnvelope,
  CreateWorkerPayload,
  CreateWorkerSuccessResponse,
  DniLookupResponse,
} from "../types/create-worker.types";
import { isUuid } from "../utils/catalog-options";

type LooseRecord = Record<string, unknown>;

const asRecord = (value: unknown): LooseRecord | null =>
  value && typeof value === "object" ? (value as LooseRecord) : null;

const asString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const extractArrayData = (payload: unknown): CatalogItem[] => {
  const record = asRecord(payload);
  const nestedData = asRecord(record?.data);
  const data = asRecord(nestedData?.data) ?? nestedData ?? record;
  const candidates = [nestedData?.data, record?.data, payload];
  const items = candidates.find(Array.isArray);

  if (Array.isArray(items)) return items as CatalogItem[];
  return Array.isArray(data) ? data : [];
};

const isEnvelopeLike = (value: unknown): value is ApiEnvelope<unknown> => {
  const record = asRecord(value);
  return Boolean(record && ("data" in record || "success" in record || "message" in record));
};

function normalizeEnvelope<T>(payload: unknown, fallbackMessage: string): ApiEnvelope<T> {
  const directEnvelope = isEnvelopeLike(payload) ? (payload as ApiEnvelope<T>) : null;
  const nestedEnvelope = isEnvelopeLike(asRecord(payload)?.data)
    ? (asRecord(payload)?.data as ApiEnvelope<T>)
    : null;
  const envelope = nestedEnvelope ?? directEnvelope;

  if (!envelope || envelope.data === undefined) {
    throw new Error(fallbackMessage);
  }

  return {
    success: envelope.success ?? true,
    message: typeof envelope.message === "string" ? envelope.message : fallbackMessage,
    data: envelope.data,
  };
}

function mapCatalogItems(payload: unknown, fallbackMessage: string): CatalogItem[] {
  const response = normalizeEnvelope<unknown>(payload, fallbackMessage);
  const items = Array.isArray(response.data) ? response.data : [];

  if (response.success === false) {
    throw new Error(response.message || fallbackMessage);
  }

  return items.reduce<CatalogItem[]>((catalog, item) => {
    const record = asRecord(item);
    if (!record) return catalog;

    const id = asString(record.id);
    const name = asString(record.name);
    if (!isUuid(id) || !name) return catalog;

    catalog.push({
      id,
      name,
      code: asString(record.code) || undefined,
      schedule: asString(record.schedule) || undefined,
    });

    return catalog;
  }, []);
}

const getCatalog = (endpoint: string) =>
  apiClient<unknown>(endpoint).then((payload) =>
    mapCatalogItems(payload, "No se pudo cargar el catalogo."),
  );

export const createWorkerService = {
  getDni: (dni: string) =>
    apiClient<unknown>(`/api/dni/${dni}`).then((payload) =>
      normalizeEnvelope<DniLookupResponse["data"]>(payload, "No se pudo consultar el DNI."),
    ),

  getDepartments: (): Promise<CatalogItem[]> =>
    apiClient<unknown>("/api/ubigeo/departments").then(extractArrayData),
  getProvinces: (departmentId: string): Promise<CatalogItem[]> =>
    apiClient<unknown>(`/api/ubigeo/provinces/${departmentId}`).then(extractArrayData),
  getDistricts: (provinceId: string): Promise<CatalogItem[]> =>
    apiClient<unknown>(`/api/ubigeo/districts/${provinceId}`).then(extractArrayData),
  getAreas: (): Promise<CatalogItem[]> => getCatalog("/api/areas"),
  getJobPositions: (areaId: string): Promise<CatalogItem[]> =>
    getCatalog(`/api/job-positions/by-area/${areaId}`),

  create: (payload: CreateWorkerPayload) =>
    apiClient<unknown>("/api/users/create-worker", {
      method: "POST",
      body: payload,
    }).then((response) =>
      normalizeEnvelope<CreateWorkerSuccessResponse["data"]>(
        response,
        "No se pudo registrar al colaborador.",
      ),
    ),
};
