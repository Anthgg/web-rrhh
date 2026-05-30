import { type UserRole } from "@/types";

const routeAccessConfig: Record<string, readonly UserRole[]> = {
  "/dashboard/settings/company": ["admin", "super_admin", "hr"],
  "/estructura": ["admin", "hr"],
  "/work-locations": ["admin", "hr"],
  "/dashboard/settings/organization": ["admin", "super_admin", "hr"],
  "/dashboard/requests/pending": ["supervisor", "admin", "hr"],
  "/dashboard/requests": ["worker", "supervisor", "admin", "hr"],
  "/dashboard": ["worker", "supervisor", "admin", "hr"],
  "/reports": ["worker", "supervisor", "admin", "hr"],
  "/solicitudes": ["worker", "supervisor", "admin", "hr"],
  "/documentos": ["worker", "supervisor", "admin", "hr"],
  "/usuarios": ["admin", "hr"],
  "/trabajadores": ["supervisor", "admin", "hr"],
  "/reportes": ["worker", "supervisor", "admin", "hr"],
  "/perfil": ["worker", "supervisor", "admin", "hr"],
  "/roles": ["admin", "hr"],
};

export const protectedRoutePrefixes = Object.keys(routeAccessConfig).sort(
  (left, right) => right.length - left.length,
) as Array<keyof typeof routeAccessConfig>;

export const routeLabels: Record<string, string> = {
  "/dashboard/settings/company": "Configuracion de empresa",
  "/estructura": "Estructura Organizacional",
  "/work-locations": "Lugares de trabajo",
  "/dashboard/settings/organization": "Estructura Legacy",
  "/dashboard": "Dashboard",
  "/dashboard/requests": "Solicitudes",
  "/dashboard/requests/pending": "Pendientes de revision",
  "/reports": "Reportes de solicitudes",
  "/solicitudes": "Solicitudes",
  "/documentos": "Documentos",
  "/usuarios": "Usuarios",
  "/trabajadores": "Trabajadores",
  "/reportes": "Reportes",
  "/perfil": "Perfil",
  "/roles": "Roles y permisos",
};

export function getRouteKey(pathname: string) {
  return protectedRoutePrefixes.find((prefix) => pathname.startsWith(prefix)) ?? "/dashboard";
}

export function isProtectedPath(pathname: string) {
  return protectedRoutePrefixes.some((prefix) => pathname.startsWith(prefix));
}

export function canAccessRoute(role: UserRole, pathname: string) {
  if (role === "super_admin") {
    return true;
  }

  const routeKey = getRouteKey(pathname);
  return routeAccessConfig[routeKey]?.includes(role) ?? false;
}

export function getRoleLabel(role: UserRole) {
  return (
    {
      worker: "Trabajador",
      supervisor: "Supervisor",
      admin: "Administrador",
      super_admin: "Super Admin",
      hr: "RRHH",
      unknown: "No informado",
    }[role] ?? role
  );
}
