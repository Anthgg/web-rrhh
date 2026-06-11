import { AlarmClock, BellRing, UserCheck, UsersRound } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/DashboardCard";

export function AttendanceSummaryCards({
 summary,
}: {
 summary: {
 activeWorkers: number;
 totalRecords: number;
 totalLate: number;
 fakeGpsAlerts: number;
 };
}) {
 const cards = [
 {
 key: "activeWorkers",
 label: "Total Empleados",
 value: summary.activeWorkers,
 accent: "text-foreground bg-muted",
 icon: UsersRound,
 },
 {
 key: "totalRecords",
 label: "Asistencias Hoy",
 value: summary.totalRecords,
 accent: "text-emerald-700 bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400",
 icon: UserCheck,
 },
 {
 key: "totalLate",
 label: "Tardanzas Hoy",
 value: summary.totalLate,
 accent: "text-orange-700 bg-orange-100 dark:bg-orange-500/10 dark:text-orange-400",
 icon: AlarmClock,
 },
 {
 key: "fakeGpsAlerts",
 label: "Alertas GPS",
 value: summary.fakeGpsAlerts,
 accent: "text-destructive bg-destructive/10",
 icon: BellRing,
 },
 ];

 return (
 <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
 {cards.map((item, index) => {
 const Icon = item.icon;

 return (
 <DashboardCard
 key={item.key}
 className="grid gap-4"
 style={{ animationDelay: `${index * 45}ms` } as React.CSSProperties}
 >
 <div className="flex items-start justify-between gap-4">
 <div className={`rounded-2xl p-3 ${item.accent}`}>
 <Icon className="size-5" />
 </div>
 <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
 Hoy
 </span>
 </div>
 <div className="grid gap-1">
 <strong className="section-title text-3xl font-semibold text-foreground">
 {item.value}
 </strong>
 <span className="text-sm text-muted-foreground">{item.label}</span>
 </div>
 </DashboardCard>
 );
 })}
 </section>
 );
}

