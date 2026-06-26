import type { LucideIcon } from "lucide-react";
import { Info } from "lucide-react";

import { cardSurface, rise, tone, type SemanticTone } from "@/components/dashboard/_tokens";
import { cn } from "@/lib/utils/cn";

export interface MetricCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: SemanticTone;
  /** Texto comparativo opcional, p. ej. "+2 vs ayer" o "Sin cambios". */
  hint?: string;
  /** Marca el valor como estimado y muestra un tooltip explicativo. */
  estimatedNote?: string;
  style?: React.CSSProperties;
}

/**
 * Tarjeta KPI compacta. Una regla de acento a la izquierda codifica la
 * categoría semántica del dato (verde asistencia, ámbar tardanza, etc.).
 */
export function MetricCard({
  label,
  value,
  icon: Icon,
  tone: cardTone = "neutral",
  hint,
  estimatedNote,
  style,
}: MetricCardProps) {
  return (
    <article
      style={style}
      className={cn(cardSurface, rise, "relative flex items-center gap-4 overflow-hidden p-4")}
    >
      {/* Regla de acento semántica */}
      <span aria-hidden className={cn("absolute inset-y-0 left-0 w-1", tone[cardTone].bar)} />

      <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl", tone[cardTone].icon)}>
        <Icon className="size-5" />
      </span>

      <div className="min-w-0 grid gap-0.5">
        <div className="flex items-baseline gap-2">
          <strong className="section-title text-2xl font-semibold tabular-nums text-foreground">
            {value}
          </strong>
          {hint ? <span className="text-xs font-medium text-muted-foreground">{hint}</span> : null}
        </div>
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          {label}
          {estimatedNote ? (
            <span className="group/inf relative inline-flex">
              <Info className="size-3.5 text-muted-foreground/60" />
              <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 w-48 -translate-x-1/2 rounded-lg bg-popover px-2.5 py-1.5 text-center text-[11px] font-medium text-popover-foreground opacity-0 shadow-lg ring-1 ring-border transition-opacity group-hover/inf:opacity-100">
                {estimatedNote}
              </span>
            </span>
          ) : null}
        </span>
      </div>
    </article>
  );
}
