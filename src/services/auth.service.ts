import { apiClient } from "@/lib/api/client";
import { webApiEndpoints } from "@/lib/api/endpoints";
import type { SessionData } from "@/types";

export interface LoginPayload {
  email: string;
  password: string;
}

export const authService = {
  login: (payload: LoginPayload) =>
    apiClient<SessionData>(webApiEndpoints.auth.login, {
      method: "POST",
      body: payload,
    }),
  session: () =>
    apiClient<SessionData>(webApiEndpoints.auth.session, {
      suppressUnauthorizedEvent: true,
    }),
  logout: () =>
    apiClient<{ success: boolean }>(webApiEndpoints.auth.logout, {
      method: "POST",
    }),
};
