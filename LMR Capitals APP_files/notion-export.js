/**
 * LMR Capitals — Notion Data Exporter (v4 — full image extraction)
 * =================================================================
 * Fixes vs v3:
 *  - Weekly keys now use app format YYYY-MM-Wn (not ISO week)
 *  - getAllImageUrls() fetches ALL image blocks from a page (not just first)
 *  - Weekly images extracted and mapped to w-smt / w-wprof / … / w-fri zones
 *  - Monthly images extracted and mapped to m-proj / m-result / … / m-w4 zones
 *  - All images embedded as base64 in the JSON → importData loads them instantly
 *
 * Run: node notion-export.js
 * Then: app → Settings → Import → lmr-notion-export.json
 */

require('dotenv').config();
const { Client } = require('@notionhq/client');
const fs    = require('fs');
const path  = require('path');
const https = require('https');
const http  = require('http');

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const CONFIG = {
  token: process.env.NOTION_TOKEN || 'YOUR_NOTION_INTEGRATION_TOKEN',
  databases: {
    trades:      process.env.DB_TRADES        || '',
    daily:       process.env.DB_DAILY         || '',
    monthly:     process.env.DB_MONTHLY       || '',
    weekly:      process.env.DB_WEEKLY        || '',
    accounts:    process.env.DB_ACCOUNTS      || '',
    transactions:process.env.DB_TRANSACTIONS  || '',
    withdrawn:   process.env.DB_WITHDRAWN     || '',
    notes:       process.env.DB_NOTES         || '',
    journal:     process.env.DB_JOURNAL       || '',
  }
};
// ─────────────────────────────────────────────────────────────────────────────

const notion = new Client({ auth: CONFIG.token });

// ─── IMAGE ZONE MAPS ─────────────────────────────────────────────────────────
// Order must match the visual order of img-zones in index.html
const WEEKLY_ZONES  = ['w-smt','w-wprof','w-dprof','w-4h','w-1h','w-mon','w-tue','w-wed','w-thu','w-fri'];
const MONTHLY_ZONES = ['m-proj','m-result','m-qshift-img','m-profile-img','m-im-eq','m-im-yield','m-im-dxy','m-w1','m-w2','m-w3','m-w4'];

// ─── DATE HELPERS ─────────────────────────────────────────────────────────────

// Week-of-month used by the app: ceil((date + firstWeekdayOffset) / 7)
function weekOfMonth(dateStr) {
  const d  = new Date(dateStr + 'T12:00');
  const firstDayOffset = new Date(d.getFullYear(), d.getMonth(), 1).getDay(); // 0=Sun
  return Math.ceil((d.getDate() + firstDayOffset) / 7);
}

// App weekly key format: YYYY-MM-Wn  e.g. "2026-05-W3"
function weekKeyFor(dateStr) {
  if (!dateStr) return '';
  const month = dateStr.slice(0, 7);
  return `${month}-W${weekOfMonth(dateStr)}`;
}

// ─── IMAGE HELPERS ────────────────────────────────────────────────────────────

// Detect extension from URL path (before the ? query string)
function guessExt(url) {
  const p = (url.split('?')[0] || '').toLowerCase();
  if (p.endsWith('.png'))  return 'png';
  if (p.endsWith('.gif'))  return 'gif';
  if (p.endsWith('.webp')) return 'webp';
  return 'jpg';
}

// Download a URL to a local file, following up to 5 redirects
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    let hops = 0;
    function get(u) {
      if (hops++ > 5) return reject(new Error('Too many redirects'));
      const mod = u.startsWith('https') ? https : http;
      mod.get(u, { timeout: 20000 }, res => {
        if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) {
          res.resume();
          return get(res.headers.location);
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        const out = fs.createWriteStream(dest);
        res.pipe(out);
        out.on('finish', () => { out.close(); resolve(true); });
        out.on('error', err  => { fs.unlink(dest, () => {}); reject(err); });
      }).on('error', reject).on('timeout', () => reject(new Error('Timeout')));
    }
    get(url);
  });
}

// Fetch ALL image-block URLs from a Notion page (handles pagination)
async function getAllImageUrls(pageId) {
  const urls = [];
  try {
    let cursor;
    do {
      const res = await notion.blocks.children.list({
        block_id: pageId,
        page_size: 100,
        start_cursor: cursor,
      });
      for (const block of res.results) {
        if (block.type === 'image') {
          const img = block.image;
          const url = img.type === 'file' ? img.file.url : (img.external?.url || null);
          if (url) urls.push(url);
        }
      }
      cursor = res.has_more ? res.next_cursor : undefined;
    } while (cursor);
  } catch (_) {}
  return urls;
}

// Run up to `limit` async tasks concurrently
async function pLimit(tasks, limit = 5) {
  let i = 0;
  async function run() {
    while (i < tasks.length) {
      const idx = i++;
      try { await tasks[idx](); } catch (_) {}
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, run));
}

// ─── PROPERTY HELPERS ─────────────────────────────────────────────────────────
function getProp(page, name) {
  const p = page.properties[name];
  if (!p) return null;
  switch (p.type) {
    case 'title':        return p.title.map(t => t.plain_text).join('');
    case 'rich_text':    return p.rich_text.map(t => t.plain_text).join('');
    case 'number':       return p.number;
    case 'select':       return p.select?.name || '';
    case 'multi_select': return p.multi_select.map(s => s.name);
    case 'date':         return p.date?.start || '';
    case 'checkbox':     return p.checkbox;
    case 'url':          return p.url || '';
    case 'email':        return p.email || '';
    case 'phone_number': return p.phone_number || '';
    case 'status':       return p.status?.name || '';
    case 'relation':     return p.relation.map(r => r.id);
    case 'formula':
      if (p.formula.type === 'number') return p.formula.number;
      if (p.formula.type === 'string') return p.formula.string;
      return null;
    default: return null;
  }
}

function getRelId(page, name) {
  const ids = getProp(page, name);
  return (Array.isArray(ids) && ids.length) ? ids[0] : null;
}

async function queryAll(dbId) {
  if (!dbId) return [];
  const results = [];
  let cursor;
  do {
    const resp = await notion.databases.query({
      database_id: dbId,
      start_cursor: cursor,
      page_size: 100,
    });
    results.push(...resp.results);
    cursor = resp.has_more ? resp.next_cursor : undefined;
  } while (cursor);
  return results;
}

// ─── TRADING DAY COUNTER ──────────────────────────────────────────────────────
function tradingDaysBetween(start, end) {
  const s = new Date(start + 'T12:00'), e = new Date(end + 'T12:00');
  if (e < s) return 0;
  const US_HOLIDAYS = [
    '2026-01-01','2026-01-19','2026-02-16','2026-04-03',
    '2026-05-25','2026-06-19','2026-07-03','2026-09-07',
    '2026-11-26','2026-12-25'
  ];
  let days = 0;
  const cur = new Date(s);
  while (cur < e) {
    cur.setDate(cur.getDate() + 1);
    const dow = cur.getDay();
    const iso = cur.toISOString().split('T')[0];
    if (dow !== 0 && dow !== 6 && !US_HOLIDAYS.includes(iso)) days++;
  }
  return days;
}
const DAY_START      = 362;
const DAY_START_DATE = '2026-05-19';
function dayCountFor(dateStr) {
  if (!dateStr) return 0;
  return DAY_START + tradingDaysBetween(DAY_START_DATE, dateStr);
}

function uid(page) {
  const hex = page.id.replace(/-/g, '');
  const n = parseInt(hex.slice(20, 32), 16);
  return Number.isFinite(n) && n > 0 ? n : Date.now();
}

// ─── MAPPERS ──────────────────────────────────────────────────────────────────

function mapTrade(page) {
  const dateFull = getProp(page, 'Date') || '';
  const date = dateFull ? dateFull.slice(0, 10) : '';
  const pnl  = getProp(page, 'Net P/L') || 0;
  const risk = getProp(page, 'Risk ')   || 0;
  const rr   = risk > 0 ? +((pnl / risk).toFixed(2)) : 0;
  return {
    id:               uid(page),
    notionId:         page.id,
    _accountNotionId: getRelId(page, 'Accounts'),
    accountId:        null,
    date,
    dayCount:         dayCountFor(date),
    market:           getProp(page, 'Market')              || 'NQ',
    position:         getProp(page, 'Position')            || 'Long',
    day:              getProp(page, 'Day')                 || '',
    month:            getProp(page, 'Month')               || '',
    session:          getProp(page, 'Session ')            || '',
    timePeriod:       getProp(page, 'Time Period ')        || '',
    models:           getProp(page, 'Trade Entry Drill')   || [],
    confirmations:    getProp(page, 'Confirmation')        || [],
    emotions:         getProp(page, 'Emotions')            || [],
    phases:           getProp(page, 'Market Phase')        || [],
    mmm:              getProp(page, 'Market  Maker Model ') || [],
    movement:         getProp(page, 'Movement')            || [],
    tframes:          getProp(page, 'T Frame')             || [],
    rth:              getProp(page, 'RTH Profile')         || '',
    htf:              getProp(page, 'HTF Delivery ')       || '',
    pnl:              typeof pnl  === 'number' ? pnl  : parseFloat(pnl)  || 0,
    risk:             typeof risk === 'number' ? risk : parseFloat(risk) || 0,
    lots:             getProp(page, 'Lots')                || 0,
    draws:            getProp(page, ' Draws ')             || '',
    feedback:         getProp(page, 'Feedback ')           || '',
    rr,
    win:  (typeof pnl === 'number' ? pnl : parseFloat(pnl) || 0) > 0,
    locked: true,
  };
}

function mapDaily(page) {
  const date = getProp(page, 'Date') || '';
  return {
    date,
    notionId:   page.id,
    dayCount:   dayCountFor(date),
    name:       getProp(page, 'Name')          || '',
    bias:       getProp(page, ' Daily Bias')   || '',
    weekly:     getProp(page, 'Week Draws')    || '',
    htfpoi:     getProp(page, 'HTF POI')       || '',
    weekdraws:  getProp(page, 'Week Draws')    || '',
    london:     getProp(page, 'London')        || '',
    ny:         getProp(page, 'New-York')      || '',
    asianRange: getProp(page, 'Asain Range ')  || '',
    session:    getProp(page, 'Session')       || '',
    rth:        getProp(page, 'RTH Delivery')  || '',
    plan:       getProp(page, 'Plan ')         || '',
    pred:       getProp(page, 'Prediction ')   || '',
    monthlyBias:getProp(page, 'Monthly Bais')  || '',
    price:      getProp(page, 'Price ')        || [],
    savedAt:    page.last_edited_time || new Date().toISOString(),
  };
}

function mapMonthly(page) {
  const date = getProp(page, 'Date') || '';
  let monthKey = date ? date.slice(0, 7) : '';
  if (!monthKey) {
    const title  = getProp(page, 'Monthly Analysis ') || '';
    const short3 = { jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',
                     jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12' };
    const full = title.toLowerCase().match(/(\w{3,})\s+(\d{4})/);
    if (full) {
      monthKey = `${full[2]}-${short3[full[1].slice(0,3)] || '01'}`;
    } else {
      const s = title.toLowerCase().slice(0, 3);
      if (short3[s]) monthKey = `2026-${short3[s]}`;
    }
    if (!monthKey) monthKey = new Date().toISOString().slice(0, 7);
  }
  return {
    key:      monthKey,
    notionId: page.id,
    data: {
      'm-title':    getProp(page, 'Monthly Analysis ')     || '',
      'm-qshift':   getProp(page, ' Quarterly Shift (3M)') || '',
      'm-profile':  getProp(page, 'Market Profile')        || '',
      'm-seasonal': getProp(page, 'Seasonal Tendecy ')     || '',
      'm-rate':     getProp(page, 'Interest rate ')        || '',
      'm-pred':     getProp(page, 'Predictions ')          || '',
      'm-im':       getProp(page, 'IM Analysis ')          || '',
      'm-keylevels':getProp(page, 'Key Levels ')           || '',
    }
  };
}

function mapWeekly(page) {
  const date = getProp(page, 'Date') || '';
  const name = getProp(page, 'Name') || '';
  // Use app-compatible key: YYYY-MM-Wn (week-of-month, not ISO week)
  const weekKey = weekKeyFor(date);
  return {
    weekKey,
    notionId: page.id,
    data: {
      'w-name':     name,
      'w-date':     date,
      'w-model':    getProp(page, 'Weekly Model')        || '',
      'w-profile':  getProp(page, 'Week Profile')        || '',
      'w-phase':    getProp(page, 'Market Phase ')       || '',
      'w-smt':      getProp(page, 'SMT ')                || [],
      'w-range':    getProp(page, 'Range Behaviiours ')  || '',
      'w-month':    getProp(page, 'Month')               || '',
      'w-keylevels':getProp(page, 'Key Levels')          || '',
      'w-pd':       getProp(page, 'P/D Arrays ')         || '',
    }
  };
}

function mapAccount(page) {
  const name = getProp(page, 'Accounts') || '';
  return {
    id:       uid(page),
    notionId: page.id,
    name,
    type:     getProp(page, 'Type')    || 'Funded',
    status:   getProp(page, 'Status')  || 'In-Progress',
    date:     getProp(page, 'Date')    || new Date().toISOString().split('T')[0],
    deposit:  getProp(page, 'Deposit') || 0,
  };
}

function mapTransaction(page, type = 'Deposit') {
  const note   = getProp(page, 'Prop Firm ') || '';
  const date   = getProp(page, 'Date')       || '';
  const amount = getProp(page,
    type === 'Withdrawal' ? 'Withdrawn  (USD)' : 'Payment  (USD)'
  ) || 0;
  if ((note === 'Prop Firms' || note === '') && !date) return null;
  return {
    id:               uid(page),
    notionId:         page.id,
    _accountNotionId: getRelId(page, 'Account '),
    accountId:        null,
    date, type,
    amount: typeof amount === 'number' ? amount : parseFloat(amount) || 0,
    note,
    status: getProp(page, 'Status')         || '',
    txId:   getProp(page, 'Transaction ID') || null,
  };
}

function mapNote(page) {
  const date = getProp(page, 'Date') || '';
  return {
    id:        uid(page),
    notionId:  page.id,
    title:     getProp(page, 'Name')    || getProp(page, 'Title') || '(imported)',
    date,
    text:      getProp(page, 'Content') || getProp(page, 'Notes') || getProp(page, 'Text') || '',
    createdAt: page.created_time || new Date().toISOString(),
  };
}

function mapJournal(page) {
  const typeRaw = getProp(page, 'Type') || 'lesson';
  const typeMap = {
    lesson:'lesson', win:'bull', 'win / followed plan':'bull',
    loss:'bear', 'loss / mistake':'bear', note:'neutral'
  };
  return {
    id:       uid(page),
    notionId: page.id,
    type:     typeMap[typeRaw.toLowerCase()] || 'lesson',
    date:     getProp(page, 'Date')  || '',
    text:     getProp(page, 'Entry') || getProp(page, 'Content') || getProp(page, 'Text') || '',
  };
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n⚡ LMR Capitals — Notion Exporter v4 (full image extraction)\n');

  if (CONFIG.token === 'YOUR_NOTION_INTEGRATION_TOKEN') {
    console.error('❌  Set NOTION_TOKEN in your .env file first.\n');
    process.exit(1);
  }

  const state = {
    trades: [], daily: {}, monthly: {}, weekly: {},
    accounts: [], transactions: [], notes: [], journal: [],
    terminology: [],
    currentMonth: new Date().toISOString().slice(0, 7),
    currentWeek: 1, currentAcc: null,
    dayCountStart: 362, dayCountStartDate: '2026-05-19',
    calMonth: new Date().toISOString().slice(0, 7),
    settings: {}
  };

  // ── ACCOUNTS ────────────────────────────────────────────────────────────────
  if (CONFIG.databases.accounts) {
    console.log('💰  Fetching accounts...');
    const pages = await queryAll(CONFIG.databases.accounts);
    state.accounts = pages
      .map(mapAccount)
      .filter(a => a.name && a.name !== '' && a.name !== 'Enter Deposit');
    if (state.accounts.length) state.currentAcc = state.accounts[0].id;
    console.log(`   ✓  ${state.accounts.length} accounts`);
    state.accounts.forEach(a =>
      console.log(`       - ${a.name} | ${a.type} | $${(a.deposit||0).toLocaleString()} | ${a.date}`)
    );
  }
  const accNotionMap = {};
  state.accounts.forEach(a => { accNotionMap[a.notionId] = a.id; });

  // ── TRADES ──────────────────────────────────────────────────────────────────
  if (CONFIG.databases.trades) {
    console.log('📈  Fetching trades...');
    const pages = await queryAll(CONFIG.databases.trades);
    state.trades = pages.map(mapTrade).filter(t => t.date);
    let linked = 0;
    state.trades.forEach(t => {
      if (t._accountNotionId && accNotionMap[t._accountNotionId]) {
        t.accountId = accNotionMap[t._accountNotionId];
        linked++;
      }
      delete t._accountNotionId;
    });
    state.trades.sort((a, b) => b.date.localeCompare(a.date));
    console.log(`   ✓  ${state.trades.length} trades (${linked} linked to accounts)`);
  }

  // ── DAILY ───────────────────────────────────────────────────────────────────
  if (CONFIG.databases.daily) {
    console.log('📓  Fetching daily entries...');
    const pages = await queryAll(CONFIG.databases.daily);
    for (const page of pages) {
      const d = mapDaily(page);
      if (d.date) state.daily[d.date] = d;
    }
    console.log(`   ✓  ${Object.keys(state.daily).length} daily entries`);
  }

  // ── MONTHLY ─────────────────────────────────────────────────────────────────
  if (CONFIG.databases.monthly) {
    console.log('📆  Fetching monthly analysis...');
    const pages = await queryAll(CONFIG.databases.monthly);
    for (const page of pages) {
      const { key, data } = mapMonthly(page);
      if (key) state.monthly[key] = data;
    }
    console.log(`   ✓  ${Object.keys(state.monthly).length} months`);
    console.log(`   Keys: ${Object.keys(state.monthly).sort().join(', ')}`);
  }

  // ── WEEKLY ──────────────────────────────────────────────────────────────────
  if (CONFIG.databases.weekly) {
    console.log('📅  Fetching weekly analysis...');
    const pages = await queryAll(CONFIG.databases.weekly);
    for (const page of pages) {
      const { weekKey, data } = mapWeekly(page);
      if (weekKey) state.weekly[weekKey] = data;
    }
    console.log(`   ✓  ${Object.keys(state.weekly).length} weeks`);
    if (Object.keys(state.weekly).length)
      console.log(`   Keys: ${Object.keys(state.weekly).sort().join(', ')}`);
  }

  // ── TRANSACTIONS (Deposits) ──────────────────────────────────────────────────
  if (CONFIG.databases.transactions) {
    console.log('💳  Fetching deposit transactions...');
    const pages = await queryAll(CONFIG.databases.transactions);
    const deposits = pages.map(p => mapTransaction(p, 'Deposit')).filter(Boolean);
    deposits.forEach(x => {
      if (x._accountNotionId && accNotionMap[x._accountNotionId])
        x.accountId = accNotionMap[x._accountNotionId];
      delete x._accountNotionId;
    });
    state.transactions.push(...deposits);
    console.log(`   ✓  ${deposits.length} deposits`);
  }

  // ── TRANSACTIONS (Withdrawals) ───────────────────────────────────────────────
  if (CONFIG.databases.withdrawn) {
    console.log('💳  Fetching withdrawal transactions...');
    const pages = await queryAll(CONFIG.databases.withdrawn);
    const withdrawals = pages.map(p => mapTransaction(p, 'Withdrawal')).filter(Boolean);
    withdrawals.forEach(x => {
      if (x._accountNotionId && accNotionMap[x._accountNotionId])
        x.accountId = accNotionMap[x._accountNotionId];
      delete x._accountNotionId;
    });
    state.transactions.push(...withdrawals);
    console.log(`   ✓  ${withdrawals.length} withdrawals`);
  }
  state.transactions.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  // ── NOTES ───────────────────────────────────────────────────────────────────
  if (CONFIG.databases.notes) {
    console.log('📝  Fetching notes...');
    const pages = await queryAll(CONFIG.databases.notes);
    state.notes = pages.map(mapNote);
    console.log(`   ✓  ${state.notes.length} notes`);
  }

  // ── JOURNAL ─────────────────────────────────────────────────────────────────
  if (CONFIG.databases.journal) {
    console.log('📔  Fetching journal entries...');
    const pages = await queryAll(CONFIG.databases.journal);
    state.journal = pages.map(mapJournal);
    console.log(`   ✓  ${state.journal.length} journal entries`);
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  IMAGE EXTRACTION — downloads everything to notion-images/ + embeds in JSON
  // ════════════════════════════════════════════════════════════════════════════

  const imgDir = path.join(__dirname, 'notion-images');
  if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir);

  const imageIndex = {};  // key → relative path on disk
  let downloadOk = 0, downloadSkip = 0;

  // Helper: download one image URL, save to disk, register in imageIndex
  async function downloadImage(url, key) {
    const ext  = guessExt(url);
    const file = `${key}.${ext}`;
    const dest = path.join(imgDir, file);
    try {
      await downloadFile(url, dest);
      imageIndex[key] = `notion-images/${file}`;
      downloadOk++;
      return true;
    } catch (_) {
      downloadSkip++;
      return false;
    }
  }

  // ── Trade screenshots (first image block per trade page) ────────────────────
  if (state.trades.length) {
    console.log(`\n📸  Downloading trade screenshots (${state.trades.length} pages)...`);
    const tasks = state.trades.map(trade => async () => {
      const urls = await getAllImageUrls(trade.notionId);
      if (!urls.length) { downloadSkip++; return; }
      await downloadImage(urls[0], `tradeshot-${trade.id}`);
      if ((downloadOk + downloadSkip) % 10 === 0)
        process.stdout.write(`   ↓ ${downloadOk + downloadSkip}/${state.trades.length}\r`);
    });
    await pLimit(tasks, 5);
    console.log(`   ✓  ${downloadOk} downloaded, ${downloadSkip} no image`);
  }

  // ── Daily page screenshots (first image block per day) ─────────────────────
  const dailyPages = Object.values(state.daily).filter(d => d.notionId);
  if (dailyPages.length) {
    const before = downloadOk + downloadSkip;
    console.log(`📸  Downloading daily page images (${dailyPages.length} pages)...`);
    const tasks = dailyPages.map(d => async () => {
      const urls = await getAllImageUrls(d.notionId);
      if (!urls.length) { downloadSkip++; return; }
      await downloadImage(urls[0], `daily-${d.date}`);
    });
    await pLimit(tasks, 5);
    const added = (downloadOk + downloadSkip) - before;
    console.log(`   ✓  ${downloadOk} total (${added} new daily images)`);
  }

  // ── Weekly page images — mapped to WEEKLY_ZONES by position ────────────────
  // Key format must match app: {weekKey}-{zone}  e.g.  "2026-05-W3-w-smt"
  const weeklyEntries = Object.entries(state.weekly)
    .filter(([,v]) => v['w-date'])
    .map(([weekKey, v]) => ({ weekKey, notionId: state.weekly[weekKey]?.notionId }))
    .filter(e => e.notionId);

  // notionId was set on mapWeekly but stored outside data — rebuild map
  // We need to keep notionId accessible; store it temporarily
  if (CONFIG.databases.weekly) {
    console.log(`📸  Downloading weekly images...`);
    const weeklyPages = await queryAll(CONFIG.databases.weekly);
    let wOk = 0;
    const tasks = weeklyPages.map(page => async () => {
      const { weekKey } = mapWeekly(page);
      if (!weekKey) return;
      const urls = await getAllImageUrls(page.id);
      if (!urls.length) return;
      for (let i = 0; i < Math.min(urls.length, WEEKLY_ZONES.length); i++) {
        const zone = WEEKLY_ZONES[i];
        const key  = `${weekKey}-${zone}`;
        const ok   = await downloadImage(urls[i], key);
        if (ok) wOk++;
      }
    });
    await pLimit(tasks, 3);
    console.log(`   ✓  ${wOk} weekly zone images`);
  }

  // ── Monthly page images — mapped to MONTHLY_ZONES by position ───────────────
  // Key format: {monthKey}-{zone}  e.g.  "2026-05-m-proj"
  if (CONFIG.databases.monthly) {
    console.log(`📸  Downloading monthly images...`);
    const monthlyPages = await queryAll(CONFIG.databases.monthly);
    let mOk = 0;
    const tasks = monthlyPages.map(page => async () => {
      const { key: monthKey } = mapMonthly(page);
      if (!monthKey) return;
      const urls = await getAllImageUrls(page.id);
      if (!urls.length) return;
      for (let i = 0; i < Math.min(urls.length, MONTHLY_ZONES.length); i++) {
        const zone = MONTHLY_ZONES[i];
        const imgKey = `${monthKey}-${zone}`;
        const ok     = await downloadImage(urls[i], imgKey);
        if (ok) mOk++;
      }
    });
    await pLimit(tasks, 3);
    console.log(`   ✓  ${mOk} monthly zone images`);
  }

  console.log(`\n✅  Total images on disk: ${downloadOk} (${downloadSkip} skipped)`);

  // ── Embed all images as base64 into the JSON ─────────────────────────────────
  // This makes the export self-contained: importData() loads them straight into
  // IndexedDB without needing a server at all.
  console.log('🔧  Embedding images as base64...');
  const images = {};
  let embedded = 0, missing = 0;
  for (const [key, relPath] of Object.entries(imageIndex)) {
    const fullPath = path.join(__dirname, relPath);
    if (fs.existsSync(fullPath)) {
      const buf  = fs.readFileSync(fullPath);
      const ext  = path.extname(relPath).slice(1).toLowerCase() || 'jpg';
      const mime = ext === 'png' ? 'image/png'
                 : ext === 'gif' ? 'image/gif'
                 : ext === 'webp'? 'image/webp'
                 :                 'image/jpeg';
      images[key] = `data:${mime};base64,${buf.toString('base64')}`;
      embedded++;
    } else {
      missing++;
    }
  }
  console.log(`   ✓  ${embedded} embedded, ${missing} missing from disk`);

  // ── Write output ─────────────────────────────────────────────────────────────
  const output = {
    state,
    images,       // base64 blobs — loaded directly by importData()
    imageIndex,   // key → path on disk (for reference / future sync)
    exportedAt: new Date().toISOString(),
    source: 'notion'
  };

  const outPath = path.join(__dirname, 'lmr-notion-export.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

  const sizeMB = (fs.statSync(outPath).size / 1024 / 1024).toFixed(1);
  console.log(`\n✅  Done! → lmr-notion-export.json (${sizeMB} MB)`);
  console.log('\n──────── SUMMARY ────────');
  console.log(`  Accounts:     ${state.accounts.length}`);
  console.log(`  Trades:       ${state.trades.length}`);
  console.log(`  Daily:        ${Object.keys(state.daily).length}`);
  console.log(`  Monthly:      ${Object.keys(state.monthly).length} → ${Object.keys(state.monthly).sort().join(', ')}`);
  console.log(`  Weekly:       ${Object.keys(state.weekly).length}`);
  console.log(`  Transactions: ${state.transactions.length}`);
  console.log(`  Notes:        ${state.notes.length}`);
  console.log(`  Journal:      ${state.journal.length}`);
  console.log(`  Images:       ${embedded} embedded in JSON`);
  console.log('─────────────────────────');
  console.log('\nNEXT:');
  console.log('  1. Open app → Settings → Import → lmr-notion-export.json');
  console.log('  2. All images load automatically — no extra sync step needed\n');
}

main().catch(err => {
  console.error('\n❌  Export failed:', err.message);
  if (err.code === 'object_not_found') {
    console.error('   → A database ID is wrong or the integration has no access.');
    console.error('   → Notion database → Share → Invite your integration.\n');
  }
  process.exit(1);
});
