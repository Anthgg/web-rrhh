import { NextRequest } from "next/server";

import { backendRequest } from "@/lib/api/backend-client";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";

export async function GET(request: NextRequest) {
  try {
    const context = await getSessionContext();
    const query = Object.fromEntries(request.nextUrl.searchParams.entries());

    const response = await backendRequest({
      pathCandidates: [
        "/api/workers/onboarding-prefill",
        "/api/admin/workers/onboarding-prefill",
      ],
      query,
      accessToken: context.accessToken,
      refreshToken: context.refreshToken,
    });

    return jsonResponse(response.data);
  } catch (error) {
    return handleRouteError(error);
  }
}
