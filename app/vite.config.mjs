import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'

// Multi-page build: the app (index.html), a separate marketing landing page
// (landing.html), and the React + ThreeUI admin experience (admin.html).
// Static assets that must be served from the site root live in public/
// (chart.umd.min.js, manifest.json, sw.js, icons, …).
export default defineConfig({
  publicDir: 'public',
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        landing: resolve(import.meta.dirname, 'landing.html'),
        admin: resolve(import.meta.dirname, 'admin.html'),
      },
    },
  },
})
