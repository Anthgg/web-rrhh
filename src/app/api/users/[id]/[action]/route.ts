import { BackendApiError, backendRequest } from "@/lib/api/backend-client";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";

const ALLOWED_POST_ACTIONS = ["reset-password", "link-worker"];
const ALLOWED_PATCH_ACTIONS = ["block", "disable", "enable"];
const RETRYABLE_STATUSES = new Set([404, 405, 500, 501]);

const unique = (items: string[]) => Array.from(new Set(items));

const getPostActionPaths = (id: string, action: string) => {
 if (action === "reset-password") {
 return unique([
 `/api/users/${id}/reset-password`,
 `/api/users/${id}/password/reset`,
 `/api/users/${id}/reset_password`,
 `/api/users/${id}/generate-temporary-password`,
 `/api/admin/users/${id}/reset-password`,
 `/api/admin/users/${id}/password/reset`,
 ]);
 }

 return [`/api/users/${id}/${action}`];
};

const extractTemporaryPassword = (payload: unknown): string | null => {
 const queue: unknown[] = [payload];
 const visited = new Set<object>();
 const passwordKeys = [
 "tempPassword",
 "temporaryPassword",
 "temporary_password",
 "temp_password",
 "password",
 "newPassword",
 "generatedPassword",
 ];

 while (queue.length > 0) {
 const current = queue.shift();
 if (!current || typeof current !== "object") continue;
 if (visited.has(current)) continue;
 visited.add(current);

 const record = current as Record<string, unknown>;
 for (const key of passwordKeys) {
 const value = record[key];
 if (typeof value === "string" && value.trim()) {
 return value;
 }
 }

 for (const value of Object.values(record)) {
 if (value && typeof value === "object") {
 queue.push(value);
 }
 }
 }

 return null;
};

export async function POST(request: Request, context: { params: Promise<{ id: string; action: string }> | { id: string; action: string } }) {
 try {
 const params = await context.params;
 const { id, action } = params;
 if (!ALLOWED_POST_ACTIONS.includes(action)) {
 return new Response("Not Found", { status: 404 });
 }

 const sessionContext = await getSessionContext();
 
 let body;
 try {
 body = await request.json();
 } catch {
 body = {};
 }

 if (action === "reset-password") {
 let lastError: BackendApiError | null = null;

 // eslint-disable-next-line react-doctor/async-await-in-loop
 for (const path of getPostActionPaths(id, action)) {
 try {
 const response = await backendRequest({
 pathCandidates: [path],
 method: "POST",
 accessToken: sessionContext.accessToken,
 refreshToken: sessionContext.refreshToken,
 body,
 });

 const tempPassword = extractTemporaryPassword(response.data);
 return jsonResponse({
 success: true,
 temporaryPassword: tempPassword ?? "",
 requiresPasswordChange: true,
 generatedAt: new Date().toISOString(),
 });
 } catch (error) {
 if (error instanceof BackendApiError && RETRYABLE_STATUSES.has(error.status)) {
 lastError = error;
 continue;
 }

 throw error;
 }
 }

 throw lastError ?? new BackendApiError("No se encontro un endpoint compatible para resetear la contrasena.", 404);
 }

 const response = await backendRequest({
 pathCandidates: getPostActionPaths(id, action),
 method: "POST",
 accessToken: sessionContext.accessToken,
 refreshToken: sessionContext.refreshToken,
 body,
 });

 return jsonResponse(response.data);
 } catch (error) {
 return handleRouteError(error);
 }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string; action: string }> | { id: string; action: string } }) {
 try {
 const params = await context.params;
 const { id, action } = params;
 if (!ALLOWED_PATCH_ACTIONS.includes(action)) {
 return new Response("Not Found", { status: 404 });
 }

 const sessionContext = await getSessionContext();
 
 let body;
 try {
 body = await request.json();
 } catch {
 body = {};
 }

 const response = await backendRequest({
 pathCandidates: [`/api/users/${id}/${action}`],
 method: "PATCH",
 accessToken: sessionContext.accessToken,
 refreshToken: sessionContext.refreshToken,
 body,
 });

 return jsonResponse(response.data);
 } catch (error) {
 return handleRouteError(error);
 }
}
