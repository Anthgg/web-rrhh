"use client";

import { Palette } from "lucide-react";

import type { CompanySettingsFormErrors } from "@/hooks/useCompanySettings";
import {
 DEFAULT_COMPANY_PRIMARY_COLOR,
 DEFAULT_COMPANY_SECONDARY_COLOR,
 DEFAULT_COMPANY_TEXT_COLOR,
} from "@/services/companySettingsService";
import type { CompanySettingsPayload } from "@/types";
import { Card } from "@/components/ui/card";
import { FieldFrame, Input } from "@/components/ui/fields";

interface CompanyBrandingFormProps {
 formData: CompanySettingsPayload;
 onFieldChange: <K extends keyof CompanySettingsPayload>(
 field: K,
 value: CompanySettingsPayload[K],
 ) => void;
 validationErrors: CompanySettingsFormErrors;
}

function resolveColor(value: string, fallback: string) {
 return /^#([0-9A-F]{6})$/i.test(value.trim()) ? value.trim().toUpperCase() : fallback;
}

export function CompanyBrandingForm({
 formData,
 onFieldChange,
 validationErrors,
}: CompanyBrandingFormProps) {
 const primaryColor = resolveColor(formData.color_primario, DEFAULT_COMPANY_PRIMARY_COLOR);
 const secondaryColor = resolveColor(formData.color_secundario, DEFAULT_COMPANY_SECONDARY_COLOR);
 const typographyColor = resolveColor(formData.color_texto, DEFAULT_COMPANY_TEXT_COLOR);

 return (
 <Card className="grid gap-6 p-6">
 <div className="grid gap-2">
 <div className="inline-flex w-fit items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">
 <Palette className="size-3.5" />
 Marca corporativa
 </div>
 <div className="grid gap-1">
 <h2 className="section-title text-2xl font-semibold text-foreground">Paleta institucional</h2>
 <p className="max-w-3xl text-sm leading-6 text-foreground-soft">
 Ajusta los colores de reportes y documentos oficiales. La vista previa se actualiza al instante.
 </p>
 </div>
 </div>

 <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
 <div className="grid gap-4">
 <FieldFrame
 label="Color primario"
 hint="HEX sincronizado con selector visual."
 error={validationErrors.color_primario}
 >
 <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
 <input
 aria-label="Selector visual de color primario"
 type="color"
 value={primaryColor}
 onChange={(event) => onFieldChange("color_primario", event.target.value.toUpperCase())}
 className="h-12 w-full cursor-pointer rounded-2xl border border-border bg-card p-1 sm:w-16"
 />
 <Input
 value={formData.color_primario}
 onChange={(event) => onFieldChange("color_primario", event.target.value.toUpperCase())}
 placeholder="#1E3A8A"
 />
 </div>
 </FieldFrame>

 <FieldFrame
 label="Color secundario"
 hint="HEX sincronizado con selector visual."
 error={validationErrors.color_secundario}
 >
 <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
 <input
 aria-label="Selector visual de color secundario"
 type="color"
 value={secondaryColor}
 onChange={(event) => onFieldChange("color_secundario", event.target.value.toUpperCase())}
 className="h-12 w-full cursor-pointer rounded-2xl border border-border bg-card p-1 sm:w-16"
 />
 <Input
 value={formData.color_secundario}
 onChange={(event) => onFieldChange("color_secundario", event.target.value.toUpperCase())}
 placeholder="#64748B"
 />
 </div>
 </FieldFrame>

 <FieldFrame
 label="Color de letras"
 hint="Aplica a la vista previa del documento en pantalla."
 error={validationErrors.color_texto}
 >
 <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
 <input
 aria-label="Selector visual de color de letras"
 type="color"
 value={typographyColor}
 onChange={(event) => onFieldChange("color_texto", event.target.value.toUpperCase())}
 className="h-12 w-full cursor-pointer rounded-2xl border border-border bg-card p-1 sm:w-16"
 />
 <Input
 value={formData.color_texto}
 onChange={(event) => onFieldChange("color_texto", event.target.value.toUpperCase())}
 placeholder="#0F172A"
 />
 </div>
 </FieldFrame>
 </div>

 <div className="grid gap-4 rounded-[1.75rem] border border-border bg-[linear-gradient(135deg,rgba(248,250,252,0.92),rgba(255,255,255,0.98))] p-5 shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
 <div
 className="relative overflow-hidden rounded-[1.5rem] border border-white/70 p-5 text-white"
 style={{
 backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
 }}
 >
 <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.26),transparent_34%)]" />
 <div className="relative grid gap-4">
 <div>
 <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/75">
 Vista rapida
 </p>
 <h3 className="section-title mt-2 text-2xl font-semibold">Identidad SaaS</h3>
 </div>
 <p className="max-w-xs text-sm leading-6 text-white/85">
 Estos tonos se aplican a encabezados, sellos visuales y elementos destacados del documento.
 </p>
 </div>
 </div>

 <div className="grid gap-3 sm:grid-cols-2">
 <div className="rounded-[1.5rem] border border-border bg-card p-4">
 <div className="mb-3 h-10 rounded-2xl" style={{ backgroundColor: primaryColor }} />
 <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground-soft">Primario</p>
 <p className="mt-1 font-mono text-sm font-semibold text-foreground">{primaryColor}</p>
 </div>
 <div className="rounded-[1.5rem] border border-border bg-card p-4">
 <div className="mb-3 h-10 rounded-2xl" style={{ backgroundColor: secondaryColor }} />
 <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground-soft">Secundario</p>
 <p className="mt-1 font-mono text-sm font-semibold text-foreground">{secondaryColor}</p>
 </div>
 </div>

 <div className="rounded-[1.5rem] border border-border bg-card p-4">
 <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground-soft">Tipografia</p>
 <p className="mt-3 text-lg font-semibold" style={{ color: typographyColor }}>
 Documento corporativo premium
 </p>
 <p className="mt-2 text-sm leading-6" style={{ color: typographyColor }}>
 Usa este control para afinar el color principal de lectura en la vista previa del documento.
 </p>
 <p className="mt-3 font-mono text-sm font-semibold" style={{ color: typographyColor }}>
 {typographyColor}
 </p>
 </div>
 </div>
 </div>
 </Card>
 );
}
