"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { BriefcaseBusiness, Eye, FileText, UserPlus } from "lucide-react";
import Link from "next/link";

import { useSession } from "@/features/auth/auth-provider";

import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { ErrorState, LoadingPanel } from "@/components/shared/states";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card } from "@/components/ui/card";
import { FieldFrame, Input, Select } from "@/components/ui/fields";
import { ExportReportModal } from "@/components/reports/ExportReportModal";
import { RequestModalShell } from "@/components/requests/request-modal-shell";
import { formatRole } from "@/lib/utils/format";
import { workersService } from "@/services/workers.service";
import type { WorkerRecord } from "@/types";
import { WorkerContractsTable } from "@/features/workers/worker-contracts-table";
import { getSafeWorkerId, getSafeUserId, isWorkerProfileComplete } from "@/lib/api/worker-ids";

const workerColumnsForExport = [
  { key: "fullName", label: "Trabajador" },
  { key: "email", label: "Correo Electrónico" },
  { key: "role", label: "Rol / cargo" },
  { key: "position", label: "Puesto" },
  { key: "project", label: "Proyecto" },
  { key: "department", label: "Área" },
  { key: "status", label: "Estado" },
  { key: "phone", label: "Contacto" },
];

export function WorkersWorkspace() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [project, setProject] = useState("");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [contractsWorker, setContractsWorker] = useState<WorkerRecord | null>(null);
  const { user } = useSession();

  const workersQuery = useQuery({
    queryKey: ["workers", page, search, status, project],
    queryFn: () =>
      workersService.list({
        page,
        pageSize: 8,
        search: search || undefined,
        status: status || undefined,
        project: project || undefined,
      }),
  });

  const columns = useMemo<Column<WorkerRecord>[]>(
    () => [
      {
        key: "worker",
        header: "Trabajador",
        render: (item) => (
          <div className="grid gap-1">
            <strong className="font-semibold text-ink">{item.fullName}</strong>
            <span className="text-xs text-ink-soft">{item.email}</span>
            {item.documentNumber ? (
              <span className="text-xs text-ink-soft">DNI: {item.documentNumber}</span>
            ) : null}
          </div>
        ),
      },
      {
        key: "role",
        header: "Rol / cargo",
        render: (item) => (
          <div className="grid gap-1">
            <span>{formatRole(item.role)}</span>
            <span className="text-xs text-ink-soft">{item.position}</span>
          </div>
        ),
      },
      {
        key: "project",
        header: "Proyecto",
        render: (item) => (
          <div className="grid gap-1">
            <span>{item.project ?? "Sin proyecto"}</span>
            <span className="text-xs text-ink-soft">{item.department ?? "Sin área"}</span>
          </div>
        ),
      },
      {
        key: "status",
        header: "Estado",
        render: (item) => <StatusBadge status={item.status} />,
      },
      {
        key: "contact",
        header: "Contacto",
        render: (item) => <span>{item.phone ?? "No registrado"}</span>,
      },
      {
        key: "actions",
        header: "Acciones",
        className: "text-right",
        render: (item) => (
          <div className="flex justify-end gap-2">
            {isWorkerProfileComplete(item) ? (
              <>
                <Link href={`/trabajadores/${getSafeWorkerId(item)}`}>
                  <Button type="button" variant="secondary" className="h-9 gap-1.5 px-3 text-xs">
                    <Eye className="size-3.5" />
                    Perfil
                  </Button>
                </Link>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setContractsWorker(item)}
                  className="h-9 gap-1.5 px-3 text-xs"
                >
                  <BriefcaseBusiness className="size-3.5" />
                  Contratos
                </Button>
              </>
            ) : getSafeUserId(item) ? (
              <Link href={`/trabajadores/alta?mode=complete&userId=${getSafeUserId(item)}`}>
                <Button type="button" variant="secondary" className="h-9 gap-1.5 px-3 text-xs">
                  <UserPlus className="size-3.5" />
                  Completar ficha
                </Button>
              </Link>
            ) : (
              <Button type="button" variant="secondary" disabled className="h-9 gap-1.5 px-3 text-xs">
                <BriefcaseBusiness className="size-3.5" />
                Sin ficha
              </Button>
            )}
          </div>
        ),
      },
    ],
    [],
  );

  if (workersQuery.isLoading) {
    return <LoadingPanel title="Cargando equipo y trabajadores." />;
  }

  if (workersQuery.isError || !workersQuery.data) {
    return (
      <ErrorState
        title="No pudimos cargar trabajadores"
        description="El módulo está listo para filtrar por proyecto o estado cuando la API final exponga esos parámetros."
        onRetry={() => void workersQuery.refetch()}
      />
    );
  }

  const data = workersQuery.data;

  return (
    <>
      <PageHeader
        eyebrow="Equipo"
        title="Trabajadores"
        description="Vista limpia y administrativa del personal con filtros por estado y proyecto."
        action={
          <div className="flex gap-3">
            {(user?.role === "admin" || user?.role === "hr" || user?.role === "super_admin") && (
              <Link href="/trabajadores/alta">
                <Button className="rounded-xl bg-indigo-600 font-medium text-white hover:bg-indigo-700 h-10 px-4 flex items-center gap-1.5 shadow-sm shadow-indigo-15">
                  <UserPlus className="size-4" />
                  Alta Colaborador
                </Button>
              </Link>
            )}
            <Button
              variant="secondary"
              className="rounded-xl border-slate-200 hover:bg-slate-50"
              onClick={() => setIsExportModalOpen(true)}
            >
              <FileText className="mr-2 size-4 text-slate-500" />
              Exportar PDF
            </Button>
          </div>
        }
      />

      <Card className="grid gap-4">
        <div className="grid gap-3 lg:grid-cols-[1.1fr_0.5fr_0.6fr]">
          <FieldFrame label="Buscar">
            <Input
              value={search}
              placeholder="Nombre, correo o proyecto"
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </FieldFrame>
          <FieldFrame label="Estado">
            <Select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos</option>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="on-leave">Licencia</option>
            </Select>
          </FieldFrame>
          <FieldFrame label="Proyecto">
            <Input
              value={project}
              placeholder="Ej. Obra Norte"
              onChange={(event) => {
                setProject(event.target.value);
                setPage(1);
              }}
            />
          </FieldFrame>
        </div>

        <DataTable columns={columns} rows={data.items} rowKey={(item) => item.id} />
        <PaginationControls
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          onPageChange={setPage}
        />
      </Card>

      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportType="workers"
        activeFilters={{
          status: status ? status.toUpperCase() : undefined, // Convert to matching ACTIVE/INACTIVE if uppercase
          project: project || undefined,
          search: search || undefined
        }}
        tableData={data.items}
        tableColumns={workerColumnsForExport}
        filename="reporte-colaboradores-fabryor"
      />

      <RequestModalShell
        isOpen={Boolean(contractsWorker)}
        title="Contratos"
        subtitle={contractsWorker ? contractsWorker.fullName : undefined}
        onClose={() => setContractsWorker(null)}
        size="xl"
      >
        {contractsWorker ? <WorkerContractsTable workerId={getSafeWorkerId(contractsWorker) || ""} /> : null}
      </RequestModalShell>
    </>
  );
}
