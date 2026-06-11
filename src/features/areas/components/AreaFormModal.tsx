"use client";

import { useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, X } from "lucide-react";

import { areasService, type AreaPayload } from "@/services/areas.service";
import { departmentsService } from "@/services/departments.service";
import { rolesService } from "@/services/roles.service";
import type { AreaDefinition } from "@/types";
import { FieldFrame } from "@/components/ui/fields";

const areaSchema = z.object({
 name: z.string().min(2, "El nombre es requerido"),
 description: z.string().optional().nullable(),
 department_id: z.string().optional().nullable(),
 role_id: z.string().optional().nullable(),
 is_active: z.boolean(),
});

type AreaFormData = z.infer<typeof areaSchema>;

interface AreaFormModalProps {
 isOpen: boolean;
 onClose: () => void;
 areaData?: AreaDefinition | null;
}

import { extractArray } from "@/lib/utils/extract-array";

type SelectableRecord = {
 id: string;
 name: string;
 label?: string;
};

export function AreaFormModal({ isOpen, onClose, areaData }: AreaFormModalProps) {
 if (!isOpen) return null;

 return <AreaFormModalContent onClose={onClose} areaData={areaData} />;
}

function AreaFormModalContent({ onClose, areaData }: Omit<AreaFormModalProps, "isOpen">) {
 const isEditing = !!areaData;
 const queryClient = useQueryClient();
 const [globalError, setGlobalError] = useState<{ message: string; details?: unknown } | null>(null);

 const {
 data: departmentsData = [],
 isLoading: isLoadingDepartments,
 } = useQuery({
 queryKey: ["departments"],
 queryFn: async () => {
 const data = await departmentsService.list();
 return extractArray<SelectableRecord>(data);
 },
 });

 const {
 data: rolesData = [],
 isLoading: isLoadingRoles,
 } = useQuery({
 queryKey: ["roles"],
 queryFn: async () => {
 const data = await rolesService.list();
 return extractArray<SelectableRecord>(data);
 },
 });

 const formValues = useMemo(() => {
 if (areaData) {
 const isActive = areaData.is_active ?? true;
 return {
 name: areaData.name,
 description: areaData.description || "",
 department_id: areaData.department_id || "",
 role_id: areaData.role_id || "",
 is_active: isActive,
 };
 } else {
 return {
 name: "",
 description: "",
 department_id: "",
 role_id: "",
 is_active: true,
 };
 }
 }, [areaData]);

 const {
 control,
 handleSubmit,
 reset,
 formState: { errors, isDirty },
 setError,
 } = useForm<AreaFormData>({
 resolver: zodResolver(areaSchema),
 values: formValues,
 });

 const mutation = useMutation({
 mutationFn: async (values: AreaFormData) => {
 setGlobalError(null);
 const payload: AreaPayload = {
 name: values.name,
 description: values.description || null,
 department_id: values.department_id || null,
 role_id: values.role_id || null,
 is_active: values.is_active,
 };

 if (isEditing && areaData) {
 return areasService.update(areaData.id, payload);
 } else {
 return areasService.create(payload);
 }
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["areas"] });
 onClose();
 },
 onError: (error: any) => {
 const status = error?.status;
 const details = error?.details;
 const errorCode = details?.code || error?.code;
 
 if (status === 409 || errorCode === "AREA_ALREADY_EXISTS") {
 setGlobalError({ message: "Ya existe un área con ese nombre.", details });
 } else if (errorCode === "DEPARTMENT_NOT_FOUND") {
 setGlobalError({ message: "El departamento seleccionado no existe o no pertenece a la empresa.", details });
 } else if (errorCode === "ROLE_NOT_FOUND") {
 setGlobalError({ message: "El rol seleccionado no existe.", details });
 } else if (status === 422) {
 if (details?.errors && Array.isArray(details.errors)) {
 details.errors.forEach((err: any) => {
 if (err.field) {
 setError(err.field as any, { type: "server", message: err.message });
 }
 });
 setGlobalError({ message: "Por favor, revisa los errores en el formulario.", details });
 } else {
 setGlobalError({ message: "Uno o más datos ingresados no son válidos.", details });
 }
 } else if (status === 401) {
 setGlobalError({ message: "Tu sesión ha expirado. Por favor, vuelve a iniciar sesión." });
 setTimeout(() => window.location.href = "/login", 2000);
 } else {
 setGlobalError({
 message: error?.message || "No se pudo procesar la operación. Intente nuevamente.",
 details,
 });
 }
 },
 });

 const onSubmit = (values: AreaFormData) => {
 mutation.mutate(values);
 };

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm">
 <div className="flex w-full max-w-2xl max-h-[90vh] flex-col rounded-2xl bg-card shadow-xl overflow-hidden">
 <div className="flex items-center justify-between border-b border-border p-6 shrink-0">
 <div>
 <h2 className="text-xl font-bold text-foreground">
 {isEditing ? "Editar Área" : "Nueva Área"}
 </h2>
 <p className="mt-1 text-sm text-muted-foreground">
 {isEditing ? "Modifica los detalles del área." : "Crea una nueva área para tu organización."}
 </p>
 </div>
 <button
 type="button"
 className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-muted-foreground transition"
 onClick={onClose}
 >
 <X className="size-5" />
 </button>
 </div>

 <div className="overflow-y-auto p-6 flex-1">
 <form id="area-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
 <Controller
 name="name"
 control={control}
 render={({ field }) => (
 <FieldFrame label="Nombre del Área" error={errors.name?.message}>
 <input
 {...field}
 disabled={mutation.isPending}
 className="form-input"
 placeholder="ej: Operaciones"
 />
 </FieldFrame>
 )}
 />

 <Controller
 name="description"
 control={control}
 render={({ field }) => (
 <FieldFrame label="Descripción (Opcional)" error={errors.description?.message}>
 <textarea
 {...field}
 value={field.value || ""}
 disabled={mutation.isPending}
 className="form-textarea"
 placeholder="Descripción del área..."
 rows={2}
 />
 </FieldFrame>
 )}
 />

 <div className="grid gap-6 md:grid-cols-2">
 <Controller
 name="department_id"
 control={control}
 render={({ field }) => (
 <FieldFrame label="Departamento (Opcional)" error={errors.department_id?.message}>
 <select
 {...field}
 value={field.value || ""}
 disabled={mutation.isPending || isLoadingDepartments}
 className="form-select"
 >
 <option value="">Sin asignar</option>
 {departmentsData.map((dept) => (
 <option key={dept.id} value={dept.id}>
 {dept.name}
 </option>
 ))}
 </select>
 </FieldFrame>
 )}
 />

 <Controller
 name="role_id"
 control={control}
 render={({ field }) => (
 <FieldFrame label="Rol Predeterminado (Opcional)" error={errors.role_id?.message}>
 <select
 {...field}
 value={field.value || ""}
 disabled={mutation.isPending || isLoadingRoles}
 className="form-select"
 >
 <option value="">Sin asignar</option>
 {rolesData.map((role) => (
 <option key={role.id} value={role.id}>
 {role.label ?? role.name}
 </option>
 ))}
 </select>
 </FieldFrame>
 )}
 />
 </div>
 
 <Controller
 name="is_active"
 control={control}
 render={({ field }) => (
 <div className="flex items-center gap-2">
 <input
 type="checkbox"
 id="is_active"
 checked={field.value}
 onChange={(e) => field.onChange(e.target.checked)}
 disabled={mutation.isPending}
 className="rounded border-slate-300 text-primary focus:ring-primary"
 />
 <label htmlFor="is_active" className="text-sm font-medium text-foreground">
 Área activa
 </label>
 </div>
 )}
 />

 {globalError && (
 <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
 <div className="flex items-center gap-2 text-rose-800">
 <AlertCircle className="size-5 shrink-0" />
 <h4 className="text-sm font-semibold">Error al guardar</h4>
 </div>
 <p className="mt-1 text-sm text-rose-700 ml-7">{globalError.message}</p>
 {Boolean(globalError.details) && (
 <pre className="mt-3 overflow-x-auto rounded-lg bg-rose-900/10 p-3 text-xs text-rose-900 ml-7">
 {JSON.stringify(globalError.details, null, 2)}
 </pre>
 )}
 </div>
 )}
 </form>
 </div>

 <div className="flex shrink-0 items-center justify-end gap-3 border-t border-border p-6 bg-muted/50">
 <button
 type="button"
 className="rounded-xl px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted"
 onClick={onClose}
 disabled={mutation.isPending}
 >
 Cancelar
 </button>
 <button
 form="area-form"
 type="submit"
 disabled={!isDirty || mutation.isPending}
 className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:pointer-events-none disabled:opacity-50"
 >
 {mutation.isPending ? (
 <div className="flex items-center gap-2">
 <div className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
 <span>Guardando...</span>
 </div>
 ) : isEditing ? (
 "Guardar Cambios"
 ) : (
 "Crear Área"
 )}
 </button>
 </div>
 </div>
 </div>
 );
}
