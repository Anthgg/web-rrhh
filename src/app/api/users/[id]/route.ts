import { backendRequest } from "@/lib/api/backend-client";
import { normalizeUser } from "@/lib/api/normalizers";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { backendRoutes } from "@/lib/config/backend-routes";

export async function GET(_: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
 try {
 const [{ id }, sessionContext] = await Promise.all([
 context.params,
 getSessionContext(),
 ]);

 const response = await backendRequest({
 pathCandidates: backendRoutes.users.detail(id),
 accessToken: sessionContext.accessToken,
 refreshToken: sessionContext.refreshToken,
 });

 return jsonResponse(normalizeUser(response.data));
 } catch (error) {
 return handleRouteError(error);
 }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
 try {
 const [{ id }, sessionContext, body] = await Promise.all([
 context.params,
 getSessionContext(),
 request.json(),
 ]);
 const role = typeof body.role === "string" && body.role && body.role !== "unknown" ? body.role : undefined;
 const backendBody: Record<string, unknown> = {};

 if ("full_name" in body || "fullName" in body) backendBody.full_name = body.full_name ?? body.fullName;
 if ("first_name" in body || "firstName" in body) backendBody.first_name = body.first_name ?? body.firstName;
 if ("last_name" in body || "lastName" in body) backendBody.last_name = body.last_name ?? body.lastName;
 if ("email" in body) backendBody.email = body.email;
 if ("phone" in body) backendBody.phone = body.phone;
 if ("documentNumber" in body || "dni" in body) backendBody.document_number = body.documentNumber ?? body.dni;
 if ("birthDate" in body) backendBody.birth_date = body.birthDate;
 if (role) {
 backendBody.role = role;
 backendBody.role_key = role;
 }
 if ("status" in body) backendBody.status = body.status;
 if ("isActive" in body) backendBody.is_active = body.isActive;
 if ("requiresPasswordChange" in body) backendBody.password_change_required = body.requiresPasswordChange;
 if ("emailVerified" in body) backendBody.email_verified = body.emailVerified;

 const response = await backendRequest({
 pathCandidates: backendRoutes.users.update(id),
 method: "PUT",
 accessToken: sessionContext.accessToken,
 refreshToken: sessionContext.refreshToken,
 body: backendBody,
 });

 return jsonResponse(normalizeUser(response.data));
 } catch (error) {
 return handleRouteError(error);
 }
}
