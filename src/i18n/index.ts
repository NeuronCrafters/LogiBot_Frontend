import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { useSyncExternalStore } from "react";
import ptBR from "./catalogs/pt-BR.json";
import enUS from "./catalogs/en-US.json";
import esES from "./catalogs/es-ES.json";

export const SUPPORTED_LANGUAGES = ["pt-BR", "en-US", "es-ES"] as const;
export type Language = typeof SUPPORTED_LANGUAGES[number];
export type MessageKey = keyof typeof ptBR;
export type LanguageSelection = Language | null;
export const LANGUAGE_STORAGE_KEY = "logibot.language";
export const catalogs = { "pt-BR": ptBR, "en-US": enUS, "es-ES": esES };

export function normalizeLanguage(value: unknown): Language | undefined {
  if (typeof value !== "string") return undefined;
  const tag = value.trim().replace(/_/g, "-").toLowerCase();
  if (!/^[a-z]{2}(?:-[a-z0-9]{2,8})*$/.test(tag)) return undefined;
  if (tag === "pt" || tag.startsWith("pt-")) return "pt-BR";
  if (tag === "en" || tag.startsWith("en-")) return "en-US";
  if (tag === "es" || tag.startsWith("es-")) return "es-ES";
  return undefined;
}

export function browserLanguage(languages = typeof navigator === "undefined" ? [] : navigator.languages): Language {
  return languages.map(normalizeLanguage).find(Boolean) || "pt-BR";
}

function readLocalSelection(): LanguageSelection | undefined {
  try {
    const raw = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (raw === null) return undefined;
    const value = JSON.parse(raw);
    return value.mode === "system" ? null : normalizeLanguage(value.language);
  } catch { return undefined; }
}

let localSelection = readLocalSelection();
let accountSelection: LanguageSelection | undefined;
let explicitSelection: LanguageSelection | undefined;
const listeners = new Set<() => void>();
let snapshot = {
  language: (localSelection || browserLanguage()) as Language,
  selection: localSelection ?? null as LanguageSelection,
  explicitVersion: 0,
  saveState: "idle" as "idle" | "pending" | "saved" | "error",
};

void i18next.use(initReactI18next).init({
  resources: Object.fromEntries(Object.entries(catalogs).map(([language, translation]) => [language, { translation }])),
  lng: snapshot.language,
  fallbackLng: "pt-BR",
  supportedLngs: [...SUPPORTED_LANGUAGES],
  load: "currentOnly",
  keySeparator: false,
  nsSeparator: false,
  initAsync: false,
  interpolation: { escapeValue: false },
});

function publish(next: typeof snapshot) {
  snapshot = next;
  void i18next.changeLanguage(next.language);
  if (typeof document !== "undefined") document.documentElement.lang = next.language;
  listeners.forEach(listener => listener());
}

function resolve() {
  const selection = explicitSelection !== undefined ? explicitSelection : accountSelection !== undefined ? accountSelection : localSelection ?? null;
  publish({ ...snapshot, selection, language: selection || browserLanguage() });
}

export function getLanguage(): Language { return snapshot.language; }
export function getLanguageSnapshot() { return snapshot; }
export function getExplicitSelection() { return explicitSelection; }
export function subscribeLanguage(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function useLocale() { return useSyncExternalStore(subscribeLanguage, getLanguage, getLanguage); }
export function useLanguagePreference() { return useSyncExternalStore(subscribeLanguage, getLanguageSnapshot, getLanguageSnapshot); }

export function chooseLanguage(selection: LanguageSelection) {
  explicitSelection = selection;
  localSelection = selection;
  try { localStorage.setItem(LANGUAGE_STORAGE_KEY, JSON.stringify(selection === null ? { mode: "system" } : { mode: "fixed", language: selection })); } catch {}
  snapshot = { ...snapshot, explicitVersion: snapshot.explicitVersion + 1, saveState: "idle" };
  resolve();
}

export function applyAccountLanguage(preference: unknown) {
  accountSelection = preference === null ? null : normalizeLanguage(preference);
  resolve();
}
export function clearAccountLanguage(endSession = false) { accountSelection = undefined; if (endSession) explicitSelection = undefined; resolve(); }
export function refreshBrowserLanguage() { resolve(); }
export function setLanguageSaveState(saveState: typeof snapshot.saveState) { publish({ ...snapshot, saveState }); }
export function retryLanguageSave() { snapshot = { ...snapshot, explicitVersion: snapshot.explicitVersion + 1 }; resolve(); }
export function requestLanguageHeaders(): Record<string, string> {
  return { "Accept-Language": getLanguage(), ...(explicitSelection !== undefined ? { "X-Language": getLanguage() } : {}) };
}

export function t(key: MessageKey, params: Record<string, unknown> = {}, language: Language = getLanguage()): string {
  return i18next.t(key, { ...params, lng: language }) as string;
}

export function number(value: number, options?: Intl.NumberFormatOptions) { return new Intl.NumberFormat(getLanguage(), options).format(value); }
export function percent(value: number, options?: Intl.NumberFormatOptions) { return number(value, { style: "percent", maximumFractionDigits: 1, ...options }); }
export function date(value: Date | string, options?: Intl.DateTimeFormatOptions) {
  const dateValue = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(value + "T12:00:00") : new Date(value);
  return Number.isNaN(dateValue.getTime()) ? "—" : new Intl.DateTimeFormat(getLanguage(), options).format(dateValue);
}

if (typeof document !== "undefined") document.documentElement.lang = getLanguage();
if (typeof window !== "undefined") window.addEventListener("languagechange", refreshBrowserLanguage);

export const languageName = (language: Language | null | undefined) => language === "pt-BR" ? t("language.ptBR") : language === "en-US" ? t("language.enUS") : language === "es-ES" ? t("language.esES") : t("language.unknown");
