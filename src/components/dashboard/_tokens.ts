/**
 * Tokens de diseño del dashboard operativo.
 *
 * Centraliza superficie, radios, sombras y el mapa de color semántico por estado
 * operativo para que KPIs, tabla, chips y notificaciones hablen el mismo idioma
 * visual. Evita estilos hardcodeados repetidos entre componentes.
 */

/** Superficie estándar de una tarjeta del dashboard. */
export const cardSurface =
  "rounded-2xl border border-border bg-card text-card-foreground shadow-[0_1px_3px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.04)]";

/** Superficie sutil para sub-bloques dentro de una tarjeta. */
export const subSurface = "rounded-xl border border-border bg-background";

/** Animación de entrada compartida (definida en globals.css). */
export const rise = "animate-[dashboard-rise_420ms_ease-out_both]";

export type SemanticTone =
  | "present"
  | "late"
  | "absent"
  | "unmarked"
  | "people"
  | "info"
  | "neutral";

/**
 * Paleta semántica por tono. Cada estado operativo tiene un color con
 * significado fijo en todo el panel:
 *  - present  → verde (asistencia)
 *  - late     → ámbar/naranja (tardanza)
 *  - absent   → rojo (falta / alerta)
 *  - unmarked → pizarra (aún sin registrar)
 *  - people   → índigo (conteos de personal)
 *  - info     → azul (informativo)
 */
export const tone: Record<
  SemanticTone,
  {
    /** Texto fuerte sobre fondo claro/oscuro. */
    text: string;
    /** Chip/badge con relleno tenue + borde. */
    soft: string;
    /** Caja de icono con relleno de acento. */
    icon: string;
    /** Color de relleno crudo para gráficos/barras (var CSS o hex). */
    fill: string;
    /** Barra/acento sólido (borde superior de KPI, segmento de pulso). */
    bar: string;
  }
> = {
  present: {
    text: "text-emerald-600 dark:text-emerald-400",
    soft: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
    icon: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    fill: "#10b981",
    bar: "bg-emerald-500",
  },
  late: {
    text: "text-amber-600 dark:text-amber-400",
    soft: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
    icon: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    fill: "#f59e0b",
    bar: "bg-amber-500",
  },
  absent: {
    text: "text-rose-600 dark:text-rose-400",
    soft: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
    icon: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    fill: "#ef4444",
    bar: "bg-rose-500",
  },
  unmarked: {
    text: "text-slate-500 dark:text-slate-400",
    soft: "bg-slate-500/10 text-slate-600 dark:text-slate-300 border border-slate-500/20",
    icon: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
    fill: "#94a3b8",
    bar: "bg-slate-400 dark:bg-slate-500",
  },
  people: {
    text: "text-indigo-600 dark:text-indigo-400",
    soft: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20",
    icon: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    fill: "#6366f1",
    bar: "bg-indigo-500",
  },
  info: {
    text: "text-sky-600 dark:text-sky-400",
    soft: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20",
    icon: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    fill: "#3b82f6",
    bar: "bg-sky-500",
  },
  neutral: {
    text: "text-foreground",
    soft: "bg-muted text-muted-foreground border border-border",
    icon: "bg-muted text-foreground",
    fill: "#64748b",
    bar: "bg-foreground/70",
  },
};

/** Prioridad de notificación → tono semántico + etiqueta. */
export const priorityTone: Record<
  "high" | "medium" | "low",
  { label: string; tone: SemanticTone }
> = {
  high: { label: "Alta", tone: "absent" },
  medium: { label: "Media", tone: "late" },
  low: { label: "Baja", tone: "info" },
};
