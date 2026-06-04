import { handleRouteError } from "@/lib/api/server-utils";
import { proxyCorporatePdfReport } from "@/app/api/reports/pdf-proxy-utils";

export async function POST(request: Request) {
  try {
    return await proxyCorporatePdfReport(request, [
      "/api/users/export/excel",
      "/api/reports/users/excel",
      "/api/reports/users/export/excel",
      "/api/users/excel",
      "/api/users/report/excel",
      "/api/reports/export/users/excel"
    ]);
  } catch (error) {
    return handleRouteError(error);
  }
}
