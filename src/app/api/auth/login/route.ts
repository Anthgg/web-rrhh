import { createSessionFromLogin, type DeviceInfo } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { logger } from "@/lib/logger";
import { BackendApiError } from "@/lib/api/backend-client";
import { appConfig } from "@/lib/config/app-config";

export async function POST(request: Request) {
  const startTime = Date.now();
  let emailForLog = "";

  try {
    const payload = (await request.json()) as {
      email?: string;
      password?: string;
      deviceInfo?: DeviceInfo;
    };
    emailForLog = payload.email ?? "";

    if (!payload.email || !payload.password) {
      return jsonResponse({ message: "Correo y contrasena son obligatorios." }, 400);
    }

    // ── Opción A: Reenviar headers reales del navegador al backend ────────────
    // El backend prioriza: x-original-user-agent > user-agent > body.deviceInfo.userAgent
    const userAgent = request.headers.get("user-agent") ?? "";
    const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
    const realIp = request.headers.get("x-real-ip") ?? "";
    const cfIp = request.headers.get("cf-connecting-ip") ?? "";

    const forwardHeaders: Record<string, string> = {};
    if (userAgent)     forwardHeaders["User-Agent"]            = userAgent;
    if (userAgent)     forwardHeaders["X-Original-User-Agent"] = userAgent; // Prioridad máxima en backend
    if (forwardedFor)  forwardHeaders["X-Forwarded-For"]       = forwardedFor;
    if (realIp)        forwardHeaders["X-Real-IP"]             = realIp;
    if (cfIp)          forwardHeaders["CF-Connecting-IP"]      = cfIp;

    if (appConfig.authDebug) {
      logger.log(`[Proxy Login] Forwarding headers — UA: "${userAgent.slice(0, 60)}..." | IP: ${realIp || forwardedFor || "?"}`);
    }

    logger.log(`[Proxy Login] Attempting login. Backend URL: ${appConfig.backendBaseUrl}`);

    const result = await createSessionFromLogin(payload.email, payload.password, {
      forwardHeaders,
      // Opción B: deviceInfo enviado desde el cliente como fallback adicional
      deviceInfo: payload.deviceInfo,
    });

    const duration = Date.now() - startTime;
    logger.log(`[Proxy Login] Success for ${emailForLog} in ${duration}ms`);

    return jsonResponse({
      ...result.session,
      accessToken: result.accessToken,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    let status = 500;
    let type = "unknown_error";
    let message = "Ocurrió un error inesperado.";

    if (error instanceof BackendApiError) {
      status = error.status;
      message = error.message;
      if (status === 504) {
        type = "backend_timeout";
      } else if (status === 503) {
        type = "backend_unavailable";
      } else if (status === 401 || status === 400) {
        type = "invalid_credentials";
      } else {
        type = `backend_error_${status}`;
      }
    } else if (error instanceof Error) {
      message = error.message;
      if (error.name === "AbortError" || message.includes("timeout")) {
        status = 504;
        type = "connection_timeout";
      } else if (message.includes("fetch") || message.includes("conn")) {
        status = 503;
        type = "connection_failed";
      }
    }

    logger.error(
      `[Proxy Login] Failed for ${emailForLog} after ${duration}ms. Status: ${status}, Type: ${type}, Message: ${message}`
    );

    return handleRouteError(error);
  }
}
