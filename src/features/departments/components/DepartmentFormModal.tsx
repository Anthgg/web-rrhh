"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, X } from "lucide-react";

import { departmentsService, type DepartmentPayload } from "@/services/departments.service";
import type { DepartmentDefinition } from "@/types";
import { FieldFrame } from "@/components/ui/fields";

const departmentSchema = z.object({
  name: z.string().min(2, "El nombre es requerido"),
  description: z.string().optional().nullable(),
  is_active: z.boolean(),
});

type DepartmentFormData = z.infer<typeof departmentSchema>;

interface DepartmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentData?: DepartmentDefinition | null;
}

export function DepartmentFormModal({ isOpen, onClose, departmentData }: DepartmentFormModalProps) {
  const isEditing = !!departmentData;
  const queryClient = useQueryClient();
  const [globalError, setGlobalError] = useState<{ message: string; details?: unknown } | null>(null);

  const formValues = useMemo(() => {
    if (departmentData) {
      const isActive = departmentData.is_active ?? true;
      return {
        name: departmentData.name,
        description: departmentData.description || "",
        is_active: isActive,
      };
    } else {
      return {
        name: "",
        description: "",
        is_active: true,
      };
    }
  }, [departmentData]);

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    setError,
  } = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    values: formValues,
  });

  useEffect(() => {
    if (isOpen) {
      setGlobalError(null);
    }
  }, [isOpen]);

  const mutation = useMutation({
    mutationFn: async (values: DepartmentFormData) => {
      setGlobalError(null);
      const payload: DepartmentPayload = {
        name: values.name,
        description: values.description || null,
        is_active: values.is_active,
      };

      if (isEditing && departmentData) {
        return departmentsService.update(departmentData.id, payload);
      } else {
        return departmentsService.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      // Invalidate orgKeys to sync the older tabs as well just in case
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      onClose();
    },
    onError: (error: any) => {
      const status = error?.status;
      const details = error?.details;
      const errorCode = details?.code || error?.code;
      
      if (status === 409 || errorCode === "DEPARTMENT_ALREADY_EXISTS") {
        setGlobalError({ message: "Ya existe un departamento con ese nombre.", details });
      } else if (errorCode === "DEPARTMENT_NOT_FOUND") {
        setGlobalError({ message: "El departamento no existe o no pertenece a la empresa.", details });
      } else if (errorCode === "DEPARTMENT_HAS_ACTIVE_WORKERS") {
        setGlobalError({ message: "No se puede desactivar o eliminar este departamento porque tiene trabajadores activos asociados.", details });
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

  const onSubmit = (values: DepartmentFormData) => {
    mutation.mutate(values);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 p-6 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {isEditing ? "Editar Departamento" : "Nuevo Departamento"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {isEditing ? "Modifica los detalles del departamento." : "Crea un nuevo departamento para tu organización."}
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            onClick={onClose}
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6">
          <form id="department-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <FieldFrame label="Nombre del Departamento" error={errors.name?.message}>
                  <input
                    {...field}
                    disabled={mutation.isPending}
                    className="form-input"
                    placeholder="ej: Recursos Humanos"
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
                    placeholder="Descripción del departamento..."
                    rows={2}
                  />
                </FieldFrame>
              )}
            />
            
            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active_dept"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    disabled={mutation.isPending}
                    className="rounded border-slate-300 text-brand focus:ring-brand"
                  />
                  <label htmlFor="is_active_dept" className="text-sm font-medium text-slate-700">
                    Departamento activo
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

        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 p-6 bg-slate-50/50">
          <button type="button" onClick={onClose} disabled={mutation.isPending} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100">
            Cancelar
          </button>
          <button form="department-form" type="submit" disabled={!isDirty || mutation.isPending} className="flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-hover disabled:pointer-events-none disabled:opacity-50">
            {mutation.isPending ? "Guardando..." : isEditing ? "Guardar Cambios" : "Crear Departamento"}
          </button>
        </div>
      </div>
    </div>
  );
}
