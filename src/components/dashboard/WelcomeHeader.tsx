"use client";

import Link from "next/link";
import { Clock3, CalendarDays, CalendarRange, MoonStar } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { DownloadPdfButton } from "@/components/reports/DownloadPdfButton";
import { getOperationalPulse, type DashboardSummary } from "@/components/dashboard/_metrics";
import { scheduleService } from "@/services/schedule.service";
import { cn } from "@/lib/utils/cn";

function getGreeting(hour: number) {
  if (hour >= 5 && hour < 12) return "Buenos días";
  if (hour >= 12 && hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

function localDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Segmentos del pulso operativo, en orden y con su color semántico. */
const PULSE_SEGMENTS = [
  { key: "onTime", label: "A tiempo", className: "bg-emerald-400" },
  { key: "late", label: "Tardanzas", className: "bg-amber-400" },
  { key: "missing", label: "Sin marcar", className: "bg-white/25" },
] as const;

/**
 * Header operativo compacto. Su elemento firma es la barra de pulso del día:
 * una sola línea que muestra, en vivo, qué proporción del personal marcó a
 * tiempo, llegó tarde o aún no registra asistencia.
 */
export function WelcomeHeader({
  user,
  summary,
}: {
  user: { firstName?: string; lastName?: string; fullName?: string; role: string };
  summary: DashboardSummary;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const todayStr = useMemo(() => localDateKey(now), [now]);

  const { data: schedule } = useQuery({
    queryKey: ["my-schedule-detail", todayStr],
    queryFn: () => scheduleService.getMySchedule(todayStr),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  const greeting = getGreeting(now.getHours());
  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat("es-PE", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(now),
    [now],
  );
  const formattedTime = useMemo(
    () =>
      new Intl.DateTimeFormat("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(now),
    [now],
  );

  const displayName =
    user.fullName?.trim() ||
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    "Usuario";

  const pulse = getOperationalPulse(summary);
  const pulseTotal = Math.max(pulse.total, 1);
  const markedRatio = Math.round((pulse.records / pulseTotal) * 100);

  const shiftLabel = schedule
    ? schedule.shift
      ? `${schedule.shift.name} · ${schedule.shift.start_time.substring(0, 5)}–${schedule.shift.end_time.substring(0, 5)}`
      : (schedule.isWorkingDay ?? schedule.is_working_day) === false
        ? "Día libre / Descanso"
        : "Sin turno asignado"
    : "Cargando turno…";

  return (
    <section className="animate-[dashboard-rise_420ms_ease-out_both] overflow-hidden rounded-2xl bg-[linear-gradient(120deg,#0f766e_0%,#155e63_52%,#15303b_100%)] text-white shadow-[0_12px_40px_rgba(15,118,110,0.28)]">
      <div className="relative">
        {/* Textura grid muy sutil */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.14] [background-image:linear-gradient(90deg,rgba(255,255,255,.4)_1px,transparent_1px),linear-gradient(rgba(255,255,255,.3)_1px,transparent_1px)] [background-size:32px_32px]"
        />

        <div className="relative grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
          {/* Saludo + meta */}
          <div className="min-w-0 grid gap-3">
            <span className="w-fit rounded-full bg-white/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
              Panel admin · RRHH
            </span>
            <div className="min-w-0">
              <h1 className="section-title truncate text-2xl font-semibold sm:text-3xl">
                {greeting}, {displayName}
              </h1>
              <p className="mt-1 text-sm text-white/75">
                <span className="font-semibold capitalize text-white">{user.role || "admin"}</span>
                {" · "}Control operativo de asistencia, marcaciones y alertas del día
              </p>
            </div>

            {/* Meta chips: fecha / hora / turno */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white/90">
                <CalendarDays className="size-3.5" />
                <span className="capitalize">{formattedDate}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-semibold tabular-nums text-white">
                <Clock3 className="size-3.5" />
                {formattedTime}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white/90">
                <MoonStar className="size-3.5" />
                <span className="max-w-[16rem] truncate" title={shiftLabel}>
                  {shiftLabel}
                </span>
              </span>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <DownloadPdfButton
              reportType="attendance"
              filters={{ start_date: todayStr, end_date: todayStr }}
              className="h-10 rounded-xl bg-white px-4 text-sm font-semibold text-[#0f4c4a] shadow-none hover:bg-white/90"
            >
              Exportar asistencia
            </DownloadPdfButton>
            <Link
              href="/dashboard/birthdays"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/25 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <CalendarRange className="size-4" />
              Ver calendario
            </Link>
          </div>
        </div>

        {/* Pulso operativo — elemento firma */}
        <div className="relative border-t border-white/12 bg-black/10 px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-3 pb-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
              Pulso del día
            </span>
            <span className="text-xs font-medium text-white/75">
              <span className="tabular-nums font-semibold text-white">{pulse.records}</span>
              {" / "}
              <span className="tabular-nums">{pulse.total}</span> marcaron
              {" · "}
              <span className="tabular-nums font-semibold text-white">{markedRatio}%</span>
            </span>
          </div>

          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-white/10">
            {PULSE_SEGMENTS.map((segment) => {
              const value = pulse[segment.key];
              const pct = (value / pulseTotal) * 100;
              if (pct <= 0) return null;
              return (
                <div
                  key={segment.key}
                  className={cn("h-full transition-[width] duration-500", segment.className)}
                  style={{ width: `${pct}%` }}
                  title={`${segment.label}: ${value}`}
                />
              );
            })}
          </div>

          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
            {PULSE_SEGMENTS.map((segment) => (
              <span key={segment.key} className="inline-flex items-center gap-1.5 text-xs text-white/80">
                <span className={cn("size-2 rounded-full", segment.className)} />
                {segment.label}
                <span className="tabular-nums font-semibold text-white">{pulse[segment.key]}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
