"use client";

import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, X, Plus, Trash2, Network, Briefcase, Building2 } from "lucide-react";

import { departmentsService } from "@/services/departments.service";
import { organizationService } from "@/services/organization.service";
import { FieldFrame } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";

const quickBuilderSchema = z.object({
  departmentName: z.string().min(2, "El nombre del departamento es requerido"),
  departmentDescription: z.string().optional(),
  areas: z.array(
    z.object({
      name: z.string().min(2, "El nombre del área es requerido"),
      positions: z.array(
        z.object({
          name: z.string().min(2, "El nombre del puesto es requerido"),
        })
      ),
    })
  ).min(1, "Debes agregar al menos un área al departamento"),
});

type QuickBuilderFormData = z.infer<typeof quickBuilderSchema>;

interface QuickOrganizationBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickOrganizationBuilderModal({ isOpen, onClose }: QuickOrganizationBuilderModalProps) {
  const queryClient = useQueryClient();
  const [globalError, setGlobalError] = useState<{ message: string; details?: unknown } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [progressStep, setProgressStep] = useState<string>("");

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<QuickBuilderFormData>({
    resolver: zodResolver(quickBuilderSchema),
    defaultValues: {
      departmentName: "",
      departmentDescription: "",
      areas: [
        {
          name: "",
          positions: [{ name: "" }],
        },
      ],
    },
  });

  const { fields: areaFields, append: appendArea, remove: removeArea } = useFieldArray({
    control,
    name: "areas",
  });

  const onSubmit = async (values: QuickBuilderFormData) => {
    try {
      setGlobalError(null);
      setIsSaving(true);
      
      // 1. Create Department
      setProgressStep("Creando departamento...");
      const newDept = await departmentsService.create({
        name: values.departmentName,
        description: values.departmentDescription || null,
        is_active: true,
      });

      // 2. Create Areas and Positions
      for (let i = 0; i < values.areas.length; i++) {
        const areaData = values.areas[i];
        setProgressStep(`Creando área: ${areaData.name}...`);
        const newArea = await organizationService.createArea({
          departmentId: newDept.id,
          name: areaData.name,
          description: "", // Fast flow skips area descriptions
        });

        for (let j = 0; j < areaData.positions.length; j++) {
          const positionData = areaData.positions[j];
          setProgressStep(`Creando puesto: ${positionData.name}...`);
          await organizationService.createPosition({
            areaId: newArea.id,
            name: positionData.name,
            description: "", // Fast flow skips position descriptions
          });
        }
      }

      setProgressStep("¡Estructura creada con éxito!");
      
      // Refresh all related queries
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      
      setTimeout(() => {
        setIsSaving(false);
        setProgressStep("");
        reset();
        onClose();
      }, 1000);

    } catch (error: any) {
      console.error("Error in QuickBuilder:", error);
      setGlobalError({
        message: error?.message || "Ocurrió un error al crear la estructura. Es posible que el departamento se haya creado parcialmente.",
        details: error?.details || error,
      });
      setIsSaving(false);
      setProgressStep("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-4xl max-h-[90vh] flex-col rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 p-6 shrink-0 bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Network className="size-5 text-brand" />
              Constructor Rápido de Organización
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Crea un departamento, sus áreas y puestos de trabajo en un solo paso.
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
            onClick={onClose}
            disabled={isSaving}
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 flex-1 bg-slate-50/30">
          <form id="quick-builder-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            {/* DEPARTMENT SECTION */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2 mb-4">
                <Building2 className="size-4 text-indigo-500" />
                Datos del Departamento principal
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                  name="departmentName"
                  control={control}
                  render={({ field }) => (
                    <FieldFrame label="Nombre del Departamento" error={errors.departmentName?.message}>
                      <input {...field} disabled={isSaving} className="form-input" placeholder="Ej: Operaciones" />
                    </FieldFrame>
                  )}
                />
                <Controller
                  name="departmentDescription"
                  control={control}
                  render={({ field }) => (
                    <FieldFrame label="Descripción (Opcional)">
                      <input {...field} disabled={isSaving} className="form-input" placeholder="Breve descripción..." />
                    </FieldFrame>
                  )}
                />
              </div>
            </div>

            {/* AREAS & POSITIONS SECTION */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Estructura Interna (Áreas y Puestos)</h3>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => appendArea({ name: "", positions: [{ name: "" }] })}
                  disabled={isSaving}
                  className="gap-2 text-brand border-brand/20 hover:bg-brand/5 h-9 px-3 text-sm"
                >
                  <Plus className="size-4" /> Agregar Área
                </Button>
              </div>

              {errors.areas?.root && (
                <p className="text-sm text-rose-600 font-medium">{errors.areas.root.message}</p>
              )}

              {areaFields.map((areaField, areaIndex) => (
                <div key={areaField.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-brand/40"></div>
                  
                  <div className="flex items-start gap-4">
                    <div className="flex-1 space-y-4">
                      {/* AREA INPUT */}
                      <Controller
                        name={`areas.${areaIndex}.name`}
                        control={control}
                        render={({ field }) => (
                          <FieldFrame label={`Área ${areaIndex + 1}`} error={errors.areas?.[areaIndex]?.name?.message}>
                            <input {...field} disabled={isSaving} className="form-input bg-slate-50" placeholder="Ej: Logística, Mantenimiento..." />
                          </FieldFrame>
                        )}
                      />

                      {/* POSITIONS FOR THIS AREA */}
                      <div className="pl-4 border-l-2 border-slate-100 mt-4 space-y-3">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Briefcase className="size-3.5" /> Puestos en esta Área
                        </label>
                        <PositionsList control={control} areaIndex={areaIndex} isSaving={isSaving} />
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 -mt-1 -mr-2"
                      onClick={() => removeArea(areaIndex)}
                      disabled={isSaving || areaFields.length === 1}
                      title="Eliminar área"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {globalError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                <div className="flex items-center gap-2 text-rose-800">
                  <AlertCircle className="size-5 shrink-0" />
                  <h4 className="text-sm font-semibold">Error al guardar estructura</h4>
                </div>
                <p className="mt-1 text-sm text-rose-700 ml-7">{globalError.message}</p>
              </div>
            )}
          </form>
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-slate-100 p-6 bg-slate-50">
          <div className="text-sm font-medium text-slate-500">
            {isSaving && (
              <div className="flex items-center gap-2 animate-pulse text-brand">
                <div className="size-4 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
                {progressStep}
              </div>
            )}
            {!isSaving && progressStep && (
              <span className="text-emerald-600 flex items-center gap-1.5">
                {progressStep}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              form="quick-builder-form"
              type="submit"
              disabled={isSaving}
              className="gap-2 bg-slate-900 text-white hover:bg-slate-800"
            >
              Crear Estructura Completa
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Subcomponent to handle the nested array of positions
function PositionsList({ control, areaIndex, isSaving }: { control: any, areaIndex: number, isSaving: boolean }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `areas.${areaIndex}.positions`,
  });

  return (
    <div className="space-y-2">
      {fields.map((posField, posIndex) => (
        <div key={posField.id} className="flex items-center gap-2">
          <div className="flex-1">
            <Controller
              name={`areas.${areaIndex}.positions.${posIndex}.name`}
              control={control}
              render={({ field, fieldState }) => (
                <div>
                  <input
                    {...field}
                    disabled={isSaving}
                    className="form-input text-sm py-1.5"
                    placeholder="Ej: Gerente, Especialista..."
                  />
                  {fieldState.error && (
                    <span className="text-xs text-rose-500 mt-1 block">{fieldState.error.message}</span>
                  )}
                </div>
              )}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            className="text-slate-400 hover:text-rose-600 px-2 h-8"
            onClick={() => remove(posIndex)}
            disabled={isSaving || fields.length === 1}
          >
            <X className="size-4" />
          </Button>
        </div>
      ))}
      <button
        type="button"
        className="text-xs font-semibold text-brand hover:text-brand-hover flex items-center gap-1 mt-1 transition-colors"
        onClick={() => append({ name: "" })}
        disabled={isSaving}
      >
        <Plus className="size-3" /> Añadir otro puesto a esta área
      </button>
    </div>
  );
}
