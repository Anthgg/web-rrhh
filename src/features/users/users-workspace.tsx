"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { DataTable, type Column } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { ErrorState, LoadingPanel } from "@/components/shared/states";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card } from "@/components/ui/card";
import { FieldFrame, Input, Select } from "@/components/ui/fields";
import { formatRole } from "@/lib/utils/format";
import { usersService } from "@/services/users.service";
import type { UserProfile } from "@/types";

export function UsersWorkspace() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");

  const usersQuery = useQuery({
    queryKey: ["users", page, search, role, status],
    queryFn: () =>
      usersService.list({
        page,
        pageSize: 8,
        search: search || undefined,
        role: role || undefined,
        status: status || undefined,
      }),
  });

  const columns = useMemo<Column<UserProfile>[]>(
    () => [
      {
        key: "user",
        header: "Usuario",
        render: (item) => (
          <div className="grid gap-1">
            <strong className="font-semibold text-ink">{item.fullName}</strong>
            <span className="text-xs text-ink-soft">{item.email}</span>
          </div>
        ),
      },
      {
        key: "role",
        header: "Rol",
        render: (item) => <span>{formatRole(item.role)}</span>,
      },
      {
        key: "project",
        header: "Proyecto / cargo",
        render: (item) => (
          <div className="grid gap-1">
            <span>{item.project ?? "Sin proyecto"}</span>
            <span className="text-xs text-ink-soft">{item.position}</span>
          </div>
        ),
      },
      {
        key: "status",
        header: "Estado",
        render: (item) => <StatusBadge status={item.status} />,
      },
    ],
    [],
  );

  if (usersQuery.isLoading) {
    return <LoadingPanel title="Cargando usuarios administrativos." />;
  }

  if (usersQuery.isError || !usersQuery.data) {
    return (
      <ErrorState
        title="No pudimos cargar usuarios"
        description="La vista usa solo GET /api/users. Revisa la sesion o el contrato real del backend."
        onRetry={() => void usersQuery.refetch()}
      />
    );
  }

  const data = usersQuery.data;

  return (
    <>
      <PageHeader
        eyebrow="Accesos"
        title="Usuarios"
        description="Listado de usuarios reales del backend administrativo, separado de la ficha laboral de trabajadores."
      />

      <Card className="grid gap-4">
        <div className="grid gap-3 lg:grid-cols-[1.1fr_0.5fr_0.5fr]">
          <FieldFrame label="Buscar">
            <Input
              value={search}
              placeholder="Nombre o correo"
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </FieldFrame>
          <FieldFrame label="Rol">
            <Select
              value={role}
              onChange={(event) => {
                setRole(event.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos</option>
              <option value="admin">Admin</option>
              <option value="hr">RRHH</option>
              <option value="supervisor">Supervisor</option>
              <option value="worker">Trabajador</option>
            </Select>
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
            </Select>
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
    </>
  );
}
