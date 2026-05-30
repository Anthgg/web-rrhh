import { apiClient } from "@/lib/api/client";
import { webApiEndpoints } from "@/lib/api/endpoints";

export interface GeoLocation {
  id: string;
  name: string;
}

export const geographyService = {
  getDepartments: () => apiClient<GeoLocation[]>(webApiEndpoints.geography.departments),
  getProvinces: (departmentId: string) =>
    apiClient<GeoLocation[]>(webApiEndpoints.geography.provinces, {
      query: { department_id: departmentId },
    }),
  getDistricts: (provinceId: string) =>
    apiClient<GeoLocation[]>(webApiEndpoints.geography.districts, {
      query: { province_id: provinceId },
    }),
};
