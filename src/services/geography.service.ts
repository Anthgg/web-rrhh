import { apiClient } from "@/lib/api/client";
import { webApiEndpoints } from "@/lib/api/endpoints";

export interface GeoLocation {
  id: string;
  name: string;
}

const readPath = (source: unknown, path: string): unknown =>
  path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, source);

const normalizeGeoLocations = (payload: unknown): GeoLocation[] => {
  const collection =
    (Array.isArray(payload) ? payload : undefined) ??
    readPath(payload, "data.data.items") ??
    readPath(payload, "data.data.results") ??
    readPath(payload, "data.data.rows") ??
    readPath(payload, "data.data") ??
    readPath(payload, "data.items") ??
    readPath(payload, "data.results") ??
    readPath(payload, "data.rows") ??
    readPath(payload, "data") ??
    readPath(payload, "items") ??
    readPath(payload, "results") ??
    readPath(payload, "rows");

  if (!Array.isArray(collection)) return [];

  return collection.reduce<GeoLocation[]>((items, entry) => {
    if (!entry || typeof entry !== "object") return items;
    const record = entry as Record<string, unknown>;
    const id = String(record.id ?? record.uuid ?? record.value ?? "").trim();
    const name = String(record.name ?? record.nombre ?? record.label ?? record.description ?? "").trim();
    if (!id) return items;
    items.push({ id, name: name || id });
    return items;
  }, []);
};

export const geographyService = {
  getDepartments: () =>
    apiClient<unknown>(webApiEndpoints.geography.departments).then(normalizeGeoLocations),
  getProvinces: (departmentId: string) =>
    apiClient<unknown>(webApiEndpoints.geography.provinces, {
      query: { department_id: departmentId },
    }).then(normalizeGeoLocations),
  getDistricts: (provinceId: string) =>
    apiClient<unknown>(webApiEndpoints.geography.districts, {
      query: { province_id: provinceId },
    }).then(normalizeGeoLocations),
};
