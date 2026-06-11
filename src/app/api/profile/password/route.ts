import { BackendApiError, backendRequest } from "@/lib/api/backend-client";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { backendRoutes } from "@/lib/config/backend-routes";

export async function POST(request: Request) {
 try {
 const payload = (await request.json()) as {
 currentPassword?: string;
 newPassword?: string;
 };

 if (!payload.currentPassword || !payload.newPassword) {
 return jsonResponse({ message: "Completa la contrasena actual y la nueva." }, 400);
 }

 const context = await getSessionContext();

 try {
 await backendRequest({
 pathCandidates: backendRoutes.profile.changePassword,
 method: "POST",
 body: payload,
 accessToken: context.accessToken,
 refreshToken: context.refreshToken,
 });

 return jsonResponse({
 success: true,
 message: "Contrasena actualizada correctamente.",
 });
 } catch (error) {
 if (error instanceof BackendApiError && error.status === 404) {
 return jsonResponse(
 {
 success: false,
 message:
 "La API no expone una ruta confirmada para cambio de contrasena. Ajusta los paths de autenticacion.",
 },
 501,
 );
 }

 throw error;
 }
 } catch (error) {
 return handleRouteError(error);
 }
}
