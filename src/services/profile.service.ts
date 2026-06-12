import { apiClient } from "@/lib/api/client";
import { webApiEndpoints } from "@/lib/api/endpoints";
import type { ChangePasswordPayload, ProfileEditableFields, ProfileSession } from "@/types";

type SessionListResponse =
 | ProfileSession[]
 | {
 data?: unknown;
 sessions?: unknown;
 revokedCount?: unknown;
 };

export interface RevokeOtherSessionsResult {
 revokedCount?: number | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
 Boolean(value) && typeof value === "object";

const readString = (record: Record<string, unknown>, keys: string[]) => {
 for (const key of keys) {
 const value = record[key];
 if (typeof value === "string" && value.trim()) return value.trim();
 if (typeof value === "number") return String(value);
 }
 return null;
};

const readBoolean = (record: Record<string, unknown>, keys: string[]) => {
 for (const key of keys) {
 const value = record[key];
 if (typeof value === "boolean") return value;
 if (typeof value === "string") {
 const normalized = value.toLowerCase();
 if (normalized === "true") return true;
 if (normalized === "false") return false;
 }
 }
 return null;
};

const readNumber = (record: Record<string, unknown>, keys: string[]) => {
 for (const key of keys) {
 const value = record[key];
 if (typeof value === "number" && Number.isFinite(value)) return value;
 if (typeof value === "string" && value.trim()) {
 const parsed = Number(value);
 if (Number.isFinite(parsed)) return parsed;
 }
 }
 return null;
};

const readSessionList = (response: unknown): unknown[] => {
 if (Array.isArray(response)) return response;
 if (!isRecord(response)) return [];
 if (Array.isArray(response.data)) return response.data;
 if (Array.isArray(response.sessions)) return response.sessions;
 return [];
};

const readRevokedCount = (response: unknown) => {
 if (!isRecord(response)) return null;
 const nested = isRecord(response.data) ? response.data : null;
 return readNumber(response, ["revokedCount", "revoked_count"]) ?? (nested ? readNumber(nested, ["revokedCount", "revoked_count"]) : null);
};

const normalizeProfileSession = (value: unknown): ProfileSession | null => {
 if (!isRecord(value)) return null;

 const id = readString(value, ["id", "sessionId", "session_id"]);
 if (!id) return null;

 const metadata = isRecord(value.metadata) ? value.metadata : null;
 const isTrusted = readBoolean(value, ["isTrusted", "is_trusted", "trusted"]) ?? false;
 const canTrust = readBoolean(value, ["canTrust", "can_trust"]) ?? !isTrusted;

 return {
 id,
 userId: readString(value, ["userId", "user_id"]) ?? "",
 userAgent: readString(value, ["userAgent", "user_agent"]) ?? (metadata ? readString(metadata, ["userAgent", "user_agent"]) : null),
 ipAddress: readString(value, ["ipAddress", "ip_address", "ip"]),
 location: readString(value, ["location", "ubicacion"]),
 country: readString(value, ["country", "pais"]),
 city: readString(value, ["city", "ciudad"]),
 latitude: readNumber(value, ["latitude", "lat"]),
 longitude: readNumber(value, ["longitude", "lng", "lon"]),
 browser: readString(value, ["browser", "navegador"]),
 os: readString(value, ["os", "system", "sistema"]),
 deviceType: readString(value, ["deviceType", "device_type", "type"]),
 deviceName: readString(value, ["deviceName", "device_name", "name"]),
 isTrusted,
 trustedAt: readString(value, ["trustedAt", "trusted_at"]),
 trustAvailableAt: readString(value, ["trustAvailableAt", "trust_available_at"]),
 lastActivityAt: readString(value, ["lastActivityAt", "last_activity_at", "lastActivity", "last_activity"]),
 expiresAt: readString(value, ["expiresAt", "expires_at", "expiration"]),
 isCurrent: readBoolean(value, ["isCurrent", "is_current", "current"]) ?? false,
 canTrust,
 };
};

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
export async function uploadProfilePhoto(file: File): Promise<unknown> {
 const formData = new FormData();
 formData.append("photo", file);
 return apiClient<unknown>(webApiEndpoints.profile.photo, {
 method: "POST",
 body: formData,
 });
}

/**
 * Fetch the current user's active sessions.
 */
export async function getActiveSessions(): Promise<ProfileSession[]> {
 const response = await apiClient<SessionListResponse>(webApiEndpoints.profile.sessions);
 return readSessionList(response)
 .map(normalizeProfileSession)
 .filter((session): session is ProfileSession => session !== null);
}

/**
 * Revoke a specific session by ID.
 */
export async function revokeSession(id: string): Promise<void> {
  return apiClient<void>(webApiEndpoints.profile.revokeSession(id), {
    method: "DELETE",
  });
}

/**
 * Revoke all other active sessions for the current user.
 */
export async function revokeOtherSessions(): Promise<RevokeOtherSessionsResult> {
 const response = await apiClient<unknown>(webApiEndpoints.profile.sessionsOther, {
 method: "DELETE",
 });
 return {
 revokedCount: readRevokedCount(response),
 };
}

/**
 * Mark a specific session as trusted by ID.
 */
export async function trustSession(id: string): Promise<void> {
  return apiClient<void>(webApiEndpoints.profile.trustSession(id), {
    method: "POST",
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
