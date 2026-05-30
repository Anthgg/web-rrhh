"use client";

import { useState } from "react";
import { Building2, Mail, Phone } from "lucide-react";

import { Card } from "@/components/ui/card";
import { FieldFrame, Input } from "@/components/ui/fields";
import type { CompanySettingsFormErrors } from "@/hooks/useCompanySettings";
import type { CompanySettingsPayload } from "@/types";

interface LegalInfoFormProps {
  formData: CompanySettingsPayload;
  onFieldChange: <K extends keyof CompanySettingsPayload>(
    field: K,
    value: CompanySettingsPayload[K],
  ) => void;
  validationErrors: CompanySettingsFormErrors;
}

type LegalField = keyof CompanySettingsPayload;

export function LegalInfoForm({
  formData,
  onFieldChange,
  validationErrors,
}: LegalInfoFormProps) {
  const [touchedFields, setTouchedFields] = useState<Partial<Record<LegalField, boolean>>>({});

  function markFieldTouched(field: LegalField) {
    setTouchedFields((current) => ({
      ...current,
      [field]: true,
    }));
  }

  function fieldError(field: LegalField) {
    return touchedFields[field] ? validationErrors[field] : undefined;
  }

  return (
    <Card className="grid gap-6 rounded-lg border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-2">
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand">
          <Building2 className="size-3.5" />
          Informacion legal
        </span>
        <div className="grid gap-1">
          <h2 className="section-title text-xl font-semibold text-ink">Datos oficiales de la empresa</h2>
          <p className="max-w-3xl text-sm leading-6 text-ink-soft">
            Datos legales y de contacto que apareceran en reportes, constancias y solicitudes internas.
          </p>
        </div>
      </div>

      <section className="grid gap-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <Building2 className="size-4 text-brand" />
          <h3 className="text-sm font-semibold text-ink">Datos principales</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FieldFrame
            label="Razon social *"
            hint="Obligatorio. Minimo 3 caracteres."
            error={fieldError("razon_social")}
          >
            <Input
              value={formData.razon_social}
              onChange={(event) => onFieldChange("razon_social", event.target.value)}
              onBlur={() => markFieldTouched("razon_social")}
              placeholder="FABRYOR SERVICIOS GENERALES S.A.C."
              className="rounded-lg"
            />
          </FieldFrame>

          <FieldFrame
            label="RUC *"
            hint="Obligatorio. Exactamente 11 digitos."
            error={fieldError("ruc")}
          >
            <Input
              value={formData.ruc}
              inputMode="numeric"
              maxLength={11}
              onChange={(event) => onFieldChange("ruc", event.target.value.replace(/\D/g, "").slice(0, 11))}
              onBlur={() => markFieldTouched("ruc")}
              placeholder="20600000000"
              className="rounded-lg"
            />
          </FieldFrame>

          <FieldFrame label="Nombre comercial" hint="Opcional.">
            <Input
              value={formData.nombre_comercial}
              onChange={(event) => onFieldChange("nombre_comercial", event.target.value)}
              placeholder="FABRYOR"
              className="rounded-lg"
            />
          </FieldFrame>

          <FieldFrame label="Representante legal" hint="Opcional.">
            <Input
              value={formData.representante_legal}
              onChange={(event) => onFieldChange("representante_legal", event.target.value)}
              placeholder="Carlos Ramirez Torres"
              className="rounded-lg"
            />
          </FieldFrame>
        </div>
      </section>

      <section className="grid gap-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <Mail className="size-4 text-brand" />
          <h3 className="text-sm font-semibold text-ink">Datos de contacto</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FieldFrame label="Direccion fiscal" hint="Opcional.">
            <Input
              value={formData.direccion_fiscal}
              onChange={(event) => onFieldChange("direccion_fiscal", event.target.value)}
              placeholder="Av. Los Constructores 456, Lima"
              className="rounded-lg"
            />
          </FieldFrame>

          <FieldFrame label="Telefono" hint="Opcional." error={fieldError("telefono")}>
            <Input
              value={formData.telefono}
              onChange={(event) => onFieldChange("telefono", event.target.value)}
              onBlur={() => markFieldTouched("telefono")}
              placeholder="+51 987 654 321"
              className="rounded-lg"
            />
          </FieldFrame>

          <FieldFrame
            label="Correo corporativo"
            hint="Opcional."
            error={fieldError("correo_corporativo")}
          >
            <Input
              type="email"
              value={formData.correo_corporativo}
              onChange={(event) => onFieldChange("correo_corporativo", event.target.value)}
              onBlur={() => markFieldTouched("correo_corporativo")}
              placeholder="contacto@empresa.com"
              className="rounded-lg"
            />
          </FieldFrame>

          <FieldFrame label="Pagina web" hint="Opcional." error={fieldError("pagina_web")}>
            <Input
              value={formData.pagina_web}
              onChange={(event) => onFieldChange("pagina_web", event.target.value)}
              onBlur={() => markFieldTouched("pagina_web")}
              placeholder="https://empresa.com"
              className="rounded-lg"
            />
          </FieldFrame>
        </div>
      </section>

      <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink-soft">
        <Phone className="mt-0.5 size-4 shrink-0 text-slate-500" />
        <p>
          Los campos marcados con * son obligatorios para activar la configuracion corporativa.
        </p>
      </div>
    </Card>
  );
}
