import type { CSSProperties } from "react";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { ensureContrast } from "@/shared/lib/contrast";

type SyntaxStyle = Record<string, CSSProperties>;

/**
 * Code blocks follow the interface theme. The original One Dark / One Light colors are kept whenever
 * they already reach the minimum ratio; tokens such as comments, which do not, are darkened or lightened
 * just enough. Increased contrast raises the minimum from 4.5:1 to 7:1.
 */
export const CODE_BACKGROUND = { dark: "#1e1e1e", light: "#f6f8fa" } as const;
export const CODE_MIN_CONTRAST = { default: 4.5, more: 7 } as const;

export function accessibleSyntaxStyle(base: SyntaxStyle, background: string, ratio: number): SyntaxStyle {
  const result: SyntaxStyle = {};
  for (const [selector, rules] of Object.entries(base)) {
    const next: CSSProperties = { ...rules };
    if (!selector.includes("selection") && typeof rules.color === "string") next.color = ensureContrast(rules.color, background, ratio);
    if (selector.startsWith("pre[") || selector.startsWith("code[")) next.background = background;
    result[selector] = next;
  }
  return result;
}

const cache = new Map<string, SyntaxStyle>();

export function codeTheme(theme: "dark" | "light", contrast: "default" | "more") {
  const key = `${theme}-${contrast}`;
  let style = cache.get(key);
  if (!style) {
    style = accessibleSyntaxStyle(theme === "dark" ? oneDark : oneLight, CODE_BACKGROUND[theme], CODE_MIN_CONTRAST[contrast]);
    cache.set(key, style);
  }
  return { style, background: CODE_BACKGROUND[theme] };
}
