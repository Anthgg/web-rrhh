"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";

type Theme = "light" | "dark" | "system";
type Density = "comfortable" | "compact";
type AccentColor = "green" | "blue" | "purple" | "gray";

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

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
 const [mounted, setMounted] = useState(false);
 
 const [preferences, setPreferences] = useState<Omit<PreferencesState, "resolvedTheme">>({
 theme: "light",
 density: "comfortable",
 accentColor: "green",
 });

 const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

 // Load from local storage initially
 useEffect(() => {
 try {
 const stored = localStorage.getItem(STORAGE_KEY);
 if (stored) {
 setPreferences((prev) => ({ ...prev, ...JSON.parse(stored) }));
 }
 } catch (e) {
 // Ignore parse error
 }
 setMounted(true);
 }, []);

 // Sync theme to DOM
 useEffect(() => {
 if (!mounted) return;

 const root = window.document.documentElement;
 root.setAttribute("data-theme", preferences.theme);
 root.setAttribute("data-density", preferences.density);
 root.setAttribute("data-accent", preferences.accentColor);

 if (preferences.theme === "system") {
 const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
 setResolvedTheme(systemTheme);
 if (systemTheme === "dark") {
 root.classList.add("dark");
 } else {
 root.classList.remove("dark");
 }
 } else {
 setResolvedTheme(preferences.theme);
 if (preferences.theme === "dark") {
 root.classList.add("dark");
 } else {
 root.classList.remove("dark");
 }
 }
 }, [preferences, mounted]);

 // Listen to system theme changes if set to system
 useEffect(() => {
 if (preferences.theme !== "system") return;
 
 const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
 const handleChange = () => {
 const systemTheme = mediaQuery.matches ? "dark" : "light";
 setResolvedTheme(systemTheme);
 const root = window.document.documentElement;
 if (systemTheme === "dark") {
 root.classList.add("dark");
 } else {
 root.classList.remove("dark");
 }
 };

 mediaQuery.addEventListener("change", handleChange);
 return () => mediaQuery.removeEventListener("change", handleChange);
 }, [preferences.theme]);

 const updatePreferences = useCallback(async (newPrefs: Partial<Omit<PreferencesState, "resolvedTheme">>) => {
 const updated = { ...preferences, ...newPrefs };
 setPreferences(updated);
 
 try {
 localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
 } catch (e) {}

 }, [preferences]);

 const value = useMemo(
 () => ({
 ...preferences,
 resolvedTheme,
 setTheme: (t: Theme) => updatePreferences({ theme: t }),
 setDensity: (d: Density) => updatePreferences({ density: d }),
 setAccentColor: (a: AccentColor) => updatePreferences({ accentColor: a }),
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
 const context = useContext(PreferencesContext);
 if (!context) {
 throw new Error("usePreferences must be used within a PreferencesProvider");
 }
 return context;
}
