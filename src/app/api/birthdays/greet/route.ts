import { backendRequest } from "@/lib/api/backend-client";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";

export async function POST(request: Request) {
 try {
 const context = await getSessionContext();
 const body = await request.json();

 const response = await backendRequest({
 pathCandidates: ["/api/birthdays/greet", "/birthdays/greet"],
 method: "POST",
 body,
 accessToken: context.accessToken,
 refreshToken: context.refreshToken,
 });

 return jsonResponse(response.data);
 } catch (error) {
 return handleRouteError(error);
 }
}
