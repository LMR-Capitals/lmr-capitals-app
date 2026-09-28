# LMR Capitals

Monorepo for the LMR Capitals platform. Three front-end surfaces plus the database,
built and deployed together as one Netlify site (https://lmrcapitals.com).

## Structure

```
web/        Marketing landing page          → served at /          (index.html + landing/)
app/        Trading journal application      → served at /app       (app.html — single-file PWA)
admin/      Admin portal                     → served at /admin     (admin.html + main.jsx, React)
database/   Supabase schema, migrations, edge functions, patches   (see database/README.md)
public/     Shared static assets served from the site root         (sw.js, manifest.json,
            chart.umd.min.js, icons/, kb/, term/, robots.txt, sitemap.xml, …)
scripts/    Dev/data utilities                                     (notion-export.js, migrate-local-to-cloud.js)
```

Build config lives at the repo root: `vite.config.mjs`, `package.json`, `netlify.toml`.

## Develop

```
npm ci          # install (root)
npm run dev     # Vite dev server (web/app/admin entries)
npm run build   # production build → dist/
npm run preview # serve the built dist/
```

## Deploy

Netlify builds at the repo root (`npm ci && npm run build`) and publishes `dist/`.
Clean URLs (`/`, `/app`, `/admin`) are mapped by `netlify.toml` redirects. Pushing to
`main` deploys to production.

## iOS / macOS app (Xcode)

`ios/` is a Capacitor Xcode project that wraps the live app at
https://lmrcapitals.com/app, so every Netlify deploy reaches the native app too,
with no App Store resubmission. `capacitor.config.json` holds the app id, the live URL
and the domains allowed to open inside the app. `native/www/` is the bundled
offline page shown when the live site can't load.

On a Mac with Xcode 16+:

```
npm ci
npm run ios:sync   # copy config/plugins into ios/
npm run ios:open   # open ios/App/App.xcodeproj in Xcode
```

In Xcode, choose your Apple Developer team under *Signing & Capabilities*, then run
the app on a simulator, an iPhone, or "My Mac (Designed for iPad)". Use Product → Archive to
upload it to TestFlight or the App Store.

Live cross-device sync uses Supabase Realtime (`sbStartRealtime` in `app/app.html`).
It needs migration `database/migrations/20260928090000_enable_realtime_sync.sql`
applied to the project.

## Database

Managed as a hosted Supabase project. See [`database/README.md`](database/README.md).
Schema changes are additive only.
