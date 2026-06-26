"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Cake,
  ChevronLeft,
  ChevronRight,
  Download,
  PartyPopper,
  Search,
  Users,
} from "lucide-react";

import { Panel, SectionHeading } from "@/components/dashboard/primitives";
import { tone } from "@/components/dashboard/_tokens";
import { LoadingPanel } from "@/components/shared/states";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useSession } from "@/features/auth/auth-provider";
import { apiClient } from "@/lib/api/client";
import { normalizeBirthdayWorker } from "@/lib/api/normalizers";
import { buildMockBirthdayWorkers } from "@/lib/mocks/birthdays";
import { cn } from "@/lib/utils/cn";
import type { BirthdayWorker } from "@/types";

import {
  BirthdayFilters,
  type BirthdayViewMode,
} from "@/components/dashboard/birthdays/BirthdayFilters";
import {
  enhanceBirthdayWorker,
  filterBirthdaysByDay,
  filterBirthdaysByMonth,
  formatBirthdayDate,
  formatBirthdayMonthLabel,
  getBirthdayDepartments,
  getBirthdayMonthDayKey,
  getRelativeBirthdayLabel,
  sortBirthdaysByMonthDay,
  sortBirthdaysByNearest,
} from "@/components/dashboard/birthdays/birthdayUtils";

const weekLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, Math.max(0, month - 1), day || 1);
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function useBirthdayDirectory(): { workers: BirthdayWorker[]; isLoading: boolean } {
  const { user } = useSession();
  const { data, isLoading } = useQuery({
    queryKey: ["birthdays-all"],
    queryFn: () => apiClient<unknown>("/api/birthdays/all"),
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });

  const workers = useMemo(() => {
    const payload =
      data && typeof data === "object" && "data" in data
        ? (data as { data: unknown }).data
        : data;
    const raw =
      payload && typeof payload === "object" && "birthdays" in payload
        ? asArray<unknown>((payload as { birthdays: unknown }).birthdays)
        : asArray<unknown>(payload);

    const normalized = raw
      .map((entry) => normalizeBirthdayWorker(entry))
      .filter((entry): entry is BirthdayWorker => Boolean(entry?.birthday));

    return normalized.length > 0 ? normalized : buildMockBirthdayWorkers(user);
  }, [data, user]);

  return { workers, isLoading };
}

function exportBirthdaysCsv(workers: BirthdayWorker[]) {
  const rows = sortBirthdaysByNearest(workers).map((worker) => [
    worker.fullName,
    worker.role ?? "",
    worker.department ?? "",
    worker.birthday ?? "",
    getRelativeBirthdayLabel(worker.daysUntilBirthday),
  ]);
  const header = ["Nombre", "Cargo", "Área", "Cumpleaños", "Próximo"];
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `cumpleanos-${format(new Date(), "yyyy-MM-dd")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function BirthdaysFullView() {
  const { workers, isLoading } = useBirthdayDirectory();

  const [viewMode, setViewMode] = useState<BirthdayViewMode>("upcoming");
  const [selectedMonth, setSelectedMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [query, setQuery] = useState("");
  // La vista se monta después del LoadingPanel de react-query (sin SSR del
  // calendario), así que tomar la fecha del cliente aquí no genera mismatch.
  const today = useMemo(() => new Date(), []);

  const departments = useMemo(() => getBirthdayDepartments(workers), [workers]);

  const filteredWorkers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return workers.filter((worker) => {
      if (selectedDepartment !== "all" && worker.department !== selectedDepartment) return false;
      if (!normalizedQuery) return true;
      return (
        worker.fullName.toLowerCase().includes(normalizedQuery) ||
        (worker.role ?? "").toLowerCase().includes(normalizedQuery)
      );
    });
  }, [workers, selectedDepartment, query]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(selectedMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(selectedMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [selectedMonth]);

  const birthdayCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const worker of filteredWorkers) {
      if (worker.birthday) {
        const key = getBirthdayMonthDayKey(worker.birthday);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    return counts;
  }, [filteredWorkers]);

  const upcomingWorkers = useMemo(() => sortBirthdaysByNearest(filteredWorkers).slice(0, 24), [filteredWorkers]);
  const selectedDayWorkers = useMemo(
    () => sortBirthdaysByMonthDay(filterBirthdaysByDay(filteredWorkers, selectedDate)).map((w) => enhanceBirthdayWorker(w)),
    [filteredWorkers, selectedDate],
  );
  const selectedMonthWorkers = useMemo(
    () => sortBirthdaysByMonthDay(filterBirthdaysByMonth(filteredWorkers, selectedMonth.getMonth())).map((w) => enhanceBirthdayWorker(w)),
    [filteredWorkers, selectedMonth],
  );

  const resultWorkers =
    viewMode === "day" ? selectedDayWorkers : viewMode === "month" ? selectedMonthWorkers : upcomingWorkers;

  const resultTitle =
    viewMode === "day"
      ? `Cumpleaños del ${format(selectedDate, "d 'de' MMMM", { locale: es })}`
      : viewMode === "month"
        ? `Cumpleaños de ${formatBirthdayMonthLabel(selectedMonth.getMonth())}`
        : "Próximos cumpleaños";

  const todayCount = filterBirthdaysByDay(workers, new Date()).length;
  const monthCount = filterBirthdaysByMonth(workers, new Date().getMonth()).length;

  if (isLoading) {
    return <LoadingPanel title="Cargando cumpleaños del equipo." />;
  }

  return (
    <div className="grid gap-5">
      {/* Encabezado de página */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid gap-1">
          <Link
            href="/dashboard"
            className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-muted-foreground transition hover:text-primary"
          >
            <ArrowLeft className="size-3.5" />
            Volver al dashboard
          </Link>
          <h1 className="section-title text-2xl font-semibold text-foreground">Cumpleaños del equipo</h1>
          <p className="text-sm text-muted-foreground">
            Calendario, filtros y próximas celebraciones del personal.
          </p>
        </div>
        <button
          type="button"
          onClick={() => exportBirthdaysCsv(filteredWorkers)}
          className="inline-flex h-10 w-fit items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
        >
          <Download className="size-4" />
          Exportar cumpleaños
        </button>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-3">
        <Panel className="grid gap-1 p-4">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <Cake className="size-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Hoy</span>
          </div>
          <p className="section-title text-2xl font-semibold tabular-nums text-foreground">{todayCount}</p>
        </Panel>
        <Panel className="grid gap-1 p-4">
          <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
            <CalendarDays className="size-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Este mes</span>
          </div>
          <p className="section-title text-2xl font-semibold tabular-nums text-foreground">{monthCount}</p>
        </Panel>
        <Panel className="grid gap-1 p-4">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Users className="size-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">En directorio</span>
          </div>
          <p className="section-title text-2xl font-semibold tabular-nums text-foreground">{workers.length}</p>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:items-start">
        {/* Calendario + filtros */}
        <Panel className="grid gap-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Buscar cumpleaños por nombre o cargo"
              placeholder="Buscar por nombre o cargo…"
              className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <BirthdayFilters
            viewMode={viewMode}
            selectedMonth={selectedMonth}
            selectedDate={selectedDate}
            selectedDepartment={selectedDepartment}
            departments={departments}
            onViewModeChange={setViewMode}
            onMonthChange={(monthIndex) => {
              const nextMonth = startOfMonth(new Date(selectedMonth.getFullYear(), monthIndex, 1));
              setSelectedMonth(nextMonth);
              if (viewMode === "day") {
                setSelectedDate(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1));
              }
            }}
            onDateChange={(value) => {
              const parsedDate = parseLocalDate(value);
              setSelectedDate(parsedDate);
              setSelectedMonth(startOfMonth(parsedDate));
              setViewMode("day");
            }}
            onDepartmentChange={setSelectedDepartment}
          />

          <div className="rounded-2xl border border-border bg-background p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="section-title text-base font-semibold capitalize text-foreground">
                {format(selectedMonth, "MMMM yyyy", { locale: es })}
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedMonth((current) => subMonths(current, 1))}
                  className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                  aria-label="Mes anterior"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMonth((current) => addMonths(current, 1))}
                  className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                  aria-label="Mes siguiente"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-1.5">
              {weekLabels.map((label) => (
                <div key={label} className="py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((day) => {
                const key = format(day, "MM-dd");
                const count = birthdayCounts.get(key) ?? 0;
                const isSelected = isSameDay(day, selectedDate);
                const isInCurrentMonth = isSameMonth(day, selectedMonth);
                const isToday = isSameDay(day, today);

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    suppressHydrationWarning
                    onClick={() => {
                      setSelectedDate(day);
                      setSelectedMonth(startOfMonth(day));
                      setViewMode("day");
                    }}
                    className={cn(
                      "grid min-h-[3.4rem] gap-1 rounded-lg border p-1.5 text-left transition",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : count > 0
                          ? "border-primary/20 bg-primary/5 hover:border-primary/40"
                          : "border-border bg-card hover:border-primary/20 hover:bg-muted",
                      !isInCurrentMonth && !isSelected && "opacity-40",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold tabular-nums">{format(day, "d")}</span>
                      {isToday ? (
                        <span className={cn("size-1.5 rounded-full", isSelected ? "bg-white" : "bg-amber-500")} />
                      ) : null}
                    </div>
                    {count > 0 ? (
                      <span
                        className={cn(
                          "text-[10px] font-semibold",
                          isSelected ? "text-white/90" : "text-primary",
                        )}
                      >
                        {count} 🎂
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </Panel>

        {/* Lista de resultados */}
        <Panel className="grid gap-4">
          <SectionHeading
            title={resultTitle}
            subtitle={`${resultWorkers.length} trabajador(es)`}
            icon={PartyPopper}
            iconTone="info"
          />

          {resultWorkers.length === 0 ? (
            <div className="grid place-items-center gap-2 rounded-xl border border-dashed border-border bg-background px-4 py-12 text-center">
              <PartyPopper className="size-7 text-muted-foreground/50" />
              <p className="text-sm font-semibold text-foreground">Sin cumpleaños</p>
              <p className="text-sm text-muted-foreground">No hay celebraciones que coincidan con los filtros.</p>
            </div>
          ) : (
            <div className="grid max-h-[30rem] gap-2.5 overflow-y-auto pr-1">
              {resultWorkers.map((worker) => (
                <article
                  key={`${worker.id}-${worker.birthday}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-background p-3"
                >
                  <UserAvatar src={worker.avatarUrl} fullName={worker.fullName} size="md" rounded="2xl" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="truncate text-sm font-semibold text-foreground">{worker.fullName}</h4>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          worker.isToday ? tone.present.soft : "bg-muted text-muted-foreground",
                        )}
                      >
                        {getRelativeBirthdayLabel(worker.daysUntilBirthday)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {worker.role}
                      {worker.department ? ` · ${worker.department}` : ""}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="size-3" />
                        <span className="capitalize">{formatBirthdayDate(worker.birthday || "")}</span>
                      </span>
                      {worker.department ? (
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="size-3" />
                          {worker.department}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
