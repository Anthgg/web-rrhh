import { BackendApiError, backendRequest } from "@/lib/api/backend-client";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { setSessionCookies } from "@/lib/auth/cookies";
import { backendRoutes } from "@/lib/config/backend-routes";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope") || "ALL";
    const days = searchParams.get("days") || undefined;
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "20";

    const context = await getSessionContext();

    const response = await backendRequest({
      pathCandidates: backendRoutes.profile.activities,
      accessToken: context.accessToken,
      refreshToken: context.refreshToken,
      query: {
        scope,
        ...(days ? { days } : {}),
        page,
        limit,
      },
    });

    if (response.refreshedTokens) {
      await setSessionCookies(response.refreshedTokens);
    }

    return jsonResponse(response.data);
  } catch (error) {
    return handleRouteError(error);
  }
}
