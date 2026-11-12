import { describe, expect, it } from "vitest";
import palettes from "../chartPalettes.json";
import { contrastRatio, parseColor, type Rgb } from "@/shared/lib/contrast";

// Machado, Oliveira & Fernandes (2009), severity 1.0, applied to linear RGB.
const SIMULATIONS: Record<string, number[][] | null> = {
  normal: null,
  protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  tritanopia: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
};

const toLinear = (v: number) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const fromLinear = (v: number) => { const c = Math.min(1, Math.max(0, v)); return 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055); };

function simulate(rgb: Rgb, vision: string): Rgb {
  const matrix = SIMULATIONS[vision];
  if (!matrix) return rgb;
  const linear = rgb.map(toLinear);
  return matrix.map((row) => fromLinear(row.reduce((sum, value, i) => sum + value * linear[i], 0))) as Rgb;
}

function lab(rgb: Rgb) {
  const [r, g, b] = rgb.map(toLinear);
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const x = f((0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047);
  const y = f(0.2126 * r + 0.7152 * g + 0.0722 * b);
  const z = f((0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

const deltaE = (a: Rgb, b: Rgb) => Math.hypot(...lab(a).map((v, i) => v - lab(b)[i]));
const SURFACES = { dark: ["#1f1f1f", "#141414"], light: ["#f4f6f9", "#eceff4"] } as const;
const CATEGORIES = ["positive", "negative", "warning", "info"] as const;
const TARGETS: Record<string, { vision: string; min: number }[]> = {
  redGreen: [{ vision: "normal", min: 30 }, { vision: "protanopia", min: 15 }, { vision: "deuteranopia", min: 15 }],
  blueYellow: [{ vision: "normal", min: 30 }, { vision: "tritanopia", min: 25 }],
  monochrome: [{ vision: "normal", min: 8 }, { vision: "protanopia", min: 8 }, { vision: "deuteranopia", min: 8 }, { vision: "tritanopia", min: 8 }],
};

function minimumDistance(colors: Record<string, string>, vision: string) {
  let minimum = Infinity;
  for (let i = 0; i < CATEGORIES.length; i++)
    for (let j = i + 1; j < CATEGORIES.length; j++)
      minimum = Math.min(minimum, deltaE(simulate(parseColor(colors[CATEGORIES[i]])!, vision), simulate(parseColor(colors[CATEGORIES[j]])!, vision)));
  return minimum;
}

describe("paletas alternativas dos gráficos", () => {
  for (const [name, themes] of Object.entries(palettes)) {
    for (const [theme, colors] of Object.entries(themes) as [keyof typeof SURFACES, Record<string, string>][]) {
      it(`${name} (${theme}) mantém 4,5:1 contra as superfícies, pois as cores também são usadas em textos`, () => {
        for (const [token, value] of Object.entries(colors))
          for (const surface of SURFACES[theme])
            expect(contrastRatio(parseColor(value)!, parseColor(surface)!), `${token} sobre ${surface}`).toBeGreaterThanOrEqual(4.5);
      });

      it(`${name} (${theme}) mantém as categorias distinguíveis nas simulações previstas`, () => {
        for (const { vision, min } of TARGETS[name])
          expect(minimumDistance(colors, vision), vision).toBeGreaterThanOrEqual(min);
      });
    }

    it(`${name} define as mesmas categorias nos temas claro e escuro`, () => {
      expect(Object.keys(themes.dark).sort()).toEqual(Object.keys(themes.light).sort());
    });
  }

  it("os tons de cinza mantêm a mesma ordem de luminosidade nos dois temas", () => {
    const order = (theme: "dark" | "light") => [...CATEGORIES].sort((a, b) => contrastRatio(parseColor(palettes.monochrome[theme][b])!, parseColor(SURFACES[theme][0])!) - contrastRatio(parseColor(palettes.monochrome[theme][a])!, parseColor(SURFACES[theme][0])!));
    expect(order("dark")).toEqual(order("light"));
  });
});
