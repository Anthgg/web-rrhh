"use client";

import React from "react";
import type { UseFormReturn } from "react-hook-form";
import { CheckCircle2, User, Briefcase, FileText, Shield } from "lucide-react";
import type { OnboardingFormValues } from "../schemas/onboarding.schema";
import type { CatalogItem } from "../types/onboarding.types";

interface OnboardingSummaryProps {
  form: UseFormReturn<OnboardingFormValues>;
  catalogs: {
    companies: CatalogItem[];
    branches: CatalogItem[];
    departments: CatalogItem[];
    areas: CatalogItem[];
    positions: CatalogItem[];
    workerTypes: CatalogItem[];
    shifts: CatalogItem[];
    costCenters: CatalogItem[];
    roles?: CatalogItem[];
  };
}

const getCatalogName = (list: CatalogItem[], id?: string) => {
  if (!id) return "No asignado";
  return list.find((item) => item.id === id)?.name ?? id;
};

const getShiftName = (shifts: CatalogItem[], id?: string) => {
  if (!id) return "Sin turno asignado";
  const shift = shifts.find((s) => s.id === id);
  return shift ? `${shift.name} (${shift.schedule})` : id;
};

export function OnboardingSummary({ form, catalogs }: OnboardingSummaryProps) {
  const { watch } = form;
  const values = watch();

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">Resumen del Alta</h4>
        <p className="text-xs text-slate-500">
          Por favor, valida que la información ingresada sea correcta antes de registrar al colaborador.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 1. Datos Personales */}
        <div className="border border-slate-100 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm">
            <User className="size-4" />
            <span>Datos Personales</span>
          </div>
          <dl className="text-xs space-y-2 text-slate-600">
            <div className="flex justify-between border-b border-slate-50 pb-1.5">
              <dt className="text-slate-400">Trabajador:</dt>
              <dd className="font-medium text-slate-800">
                {values.personalData.firstName} {values.personalData.paternalLastName} {values.personalData.maternalLastName || ""}
              </dd>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-1.5">
              <dt className="text-slate-400">DNI:</dt>
              <dd className="font-medium text-slate-800">{values.personalData.dni}</dd>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-1.5">
              <dt className="text-slate-400">Teléfono:</dt>
              <dd className="font-medium text-slate-800">{values.personalData.phone}</dd>
            </div>
            <div className="flex justify-between pb-0.5">
              <dt className="text-slate-400">Correo Personal:</dt>
              <dd className="font-medium text-slate-800">{values.personalData.personalEmail || "No registrado"}</dd>
            </div>
          </dl>
        </div>

        {/* 2. Datos Laborales */}
        <div className="border border-slate-100 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm">
            <Briefcase className="size-4" />
            <span>Datos Laborales</span>
          </div>
          <dl className="text-xs space-y-2 text-slate-600">
            <div className="flex justify-between border-b border-slate-50 pb-1.5">
              <dt className="text-slate-400">Empresa:</dt>
              <dd className="font-medium text-slate-800">
                {getCatalogName(catalogs.companies, values.laborData.companyId)}
              </dd>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-1.5">
              <dt className="text-slate-400">Departamento:</dt>
              <dd className="font-medium text-slate-800">
                {getCatalogName(catalogs.departments, values.laborData.departmentId)}
              </dd>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-1.5">
              <dt className="text-slate-400">Área / Cargo:</dt>
              <dd className="font-medium text-slate-800">
                {getCatalogName(catalogs.areas, values.laborData.areaId)} / {getCatalogName(catalogs.positions, values.laborData.positionId)}
              </dd>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-1.5">
              <dt className="text-slate-400">Tipo de Contrato:</dt>
              <dd className="font-medium text-slate-800">
                {getCatalogName(catalogs.workerTypes, values.laborData.workerTypeId)}
              </dd>
            </div>
            <div className="flex justify-between pb-0.5">
              <dt className="text-slate-400">Turno:</dt>
              <dd className="font-medium text-slate-800">{getShiftName(catalogs.shifts, values.laborData.shiftId)}</dd>
            </div>
          </dl>
        </div>

        {/* 3. Condiciones Contractuales */}
        <div className="border border-slate-100 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm">
            <FileText className="size-4" />
            <span>Condiciones de Contrato</span>
          </div>
          {values.contractData.createContract ? (
            <dl className="text-xs space-y-2 text-slate-600">
              <div className="flex justify-between border-b border-slate-50 pb-1.5">
                <dt className="text-slate-400">Generación Automática:</dt>
                <dd className="font-semibold text-slate-800">
                  {values.contractData.generateContract ? "Sí, crear contrato PDF" : "No, subir manualmente"}
                </dd>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-1.5">
                <dt className="text-slate-400">Tipo de Contrato:</dt>
                <dd className="font-medium text-slate-800 capitalize">
                  {values.contractData.contractType ? values.contractData.contractType.replace("_", " ") : ""}
                </dd>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-1.5">
                <dt className="text-slate-400">Vigencia:</dt>
                <dd className="font-medium text-slate-800">
                  {values.contractData.startDate} a {values.contractData.endDate || "Indefinido"}
                </dd>
              </div>
              <div className="flex justify-between pb-0.5">
                <dt className="text-slate-400">Salario:</dt>
                <dd className="font-medium text-indigo-700 font-semibold">
                  {values.contractData.currency} {Number(values.contractData.salary || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                </dd>
              </div>
              {values.contractData.costCenterId && (
                <div className="flex justify-between pt-1.5 border-t border-slate-50">
                  <dt className="text-slate-400">Centro de Costo:</dt>
                  <dd className="font-medium text-slate-800">
                    {getCatalogName(catalogs.costCenters, values.contractData.costCenterId)}
                  </dd>
                </div>
              )}
            </dl>
          ) : (
            <div className="flex items-center justify-center h-24 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <span className="text-xs text-slate-400 font-medium">No se creará contrato de trabajo.</span>
            </div>
          )}
        </div>

        {/* 4. Acceso al Sistema */}
        <div className="border border-slate-100 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm">
            <Shield className="size-4" />
            <span>Acceso al Sistema</span>
          </div>
          {values.accessData.createAccess ? (
            <dl className="text-xs space-y-2 text-slate-600">
              <div className="flex justify-between border-b border-slate-50 pb-1.5">
                <dt className="text-slate-400">Usuario:</dt>
                <dd className="font-medium text-slate-800">{values.accessData.username}</dd>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-1.5">
                <dt className="text-slate-400">Correo Corporativo:</dt>
                <dd className="font-medium text-slate-800">{values.accessData.corporateEmail}</dd>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-1.5">
                <dt className="text-slate-400">Rol Asignado:</dt>
                <dd className="font-semibold text-slate-800 capitalize">
                  {getCatalogName(catalogs.roles || [], values.accessData.roleId) || values.accessData.role}
                </dd>
              </div>
              <div className="flex justify-between pb-0.5">
                <dt className="text-slate-400">Contraseña Temp.:</dt>
                <dd className="font-mono text-indigo-700 bg-indigo-50 px-1 rounded">••••••••</dd>
              </div>
            </dl>
          ) : (
            <div className="flex items-center justify-center h-24 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <span className="text-xs text-slate-400 font-medium">No se creará usuario de acceso.</span>
            </div>
          )}
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Checklist de Acciones */}
      <div className="bg-indigo-50/20 border border-indigo-100/50 rounded-xl p-4">
        <h5 className="text-xs font-semibold text-indigo-950 block mb-3">Acciones que se ejecutarán:</h5>
        <ul className="space-y-2.5">
          <li className="flex items-start gap-2.5 text-xs text-slate-700">
            <CheckCircle2 className="size-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-medium text-slate-900">Crear ficha de colaborador:</strong> Se guardarán todos los datos personales e información laboral del trabajador.
            </div>
          </li>
          {values.contractData.generateContract && (
            <li className="flex items-start gap-2.5 text-xs text-slate-700">
              <CheckCircle2 className="size-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-medium text-slate-900">Generación de Contrato:</strong> Se creará una plantilla contractual y se habilitará su descarga en formato PDF.
              </div>
            </li>
          )}
          {values.accessData.createAccess && (
            <li className="flex items-start gap-2.5 text-xs text-slate-700">
              <CheckCircle2 className="size-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-medium text-slate-900">Crear Credenciales:</strong> Se creará el usuario de acceso y se enviará la contraseña temporal {values.accessData.sendCredentialsByEmail ? "por correo electrónico corporativo." : "a RR.HH."}
              </div>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
