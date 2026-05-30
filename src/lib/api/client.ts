"use client";

import { getClientAccessToken } from "@/lib/auth/client-token";
import type { ApiErrorPayload } from "@/types";

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
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
  },
): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;
  const accessToken = getClientAccessToken();
  const serializedBody =
    init?.body && !isFormData && typeof init.body !== "string"
      ? JSON.stringify(init.body)
      : ((init?.body as BodyInit | null | undefined) ?? undefined);

  const { body, query, suppressUnauthorizedEvent, ...requestInit } = init ?? {};

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

  const payload = (await response.json().catch(() => null)) as T | ApiErrorPayload | null;

  if (!response.ok) {
    const errorPayload = payload as ApiErrorPayload | null;

    if (response.status === 401 && typeof window !== "undefined" && !suppressUnauthorizedEvent) {
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }

    throw new ApiClientError(
      errorPayload?.message ?? "La solicitud no pudo completarse.",
      response.status,
      errorPayload?.details ?? errorPayload,
    );
  }

  return payload as T;
}
