import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: ['yurbuster.com', 'www.yurbuster.com', 'api.yurbuster.com'],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/video-rental-app': {
        target: 'http://localhost:4568',
        changeOrigin: true
      }
    }
  }
})
