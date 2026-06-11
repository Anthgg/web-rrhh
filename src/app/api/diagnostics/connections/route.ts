import { NextResponse } from "next/server";

import {
 ACCESS_TOKEN_COOKIE,
 REFRESH_TOKEN_COOKIE,
 getSessionCookies,
} from "@/lib/auth/cookies";
import { appConfig } from "@/lib/config/app-config";
import { backendRoutes } from "@/lib/config/backend-routes";

type DiagnosticModule =
 | "auth.profile"
 | "profile.current"
 | "dashboard.summary"
 | "dashboard.attendanceToday"
 | "dashboard.pendingRequests"
 | "dashboard.workerStatus"
 | "dashboard.contractsExpiring"
 | "dashboard.documentsPending"
 | "dashboard.lateWorkers"
 | "dashboard.projectSummary"
 | "requests.list"
 | "requests.types"
 | "requests.pending"
 | "documents.list"
 | "users.list"
 | "workers.list"
 | "reports.attendance"
 | "reports.monthlySummary"
 | "payroll.periods"
 | "roles.list";

interface CandidateDiagnostic {
 module: DiagnosticModule;
 path: string;
 method: "GET";
 ok: boolean;
 status: number | null;
 statusText: string;
 elapsedMs: number;
 message: string | null;
 responseShape: {
 type: "array" | "object" | "null" | "text";
 keys: string[];
 itemCount: number | null;
 };
}

interface ModuleDiagnostic {
 module: DiagnosticModule;
 requiresSession: boolean;
 selectedPath: string | null;
 candidates: CandidateDiagnostic[];
}

const buildUrl = (path: string, query?: Record<string, string | number>) => {
 const url = new URL(path, appConfig.backendBaseUrl);

 for (const [key, value] of Object.entries(query ?? {})) {
 url.searchParams.set(key, String(value));
 }

 return url.toString();
};

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

const describeShape = (payload: unknown): CandidateDiagnostic["responseShape"] => {
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

async function testCandidate({
 module,
 path,
 accessToken,
 query,
}: {
 module: DiagnosticModule;
 path: string;
 accessToken: string | null;
 query?: Record<string, string | number>;
}): Promise<CandidateDiagnostic> {
 const startedAt = Date.now();

 try {
 const response = await fetch(buildUrl(path, query), {
 method: "GET",
 headers: {
 Accept: "application/json",
 ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
 },
 cache: "no-store",
 });
 const payload = await readPayload(response);

 return {
 module,
 path,
 method: "GET",
 ok: response.ok,
 status: response.status,
 statusText: response.statusText,
 elapsedMs: Date.now() - startedAt,
 message: extractMessage(payload),
 responseShape: describeShape(payload),
 };
 } catch (error) {
 return {
 module,
 path,
 method: "GET",
 ok: false,
 status: null,
 statusText: "NETWORK_ERROR",
 elapsedMs: Date.now() - startedAt,
 message: error instanceof Error ? error.message : "No se pudo conectar al backend.",
 responseShape: {
 type: "null",
 keys: [],
 itemCount: null,
 },
 };
 }
}

async function testModule({
 module,
 paths,
 accessToken,
 requiresSession = true,
 query,
}: {
 module: DiagnosticModule;
 paths: readonly string[];
 accessToken: string | null;
 requiresSession?: boolean;
 query?: Record<string, string | number>;
}): Promise<ModuleDiagnostic> {
 if (requiresSession && !accessToken) {
 return {
 module,
 requiresSession,
 selectedPath: null,
 candidates: paths.map((path) => ({
 module,
 path,
 method: "GET",
 ok: false,
 status: null,
 statusText: "SESSION_REQUIRED",
 elapsedMs: 0,
 message: "No hay token web para probar este modulo.",
 responseShape: {
 type: "null",
 keys: [],
 itemCount: null,
 },
 })),
 };
 }

 const candidates = await Promise.all(
 paths.map((path) => testCandidate({ module, path, accessToken, query })),
 );

 return {
 module,
 requiresSession,
 selectedPath: candidates.find((candidate) => candidate.ok)?.path ?? null,
 candidates,
 };
}

const listQuery = {
 page: 1,
 pageSize: 1,
};

export async function GET() {
 const cookieStore = await getSessionCookies();
 const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
 const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value ?? null;

 const modules = await Promise.all([
 testModule({
 module: "auth.profile",
 paths: backendRoutes.auth.profile,
 accessToken,
 }),
 testModule({
 module: "profile.current",
 paths: backendRoutes.profile.current,
 accessToken,
 }),
 testModule({
 module: "dashboard.summary",
 paths: backendRoutes.dashboard.summary,
 accessToken,
 }),
 testModule({
 module: "dashboard.attendanceToday",
 paths: backendRoutes.dashboard.attendanceToday,
 accessToken,
 }),
 testModule({
 module: "dashboard.pendingRequests",
 paths: backendRoutes.dashboard.pendingRequests,
 accessToken,
 }),
 testModule({
 module: "dashboard.workerStatus",
 paths: backendRoutes.dashboard.workerStatus,
 accessToken,
 }),
 testModule({
 module: "dashboard.contractsExpiring",
 paths: backendRoutes.dashboard.contractsExpiring,
 accessToken,
 }),
 testModule({
 module: "dashboard.documentsPending",
 paths: backendRoutes.dashboard.documentsPending,
 accessToken,
 }),
 testModule({
 module: "dashboard.lateWorkers",
 paths: backendRoutes.dashboard.lateWorkers,
 accessToken,
 }),
 testModule({
 module: "dashboard.projectSummary",
 paths: backendRoutes.dashboard.projectSummary,
 accessToken,
 }),
 testModule({
 module: "requests.list",
 paths: backendRoutes.requests.list,
 accessToken,
 query: listQuery,
 }),
 testModule({
 module: "requests.types",
 paths: backendRoutes.requests.types,
 accessToken,
 }),
 testModule({
 module: "requests.pending",
 paths: backendRoutes.requests.pending,
 accessToken,
 query: listQuery,
 }),
 testModule({
 module: "documents.list",
 paths: backendRoutes.documents.list,
 accessToken,
 query: listQuery,
 }),
 testModule({
 module: "users.list",
 paths: backendRoutes.users.list,
 accessToken,
 query: listQuery,
 }),
 testModule({
 module: "workers.list",
 paths: backendRoutes.workers.list,
 accessToken,
 query: listQuery,
 }),
 testModule({
 module: "reports.attendance",
 paths: backendRoutes.reports.attendance,
 accessToken,
 }),
 testModule({
 module: "reports.monthlySummary",
 paths: backendRoutes.reports.monthlySummary,
 accessToken,
 }),
 testModule({
 module: "payroll.periods",
 paths: backendRoutes.payroll.periods,
 accessToken,
 }),
 testModule({
 module: "roles.list",
 paths: backendRoutes.roles.list,
 accessToken,
 }),
 ]);

 return NextResponse.json(
 {
 backendBaseUrl: appConfig.backendBaseUrl,
 generatedAt: new Date().toISOString(),
 session: {
 hasAccessToken: Boolean(accessToken),
 hasRefreshToken: Boolean(refreshToken),
 },
 modules,
 },
 {
 status: 200,
 },
 );
}
