import { backendRequest } from "@/lib/api/backend-client";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
 try {
 const context = await getSessionContext();
 const q = request.nextUrl.searchParams.get("q") ?? "";

 const response = await backendRequest({
 pathCandidates: ["/api/work-locations/places/search"],
 query: { q },
 accessToken: context.accessToken,
 refreshToken: context.refreshToken,
 });

 return jsonResponse(response.data);
 } catch (error) {
 return handleRouteError(error);
 }
}
