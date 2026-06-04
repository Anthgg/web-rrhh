"use client";

import React from "react";
import type { UseFormReturn } from "react-hook-form";
import { FieldFrame, Input, Select } from "@/components/ui/fields";
import { DniSearchSection } from "./DniSearchSection";
import type { OnboardingFormValues } from "../schemas/onboarding.schema";
import { useUbigeo } from "../hooks/useUbigeo";

interface PersonalDataFormProps {
  form: UseFormReturn<OnboardingFormValues>;
}

export function PersonalDataForm({ form }: PersonalDataFormProps) {
  const { clearErrors, register, setValue, watch, formState: { errors } } = form;
  
  // Watch DNI and other fields for coordination
  const dniValue = watch("personalData.dni");
  const departmentId = watch("personalData.departmentId");
  const provinceId = watch("personalData.provinceId");
  const ubigeo = useUbigeo(departmentId, provinceId);

  const personalErrors = errors.personalData;

  return (
    <div className="space-y-6">
      {/* 1. DNI Consulta */}
      <DniSearchSection
        setValue={setValue}
        dniValue={dniValue}
        onChangeDni={(val) => setValue("personalData.dni", val)}
      />

      <hr className="border-slate-100" />

      {/* 2. Información Básica */}
      <div>
        <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Información Básica
        </h4>
        <div className="grid gap-4 md:grid-cols-3">
          <FieldFrame label="Nombres" error={personalErrors?.firstName?.message}>
            <Input
              placeholder="Ej. Juan Alberto"
              {...register("personalData.firstName")}
            />
          </FieldFrame>

          <FieldFrame label="Apellido Paterno" error={personalErrors?.paternalLastName?.message}>
            <Input
              placeholder="Ej. Quispe"
              {...register("personalData.paternalLastName")}
            />
          </FieldFrame>

          <FieldFrame label="Apellido Materno" error={personalErrors?.maternalLastName?.message}>
            <Input
              placeholder="Ej. Mamani"
              {...register("personalData.maternalLastName")}
            />
          </FieldFrame>

          <FieldFrame label="Fecha de Nacimiento" error={personalErrors?.birthDate?.message}>
            <Input
              type="date"
              {...register("personalData.birthDate")}
            />
          </FieldFrame>

          <FieldFrame label="Género" error={personalErrors?.gender?.message}>
            <Select {...register("personalData.gender")}>
              <option value="">Selecciona...</option>
              <option value="male">Masculino</option>
              <option value="female">Femenino</option>
              <option value="other">Otro / No especifica</option>
            </Select>
          </FieldFrame>

          <FieldFrame label="Estado Civil" error={personalErrors?.civilStatus?.message}>
            <Select {...register("personalData.civilStatus")}>
              <option value="">Selecciona...</option>
              <option value="single">Soltero(a)</option>
              <option value="married">Casado(a)</option>
              <option value="divorced">Divorciado(a)</option>
              <option value="widowed">Viudo(a)</option>
              <option value="cohabiting">Conviviente</option>
            </Select>
          </FieldFrame>

          <FieldFrame label="Nacionalidad" error={personalErrors?.nationality?.message}>
            <Input
              placeholder="Ej. Peruana"
              {...register("personalData.nationality")}
            />
          </FieldFrame>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* 3. Contacto */}
      <div>
        <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Contacto
        </h4>
        <div className="grid gap-4 md:grid-cols-3">
          <FieldFrame label="Teléfono Celular" error={personalErrors?.phone?.message}>
            <Input
              placeholder="Ej. 987654321"
              {...register("personalData.phone")}
            />
          </FieldFrame>

          <FieldFrame label="Teléfono Secundario" error={personalErrors?.secondaryPhone?.message}>
            <Input
              placeholder="Ej. 014567890 (Opcional)"
              {...register("personalData.secondaryPhone")}
            />
          </FieldFrame>

          <FieldFrame label="Correo Electrónico Personal" error={personalErrors?.personalEmail?.message}>
            <Input
              type="email"
              placeholder="juan.quispe@example.com"
              {...register("personalData.personalEmail")}
            />
          </FieldFrame>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* 4. Dirección */}
      <div>
        <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Dirección Residencial
        </h4>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <FieldFrame label="Dirección Completa" error={personalErrors?.address?.message}>
              <Input
                placeholder="Ej. Av. Los Próceres 123 Int. 4"
                {...register("personalData.address")}
              />
            </FieldFrame>
          </div>

          <FieldFrame label="Departamento" error={personalErrors?.departmentId?.message}>
            <Select
              {...register("personalData.departmentId")}
              disabled={ubigeo.departmentsQuery.isLoading}
              onChange={(event) => {
                setValue("personalData.departmentId", event.target.value, { shouldDirty: true, shouldValidate: true });
                setValue("personalData.provinceId", "", { shouldDirty: true, shouldValidate: true });
                setValue("personalData.districtId", "", { shouldDirty: true, shouldValidate: true });
                clearErrors(["personalData.provinceId", "personalData.districtId"]);
              }}
            >
              <option value="">Selecciona departamento...</option>
              {ubigeo.departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </Select>
          </FieldFrame>

          <FieldFrame label="Provincia" error={personalErrors?.provinceId?.message}>
            <Select
              {...register("personalData.provinceId")}
              disabled={!departmentId || ubigeo.provincesQuery.isFetching}
              onChange={(event) => {
                setValue("personalData.provinceId", event.target.value, { shouldDirty: true, shouldValidate: true });
                setValue("personalData.districtId", "", { shouldDirty: true, shouldValidate: true });
                clearErrors("personalData.districtId");
              }}
            >
              <option value="">Selecciona provincia...</option>
              {ubigeo.provinces.map((province) => (
                <option key={province.id} value={province.id}>
                  {province.name}
                </option>
              ))}
            </Select>
          </FieldFrame>

          <FieldFrame label="Distrito" error={personalErrors?.districtId?.message}>
            <Select
              {...register("personalData.districtId")}
              disabled={!provinceId || ubigeo.districtsQuery.isFetching}
            >
              <option value="">Selecciona distrito...</option>
              {ubigeo.districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </Select>
          </FieldFrame>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* 5. Contacto de Emergencia */}
      <div>
        <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Contacto de Emergencia
        </h4>
        <div className="grid gap-4 md:grid-cols-2">
          <FieldFrame label="Nombre del Contacto" error={personalErrors?.emergencyContactName?.message}>
            <Input
              placeholder="Ej. Maria Quispe (Madre)"
              {...register("personalData.emergencyContactName")}
            />
          </FieldFrame>

          <FieldFrame label="Teléfono de Emergencia" error={personalErrors?.emergencyContactPhone?.message}>
            <Input
              placeholder="Ej. 912345678"
              {...register("personalData.emergencyContactPhone")}
            />
          </FieldFrame>
        </div>
      </div>
    </div>
  );
}
