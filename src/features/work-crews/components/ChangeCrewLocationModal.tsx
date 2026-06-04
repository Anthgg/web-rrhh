"use client";

import { useForm, Controller } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldFrame, Input, Select } from "@/components/ui/fields";

import { workCrewsService, WorkCrew } from "@/services/work-crews.service";
import { organizationService, OrganizationWorkLocation } from "@/services/organization.service";
import { extractArray } from "@/lib/utils/extract-array";

interface ChangeCrewLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  crew: WorkCrew;
}

type FormData = {
  work_location_id: string;
  reason: string;
};

export function ChangeCrewLocationModal({
  isOpen,
  onClose,
  crew,
}: ChangeCrewLocationModalProps) {
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      work_location_id: crew.work_location_id || "",
      reason: "",
    },
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
    mutationFn: (data: FormData) =>
      workCrewsService.changeWorkCrewLocation(crew.id, data.work_location_id, data.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-crews"] });
      onClose();
    },
  });

  const locations = locationsQuery.data || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4">
      <div className="flex w-full max-w-[450px] flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 shrink-0">
          <h2 className="text-lg font-bold text-slate-900">Cambiar Obra Principal</h2>
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
          <div className="mb-6 rounded-lg bg-amber-50 p-3 border border-amber-200 flex gap-3 text-amber-800 text-sm">
            <AlertTriangle className="size-5 shrink-0 mt-0.5 text-amber-600" />
            <p>
              Al cambiar la obra de la cuadrilla, <strong>todos los trabajadores activos</strong> heredarán automáticamente esta nueva ubicación para marcar asistencia, a menos que tengan una asignación temporal individual.
            </p>
          </div>

          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <Controller
              name="work_location_id"
              control={control}
              rules={{ required: "Debe seleccionar la nueva obra" }}
              render={({ field }) => (
                <FieldFrame label="Nueva Obra *" error={errors.work_location_id?.message}>
                  <Select {...field} disabled={mutation.isPending || locationsQuery.isLoading}>
                    <option value="" disabled>Seleccionar nueva obra</option>
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
              name="reason"
              control={control}
              rules={{ required: "El motivo es requerido" }}
              render={({ field }) => (
                <FieldFrame label="Motivo del cambio *" error={errors.reason?.message}>
                  <Input {...field} disabled={mutation.isPending} placeholder="Ej. Cambio de frente operativo" />
                </FieldFrame>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Confirmar Cambio
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
