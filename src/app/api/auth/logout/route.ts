import { clearSessionCookies } from "@/lib/auth/cookies";
import { jsonResponse } from "@/lib/api/server-utils";

export async function POST() {
  await clearSessionCookies();
  return jsonResponse({ success: true });
}
