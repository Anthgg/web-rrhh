"use client";

import { Palette, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ColorPickerInput } from "@/components/settings/company/ColorPickerInput";
import type { CompanySettingsFormErrors } from "@/hooks/useCompanySettings";
import {
  DEFAULT_COMPANY_PRIMARY_COLOR,
  DEFAULT_COMPANY_SECONDARY_COLOR,
  DEFAULT_COMPANY_TEXT_COLOR,
} from "@/services/companySettingsService";
import type { CompanySettingsPayload } from "@/types";

interface BrandPaletteFormProps {
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

export function BrandPaletteForm({
  formData,
  onFieldChange,
  validationErrors,
}: BrandPaletteFormProps) {
  const primaryColor = resolveColor(formData.color_primario, DEFAULT_COMPANY_PRIMARY_COLOR);
  const secondaryColor = resolveColor(formData.color_secundario, DEFAULT_COMPANY_SECONDARY_COLOR);
  const textColor = resolveColor(formData.color_texto, DEFAULT_COMPANY_TEXT_COLOR);

  function restoreDefaults() {
    onFieldChange("color_primario", DEFAULT_COMPANY_PRIMARY_COLOR);
    onFieldChange("color_secundario", DEFAULT_COMPANY_SECONDARY_COLOR);
    onFieldChange("color_texto", DEFAULT_COMPANY_TEXT_COLOR);
  }

  return (
    <Card className="grid gap-6 rounded-lg border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="grid gap-2">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">
            <Palette className="size-3.5" />
            Marca corporativa
          </span>
          <div className="grid gap-1">
            <h2 className="section-title text-xl font-semibold text-ink">
              Paleta institucional
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-ink-soft">
              Colores aplicados a encabezados, elementos destacados y lectura principal de documentos.
            </p>
          </div>
        </div>

        <Button variant="secondary" className="whitespace-nowrap rounded-lg" onClick={restoreDefaults}>
          <RotateCcw className="mr-2 size-4" />
          Restaurar colores
        </Button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)]">
        <div className="grid gap-4">
          <ColorPickerInput
            label="Color primario"
            hint="Formato HEX. Ejemplo: #1E3A8A."
            value={formData.color_primario}
            error={validationErrors.color_primario}
            onChange={(value) => onFieldChange("color_primario", value)}
          />

          <ColorPickerInput
            label="Color secundario"
            hint="Formato HEX. Ejemplo: #64748B."
            value={formData.color_secundario}
            error={validationErrors.color_secundario}
            onChange={(value) => onFieldChange("color_secundario", value)}
          />

          <ColorPickerInput
            label="Color de texto"
            hint="Formato HEX. Ejemplo: #0F172A."
            value={formData.color_texto}
            error={validationErrors.color_texto}
            onChange={(value) => onFieldChange("color_texto", value)}
          />
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="px-5 py-4 text-white" style={{ backgroundColor: primaryColor }}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/80">
                    Vista rapida
                  </p>
                  <h3 className="mt-1 text-lg font-semibold">Documento corporativo</h3>
                </div>
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ backgroundColor: secondaryColor, color: "#FFFFFF" }}
                >
                  Activo
                </span>
              </div>
            </div>

            <div className="grid gap-4 p-5">
              <div className="grid gap-2">
                <p className="text-sm font-semibold" style={{ color: textColor }}>
                  Reporte de asistencia
                </p>
                <p className="text-sm leading-6" style={{ color: textColor, opacity: 0.76 }}>
                  Ejemplo de contenido con jerarquia visual y datos institucionales aplicados.
                </p>
              </div>

              <div className="h-px w-full bg-slate-200" />

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  Accion principal
                </button>
                <span
                  className="rounded-lg border px-3 py-2 text-sm font-medium"
                  style={{ borderColor: secondaryColor, color: secondaryColor }}
                >
                  Estado interno
                </span>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  ["Primario", primaryColor],
                  ["Secundario", secondaryColor],
                  ["Texto", textColor],
                ].map(([label, color]) => (
                  <div key={label} className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="mb-2 h-8 rounded-md" style={{ backgroundColor: color }} />
                    <p className="text-xs font-semibold text-ink-soft">{label}</p>
                    <p className="font-mono text-xs font-semibold text-ink">{color}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
