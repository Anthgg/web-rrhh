"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
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
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import type { BirthdayWorker } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
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

function BirthdayAvatar({ worker }: { worker: BirthdayWorker }) {
  if (worker.avatarUrl) {
    return (
      <Image unoptimized width={400} height={400}
        src={worker.avatarUrl}
        alt={worker.fullName}
        className="size-11 rounded-2xl object-cover shadow-[0_12px_24px_rgba(15,23,42,0.14)]"
      />
    );
  }

  return (
    <div className="flex size-11 items-center justify-center rounded-2xl bg-brand-soft text-sm font-semibold text-brand">
      {worker.fullName
        .split(" ")
        .map((chunk) => chunk.charAt(0))
        .slice(0, 2)
        .join("")}
    </div>
  );
}

export function BirthdayCalendarModal({
  isOpen,
  onClose,
  workers,
}: {
  isOpen: boolean;
  onClose: () => void;
  workers: BirthdayWorker[];
}) {
  const [viewMode, setViewMode] = useState<BirthdayViewMode>("upcoming");
  const [selectedMonth, setSelectedMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [selectedDepartment, setSelectedDepartment] = useState("all");

  // Ref estable para onClose — evita re-suscribir el listener en cada render del padre
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const departments = useMemo(() => getBirthdayDepartments(workers), [workers]);

  const filteredWorkers = useMemo(() => {
    if (selectedDepartment === "all") return workers;
    return workers.filter((worker) => worker.department === selectedDepartment);
  }, [selectedDepartment, workers]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(selectedMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(selectedMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [selectedMonth]);

  const birthdayCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const worker of filteredWorkers) {
      const key = getBirthdayMonthDayKey(worker.birthday);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return counts;
  }, [filteredWorkers]);

  const upcomingWorkers = useMemo(() => sortBirthdaysByNearest(filteredWorkers).slice(0, 12), [filteredWorkers]);
  const selectedDayWorkers = useMemo(
    () =>
      sortBirthdaysByMonthDay(filterBirthdaysByDay(filteredWorkers, selectedDate)).map((worker: BirthdayWorker) =>
        enhanceBirthdayWorker(worker),
      ),
    [filteredWorkers, selectedDate],
  );
  const selectedMonthWorkers = useMemo(
    () =>
      sortBirthdaysByMonthDay(filterBirthdaysByMonth(filteredWorkers, selectedMonth.getMonth())).map((worker: BirthdayWorker) =>
        enhanceBirthdayWorker(worker),
      ),
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

  const resultDescription =
    viewMode === "day"
      ? "Trabajadores que celebran exactamente en la fecha seleccionada."
      : viewMode === "month"
        ? "Listado completo del mes elegido, ideal para planificación y comunicaciones."
        : "Secuencia cronológica de los siguientes cumpleaños registrados.";

  if (!isOpen) return null;

  return (
    <div suppressHydrationWarning className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        aria-hidden="true"
        onClick={onClose}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-label="Calendario de cumpleaños"
        className="relative z-10 flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-[2rem] border border-white/55 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.98))] shadow-[0_40px_120px_rgba(15,23,42,0.28)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border/70 px-6 py-5">
          <div className="grid gap-1">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-brand/15 bg-brand-soft/65 px-3 py-1 text-xs font-semibold text-brand">
              <CalendarDays className="size-3.5" />
              Centro de cumpleaños
            </span>
            <h2 className="section-title text-2xl font-semibold text-ink">Calendario y filtros del equipo</h2>
            <p className="text-sm text-ink-soft">
              Consulta por día, mes o próximos hitos sin salir del dashboard.
            </p>
          </div>

          <Button
            variant="ghost"
            onClick={onClose}
            className="size-10 rounded-2xl px-0 text-ink-soft hover:bg-slate-100"
            aria-label="Cerrar modal de cumpleaños"
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="min-h-0 overflow-y-auto border-b border-border/70 px-6 py-5 lg:border-b-0 lg:border-r">
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

            <div className="mt-6 rounded-[1.75rem] border border-border bg-white/85 p-4 shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="section-title text-lg font-semibold capitalize text-ink">
                    {format(selectedMonth, "MMMM yyyy", { locale: es })}
                  </h3>
                  <p className="text-sm text-ink-soft">Selecciona un día del calendario para ver el detalle.</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMonth((current) => subMonths(current, 1))}
                    className="inline-flex size-10 items-center justify-center rounded-2xl border border-border bg-white text-ink-soft transition hover:border-brand/30 hover:text-ink"
                    aria-label="Mes anterior"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMonth((current) => addMonths(current, 1))}
                    className="inline-flex size-10 items-center justify-center rounded-2xl border border-border bg-white text-ink-soft transition hover:border-brand/30 hover:text-ink"
                    aria-label="Mes siguiente"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>

              <div className="mb-3 grid grid-cols-7 gap-2">
                {weekLabels.map((label) => (
                  <div key={label} className="px-1 py-2 text-center text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
                    {label}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day) => {
                  const key = format(day, "MM-dd");
                  const count = birthdayCounts.get(key) ?? 0;
                  const isSelected = isSameDay(day, selectedDate);
                  const isInCurrentMonth = isSameMonth(day, selectedMonth);
                  const isToday = isSameDay(day, new Date());

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
                        "group min-h-[4.6rem] rounded-2xl border p-2 text-left transition",
                        isSelected
                          ? "border-transparent bg-ink text-white shadow-[0_18px_36px_rgba(15,23,42,0.20)]"
                          : count > 0
                            ? "border-brand/20 bg-brand-soft/55 hover:border-brand/35"
                            : "border-border bg-white hover:border-brand/20 hover:bg-slate-50",
                        !isInCurrentMonth && !isSelected && "opacity-45",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold">{format(day, "d")}</span>
                        {isToday ? (
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              isSelected ? "bg-white/15 text-white" : "bg-amber-100 text-amber-800",
                            )}
                          >
                            Hoy
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-4 flex items-end justify-between">
                        <span className={cn("text-[11px] font-medium", isSelected ? "text-white/80" : "text-ink-soft")}>
                          {count > 0 ? `${count} cumple${count > 1 ? "s" : ""}` : "Sin eventos"}
                        </span>
                        {count > 0 ? (
                          <span
                            className={cn(
                              "inline-flex size-2.5 rounded-full",
                              isSelected ? "bg-white" : "bg-brand",
                            )}
                          />
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="min-h-0 overflow-y-auto px-6 py-5">
            <div className="grid gap-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-[1.5rem] border border-border bg-white/85 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">Vista actual</p>
                  <div className="mt-3 flex items-center gap-2">
                    <Sparkles className="size-4 text-brand" />
                    <span className="text-sm font-semibold capitalize text-ink">
                      {viewMode === "upcoming" ? "Próximos" : viewMode === "day" ? "Por día" : "Por mes"}
                    </span>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-border bg-white/85 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">Resultados</p>
                  <div className="mt-3 flex items-center gap-2">
                    <Users className="size-4 text-brand" />
                    <span className="text-sm font-semibold text-ink">{resultWorkers.length} trabajador(es)</span>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-border bg-white/85 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">Filtro de área</p>
                  <div className="mt-3 flex items-center gap-2">
                    <Building2 className="size-4 text-brand" />
                    <span className="text-sm font-semibold text-ink">
                      {selectedDepartment === "all" ? "Todas las áreas" : selectedDepartment}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-border bg-white/90 p-5 shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
                <div className="mb-5 grid gap-1">
                  <h3 className="section-title text-xl font-semibold text-ink">{resultTitle}</h3>
                  <p className="text-sm text-ink-soft">{resultDescription}</p>
                </div>

                {!resultWorkers.length ? (
                  <div className="rounded-[1.5rem] border border-dashed border-border bg-slate-50/80 px-4 py-8 text-sm text-ink-soft">
                    No hay cumpleaños que coincidan con los filtros actuales.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {resultWorkers.map((worker) => (
                      <article
                        key={`${worker.id}-${worker.birthday}`}
                        className="flex flex-col gap-3 rounded-[1.5rem] border border-border bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-start gap-3">
                          <BirthdayAvatar worker={worker} />
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-sm font-semibold text-ink">{worker.fullName}</h4>
                              <span
                                className={cn(
                                  "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                                  worker.isToday ? "bg-amber-100 text-amber-800" : "bg-brand-soft text-brand",
                                )}
                              >
                                {getRelativeBirthdayLabel(worker.daysUntilBirthday)}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-ink-soft">
                              {worker.role}
                              {worker.department ? ` · ${worker.department}` : ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-ink-soft">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="size-4 text-brand" />
                            <span className="capitalize">{formatBirthdayDate(worker.birthday)}</span>
                          </span>
                          {worker.department ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Building2 className="size-4 text-brand" />
                              {worker.department}
                            </span>
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
