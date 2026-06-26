"use client";

import { useState, useMemo } from "react";
import { CreateWorkLocationModal } from "../../components/CreateWorkLocationModal";
import type { CatalogItem } from "../types/onboarding.types";
import { useQuery } from "@tanstack/react-query";
import { workCrewsService } from "@/services/work-crews.service";
import { isUuid } from "@/lib/api/worker-ids";
import { LaborScheduleCard } from "./LaborScheduleCard";
import { LaborStructureCard } from "./LaborStructureCard";
import { RequiredDocumentsCard } from "./RequiredDocumentsCard";
import type { LaborDataFormProps, WorkCrew } from "./labor-data.types";

const withAssignedOption = (items: CatalogItem[], selectedId: string | undefined, label: string): CatalogItem[] =>
 selectedId && !items.some((item) => item.id === selectedId)
 ? [{ id: selectedId, name: label }, ...items]
 : items;

export function LaborDataForm({ form, preservePositionOnAreaChange = false, catalogs }: LaborDataFormProps) {
 const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
 const {
 register,
 setValue,
 watch,
 formState: { errors },
 } = form;
 const laborErrors = errors.laborData;

 const selectedDepartmentId = watch("laborData.departmentId");
 const selectedAreaId = watch("laborData.areaId");
 const selectedPositionId = watch("laborData.positionId");
 const selectedWorkLocationId = watch("laborData.workLocationId");
 const selectedWorkerTypeId = watch("laborData.workerTypeId");
 const selectedShiftId = watch("laborData.shiftId");
 const selectedSupervisorId = watch("laborData.supervisorId");
 const selectedCrewId = watch("laborData.crewId");
 const selectedCrewName = watch("laborData.crewName");

 const { data: workCrews = [], isLoading: isLoadingCrews } = useQuery({
 queryKey: ["work-crews-by-location", selectedWorkLocationId],
 queryFn: async () => {
 const res = await workCrewsService.getWorkCrewsByLocation(selectedWorkLocationId);
 const items = Array.isArray(res)
 ? res
 : Array.isArray((res as { data?: unknown }).data)
 ? (res as { data: WorkCrew[] }).data
 : [];
 return items.filter((crew: WorkCrew) => {
 const isActive =
 crew.isActive ??
 crew.is_active ??
 (crew.status !== undefined ? crew.status === "active" : true);
 return Boolean(isActive);
 });
 },
 enabled: isUuid(selectedWorkLocationId),
 staleTime: 5 * 60 * 1000,
 retry: false,
 });

 const selectedShift = catalogs.shifts.find((shift) => shift.id === selectedShiftId);
 const filteredPositions = useMemo(() => {
 if (!selectedAreaId) return catalogs.positions;
 return catalogs.positions.filter((p) => p.areaId === selectedAreaId);
 }, [catalogs.positions, selectedAreaId]);

 const positionOptions = useMemo(
 () => withAssignedOption(filteredPositions, selectedPositionId, "Cargo asignado actualmente"),
 [filteredPositions, selectedPositionId],
 );
 const workLocationOptions = useMemo(
 () => withAssignedOption(catalogs.workLocations, selectedWorkLocationId, "Lugar de trabajo asignado actualmente"),
 [catalogs.workLocations, selectedWorkLocationId],
 );
 const workerTypeOptions = useMemo(
 () => withAssignedOption(catalogs.workerTypes, selectedWorkerTypeId, "Tipo asignado actualmente"),
 [catalogs.workerTypes, selectedWorkerTypeId],
 );
 const supervisorOptions = useMemo(() => {
 let items = catalogs.supervisors || [];
 if (selectedSupervisorId && !items.some((item) => item.id === selectedSupervisorId)) {
 // Find if this supervisor is the supervisor of the currently selected crew
 const currentCrew = workCrews.find((c: WorkCrew) => c.id === selectedCrewId);
 const supervisorName = (currentCrew && currentCrew.supervisor_id === selectedSupervisorId)
 ? currentCrew.supervisor_name
 : "Supervisor asignado actualmente";
 items = [{ id: selectedSupervisorId, name: supervisorName || "Supervisor asignado actualmente" }, ...items];
 }
 return items;
 }, [catalogs.supervisors, selectedSupervisorId, selectedCrewId, workCrews]);
 const isCompanyLocked = catalogs.companies.length === 1;
 const hasSelectedDepartment = Boolean(selectedDepartmentId);
 const hasSelectedArea = Boolean(selectedAreaId);
 const hasAreas = catalogs.areas.length > 0;
 const hasPositions = positionOptions.length > 0;
 const organizationState = useMemo(
 () => ({
 preservePositionOnAreaChange,
 isCompanyLocked,
 hasSelectedDepartment,
 hasSelectedArea,
 hasAreas,
 hasPositions,
 }),
 [
 preservePositionOnAreaChange,
 isCompanyLocked,
 hasSelectedDepartment,
 hasSelectedArea,
 hasAreas,
 hasPositions,
 ],
 );

 return (
 <div className="space-y-6">
 <LaborStructureCard
 register={register}
 setValue={setValue}
 laborErrors={laborErrors}
 catalogs={catalogs}
 organizationState={organizationState}
 selectedPositionId={selectedPositionId}
 selectedWorkLocationId={selectedWorkLocationId}
 selectedCrewId={selectedCrewId}
 selectedCrewName={selectedCrewName}
 positionOptions={positionOptions}
 workLocationOptions={workLocationOptions}
 workCrews={workCrews}
 isLoadingCrews={isLoadingCrews}
 onOpenLocationModal={() => setIsLocationModalOpen(true)}
 />
 
 <CreateWorkLocationModal
 isOpen={isLocationModalOpen}
 onClose={() => setIsLocationModalOpen(false)}
 onSuccess={(newId) => {
 setValue("laborData.workLocationId", newId, { shouldValidate: true });
 setValue("laborData.crewId", "", { shouldValidate: true });
 setValue("laborData.crewName", "", { shouldDirty: true });
 }}
 />

 <LaborScheduleCard
 register={register}
 setValue={setValue}
 laborErrors={laborErrors}
 selectedWorkerTypeId={selectedWorkerTypeId}
 workerTypeOptions={workerTypeOptions}
 catalogs={catalogs}
 selectedSupervisorId={selectedSupervisorId}
 supervisorOptions={supervisorOptions}
 selectedShift={selectedShift}
 />

 <RequiredDocumentsCard form={form} />
 </div>
 );
}
