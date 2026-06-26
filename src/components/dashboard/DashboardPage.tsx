"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Users } from "lucide-react";

import { AttendanceSummaryCards } from "@/components/dashboard/AttendanceSummaryCards";
import { BirthdaysWidget } from "@/components/dashboard/BirthdaysWidget";
import { DailyWorkedHoursSection } from "@/components/dashboard/DailyWorkedHoursSection";
import { NotificationPanel } from "@/components/dashboard/NotificationPanel";
import { OperationalSummaryCard } from "@/components/dashboard/OperationalSummaryCard";
import { QuickActionsCard } from "@/components/dashboard/QuickActionsCard";
import { WelcomeHeader } from "@/components/dashboard/WelcomeHeader";
import { WorkerStatusTable } from "@/components/dashboard/WorkerStatusTable";
import { SectionHeading } from "@/components/dashboard/primitives";
import { ErrorState, LoadingPanel } from "@/components/shared/states";
import { DownloadPdfButton } from "@/components/reports/DownloadPdfButton";
import { useSession } from "@/features/auth/auth-provider";
import { apiClient } from "@/lib/api/client";
import { webApiEndpoints } from "@/lib/api/endpoints";
import { isAdminRequestManager } from "@/lib/utils/requests";
import { dashboardService } from "@/services/dashboard.service";
import type { PaginatedRequestsResponse } from "@/types/requests";

function localTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function DashboardPage() {
  const queryClient = useQueryClient();
  const { user } = useSession();
  const canManageRequests = isAdminRequestManager(user?.role);

  const {
    data: dashboard,
    isError: isDashboardError,
    isLoading: isDashboardLoading,
    refetch: refetchDashboard,
  } = useQuery({
    queryKey: ["admin-attendance-dashboard"],
    queryFn: dashboardService.getAdminAttendanceDashboard,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    // El backend limita peticiones (429) cuando llegan en ráfaga; reintentar con
    // backoff recupera summary / attendance-today / daily-status-list sin dejar
    // la tabla y los KPIs vacíos.
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  });

  // Reutiliza exactamente la misma queryKey que el sidebar para que React Query
  // deduplique la llamada en lugar de disparar una segunda idéntica.
  const { data: pendingRequestsData } = useQuery({
    queryKey: ["sidebar-pending-requests"],
    queryFn: () =>
      apiClient<PaginatedRequestsResponse>(webApiEndpoints.requests.pending, {
        query: { page: 1, pageSize: 1, status: "pending", sortBy: "newest", softFail: 1 },
      }),
    enabled: Boolean(user && canManageRequests),
    retry: false,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (dashboard?._partialFailure) {
      toast.warning(
        "Algunos datos del dashboard no se pudieron cargar. Se muestran los disponibles.",
        { duration: 6000 },
      );
    }
  }, [dashboard]);

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

  const todayStr = localTodayKey();
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["admin-attendance-dashboard"] });

  return (
    <div className="grid gap-5">
      {/* 1 · Header compacto con pulso operativo */}
      <WelcomeHeader user={dashboard.user} summary={dashboard.summary} />

      {/* 2 · KPIs principales */}
      <AttendanceSummaryCards summary={dashboard.summary} />

      {/* 3 · Operación del día: tabla (prioridad) + notificaciones */}
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] xl:items-start">
        <div className="grid gap-4">
          <SectionHeading
            title="Estado de trabajadores hoy"
            subtitle="Marcaciones, entrada, salida y estado operativo"
            icon={Users}
            iconTone="present"
            action={
              <DownloadPdfButton
                reportType="attendance"
                filters={{ start_date: todayStr, end_date: todayStr }}
                variant="secondary"
                className="h-10 rounded-xl"
              >
                Exportar hoy
              </DownloadPdfButton>
            }
          />
          <WorkerStatusTable
            workers={dashboard.dailyStatusList}
            authorizedBy={dashboard.user.fullName}
            onOvertimeSuccess={refresh}
            onRefresh={refresh}
          />
        </div>

        <NotificationPanel alerts={dashboard.alerts} birthdays={dashboard.birthdays} />
      </section>

      {/* 4 · Análisis: gráfico de horas + resumen operativo */}
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] xl:items-start">
        <DailyWorkedHoursSection weeklyChart={dashboard.weeklyChart} />
        <OperationalSummaryCard
          summary={dashboard.summary}
          workers={dashboard.dailyStatusList}
          pendingRequests={canManageRequests ? pendingRequestsData?.total : undefined}
        />
      </section>

      {/* 5 · Secundario: cumpleaños compactos + acciones rápidas */}
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:items-start">
        <BirthdaysWidget birthdays={dashboard.birthdays} />
        <QuickActionsCard />
      </section>
    </div>
  );
}
