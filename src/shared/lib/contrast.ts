export type Rgb = [number, number, number];

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const RGB = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i;
const HSL = /^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%/i;

/** Parses #rgb, #rrggbb, rgb() and hsl() colors. Returns null for anything else. */
export function parseColor(value: string): Rgb | null {
  const color = value.trim();
  const hex = color.match(HEX);
  if (hex) {
    const digits = hex[1].length === 3 ? hex[1].split("").map((c) => c + c).join("") : hex[1];
    return [0, 2, 4].map((i) => parseInt(digits.slice(i, i + 2), 16)) as Rgb;
  }
  const rgb = color.match(RGB);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  const hsl = color.match(HSL);
  if (hsl) {
    const h = Number(hsl[1]) / 360;
    const s = Number(hsl[2]) / 100;
    const l = Number(hsl[3]) / 100;
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const channel = (offset: number) => {
      let t = h + offset;
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    return [channel(1 / 3), channel(0), channel(-1 / 3)].map((v) => Math.round(v * 255)) as Rgb;
  }
  return null;
}

export function toHex([r, g, b]: Rgb) {
  return `#${[r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")}`;
}

export function luminance([r, g, b]: Rgb) {
  const [lr, lg, lb] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

export function contrastRatio(a: Rgb, b: Rgb) {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/**
 * Moves a color toward black or white, whichever separates it from the background,
 * until it reaches the requested contrast ratio. Colors that already pass are returned unchanged.
 */
export function ensureContrast(color: string, background: string, ratio: number) {
  const fg = parseColor(color);
  const bg = parseColor(background);
  if (!fg || !bg || contrastRatio(fg, bg) >= ratio) return color;
  const target: Rgb = luminance(bg) > 0.5 ? [0, 0, 0] : [255, 255, 255];
  for (let step = 1; step <= 20; step++) {
    const amount = step / 20;
    const mixed = fg.map((v, i) => v + (target[i] - v) * amount) as Rgb;
    if (contrastRatio(mixed, bg) >= ratio) return toHex(mixed);
  }
  return toHex(target);
}
