/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ["class"],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
	],
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "1400px",
			},
		},
		extend: {
			colors: {
				primary: {
					DEFAULT: "#4ade80",
					foreground: "#ffffff",
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
			keyframes: {
				"accordion-down": {
					from: { height: 0 },
					to: { height: "var(--radix-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--radix-accordion-content-height)" },
					to: { height: 0 },
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
			},
		},
	},
	plugins: [require("tailwindcss-animate")],
}