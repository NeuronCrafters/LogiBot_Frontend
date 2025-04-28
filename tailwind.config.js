/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
	theme: {
		extend: {
			fontFamily: {
				Montserrat: ["Montserrat", "sans-serif"],
				Roboto: ["Roboto", "sans-serif"],
				Poppins: ["Poppins", "sans-serif"],
			},
		},
	},
	plugins: [],
}