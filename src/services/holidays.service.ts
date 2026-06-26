import { apiClient } from "@/lib/api/client";
import { webApiEndpoints } from "@/lib/api/endpoints";

export interface Holiday {
  id: string;
  name: string;
  date: string;
  is_active: boolean;
  type?: string;    // e.g. "nacional" | "national"
  country?: string; // e.g. "PE"
}

export const holidaysService = {
  /**
   * List national holidays.
   * @param params.year    - filter by year (e.g. 2026)
   * @param params.country - filter by country code (default: PE)
   * @param params.active  - filter by active status
   */
  list: (params?: { year?: number; country?: string; active?: boolean }) => {
    return apiClient<{ success: boolean; data: Holiday[] }>(
      webApiEndpoints.schedule.holidays(),
      { query: params }
    );
  },

  create: (data: { name: string; date: string; is_active?: boolean }) => {
    return apiClient<{ success: boolean; data: Holiday; message: string }>(
      webApiEndpoints.schedule.holidays(),
      {
        method: "POST",
        body: data,
      }
    );
  },

  update: (id: string, data: { name?: string; date?: string; is_active?: boolean }) => {
    return apiClient<{ success: boolean; message: string }>(
      `${webApiEndpoints.schedule.holidays()}/${id}`,
      {
        method: "PUT",
        body: data,
      }
    );
  },

  toggleActive: (id: string, is_active: boolean) => {
    return apiClient<{ success: boolean; message: string }>(
      `${webApiEndpoints.schedule.holidays()}/${id}`,
      {
        method: "PATCH", 
        body: { is_active },
      }
    );
  },
};
