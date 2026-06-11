"use client";

import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FieldFrame, Input, Select } from "@/components/ui/fields";

export function OperationalRulesForm() {
 return (
 <section className="grid gap-5 rounded-lg border border-border bg-card p-5 shadow-sm">
 <div className="flex items-start gap-3">
 <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
 <ShieldCheck className="size-5" />
 </span>
 <div>
 <h2 className="text-base font-semibold text-foreground">Reglas operativas</h2>
 <p className="mt-1 text-sm leading-6 text-foreground-soft">
 Configuracion preparada para reglas de supervisores y cuadrillas. La persistencia requiere el endpoint real de reglas corporativas.
 </p>
 </div>
 </div>

 <div className="grid gap-4 md:grid-cols-2">
 <FieldFrame label="Rol permitido para supervisar">
 <Select value="supervisor" disabled>
 <option value="supervisor">Supervisor</option>
 </Select>
 </FieldFrame>
 <FieldFrame label="Maximo de cuadrillas por supervisor">
 <Input value="2" disabled />
 </FieldFrame>
 <FieldFrame label="Accion al exceder limite">
 <Select value="block" disabled>
 <option value="block">Bloquear asignacion</option>
 </Select>
 </FieldFrame>
 <FieldFrame label="Advertencia previa">
 <Select value="enabled" disabled>
 <option value="enabled">Mostrar advertencia</option>
 </Select>
 </FieldFrame>
 </div>

 <div className="flex justify-end border-t border-border pt-4">
 {/* TODO: integrar con endpoint real de company_rules cuando este disponible. */}
 <Button type="button" variant="secondary" disabled>
 Guardado no disponible
 </Button>
 </div>
 </section>
 );
}
