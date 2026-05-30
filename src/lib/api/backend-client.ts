import { appConfig } from "@/lib/config/app-config";
import { backendRoutes } from "@/lib/config/backend-routes";
import { normalizeTokens } from "@/lib/api/normalizers";
import { maskToken } from "@/lib/auth/jwt";

export class BackendApiError extends Error {
  constructor(
    message: string,
    public status = 500,
    public details?: unknown,
  ) {
    super(message);
    this.name = "BackendApiError";
  }
}

interface RefreshedTokenBundle {
  accessToken: string;
  refreshToken?: string | null;
}

interface BackendRequestOptions {
  pathCandidates: readonly string[];
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | string[] | undefined>;
  accessToken?: string | null;
  refreshToken?: string | null;
  allowRefresh?: boolean;
}

interface BackendResponse<T> {
  data: T;
  refreshedTokens?: RefreshedTokenBundle;
}

const buildUrl = (path: string, query?: Record<string, string | number | boolean | string[] | undefined>) => {
  const url = new URL(path, appConfig.backendBaseUrl);

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      if (Array.isArray(value)) {
        value.forEach((v) => url.searchParams.append(key, String(v)));
      } else {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
};

const safeJson = async (response: Response) => {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return null;

  try {
    return await response.json();
  } catch {
    return null;
  }
};

const extractMessage = (payload: unknown, fallback: string) => {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (typeof record.message === "string") return record.message;
    if (typeof record.error === "string") return record.error;
  }

  return fallback;
};

const authDebug = (event: string, data: Record<string, unknown> = {}) => {
  if (!appConfig.authDebug) return;
  console.info(`[auth] ${event}`, data);
};

const globalRefreshState = globalThis as typeof globalThis & {
  __fabryorRefreshRequests?: Map<string, Promise<RefreshedTokenBundle | null>>;
};

const refreshRequests =
  globalRefreshState.__fabryorRefreshRequests ??
  (globalRefreshState.__fabryorRefreshRequests = new Map<string, Promise<RefreshedTokenBundle | null>>());

async function performRefreshBackendSession(refreshToken: string) {
  if (!backendRoutes.auth.refresh.length) return null;

  for (const path of backendRoutes.auth.refresh) {
    authDebug("refresh_attempt", {
      path,
      refreshToken: maskToken(refreshToken),
    });

    const response = await fetch(buildUrl(path), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        refreshToken,
      }),
      cache: "no-store",
    });

    if (response.status === 404) continue;

    const payload = await safeJson(response);

    if (!response.ok) {
      authDebug("refresh_failed", {
        path,
        status: response.status,
      });

      throw new BackendApiError(
        extractMessage(payload, "No fue posible refrescar la sesion."),
        response.status,
        payload,
      );
    }

    const tokens = normalizeTokens(payload);
    if (tokens?.accessToken) {
      authDebug("refresh_success", {
        path,
        accessToken: maskToken(tokens.accessToken),
        hasRefreshToken: Boolean(tokens.refreshToken),
      });

      return tokens;
    }
  }

  return null;
}

export async function refreshBackendSession(refreshToken: string) {
  const pendingRefresh = refreshRequests.get(refreshToken);
  if (pendingRefresh) {
    authDebug("refresh_waiting_for_inflight", {
      refreshToken: maskToken(refreshToken),
    });
    return pendingRefresh;
  }

  const refreshPromise = performRefreshBackendSession(refreshToken).finally(() => {
    refreshRequests.delete(refreshToken);
  });

  refreshRequests.set(refreshToken, refreshPromise);
  return refreshPromise;
}

export async function backendRequest<T>({
  pathCandidates,
  method = "GET",
  body,
  query,
  accessToken,
  refreshToken,
  allowRefresh = true,
}: BackendRequestOptions): Promise<BackendResponse<T>> {
  let lastError: BackendApiError | null = null;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  for (const path of pathCandidates) {
    const response = await fetch(buildUrl(path, query), {
      method,
      headers: {
        Accept: "application/json",
        ...(body && !isFormData ? { "Content-Type": "application/json" } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
      cache: "no-store",
    });

    const payload = await safeJson(response);

    if (response.status === 404) {
      lastError = new BackendApiError("Ruta no encontrada en el backend.", 404, payload);
      continue;
    }

    if (response.status === 401 && refreshToken && allowRefresh) {
      const refreshedTokens = await refreshBackendSession(refreshToken);

      if (refreshedTokens?.accessToken) {
        const mergedTokens = {
          accessToken: refreshedTokens.accessToken,
          refreshToken: refreshedTokens.refreshToken ?? refreshToken,
        };

        return backendRequest<T>({
          pathCandidates: [path],
          method,
          body,
          query,
          accessToken: mergedTokens.accessToken,
          refreshToken: mergedTokens.refreshToken,
          allowRefresh: false,
        }).then((result) => ({
          ...result,
          refreshedTokens: mergedTokens,
        }));
      }
    }

    if (!response.ok) {
      throw new BackendApiError(
        extractMessage(payload, "La API respondio con un error."),
        response.status,
        payload,
      );
    }

    return {
      data: (payload as T) ?? ({} as T),
    };
  }

  throw lastError ?? new BackendApiError("No se encontro un endpoint compatible.", 404);
}
