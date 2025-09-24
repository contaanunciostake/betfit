import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: {
      port: 5173
    },
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      // Cloudflare Tunnel hosts
      '.trycloudflare.com',
      'developing-seriously-dennis-automated.trycloudflare.com',
      'finances-gathering-eyes-del.trycloudflare.com'
    ]
  },
  build: {
    target: 'esnext',
    minify: 'esbuild'
  }
})