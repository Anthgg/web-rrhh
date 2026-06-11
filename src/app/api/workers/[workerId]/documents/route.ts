import { BackendApiError, backendRequest } from "@/lib/api/backend-client";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import type { WorkerGeneratedDocument } from "@/types";

const asRecord = (value: unknown) => (value && typeof value === "object" ? (value as Record<string, unknown>) : {});

const firstArray = (payload: unknown): unknown[] => {
 if (Array.isArray(payload)) return payload;
 const record = asRecord(payload);
 for (const key of ["data", "items", "documents", "results"]) {
 const value = record[key];
 if (Array.isArray(value)) return value;
 if (value && typeof value === "object") {
 const nested = firstArray(value);
 if (nested.length) return nested;
 }
 }
 return [];
};

const normalizeDocument = (source: unknown): WorkerGeneratedDocument => {
 const record = asRecord(source);
 const name = String(record.name ?? record.title ?? record.file_name ?? "Documento generado");

 return {
 id: String(record.id ?? record.document_id ?? record.uuid ?? name),
 name,
 type: String(record.type ?? record.document_type ?? record.category ?? "Documento generado"),
 generatedAt: String(record.generated_at ?? record.created_at ?? record.updated_at ?? new Date().toISOString()),
 generatedBy: String(record.generated_by_name ?? record.generated_by ?? record.created_by_name ?? "Sistema"),
 url: typeof record.url === "string" ? record.url : typeof record.file_url === "string" ? record.file_url : undefined,
 fileName: typeof record.file_name === "string" ? record.file_name : undefined,
 };
};

const documentPaths = (workerId: string) => [
 `/api/workers/${workerId}/documents`,
 `/api/workers/${workerId}/reports`,
 `/api/admin/workers/${workerId}/documents`,
 `/api/employees/${workerId}/documents`,
];

export async function GET(_: Request, props: { params: Promise<{ workerId: string }> }) {
 try {
 const { workerId } = await props.params;
 const context = await getSessionContext();
 const response = await backendRequest<unknown>({
 pathCandidates: documentPaths(workerId),
 accessToken: context.accessToken,
 refreshToken: context.refreshToken,
 });

 return jsonResponse(firstArray(response.data).map(normalizeDocument));
 } catch (error) {
 if (error instanceof BackendApiError && error.status === 404) {
 return jsonResponse([]);
 }
 return handleRouteError(error);
 }
}

export async function POST(request: Request, props: { params: Promise<{ workerId: string }> }) {
 try {
 const { workerId } = await props.params;
 const context = await getSessionContext();
 const body = await request.json();
 const response = await backendRequest<unknown>({
 pathCandidates: documentPaths(workerId),
 method: "POST",
 accessToken: context.accessToken,
 refreshToken: context.refreshToken,
 body: {
 name: body.name,
 title: body.name,
 type: body.type,
 document_type: body.type,
 file_name: body.fileName,
 mime_type: body.mimeType,
 base64: body.base64,
 content_base64: body.base64,
 generated_by: body.generatedBy,
 },
 });

 return jsonResponse(normalizeDocument(response.data));
 } catch (error) {
 return handleRouteError(error);
 }
}
