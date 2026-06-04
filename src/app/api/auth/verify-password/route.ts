import { backendRequest } from "@/lib/api/backend-client";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { password?: string };

    if (!payload.password) {
      return jsonResponse({ message: "Ingresa tu contrasena de administrador." }, 400);
    }

    const sessionContext = await getSessionContext();
    const response = await backendRequest({
      pathCandidates: ["/api/auth/verify-password"],
      method: "POST",
      body: {
        password: payload.password,
      },
      accessToken: sessionContext.accessToken,
      refreshToken: sessionContext.refreshToken,
    });

    return jsonResponse(response.data);
  } catch (error) {
    return handleRouteError(error);
  }
}
