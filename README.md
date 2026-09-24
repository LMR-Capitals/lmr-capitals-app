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

## Database

Managed as a hosted Supabase project. See [`database/README.md`](database/README.md).
Schema changes are additive only.
