"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, X, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldFrame, Input, Select } from "@/components/ui/fields";

import { workCrewsService } from "@/services/work-crews.service";
import type { WorkCrew, WorkCrewPayload, WorkCrewUpdatePayload } from "@/services/work-crews.service";
import { workersService } from "@/services/workers.service";
import { organizationService, OrganizationWorkLocation } from "@/services/organization.service";
import { extractArray } from "@/lib/utils/extract-array";

interface WorkCrewFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  crewData: WorkCrew | null;
}

type FormData = {
  name: string;
  description: string;
  supervisor_id: string;
  work_location_id: string;
};

export function WorkCrewFormModal({
  isOpen,
  onClose,
  crewData,
}: WorkCrewFormModalProps) {
  const queryClient = useQueryClient();
  const isEditing = !!crewData;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    defaultValues: {
      name: "",
      description: "",
      supervisor_id: "",
      work_location_id: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (crewData) {
        reset({
          name: crewData.name,
          description: crewData.description || "",
          supervisor_id: crewData.supervisor_id,
          work_location_id: crewData.work_location_id,
        });
      } else {
        reset({
          name: "",
          description: "",
          supervisor_id: "",
          work_location_id: "",
        });
      }
    }
  }, [isOpen, crewData, reset]);

  const supervisorsQuery = useQuery({
    queryKey: ["supervisors"],
    queryFn: async () => {
      const data = await workersService.getSupervisors();
      return extractArray(data);
    },
    enabled: isOpen,
  });

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
      if (isEditing && crewData) {
        return workCrewsService.updateWorkCrew(crewData.id, data as WorkCrewUpdatePayload);
      }
      return workCrewsService.createWorkCrew({ ...data, is_active: true } as WorkCrewPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-crews"] });
      onClose();
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  const supervisors = supervisorsQuery.data || [];
  const locations = locationsQuery.data || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-[600px] flex-col rounded-2xl bg-slate-50 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-white border-b border-slate-200 px-6 py-5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <UsersRound className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? "Editar Cuadrilla" : "Nueva Cuadrilla"}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? "Modifica los detalles de la cuadrilla."
                  : "Registra un nuevo grupo de trabajo."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* General Info */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">Datos Generales</h3>
              
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
                  <FieldFrame label="Descripción" hint="Opcional">
                    <Input {...field} disabled={mutation.isPending} placeholder="Ej. Equipo encargado del sector norte" />
                  </FieldFrame>
                )}
              />
            </div>

            {/* Assignments */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">Asignaciones</h3>
              
              <Controller
                name="supervisor_id"
                control={control}
                rules={{ required: "Debe seleccionar un supervisor" }}
                render={({ field }) => (
                  <FieldFrame label="Supervisor *" error={errors.supervisor_id?.message}>
                    <Select {...field} disabled={mutation.isPending || supervisorsQuery.isLoading || supervisors.length === 0}>
                      <option value="" disabled>
                        {supervisorsQuery.isLoading ? "Cargando supervisores..." : "Seleccionar supervisor"}
                      </option>
                      {supervisors.map((sup: any) => (
                        <option key={sup.id} value={sup.id}>
                          {sup.first_name} {sup.last_name}
                        </option>
                      ))}
                    </Select>
                    {supervisors.length === 0 && !supervisorsQuery.isLoading && (
                      <p className="text-xs text-amber-600 mt-1">No hay supervisores disponibles. Registra o activa un supervisor primero.</p>
                    )}
                  </FieldFrame>
                )}
              />

              <Controller
                name="work_location_id"
                control={control}
                rules={{ required: "Debe seleccionar una obra" }}
                render={({ field }) => (
                  <FieldFrame label="Obra Principal *" error={errors.work_location_id?.message}>
                    <Select {...field} disabled={mutation.isPending || locationsQuery.isLoading || locations.length === 0}>
                      <option value="" disabled>
                        {locationsQuery.isLoading ? "Cargando obras..." : "Seleccionar obra"}
                      </option>
                      {locations.map((loc: OrganizationWorkLocation) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </Select>
                    {locations.length === 0 && !locationsQuery.isLoading && (
                      <p className="text-xs text-amber-600 mt-1">No hay obras activas disponibles. Crea una obra antes de asignarla.</p>
                    )}
                  </FieldFrame>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={onClose} className="border-slate-200 text-slate-600">
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending || (!isDirty && isEditing)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {mutation.isPending && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                {isEditing ? "Guardar Cambios" : "Crear Cuadrilla"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
