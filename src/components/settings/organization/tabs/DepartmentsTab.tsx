"use client";

import { useState } from "react";
import { useDepartments } from "../hooks/useOrganizationData";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Plus, Edit2 } from "lucide-react";
import { formatDateTime } from "@/lib/utils/format";
import type { OrganizationDepartment } from "@/services/organization.service";
import { CreateDepartmentModal } from "../modals/CreateDepartmentModal";

export function DepartmentsTab() {
 const { data: departments, isLoading, toggleStatus } = useDepartments();
 const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

 const columns = [
 {
 key: "name",
 header: "Nombre del Departamento",
 render: (dept: OrganizationDepartment) => <span className="font-medium text-foreground">{dept.name}</span>,
 },
 {
 key: "description",
 header: "Descripción",
 render: (dept: OrganizationDepartment) => <span className="text-muted-foreground">{dept.description || "-"}</span>,
 },
 {
 key: "status",
 header: "Estado",
 render: (dept: OrganizationDepartment) => (
 <StatusBadge status={dept.status === "active" ? "active" : "inactive"} />
 ),
 },
 {
 key: "updatedAt",
 header: "Última actualización",
 render: (dept: OrganizationDepartment) => <span className="text-muted-foreground">{formatDateTime(dept.updatedAt)}</span>,
 },
 {
 key: "actions",
 header: "Acciones",
 render: (dept: OrganizationDepartment) => (
 <div className="flex items-center justify-end gap-2">
 <Button variant="ghost" className="size-8 p-0 text-muted-foreground hover:text-indigo-600">
 <Edit2 className="size-4" />
 </Button>
 <Button
 variant="ghost"
 
 className="text-xs"
 onClick={() => toggleStatus.mutate({ id: dept.id, status: dept.status === "active" ? "inactive" : "active" })}
 disabled={toggleStatus.isPending}
 >
 {dept.status === "active" ? "Desactivar" : "Activar"}
 </Button>
 </div>
 ),
 },
 ];

 return (
 <div className="flex flex-col gap-4">
 <div className="flex items-center justify-between">
 <h3 className="text-lg font-medium text-foreground">Departamentos Internos</h3>
 <Button className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
 <Plus className="size-4" />
 Nuevo Departamento
 </Button>
 </div>

 {isLoading ? (
 <div className="text-sm text-muted-foreground">Cargando departamentos...</div>
 ) : departments && departments.length > 0 ? (
 <DataTable
 columns={columns}
 rows={departments}
 rowKey={(item) => item.id}
 />
 ) : (
 <div className="text-sm text-muted-foreground">No hay departamentos registrados. Crea tu primer departamento interno para organizar las áreas de la empresa.</div>
 )}

 <CreateDepartmentModal 
 isOpen={isCreateModalOpen}
 onClose={() => setIsCreateModalOpen(false)}
 />
 </div>
 );
}
