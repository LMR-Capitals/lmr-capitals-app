# Repo restructure: separate surfaces + database into top-level folders

## Goal
One GitHub repo, one Netlify build, live URLs unchanged (`/`, `/app`, `/admin`).
Separate the three surfaces and the database into clear top-level folders.

## Target tree
```
/web        landing (index.html, landing-preview.html, landing/*)   → served at /
/app        trading app (app.html)                                   → served at /app
/admin      admin portal (admin.html, main.jsx)                      → served at /admin
/database   schema.sql, migrations/, functions/, patches/, README
/public     shared root-served static (sw.js, manifest, chart.umd, icons, kb, term, …)
/scripts    notion-export.js, migrate-local-to-cloud.js
root        vite.config.mjs, package.json, package-lock.json, netlify.toml, docs
```

## Build (unchanged behaviour)
- Netlify: `base` removed (build at repo root), `command = npm ci && npm run build`, `publish = dist`.
- Vite root = repo root; multi-page inputs: web/index.html, web/landing-preview.html,
  app/app.html, admin/admin.html. publicDir = public (flattened to dist root).
- Output: dist/web/index.html, dist/app/app.html, dist/admin/admin.html, dist/assets/*, + public at dist root.
- Redirects (rewrites): / → /web/index.html, /app → /app/app.html, /admin → /admin/admin.html,
  /landing-preview → /web/landing-preview.html.
- All in-page asset refs are absolute (`/icons`, `/chart.umd.min.js`, `/sw.js`, `/term`, …) so they
  keep resolving from the site root. Only edit: admin.html module ref `./admin/main.jsx` → `./main.jsx`.

## Database
- Move loose `app/*.sql` → `database/patches/` (historical one-off scripts).
- Move `supabase/{schema.sql,migrations,functions}` → `database/`. Remove empty `supabase/`.
- Add `database/README.md` mapping the structure. Note: no Supabase CLI config in repo; DB is
  managed via the Supabase dashboard/MCP, so this move does not affect the Netlify/live deploy.

## Verify
- `npm ci && npm run build` at root succeeds; dist has web/app/admin html + assets + root static.
- Local static server: `/` (landing), `/app`, `/admin` all load; term image 200.
- Gate merge on green Netlify deploy preview; confirm preview serves all three routes before merge.
