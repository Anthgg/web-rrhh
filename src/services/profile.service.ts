import { apiClient } from "@/lib/api/client";
import { webApiEndpoints } from "@/lib/api/endpoints";
import type { ChangePasswordInput, SessionData, UserProfile } from "@/types";

export const profileService = {
  get: () => apiClient<SessionData>(webApiEndpoints.profile.current),
  update: (payload: Partial<UserProfile>) =>
    apiClient<SessionData>(webApiEndpoints.profile.current, {
      method: "PATCH",
      body: payload,
    }),
  changePassword: (payload: ChangePasswordInput) =>
    apiClient<{ success: boolean; message: string }>(webApiEndpoints.profile.password, {
      method: "POST",
      body: payload,
    }),
};
