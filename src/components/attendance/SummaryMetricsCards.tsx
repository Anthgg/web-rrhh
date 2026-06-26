import {
  Clock,
  TrendingUp,
  AlertCircle,
  DollarSign,
  Zap,
  UserX,
  Timer,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatTimeDuration, formatMinutes, formatCurrency } from "@/lib/utils/attendance";

interface Totals {
  expected: number;
  worked: number;
  effectiveWorked: number;
  lateMinutes: number;
  absentDays: number;
  discounts: number;
  overtimeHours: number;
  ordinaryEarnings: number;
  overtimeEarnings: number;
  totalEarnings: number;
}

interface SummaryMetricsCardsProps {
  totals: Totals;
}

export function SummaryMetricsCards({ totals }: SummaryMetricsCardsProps) {
  const metrics = [
    {
      label: "Horas trabajadas",
      value: formatTimeDuration(totals.worked),
      sub: `Esperadas: ${formatTimeDuration(totals.expected)}`,
      icon: Clock,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Horas efectivas",
      value: formatTimeDuration(totals.effectiveWorked),
      sub: totals.overtimeHours > 0
        ? `H. Extra: +${formatTimeDuration(totals.overtimeHours)}`
        : "Horas efectivas registradas",
      icon: TrendingUp,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
    },
    {
      label: "Tardanzas acumuladas",
      value: formatMinutes(totals.lateMinutes),
      sub: "Minutos de retraso",
      icon: Timer,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: "Faltas",
      value: `${totals.absentDays}`,
      sub: "Días sin asistencia",
      icon: UserX,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
    {
      label: "Descuento estimado",
      value: formatCurrency(totals.discounts),
      sub: "Calculado por el backend",
      icon: AlertCircle,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
    {
      label: "Ingreso regular",
      value: formatCurrency(totals.ordinaryEarnings),
      sub: "Horas ordinarias efectivas",
      icon: DollarSign,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Horas extra (2×)",
      value: formatCurrency(totals.overtimeEarnings),
      sub: "Pago doble de horas extra",
      icon: Zap,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      highlight: totals.overtimeEarnings > 0,
    },
    {
      label: "Planilla estimada",
      value: formatCurrency(totals.totalEarnings),
      sub: "Regular + horas extra",
      icon: DollarSign,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      gradient: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((m) => {
        const Icon = m.icon;
        return (
          <Card
            key={m.label}
            className={`border-border bg-card/80 p-4 shadow-sm transition hover:shadow-md ${
              m.gradient ? "bg-gradient-to-br from-indigo-500/5 to-primary/5" : ""
            } ${m.highlight ? "border-l-2 border-l-amber-400" : ""}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground">{m.label}</p>
                <p className={`mt-1.5 text-xl font-bold ${m.gradient ? "text-indigo-600 dark:text-indigo-400" : "text-foreground"}`}>
                  {m.value}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{m.sub}</p>
              </div>
              <div className={`shrink-0 rounded-xl p-2.5 ${m.bg} ${m.color}`}>
                <Icon className="size-4" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
