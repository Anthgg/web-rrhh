import { BackendApiError } from "@/lib/api/backend-client";
import { appConfig } from "@/lib/config/app-config";
import { getPagingParams } from "@/lib/api/server-utils";

const dateFilterKeys = [
 "submittedDateFrom",
 "submittedDateTo",
 "startDateFrom",
 "startDateTo",
 "updatedDateFrom",
 "updatedDateTo",
] as const;

export function getRequestQueryFilters(searchParams: URLSearchParams) {
 const paging = getPagingParams(searchParams);
 const filters: Record<string, string | number | undefined> = {
 search: searchParams.get("search") ?? undefined,
 status: searchParams.get("status") === "all" ? undefined : (searchParams.get("status") ?? undefined),
 requestTypeId: searchParams.get("requestTypeId") ?? searchParams.get("typeId") ?? undefined,
 sortBy: searchParams.get("sortBy") ?? undefined,
 submittedDatePreset: searchParams.get("submittedDatePreset") ?? undefined,
 page: paging.page,
 limit: paging.pageSize,
 };

 for (const key of dateFilterKeys) {
 filters[key] = searchParams.get(key) ?? undefined;
 }

 return filters;
}

export function getRequestReportFilters(searchParams: URLSearchParams) {
 const paging = getPagingParams(searchParams);

 return {
 page: paging.page,
 limit: paging.pageSize,
 scope: searchParams.get("scope") ?? undefined,
 dateFrom: searchParams.get("dateFrom") ?? undefined,
 dateTo: searchParams.get("dateTo") ?? undefined,
 status: searchParams.get("status") === "all" ? undefined : (searchParams.get("status") ?? undefined),
 requestTypeId: searchParams.get("requestTypeId") ?? searchParams.get("typeId") ?? undefined,
 typeId: searchParams.get("typeId") ?? searchParams.get("requestTypeId") ?? undefined,
 worker: searchParams.get("worker") ?? undefined,
 department: searchParams.get("department") ?? undefined,
 company: searchParams.get("company") ?? undefined,
 approver: searchParams.get("approver") ?? undefined,
 search: searchParams.get("search") ?? undefined,
 columns: searchParams.get("columns") ? searchParams.get("columns")?.split(",") : undefined,
 };
}

function buildBackendUrl(path: string, query?: Record<string, string | number | boolean | string[] | undefined>) {
 const url = new URL(path, appConfig.backendBaseUrl);

 for (const [key, value] of Object.entries(query ?? {})) {
 if (value !== undefined && value !== null && value !== "") {
 if (Array.isArray(value)) {
 value.forEach(v => url.searchParams.append(key, String(v)));
 } else {
 url.searchParams.set(key, String(value));
 }
 }
 }

 return url.toString();
}

async function readRouteErrorPayload(response: Response) {
 const contentType = response.headers.get("content-type") ?? "";

 if (contentType.includes("application/json")) {
 return response.json().catch(() => null) as Promise<Record<string, unknown> | null>;
 }

 const text = await response.text().catch(() => "");
 return text ? { message: text } : null;
}

export async function proxyBackendFileResponse({
 pathCandidates,
 accessToken,
 method = "GET",
 query,
 body,
}: {
 pathCandidates: readonly string[];
 accessToken: string;
 method?: "GET" | "POST";
 query?: Record<string, string | number | boolean | string[] | undefined>;
 body?: unknown;
}) {
 let lastNotFound = false;
 const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

 for (const path of pathCandidates) {
 const response = await fetch(buildBackendUrl(path, query), {
 method,
 headers: {
 Authorization: `Bearer ${accessToken}`,
 ...(body && !isFormData ? { "Content-Type": "application/json", Accept: "*/*" } : {}),
 },
 body:
 body === undefined
 ? undefined
 : isFormData
 ? body
 : JSON.stringify(body),
 cache: "no-store",
 redirect: "follow",
 });

 if (response.status === 404) {
 lastNotFound = true;
 continue;
 }

 if (!response.ok) {
 const payload = await readRouteErrorPayload(response);
 throw new BackendApiError(
 typeof payload?.message === "string" ? payload.message : "No se pudo completar la descarga.",
 response.status,
 payload,
 );
 }

 const headers = new Headers({
 "Cache-Control": "no-store",
 });
 const contentType = response.headers.get("content-type");
 const contentDisposition = response.headers.get("content-disposition");

 if (contentType) {
 headers.set("Content-Type", contentType);
 }

 if (contentDisposition) {
 headers.set("Content-Disposition", contentDisposition);
 }

 return new Response(response.body, {
 status: response.status,
 headers,
 });
 }

 throw new BackendApiError("Ruta no encontrada en el backend.", lastNotFound ? 404 : 500);
}

export async function parseProxyBody(request: Request) {
 const contentType = request.headers.get("content-type") ?? "";

 if (contentType.includes("multipart/form-data")) {
 return request.formData();
 }

 const rawBody = await request.text();
 if (!rawBody) {
 return undefined;
 }

 return JSON.parse(rawBody) as unknown;
}
