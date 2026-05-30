import { handleRouteError } from "@/lib/api/server-utils";
import { backendRoutes } from "@/lib/config/backend-routes";
import { proxyCorporatePdfReport } from "@/app/api/reports/pdf-proxy-utils";

export async function POST(request: Request) {
  try {
    return proxyCorporatePdfReport(request, backendRoutes.reports.requestsPdf);
  } catch (error) {
    return handleRouteError(error);
  }
}
