import React, { useEffect, useState } from 'react';
import { ImageViewer } from './image-viewer.jsx';

const local = import.meta.env.DEV && ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
let authClient;
async function getClient() {
  if (!authClient) authClient = import('@supabase/supabase-js').then(({ createClient }) => createClient('https://agrvylclhvxyevsmmexf.supabase.co', 'sb_publishable_vUhBxc3efVrs41yc9WZmAA_SnhBIrDh', { auth: { detectSessionInUrl: false } }));
  return authClient;
}
function PrivateChart({ trade, chart, token, onOpen, primary = false }) {
  const [src, setSrc] = useState(null), [failed, setFailed] = useState(false);
  useEffect(() => {
    const abort = new AbortController(); let url;
    setSrc(null); setFailed(false);
    fetch(`/__local-preview/recent-trades?trade=${encodeURIComponent(trade.id)}&chart=${encodeURIComponent(chart.suffix)}`, { signal: abort.signal, cache: 'no-store', headers: { Authorization: `Bearer ${token}` } })
      .then(response => { if (!response.ok) throw new Error('Unavailable'); return response.blob(); })
      .then(blob => { if (!abort.signal.aborted) { url = URL.createObjectURL(blob); setSrc(url); } })
      .catch(error => { if (error.name !== 'AbortError') setFailed(true); });
    return () => { abort.abort(); if (url) URL.revokeObjectURL(url); };
  }, [trade.id, chart.suffix, token]);
  const title = `${trade.market} ${trade.position} · ${trade.date} · ${chart.label}`;
  return <button className={primary ? 'trade-entry-button' : ''} type="button" disabled={!src || failed} onClick={() => onOpen({ src, title })}>{src && <img src={src} alt={title} onError={() => setFailed(true)} />}<span>{primary ? 'Entry image' : chart.label} · {failed ? 'Image unavailable' : src ? 'View full size' : 'Loading…'}</span></button>;
}

function TradeReplay({ trade, token, onOpen }) {
  const entry = trade.charts.find(chart => chart.suffix === 'entry');
  const supplemental = trade.charts.filter(chart => chart.suffix !== 'entry');
  return <article className="trade-replay">
    <div className="trade-replay-charts">
      <div className="trade-replay-entry">{entry
        ? <PrivateChart trade={trade} chart={entry} token={token} onOpen={onOpen} primary />
        : <div className="trade-entry-missing"><span>LMR / TRADE GALLERY</span><strong>Entry image unavailable</strong><p>No Entry Image for this trade is saved in Supabase.</p></div>}</div>
      {supplemental.length > 0 && <div className="trade-replay-supplemental">{supplemental.map(chart => <PrivateChart key={chart.suffix} trade={trade} chart={chart} token={token} onOpen={onOpen} />)}</div>}
      {trade.chartError && <p>Some chart images could not be checked. Refresh to try again.</p>}
    </div>
    <div className="trade-replay-details"><h3>{trade.market} · {trade.position}</h3><p>{trade.date} · {trade.session}</p><dl>{[['Model',trade.models.join(' / ') || 'Not recorded'],['Opened',trade.open_time || 'Not recorded'],['Closed',trade.close_time || 'Not recorded'],['Contracts',number(trade.lots)],['Recorded P&L',number(trade.pnl)],['Recorded risk',number(trade.risk)],['R multiple',number(trade.rr)]].map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></div>
  </article>;
}

const number = value => value == null ? 'Not recorded' : Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 });
export function RecentTrades({ reduced }) {
  const [state, setState] = useState({ status: 'loading', trades: [] }), [retry, setRetry] = useState(0), [image, setImage] = useState(null);
  const tradeIds = state.trades.map(trade => trade.id).join(',');
  useEffect(() => { setImage(null); }, [state.token, tradeIds]);
  useEffect(() => {
    if (!local) return;
    let disposed = false, abort, subscription, timer, queued, owner, busy = false, generation = 0;
    const refresh = async () => {
      if (disposed || busy || document.hidden) return;
      busy = true; const version = generation;
      try {
        const client = await getClient();
        const { data: { session } } = await client.auth.getSession();
        if (disposed || version !== generation) return;
        if (!session) { setImage(null); setState({ status: 'signed-out', trades: [] }); return; }
        abort = new AbortController();
        const response = await fetch('/__local-preview/recent-trades', { signal: abort.signal, cache: 'no-store', headers: { Authorization: `Bearer ${session.access_token}` } });
        if (response.status === 401) { setImage(null); setState({ status: 'signed-out', trades: [] }); return; }
        if (!response.ok) throw new Error('Unavailable');
        const data = await response.json();
        if (!disposed && version === generation) setState({ status: 'ready', trades: data.trades, updated: data.updated, token: session.access_token });
      } catch (error) {
        if (!disposed && version === generation && error.name !== 'AbortError') setState(previous => ({ ...previous, status: 'error' }));
      } finally { busy = false; if (!disposed && version !== generation) { clearTimeout(queued); queued = setTimeout(refresh, 0); } }
    };
    getClient().then(client => {
      if (disposed) return;
      subscription = client.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' || owner !== session?.user.id) {
          owner = session?.user.id; generation++; abort?.abort(); setImage(null);
          setState({ status: session ? 'loading' : 'signed-out', trades: [] });
        }
        clearTimeout(queued); queued = setTimeout(refresh, 0);
      }).data.subscription;
      refresh(); timer = setInterval(refresh, 30000);
    }).catch(() => { if (!disposed) setState({ status: 'error', trades: [] }); });
    window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', refresh);
    return () => { disposed = true; abort?.abort(); subscription?.unsubscribe(); clearInterval(timer); clearTimeout(queued); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [retry]);
  // Private journal data is deliberately absent from production output.
  if (!local) return null;
  return <section id="recent-trades" className="recent-trades section-space"><div className="shell">
    <div className="section-intro"><h2>The trades.<br /><em>The context.</em></h2><p>Live from your Supabase journal: the latest five trades, led by the Entry Image used in your Trade Gallery. Newest first.</p></div>
    {state.status === 'loading' && <p role="status">Loading your latest trades…</p>}
    {state.status === 'signed-out' && <p role="status"><a href="/app/app.html" target="_blank" rel="noopener">Sign in to your app on this preview address</a>, then return here to view your Supabase trades.</p>}
    {state.status === 'error' && <p role="status">Refresh unavailable. Any displayed trades may be out of date. <button type="button" onClick={() => setRetry(value => value + 1)}>Try again</button></p>}
    {state.status === 'ready' && !state.trades.length && <p>No saved trades yet.</p>}
    <div className="trade-replays">{state.trades.map(trade => <TradeReplay key={trade.id} trade={trade} token={state.token} onOpen={setImage} />)}</div>
    {state.updated && <p className="proof-note">Supabase · Newest to oldest · Refreshes every 30 seconds while visible · Last refreshed {new Date(state.updated).toLocaleTimeString()}. Values are as recorded in the app.</p>}
  </div>{image && <ImageViewer {...image} reduced={reduced} onClose={() => setImage(null)} />}</section>;
}
