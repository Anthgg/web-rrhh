import { backendRequest } from "@/lib/api/backend-client";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const context = await getSessionContext();
    const searchParams = request.nextUrl.searchParams;
    const query = Object.fromEntries(searchParams.entries());
    
    const response = await backendRequest({
      pathCandidates: ["/api/positions"],
      query,
      accessToken: context.accessToken,
      refreshToken: context.refreshToken,
    });

    return jsonResponse(response.data);
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
      pathCandidates: ["/api/positions"],
      body,
      accessToken: context.accessToken,
      refreshToken: context.refreshToken,
    });

    return jsonResponse(response.data);
  } catch (error) {
    return handleRouteError(error);
  }
}
