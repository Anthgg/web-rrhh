import { backendRequest } from "@/lib/api/backend-client";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest, { params }: any) {
  try {
    const session = await getSessionContext();
    const searchParams = request.nextUrl.searchParams;
    const query = Object.fromEntries(searchParams.entries());
    const path = request.nextUrl.pathname.replace('/api', '');
    
    const response = await backendRequest({
      pathCandidates: [`/api${path}`],
      query,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    });
    return jsonResponse(response.data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: NextRequest, { params }: any) {
  try {
    const session = await getSessionContext();
    const body = await request.json();
    const path = request.nextUrl.pathname.replace('/api', '');
    
    const response = await backendRequest({
      method: "PUT",
      pathCandidates: [`/api${path}`],
      body,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    });
    return jsonResponse(response.data);
  } catch (error) {
    return handleRouteError(error);
  }
}