"use client";

import type { UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import { getApiErrorCode, getApiErrorDetails, getApiErrorMessage } from "@/lib/api/error-handlers";

export interface ApiWarning {
 code?: string;
 errorCode?: string;
 message?: string;
 details?: Record<string, unknown>;
}

type WorkCrewSupervisorForm = {
 supervisorId: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
 return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function getWarningsFrom(value: unknown): ApiWarning[] {
 const record = asRecord(value);
 if (!record) return [];

 const warnings = record.warnings;
 return Array.isArray(warnings) ? warnings.filter((item): item is ApiWarning => Boolean(asRecord(item))) : [];
}

export function extractApiWarnings(response: unknown): ApiWarning[] {
 const direct = getWarningsFrom(response);
 if (direct.length) return direct;

 const record = asRecord(response);
 const data = asRecord(record?.data);
 const nestedData = asRecord(data?.data);

 return getWarningsFrom(data).concat(getWarningsFrom(nestedData));
}

function warningCode(warning: ApiWarning) {
 return warning.errorCode ?? warning.code ?? "";
}

function formatLimitMessage(details?: Record<string, unknown>) {
 const currentCrews = details?.currentCrews ?? details?.current_crews;
 const maxCrews = details?.maxCrews ?? details?.max_crews;

 if (typeof currentCrews === "number" && typeof maxCrews === "number") {
 return `El supervisor ya tiene ${currentCrews} cuadrillas asignadas. El maximo recomendado es ${maxCrews}.`;
 }

 return "El supervisor esta cerca del limite de cuadrillas asignadas.";
}

export function handleWorkCrewWarnings(warnings: ApiWarning[]) {
 warnings.forEach((warning) => {
 if (warningCode(warning) === "SUPERVISOR_CREWS_LIMIT_WARNING") {
 toast.warning(warning.message || formatLimitMessage(warning.details));
 }
 });
}

function supervisorErrorMessage(code: string | null, error: unknown) {
 const details = getApiErrorDetails(error);

 switch (code) {
 case "INVALID_SUPERVISOR_ID":
 return "Selecciona un supervisor valido.";
 case "SUPERVISOR_NOT_FOUND":
 return "El supervisor seleccionado no existe o no esta activo.";
 case "SUPERVISOR_ROLE_NOT_ALLOWED": {
 const allowedRoles = details?.allowedRoles ?? details?.allowed_roles;
 if (Array.isArray(allowedRoles) && allowedRoles.length) {
 return `El usuario seleccionado no puede supervisar cuadrillas. Roles permitidos: ${allowedRoles.join(", ")}.`;
 }
 return "El usuario seleccionado no tiene un rol permitido para supervisar cuadrillas.";
 }
 case "SUPERVISOR_CREWS_LIMIT_EXCEEDED": {
 const currentCrews = details?.currentCrews ?? details?.current_crews;
 const maxCrews = details?.maxCrews ?? details?.max_crews;
 if (typeof currentCrews === "number" && typeof maxCrews === "number") {
 return `El supervisor ya tiene ${currentCrews} cuadrillas asignadas. El maximo permitido es ${maxCrews}.`;
 }
 return "El supervisor supero el limite de cuadrillas asignadas.";
 }
 default:
 return getApiErrorMessage(error, "No se pudo guardar la cuadrilla.");
 }
}

export function handleWorkCrewSupervisorError(
 error: unknown,
 setError: UseFormSetError<WorkCrewSupervisorForm>,
) {
 const code = getApiErrorCode(error);
 const message = supervisorErrorMessage(code, error);

 if (code?.startsWith("SUPERVISOR") || code === "INVALID_SUPERVISOR_ID") {
 setError("supervisorId", { type: "server", message });
 }

 toast.error(message);
}
