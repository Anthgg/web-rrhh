import { apiClient } from "@/lib/api/client";
import { webApiEndpoints } from "@/lib/api/endpoints";
import type { ChangePasswordPayload, ProfileEditableFields } from "@/types";

// ─── Standalone service functions ────────────────────────────────────────────

/**
 * Fetch the current user's full profile.
 * Returns the raw backend response so normalizeCurrentUserProfile can process it.
 */
export async function getCurrentProfile(): Promise<unknown> {
 return apiClient<unknown>(webApiEndpoints.profile.current);
}

/**
 * Update the current user's profile with only the changed fields.
 * Caller is responsible for building the diff payload via buildProfilePatchPayload.
 */
export async function updateCurrentProfile(
 payload: Partial<ProfileEditableFields>,
): Promise<unknown> {
 return apiClient<unknown>(webApiEndpoints.profile.current, {
 method: "PATCH",
 body: payload,
 });
}

/**
 * Change the current user's password.
 * Only sends currentPassword + newPassword — confirmPassword is NOT included.
 */
export async function changeProfilePassword(
 payload: ChangePasswordPayload,
): Promise<{ message?: string; success?: boolean }> {
 return apiClient<{ message?: string; success?: boolean }>(
 webApiEndpoints.profile.password,
 {
 method: "POST",
 body: payload,
 },
 );
}

/**
 * Upload the user's profile photo.
 * Expects a File object, wraps it in FormData, and sends a POST request.
 */
export async function uploadProfilePhoto(file: File): Promise<any> {
 const formData = new FormData();
 formData.append("photo", file);
 return apiClient<any>(webApiEndpoints.profile.photo, {
 method: "POST",
 body: formData,
 });
}

// ─── Legacy object (kept for backwards-compat with existing imports) ──────────

/** @deprecated Use standalone functions: getCurrentProfile, updateCurrentProfile, changeProfilePassword */
export const profileService = {
 get: getCurrentProfile,
 update: updateCurrentProfile,
 changePassword: (payload: { currentPassword: string; newPassword: string; confirmPassword?: string }) => {
 // Strip confirmPassword before sending to backend
 const { currentPassword, newPassword } = payload;
 return changeProfilePassword({ currentPassword, newPassword });
 },
};
