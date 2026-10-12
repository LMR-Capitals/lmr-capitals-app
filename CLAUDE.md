## Current production website and deployment — read first

This source originated in `/Users/nirajghorsaine/LMR-Capitals`; the Life OS source branch is `codex/life-os-week-plan`. Read [deployment/GITHUB-LIFE-OS-HANDOFF.md](deployment/GITHUB-LIFE-OS-HANDOFF.md) for the current source handoff. The earlier Inner Circle integration was merged in #72. The website is a root-level Vite multi-page build, including landing, Inner Circle, LMR Studio and the full embedded Journal. Read [deployment/CURRENT.md](deployment/CURRENT.md) before deploying or diagnosing a missing portal; it contains the current release receipt, source/build map and database-preservation constraints.

- Run `npm run build` from this repository root; publish **only `dist/`**, using the root `netlify.toml`. Do not deploy `app/`, the repository root or the old `LMR Capitals APP_files` directory.
- Inner Circle lives in `member/` and is an explicit Vite entry; the build must include `dist/member/index.html`, `dist/member/guide.html` and `dist/app/workspace.html` alongside landing/admin/Journal assets.
- Website redeployment does not require database migrations, imports, seed data, record replacement or storage uploads. Preserve the owner's existing Supabase data and stored images. Do not apply pending patches or billing functions as part of a website redeploy.
- Netlify site `lmrcapitalsapp` (`09e03f83-2353-4a3a-bb21-ae5ab81ef45b`) is currently connected to Git continuous deployment. A later `main` build can replace a manual release; old memory saying pushes never deploy is obsolete.
- Inner Circle is already on `main` via #72. The owner requested pushing Life OS / Week Plan source to a branch so a cloud session can fetch and build it. This handoff is based on current `main` (`a3debe020417fb6c173e883ca65a3440c7386da4`), and includes no merge, production deployment, database commands or billing activation. Preserve the existing Journal fixes.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
