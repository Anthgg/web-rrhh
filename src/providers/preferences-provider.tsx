"use client";

import { createContext, use, useCallback, useLayoutEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/features/auth/auth-provider";
import { apiClient } from "@/lib/api/client";
import { webApiEndpoints } from "@/lib/api/endpoints";
import type { VisualPreferences } from "@/types";

type Theme = VisualPreferences["theme"];
type Density = VisualPreferences["density"];
type AccentColor = VisualPreferences["accentColor"];

interface PreferencesState {
 theme: Theme;
 density: Density;
 accentColor: AccentColor;
 resolvedTheme: "light" | "dark";
}

interface PreferencesContextValue extends PreferencesState {
 setTheme: (theme: Theme) => void;
 setDensity: (density: Density) => void;
 setAccentColor: (accent: AccentColor) => void;
 updatePreferences: (prefs: Partial<Omit<PreferencesState, "resolvedTheme">>) => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

const STORAGE_KEY = "fabryor.preferences";
const DEFAULT_PREFERENCES: Omit<PreferencesState, "resolvedTheme"> = {
 theme: "system",
 density: "comfortable",
 accentColor: "green",
};

const allowedValues = {
 theme: ["light", "dark", "system"],
 density: ["comfortable", "compact"],
 accentColor: ["green", "blue", "purple", "gray"],
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
 return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isAllowedValue<K extends keyof VisualPreferences>(
 key: K,
 value: unknown,
): value is VisualPreferences[K] {
 return typeof value === "string" && (allowedValues[key] as readonly string[]).includes(value);
}

function normalizePreferences(source: unknown) {
 const record = isRecord(source) ? source : null;
 const data = isRecord(record?.data) ? record.data : record;
 const preferences = isRecord(data?.preferences) ? data.preferences : data;

 if (!preferences) return null;

 const rawTheme = preferences.theme;
 const rawDensity = preferences.density;
 const rawAccentColor = preferences.accentColor ?? preferences.accent_color;

 if (rawTheme === undefined && rawDensity === undefined && rawAccentColor === undefined) {
 return null;
 }

 return {
 theme: isAllowedValue("theme", rawTheme) ? rawTheme : DEFAULT_PREFERENCES.theme,
 density: isAllowedValue("density", rawDensity) ? rawDensity : DEFAULT_PREFERENCES.density,
 accentColor: isAllowedValue("accentColor", rawAccentColor)
 ? rawAccentColor
 : DEFAULT_PREFERENCES.accentColor,
 };
}

function sanitizePreferencePatch(
 patch: Partial<Omit<PreferencesState, "resolvedTheme">>,
): Partial<Omit<PreferencesState, "resolvedTheme">> {
 return {
 ...(isAllowedValue("theme", patch.theme) ? { theme: patch.theme } : {}),
 ...(isAllowedValue("density", patch.density) ? { density: patch.density } : {}),
 ...(isAllowedValue("accentColor", patch.accentColor) ? { accentColor: patch.accentColor } : {}),
 };
}

function persistLocalPreferences(preferences: Omit<PreferencesState, "resolvedTheme">) {
 try {
 localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
 } catch {
 // localStorage can be unavailable in private modes.
 }
}

function readLocalPreferences() {
 if (typeof window === "undefined") return DEFAULT_PREFERENCES;

 try {
 const stored = localStorage.getItem(STORAGE_KEY);
 if (!stored) return DEFAULT_PREFERENCES;
 return normalizePreferences(JSON.parse(stored)) ?? DEFAULT_PREFERENCES;
 } catch {
 return DEFAULT_PREFERENCES;
 }
}

function getSystemThemeSnapshot(): "light" | "dark" {
 if (typeof window === "undefined") return "light";
 return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribeToSystemTheme(onStoreChange: () => void) {
 if (typeof window === "undefined") return () => undefined;
 const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
 mediaQuery.addEventListener("change", onStoreChange);
 return () => mediaQuery.removeEventListener("change", onStoreChange);
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
 const { user, status } = useSession();
 const queryClient = useQueryClient();
 const systemTheme = useSyncExternalStore(
 subscribeToSystemTheme,
 getSystemThemeSnapshot,
 () => "light" as const,
 );
 const [manualPreferences, setManualPreferences] = useState<{
 userId: string | null;
 value: Omit<PreferencesState, "resolvedTheme">;
 } | null>(null);
 const [cachedPreferences] =
 useState<Omit<PreferencesState, "resolvedTheme">>(readLocalPreferences);
 const preferencesQueryKey = useMemo(
 () => ["user-preferences", user?.id ?? "anonymous"] as const,
 [user?.id],
 );
 const { data: serverPreferencesResponse } = useQuery({
 queryKey: preferencesQueryKey,
 queryFn: () =>
 apiClient<unknown>(webApiEndpoints.profile.preferences, {
 suppressUnauthorizedEvent: true,
 }),
 enabled: status === "authenticated" && Boolean(user?.id),
 staleTime: 5 * 60_000,
 });
 const sessionPreferences = useMemo(() => normalizePreferences(user?.preferences), [user?.preferences]);
 const serverPreferences = useMemo(
 () => normalizePreferences(serverPreferencesResponse),
 [serverPreferencesResponse],
 );
 const activeManualPreferences =
 manualPreferences &&
 (status !== "authenticated" || manualPreferences.userId === user?.id)
 ? manualPreferences.value
 : null;
 const preferences =
 activeManualPreferences ?? serverPreferences ?? sessionPreferences ?? cachedPreferences;
 const { theme, density, accentColor } = preferences;
 const resolvedTheme: "light" | "dark" =
 theme === "system" ? systemTheme : theme;

 // Sync theme to DOM
 useLayoutEffect(() => {
 const root = window.document.documentElement;
 root.setAttribute("data-theme", theme);
 root.setAttribute("data-density", density);
 root.setAttribute("data-accent", accentColor);

 if (resolvedTheme === "dark") {
 root.classList.add("dark");
 } else {
 root.classList.remove("dark");
 }
 }, [accentColor, density, resolvedTheme, theme]);

 const updatePreferences = useCallback(async (newPrefs: Partial<Omit<PreferencesState, "resolvedTheme">>) => {
 const patch = sanitizePreferencePatch(newPrefs);
 if (!Object.keys(patch).length) return;

 const previous = preferences;
 const updated = { ...preferences, ...patch };
 setManualPreferences({ userId: user?.id ?? null, value: updated });
 persistLocalPreferences(updated);

 if (status !== "authenticated") return;

 try {
 const response = await apiClient<unknown>(webApiEndpoints.profile.preferences, {
 method: "PUT",
 body: patch,
 });
 const serverPreferences = normalizePreferences(response);
 queryClient.setQueryData(preferencesQueryKey, response);
 if (serverPreferences) {
 setManualPreferences({ userId: user?.id ?? null, value: serverPreferences });
 persistLocalPreferences(serverPreferences);
 }
 } catch {
 setManualPreferences({ userId: user?.id ?? null, value: previous });
 persistLocalPreferences(previous);
 }
 }, [preferences, preferencesQueryKey, queryClient, status, user?.id]);

 const value = useMemo(
 () => ({
 ...preferences,
 resolvedTheme,
 setTheme: (t: Theme) => void updatePreferences({ theme: t }),
 setDensity: (d: Density) => void updatePreferences({ density: d }),
 setAccentColor: (a: AccentColor) => void updatePreferences({ accentColor: a }),
 updatePreferences,
 }),
 [preferences, resolvedTheme, updatePreferences]
 );

 return (
 <PreferencesContext.Provider value={value}>
 {children}
 </PreferencesContext.Provider>
 );
}

export function usePreferences() {
 const context = use(PreferencesContext);
 if (!context) {
 throw new Error("usePreferences must be used within a PreferencesProvider");
 }
 return context;
}
