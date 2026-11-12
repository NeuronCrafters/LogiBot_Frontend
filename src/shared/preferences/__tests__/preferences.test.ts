import { describe, expect, it, beforeEach } from "vitest";
import { applyPreferences, DEFAULT_PREFERENCES, PREFERENCES_STORAGE_KEY, resetPreferences, resolvePreferences, sanitizePreferences, setPreference } from "..";

describe("preferências de aparência e acessibilidade", () => {
  beforeEach(() => resetPreferences());

  it("mantém o tema escuro como padrão e descarta valores inválidos", () => {
    expect(DEFAULT_PREFERENCES.theme).toBe("dark");
    expect(sanitizePreferences({ theme: "neon", textSize: "large", motion: 3 })).toEqual({ ...DEFAULT_PREFERENCES, textSize: "large" });
    expect(sanitizePreferences(null)).toEqual(DEFAULT_PREFERENCES);
  });

  it("resolve escolhas explícitas sem depender do sistema", () => {
    const resolved = resolvePreferences({ theme: "light", textSize: "larger", contrast: "more", motion: "reduce", chatDisplay: "complete" });
    expect(resolved).toEqual({ theme: "light", textSize: "larger", contrast: "more", reduceMotion: true, chatDisplay: "complete" });
  });

  it("aplica os atributos no elemento raiz", () => {
    const root = document.createElement("html");
    applyPreferences({ theme: "light", textSize: "large", contrast: "default", reduceMotion: false, chatDisplay: "progressive" }, root);
    expect(root.classList.contains("light")).toBe(true);
    expect(root.classList.contains("dark")).toBe(false);
    expect(root.dataset).toMatchObject({ text: "large", contrast: "default", motion: "full" });
  });

  it("salva a escolha e atualiza o documento", () => {
    setPreference("theme", "light");
    expect(JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY)!).theme).toBe("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
    resetPreferences();
    expect(localStorage.getItem(PREFERENCES_STORAGE_KEY)).toBeNull();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
