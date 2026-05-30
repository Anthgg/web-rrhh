"use client";

import { CalendarDays, CakeSlice, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import type { BirthdayWorker } from "@/types";

import {
  enhanceBirthdayWorker,
  formatBirthdayDate,
  getRelativeBirthdayLabel,
} from "@/components/dashboard/birthdays/birthdayUtils";

export function MyBirthdayStatus({ worker }: { worker: BirthdayWorker }) {
  const details = enhanceBirthdayWorker(worker);
  const birthdayDate = formatBirthdayDate(worker.birthday);

  return (
    <article className="relative overflow-hidden rounded-[1.75rem] border border-white/60 bg-white/75 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.10)] backdrop-blur-xl">
      <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.22),_transparent_60%),radial-gradient(circle_at_top_right,_rgba(244,114,182,0.16),_transparent_50%)]" />

      <div className="relative grid gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="grid gap-2">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-brand/15 bg-brand-soft/70 px-3 py-1 text-xs font-semibold text-brand">
              <Sparkles className="size-3.5" />
              Tu cumpleaños
            </span>
            <div>
              <h3 className="section-title text-2xl font-semibold text-ink">{worker.fullName}</h3>
              <p className="mt-1 text-sm text-ink-soft">
                {worker.role}
                {worker.department ? ` · ${worker.department}` : ""}
              </p>
            </div>
          </div>

          <div className="flex size-14 items-center justify-center rounded-2xl bg-white/80 text-brand shadow-[0_16px_34px_rgba(15,118,110,0.18)]">
            <CakeSlice className="size-6" />
          </div>
        </div>

        <div className="grid gap-3">
          <div
            className={cn(
              "rounded-[1.5rem] border p-4",
              details.isToday
                ? "border-amber-200 bg-amber-50/90 text-amber-900"
                : "border-slate-200 bg-slate-50/80 text-ink",
            )}
          >
            <p className="section-title text-xl font-semibold">
              {details.isToday
                ? `¡Feliz cumpleaños, ${worker.fullName.split(" ")[0]}!`
                : `Faltan ${details.daysUntilBirthday} día${details.daysUntilBirthday !== 1 ? "s" : ""} para tu cumpleaños`}
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              {details.isToday
                ? "Tu día ya está marcado en el dashboard para que el equipo no lo deje pasar."
                : "El conteo considera automáticamente el cambio de año para mostrar tu próxima celebración."}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-border bg-white/85 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">
                Fecha registrada
              </p>
              <p className="mt-2 section-title text-lg font-semibold capitalize text-ink">{birthdayDate}</p>
            </div>

            <div className="rounded-[1.5rem] border border-border bg-white/85 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">
                Estado
              </p>
              <div className="mt-2 flex items-center gap-2">
                <CalendarDays className="size-4 text-brand" />
                <p className="text-sm font-semibold text-ink">
                  {details.isToday ? "Celebración activa" : getRelativeBirthdayLabel(details.daysUntilBirthday)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
