import { backendRequest } from "@/lib/api/backend-client";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { NextRequest } from "next/server";

export async function PATCH(request: NextRequest, { params }: any) {
 try {
 const session = await getSessionContext();
 const body = await request.json();
 const path = request.nextUrl.pathname.replace('/api', '');
 
 const response = await backendRequest({
 method: "PATCH",
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