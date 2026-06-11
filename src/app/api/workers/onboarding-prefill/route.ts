import { NextRequest } from "next/server";

import { backendRequest } from "@/lib/api/backend-client";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
 try {
 const context = await getSessionContext();
 const query = Object.fromEntries(request.nextUrl.searchParams.entries());

 const response = await backendRequest({
 pathCandidates: [
 "/api/workers/onboarding-prefill",
 "/api/admin/workers/onboarding-prefill",
 ],
 query,
 accessToken: context.accessToken,
 refreshToken: context.refreshToken,
 });

 // ── DIAGNOSTIC: log prefill response structure ──────────────────────────────
 if (process.env.NODE_ENV !== "production") {
 const d = response.data as Record<string, unknown> | null;
 if (d) {
 logger.log("[onboarding-prefill GET] top-level keys:", Object.keys(d));
 const acc = d.accessData as Record<string, unknown> | null;
 logger.log("[onboarding-prefill GET] accessData:", acc);
 const user = (d.user ?? d.worker ?? d.userData) as Record<string, unknown> | null;
 if (user) {
 logger.log("[onboarding-prefill GET] user role fields:", {
 role: user.role,
 role_id: user.role_id,
 roleId: user.roleId,
 systemRole: user.systemRole,
 });
 }
 }
 }
 // ── END DIAGNOSTIC ──────────────────────────────────────────────────────────

 return jsonResponse(response.data);
 } catch (error) {
 return handleRouteError(error);
 }
}
