import { describe, expect, it, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { applyPreferences, DEFAULT_PREFERENCES, PREFERENCES_STORAGE_KEY, resetPreferences, resolvePreferences, sanitizePreferences, setPreference } from "..";

describe("preferências de aparência e acessibilidade", () => {
  beforeEach(() => resetPreferences());

  it("mantém o tema escuro como padrão e descarta valores inválidos", () => {
    expect(DEFAULT_PREFERENCES.theme).toBe("dark");
    expect(sanitizePreferences({ theme: "neon", textSize: "large", motion: 3 })).toEqual({ ...DEFAULT_PREFERENCES, textSize: "large" });
    expect(sanitizePreferences(null)).toEqual(DEFAULT_PREFERENCES);
  });

  it("resolve escolhas explícitas sem depender do sistema", () => {
    const resolved = resolvePreferences({ theme: "light", textSize: "larger", contrast: "more", motion: "reduce", chatDisplay: "complete", palette: "blueYellow" });
    expect(resolved).toEqual({ theme: "light", textSize: "larger", contrast: "more", reduceMotion: true, chatDisplay: "complete", palette: "blueYellow" });
  });

  it("aplica os atributos no elemento raiz", () => {
    const root = document.createElement("html");
    applyPreferences({ theme: "light", textSize: "large", contrast: "default", reduceMotion: false, chatDisplay: "progressive", palette: "redGreen" }, root);
    expect(root.classList.contains("light")).toBe(true);
    expect(root.classList.contains("dark")).toBe(false);
    expect(root.dataset).toMatchObject({ text: "large", contrast: "default", motion: "full", palette: "redGreen" });
  });

  it("salva a escolha e atualiza o documento", () => {
    setPreference("theme", "light");
    expect(JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY)!).theme).toBe("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
    resetPreferences();
    expect(localStorage.getItem(PREFERENCES_STORAGE_KEY)).toBeNull();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("mantém a paleta padrão para escolhas antigas e descarta paletas desconhecidas", () => {
    expect(DEFAULT_PREFERENCES.palette).toBe("default");
    expect(sanitizePreferences({ theme: "light" }).palette).toBe("default");
    expect(sanitizePreferences({ palette: "rainbow" }).palette).toBe("default");
    expect(sanitizePreferences({ palette: "monochrome" }).palette).toBe("monochrome");
  });

  it("salva a paleta e a aplica no documento", () => {
    setPreference("palette", "redGreen");
    expect(JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY)!).palette).toBe("redGreen");
    expect(document.documentElement.dataset.palette).toBe("redGreen");
    resetPreferences();
    expect(document.documentElement.dataset.palette).toBe("default");
  });

  it("o script anterior à renderização aplica as mesmas escolhas que o módulo", () => {
    const script = readFileSync(`${process.cwd()}/public/preferences-init.js`, "utf8");
    for (const stored of [{ palette: "blueYellow", textSize: "larger", motion: "reduce", theme: "light", contrast: "more" }, { palette: "bogus", textSize: "huge" }, {}]) {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(stored));
      const root = document.documentElement;
      root.className = "";
      new Function(script)();
      const expected = document.createElement("html");
      applyPreferences(resolvePreferences(sanitizePreferences(stored)), expected);
      expect({ ...root.dataset }).toEqual({ ...expected.dataset });
      expect(root.classList.contains("light")).toBe(expected.classList.contains("light"));
    }
    localStorage.removeItem(PREFERENCES_STORAGE_KEY);
  });
});
