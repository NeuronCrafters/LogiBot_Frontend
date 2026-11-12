import { describe, expect, it } from "vitest";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { CODE_BACKGROUND, CODE_MIN_CONTRAST, codeTheme } from "../codeTheme";
import { contrastRatio, ensureContrast, parseColor } from "@/shared/lib/contrast";

describe("contraste das cores", () => {
  it("lê hexadecimal, rgb e hsl", () => {
    expect(parseColor("#fff")).toEqual([255, 255, 255]);
    expect(parseColor("rgb(10, 20, 30)")).toEqual([10, 20, 30]);
    expect(parseColor("hsl(0, 100%, 50%)")).toEqual([255, 0, 0]);
    expect(parseColor("inherit")).toBeNull();
  });

  it("mantém cores que já passam e corrige as que não passam", () => {
    expect(ensureContrast("#ffffff", "#000000", 4.5)).toBe("#ffffff");
    const fixed = ensureContrast("#5c6370", "#1e1e1e", 4.5);
    expect(contrastRatio(parseColor(fixed)!, parseColor("#1e1e1e")!)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("realce de código nos temas", () => {
  for (const theme of ["dark", "light"] as const) {
    for (const contrast of ["default", "more"] as const) {
      it(`todas as cores de token passam ${CODE_MIN_CONTRAST[contrast]}:1 no tema ${theme} (${contrast})`, () => {
        const { style, background } = codeTheme(theme, contrast);
        expect(background).toBe(CODE_BACKGROUND[theme]);
        let checked = 0;
        for (const [selector, rules] of Object.entries(style)) {
          if (selector.includes("selection") || typeof rules.color !== "string") continue;
          const color = parseColor(rules.color);
          if (!color) continue;
          checked++;
          expect(contrastRatio(color, parseColor(background)!), selector).toBeGreaterThanOrEqual(CODE_MIN_CONTRAST[contrast]);
        }
        expect(checked).toBeGreaterThan(20);
      });
    }
  }

  it("preserva as cores originais do tema escuro que já eram legíveis", () => {
    const { style } = codeTheme("dark", "default");
    expect(style["keyword"].color).toBe(oneDark["keyword"].color);
    expect(style["comment"].color).not.toBe(oneDark["comment"].color);
  });
});
