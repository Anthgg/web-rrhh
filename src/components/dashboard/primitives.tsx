import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { cardSurface, rise, tone, type SemanticTone } from "@/components/dashboard/_tokens";

/** Tarjeta base del dashboard: superficie + radio + sombra consistentes. */
export function Panel({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <section style={style} className={cn(cardSurface, rise, "p-5", className)}>
      {children}
    </section>
  );
}

/** Encabezado de sección reutilizable: título, subtítulo, icono y acción. */
export function SectionHeading({
  title,
  subtitle,
  icon: Icon,
  iconTone = "neutral",
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconTone?: SemanticTone;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {Icon ? (
          <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", tone[iconTone].icon)}>
            <Icon className="size-5" />
          </span>
        ) : null}
        <div className="min-w-0 grid gap-0.5">
          <h2 className="section-title text-lg font-semibold text-foreground">{title}</h2>
          {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** Chip compacto con tono semántico. */
export function Pill({
  children,
  tone: pillTone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: SemanticTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        tone[pillTone].soft,
        className,
      )}
    >
      {children}
    </span>
  );
}
