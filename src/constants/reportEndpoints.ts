export type ReportPdfType =
  | "attendance"
  | "requests"
  | "workers"
  | "payroll"
  | "monthly-summary"
  | "vacations"
  | "documents";

export interface ReportConfig {
  endpoint: string;
  permission: string;
  filenamePrefix: string;
  title: string;
}

export const REPORT_CONFIGS: Record<ReportPdfType, ReportConfig> = {
  attendance: {
    endpoint: "/api/reports/attendance/pdf",
    permission: "reports.attendance.export",
    filenamePrefix: "reporte-asistencia-fabryor",
    title: "Reporte de Asistencia",
  },
  requests: {
    endpoint: "/api/reports/requests/pdf",
    permission: "reports.requests.export",
    filenamePrefix: "reporte-solicitudes-fabryor",
    title: "Reporte de Solicitudes",
  },
  workers: {
    endpoint: "/api/reports/workers/pdf",
    permission: "reports.workers.export",
    filenamePrefix: "reporte-colaboradores-fabryor",
    title: "Reporte de Colaboradores",
  },
  payroll: {
    endpoint: "/api/reports/payroll/pdf",
    permission: "reports.payroll.export",
    filenamePrefix: "reporte-nomina-fabryor",
    title: "Reporte de Nómina",
  },
  "monthly-summary": {
    endpoint: "/api/reports/monthly-summary/pdf",
    permission: "reports.monthlySummary.export",
    filenamePrefix: "reporte-resumen-mensual-fabryor",
    title: "Reporte de Resumen Mensual",
  },
  vacations: {
    endpoint: "/api/reports/vacations/pdf",
    permission: "reports.vacations.export",
    filenamePrefix: "reporte-vacaciones-fabryor",
    title: "Reporte de Vacaciones",
  },
  documents: {
    endpoint: "/api/reports/documents/pdf",
    permission: "reports.documents.export",
    filenamePrefix: "reporte-documentos-fabryor",
    title: "Reporte de Documentos",
  },
};
