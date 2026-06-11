"use client";

import { Settings, Info, Sun, Moon, Laptop, Eye, HelpCircle } from "lucide-react";
import { ProfileSectionCard } from "./ProfileSectionCard";
import { usePreferences } from "@/providers/preferences-provider";

export function ProfilePreferencesTab() {
 const { theme, density, accentColor: accent, setTheme, setDensity, setAccentColor: setAccent } = usePreferences();

 const colors = [
 { id: "green", name: "Verde FABRYOR", class: "bg-emerald-600 border-emerald-500" },
 { id: "blue", name: "Azul Corporativo", class: "bg-indigo-600 border-indigo-500" },
 { id: "purple", name: "Morado", class: "bg-purple-600 border-purple-500" },
 { id: "gray", name: "Gris Oscuro", class: "bg-slate-600 border-slate-500" },
 ] as const;

 const currentPreferences = [
 { label: "Idioma Predeterminado", value: "Español (ES-PE)" },
 { label: "Zona Horaria", value: "Lima, Perú (UTC-5)" },
 { label: "Formato de Hora", value: "24 horas (HH:MM)" },
 { label: "Formato de Fecha", value: "DD/MM/AAAA" },
 { label: "Notificaciones", value: "Sólo alertas críticas" },
 ];

 return (
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full items-start">
 {/* Left Column: Visual settings (2/3 width) */}
 <div className="lg:col-span-2 flex flex-col gap-6 w-full">
 <ProfileSectionCard
 title="Apariencia y Visualización"
 description="Ajusta los temas y densidad para personalizar la interfaz en este dispositivo."
 icon={<Eye className="size-5" />}
 badge={
 <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
 Sincronizado
 </span>
 }
 >
 {/* Theme Selector */}
 <div className="grid gap-3">
 <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tema de la interfaz</span>
 <div className="grid grid-cols-3 gap-3">
 {[
 { id: "light", label: "Claro", icon: <Sun className="size-4" /> },
 { id: "dark", label: "Oscuro", icon: <Moon className="size-4" /> },
 { id: "system", label: "Sistema", icon: <Laptop className="size-4" /> },
 ].map((t) => (
 <button
 key={t.id}
 onClick={() => setTheme(t.id as any)}
 className={`flex flex-col sm:flex-row items-center justify-center gap-2 p-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${
 theme === t.id
 ? "border-primary bg-primary/10 text-primary font-bold"
 : "border-border text-muted-foreground hover:bg-muted"
 }`}
 >
 {t.icon}
 <span>{t.label}</span>
 </button>
 ))}
 </div>
 </div>

 {/* Density Selector */}
 <div className="grid gap-3 border-t border-border pt-4">
 <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Densidad de interfaz</span>
 <div className="grid grid-cols-2 gap-3">
 {[
 { id: "comfortable", label: "Cómoda (Predeterminada)", desc: "Más espaciado visual" },
 { id: "compact", label: "Compacta", desc: "Maximiza información visible" },
 ].map((d) => (
 <button
 key={d.id}
 onClick={() => setDensity(d.id as any)}
 className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all ${
 density === d.id
 ? "border-primary bg-primary/10 text-primary"
 : "border-border text-muted-foreground hover:bg-muted"
 }`}
 >
 <span className="text-xs sm:text-sm font-semibold">{d.label}</span>
 <span className="text-[10px] text-muted-foreground/80 font-medium">{d.desc}</span>
 </button>
 ))}
 </div>
 </div>

 {/* Color Accent Selector */}
 <div className="grid gap-3 border-t border-border pt-4">
 <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Color de Acento</span>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
 {colors.map((c) => (
 <button
 key={c.id}
 onClick={() => setAccent(c.id as any)}
 className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
 accent === c.id
 ? "border-primary bg-primary/10 text-primary"
 : "border-border text-muted-foreground hover:bg-muted"
 }`}
 >
 <div className={`size-3.5 rounded-full ${c.class} border shadow-inner`} />
 <span className="text-xs sm:text-sm font-semibold truncate">{c.name}</span>
 </button>
 ))}
 </div>
 </div>

 <div className="flex items-start gap-2.5 text-xs text-muted-foreground bg-muted border border-border rounded-xl p-3.5">
 <Info className="size-4 shrink-0 text-primary mt-0.5" />
 <p>
 La visualización de cambios se guarda automáticamente en tu sesión y de forma global en tu cuenta (si el backend lo soporta).
 </p>
 </div>
 </ProfileSectionCard>
 </div>

 {/* Right Column: System preferences (1/3 width) */}
 <div className="flex flex-col gap-6 w-full">
 <ProfileSectionCard
 title="Preferencias de Sistema"
 description="Parámetros de configuración regional."
 icon={<Settings className="size-5" />}
 >
 <div className="grid gap-3 rounded-2xl bg-muted p-4 text-xs sm:text-sm">
 {currentPreferences.map((pref, idx) => (
 <div key={pref.label} className="flex items-center justify-between gap-3 border-b border-border last:border-0 pb-2 last:pb-0">
 <span className="text-muted-foreground font-semibold">{pref.label}</span>
 <span className="font-bold text-foreground text-right">{pref.value}</span>
 </div>
 ))}
 </div>

 <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2 text-amber-600 dark:text-amber-500">
 <HelpCircle className="size-4 shrink-0 mt-0.5" />
 <div className="flex flex-col gap-0.5">
 <span className="text-xs font-bold">Sincronización RR.HH.</span>
 <span className="text-[11px] opacity-80">La zona horaria e idioma se configuran a nivel del contrato laboral.</span>
 </div>
 </div>
 </ProfileSectionCard>
 </div>
 </div>
 );
}
