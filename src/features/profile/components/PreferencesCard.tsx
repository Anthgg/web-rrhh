"use client";

import { Card } from "@/components/ui/card";
import { Settings, Info } from "lucide-react";

export function PreferencesCard() {
 const currentPreferences = [
 { label: "Idioma Predeterminado", value: "Español (ES-PE)" },
 { label: "Zona Horaria", value: "Lima, Perú (UTC-5)" },
 { label: "Formato de Hora", value: "24 horas (HH:MM)" },
 { label: "Tema del Sistema", value: "Modo Claro (Fondo Blanco)" },
 { label: "Notificaciones Push", value: "Activado (Alertas críticas)" },
 ];

 return (
 <Card className="p-6 bg-card border border-border rounded-2xl shadow-sm grid gap-5">
 <div className="flex items-center justify-between gap-3 flex-wrap">
 <div className="flex items-center gap-2">
 <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
 <Settings className="size-4" />
 </div>
 <div>
 <h2 className="text-lg font-bold text-foreground">Preferencias del Sistema</h2>
 <p className="text-xs text-muted-foreground mt-0.5">Configuración básica de visualización y notificaciones.</p>
 </div>
 </div>

 <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
 Pendiente de integración
 </span>
 </div>

 <div className="grid gap-3 rounded-2xl bg-muted p-4 text-sm opacity-75">
 {currentPreferences.map((pref, idx) => (
 <div key={pref.label} className="flex items-center justify-between gap-3 border-b border-border last:border-0 pb-2 last:pb-0">
 <span className="text-muted-foreground font-medium">{pref.label}</span>
 <span className="font-semibold text-foreground text-right">{pref.value}</span>
 </div>
 ))}
 </div>

 <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted border border-border rounded-xl p-3">
 <Info className="size-4 shrink-0 text-indigo-500" />
 <p>
 El guardado y edición de preferencias del sistema se encuentra pendiente de integración con el backend.
 </p>
 </div>
 </Card>
 );
}
