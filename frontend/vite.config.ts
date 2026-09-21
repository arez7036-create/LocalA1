import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/auth': { target: 'http://backend:8000', changeOrigin: true },
      '/users': { target: 'http://backend:8000', changeOrigin: true },
      '/models': { target: 'http://backend:8000', changeOrigin: true },
      '/chat': { target: 'http://backend:8000', changeOrigin: true },
      '/admin': { target: 'http://backend:8000', changeOrigin: true },
      '/health': { target: 'http://backend:8000', changeOrigin: true },
      '/docs': { target: 'http://backend:8000', changeOrigin: true },
    }
  }
})