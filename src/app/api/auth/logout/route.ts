import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, clearSessionCookies } from "@/lib/auth/cookies";
import { backendRequest } from "@/lib/api/backend-client";
import { backendRoutes } from "@/lib/config/backend-routes";
import { jsonResponse } from "@/lib/api/server-utils";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
    const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value ?? null;

    if (accessToken) {
      await backendRequest({
        pathCandidates: backendRoutes.auth.logout,
        method: "POST",
        accessToken,
        refreshToken,
        body: refreshToken ? { refreshToken } : {},
        allowRefresh: false,
      });
    }
  } catch {
    // Local cookies are cleared even if backend logout fails.
  }

  await clearSessionCookies();
  return jsonResponse({ success: true });
}
