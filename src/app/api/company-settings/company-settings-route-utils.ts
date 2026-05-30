import { backendRequest } from "@/lib/api/backend-client";
import { getSessionContext } from "@/lib/api/session-context";
import { jsonResponse } from "@/lib/api/server-utils";

export async function readCompanySettingsRequestBody(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    return request.formData();
  }

  const rawBody = await request.text();
  return rawBody ? (JSON.parse(rawBody) as unknown) : undefined;
}

export async function proxyCompanySettingsRequest({
  pathCandidates,
  method,
  body,
}: {
  pathCandidates: readonly string[];
  method: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
}) {
  const context = await getSessionContext();
  const response = await backendRequest({
    pathCandidates,
    method,
    body,
    accessToken: context.accessToken,
    refreshToken: context.refreshToken,
  });

  return jsonResponse(response.data);
}

