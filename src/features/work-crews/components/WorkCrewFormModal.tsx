"use client";

import { Controller, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, UsersRound, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FieldFrame, Input, Select } from "@/components/ui/fields";
import {
 workCrewsService,
 type WorkCrew,
 type WorkCrewPayload,
} from "@/services/work-crews.service";
import { workersService } from "@/services/workers.service";
import { organizationService, type OrganizationWorkLocation } from "@/services/organization.service";
import { extractArray } from "@/lib/utils/extract-array";
import { getSafeWorkerId, isUuid } from "@/lib/api/worker-ids";
import type { WorkerRecord } from "@/types";
import {
 extractApiWarnings,
 handleWorkCrewSupervisorError,
 handleWorkCrewWarnings,
} from "@/features/work-crews/work-crew-supervisor-rules";

interface WorkCrewFormModalProps {
 isOpen: boolean;
 onClose: () => void;
 crewData: WorkCrew | null;
}

type FormData = {
 name: string;
 description: string;
 supervisorId: string;
 workLocationId: string;
};

type SupervisorOption = {
 id: string;
 name: string;
};

function getSupervisorName(supervisor: WorkerRecord) {
 const record = supervisor as WorkerRecord & {
 first_name?: string | null;
 last_name?: string | null;
 name?: string | null;
 };

 return (
 supervisor.fullName ||
 record.name ||
 [record.first_name, record.last_name].filter(Boolean).join(" ") ||
 "Supervisor sin nombre"
 );
}

function getSupervisorOptions(supervisors: WorkerRecord[]) {
 return supervisors.flatMap<SupervisorOption>((supervisor) => {
 const id = getSafeWorkerId(supervisor);
 return id ? [{ id, name: getSupervisorName(supervisor) }] : [];
 });
}

export function WorkCrewFormModal({
 isOpen,
 onClose,
 crewData,
}: WorkCrewFormModalProps) {
 if (!isOpen) return null;

 return <WorkCrewFormModalContent crewData={crewData} onClose={onClose} />;
}

function WorkCrewFormModalContent({
 onClose,
 crewData,
}: Omit<WorkCrewFormModalProps, "isOpen">) {
 const queryClient = useQueryClient();
 const isEditing = !!crewData;

 const {
 control,
 handleSubmit,
 setError,
 formState: { errors, isDirty },
 } = useForm<FormData>({
 defaultValues: {
 name: crewData?.name ?? "",
 description: crewData?.description ?? "",
 supervisorId: crewData?.supervisor_id ?? "",
 workLocationId: crewData?.work_location_id ?? "",
 },
 });

 const {
 data: supervisorsData = [],
 isLoading: isLoadingSupervisors,
 } = useQuery({
 queryKey: ["supervisors"],
 queryFn: async () => {
 const data = await workersService.getSupervisors();
 return extractArray<WorkerRecord>(data);
 },
 });

 const {
 data: locationsData = [],
 isLoading: isLoadingLocations,
 } = useQuery({
 queryKey: ["work-locations"],
 queryFn: async () => {
 const data = await organizationService.getWorkLocations();
 return extractArray<OrganizationWorkLocation>(data);
 },
 });

 const mutation = useMutation({
 mutationFn: (payload: WorkCrewPayload) => {
 if (isEditing && crewData) {
 return workCrewsService.updateWorkCrew(crewData.id, payload);
 }

 return workCrewsService.createWorkCrew({ ...payload, is_active: true });
 },
 onSuccess: (response) => {
 handleWorkCrewWarnings(extractApiWarnings(response));
 toast.success(isEditing ? "Cuadrilla actualizada correctamente." : "Cuadrilla creada correctamente.");
 queryClient.invalidateQueries({ queryKey: ["work-crews"] });
 onClose();
 },
 onError: (error) => {
 handleWorkCrewSupervisorError(error, setError);
 },
 });

 const onSubmit = (data: FormData) => {
 if (data.supervisorId && !isUuid(data.supervisorId)) {
 setError("supervisorId", {
 type: "manual",
 message: "Selecciona un supervisor valido.",
 });
 return;
 }

 mutation.mutate({
 name: data.name,
 description: data.description,
 supervisorId: data.supervisorId || null,
 workLocationId: data.workLocationId,
 });
 };

 const supervisorOptions = getSupervisorOptions(supervisorsData);
 const locations = locationsData;
 const showCurrentSupervisorFallback =
 crewData?.supervisor_id &&
 !supervisorOptions.some((supervisor) => supervisor.id === crewData.supervisor_id);

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4 backdrop-blur-sm">
 <div className="flex w-full max-w-[600px] flex-col overflow-hidden rounded-2xl bg-muted shadow-2xl">
 <div className="flex shrink-0 items-center justify-between border-b border-border bg-card px-6 py-5">
 <div className="flex items-center gap-3">
 <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
 <UsersRound className="size-5" />
 </div>
 <div>
 <h2 className="text-lg font-bold text-foreground">
 {isEditing ? "Editar cuadrilla" : "Nueva cuadrilla"}
 </h2>
 <p className="text-xs text-muted-foreground">
 {isEditing
 ? "Modifica los detalles de la cuadrilla."
 : "Registra un nuevo grupo de trabajo."}
 </p>
 </div>
 </div>
 <button
 type="button"
 onClick={onClose}
 className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-muted-foreground"
 >
 <X className="size-5" />
 </button>
 </div>

 <div className="overflow-y-auto p-6">
 <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
 <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
 <h3 className="mb-4 border-b border-border pb-2 text-sm font-bold text-foreground">
 Datos generales
 </h3>

 <Controller
 name="name"
 control={control}
 rules={{ required: "El nombre es requerido" }}
 render={({ field }) => (
 <FieldFrame label="Nombre de la cuadrilla *" error={errors.name?.message}>
 <Input {...field} disabled={mutation.isPending} placeholder="Ej. Cuadrilla Norte" />
 </FieldFrame>
 )}
 />

 <Controller
 name="description"
 control={control}
 render={({ field }) => (
 <FieldFrame label="Descripcion" hint="Opcional">
 <Input {...field} disabled={mutation.isPending} placeholder="Ej. Equipo encargado del sector norte" />
 </FieldFrame>
 )}
 />
 </div>

 <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
 <h3 className="mb-4 border-b border-border pb-2 text-sm font-bold text-foreground">
 Asignaciones
 </h3>

 <Controller
 name="supervisorId"
 control={control}
 rules={{ required: "Debe seleccionar un supervisor" }}
 render={({ field }) => (
 <FieldFrame label="Supervisor *" error={errors.supervisorId?.message}>
 <Select {...field} disabled={mutation.isPending || isLoadingSupervisors}>
 <option value="" disabled>
 {isLoadingSupervisors ? "Cargando supervisores..." : "Seleccionar supervisor"}
 </option>
 {showCurrentSupervisorFallback ? (
 <option value={crewData.supervisor_id ?? ""}>
 {crewData.supervisor_name || "Supervisor actual"}
 </option>
 ) : null}
 {supervisorOptions.map((supervisor) => (
 <option key={supervisor.id} value={supervisor.id}>
 {supervisor.name}
 </option>
 ))}
 </Select>
 {supervisorOptions.length === 0 && !isLoadingSupervisors && !crewData?.supervisor_id ? (
 <p className="mt-1 text-xs text-amber-600">
 No hay supervisores disponibles. Registra o activa un supervisor primero.
 </p>
 ) : null}
 </FieldFrame>
 )}
 />

 <Controller
 name="workLocationId"
 control={control}
 rules={{ required: "Debe seleccionar una obra" }}
 render={({ field }) => (
 <FieldFrame label="Obra principal *" error={errors.workLocationId?.message}>
 <Select
 {...field}
 disabled={mutation.isPending || isLoadingLocations || locations.length === 0}
 >
 <option value="" disabled>
 {isLoadingLocations ? "Cargando obras..." : "Seleccionar obra"}
 </option>
 {locations.map((location) => (
 <option key={location.id} value={location.id}>
 {location.name}
 </option>
 ))}
 </Select>
 {locations.length === 0 && !isLoadingLocations ? (
 <p className="mt-1 text-xs text-amber-600">
 No hay obras activas disponibles. Crea una obra antes de asignarla.
 </p>
 ) : null}
 </FieldFrame>
 )}
 />
 </div>

 <div className="flex justify-end gap-3 pt-4">
 <Button
 type="button"
 variant="secondary"
 onClick={onClose}
 className="border-border text-muted-foreground"
 >
 Cancelar
 </Button>
 <Button
 type="submit"
 disabled={mutation.isPending || (!isDirty && isEditing)}
 className="bg-indigo-600 text-white hover:bg-indigo-700"
 >
 {mutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
 {isEditing ? "Guardar cambios" : "Crear cuadrilla"}
 </Button>
 </div>
 </form>
 </div>
 </div>
 </div>
 );
}
