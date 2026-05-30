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
import type { LoadableStatus, UserProfile } from "@/types";

interface AuthContextValue {
  user: UserProfile | null;
  status: LoadableStatus;
  login: (payload: LoginPayload) => Promise<void>;
  logout: (redirectToLogin?: boolean) => Promise<void>;
  refreshSession: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
  hasSessionCandidate: boolean;
}

export function AuthProvider({ children, hasSessionCandidate }: AuthProviderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<LoadableStatus>(hasSessionCandidate ? "loading" : "unauthenticated");
  const sessionRequestRef = useRef<Promise<UserProfile | null> | null>(null);
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

  const refreshSession = useCallback(async () => {
    if (sessionRequestRef.current) {
      return sessionRequestRef.current;
    }

    sessionRequestRef.current = authService
      .session()
      .then((session) => {
        setClientAccessToken(session.accessToken);
        setUser(session.user);
        setStatus("authenticated");
        lastRedirectRef.current = null;

        if (pathname === "/login") {
          replaceOnce("/dashboard");
        }

        return session.user;
      })
      .catch(() => {
        clearClientAccessToken();
        setUser(null);
        setStatus("unauthenticated");

        if (isProtectedPath(pathname)) {
          replaceOnce("/login?reason=session-expired");
        }

        return null;
      })
      .finally(() => {
        sessionRequestRef.current = null;
      });

    return sessionRequestRef.current;
  }, [pathname, replaceOnce]);

  const logout = useCallback(
    async (redirectToLogin = true) => {
      await authService.logout().catch(() => undefined);
      queryClient.clear();
      clearClientAccessToken();
      setUser(null);
      setStatus("unauthenticated");

      if (redirectToLogin) {
        replaceOnce("/login");
      }
    },
    [queryClient, replaceOnce],
  );

  const login = useCallback(
    async (payload: LoginPayload) => {
      setStatus("loading");
      const session = await authService.login(payload);
      setClientAccessToken(session.accessToken);
      setUser(session.user);
      setStatus("authenticated");
      lastRedirectRef.current = null;
      replaceOnce("/dashboard");
    },
    [replaceOnce],
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
      replaceOnce("/login?reason=auth-required");
    }
  }, [hasSessionCandidate, isAuthenticated, pathname, refreshSession, replaceOnce, status]);

  // Ref estable que siempre apunta al handler actual sin necesitar deps en el effect.
  // Equivalente funcional de useEffectEvent para versiones donde no está disponible.
  const onUnauthorizedRef = useRef(() => {
    void logout(pathname !== "/login");
  });
  useEffect(() => {
    onUnauthorizedRef.current = () => void logout(pathname !== "/login");
  });

  useEffect(() => {
    const handler = () => onUnauthorizedRef.current();
    window.addEventListener("auth:unauthorized", handler);
    return () => window.removeEventListener("auth:unauthorized", handler);
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
