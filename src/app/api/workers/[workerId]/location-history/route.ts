import { backendRequest } from "@/lib/api/backend-client";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { NextRequest } from "next/server";

export async function GET(
 request: NextRequest,
 { params }: { params: any }
) {
 try {
 const resolvedParams = await params;
 const workerId = resolvedParams?.workerId;
 const session = await getSessionContext();
 const searchParams = request.nextUrl.searchParams;
 const query = Object.fromEntries(searchParams.entries());

 const response = await backendRequest({
 pathCandidates: [
 `/api/workers/${workerId}/location-history`,
 `/api/workers/${workerId}/location-assignment/history`
 ],
 query,
 accessToken: session.accessToken,
 refreshToken: session.refreshToken,
 });
 return jsonResponse(response.data);
 } catch (error) {
 return handleRouteError(error);
 }
}
