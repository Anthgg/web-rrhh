import type {
 ChartConfig,
 ReportColumnKey,
 ReportTemplate,
} from "@/types/report.types";

export const REPORT_COLUMNS: Array<{
 key: ReportColumnKey;
 label: string;
 description: string;
 defaultSelected?: boolean;
}> = [
 {
 key: "worker_name",
 label: "Trabajador",
 description: "Nombre completo del colaborador solicitante.",
 defaultSelected: true,
 },
 {
 key: "request_type",
 label: "Tipo de solicitud",
 description: "Categoria de la solicitud laboral.",
 defaultSelected: true,
 },
 {
 key: "status",
 label: "Estado",
 description: "Estado actual del flujo de aprobacion.",
 defaultSelected: true,
 },
 {
 key: "start_date",
 label: "Fecha inicio",
 description: "Fecha inicial del rango solicitado.",
 defaultSelected: true,
 },
 {
 key: "end_date",
 label: "Fecha fin",
 description: "Fecha final del rango solicitado.",
 defaultSelected: true,
 },
 {
 key: "created_at",
 label: "Fecha creacion",
 description: "Momento en que se registro la solicitud.",
 defaultSelected: true,
 },
 {
 key: "approved_by",
 label: "Aprobado por",
 description: "Responsable de la revision o aprobacion.",
 },
 {
 key: "days_requested",
 label: "Dias solicitados",
 description: "Cantidad de dias involucrados en la solicitud.",
 },
 {
 key: "reason",
 label: "Motivo",
 description: "Descripcion o motivo principal de la solicitud.",
 },
 {
 key: "department_name",
 label: "Area",
 description: "Area o departamento del colaborador.",
 },
 {
 key: "job_title",
 label: "Puesto",
 description: "Cargo o puesto del colaborador.",
 },
];

export const DEFAULT_REPORT_COLUMNS = REPORT_COLUMNS.filter((column) => column.defaultSelected).map(
 (column) => column.key,
);

export const REPORT_CHART_GROUP_OPTIONS: Array<{ value: ChartConfig["groupBy"]; label: string }> = [
 { value: "worker", label: "Trabajador" },
 { value: "type", label: "Tipo de solicitud" },
 { value: "status", label: "Estado" },
 { value: "month", label: "Mes" },
 { value: "area", label: "Area" },
];

export const REPORT_CHART_METRIC_OPTIONS: Array<{ value: ChartConfig["metric"]; label: string }> = [
 { value: "total_requests", label: "Total de solicitudes" },
 { value: "average_days", label: "Promedio de dias" },
];

export const REPORT_TEMPLATE_REPORT_TYPES = [
 { value: "requests_excel", label: "Reporte tabular de solicitudes" },
 { value: "requests_dashboard", label: "Dashboard estadistico" },
];

export const REPORT_STATUS_OPTIONS = [
 { value: "", label: "Todos los estados" },
 { value: "pending", label: "Pendientes" },
 { value: "approved", label: "Aprobadas" },
 { value: "rejected", label: "Rechazadas" },
 { value: "observed", label: "Observadas" },
 { value: "cancelled", label: "Canceladas" },
];

export const REPORT_TABS: Array<{
 key: "dashboard" | "generator" | "templates";
 label: string;
 description: string;
 href: string;
}> = [
 {
 key: "dashboard",
 label: "Dashboard",
 description: "Metricas y graficos de solicitudes.",
 href: "/reports/dashboard",
 },
 {
 key: "generator",
 label: "Generador",
 description: "Vista previa real, exportacion y plantillas.",
 href: "/reports/generator",
 },
 {
 key: "templates",
 label: "Plantillas",
 description: "Configuraciones reutilizables del equipo.",
 href: "/reports/templates",
 },
];

export function getTemplateOwnerLabel(template: ReportTemplate) {
 if (template.isDefault || template.ownerType === "default") return "Por defecto";
 return "Personal";
}
