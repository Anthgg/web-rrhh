"use client";

import { AlertTriangle, FileBadge2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { OfficialFileCard } from "@/components/settings/company/OfficialFileCard";
import type { OfficialFileState } from "@/hooks/useOfficialFileUpload";
import type { CompanyAssetType, CompanySettings } from "@/types";

interface OfficialFilesManagerProps {
 fileStates: OfficialFileState;
 isConfigured: boolean;
 settings: CompanySettings | null;
 onDelete: (assetType: CompanyAssetType) => Promise<boolean>;
 onUpload: (assetType: CompanyAssetType, file: File) => Promise<boolean>;
}

export function OfficialFilesManager({
 fileStates,
 isConfigured,
 settings,
 onDelete,
 onUpload,
}: OfficialFilesManagerProps) {
 const disabledMessage = "Guarda la informacion legal para habilitar la carga de archivos.";

 return (
 <Card className="grid gap-6 rounded-lg border-border bg-card p-5 shadow-sm">
 <div className="grid gap-2">
 <span className="inline-flex w-fit items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">
 <FileBadge2 className="size-3.5" />
 Archivos oficiales
 </span>
 <div className="grid gap-1">
 <h2 className="section-title text-xl font-semibold text-foreground">Logo, firma y sello</h2>
 <p className="max-w-3xl text-sm leading-6 text-foreground-soft">
 Activos usados en reportes PDF, constancias laborales, solicitudes internas y plantillas corporativas.
 </p>
 </div>
 </div>

 {!isConfigured ? (
 <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
 <AlertTriangle className="mt-0.5 size-4 shrink-0" />
 <p>{disabledMessage}</p>
 </div>
 ) : null}

 <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
 <OfficialFileCard
 assetType="logo"
 title="Logo corporativo"
 description="Aparece en encabezados de reportes, constancias y plantillas descargables."
 currentUrl={settings?.logo_url}
 disabled={!isConfigured}
 disabledMessage={disabledMessage}
 phase={fileStates.logo.phase}
 onUpload={onUpload}
 onDelete={onDelete}
 />

 <OfficialFileCard
 assetType="signature"
 title="Firma digital"
 description="Se usa en bloques de validacion y documentos emitidos por RR.HH."
 currentUrl={settings?.firma_url}
 disabled={!isConfigured}
 disabledMessage={disabledMessage}
 phase={fileStates.signature.phase}
 onUpload={onUpload}
 onDelete={onDelete}
 />

 <OfficialFileCard
 assetType="stamp"
 title="Sello institucional"
 description="Refuerza solicitudes aprobadas, constancias y formatos internos oficiales."
 currentUrl={settings?.sello_url}
 disabled={!isConfigured}
 disabledMessage={disabledMessage}
 phase={fileStates.stamp.phase}
 onUpload={onUpload}
 onDelete={onDelete}
 />
 </div>
 </Card>
 );
}
