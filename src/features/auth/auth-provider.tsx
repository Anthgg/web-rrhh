"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  startTransition,
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import { isProtectedPath } from "@/lib/auth/access";
import {
  clearClientAccessToken,
  setClientAccessToken,
} from "@/lib/auth/client-token";
import { authService, type LoginPayload } from "@/services/auth.service";
import { ApiClientError } from "@/lib/api/client";
import type { LoadableStatus, UserProfile } from "@/types";

interface AuthContextValue {
  user: UserProfile | null;
  status: LoadableStatus;
  login: (payload: LoginPayload) => Promise<void>;
  logout: (redirectToLogin?: boolean, reason?: string) => Promise<void>;
  refreshSession: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Máximo de reintentos ante fallos transitorios al validar la sesión
 * (404 de proxy, 5xx del backend o errores de red). NO aplica a 401/403,
 * que sí indican una sesión inválida y deben cerrar sesión de inmediato.
 */
const MAX_TRANSIENT_SESSION_RETRIES = 4;

interface AuthProviderProps {
  children: React.ReactNode;
  hasSessionCandidate: boolean;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function hasRequiredPasswordFlag(record: Record<string, unknown>, flags: string[]): boolean {
  return flags.some((flag) => record[flag] === true || record[flag] === "true");
}

function checkPasswordChangeRequired(data: unknown): boolean {
  const root = asRecord(data);
  if (!root) return false;

  const flags = [
    "forcePasswordChange",
    "mustChangePassword",
    "passwordChangeRequired",
    "force_password_change",
    "password_change_required",
  ];

  if (hasRequiredPasswordFlag(root, flags)) return true;

  const user = asRecord(root.user);
  if (user && hasRequiredPasswordFlag(user, flags)) return true;

  const security = asRecord(user?.security);
  if (security && hasRequiredPasswordFlag(security, flags)) return true;

  return false;
}

export function AuthProvider({ children, hasSessionCandidate }: AuthProviderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<LoadableStatus>(hasSessionCandidate ? "loading" : "unauthenticated");
  const sessionRequestRef = useRef<Promise<UserProfile | null> | null>(null);
  const sessionFailedRef = useRef(false);
  const sessionRetryRef = useRef(0);
  const lastRedirectRef = useRef<string | null>(null);
  const isAuthenticated = status === "authenticated" || Boolean(user);

  const replaceOnce = useCallback(
    (target: string) => {
      if (lastRedirectRef.current === target) return;
      lastRedirectRef.current = target;

      startTransition(() => {
        router.replace(target);
        router.refresh();
      });
    },
    [router],
  );

  const replaceOnceRef = useRef(replaceOnce);

  const refreshSession = useCallback(async function refreshSessionImpl() {
    if (sessionFailedRef.current) {
      return null;
    }

    if (sessionRequestRef.current) {
      return sessionRequestRef.current;
    }

    sessionRequestRef.current = authService
      .session()
      .then((session) => {
        setClientAccessToken(session.accessToken);
        setUser(session.user);
        setStatus("authenticated");
        sessionFailedRef.current = false;
        sessionRetryRef.current = 0;
        lastRedirectRef.current = null;

        const needsChange = checkPasswordChangeRequired(session);
        if (needsChange) {
          setUser((old) => {
            if (!old) return null;
            return {
              ...old,
              forcePasswordChange: true,
            };
          });
          if (pathname !== "/change-password") {
            replaceOnceRef.current("/change-password");
          }
        } else if (pathname === "/login") {
          replaceOnceRef.current("/dashboard");
        }

        return session.user;
      })
      .catch((error: unknown) => {
        const httpStatus = error instanceof ApiClientError ? error.status : 0;
        const isAuthFailure = httpStatus === 401 || httpStatus === 403;

        if (isAuthFailure) {
          // Sesión realmente inválida (expirada/revocada): cerrar y enviar al login.
          sessionFailedRef.current = true;
          sessionRetryRef.current = 0;
          clearClientAccessToken();
          setUser(null);
          setStatus("unauthenticated");
          void authService.logout().catch(() => undefined);

          if (isProtectedPath(pathname)) {
            replaceOnceRef.current("/login?reason=session-expired");
          }

          return null;
        }

        // Fallo transitorio (404 de proxy, 5xx del backend o error de red):
        // NO destruir la sesión ni redirigir. Reintentar con backoff acotado;
        // así un hipo del servidor no provoca un cierre de sesión en falso.
        if (sessionRetryRef.current < MAX_TRANSIENT_SESSION_RETRIES) {
          sessionRetryRef.current += 1;
          const backoffMs = 1000 * sessionRetryRef.current;
          window.setTimeout(() => {
            void refreshSessionImpl();
          }, backoffMs);
        }

        return null;
      })
      .finally(() => {
        sessionRequestRef.current = null;
      });

    return sessionRequestRef.current;
  }, [pathname]);

  const logout = useCallback(
    async (redirectToLogin = true, reason?: string) => {
      await authService.logout().catch(() => undefined);
      queryClient.clear();
      clearClientAccessToken();

      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("token");
          localStorage.removeItem("accessToken");
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("accessToken");
        } catch {
          // Storage may be unavailable; continue with in-memory logout state.
        }
      }

      setUser(null);
      setStatus("unauthenticated");

      if (redirectToLogin) {
        replaceOnceRef.current(reason ? `/login?reason=${reason}` : "/login");
      }
    },
    [queryClient],
  );

  const login = useCallback(
    async (payload: LoginPayload) => {
      setStatus("loading");
      const session = await authService.login(payload);
      setClientAccessToken(session.accessToken);
      setUser(session.user);
      setStatus("authenticated");
      sessionFailedRef.current = false;
      lastRedirectRef.current = null;

      // Invalidate profile-sessions so the list gets updated
      void queryClient.invalidateQueries({ queryKey: ["profile-sessions"] });

      const needsChange = checkPasswordChangeRequired(session);
      if (needsChange) {
        setUser((old) => {
          if (!old) return null;
          return {
            ...old,
            forcePasswordChange: true,
          };
        });
        replaceOnceRef.current("/change-password");
      } else {
        replaceOnceRef.current("/dashboard");
      }
    },
    [queryClient],
  );

  useEffect(() => {
    if (!hasSessionCandidate && isAuthenticated) {
      return;
    }

    if (hasSessionCandidate && !isAuthenticated) {
      const timeoutId = window.setTimeout(() => {
        void refreshSession();
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }

    if (!hasSessionCandidate && status === "unauthenticated" && isProtectedPath(pathname)) {
      replaceOnceRef.current("/login?reason=auth-required");
    }
  }, [hasSessionCandidate, isAuthenticated, pathname, refreshSession, status]);

  // Ref estable que siempre apunta al handler actual sin necesitar deps en el effect.
  // Equivalente funcional de useEffectEvent para versiones donde no está disponible.
  const onUnauthorizedRef = useRef((reason?: string | null) => {
    const redirectReason = reason === "SESSION_REVOKED" ? "session-revoked" : (reason === "SESSION_EXPIRED" ? "session-expired" : "session-expired");
    void logout(pathname !== "/login", redirectReason);
  });

  useEffect(() => {
    replaceOnceRef.current = replaceOnce;
    onUnauthorizedRef.current = (reason?: string | null) => {
      const redirectReason = reason === "SESSION_REVOKED" ? "session-revoked" : (reason === "SESSION_EXPIRED" ? "session-expired" : "session-expired");
      void logout(pathname !== "/login", redirectReason);
    };
  });

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ errorCode?: string | null }>;
      const errorCode = customEvent.detail?.errorCode;
      onUnauthorizedRef.current(errorCode);
    };
    window.addEventListener("auth:unauthorized", handler);
    return () => window.removeEventListener("auth:unauthorized", handler);
  }, []);

  useEffect(() => {
    const handlePasswordChangeRequired = () => {
      setUser((old) => {
        if (!old) return null;
        return {
          ...old,
          forcePasswordChange: true,
        };
      });
      replaceOnceRef.current("/change-password");
    };
    window.addEventListener("auth:password-change-required", handlePasswordChangeRequired);
    return () => window.removeEventListener("auth:password-change-required", handlePasswordChangeRequired);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      login,
      logout,
      refreshSession,
    }),
    [login, logout, refreshSession, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useSession() {
  // React 19: use() es branch-aware y no requiere verificar el resultado
  const context = use(AuthContext);

  if (!context) {
    throw new Error("useSession debe usarse dentro de AuthProvider.");
  }

  return context;
}
