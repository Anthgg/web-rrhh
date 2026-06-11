import { backendRequest } from "@/lib/api/backend-client";
import { normalizeReportTemplates } from "@/lib/api/normalizers";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { backendRoutes } from "@/lib/config/backend-routes";

type RouteContext = {
 params: Promise<{ templateId: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
 try {
 const [{ templateId }, sessionContext, body] = await Promise.all([
 context.params,
 getSessionContext(),
 request.json().catch(() => ({})),
 ]);

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
 pathCandidates: backendRoutes.reportTemplates.detail(templateId),
 method: "PUT",
 body: requestBody,
 accessToken: sessionContext.accessToken,
 refreshToken: sessionContext.refreshToken,
 });

 const normalized =
 normalizeReportTemplates(response.data)[0] ??
 normalizeReportTemplates({ data: [response.data] })[0] ??
 {
 id: templateId,
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

 return jsonResponse(normalized);
 } catch (error) {
 return handleRouteError(error);
 }
}

export async function DELETE(_request: Request, context: RouteContext) {
 try {
 const [{ templateId }, sessionContext] = await Promise.all([
 context.params,
 getSessionContext(),
 ]);

 await backendRequest({
 pathCandidates: backendRoutes.reportTemplates.detail(templateId),
 method: "DELETE",
 accessToken: sessionContext.accessToken,
 refreshToken: sessionContext.refreshToken,
 });

 return jsonResponse({ success: true });
 } catch (error) {
 return handleRouteError(error);
 }
}
