import { useQuery } from "@tanstack/react-query";
import { createWorkerService } from "../services/create-worker.service";

export function useUbigeo(departmentId?: string, provinceId?: string) {
 const {
 data: departments = [],
 isLoading: isDepartmentsLoading,
 } = useQuery({
 queryKey: ["ubigeo-departments"],
 queryFn: createWorkerService.getDepartments,
 staleTime: 10 * 60 * 1000,
 });

 const {
 data: provinces = [],
 isFetching: isProvincesFetching,
 } = useQuery({
 queryKey: ["ubigeo-provinces", departmentId],
 queryFn: () => createWorkerService.getProvinces(departmentId as string),
 enabled: Boolean(departmentId),
 staleTime: 10 * 60 * 1000,
 });

 const {
 data: districts = [],
 isFetching: isDistrictsFetching,
 } = useQuery({
 queryKey: ["ubigeo-districts", provinceId],
 queryFn: () => createWorkerService.getDistricts(provinceId as string),
 enabled: Boolean(provinceId),
 staleTime: 10 * 60 * 1000,
 });

 return {
 departments,
 provinces,
 districts,
 departmentsQuery: {
 isLoading: isDepartmentsLoading,
 },
 provincesQuery: {
 isFetching: isProvincesFetching,
 },
 districtsQuery: {
 isFetching: isDistrictsFetching,
 },
 };
}
