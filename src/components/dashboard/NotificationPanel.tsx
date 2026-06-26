"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  BellRing,
  Check,
  ChevronRight,
  ClockAlert,
  Gift,
  Info,
} from "lucide-react";

import { Panel, SectionHeading, Pill } from "@/components/dashboard/primitives";
import { priorityTone, tone } from "@/components/dashboard/_tokens";
import { dashboardService } from "@/services/dashboard.service";
import { cn } from "@/lib/utils/cn";
import type { BirthdayWorker } from "@/types";

export interface DashboardAlert {
  type: string;
  severity: "info" | "warning" | "critical";
  total: number;
  message: string;
  targetUserId?: string;
}

const EMPTY_BIRTHDAYS: BirthdayWorker[] = [];

/** Severidad del backend → prioridad de UI. */
function severityToPriority(severity: DashboardAlert["severity"]): "high" | "medium" | "low" {
  if (severity === "critical") return "high";
  if (severity === "warning") return "medium";
  return "low";
}

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
    <button
      type="button"
      onClick={handleGreet}
      disabled={isLoading || isSent}
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
        isSent
          ? "cursor-not-allowed bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50",
      )}
    >
      {isSent ? (
        <>
          <Check className="size-3.5" /> Enviado
        </>
      ) : (
        <>
          <Gift className="size-3.5" /> {isLoading ? "Enviando…" : "Saludar"}
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

  // Las críticas primero para que RRHH vea lo urgente sin scroll.
  const ordered = useMemo(() => {
    const weight = { critical: 0, warning: 1, info: 2 } as const;
    return [...alerts].sort((a, b) => weight[a.severity] - weight[b.severity]);
  }, [alerts]);

  const criticalCount = alerts.filter((alert) => alert.severity === "critical").length;

  return (
    <Panel className="grid h-full content-start gap-4">
      <SectionHeading
        title="Notificaciones"
        subtitle="Pendientes y alertas que requieren acción"
        icon={BellRing}
        iconTone="info"
        action={
          criticalCount > 0 ? (
            <Pill tone="absent">{criticalCount} críticas</Pill>
          ) : (
            <Pill tone="present">Al día</Pill>
          )
        }
      />

      {ordered.length === 0 ? (
        <div className="grid place-items-center gap-2 rounded-xl border border-dashed border-border bg-background px-4 py-10 text-center">
          <span className="grid size-11 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Check className="size-5" />
          </span>
          <p className="text-sm font-semibold text-foreground">Todo en orden</p>
          <p className="text-sm text-muted-foreground">No hay alertas pendientes en este momento.</p>
        </div>
      ) : (
        <div className="grid gap-2.5">
          {ordered.map((alert, index) => {
            const normalizedType = alert.type.toLowerCase();
            const isBirthday =
              normalizedType.includes("birthday") || normalizedType.includes("cumple");
            const priority = severityToPriority(alert.severity);
            const meta = priorityTone[priority];
            const Icon = isBirthday
              ? Gift
              : alert.severity === "critical"
                ? ClockAlert
                : alert.severity === "warning"
                  ? AlertTriangle
                  : Info;

            return (
              <article
                key={`${alert.type}-${index}`}
                className="grid grid-cols-[auto_1fr] gap-3 rounded-xl border border-border bg-background p-3"
              >
                <span className={cn("grid size-9 place-items-center rounded-lg", tone[meta.tone].icon)}>
                  <Icon className="size-4" />
                </span>

                <div className="min-w-0 grid gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={meta.tone}>{meta.label}</Pill>
                    <strong className="text-sm font-semibold text-foreground">
                      {alert.type.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
                    </strong>
                    {alert.total > 1 ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
                        {alert.total}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>

                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    {isBirthday && alert.targetUserId ? (
                      <BirthdayGreetButton
                        targetUserId={alert.targetUserId}
                        workerName={birthdayUserNames.get(alert.targetUserId)}
                      />
                    ) : (
                      <Link
                        href="/dashboard/requests/pending"
                        className="inline-flex w-fit items-center gap-1 text-xs font-semibold text-primary transition hover:gap-1.5"
                      >
                        Revisar
                        <ChevronRight className="size-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
