"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BriefcaseBusiness, Mail, Phone, UserRound } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { ErrorState, LoadingPanel } from "@/components/shared/states";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatRole } from "@/lib/utils/format";
import { workersService } from "@/services/workers.service";
import { WorkerContractsTable } from "@/features/workers/worker-contracts-table";
import { LaborAssignmentForm } from "@/features/workers/labor-assignment-form";
import { isUuid } from "@/lib/api/worker-ids";

interface WorkerProfilePageProps {
  workerId: string;
}

type WorkerProfileTab = "summary" | "contracts" | "labor-assignment";

const profileTabs: Array<{ key: WorkerProfileTab; label: string }> = [
  { key: "summary", label: "Resumen" },
  { key: "contracts", label: "Contratos" },
  { key: "labor-assignment", label: "Asignación Laboral" },
];

export function WorkerProfilePage({ workerId }: WorkerProfilePageProps) {
  const [activeTab, setActiveTab] = useState<WorkerProfileTab>("summary");

  const isValidId = isUuid(workerId);

  const workerQuery = useQuery({
    queryKey: ["worker-detail", workerId],
    queryFn: () => workersService.detail(workerId),
    enabled: isValidId,
  });

  if (!isValidId) {
    return (
      <ErrorState
        title="ID de trabajador no válido"
        description="El perfil del trabajador está incompleto o el identificador proporcionado no es un UUID válido."
      />
    );
  }

  if (workerQuery.isLoading) {
    return <LoadingPanel title="Cargando perfil del trabajador." />;
  }

  if (workerQuery.isError || !workerQuery.data) {
    return (
      <ErrorState
        title="No pudimos cargar el perfil"
        description={
          workerQuery.error instanceof Error
            ? workerQuery.error.message
            : "El trabajador existe, pero no se pudo recuperar su detalle."
        }
        onRetry={() => void workerQuery.refetch()}
      />
    );
  }

  const worker = workerQuery.data;

  return (
    <>
      <PageHeader
        eyebrow="Perfil de trabajador"
        title={worker.fullName}
        description="Consulta la ficha laboral, datos de contacto e historial contractual del colaborador."
        action={
          <Link href="/trabajadores">
            <Button variant="secondary" className="h-10 gap-2 rounded-xl px-4">
              <ArrowLeft className="size-4" />
              Volver
            </Button>
          </Link>
        }
      />

      <Card className="grid gap-5">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
              <UserRound className="size-7" />
            </div>
            <div className="grid gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="section-title text-2xl font-semibold text-ink">{worker.fullName}</h2>
                <StatusBadge status={worker.status} />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-ink-soft">
                <span className="inline-flex items-center gap-1.5">
                  <BriefcaseBusiness className="size-4" />
                  {worker.position || formatRole(worker.role)}
                </span>
                {worker.email ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="size-4" />
                    {worker.email}
                  </span>
                ) : null}
                {worker.phone ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="size-4" />
                    {worker.phone}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-border/70">
          {profileTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={
                activeTab === tab.key
                  ? "border-b-2 border-indigo-600 px-3 pb-3 text-sm font-semibold text-indigo-700"
                  : "px-3 pb-3 text-sm font-medium text-ink-soft hover:text-ink"
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "summary" && (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ProfileField label="Rol" value={formatRole(worker.role)} />
            <ProfileField label="Puesto" value={worker.position || "No registrado"} />
            <ProfileField label="Área" value={worker.department || "Sin área"} />
            <ProfileField label="Proyecto" value={worker.project || "Sin proyecto"} />
            <ProfileField label="Correo" value={worker.email || "No registrado"} />
            <ProfileField label="Teléfono" value={worker.phone || "No registrado"} />
            <ProfileField label="DNI" value={worker.documentNumber || "No registrado"} />
            <ProfileField label="Nacimiento" value={worker.birthDate || "No registrado"} />
            <ProfileField label="Estado" value={worker.status} />
            {worker.work_location_name && (
              <ProfileField
                label="Lugar de Trabajo"
                value={worker.work_location_name}
              />
            )}
          </section>
        )}
        
        {activeTab === "contracts" && (
          <WorkerContractsTable workerId={workerId} />
        )}

        {activeTab === "labor-assignment" && (
          <LaborAssignmentForm workerId={workerId} />
        )}
      </Card>
    </>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">{label}</p>
      <p className="mt-1 text-sm font-medium text-ink">{value}</p>
    </div>
  );
}
