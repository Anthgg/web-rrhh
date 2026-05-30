import { apiClient } from "@/lib/api/client";
import { webApiEndpoints } from "@/lib/api/endpoints";
import type { PaginatedResponse, UserFilters, UserProfile } from "@/types";

export const usersService = {
  list: (filters: UserFilters) =>
    apiClient<PaginatedResponse<UserProfile>>(webApiEndpoints.users, { query: filters }),
};
