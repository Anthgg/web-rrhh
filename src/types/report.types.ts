import type { RequestStatus } from "@/types/requests";

export type ReportColumnKey =
 | "worker_name"
 | "request_type"
 | "status"
 | "start_date"
 | "end_date"
 | "created_at"
 | "approved_by"
 | "days_requested"
 | "reason"
 | "department_name"
 | "job_title"
 | "code"
 | "worker"
 | "dni"
 | "department"
 | "position"
 | "type"
 | "createdAt"
 | "startDate"
 | "endDate"
 | "daysRequested"
 | "workerComment"
 | "reviewComment"
 | "approver"
 | "approvedAt"
 | "attachments";

export type ReportChartGroupBy = "worker" | "type" | "status" | "month" | "area";
export type ReportChartMetric = "total_requests" | "average_days";
export type ReportExportFormat = "xlsx" | "pdf";

export interface ReportFilters {
 dateFrom?: string | null;
 dateTo?: string | null;
 status?: RequestStatus | "all" | null;
 requestType?: string | null;
 typeId?: string | null;
 areaId?: string | null;
 workerId?: string | null;
 worker?: string | null;
 department?: string | null;
 company?: string | null;
 approver?: string | null;
 search?: string | null;
 page?: number;
 pageSize?: number;
}

export interface ReportPreviewRequest {
 filters: ReportFilters;
 columns: ReportColumnKey[];
 limit?: number;
 page?: number;
 templateId?: string;
}

export interface ReportPreviewResponse {
 success: boolean;
 data: Array<Record<string, string | number | null>>;
 total: number;
 previewLimit: number;
 selectedColumns: ReportColumnKey[];
}

export interface ReportSummaryResponse {
 success: boolean;
 data: {
 totalRequests: number;
 approved: number;
 pending: number;
 rejected: number;
 observed: number;
 mostRequestedType: string | null;
 workerWithMostRequests: string | null;
 };
}

export interface ChartConfig {
 groupBy: ReportChartGroupBy;
 metric: ReportChartMetric;
 limit?: number;
}

export interface ReportChartDataset {
 label: string;
 data: number[];
}

export interface ReportChartResponse {
 success: boolean;
 data: {
 title: string;
 labels: string[];
 datasets: ReportChartDataset[];
 summary?: Record<string, string | number | null>;
 };
}

export interface ReportTemplate {
 id: string;
 name: string;
 description?: string;
 module: string;
 reportType: string;
 filters: ReportFilters;
 columns: ReportColumnKey[];
 chartConfig?: ChartConfig;
 isDefault: boolean;
 createdAt?: string;
 updatedAt?: string;
 ownerType?: "default" | "personal";
}

export interface SaveReportTemplatePayload {
 name: string;
 description?: string;
 module: string;
 reportType: string;
 filters: ReportFilters;
 columns: ReportColumnKey[];
 chartConfig?: ChartConfig;
 isDefault?: boolean;
}
