import { BackendApiError, backendRequest } from "@/lib/api/backend-client";
import { normalizeDashboardSummary } from "@/lib/api/normalizers";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { backendRoutes } from "@/lib/config/backend-routes";

export async function GET() {
  try {
    const context = await getSessionContext();
    const response = await backendRequest({
      pathCandidates: backendRoutes.dashboard.summary,
      accessToken: context.accessToken,
      refreshToken: context.refreshToken,
    });
    const summary = normalizeDashboardSummary(response.data);

    if (!summary) {
      throw new BackendApiError(
        "El endpoint administrativo de dashboard respondio, pero no devolvio un contrato compatible.",
        502,
        {
          expectedFields: [
            "metrics",
            "upcomingActions",
            "requestBreakdown",
            "workforceSnapshot",
            "attendanceToday",
            "pendingRequests",
            "workerStatus",
            "projectSummary",
          ],
          received: response.data,
        },
      );
    }

    return jsonResponse(summary);
  } catch (error) {
    return handleRouteError(error);
  }
}
