import { handleRouteError } from "@/lib/api/server-utils";
import { proxyCorporatePdfReport } from "@/app/api/reports/pdf-proxy-utils";

export async function POST(request: Request) {
  try {
    return await proxyCorporatePdfReport(request, [
      "/api/users/export/pdf",
      "/api/reports/users/pdf",
      "/api/reports/users/export/pdf",
      "/api/users/pdf",
      "/api/users/report/pdf",
      "/api/reports/export/users/pdf"
    ]);
  } catch (error) {
    return handleRouteError(error);
  }
}
