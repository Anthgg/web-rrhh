"use client";

import { useState, useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";
import { FieldFrame, Input, Select } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateWorkLocationModal } from "../../components/CreateWorkLocationModal";
import type { OnboardingFormValues } from "../schemas/onboarding.schema";
import type { CatalogItem } from "../types/onboarding.types";
import { useQuery } from "@tanstack/react-query";
import { workCrewsService } from "@/services/work-crews.service";
import { isUuid } from "@/lib/api/worker-ids";

interface LaborDataFormProps {
 form: UseFormReturn<OnboardingFormValues>;
 preservePositionOnAreaChange?: boolean;
 catalogs: {
 companies: CatalogItem[];
 branches: CatalogItem[];
 departments: CatalogItem[];
 areas: CatalogItem[];
 positions: CatalogItem[];
 workLocations: CatalogItem[];
 workerTypes: CatalogItem[];
 shifts: CatalogItem[];
 supervisors?: CatalogItem[];
 isLoadingAreas?: boolean;
 isLoadingPositions?: boolean;
 };
}

const withAssignedOption = (items: CatalogItem[], selectedId: string | undefined, label: string): CatalogItem[] =>
 selectedId && !items.some((item) => item.id === selectedId)
 ? [{ id: selectedId, name: label }, ...items]
 : items;

interface LaborScheduleCardProps {
 register: any;
 setValue: any;
 laborErrors: any;
 selectedWorkerTypeId?: string;
 workerTypeOptions: CatalogItem[];
 catalogs: LaborDataFormProps["catalogs"];
 selectedSupervisorId?: string;
 supervisorOptions: CatalogItem[];
 selectedShift?: CatalogItem;
}

export function LaborScheduleCard({
 register,
 setValue,
 laborErrors,
 selectedWorkerTypeId,
 workerTypeOptions,
 catalogs,
 selectedSupervisorId,
 supervisorOptions,
 selectedShift,
}: LaborScheduleCardProps) {
 return (
 <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
 <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
 Detalles de Contratación y Horario
 </h4>
 <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
 <FieldFrame label="Tipo de Colaborador (opcional)" error={laborErrors?.workerTypeId?.message}>
 <Select
 {...register("laborData.workerTypeId")}
 value={selectedWorkerTypeId || ""}
 onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
 setValue("laborData.workerTypeId", event.target.value, {
 shouldDirty: true,
 shouldTouch: true,
 shouldValidate: true,
 });
 }}
 >
 <option value="">Sin tipo asignado</option>
 {workerTypeOptions.map((workerType) => (
 <option key={`type-${workerType.id}`} value={workerType.id}>
 {workerType.name}
 </option>
 ))}
 </Select>
 </FieldFrame>

 <FieldFrame label="Fecha de Ingreso" error={laborErrors?.startDate?.message}>
 <Input type="date" {...register("laborData.startDate")} />
 </FieldFrame>

 <FieldFrame label="Estado del Trabajador" error={laborErrors?.status?.message}>
 <Select {...register("laborData.status")}>
 <option value="active">Activo</option>
 <option value="inactive">Inactivo</option>
 </Select>
 </FieldFrame>

 <FieldFrame label="Turno Laboral" error={laborErrors?.shiftId?.message}>
 <Select {...register("laborData.shiftId")}>
 <option value="">Selecciona Turno...</option>
 {catalogs.shifts.map((shift) => (
 <option key={`shift-${shift.id}`} value={shift.id}>
 {shift.name}
 </option>
 ))}
 </Select>
 </FieldFrame>

 <FieldFrame label="Supervisor Directo (opcional)" error={laborErrors?.supervisorId?.message}>
 <Select
 {...register("laborData.supervisorId")}
 value={selectedSupervisorId || ""}
 onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
 setValue("laborData.supervisorId", event.target.value, {
 shouldDirty: true,
 shouldTouch: true,
 shouldValidate: true,
 });
 }}
 >
 <option value="">Sin supervisor directo</option>
 {supervisorOptions.map((supervisor) => (
 <option key={`sup-${supervisor.id}`} value={supervisor.id}>
 {supervisor.name}
 </option>
 ))}
 </Select>
 </FieldFrame>
 </div>

 {selectedShift?.schedule ? (
 <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/30 p-3 text-xs text-indigo-700">
 <span className="font-semibold">Horario del turno seleccionado ({selectedShift.name}): </span>
 {selectedShift.schedule}
 </div>
 ) : null}
 </div>
 );
}

interface LaborOrganizationUiState {
 preservePositionOnAreaChange: boolean;
 isCompanyLocked: boolean;
 hasSelectedDepartment: boolean;
 hasSelectedArea: boolean;
 hasAreas: boolean;
 hasPositions: boolean;
}

interface LaborOrganizationFieldsProps {
 register: any;
 setValue: any;
 laborErrors: any;
 catalogs: LaborDataFormProps["catalogs"];
 organizationState: LaborOrganizationUiState;
 selectedPositionId?: string | null;
 positionOptions: CatalogItem[];
}

function LaborOrganizationFields({
 register,
 setValue,
 laborErrors,
 catalogs,
 organizationState,
 selectedPositionId,
 positionOptions,
}: LaborOrganizationFieldsProps) {
 const {
 preservePositionOnAreaChange,
 isCompanyLocked,
 hasSelectedDepartment,
 hasSelectedArea,
 hasAreas,
 hasPositions,
 } = organizationState;

 return (
 <>
 <FieldFrame label="Empresa / Razon Social" error={laborErrors?.companyId?.message}>
 {isCompanyLocked ? (
 <div className="relative">
 <Input
 value={catalogs.companies[0].name}
 disabled
 className="border-border bg-muted font-medium text-muted-foreground"
 />
 <input type="hidden" {...register("laborData.companyId")} value={catalogs.companies[0].id} />
 </div>
 ) : (
 <Select {...register("laborData.companyId")}>
 <option value="">Selecciona Empresa...</option>
 {catalogs.companies.map((company) => (
 <option key={`company-${company.id}`} value={company.id}>
 {company.name}
 </option>
 ))}
 </Select>
 )}
 </FieldFrame>

 <FieldFrame label="Sede de Trabajo (opcional)" error={laborErrors?.branchId?.message}>
 <Select {...register("laborData.branchId")}>
 <option value="">Selecciona Sede...</option>
 {catalogs.branches.map((branch) => (
 <option key={`branch-${branch.id}`} value={branch.id}>
 {branch.name}
 </option>
 ))}
 </Select>
 </FieldFrame>

 <FieldFrame label="Departamento Interno (Organizacion)" error={laborErrors?.departmentId?.message}>
 <Select
 {...register("laborData.departmentId")}
 onChange={(event) => {
 setValue("laborData.departmentId", event.target.value, { shouldValidate: true });
 setValue("laborData.areaId", "", { shouldValidate: true });
 if (!preservePositionOnAreaChange) {
 setValue("laborData.positionId", "", { shouldValidate: true });
 }
 }}
 >
 <option value="">Selecciona Departamento...</option>
 {catalogs.departments.map((department) => (
 <option key={`dept-${department.id}`} value={department.id}>
 {department.name}
 </option>
 ))}
 </Select>
 </FieldFrame>

 <FieldFrame label="Area" error={laborErrors?.areaId?.message}>
 <Select
 {...register("laborData.areaId")}
 disabled={!hasSelectedDepartment || catalogs.isLoadingAreas || (hasSelectedDepartment && !hasAreas)}
 className="disabled:bg-muted disabled:opacity-50"
 onChange={(event) => {
 setValue("laborData.areaId", event.target.value, { shouldValidate: true });
 if (!preservePositionOnAreaChange) {
 setValue("laborData.positionId", "", { shouldValidate: true });
 }
 }}
 >
 <option value="">
 {!hasSelectedDepartment
 ? "Selecciona Departamento primero..."
 : catalogs.isLoadingAreas
 ? "Cargando areas..."
 : hasAreas
 ? "Selecciona Area..."
 : "No hay areas para este departamento"}
 </option>
 {catalogs.areas.map((area) => (
 <option key={`area-${area.id}`} value={area.id}>
 {area.name}
 </option>
 ))}
 </Select>
 </FieldFrame>

 <FieldFrame label="Cargo o Puesto" error={laborErrors?.positionId?.message}>
 <Select
 {...register("laborData.positionId")}
 value={selectedPositionId || ""}
 onChange={(event) => {
 setValue("laborData.positionId", event.target.value, {
 shouldDirty: true,
 shouldTouch: true,
 shouldValidate: true,
 });
 }}
 disabled={(!hasSelectedArea && !selectedPositionId) || catalogs.isLoadingPositions || (hasSelectedArea && !hasPositions)}
 className="disabled:bg-muted disabled:opacity-50"
 >
 <option value="">
 {!hasSelectedArea
 ? "Selecciona Area primero..."
 : catalogs.isLoadingPositions
 ? "Cargando cargos..."
 : hasPositions
 ? "Selecciona Cargo..."
 : "No hay cargos para esta area"}
 </option>
 {positionOptions.map((position) => (
 <option key={`pos-${position.id}`} value={position.id}>
 {position.name}
 </option>
 ))}
 </Select>
 </FieldFrame>
 </>
 );
}

interface LaborWorkAssignmentFieldsProps {
 register: any;
 setValue: any;
 laborErrors: any;
 selectedWorkLocationId?: string;
 selectedCrewId?: string;
 selectedCrewName?: string | null;
 workLocationOptions: CatalogItem[];
 workCrews: any[];
 isLoadingCrews: boolean;
 onOpenLocationModal: () => void;
}

function LaborWorkAssignmentFields({
 register,
 setValue,
 laborErrors,
 selectedWorkLocationId,
 selectedCrewId,
 selectedCrewName,
 workLocationOptions,
 workCrews,
 isLoadingCrews,
 onOpenLocationModal,
}: LaborWorkAssignmentFieldsProps) {
 return (
 <>
 <FieldFrame label="Lugar de Trabajo / Obra" error={laborErrors?.workLocationId?.message}>
 <div className="flex gap-2">
 <Select
 {...register("laborData.workLocationId")}
 value={selectedWorkLocationId || ""}
 onChange={(event) => {
 const nextId = event.target.value;
 setValue("laborData.workLocationId", nextId, {
 shouldDirty: true,
 shouldTouch: true,
 shouldValidate: true,
 });
 setValue("laborData.crewId", "", {
 shouldDirty: true,
 shouldTouch: true,
 shouldValidate: true,
 });
 setValue("laborData.crewName", "", {
 shouldDirty: true,
 });
 }}
 className="flex-1"
 >
 <option value="">Selecciona Lugar de Trabajo...</option>
 {workLocationOptions.map((loc) => (
 <option key={`loc-${loc.id}`} value={loc.id}>
 {loc.name}
 </option>
 ))}
 </Select>
 <Button
 type="button"
 variant="secondary"
 className="shrink-0 rounded-xl"
 onClick={onOpenLocationModal}
 >
 <Plus className="size-4" />
 </Button>
 </div>
 </FieldFrame>

 <FieldFrame
 label="Cuadrilla (opcional)"
 error={laborErrors?.crewId?.message}
 hint="Opcional. Si no seleccionas una cuadrilla, el sistema intentara asignarla automaticamente segun la obra."
 >
 <div className="flex flex-col">
 <Select
 {...register("laborData.crewId")}
 value={selectedCrewId || ""}
 onChange={(event) => {
 const nextId = event.target.value;
 setValue("laborData.crewId", nextId, {
 shouldDirty: true,
 shouldTouch: true,
 shouldValidate: true,
 });
 const selectedCrew = workCrews.find((crew: any) => crew.id === nextId);
 setValue("laborData.crewName", selectedCrew ? selectedCrew.name : "", {
 shouldDirty: true,
 });

 if (selectedCrew && selectedCrew.supervisor_id) {
 setValue("laborData.supervisorId", selectedCrew.supervisor_id, {
 shouldDirty: true,
 shouldTouch: true,
 shouldValidate: true,
 });
 }
 }}
 disabled={!selectedWorkLocationId || isLoadingCrews}
 >
 {!selectedWorkLocationId ? (
 <option value="">Selecciona primero un lugar de trabajo...</option>
 ) : isLoadingCrews ? (
 <option value="">Cargando cuadrillas...</option>
 ) : workCrews.length === 0 ? (
 <option value="">No hay cuadrillas activas para esta obra</option>
 ) : (
 <>
 <option value="">Selecciona una cuadrilla...</option>
 {selectedCrewId && !workCrews.some((crew: any) => crew.id === selectedCrewId) && (
 <option value={selectedCrewId}>
 {selectedCrewName || "Cuadrilla asociada actualmente"} (Inactiva o no disponible)
 </option>
 )}
 {workCrews.map((crew: any) => (
 <option key={`crew-${crew.id}`} value={crew.id}>
 {crew.name}
 </option>
 ))}
 </>
 )}
 </Select>
 {selectedCrewId && !isLoadingCrews && !workCrews.some((crew: any) => crew.id === selectedCrewId) && (
 <div className="mt-1 text-xs text-amber-600 font-medium">
 Aviso: La cuadrilla asociada no esta disponible o ya no esta activa.
 </div>
 )}
 </div>
 </FieldFrame>
 </>
 );
}

interface LaborStructureCardProps extends LaborOrganizationFieldsProps, LaborWorkAssignmentFieldsProps {}

function LaborStructureCard(props: LaborStructureCardProps) {
 return (
 <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
 <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
 Asignacion Laboral / Estructura Organizativa
 </h4>
 <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
 <LaborOrganizationFields {...props} />
 <LaborWorkAssignmentFields {...props} />
 </div>
 </div>
 );
}

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
 const items = (res as any)?.data ?? res ?? [];
 return items.filter((crew: any) => {
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
 const currentCrew = workCrews.find((c: any) => c.id === selectedCrewId);
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
 </div>
 );
}
