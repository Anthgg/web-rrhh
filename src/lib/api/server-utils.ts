import { NextResponse } from "next/server";

import { BackendApiError } from "@/lib/api/backend-client";

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
    console.error(`[Backend API Error ${error.status}]:`, JSON.stringify(error.details, null, 2));
    return NextResponse.json(
      {
        message: error.message,
        status: error.status,
        details: error.details,
      },
      { status: error.status, headers: noStoreHeaders },
    );
  }

  if (error instanceof Error) {
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
