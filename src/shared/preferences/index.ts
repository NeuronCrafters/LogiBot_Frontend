import { useSyncExternalStore } from "react";

export const PREFERENCES_STORAGE_KEY = "logibot.preferences";

export type ThemePreference = "system" | "dark" | "light";
export type TextSizePreference = "default" | "large" | "larger";
export type ContrastPreference = "system" | "default" | "more";
export type MotionPreference = "system" | "reduce" | "full";
export type ChatDisplayPreference = "progressive" | "complete";
export type PalettePreference = "default" | "redGreen" | "blueYellow" | "monochrome";

export interface Preferences {
  theme: ThemePreference;
  textSize: TextSizePreference;
  contrast: ContrastPreference;
  motion: MotionPreference;
  chatDisplay: ChatDisplayPreference;
  palette: PalettePreference;
}

export const DEFAULT_PREFERENCES: Preferences = {
  theme: "dark",
  textSize: "default",
  contrast: "system",
  motion: "system",
  chatDisplay: "progressive",
  palette: "default",
};

const OPTIONS: { [K in keyof Preferences]: readonly Preferences[K][] } = {
  theme: ["system", "dark", "light"],
  textSize: ["default", "large", "larger"],
  contrast: ["system", "default", "more"],
  motion: ["system", "reduce", "full"],
  chatDisplay: ["progressive", "complete"],
  palette: ["default", "redGreen", "blueYellow", "monochrome"],
};

export function sanitizePreferences(value: unknown): Preferences {
  const source = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const result = { ...DEFAULT_PREFERENCES };
  for (const key of Object.keys(OPTIONS) as (keyof Preferences)[]) {
    const candidate = source[key];
    if ((OPTIONS[key] as readonly unknown[]).includes(candidate)) (result as Record<string, unknown>)[key] = candidate;
  }
  return result;
}

function readStored(): Preferences {
  try {
    const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    return raw ? sanitizePreferences(JSON.parse(raw)) : { ...DEFAULT_PREFERENCES };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

function media(query: string): MediaQueryList | null {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" ? window.matchMedia(query) : null;
}

const systemQueries = {
  light: media("(prefers-color-scheme: light)"),
  reduceMotion: media("(prefers-reduced-motion: reduce)"),
  moreContrast: media("(prefers-contrast: more)"),
};

export interface ResolvedPreferences {
  theme: "dark" | "light";
  textSize: TextSizePreference;
  contrast: "default" | "more";
  reduceMotion: boolean;
  chatDisplay: ChatDisplayPreference;
  palette: PalettePreference;
}

export function resolvePreferences(preferences: Preferences): ResolvedPreferences {
  return {
    theme: preferences.theme === "system" ? (systemQueries.light?.matches ? "light" : "dark") : preferences.theme,
    textSize: preferences.textSize,
    contrast: preferences.contrast === "system" ? (systemQueries.moreContrast?.matches ? "more" : "default") : preferences.contrast,
    reduceMotion: preferences.motion === "system" ? Boolean(systemQueries.reduceMotion?.matches) : preferences.motion === "reduce",
    chatDisplay: preferences.chatDisplay,
    palette: preferences.palette,
  };
}

export function applyPreferences(resolved: ResolvedPreferences, root: HTMLElement | null = typeof document === "undefined" ? null : document.documentElement) {
  if (!root) return;
  root.classList.toggle("light", resolved.theme === "light");
  root.classList.toggle("dark", resolved.theme === "dark");
  root.dataset.text = resolved.textSize;
  root.dataset.contrast = resolved.contrast;
  root.dataset.motion = resolved.reduceMotion ? "reduce" : "full";
  root.dataset.palette = resolved.palette;
}

let preferences = readStored();
let resolved = resolvePreferences(preferences);
const listeners = new Set<() => void>();

function publish() {
  resolved = resolvePreferences(preferences);
  applyPreferences(resolved);
  listeners.forEach((listener) => listener());
}

function persist(action: () => void) {
  try {
    action();
  } catch {
    return;
  }
}

export function setPreference<K extends keyof Preferences>(key: K, value: Preferences[K]) {
  preferences = sanitizePreferences({ ...preferences, [key]: value });
  persist(() => localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences)));
  publish();
}

export function resetPreferences() {
  preferences = { ...DEFAULT_PREFERENCES };
  persist(() => localStorage.removeItem(PREFERENCES_STORAGE_KEY));
  publish();
}

for (const query of Object.values(systemQueries)) query?.addEventListener?.("change", publish);
if (typeof window !== "undefined")
  window.addEventListener("storage", (event) => {
    if (event.key !== PREFERENCES_STORAGE_KEY) return;
    preferences = readStored();
    publish();
  });
applyPreferences(resolved);

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const getPreferences = () => preferences;
export const getResolvedPreferences = () => resolved;
export function usePreferences() {
  return useSyncExternalStore(subscribe, getPreferences, getPreferences);
}
export function useResolvedPreferences() {
  return useSyncExternalStore(subscribe, getResolvedPreferences, getResolvedPreferences);
}
export function useReducedMotion() {
  return useResolvedPreferences().reduceMotion;
}
