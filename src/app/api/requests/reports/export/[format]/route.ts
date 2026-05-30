import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError } from "@/lib/api/server-utils";
import { backendRoutes } from "@/lib/config/backend-routes";
import {
  getRequestReportFilters,
  parseProxyBody,
  proxyBackendFileResponse,
} from "@/app/api/requests/request-route-utils";

type RequestRouteContext = {
  params: Promise<{ format: string }>;
};

function resolveExportPaths(format: string) {
  if (format === "xlsx") return backendRoutes.requests.reportExportExcel;
  if (format === "pdf") return backendRoutes.requests.reportExportPdf;
  if (format === "csv") return backendRoutes.requests.reportExportCsv;
  return null;
}

export async function GET(request: Request, context: RequestRouteContext) {
  try {
    const { format } = await context.params;
    const pathCandidates = resolveExportPaths(format);

    if (!pathCandidates) {
      return Response.json(
        { message: "Formato de exportacion no soportado.", status: 400 },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    const sessionContext = await getSessionContext();
    const url = new URL(request.url);
    const query = getRequestReportFilters(url.searchParams);

    return proxyBackendFileResponse({
      pathCandidates,
      accessToken: sessionContext.accessToken,
      query,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request, context: RequestRouteContext) {
  try {
    const { format } = await context.params;
    const pathCandidates = resolveExportPaths(format);

    if (!pathCandidates) {
      return Response.json(
        { message: "Formato de exportacion no soportado.", status: 400 },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    const sessionContext = await getSessionContext();
    const body = await parseProxyBody(request);
    const url = new URL(request.url);
    const query = getRequestReportFilters(url.searchParams);

    return proxyBackendFileResponse({
      pathCandidates,
      accessToken: sessionContext.accessToken,
      method: "POST",
      query,
      body,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
