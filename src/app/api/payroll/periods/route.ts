import { backendRequest } from "@/lib/api/backend-client";
import { normalizePayrollPeriods } from "@/lib/api/normalizers";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { backendRoutes } from "@/lib/config/backend-routes";

export async function GET() {
  try {
    const context = await getSessionContext();
    const response = await backendRequest({
      pathCandidates: backendRoutes.payroll.periods,
      accessToken: context.accessToken,
      refreshToken: context.refreshToken,
    });

    return jsonResponse(normalizePayrollPeriods(response.data));
  } catch (error) {
    return handleRouteError(error);
  }
}
