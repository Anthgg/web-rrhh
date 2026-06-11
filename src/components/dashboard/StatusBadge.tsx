import type { AttendanceDashboardStatus } from "@/types";
import { cn } from "@/lib/utils/cn";

const statusMap: Record<AttendanceDashboardStatus, { label: string; className: string }> = {
 present: {
 label: "Asistio",
 className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
 },
 late: {
 label: "Tarde",
 className: "bg-amber-50 text-amber-700 ring-amber-200",
 },
 absent: {
 label: "Ausente",
 className: "bg-rose-50 text-rose-700 ring-rose-200",
 },
 "pending-checkout": {
 label: "Salida pendiente",
 className: "bg-sky-50 text-sky-700 ring-sky-200",
 },
 completed: {
 label: "Jornada completada",
 className: "bg-teal-50 text-teal-700 ring-teal-200",
 },
};

export function StatusBadge({ status }: { status: AttendanceDashboardStatus | string }) {
 const config = statusMap[status as AttendanceDashboardStatus] || {
 label: status || "Desconocido",
 className: "bg-muted text-foreground ring-slate-200",
 };

 return (
 <span
 className={cn(
 "inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ring-1",
 config.className,
 )}
 >
 {config.label}
 </span>
 );
}
