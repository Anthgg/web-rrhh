"use client";

import { useState } from "react";
import { Building2, LoaderCircle, Save } from "lucide-react";

import type { CompanySettingsFormErrors } from "@/hooks/useCompanySettings";
import type { CompanySettingsPayload } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldFrame, Input } from "@/components/ui/fields";

interface CompanyLegalFormProps {
 canSave: boolean;
 formData: CompanySettingsPayload;
 isConfigured: boolean;
 isDirty: boolean;
 isSaving: boolean;
 onFieldChange: <K extends keyof CompanySettingsPayload>(
 field: K,
 value: CompanySettingsPayload[K],
 ) => void;
 onSave: () => void;
 validationErrors: CompanySettingsFormErrors;
}

export function CompanyLegalForm({
 canSave,
 formData,
 isConfigured,
 isDirty,
 isSaving,
 onFieldChange,
 onSave,
 validationErrors,
}: CompanyLegalFormProps) {
 const [touchedFields, setTouchedFields] = useState<Partial<Record<keyof CompanySettingsPayload, boolean>>>({});

 function markFieldTouched(field: keyof CompanySettingsPayload) {
 setTouchedFields((current) => ({
 ...current,
 [field]: true,
 }));
 }

 const razonSocialError = touchedFields.razon_social ? validationErrors.razon_social : undefined;
 const rucError = touchedFields.ruc ? validationErrors.ruc : undefined;
 const telefonoError = touchedFields.telefono ? validationErrors.telefono : undefined;
 const correoError = touchedFields.correo_corporativo ? validationErrors.correo_corporativo : undefined;
 const paginaWebError = touchedFields.pagina_web ? validationErrors.pagina_web : undefined;

 return (
 <Card className="grid gap-6 p-6">
 <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
 <div className="grid gap-2">
 <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
 <Building2 className="size-3.5" />
 Informacion legal
 </div>
 <div className="grid gap-1">
 <h2 className="section-title text-2xl font-semibold text-foreground">Base legal de la empresa</h2>
 <p className="max-w-3xl text-sm leading-6 text-foreground-soft">
 Estos datos alimentan reportes PDF, Excel, constancias y documentos internos con identidad corporativa vigente.
 </p>
 </div>
 </div>

 <div className="flex shrink-0 items-center gap-3">
 <Button onClick={onSave} disabled={!canSave}>
 {isSaving ? (
 <LoaderCircle className="mr-2 size-4 animate-spin" />
 ) : (
 <Save className="mr-2 size-4" />
 )}
 {isConfigured ? "Guardar cambios" : "Crear configuracion"}
 </Button>
 </div>
 </div>

 <div className="grid gap-4 md:grid-cols-2">
 <FieldFrame
 label="Razon social"
 hint="Obligatorio. Minimo 3 caracteres."
 error={razonSocialError}
 >
 <Input
 value={formData.razon_social}
 onChange={(event) => onFieldChange("razon_social", event.target.value)}
 onBlur={() => markFieldTouched("razon_social")}
 placeholder="FABRYOR SERVICIOS GENERALES S.A.C."
 />
 </FieldFrame>

 <FieldFrame
 label="RUC"
 hint="Obligatorio. Exactamente 11 digitos."
 error={rucError}
 >
 <Input
 value={formData.ruc}
 inputMode="numeric"
 maxLength={11}
 onChange={(event) => onFieldChange("ruc", event.target.value.replace(/\D/g, "").slice(0, 11))}
 onBlur={() => markFieldTouched("ruc")}
 placeholder="20600000000"
 />
 </FieldFrame>

 <FieldFrame label="Nombre comercial" hint="Opcional.">
 <Input
 value={formData.nombre_comercial}
 onChange={(event) => onFieldChange("nombre_comercial", event.target.value)}
 placeholder="FABRYOR"
 />
 </FieldFrame>

 <FieldFrame label="Representante legal" hint="Opcional.">
 <Input
 value={formData.representante_legal}
 onChange={(event) => onFieldChange("representante_legal", event.target.value)}
 placeholder="Carlos Ramirez Torres"
 />
 </FieldFrame>

 <FieldFrame label="Direccion fiscal" hint="Opcional.">
 <Input
 value={formData.direccion_fiscal}
 onChange={(event) => onFieldChange("direccion_fiscal", event.target.value)}
 placeholder="Av. Los Constructores 456, Lima"
 />
 </FieldFrame>

 <FieldFrame label="Telefono" hint="Opcional." error={telefonoError}>
 <Input
 value={formData.telefono}
 onChange={(event) => onFieldChange("telefono", event.target.value)}
 onBlur={() => markFieldTouched("telefono")}
 placeholder="+51 987 654 321"
 />
 </FieldFrame>

 <FieldFrame
 label="Correo corporativo"
 hint="Opcional."
 error={correoError}
 >
 <Input
 type="email"
 value={formData.correo_corporativo}
 onChange={(event) => onFieldChange("correo_corporativo", event.target.value)}
 onBlur={() => markFieldTouched("correo_corporativo")}
 placeholder="contacto@empresa.com"
 />
 </FieldFrame>

 <FieldFrame label="Pagina web" hint="Opcional." error={paginaWebError}>
 <Input
 value={formData.pagina_web}
 onChange={(event) => onFieldChange("pagina_web", event.target.value)}
 onBlur={() => markFieldTouched("pagina_web")}
 placeholder="https://empresa.com"
 />
 </FieldFrame>
 </div>

 {!isDirty ? (
 <div className="rounded-[1.5rem] border border-dashed border-border bg-muted/80 px-4 py-3 text-sm text-foreground-soft">
 No hay cambios pendientes en la informacion legal o visual.
 </div>
 ) : null}
 </Card>
 );
}
