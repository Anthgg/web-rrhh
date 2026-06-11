"use client";

import type { LucideIcon } from "lucide-react";
import { AlertTriangle, CheckCircle2, Clock3, LoaderCircle, RotateCcw, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type CompanyConfigurationStatus = "active" | "pending" | "empty";

interface CompanySettingsHeaderProps {
 canRestore: boolean;
 canSave: boolean;
 isSaving: boolean;
 lastUpdatedLabel: string;
 onRestore: () => void;
 onSave: () => void;
 status: CompanyConfigurationStatus;
}

const statusCopy: Record<
 CompanyConfigurationStatus,
 {
 label: string;
 className: string;
 icon: LucideIcon;
 }
> = {
 active: {
 label: "Configuracion activa",
 className: "border-emerald-200 bg-emerald-50 text-emerald-700",
 icon: CheckCircle2,
 },
 pending: {
 label: "Pendiente de completar",
 className: "border-amber-200 bg-amber-50 text-amber-700",
 icon: AlertTriangle,
 },
 empty: {
 label: "Sin configurar",
 className: "border-border bg-muted text-muted-foreground",
 icon: Clock3,
 },
};

export function CompanySettingsHeader({
 canRestore,
 canSave,
 isSaving,
 lastUpdatedLabel,
 onRestore,
 onSave,
 status,
}: CompanySettingsHeaderProps) {
 const StatusIcon = statusCopy[status].icon;

 return (
 <section className="sticky top-0 z-20 -mx-4 border-b border-border bg-muted/95 p-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
 <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
 <div className="grid gap-3">
 <div className="flex flex-wrap items-center gap-2">
 <span
 className={cn(
 "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
 statusCopy[status].className,
 )}
 >
 <StatusIcon className="size-3.5" />
 {statusCopy[status].label}
 </span>
 <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground-soft">
 <Clock3 className="size-3.5" />
 Ultima actualizacion: {lastUpdatedLabel}
 </span>
 </div>

 <div className="grid gap-2">
 <h1 className="section-title text-2xl font-semibold text-foreground sm:text-3xl">
 Configuracion de Empresa
 </h1>
 <p className="max-w-3xl text-sm leading-6 text-foreground-soft">
 Define la informacion legal, marca y archivos oficiales que se aplican a reportes, constancias y documentos internos.
 </p>
 </div>
 </div>

 <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center xl:justify-end">
 <Button
 variant="secondary"
 className="rounded-lg"
 onClick={onRestore}
 disabled={!canRestore || isSaving}
 >
 <RotateCcw className="mr-2 size-4" />
 Restaurar cambios
 </Button>
 <Button className="rounded-lg" onClick={onSave} disabled={!canSave}>
 {isSaving ? (
 <LoaderCircle className="mr-2 size-4 animate-spin" />
 ) : (
 <Save className="mr-2 size-4" />
 )}
 Guardar cambios
 </Button>
 </div>
 </div>
 </section>
 );
}
