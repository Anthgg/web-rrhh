import { NextRequest } from "next/server";
import { backendRequest } from "@/lib/api/backend-client";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { setSessionCookies } from "@/lib/auth/cookies";

export async function POST(request: NextRequest) {
 try {
 const formData = await request.formData();
 const context = await getSessionContext();

 const response = await backendRequest<any>({
 pathCandidates: ["/api/profile/photo", "/profile/photo"],
 method: "POST",
 body: formData,
 accessToken: context.accessToken,
 refreshToken: context.refreshToken,
 });

 if (response.refreshedTokens) {
 await setSessionCookies(response.refreshedTokens);
 }

 return jsonResponse(response.data);
 } catch (error) {
 return handleRouteError(error);
 }
}
