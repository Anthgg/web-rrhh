"use client";

import { useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Plus, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { FieldFrame, Select } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingPanel } from "@/components/shared/states";
import { workersService } from "@/services/workers.service";
import { onboardingService } from "@/modules/workers/onboarding/services/onboarding.service";
import { organizationService } from "@/services/organization.service";
import type { ApiErrorPayload } from "@/types";
import { extractArray } from "@/lib/utils/extract-array";
import { WorkLocationFormModal } from "@/features/work-locations/components/WorkLocationFormModal";
import { WorkerReassignModal } from "@/features/work-crews/components/WorkerReassignModal";
import { canReassignWorker, getApiErrorCode, getApiErrorDetails, WORKER_ASSIGNMENT_ERROR_MESSAGES } from "@/lib/api/error-handlers";
import { profileService } from "@/services/profile.service";
import { normalizeCurrentUserProfile } from "@/lib/api/normalizers";

const laborAssignmentSchema = z.object({
 companyId: z.string().optional(),
 branchId: z.string().optional(),
 departmentId: z.string().optional(),
 areaId: z.string().optional(),
 positionId: z.string().optional(),
 workLocationId: z.string().min(1, "El lugar de trabajo es requerido"),
});

type LaborAssignmentFormData = z.infer<typeof laborAssignmentSchema>;

interface LaborAssignmentFormProps {
 workerId: string;
}

export function LaborAssignmentForm({ workerId }: LaborAssignmentFormProps) {
 const queryClient = useQueryClient();
 const [formState, setFormState] = useState({
 isLocationModalOpen: false,
 globalError: null as { message: string; details?: unknown } | null,
 saved: false,
 assignmentConflict: null as any | null,
 isReassignOpen: false,
 });

 const { isLocationModalOpen, globalError, saved, assignmentConflict, isReassignOpen } = formState;

 const setIsLocationModalOpen = (val: boolean) => setFormState(prev => ({ ...prev, isLocationModalOpen: val }));
 const setSaved = (val: boolean) => setFormState(prev => ({ ...prev, saved: val }));
 const setGlobalError = (val: { message: string; details?: unknown } | null) => setFormState(prev => ({ ...prev, globalError: val }));
 const setAssignmentConflict = (val: any | null) => setFormState(prev => ({ ...prev, assignmentConflict: val }));
 const setIsReassignOpen = (val: boolean) => setFormState(prev => ({ ...prev, isReassignOpen: val }));

 const { data: profileData } = useQuery({
 queryKey: ["current-user-profile"],
 queryFn: () => profileService.get(),
 select: normalizeCurrentUserProfile,
 staleTime: 30 * 60 * 1000,
 });

 // Load current worker detail to pre-fill form
 const {
 data: workerData,
 isError: isWorkerError,
 isLoading: isWorkerLoading,
 refetch: refetchWorker,
 } = useQuery({
 queryKey: ["worker-detail", workerId],
 queryFn: () => workersService.detail(workerId),
 enabled: Boolean(workerId),
 });

 const defaultValues = useMemo<LaborAssignmentFormData>(() => {
 const w = workerData;
 return {
 companyId: "",
 branchId: w?.sede_id ?? "",
 departmentId: w?.internal_department_id ?? "",
 areaId: w?.area_id ?? "",
 positionId: w?.position_id ?? "",
 workLocationId: w?.work_location_id ?? "",
 };
 }, [workerData]);

 const {
 control,
 watch,
 handleSubmit,
 setValue,
 reset,
 formState: { errors, isDirty },
 } = useForm<LaborAssignmentFormData>({
 resolver: zodResolver(laborAssignmentSchema),
 values: defaultValues,
 });

 const selectedDepartmentId = watch("departmentId");
 const selectedAreaId = watch("areaId");

 // Catalogs
 const { data: companies, isLoading: isLoadingCompanies } = useQuery({
 queryKey: ["companies"],
 queryFn: onboardingService.getCompanies,
 });

 const { data: branches, isLoading: isLoadingBranches } = useQuery({
 queryKey: ["branches"],
 queryFn: onboardingService.getBranches,
 });

 const { data: departments, isLoading: isLoadingDepartments } = useQuery({
 queryKey: ["departments"],
 queryFn: onboardingService.getDepartments,
 });

 const { data: areas, isLoading: isLoadingAreas } = useQuery({
 queryKey: ["areas", selectedDepartmentId],
 queryFn: () => onboardingService.getAreasByDepartment(selectedDepartmentId!),
 enabled: Boolean(selectedDepartmentId),
 });

 const { data: positions, isLoading: isLoadingPositions } = useQuery({
 queryKey: ["positions", selectedAreaId],
 queryFn: () => onboardingService.getPositionsByArea(selectedAreaId!),
 enabled: Boolean(selectedAreaId),
 });

 // Work locations — only active ones for assignment
 const { data: workLocationsRaw, isLoading: isLoadingLocations } = useQuery({
 queryKey: ["work-locations-active"],
 queryFn: async () => {
 const data = await organizationService.getWorkLocations();
 const arr = extractArray(data) as any[];
 return arr.filter((l) => l.is_active !== false);
 },
 });
 const workLocations = workLocationsRaw ?? [];

 const mutation = useMutation({
 mutationFn: async (values: LaborAssignmentFormData) => {
 setGlobalError(null);
 setSaved(false);
 const payload = {
 assignment_type: "permanent" as const,
 ...(values.branchId ? { sede_id: values.branchId } : {}),
 ...(values.departmentId
 ? { internal_department_id: values.departmentId }
 : {}),
 ...(values.areaId ? { area_id: values.areaId } : {}),
 ...(values.positionId ? { position_id: values.positionId } : {}),
 work_location_id: values.workLocationId,
 };
 return workersService.updateLaborAssignment(workerId, payload);
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["worker-detail", workerId] });
 queryClient.invalidateQueries({ queryKey: ["workers"] });
 setSaved(true);
 toast.success("Asignación laboral actualizada correctamente.");
 },
 onError: (error: any) => {
 const errorCode = getApiErrorCode(error);
 const details = getApiErrorDetails(error);

 if (errorCode === "WORKER_ALREADY_ASSIGNED") {
 setAssignmentConflict({
 workerId,
 requestedWorkLocationId: watch("workLocationId"),
 requestedCrewId: null,
 details,
 });
 setGlobalError({
 message: WORKER_ASSIGNMENT_ERROR_MESSAGES.WORKER_ALREADY_ASSIGNED,
 details,
 });
 toast.warning(WORKER_ASSIGNMENT_ERROR_MESSAGES.WORKER_ALREADY_ASSIGNED);
 return;
 }

 if (errorCode === "WORKER_REASSIGN_FORBIDDEN") {
 setGlobalError({
 message: WORKER_ASSIGNMENT_ERROR_MESSAGES.WORKER_REASSIGN_FORBIDDEN,
 details,
 });
 toast.error(WORKER_ASSIGNMENT_ERROR_MESSAGES.WORKER_REASSIGN_FORBIDDEN);
 return;
 }

 const msg =
 WORKER_ASSIGNMENT_ERROR_MESSAGES[errorCode || ""] ||
 error.response?.data?.message ||
 error.message ||
 "No se pudo guardar la asignación.";
 setGlobalError({ message: msg, details });
 toast.error(msg);
 },
 });

 if (isWorkerLoading) {
 return <LoadingPanel title="Cargando datos del trabajador..." />;
 }

 if (isWorkerError) {
 return (
 <ErrorState
 title="No se pudo cargar el trabajador"
 description="Intenta de nuevo más tarde."
 onRetry={() => void refetchWorker()}
 />
 );
 }

 const worker = workerData;
 const currentLocationName = worker?.work_location_name;

 return (
 <div className="grid gap-6">
 {/* Current work location banner */}
 {currentLocationName && (
 <div className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 px-4 py-3">
 <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
 <MapPin className="size-4" />
 </div>
 <div className="grid gap-0.5">
 <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">
 Lugar de trabajo actual
 </p>
 <p className="text-sm font-medium text-indigo-900">
 {currentLocationName}
 </p>
 </div>
 </div>
 )}

 <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-5">
 <div className="grid gap-5 md:grid-cols-2">
 {/* Empresa */}
 <Controller
 name="companyId"
 control={control}
 render={({ field }) => (
 <FieldFrame label="Empresa" error={errors.companyId?.message}>
 <Select {...field} disabled={isLoadingCompanies || mutation.isPending}>
 <option value="">Selecciona Empresa...</option>
 {companies?.map((c) => (
 <option key={c.id} value={c.id}>
 {c.name}
 </option>
 ))}
 </Select>
 </FieldFrame>
 )}
 />

 {/* Sede */}
 <Controller
 name="branchId"
 control={control}
 render={({ field }) => (
 <FieldFrame label="Sede" error={errors.branchId?.message}>
 <Select {...field} disabled={isLoadingBranches || mutation.isPending}>
 <option value="">Selecciona Sede...</option>
 {branches?.map((b) => (
 <option key={b.id} value={b.id}>
 {b.name}
 </option>
 ))}
 </Select>
 </FieldFrame>
 )}
 />

 {/* Departamento Interno */}
 <Controller
 name="departmentId"
 control={control}
 render={({ field }) => (
 <FieldFrame
 label="Departamento Interno"
 error={errors.departmentId?.message}
 >
 <Select
 {...field}
 disabled={isLoadingDepartments || mutation.isPending}
 onChange={(e) => {
 field.onChange(e);
 setValue("areaId", "");
 setValue("positionId", "");
 }}
 >
 <option value="">Selecciona Departamento...</option>
 {departments?.map((d) => (
 <option key={d.id} value={d.id}>
 {d.name}
 </option>
 ))}
 </Select>
 </FieldFrame>
 )}
 />

 {/* Área */}
 <Controller
 name="areaId"
 control={control}
 render={({ field }) => (
 <FieldFrame label="Área" error={errors.areaId?.message}>
 <Select
 {...field}
 disabled={
 !selectedDepartmentId || isLoadingAreas || mutation.isPending
 }
 onChange={(e) => {
 field.onChange(e);
 setValue("positionId", "");
 }}
 >
 <option value="">
 {!selectedDepartmentId
 ? "Selecciona Departamento primero..."
 : "Selecciona Área..."}
 </option>
 {areas?.map((a) => (
 <option key={a.id} value={a.id}>
 {a.name}
 </option>
 ))}
 </Select>
 </FieldFrame>
 )}
 />

 {/* Puesto */}
 <Controller
 name="positionId"
 control={control}
 render={({ field }) => (
 <FieldFrame label="Puesto" error={errors.positionId?.message}>
 <Select
 {...field}
 disabled={
 !selectedAreaId || isLoadingPositions || mutation.isPending
 }
 >
 <option value="">
 {!selectedAreaId
 ? "Selecciona Área primero..."
 : "Selecciona Puesto..."}
 </option>
 {positions?.map((p) => (
 <option key={p.id} value={p.id}>
 {p.name}
 </option>
 ))}
 </Select>
 </FieldFrame>
 )}
 />

 {/* Lugar de Trabajo — campo clave */}
 <Controller
 name="workLocationId"
 control={control}
 render={({ field }) => (
 <FieldFrame
 label="Lugar de Trabajo / Obra"
 error={errors.workLocationId?.message}
 >
 <div className="flex items-center gap-2">
 <Select
 {...field}
 disabled={isLoadingLocations || mutation.isPending}
 className="flex-1"
 >
 <option value="">Selecciona Lugar...</option>
 {workLocations.map((l: any) => (
 <option key={l.id} value={l.id}>
 {l.name}
 </option>
 ))}
 </Select>
 <Button
 type="button"
 variant="secondary"
 className="h-10 shrink-0 px-3"
 onClick={() => setIsLocationModalOpen(true)}
 disabled={mutation.isPending}
 title="Crear nuevo lugar de trabajo"
 >
 <Plus className="size-4" />
 </Button>
 </div>
 </FieldFrame>
 )}
 />
 </div>

 {/* Error global */}
 {globalError && (
 <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 flex flex-col gap-3">
 <div>
 <h4 className="text-sm font-semibold text-rose-800">
 No se pudo guardar la asignación
 </h4>
 <p className="mt-1 text-sm text-rose-700">{globalError.message}</p>
 </div>
 {assignmentConflict && (
 <div className="mt-2 border-t border-rose-200/50 pt-2 flex flex-col gap-2">
 <p className="text-xs text-rose-700/80 font-normal">
 El trabajador ya se encuentra asignado a otra obra o cuadrilla. Puedes solicitar una reasignación formal.
 </p>
 {canReassignWorker(profileData) ? (
 <Button
 type="button"
 onClick={() => setIsReassignOpen(true)}
 className="w-fit bg-amber-500 hover:bg-amber-600 text-white font-medium shadow-sm h-8 px-3 rounded-lg text-xs"
 >
 Reasignar trabajador
 </Button>
 ) : (
 <p className="text-xs text-rose-600 font-medium">
 Solo su supervisor actual, RR.HH. o un administrador puede moverlo.
 </p>
 )}
 </div>
 )}
 {Boolean(globalError.details) && !assignmentConflict && (
 <pre className="mt-3 overflow-x-auto rounded-lg bg-rose-900/10 p-3 text-xs text-rose-900">
 {JSON.stringify(globalError.details, null, 2)}
 </pre>
 )}
 </div>
 )}

 {/* Success banner */}
 {saved && !isDirty && (
 <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
 <CheckCircle2 className="size-4 shrink-0" />
 Asignación guardada correctamente.
 </div>
 )}

 <div className="flex justify-end border-t border-border pt-5">
 <Button type="submit" disabled={mutation.isPending || !isDirty}>
 {mutation.isPending ? (
 <span className="flex items-center gap-2">
 <span className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
 Guardando...
 </span>
 ) : (
 "Guardar Asignación"
 )}
 </Button>
 </div>
 </form>

 {/* Quick-create work location without leaving the form */}
 <WorkLocationFormModal
 isOpen={isLocationModalOpen}
 onClose={() => setIsLocationModalOpen(false)}
 />

 {isReassignOpen && assignmentConflict && (
 <WorkerReassignModal
 isOpen={isReassignOpen}
 onClose={() => setIsReassignOpen(false)}
 workerId={assignmentConflict.workerId}
 targetWorkLocationId={assignmentConflict.requestedWorkLocationId}
 targetCrewId={assignmentConflict.requestedCrewId}
 onSuccess={() => {
 setAssignmentConflict(null);
 setGlobalError(null);
 // Refetch details to see updated values
 queryClient.invalidateQueries({ queryKey: ["worker-detail", workerId] });
 queryClient.invalidateQueries({ queryKey: ["workers"] });
 }}
 />
 )}
 </div>
 );
}
