# SPEC — LMR Capitals: Native Cross-Platform App

> Status: **APPROVED direction, building in phases.** Branch: `native-app-restructure` (off `main`).
> Generated via `spec-driven-development` (`/spec`). Supersedes the earlier web-only draft.

## 1. Objective

Turn the current single-file web PWA into an **installable native app** for
**macOS** (DMG / App Store), **Windows** (installer), and **Android** (APK/AAB),
built from one shared web codebase — while losing **zero** user data.

Do it in two ordered phases (your instruction: *arrange GitHub first, then deploy*):
- **Phase A — Arrange the repo** (organize, dedupe, modular `app/`, split sections).
- **Phase B — Package & ship** (Tauri wrapper, installers, signing, release CI).

## 1a. Architecture: admin vs. user portals (multi-tenant)

Intended model:
- **Admin portal** — `admin@lmrcapitals.com` signs in and manages the business,
  including the public content shown on the landing page (Track Record).
- **User portals** — every other account gets the same app with its **own
  isolated data**. No user can see another user's data.
- **Landing page** is fed by the **admin's public data** (the "Proven Track
  Record" comes from achievements the admin marks public).

What the code/DB do **today** (verified from `app/*.sql` + `index.html`):
- ✅ **Per-user isolation is real and server-enforced.** Every table
  (`trades`, `daily`, `weekly`, `monthly`, `accounts`, `transactions`, `notes`,
  `journal`, `lmr_achievements`, …) has `user_id default auth.uid()` and RLS
  policies `auth.uid() = user_id`. Client-side `_switchUserStore()` is a
  convenience on top; the DB is the real boundary.
- ✅ Landing reads public achievements: `lmr_achievements` where `is_public=true`.
- ⚠️ **No admin role exists.** The app treats every account the same; there is
  no admin portal vs. user portal split yet.
- 🔴 **Security gap:** the public-read policy exposes **any** user's
  `is_public=true` rows, and any signed-in user can set `is_public=true` on
  their own achievements. So today **any registered user could publish to the
  public landing page**, and the landing shows public rows from all users, not
  only the admin.

Required to match the intent (all server-enforced, never client-only):
1. **An admin role** — an `admins` table or a `profiles.is_admin` flag, seeded
   with the admin's `auth.uid()`. Admin status is checked in **RLS policies**,
   not by a client-side email/password check (client checks are cosmetic and
   trivially bypassed).
2. **Restrict public landing data to the admin** — the public-read policy (and
   the landing query) should only expose achievements owned by an admin.
3. **Admin-only publish** — only an admin may set `is_public=true`.
4. The login gate routes to the **admin portal** or **user portal** by role, but
   the portals differ only in UI; every privileged action is still gated by RLS.

## 2. Chosen stack

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend build | **Vite** (vanilla, multi-page) | Keeps app vanilla JS; multi-page = separate Landing/App/Indicator entries |
| Native wrapper | **Tauri v2** | One toolchain → macOS `.dmg`/App Store, Windows `.msi`/`.exe`, Android `.apk`/`.aab`, iOS bonus; tiny binaries |
| Charts | Chart.js (npm) | replaces vendored `chart.umd.min.js` |
| Data | Supabase + localStorage + IndexedDB | **unchanged** — preserved as-is |
| Release | GitHub Actions (macOS + Windows + Linux runners) | builds/signs installers per-OS |

Fallback if Tauri/Rust proves painful: Electron (desktop) + Capacitor (mobile).

## 3. Hard environment constraints (important)

- **This Linux container cannot build macOS or iOS artifacts** — Apple needs a
  Mac + Xcode. Those build only on a Mac or a `macos-latest` CI runner.
- **Signing / store publishing needs YOUR accounts**: Apple Developer ($99/yr),
  Google Play ($25 one-time), optional Windows code-signing cert. Secrets live in
  GitHub Actions secrets, never in the repo.
- **Android APK can build on Linux** (Android SDK/NDK) — a debug/unsigned APK is
  producible here; signed AAB for Play needs your keystore.
- ⇒ Deliverable from automation: a repo + release pipeline that *produces* signed
  installers on the right runners. No signed DMG is handdable from this session.

## 4. Current state (verified)

- Whole app = `LMR Capitals APP_files/index.html` (3,433 lines), JS nav via `data-page`.
- Duplicated assets: `LMR Capitals APP_files/LMR Capitals_files/` byte-duplicates
  `chart.umd.min.js` + `css2`. Safe to delete.
- PWA (`manifest.json`, `sw.js`, `icons/`); Netlify (`netlify.toml`, publish `.`) +
  GitHub Pages (`CNAME`).
- Node `notion-export.js` exporter (import via Settings → Import).
- Exist today: dashboard, today, calendar, performance, analysis (m/w/d), trading
  (accounts, transaction), knowledge (journal, notes, terminology, psychology,
  observation), payout, settings.
- New builds: Cockpit, Achievements, Milestones, Reviews, **Indicator**, **Landing**.

## 5. Phase A — build order (arrange the repo)

Each step ends with a **working, committed** app.

| # | Step | Verifies |
|---|------|----------|
| A0 | Note data-safety facts (data lives in browser + Supabase, not the repo — file moves can't touch it) | — |
| A1 | **Dedupe + rename**: delete nested `LMR Capitals_files/`; `LMR Capitals APP_files/` → `app/` | app still opens & runs unchanged |
| A2 | **Vite shell**: `package.json`, `vite.config.js`; Chart.js + Supabase as npm deps; `vite-plugin-pwa` for sw/manifest | `npm run dev` + `build` serve same app |
| A3 | **Extract lib**: `src/lib/` (storage, supabase, charts, router) out of the monolith | all sections still work |
| A4 | **Split existing sections** into `src/sections/*` in LMR order | each renders + persists as before |
| A5 | **Landing page**: new `landing.html` entry | loads standalone |
| A6 | **Indicator**: new `indicator.html` + `src/sections/indicator/` | loads standalone |
| A7 | **New sections wired** (Cockpit, Achievements, Milestones, Reviews) as routed pages with placeholder UI | appear in nav; per-section content = follow-up specs |

## 6. Phase B — package & ship (after Phase A)

| # | Step |
|---|------|
| B1 | Add Tauri v2 (`src-tauri/`); desktop dev run |
| B2 | macOS `.dmg` + Windows `.msi/.exe` via CI (`macos-latest`, `windows-latest`) |
| B3 | Android target (`tauri android`) → APK/AAB |
| B4 | Signing/notarization wiring (your secrets); App Store / Play / DMG release |
| B5 | Web deploy decision: keep a PWA on Netlify/Pages pointing at `app/dist`, or retire it |

## 7. Target structure (end of Phase A)

```
app/
  index.html  landing.html  indicator.html
  src/
    main.js  lib/{storage,supabase,charts,router}.js
    sections/{settings,sessions,analysis,trading,knowledge,payout,
              cockpit,achievements,milestones,reviews,indicator}/
    styles/
  public/{manifest.json,icons/}      # sw.js via vite-plugin-pwa
  vite.config.js  package.json  netlify.toml
scripts/notion-export.js
CNAME
```

Nav order: Settings → Sessions (dashboard, today, calendar, performance) →
Analysis (monthly, weekly, daily) → Trading (trade, accounts, transaction) →
Knowledge (journal, notes, terminology, psychology, observation) → Payout →
Cockpit → Achievements → Milestones → Reviews. Indicator + Landing = separate pages.

## 8. Testing

No tests today. Per step: load in a real browser (Chrome/Playwright available) and
confirm each section renders, nav works, and data round-trips (add a trade → reload
→ still there; Supabase read/write ok). Add page-entry smoke checks; no heavy suite.

## 9. Boundaries

**Always**: preserve all data (localStorage/IndexedDB/Supabase) + Notion import;
keep the app runnable at each committed step; preserve PWA + security headers.
**Ask first**: Supabase schema/keys or credential handling; building new-section
*content*; retiring a deploy target; the Electron/Capacitor fallback.
**Never**: commit Supabase/Notion/signing secrets; delete or mutate journal data
(only duplicate *assets* are removed); change app behavior/visuals during Phase A.
