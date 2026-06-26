import { ApiClientError, apiClient } from "@/lib/api/client";
import { webApiEndpoints } from "@/lib/api/endpoints";
import { normalizeProfileSessionsResponse } from "@/lib/api/normalizers/session-normalizer";
import type { ChangePasswordPayload, ProfileEditableFields, ProfileSession } from "@/types";

type SessionListResponse =
  | ProfileSession[]
  | {
      data?: unknown;
      sessions?: unknown;
      revokedCount?: unknown;
    };

export interface RevokeOtherSessionsResult {
  revokedCount: number;
  revokedTokens: number;
  message: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object";

const readNumber = (record: Record<string, unknown>, keys: string[]): number | null => {
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

const readString = (record: Record<string, unknown>, keys: string[]): string | null => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
};

/**
 * Parses the revokeOtherSessions response.
 * Backend contract:
 *   { success, message, revokedCount, data: { revokedCount, revokedTokens } }
 * The proxy returns response.data which is the full backend body.
 */
const parseRevokeOtherResponse = (response: unknown): RevokeOtherSessionsResult => {
  const defaults: RevokeOtherSessionsResult = { revokedCount: 0, revokedTokens: 0, message: "" };
  if (!isRecord(response)) return defaults;

  // Top-level fields from backend
  const topCount = readNumber(response, ["revokedCount", "revoked_count"]) ?? 0;
  const topMessage = readString(response, ["message"]) ?? "";

  // Nested data object
  const nested = isRecord(response.data) ? response.data : null;
  const nestedCount = nested ? (readNumber(nested, ["revokedCount", "revoked_count"]) ?? 0) : 0;
  const nestedTokens = nested ? (readNumber(nested, ["revokedTokens", "revoked_tokens"]) ?? 0) : 0;

  return {
    revokedCount: topCount || nestedCount,
    revokedTokens: nestedTokens,
    message: topMessage,
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
  return normalizeProfileSessionsResponse(response);
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
  let response: unknown;
  try {
    response = await apiClient<unknown>(webApiEndpoints.profile.sessionsOther, {
      method: "DELETE",
      skipGlobalLoader: true,
    });
  } catch (error) {
    if (!(error instanceof ApiClientError) || error.status !== 404) throw error;
    response = await apiClient<unknown>(webApiEndpoints.profile.sessionsOtherFallback, {
      method: "DELETE",
      skipGlobalLoader: true,
    });
  }
  return parseRevokeOtherResponse(response);
}

export async function trustSession(id: string): Promise<void> {
  return apiClient<void>(webApiEndpoints.profile.trustSession(id), {
    method: "POST",
    skipGlobalLoader: true,
  });
}

export interface ProfileActivitiesResponse {
  success: boolean;
  data: {
    activities: Array<{
      id: string;
      action: string;
      actionLabel: string;
      description: string;
      scope: string;
      module: string;
      actorName: string;
      createdAt: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

export async function getProfileActivities(options?: {
  scope?: string;
  days?: number | null;
  page?: number;
  limit?: number;
}): Promise<ProfileActivitiesResponse> {
  const query: Record<string, string | number> = {};
  if (options?.scope) query.scope = options.scope;
  if (options?.days !== undefined && options?.days !== null) query.days = options.days;
  if (options?.page) query.page = options.page;
  if (options?.limit) query.limit = options.limit;

  return apiClient<ProfileActivitiesResponse>(webApiEndpoints.profile.activities, {
    query,
    skipGlobalLoader: true,
  });
}

// ─── Legacy object (kept for backwards-compat with existing imports) ──────────

/** @deprecated Use standalone functions: getCurrentProfile, updateCurrentProfile, changePassword */
export const profileService = {
  get: getCurrentProfile,
  update: updateCurrentProfile,
  changePassword: (payload: { currentPassword: string; newPassword: string; confirmPassword?: string }) => {
  // Strip confirmPassword before sending to backend
  const { currentPassword, newPassword } = payload;
  return changeProfilePassword({ currentPassword, newPassword });
  },
};
