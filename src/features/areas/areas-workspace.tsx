"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, EyeOff, CheckCircle2, Network } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { ErrorState, LoadingPanel } from "@/components/shared/states";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";

import { areasService } from "@/services/areas.service";
import type { AreaDefinition } from "@/types";

import { AreaFormModal } from "./components/AreaFormModal";
import { DeleteAreaDialog } from "./components/DeleteAreaDialog";
import { extractArray } from "@/lib/utils/extract-array";

export function AreasWorkspace({ hideHeader }: { hideHeader?: boolean }) {
 const queryClient = useQueryClient();
 const [isFormOpen, setIsFormOpen] = useState(false);
 const [selectedArea, setSelectedArea] = useState<AreaDefinition | null>(null);
 const [deleteData, setDeleteData] = useState<{ id: string; name: string } | null>(null);

 const {
 data: areas,
 isError: isAreasError,
 isLoading: isAreasLoading,
 refetch: refetchAreas,
 } = useQuery({
 queryKey: ["areas"],
 queryFn: async () => {
 const data = await areasService.list(undefined, true);
 return extractArray<AreaDefinition>(data);
 },
 });

 const toggleStatus = useMutation({
 mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => 
 areasService.toggleStatus(id, is_active),
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["areas"] });
 },
 });

 const handleCreate = () => {
 setSelectedArea(null);
 setIsFormOpen(true);
 };

 const handleEdit = (area: AreaDefinition) => {
 setSelectedArea(area);
 setIsFormOpen(true);
 };

 const handleDelete = (area: AreaDefinition) => {
 setDeleteData({ id: area.id, name: area.name });
 };

 const columns = [
 {
 key: "name",
 header: "Nombre del Área",
 render: (area: AreaDefinition) => (
 <span className="font-medium text-foreground">{area.name}</span>
 ),
 },
 {
 key: "department_name",
 header: "Departamento",
 render: (area: AreaDefinition) => (
 <span className="text-muted-foreground">
 {area.department_name || "Sin asignar"}
 </span>
 ),
 },
 {
 key: "role_name",
 header: "Rol Predeterminado",
 render: (area: AreaDefinition) => (
 <div className="flex flex-col">
 <span className="text-muted-foreground">
 {area.role_name || "Sin asignar"}
 </span>
 {area.role_code && (
 <span className="text-[10px] text-muted-foreground font-mono">
 {area.role_code}
 </span>
 )}
 </div>
 ),
 },
 {
 key: "status",
 header: "Estado",
 render: (area: AreaDefinition) => {
 const isActive = area.is_active === true;
 return <StatusBadge status={isActive ? "active" : "inactive"} />;
 },
 },
 {
 key: "actions",
 header: "Acciones",
 render: (area: AreaDefinition) => {
 const isActive = area.is_active === true;
 
 return (
 <div className="flex items-center justify-end gap-1">
 <Button
 variant="ghost"
 className="size-8 p-0 text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50"
 onClick={() => handleEdit(area)}
 title="Editar área"
 >
 <Edit2 className="size-4" />
 </Button>
 
 <Button
 variant="ghost"
 className={`size-8 p-0 ${isActive ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
 onClick={() => toggleStatus.mutate({ id: area.id, is_active: !isActive })}
 disabled={toggleStatus.isPending}
 title={isActive ? "Desactivar área" : "Activar área"}
 >
 {isActive ? <EyeOff className="size-4" /> : <CheckCircle2 className="size-4" />}
 </Button>
 
 <Button
 variant="ghost"
 className="size-8 p-0 text-rose-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
 onClick={() => handleDelete(area)}
 title="Eliminar área"
 >
 <Trash2 className="size-4" />
 </Button>
 </div>
 );
 },
 },
 ];

 if (isAreasLoading) {
 return <LoadingPanel title="Cargando áreas..." />;
 }

 if (isAreasError || !areas) {
 return (
 <ErrorState
 title="No pudimos cargar las áreas"
 description="Hubo un problema al contactar con el servidor. Intenta de nuevo más tarde."
 onRetry={() => void refetchAreas()}
 />
 );
 }

 return (
 <>
 <div className={`flex flex-col gap-4 sm:flex-row sm:items-center ${hideHeader ? 'sm:justify-end' : 'sm:justify-between'}`}>
 {!hideHeader && (
 <PageHeader
 eyebrow="Configuración"
 title="Áreas"
 description="Gestiona las áreas funcionales de la empresa."
 />
 )}
 <Button
 onClick={() => {
 setSelectedArea(null);
 setIsFormOpen(true);
 }}
 className="gap-2 shrink-0"
 >
 <Plus className="size-4" />
 Crear Área
 </Button>
 </div>

 <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
 <DataTable
 columns={columns}
 rows={Array.isArray(areas) ? areas : (areas as any)?.items || (areas as any)?.data || []}
 rowKey={(item: any) => item.id as string}
 />
 </div>

 <AreaFormModal
 isOpen={isFormOpen}
 onClose={() => setIsFormOpen(false)}
 areaData={selectedArea}
 />

 <DeleteAreaDialog
 isOpen={!!deleteData}
 onClose={() => setDeleteData(null)}
 areaId={deleteData?.id || null}
 areaName={deleteData?.name || null}
 />
 </>
 );
}
