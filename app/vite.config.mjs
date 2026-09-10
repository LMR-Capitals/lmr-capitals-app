import { defineConfig } from 'vite'
import { resolve } from 'node:path'

// Multi-page build: the app (index.html) and a separate marketing landing
// page (landing.html). Static assets that must be served from the site root
// live in public/ (chart.umd.min.js, manifest.json, sw.js, icons, …).
export default defineConfig({
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        landing: resolve(import.meta.dirname, 'landing.html'),
      },
    },
  },
})
