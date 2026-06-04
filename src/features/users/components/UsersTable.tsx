import { Eye } from "lucide-react";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { UserProfile } from "@/types";

interface UsersTableProps {
  users: UserProfile[];
  onUserClick: (user: UserProfile) => void;
}

export function UsersTable({ users, onUserClick }: UsersTableProps) {
  const formatLastAccess = (value?: string) => {
    if (!value) return "Sin registro";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Sin registro";

    return date.toLocaleString();
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin": return "Administrador";
      case "supervisor": return "Supervisor";
      case "hr": return "RR.HH.";
      case "worker": return "Trabajador";
      default: return "No informado";
    }
  };
  
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin": return <Badge variant="destructive" className="bg-rose-100 text-rose-700 hover:bg-rose-200">Administrador</Badge>;
      case "supervisor": return <Badge variant="warning">Supervisor</Badge>;
      case "hr": return <Badge variant="info">RR.HH.</Badge>;
      case "worker": return <Badge variant="success">Trabajador</Badge>;
      default: return <Badge variant="secondary">No informado</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge variant="success">Activo</Badge>;
      case "inactive": return <Badge variant="secondary">Inactivo</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const columns: Column<UserProfile>[] = [
    {
      key: "user",
      header: "Usuario",
      render: (item) => (
        <div className="flex items-center gap-3">
          <Avatar alt={item.fullName} size="md" />
          <button
            type="button"
            onClick={() => onUserClick(item)}
            className="grid gap-0.5 text-left focus:outline-none focus:ring-2 focus:ring-brand/20"
          >
            <strong className="font-semibold text-ink hover:text-brand">{item.fullName}</strong>
            <span className="text-xs text-ink-soft">{item.email}</span>
          </button>
        </div>
      ),
    },
    {
      key: "role",
      header: "Rol",
      render: (item) => getRoleBadge(item.role),
    },
    {
      key: "link",
      header: "Vinculación Laboral",
      render: (item) => {
        const hasRecord = Boolean(item.hasWorkerRecord);
        const hasOperationalAssignment = hasRecord || Boolean(item.supervisedCrew);
        const position = item.worker?.position || (item.supervisedCrew ? getRoleLabel(item.role) : null);
        return (
          <div className="grid gap-0.5">
            {hasOperationalAssignment ? (
              <span className="text-sm font-medium text-ink">{hasRecord ? "Con ficha laboral" : "Supervisa cuadrilla"}</span>
            ) : (
              <Badge variant="secondary" className="w-fit text-[10px] font-normal text-slate-500">Sin ficha laboral</Badge>
            )}
            {hasOperationalAssignment && typeof position === "string" && (
              <span className="text-xs text-ink-soft">{position}</span>
            )}
          </div>
        );
      },
    },
    {
      key: "project",
      header: "Proyecto / Obra",
      render: (item) => (
        <div className="grid gap-1">
          {item.worker?.work_location_name || item.supervisedCrew?.work_location_name ? (
            <span className="text-sm font-medium text-ink">{item.worker?.work_location_name || item.supervisedCrew?.work_location_name}</span>
          ) : (
            <Badge variant="secondary" className="w-fit text-[10px] font-normal text-slate-500">Sin proyecto</Badge>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Estado",
      render: (item) => getStatusBadge(item.status),
    },
    {
      key: "access",
      header: "Último acceso",
      render: (item) => (
        <span className="text-xs text-ink-soft">{formatLastAccess(item.lastLoginAt)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (item) => (
        <div className="flex justify-end">
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUserClick(item);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand/10 focus:outline-none focus:ring-2 focus:ring-brand/20"
            aria-label={`Ver detalle de ${item.fullName}`}
          >
            <Eye className="size-4" />
            Ver detalle
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
      <DataTable 
        columns={columns} 
        rows={users} 
        rowKey={(item) => item.id} 
      />
    </div>
  );
}
