import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils/cn";
import { normalizeAttendanceStatus, getRecordCheckTime, formatTime, getRecordStatusLabel, getSalaryIndicator } from "@/lib/utils/attendance";
import type { AttendanceRecordsByDate, AttendanceSummary, AttendanceDayStatus, RestDayType } from "@/types/schedule";
import { scheduleService } from "@/services/schedule.service";
import { PaymentTypeBadge } from "@/components/attendance/PaymentTypeBadge";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface WorkerAttendanceCalendarProps {
  records: AttendanceSummary[];
  onDayClick: (
    record: AttendanceSummary | null,
    dateStr: string,
    context?: { restType?: string; isHoliday?: boolean; holidayName?: string }
  ) => void;
  workerId?: string;
  queryStartDate?: string;
  queryEndDate?: string;
  recordsByDate?: AttendanceRecordsByDate;
  calendarByDate?: AttendanceRecordsByDate;
}

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

const STATUS_CHIP_COLORS: Record<AttendanceDayStatus, string> = {
  present: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  late: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  absent: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  vacation: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  medical_leave: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  unpaid_leave: "bg-amber-600/10 text-amber-800 dark:text-amber-300 border-amber-600/20",
  holiday: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20",
  holiday_worked: "bg-teal-600/10 text-teal-800 dark:text-teal-300 border-teal-600/20",
  incomplete: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  rest_day: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  not_scheduled: "bg-muted text-muted-foreground border-border",
  pending: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20",
  none: "bg-muted text-muted-foreground border-border",
  unknown: "bg-muted text-muted-foreground border-border",
};

function getSafeRecordDayKey(record: AttendanceSummary): string | null {
  return (
    record.dateKey ??
    record.dayKey ??
    record.calendarDate ??
    record.dateTime ??
    record.calendarDateTime ??
    null
  );
}

function normalizeDayKey(dayKey: string | null | undefined): string | null {
  if (!dayKey) return null;
  return dayKey.includes("T") ? dayKey.split("T")[0] : dayKey;
}

function getRecordWorkerId(record: AttendanceSummary): string | undefined {
  const row = record as unknown as Record<string, unknown>;
  return String(record.worker_id ?? row.workerId ?? row.worker_id ?? "").trim() || undefined;
}

function filterRecordsForWorker(records: AttendanceSummary[], workerId?: string): AttendanceSummary[] {
  if (!workerId) return records;
  const hasWorkerScopedRows = records.some((record) => Boolean(getRecordWorkerId(record)));
  if (!hasWorkerScopedRows) return records;

  return records.filter((record) => {
    const recordWorkerId = getRecordWorkerId(record);
    return !recordWorkerId || recordWorkerId === workerId;
  });
}

function pickCalendarRecord(value: AttendanceRecordsByDate[string], workerId?: string): AttendanceSummary | null {
  if (!value) return null;
  const records = filterRecordsForWorker(Array.isArray(value) ? value : [value], workerId);
  if (!records.length) return null;
  if (!Array.isArray(value)) return records[0];

  return (
    records.find((record) => {
      const status = normalizeAttendanceStatus(record as unknown as Record<string, unknown>);
      return status !== "none" && status !== "pending" && status !== "unknown";
    }) ??
    records[0] ??
    null
  );
}

function buildCalendarRecordMap(
  records: AttendanceSummary[],
  recordsByDate?: AttendanceRecordsByDate,
  calendarByDate?: AttendanceRecordsByDate,
  workerId?: string
) {
  const sourceMap = recordsByDate ?? calendarByDate;
  const recordMap = new Map<string, AttendanceSummary>();

  if (sourceMap) {
    for (const [mapKey, value] of Object.entries(sourceMap)) {
      const record = pickCalendarRecord(value, workerId);
      if (!record) continue;
      const safeKey = normalizeDayKey(mapKey) ?? normalizeDayKey(getSafeRecordDayKey(record));
      if (safeKey) {
        recordMap.set(safeKey, {
          ...record,
          dateKey: safeKey,
          dayKey: safeKey,
          calendarDate: safeKey,
        });
      }
    }
    return recordMap;
  }

  for (const record of filterRecordsForWorker(records, workerId)) {
    const safeKey = normalizeDayKey(getSafeRecordDayKey(record));
    if (safeKey) recordMap.set(safeKey, record);
  }

  return recordMap;
}

export function WorkerAttendanceCalendar({
  records,
  onDayClick,
  workerId,
  queryStartDate,
  queryEndDate,
  recordsByDate,
  calendarByDate,
}: WorkerAttendanceCalendarProps) {
  const [activeDate, setActiveDate] = useState<Date>(new Date());
  
  const today = new Date();
  const [calYear, setCalYear]   = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const recordMap = useMemo(
    () => buildCalendarRecordMap(records, recordsByDate, calendarByDate, workerId),
    [calendarByDate, records, recordsByDate, workerId]
  );

  // ── Fetch rest days & holidays for the whole records range ──────────────
  const { minDate, maxDate } = useMemo(() => {
    let firstDate: string | undefined;
    let lastDate: string | undefined;

    for (const key of recordMap.keys()) {
      if (!firstDate || key < firstDate) firstDate = key;
      if (!lastDate || key > lastDate) lastDate = key;
    }

    return {
      minDate: queryStartDate ?? firstDate,
      maxDate: queryEndDate ?? lastDate,
    };
  }, [queryEndDate, queryStartDate, recordMap]);

  const { data: restDaysData } = useQuery({
    queryKey: ["worker-rest-days", workerId, minDate, maxDate],
    queryFn: () => scheduleService.getWorkerRestDays(workerId!, { start_date: minDate, end_date: maxDate }),
    enabled: !!workerId && !!minDate,
    staleTime: 5 * 60 * 1000,
  });

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

  function handleDayClick(day: number | null) {
    if (!day) return;
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const record = recordMap.get(dateStr) ?? null;
    const restType = restDayMap.get(dateStr);
    const isHoliday = holidaySet.has(dateStr);
    const holidayName = holidayNames.get(dateStr);
    
    onDayClick(record, dateStr, { restType, isHoliday, holidayName });
    setActiveDate(new Date(calYear, calMonth, day));
  }

  return (
    <div className="flex flex-col h-full bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
      {/* ── Legend ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-4 py-3 bg-muted/10 shrink-0">
        <div className="flex flex-wrap items-center gap-1.5">
          {([
            { status: "present"      as AttendanceDayStatus, label: "Asistió",        color: "text-emerald-500" },
            { status: "late"         as AttendanceDayStatus, label: "Tardanza",        color: "text-amber-500" },
            { status: "absent"       as AttendanceDayStatus, label: "Faltó",           color: "text-rose-500" },
            { status: "vacation"     as AttendanceDayStatus, label: "Vacaciones",      color: "text-blue-500" },
            { status: "medical_leave" as AttendanceDayStatus, label: "Desc. Médico",   color: "text-purple-500" },
            { status: "unpaid_leave" as AttendanceDayStatus, label: "Perm. Personal",  color: "text-amber-600" },
            { status: "holiday"      as AttendanceDayStatus, label: "Feriado",         color: "text-teal-500" },
            { status: "rest_day"     as AttendanceDayStatus, label: "Descanso",        color: "text-slate-500" },
            { status: "incomplete"   as AttendanceDayStatus, label: "Incompleta",      color: "text-orange-500" },
          ]).map(({ status, label }) => (
            <div key={status} className="flex items-center gap-1 bg-background border border-border px-2 py-0.5 rounded-md shadow-sm">
              <span className={`size-2 rounded-full ${STATUS_CHIP_COLORS[status].split(" ").find(c => c.startsWith("bg-")) ?? "bg-muted"}`} />
              <span className="text-[10px] font-medium text-foreground">{label}</span>
            </div>
          ))}
        </div>
        {/* Navigation */}
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

      {/* ── Calendar Grid ── */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Day-name headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAY_NAMES.map((d, i) => (
            <div key={d} className={`text-center text-[11px] font-bold py-2 uppercase tracking-wider ${i >= 5 ? "text-rose-500/70" : "text-muted-foreground"}`}>
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-[1px] bg-border/40 rounded-xl overflow-hidden border border-border/40 flex-1">
          {calendarDays.map((day, idx) => {
            if (!day) return <div key={`e-${idx}`} className="bg-muted/10 min-h-[120px]" />;
            const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isSelected = dateStr === toYMD(activeDate);
            const isToday  = dateStr === todayStr;
            const record = recordMap.get(dateStr);
            const restType = restDayMap.get(dateStr);
            const isHoliday = holidaySet.has(dateStr);
            const holidayName = holidayNames.get(dateStr);
            const isWeekend = idx % 7 === 5 || idx % 7 === 6;

            const status = record ? normalizeAttendanceStatus(record as unknown as Record<string, unknown>) : null;
            const chipClass = status ? (STATUS_CHIP_COLORS[status] ?? STATUS_CHIP_COLORS.unknown) : null;
            const checkIn  = record ? getRecordCheckTime(record, "in")  : null;
            const checkOut = record ? getRecordCheckTime(record, "out") : null;

            return (
              <div 
                key={dateStr} 
                onClick={() => handleDayClick(day)}
                className={`bg-card min-h-[120px] p-2 flex flex-col gap-1 cursor-pointer transition-colors hover:bg-muted/30 group relative ${isToday ? "ring-2 ring-inset ring-primary bg-primary/5" : ""} ${isSelected && !isToday ? "ring-1 ring-inset ring-border bg-muted/20" : ""} ${isHoliday && !isSelected ? "bg-rose-50/50 dark:bg-rose-950/10" : ""}`}
              >
                <div className={`text-xs font-semibold self-end mb-1 ${isToday ? "text-primary bg-primary/10 px-2 py-0.5 rounded-full" : isHoliday ? "text-rose-500" : isWeekend ? "text-muted-foreground/70" : "text-muted-foreground"}`}>
                  {day}
                </div>
                
                {/* Content */}
                <div className="flex flex-col flex-1 w-full mt-1 justify-between gap-2">
                  <div className="flex flex-col gap-1 w-full">
                    {/* Attendance status chip */}
                    {chipClass && (
                      <div className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border w-full text-center truncate", chipClass)}>
                        {record ? getRecordStatusLabel(record, status!) : "N/A"}
                      </div>
                    )}
                    {record && (() => {
                      const indicator = getSalaryIndicator(record, status!);
                      if (!indicator) return null;
                      const badgeStyle = indicator === "Percibe"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                        : "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20";
                      return (
                        <div className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border mt-1 text-center truncate", badgeStyle)}>
                          {indicator}
                        </div>
                      );
                    })()}
                    {record && <PaymentTypeBadge paymentType={record.paymentType || record.payment_type} />}

                    {/* Rest-day badge */}
                    {restType && status !== "rest_day" && (
                      <div className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 mt-0.5 text-center truncate">
                        Descanso
                      </div>
                    )}

                    {/* Holiday badge */}
                    {isHoliday && (
                      <div className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-rose-400 text-rose-950 mt-0.5 text-center truncate" title={holidayName}>
                        Feriado
                      </div>
                    )}
                  </div>

                  {/* Checkin / Checkout times */}
                  <div className="flex flex-col gap-0.5 mt-auto w-full">
                    {checkIn ? (
                      <div className="text-[9px] sm:text-[10px] text-emerald-600 dark:text-emerald-400 font-medium truncate flex items-center justify-between bg-emerald-500/5 px-1 rounded">
                        <span className="opacity-70">In</span>
                        <span>{formatTime(checkIn)}</span>
                      </div>
                    ) : (
                       <div className="h-4"></div>
                    )}
                    {checkOut ? (
                      <div className="text-[9px] sm:text-[10px] text-indigo-600 dark:text-indigo-400 font-medium truncate flex items-center justify-between bg-indigo-500/5 px-1 rounded">
                        <span className="opacity-70">Out</span>
                        <span>{formatTime(checkOut)}</span>
                      </div>
                    ) : (
                       <div className="h-4"></div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
