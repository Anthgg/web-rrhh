import { apiClient } from "@/lib/api/client";
import { webApiEndpoints } from "@/lib/api/endpoints";
import type { DepartmentDefinition } from "@/types";

export interface DepartmentPayload {
 name: string;
 description?: string | null;
 is_active: boolean;
}

export const departmentsService = {
 list: (includeInactive?: boolean) => 
 apiClient<DepartmentDefinition[]>(webApiEndpoints.organization.departments, {
 query: includeInactive ? { include_inactive: true } : undefined
 }),
 getById: (id: string) => 
 apiClient<DepartmentDefinition>(webApiEndpoints.organization.department(id)),
 
 create: (payload: DepartmentPayload) =>
 apiClient<DepartmentDefinition>(webApiEndpoints.organization.departments, {
 method: "POST",
 body: payload,
 }),
 
 update: (id: string, payload: DepartmentPayload) =>
 apiClient<DepartmentDefinition>(webApiEndpoints.organization.department(id), {
 method: "PUT",
 body: payload,
 }),
 
 toggleStatus: (id: string, is_active: boolean) =>
 apiClient<void>(webApiEndpoints.organization.departmentStatus(id), {
 method: "PATCH",
 body: { is_active },
 }),
 
 delete: (id: string) =>
 apiClient<void>(webApiEndpoints.organization.department(id), {
 method: "DELETE",
 }),
};
