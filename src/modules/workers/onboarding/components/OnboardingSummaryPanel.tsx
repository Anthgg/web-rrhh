"use client";

import type { UseFormReturn } from "react-hook-form";
import { AlertTriangle, BriefcaseBusiness, FileSignature, UserRound } from "lucide-react";

import type { OnboardingFormValues } from "../schemas/onboarding.schema";
import type { CatalogItem } from "../types/onboarding.types";

interface OnboardingSummaryPanelProps {
 form: UseFormReturn<OnboardingFormValues>;
 completionMode: boolean;
 contractMode: boolean;
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
 missingFields: string[];
}

function findName(items: CatalogItem[], id?: string) {
 if (!id) return "No asignado";
 return items.find((item) => item.id === id)?.name ?? id;
}

function SummaryRow({ label, value }: { label: string; value?: string | null }) {
 return (
 <div className="grid gap-1 border-b border-border pb-3 last:border-b-0 last:pb-0">
 <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
 <dd className="break-words text-sm font-semibold text-foreground">{value || "No informado"}</dd>
 </div>
 );
}

export function OnboardingSummaryPanel({
 form,
 completionMode,
 contractMode,
 catalogs,
 missingFields,
}: OnboardingSummaryPanelProps) {
 const values = form.watch();
 const fullName = [
 values.personalData.firstName,
 values.personalData.paternalLastName,
 values.personalData.maternalLastName,
 ].filter(Boolean).join(" ");

 return (
 <aside className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
 <div>
 <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-500">Resumen</p>
 <h2 className="mt-1 text-base font-bold text-slate-950">
 {contractMode ? "Contrato" : completionMode ? "Perfil laboral" : "Nuevo colaborador"}
 </h2>
 </div>

 {missingFields.length ? (
 <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-900">
 <AlertTriangle className="mt-0.5 size-4 shrink-0" />
 {missingFields.length} campos pendientes por completar.
 </div>
 ) : null}

 <dl className="grid gap-3">
 <SummaryRow label="Trabajador" value={fullName} />
 <SummaryRow label="DNI" value={values.personalData.dni} />
 <SummaryRow label="Empresa" value={findName(catalogs.companies, values.laborData.companyId)} />
 <SummaryRow label="Cargo" value={findName(catalogs.positions, values.laborData.positionId)} />
 <SummaryRow label="Turno" value={findName(catalogs.shifts, values.laborData.shiftId)} />
 </dl>

 <div className="grid gap-2 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
 <div className="flex items-center gap-2">
 <UserRound className="size-4 text-indigo-600" />
 Datos personales
 </div>
 <div className="flex items-center gap-2">
 <BriefcaseBusiness className="size-4 text-indigo-600" />
 Asignacion laboral
 </div>
 {!completionMode ? (
 <div className="flex items-center gap-2">
 <FileSignature className="size-4 text-indigo-600" />
 Contrato y acceso
 </div>
 ) : null}
 </div>
 </aside>
 );
}
