"use client";

import React from "react";
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
 const trialPeriod = watch("contractData.trialPeriod");
 const startDate = watch("contractData.startDate");

 const updateCalculatedEndDate = (newStartDate: string | undefined, isTrial: boolean | undefined, isIndefinido: boolean) => {
 if (!isTrial || isIndefinido || !newStartDate) return;
 try {
 const start = new Date(newStartDate);
 if (isNaN(start.getTime())) return;
 const end = new Date(start);
 end.setMonth(end.getMonth() + 3);
 setValue("contractData.endDate", end.toISOString().split("T")[0], { shouldValidate: true });
 } catch {
 // ignore
 }
 };

 return (
 <div className="space-y-6">
 {/* 1. Toggle Activación Contrato */}
 <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <div>
 <h4 className="text-sm font-semibold text-foreground">¿Registrar contrato de trabajo?</h4>
 <p className="text-xs text-muted-foreground">
 Desactiva esta opción si el colaborador se incorporará inicialmente sin registrar un contrato formal.
 </p>
 </div>
 <label className="relative inline-flex items-center cursor-pointer shrink-0">
 <input
 type="checkbox"
 className="sr-only peer"
 {...register("contractData.createContract", {
 onChange: (e) => {
 if (!e.target.checked) {
 setValue("contractData.generateContract", false);
 }
 }
 })}
 />
 <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
 </label>
 </div>

 {!createContract ? (
 <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center space-y-2">
 <p className="text-sm font-medium text-muted-foreground">Alta de colaborador sin contrato de trabajo</p>
 <p className="text-xs text-muted-foreground max-w-md mx-auto">
 El colaborador se registrará con estado activo en el sistema, pero no se generará un registro contractual ni plantilla PDF en esta alta. Podrás registrar su contrato más adelante.
 </p>
 </div>
 ) : (
 <div className="space-y-6">
 {/* 2. Generación Automática */}
 <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <div>
 <h4 className="text-sm font-semibold text-foreground">¿Generar contrato en PDF automáticamente?</h4>
 <p className="text-xs text-muted-foreground">
 Si se activa, el sistema creará una plantilla de contrato con los datos laborales cargados lista para descargar.
 </p>
 </div>
 <label className="relative inline-flex items-center cursor-pointer shrink-0">
 <input
 type="checkbox"
 className="sr-only peer"
 {...register("contractData.generateContract")}
 />
 <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
 </label>
 </div>

 {/* 3. Condiciones Contractuales */}
 <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
 <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
 Condiciones Contractuales
 </h4>
 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
 {/* Tipo de Contrato */}
 <FieldFrame label="Tipo de Contrato" error={contractErrors?.contractType?.message}>
 <Select
 {...register("contractData.contractType", {
 onChange: (e) => {
 const newType = e.target.value;
 if (newType === "indefinido") {
 setValue("contractData.endDate", "");
 } else {
 updateCalculatedEndDate(startDate, trialPeriod, newType === "indefinido");
 }
 }
 })}
 >
 <option value="indefinido">Indefinido / Permanente</option>
 <option value="temporal">Plazo Fijo (Temporal)</option>
 <option value="obra_determinada">Por Obra / Servicio Específico</option>
 <option value="practicas">Convenio de Prácticas</option>
 <option value="locacion_servicios">Locación de Servicios</option>
 </Select>
 </FieldFrame>

 {/* Período de Prueba */}
 <div className="flex items-center h-full pt-2 md:pt-6">
 <label className="flex items-center gap-3 cursor-pointer text-sm text-foreground font-medium">
 <input
 type="checkbox"
 className="size-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
 {...register("contractData.trialPeriod", {
 onChange: (e) => {
 const isTrial = e.target.checked;
 const isIndefinido = contractType === "indefinido";
 if (!isTrial && !isIndefinido) {
 setValue("contractData.endDate", "", { shouldValidate: false });
 } else {
 updateCalculatedEndDate(startDate, isTrial, isIndefinido);
 }
 }
 })}
 />
 <span>Aplicar período de prueba (3 meses por defecto)</span>
 </label>
 </div>

 {/* Fecha de Inicio */}
 <FieldFrame label="Fecha de Inicio del Contrato" error={contractErrors?.startDate?.message}>
 <Input
 type="date"
 {...register("contractData.startDate", {
 onChange: (e) => {
 const newStartDate = e.target.value;
 updateCalculatedEndDate(newStartDate, trialPeriod, contractType === "indefinido");
 }
 })}
 />
 </FieldFrame>

 {/* Fecha de Fin */}
 <FieldFrame
 label="Fecha de Fin del Contrato"
 error={contractErrors?.endDate?.message}
 hint={
 contractType === "indefinido"
 ? "No aplicable para contratos indefinidos."
 : trialPeriod
 ? undefined
 : "Opcional."
 }
 >
 <Input
 type="date"
 disabled={contractType === "indefinido"}
 className={contractType === "indefinido" ? "bg-muted text-muted-foreground cursor-not-allowed" : ""}
 {...register("contractData.endDate")}
 />
 {trialPeriod && contractType !== "indefinido" ? (
 <p className="mt-1 flex items-center gap-1 text-[11px] text-indigo-600">
 <span className="inline-block size-2 rounded-full bg-indigo-400 animate-pulse" />
 Calculada automáticamente (período de prueba 3 meses). Puedes ajustarla manualmente.
 </p>
 ) : null}
 </FieldFrame>
 </div>
 </div>

 {/* 4. Compensación y Jornada */}
 <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
 <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
 Compensación y Jornada
 </h4>
 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
 <div className="md:col-span-2">
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
 </div>

 {/* 5. Observaciones */}
 <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
 <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
 Observaciones Contractuales
 </h4>
 <FieldFrame label="Observaciones" error={contractErrors?.observations?.message}>
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
