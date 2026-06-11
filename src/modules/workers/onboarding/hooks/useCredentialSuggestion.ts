import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { onboardingService } from "../services/onboarding.service";
import type { OnboardingFormValues } from "../schemas/onboarding.schema";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SuggestCredentialsData {
 username: string;
 corporateEmail: string;
 temporaryPassword: string;
 forcePasswordChange: boolean;
 alternatives: string[];
}

// ─── Password helpers ──────────────────────────────────────────────────────────

/**
 * Generates a secure temporary password satisfying policy rules:
 * ≥8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 symbol.
 * Uses crypto.getRandomValues — NOT Math.random.
 */
export function generateTemporaryPassword(): string {
 const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
 const lower = "abcdefghjkmnpqrstuvwxyz";
 const digits = "23456789";
 const symbols = "!@#$%&*-_=+?";
 const all = upper + lower + digits + symbols;

 const pick = (charset: string) =>
 charset[crypto.getRandomValues(new Uint8Array(1))[0] % charset.length];

 const mandatory = [pick(upper), pick(lower), pick(digits), pick(symbols)];
 const extra = Array.from({ length: 4 }, () => pick(all));

 const chars = [...mandatory, ...extra];
 const rand = new Uint8Array(chars.length);
 crypto.getRandomValues(rand);
 for (let i = chars.length - 1; i > 0; i--) {
 const j = rand[i] % (i + 1);
 [chars[i], chars[j]] = [chars[j], chars[i]];
 }
 return chars.join("");
}

export const TEMPORARY_PASSWORD_REGEX =
 /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%&*\-_=+?]).{8,}$/;

/** Password policy check — returns per-rule boolean map. */
export function validateTemporaryPassword(password: string) {
 return {
 minLength: password.length >= 8,
 uppercase: /[A-Z]/.test(password),
 lowercase: /[a-z]/.test(password),
 number: /\d/.test(password),
 symbol: /[!@#$%&*\-_=+?]/.test(password),
 };
}

export function isTemporaryPasswordValid(password: string): boolean {
 return TEMPORARY_PASSWORD_REGEX.test(password);
}

import {
 normalizeUserRole as apiNormalizeUserRole,
 normalizeSuggestCredentialsData as apiNormalizeSuggestCredentialsData
} from "@/lib/api/normalizers";

export function normalizeUserRole(user: any) {
 return apiNormalizeUserRole(user);
}

export function normalizeSuggestCredentialsData(raw: any): SuggestCredentialsData {
 return apiNormalizeSuggestCredentialsData(raw);
}


/** Translate backend error codes into user-facing Spanish messages. */
function handleSuggestCredentialsError(error: unknown): string {
 const err = error as Record<string, unknown> | null;
 const status = (err?.status as number | undefined) ?? (err?.response as Record<string, unknown>)?.status;
 const code = (
 (err?.details as Record<string, unknown>)?.code ??
 ((err?.response as Record<string, unknown>)?.data as Record<string, unknown>)?.code
 ) as string | undefined;

 if (status === 422 && code === "VALIDATION_FAILED") return "Faltan datos obligatorios para generar credenciales.";
 if (status === 422 && code === "COMPANY_DOMAIN_NOT_FOUND") return "Esta empresa no tiene dominio de email configurado. Contacta al administrador del sistema.";
 if (status === 401 || status === 403) return "No tienes permisos para generar credenciales.";
 if (error instanceof Error) return error.message || "No se pudieron generar las credenciales.";
 return "No se pudieron generar las credenciales. Intenta nuevamente.";
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Manages the "suggest credentials" mutation for the access-data step.
 *
 * Receives the full form so it can:
 * - read dirtyFields to avoid overwriting manually-edited values
 * - use setValue to populate fields after a successful suggestion
 *
 * SECURITY: temporaryPassword only lives in form state while the form is open.
 * It is never logged, stored in localStorage/sessionStorage/cookie/URL/IndexedDB.
 */
export function useCredentialSuggestion(form: UseFormReturn<OnboardingFormValues>) {
 const { setValue, formState } = form;

 const [alternatives, setAlternatives] = useState<string[]>([]);
 const [suggestionError, setSuggestionError] = useState<string | null>(null);

 // Track whether the admin has EVER manually edited a credential field.
 // Once true, auto-suggest will NOT overwrite that field again.
 const manualEdits = useRef({
 username: false,
 corporateEmail: false,
 temporaryPassword: false,
 });

 const isForcingRef = useRef(false);

 // Safe writer: only sets the field if the admin has NOT manually edited it.
 const safeSet = (
 field: "accessData.username" | "accessData.corporateEmail" | "accessData.temporaryPassword",
 value: string,
 key: keyof typeof manualEdits.current,
 ) => {
 if (!isForcingRef.current) {
 const isDirty = formState.dirtyFields?.accessData?.[key as keyof typeof formState.dirtyFields.accessData];
 if (isDirty || manualEdits.current[key]) return; // respect manual edits
 }
 setValue(field, value, { shouldValidate: true });
 };

 // Called from AccessDataForm when an admin types in a credential field.
 const markManualEdit = (key: keyof typeof manualEdits.current) => {
 manualEdits.current[key] = true;
 };

 // Reset manual-edit flags when admin explicitly clicks "Regenerar credenciales".
 // This signals explicit intent to overwrite everything.
 const resetManualEdits = () => {
 manualEdits.current = { username: false, corporateEmail: false, temporaryPassword: false };
 };

 const mutation = useMutation({
 mutationFn: async (params: {
 companyId: string;
 firstName: string;
 paternalLastName: string;
 maternalLastName?: string;
 }) => {
 const response = await onboardingService.suggestCredentials({
 company_id: params.companyId,
 first_name: params.firstName,
 paternal_last_name: params.paternalLastName,
 maternal_last_name: params.maternalLastName,
 });

 return normalizeSuggestCredentialsData(response);
 },
 retry: false,
 onSuccess: (data) => {
 let password = data.temporaryPassword.trim();

 if (!password) {
 toast.warning("El servidor no retornó una contraseña temporal sugerida.");
 // Fallback temporal: remover cuando backend garantice temporaryPassword.
 password = generateTemporaryPassword();
 }

 safeSet("accessData.username", data.username, "username");
 safeSet("accessData.corporateEmail", data.corporateEmail, "corporateEmail");
 safeSet("accessData.temporaryPassword", password, "temporaryPassword");

 // forcePasswordChange is always driven by the backend — not user-editable
 setValue("accessData.forcePasswordChange", data.forcePasswordChange);

 setAlternatives(data.alternatives);
 setSuggestionError(null);
 toast.success("Credenciales generadas correctamente.");
 },
 onError: (error) => {
 setSuggestionError(handleSuggestCredentialsError(error));
 },
 onSettled: () => {
 isForcingRef.current = false;
 },
 });

 const suggestCredentials = (
 companyId: string,
 firstName: string,
 paternalLastName: string,
 maternalLastName?: string,
 { force = false }: { force?: boolean } = {},
 ) => {
 if (force) {
 resetManualEdits(); // explicit regeneration — clear protection flags
 isForcingRef.current = true;
 }
 setSuggestionError(null);
 mutation.mutate({ companyId, firstName, paternalLastName, maternalLastName });
 };

 return {
 suggestCredentials,
 markManualEdit,
 isSuggesting: mutation.isPending,
 hasGenerated: mutation.isSuccess,
 suggestionError,
 setSuggestionError,
 alternatives,
 };
}
