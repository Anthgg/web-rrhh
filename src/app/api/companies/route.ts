import { backendRequest } from "@/lib/api/backend-client";
import { getSessionContext } from "@/lib/api/session-context";
import { jsonResponse } from "@/lib/api/server-utils";

export async function GET() {
 try {
 const context = await getSessionContext();
 const response = await backendRequest({
 pathCandidates: ["/api/companies", "/api/workers/companies"],
 accessToken: context.accessToken,
 refreshToken: context.refreshToken,
 });
 return jsonResponse(response.data);
 } catch {
 return jsonResponse([]);
 }
}
