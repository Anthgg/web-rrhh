import { backendRequest } from "@/lib/api/backend-client";
import { normalizeAttendanceMonthlySummary } from "@/lib/api/normalizers";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { backendRoutes } from "@/lib/config/backend-routes";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const month = url.searchParams.get("month");
    const year = url.searchParams.get("year");

    const query: Record<string, string> = {};
    if (month) query.month = month;
    if (year) query.year = year;

    const context = await getSessionContext();
    const response = await backendRequest({
      pathCandidates: backendRoutes.attendanceHistory.summary,
      accessToken: context.accessToken,
      refreshToken: context.refreshToken,
      query,
    });
    return jsonResponse(normalizeAttendanceMonthlySummary(response.data));
  } catch (error) {
    return handleRouteError(error);
  }
}
