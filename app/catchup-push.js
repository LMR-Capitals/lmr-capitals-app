// ─────────────────────────────────────────────────────────────────────────────
// LMR Capitals — Push EVERY section from local storage → Supabase (browser console)
//
// HOW TO RUN:
//  1. Open https://lmrcapitals.com (the browser that has your data), signed in.
//  2. Console:  Mac Cmd+Option+J  ·  Windows/Linux Ctrl+Shift+J
//  3. Paste this whole file, press Enter, read the report.
//
// Covers: Accounts · Transactions · Journal · Trades · Daily/Weekly/Monthly ·
//         LMR Observation · Terminology · Psychology · Achievements · Goals.
// AI Coach chats & Reports auto-sync when created, so they're already in the cloud.
//
// Achievements + Goals need their Supabase tables first — run, in Supabase SQL Editor:
//   create-achievements-table.sql   and   targets-table-migration.sql
// (Until then those two lines will report ✗ with a reminder — everything else still pushes.)
// Safe: all UPSERT — never deletes cloud rows.
// ─────────────────────────────────────────────────────────────────────────────
(async () => {
  if (typeof _sb === 'undefined' || !_sb || typeof _sbUserId === 'undefined' || !_sbUserId) {
    console.log('%c⚠ Not signed in. Sign in (Settings → Cloud), then re-run.', 'color:#FF4060;font-weight:bold'); return;
  }
  const uid = _sbUserId, now = new Date().toISOString();
  const ls  = (k) => { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch (e) { return []; } };
  const ok  = (s) => console.log('%c✓ ' + s, 'color:#00D4A4');
  const dim = (s) => console.log('%c• ' + s, 'color:#7A9AC0');
  const bad = (s) => console.log('%c✗ ' + s, 'color:#FF4060');

  // 1) CORE — Accounts · Transactions · Journal · Trades · Daily · Weekly · Monthly
  try { await _sbUpsertAll(uid); ok('Accounts · Transactions · Journal · Trades · Daily · Weekly · Monthly'); }
  catch (e) { bad('Core: ' + e.message); }

  // 2) KNOWLEDGE — LMR Observation
  try {
    const obs = ls('lmr_obs_entries_v2');
    if (obs.length) {
      const rows = obs.map(o => ({ id:o.id, user_id:uid, title:o.title||'', content:o.content||'', created_at:o.created_at||now, updated_at:o.updated_at||now }));
      const { error } = await _sb.from('lmr_observations').upsert(rows, { onConflict:'id' }); if (error) throw error;
      ok('LMR Observation (' + rows.length + ')');
    } else dim('LMR Observation: none locally');
  } catch (e) { bad('LMR Observation: ' + e.message); }

  // 3) KNOWLEDGE — Terminology & Psychology pages
  try {
    const rows = [];
    [['terminology','lmr-terminology'],['psychology','lmr-psychology']].forEach(([sec,key]) => {
      const raw = state[sec + 'Page'];
      if (raw) { let data; try { data = JSON.parse(raw); } catch (_) { data = { html: raw }; } rows.push({ key, user_id:uid, data }); }
    });
    if (rows.length) { const { error } = await _sb.from('monthly').upsert(rows, { onConflict:'key,user_id' }); if (error) throw error; ok('Terminology & Psychology (' + rows.length + ')'); }
    else dim('Terminology/Psychology: none locally');
  } catch (e) { bad('Terminology/Psychology: ' + e.message); }

  // 4) ACHIEVEMENTS — certificates (needs lmr_achievements table)
  try {
    const ach = ls('lmr_achievements_v1');
    if (ach.length) {
      const rows = ach.map(a => ({ ...a, user_id:uid }));
      const { error } = await _sb.from('lmr_achievements').upsert(rows, { onConflict:'id' }); if (error) throw error;
      ok('Achievements (' + rows.length + ')');
    } else dim('Achievements: none locally');
  } catch (e) { bad('Achievements: ' + e.message + '  → run create-achievements-table.sql in Supabase first'); }

  // 5) ACHIEVEMENTS — Goals (needs targets table)
  try {
    const goals = ls('lmr_targets_v1');
    if (goals.length) {
      const rows = goals.map(g => ({ id:g.id, user_id:uid, kind:'goal', category:g.category, title:g.title, unit:g.unit||null, target_value:g.target_value, current_value:g.current_value, target_date:g.target_date, details:g.details||null, updated_at:now }));
      const { error } = await _sb.from('targets').upsert(rows, { onConflict:'id' }); if (error) throw error;
      ok('Goals (' + rows.length + ')');
    } else dim('Goals: none locally');
  } catch (e) { bad('Goals: ' + e.message + '  → run targets-table-migration.sql in Supabase first'); }

  dim('AI Coach chats & Reports auto-sync when created — already in the cloud.');
  console.log('%c✅ Push finished. Re-run after applying any SQL noted on a ✗ line.', 'color:#F5A623;font-weight:bold');
})();
