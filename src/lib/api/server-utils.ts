import { NextResponse } from "next/server";

import { BackendApiError } from "@/lib/api/backend-client";
import { logger } from "@/lib/logger";

const noStoreHeaders = {
 "Cache-Control": "no-store",
};

export function jsonResponse<T>(data: T, status = 200) {
 return NextResponse.json(data, {
 status,
 headers: noStoreHeaders,
 });
}

export function handleRouteError(error: unknown) {
 if (error instanceof BackendApiError) {
 const isNetworkError = error.status >= 503;
 if (isNetworkError) {
 // 503 / 504 — log concisely, no stack needed
 logger.warn(`[Backend ${error.status}]: ${error.message}`, error.details ?? "");
 } else {
 logger.error(`[Backend API Error ${error.status}]:`, JSON.stringify(error.details, null, 2));
 }

 const details = error.details && typeof error.details === "object" ? (error.details as Record<string, unknown>) : null;
 const code = details?.code ?? details?.error_code ?? details?.errorCode ?? undefined;
 const error_code = details?.error_code ?? details?.code ?? details?.errorCode ?? undefined;

 return NextResponse.json(
 {
 message: error.message,
 status: error.status,
 details: error.details,
 code,
 error_code,
 },
 { status: error.status, headers: noStoreHeaders },
 );
 }

 if (error instanceof Error) {
 logger.error("[Unexpected Route Error]:", error.message);
 return NextResponse.json(
 { message: error.message, status: 500 },
 { status: 500, headers: noStoreHeaders },
 );
 }

 return NextResponse.json(
 { message: "Ocurrio un error inesperado en el servidor.", status: 500 },
 { status: 500, headers: noStoreHeaders },
 );
}

export function getPagingParams(searchParams: URLSearchParams) {
 return {
 page: Number(searchParams.get("page") ?? "1"),
 pageSize: Number(searchParams.get("pageSize") ?? searchParams.get("limit") ?? "10"),
 };
}
