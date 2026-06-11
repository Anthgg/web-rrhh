"use client";

import type { UserProfile } from "@/types";
import { ApiClientError } from "./client";

type ApiRecord = Record<string, unknown>;

export const WORKER_ASSIGNMENT_ERROR_MESSAGES: Record<string, string> = {
 WORKER_ALREADY_ASSIGNED: "El trabajador ya se encuentra asignado a otra obra o cuadrilla.",
 WORKER_ALREADY_IN_CREW: "El trabajador ya pertenece a esta cuadrilla.",
 WORKER_ASSIGNMENT_CONFLICT: "Existe un conflicto con la asignacion laboral del trabajador.",
 WORKER_REASSIGN_FORBIDDEN: "Solo su supervisor actual, RR.HH. o un administrador puede moverlo.",
 INVALID_WORKER_ID: "Selecciona un trabajador valido.",
 INVALID_CREW_ID: "Selecciona una cuadrilla valida.",
 INVALID_WORK_LOCATION_ID: "Selecciona un lugar de trabajo valido.",
 WORKER_NOT_FOUND: "No se encontro el trabajador seleccionado.",
 WORKER_FORBIDDEN: "No tienes acceso al trabajador seleccionado.",
 WORKER_USER_MISMATCH: "El usuario no corresponde al trabajador seleccionado.",
};

function isRecord(value: unknown): value is ApiRecord {
 return Boolean(value) && typeof value === "object";
}

function readString(source: unknown, keys: string[]): string | null {
 if (!isRecord(source)) return null;

 for (const key of keys) {
 const value = source[key];
 if (typeof value === "string" && value.trim()) return value;
 }

 return null;
}

function getNestedRecord(source: unknown, key: string): ApiRecord | null {
 if (!isRecord(source)) return null;
 const value = source[key];
 return isRecord(value) ? value : null;
}

export function getApiErrorDetails(error: unknown): ApiRecord | null {
 if (error instanceof ApiClientError) {
 if (isRecord(error.details)) return error.details;
 if (isRecord(error.payload?.details)) return error.payload.details;
 if (isRecord(error.payload)) return error.payload;
 }

 if (!isRecord(error)) return null;

 const directDetails = getNestedRecord(error, "details");
 if (directDetails) return directDetails;

 const response = getNestedRecord(error, "response");
 const responseData = getNestedRecord(response, "data");
 const responseDetails = getNestedRecord(responseData, "details");
 if (responseDetails) return responseDetails;
 if (responseData) return responseData;

 const data = getNestedRecord(error, "data");
 const dataDetails = getNestedRecord(data, "details");
 if (dataDetails) return dataDetails;
 if (data) return data;

 return null;
}

export function getApiErrorCode(error: unknown): string | null {
 if (error instanceof ApiClientError) {
 return error.code ?? readString(error.payload, ["errorCode", "code"]) ?? readString(error.details, ["errorCode", "code", "error_code"]);
 }

 return (
 readString(error, ["errorCode", "code", "error_code"]) ??
 readString(getApiErrorDetails(error), ["errorCode", "code", "error_code"]) ??
 readString(getNestedRecord(getNestedRecord(error, "response"), "data"), ["errorCode", "code", "error_code"])
 );
}

export function getApiErrorMessage(error: unknown, fallback = "La solicitud no pudo completarse."): string {
 if (error instanceof Error && error.message) return error.message;

 return (
 readString(error, ["message", "error"]) ??
 readString(getApiErrorDetails(error), ["message", "error"]) ??
 readString(getNestedRecord(getNestedRecord(error, "response"), "data"), ["message", "error"]) ??
 fallback
 );
}

export async function extractBlobErrorCode(error: unknown): Promise<string | null> {
 const responseData = getNestedRecord(error, "response")?.data;

 if (responseData instanceof Blob) {
 try {
 const text = await responseData.text();
 const json = JSON.parse(text) as unknown;
 return getApiErrorCode(json);
 } catch {
 return null;
 }
 }

 return getApiErrorCode(responseData) ?? getApiErrorCode(error);
}

export function canReassignWorker(user?: Pick<UserProfile, "role" | "roleCode" | "roleName" | "permissions"> | null): boolean {
 if (!user) return false;

 const roleValues = [user.role, user.roleCode, user.roleName]
 .map((value) => String(value ?? "").toLowerCase())
 .filter(Boolean);

 return (
 roleValues.some((role) => ["admin", "super_admin", "hr", "rr.hh.", "rrhh", "supervisor"].includes(role)) ||
 user.permissions?.some((permission) => {
 const normalized = permission.toLowerCase();
 return normalized.includes("workers.manage") || normalized.includes("work_crews.manage") || normalized.includes("reassign");
 }) === true
 );
}
