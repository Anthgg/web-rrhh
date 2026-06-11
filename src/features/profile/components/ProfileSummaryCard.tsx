"use client";

import { Card } from "@/components/ui/card";
import { formatRole } from "@/lib/utils/format";
import type { UserProfile } from "@/types";

interface ProfileSummaryCardProps {
 user: UserProfile;
}

/** Resolve crew display following the approved crew logic rules */
function resolveCrewDisplay(
 workLocationName: string | null | undefined,
 crewName: string | null | undefined,
): string {
 const hasLocation = !!workLocationName;
 const hasCrew = crewName !== null && crewName !== undefined && crewName !== "";

 if (hasCrew) return crewName;
 if (hasLocation && !hasCrew) return "Sin cuadrilla";
 return "No registrado";
}

export function ProfileSummaryCard({ user }: ProfileSummaryCardProps) {
 const roleLabel = formatRole(user.role);
 const positionLabel = user.positionName || user.position || user.worker?.position || "No registrado";
 const departmentLabel = user.departmentName || user.department || user.worker?.department_name || "No registrado";
 const workLocationLabel = user.workLocationName || user.project || user.worker?.work_location_name || "No registrado";
 const statusLabel = user.status === "active" ? "Activo" : user.status === "inactive" ? "Inactivo" : "No registrado";

 const crewLabel = resolveCrewDisplay(
 user.workLocationName || user.worker?.work_location_name,
 user.crewName ?? user.worker?.crew_name,
 );

 const lastLoginLabel = user.lastLoginAt
 ? new Date(user.lastLoginAt).toLocaleString("es-PE", {
 timeZone: "America/Lima",
 day: "2-digit", month: "short", year: "numeric",
 hour: "2-digit", minute: "2-digit",
 })
 : "No registrado";

 const activeSessionsLabel =
 user.security?.active_sessions !== null && user.security?.active_sessions !== undefined
 ? `${user.security.active_sessions} ${user.security.active_sessions === 1 ? "sesión" : "sesiones"}`
 : "No registrado";

 const items = [
 { label: "Rol de acceso", value: roleLabel },
 { label: "Cargo laboral", value: positionLabel },
 { label: "Área o Departamento", value: departmentLabel },
 { label: "Obra / Proyecto asignado", value: workLocationLabel },
 { label: "Cuadrilla actual", value: crewLabel },
 { label: "Estado del usuario", value: statusLabel },
 { label: "Último acceso", value: lastLoginLabel },
 { label: "Sesiones activas", value: activeSessionsLabel },
 ];

 return (
 <Card className="p-6 bg-card border border-border rounded-2xl shadow-sm grid gap-4">
 <div>
 <h2 className="text-lg font-bold text-foreground">Resumen del Usuario</h2>
 <p className="text-xs text-muted-foreground mt-0.5">Parámetros clave de acceso y estado actual en el sistema.</p>
 </div>

 <div className="grid gap-3 rounded-2xl bg-muted p-4 text-sm">
 {items.map((item, idx) => (
 <div key={item.label} className="flex items-center justify-between gap-3 border-b border-border last:border-0 pb-2 last:pb-0">
 <span className="text-muted-foreground font-medium">{item.label}</span>
 <span className="font-semibold text-foreground text-right">{item.value}</span>
 </div>
 ))}
 </div>
 </Card>
 );
}
