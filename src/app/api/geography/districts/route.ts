import { backendRequest } from "@/lib/api/backend-client";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const context = await getSessionContext();
    const searchParams = request.nextUrl.searchParams;
    const province_id = searchParams.get('province_id');
    
    const response = await backendRequest({
      pathCandidates: ["/api/geography/districts"],
      query: province_id ? { province_id } : undefined,
      accessToken: context.accessToken,
      refreshToken: context.refreshToken,
    });
    return jsonResponse(response.data);
  } catch (error) {
    return handleRouteError(error);
  }
}
