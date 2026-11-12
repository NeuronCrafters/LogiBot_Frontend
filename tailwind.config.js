/** @type {import('tailwindcss').Config} */
const defaults = require("tailwindcss/colors");
const plugin = require("tailwindcss/plugin");

const NEUTRAL_FAMILIES = ["neutral", "zinc", "gray", "slate", "stone"];
const HUE_FAMILIES = [
  "red", "orange", "amber", "yellow", "lime", "green", "emerald", "teal", "cyan",
  "sky", "blue", "indigo", "violet", "purple", "fuchsia", "pink", "rose",
];
const SHADES = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];

const LIGHT_NEUTRAL = {
  50: "#0f172a", 100: "#172033", 200: "#1e293b", 300: "#334155", 400: "#475569",
  500: "#56657a", 600: "#8a97aa", 700: "#bec8d5", 800: "#dfe4eb", 900: "#eceff4", 950: "#e4e8ee",
};
const LIGHT_HUE_SHADE = { 50: "900", 100: "900", 200: "800", 300: "800", 400: "700", 500: "700" };
const LIGHT_DEEPER_HUES = ["amber", "orange", "yellow", "lime", "green", "emerald", "teal", "cyan", "sky"];

const SURFACES = {
  dark: { surface: "#1f1f1f", "surface-sunken": "#141414", "surface-raised": "#2a2a2a" },
  light: { surface: "#f4f6f9", "surface-sunken": "#eceff4", "surface-raised": "#dfe4eb" },
};

const rgb = (hex) => {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? value.split("").map((c) => c + c).join("") : value;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)).join(" ");
};
const color = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;
const boostedColor = (name) => `rgb(var(--c-${name}) / calc(<alpha-value> * var(--alpha-boost, 1)))`;
const borderColorValue = () =>
  `rgb(var(--c-border-ink) / calc(<alpha-value> * var(--border-boost, 1) * var(--alpha-boost, 1)))`;

function contrastVariables(mode) {
  const strong = mode === "dark"
    ? { muted: "#d4d4d8", 400: "#d4d4d8", 500: "#a1a1aa" }
    : { muted: "#1e293b", 400: "#1e293b", 500: "#334155", 600: "#475569", 700: "#64748b" };
  const vars = { "--alpha-boost": "2.5", "--c-text-muted": rgb(strong.muted), "--c-placeholder": rgb(strong[500]) };
  if (mode === "light") vars["--c-border-ink"] = rgb("#334155");
  for (const family of NEUTRAL_FAMILIES)
    for (const shade of ["400", "500", "600", "700"])
      if (strong[shade]) vars[`--c-${family}-${shade}`] = rgb(strong[shade]);
  return vars;
}

function themeVariables(mode) {
  const vars = {};
  vars["--c-white"] = mode === "dark" ? "255 255 255" : rgb("#172033");
  vars["--c-on-accent"] = "255 255 255";
  for (const family of NEUTRAL_FAMILIES)
    for (const shade of SHADES)
      vars[`--c-${family}-${shade}`] = rgb(mode === "dark" ? defaults[family][shade] : LIGHT_NEUTRAL[shade]);
  for (const family of HUE_FAMILIES)
    for (const shade of SHADES) {
      let source = mode === "light" && LIGHT_HUE_SHADE[shade] ? LIGHT_HUE_SHADE[shade] : shade;
      if (mode === "light" && source === "700" && LIGHT_DEEPER_HUES.includes(family)) source = "800";
      vars[`--c-${family}-${shade}`] = rgb(defaults[family][source]);
    }
  for (const [name, hex] of Object.entries(SURFACES[mode])) vars[`--c-${name}`] = rgb(hex);
  vars["--c-text-muted"] = rgb(mode === "dark" ? "#a1a1aa" : "#475569");
  vars["--c-placeholder"] = rgb(mode === "dark" ? "#a1a1aa" : "#56657a");
  vars["--c-border-ink"] = mode === "dark" ? "255 255 255" : rgb("#64748b");
  vars["--border-boost"] = mode === "dark" ? "1" : "2";
  vars["--text-alpha-boost"] = mode === "dark" ? "1" : "1.3";
  vars["--chart-ink"] = mode === "dark" ? "255 255 255" : rgb("#172033");
  vars["--chart-line-boost"] = mode === "dark" ? "1" : "2";
  vars["--chart-line-min"] = mode === "dark" ? "0" : "0.3";
  vars["--chart-text-boost"] = mode === "dark" ? "1" : "1.6";
  return vars;
}

const palette = {
  transparent: "transparent",
  current: "currentColor",
  inherit: "inherit",
  black: defaults.black,
  white: boostedColor("white"),
  "on-accent": color("on-accent"),
  surface: { DEFAULT: color("surface"), sunken: color("surface-sunken"), raised: color("surface-raised") },
};
for (const family of [...NEUTRAL_FAMILIES, ...HUE_FAMILIES])
  palette[family] = Object.fromEntries(SHADES.map((shade) => [shade, color(`${family}-${shade}`)]));

module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    colors: palette,
    extend: {
      borderColor: ({ theme }) => ({ ...theme("colors"), white: borderColorValue() }),
      divideColor: ({ theme }) => ({ ...theme("colors"), white: borderColorValue() }),
      textColor: {
        white: `rgb(var(--c-white) / calc(<alpha-value> * var(--text-alpha-boost, 1) * var(--alpha-boost, 1)))`,
        zinc: { 500: color("text-muted"), 600: color("text-muted"), 700: color("text-muted") },
      },
      placeholderColor: { zinc: { 500: color("placeholder"), 600: color("placeholder"), 700: color("placeholder") } },
      fontFamily: { Poppins: ["Poppins", "sans-serif"] },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    plugin(({ addBase }) => {
      addBase({
        ":root": { ...themeVariables("dark"), "color-scheme": "dark" },
        ":root.light": { ...themeVariables("light"), "color-scheme": "light" },
        ':root[data-contrast="more"]': contrastVariables("dark"),
        ':root.light[data-contrast="more"]': contrastVariables("light"),
      });
    }),
  ],
};
