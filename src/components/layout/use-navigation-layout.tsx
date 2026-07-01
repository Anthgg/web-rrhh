"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "fabryor:bottomNavVisible";

// First-time default: dock visible.
const DEFAULT_BOTTOM_NAV_VISIBLE = true;

interface NavigationLayoutContextValue {
  bottomNavVisible: boolean;
  toggleBottomNav: () => void;
  setBottomNavVisible: (visible: boolean) => void;
}

const NavigationLayoutContext = createContext<NavigationLayoutContextValue | null>(null);

// Lazy initial read. Guarded for SSR; the navigation chrome only renders after
// the session resolves on the client, so there is no hydration mismatch.
function readInitialBottomNav(): boolean {
  if (typeof window === "undefined") return DEFAULT_BOTTOM_NAV_VISIBLE;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === null ? DEFAULT_BOTTOM_NAV_VISIBLE : stored === "true";
  } catch {
    return DEFAULT_BOTTOM_NAV_VISIBLE;
  }
}

function persist(value: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    /* localStorage may be unavailable (private mode, disabled storage) */
  }
}

export function NavigationLayoutProvider({ children }: { children: React.ReactNode }) {
  const [bottomNavVisible, setBottomNavVisibleState] = useState<boolean>(readInitialBottomNav);

  const setBottomNavVisible = useCallback((visible: boolean) => {
    setBottomNavVisibleState(visible);
    persist(visible);
  }, []);

  const toggleBottomNav = useCallback(() => {
    setBottomNavVisibleState((current) => {
      const next = !current;
      persist(next);
      return next;
    });
  }, []);

  const value = useMemo<NavigationLayoutContextValue>(
    () => ({ bottomNavVisible, toggleBottomNav, setBottomNavVisible }),
    [bottomNavVisible, toggleBottomNav, setBottomNavVisible],
  );

  return (
    <NavigationLayoutContext.Provider value={value}>
      {children}
    </NavigationLayoutContext.Provider>
  );
}

export function useNavigationLayout(): NavigationLayoutContextValue {
  const context = useContext(NavigationLayoutContext);
  if (!context) {
    throw new Error("useNavigationLayout must be used within a NavigationLayoutProvider");
  }
  return context;
}
