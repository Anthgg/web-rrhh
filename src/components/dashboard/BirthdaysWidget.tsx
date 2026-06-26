"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Cake, ChevronRight, PartyPopper } from "lucide-react";

import { Panel, SectionHeading } from "@/components/dashboard/primitives";
import { tone } from "@/components/dashboard/_tokens";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useSession } from "@/features/auth/auth-provider";
import { buildMockBirthdayWorkers } from "@/lib/mocks/birthdays";
import { cn } from "@/lib/utils/cn";
import type { BirthdayWorker } from "@/types";

import {
  filterBirthdaysByDay,
  filterBirthdaysByMonth,
  getRelativeBirthdayLabel,
  matchesCurrentUser,
  sortBirthdaysByNearest,
} from "@/components/dashboard/birthdays/birthdayUtils";

/**
 * Widget compacto de cumpleaños para el dashboard: hoy / este mes + tres
 * próximos. La vista completa (calendario, filtros, lista) vive en
 * /dashboard/birthdays para no saturar la operación diaria.
 */
export function BirthdaysWidget({ birthdays }: { birthdays: BirthdayWorker[] }) {
  const { user } = useSession();

  const directory = useMemo(() => {
    const apiDirectory = birthdays.filter((worker) => Boolean(worker?.birthday));
    return apiDirectory.length > 0 ? apiDirectory : buildMockBirthdayWorkers(user);
  }, [birthdays, user]);

  const upcoming = useMemo(
    () => sortBirthdaysByNearest(directory.filter((worker) => !matchesCurrentUser(worker, user))).slice(0, 3),
    [directory, user],
  );

  const today = filterBirthdaysByDay(directory, new Date()).length;
  const thisMonth = filterBirthdaysByMonth(directory, new Date().getMonth()).length;

  return (
    <Panel className="grid h-full content-start gap-4">
      <SectionHeading
        title="Cumpleaños del equipo"
        subtitle="Celebraciones próximas del personal"
        icon={Cake}
        iconTone="info"
      />

      <div className="grid grid-cols-2 gap-2.5">
        <div className={cn("rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3")}>
          <p className="section-title text-2xl font-semibold tabular-nums text-foreground">{today}</p>
          <p className="text-xs font-medium text-muted-foreground">Hoy</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-3">
          <p className="section-title text-2xl font-semibold tabular-nums text-foreground">{thisMonth}</p>
          <p className="text-xs font-medium text-muted-foreground">Este mes</p>
        </div>
      </div>

      <div className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Próximos</p>
        {upcoming.length === 0 ? (
          <div className="grid place-items-center gap-1.5 rounded-xl border border-dashed border-border bg-background px-4 py-6 text-center">
            <PartyPopper className="size-6 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Sin cumpleaños próximos registrados.</p>
          </div>
        ) : (
          upcoming.map((worker) => (
            <div
              key={`${worker.id}-${worker.birthday}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-background p-2.5"
            >
              <UserAvatar src={worker.avatarUrl} fullName={worker.fullName} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{worker.fullName}</p>
                <p className="truncate text-xs text-muted-foreground">{worker.role}</p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  worker.isToday ? tone.present.soft : "bg-muted text-muted-foreground",
                )}
              >
                {getRelativeBirthdayLabel(worker.daysUntilBirthday)}
              </span>
            </div>
          ))
        )}
      </div>

      <Link
        href="/dashboard/birthdays"
        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
      >
        Ver calendario completo
        <ChevronRight className="size-4" />
      </Link>
    </Panel>
  );
}
