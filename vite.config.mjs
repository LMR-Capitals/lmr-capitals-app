import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'

// Multi-page build from the top-level surface folders:
//   web/   → marketing landing        (served at /)
//   app/   → trading application      (served at /app)
//   admin/ → admin portal             (served at /admin)
// Shared root-served static assets live in public/ (chart.umd.min.js,
// manifest.json, sw.js, icons/, kb/, term/, …) and are flattened to the dist
// root by `vite build`. Clean URLs are mapped by netlify.toml redirects.
export default defineConfig({
  publicDir: 'public',
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'web/index.html'),                 // landing → /
        landingPreview: resolve(import.meta.dirname, 'web/landing-preview.html'),
        app: resolve(import.meta.dirname, 'app/app.html'),                    // trading app → /app
        admin: resolve(import.meta.dirname, 'admin/admin.html'),             // admin portal → /admin
      },
    },
  },
})
