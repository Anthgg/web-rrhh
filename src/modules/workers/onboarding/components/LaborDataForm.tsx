"use client";

import { useState, useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import { FieldFrame, Input, Select } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateWorkLocationModal } from "../../components/CreateWorkLocationModal";
import type { OnboardingFormValues } from "../schemas/onboarding.schema";
import type { CatalogItem } from "../types/onboarding.types";

interface LaborDataFormProps {
  form: UseFormReturn<OnboardingFormValues>;
  catalogs: {
    companies: CatalogItem[];
    branches: CatalogItem[];
    departments: CatalogItem[];
    areas: CatalogItem[];
    positions: CatalogItem[];
    workLocations: CatalogItem[];
    workerTypes: CatalogItem[];
    shifts: CatalogItem[];
    supervisors?: CatalogItem[];
    isLoadingAreas?: boolean;
    isLoadingPositions?: boolean;
  };
}

export function LaborDataForm({ form, catalogs }: LaborDataFormProps) {
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;
  const laborErrors = errors.laborData;

  const selectedCompanyId = watch("laborData.companyId");
  const selectedDepartmentId = watch("laborData.departmentId");
  const selectedAreaId = watch("laborData.areaId");
  const selectedPositionId = watch("laborData.positionId");
  const selectedWorkerTypeId = watch("laborData.workerTypeId");
  const selectedShiftId = watch("laborData.shiftId");

  // Auto-seleccionar cuando el catálogo tiene un único elemento disponible
  useEffect(() => {
    if (catalogs.companies.length === 1 && !selectedCompanyId) {
      setValue("laborData.companyId", catalogs.companies[0].id, { shouldValidate: true });
    }
    if (catalogs.workerTypes.length === 1 && !selectedWorkerTypeId) {
      setValue("laborData.workerTypeId", catalogs.workerTypes[0].id, { shouldValidate: true });
    }
  }, [
    catalogs.companies,
    catalogs.workerTypes,
    selectedCompanyId,
    selectedWorkerTypeId,
    setValue,
  ]);

  const selectedShift = catalogs.shifts.find((shift) => shift.id === selectedShiftId);
  const isCompanyLocked = catalogs.companies.length === 1;
  const hasSelectedDepartment = Boolean(selectedDepartmentId);
  const hasSelectedArea = Boolean(selectedAreaId);
  const hasAreas = catalogs.areas.length > 0;
  const hasPositions = catalogs.positions.length > 0;

  useEffect(() => {
    if (!selectedPositionId || catalogs.isLoadingPositions || !hasPositions) return;
    const selectedPositionExists = catalogs.positions.some((position) => position.id === selectedPositionId);
    if (!selectedPositionExists) {
      setValue("laborData.positionId", "", { shouldDirty: true, shouldValidate: true });
    }
  }, [catalogs.isLoadingPositions, catalogs.positions, hasPositions, selectedPositionId, setValue]);

  return (
    <div className="space-y-6">
      <div>
        <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Asignacion Laboral
        </h4>
        <div className="grid gap-4 md:grid-cols-2">
          <FieldFrame label="Empresa / Razon Social" error={laborErrors?.companyId?.message}>
            {isCompanyLocked ? (
              <div className="relative">
                <Input
                  value={catalogs.companies[0].name}
                  disabled
                  className="border-slate-200 bg-slate-50 font-medium text-slate-500"
                />
                <input type="hidden" {...register("laborData.companyId")} value={catalogs.companies[0].id} />
              </div>
            ) : (
              <Select {...register("laborData.companyId")}>
                <option value="">Selecciona Empresa...</option>
                {catalogs.companies.map((company) => (
                  <option key={`company-${company.id}`} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </Select>
            )}
          </FieldFrame>

          <FieldFrame label="Sede de Trabajo" error={laborErrors?.branchId?.message}>
            <Select {...register("laborData.branchId")}>
              <option value="">Selecciona Sede...</option>
              {catalogs.branches.map((branch) => (
                <option key={`branch-${branch.id}`} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </Select>
          </FieldFrame>

          <FieldFrame label="Departamento Interno" error={laborErrors?.departmentId?.message}>
            <Select
              {...register("laborData.departmentId")}
              onChange={(event) => {
                setValue("laborData.departmentId", event.target.value, { shouldValidate: true });
                setValue("laborData.areaId", "", { shouldValidate: true });
                setValue("laborData.positionId", "", { shouldValidate: true });
              }}
            >
              <option value="">Selecciona Departamento...</option>
              {catalogs.departments.map((department) => (
                <option key={`dept-${department.id}`} value={department.id}>
                  {department.name}
                </option>
              ))}
            </Select>
          </FieldFrame>

          <FieldFrame label="Area" error={laborErrors?.areaId?.message}>
            <Select
              {...register("laborData.areaId")}
              disabled={!hasSelectedDepartment || catalogs.isLoadingAreas || (hasSelectedDepartment && !hasAreas)}
              className="disabled:bg-slate-50 disabled:opacity-50"
              onChange={(event) => {
                setValue("laborData.areaId", event.target.value, { shouldValidate: true });
                setValue("laborData.positionId", "", { shouldValidate: true });
              }}
            >
              <option value="">
                {!hasSelectedDepartment
                  ? "Selecciona Departamento primero..."
                  : catalogs.isLoadingAreas
                    ? "Cargando areas..."
                    : hasAreas
                      ? "Selecciona Area..."
                      : "No hay areas para este departamento"}
              </option>
              {catalogs.areas.map((area) => (
                <option key={`area-${area.id}`} value={area.id}>
                  {area.name}
                </option>
              ))}
            </Select>
          </FieldFrame>

          <FieldFrame label="Cargo o Puesto" error={laborErrors?.positionId?.message}>
            <Select
              {...register("laborData.positionId")}
              value={selectedPositionId || ""}
              onChange={(event) => {
                setValue("laborData.positionId", event.target.value, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                });
              }}
              disabled={!hasSelectedArea || catalogs.isLoadingPositions || (hasSelectedArea && !hasPositions)}
              className="disabled:bg-slate-50 disabled:opacity-50"
            >
              <option value="">
                {!hasSelectedArea
                  ? "Selecciona Area primero..."
                  : catalogs.isLoadingPositions
                    ? "Cargando cargos..."
                    : hasPositions
                      ? "Selecciona Cargo..."
                      : "No hay cargos para esta area"}
              </option>
              {catalogs.positions.map((position) => (
                <option key={`pos-${position.id}`} value={position.id}>
                  {position.name}
                </option>
              ))}
            </Select>
          </FieldFrame>

          <FieldFrame label="Lugar de Trabajo" error={laborErrors?.workLocationId?.message}>
            <div className="flex gap-2">
              <Select {...register("laborData.workLocationId")} className="flex-1">
                <option value="">Selecciona Lugar de Trabajo...</option>
                {catalogs.workLocations.map((loc) => (
                  <option key={`loc-${loc.id}`} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </Select>
              <Button
                type="button"
                variant="secondary"
                
                className="shrink-0"
                onClick={() => setIsLocationModalOpen(true)}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </FieldFrame>
        </div>
      </div>
      
      <CreateWorkLocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSuccess={(newId) => {
          setValue("laborData.workLocationId", newId, { shouldValidate: true });
        }}
      />

      <hr className="border-slate-100" />

      <div>
        <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Detalles de Contratacion y Horario
        </h4>
        <div className="grid gap-4 md:grid-cols-2">
          <FieldFrame label="Tipo de Colaborador" error={laborErrors?.workerTypeId?.message}>
            <Select {...register("laborData.workerTypeId")}>
              <option value="">Selecciona Tipo...</option>
              {catalogs.workerTypes.map((workerType) => (
                <option key={`type-${workerType.id}`} value={workerType.id}>
                  {workerType.name}
                </option>
              ))}
            </Select>
          </FieldFrame>

          <FieldFrame label="Fecha de Ingreso" error={laborErrors?.startDate?.message}>
            <Input type="date" {...register("laborData.startDate")} />
          </FieldFrame>

          <FieldFrame label="Estado del trabajador" error={laborErrors?.status?.message}>
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

          <FieldFrame label="Supervisor Directo" error={laborErrors?.supervisorId?.message}>
            <Select {...register("laborData.supervisorId")}>
              <option value="">Selecciona Supervisor...</option>
              {catalogs.supervisors?.map((supervisor) => (
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
    </div>
  );
}
