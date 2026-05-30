"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Edit2,
  Trash2,
  EyeOff,
  CheckCircle2,
  MapPin,
  Navigation,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { ErrorState, LoadingPanel } from "@/components/shared/states";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";

import { organizationService } from "@/services/organization.service";
import type { OrganizationWorkLocation } from "@/services/organization.service";
import { extractArray } from "@/lib/utils/extract-array";

import { WorkLocationFormModal } from "./components/WorkLocationFormModal";
import { DeleteWorkLocationDialog } from "./components/DeleteWorkLocationDialog";

const columns = (
  onEdit: (loc: OrganizationWorkLocation) => void,
  onDelete: (loc: OrganizationWorkLocation) => void,
  onToggle: (loc: OrganizationWorkLocation) => void,
  isPending: boolean
) => [
  {
    key: "name",
    header: "Lugar de Trabajo",
    render: (loc: OrganizationWorkLocation) => (
      <div className="flex items-center gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <MapPin className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">{loc.name}</p>
          {loc.address && (
            <p className="truncate text-xs text-slate-500">{loc.address}</p>
          )}
        </div>
      </div>
    ),
  },
  {
    key: "location",
    header: "Ubicación",
    render: (loc: OrganizationWorkLocation) => (
      <div className="flex flex-col gap-0.5 text-sm text-slate-600">
        {loc.geographic_department_name && (
          <span>{loc.geographic_department_name}</span>
        )}
        {loc.geographic_province_name && (
          <span className="text-xs text-slate-400">
            {loc.geographic_province_name}
            {loc.geographic_district_name
              ? ` · ${loc.geographic_district_name}`
              : ""}
          </span>
        )}
      </div>
    ),
  },
  {
    key: "coords",
    header: "Coordenadas / Radio",
    render: (loc: OrganizationWorkLocation) => {
      const hasCoords =
        loc.latitude != null && loc.longitude != null;
      return hasCoords ? (
        <div className="flex flex-col gap-0.5 text-xs font-mono text-slate-600">
          <span className="flex items-center gap-1">
            <Navigation className="size-3 text-indigo-400" />
            {Number(loc.latitude).toFixed(5)},{" "}
            {Number(loc.longitude).toFixed(5)}
          </span>
          {loc.allowed_radius_meters != null && (
            <span className="text-slate-400">
              Radio: {loc.allowed_radius_meters}m
            </span>
          )}
        </div>
      ) : (
        <span className="text-xs text-slate-400">Sin coordenadas</span>
      );
    },
  },
  {
    key: "status",
    header: "Estado",
    render: (loc: OrganizationWorkLocation) => {
      const isActive = loc.is_active !== false;
      return <StatusBadge status={isActive ? "active" : "inactive"} />;
    },
  },
  {
    key: "actions",
    header: "Acciones",
    render: (loc: OrganizationWorkLocation) => {
      const isActive = loc.is_active !== false;
      return (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            className="size-8 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
            onClick={() => onEdit(loc)}
            title="Editar lugar de trabajo"
          >
            <Edit2 className="size-4" />
          </Button>

          <Button
            variant="ghost"
            className={`size-8 p-0 ${isActive ? "text-amber-500 hover:bg-amber-50" : "text-emerald-500 hover:bg-emerald-50"}`}
            onClick={() => onToggle(loc)}
            disabled={isPending}
            title={isActive ? "Desactivar" : "Activar"}
          >
            {isActive ? (
              <EyeOff className="size-4" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            className="size-8 p-0 text-rose-400 hover:bg-rose-50 hover:text-rose-600"
            onClick={() => onDelete(loc)}
            title="Eliminar lugar de trabajo"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      );
    },
  },
];

export function WorkLocationsWorkspace({
  hideHeader,
}: {
  hideHeader?: boolean;
}) {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] =
    useState<OrganizationWorkLocation | null>(null);
  const [deleteData, setDeleteData] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const locationsQuery = useQuery({
    queryKey: ["work-locations"],
    queryFn: async () => {
      const data = await organizationService.getWorkLocations();
      return extractArray<OrganizationWorkLocation>(data);
    },
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      organizationService.updateWorkLocationStatus(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-locations"] });
    },
  });

  const handleCreate = () => {
    setSelectedLocation(null);
    setIsFormOpen(true);
  };

  const handleEdit = (loc: OrganizationWorkLocation) => {
    setSelectedLocation(loc);
    setIsFormOpen(true);
  };

  const handleDelete = (loc: OrganizationWorkLocation) => {
    setDeleteData({ id: loc.id, name: loc.name });
  };

  const handleToggle = (loc: OrganizationWorkLocation) => {
    const isActive = loc.is_active !== false;
    toggleStatus.mutate({ id: loc.id, is_active: !isActive });
  };

  if (locationsQuery.isLoading) {
    return <LoadingPanel title="Cargando lugares de trabajo..." />;
  }

  if (locationsQuery.isError || !locationsQuery.data) {
    return (
      <ErrorState
        title="No pudimos cargar los lugares de trabajo"
        description="Hubo un problema al contactar con el servidor. Intenta de nuevo más tarde."
        onRetry={() => void locationsQuery.refetch()}
      />
    );
  }

  const rows = Array.isArray(locationsQuery.data)
    ? locationsQuery.data
    : (locationsQuery.data as any)?.items ||
      (locationsQuery.data as any)?.data ||
      [];

  return (
    <>
      <div
        className={`flex flex-col gap-4 sm:flex-row sm:items-center ${
          hideHeader ? "sm:justify-end" : "sm:justify-between"
        }`}
      >
        {!hideHeader && (
          <PageHeader
            eyebrow="Configuración"
            title="Lugares de Trabajo"
            description="Gestiona las sedes, obras y ubicaciones donde trabaja tu personal."
          />
        )}
        <Button onClick={handleCreate} className="gap-2 shrink-0">
          <Plus className="size-4" />
          Nuevo Lugar
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <DataTable
          columns={columns(
            handleEdit,
            handleDelete,
            handleToggle,
            toggleStatus.isPending
          )}
          rows={rows}
          rowKey={(item: any) => item.id as string}
        />
      </div>

      <WorkLocationFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        locationData={selectedLocation}
      />

      <DeleteWorkLocationDialog
        isOpen={!!deleteData}
        onClose={() => setDeleteData(null)}
        locationId={deleteData?.id || null}
        locationName={deleteData?.name || null}
      />
    </>
  );
}
