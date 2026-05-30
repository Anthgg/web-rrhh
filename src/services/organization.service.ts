import { apiClient } from "@/lib/api/client";
import { webApiEndpoints } from "@/lib/api/endpoints";

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
  geographic_department_id: string;
  geographic_department_name?: string;
  geographic_province_id: string;
  geographic_province_name?: string;
  geographic_district_id: string;
  geographic_district_name?: string;
  latitude?: number | null;
  longitude?: number | null;
  allowed_radius_meters?: number | null;
  is_active?: boolean;
  status?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BasePayload {
  name: string;
  description?: string;
}

export interface WorkLocationPayload {
  name: string;
  address: string;
  geographyDepartmentId: string;
  geographyProvinceId: string;
  geographyDistrictId: string;
  latitude?: number | null;
  longitude?: number | null;
  allowedRadiusMeters?: number;
  isActive?: boolean;
}

export const organizationService = {
  // Departments
  getDepartments: () => apiClient<OrganizationDepartment[]>(webApiEndpoints.organization.departments),
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
    apiClient<OrganizationArea[]>(webApiEndpoints.organization.areas, {
      query: departmentId ? { department_id: departmentId } : undefined,
    }),
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
    apiClient<OrganizationPosition[]>(webApiEndpoints.organization.positions, {
      query: areaId ? { area_id: areaId } : undefined,
    }),
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
      body: JSON.stringify({ status }),
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
        geographic_department_id: payload.geographyDepartmentId,
        geographic_province_id: payload.geographyProvinceId,
        geographic_district_id: payload.geographyDistrictId,
        latitude: payload.latitude ?? null,
        longitude: payload.longitude ?? null,
        allowed_radius_meters: payload.allowedRadiusMeters ?? 100,
        is_active: payload.isActive ?? true,
      }),
    }),
  updateWorkLocation: (id: string, payload: WorkLocationPayload) =>
    apiClient<OrganizationWorkLocation>(webApiEndpoints.organization.workLocation(id), {
      method: "PUT",
      body: JSON.stringify({
        name: payload.name,
        address: payload.address,
        geographic_department_id: payload.geographyDepartmentId,
        geographic_province_id: payload.geographyProvinceId,
        geographic_district_id: payload.geographyDistrictId,
        latitude: payload.latitude ?? null,
        longitude: payload.longitude ?? null,
        allowed_radius_meters: payload.allowedRadiusMeters ?? 100,
        is_active: payload.isActive ?? true,
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
