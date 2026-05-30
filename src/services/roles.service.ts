import { apiClient } from "@/lib/api/client";
import { webApiEndpoints } from "@/lib/api/endpoints";
import type { RoleDefinition } from "@/types";

export type RolePayload = Omit<RoleDefinition, "status" | "id">;

export const rolesService = {
  list: (includeInactive?: boolean) => 
    apiClient<RoleDefinition[]>(webApiEndpoints.roles, {
      query: includeInactive ? { include_inactive: true } : undefined
    }),
  create: (payload: RolePayload) => 
    apiClient<RoleDefinition>(webApiEndpoints.roles, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id: string, payload: RolePayload) => 
    apiClient<RoleDefinition>(`${webApiEndpoints.roles}/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  toggleStatus: (id: string, is_active: boolean) => 
    apiClient<void>(`${webApiEndpoints.roles}/${id}/status`, {
      method: "PATCH",
      body: { is_active },
    }),
  delete: (id: string) => 
    apiClient<void>(`${webApiEndpoints.roles}/${id}`, {
      method: "DELETE",
    }),
};
