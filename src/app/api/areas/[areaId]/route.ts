import { backendRequest } from "@/lib/api/backend-client";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";

export async function PUT(
 request: Request,
 { params }: { params: Promise<{ areaId: string }> },
) {
 try {
 const { areaId } = await params;
 const payload = await request.json();
 const context = await getSessionContext();
 const response = await backendRequest({
 pathCandidates: [`/api/areas/${areaId}`],
 method: "PUT",
 body: payload,
 accessToken: context.accessToken,
 refreshToken: context.refreshToken,
 });

 return jsonResponse(response.data);
 } catch (error) {
 return handleRouteError(error);
 }
}

export async function DELETE(
 request: Request,
 { params }: { params: Promise<{ areaId: string }> },
) {
 try {
 const { areaId } = await params;
 const context = await getSessionContext();
 const response = await backendRequest({
 pathCandidates: [`/api/areas/${areaId}`],
 method: "DELETE",
 accessToken: context.accessToken,
 refreshToken: context.refreshToken,
 });

 return jsonResponse(response.data);
 } catch (error) {
 return handleRouteError(error);
 }
}
