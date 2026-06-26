import { FieldFrame, Input, Select } from "@/components/ui/fields";

import type { LaborOrganizationFieldsProps } from "./labor-data.types";

export function LaborOrganizationFields({
  register,
  setValue,
  laborErrors,
  catalogs,
  organizationState,
  selectedPositionId,
  positionOptions,
}: LaborOrganizationFieldsProps) {
  const {
    preservePositionOnAreaChange,
    isCompanyLocked,
    hasSelectedDepartment,
    hasSelectedArea,
    hasAreas,
    hasPositions,
  } = organizationState;

  return (
    <>
      <FieldFrame label="Empresa / Razon Social" error={laborErrors?.companyId?.message}>
        {isCompanyLocked ? (
          <div className="relative">
            <Input
              value={catalogs.companies[0].name}
              disabled
              className="border-border bg-muted font-medium text-muted-foreground"
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

      <FieldFrame label="Sede de Trabajo (opcional)" error={laborErrors?.branchId?.message}>
        <Select {...register("laborData.branchId")}>
          <option value="">Selecciona Sede...</option>
          {catalogs.branches.map((branch) => (
            <option key={`branch-${branch.id}`} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </Select>
      </FieldFrame>

      <FieldFrame label="Departamento Interno (Organizacion)" error={laborErrors?.departmentId?.message}>
        <Select
          {...register("laborData.departmentId")}
          onChange={(event) => {
            setValue("laborData.departmentId", event.target.value, { shouldValidate: true });
            setValue("laborData.areaId", "", { shouldValidate: true });
            if (!preservePositionOnAreaChange) {
              setValue("laborData.positionId", "", { shouldValidate: true });
            }
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
          className="disabled:bg-muted disabled:opacity-50"
          onChange={(event) => {
            setValue("laborData.areaId", event.target.value, { shouldValidate: true });
            if (!preservePositionOnAreaChange) {
              setValue("laborData.positionId", "", { shouldValidate: true });
            }
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
          disabled={(!hasSelectedArea && !selectedPositionId) || catalogs.isLoadingPositions || (hasSelectedArea && !hasPositions)}
          className="disabled:bg-muted disabled:opacity-50"
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
          {positionOptions.map((position) => (
            <option key={`pos-${position.id}`} value={position.id}>
              {position.name}
            </option>
          ))}
        </Select>
      </FieldFrame>
    </>
  );
}

