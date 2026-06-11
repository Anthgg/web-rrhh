"use client";

import { useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, X, Shield, Plus, Info } from "lucide-react";

import { rolesService, type RolePayload } from "@/services/roles.service";
import type { RoleDefinition } from "@/types";
import { FieldFrame } from "@/components/ui/fields";

const MODULES = [
 { key: "requests", label: "Solicitudes" },
 { key: "reports", label: "Reportes" },
 { key: "documents", label: "Documentos" },
 { key: "users", label: "Usuarios" },
 { key: "workers", label: "Trabajadores" },
 { key: "roles", label: "Roles y Permisos" },
 { key: "settings", label: "Configuración" },
];

const ACCESS_LEVELS = [
 { value: "none", label: "Sin acceso", color: "text-muted-foreground bg-muted" },
 { value: "read", label: "Lectura", color: "text-sky-700 bg-sky-100" },
 { value: "write", label: "Edición", color: "text-blue-700 bg-blue-100" },
 { value: "admin", label: "Total (Admin)", color: "text-emerald-700 bg-emerald-100" },
] as const;

const roleSchema = z.object({
 role: z.string().optional().nullable(),
 label: z.string().min(2, "Nombre requerido"),
 description: z.string().optional().nullable(),
 modules: z.array(
 z.object({
 key: z.string(),
 label: z.string(),
 access: z.enum(["none", "read", "write", "admin"]),
 })
 ).optional(),
});

type RoleFormData = z.infer<typeof roleSchema>;

interface RoleFormModalProps {
 isOpen: boolean;
 onClose: () => void;
 roleData?: RoleDefinition | null;
}

export function RoleFormModal({ isOpen, onClose, roleData }: RoleFormModalProps) {
 if (!isOpen) return null;

 return <RoleFormModalContent onClose={onClose} roleData={roleData} />;
}

function RoleFormModalContent({ onClose, roleData }: Omit<RoleFormModalProps, "isOpen">) {
 const isEditing = !!roleData;
 const isProtected = isEditing && roleData && (roleData.protected || roleData.is_system_role);
 const queryClient = useQueryClient();
 const [globalError, setGlobalError] = useState<{ message: string; details?: unknown } | null>(null);

 const defaultModules = useMemo(() => {
 return MODULES.map(m => {
 const existing = roleData?.modules?.find(em => em.key === m.key);
 return {
 key: m.key,
 label: m.label,
 access: existing?.access ?? "none",
 };
 });
 }, [roleData]);

 const formValues = useMemo(() => {
 if (roleData) {
 return {
 role: roleData.identifier || "",
 label: roleData.name || roleData.label || "",
 description: roleData.description || "",
 modules: defaultModules,
 };
 } else {
 return {
 role: "",
 label: "",
 description: "",
 modules: defaultModules.map(m => ({ ...m, access: "none" as const })),
 };
 }
 }, [roleData, defaultModules]);

 const {
 control,
 handleSubmit,
 reset,
 formState: { errors, isDirty },
 setValue,
 watch,
 setError,
 } = useForm<RoleFormData>({
 resolver: zodResolver(roleSchema),
 values: formValues,
 });

 const mutation = useMutation({
 mutationFn: async (values: RoleFormData) => {
 setGlobalError(null);
 const basePayload: any = {
 label: values.label,
 description: values.description || null,
 modules: values.modules?.map(m => ({
 key: m.key,
 access: m.access,
 })) || [],
 };

 if (values.role) {
 basePayload.role = values.role;
 }

 if (isEditing && roleData) {
 return rolesService.update(roleData.id, basePayload);
 } else {
 return rolesService.create(basePayload);
 }
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["roles"] });
 onClose();
 },
 onError: (error: any) => {
 const status = error?.status;
 const details = error?.details;
 const errorCode = details?.code || error?.code;
 
 if (status === 409 || errorCode === "ROLE_ALREADY_EXISTS") {
 setGlobalError({ message: "Ya existe un rol con ese identificador o nombre.", details });
 } else if (errorCode === "INVALID_ROLE_MODULE") {
 setGlobalError({ message: "El módulo enviado no existe o no está permitido.", details });
 } else if (errorCode === "INVALID_ROLE_ACCESS") {
 setGlobalError({ message: "Nivel de acceso inválido.", details });
 } else if (status === 403 || errorCode === "SYSTEM_ROLE_FORBIDDEN") {
 setGlobalError({ message: "No se pueden modificar roles protegidos del sistema.", details });
 } else if (status === 422 || errorCode === "VALIDATION_ERROR") {
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

 const onSubmit = (values: RoleFormData) => {
 mutation.mutate(values);
 };

 const modulesWatch = watch("modules");

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm">
 <div className="flex w-full max-w-3xl max-h-[90vh] flex-col rounded-2xl bg-card shadow-xl overflow-hidden">
 <div className="flex items-center justify-between border-b border-border p-6 shrink-0">
 <div>
 <h2 className="text-xl font-bold text-foreground">
 {isEditing ? "Editar Rol" : "Nuevo Rol"}
 </h2>
 <p className="mt-1 text-sm text-muted-foreground">
 {isEditing ? "Modifica los detalles y niveles de acceso." : "Crea un nuevo rol y define sus permisos."}
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
 <form id="role-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
 {isProtected && (
 <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-amber-800 border border-amber-200">
 <Shield className="mt-0.5 size-5 shrink-0 text-amber-600" />
 <div className="text-sm">
 <p className="font-semibold">Rol Protegido del Sistema</p>
 <p className="mt-1 text-amber-700">Este rol es crítico para el funcionamiento de la plataforma. Su identificador y nombre no deben alterarse a la ligera.</p>
 </div>
 </div>
 )}

 <div className="grid gap-6 md:grid-cols-2">
 <Controller
 name="role"
 control={control}
 render={({ field }) => (
 <FieldFrame label="Identificador Único (Código)" error={errors.role?.message}>
 <input
 {...field}
 value={field.value || ""}
 disabled={isProtected || mutation.isPending}
 className="form-input"
 placeholder="Opcional (se generará automáticamente)"
 onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/[^A-Z_]/g, ''))}
 />
 </FieldFrame>
 )}
 />

 <Controller
 name="label"
 control={control}
 render={({ field }) => (
 <FieldFrame label="Nombre del Rol" error={errors.label?.message}>
 <input
 {...field}
 disabled={isProtected || mutation.isPending}
 className="form-input"
 placeholder="ej: Analista de RR.HH."
 />
 </FieldFrame>
 )}
 />

 <div className="md:col-span-2">
 <Controller
 name="description"
 control={control}
 render={({ field }) => (
 <FieldFrame label="Descripción" error={errors.description?.message}>
 <textarea
 {...field}
 value={field.value || ""}
 disabled={mutation.isPending}
 className="form-textarea"
 placeholder="Define el propósito y alcance de este rol..."
 rows={2}
 />
 </FieldFrame>
 )}
 />
 </div>
 </div>

 <div>
 <div className="mb-4 flex items-center justify-between">
 <div>
 <h3 className="text-base font-bold text-foreground">Accesos por Módulo</h3>
 <p className="text-sm text-muted-foreground">Define qué nivel de permisos tendrá este rol en cada sección.</p>
 </div>
 </div>

 <div className="grid gap-3 sm:grid-cols-2">
 {(modulesWatch || []).map((mod, index) => (
 <div key={mod.key} className="flex flex-col gap-3 rounded-xl border border-border p-4">
 <span className="font-semibold text-foreground text-sm">{mod.label}</span>
 <Controller
 name={`modules.${index}.access`}
 control={control}
 render={({ field }) => (
 <div className="flex w-full items-center justify-between rounded-lg bg-muted p-1">
 {ACCESS_LEVELS.map((level) => {
 const isSelected = field.value === level.value;
 return (
 <button
 key={level.value}
 type="button"
 disabled={mutation.isPending}
 onClick={() => field.onChange(level.value)}
 className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
 isSelected 
 ? `border-transparent ${level.color} shadow-sm ring-1 ring-inset ring-current/20`
 : 'border-border bg-card text-muted-foreground hover:bg-muted hover:border-slate-300'
 }`}
 >
 {level.label}
 </button>
 );
 })}
 </div>
 )}
 />
 </div>
 ))}
 </div>
 </div>
 
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
 form="role-form"
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
 "Crear Rol"
 )}
 </button>
 </div>
 </div>
 </div>
 );
}
