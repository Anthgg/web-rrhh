"use client";

import { useForm, Controller } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldFrame, Input, Select } from "@/components/ui/fields";
import { toast } from "sonner";

import { workersService, LaborAssignmentPayload } from "@/services/workers.service";
import { organizationService, OrganizationWorkLocation } from "@/services/organization.service";
import { extractArray } from "@/lib/utils/extract-array";

const LABOR_ASSIGNMENT_ERROR_MESSAGES: Record<string, string> = {
 INVALID_WORKER_ID: "El trabajador seleccionado no tiene un ID válido.",
 INVALID_ASSIGNMENT_TYPE: "El tipo de asignación no es válido.",
 TEMPORARY_ASSIGNMENT_END_DATE_REQUIRED:
 "La fecha de fin es obligatoria para un traslado temporal.",
 WORK_LOCATION_INVALID:
 "La obra seleccionada no existe, está inactiva o no pertenece a la empresa.",
 WORKER_ASSIGNMENT_ACCESS_DENIED:
 "No tienes permisos para gestionar la asignación de este trabajador.",
 TEMPORARY_ASSIGNMENT_OVERLAP:
 "El trabajador ya tiene un traslado temporal activo.",
};

const getTomorrowDate = () => {
 const tomorrow = new Date();
 tomorrow.setDate(tomorrow.getDate() + 1);
 const year = tomorrow.getFullYear();
 const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
 const day = String(tomorrow.getDate()).padStart(2, "0");
 return `${year}-${month}-${day}`;
};

interface WorkerIndividualAssignmentModalProps {
 isOpen: boolean;
 onClose: () => void;
 workerId: string;
 crewId?: string;
}

type FormData = {
 workLocationId: string;
 assignmentType: "temporary" | "permanent";
 endDate: string;
 reason: string;
 autoReturn: boolean;
};

export function WorkerIndividualAssignmentModal({
 isOpen,
 onClose,
 workerId,
 crewId,
}: WorkerIndividualAssignmentModalProps) {
 const queryClient = useQueryClient();

 const {
 control,
 handleSubmit,
 watch,
 formState: { errors },
 } = useForm<FormData>({
 defaultValues: {
 workLocationId: "",
 assignmentType: "temporary",
 endDate: "",
 reason: "",
 autoReturn: true,
 },
 });

 const assignmentType = watch("assignmentType");

 const { data: locations = [], isLoading: isLoadingLocations } = useQuery({
 queryKey: ["work-locations"],
 queryFn: async () => {
 const data = await organizationService.getWorkLocations();
 return extractArray<OrganizationWorkLocation>(data);
 },
 enabled: isOpen,
 });

 const mutation = useMutation({
 mutationFn: (data: FormData) => {
 // Send both snake_case (primary backend contract) and camelCase fields in the body
 // to guarantee compatibility regardless of which naming convention is processed.
 const payload = {
 work_location_id: data.workLocationId,
 assignment_type: data.assignmentType,
 reason: data.reason || undefined,
 auto_return: data.assignmentType === "temporary" ? data.autoReturn : undefined,
 end_date: data.assignmentType === "temporary" ? data.endDate : null,
 
 workLocationId: data.workLocationId,
 assignmentType: data.assignmentType,
 autoReturn: data.assignmentType === "temporary" ? data.autoReturn : undefined,
 endDate: data.assignmentType === "temporary" ? data.endDate : null,
 };

 return workersService.updateLaborAssignment(workerId, payload as any);
 },
 onSuccess: () => {
 // Invalidate queries specified in criteria
 queryClient.invalidateQueries({ queryKey: ["work-crews"] });
 if (crewId) {
 queryClient.invalidateQueries({ queryKey: ["work-crews", crewId, "workers"] });
 }
 queryClient.invalidateQueries({
 queryKey: ["workers", workerId, "location-assignment", "active"],
 });
 queryClient.invalidateQueries({ queryKey: ["worker-detail", workerId] });
 queryClient.invalidateQueries({ queryKey: ["worker", workerId] });
 queryClient.invalidateQueries({ queryKey: ["worker-location-active", workerId] });
 queryClient.invalidateQueries({ queryKey: ["worker-location-history", workerId] });
 queryClient.invalidateQueries({ queryKey: ["work-locations"] });
 
 toast.success("Asignación guardada correctamente");
 onClose();
 },
 onError: (error: any) => {
 const errorCode = error?.errorCode || error?.code || error?.response?.data?.errorCode || error?.response?.data?.code || "";
 const customMsg = LABOR_ASSIGNMENT_ERROR_MESSAGES[errorCode];
 if (customMsg) {
 toast.error(customMsg);
 } else if (error?.status === 409 || error?.response?.status === 409) {
 toast.error(LABOR_ASSIGNMENT_ERROR_MESSAGES.TEMPORARY_ASSIGNMENT_OVERLAP);
 } else if (error?.status === 422 || error?.response?.status === 422) {
 toast.error("Faltan datos requeridos, revisa la fecha de fin o el motivo.");
 } else {
 toast.error("Ocurrió un error al guardar la asignación.");
 }
 }
 });

 const errorObj = mutation.error as any;
 const errorCode = errorObj?.errorCode || errorObj?.code || errorObj?.response?.data?.errorCode || errorObj?.response?.data?.code || "";
 const errorMessage = LABOR_ASSIGNMENT_ERROR_MESSAGES[errorCode] || errorObj?.message || "Ocurrió un error al guardar la asignación.";

 if (!isOpen) return null;

 return (
 <div className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground/60 p-4">
 <div className="flex w-full max-w-[450px] flex-col rounded-2xl bg-card shadow-2xl overflow-hidden">
 {/* Header */}
 <div className="flex items-center justify-between border-b border-border px-6 py-5 shrink-0">
 <h2 className="text-lg font-bold text-foreground">Nueva Asignación de Obra</h2>
 <button
 type="button"
 onClick={onClose}
 className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-muted-foreground"
 >
 <X className="size-5" />
 </button>
 </div>

 {/* Body */}
 <div className="p-6">
 <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
 
 <Controller
 name="workLocationId"
 control={control}
 rules={{ required: "Debe seleccionar una obra" }}
 render={({ field }) => (
 <FieldFrame label="Obra *" error={errors.workLocationId?.message}>
 <Select {...field} disabled={mutation.isPending || isLoadingLocations}>
 <option value="" disabled>Seleccionar obra</option>
 {locations.map((loc: OrganizationWorkLocation) => (
 <option key={loc.id} value={loc.id}>
 {loc.name}
 </option>
 ))}
 </Select>
 </FieldFrame>
 )}
 />

 <Controller
 name="assignmentType"
 control={control}
 render={({ field }) => (
 <FieldFrame label="Tipo de Asignación *">
 <Select {...field} disabled={mutation.isPending}>
 <option value="temporary">Temporal (Apoyo / Destaque)</option>
 <option value="permanent">Permanente (Cambio definitivo)</option>
 </Select>
 </FieldFrame>
 )}
 />

 {assignmentType === "temporary" && (
 <div className="col-span-2">
 <Controller
 name="endDate"
 control={control}
 rules={{ 
 required: "La fecha de fin es obligatoria para un traslado temporal.",
 validate: (val) => {
 const tomorrow = getTomorrowDate();
 if (val < tomorrow) {
 return "La fecha de fin debe ser mañana o posterior.";
 }
 return true;
 }
 }}
 render={({ field }) => (
 <FieldFrame label="Fecha de Fin *" error={errors.endDate?.message}>
 <Input type="date" {...field} min={getTomorrowDate()} disabled={mutation.isPending} />
 </FieldFrame>
 )}
 />
 </div>
 )}

 {assignmentType === "temporary" && (
 <Controller
 name="autoReturn"
 control={control}
 render={({ field: { value, onChange } }) => (
 <label className="flex items-center gap-2 p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg cursor-pointer hover:bg-indigo-50 transition">
 <input 
 type="checkbox" 
 checked={value}
 onChange={(e) => onChange(e.target.checked)}
 className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 size-4"
 disabled={mutation.isPending}
 />
 <div className="flex flex-col">
 <span className="text-sm font-medium text-indigo-900">Retorno Automático</span>
 <span className="text-xs text-indigo-700/70">Al cumplirse la fecha de fin, el trabajador volverá a su obra principal.</span>
 </div>
 </label>
 )}
 />
 )}

 <Controller
 name="reason"
 control={control}
 rules={{ required: "El motivo es requerido" }}
 render={({ field }) => (
 <FieldFrame label="Motivo *" error={errors.reason?.message}>
 <Input {...field} disabled={mutation.isPending} placeholder="Ej. Apoyo por vacaciones" />
 </FieldFrame>
 )}
 />

 {mutation.isError && (
 <div className="flex items-center gap-2 p-3 text-sm text-rose-700 bg-rose-50 rounded-lg border border-rose-200">
 <AlertCircle className="size-4 shrink-0" />
 <p>{errorMessage}</p>
 </div>
 )}

 <div className="flex justify-end gap-2 pt-4">
 <Button type="button" variant="secondary" onClick={onClose}>
 Cancelar
 </Button>
 <Button type="submit" disabled={mutation.isPending}>
 {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
 Guardar Asignación
 </Button>
 </div>
 </form>
 </div>
 </div>
 </div>
 );
}
