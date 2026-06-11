import type { UserRole } from "@/types";
import type { RequestReportColumn, RequestsNavigationItem } from "@/types/requests";

export const requestReportColumnsCatalog: RequestReportColumn[] = [
 { id: "code", label: "Codigo de solicitud", defaultSelected: true },
 { id: "worker_name", label: "Trabajador", defaultSelected: true },
 { id: "dni", label: "DNI", defaultSelected: true },
 { id: "department", label: "Area", defaultSelected: true },
 { id: "position", label: "Cargo", defaultSelected: true },
 { id: "type", label: "Tipo de solicitud", defaultSelected: true },
 { id: "created_at", label: "Fecha de registro", defaultSelected: true },
 { id: "start_date", label: "Fecha de inicio", defaultSelected: true },
 { id: "end_date", label: "Fecha de fin", defaultSelected: true },
 { id: "days_requested", label: "Dias solicitados", defaultSelected: true },
 { id: "status", label: "Estado", defaultSelected: true },
 { id: "reason", label: "Motivo", defaultSelected: true },
 { id: "worker_comment", label: "Comentario del trabajador" },
 { id: "review_comment", label: "Respuesta de RR.HH." },
 { id: "approver", label: "Aprobador" },
 { id: "approved_at", label: "Fecha de aprobacion" },
 { id: "attachments", label: "Documentos adjuntos" },
];

export function getRequestsNavigation(role: UserRole, pendingCount = 0): RequestsNavigationItem[] {
 const isManager = role === "admin" || role === "hr" || role === "supervisor";
 const items: RequestsNavigationItem[] = [
 {
 key: "my-requests",
 label: isManager ? "Solicitudes de la empresa" : "Mis solicitudes",
 description: isManager
 ? "Listado completo con filtros, estados y acciones segun rol."
 : "Seguimiento de solicitudes personales y respuestas del area.",
 href: "/dashboard/requests/my",
 },
 {
 key: "new-request",
 label: "Nueva solicitud",
 description: "Formulario completo con archivos, motivo y fechas solicitadas.",
 href: "/dashboard/requests/new",
 },
 {
 key: "reports",
 label: "Reportes de solicitudes",
 description: "Filtros avanzados, seleccion de columnas y exportacion en linea.",
 href: "/reports",
 },
 {
 key: "templates",
 label: "Plantillas de solicitudes",
 description: "Catalogo de formatos predefinidos en Word, PDF y Excel.",
 href: "/reports/templates",
 },
 ];

 if (isManager) {
 items.splice(2, 0, {
 key: "pending-requests",
 label: "Solicitudes pendientes",
 description: "Bandeja de revision con acciones rapidas para RR.HH. y administracion.",
 href: "/dashboard/requests/pending",
 badge: pendingCount > 0 ? String(pendingCount) : undefined,
 });
 }

 return items;
}
