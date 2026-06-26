import { backendRequest } from "@/lib/api/backend-client";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { backendRoutes } from "@/lib/config/backend-routes";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const month = url.searchParams.get("month");
    const year = url.searchParams.get("year");
    const status = url.searchParams.get("status");

    const query: Record<string, string> = {};
    if (month) query.month = month;
    if (year) query.year = year;
    if (status) query.status = status; // comma-separated e.g. "VACATION,MEDICAL_LEAVE"

    const context = await getSessionContext();
    const response = await backendRequest({
      pathCandidates: backendRoutes.attendanceHistory.history,
      accessToken: context.accessToken,
      refreshToken: context.refreshToken,
      query,
    });
    return jsonResponse(response.data);
  } catch (error) {
    return handleRouteError(error);
  }
}
