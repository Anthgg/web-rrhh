"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { BadgeCheck, ClipboardList, FileText, ScrollText } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { DEFAULT_COMPANY_TEXT_COLOR } from "@/services/companySettingsService";
import type { CompanySettingsPayload } from "@/types";

type PreviewMode = "report" | "certificate" | "request";

interface CorporatePreviewProps {
 className?: string;
 compact?: boolean;
 formData: CompanySettingsPayload;
 isConfigured: boolean;
 logoUrl?: string | null;
 signatureUrl?: string | null;
 stampUrl?: string | null;
}

const previewModes: Array<{
 id: PreviewMode;
 label: string;
 icon: LucideIcon;
}> = [
 { id: "report", label: "Vista reporte", icon: FileText },
 { id: "certificate", label: "Vista constancia", icon: ScrollText },
 { id: "request", label: "Vista solicitud", icon: ClipboardList },
];

function resolveColor(value: string, fallback: string) {
 return /^#([0-9A-F]{6})$/i.test(value.trim()) ? value.trim().toUpperCase() : fallback;
}

function getLineValue(value: string, placeholder: string) {
 return value.trim() || placeholder;
}

function getPreviewCopy(mode: PreviewMode) {
 if (mode === "certificate") {
 return {
 eyebrow: "Constancia laboral",
 title: "CONSTANCIA DE TRABAJO",
 intro:
 "Por medio del presente documento se deja constancia de la vinculacion laboral registrada en el sistema de RR.HH.",
 rows: [
 ["Trabajador", "Juan Perez Alvarez"],
 ["Cargo", "Analista de Recursos Humanos"],
 ["Periodo", "01/01/2026 - Actualidad"],
 ["Estado", "Activo"],
 ],
 };
 }

 if (mode === "request") {
 return {
 eyebrow: "Solicitud interna",
 title: "SOLICITUD DE PERMISO",
 intro:
 "Documento de referencia para solicitudes aprobadas, observadas o rechazadas dentro del flujo administrativo.",
 rows: [
 ["Solicitante", "Maria Torres"],
 ["Area", "Operaciones"],
 ["Tipo", "Permiso personal"],
 ["Estado", "Aprobado"],
 ],
 };
 }

 return {
 eyebrow: "Reporte corporativo",
 title: "REPORTE DE ASISTENCIA",
 intro:
 "Resumen corporativo generado desde el sistema administrativo para control interno y descarga documentaria.",
 rows: [
 ["Trabajador", "Juan Perez Alvarez"],
 ["Cargo", "Supervisor de obra"],
 ["Area", "Operaciones"],
 ["Estado", "Aprobado"],
 ],
 };
}

export function CorporatePreview({
 className,
 compact = false,
 formData,
 isConfigured,
 logoUrl,
 signatureUrl,
 stampUrl,
}: CorporatePreviewProps) {
 const [previewMode, setPreviewMode] = useState<PreviewMode>("report");
 const primaryColor = resolveColor(formData.color_primario, "#1E3A8A");
 const secondaryColor = resolveColor(formData.color_secundario, "#64748B");
 const textColor = resolveColor(formData.color_texto, DEFAULT_COMPANY_TEXT_COLOR);
 const copy = useMemo(() => getPreviewCopy(previewMode), [previewMode]);

 const contactLine = [formData.correo_corporativo.trim(), formData.telefono.trim()]
 .filter(Boolean)
 .join(" | ");

 return (
 <Card className={cn("grid gap-4 rounded-lg border-border bg-card p-4 shadow-sm", className)}>
 <div className="grid gap-3">
 <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
 <div className="grid gap-1">
 <span className="inline-flex w-fit items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
 <FileText className="size-3.5" />
 Vista previa
 </span>
 <h2 className="section-title text-xl font-semibold text-foreground">Documento corporativo</h2>
 <p className="text-sm leading-6 text-foreground-soft">
 Hoja A4 simulada con marca, datos legales, firma y sello en tiempo real.
 </p>
 </div>

 <span
 className={cn(
 "inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
 isConfigured ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
 )}
 >
 <BadgeCheck className="size-3.5" />
 {isConfigured ? "Registro activo" : "Pendiente"}
 </span>
 </div>

 <div className="grid gap-2 sm:grid-cols-3">
 {previewModes.map((mode) => {
 const Icon = mode.icon;
 const isActive = previewMode === mode.id;

 return (
 <button
 key={mode.id}
 type="button"
 onClick={() => setPreviewMode(mode.id)}
 className={cn(
 "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition",
 isActive
 ? "border-slate-900 bg-foreground text-white"
 : "border-border bg-card text-muted-foreground hover:border-slate-300 hover:bg-muted",
 )}
 >
 <Icon className="size-4" />
 <span className="truncate">{mode.label}</span>
 </button>
 );
 })}
 </div>
 </div>

 <div className="overflow-auto rounded-lg border border-border bg-muted p-3">
 <div
 className={cn(
 "mx-auto grid w-full max-w-[620px] overflow-hidden rounded-lg border border-border bg-card shadow-md",
 compact ? "min-h-[640px]" : "min-h-[760px]",
 )}
 >
 <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-4 border-b border-border px-6 py-5">
 <div className="flex size-20 items-center justify-center rounded-lg border border-border bg-muted text-center text-xs font-semibold text-muted-foreground">
 {logoUrl ? (
 <Image unoptimized width={400} height={400} src={logoUrl} alt="Logo corporativo" className="max-h-16 max-w-16 object-contain" />
 ) : (
 "Sin logo"
 )}
 </div>

 <div className="min-w-0">
 <h3 className="truncate text-lg font-bold" style={{ color: textColor }}>
 {getLineValue(formData.razon_social, "Razon social pendiente")}
 </h3>
 <div className="mt-2 grid gap-1 text-xs leading-5" style={{ color: textColor, opacity: 0.78 }}>
 <p>RUC: {getLineValue(formData.ruc, "RUC pendiente")}</p>
 <p className="truncate">{getLineValue(formData.direccion_fiscal, "Direccion fiscal pendiente")}</p>
 <p className="truncate">{contactLine || "Correo y telefono pendientes"}</p>
 <p className="truncate">{formData.pagina_web.trim() || "Pagina web pendiente"}</p>
 </div>
 </div>
 </div>

 <div className="h-2" style={{ backgroundColor: primaryColor }} />
 <div className="h-1" style={{ backgroundColor: secondaryColor }} />

 <div className="grid gap-6 px-6 py-7">
 <div className="grid gap-3 rounded-lg border border-border bg-muted p-4">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <span
 className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-white"
 style={{ backgroundColor: primaryColor }}
 >
 {copy.eyebrow}
 </span>
 <span className="text-xs font-semibold" style={{ color: secondaryColor }}>
 Documento interno
 </span>
 </div>

 <div className="grid gap-1 text-sm leading-6" style={{ color: textColor }}>
 <p>
 <span className="font-semibold">Nombre comercial:</span>{" "}
 {getLineValue(formData.nombre_comercial, "Nombre comercial pendiente")}
 </p>
 <p>
 <span className="font-semibold">Representante legal:</span>{" "}
 {getLineValue(formData.representante_legal, "Representante legal pendiente")}
 </p>
 </div>
 </div>

 <section className="grid gap-4">
 <div className="grid gap-2">
 <h4 className="text-lg font-bold" style={{ color: textColor }}>
 {copy.title}
 </h4>
 <p className="text-sm leading-6" style={{ color: textColor, opacity: 0.78 }}>
 {copy.intro}
 </p>
 </div>

 <div className="overflow-hidden rounded-lg border border-border">
 {copy.rows.map(([label, value], index) => (
 <div
 key={label}
 className={cn(
 "grid grid-cols-[120px_minmax(0,1fr)] gap-3 px-4 py-3 text-sm",
 index % 2 === 0 ? "bg-card" : "bg-muted",
 )}
 >
 <span className="font-semibold" style={{ color: textColor }}>
 {label}
 </span>
 <span className="min-w-0 truncate" style={{ color: textColor, opacity: 0.78 }}>
 {value}
 </span>
 </div>
 ))}
 </div>

 <div className="grid gap-2 rounded-lg border border-border bg-card p-4">
 <div className="h-2 w-24 rounded-full" style={{ backgroundColor: primaryColor }} />
 <p className="text-sm leading-6" style={{ color: textColor, opacity: 0.78 }}>
 Este bloque representa contenido de ejemplo para reportes PDF, Excel y formatos internos generados por la plataforma.
 </p>
 </div>
 </section>

 <div className="mt-auto grid gap-5 border-t border-border pt-5 sm:grid-cols-2">
 <div className="grid gap-3">
 <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-muted text-sm text-muted-foreground">
 {signatureUrl ? (
 <Image unoptimized width={400} height={400} src={signatureUrl} alt="Firma digital" className="max-h-20 max-w-full object-contain" />
 ) : (
 "Sin firma"
 )}
 </div>
 <div>
 <p className="text-sm font-semibold" style={{ color: textColor }}>
 Representante legal
 </p>
 <p className="text-xs" style={{ color: textColor, opacity: 0.68 }}>
 {getLineValue(formData.representante_legal, "Firma pendiente")}
 </p>
 </div>
 </div>

 <div className="grid gap-3">
 <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-muted text-sm text-muted-foreground">
 {stampUrl ? (
 <Image unoptimized width={400} height={400} src={stampUrl} alt="Sello institucional" className="max-h-20 max-w-full object-contain" />
 ) : (
 "Sin sello"
 )}
 </div>
 <div>
 <p className="text-sm font-semibold" style={{ color: textColor }}>
 Sello institucional
 </p>
 <p className="text-xs" style={{ color: textColor, opacity: 0.68 }}>
 Validacion de documentos oficiales
 </p>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </Card>
 );
}
