"use client";

import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarDays, ChevronLeft, ChevronRight, Save, Info, Coffee } from "lucide-react";

import { scheduleService } from "@/services/schedule.service";
import type { RestDayType } from "@/types/schedule";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FieldFrame, Input, Select } from "@/components/ui/fields";
import { UserAvatar } from "@/components/ui/UserAvatar";

// ─── Calendar helpers ─────────────────────────────────────────────────────────
function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
/** Day offset for the 1st of the month: Mon=0 … Sun=6 */
function firstDayOffset(year: number, month: number) {
  return (new Date(year, month, 1).getDay() + 6) % 7;
}
const DAY_NAMES = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
const MONTH_NAMES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

// ─── Colour maps ───────────────────────────────────────────────────────────────
const REST_TYPE_CLASSES: Record<RestDayType, { cell: string; badge: string; label: string }> = {
  manual:   { cell: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300", badge: "bg-amber-400", label: "Manual" },
  fijo:     { cell: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",     badge: "bg-blue-400",  label: "Fijo" },
  rotativo: { cell: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300", badge: "bg-purple-400", label: "Rotativo" },
};
const HOLIDAY_CLASSES = { cell: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300", badge: "bg-rose-400", label: "Feriado" };
const SHIFT_CLASSES = { cell: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300", badge: "bg-emerald-400", label: "Descanso" }; // Actually shift? The prompt said "Descanso: verde/teal". And Turno? 

interface RestDaysPanelProps {
  workersList: any[];
  isLoadingWorkers: boolean;
  selectedWorkerId: string;
  onSuccessAction?: () => void;
}

export function RestDaysPanel({ workersList, selectedWorkerId, onSuccessAction }: RestDaysPanelProps) {
  const [selectedDate, setSelectedDate] = useState(toYMD(new Date()));
  const [restDayType, setRestDayType] = useState<RestDayType>("manual");
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState("7"); // 1=Lunes … 7=Domingo
  const [observation, setObservation] = useState("");

  // Calendar navigation state
  const today = new Date();
  const [calYear, setCalYear]   = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth()); // 0-indexed

  const queryClient = useQueryClient();

  // ── Fetch rest days for the visible 3-month window ──────────────────────
  const queryStartDate = useMemo(() => toYMD(new Date(calYear, calMonth - 1, 1)),  [calYear, calMonth]);
  const queryEndDate   = useMemo(() => toYMD(new Date(calYear, calMonth + 2, 0)),  [calYear, calMonth]);

  const { data: restDaysData, isFetching: isLoadingRestDays } = useQuery({
    queryKey: ["worker-rest-days", selectedWorkerId, queryStartDate, queryEndDate],
    queryFn: () =>
      scheduleService.getWorkerRestDays(selectedWorkerId, { start_date: queryStartDate, end_date: queryEndDate }),
    enabled: !!selectedWorkerId,
    staleTime: 0,
  });

  // Build fast lookup structures from the API response
  const { restDayMap, holidaySet, holidayNames } = useMemo(() => {
    const rd = restDaysData?.data;
    const restDayMap   = new Map<string, RestDayType>();
    const holidaySet   = new Set<string>();
    const holidayNames = new Map<string, string>();
    if (rd) {
      for (const r of rd.rest_days || []) {
        const normalizedType = (r.type || "").toLowerCase() as RestDayType;
        restDayMap.set(r.date, normalizedType);
      }
      for (const h of rd.holidays || []) {
        holidaySet.add(h.date);
        holidayNames.set(h.date, h.name);
      }
    }
    return { restDayMap, holidaySet, holidayNames };
  }, [restDaysData]);

  // Calendar grid for the current month
  const calendarDays = useMemo(() => {
    const total  = daysInMonth(calYear, calMonth);
    const offset = firstDayOffset(calYear, calMonth);
    const cells: (number | null)[] = Array(offset).fill(null);
    for (let d = 1; d <= total; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [calYear, calMonth]);

  const todayStr = toYMD(today);

  const prevMonth = () => { if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); } else setCalMonth(m => m - 1); };
  const nextMonth = () => { if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); } else setCalMonth(m => m + 1); };

  const setRestDayMutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = { type: restDayType, date: selectedDate };
      if (restDayType === "fijo") {
        payload.day_of_week = Number(selectedDayOfWeek);
      }
      // Assuming observation is passed
      if (observation) payload.observation = observation;
      return scheduleService.setRestDay(selectedWorkerId, payload);
    },
    onSuccess: (res) => {
      const newDays = res?.data?.rest_days ?? res?.data?.restDays ?? [];
      const count   = res?.data?.materialized_count ?? res?.data?.materializedCount ?? newDays.length;

      queryClient.invalidateQueries({ queryKey: ["worker-rest-days", selectedWorkerId] });

      const countLabel = count > 0 ? ` (${count} ${count === 1 ? "día" : "días"} materializados)` : "";
      toast.success(`Descanso programado correctamente${countLabel}.`);

      if (onSuccessAction) onSuccessAction();
      setObservation("");
    },
    onError: (error: any) => {
      const msg = error?.message || error?.error || "Error al programar el día de descanso. Verifica los datos.";
      toast.error(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkerId) {
      toast.error("Por favor selecciona un colaborador.");
      return;
    }
    if (restDayType === "manual" && !selectedDate) {
      toast.error("Por favor selecciona una fecha para el descanso manual.");
      return;
    }
    if (restDayType === "fijo" && !selectedDayOfWeek) {
      toast.error("Por favor selecciona el día de la semana para el descanso fijo.");
      return;
    }
    setRestDayMutation.mutate();
  };

  if (!selectedWorkerId) {
    return (
      <Card className="flex flex-col items-center justify-center h-full border border-dashed border-border bg-card text-center p-6 shadow-sm">
        <div className="rounded-2xl bg-muted/50 p-6 text-muted-foreground mb-4">
          <CalendarDays className="size-12" />
        </div>
        <h3 className="text-xl font-bold text-foreground">Asistencias Programadas</h3>
        <p className="text-muted-foreground text-sm max-w-sm mt-2">
          Selecciona un colaborador del panel izquierdo para programar sus descansos y visualizar su calendario.
        </p>
      </Card>
    );
  }

  const selectedWorker = workersList.find((w) => w.id === selectedWorkerId);

  return (
    <div className="flex flex-col gap-6">
      {/* ── Rest-day calendar ─────────────────────────────────── */}
      <Card className="p-0 bg-card border-border shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border/60 flex items-center justify-between bg-muted/5">
          <div className="flex items-center gap-3">
            {selectedWorker && (
              <UserAvatar
                src={selectedWorker.profilePhotoUrl || selectedWorker.avatarUrl}
                name={selectedWorker.fullName}
                size="sm"
              />
            )}
            <div>
              <h2 className="text-base font-bold text-foreground">Asistencias Programadas / Descansos</h2>
              {selectedWorker && <p className="text-xs text-muted-foreground">{selectedWorker.fullName}</p>}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-foreground">
              {MONTH_NAMES[calMonth]} {calYear}
            </span>
            <div className="flex items-center border border-border rounded-lg bg-background overflow-hidden">
              <button onClick={prevMonth} className="px-2 py-1 hover:bg-muted transition-colors border-r border-border" aria-label="Mes anterior">
                <ChevronLeft className="size-4" />
              </button>
              <button onClick={() => { setCalMonth(today.getMonth()); setCalYear(today.getFullYear()); }} className="px-3 py-1 text-xs font-semibold hover:bg-muted transition-colors border-r border-border">
                Hoy
              </button>
              <button onClick={nextMonth} className="px-2 py-1 hover:bg-muted transition-colors" aria-label="Mes siguiente">
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-4">
          {/* Day-name headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAY_NAMES.map((d, i) => (
              <div key={d} className={`text-center text-[11px] font-bold py-2 uppercase tracking-wider ${i >= 5 ? "text-rose-500/70" : "text-muted-foreground"}`}>
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-[1px] bg-border/40 rounded-xl overflow-hidden border border-border/40">
            {calendarDays.map((day, idx) => {
              if (!day) return <div key={`e-${idx}`} className="bg-muted/10 min-h-[100px]" />;
              const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isToday  = dateStr === todayStr;
              const restType = restDayMap.get(dateStr);
              const isHoliday = holidaySet.has(dateStr);
              const isWeekend = idx % 7 === 5 || idx % 7 === 6;

              return (
                <div 
                  key={dateStr} 
                  onClick={() => setSelectedDate(dateStr)}
                  className={`bg-card min-h-[100px] p-2 flex flex-col gap-1 cursor-pointer transition-colors hover:bg-muted/30 group ${isToday ? "ring-2 ring-inset ring-primary bg-primary/5" : ""} ${selectedDate === dateStr && !isToday ? "ring-1 ring-inset ring-border bg-muted/20" : ""}`}
                >
                  <div className={`text-xs font-semibold self-end mb-1 ${isToday ? "text-primary bg-primary/10 px-2 py-0.5 rounded-full" : isHoliday ? "text-rose-500" : isWeekend ? "text-muted-foreground/70" : "text-muted-foreground"}`}>
                    {day}
                  </div>
                  
                  {/* Chips */}
                  <div className="flex flex-col gap-1 w-full">
                    {isHoliday && (
                      <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded w-full truncate ${HOLIDAY_CLASSES.cell}`} title={holidayNames.get(dateStr)}>
                        • Feriado
                      </div>
                    )}
                    {restType && (
                      <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded w-full truncate ${REST_TYPE_CLASSES[restType].cell}`} title={`Descanso ${REST_TYPE_CLASSES[restType].label}`}>
                        • Descanso
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-5 justify-center">
            {(Object.keys(REST_TYPE_CLASSES) as RestDayType[]).map((type) => (
              <div key={type} className="flex items-center gap-1.5">
                <span className={`size-3 rounded-full ${REST_TYPE_CLASSES[type].badge}`} />
                <span className="text-xs font-semibold text-muted-foreground">{REST_TYPE_CLASSES[type].label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <span className={`size-3 rounded-full ${HOLIDAY_CLASSES.badge}`} />
              <span className="text-xs font-semibold text-muted-foreground">{HOLIDAY_CLASSES.label}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`size-3 rounded-full ${SHIFT_CLASSES.badge}`} />
              <span className="text-xs font-semibold text-muted-foreground">Descanso (Verde)</span>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Assignment form ───────────────────────────────────── */}
      <Card className="bg-card border-border shadow-sm overflow-hidden flex flex-col md:flex-row">
        <div className="p-6 md:w-1/3 bg-muted/10 border-b md:border-b-0 md:border-r border-border/60">
          <div className="flex items-center gap-2 mb-2">
            <Coffee className="size-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">Programar Descanso</h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Define un descanso para el colaborador seleccionado.
          </p>
          <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-start gap-2">
            <Info className="size-4 text-primary shrink-0 mt-0.5" />
            <p className="text-[11px] text-primary/90 font-medium">
              El descanso se aplicará al colaborador seleccionado y se reflejará automáticamente en el calendario. Evitará que el sistema le genere una falta.
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 md:w-2/3 grid gap-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <FieldFrame label="Tipo de descanso" hint="Indica la naturaleza del descanso.">
              <Select value={restDayType} onChange={(e) => setRestDayType(e.target.value as RestDayType)} className="h-10 text-sm">
                <option value="manual">Manual (Día Específico)</option>
                <option value="fijo">Fijo (Día de la Semana)</option>
                <option value="rotativo">Rotativo (Aleatorio por semana)</option>
              </Select>
            </FieldFrame>

            <FieldFrame
              label={restDayType === "manual" ? "Fecha del descanso" : "Fecha de inicio"}
              hint={restDayType === "manual" ? "Selecciona el día exacto." : "Fecha desde la cual aplica hacia el futuro."}
            >
              <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} required className="h-10 text-sm" />
            </FieldFrame>
          </div>

          {restDayType === "fijo" && (
            <FieldFrame label="Día de la Semana" hint="Día fijo cada semana.">
              <Select value={selectedDayOfWeek} onChange={(e) => setSelectedDayOfWeek(e.target.value)} className="h-10 text-sm">
                <option value="1">Lunes</option>
                <option value="2">Martes</option>
                <option value="3">Miércoles</option>
                <option value="4">Jueves</option>
                <option value="5">Viernes</option>
                <option value="6">Sábado</option>
                <option value="7">Domingo</option>
              </Select>
            </FieldFrame>
          )}

          <FieldFrame label="Observación (opcional)">
            <Input 
              type="text" 
              placeholder="Ej. Descanso personal, cambio solicitado..." 
              value={observation} 
              onChange={(e) => setObservation(e.target.value)} 
              className="h-10 text-sm"
            />
          </FieldFrame>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={setRestDayMutation.isPending} className="flex items-center gap-2">
              <Save className="size-4" />
              {setRestDayMutation.isPending ? "Programando..." : "Programar Descanso"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
