import { createClient } from '@supabase/supabase-js';

const URL = 'https://agrvylclhvxyevsmmexf.supabase.co';
const KEY = 'sb_publishable_vUhBxc3efVrs41yc9WZmAA_SnhBIrDh';
const CHARTS = [['entry','Entry'],['result','Result'],['15m','15-minute'],['htf','Higher timeframe']];

export function localTradePreview(clientFactory = createClient) {
  return { name: 'local-trade-preview', apply: 'serve', configureServer(server) {
    server.middlewares.use('/__local-preview/recent-trades', async (req, res) => {
      const loopback = ['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
      const host = req.headers.host || '';
      const origin = req.headers.origin;
      if (!loopback || !/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host) || (origin && origin !== `http://${host}`) || req.headers['sec-fetch-site'] === 'cross-site') { res.statusCode = 403; return res.end(); }
      if (req.method !== 'GET') { res.statusCode = 405; return res.end(); }
      res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store');
      const authorization = req.headers.authorization;
      if (!authorization?.startsWith('Bearer ')) { res.statusCode = 401; return res.end('{"error":"Sign in to the local app"}'); }
      // Forward only the user's session, never a privileged service credential.
      const client = clientFactory(URL, KEY, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
      try {
        const { data: { user }, error: authError } = await client.auth.getUser(authorization.slice(7));
        if (authError || !user) { res.statusCode = 401; return res.end('{"error":"Sign in again"}'); }
        const query = new globalThis.URL(req.url, 'http://localhost').searchParams;
        const imageTrade = query.get('trade'), suffix = query.get('chart');
        if (imageTrade) {
          if (!/^\d+$/.test(imageTrade) || !CHARTS.some(([key]) => key === suffix)) { res.statusCode = 400; return res.end(); }
          const { data: owned, error } = await client.from('trades').select('id').eq('user_id',user.id).eq('id',imageTrade).maybeSingle();
          if (error || !owned) { res.statusCode = 404; return res.end(); }
          const { data: blob, error: downloadError } = await client.storage.from('app-images').download(`${user.id}/trade-${imageTrade}-${suffix}`);
          if (downloadError || !blob || !/^image\/(png|jpeg|webp|gif)$/.test(blob.type)) { res.statusCode = 404; return res.end(); }
          res.setHeader('Content-Type',blob.type); res.setHeader('X-Content-Type-Options','nosniff');
          return res.end(Buffer.from(await blob.arrayBuffer()));
        }
        const { data, error } = await client.from('trades').select('id,date,market,position,session,models,pnl,risk,lots,rr,open_time,close_time,created_at')
          .eq('user_id',user.id).order('date',{ascending:false,nullsFirst:false}).order('open_time',{ascending:false,nullsFirst:false})
          .order('created_at',{ascending:false,nullsFirst:false}).order('id',{ascending:false}).limit(5);
        if (error) throw error;
        const trades = await Promise.all((data || []).map(async trade => {
          const { data: files, error: chartError } = await client.storage.from('app-images').list(user.id,{search:`trade-${trade.id}-`,limit:100});
          const names = new Set((files || []).map(file => file.name));
          return {...trade,models:Array.isArray(trade.models)?trade.models:[],chartError:Boolean(chartError),charts:CHARTS.filter(([key])=>names.has(`trade-${trade.id}-${key}`)).map(([suffix,label])=>({suffix,label}))};
        }));
        res.end(JSON.stringify({trades,updated:new Date().toISOString()}));
      } catch { res.statusCode = 503; res.end('{"error":"Private feed unavailable"}'); }
    });
  } };
}
