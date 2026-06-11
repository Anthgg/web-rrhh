import { backendRequest } from "@/lib/api/backend-client";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { NextRequest } from "next/server";

export async function DELETE(request: NextRequest, { params }: any) {
 try {
 const session = await getSessionContext();
 const bodyText = await request.text();
 const body = bodyText ? JSON.parse(bodyText) : undefined;
 const path = request.nextUrl.pathname.replace('/api', '');
 
 const response = await backendRequest({
 method: "DELETE",
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