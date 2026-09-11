// ─────────────────────────────────────────────────────────────────────────────
// LMR Capitals — one-off migration: push browser localStorage data to Supabase
//
// WHY THIS EXISTS
// Canvas pages (lmr_canvas_pages) and Observation entries (lmr_obs_entries) are
// only pushed to Supabase one-at-a-time, when you open that specific page/entry
// and hit Save (see canvasSave/obsSave in index.html). Anything created while
// offline, or never re-opened, stays stuck in localStorage and never reaches
// the cloud's `monthly` table (keys 'canvas-<id>' / 'obs-<id>').
//
// This script walks every entry in both arrays and upserts it to Supabase using
// the exact same row shape the app's own save functions use, so it merges
// cleanly with whatever's already there (onConflict: 'key,user_id').
//
// HOW TO RUN
// 1. Open the LMR Capitals app in your browser and SIGN IN (cloud sync must show
//    "✓ Real-time sync ON").
// 2. Open DevTools (Cmd+Option+J / F12) → Console tab.
// 3. Paste this entire file's contents and press Enter.
// 4. Watch the console for a per-item ✓/✗ log and a final summary.
// ─────────────────────────────────────────────────────────────────────────────

(async function migrateLocalToCloud() {
  // NOTE: _sb / _sbUserId are top-level `let` globals in index.html, so they
  // are NOT accessible via window._sb / window._sbUserId in the console —
  // reference them directly instead.
  if (typeof _sb === 'undefined' || !_sb || typeof _sbUserId === 'undefined' || !_sbUserId) {
    console.error('[migrate] Not signed in to Supabase — open Settings → Cloud and sign in first.');
    return;
  }
  const uid = _sbUserId;
  const results = { canvas: { ok: 0, fail: 0 }, obs: { ok: 0, fail: 0 } };

  // ── Canvas pages ──────────────────────────────────────────────────────────
  const canvasPages = JSON.parse(localStorage.getItem('lmr_canvas_pages') || '[]');
  console.log(`[migrate] Found ${canvasPages.length} canvas page(s) in localStorage.`);
  for (const page of canvasPages) {
    const row = {
      key: 'canvas-' + page.id,
      data: { ...(page.data || {}), title: page.title || 'Untitled' },
      user_id: uid,
    };
    const { error } = await _sb.from('monthly').upsert(row, { onConflict: 'key,user_id' });
    if (error) {
      results.canvas.fail++;
      console.error(`[migrate] ✗ canvas "${page.title || page.id}":`, error.message);
    } else {
      results.canvas.ok++;
      console.log(`[migrate] ✓ canvas "${page.title || 'Untitled'}" → ${row.key}`);
    }
  }

  // ── Observation entries ───────────────────────────────────────────────────
  const obsEntries = JSON.parse(localStorage.getItem('lmr_obs_entries') || '[]');
  console.log(`[migrate] Found ${obsEntries.length} observation entr(y/ies) in localStorage.`);
  for (const entry of obsEntries) {
    const row = {
      key: 'obs-' + entry.id,
      data: { ...(entry.data || {}), title: entry.title || 'Untitled', date: entry.date || null },
      user_id: uid,
    };
    const { error } = await _sb.from('monthly').upsert(row, { onConflict: 'key,user_id' });
    if (error) {
      results.obs.fail++;
      console.error(`[migrate] ✗ observation "${entry.title || entry.id}":`, error.message);
    } else {
      results.obs.ok++;
      console.log(`[migrate] ✓ observation "${entry.title || 'Untitled'}" → ${row.key}`);
    }
  }

  console.log('[migrate] Done.', results);
  console.log('[migrate] Tip: also run sbPushNow() (or Settings → Cloud → Force Push) to sync trades/daily/accounts/etc.');
})();
