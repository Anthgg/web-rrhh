import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  BellRing,
  ClockAlert,
  Info,
  Gift,
  Check,
} from "lucide-react";

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { dashboardService } from "@/services/dashboard.service";
import type { BirthdayWorker } from "@/types";

export interface DashboardAlert {
  type: string;
  severity: "info" | "warning" | "critical";
  total: number;
  message: string;
  targetUserId?: string;
}

const severityMap = {
  info: "bg-sky-50 text-sky-700 ring-sky-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  critical: "bg-rose-50 text-rose-700 ring-rose-200",
};

// Default estable a nivel de módulo
const EMPTY_BIRTHDAYS: BirthdayWorker[] = [];

function BirthdayGreetButton({
  targetUserId,
  workerName,
}: {
  targetUserId: string;
  workerName?: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleGreet = async () => {
    if (isLoading || isSent) return;
    setIsLoading(true);

    try {
      const response = await dashboardService.sendBirthdayGreeting(targetUserId);
      setIsSent(true);
      toast.success(response.message || `Saludo enviado a ${workerName ?? "este usuario"}.`);
    } catch {
      toast.error("Hubo un error al enviar el saludo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button type="button"
      onClick={handleGreet}
      disabled={isLoading || isSent}
      className={`mt-2 flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors sm:mt-0 ${
        isSent
          ? "cursor-not-allowed bg-emerald-100 text-emerald-700"
          : "bg-brand text-white hover:bg-brand/90 disabled:opacity-50"
      }`}
    >
      {isSent ? (
        <>
          <Check className="size-4" />
          Enviado
        </>
      ) : (
        <>
          <Gift className="size-4" />
          {isLoading ? "Enviando..." : "Saludar"}
        </>
      )}
    </button>
  );
}

export function NotificationPanel({
  alerts,
  birthdays = EMPTY_BIRTHDAYS,
}: {
  alerts: DashboardAlert[];
  birthdays?: BirthdayWorker[];
}) {
  const birthdayUserNames = useMemo(
    () => new Map(birthdays.map((worker) => [worker.id, worker.fullName])),
    [birthdays],
  );

  return (
    <DashboardCard className="grid gap-5">
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-1">
          <h2 className="section-title text-2xl font-semibold text-ink">Notificaciones</h2>
          <p className="text-sm text-ink-soft">Eventos importantes del control de asistencia.</p>
        </div>
        <div className="rounded-2xl bg-brand-soft p-3 text-brand">
          <BellRing className="size-5" />
        </div>
      </div>

      <div className="grid gap-3">
        {alerts.length === 0 ? (
          <p className="text-sm text-ink-soft">No hay notificaciones en este momento.</p>
        ) : (
          alerts.map((alert, idx) => {
            const normalizedType = alert.type.toLowerCase();
            const isBirthday =
              normalizedType.includes("birthday") || normalizedType.includes("cumple");
            const Icon = isBirthday
              ? Gift
              : alert.severity === "critical"
                ? ClockAlert
                : alert.severity === "warning"
                  ? AlertTriangle
                  : Info;

            return (
              <article
                key={idx}
                className="grid gap-3 rounded-3xl border border-border bg-white p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center"
              >
                <div className={`w-fit rounded-2xl p-3 ring-1 ${severityMap[alert.severity]}`}>
                  <Icon className="size-4" />
                </div>

                <div className="grid gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-sm font-semibold text-ink">
                      {alert.type.replace(/_/g, " ").toUpperCase()}
                    </strong>
                    {alert.total > 1 && (
                      <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-ink-soft">
                        Total: {alert.total}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-ink-soft">{alert.message}</p>
                </div>

                {isBirthday && alert.targetUserId && (
                  <div className="flex justify-start sm:justify-end">
                    <BirthdayGreetButton
                      targetUserId={alert.targetUserId}
                      workerName={birthdayUserNames.get(alert.targetUserId)}
                    />
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </DashboardCard>
  );
}
