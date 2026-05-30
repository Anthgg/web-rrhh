"use client";

import React, { useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import { FieldFrame, Input, Select, Textarea } from "@/components/ui/fields";
import type { OnboardingFormValues } from "../schemas/onboarding.schema";
import type { CatalogItem } from "../types/onboarding.types";

interface ContractDataFormProps {
  form: UseFormReturn<OnboardingFormValues>;
  catalogs: {
    costCenters: CatalogItem[];
  };
}

export function ContractDataForm({ form, catalogs }: ContractDataFormProps) {
  const { register, watch, setValue, formState: { errors } } = form;
  const contractErrors = errors.contractData;

  const createContract = watch("contractData.createContract");
  const contractType = watch("contractData.contractType");

  // Sync createContract and generateContract
  useEffect(() => {
    if (!createContract) {
      setValue("contractData.generateContract", false);
    }
  }, [createContract, setValue]);

  // If contractType is indefinido, clear and disable endDate
  useEffect(() => {
    if (contractType === "indefinido") {
      setValue("contractData.endDate", "");
    }
  }, [contractType, setValue]);

  return (
    <div className="space-y-6">
      {/* Principal: Activar / Desactivar Contrato */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 flex items-center justify-between transition-all duration-200 hover:border-slate-300">
        <div>
          <h4 className="text-sm font-semibold text-slate-800">¿Registrar contrato de trabajo?</h4>
          <p className="text-xs text-slate-500">
            Desactiva esta opción si el colaborador se incorporará inicialmente sin registrar un contrato formal.
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            {...register("contractData.createContract")}
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
      </div>

      <hr className="border-slate-100" />

      {!createContract ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/30 p-8 text-center space-y-2">
          <p className="text-sm font-medium text-slate-600">Alta de colaborador sin contrato de trabajo</p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            El colaborador se registrará con estado activo en el sistema, pero no se generará un registro contractual ni plantilla PDF en esta alta. Podrás registrar su contrato más adelante.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. Generación Automática */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/20 p-4 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-indigo-900">¿Generar contrato en PDF automáticamente?</h4>
              <p className="text-xs text-indigo-700/80">
                Si se activa, el sistema creará una plantilla de contrato con los datos laborales cargados lista para descargar.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                {...register("contractData.generateContract")}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <hr className="border-slate-100" />

          {/* 2. Condiciones Contractuales */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Condiciones Contractuales
            </h4>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Tipo de Contrato */}
              <FieldFrame label="Tipo de Contrato" error={contractErrors?.contractType?.message}>
                <Select {...register("contractData.contractType")}>
                  <option value="indefinido">Indefinido / Permanente</option>
                  <option value="temporal">Plazo Fijo (Temporal)</option>
                  <option value="obra_determinada">Por Obra / Servicio Específico</option>
                  <option value="practicas">Convenio de Prácticas</option>
                  <option value="locacion_servicios">Locación de Servicios</option>
                </Select>
              </FieldFrame>

              {/* Período de Prueba */}
              <div className="flex items-center h-full pt-6">
                <label className="flex items-center gap-3 cursor-pointer text-sm text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    className="size-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    {...register("contractData.trialPeriod")}
                  />
                  <span>Aplicar período de prueba (3 meses por defecto)</span>
                </label>
              </div>

              {/* Fecha de Inicio */}
              <FieldFrame label="Fecha de Inicio del Contrato" error={contractErrors?.startDate?.message}>
                <Input
                  type="date"
                  {...register("contractData.startDate")}
                />
              </FieldFrame>

              {/* Fecha de Fin */}
              <FieldFrame
                label="Fecha de Fin del Contrato"
                error={contractErrors?.endDate?.message}
                hint={contractType === "indefinido" ? "No aplicable para contratos indefinidos." : "Opcional."}
              >
                <Input
                  type="date"
                  disabled={contractType === "indefinido"}
                  className={contractType === "indefinido" ? "bg-slate-50 text-slate-400 cursor-not-allowed" : ""}
                  {...register("contractData.endDate")}
                />
              </FieldFrame>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* 3. Compensación y Jornada */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Compensación y Jornada
            </h4>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Salario */}
              <div className="md:col-span-2">
                <FieldFrame label="Salario Base Mensual" error={contractErrors?.salary?.message}>
                  <div className="relative flex">
                    <Select
                      className="rounded-r-none border-r-0 w-24 h-11"
                      {...register("contractData.currency")}
                    >
                      <option value="PEN">S/ (PEN)</option>
                      <option value="USD">$ (USD)</option>
                    </Select>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Ej. 1500.00"
                      className="rounded-l-none flex-1 h-11"
                      {...register("contractData.salary")}
                    />
                  </div>
                </FieldFrame>
              </div>

              {/* Tipo de Jornada */}
              <FieldFrame label="Tipo de Jornada" error={contractErrors?.workdayType?.message}>
                <Select {...register("contractData.workdayType")}>
                  <option value="full_time">Tiempo Completo (48 hrs)</option>
                  <option value="part_time">Medio Tiempo (24 hrs)</option>
                </Select>
              </FieldFrame>

              {/* Modalidad de Trabajo */}
              <FieldFrame label="Modalidad" error={contractErrors?.workMode?.message}>
                <Select {...register("contractData.workMode")}>
                  <option value="onsite">100% Presencial</option>
                  <option value="remote">100% Remoto</option>
                  <option value="hybrid">Híbrido</option>
                </Select>
              </FieldFrame>

              {/* Centro de Costo */}
              <FieldFrame label="Centro de Costo" error={contractErrors?.costCenterId?.message}>
                <Select {...register("contractData.costCenterId")}>
                  <option value="">Selecciona Centro de Costo (Opcional)...</option>
                  {catalogs.costCenters.map((costCenter) => (
                    <option key={costCenter.id} value={costCenter.id}>
                      {costCenter.name}
                    </option>
                  ))}
                </Select>
              </FieldFrame>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* 4. Observaciones */}
          <div>
            <FieldFrame label="Observaciones Contractuales" error={contractErrors?.observations?.message}>
              <Textarea
                placeholder="Ingresa acuerdos especiales, bonos condicionales, u otras anotaciones."
                {...register("contractData.observations")}
              />
            </FieldFrame>
          </div>
        </div>
      )}
    </div>
  );
}
