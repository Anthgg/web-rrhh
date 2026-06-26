import { backendRequest } from "@/lib/api/backend-client";
import { normalizeVacationBalance } from "@/lib/api/normalizers";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { backendRoutes } from "@/lib/config/backend-routes";

export async function GET() {
  try {
    const context = await getSessionContext();
    const response = await backendRequest({
      pathCandidates: backendRoutes.vacations.myBalance,
      accessToken: context.accessToken,
      refreshToken: context.refreshToken,
    });
    return jsonResponse(normalizeVacationBalance(response.data));
  } catch (error) {
    return handleRouteError(error);
  }
}
