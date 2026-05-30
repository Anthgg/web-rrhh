"use client";

import { useState } from "react";
import { useWorkLocations } from "../hooks/useOrganizationData";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, MapPin } from "lucide-react";
import type { OrganizationWorkLocation } from "@/services/organization.service";
import { CreateWorkLocationModal } from "../modals/CreateWorkLocationModal";

export function WorkLocationsTab() {
  const { data: locations, isLoading, toggleStatus } = useWorkLocations();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const columns = [
    {
      key: "name",
      header: "Lugar de Trabajo",
      render: (loc: OrganizationWorkLocation) => (
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-slate-400" />
          <span className="font-medium text-slate-900">{loc.name}</span>
        </div>
      ),
    },
    {
      key: "address",
      header: "Dirección",
      render: (loc: OrganizationWorkLocation) => <span className="text-slate-600">{loc.address || "-"}</span>,
    },
    {
      key: "department",
      header: "Departamento",
      render: (loc: OrganizationWorkLocation) => <span className="text-slate-600">{loc.geographic_department_name || "-"}</span>,
    },
    {
      key: "province",
      header: "Provincia",
      render: (loc: OrganizationWorkLocation) => <span className="text-slate-600">{loc.geographic_province_name || "-"}</span>,
    },
    {
      key: "district",
      header: "Distrito",
      render: (loc: OrganizationWorkLocation) => <span className="text-slate-600">{loc.geographic_district_name || "-"}</span>,
    },
    {
      key: "radius",
      header: "Radio GPS",
      render: (loc: OrganizationWorkLocation) => <span className="text-slate-600">{loc.allowed_radius_meters ? `${loc.allowed_radius_meters}m` : "-"}</span>,
    },
    {
      key: "status",
      header: "Estado",
      render: (loc: OrganizationWorkLocation) => {
        const isActive = loc.is_active ?? loc.status === true;
        return <StatusBadge status={isActive ? "active" : "inactive"} />;
      },
    },
    {
      key: "actions",
      header: "Acciones",
      render: (loc: OrganizationWorkLocation) => {
        const isActive = loc.is_active ?? loc.status === true;
        return (
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" className="size-8 p-0 text-slate-500 hover:text-indigo-600">
              <Edit2 className="size-4" />
            </Button>
            <Button
              variant="ghost"
              className="text-xs"
              onClick={() => toggleStatus.mutate({ id: loc.id, status: isActive ? "inactive" : "active" })}
              disabled={toggleStatus.isPending}
            >
              {isActive ? "Desactivar" : "Activar"}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-slate-900">Lugares de Trabajo</h3>
        <div className="flex items-center gap-3">
          <Button className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="size-4" />
            Nuevo Lugar
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-slate-500">Cargando lugares de trabajo...</div>
      ) : locations && locations.length > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <DataTable
            columns={columns}
            rows={locations}
            rowKey={(item) => item.id}
          />
        </div>
      ) : (
        <div className="text-sm text-slate-500">No hay lugares de trabajo. Registra las sedes físicas o ubicaciones de trabajo de tu empresa.</div>
      )}

      <CreateWorkLocationModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
