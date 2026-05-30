"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Shield, EyeOff, CheckCircle2 } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { ErrorState, LoadingPanel } from "@/components/shared/states";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";

import { rolesService } from "@/services/roles.service";
import type { RoleDefinition } from "@/types";

import { RoleFormModal } from "./components/RoleFormModal";
import { DeleteRoleDialog } from "./components/DeleteRoleDialog";
import { extractArray } from "@/lib/utils/extract-array";

export function RolesWorkspace({ hideHeader }: { hideHeader?: boolean }) {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleDefinition | null>(null);
  
  const [deleteData, setDeleteData] = useState<{ id: string; name: string } | null>(null);

  const rolesQuery = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const data = await rolesService.list(true);
      return extractArray<RoleDefinition>(data);
    },
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => 
      rolesService.toggleStatus(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });

  const handleCreate = () => {
    setSelectedRole(null);
    setIsFormOpen(true);
  };

  const handleEdit = (role: RoleDefinition) => {
    setSelectedRole(role);
    setIsFormOpen(true);
  };

  const handleDelete = (role: RoleDefinition) => {
    setDeleteData({ id: role.id as string, name: role.label });
  };

  const columns = [
    {
      key: "label",
      header: "Nombre del Rol",
      render: (role: RoleDefinition) => {
        const isSystemRole = role.protected || role.is_system_role;
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-900">{role.name || role.label}</span>
            {isSystemRole && (
              <span title="Rol del sistema protegido"><Shield className="size-4 text-amber-500" /></span>
            )}
          </div>
        );
      },
    },
    {
      key: "identifier",
      header: "Identificador",
      render: (role: RoleDefinition) => (
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600 font-mono">
          {role.identifier || "Sin identificador"}
        </code>
      ),
    },
    {
      key: "description",
      header: "Descripción",
      render: (role: RoleDefinition) => (
        <span className="text-slate-500 max-w-[200px] truncate block" title={role.description}>
          {role.description || "-"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      render: (role: RoleDefinition) => (
        <StatusBadge status={role.is_active === true ? "active" : "inactive"} />
      ),
    },
    {
      key: "modules",
      header: "Permisos Activos",
      render: (role: RoleDefinition) => {
        const activeModules = role.modules?.filter(m => m.access !== "none").length || 0;
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            {activeModules} módulos
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Acciones",
      render: (role: RoleDefinition) => {
        const isSystemRole = role.protected || role.is_system_role;
        const isActive = role.is_active === true;
        
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              className="size-8 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
              onClick={() => handleEdit(role)}
              disabled={isSystemRole}
              title={isSystemRole ? "Rol del sistema protegido" : "Editar rol"}
            >
              <Edit2 className="size-4" />
            </Button>
            
            <Button
              variant="ghost"
              className={`size-8 p-0 ${isActive ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
              onClick={() => toggleStatus.mutate({ id: role.id as string, is_active: !isActive })}
              disabled={isSystemRole || toggleStatus.isPending}
              title={isActive ? "Desactivar rol" : "Activar rol"}
            >
              {isActive ? <EyeOff className="size-4" /> : <CheckCircle2 className="size-4" />}
            </Button>
            
            <Button
              variant="ghost"
              className="size-8 p-0 text-rose-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
              onClick={() => handleDelete(role)}
              disabled={isSystemRole}
              title="Eliminar rol"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  if (rolesQuery.isLoading) {
    return <LoadingPanel title="Cargando roles y permisos..." />;
  }

  if (rolesQuery.isError || !rolesQuery.data) {
    return (
      <ErrorState
        title="No pudimos cargar roles"
        description="Hubo un problema al contactar con el servidor. Intenta de nuevo más tarde."
        onRetry={() => void rolesQuery.refetch()}
      />
    );
  }

  return (
    <>
      <div className={`flex flex-col sm:flex-row sm:items-center gap-4 mb-6 ${hideHeader ? 'justify-end' : 'justify-between'}`}>
        {!hideHeader && (
          <PageHeader
            eyebrow="Configuración"
            title="Roles"
            description="Gestiona los roles de la empresa, y sus accesos."
          />
        )}
        <Button onClick={handleCreate} className="gap-2 shrink-0">
          <Plus className="size-4" />
          Nuevo Rol
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          rows={rolesQuery.data}
          rowKey={(item) => item.id as string}
        />
      </div>

      <RoleFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        roleData={selectedRole}
      />

      <DeleteRoleDialog
        isOpen={!!deleteData}
        onClose={() => setDeleteData(null)}
        roleId={deleteData?.id || null}
        roleName={deleteData?.name || null}
      />
    </>
  );
}
