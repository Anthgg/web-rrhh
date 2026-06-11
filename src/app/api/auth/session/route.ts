import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";

export async function GET() {
 try {
 const { session, accessToken } = await getSessionContext();
 return jsonResponse({
 ...session,
 accessToken,
 });
 } catch (error) {
 return handleRouteError(error);
 }
}
