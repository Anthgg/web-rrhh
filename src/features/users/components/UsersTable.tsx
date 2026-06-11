import { useMemo } from "react";
import { Eye } from "lucide-react";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { UserProfile } from "@/types";
import { RoleBadge, buildRoleColorMap, SYSTEM_ROLE_STYLES } from "@/lib/ui/role-badges";
import { normalizeUserRole } from "@/lib/api/normalizers";

interface UsersTableProps {
 users: UserProfile[];
 onUserClick: (user: UserProfile) => void;
}

const formatLastAccess = (value?: string | null) => {
 if (!value) return "Sin registro";

 const date = new Date(value);
 if (Number.isNaN(date.getTime())) return "Sin registro";

 return date.toLocaleString();
};



const getStatusBadge = (status: string) => {
 switch (status) {
 case "active": return <Badge variant="success">Activo</Badge>;
 case "inactive": return <Badge variant="secondary">Inactivo</Badge>;
 default: return <Badge variant="outline">{status}</Badge>;
 }
};

export function UsersTable({ users, onUserClick }: UsersTableProps) {
 const roleColorMap = useMemo(() => buildRoleColorMap(users), [users]);

 const columns: Column<UserProfile>[] = [
 {
 key: "user",
 header: "Usuario",
 render: (item) => (
 <div className="flex items-center gap-3">
 <UserAvatar src={item.avatarUrl} fullName={item.fullName} email={item.email} size="md" />
 <button
 type="button"
 onClick={() => onUserClick(item)}
 className="grid gap-0.5 text-left focus:outline-none focus:ring-2 focus:ring-primary/20"
 >
 <strong className="font-semibold text-foreground hover:text-primary">{item.fullName}</strong>
 <span className="text-xs text-foreground-soft">{item.email}</span>
 </button>
 </div>
 ),
 },
 {
 key: "role",
 header: "Rol",
 render: (item) => <RoleBadge user={item} roleColorMap={roleColorMap} />,
 },
 {
 key: "link",
 header: "Vinculación Laboral",
 render: (item) => {
 const hasRecord = Boolean(item.hasWorkerRecord);
 const hasOperationalAssignment = hasRecord || Boolean(item.supervisedCrew);
 const normalized = normalizeUserRole(item);
 const roleKey = String(normalized.roleCode ?? normalized.roleName ?? "").toLowerCase();
 const displayLabel = SYSTEM_ROLE_STYLES[roleKey]?.label ?? normalized.displayRole;
 const position = item.worker?.position || (item.supervisedCrew ? displayLabel : null);
 return (
 <div className="grid gap-0.5">
 {hasOperationalAssignment ? (
 <span className="text-sm font-medium text-foreground">{hasRecord ? "Con ficha laboral" : "Supervisa cuadrilla"}</span>
 ) : (
 <Badge variant="secondary" className="w-fit text-[10px] font-normal text-muted-foreground">Sin ficha laboral</Badge>
 )}
 {hasOperationalAssignment && typeof position === "string" && (
 <span className="text-xs text-foreground-soft">{position}</span>
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
 <span className="text-sm font-medium text-foreground">{item.worker?.work_location_name || item.supervisedCrew?.work_location_name}</span>
 ) : (
 <Badge variant="secondary" className="w-fit text-[10px] font-normal text-muted-foreground">Sin proyecto</Badge>
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
 <span className="text-xs text-foreground-soft">{formatLastAccess(item.lastLoginAt)}</span>
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
 className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/20"
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
 <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
 <DataTable 
 columns={columns} 
 rows={users} 
 rowKey={(item) => item.id} 
 />
 </div>
 );
}
