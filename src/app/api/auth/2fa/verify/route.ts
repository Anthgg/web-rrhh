import { createSessionFrom2FA, type DeviceInfo } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { logger } from "@/lib/logger";
import { BackendApiError } from "@/lib/api/backend-client";
import { appConfig } from "@/lib/config/app-config";

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const authHeader = request.headers.get("Authorization") ?? "";
    const tempToken = authHeader.replace(/^Bearer\s+/i, "");

    if (!tempToken) {
      return jsonResponse({ message: "Token temporal de autenticación requerido." }, 401);
    }

    const payload = (await request.json()) as {
      code?: string;
      deviceInfo?: DeviceInfo;
    };

    if (!payload.code) {
      return jsonResponse({ message: "El código es obligatorio." }, 400);
    }

    // Proxy the browser's real request headers through to the backend
    const userAgent = request.headers.get("user-agent") ?? "";
    const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
    const realIp = request.headers.get("x-real-ip") ?? "";
    const cfIp = request.headers.get("cf-connecting-ip") ?? "";

    const forwardHeaders: Record<string, string> = {};
    if (userAgent)     forwardHeaders["User-Agent"]            = userAgent;
    if (userAgent)     forwardHeaders["X-Original-User-Agent"] = userAgent;
    if (forwardedFor)  forwardHeaders["X-Forwarded-For"]       = forwardedFor;
    if (realIp)        forwardHeaders["X-Real-IP"]             = realIp;
    if (cfIp)          forwardHeaders["CF-Connecting-IP"]      = cfIp;

    if (appConfig.authDebug) {
      logger.log(`[Proxy 2FA Verify] Forwarding headers — UA: "${userAgent.slice(0, 60)}..." | IP: ${realIp || forwardedFor || "?"}`);
    }

    const result = await createSessionFrom2FA(payload.code, tempToken, {
      forwardHeaders,
      deviceInfo: payload.deviceInfo,
    });

    const duration = Date.now() - startTime;
    logger.log(`[Proxy 2FA Verify] Success in ${duration}ms`);

    return jsonResponse({
      ...result.session,
      accessToken: result.accessToken,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    let status = 500;
    let type = "unknown_error";
    let message = "Ocurrió un error inesperado al verificar 2FA.";

    if (error instanceof BackendApiError) {
      status = error.status;
      message = error.message;
      if (status === 504) {
        type = "backend_timeout";
      } else if (status === 503) {
        type = "backend_unavailable";
      } else if (status === 401 || status === 400 || status === 422) {
        type = "invalid_code";
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
      `[Proxy 2FA Verify] Failed after ${duration}ms. Status: ${status}, Type: ${type}, Message: ${message}`
    );

    return handleRouteError(error);
  }
}
