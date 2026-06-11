import { apiClient } from "@/lib/api/client";
import { webApiEndpoints } from "@/lib/api/endpoints";
import type { AreaDefinition } from "@/types";

export type AreaPayload = Omit<AreaDefinition, "status" | "id" | "department_name" | "role_name" | "role_code">;

export const areasService = {
 list: (departmentId?: string, includeInactive?: boolean) =>
 apiClient<AreaDefinition[]>(webApiEndpoints.organization.areas, {
 query: {
 ...(departmentId ? { departmentId } : {}),
 ...(includeInactive ? { include_inactive: true } : {})
 }
 }),
 create: (payload: AreaPayload) =>
 apiClient<AreaDefinition>(webApiEndpoints.organization.areas, {
 method: "POST",
 body: JSON.stringify(payload),
 }),
 update: (id: string, payload: AreaPayload) =>
 apiClient<AreaDefinition>(webApiEndpoints.organization.area(id), {
 method: "PUT",
 body: JSON.stringify(payload),
 }),
 toggleStatus: (id: string, is_active: boolean) =>
 apiClient<void>(webApiEndpoints.organization.areaStatus(id), {
 method: "PATCH",
 body: { is_active },
 }),
 delete: (id: string) =>
 apiClient<void>(webApiEndpoints.organization.area(id), {
 method: "DELETE",
 }),
};
