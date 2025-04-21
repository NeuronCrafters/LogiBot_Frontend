import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const theme = {
  colors: {
    primary: {
      DEFAULT: "#4ade80",
      foreground: "#0f1011",
    },
    secondary: {
      DEFAULT: "#60a5fa",
      foreground: "#ffffff",
    },
    destructive: {
      DEFAULT: "#ef4444",
      foreground: "#ffffff",
    },
    muted: {
      DEFAULT: "#f1f5f9",
      foreground: "#64748b",
    },
    accent: {
      DEFAULT: "#f1f5f9",
      foreground: "#0f172a",
    },
    popover: {
      DEFAULT: "#ffffff",
      foreground: "#0f172a",
    },
    card: {
      DEFAULT: "#1F1F1F",
      foreground: "#ffffff",
    },
    border: "#e2e8f0",
    input: "#e2e8f0",
    ring: "#4ade80",
    background: "#ffffff",
    foreground: "#0f172a",
  },
  borderRadius: {
    lg: "0.5rem",
    md: "0.375rem",
    sm: "0.25rem",
  },
} 