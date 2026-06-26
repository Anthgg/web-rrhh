import { appConfig } from "@/lib/config/app-config";
import { backendRoutes } from "@/lib/config/backend-routes";
import { normalizeTokens } from "@/lib/api/normalizers";
import { maskToken } from "@/lib/auth/jwt";
import { logger } from "@/lib/logger";
import { cookies } from "next/headers";

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
 /** Timeout in milliseconds. Defaults to BACKEND_TIMEOUT_MS (15 000). */
 timeoutMs?: number;
 /**
  * Extra headers to forward verbatim to the backend.
  * Useful for proxying User-Agent, X-Forwarded-For, X-Real-IP, etc.
  * from the original browser request through the Next.js server.
  */
 forwardHeaders?: Record<string, string>;
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
 logger.log(`[auth] ${event}`, data);
};

/** Default backend request timeout — overridable per call. */
const BACKEND_TIMEOUT_MS = 15_000;

/** Maximum retries for 429 Rate-Limited requests. */
const MAX_RETRIES_429 = 2;

/** Build an AbortSignal that fires after `ms` milliseconds. */
const timeoutSignal = (ms: number) => AbortSignal.timeout(ms);

function delay(ms: number): Promise<void> {
 return new Promise((resolve) => setTimeout(resolve, ms));
}

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
 signal: timeoutSignal(BACKEND_TIMEOUT_MS),
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

function getTenantIdFromToken(token?: string | null): string | null {
 if (!token) return null;
 const parts = token.split(".");
 if (parts.length < 2) return null;
 try {
 const payload = JSON.parse(
 Buffer.from(parts[1], "base64url").toString("utf8")
 );
 return (
 payload.companyId ??
 payload.company_id ??
 payload.tenantId ??
 payload.tenant_id ??
 null
 );
 } catch {
 return null;
 }
}

async function performBackendRequest<T>({
  pathCandidates,
  method = "GET",
  body,
  query,
  accessToken,
  refreshToken,
  allowRefresh = true,
  timeoutMs = BACKEND_TIMEOUT_MS,
  forwardHeaders,
}: BackendRequestOptions): Promise<BackendResponse<T>> {
  let lastError: BackendApiError | null = null;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const tenantId = getTenantIdFromToken(accessToken);

  let deviceId: string | undefined;
  try {
    const cookieStore = await cookies();
    deviceId = cookieStore.get("device_id")?.value;
  } catch {
    // Fail silently when cookies() is not available (e.g. during static generation/builds)
  }

  for (const path of pathCandidates) {
  let response: Response;

  try {
  response = await fetch(buildUrl(path, query), {
  method,
  headers: {
  Accept: "application/json",
  ...(body && !isFormData ? { "Content-Type": "application/json" } : {}),
  ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  ...(tenantId ? { "tenant-id": tenantId } : {}),
  ...(deviceId ? { "x-device-id": deviceId } : {}),
  // Forward original browser headers (User-Agent, IP, etc.) when proxying
  ...(forwardHeaders ?? {}),
  },
  body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  cache: "no-store",
  signal: timeoutSignal(timeoutMs),
  });
  } catch (fetchError) {
  // AbortError means the timeout fired — surface as a 504 Gateway Timeout
  if (fetchError instanceof Error && fetchError.name === "AbortError") {
  throw new BackendApiError(
  `El servidor no respondio a tiempo (${timeoutMs / 1000}s). Intenta de nuevo.`,
  504,
  { path, timeoutMs },
  );
  }
  // Network-level error (no connection, DNS failure, etc.)
  throw new BackendApiError(
  "No se pudo conectar con el servidor. Verifica tu conexion.",
  503,
  fetchError instanceof Error ? fetchError.message : String(fetchError),
  );
  }

   const payload = await safeJson(response);

   if (response.status === 404) {
   lastError = new BackendApiError("Ruta no encontrada en el backend.", 404, payload);
   continue;
   }

   if (response.status === 429) {
   for (let attempt = 1; attempt <= MAX_RETRIES_429; attempt++) {
     const retryAfter = Number(response.headers.get("retry-after")) || attempt * 2;
     const waitMs = Math.min(retryAfter * 1000, 8000);
     await delay(waitMs);

     response = await fetch(buildUrl(path, query), {
     method,
     headers: {
       Accept: "application/json",
       ...(body && !isFormData ? { "Content-Type": "application/json" } : {}),
       ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
       ...(tenantId ? { "tenant-id": tenantId } : {}),
       ...(deviceId ? { "x-device-id": deviceId } : {}),
       ...(forwardHeaders ?? {}),
     },
     body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
     cache: "no-store",
     signal: timeoutSignal(timeoutMs),
     });

     if (response.status !== 429) break;
   }

   const retryPayload = await safeJson(response);
   if (!response.ok) {
     throw new BackendApiError(
     extractMessage(retryPayload, "Demasiadas peticiones, intenta de nuevo más tarde."),
     response.status,
     retryPayload,
     );
   }

   return {
     data: (retryPayload as T) ?? ({} as T),
   };
   }

   const errorPayload = payload as {
     code?: string;
     error_code?: string;
     errorCode?: string;
     error?: {
       code?: string;
       error_code?: string;
       errorCode?: string;
     } | null;
   } | null;

   const nestedCode = errorPayload?.error
     ? (errorPayload.error.code ?? errorPayload.error.error_code ?? errorPayload.error.errorCode)
     : null;

   const isSessionRevoked = errorPayload && (
     errorPayload.code === "SESSION_REVOKED" ||
     errorPayload.error_code === "SESSION_REVOKED" ||
     errorPayload.errorCode === "SESSION_REVOKED" ||
     nestedCode === "SESSION_REVOKED"
   );

   if (response.status === 401 && refreshToken && allowRefresh && !isSessionRevoked) {
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
  timeoutMs,
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

// Caching and Request Coalescing structures
interface CacheEntry {
  data: any;
  refreshedTokens?: RefreshedTokenBundle;
  expiresAt: number;
}

const apiCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<any>>();

const CATALOG_PATTERNS = [
  "/api/departments",
  "/api/areas",
  "/api/positions",
  "/api/work-locations",
  "/api/work-crews",
  "/api/branches",
  "/api/report-templates",
  "/api/catalog-roles",
  "/api/workers/companies",
  "/api/workers/branches",
  "/api/workers/types",
  "/api/workers/shifts",
  "/api/workers/supervisors",
  "/api/contracts/cost-centers",
];

function isCatalogPath(pathCandidates: readonly string[]): boolean {
  return pathCandidates.some((path) =>
    CATALOG_PATTERNS.some((pattern) => path.startsWith(pattern) || path.includes(pattern))
  );
}

function getCacheKey(
  pathCandidates: readonly string[],
  method: string,
  query?: Record<string, any>,
  body?: unknown,
  accessToken?: string | null
): string {
  const queryStr = query ? JSON.stringify(query) : "";
  const bodyStr = body ? JSON.stringify(body) : "";
  const pathKey = pathCandidates.join(",");
  const tokenKey = accessToken ? accessToken.slice(-12) : "";
  return `${method}:${pathKey}:${queryStr}:${bodyStr}:${tokenKey}`;
}

export async function backendRequest<T>(options: BackendRequestOptions): Promise<BackendResponse<T>> {
  const { method = "GET", pathCandidates, query, body, accessToken } = options;

  if (method !== "GET") {
    // Mutation: Clear cache to prevent stale data
    apiCache.clear();
    return performBackendRequest<T>(options);
  }

  const cacheKey = getCacheKey(pathCandidates, method, query, body, accessToken);
  const now = Date.now();

  const cached = apiCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return {
      data: cached.data as T,
      refreshedTokens: cached.refreshedTokens,
    };
  }

  let inFlight = inFlightRequests.get(cacheKey);
  if (!inFlight) {
    inFlight = performBackendRequest<T>(options)
      .then((res) => {
        const isCatalog = isCatalogPath(pathCandidates);
        const ttl = isCatalog ? 300_000 : 5_000; // 5 mins for catalogs, 5 seconds for other dynamic GET requests
        apiCache.set(cacheKey, {
          data: res.data,
          refreshedTokens: res.refreshedTokens,
          expiresAt: Date.now() + ttl,
        });
        return res;
      })
      .finally(() => {
        inFlightRequests.delete(cacheKey);
      });
    inFlightRequests.set(cacheKey, inFlight);
  }

  return inFlight;
}
