"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, X } from "lucide-react";
import { FieldFrame } from "@/components/ui/fields";
import { organizationService } from "@/services/organization.service";

const schema = z.object({
 name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
 description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface CreateDepartmentModalProps {
 isOpen: boolean;
 onClose: () => void;
}

export function CreateDepartmentModal({ isOpen, onClose }: CreateDepartmentModalProps) {
 if (!isOpen) return null;

 return <CreateDepartmentModalContent onClose={onClose} />;
}

function CreateDepartmentModalContent({ onClose }: Pick<CreateDepartmentModalProps, "onClose">) {
 const queryClient = useQueryClient();
 const [globalError, setGlobalError] = useState<{ message: string; details?: unknown } | null>(null);

 const {
 control,
 handleSubmit,
 formState: { errors, isDirty },
 } = useForm<FormData>({
 resolver: zodResolver(schema),
 defaultValues: { name: "", description: "" },
 });

 const mutation = useMutation({
 mutationFn: (values: FormData) => organizationService.createDepartment(values),
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["organization-departments"] });
 onClose();
 },
 onError: (error: any) => {
 setGlobalError({
 message: error?.message || "Ocurrió un error al crear el departamento.",
 details: error?.details,
 });
 },
 });

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm">
 <div className="flex w-full max-w-lg flex-col rounded-2xl bg-card shadow-xl overflow-hidden">
 <div className="flex items-center justify-between border-b border-border p-6 shrink-0">
 <div>
 <h2 className="text-xl font-bold text-foreground">Nuevo Departamento</h2>
 <p className="mt-1 text-sm text-muted-foreground">Añade un nuevo departamento interno a la organización.</p>
 </div>
 <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition">
 <X className="size-5" />
 </button>
 </div>

 <div className="p-6">
 <form id="dept-form" onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-6">
 <Controller
 name="name"
 control={control}
 render={({ field }) => (
 <FieldFrame label="Nombre del Departamento" error={errors.name?.message}>
 <input {...field} disabled={mutation.isPending} className="form-input" placeholder="Ej: Recursos Humanos" />
 </FieldFrame>
 )}
 />

 <Controller
 name="description"
 control={control}
 render={({ field }) => (
 <FieldFrame label="Descripción (Opcional)" error={errors.description?.message}>
 <textarea {...field} disabled={mutation.isPending} className="form-textarea" rows={3} placeholder="Breve descripción del propósito del departamento..." />
 </FieldFrame>
 )}
 />

 {globalError && (
 <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
 <div className="flex items-center gap-2 text-rose-800">
 <AlertCircle className="size-5 shrink-0" />
 <h4 className="text-sm font-semibold">No se pudo crear</h4>
 </div>
 <p className="mt-1 text-sm text-rose-700 ml-7">{globalError.message}</p>
 {Boolean(globalError.details) && (
 <pre className="mt-2 overflow-x-auto rounded bg-rose-900/10 p-2 text-xs text-rose-900 ml-7">
 {JSON.stringify(globalError.details, null, 2)}
 </pre>
 )}
 </div>
 )}
 </form>
 </div>

 <div className="flex shrink-0 items-center justify-end gap-3 border-t border-border p-6 bg-muted/50">
 <button type="button" onClick={onClose} disabled={mutation.isPending} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted">
 Cancelar
 </button>
 <button form="dept-form" type="submit" disabled={!isDirty || mutation.isPending} className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50">
 {mutation.isPending ? "Guardando..." : "Crear Departamento"}
 </button>
 </div>
 </div>
 </div>
 );
}
