# Experience preview — September 26, 2026

## September 27: certificate viewer and local recent-trade snapshot

- Certificate images open in a native modal dialog with a Motion zoom transition, image zoom/fit control, Escape/close handling and focus restoration. Ticker pauses while open; horizontal drags suppress image clicks.
- Added five latest saved trade entries between achievements and Contact, with 17 verified chart object references and recorded details. Missing close time remains explicitly unrecorded. No artificial charts, values or trade outcomes were added.
- Supabase access was read-only and scoped to the matching LMR Capitals admin profile. No publication flags, RLS, schemas or application data were changed.
- Snapshot lives in ignored `.local-preview/recent-trades.json`. It is not imported into frontend code or copied to public assets. A loopback-only development endpoint serves it; the section renders nothing in production. This is a retrieved snapshot, not a live-updating trade feed.
- Verified endpoint: HTTP 200, five entries, 17 image references. Direct snapshot access and cross-origin endpoint access returned HTTP 403. Git confirms snapshot is ignored; scanned production output contained none of the checked trade IDs.
- 15 automated tests pass; production build passes with existing ThreeUI compatibility warnings. Live image-viewer keyboard/drag behaviour and desktop/mobile screenshots still need browser confirmation; no visual verification is claimed.
- Unrelated existing indicator deletions and brand-asset changes were left untouched. Nothing deployed.

## Latest correction: full-size monitor and flat mouse pad

The tablet implementation described below is superseded by the user's next review.
Removed the 821–1199px split-screen rule that shrank the scene at 1137×837.
All desktop widths above 820px now use the full scene area with copy inside the monitor.
The desk handoff ends in an overhead view, notebook left and flat fabric mouse pad right.
Removed tablet bezels and camera. Desktop text is selectable DOM positioned from the
projected mouse-pad corners, with no duplicate copy below the scene. Overflow detection
still falls back to readable chapters when actual text cannot fit. Phones retain their
readable visual/text split. Build and 12 tests passed; live visual verification remains pending.

Canonical project: `/Users/nirajghorsaine/LMR-Capitals`.
Preview: `/web/experience-preview.html?motion=on` (local Vite server, port 4173).
The archived preview on port 4174 is not the updated version.

## Changes

- Copied the latest experience-only source files from the archive; did not overwrite the existing marketing page, trading application, or admin source.
- Registered a separate build entry and installed the preview's Motion dependency.
- Removed the decorative metal chain geometry. Retained The Chain methodology name and seven public chapter diagrams.
- Renamed headings to Monthly Analysis, Weekly Analysis, Daily Analysis, Session Analysis, Trade Execution, and Discipline & Journaling.
- Added a physical illuminated tablet with full chapter text rendered on its screen. Desktop screen-reader text and the complete reading view remain available. Below 1200px, readable DOM text is presented separately in a tablet panel.
- Added a hinged notebook cover: START → open during handoff → hold through desk chapters → close → COMPLETED, followed by pen placement. Geometry is sampled from absolute scroll state, so reversing scroll reverses the sequence.
- Reversible section and service-copy reveals; contact entrance can replay on re-entry.
- Delayed overflow detection until the 3D scene and layout are ready. Static reading mode retains a framed monitor visual.
- Updated migrated sign-in links for this repository's `/app/app.html` path.

## Verification

- 12 automated tests passed: chapter content, timeline continuity, chapter navigation, forward/backward sampling, reading holds, notebook choreography and pen clearance sequencing.
- Production build passed. Existing ThreeUI `sRGBEncoding` compatibility warnings remain; no blanket dependency upgrade was performed.
- A live browser visual inspection was not available through the current tools. Tablet text fit, notebook occlusion, mobile layout, and actual reverse-scroll appearance still need a grouped desktop/mobile visual review. Do not interpret mathematical state tests as visual verification.
- No deployment or database/authentication changes.

The animation refinement preserves the established Archivo/navy/gold visual identity and uses one scroll-controlled desk scene, following the Impeccable animation guidance.
