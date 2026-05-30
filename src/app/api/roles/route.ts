import { backendRequest } from "@/lib/api/backend-client";
import { normalizeRoles } from "@/lib/api/normalizers";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { backendRoutes } from "@/lib/config/backend-routes";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const context = await getSessionContext();
    const query = Object.fromEntries(request.nextUrl.searchParams.entries());

    const response = await backendRequest({
      pathCandidates: backendRoutes.roles.list,
      query,
      accessToken: context.accessToken,
      refreshToken: context.refreshToken,
    });

    return jsonResponse(normalizeRoles(response.data));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getSessionContext();
    const body = await request.json();
    const response = await backendRequest({
      method: "POST",
      pathCandidates: backendRoutes.roles.list,
      body,
      accessToken: context.accessToken,
      refreshToken: context.refreshToken,
    });

    return jsonResponse(response.data);
  } catch (error) {
    return handleRouteError(error);
  }
}
