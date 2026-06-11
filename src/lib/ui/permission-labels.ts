export const MODULE_LABELS: Record<string, string> = {
 Dashboard: "Dashboard",
 Workers: "Trabajadores",
 Requests: "Solicitudes",
 Attendance: "Asistencias",
 Areas: "Áreas",
 "Job Positions": "Cargos",
 Documents: "Documentos",
 Reports: "Reportes",
 Users: "Usuarios",
 Roles: "Roles",
 Contracts: "Contratos",
 Crews: "Cuadrillas",
};

export const ACTION_LABELS: Record<string, string> = {
 read: "Lectura",
 write: "Escritura",
 create: "Creación",
 update: "Actualización",
 delete: "Eliminación",
 approve: "Aprobación",
 reject: "Rechazo",
 observe: "Observación",
 manage: "Gestión total",
};

export const SCOPE_LABELS: Record<string, string> = {
 Project: "por proyecto",
 Company: "por empresa",
 Own: "propio",
 All: "global",
};

export const ACCESS_LEVEL_LABELS: Record<string, string> = {
 none: "Restringido",
 read: "Lectura",
 write: "Escritura",
 admin: "Administrador",
 manage: "Gestión total",
};

export function formatPermissionLabel(raw: string): string {
 if (!raw) return "Permiso no especificado";

 const parts = raw.split(".");
 const modulePart = parts[0]?.trim();
 const actionAndScope = parts[1]?.trim();

 if (!modulePart || !actionAndScope) {
 // If it doesn't match the Module.action Scope format, try to format parts if possible
 // or just return the original string formatted nicely.
 return raw;
 }

 const actionParts = actionAndScope.split(" ");
 const action = actionParts[0];
 const scope = actionParts.slice(1).join(" ");

 const moduleLabel = MODULE_LABELS[modulePart] ?? modulePart;
 const actionLabel = ACTION_LABELS[action] ?? action;
 const scopeLabel = scope ? SCOPE_LABELS[scope] ?? scope : "";

 return scopeLabel
 ? `${moduleLabel} - ${actionLabel} ${scopeLabel}`
 : `${moduleLabel} - ${actionLabel}`;
}
