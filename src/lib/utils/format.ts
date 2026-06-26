import { format } from "date-fns";

import { getRoleLabel } from "@/lib/auth/access";
import type { DocumentStatus, RequestStatus, UserRole, WorkerStatus } from "@/types";

export function formatDate(value?: string) {
 if (!value) return "Sin fecha";

 try {
 return format(new Date(value), "dd/MM/yyyy");
 } catch {
 return value;
 }
}

export function formatDateTime(value?: string) {
 if (!value) return "Sin registro";

 try {
 return format(new Date(value), "dd/MM/yyyy HH:mm");
 } catch {
 return value;
 }
}

export function formatDateRange(start?: string, end?: string) {
 if (!start && !end) return "No definido";
 if (start && !end) return formatDate(start);
 if (!start && end) return formatDate(end);
 return `${formatDate(start)} - ${formatDate(end)}`;
}

export function formatFileSize(value?: number) {
 if (!value || value <= 0) return "Sin tamaño";
 if (value < 1024) return `${value} B`;

 const kb = value / 1024;
 if (kb < 1024) return `${kb.toFixed(kb >= 100 ? 0 : 1)} KB`;

 const mb = kb / 1024;
 return `${mb.toFixed(mb >= 100 ? 0 : 1)} MB`;
}

export function getInitials(name: string) {
 return name
 .split(" ")
 .filter(Boolean)
 .slice(0, 2)
 .map((segment) => segment[0]?.toUpperCase())
 .join("");
}

export function formatRole(role: UserRole) {
 return getRoleLabel(role);
}

export function formatStatusLabel(status: RequestStatus | DocumentStatus | WorkerStatus) {
  return {
    draft: "Borrador",
    pending: "Pendiente",
    pending_supervisor: "Pendiente Supervisor",
    pending_rrhh: "Pendiente RRHH",
    approved: "Aprobado",
    observed: "Observado",
    rejected: "Rechazado",
    cancelled: "Cancelado",
    available: "Disponible",
    missing: "Falta cargar",
    expired: "Expirada",
    resubmitted: "Reenviada",
    active: "Activo",
    inactive: "Inactivo",
    "on-leave": "Licencia",
    generated: "Generado",
    signed: "Firmado",
    unknown: "No informado",
  }[status] ?? status;
}
