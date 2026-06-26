"use client";

import { hideLoading, showLoading, type LoadingVariant } from "@/store/loading-store";
import { getClientAccessToken } from "@/lib/auth/client-token";
import type { ApiErrorPayload } from "@/types";

export class ApiClientError extends Error {
 constructor(
 message: string,
 public status: number,
 public details?: unknown,
 public code?: string | null,
 public payload?: ApiErrorPayload | null,
 ) {
 super(message);
 this.name = "ApiClientError";
 }
}

function buildQuery(input?: object) {
 const params = new URLSearchParams();

 for (const [key, value] of Object.entries(input ?? {})) {
 if (value !== undefined && value !== null && value !== "") {
 params.set(key, String(value));
 }
 }

 const serialized = params.toString();
 return serialized ? `?${serialized}` : "";
}

export async function apiClient<T>(
 endpoint: string,
 init?: Omit<RequestInit, "body"> & {
 body?: unknown;
 query?: object;
 suppressUnauthorizedEvent?: boolean;
 skipGlobalLoader?: boolean;
 loaderMessage?: string;
 loaderDescription?: string;
 loaderVariant?: LoadingVariant;
 },
): Promise<T> {
 const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;
 const accessToken = getClientAccessToken();
 const serializedBody =
 init?.body && !isFormData && typeof init.body !== "string"
 ? JSON.stringify(init.body)
 : ((init?.body as BodyInit | null | undefined) ?? undefined);

 const {
 body,
 query,
 suppressUnauthorizedEvent,
 skipGlobalLoader,
 loaderMessage,
 loaderDescription,
 loaderVariant,
 ...requestInit
 } = init ?? {};
 const method = (requestInit.method ?? "GET").toUpperCase();
 const shouldShowLoader =
 typeof window !== "undefined" &&
 !skipGlobalLoader &&
 !isLoaderExcludedEndpoint(endpoint) &&
 (Boolean(loaderMessage || loaderDescription || loaderVariant) || method !== "GET");

 if (shouldShowLoader) {
 showLoading({
 message: loaderMessage ?? getDefaultLoaderMessage(method),
 description: loaderDescription,
 variant: loaderVariant ?? inferLoaderVariant(endpoint),
 });
 }

 try {
 const response = await fetch(`${endpoint}${buildQuery(query)}`, {
 ...requestInit,
 credentials: "same-origin",
 headers: {
 Accept: "application/json",
 ...(body && !isFormData ? { "Content-Type": "application/json" } : {}),
 ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
 ...requestInit.headers,
 },
 body: serializedBody,
 cache: "no-store",
 });

 const payload = await response.json().catch(() => null);

 if (!response.ok) {
 const errorPayload = typeof payload === "object" && payload !== null ? payload as ApiErrorPayload : null;
 const rawError = typeof payload === "object" && payload !== null ? payload as { error_code?: string } : null;
 const errorCode = errorPayload?.errorCode ?? errorPayload?.code ?? rawError?.error_code ?? null;

 if (response.status === 401 && typeof window !== "undefined" && !suppressUnauthorizedEvent) {
 window.dispatchEvent(
   new CustomEvent("auth:unauthorized", {
     detail: { errorCode },
   })
 );
 }

 if (response.status === 403 && errorCode === "PASSWORD_CHANGE_REQUIRED" && typeof window !== "undefined") {
   window.dispatchEvent(
     new CustomEvent("auth:password-change-required")
   );
 }

 throw new ApiClientError(
 errorPayload?.message ?? "La solicitud no pudo completarse.",
 response.status,
 errorPayload?.details ?? errorPayload,
 errorCode,
 errorPayload,
 );
 }

 return payload as T;
 } finally {
 if (shouldShowLoader) {
 hideLoading();
 }
 }
}

function isLoaderExcludedEndpoint(endpoint: string) {
 return [
 "/api/auth/session",
 "/api/auth/logout",
 "/api/auth/verify-password",
 "/api/users/me/preferences",
 "/api/auth/refresh",
 "/api/refresh",
 "/api/polling",
 "/api/heartbeat",
 "/api/birthdays/",
  "/api/notifications",
  "/api/requests/pending",
  "/api/schedule/policies",
  ].some((excluded) => endpoint.includes(excluded));
}

function getDefaultLoaderMessage(method: string) {
 if (method === "GET") return "Cargando informacion...";
 if (method === "DELETE") return "Eliminando registro...";
 return "Procesando solicitud...";
}

function inferLoaderVariant(endpoint: string): LoadingVariant {
 return /reports?|reportes?|export|pdf|excel|download|descarga/i.test(endpoint)
 ? "processing"
 : "default";
}
