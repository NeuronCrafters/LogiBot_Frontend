import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

    build: {
        rollupOptions: {
          external: ['refractor/lib/core'],
        },
    },

  //comentar isso abaixo antes de subir para produção
  // server: {
  //   port: 5173,
  //   host: '0.0.0.0',
  //   watch: {
  //     //garante que a atualização automática funcione bem no Docker
  //     usePolling: true,
  //   },

  //   // proxy configurado para ser explícito sobre as rotas da API
  //   proxy: {

  //     // regra para autenticação
  //     '/session': {
  //       target: 'http://app:3000',
  //       changeOrigin: true,
  //     },
  //   }
  // }
})
