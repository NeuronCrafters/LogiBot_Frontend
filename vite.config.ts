import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),

            'refractor': path.resolve(__dirname, 'node_modules/refractor'),
        },
    },

    build: {
        rollupOptions: {
            external: [
                'refractor/lib/core',
                'refractor/lib/all',
                /^refractor\/lang\//,
            ],
        },
    },
})