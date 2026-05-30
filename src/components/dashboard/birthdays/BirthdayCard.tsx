"use client";

import { useMemo, useState } from "react";
import { CalendarRange, Sparkles, Users } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Button } from "@/components/ui/button";
import { useSession } from "@/features/auth/auth-provider";
import { buildMockBirthdayWorkers } from "@/lib/mocks/birthdays";
import { cn } from "@/lib/utils/cn";
import type { BirthdayWorker } from "@/types";

import { BirthdayCalendarModal } from "@/components/dashboard/birthdays/BirthdayCalendarModal";
import {
  dedupeBirthdayWorkers,
  filterBirthdaysByDay,
  filterBirthdaysByMonth,
  formatBirthdayOccurrenceDate,
  getRelativeBirthdayLabel,
  matchesCurrentUser,
  sortBirthdaysByNearest,
} from "@/components/dashboard/birthdays/birthdayUtils";
import { MyBirthdayStatus } from "@/components/dashboard/birthdays/MyBirthdayStatus";
import { UpcomingBirthdaysList } from "@/components/dashboard/birthdays/UpcomingBirthdaysList";

function buildCurrentUserBirthdayFallback(worker?: {
  id?: string;
  fullName?: string;
  position?: string;
  department?: string;
  birthDate?: string;
  avatarUrl?: string;
} | null): BirthdayWorker {
  const fallbackDirectory = buildMockBirthdayWorkers(worker ?? null);
  const mockCurrentUser = fallbackDirectory[0];

  return {
    ...mockCurrentUser,
    id: worker?.id ?? mockCurrentUser.id,
    fullName: worker?.fullName ?? mockCurrentUser.fullName,
    role: worker?.position ?? mockCurrentUser.role,
    department: worker?.department ?? mockCurrentUser.department,
    birthday: worker?.birthDate ?? mockCurrentUser.birthday,
    avatarUrl: worker?.avatarUrl ?? mockCurrentUser.avatarUrl,
    isCurrentUser: true,
  };
}

export function BirthdayCard({ birthdays }: { birthdays: BirthdayWorker[] }) {
  const { user } = useSession();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const directory = useMemo(() => {
    const apiDirectory = birthdays.filter((worker) => Boolean(worker?.birthday));
    return apiDirectory.length > 0 ? apiDirectory : buildMockBirthdayWorkers(user);
  }, [birthdays, user]);

  const currentUserBirthday = useMemo(() => {
    const fallback = buildCurrentUserBirthdayFallback(user);
    const match = directory.find((worker) => matchesCurrentUser(worker, user) || worker.isCurrentUser);

    if (!match) {
      return fallback;
    }

    return {
      ...fallback,
      ...match,
      role: match.role || fallback.role,
      department: match.department ?? fallback.department,
      avatarUrl: match.avatarUrl ?? fallback.avatarUrl,
      isCurrentUser: true,
    };
  }, [directory, user]);

  const fullDirectory = useMemo(() => {
    const coworkers = directory.filter((worker) => !matchesCurrentUser(worker, user));
    return dedupeBirthdayWorkers([currentUserBirthday, ...coworkers]);
  }, [currentUserBirthday, directory, user]);

  const upcomingCoworkers = useMemo(
    () => sortBirthdaysByNearest(fullDirectory.filter((worker) => !worker.isCurrentUser)),
    [fullDirectory],
  );

  const birthdaysToday = filterBirthdaysByDay(fullDirectory, new Date()).length;
  const birthdaysThisMonth = filterBirthdaysByMonth(fullDirectory, new Date().getMonth()).length;
  const nextBirthday = upcomingCoworkers[0];

  return (
    <>
      <DashboardCard className="relative overflow-hidden border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,250,252,0.98))] p-0 shadow-[0_24px_64px_rgba(15,23,42,0.12)]">
        <div className="absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.18),_transparent_60%),radial-gradient(circle_at_top_right,_rgba(232,121,249,0.14),_transparent_52%)]" />

        <div className="relative grid gap-6 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="grid gap-3">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-brand/15 bg-brand-soft/65 px-3 py-1 text-xs font-semibold text-brand">
                <Sparkles className="size-3.5" />
                Gestion de cumpleanos
              </div>
              <div className="grid gap-1">
                <h2 className="section-title text-2xl font-semibold text-ink">Cumpleanos del equipo</h2>
                <p className="max-w-2xl text-sm text-ink-soft">
                  Un modulo mas util para RRHH: tu estado personal, proximos hitos y calendario filtrable en una sola vista.
                </p>
              </div>
            </div>

            <Button
              onClick={() => setIsCalendarOpen(true)}
              className="h-12 rounded-2xl px-5"
            >
              <CalendarRange className="mr-2 size-4" />
              Abrir calendario
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-white/60 bg-white/78 p-4 shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">Cumpleanos hoy</p>
              <p className="mt-2 section-title text-2xl font-semibold text-ink">{birthdaysToday}</p>
              <p className="mt-1 text-sm text-ink-soft">Trabajadores celebrando en la fecha actual.</p>
            </div>

            <div className="rounded-[1.5rem] border border-white/60 bg-white/78 p-4 shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">Este mes</p>
              <p className="mt-2 section-title text-2xl font-semibold text-ink">{birthdaysThisMonth}</p>
              <p className="mt-1 text-sm text-ink-soft">Cumpleanos detectados en el mes en curso.</p>
            </div>

            <div className="rounded-[1.5rem] border border-white/60 bg-white/78 p-4 shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">Siguiente celebracion</p>
              <div className="mt-2 flex items-start gap-2">
                <Users className="mt-1 size-4 text-brand" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {nextBirthday ? nextBirthday.fullName : "Sin registros"}
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">
                    {nextBirthday
                      ? `${getRelativeBirthdayLabel(nextBirthday.daysUntilBirthday)} · ${formatBirthdayOccurrenceDate(nextBirthday.nextBirthday)}`
                      : "Agrega datos o conecta la API"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)]">
            <MyBirthdayStatus worker={currentUserBirthday} />

            <div
              className={cn(
                "rounded-[1.75rem] border border-white/65 bg-white/78 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-xl",
              )}
            >
              <UpcomingBirthdaysList workers={upcomingCoworkers} />
            </div>
          </div>
        </div>
      </DashboardCard>

      <BirthdayCalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        workers={fullDirectory}
      />
    </>
  );
}
