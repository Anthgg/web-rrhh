import { useQuery } from "@tanstack/react-query";
import { createWorkerService } from "../services/create-worker.service";
import { isUuid } from "../utils/catalog-options";

export function useAreasAndPositions(areaId?: string) {
 const {
 data: areas = [],
 isLoading: isAreasLoading,
 } = useQuery({
 queryKey: ["worker-create-areas"],
 queryFn: createWorkerService.getAreas,
 staleTime: 10 * 60 * 1000,
 });

 const {
 data: jobPositions = [],
 isFetching: isJobPositionsFetching,
 isLoading: isJobPositionsLoading,
 } = useQuery({
 queryKey: ["worker-create-job-positions", areaId],
 queryFn: () => createWorkerService.getJobPositions(areaId as string),
 enabled: isUuid(areaId),
 staleTime: 10 * 60 * 1000,
 });

 return {
 areas,
 jobPositions,
 areasQuery: {
 isLoading: isAreasLoading,
 },
 jobPositionsQuery: {
 isFetching: isJobPositionsFetching,
 isLoading: isJobPositionsLoading,
 },
 };
}
