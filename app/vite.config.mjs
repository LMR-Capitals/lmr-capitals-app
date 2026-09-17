import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'

// Multi-page build: the marketing landing is the site root (index.html), the
// trading app is served at /app (app.html), and the React + ThreeUI admin
// experience at /admin (admin.html). Static assets that must be served from the
// site root live in public/ (chart.umd.min.js, manifest.json, sw.js, icons, …).
export default defineConfig({
  publicDir: 'public',
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),          // landing (root)
        app: resolve(import.meta.dirname, 'app.html'),             // trading app → /app
        landingPreview: resolve(import.meta.dirname, 'landing-preview.html'),
        admin: resolve(import.meta.dirname, 'admin.html'),         // admin → /admin
      },
    },
  },
})
