import { backendRequest } from "@/lib/api/backend-client";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
 try {
 const payload = await request.json();
 const context = await getSessionContext();

 if (process.env.NODE_ENV !== "production") {
 logger.log("[workers/onboarding] forwarding payload", JSON.stringify(payload, null, 2));
 }

 const response = await backendRequest({
 pathCandidates: ["/api/workers/onboarding"],
 method: "POST",
 body: payload,
 accessToken: context.accessToken,
 refreshToken: context.refreshToken,
 });

 return jsonResponse(response.data);
 } catch (error) {
 if (process.env.NODE_ENV !== "production") {
 logger.error("[workers/onboarding] backend error", error);
 }

 return handleRouteError(error);
 }
}
