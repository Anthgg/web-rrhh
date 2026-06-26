import Link from "next/link";
import {
  CalendarRange,
  ClipboardCheck,
  MapPin,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

import { Panel, SectionHeading } from "@/components/dashboard/primitives";
import { Zap } from "lucide-react";

const ACTIONS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Registrar trabajador", href: "/trabajadores/alta", icon: UserPlus },
  { label: "Solicitudes pendientes", href: "/dashboard/requests/pending", icon: ClipboardCheck },
  { label: "Ver calendario", href: "/dashboard/birthdays", icon: CalendarRange },
  { label: "Alertas y ubicación", href: "/dashboard/schedule/analytics", icon: MapPin },
];

/** Atajos a las tareas operativas más frecuentes de RRHH/Admin. */
export function QuickActionsCard() {
  return (
    <Panel className="grid h-full content-start gap-4">
      <SectionHeading
        title="Acciones rápidas"
        subtitle="Tareas frecuentes a un clic"
        icon={Zap}
        iconTone="late"
      />
      <div className="grid grid-cols-2 gap-2.5">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group grid gap-2 rounded-xl border border-border bg-background p-3 transition hover:border-primary hover:shadow-sm"
            >
              <span className="grid size-9 place-items-center rounded-lg bg-muted text-foreground transition group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="size-4" />
              </span>
              <span className="text-sm font-semibold leading-tight text-foreground">{action.label}</span>
            </Link>
          );
        })}
      </div>
    </Panel>
  );
}
