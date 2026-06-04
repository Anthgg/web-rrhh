import { apiClient } from "@/lib/api/client";
import { webApiEndpoints } from "@/lib/api/endpoints";
import { extractArray } from "@/lib/utils/extract-array";

export interface OrganizationDepartment {
  id: string;
  name: string;
  description?: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationArea {
  id: string;
  departmentId: string;
  departmentName?: string;
  name: string;
  description?: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationPosition {
  id: string;
  areaId: string;
  areaName?: string;
  name: string;
  description?: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationWorkLocation {
  id: string;
  company_id?: string;
  sede_id?: string | null;
  name: string;
  address?: string;
  // Backend returns both naming conventions — prefer geographic_* fields
  geographic_department_id: string;
  geographic_department_name?: string;
  department_name?: string;            // alias sent by some backend versions
  geographic_province_id: string;
  geographic_province_name?: string;
  province_name?: string;              // alias
  geographic_district_id: string;
  geographic_district_name?: string;
  district_name?: string;              // alias
  latitude?: number | null;
  longitude?: number | null;
  allowed_radius_meters?: number | null;
  is_active?: boolean;
  status?: boolean;
  created_at?: string;
  updated_at?: string;
  workers_metrics?: {
    base_crew_workers: number;
    temporary_received: number;
    temporary_sent?: number;
    total_movements?: number;
    total_active: number;
  };
}

export interface BasePayload {
  name: string;
  description?: string;
}

export interface WorkLocationPayload {
  name: string;
  address: string;
  description?: string | null;
  geographyDepartmentId: string;
  geographyProvinceId: string;
  geographyDistrictId: string;
  latitude?: number | null;
  longitude?: number | null;
  allowedRadiusMeters?: number;
  isActive?: boolean;
  sedeId?: string | null;
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const normalizeStatus = (value: unknown, isActive: unknown): "active" | "inactive" => {
  if (value === "active" || value === "ACTIVE") return "active";
  if (value === "inactive" || value === "INACTIVE") return "inactive";
  if (typeof isActive === "boolean") return isActive ? "active" : "inactive";
  if (isActive === "active" || isActive === "ACTIVE") return "active";
  if (isActive === "inactive" || isActive === "INACTIVE") return "inactive";
  return "active";
};

const normalizeDepartment = (entry: unknown): OrganizationDepartment => {
  const record = asRecord(entry);
  return {
    id: String(record.id ?? ""),
    name: String(record.name ?? record.nombre ?? ""),
    description: typeof record.description === "string" ? record.description : undefined,
    status: normalizeStatus(record.status, record.is_active),
    createdAt: String(record.createdAt ?? record.created_at ?? ""),
    updatedAt: String(record.updatedAt ?? record.updated_at ?? ""),
  };
};

const normalizeArea = (entry: unknown): OrganizationArea => {
  const record = asRecord(entry);
  const department = asRecord(record.department);
  return {
    id: String(record.id ?? ""),
    departmentId: String(record.departmentId ?? record.department_id ?? ""),
    departmentName: String(record.departmentName ?? record.department_name ?? department.name ?? ""),
    name: String(record.name ?? record.nombre ?? ""),
    description: typeof record.description === "string" ? record.description : undefined,
    status: normalizeStatus(record.status, record.is_active),
    createdAt: String(record.createdAt ?? record.created_at ?? ""),
    updatedAt: String(record.updatedAt ?? record.updated_at ?? ""),
  };
};

const normalizePosition = (entry: unknown): OrganizationPosition => {
  const record = asRecord(entry);
  const area = asRecord(record.area);
  return {
    id: String(record.id ?? ""),
    areaId: String(record.areaId ?? record.area_id ?? ""),
    areaName: String(record.areaName ?? record.area_name ?? area.name ?? ""),
    name: String(record.name ?? record.nombre ?? ""),
    description: typeof record.description === "string" ? record.description : undefined,
    status: normalizeStatus(record.status, record.is_active),
    createdAt: String(record.createdAt ?? record.created_at ?? ""),
    updatedAt: String(record.updatedAt ?? record.updated_at ?? ""),
  };
};

export const organizationService = {
  // Departments
  getDepartments: () =>
    apiClient<unknown>(webApiEndpoints.organization.departments).then((data) =>
      extractArray(data).map(normalizeDepartment),
    ),
  createDepartment: (payload: BasePayload) =>
    apiClient<OrganizationDepartment>(webApiEndpoints.organization.departments, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateDepartment: (id: string, payload: BasePayload) =>
    apiClient<OrganizationDepartment>(webApiEndpoints.organization.department(id), {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  updateDepartmentStatus: (id: string, status: "active" | "inactive") =>
    apiClient<void>(webApiEndpoints.organization.departmentStatus(id), {
      method: "PATCH",
      body: { is_active: status === "active" },
    }),
  deleteDepartment: (id: string) =>
    apiClient<void>(webApiEndpoints.organization.department(id), {
      method: "DELETE",
    }),

  // Areas
  getAreas: (departmentId?: string) =>
    apiClient<unknown>(webApiEndpoints.organization.areas, {
      query: departmentId ? { department_id: departmentId } : undefined,
    }).then((data) => extractArray(data).map(normalizeArea)),
  createArea: (payload: BasePayload & { departmentId: string }) =>
    apiClient<OrganizationArea>(webApiEndpoints.organization.areas, {
      method: "POST",
      body: JSON.stringify({
        name: payload.name,
        description: payload.description,
        department_id: payload.departmentId,
      }),
    }),
  updateArea: (id: string, payload: BasePayload & { departmentId: string }) =>
    apiClient<OrganizationArea>(webApiEndpoints.organization.area(id), {
      method: "PUT",
      body: JSON.stringify({
        name: payload.name,
        description: payload.description,
        department_id: payload.departmentId,
      }),
    }),
  updateAreaStatus: (id: string, status: "active" | "inactive") =>
    apiClient<void>(webApiEndpoints.organization.areaStatus(id), {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  // Positions
  getPositions: (areaId?: string) =>
    apiClient<unknown>(webApiEndpoints.organization.positions, {
      query: areaId ? { area_id: areaId } : undefined,
    }).then((data) => extractArray(data).map(normalizePosition)),
  createPosition: (payload: BasePayload & { areaId: string }) =>
    apiClient<OrganizationPosition>(webApiEndpoints.organization.positions, {
      method: "POST",
      body: JSON.stringify({
        name: payload.name,
        description: payload.description,
        area_id: payload.areaId,
      }),
    }),
  updatePosition: (id: string, payload: BasePayload & { areaId: string }) =>
    apiClient<OrganizationPosition>(webApiEndpoints.organization.position(id), {
      method: "PUT",
      body: JSON.stringify({
        name: payload.name,
        description: payload.description,
        area_id: payload.areaId,
      }),
    }),
  updatePositionStatus: (id: string, status: "active" | "inactive") =>
    apiClient<void>(webApiEndpoints.organization.positionStatus(id), {
      method: "PATCH",
      body: JSON.stringify({ is_active: status === "active" }),
    }),

  // Work Locations
  getWorkLocations: () =>
    apiClient<OrganizationWorkLocation[]>(
      `${webApiEndpoints.organization.workLocations}?include_inactive=true`
    ),
  createWorkLocation: (payload: WorkLocationPayload) =>
    apiClient<OrganizationWorkLocation>(webApiEndpoints.organization.workLocations, {
      method: "POST",
      body: JSON.stringify({
        name: payload.name,
        address: payload.address,
        ...(payload.description != null ? { description: payload.description } : {}),
        geographic_department_id: payload.geographyDepartmentId,
        geographic_province_id: payload.geographyProvinceId,
        geographic_district_id: payload.geographyDistrictId,
        latitude: payload.latitude ?? null,
        longitude: payload.longitude ?? null,
        allowed_radius_meters: payload.allowedRadiusMeters ?? 100,
        is_active: payload.isActive ?? true,
        ...(payload.sedeId != null ? { sede_id: payload.sedeId } : {}),
      }),
    }),
  updateWorkLocation: (id: string, payload: WorkLocationPayload) =>
    apiClient<OrganizationWorkLocation>(webApiEndpoints.organization.workLocation(id), {
      method: "PUT",
      body: JSON.stringify({
        name: payload.name,
        address: payload.address,
        ...(payload.description != null ? { description: payload.description } : {}),
        geographic_department_id: payload.geographyDepartmentId,
        geographic_province_id: payload.geographyProvinceId,
        geographic_district_id: payload.geographyDistrictId,
        latitude: payload.latitude ?? null,
        longitude: payload.longitude ?? null,
        allowed_radius_meters: payload.allowedRadiusMeters ?? 100,
        is_active: payload.isActive ?? true,
        ...(payload.sedeId != null ? { sede_id: payload.sedeId } : {}),
      }),
    }),
  updateWorkLocationStatus: (id: string, isActive: boolean | "active" | "inactive") =>
    apiClient<void>(webApiEndpoints.organization.workLocationStatus(id), {
      method: "PATCH",
      body: JSON.stringify({
        is_active: isActive === true || isActive === "active",
      }),
    }),
  deleteWorkLocation: (id: string) =>
    apiClient<void>(webApiEndpoints.organization.workLocation(id), {
      method: "DELETE",
    }),
};
