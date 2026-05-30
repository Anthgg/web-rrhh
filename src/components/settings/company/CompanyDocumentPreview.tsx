import Image from "next/image";
/* eslint-disable @next/next/no-img-element */
"use client";

import { BadgeCheck, FileText } from "lucide-react";

import type { CompanySettingsPayload } from "@/types";
import { Card } from "@/components/ui/card";
import { DEFAULT_COMPANY_TEXT_COLOR } from "@/services/companySettingsService";

interface CompanyDocumentPreviewProps {
  formData: CompanySettingsPayload;
  isConfigured: boolean;
  logoUrl?: string | null;
  signatureUrl?: string | null;
  stampUrl?: string | null;
}

function resolveColor(value: string, fallback: string) {
  return /^#([0-9A-F]{6})$/i.test(value.trim()) ? value.trim().toUpperCase() : fallback;
}

function getLineValue(value: string, placeholder: string) {
  return value.trim() || placeholder;
}

export function CompanyDocumentPreview({
  formData,
  isConfigured,
  logoUrl,
  signatureUrl,
  stampUrl,
}: CompanyDocumentPreviewProps) {
  const primaryColor = resolveColor(formData.color_primario, "#1E3A8A");
  const secondaryColor = resolveColor(formData.color_secundario, "#64748B");
  const resolvedTextColor = resolveColor(formData.color_texto, DEFAULT_COMPANY_TEXT_COLOR);

  const contactLine = [formData.correo_corporativo.trim(), formData.telefono.trim()]
    .filter(Boolean)
    .join(" | ");

  return (
    <Card className="grid gap-5 p-6 lg:sticky lg:top-6">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
            <FileText className="size-3.5" />
            Vista previa
          </div>
          <h2 className="section-title text-2xl font-semibold text-ink">Documento corporativo</h2>
          <p className="text-sm leading-6 text-ink-soft">
            Simulacion de hoja PDF con firma, sello, colores y datos legales en tiempo real.
          </p>
        </div>

        <span
          className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
          style={{
            backgroundColor: isConfigured ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.14)",
            color: isConfigured ? "#047857" : "#b45309",
          }}
        >
          <BadgeCheck className="size-3.5" />
          {isConfigured ? "Configuracion activa" : "Configuracion pendiente"}
        </span>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-100 p-3 shadow-[0_20px_40px_rgba(15,23,42,0.06)]">
        <div className="mx-auto min-h-[760px] max-w-[620px] rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_24px_48px_rgba(15,23,42,0.08)]">
          <div
            className="rounded-t-[1.5rem] px-8 py-7 text-white"
            style={{
              backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            }}
          >
            <div className="grid gap-6 sm:grid-cols-[110px_minmax(0,1fr)] sm:items-start">
              <div className="flex h-[86px] w-[110px] items-center justify-center rounded-[1.25rem] border border-white/20 bg-white/12 text-sm font-semibold text-white/80">
                {logoUrl ? (
                  <Image unoptimized width={400} height={400}
                    src={logoUrl}
                    alt="Logo corporativo"
                    className="max-h-[68px] max-w-[92px] object-contain"
                  />
                ) : (
                  "Sin logo"
                )}
              </div>

              <div className="grid gap-2">
                <h3 className="section-title text-2xl font-semibold">
                  {getLineValue(formData.razon_social, "Razon social pendiente")}
                </h3>
                <div className="grid gap-1 text-sm text-white/90">
                  <p>RUC: {getLineValue(formData.ruc, "RUC pendiente")}</p>
                  <p>{getLineValue(formData.direccion_fiscal, "Direccion fiscal pendiente")}</p>
                  <p>{contactLine || "Correo y telefono pendientes"}</p>
                  <p>{formData.pagina_web.trim() || "Pagina web pendiente"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-8 p-8">
            <div className="grid gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: primaryColor }}>
                Reporte corporativo de prueba
              </p>
              <div className="grid gap-2 text-sm leading-6" style={{ color: resolvedTextColor }}>
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

            <div className="grid gap-5">
              <div className="grid gap-2">
                <h4 className="section-title text-xl font-semibold" style={{ color: resolvedTextColor }}>
                  REPORTE CORPORATIVO DE PRUEBA
                </h4>
                <div className="grid gap-1 text-sm leading-7" style={{ color: resolvedTextColor }}>
                  <p>Trabajador: Juan Perez</p>
                  <p>Cargo: Operario</p>
                  <p>Area: Obras</p>
                  <p>Estado: Aprobado</p>
                </div>
              </div>

              <div className="h-px w-full bg-slate-200" />

              <div className="grid gap-5 md:grid-cols-2">
                <div className="grid gap-3">
                  <div className="flex h-[128px] items-center justify-center rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 text-sm text-ink-soft">
                    {signatureUrl ? (
                      <Image unoptimized width={400} height={400}
                        src={signatureUrl}
                        alt="Firma digital"
                        className="max-h-[104px] max-w-full object-contain"
                      />
                    ) : (
                      "Sin firma"
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: resolvedTextColor }}>Representante Legal</p>
                    <p className="text-xs" style={{ color: resolvedTextColor, opacity: 0.76 }}>
                      {getLineValue(formData.representante_legal, "Firma pendiente")}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="flex h-[128px] items-center justify-center rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 text-sm text-ink-soft">
                    {stampUrl ? (
                      <Image unoptimized width={400} height={400}
                        src={stampUrl}
                        alt="Sello institucional"
                        className="max-h-[104px] max-w-full object-contain"
                      />
                    ) : (
                      "Sin sello"
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: resolvedTextColor }}>Sello Institucional</p>
                    <p className="text-xs" style={{ color: resolvedTextColor, opacity: 0.76 }}>
                      Uso para constancias y reportes oficiales
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px w-full bg-slate-200" />

            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="grid gap-2">
                <p className="text-sm font-semibold" style={{ color: resolvedTextColor }}>Resumen visual aplicado</p>
                <p className="text-xs leading-6" style={{ color: resolvedTextColor, opacity: 0.76 }}>
                  Los encabezados, etiquetas y elementos destacados usan la combinacion cromatica definida en la marca corporativa.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className="size-10 rounded-2xl border border-white shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                />
                <div
                  className="size-10 rounded-2xl border border-white shadow-sm"
                  style={{ backgroundColor: secondaryColor }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
