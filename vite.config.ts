// import path from "path"
// import react from "@vitejs/plugin-react"
// import { defineConfig } from "vite"
//
// export default defineConfig({
//     plugins: [react()],
//     resolve: {
//         alias: {
//             "@": path.resolve(__dirname, "./src"),
//
//             'refractor': path.resolve(__dirname, 'node_modules/refractor'),
//         },
//     },
//
//     build: {
//         rollupOptions: {
//             external: [
//                 'refractor/lib/core',
//                 'refractor/lib/all',
//                 /^refractor\/lang\//,
//             ],
//         },
//     },
// })

import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
    plugins: [react()],
    resolve: {
        // A seção de ALIAS é a solução correta para este problema.
        alias: {
            // Seu alias '@' que já existe
            "@": path.resolve(__dirname, "./src"),

            // NOVO: Este alias força o Vite a encontrar o caminho correto para o 'refractor'.
            // Ele mapeia qualquer import que comece com 'refractor/' para a pasta correta.
            'refractor': path.resolve(__dirname, 'node_modules/refractor'),
        },
    },
    // A seção 'build' com 'external' foi removida, pois era a causa do erro no navegador.
})