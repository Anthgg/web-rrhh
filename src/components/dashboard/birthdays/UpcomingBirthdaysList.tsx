"use client";

import Image from "next/image";
import { CalendarDays, Building2, CakeSlice } from "lucide-react";

import type { BirthdayWorker } from "@/types";

import {
 formatBirthdayDate,
 getRelativeBirthdayLabel,
 sortBirthdaysByNearest,
} from "@/components/dashboard/birthdays/birthdayUtils";
import { cn } from "@/lib/utils/cn";
import { UserAvatar } from "@/components/ui/UserAvatar";

function BirthdayAvatar({ worker }: { worker: BirthdayWorker }) {
 return (
 <UserAvatar
 src={worker.avatarUrl}
 fullName={worker.fullName}
 size="md"
 rounded="2xl"
 className="shadow-[0_12px_24px_rgba(15,23,42,0.12)]"
 />
 );
}

export function UpcomingBirthdaysList({
 workers,
 limit = 6,
}: {
 workers: BirthdayWorker[];
 limit?: number;
}) {
 const items = sortBirthdaysByNearest(workers).slice(0, limit);

 return (
 <div className="grid gap-4">
 <div className="flex items-center justify-between gap-3">
 <div className="grid gap-1">
 <h3 className="section-title text-xl font-semibold text-foreground">Próximos cumpleaños</h3>
 <p className="text-sm text-foreground-soft">Ordenados por cercanía para que RRHH y líderes se anticipen.</p>
 </div>
 <div className="rounded-2xl bg-fuchsia-100 p-3 text-fuchsia-600">
 <CakeSlice className="size-5" />
 </div>
 </div>

 {!items.length ? (
 <div className="rounded-[1.5rem] border border-dashed border-border bg-muted/80 px-4 py-6 text-sm text-foreground-soft">
 No hay cumpleaños registrados para mostrar en este momento.
 </div>
 ) : (
 <div className="grid gap-3">
 {items.map((worker) => (
 <article
 key={`${worker.id}-${worker.birthday}`}
 className={cn(
 "grid gap-3 rounded-[1.5rem] border p-4 transition",
 worker.isToday
 ? "border-amber-200 bg-[linear-gradient(135deg,rgba(255,247,237,0.95),rgba(254,242,242,0.9))] shadow-[0_18px_36px_rgba(245,158,11,0.12)]"
 : "border-border bg-card/85 hover:border-primary/25 hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)]",
 )}
 >
 <div className="flex items-start gap-3">
 <BirthdayAvatar worker={worker} />
 <div className="min-w-0 flex-1">
 <div className="flex flex-wrap items-center gap-2">
 <h4 className="truncate text-sm font-semibold text-foreground">{worker.fullName}</h4>
 <span
 className={cn(
 "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
 worker.isToday
 ? "bg-amber-100 text-amber-800"
 : "bg-primary-soft text-primary",
 )}
 >
 {getRelativeBirthdayLabel(worker.daysUntilBirthday)}
 </span>
 </div>

 <p className="mt-1 text-sm text-foreground-soft">
 {worker.role}
 {worker.department ? ` · ${worker.department}` : ""}
 </p>

 <div className="mt-3 flex flex-wrap gap-3 text-xs text-foreground-soft">
 <span className="inline-flex items-center gap-1.5">
 <CalendarDays className="size-3.5" />
 <span className="capitalize">{formatBirthdayDate(worker.birthday || "")}</span>
 </span>
 {worker.department ? (
 <span className="inline-flex items-center gap-1.5">
 <Building2 className="size-3.5" />
 {worker.department}
 </span>
 ) : null}
 </div>
 </div>
 </div>
 </article>
 ))}
 </div>
 )}
 </div>
 );
}
