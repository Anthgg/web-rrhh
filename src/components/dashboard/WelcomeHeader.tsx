"use client";

import { Clock3, CalendarDays } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { AttendanceAction } from "./AttendanceAction";

function getGreeting(hour: number) {
  if (hour >= 5 && hour < 12) return "Buenos días";
  if (hour >= 12 && hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export function WelcomeHeader({
  user,
}: {
  user: { firstName?: string; lastName?: string; fullName?: string; role: string };
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const greeting = getGreeting(now.getHours());
  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat("es-PE", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(now),
    [now],
  );
  const formattedTime = useMemo(
    () =>
      new Intl.DateTimeFormat("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(now),
    [now],
  );
  const displayName =
    user.fullName?.trim() ||
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    "Usuario";

  return (
    <DashboardCard className="overflow-hidden bg-[linear-gradient(135deg,#0f766e,#164e63_58%,#14212b)] p-0 text-white">
      <div className="relative grid gap-7 p-6 md:grid-cols-[1fr_auto] md:items-end md:p-8">
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(90deg,rgba(255,255,255,.16)_1px,transparent_1px),linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:34px_34px]" />
        <div className="relative grid gap-3">
          <span className="w-fit rounded-full bg-white/12 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
            Panel ADMIN / RRHH
          </span>
          <div>
            <h1 className="section-title text-3xl font-semibold md:text-5xl">
              {greeting}, {displayName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/78 md:text-base">
              Rol: <span className="font-semibold text-white">{user.role}</span> &bull; Control operativo de asistencia, marcaciones, alertas y jornadas del dia.
            </p>
          </div>
          <AttendanceAction />
        </div>

        <div className="relative grid gap-3 sm:grid-cols-2 md:min-w-[420px]">
          <div className="rounded-3xl border border-white/15 bg-white/10 p-4">
            <div className="flex items-center gap-2 text-white/70">
              <CalendarDays className="size-4" />
              <span className="text-xs font-semibold uppercase tracking-[0.16em]">Fecha</span>
            </div>
            <p className="mt-3 text-sm font-semibold capitalize text-white">{formattedDate}</p>
          </div>
          <div className="rounded-3xl border border-white/15 bg-white/10 p-4">
            <div className="flex items-center gap-2 text-white/70">
              <Clock3 className="size-4" />
              <span className="text-xs font-semibold uppercase tracking-[0.16em]">Hora</span>
            </div>
            <p className="mt-3 font-mono text-2xl font-semibold text-white">{formattedTime}</p>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}
