"use client";

import { useState } from "react";
import { usePositions } from "../hooks/useOrganizationData";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Plus, Edit2 } from "lucide-react";
import { formatDateTime } from "@/lib/utils/format";
import type { OrganizationPosition } from "@/services/organization.service";
import { CreatePositionModal } from "../modals/CreatePositionModal";

export function PositionsTab() {
  const { data: positions, isLoading, toggleStatus } = usePositions();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const columns = [
    {
      key: "name",
      header: "Cargo / Puesto",
      render: (pos: OrganizationPosition) => <span className="font-medium text-slate-900">{pos.name}</span>,
    },
    {
      key: "area",
      header: "Área Funcional",
      render: (pos: OrganizationPosition) => <span className="text-slate-600">{pos.areaName || "-"}</span>,
    },
    {
      key: "description",
      header: "Descripción",
      render: (pos: OrganizationPosition) => <span className="text-slate-500">{pos.description || "-"}</span>,
    },
    {
      key: "status",
      header: "Estado",
      render: (pos: OrganizationPosition) => (
        <StatusBadge status={pos.status === "active" ? "active" : "inactive"} />
      ),
    },
    {
      key: "updatedAt",
      header: "Última actualización",
      render: (pos: OrganizationPosition) => <span className="text-slate-500">{formatDateTime(pos.updatedAt)}</span>,
    },
    {
      key: "actions",
      header: "Acciones",
      render: (pos: OrganizationPosition) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost"  className="size-8 p-0 text-slate-500 hover:text-indigo-600">
            <Edit2 className="size-4" />
          </Button>
          <Button
            variant="ghost"
            
            className="text-xs"
            onClick={() => toggleStatus.mutate({ id: pos.id, status: pos.status === "active" ? "inactive" : "active" })}
            disabled={toggleStatus.isPending}
          >
            {pos.status === "active" ? "Desactivar" : "Activar"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-slate-900">Cargos y Puestos</h3>
        <div className="flex items-center gap-3">
          <Button className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="size-4" />
            Nuevo Puesto
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-slate-500">Cargando puestos...</div>
      ) : positions && positions.length > 0 ? (
        <DataTable
          columns={columns}
          rows={positions}
          rowKey={(item) => item.id}
        />
      ) : (
        <div className="text-sm text-slate-500">No hay puestos registrados. Crea tu primer cargo vinculado a un área funcional.</div>
      )}

      <CreatePositionModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
