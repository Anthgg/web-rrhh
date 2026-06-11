"use client";

import React from "react";
import type { UseFormReturn } from "react-hook-form";
import { CheckCircle2, User, Briefcase, FileText, Shield, FileSignature, AlertTriangle } from "lucide-react";
import type { OnboardingFormValues } from "../schemas/onboarding.schema";
import type { CatalogItem } from "../types/onboarding.types";

interface OnboardingSummaryProps {
 form: UseFormReturn<OnboardingFormValues>;
 completionMode?: boolean;
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
 return shift ? `${shift.name} (${shift.schedule || "Sin horario especificado"})` : id;
};

export function OnboardingSummary({ form, completionMode = false, catalogs }: OnboardingSummaryProps) {
 const { watch } = form;
 const values = watch();

 return (
 <div className="space-y-6">
 {/* Resumen del Alta */}
 <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
 <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Resumen del Alta</h4>
 <p className="text-sm text-muted-foreground">
 Por favor, valida que toda la información ingresada sea correcta antes de registrar al colaborador.
 </p>
 </div>

 <div className="grid gap-6 md:grid-cols-2">
 {/* 1. Datos Personales */}
 <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
 <div className="flex items-center gap-2.5 text-indigo-600 font-bold text-sm uppercase tracking-wider">
 <User className="size-4" />
 <span>Datos Personales</span>
 </div>
 <dl className="text-xs space-y-3 text-muted-foreground">
 <div className="flex justify-between border-b border-slate-50 pb-2">
 <dt className="text-muted-foreground font-medium">Trabajador:</dt>
 <dd className="font-semibold text-foreground text-right">
 {[values.personalData.firstName, values.personalData.paternalLastName, values.personalData.maternalLastName].filter(Boolean).join(" ")}
 </dd>
 </div>
 <div className="flex justify-between border-b border-slate-50 pb-2">
 <dt className="text-muted-foreground font-medium">DNI:</dt>
 <dd className="font-semibold text-foreground text-right">{values.personalData.dni}</dd>
 </div>
 <div className="flex justify-between border-b border-slate-50 pb-2">
 <dt className="text-muted-foreground font-medium">Teléfono:</dt>
 <dd className="font-semibold text-foreground text-right">{values.personalData.phone || "No registrado"}</dd>
 </div>
 <div className="flex justify-between pb-1">
 <dt className="text-muted-foreground font-medium">Correo Personal:</dt>
 <dd className="font-semibold text-foreground text-right break-all">{values.personalData.personalEmail || "No registrado"}</dd>
 </div>
 </dl>
 </div>

 {/* 2. Datos Laborales */}
 <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
 <div className="flex items-center gap-2.5 text-indigo-600 font-bold text-sm uppercase tracking-wider">
 <Briefcase className="size-4" />
 <span>Datos Laborales</span>
 </div>
 <dl className="text-xs space-y-3 text-muted-foreground">
 <div className="flex justify-between border-b border-slate-50 pb-2">
 <dt className="text-muted-foreground font-medium">Empresa:</dt>
 <dd className="font-semibold text-foreground text-right">
 {getCatalogName(catalogs.companies, values.laborData.companyId)}
 </dd>
 </div>
 <div className="flex justify-between border-b border-slate-50 pb-2">
 <dt className="text-muted-foreground font-medium">Departamento:</dt>
 <dd className="font-semibold text-foreground text-right">
 {getCatalogName(catalogs.departments, values.laborData.departmentId)}
 </dd>
 </div>
 <div className="flex justify-between border-b border-slate-50 pb-2">
 <dt className="text-muted-foreground font-medium">Área / Cargo:</dt>
 <dd className="font-semibold text-foreground text-right">
 {getCatalogName(catalogs.areas, values.laborData.areaId)} / {getCatalogName(catalogs.positions, values.laborData.positionId)}
 </dd>
 </div>
 <div className="flex justify-between border-b border-slate-50 pb-2">
 <dt className="text-muted-foreground font-medium">Tipo de Contrato:</dt>
 <dd className="font-semibold text-foreground text-right">
 {getCatalogName(catalogs.workerTypes, values.laborData.workerTypeId)}
 </dd>
 </div>
 <div className="flex justify-between pb-1">
 <dt className="text-muted-foreground font-medium">Turno:</dt>
 <dd className="font-semibold text-foreground text-right">{getShiftName(catalogs.shifts, values.laborData.shiftId)}</dd>
 </div>
 </dl>
 </div>

 {/* 3. Condiciones Contractuales */}
 <div className={`bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4 ${completionMode ? "hidden" : ""}`}>
 <div className="flex items-center gap-2.5 text-indigo-600 font-bold text-sm uppercase tracking-wider">
 <FileText className="size-4" />
 <span>Condiciones de Contrato</span>
 </div>
 {values.contractData.createContract ? (
 <dl className="text-xs space-y-3 text-muted-foreground">
 <div className="flex justify-between border-b border-slate-50 pb-2">
 <dt className="text-muted-foreground font-medium">Generación Automática:</dt>
 <dd className="font-semibold text-indigo-600 text-right">
 {values.contractData.generateContract ? "Sí, crear contrato PDF" : "No, subir manualmente"}
 </dd>
 </div>
 <div className="flex justify-between border-b border-slate-50 pb-2">
 <dt className="text-muted-foreground font-medium">Tipo de Contrato:</dt>
 <dd className="font-semibold text-foreground capitalize text-right">
 {values.contractData.contractType ? values.contractData.contractType.replace("_", " ") : ""}
 </dd>
 </div>
 <div className="flex justify-between border-b border-slate-50 pb-2">
 <dt className="text-muted-foreground font-medium">Vigencia:</dt>
 <dd className="font-semibold text-foreground text-right">
 {values.contractData.startDate} a {values.contractData.endDate || "Indefinido"}
 </dd>
 </div>
 <div className="flex justify-between pb-1">
 <dt className="text-muted-foreground font-medium">Salario:</dt>
 <dd className="font-bold text-indigo-700 text-right">
 {values.contractData.currency} {Number(values.contractData.salary || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
 </dd>
 </div>
 {values.contractData.costCenterId && (
 <div className="flex justify-between pt-2 border-t border-slate-50">
 <dt className="text-muted-foreground font-medium">Centro de Costo:</dt>
 <dd className="font-semibold text-foreground text-right">
 {getCatalogName(catalogs.costCenters, values.contractData.costCenterId)}
 </dd>
 </div>
 )}
 </dl>
 ) : (
 <div className="flex items-center justify-center h-28 bg-muted/50 rounded-xl border border-dashed border-border">
 <span className="text-xs text-muted-foreground font-semibold">No se registrará contrato laboral.</span>
 </div>
 )}
 </div>

 {/* 4. Acceso al Sistema */}
 <div className={`bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4 ${completionMode ? "hidden" : ""}`}>
 <div className="flex items-center gap-2.5 text-indigo-600 font-bold text-sm uppercase tracking-wider">
 <Shield className="size-4" />
 <span>Acceso al Sistema</span>
 </div>
 {values.accessData.createAccess ? (
 <dl className="text-xs space-y-3 text-muted-foreground">
 <div className="flex justify-between border-b border-slate-50 pb-2">
 <dt className="text-muted-foreground font-medium">Usuario:</dt>
 <dd className="font-semibold text-foreground text-right">{values.accessData.username}</dd>
 </div>
 <div className="flex justify-between border-b border-slate-50 pb-2">
 <dt className="text-muted-foreground font-medium">Correo Corporativo:</dt>
 <dd className="font-semibold text-foreground text-right break-all">{values.accessData.corporateEmail}</dd>
 </div>
 <div className="flex justify-between border-b border-slate-50 pb-2">
 <dt className="text-muted-foreground font-medium">Rol Asignado:</dt>
 <dd className="font-semibold text-foreground capitalize text-right">
 {getCatalogName(catalogs.roles || [], values.accessData.roleId) || values.accessData.role}
 </dd>
 </div>
 <div className="flex justify-between pb-1">
 <dt className="text-muted-foreground font-medium">Contraseña Temp.:</dt>
 <dd className="font-mono text-indigo-700 bg-indigo-50/70 px-2 py-0.5 rounded font-bold text-right">••••••••</dd>
 </div>
 </dl>
 ) : (
 <div className="flex items-center justify-center h-28 bg-muted/50 rounded-xl border border-dashed border-border">
 <span className="text-xs text-muted-foreground font-semibold">No se creará usuario de acceso.</span>
 </div>
 )}
 </div>

 {/* 5. Observaciones (Ancho completo si hay) */}
 {values.contractData.observations && values.contractData.createContract ? (
 <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-3 md:col-span-2">
 <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm uppercase tracking-wider">
 <FileSignature className="size-4" />
 <span>Observaciones Contractuales</span>
 </div>
 <p className="text-xs text-muted-foreground whitespace-pre-line bg-muted/60 p-4 rounded-xl border border-border/50 leading-relaxed font-medium">
 {values.contractData.observations}
 </p>
 </div>
 ) : null}
 </div>

 {/* Checklist de Acciones */}
 <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
 <h5 className="text-xs font-bold text-foreground uppercase tracking-wider">Acciones que se ejecutarán:</h5>
 <ul className="space-y-3">
 <li className="flex items-start gap-3 text-xs text-muted-foreground">
 <CheckCircle2 className="size-4 text-emerald-600 flex-shrink-0 mt-0.5" />
 <div>
 <strong className="font-semibold text-foreground">
 {completionMode ? "Completar perfil laboral:" : "Crear ficha de colaborador:"}
 </strong>{" "}
 {completionMode
 ? "Se actualizarán los datos personales pendientes y la asignación laboral del trabajador existente."
 : "Se guardarán todos los datos personales e información laboral del trabajador."}
 </div>
 </li>
 {!completionMode && values.contractData.generateContract && (
 <li className="flex items-start gap-3 text-xs text-muted-foreground">
 <CheckCircle2 className="size-4 text-emerald-600 flex-shrink-0 mt-0.5" />
 <div>
 <strong className="font-semibold text-foreground">Generación de Contrato:</strong> Se creará una plantilla contractual y se habilitará su descarga en formato PDF.
 </div>
 </li>
 )}
 {!completionMode && values.accessData.createAccess && (
 <li className="flex items-start gap-3 text-xs text-muted-foreground">
 <CheckCircle2 className="size-4 text-emerald-600 flex-shrink-0 mt-0.5" />
 <div>
 <strong className="font-semibold text-foreground">Crear Credenciales:</strong> Se creará el usuario de acceso y se enviará la contraseña temporal {values.accessData.sendCredentialsByEmail ? "por correo electrónico corporativo." : "a RR.HH."}
 </div>
 </li>
 )}
 </ul>
 </div>
 </div>
 );
}
