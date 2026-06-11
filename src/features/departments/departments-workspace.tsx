"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Network } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { departmentsService } from "@/services/departments.service";
import type { DepartmentDefinition } from "@/types";
import { DepartmentFormModal } from "./components/DepartmentFormModal";
import { DeleteDepartmentDialog } from "./components/DeleteDepartmentDialog";
import { QuickOrganizationBuilderModal } from "@/components/shared/QuickOrganizationBuilderModal";
import { Button } from "@/components/ui/button";
import { extractArray } from "@/lib/utils/extract-array";

export function DepartmentsWorkspace({ hideHeader }: { hideHeader?: boolean }) {
 const queryClient = useQueryClient();
 const [isFormModalOpen, setIsFormModalOpen] = useState(false);
 const [isQuickBuilderOpen, setIsQuickBuilderOpen] = useState(false);
 const [selectedDepartment, setSelectedDepartment] = useState<DepartmentDefinition | null>(null);
 const [departmentToDelete, setDepartmentToDelete] = useState<DepartmentDefinition | null>(null);

 const {
 data: departments,
 isLoading: isDepartmentsLoading,
 } = useQuery({
 queryKey: ["departments"],
 queryFn: async () => {
 const data = await departmentsService.list(true);
 return extractArray<DepartmentDefinition>(data);
 },
 });

 const toggleStatus = useMutation({
 mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
 departmentsService.toggleStatus(id, is_active),
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["departments"] });
 queryClient.invalidateQueries({ queryKey: ["organization"] });
 },
 onError: (error: any) => {
 const details = error?.details;
 const errorCode = details?.code || error?.code;
 if (errorCode === "DEPARTMENT_HAS_ACTIVE_WORKERS") {
 alert("No se puede desactivar o eliminar este departamento porque tiene trabajadores activos asociados.");
 } else {
 alert(error?.message || "Ocurrió un error al cambiar el estado.");
 }
 }
 });

 const columns = [
 {
 key: "name",
 header: "Nombre",
 render: (dept: DepartmentDefinition) => (
 <span className="font-medium text-foreground">{dept.name}</span>
 ),
 },
 {
 key: "description",
 header: "Descripción",
 render: (dept: DepartmentDefinition) => (
 <span className="text-muted-foreground">{dept.description || "-"}</span>
 ),
 },
 {
 key: "status",
 header: "Estado",
 render: (dept: DepartmentDefinition) => {
 const isActive = dept.is_active === true;
 return <StatusBadge status={isActive ? "active" : "inactive"} />;
 },
 },
 {
 key: "actions",
 header: "Acciones",
 render: (dept: DepartmentDefinition) => {
 const isActive = dept.is_active === true;
 
 return (
 <div className="flex items-center justify-end gap-2">
 <Button
 variant="ghost"
 className="size-8 p-0 text-muted-foreground hover:text-indigo-600"
 onClick={() => {
 setSelectedDepartment(dept);
 setIsFormModalOpen(true);
 }}
 >
 <Edit2 className="size-4" />
 </Button>
 <Button
 variant="ghost"
 className="text-xs"
 onClick={() => toggleStatus.mutate({ id: dept.id, is_active: !isActive })}
 disabled={toggleStatus.isPending}
 >
 {isActive ? "Desactivar" : "Activar"}
 </Button>
 <Button
 variant="ghost"
 className="size-8 p-0 text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
 onClick={() => setDepartmentToDelete(dept)}
 >
 <Trash2 className="size-4" />
 </Button>
 </div>
 );
 },
 },
 ];

 return (
 <div className="flex flex-col gap-6">
 <div className={`flex flex-col gap-4 sm:flex-row sm:items-center ${hideHeader ? 'sm:justify-end' : 'sm:justify-between'}`}>
 {!hideHeader && (
 <PageHeader
 eyebrow="Configuración"
 title="Departamentos"
 description="Gestiona los departamentos internos de la empresa."
 />
 )}
 <div className="flex items-center gap-3 shrink-0">
 <Button
 variant="secondary"
 onClick={() => setIsQuickBuilderOpen(true)}
 className="gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
 >
 <Network className="size-4" />
 Configuración Rápida
 </Button>
 <Button
 onClick={() => {
 setSelectedDepartment(null);
 setIsFormModalOpen(true);
 }}
 className="gap-2"
 >
 <Plus className="size-4" />
 Crear Departamento
 </Button>
 </div>
 </div>

 {isDepartmentsLoading ? (
 <div className="text-sm text-muted-foreground">Cargando departamentos...</div>
 ) : departments && departments.length > 0 ? (
 <DataTable
 columns={columns}
 rows={departments}
 rowKey={(row) => row.id}
 />
 ) : (
 <div className="text-sm text-muted-foreground">No hay departamentos registrados.</div>
 )}

 <DepartmentFormModal
 isOpen={isFormModalOpen}
 onClose={() => {
 setIsFormModalOpen(false);
 setSelectedDepartment(null);
 }}
 departmentData={selectedDepartment}
 />

 <QuickOrganizationBuilderModal
 isOpen={isQuickBuilderOpen}
 onClose={() => setIsQuickBuilderOpen(false)}
 />

 {departmentToDelete && (
 <DeleteDepartmentDialog
 isOpen={true}
 onClose={() => setDepartmentToDelete(null)}
 department={departmentToDelete}
 />
 )}
 </div>
 );
}
