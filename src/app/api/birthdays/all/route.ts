import { BackendApiError, backendRequest } from "@/lib/api/backend-client";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";

export async function GET() {
  try {
    const context = await getSessionContext();

    const response = await backendRequest({
      pathCandidates: ["/api/birthdays/all", "/api/birthdays", "/birthdays/all", "/birthdays"],
      accessToken: context.accessToken,
      refreshToken: context.refreshToken,
    });

    return jsonResponse(response.data);
  } catch (error) {
    if (error instanceof BackendApiError && ![401, 403].includes(error.status)) {
      return jsonResponse({
        data: {
          birthdays: [],
        },
      });
    }

    return handleRouteError(error);
  }
}
