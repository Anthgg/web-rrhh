import { backendRequest } from "@/lib/api/backend-client";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { NextRequest } from "next/server";

export async function PATCH(request: NextRequest, props: { params: Promise<{ workerId: string }> }) {
 try {
 const resolvedParams = await props.params;
 const workerId = resolvedParams.workerId;
 const context = await getSessionContext();
 const body = await request.json();
 
 const response = await backendRequest({
 method: "PATCH",
 pathCandidates: [`/api/workers/${workerId}/labor-assignment`],
 body,
 accessToken: context.accessToken,
 refreshToken: context.refreshToken,
 });

 return jsonResponse(response.data);
 } catch (error) {
 return handleRouteError(error);
 }
}

export async function PUT(request: NextRequest, props: { params: Promise<{ workerId: string }> }) {
 try {
 const resolvedParams = await props.params;
 const workerId = resolvedParams.workerId;
 const context = await getSessionContext();
 const body = await request.json();
 
 const response = await backendRequest({
 method: "PUT",
 pathCandidates: [`/api/workers/${workerId}/labor-assignment`],
 body,
 accessToken: context.accessToken,
 refreshToken: context.refreshToken,
 });

 return jsonResponse(response.data);
 } catch (error) {
 return handleRouteError(error);
 }
}
