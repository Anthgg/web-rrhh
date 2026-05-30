export const backendBaseUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.BACKEND_URL ||
  "https://backend-app-movil-177686674468.europe-west1.run.app";

export const adminApiEndpoints = {
  auth: {
    login: ["/api/login"],
    profile: ["/api/users/me"],
    refresh: ["/api/auth/refresh", "/auth/refresh-token"],
  },
  dashboard: {
    summary: ["/api/dashboard", "/api/dashboard/summary"],
    attendanceToday: ["/api/dashboard/attendance-today"],
    pendingRequests: ["/api/dashboard/pending-requests"],
    workerStatus: ["/api/dashboard/worker-status"],
    contractsExpiring: ["/api/dashboard/contracts-expiring"],
    documentsPending: ["/api/dashboard/documents-pending"],
    lateWorkers: ["/api/dashboard/late-workers"],
    projectSummary: ["/api/dashboard/project-summary"],
  },
  requests: {
    list: ["/api/requests"],
    my: ["/api/requests/my"],
    types: ["/api/requests/types", "/api/request-types"],
    pending: ["/api/requests/pending"],
    reports: ["/api/requests/reports"],
    reportPreview: ["/api/requests/reports/preview"],
    reportSummary: ["/api/requests/reports/summary"],
    reportCharts: ["/api/requests/reports/charts"],
    reportColumns: ["/api/requests/reports/columns"],
    reportExportExcel: ["/api/requests/reports/export/excel"],
    reportExportPdf: ["/api/requests/reports/export/pdf"],
    reportExportCsv: ["/api/requests/reports/export/csv"],
    templates: ["/api/requests/templates"],
  },
  reportTemplates: {
    list: ["/api/report-templates"],
  },
  documents: {
    list: ["/api/documents"],
  },
  users: {
    list: ["/api/users"],
  },
  companySettings: {
    settings: ["/api/company-settings"],
    logo: ["/api/company-settings/logo"],
    signature: ["/api/company-settings/signature"],
    stamp: ["/api/company-settings/stamp"],
  },
  workers: {
    list: ["/api/workers"],
  },
  roles: {
    list: ["/api/roles"],
  },
  profile: {
    current: ["/profile"],
    update: ["/profile"],
    changePassword: ["/profile/change-password"],
  },
  reports: {
    attendance: ["/api/reports/attendance"],
    monthlySummary: ["/api/reports/monthly-summary"],
    requestsPdf: ["/api/reports/requests/pdf"],
    attendancePdfCorporate: ["/api/reports/attendance/pdf", "/api/reports/attendance/export/pdf"],
    workersPdf: ["/api/reports/workers/pdf"],
    payrollPdf: ["/api/reports/payroll/pdf"],
    monthlySummaryPdf: ["/api/reports/monthly-summary/pdf", "/api/reports/monthly-summary/export/pdf"],
    vacationsPdf: ["/api/reports/vacations/pdf"],
    documentsPdf: ["/api/reports/documents/pdf"],
    attendanceExcel: ["/api/reports/attendance/export/excel"],
    attendancePdf: ["/api/reports/attendance/export/pdf"],
    monthlySummaryExcel: ["/api/reports/monthly-summary/export/excel"],
  },
  payroll: {
    periods: ["/payroll/periods"],
  },
} as const;

export const webApiEndpoints = {
  auth: {
    login: "/api/auth/login",
    session: "/api/auth/session",
    logout: "/api/auth/logout",
  },
  dashboard: "/api/dashboard",
  requests: {
    list: "/api/requests",
    my: "/api/requests/my",
    pending: "/api/requests/pending",
    types: "/api/requests/types",
    reports: "/api/requests/reports",
    reportPreview: "/api/requests/reports/preview",
    reportSummary: "/api/requests/reports/summary",
    reportCharts: "/api/requests/reports/charts",
    reportColumns: "/api/requests/reports/columns",
    reportExport: (format: "xlsx" | "pdf" | "csv") => `/api/requests/reports/export/${format}`,
    templates: "/api/requests/templates",
    templateDownload: (templateId: string) => `/api/requests/templates/${templateId}/download`,
    detail: (requestId: string) => `/api/requests/${requestId}`,
    cancel: (requestId: string) => `/api/requests/${requestId}/cancel`,
    review: (requestId: string) => `/api/requests/${requestId}/review`,
    approve: (requestId: string) => `/api/requests/${requestId}/approve`,
    reject: (requestId: string) => `/api/requests/${requestId}/reject`,
    observe: (requestId: string) => `/api/requests/${requestId}/observe`,
    resubmit: (requestId: string) => `/api/requests/${requestId}/resubmit`,
    documents: (requestId: string) => `/api/requests/${requestId}/documents`,
    document: (requestId: string, documentId: string) =>
      `/api/requests/${requestId}/documents/${documentId}`,
  },
  documents: "/api/documents",
  workers: {
    list: "/api/workers",
    laborAssignment: (id: string) => `/api/workers/${id}/labor-assignment`,
  },
  users: "/api/users",
  companySettings: {
    settings: "/api/company-settings",
    legalInfo: "/api/company-settings/legal-info",
    brand: "/api/company-settings/brand",
    logo: "/api/company-settings/logo",
    signature: "/api/company-settings/signature",
    stamp: "/api/company-settings/stamp",
  },
  roles: "/api/roles",
  profile: {
    current: "/api/profile",
    password: "/api/profile/password",
  },
  reports: "/api/reports",
  corporateReports: {
    requestsPdf: "/api/reports/requests/pdf",
    attendancePdf: "/api/reports/attendance/pdf",
    workersPdf: "/api/reports/workers/pdf",
    payrollPdf: "/api/reports/payroll/pdf",
    monthlySummaryPdf: "/api/reports/monthly-summary/pdf",
    vacationsPdf: "/api/reports/vacations/pdf",
    documentsPdf: "/api/reports/documents/pdf",
  },
  reportTemplates: {
    list: "/api/report-templates",
    detail: (templateId: string) => `/api/report-templates/${templateId}`,
  },
  payroll: {
    periods: "/api/payroll/periods",
  },
  organization: {
    departments: "/api/departments",
    department: (id: string) => `/api/departments/${id}`,
    departmentStatus: (id: string) => `/api/departments/${id}/status`,
    areas: "/api/areas",
    area: (id: string) => `/api/areas/${id}`,
    areaStatus: (id: string) => `/api/areas/${id}/status`,
    positions: "/api/positions",
    position: (id: string) => `/api/positions/${id}`,
    positionStatus: (id: string) => `/api/positions/${id}/status`,
    workLocations: "/api/work-locations",
    workLocation: (id: string) => `/api/work-locations/${id}`,
    workLocationStatus: (id: string) => `/api/work-locations/${id}/status`,
  },
  geography: {
    departments: "/api/geography/departments",
    provinces: "/api/geography/provinces",
    districts: "/api/geography/districts",
  },
} as const;
