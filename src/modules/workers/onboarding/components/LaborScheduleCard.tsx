import type { ChangeEvent } from "react";

import { FieldFrame, Input, Select } from "@/components/ui/fields";

import type { LaborDataCatalogs, LaborFormSectionProps } from "./labor-data.types";
import type { CatalogItem } from "../types/onboarding.types";

interface LaborScheduleCardProps extends LaborFormSectionProps {
  selectedWorkerTypeId?: string;
  workerTypeOptions: CatalogItem[];
  catalogs: LaborDataCatalogs;
  selectedSupervisorId?: string;
  supervisorOptions: CatalogItem[];
  selectedShift?: CatalogItem;
}

export function LaborScheduleCard({
  register,
  setValue,
  laborErrors,
  selectedWorkerTypeId,
  workerTypeOptions,
  catalogs,
  selectedSupervisorId,
  supervisorOptions,
  selectedShift,
}: LaborScheduleCardProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Detalles de Contratación y Horario
      </h4>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        <FieldFrame label="Tipo de Colaborador (opcional)" error={laborErrors?.workerTypeId?.message}>
          <Select
            {...register("laborData.workerTypeId")}
            value={selectedWorkerTypeId || ""}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => {
              setValue("laborData.workerTypeId", event.target.value, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
              });
            }}
          >
            <option value="">Sin tipo asignado</option>
            {workerTypeOptions.map((workerType) => (
              <option key={`type-${workerType.id}`} value={workerType.id}>
                {workerType.name}
              </option>
            ))}
          </Select>
        </FieldFrame>

        <FieldFrame label="Fecha de Ingreso" error={laborErrors?.startDate?.message}>
          <Input type="date" {...register("laborData.startDate")} />
        </FieldFrame>

        <FieldFrame label="Estado del Trabajador" error={laborErrors?.status?.message}>
          <Select {...register("laborData.status")}>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </Select>
        </FieldFrame>

        <FieldFrame label="Turno Laboral" error={laborErrors?.shiftId?.message}>
          <Select {...register("laborData.shiftId")}>
            <option value="">Selecciona Turno...</option>
            {catalogs.shifts.map((shift) => (
              <option key={`shift-${shift.id}`} value={shift.id}>
                {shift.name}
              </option>
            ))}
          </Select>
        </FieldFrame>

        <FieldFrame label="Supervisor Directo (opcional)" error={laborErrors?.supervisorId?.message}>
          <Select
            {...register("laborData.supervisorId")}
            value={selectedSupervisorId || ""}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => {
              setValue("laborData.supervisorId", event.target.value, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
              });
            }}
          >
            <option value="">Sin supervisor directo</option>
            {supervisorOptions.map((supervisor) => (
              <option key={`sup-${supervisor.id}`} value={supervisor.id}>
                {supervisor.name}
              </option>
            ))}
          </Select>
        </FieldFrame>
      </div>

      {selectedShift?.schedule ? (
        <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/30 p-3 text-xs text-indigo-700">
          <span className="font-semibold">Horario del turno seleccionado ({selectedShift.name}): </span>
          {selectedShift.schedule}
        </div>
      ) : null}
    </div>
  );
}

