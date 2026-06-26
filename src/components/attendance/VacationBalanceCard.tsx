"use client";

import { CalendarCheck, CalendarClock, CalendarX, CalendarDays, Loader2, AlertCircle, CalendarRange } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { VacationBalance } from "@/types/schedule";

interface VacationBalanceCardProps {
  balance?: VacationBalance | null;
  isLoading?: boolean;
  isError?: boolean;
  /** If true, shows a more compact layout suitable for inside a form */
  compact?: boolean;
}

function formatValue(val: number | undefined | null): string {
  if (val === undefined || val === null) return "0";
  return parseFloat(val.toFixed(2)).toString();
}

function formatDailyAccrual(val: number | undefined | null): string {
  if (val === undefined || val === null) return "0";
  return parseFloat(val.toFixed(4)).toString();
}

function formatDateLocalString(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const onlyDate = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const parts = onlyDate.split("-");
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

function StatCell({
  label,
  value,
  icon: Icon,
  color,
  bg,
  highlight,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-1 rounded-2xl border p-3 ${
        highlight
          ? "border-blue-500/40 bg-blue-500/8"
          : "border-border bg-card/80"
      }`}
    >
      <div className={`flex size-8 items-center justify-center rounded-xl ${bg} ${color}`}>
        <Icon className="size-3.5" />
      </div>
      <p className={`mt-1 text-lg font-bold ${highlight ? "text-blue-700 dark:text-blue-400" : "text-foreground"}`}>
        {value}
        <span className="ml-1 text-xs font-normal text-muted-foreground">días</span>
      </p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

/**
 * Displays the vacation balance with separate counters for generated, used,
 * reserved (pending approval), and available days.
 *
 * Per spec: vacations pending approval appear as reservedDays — they do NOT
 * change attendance status until the request is APPROVED.
 */
export function VacationBalanceCard({
  balance,
  isLoading,
  isError,
  compact = false,
}: VacationBalanceCardProps) {
  if (isLoading) {
    return (
      <Card className="flex items-center justify-center gap-2 p-5 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Cargando saldo vacacional…
      </Card>
    );
  }

  if (isError || !balance) {
    return (
      <Card className="flex items-center gap-2 rounded-2xl border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400">
        <AlertCircle className="size-4 shrink-0" />
        No se pudo cargar el saldo vacacional.
      </Card>
    );
  }

  const cells = [
    {
      label: "Generados",
      value: formatValue(balance.generatedDays),
      icon: CalendarCheck,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/15",
    },
    {
      label: "Usados",
      value: formatValue(balance.usedDays),
      icon: CalendarX,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-500/15",
    },
    {
      label: "Reservados",
      value: formatValue(balance.reservedDays),
      icon: CalendarClock,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/15",
    },
    {
      label: "Disponibles",
      value: formatValue(balance.availableDays),
      icon: CalendarDays,
      color: balance.availableDays < 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400",
      bg: balance.availableDays < 0 ? "bg-rose-500/15" : "bg-emerald-500/15",
      highlight: true,
    },
  ];

  return (
    <Card className={`${compact ? "p-4" : "p-5"} space-y-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
            <CalendarDays className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Saldo vacacional</p>
            {balance.nextAccrualDate && (
              <p className="text-[11px] text-muted-foreground">
                Próxima acumulación: {formatDateLocalString(balance.nextAccrualDate)}
              </p>
            )}
          </div>
        </div>
        {/* Pending days / Revision status */}
        {balance.pendingDays > 0 && (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 shrink-0">
            {formatValue(balance.pendingDays)} en revisión
          </span>
        )}
      </div>

      {/* Negative Balance Alert */}
      {balance.availableDays < 0 && (
        <div className="flex items-start gap-2.5 rounded-xl border border-blue-500/20 bg-blue-500/10 px-3.5 py-2.5 text-xs text-blue-800 dark:text-blue-300">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <span>
            Este trabajador tiene {formatValue(Math.abs(balance.availableDays))} días de vacaciones adelantadas.
          </span>
        </div>
      )}

      {/* Stat Grid */}
      <div className={`grid gap-2.5 ${compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}>
        {cells.map((c) => (
          <StatCell key={c.label} {...c} />
        ))}
      </div>

      {/* Accrual and anniversary detailed bottom section */}
      <div className="grid gap-3 border-t border-border/60 pt-3.5 text-xs sm:grid-cols-2 text-muted-foreground">
        <div className="space-y-1.5">
          <p className="flex items-center justify-between sm:justify-start gap-2">
            <span>Acumulación mensual:</span>
            <strong className="text-foreground">{formatValue(balance.monthlyAccrualRate)} días</strong>
          </p>
          <p className="flex items-center justify-between sm:justify-start gap-2">
            <span>Acumulación diaria:</span>
            <strong className="text-foreground">≈ {formatDailyAccrual(balance.dailyAccrualRate)} días</strong>
          </p>
        </div>
        <div className="space-y-1.5">
          {balance.nextAccrualDate && (
            <p className="flex items-center justify-between sm:justify-start gap-2">
              <span>Próximo incremento:</span>
              <strong className="text-foreground">{formatDateLocalString(balance.nextAccrualDate)}</strong>
            </p>
          )}
          {balance.nextServiceAnniversary && (
            <p className="flex items-center justify-between sm:justify-start gap-2">
              <span>Aniversario laboral:</span>
              <strong className="text-foreground">{formatDateLocalString(balance.nextServiceAnniversary)}</strong>
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
