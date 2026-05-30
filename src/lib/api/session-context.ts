import {
  BackendApiError,
  backendRequest,
  refreshBackendSession,
} from "@/lib/api/backend-client";
import { normalizeSession, normalizeTokens } from "@/lib/api/normalizers";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearSessionCookies,
  getSessionCookies,
  readSessionSnapshot,
  setSessionCookies,
  setSessionSnapshot,
  SESSION_SNAPSHOT_COOKIE,
} from "@/lib/auth/cookies";
import { getJwtState, maskToken } from "@/lib/auth/jwt";
import { appConfig } from "@/lib/config/app-config";
import { backendRoutes } from "@/lib/config/backend-routes";

const authDebug = (event: string, data: Record<string, unknown> = {}) => {
  if (!appConfig.authDebug) return;
  console.info(`[auth] ${event}`, data);
};

async function refreshSessionCookies(refreshToken: string) {
  const refreshedTokens = await refreshBackendSession(refreshToken);

  if (!refreshedTokens?.accessToken) {
    throw new BackendApiError("No fue posible renovar la sesion.", 401);
  }

  const mergedTokens = {
    accessToken: refreshedTokens.accessToken,
    refreshToken: refreshedTokens.refreshToken ?? refreshToken,
  };

  await setSessionCookies(mergedTokens);
  return mergedTokens;
}

export async function getSessionContext() {
  const cookieStore = await getSessionCookies();
  let accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
  let refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value ?? null;
  const cachedSession = readSessionSnapshot(cookieStore.get(SESSION_SNAPSHOT_COOKIE)?.value);
  let tokenState = getJwtState(accessToken);

  authDebug("session_check", {
    hasAccessToken: Boolean(accessToken),
    hasRefreshToken: Boolean(refreshToken),
    hasSnapshot: Boolean(cachedSession),
    accessToken: maskToken(accessToken),
    expiresAt: tokenState.expiresAt,
    secondsToExpire: tokenState.secondsToExpire,
  });

  if (!accessToken) {
    if (!refreshToken) {
      throw new BackendApiError("No existe una sesion activa.", 401);
    }

    try {
      const refreshed = await refreshSessionCookies(refreshToken);
      accessToken = refreshed.accessToken;
      refreshToken = refreshed.refreshToken ?? refreshToken;
      tokenState = getJwtState(accessToken);
    } catch (error) {
      await clearSessionCookies();
      throw new BackendApiError("No existe una sesion activa renovable.", 401, error);
    }
  }

  if (tokenState.isExpired) {
    authDebug("access_token_expired", {
      expiresAt: tokenState.expiresAt,
      hasRefreshToken: Boolean(refreshToken),
    });

    if (!refreshToken) {
      await clearSessionCookies();
      throw new BackendApiError("La sesion expiro.", 401);
    }

    try {
      const refreshed = await refreshSessionCookies(refreshToken);
      accessToken = refreshed.accessToken;
      refreshToken = refreshed.refreshToken ?? refreshToken;
      tokenState = getJwtState(accessToken);
    } catch (error) {
      await clearSessionCookies();
      throw new BackendApiError("La sesion expiro y no pudo renovarse.", 401, error);
    }
  }

  if (cachedSession) {
    authDebug("session_resolved_from_snapshot", {
      userId: cachedSession.user.id,
      role: cachedSession.user.role,
    });

    return {
      accessToken,
      refreshToken,
      session: cachedSession,
    };
  }

  try {
    const response = await backendRequest({
      pathCandidates: backendRoutes.auth.profile,
      accessToken,
      refreshToken,
    });

    if (response.refreshedTokens) {
      await setSessionCookies(response.refreshedTokens);
    }

    const resolvedSession = normalizeSession(response.data);
    await setSessionSnapshot(resolvedSession);

    authDebug("session_valid", {
      userId: resolvedSession.user.id,
      role: resolvedSession.user.role,
    });

    return {
      accessToken: response.refreshedTokens?.accessToken ?? accessToken,
      refreshToken: response.refreshedTokens?.refreshToken ?? refreshToken,
      session: resolvedSession,
    };
  } catch (error) {
    if (error instanceof BackendApiError && [401, 403].includes(error.status)) {
      await clearSessionCookies();
      throw error;
    }

    if (error instanceof BackendApiError) {
      throw error;
    }

    await clearSessionCookies();

    throw new BackendApiError("No se pudo validar la sesion actual.", 401, error);
  }
}

export async function createSessionFromLogin(email: string, password: string) {
  const response = await backendRequest({
    pathCandidates: backendRoutes.auth.login,
    method: "POST",
    body: {
      email,
      password,
    },
  });

  const tokens = normalizeTokens(response.data);

  if (!tokens?.accessToken) {
    throw new BackendApiError(
      "La API de autenticacion no devolvio un token utilizable.",
      502,
      response.data,
    );
  }

  await setSessionCookies(tokens);
  authDebug("login_tokens_saved", {
    hasAccessToken: Boolean(tokens.accessToken),
    hasRefreshToken: Boolean(tokens.refreshToken),
    accessToken: maskToken(tokens.accessToken),
    expiresAt: getJwtState(tokens.accessToken).expiresAt,
  });

  try {
    const profile = await backendRequest({
      pathCandidates: backendRoutes.auth.profile,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken ?? null,
    });

    if (profile.refreshedTokens) {
      await setSessionCookies(profile.refreshedTokens);
    }

    const session = normalizeSession(profile.data);
    await setSessionSnapshot(session);
    authDebug("login_profile_loaded", {
      userId: session.user.id,
      role: session.user.role,
    });
    return {
      session,
      accessToken: profile.refreshedTokens?.accessToken ?? tokens.accessToken,
    };
  } catch (error) {
    const session = normalizeSession(response.data);
    await setSessionSnapshot(session);
    authDebug("login_using_payload_user", {
      userId: session.user.id,
      role: session.user.role,
      reason: error instanceof Error ? error.message : "unknown",
    });
    return {
      session,
      accessToken: tokens.accessToken,
    };
  }
}
