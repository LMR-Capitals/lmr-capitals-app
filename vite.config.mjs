import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { localTradePreview } from './scripts/local-trade-preview.mjs'
import { portalRoutes } from './scripts/portal-routes.mjs'
import { journalWorkspace } from './scripts/journal-workspace.mjs'

// Multi-page build from the top-level surface folders:
//   web/   → marketing landing        (served at /)
//   app/   → trading application      (served at /app)
//   admin/ → admin portal             (served at /admin)
// Shared root-served static assets live in public/ (chart.umd.min.js,
// manifest.json, sw.js, icons/, kb/, term/, …) and are flattened to the dist
// root by `vite build`. Clean URLs are mapped by netlify.toml redirects.
export default defineConfig({
  publicDir: 'public',
  plugins: [react(), portalRoutes(), journalWorkspace(), localTradePreview()],
  server: { fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/.local-preview/**'] } },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'web/index.html'),                 // landing → /
        landingPreview: resolve(import.meta.dirname, 'web/landing-preview.html'),
        experiencePreview: resolve(import.meta.dirname, 'web/experience-preview.html'),
        app: resolve(import.meta.dirname, 'app/app.html'),                    // trading app → /app
        member: resolve(import.meta.dirname, 'member/index.html'),
        memberGuide: resolve(import.meta.dirname, 'member/guide.html'),
        journalImport: resolve(import.meta.dirname, 'app/journal-import.html'), // signed-in one-time chart importer
        admin: resolve(import.meta.dirname, 'admin/admin.html'),             // admin portal → /admin
        adminTerminal: resolve(import.meta.dirname, 'admin/terminal.html'),
      },
    },
  },
})
