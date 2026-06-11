import { backendRequest } from "@/lib/api/backend-client";
import { normalizeReportTemplates } from "@/lib/api/normalizers";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { backendRoutes } from "@/lib/config/backend-routes";

export async function GET(request: Request) {
 try {
 const context = await getSessionContext();
 const url = new URL(request.url);
 const moduleParam = url.searchParams.get("module");

 const query: Record<string, string | number | undefined> = {};
 if (moduleParam) {
 query.module = moduleParam;
 }
 const reportType = url.searchParams.get("reportType") ?? url.searchParams.get("report_type");
 if (reportType) {
 query.report_type = reportType;
 query.reportType = reportType;
 }

 const response = await backendRequest({
 pathCandidates: backendRoutes.reportTemplates.list,
 accessToken: context.accessToken,
 refreshToken: context.refreshToken,
 query,
 });

 return jsonResponse(normalizeReportTemplates(response.data));
 } catch (error) {
 return handleRouteError(error);
 }
}

export async function POST(request: Request) {
 try {
 const context = await getSessionContext();
 const body = await request.json().catch(() => ({}));

 const requestBody = {
 ...body,
 report_type: body.reportType ?? body.report_type,
 reportType: body.reportType ?? body.report_type,
 is_default: body.isDefault ?? body.is_default,
 isDefault: body.isDefault ?? body.is_default,
 chart_config: body.chartConfig ?? body.chart_config,
 chartConfig: body.chartConfig ?? body.chart_config,
 };

 const response = await backendRequest({
 pathCandidates: backendRoutes.reportTemplates.list,
 method: "POST",
 body: requestBody,
 accessToken: context.accessToken,
 refreshToken: context.refreshToken,
 });

 const normalized =
 normalizeReportTemplates(response.data)[0] ??
 normalizeReportTemplates({ data: [response.data] })[0] ??
 {
 id: String((response.data as { id?: unknown } | null)?.id ?? crypto.randomUUID()),
 name: typeof (body as { name?: unknown })?.name === "string" ? (body as { name: string }).name : "Plantilla",
 description:
 typeof (body as { description?: unknown })?.description === "string"
 ? (body as { description: string }).description
 : undefined,
 module: "requests" as const,
 reportType:
 typeof (body as { reportType?: unknown })?.reportType === "string"
 ? (body as { reportType: string }).reportType
 : "requests_excel",
 filters:
 typeof (body as { filters?: unknown })?.filters === "object" && (body as { filters?: unknown }).filters
 ? ((body as { filters: Record<string, string | null> }).filters as {
 dateFrom?: string | null;
 dateTo?: string | null;
 status?: "pending" | "approved" | "rejected" | "observed" | "cancelled" | null;
 requestType?: string | null;
 areaId?: string | null;
 workerId?: string | null;
 })
 : {},
 columns:
 Array.isArray((body as { columns?: unknown })?.columns)
 ? ((body as { columns: string[] }).columns as Array<
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
 >)
 : [],
 chartConfig:
 typeof (body as { chartConfig?: unknown })?.chartConfig === "object"
 ? ((body as { chartConfig?: unknown }).chartConfig as {
 groupBy: "worker" | "type" | "status" | "month" | "area";
 metric: "total_requests" | "average_days";
 limit?: number;
 })
 : undefined,
 isDefault: Boolean((body as { isDefault?: unknown })?.isDefault),
 };

 return jsonResponse(normalized, 201);
 } catch (error) {
 return handleRouteError(error);
 }
}
