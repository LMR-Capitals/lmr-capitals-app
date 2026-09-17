// ─────────────────────────────────────────────────────────────────────────────
// LMR Capitals — find Friday's missing daily entry / trades and test the push
//
// HOW TO RUN
// 1. Open the LMR Capitals app, sign in (Settings → Cloud → "Real-time sync ON").
// 2. Open DevTools console (Cmd+Option+J) and paste this whole file, press Enter.
// 3. Copy everything it logs and send it back — that tells us whether the data
//    is recoverable from a local backup, and what Supabase's real error is.
// ─────────────────────────────────────────────────────────────────────────────

(async function diagnoseLMR() {
  const FRIDAY = '2026-06-05'; // change this if "Friday" means a different date

  console.log('========== 1. CURRENT STATE ==========');
  console.log('daily['+FRIDAY+']:', state.daily?.[FRIDAY] || '(none)');
  console.log('trades on '+FRIDAY+':', state.trades.filter(t => t.date === FRIDAY));

  console.log('========== 2. LOCAL BACKUPS ==========');
  for (const key of ['lmr_v3_state_bk', 'lmr_v3_state_pre_pull']) {
    const raw = localStorage.getItem(key);
    if (!raw) { console.log(key + ': (not present)'); continue; }
    try {
      const bk = JSON.parse(raw);
      console.log(key + ' → daily['+FRIDAY+']:', bk.daily?.[FRIDAY] || '(none)');
      console.log(key + ' → trades on '+FRIDAY+':', (bk.trades || []).filter(t => t.date === FRIDAY));
    } catch (e) { console.log(key + ': could not parse', e); }
  }

  console.log('========== 3. REAL SUPABASE ERROR (per table) ==========');
  if (!window._sb || !window._sbUserId) {
    console.log('Not signed in — sign in first, then re-run this script.');
    return;
  }
  if (state.trades.length) {
    const r = await _sb.from('trades').upsert(state.trades.map(t => _mapTrade(t, _sbUserId)), { onConflict: 'id' });
    console.log('trades upsert →', r.error ? ('ERROR: ' + JSON.stringify(r.error)) : 'OK, no error');
  }
  const dailyRows = Object.entries(state.daily).map(([d, v]) => _mapDaily(d, v, _sbUserId));
  if (dailyRows.length) {
    const r = await _sb.from('daily').upsert(dailyRows, { onConflict: 'date,user_id' });
    console.log('daily upsert →', r.error ? ('ERROR: ' + JSON.stringify(r.error)) : 'OK, no error');
  }
  console.log('========== DONE — copy everything above ==========');
})();
