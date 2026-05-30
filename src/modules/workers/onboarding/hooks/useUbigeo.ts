import { useQuery } from "@tanstack/react-query";
import { createWorkerService } from "../services/create-worker.service";

export function useUbigeo(departmentId?: string, provinceId?: string) {
  const departmentsQuery = useQuery({
    queryKey: ["ubigeo-departments"],
    queryFn: createWorkerService.getDepartments,
    staleTime: 10 * 60 * 1000,
  });

  const provincesQuery = useQuery({
    queryKey: ["ubigeo-provinces", departmentId],
    queryFn: () => createWorkerService.getProvinces(departmentId as string),
    enabled: Boolean(departmentId),
    staleTime: 10 * 60 * 1000,
  });

  const districtsQuery = useQuery({
    queryKey: ["ubigeo-districts", provinceId],
    queryFn: () => createWorkerService.getDistricts(provinceId as string),
    enabled: Boolean(provinceId),
    staleTime: 10 * 60 * 1000,
  });

  return {
    departments: departmentsQuery.data || [],
    provinces: provincesQuery.data || [],
    districts: districtsQuery.data || [],
    departmentsQuery,
    provincesQuery,
    districtsQuery,
  };
}
