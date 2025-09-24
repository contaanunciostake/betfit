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
    hmr: false,
    allowedHosts: [
      'localhost',
      '.ngrok-free.app',
      '.ngrok.app',
      '3454d79a19a0.ngrok-free.app'
    ],
    // Remover proxy quando usando ngrok
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:5001',
    //     changeOrigin: true,
    //     secure: false
    //   }
    // }
  }
})