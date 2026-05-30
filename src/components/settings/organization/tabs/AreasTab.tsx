"use client";

import { useState } from "react";
import { useAreas } from "../hooks/useOrganizationData";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Plus, Edit2 } from "lucide-react";
import { formatDateTime } from "@/lib/utils/format";
import type { OrganizationArea } from "@/services/organization.service";
import { CreateAreaModal } from "../modals/CreateAreaModal";

export function AreasTab() {
  const { data: areas, isLoading, toggleStatus } = useAreas();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const columns = [
    {
      key: "name",
      header: "Nombre del Área",
      render: (area: OrganizationArea) => <span className="font-medium text-slate-900">{area.name}</span>,
    },
    {
      key: "department",
      header: "Departamento Interno",
      render: (area: OrganizationArea) => <span className="text-slate-600">{area.departmentName || "-"}</span>,
    },
    {
      key: "description",
      header: "Descripción",
      render: (area: OrganizationArea) => <span className="text-slate-500">{area.description || "-"}</span>,
    },
    {
      key: "status",
      header: "Estado",
      render: (area: OrganizationArea) => (
        <StatusBadge status={area.status === "active" ? "active" : "inactive"} />
      ),
    },
    {
      key: "updatedAt",
      header: "Última actualización",
      render: (area: OrganizationArea) => <span className="text-slate-500">{formatDateTime(area.updatedAt)}</span>,
    },
    {
      key: "actions",
      header: "Acciones",
      render: (area: OrganizationArea) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost"  className="size-8 p-0 text-slate-500 hover:text-indigo-600">
            <Edit2 className="size-4" />
          </Button>
          <Button
            variant="ghost"
            
            className="text-xs"
            onClick={() => toggleStatus.mutate({ id: area.id, status: area.status === "active" ? "inactive" : "active" })}
            disabled={toggleStatus.isPending}
          >
            {area.status === "active" ? "Desactivar" : "Activar"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-slate-900">Áreas Funcionales</h3>
        <div className="flex items-center gap-3">
          <Button className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="size-4" />
            Nueva Área
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-slate-500">Cargando áreas...</div>
      ) : areas && areas.length > 0 ? (
        <DataTable
          columns={columns}
          rows={areas}
          rowKey={(item) => item.id}
        />
      ) : (
        <div className="text-sm text-slate-500">No hay áreas registradas. Crea tu primera área vinculada a un departamento.</div>
      )}

      <CreateAreaModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
