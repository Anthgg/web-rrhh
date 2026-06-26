import { apiClient } from "@/lib/api/client";
import { webApiEndpoints } from "@/lib/api/endpoints";
import type { SessionData } from "@/types";

export interface LoginDeviceInfo {
  userAgent: string;
  language?: string;
  timezone?: string;
  screen?: { width: number; height: number; pixelRatio: number };
  clientHints?: {
    platform: string;
    mobile: boolean;
    model: string;
    brands?: Array<{ brand: string; version: string }>;
  };
}

export interface LoginPayload {
  email: string;
  password: string;
  /** Optional client-side device info for the backend to use as fallback UA source */
  deviceInfo?: LoginDeviceInfo;
}

export const authService = {
 login: (payload: LoginPayload) =>
 apiClient<SessionData>(webApiEndpoints.auth.login, {
 method: "POST",
 body: payload,
 loaderMessage: "Iniciando sesion...",
 loaderDescription: "Validando credenciales y preparando tu panel.",
 }),
 session: () =>
 apiClient<SessionData>(webApiEndpoints.auth.session, {
 suppressUnauthorizedEvent: true,
 skipGlobalLoader: true,
 }),
 logout: () =>
 apiClient<{ success: boolean }>(webApiEndpoints.auth.logout, {
 method: "POST",
 skipGlobalLoader: true,
 }),
 verifyPassword: (password: string) =>
 apiClient<{ success: boolean; message?: string }>(webApiEndpoints.auth.verifyPassword, {
 method: "POST",
 body: { password },
 skipGlobalLoader: true,
 }),
  verify2fa: (code: string, tempToken: string, deviceInfo?: LoginDeviceInfo) =>
    apiClient<SessionData>(webApiEndpoints.auth.verify2fa, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tempToken}`,
      },
      body: { code, deviceInfo },
      loaderMessage: "Verificando código 2FA...",
      loaderDescription: "Validando el código de seguridad e iniciando sesión.",
    }),
  changePassword: (payload: { currentPassword?: string; newPassword?: string }) =>
    apiClient<{ success: boolean; message?: string }>(webApiEndpoints.auth.changePassword, {
      method: "POST",
      body: payload,
      loaderMessage: "Cambiando contraseña...",
      loaderDescription: "Procesando el cambio de contraseña obligatorio.",
    }),
};
