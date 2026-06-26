import {
  Clock,
  TrendingUp,
  Timer,
  UserX,
  AlertCircle,
  DollarSign,
  Zap,
  Wallet,
  CalendarCheck,
  Coffee,
  type LucideIcon
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatTimeDuration, formatMinutes, formatCurrency } from "@/lib/utils/attendance";
import type { WorkerAttendanceSummary } from "@/types/schedule";

interface WorkerPayrollMetricsProps {
  worker: WorkerAttendanceSummary;
}

export function WorkerPayrollMetrics({ worker }: WorkerPayrollMetricsProps) {
  type MetricCard = {
    label: string;
    value: string;
    sub: string;
    icon: LucideIcon;
    color: string;
    bg: string;
    gradient?: boolean;
    highlight?: boolean;
  };

  const sections: { title: string; cards: MetricCard[] }[] = [
    {
      title: "Pago",
      cards: [
        {
          label: "Sueldo Base",
          value: worker.base_salary ? formatCurrency(worker.base_salary) : "—",
          sub: "Sueldo de alta",
          icon: Wallet,
          color: "text-primary",
          bg: "bg-primary/10",
        },
        {
          label: "Ingreso Regular",
          value: formatCurrency(worker.ordinary_earnings),
          sub: "Horas ordinarias",
          icon: DollarSign,
          color: "text-emerald-500",
          bg: "bg-emerald-500/10",
        },
        {
          label: "Ingreso Extra (2×)",
          value: worker.overtime_earnings > 0 ? formatCurrency(worker.overtime_earnings) : "—",
          sub: "Pago doble",
          icon: Zap,
          color: "text-amber-500",
          bg: "bg-amber-500/10",
        },
        {
          label: "Pago Feriados (S/)",
          value: worker.holiday_earnings && worker.holiday_earnings > 0 ? formatCurrency(worker.holiday_earnings) : "—",
          sub: "Feriados trabajados",
          icon: Zap,
          color: "text-amber-500",
          bg: "bg-amber-500/10",
        },
        {
          label: "Desc. Inasistencia",
          value: worker.absence_discount && worker.absence_discount > 0 ? formatCurrency(worker.absence_discount) : "—",
          sub: "Faltas y penalidades",
          icon: AlertCircle,
          color: "text-rose-500",
          bg: "bg-rose-500/10",
        },
        {
          label: "Desc. Tardanza",
          value: worker.late_discount && worker.late_discount > 0 ? formatCurrency(worker.late_discount) : "—",
          sub: "Minutos de retraso",
          icon: AlertCircle,
          color: "text-rose-500",
          bg: "bg-rose-500/10",
        },
        {
          label: "Total Generado",
          value: formatCurrency(worker.total_earnings),
          sub: "Regular + extra",
          icon: DollarSign,
          color: "text-indigo-500",
          bg: "bg-indigo-500/10",
          gradient: true,
        },
      ]
    },
    {
      title: "Tiempo",
      cards: [
        {
          label: "H. Esperadas",
          value: formatTimeDuration(worker.expected_hours),
          sub: "Del periodo",
          icon: CalendarCheck,
          color: "text-blue-500",
          bg: "bg-blue-500/10",
        },
        {
          label: "H. Trabajadas",
          value: formatTimeDuration(worker.worked_hours),
          sub: "Tiempo fichado",
          icon: Clock,
          color: "text-primary",
          bg: "bg-primary/10",
        },
        {
          label: "H. Efectivas",
          value: formatTimeDuration(worker.effective_worked_hours),
          sub: "Sin pausas",
          icon: TrendingUp,
          color: "text-indigo-500",
          bg: "bg-indigo-500/10",
        },
        {
          label: "H. Extra",
          value: worker.overtime_hours > 0 ? `+${formatTimeDuration(worker.overtime_hours)}` : "—",
          sub: "Por encima del turno",
          icon: Zap,
          color: "text-amber-500",
          bg: "bg-amber-500/10",
          highlight: worker.overtime_hours > 0,
        },
      ]
    },
    {
      title: "Incidencias",
      cards: [
        {
          label: "Faltas",
          value: `${worker.absent_days}`,
          sub: "Días sin asistencia injustificada",
          icon: UserX,
          color: "text-rose-500",
          bg: "bg-rose-500/10",
        },
        {
          label: "Tardanzas",
          value: formatMinutes(worker.late_minutes),
          sub: "Min. de retraso",
          icon: Timer,
          color: "text-amber-600",
          bg: "bg-amber-500/10",
        },
        {
          label: "Descansos",
          value: `${worker.records.filter(r => (r as unknown as Record<string,unknown>).status === "rest_day").length}`,
          sub: "Días no laborales",
          icon: Coffee,
          color: "text-slate-500",
          bg: "bg-slate-500/10",
        },
        {
          label: "Días Feriados",
          value: worker.holiday_worked_days && worker.holiday_worked_days > 0 ? `${worker.holiday_worked_days}` : "—",
          sub: "Trabajados en feriado",
          icon: CalendarCheck,
          color: "text-amber-500",
          bg: "bg-amber-500/10",
        },
      ]
    },
    {
      title: "Ausencias justificadas",
      cards: [
        {
          label: "Vacaciones",
          value: `${worker.vacation_days ?? 0}`,
          sub: "Días de vacaciones aprobadas",
          icon: CalendarCheck,
          color: "text-blue-600",
          bg: "bg-blue-500/10",
        },
        {
          label: "Descanso Médico",
          value: `${worker.medical_leave_days ?? 0}`,
          sub: "Días con descanso médico",
          icon: AlertCircle,
          color: "text-purple-600",
          bg: "bg-purple-500/10",
        },
        {
          label: "Perm. Personal",
          value: `${worker.permission_unpaid_days ?? 0}`,
          sub: "Permiso sin goce aprobado",
          icon: UserX,
          color: "text-amber-700",
          bg: "bg-amber-600/10",
        },
        ...(worker.unpaid_permission_discount && worker.unpaid_permission_discount > 0 ? [{
          label: "Desc. Perm. s/goce",
          value: formatCurrency(worker.unpaid_permission_discount),
          sub: "Descuento por permiso s/goce",
          icon: AlertCircle,
          color: "text-amber-700",
          bg: "bg-amber-600/10",
        }] : []),
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.title} className="space-y-3">
          <h3 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground ml-1">
            {section.title}
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {section.cards.map((c) => {
              const Icon = c.icon;
              return (
                <Card
                  key={c.label}
                  className={`border border-border/60 bg-card p-4 shadow-sm transition hover:shadow-md ${
                    c.gradient ? "bg-gradient-to-br from-indigo-500/5 to-primary/5" : ""
                  } ${c.highlight ? "border-l-2 border-l-amber-400" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] text-muted-foreground">{c.label}</p>
                      <p className={`mt-1 text-lg font-bold leading-tight ${c.gradient ? "text-indigo-600 dark:text-indigo-400" : "text-foreground"}`}>
                        {c.value}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{c.sub}</p>
                    </div>
                    <div className={`shrink-0 rounded-xl p-2 ${c.bg} ${c.color}`}>
                      <Icon className="size-3.5" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
