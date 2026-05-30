"use client";

import { DatabaseZap, LayoutTemplate, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import type { UserRole } from "@/types";
import type { RequestStats } from "@/types/requests";

import { RequestStatsCards } from "@/components/requests/RequestStatsCards";

interface RequestsLayoutProps {
  role: UserRole;
  stats: RequestStats;
  isStatsLoading?: boolean;
  action?: React.ReactNode;
  children: React.ReactNode;
}

function getHeroDescription(role: UserRole) {
  if (role === "admin" || role === "super_admin" || role === "hr" || role === "supervisor") {
    return "Revisa solicitudes de toda la empresa, filtra pendientes, responde observaciones y exporta reportes con trazabilidad operativa.";
  }

  return "Gestiona permisos, descansos medicos, vacaciones, justificaciones y otros requerimientos laborales desde un flujo unificado.";
}

export function RequestsLayout({
  role,
  stats,
  isStatsLoading = false,
  action,
  children,
}: RequestsLayoutProps) {
  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Centro de solicitudes"
        title="Solicitudes"
        description="Gestiona permisos, descansos medicos, vacaciones, justificaciones y otros requerimientos laborales."
        action={action}
      />

      <Card className="relative overflow-hidden p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(15,118,110,0.18),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.1),transparent_26%)]" />
        <div className="relative grid gap-5 xl:grid-cols-[1.5fr_1fr] xl:items-center">
          <div className="grid gap-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand shadow-sm ring-1 ring-white/80">
              <DatabaseZap className="size-3.5" />
              Integrado con API real
            </div>
            <div className="grid gap-2">
              <h2 className="section-title text-2xl font-semibold text-ink md:text-3xl">
                Flujo unificado para solicitudes, revision operativa y seguimiento documental
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-ink-soft">{getHeroDescription(role)}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm text-ink">
                <ShieldCheck className="size-4 text-brand" />
                Acciones visibles segun rol y estado
              </div>
              <div className="inline-flex items-center gap-2 rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm text-ink">
                <LayoutTemplate className="size-4 text-sky-600" />
                Reportes, detalle, adjuntos y plantillas en el mismo modulo
              </div>
            </div>
          </div>

          <div className="grid gap-4 rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-[0_28px_60px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
                  Estado operativo
                </p>
                <h3 className="mt-1 text-lg font-semibold text-ink">Resumen del modulo</h3>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                En linea
              </span>
            </div>

            <div className="grid gap-3 text-sm leading-6 text-ink-soft">
              <p>
                Usa la navegacion lateral del modulo para crear solicitudes, revisar pendientes,
                exportar reportes y descargar plantillas publicadas.
              </p>
              <p>
                Las tarjetas superiores reflejan el estado agregado del flujo actual y se refrescan
                cuando cambian las operaciones principales.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <RequestStatsCards stats={stats} isLoading={isStatsLoading} />

      <div className="min-w-0">{children}</div>
    </div>
  );
}
