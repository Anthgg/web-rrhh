import { backendRequest } from "@/lib/api/backend-client";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const context = await getSessionContext();

    const response = await backendRequest({
      pathCandidates: ["/api/contracts/generate"],
      method: "POST",
      body: payload,
      accessToken: context.accessToken,
      refreshToken: context.refreshToken,
    });

    return jsonResponse(response.data);
  } catch (error) {
    return handleRouteError(error);
  }
}
