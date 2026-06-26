import { cn } from "@/lib/utils/cn";

const statusMap: Record<string, { label: string; className: string }> = {
  present: {
    label: "Asistió",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  },
  late: {
    label: "Tarde",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
  },
  absent: {
    label: "Ausente",
    className: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
  },
  "pending-checkout": {
    label: "Salida pendiente",
    className: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20",
  },
  completed: {
    label: "Jornada completada",
    className: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20",
  },
  incomplete: {
    label: "Incompleto",
    className: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20",
  },
  "rest-day": {
    label: "Descanso",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
  },
  "not-scheduled": {
    label: "Sin horario",
    className: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/25",
  },
  pending: {
    label: "Pendiente",
    className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusMap[status] || {
    label: status || "Desconocido",
    className: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/25",
  };

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-[1px]",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
