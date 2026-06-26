import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FieldFrame, Select } from "@/components/ui/fields";

import type { LaborWorkAssignmentFieldsProps } from "./labor-data.types";

export function LaborWorkAssignmentFields({
  register,
  setValue,
  laborErrors,
  selectedWorkLocationId,
  selectedCrewId,
  selectedCrewName,
  workLocationOptions,
  workCrews,
  isLoadingCrews,
  onOpenLocationModal,
}: LaborWorkAssignmentFieldsProps) {
  return (
    <>
      <FieldFrame label="Lugar de Trabajo / Obra" error={laborErrors?.workLocationId?.message}>
        <div className="flex gap-2">
          <Select
            {...register("laborData.workLocationId")}
            value={selectedWorkLocationId || ""}
            onChange={(event) => {
              const nextId = event.target.value;
              setValue("laborData.workLocationId", nextId, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
              });
              setValue("laborData.crewId", "", {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
              });
              setValue("laborData.crewName", "", {
                shouldDirty: true,
              });
            }}
            className="flex-1"
          >
            <option value="">Selecciona Lugar de Trabajo...</option>
            {workLocationOptions.map((loc) => (
              <option key={`loc-${loc.id}`} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </Select>
          <Button
            type="button"
            variant="secondary"
            className="shrink-0 rounded-xl"
            onClick={onOpenLocationModal}
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </FieldFrame>

      <FieldFrame
        label="Cuadrilla (opcional)"
        error={laborErrors?.crewId?.message}
        hint="Opcional. Si no seleccionas una cuadrilla, el sistema intentara asignarla automaticamente segun la obra."
      >
        <div className="flex flex-col">
          <Select
            {...register("laborData.crewId")}
            value={selectedCrewId || ""}
            onChange={(event) => {
              const nextId = event.target.value;
              setValue("laborData.crewId", nextId, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
              });
              const selectedCrew = workCrews.find((crew) => crew.id === nextId);
              setValue("laborData.crewName", selectedCrew ? selectedCrew.name : "", {
                shouldDirty: true,
              });

              if (selectedCrew?.supervisor_id) {
                setValue("laborData.supervisorId", selectedCrew.supervisor_id, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                });
              }
            }}
            disabled={!selectedWorkLocationId || isLoadingCrews}
          >
            {!selectedWorkLocationId ? (
              <option value="">Selecciona primero un lugar de trabajo...</option>
            ) : isLoadingCrews ? (
              <option value="">Cargando cuadrillas...</option>
            ) : workCrews.length === 0 ? (
              <option value="">No hay cuadrillas activas para esta obra</option>
            ) : (
              <>
                <option value="">Selecciona una cuadrilla...</option>
                {selectedCrewId && !workCrews.some((crew) => crew.id === selectedCrewId) && (
                  <option value={selectedCrewId}>
                    {selectedCrewName || "Cuadrilla asociada actualmente"} (Inactiva o no disponible)
                  </option>
                )}
                {workCrews.map((crew) => (
                  <option key={`crew-${crew.id}`} value={crew.id}>
                    {crew.name}
                  </option>
                ))}
              </>
            )}
          </Select>
          {selectedCrewId && !isLoadingCrews && !workCrews.some((crew) => crew.id === selectedCrewId) && (
            <div className="mt-1 text-xs text-amber-600 font-medium">
              Aviso: La cuadrilla asociada no esta disponible o ya no esta activa.
            </div>
          )}
        </div>
      </FieldFrame>
    </>
  );
}

