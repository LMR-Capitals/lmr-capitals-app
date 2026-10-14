// Assembles the native (Capacitor) web root from the standard Vite build.
//
// The web `dist/` is a multi-page build where index.html is the marketing
// landing page and the trading app lives at app.html. Capacitor always loads
// index.html from its webDir, so for the native app we copy the built dist into
// `ios-www/` and promote app.html to index.html — leaving the Netlify `dist/`
// (used for the web deploy) untouched. All root-served assets referenced by the
// app via absolute paths (/icons, /chart.umd.min.js, /manifest.json, /sw.js …)
// are already flattened to the dist root by Vite, so they come along for free.
//
// Run via `npm run build:native` (which runs `vite build` first), then
// `npx cap sync ios` to copy this into the iOS project.

import { existsSync, rmSync, cpSync, copyFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = resolve(root, 'dist')
const out = resolve(root, 'ios-www')

if (!existsSync(dist)) {
  console.error('[build-native] dist/ not found — run `vite build` first (use `npm run build:native`).')
  process.exit(1)
}

// Vite's multi-page build preserves source folders: app/app.html → dist/app/app.html.
const appHtml = resolve(dist, 'app', 'app.html')
if (!existsSync(appHtml)) {
  console.error('[build-native] dist/app/app.html not found — did the Vite build succeed?')
  process.exit(1)
}

// Fresh copy of the built site (root assets — /icons, /chart.umd.min.js,
// /manifest.json, /sw.js — are already at the dist root, matching the app's
// absolute asset paths).
rmSync(out, { recursive: true, force: true })
cpSync(dist, out, { recursive: true })

// Promote the trading app to the native entry point at the web root.
copyFileSync(resolve(out, 'app', 'app.html'), resolve(out, 'index.html'))

console.log(`[build-native] ios-www/ ready (app.html → index.html). Next: npx cap sync ios`)
