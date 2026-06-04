"use client";

import { useForm, Controller } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldFrame, Input, Select } from "@/components/ui/fields";
import { toast } from "sonner";

import { workersService, WorkerAssignmentPayload } from "@/services/workers.service";
import { organizationService, OrganizationWorkLocation } from "@/services/organization.service";
import { extractArray } from "@/lib/utils/extract-array";

interface WorkerIndividualAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  workerId: string;
}

type FormData = {
  work_location_id: string;
  assignment_type: "temporary" | "permanent";
  start_date: string;
  end_date: string;
  reason: string;
  auto_return: boolean;
};

export function WorkerIndividualAssignmentModal({
  isOpen,
  onClose,
  workerId,
}: WorkerIndividualAssignmentModalProps) {
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      work_location_id: "",
      assignment_type: "temporary",
      start_date: new Date().toISOString().split("T")[0],
      end_date: "",
      reason: "",
      auto_return: true,
    },
  });

  const assignmentType = watch("assignment_type");
  const startDate = watch("start_date");

  const locationsQuery = useQuery({
    queryKey: ["work-locations"],
    queryFn: async () => {
      const data = await organizationService.getWorkLocations();
      return extractArray<OrganizationWorkLocation>(data);
    },
    enabled: isOpen,
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload: any = {
        work_location_id: data.work_location_id,
        assignment_type: data.assignment_type,
        reason: data.reason,
        auto_return: data.assignment_type === "temporary" ? data.auto_return : undefined,
      };
      if (data.assignment_type === "temporary" && data.end_date) {
        payload.end_date = data.end_date;
      } else {
        payload.end_date = null;
      }
      return workersService.updateLaborAssignment(workerId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-crews"] });
      queryClient.invalidateQueries({ queryKey: ["work-locations"] });
      queryClient.invalidateQueries({ queryKey: ["worker-location-active", workerId] });
      queryClient.invalidateQueries({ queryKey: ["worker-location-history", workerId] });
      toast.success("Asignación guardada correctamente");
      onClose();
    },
    onError: (error: any) => {
      const status = error?.status || error?.response?.status;
      if (status === 409) {
        toast.error("Ya existe un movimiento temporal superpuesto para este trabajador.");
      } else if (status === 422) {
        toast.error("Faltan datos requeridos, revisa la fecha de fin o el motivo.");
      } else if (status === 404) {
        toast.error("Trabajador u obra no encontrados.");
      } else {
        toast.error("Ocurrió un error al guardar la asignación.");
      }
    }
  });

  const locations = locationsQuery.data || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 p-4">
      <div className="flex w-full max-w-[450px] flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 shrink-0">
          <h2 className="text-lg font-bold text-slate-900">Nueva Asignación de Obra</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            
            <Controller
              name="work_location_id"
              control={control}
              rules={{ required: "Debe seleccionar una obra" }}
              render={({ field }) => (
                <FieldFrame label="Obra *" error={errors.work_location_id?.message}>
                  <Select {...field} disabled={mutation.isPending || locationsQuery.isLoading}>
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
              name="assignment_type"
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

              {/* start_date no es requerido por el backend según la especificación, se asume inmediato si es desde hoy, o el backend lo ignora. Pero podemos quitar el start_date del formulario si ya no se envía. Aunque dejarlo visual no afecta. Lo quitaré del grid para simplificar. */}

              {assignmentType === "temporary" && (
                <div className="col-span-2">
                  <Controller
                    name="end_date"
                    control={control}
                    rules={{ 
                      required: "Fecha de fin es requerida para asignaciones temporales",
                    }}
                    render={({ field }) => (
                      <FieldFrame label="Fecha de Fin *" error={errors.end_date?.message}>
                        <Input type="date" {...field} disabled={mutation.isPending} />
                      </FieldFrame>
                    )}
                  />
                </div>
              )}

            {assignmentType === "temporary" && (
              <Controller
                name="auto_return"
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
                <p>Ocurrió un error al guardar. Verifica que no haya otra asignación temporal superpuesta en estas fechas.</p>
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
