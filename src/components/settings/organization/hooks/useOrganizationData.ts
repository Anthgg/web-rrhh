import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { organizationService } from "@/services/organization.service";
import { extractArray } from "@/lib/utils/extract-array";

export const orgKeys = {
 all: ["organization"] as const,
 departments: () => [...orgKeys.all, "departments"] as const,
 areas: (deptId?: string) => [...orgKeys.all, "areas", deptId] as const,
 positions: (areaId?: string) => [...orgKeys.all, "positions", areaId] as const,
 workLocations: () => [...orgKeys.all, "work-locations"] as const,
};

export function useDepartments() {
 const queryClient = useQueryClient();
 const query = useQuery({
 queryKey: orgKeys.departments(),
 queryFn: async () => {
 const data = await organizationService.getDepartments();
 return extractArray(data) as typeof data;
 },
 });

 const toggleStatus = useMutation({
 mutationFn: ({ id, status }: { id: string; status: "active" | "inactive" }) =>
 organizationService.updateDepartmentStatus(id, status),
 onSuccess: () => queryClient.invalidateQueries({ queryKey: orgKeys.departments() }),
 });

 return { ...query, toggleStatus };
}

export function useAreas(departmentId?: string) {
 const queryClient = useQueryClient();
 const query = useQuery({
 queryKey: orgKeys.areas(departmentId),
 queryFn: async () => {
 const data = await organizationService.getAreas(departmentId);
 return extractArray(data) as typeof data;
 },
 });

 const toggleStatus = useMutation({
 mutationFn: ({ id, status }: { id: string; status: "active" | "inactive" }) =>
 organizationService.updateAreaStatus(id, status),
 onSuccess: () => queryClient.invalidateQueries({ queryKey: orgKeys.areas(departmentId) }),
 });

 return { ...query, toggleStatus };
}

export function usePositions(areaId?: string) {
 const queryClient = useQueryClient();
 const query = useQuery({
 queryKey: orgKeys.positions(areaId),
 queryFn: async () => {
 const data = await organizationService.getPositions(areaId);
 return extractArray(data) as typeof data;
 },
 });

 const toggleStatus = useMutation({
 mutationFn: ({ id, status }: { id: string; status: "active" | "inactive" }) =>
 organizationService.updatePositionStatus(id, status),
 onSuccess: () => queryClient.invalidateQueries({ queryKey: orgKeys.positions(areaId) }),
 });

 return { ...query, toggleStatus };
}

export function useWorkLocations() {
 const queryClient = useQueryClient();
 const query = useQuery({
 queryKey: orgKeys.workLocations(),
 queryFn: async () => {
 const data = await organizationService.getWorkLocations();
 return extractArray(data) as typeof data;
 },
 });

 const toggleStatus = useMutation({
 mutationFn: ({ id, status }: { id: string; status: "active" | "inactive" }) =>
 organizationService.updateWorkLocationStatus(id, status),
 onSuccess: () => queryClient.invalidateQueries({ queryKey: orgKeys.workLocations() }),
 });

 return { ...query, toggleStatus };
}
