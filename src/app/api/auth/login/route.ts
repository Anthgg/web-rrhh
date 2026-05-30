import { createSessionFromLogin } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { email?: string; password?: string };

    if (!payload.email || !payload.password) {
      return jsonResponse({ message: "Correo y contrasena son obligatorios." }, 400);
    }

    const result = await createSessionFromLogin(payload.email, payload.password);
    return jsonResponse({
      ...result.session,
      accessToken: result.accessToken,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
