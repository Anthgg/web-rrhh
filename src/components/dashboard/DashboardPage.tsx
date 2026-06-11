"use client";

import { useQuery } from "@tanstack/react-query";

import { AttendanceSummaryCards } from "@/components/dashboard/AttendanceSummaryCards";
import { BirthdaysWidget } from "@/components/dashboard/BirthdaysWidget";
import { DailyWorkedHoursSection } from "@/components/dashboard/DailyWorkedHoursSection";
import { NotificationPanel } from "@/components/dashboard/NotificationPanel";
import { WelcomeHeader } from "@/components/dashboard/WelcomeHeader";
import { WorkerStatusTable } from "@/components/dashboard/WorkerStatusTable";
import { ErrorState, LoadingPanel } from "@/components/shared/states";
import { DownloadPdfButton } from "@/components/reports/DownloadPdfButton";
import { dashboardService } from "@/services/dashboard.service";

export function DashboardPage() {
 const {
 data: dashboard,
 isError: isDashboardError,
 isLoading: isDashboardLoading,
 refetch: refetchDashboard,
 } = useQuery({
 queryKey: ["admin-attendance-dashboard"],
 queryFn: dashboardService.getAdminAttendanceDashboard,
 });

 if (isDashboardLoading) {
 return <LoadingPanel title="Preparando dashboard de asistencia." />;
 }

 if (isDashboardError || !dashboard) {
 return (
 <ErrorState
 title="No pudimos cargar el dashboard"
 description="Ocurrió un error al obtener los datos del servidor."
 onRetry={() => void refetchDashboard()}
 />
 );
 }

 const todayStr = new Date().toISOString().slice(0, 10);

 return (
 <div className="grid gap-5">
 <WelcomeHeader user={dashboard.user} />
 <AttendanceSummaryCards summary={dashboard.summary} />

 <section className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] xl:items-start">
 <BirthdaysWidget birthdays={dashboard.birthdays} />

 <div className="grid gap-5 self-start">
 <DailyWorkedHoursSection weeklyChart={dashboard.weeklyChart} />
 <NotificationPanel alerts={dashboard.alerts} birthdays={dashboard.birthdays} />
 </div>
 </section>

 <section className="grid gap-5">
 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
 <div className="grid gap-1">
 <h2 className="section-title text-2xl font-semibold text-foreground">Estado de Trabajadores</h2>
 <p className="text-sm text-muted-foreground">
 Lista en vivo del personal y su estado de asistencia de hoy.
 </p>
 </div>
 <DownloadPdfButton
 reportType="attendance"
 filters={{
 start_date: todayStr,
 end_date: todayStr,
 }}
 variant="secondary"
 className="rounded-xl border-border hover:bg-muted self-start sm:self-center"
 >
 Exportar Asistencia Hoy
 </DownloadPdfButton>
 </div>
 <WorkerStatusTable workers={dashboard.dailyStatusList} />
 </section>
 </div>
 );
}
