/**
 * LMR Capitals — Notion Data Exporter
 * =====================================
 * Pulls all your Notion databases and converts them to the
 * LMR Capitals JSON format so you can import via Settings → Import.
 *
 * SETUP (one time):
 *   1. npm install @notionhq/client dotenv
 *   2. Create a .env file in this folder (see below)
 *   3. Share each Notion database with your integration
 *   4. node notion-export.js
 *   5. Open the app → Settings → Import → pick lmr-notion-export.json
 */

require('dotenv').config();
const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

// ─── CONFIG ─────────────────────────────────────────────────────────────────
// Copy these from your Notion database URLs
// URL format: notion.so/your-workspace/<DATABASE_ID>?v=...
const CONFIG = {
  token:       process.env.NOTION_TOKEN || 'YOUR_NOTION_INTEGRATION_TOKEN',
  databases: {
    trades:       process.env.DB_TRADES       || '',   // Trade Log database ID
    daily:        process.env.DB_DAILY        || '',   // Daily Pages database ID
    monthly:      process.env.DB_MONTHLY      || '',   // Monthly Analysis database ID
    weekly:       process.env.DB_WEEKLY       || '',   // Weekly Analysis database ID
    accounts:     process.env.DB_ACCOUNTS     || '',   // Accounts database ID
    transactions: process.env.DB_TRANSACTIONS || '',   // Transactions database ID
    notes:        process.env.DB_NOTES        || '',   // Notes database ID
    journal:      process.env.DB_JOURNAL      || '',   // Journal database ID
  }
};
// ────────────────────────────────────────────────────────────────────────────

const notion = new Client({ auth: CONFIG.token });

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getProp(page, name) {
  const p = page.properties[name];
  if (!p) return null;
  switch (p.type) {
    case 'title':       return p.title.map(t => t.plain_text).join('');
    case 'rich_text':   return p.rich_text.map(t => t.plain_text).join('');
    case 'number':      return p.number;
    case 'select':      return p.select?.name || '';
    case 'multi_select':return p.multi_select.map(s => s.name);
    case 'date':        return p.date?.start || '';
    case 'checkbox':    return p.checkbox;
    case 'url':         return p.url || '';
    case 'email':       return p.email || '';
    case 'phone_number':return p.phone_number || '';
    case 'formula':
      if (p.formula.type === 'number') return p.formula.number;
      if (p.formula.type === 'string') return p.formula.string;
      return null;
    default: return null;
  }
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

function tradingDaysBetween(start, end) {
  let s = new Date(start + 'T12:00'), e = new Date(end + 'T12:00');
  if (e < s) return 0;
  let days = 0, cur = new Date(s);
  const US_HOLIDAYS = ['2026-01-01','2026-01-19','2026-02-16','2026-04-03',
    '2026-05-25','2026-06-19','2026-07-03','2026-09-07','2026-11-26','2026-12-25'];
  while (cur < e) {
    cur.setDate(cur.getDate() + 1);
    const dow = cur.getDay();
    const iso = cur.toISOString().split('T')[0];
    if (dow !== 0 && dow !== 6 && !US_HOLIDAYS.includes(iso)) days++;
  }
  return days;
}

const DAY_START = 362;
const DAY_START_DATE = '2026-05-19';

function dayCountFor(dateStr) {
  return DAY_START + tradingDaysBetween(DAY_START_DATE, dateStr);
}

// ─── MAPPERS ─────────────────────────────────────────────────────────────────

function mapTrade(page) {
  // Adjust property names below to match your exact Notion column names
  const date   = getProp(page, 'Date') || getProp(page, 'date') || '';
  const pnl    = getProp(page, 'Net P/L') || getProp(page, 'Net PnL') || getProp(page, 'PnL') || 0;
  const risk   = getProp(page, 'Risk') || getProp(page, 'Risk $') || 0;
  const rr     = risk > 0 ? ((pnl / risk).toFixed(2)) : 0;
  return {
    id:           page.id.replace(/-/g, '').slice(0, 13) * 1 || Date.now(),
    notionId:     page.id,
    date,
    dayCount:     date ? dayCountFor(date) : 0,
    market:       getProp(page, 'Market') || getProp(page, 'Instrument') || 'NQ',
    position:     getProp(page, 'Position') || getProp(page, 'Direction') || 'Long',
    day:          getProp(page, 'Day') || '',
    month:        getProp(page, 'Month') || '',
    session:      getProp(page, 'Session') || '',
    timePeriod:   getProp(page, 'Time Period') || getProp(page, 'Time') || '',
    models:       getProp(page, 'Trade Entry Drill') || getProp(page, 'Model') || getProp(page, 'Entry Drill') || [],
    confirmations:getProp(page, 'Confirmation') || getProp(page, 'Confirmations') || [],
    emotions:     getProp(page, 'Emotions') || getProp(page, 'Emotion') || [],
    phases:       getProp(page, 'Market Phase') || getProp(page, 'Phase') || [],
    mmm:          getProp(page, 'Market Maker Model') || getProp(page, 'MMM') || [],
    movement:     getProp(page, 'Movement') || [],
    tframes:      getProp(page, 'T Frame') || getProp(page, 'Time Frame') || [],
    rth:          getProp(page, 'RTH Profile') || getProp(page, 'RTH Delivery') || '',
    htf:          getProp(page, 'HTF Delivery') || getProp(page, 'HTF') || '',
    pnl:          typeof pnl === 'number' ? pnl : parseFloat(pnl) || 0,
    risk:         typeof risk === 'number' ? risk : parseFloat(risk) || 0,
    lots:         getProp(page, 'Lots') || getProp(page, 'Size') || 0,
    accountId:    null,
    draws:        getProp(page, 'Draws') || getProp(page, 'Draw') || '',
    feedback:     getProp(page, 'Feedback') || getProp(page, 'Notes') || '',
    rr,
    win:          (typeof pnl === 'number' ? pnl : parseFloat(pnl) || 0) > 0,
    locked:       true,   // imported trades are sealed — screenshot only
  };
}

function mapDaily(page) {
  const date = getProp(page, 'Date') || getProp(page, 'date') || '';
  return {
    date,
    dayCount:   dayCountFor(date),
    bias:       getProp(page, 'Daily Bias') || getProp(page, 'Bias') || '',
    weekly:     getProp(page, 'Weekly') || getProp(page, 'Week Draws') || '',
    htfpoi:     getProp(page, 'HTF POI') || getProp(page, 'HTF Poi') || '',
    weekdraws:  getProp(page, 'Week Draws') || getProp(page, 'Draws') || '',
    london:     getProp(page, 'London') || '',
    ny:         getProp(page, 'New-York') || getProp(page, 'New York') || getProp(page, 'NY') || '',
    asianRange: getProp(page, 'Asian Range') || getProp(page, 'Asain Range') || '',
    session:    getProp(page, 'Session') || '',
    rth:        getProp(page, 'RTH Delivery') || '',
    plan:       getProp(page, 'Plan') || '',
    pred:       getProp(page, 'Prediction') || '',
    savedAt:    page.last_edited_time || new Date().toISOString(),
  };
}

function mapMonthly(page) {
  const title = getProp(page, 'Name') || getProp(page, 'Month') || getProp(page, 'Title') || '';
  // Try to derive YYYY-MM from title e.g. "May 2026"
  const months = {jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',
                  jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'};
  let monthKey = '';
  const m = title.toLowerCase().match(/(\w{3,})\s+(\d{4})/);
  if (m) monthKey = `${m[2]}-${months[m[1].slice(0,3)] || '01'}`;
  if (!monthKey) monthKey = '2026-05';
  return {
    key: monthKey,
    data: {
      'm-qshift':   getProp(page, 'Quarterly Shift') || getProp(page, 'QShift') || '',
      'm-profile':  getProp(page, 'Market Profile') || getProp(page, 'Profile') || '',
      'm-seasonal': getProp(page, 'Seasonal') || '',
      'm-rate':     getProp(page, 'Interest Rate') || getProp(page, 'Rate') || '',
      'm-pred':     getProp(page, 'Predictions') || '',
      'm-im':       getProp(page, 'IM Analysis') || getProp(page, 'Inter-Market') || '',
      'm-keylevels':getProp(page, 'Key Levels') || '',
    }
  };
}

function mapAccount(page) {
  return {
    id:      Date.now() + Math.random(),
    notionId:page.id,
    name:    getProp(page, 'Name') || getProp(page, 'Account') || 'Unnamed',
    type:    getProp(page, 'Type') || 'Funded',
    status:  getProp(page, 'Status') || 'In-Progress',
    date:    getProp(page, 'Date') || new Date().toISOString().split('T')[0],
    deposit: getProp(page, 'Deposit') || getProp(page, 'Balance') || getProp(page, 'Starting Balance') || 0,
  };
}

function mapTransaction(page) {
  return {
    id:        Date.now() + Math.random(),
    notionId:  page.id,
    date:      getProp(page, 'Date') || '',
    type:      getProp(page, 'Type') || 'Deposit',
    accountId: null,
    amount:    getProp(page, 'Amount') || 0,
    note:      getProp(page, 'Note') || getProp(page, 'Notes') || '',
  };
}

function mapNote(page) {
  const date = getProp(page, 'Date') || '';
  return {
    id:        Date.now() + Math.random(),
    notionId:  page.id,
    title:     getProp(page, 'Name') || getProp(page, 'Title') || '(imported)',
    date,
    text:      getProp(page, 'Content') || getProp(page, 'Notes') || getProp(page, 'Text') || '',
    createdAt: page.created_time || new Date().toISOString(),
  };
}

function mapJournal(page) {
  const typeRaw = getProp(page, 'Type') || 'lesson';
  const typeMap = {lesson:'lesson',win:'bull','win / followed plan':'bull',loss:'bear','loss / mistake':'bear',note:'neutral'};
  const type = typeMap[typeRaw.toLowerCase()] || 'lesson';
  return {
    id:       Date.now() + Math.random(),
    notionId: page.id,
    type,
    date:     getProp(page, 'Date') || '',
    text:     getProp(page, 'Entry') || getProp(page, 'Content') || getProp(page, 'Text') || '',
  };
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n⚡ LMR Capitals — Notion Exporter\n');

  if (CONFIG.token === 'YOUR_NOTION_INTEGRATION_TOKEN') {
    console.error('❌ Set NOTION_TOKEN in your .env file first.\n');
    console.log('HOW TO GET YOUR TOKEN:');
    console.log('  1. Go to https://www.notion.so/my-integrations');
    console.log('  2. Click "+ New integration"');
    console.log('  3. Name it "LMR Export", set workspace, submit');
    console.log('  4. Copy the "Internal Integration Token"');
    console.log('  5. Create a .env file here with: NOTION_TOKEN=secret_...\n');
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

  // TRADES
  if (CONFIG.databases.trades) {
    console.log('📈 Fetching trades...');
    const pages = await queryAll(CONFIG.databases.trades);
    state.trades = pages.map(mapTrade).filter(t => t.date);
    state.trades.sort((a, b) => b.date.localeCompare(a.date));
    console.log(`   ✓ ${state.trades.length} trades`);
  }

  // DAILY
  if (CONFIG.databases.daily) {
    console.log('📓 Fetching daily entries...');
    const pages = await queryAll(CONFIG.databases.daily);
    for (const page of pages) {
      const d = mapDaily(page);
      if (d.date) state.daily[d.date] = d;
    }
    console.log(`   ✓ ${Object.keys(state.daily).length} daily entries`);
  }

  // MONTHLY
  if (CONFIG.databases.monthly) {
    console.log('📆 Fetching monthly analysis...');
    const pages = await queryAll(CONFIG.databases.monthly);
    for (const page of pages) {
      const { key, data } = mapMonthly(page);
      state.monthly[key] = data;
    }
    console.log(`   ✓ ${Object.keys(state.monthly).length} months`);
  }

  // ACCOUNTS
  if (CONFIG.databases.accounts) {
    console.log('💰 Fetching accounts...');
    const pages = await queryAll(CONFIG.databases.accounts);
    state.accounts = pages.map(mapAccount);
    if (state.accounts.length) state.currentAcc = state.accounts[0].id;
    console.log(`   ✓ ${state.accounts.length} accounts`);
  }

  // TRANSACTIONS
  if (CONFIG.databases.transactions) {
    console.log('💳 Fetching transactions...');
    const pages = await queryAll(CONFIG.databases.transactions);
    state.transactions = pages.map(mapTransaction);
    console.log(`   ✓ ${state.transactions.length} transactions`);
  }

  // NOTES
  if (CONFIG.databases.notes) {
    console.log('📝 Fetching notes...');
    const pages = await queryAll(CONFIG.databases.notes);
    state.notes = pages.map(mapNote);
    console.log(`   ✓ ${state.notes.length} notes`);
  }

  // JOURNAL
  if (CONFIG.databases.journal) {
    console.log('📔 Fetching journal entries...');
    const pages = await queryAll(CONFIG.databases.journal);
    state.journal = pages.map(mapJournal);
    console.log(`   ✓ ${state.journal.length} journal entries`);
  }

  // WRITE OUTPUT
  const output = { state, images: {}, exportedAt: new Date().toISOString(), source: 'notion' };
  const outPath = path.join(__dirname, 'lmr-notion-export.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

  console.log(`\n✅ Done! Exported to: lmr-notion-export.json`);
  console.log('\nNEXT STEPS:');
  console.log('  1. Open LMR Capitals in your browser');
  console.log('  2. Go to Settings → Data → Import');
  console.log('  3. Select lmr-notion-export.json');
  console.log('  4. Your Notion data will appear immediately\n');
}

main().catch(err => {
  console.error('\n❌ Export failed:', err.message);
  if (err.code === 'object_not_found') {
    console.error('   → A database ID is wrong or the integration has no access to it.');
    console.error('   → Open the Notion database → Share → Invite your integration.\n');
  }
  process.exit(1);
});
