import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { appConfig } from "@/lib/config/app-config";
import { backendRoutes } from "@/lib/config/backend-routes";
import type { ReportRecord } from "@/types";

type ReportShape = NonNullable<ReportRecord["responseShape"]>;

const buildUrl = (path: string) => new URL(path, appConfig.backendBaseUrl).toString();

const readPayload = async (response: Response) => {
 const contentType = response.headers.get("content-type") ?? "";

 if (contentType.includes("application/json")) {
 return response.json().catch(() => null) as Promise<unknown>;
 }

 return response.text().catch(() => "") as Promise<unknown>;
};

const extractMessage = (payload: unknown) => {
 if (!payload || typeof payload !== "object") return null;

 const record = payload as Record<string, unknown>;
 if (typeof record.message === "string") return record.message;
 if (typeof record.error === "string") return record.error;

 return null;
};

const describeShape = (payload: unknown): ReportShape => {
 if (payload === null || payload === undefined) {
 return {
 type: "null",
 keys: [],
 itemCount: null,
 };
 }

 if (Array.isArray(payload)) {
 return {
 type: "array",
 keys: [],
 itemCount: payload.length,
 };
 }

 if (typeof payload === "object") {
 const record = payload as Record<string, unknown>;
 const nestedItems =
 Array.isArray(record.items) ? record.items :
 Array.isArray(record.results) ? record.results :
 Array.isArray(record.data) ? record.data :
 null;

 return {
 type: "object",
 keys: Object.keys(record).slice(0, 12),
 itemCount: nestedItems?.length ?? null,
 };
 }

 return {
 type: "text",
 keys: [],
 itemCount: null,
 };
};

async function readReportEndpoint({
 id,
 title,
 description,
 category,
 pathCandidates,
 accessToken,
}: {
 id: string;
 title: string;
 description: string;
 category: string;
 pathCandidates: readonly string[];
 accessToken: string;
}): Promise<ReportRecord> {
 let lastUnavailable: ReportRecord | null = null;

 // eslint-disable-next-line react-doctor/async-await-in-loop
 for (const path of pathCandidates) {
 try {
 const response = await fetch(buildUrl(path), {
 method: "GET",
 headers: {
 Accept: "application/json",
 Authorization: `Bearer ${accessToken}`,
 },
 cache: "no-store",
 });
 const payload = await readPayload(response);
 const baseRecord = {
 id,
 title,
 description,
 category,
 endpoint: path,
 httpStatus: response.status,
 message: extractMessage(payload),
 responseShape: describeShape(payload),
 };

 if (response.ok) {
 return {
 ...baseRecord,
 availability: "available",
 };
 }

 lastUnavailable = {
 ...baseRecord,
 availability: "unavailable",
 };

 if (response.status !== 404) {
 return lastUnavailable;
 }
 } catch (error) {
 lastUnavailable = {
 id,
 title,
 description,
 category,
 endpoint: path,
 availability: "unavailable",
 httpStatus: null,
 message: error instanceof Error ? error.message : "No se pudo conectar con el backend.",
 responseShape: {
 type: "null",
 keys: [],
 itemCount: null,
 },
 };
 }
 }

 return (
 lastUnavailable ?? {
 id,
 title,
 description,
 category,
 endpoint: pathCandidates[0],
 availability: "unavailable",
 httpStatus: 404,
 message: "No hay rutas administrativas configuradas para este reporte.",
 responseShape: {
 type: "null",
 keys: [],
 itemCount: null,
 },
 }
 );
}

export async function GET() {
 try {
 const context = await getSessionContext();
 const reports = await Promise.all([
 readReportEndpoint({
 id: "attendance",
 title: "Reporte de asistencia",
 description: "Respuesta real del endpoint administrativo de asistencia.",
 category: "Asistencia",
 pathCandidates: backendRoutes.reports.attendance,
 accessToken: context.accessToken,
 }),
 readReportEndpoint({
 id: "monthly-summary",
 title: "Resumen mensual",
 description: "Respuesta real del endpoint administrativo de resumen mensual.",
 category: "Resumen",
 pathCandidates: backendRoutes.reports.monthlySummary,
 accessToken: context.accessToken,
 }),
 ]);

 return jsonResponse(reports);
 } catch (error) {
 return handleRouteError(error);
 }
}
