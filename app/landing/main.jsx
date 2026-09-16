// LMR Capitals — 3D-forward landing page.
// A persistent WebGL scene (particle nebula + the interlocking "Chain") sits
// behind glass content. Scroll drives the camera + chain assembly + per-section
// colour; mouse drives parallax. Copy carried from "The Chain" design.
// Sign-in CTAs route to the app (/) → signup → paywall.

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { createScene } from './scene-3d.js';
import { createDeskScene } from './desk-scene.js';
import { createPuzzle } from './puzzle-scene.js';
import { createChart } from './mini-charts.js';
import { initPeripherals } from './peripherals.js';
import { createHeroFocal } from './hero-focal.js';

const goApp = () => { window.location.href = '/'; };
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const smooth = (e0, e1, x) => { const t = clamp01((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };

/* ── scroll-reveal ───────────────────────────────────────────────────────── */
function Reveal({ children, className = '', style, delay = 0, as: Tag = 'div' }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver((es) => { es.forEach((e) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }); }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={className} style={{ opacity: seen ? 1 : 0, transform: seen ? 'none' : 'translateY(26px)', transition: `opacity .8s cubic-bezier(.22,1,.36,1) ${delay}s, transform .8s cubic-bezier(.22,1,.36,1) ${delay}s`, ...style }}>
      {children}
    </Tag>
  );
}

const PILLARS = [
  { num: '01', title: 'Trading Journal & Track Record', copy: 'Every trade — entry, exit, model, session, risk, and result — is logged in real time.', detail: 'Daily, weekly, and monthly reports turn raw data into a transparent track record, reviewed honestly, wins and losses alike — the same ledger that backs every public result LMR Capitals shows.' },
  { num: '02', title: 'Education & Mentorship', copy: 'I teach the LMR methodology to traders who want structure over guesswork.', detail: 'The MMBM/MMSM weekly models, session profiling, HTF bias, and the psychology of staying consistent under pressure — taught from the exact playbook run in the live journal, not a simplified version of it.' },
  { num: '03', title: 'Fund & Signal Management', copy: 'For clients seeking disciplined, rules-based exposure.', detail: "Managed accounts and trade signals built on the exact process documented in this journal — full transparency, no black boxes, no strategy you can't see reasoned through in real time." },
];
const STAGES = [
  { k: 'LMR Methodology', c: 'The master framework binding every link — the shared language, rules, and philosophy that every other card in the chain inherits from.' },
  { k: 'The Monthly Chain', c: 'Monthly analysis tracks the broader quarterly shift (STS/LTS bias) and market profile — trending, retracing, consolidating, or manipulative — to keep every smaller decision aligned with the bigger picture.' },
  { k: 'The Weekly Chain', c: 'Every week is mapped against the MMBM and MMSM weekly models, identifying the dominant profile and how price is expected to deliver across the five sessions ahead.' },
  { k: 'The Daily Chain', c: 'Each day begins with a defined bias, key HTF points of interest, and a session plan — then closes with a full review of execution, P&L, and lessons before the next link forms.' },
  { k: 'Session Profiling', c: 'London and New York sessions are each classified — Accumulation, Manipulation, Distribution, Rebalance/Reversal, Retracement/Continuation — to anticipate how price should move before it moves.' },
  { k: 'The Trade', c: 'Every trade is tagged with its model, session, emotion, and outcome — the link every other link exists to set up cleanly.' },
  { k: 'Discipline & Journaling', c: 'The final link that closes the loop — daily review and honest logging feed straight back into the methodology, starting the chain again.' },
];
const BEFORE = ['Hesitation before every entry', 'Self-doubt after every stop-out', 'Discipline that has to be forced', 'Reacting to headlines and noise', '"Am I right about this?"'];
const AFTER = ['Alignment across every timeframe', 'Thesis stays intact through the drawdown', 'Patience has a reason, not just willpower', 'Anchored to structure, not sentiment', '"Is the chain confirming?"'];
const CHAOS_WORDS = ['Hesitation', 'Self-doubt', 'Overtrading', 'Revenge trades', 'FOMO', 'No plan', 'Chasing noise', 'Forced entries'];
// trades journal — each row has a "messy" (unlogged) and "clean" (organised) form
const TRADES = [
  { date: '03/11', sym: 'NQ', side: 'LONG', rr: '2.6R', pnl: '+$780', tag: 'Power of 3', win: true },
  { date: '03/12', sym: 'ES', side: 'SHORT', rr: '1.9R', pnl: '+$410', tag: 'MMBM', win: true },
  { date: '03/13', sym: 'YM', side: 'LONG', rr: '3.1R', pnl: '+$620', tag: 'AMD', win: true },
  { date: '03/14', sym: 'NQ', side: 'SHORT', rr: '1.0R', pnl: '−$220', tag: 'Planned stop', win: false },
  { date: '03/17', sym: 'ES', side: 'LONG', rr: '2.2R', pnl: '+$540', tag: 'Power of 3', win: true },
  { date: '03/18', sym: 'NQ', side: 'LONG', rr: '1.8R', pnl: '+$360', tag: 'MMSM', win: true },
];
const TRADES_MESSY = { side: '—', rr: '—', pnl: '−$?', tag: ['no plan', 'revenge', 'FOMO', 'chased', 'no plan', 'tilt'] };
const PLAYBOOK = [
  'Wait for the chain. No confirmation, no trade.',
  'Trade the plan — never the feeling.',
  'Log every trade, and the emotion behind it.',
  'When the chain breaks, exit. No story.',
  'Review, don’t react. Repeat what works.',
];
const SHIFTS = [
  { n: '01', k: 'Organization', chart: 'scatter-grid', c: 'Every trade finds its place — the workspace stops being noise and becomes a system he can read.' },
  { n: '02', k: 'Discipline', chart: 'uptrend', c: 'Every action presented with one motive. No confirmation, no trade — patience becomes the edge.' },
  { n: '03', k: 'Psychology', chart: 'equity', c: 'His mindset is set by the journal — reading his own trades back, the thesis holds through the drawdown.' },
  { n: '04', k: 'Purpose', chart: 'candles', c: 'Every trade has a purpose. He trades a process to buy back time — not to chase a feeling.' },
];
const EDGES = [
  { t: 'Leading, Not Lagging', c: "The chain confirms direction across markets before price commits — you're positioned ahead of the move, not reacting to it." },
  { t: 'Confluence Over Opinion', c: 'One market never decides a trade. Five markets agreeing removes opinion from the equation entirely.' },
  { t: 'Built-In Risk Filter', c: 'When the chain breaks, the thesis breaks with it — an objective reason to exit before the loss becomes a story.' },
];
const INDICATORS = [
  { name: 'LMR ICT Everything', tagline: 'All-in-one ICT charting suite', price: '$40 / month', desc: 'One indicator that replaces a dozen — every key level, session and time window from the LMR playbook drawn automatically, with a live bias panel keeping you honest.', features: ['Session boxes & vertical session lines (London / New York)', 'Time-window macros — the exact delivery windows that matter', 'Midnight, Sunday, Weekly & Monthly opening price lines', 'Prev day / week / month highs & lows, plus RTH high–low', 'Equilibrium with Premium / Discount zones', 'Live Bias panel, Checklist panel & A+ Setup Score'], mailto: 'mailto:admin@lmrcapitals.com?subject=LMR%20ICT%20Everything' },
  { name: 'LMR 90-Min Cycle', tagline: 'Session Quarters + Live AMD Detector', price: '$40 / month', desc: 'The market moves in 90-minute quarters — Accumulation, Manipulation, Distribution. This maps every session into its A-M-D blocks and tells you, live, which phase price is in.', features: ['Asia, London, NY AM & NY PM boxes with 90-min quarter blocks', 'Live AMD phase engine — Accumulation → Manipulation → Distribution', 'Judas-swing confirmation on the manipulation block', 'Bull / bear distribution confirmed by ATR displacement', 'True Open lines for every session', 'Live dashboard — session, block, phase & status at a glance'], mailto: 'mailto:admin@lmrcapitals.com?subject=LMR%2090-Min%20Cycle' },
];
const SOCIAL = [
  { label: 'X / Twitter', href: 'https://x.com/lmrcapitals', d: 'M18.9 2H22l-7.2 8.2L23 22h-6.6l-5.2-6.8L5 22H2l7.7-8.8L1.5 2h6.8l4.7 6.2L18.9 2z', fill: true },
  { label: 'Discord', href: 'https://discord.gg/jfkzn5GS', d: 'M8 12a1 1 0 102 0 1 1 0 00-2 0zm6 0a1 1 0 102 0 1 1 0 00-2 0zM7 8.5C9.5 7.2 14.5 7.2 17 8.5m-11 7c2.5 1.3 7.5 1.3 11 0' },
  { label: 'YouTube', href: 'https://www.youtube.com/@LMRcapitals', d: 'M10 9l6 3-6 3V9z', fill: true, rect: true },
  { label: 'Instagram', href: 'https://www.instagram.com/lmrcapitals/', d: 'M12 8a4 4 0 100 8 4 4 0 000-8z', rect2: true },
  { label: 'Email', href: 'mailto:admin@lmrcapitals.com', d: 'M3 6l9 7 9-7', rect3: true },
];

const PROOF = [
  { n: '100%', k: 'Trades journaled in real time' },
  { n: 'D → W → M', k: 'Daily, weekly & monthly reports' },
  { n: 'Wins + Losses', k: 'Shown in full — never cherry-picked' },
  { n: 'Public', k: 'The same ledger behind every result' },
];
// Count-up for a numeric-leading stat (e.g. "100%"); non-numeric passes through.
// Initialises to the final value (safe if never seen), animates 0→value on first view.
function CountUp({ text }) {
  const m = /^(\d+)(.*)$/.exec(text);
  if (!m) return <>{text}</>;
  const target = parseInt(m[1], 10), suffix = m[2] || '';
  const ref = useRef(null);
  const [val, setVal] = useState(target);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    let raf = 0, started = false;
    const run = () => { const t0 = performance.now(); const dur = 1100; const step = (t) => { const p = Math.min(1, (t - t0) / dur); const e = 1 - Math.pow(1 - p, 3); setVal(Math.round(e * target)); if (p < 1) raf = requestAnimationFrame(step); }; setVal(0); raf = requestAnimationFrame(step); };
    const io = new IntersectionObserver((es) => { es.forEach((e) => { if (e.isIntersecting && !started) { started = true; run(); io.disconnect(); } }); }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return <span ref={ref}>{val}{suffix}</span>;
}
function Check() {
  return (<svg className="ck" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>);
}

/* Realistic animated candlestick chart with LMR indicator overlays.
   variant 'ict'  → session boxes, level lines, equilibrium, live BIAS panel.
   variant 'amd'  → Accumulation / Manipulation / Distribution phase blocks. */
function MarketChart({ variant = 'ict' }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const N = 46;
    let seed = variant === 'ict' ? 20240137 : 90247711;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    // build a believable up-biased random walk (AMD variant dips then rallies)
    const candles = []; let price = 100;
    for (let i = 0; i < N; i++) {
      let bias = 0.06;
      if (variant === 'amd') bias = i < N * 0.32 ? 0.02 : i < N * 0.5 ? -0.34 : 0.4; // accum, manip (dip), distrib (rally)
      const drift = (rnd() - 0.5 + bias) * 1.7;
      const o = price, c = Math.max(60, o + drift);
      const hi = Math.max(o, c) + rnd() * 1.2, lo = Math.min(o, c) - rnd() * 1.2;
      candles.push({ o, c, hi, lo }); price = c;
    }
    const lo = Math.min(...candles.map(c => c.lo)), hi = Math.max(...candles.map(c => c.hi));
    let raf = 0, disposed = false, started = false, t0 = 0;
    function resize() { const w = canvas.clientWidth || 560, h = canvas.clientHeight || 340; canvas.width = w * DPR; canvas.height = h * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); }
    resize();
    const io = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting && !started) { started = true; t0 = performance.now(); } }), { threshold: 0.2 });
    io.observe(canvas);
    const GREEN = '#25c9a8', RED = '#f0705a', GOLD = '#F5A623', GRID = 'rgba(120,140,180,.08)';
    function draw(now) {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      const padX = 12, padTop = 16, padBot = 16, chartH = h - padTop - padBot;
      const yOf = v => padTop + (hi - v) / (hi - lo) * chartH;
      const step = (w - padX * 2) / N, bw = Math.max(2, step * 0.56);
      // grid
      ctx.strokeStyle = GRID; ctx.lineWidth = 1;
      for (let g = 0; g <= 4; g++) { const y = padTop + (chartH / 4) * g; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      const t = (now - t0) / 1000;
      const prog = started ? Math.min(1, (now - t0) / 1700) : 0;
      const shown = Math.floor(prog * N);
      // ── overlays behind candles ──
      if (variant === 'ict') {
        // session bands
        const bands = [[0.14, 0.30, 'LONDON'], [0.52, 0.74, 'NEW YORK']];
        bands.forEach(([a, b, lbl], k) => {
          const x1 = padX + a * (w - padX * 2), x2 = padX + b * (w - padX * 2);
          ctx.fillStyle = k ? 'rgba(245,166,35,.07)' : 'rgba(58,107,255,.08)';
          ctx.fillRect(x1, padTop, x2 - x1, chartH);
          ctx.fillStyle = k ? 'rgba(245,166,35,.6)' : 'rgba(120,150,230,.7)';
          ctx.font = '700 9px Archivo, sans-serif'; ctx.fillText(lbl, x1 + 4, padTop + 11);
        });
        // level lines (prev high / low) + equilibrium
        ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
        [[hi - (hi - lo) * 0.12, 'rgba(240,112,90,.5)'], [lo + (hi - lo) * 0.12, 'rgba(37,201,168,.5)'], [(hi + lo) / 2, 'rgba(245,166,35,.45)']].forEach(([v, col]) => {
          ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(0, yOf(v)); ctx.lineTo(w, yOf(v)); ctx.stroke();
        });
        ctx.setLineDash([]);
      } else {
        const zones = [[0, 0.32, 'rgba(120,140,180,.08)', 'ACCUMULATION', 'rgba(160,180,210,.75)'], [0.32, 0.5, 'rgba(240,112,90,.10)', 'MANIPULATION', 'rgba(240,112,90,.8)'], [0.5, 1, 'rgba(37,201,168,.10)', 'DISTRIBUTION', 'rgba(37,201,168,.85)']];
        zones.forEach(([a, b, col, lbl, tc]) => {
          const x1 = padX + a * (w - padX * 2), x2 = padX + b * (w - padX * 2);
          ctx.fillStyle = col; ctx.fillRect(x1, padTop, x2 - x1, chartH);
          ctx.fillStyle = tc; ctx.font = '700 9px Archivo, sans-serif'; ctx.fillText(lbl, x1 + 5, padTop + 12);
        });
      }
      // ── candles ──
      for (let i = 0; i < N && i <= shown; i++) {
        const c = candles[i]; const x = padX + i * step + step / 2; const up = c.c >= c.o;
        let cc = c.c;
        if (i === shown && i === N - 1) cc = c.o + (c.c - c.o) * (0.6 + 0.4 * Math.sin(t * 3)); // live flicker
        ctx.strokeStyle = up ? GREEN : RED; ctx.fillStyle = up ? GREEN : RED; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(x, yOf(c.hi)); ctx.lineTo(x, yOf(c.lo)); ctx.stroke();
        const yO = yOf(c.o), yC = yOf(cc); const top = Math.min(yO, yC), bh = Math.max(1.5, Math.abs(yC - yO));
        ctx.fillRect(x - bw / 2, top, bw, bh);
      }
      // last price line + tag
      if (shown >= 1) {
        const last = candles[Math.min(shown, N - 1)]; const y = yOf(last.c);
        ctx.strokeStyle = 'rgba(245,166,35,.55)'; ctx.setLineDash([2, 3]); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); ctx.setLineDash([]);
      }
      // panel chip
      ctx.fillStyle = 'rgba(8,12,20,.72)';
      const pw = variant === 'ict' ? 96 : 104, ph = 30, px = w - pw - 8, py = 8;
      roundRect(ctx, px, py, pw, ph, 6); ctx.fill();
      ctx.strokeStyle = 'rgba(245,166,35,.35)'; ctx.lineWidth = 1; roundRect(ctx, px, py, pw, ph, 6); ctx.stroke();
      if (variant === 'ict') {
        ctx.fillStyle = 'rgba(174,185,204,.75)'; ctx.font = '700 8px Archivo, sans-serif'; ctx.fillText('BIAS', px + 8, py + 12);
        ctx.fillStyle = GREEN; ctx.font = '800 12px Archivo, sans-serif'; ctx.fillText('▲ BULLISH', px + 8, py + 24);
      } else {
        const phase = shown < N * 0.32 ? ['ACCUM', 'rgba(174,185,204,.85)'] : shown < N * 0.5 ? ['MANIPULATION', RED] : ['DISTRIBUTION', GREEN];
        ctx.fillStyle = 'rgba(174,185,204,.75)'; ctx.font = '700 8px Archivo, sans-serif'; ctx.fillText('PHASE', px + 8, py + 12);
        ctx.fillStyle = phase[1]; ctx.font = '800 11px Archivo, sans-serif'; ctx.fillText(phase[0], px + 8, py + 24);
      }
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    const onR = () => resize(); window.addEventListener('resize', onR);
    return () => { disposed = true; cancelAnimationFrame(raf); io.disconnect(); window.removeEventListener('resize', onR); };
  }, [variant]);
  return <canvas ref={ref} className="mchart" />;
}
function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

/* ── "Five Markets Align → Conviction" — the new model for the Conviction act ─ */
const MARKETS = [
  { k: 'NQ', a0: -46 }, { k: 'ES', a0: 30 }, { k: 'YM', a0: -20 }, { k: 'DXY', a0: 54 }, { k: 'GOLD', a0: -36 },
];
function FiveMarkets({ align }) {
  const locked = Math.round(clamp01(align) * MARKETS.length);
  return (
    <div className="fm">
      <div className="fm-line" style={{ opacity: align, transform: `scaleX(${0.2 + align * 0.8})` }} />
      <div className="fm-row">
        {MARKETS.map((m, i) => {
          const on = i < locked;
          const ang = m.a0 * (1 - clamp01((align - i * 0.06) / 0.7)); // staggered snap to vertical
          return (
            <div key={i} className={'fm-mkt' + (on ? ' on' : '')}>
              <span className="fm-k">{m.k}</span>
              <svg className="fm-arrow" viewBox="0 0 40 84" style={{ transform: `rotate(${ang}deg)` }}>
                <line x1="20" y1="78" x2="20" y2="16" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                <path d="M7 30 L20 9 L33 30" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="fm-dot" />
            </div>
          );
        })}
      </div>
      <div className="fm-readout">
        <span className="fm-count">{locked} / {MARKETS.length}</span>
        <span className="fm-lbl">{locked >= MARKETS.length ? 'MARKETS ALIGNED' : 'CONFIRMING…'}</span>
      </div>
      <div className="fm-meter"><span style={{ width: `${align * 100}%` }} /></div>
    </div>
  );
}

function Placeholder({ label, style }) {
  return <div data-image-slot={label} style={{ width: '100%', height: '100%', minHeight: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,rgba(20,30,50,.6),rgba(6,11,20,.6))', color: '#3c4b66', fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', textAlign: 'center', padding: 14, lineHeight: 1.5, border: '1px dashed rgba(120,140,180,.18)', borderRadius: 10, ...style }}>{label}</div>;
}

function App() {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const chainSecRef = useRef(null);
  const deskCanvasRef = useRef(null);
  const convRef = useRef(null);
  const puzzleCanvasRef = useRef(null);
  const cardCanvasRefs = useRef([]);
  const heroFocalRef = useRef(null);
  const indCanvasRefs = useRef([]);
  const trackCurveRef = useRef(null);
  const [activeStage, setActiveStage] = useState(0);
  const [mp, setMp] = useState(0);          // #method scroll progress 0..1
  const [convP, setConvP] = useState(0);    // conviction scroll progress 0..1
  const [screenRect, setScreenRect] = useState(null); // monitor screen rect in CSS px
  const [card, setCard] = useState(null);
  const [activeNav, setActiveNav] = useState('');

  useEffect(() => {
    let scene;
    try { scene = createScene(canvasRef.current); } catch (e) { scene = null; }
    sceneRef.current = scene;

    // The cinematic desk + monitor. Camera flies into the screen; the Chain
    // assembles "inside" it; then it pulls back out onto the desk.
    let desk = null;
    try { desk = createDeskScene(deskCanvasRef.current); } catch (e) { desk = null; }
    let puzzle = null;
    try { puzzle = createPuzzle(puzzleCanvasRef.current); } catch (e) { puzzle = null; }
    const cardCharts = cardCanvasRefs.current.map((c, i) => { try { return createChart(c, { kind: SHIFTS[i].chart }); } catch (e) { return null; } });
    let heroFocal = null;
    try { heroFocal = createHeroFocal(heroFocalRef.current); } catch (e) { heroFocal = null; }
    const indKinds = ['structure', 'candles'];
    const indCharts = indCanvasRefs.current.map((c, i) => { try { const ch = createChart(c, { kind: indKinds[i % indKinds.length] }); ch.setProgress(1); return ch; } catch (e) { return null; } });
    let trackCurve = null;
    try { trackCurve = createChart(trackCurveRef.current, { kind: 'equity' }); trackCurve.setProgress(1); } catch (e) { trackCurve = null; }

    const calc = (el) => { if (!el) return 0; const vh = innerHeight; const r = el.getBoundingClientRect(); const total = r.height - vh; return total <= 0 ? (r.top < 0 ? 1 : 0) : clamp01(-r.top / total); };
    const onScroll = () => {
      const doc = document.documentElement;
      const p = clamp01(scrollY / ((doc.scrollHeight - innerHeight) || 1));
      scene && scene.setScroll(p);
      const cp = calc(chainSecRef.current);
      scene && scene.setChainProgress(cp);
      desk && desk.setProgress(cp);
      setMp(cp);
      // lock the overlay to the monitor screen's actual projected rectangle
      if (desk && desk.getScreenRect) { const r = desk.getScreenRect(); if (r && r.w > 0) setScreenRect(r); }
      // the 7-stage in-monitor journey runs across 0.16 → 0.86
      const inside = clamp01((cp - 0.16) / (0.86 - 0.16));
      setActiveStage(Math.max(0, Math.min(STAGES.length - 1, Math.floor(inside * STAGES.length - 1e-6))));
      const cvp = calc(convRef.current);
      setConvP(cvp);
      puzzle && puzzle.setProgress(clamp01((cvp - 0.40) / (0.62 - 0.40)));      // rewiring: pieces align 0.40 → 0.62
      const cardsP = clamp01((cvp - 0.70) / (0.90 - 0.70));                     // four concept cards draw in
      cardCharts.forEach((ch, i) => ch && ch.setProgress(clamp01((cardsP - i * 0.10) / 0.55)));
    };
    const onResize = () => { if (desk && desk.getScreenRect) { const r = desk.getScreenRect(); if (r && r.w > 0) setScreenRect(r); } };
    addEventListener('resize', onResize);
    // the rect depends on the rendered camera; sample a couple of frames after mount
    const t0 = setTimeout(onResize, 120), t1 = setTimeout(onResize, 500);
    const onMouse = (e) => {
      const mx = (e.clientX / innerWidth) * 2 - 1, my = (e.clientY / innerHeight) * 2 - 1;
      scene && scene.setMouse(mx, my);
      desk && desk.setMouse(mx, my);
      heroFocal && heroFocal.setMouse(mx, my);
    };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('mousemove', onMouse, { passive: true });
    onScroll();

    // section → scene theme index
    const secs = Array.from(document.querySelectorAll('[data-scene]'));
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) scene && scene.setSection(parseInt(e.target.getAttribute('data-scene'), 10) || 0); });
    }, { threshold: 0.4 });
    secs.forEach((s) => io.observe(s));

    // active-nav highlight
    const navIo = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) setActiveNav(e.target.id); });
    }, { threshold: 0, rootMargin: '-40% 0px -55% 0px' });
    ['about', 'what', 'method', 'indicators', 'contact'].forEach((id) => { const el = document.getElementById(id); if (el) navIo.observe(el); });

    // peripherals: smooth scroll, gold cursor, magnetic buttons, progress rail
    let periph = null; try { periph = initPeripherals(); } catch (e) { periph = null; }

    return () => { removeEventListener('scroll', onScroll); removeEventListener('mousemove', onMouse); removeEventListener('resize', onResize); clearTimeout(t0); clearTimeout(t1); io.disconnect(); navIo.disconnect(); if (periph) periph.dispose(); if (scene) scene.dispose(); if (desk) desk.dispose(); if (puzzle) puzzle.dispose(); cardCharts.forEach((c) => c && c.dispose()); if (heroFocal) heroFocal.dispose(); indCharts.forEach((c) => c && c.dispose()); if (trackCurve) trackCurve.dispose(); };
  }, []);

  // 3D mouse-tilt on cards marked .tilt3d
  useEffect(() => {
    const cards = Array.from(document.querySelectorAll('.tilt3d'));
    const onMove = (e) => {
      const c = e.currentTarget; const r = c.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      c.style.transform = `perspective(900px) rotateX(${(-py * 6).toFixed(2)}deg) rotateY(${(px * 7).toFixed(2)}deg) translateY(-6px)`;
    };
    const onLeave = (e) => { e.currentTarget.style.transform = ''; };
    cards.forEach((c) => { c.addEventListener('mousemove', onMove); c.addEventListener('mouseleave', onLeave); });
    return () => cards.forEach((c) => { c.removeEventListener('mousemove', onMove); c.removeEventListener('mouseleave', onLeave); });
  }, []);

  // overlay copy timing, synced to the camera choreography
  const introOpacity = 1 - smooth(0.04, 0.13, mp);                       // fades as we fly in
  const insideOpacity = smooth(0.15, 0.20, mp) * (1 - smooth(0.88, 0.95, mp)); // in across the journey
  const journeyProgress = clamp01((mp - 0.16) / (0.86 - 0.16));          // 0..1 through the 7 stages
  // overlay elements locked to the monitor screen rectangle (falls back to CSS % if unknown)
  const R = screenRect;
  const copyPos = R ? { left: R.x + R.w * 0.05, top: R.y + R.h * 0.52, width: R.w * 0.34, transform: 'translateY(-50%)' } : null;
  const connPos = R ? { left: R.x + R.w * 0.26, top: R.y + R.h * 0.30, width: R.w * 0.32, height: R.h * 0.24 } : null;
  const finalePos = R ? { left: R.x + R.w * 0.5, top: R.y + R.h * 0.07, transform: 'translateX(-50%)' } : null;
  // conviction timing — PDF storyboard: organise the table → rewiring (puzzle) → four cards → close
  const cvHead = 1 - smooth(0.10, 0.16, convP);                                  // section intro copy over the table
  const cvTrades = smooth(0.03, 0.10, convP) * (1 - smooth(0.34, 0.40, convP));  // 1: organise the table
  const cvTradesP = clamp01((convP - 0.08) / (0.30 - 0.08));
  const cvPuzzle = smooth(0.38, 0.45, convP) * (1 - smooth(0.64, 0.70, convP));  // 2: the rewiring (jigsaw)
  const cvCards = smooth(0.70, 0.77, convP) * (1 - smooth(0.95, 0.98, convP));   // 3: four concept cards
  const cvCardsP = clamp01((convP - 0.70) / (0.90 - 0.70));
  const cvClose = smooth(0.95, 0.99, convP);                                     // 4: closing

  const S = 'clamp(20px,5vw,72px)';
  return (
    <>
      <canvas ref={canvasRef} id="bg3d" />
      <div className="veil" />
      <div className="lmr-intro" />
      <div className="page">
        {/* NAV */}
        <nav className="nav">
          <div className="brand"><span className="dot">LMR</span><span>LMR <strong>Capitals</strong></span></div>
          <div className="links">
            <a href="#about" className={activeNav === 'about' ? 'on' : ''}>About</a>
            <a href="#what" className={activeNav === 'what' ? 'on' : ''}>What We Do</a>
            <a href="#method" className={activeNav === 'method' ? 'on' : ''}>Methodology</a>
            <a href="#indicators" className={activeNav === 'indicators' ? 'on' : ''}>Indicators</a>
            <a href="#contact" className={activeNav === 'contact' ? 'on' : ''}>Contact</a>
          </div>
          <button className="btn btn-ghost" onClick={goApp}>Sign In</button>
        </nav>

        {/* HERO */}
        <section className="hero" data-scene="0">
          <canvas ref={heroFocalRef} className="hero-focal" aria-hidden="true" />
          <Reveal><span className="eyebrow">Trader · Mentor · Fund Manager</span></Reveal>
          <Reveal delay={0.05}><h1 className="h1">Trade With a System.<br />Master <span className="gold">The Chain</span>.</h1></Reveal>
          <Reveal delay={0.12}><p className="lead">A structured Daily → Weekly → Monthly methodology — every trade, every model, every lesson logged in real time, and organized end to end by one system.</p></Reveal>
          <Reveal delay={0.2}><div className="row">
            <button className="btn btn-gold" onClick={goApp}>Start Free Trial →</button>
            <a className="btn btn-ghost" href="#about">Learn More</a>
          </div></Reveal>
          <div className="scrollhint">Scroll ↓</div>
        </section>

        {/* ABOUT */}
        <section id="about" className="wrap" data-scene="1">
          <Reveal className="glass pad">
            <span className="kick">Who I Am</span>
            <h2 className="h2">A Trader Who Treats Trading Like a Business</h2>
            <p className="body">I'm the founder and head trader at LMR Capitals. Every session starts with a plan and ends with a review — daily bias, higher-timeframe points of interest, session profile, execution, and the emotions behind every decision are logged in this journal, and organized end to end by one system: The Chain.</p>
          </Reveal>
        </section>

        {/* WHAT WE DO */}
        <section id="what" className="wrap" data-scene="2">
          <Reveal><span className="kick">What We Do</span><h2 className="h2">Three Ways LMR Capitals Operates</h2>
            <p className="body" style={{ maxWidth: '60ch' }}>One methodology, applied across three connected pillars — my own trading, the traders I mentor, and the clients I work with.</p></Reveal>
          <div className="grid3">
            {PILLARS.map((p, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <button className="glass card tilt tilt3d" onClick={() => setCard(p)}>
                  <span className="cnum">{p.num}</span>
                  <h3 className="h3">{p.title}</h3>
                  <p className="body sm">{p.copy}</p>
                  <span className="more">Read more →</span>
                </button>
              </Reveal>
            ))}
          </div>
        </section>

        {/* METHOD — the Chain: camera flies INTO the trader's monitor, the
            content plays inside the screen, then shrinks back onto the desk. */}
        <section id="method" ref={chainSecRef} className="method-sec" data-scene="3">
          <div className="method-sticky">
            <canvas ref={deskCanvasRef} className="desk-canvas" />
            <div className="method-veil" />

            {/* establishing caption — visible on the wide desk shot, fades as we fly in */}
            <div className="method-intro" style={{ opacity: introOpacity, pointerEvents: introOpacity < 0.1 ? 'none' : 'auto' }}>
              <span className="kick">How We Do It — The Chain</span>
              <h2 className="h2">It All Runs From One Desk</h2>
              <p className="body">Every session, every model, every lesson — organized end to end by one system. Step inside the screen.</p>
              <p className="hint">Scroll — fly into the monitor ↓</p>
            </div>

            {/* finale line, inside the screen, when the chain is complete */}
            {activeStage === STAGES.length - 1 && journeyProgress > 0.94 && (
              <span className="chain-finale" style={{ opacity: insideOpacity, ...(finalePos || {}) }}>The Chain — Connected in Full Circle</span>
            )}

            {/* thin gold connector line from the copy to the link (per the design) */}
            <svg className="chain-connector" style={{ opacity: insideOpacity * 0.85, ...(connPos || {}) }} preserveAspectRatio="none" viewBox="0 0 100 100">
              <path d="M1,72 L1,18 L99,18" fill="none" stroke="rgba(245,166,35,0.5)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              <circle cx="99" cy="18" r="2.4" fill="#F5A623" vectorEffect="non-scaling-stroke" />
            </svg>

            {/* inside-the-screen methodology — left copy block + dash-dots (per the design) */}
            <div className="method-inside" style={{ opacity: insideOpacity, pointerEvents: insideOpacity < 0.1 ? 'none' : 'auto', ...(copyPos || {}) }}>
              <span className="kick">How We Do It — The Chain</span>
              <div className="stagecard" key={activeStage}>
                <h2 className="h2 gold">{STAGES[activeStage].k}</h2>
                <p className="body">{STAGES[activeStage].c}</p>
              </div>
              <div className="chain-dots">
                {STAGES.map((s, i) => (
                  <span key={i} className={'cdot' + (i === activeStage ? ' on' : '')} title={s.k} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CONVICTION — cinematic "Transformation" act (chaos→order, split, four shifts) */}
        <section ref={convRef} className="tf-sec" data-scene="4">
          <div className="tf-sticky">
            {/* section intro over the table */}
            <div className="tf-head" style={{ opacity: cvHead, pointerEvents: 'none' }}>
              <span className="kick">From Analysis to Conviction</span>
              <h2 className="h2">The Chain Doesn't Just Predict the Market.<br />It <span className="gold">Rewires the Trader</span>.</h2>
              <p className="body" style={{ maxWidth: '48ch', margin: '14px auto 0' }}>He sits down to a messy table and a high hope. Watch him organise it.</p>
            </div>

            {/* Beat 1 — the trader's table: unorganised → organised */}
            <div className="tf-trades" style={{ opacity: cvTrades, pointerEvents: 'none' }}>
              <span className="kick">Unorganised → Organised</span>
              <div className="tt-wrap">
                <div className="tt-head-row"><span>Date</span><span>Mkt</span><span>Side</span><span>R:R</span><span>P&amp;L</span><span>Setup</span></div>
                {TRADES.map((t, i) => {
                  const c = clamp01((cvTradesP * 1.3 - i * 0.10) / 0.5);        // staggered top → bottom
                  const e = c * c * (3 - 2 * c);
                  const mx = [-130, 95, -70, 150, -110, 80][i], my = [-16, 12, 18, -10, 14, -18][i], rot = [-5, 4, -3, 6, -4, 3][i];
                  const clean = e >= 0.5;
                  return (
                    <div className="tt-row" key={i} style={{ transform: `translate(${(mx * (1 - e)).toFixed(1)}px, ${(my * (1 - e)).toFixed(1)}px) rotate(${(rot * (1 - e)).toFixed(2)}deg)`, opacity: 0.32 + 0.68 * e, borderColor: clean ? 'rgba(245,166,35,0.28)' : 'rgba(240,112,90,0.28)' }}>
                      <span className="tt-date">{t.date}</span>
                      <span className="tt-sym">{t.sym}</span>
                      <span className="tt-side">{clean ? t.side : TRADES_MESSY.side}</span>
                      <span className="tt-rr">{clean ? t.rr : TRADES_MESSY.rr}</span>
                      <span className="tt-pnl" style={{ color: clean ? (t.win ? '#35d0a0' : 'var(--coral)') : 'var(--coral)' }}>{clean ? t.pnl : TRADES_MESSY.pnl}</span>
                      <span className={'tt-tag' + (clean ? ' on' : '')}>{clean ? t.tag : TRADES_MESSY.tag[i]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Beat 2 — The Rewiring: the trader finally aligns the puzzle */}
            <div className="tf-puzzle" style={{ opacity: cvPuzzle, pointerEvents: 'none' }}>
              <canvas ref={puzzleCanvasRef} className="tf-puzzle-canvas" />
              <div className="tf-puzzle-copy">
                <span className="kick">The Rewiring</span>
                <p className="body">Every ability, aligned. He keeps trying — and the pieces finally lock into one picture.</p>
              </div>
            </div>

            {/* Beat 3 — the four shifts as concept cards */}
            <div className="tf-cards" style={{ opacity: cvCards, pointerEvents: 'none' }}>
              <span className="kick">What The Chain Builds In Him</span>
              <div className="cc-grid">
                {SHIFTS.map((s, i) => {
                  const cp = clamp01((cvCardsP - i * 0.10) / 0.4);
                  return (
                    <div className="cc-card" key={i} style={{ opacity: cp, transform: `translateY(${((1 - cp) * 26).toFixed(1)}px)` }}>
                      <canvas className="cc-chart" ref={(el) => { cardCanvasRefs.current[i] = el; }} aria-hidden="true" />
                      <span className="cc-n">{s.n}</span>
                      <h3 className="cc-k">{s.k}</h3>
                      <p className="cc-c">{s.c}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Closing */}
            <div className="tf-close" style={{ opacity: cvClose, pointerEvents: cvClose > 0.5 ? 'auto' : 'none' }}>
              <h2>Conviction Isn't a Feeling. It's Five Markets Agreeing Before You Click the Trigger.</h2>
            </div>
          </div>
        </section>

        {/* INDICATORS — premium pricing cards */}
        <section id="indicators" className="wrap" data-scene="5">
          <Reveal className="sec-head">
            <span className="kick">The Toolkit</span>
            <h2 className="h2">LMR Indicators for TradingView</h2>
            <p className="body">The same tools I trade with every session — built in-house on the LMR methodology, so the chart shows exactly what the journal tracks.</p>
          </Reveal>
          <div className="grid2">
            {INDICATORS.map((ind, i) => (
              <Reveal key={i} delay={i * 0.08} className="glass price-card tilt3d">
                <div className="pc-top">
                  <span className="pc-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  <span className="pc-badge">Pine Script v6 · TradingView</span>
                  <h3 className="pc-name">{ind.name}</h3>
                  <p className="pc-tag">{ind.tagline}</p>
                  <div className="pc-price"><span className="pc-amt">$40</span><span className="pc-per">/ month</span></div>
                </div>
                <canvas className="pc-chart" ref={(el) => { indCanvasRefs.current[i] = el; }} aria-hidden="true" />
                <p className="body sm pc-desc">{ind.desc}</p>
                <ul className="feat">{ind.features.map((f, j) => <li key={j}><Check /><span>{f}</span></li>)}</ul>
                <a className="btn btn-gold block" href={ind.mailto}>Get Access — $40/mo →</a>
                <p className="fine">Invite-only access granted to your TradingView username after payment.</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* TRACK RECORD — institutional trust tiles (type only) */}
        <section className="wrap" data-scene="5">
          <Reveal className="sec-head">
            <span className="kick">How We Operate</span>
            <h2 className="h2">Documented, Not Cherry-Picked</h2>
            <p className="body">Every result LMR Capitals shows is drawn from one transparent ledger — the same journal the methodology runs on, wins and losses alike.</p>
          </Reveal>
          <Reveal className="track-curve-wrap">
            <canvas ref={trackCurveRef} className="track-curve" aria-hidden="true" />
            <span className="track-curve-cap">One ledger · logged in real time · wins and losses</span>
          </Reveal>
          <div className="stat-row">
            {PROOF.map((s, i) => (
              <Reveal key={i} delay={i * 0.06} className="glass stat tilt3d">
                <span className="stat-n"><CountUp text={s.n} /></span>
                <span className="stat-k">{s.k}</span>
              </Reveal>
            ))}
          </div>
        </section>

        {/* CTA — gold band */}
        <section className="wrap" data-scene="5">
          <Reveal className="cta-band">
            <span className="cta-kick">Start Today</span>
            <h2>See the System in Action</h2>
            <p>Sign in to view the live journal, methodology breakdowns, and performance reports — or start your free trial to get access.</p>
            <button className="btn cta-btn" onClick={goApp}>Start Free Trial →</button>
            <span className="cta-fine">7-day free trial · then $25/mo or $270/yr · cancel anytime</span>
          </Reveal>
        </section>

        {/* CONTACT + FOOTER */}
        <section id="contact" className="wrap" data-scene="5" style={{ textAlign: 'center' }}>
          <Reveal className="sec-head">
            <span className="kick">Get In Touch</span><h2 className="h2">Connect With LMR Capitals</h2>
            <p className="body">Follow along, join the community, or reach out directly.</p>
            <div className="socials">
              {SOCIAL.map((s, i) => (
                <a key={i} href={s.href} aria-label={s.label} className="soc">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={s.fill ? 'currentColor' : 'none'} stroke={s.fill ? 'none' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {s.rect && <rect x="2" y="5" width="20" height="14" rx="4" fill="none" stroke="currentColor" />}
                    {s.rect2 && <rect x="3" y="3" width="18" height="18" rx="5" />}
                    {s.rect3 && <rect x="2.5" y="5" width="19" height="14" rx="3" />}
                    <path d={s.d} />
                  </svg>
                </a>
              ))}
            </div>
          </Reveal>
          <footer className="foot">
            <p>LMR Capitals © 2026 · Built on The Chain methodology</p>
            <p className="fine">Futures trading involves substantial risk of loss and is not suitable for all investors. Past performance is not indicative of future results. All content is general information only and does not constitute financial advice.</p>
          </footer>
        </section>
      </div>

      {card && (
        <div className="modal-bg" onClick={() => setCard(null)}>
          <div className="modal glass" onClick={(e) => e.stopPropagation()}>
            <span className="cnum">{card.num}</span>
            <h3 className="h3">{card.title}</h3>
            <p className="body">{card.copy}</p>
            <p className="body sm">{card.detail}</p>
            <button className="btn btn-ghost" onClick={() => setCard(null)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}

const CSS = `
:root{--bg:#05070d;--text:#EDF2FF;--text2:#aeb9cc;--text3:#7c8aa3;--gold:#F5A623;--gold2:#FFD166;--teal:#2dd4bf;--coral:#f0705a;--border:rgba(130,150,190,.16);--glass:rgba(14,20,34,.52)}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font-family:'Archivo',system-ui,sans-serif;overflow-x:hidden}
h1,h2,h3{font-family:'Archivo',system-ui,sans-serif;font-weight:800;margin:0;letter-spacing:-.02em;line-height:1.08}
a{color:var(--gold);text-decoration:none}
#bg3d{position:fixed;inset:0;width:100vw;height:100vh;z-index:0;display:block}
.veil{position:fixed;inset:0;z-index:1;pointer-events:none;background:radial-gradient(120% 90% at 50% 0%,transparent 40%,rgba(5,7,13,.65) 100%)}
.page{position:relative;z-index:2}
.wrap{max-width:1180px;margin:0 auto;padding:clamp(70px,11vh,150px) ${'clamp(20px,5vw,72px)'}}
.kick{display:block;font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:var(--gold2);font-weight:700;margin-bottom:14px}
.kick.sm{font-size:10px;margin:0}
.h1{font-size:clamp(38px,7vw,86px)}
.h2{font-size:clamp(26px,3.4vw,42px);margin-bottom:14px}
.h3{font-size:22px}.h3.sm{font-size:18px;margin-bottom:8px}
.gold{color:var(--gold)}
.body{font-size:clamp(14px,1.2vw,16.5px);line-height:1.7;color:var(--text2);margin:0}
.body.sm{font-size:14px;line-height:1.6}
.lead{font-size:clamp(15px,1.5vw,19px);line-height:1.7;color:var(--text2);max-width:56ch;margin:22px 0 0}
.row{display:flex;gap:16px;flex-wrap:wrap;margin-top:32px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;font-family:'Archivo';font-weight:800;font-size:15px;padding:13px 22px;border-radius:12px;border:1px solid transparent;transition:transform .1s,filter .15s,background .15s}
.btn:active{transform:translateY(1px)}
.btn-gold{background:linear-gradient(135deg,var(--gold2),var(--gold));color:#0a0b0f;box-shadow:0 12px 34px -12px rgba(245,166,35,.7)}
.btn-gold:hover{filter:brightness(1.07)}
.btn-gold.big{padding:16px 30px;font-size:16px}.btn-gold.block{width:100%;margin-top:auto}
.btn-ghost{background:rgba(255,255,255,.05);color:var(--text);border-color:var(--border)}
.btn-ghost:hover{background:rgba(255,255,255,.1)}
.glass{background:var(--glass);border:1px solid var(--border);border-radius:20px;backdrop-filter:blur(18px) saturate(140%);-webkit-backdrop-filter:blur(18px) saturate(140%);box-shadow:0 30px 80px -40px rgba(0,0,0,.8),inset 0 1px 0 rgba(255,255,255,.05)}
.pad{padding:clamp(26px,3.5vw,44px)}
/* nav */
.nav{position:fixed;top:0;left:0;right:0;z-index:50;display:flex;align-items:center;justify-content:space-between;gap:24px;padding:14px clamp(20px,5vw,72px);background:rgba(6,11,20,.55);backdrop-filter:blur(12px);border-bottom:1px solid var(--border)}
.brand{display:flex;align-items:center;gap:11px;font-weight:800;font-size:17px}
.brand .dot{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--gold2),var(--gold));color:#0a0b0f;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800}
.brand strong{color:var(--gold)}
.nav .links{display:flex;gap:26px}
.nav .links a{color:var(--text2);font-size:14px;font-weight:600}
.nav .links a:hover{color:var(--gold)}
.nav .links a{position:relative;transition:color .2s}
.nav .links a.on{color:var(--gold)}
.nav .links a.on:after{content:'';position:absolute;left:0;right:0;bottom:-6px;height:2px;border-radius:2px;background:linear-gradient(90deg,var(--gold2),var(--gold));box-shadow:0 0 10px rgba(245,166,35,.8)}
@media(max-width:780px){.nav .links{display:none}}
/* ── peripherals: progress rail, custom cursor, magnetic, intro ─────────────── */
.lmr-progress{position:fixed;top:0;left:0;height:3px;width:100%;transform:scaleX(0);transform-origin:0 50%;z-index:60;background:linear-gradient(90deg,var(--gold2),var(--gold));box-shadow:0 0 12px rgba(245,166,35,.7);pointer-events:none}
.lmr-cursor-on,.lmr-cursor-on a,.lmr-cursor-on button,.lmr-cursor-on .btn{cursor:none}
.lmr-cur-dot,.lmr-cur-ring{position:fixed;top:0;left:0;z-index:9998;pointer-events:none;border-radius:50%;mix-blend-mode:screen;will-change:transform}
.lmr-cur-dot{width:7px;height:7px;margin:-3.5px 0 0 -3.5px;background:var(--gold2);box-shadow:0 0 10px rgba(245,166,35,.9)}
.lmr-cur-ring{width:34px;height:34px;margin:-17px 0 0 -17px;border:1.5px solid rgba(245,166,35,.55);transition:width .18s ease,height .18s ease,margin .18s ease,border-color .18s ease,background .18s ease}
.lmr-cur-ring.hot{width:52px;height:52px;margin:-26px 0 0 -26px;border-color:rgba(255,209,122,.9);background:rgba(245,166,35,.08)}
.lmr-cur-ring.down{width:26px;height:26px;margin:-13px 0 0 -13px}
@media(pointer:coarse){.lmr-cur-dot,.lmr-cur-ring{display:none}}
.brand{transition:transform .18s cubic-bezier(.22,1,.36,1)}
.stat{transition:transform .22s cubic-bezier(.22,1,.36,1),border-color .22s,box-shadow .22s}
.stat:hover{transform:translateY(-6px);border-color:rgba(245,166,35,.4);box-shadow:0 30px 70px -40px rgba(245,166,35,.45)}
.lmr-intro{position:fixed;inset:0;z-index:9997;background:radial-gradient(120% 90% at 50% 30%,rgba(20,15,4,.55),#05070d 70%);pointer-events:none;animation:lmrIntro 1s ease .05s forwards}
@keyframes lmrIntro{0%{opacity:1}100%{opacity:0;visibility:hidden}}
@media(prefers-reduced-motion:reduce){.lmr-intro{display:none}}
/* 3D hero focal + live indicator chart previews */
.hero-focal{position:absolute;right:4vw;bottom:6vh;width:min(34vw,440px);height:min(46vh,420px);z-index:1;pointer-events:none}
.hero>div{position:relative;z-index:2}
@media(max-width:1024px){.hero-focal{opacity:.18;right:auto;left:50%;bottom:auto;top:50%;transform:translate(-50%,-50%);width:90vw;height:60vh}}
.pc-chart{width:100%;height:118px;display:block;margin:0;background:radial-gradient(120% 100% at 50% 0%,rgba(245,166,35,.06),transparent);border-bottom:1px solid var(--border)}
/* track record equity curve */
.track-curve-wrap{position:relative;max-width:900px;margin:30px auto 8px;border-radius:20px;overflow:hidden;background:var(--glass);border:1px solid var(--border)}
.track-curve{display:block;width:100%;height:min(260px,34vh)}
.track-curve-cap{position:absolute;left:20px;bottom:14px;font-size:12px;letter-spacing:.08em;font-weight:700;color:var(--text3)}
/* hero */
.hero{position:relative;min-height:100vh;display:flex;flex-direction:column;justify-content:center;max-width:1180px;margin:0 auto;padding:0 clamp(20px,5vw,72px)}
.scrollhint{position:absolute;bottom:34px;left:clamp(20px,5vw,72px);font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--text3)}
/* grids */
.grid3{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:22px;margin-top:34px}
.grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:22px;margin-top:34px}
.card{padding:30px 26px;text-align:left;color:inherit;cursor:pointer;display:flex;flex-direction:column;gap:10px;width:100%;font:inherit}
.card.tilt{transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease}
.card.tilt:hover{transform:translateY(-5px);border-color:rgba(245,166,35,.55);box-shadow:0 40px 90px -40px rgba(245,166,35,.4)}
.cnum{font-weight:800;color:var(--gold);font-size:15px}
.more{color:var(--gold2);font-size:13px;margin-top:6px}
/* method / chain — cinematic desk + monitor */
.method-sec{position:relative;height:840vh}
.method-sticky{position:sticky;top:0;height:100vh;width:100%;overflow:hidden}
.desk-canvas{position:absolute;inset:0;width:100%;height:100%;display:block;z-index:0}
.method-veil{position:absolute;inset:0;z-index:1;pointer-events:none;background:radial-gradient(120% 120% at 50% 45%,transparent 55%,rgba(4,6,12,.72) 100%)}
/* establishing caption sits low-left over the wide desk shot */
.method-intro{position:absolute;z-index:2;left:clamp(20px,6vw,90px);bottom:clamp(48px,10vh,120px);max-width:min(560px,80vw);transition:opacity .4s ease}
.method-intro .hint{margin-top:18px}
/* inside-the-screen content — a caption bar along the bottom so the chain (upper/centre) stays clear */
/* methodology copy — left-aligned, vertically centred inside the screen (per the design) */
.method-inside{position:absolute;z-index:2;top:50%;left:13%;transform:translateY(-50%);width:min(360px,32vw);text-align:left;transition:opacity .5s ease}
.method-inside .kick{margin-bottom:14px}
.method-inside .h2{font-size:clamp(22px,2.4vw,34px);line-height:1.15;margin-bottom:16px;color:var(--gold2);text-shadow:0 0 28px rgba(122,81,17,.65)}
.method-inside .body{margin:0;max-width:52ch;font-size:clamp(13px,1.05vw,15px);line-height:1.7}
/* dash-dots progress: active dot grows */
.chain-dots{display:flex;gap:10px;margin-top:28px}
.cdot{width:14px;height:6px;border-radius:3px;background:rgba(245,166,35,.30);transition:all .35s cubic-bezier(.22,1,.36,1)}
.cdot.on{width:28px;background:var(--gold);box-shadow:0 0 12px rgba(245,166,35,.7)}
/* connector callout line from copy toward the link */
.chain-connector{position:absolute;z-index:1;left:29%;top:34%;width:34%;height:22%;pointer-events:none;transition:opacity .5s ease}
/* per-stage crossfade */
.stagecard{animation:stageIn .55s cubic-bezier(.22,1,.36,1)}
@keyframes stageIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
/* finale line, centred near the top of the screen */
.chain-finale{position:absolute;z-index:2;top:12%;left:50%;transform:translateX(-50%);font-size:13px;letter-spacing:.1em;text-transform:uppercase;font-weight:800;color:var(--gold2);text-shadow:0 0 24px rgba(245,166,35,.6);transition:opacity .5s ease;white-space:nowrap}
@media(max-width:780px){.method-inside{left:8%;width:70vw}}
.method-inside .step{border:1px solid var(--border);border-radius:999px;padding:7px 14px;background:rgba(10,16,28,.5);backdrop-filter:blur(8px)}
.method-inside .step .stepk{font-size:12.5px}
.method-inside .h2{text-shadow:0 2px 30px rgba(245,166,35,.35)}
.steps{display:flex;gap:2px}
.step{display:flex;align-items:center;gap:10px;opacity:.4;transition:opacity .3s,transform .3s,border-color .3s}
.step.on{opacity:1;border-color:rgba(245,166,35,.5)}
.step.on .stepk{color:var(--gold2)}
.stepn{font-size:12px;font-weight:800;color:var(--gold)}
.stepk{font-size:14.5px;font-weight:600;color:var(--text2)}
.hint{font-size:12px;letter-spacing:.06em;color:var(--text3)}
@media(max-width:780px){.method-inside .step .stepn{display:none}.method-intro{bottom:40px}}
/* conviction */
.tag{display:inline-block;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:4px 12px;border-radius:999px;margin-bottom:16px}
.tag.coral{background:rgba(240,112,90,.14);color:var(--coral)}
.tag.teal{background:rgba(45,212,191,.14);color:var(--teal)}
.list{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:12px}
.list li{font-size:15px;color:var(--text2);padding-left:20px;position:relative}
.list li:before{content:'';position:absolute;left:0;top:9px;width:7px;height:7px;border-radius:50%;background:var(--coral)}
.gold-list li{color:var(--text)}
.gold-list li:before{background:var(--gold)}
.closing{margin-top:34px;border-radius:26px;padding:clamp(34px,5vw,64px);text-align:center;background:linear-gradient(120deg,#b5811f,#d9ac3a 45%,#eccf6f)}
.closing h2{color:#161208;font-size:clamp(24px,3.2vw,40px);margin-bottom:14px}
.closing p{color:#4a3a12;font-size:16px;margin:0}
/* conviction — new model: five markets align */
.conv-sec{position:relative;height:300vh}
.conv-sticky{position:sticky;top:0;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(24px,4vh,54px);max-width:1100px;margin:0 auto;padding:0 clamp(20px,5vw,72px);text-align:center}
.conv-head .kick{margin-bottom:12px}
.conv-head .h2{font-size:clamp(24px,3vw,42px)}
.fm{width:100%;max-width:760px;position:relative}
.fm-line{position:absolute;top:34px;left:8%;right:8%;height:2px;background:linear-gradient(90deg,transparent,var(--gold),transparent);transform-origin:center;box-shadow:0 0 16px rgba(245,166,35,.6);pointer-events:none}
.fm-row{display:flex;justify-content:space-between;align-items:flex-end;gap:clamp(8px,2vw,26px)}
.fm-mkt{flex:1;display:flex;flex-direction:column;align-items:center;gap:12px;color:#5b6b86;transition:color .4s ease}
.fm-mkt.on{color:var(--gold2)}
.fm-arrow{width:clamp(30px,5vw,46px);height:auto;transition:filter .4s ease;transform-origin:50% 78%}
.fm-mkt.on .fm-arrow{filter:drop-shadow(0 0 10px rgba(245,166,35,.75))}
.fm-k{font-size:13px;font-weight:800;letter-spacing:.08em}
.fm-dot{width:9px;height:9px;border-radius:50%;background:currentColor;opacity:.5;transition:opacity .4s,box-shadow .4s}
.fm-mkt.on .fm-dot{opacity:1;box-shadow:0 0 12px rgba(245,166,35,.9)}
.fm-readout{display:flex;align-items:baseline;justify-content:center;gap:12px;margin-top:30px}
.fm-count{font-size:clamp(26px,4vw,44px);font-weight:800;color:var(--gold);letter-spacing:.02em}
.fm-lbl{font-size:12px;letter-spacing:.18em;font-weight:800;color:var(--text3)}
.fm-meter{margin:16px auto 0;width:min(320px,60%);height:4px;border-radius:3px;background:rgba(130,150,190,.2);overflow:hidden}
.fm-meter span{display:block;height:100%;background:linear-gradient(90deg,var(--gold),var(--gold2));box-shadow:0 0 12px rgba(245,166,35,.7);border-radius:3px}
.conv-stamp{opacity:0;transform:scale(.9);transition:opacity .5s ease,transform .5s cubic-bezier(.22,1,.36,1)}
.conv-stamp.on{opacity:1;transform:scale(1)}
.conv-stamp span{display:inline-block;font-size:clamp(14px,1.6vw,20px);font-weight:800;letter-spacing:.22em;color:#0a0b0f;background:linear-gradient(120deg,var(--gold2),var(--gold));padding:12px 26px;border-radius:999px;box-shadow:0 14px 40px -12px rgba(245,166,35,.8)}
@media(max-width:640px){.fm-k{font-size:11px}.fm-lbl{display:none}}
/* ── CONVICTION — cinematic "Transformation" act ──────────────────────────── */
.tf-sec{position:relative;height:640vh}
/* rewiring — jigsaw puzzle */
.tf-puzzle{position:absolute;inset:0;z-index:3;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 clamp(20px,5vw,72px)}
.tf-puzzle-canvas{width:min(820px,90vw);height:min(440px,52vh);display:block}
.tf-puzzle-copy{text-align:center;margin-top:14px;max-width:52ch}
.tf-puzzle-copy .kick{margin-bottom:8px}
/* four concept cards */
.tf-cards{position:absolute;inset:0;z-index:3;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 clamp(20px,5vw,72px);background:radial-gradient(70% 60% at 50% 50%,rgba(5,7,13,.82),rgba(5,7,13,0) 82%)}
.cc-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:clamp(12px,1.6vw,20px);width:100%;max-width:1120px;margin-top:26px}
.cc-card{position:relative;background:var(--glass);border:1px solid var(--border);border-radius:18px;padding:16px 16px 20px;text-align:left;backdrop-filter:blur(14px);box-shadow:0 30px 70px -50px rgba(0,0,0,.8)}
.cc-chart{width:100%;height:92px;display:block;margin-bottom:10px}
.cc-n{font-size:12px;font-weight:800;letter-spacing:.12em;color:var(--gold)}
.cc-k{font-size:clamp(17px,1.5vw,21px);font-weight:800;margin:4px 0 8px;background:linear-gradient(120deg,var(--gold2),var(--gold));-webkit-background-clip:text;background-clip:text;color:transparent}
.cc-c{font-size:13px;line-height:1.55;color:var(--text2);margin:0}
@media(max-width:860px){.cc-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:480px){.cc-grid{grid-template-columns:1fr}}
.tf-sticky{position:sticky;top:0;height:100vh;overflow:hidden;display:flex;align-items:center;justify-content:center}
.tf-canvas{position:absolute;inset:0;width:100%;height:100%;z-index:1;display:block}
/* trades journal: messy → organised */
.tf-trades{position:absolute;inset:0;z-index:3;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 clamp(20px,5vw,72px);background:radial-gradient(62% 60% at 50% 50%,rgba(5,7,13,.9),rgba(5,7,13,0) 80%)}
.tt-wrap{width:100%;max-width:940px;margin-top:24px;transform:perspective(1500px) rotateX(9deg);transform-style:preserve-3d}
.tt-head-row,.tt-row{display:grid;grid-template-columns:.75fr .6fr .9fr .7fr 1fr 1.5fr;gap:10px;align-items:center;padding:12px 20px;text-align:left}
.tt-head-row{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--text3);font-weight:800;border-bottom:1px solid var(--border);margin-bottom:6px}
.tt-row{margin-top:9px;border-radius:12px;background:var(--glass);border:1px solid var(--border);font-size:14.5px;font-weight:600;backdrop-filter:blur(10px);will-change:transform;transition:background .3s,color .3s}
.tt-date{color:var(--text3)}
.tt-sym{color:var(--text);font-weight:800}
.tt-side{color:var(--text2);font-weight:700}
.tt-rr{color:var(--gold2);font-weight:800}
.tt-pnl{font-weight:800}
.tt-tag{justify-self:start;font-size:12px;font-weight:700;padding:4px 11px;border-radius:999px;background:rgba(240,112,90,.14);color:var(--coral)}
.tt-tag.on{background:rgba(245,166,35,.15);color:var(--gold2)}
@media(max-width:720px){.tt-head-row,.tt-row{grid-template-columns:.7fr .6fr .8fr 1fr;font-size:12px;padding:9px 12px}.tt-side,.tt-head-row span:nth-child(3){display:none}.tt-tag{grid-column:span 1}}
/* concept charts (rewiring backdrop + four-shift panels) */
.tf-rewire-canvas{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(780px,84%);height:min(330px,44vh);z-index:0;opacity:.62;pointer-events:none}
.tf-split .kick,.tf-split .tf-rows{position:relative;z-index:1}
.tf-shift-canvas{width:min(500px,84vw);height:172px;display:block;margin:0 auto 10px}
/* phase A — intro copy over the canvas */
.tf-head{position:absolute;left:0;right:0;top:13vh;z-index:3;text-align:center;padding:0 clamp(20px,5vw,72px)}
.tf-head .h2{font-size:clamp(26px,3.8vw,52px);max-width:22ch;margin:0 auto}
/* phase B — before → after rewiring */
.tf-split{position:absolute;inset:0;z-index:3;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 clamp(20px,5vw,72px);background:radial-gradient(58% 52% at 50% 50%,rgba(5,7,13,.85),rgba(5,7,13,0) 76%)}
.tf-rows{display:flex;flex-direction:column;gap:clamp(10px,1.6vh,18px);margin-top:30px;width:100%;max-width:860px}
.tf-row{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:clamp(12px,3vw,40px)}
.tf-before{text-align:right;font-size:clamp(13px,1.5vw,18px);font-weight:600;color:var(--coral)}
.tf-arrow{font-size:clamp(16px,2vw,22px);font-weight:800;color:var(--gold);text-shadow:0 0 14px rgba(245,166,35,.6)}
.tf-after{text-align:left;font-size:clamp(13px,1.5vw,18px);font-weight:700;color:var(--gold2)}
/* phase C — the four shifts */
.tf-shift{position:absolute;inset:0;z-index:3;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 clamp(20px,5vw,72px);background:radial-gradient(56% 50% at 50% 50%,rgba(5,7,13,.86),rgba(5,7,13,0) 74%)}
.tf-shift-card{position:relative;max-width:680px;animation:tfIn .6s cubic-bezier(.22,1,.36,1) both}
.tf-n{position:absolute;top:50%;left:50%;transform:translate(-50%,-56%);font-size:clamp(150px,28vw,340px);font-weight:800;line-height:.8;letter-spacing:-.05em;color:rgba(245,166,35,.07);z-index:-1;pointer-events:none}
.tf-k{font-size:clamp(42px,7.5vw,96px);font-weight:800;line-height:1;margin-bottom:18px;letter-spacing:-.02em;background:linear-gradient(120deg,var(--gold2),var(--gold));-webkit-background-clip:text;background-clip:text;color:transparent}
.tf-shift-card .body{max-width:50ch;margin:0 auto;font-size:clamp(15px,1.5vw,19px);color:var(--text2)}
.tf-dots{display:flex;gap:12px;justify-content:center;margin-top:clamp(28px,5vh,52px)}
.tf-dot{width:36px;height:4px;border-radius:3px;background:rgba(130,150,190,.24);transition:background .45s ease,box-shadow .45s ease}
.tf-dot.on{background:linear-gradient(90deg,var(--gold2),var(--gold));box-shadow:0 0 14px rgba(245,166,35,.85)}
/* closing */
.tf-close{position:absolute;inset:0;z-index:4;display:flex;align-items:center;justify-content:center;padding:0 clamp(20px,5vw,72px);background:radial-gradient(60% 55% at 50% 50%,rgba(5,7,13,.88),rgba(5,7,13,0) 78%)}
.tf-close h2{max-width:17ch;text-align:center;font-size:clamp(28px,4.6vw,62px);line-height:1.12;background:linear-gradient(120deg,var(--gold2),var(--gold) 55%,#eccf6f);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 42px rgba(245,166,35,.28))}
@keyframes tfIn{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:translateY(0)}}
@media(max-width:640px){.tf-head .h2{font-size:26px}.tf-before,.tf-after{font-size:12.5px}.tf-row{gap:12px}}
/* ── cohesive lower-half redesign ─────────────────────────────────────────── */
.sec-head{max-width:720px;margin:0 auto;text-align:center}
.sec-head .kick{display:inline-block}
.sec-head .body{margin:14px auto 0;max-width:58ch}
/* before → after transformation */
.ba{display:grid;grid-template-columns:1fr auto 1fr;gap:clamp(14px,2.4vw,30px);align-items:stretch;margin-top:36px}
.ba-col{padding:clamp(24px,3vw,36px);border-radius:20px;background:var(--glass);border:1px solid var(--border);backdrop-filter:blur(18px)}
.ba-col.before{border-color:rgba(240,112,90,.28)}
.ba-col.after{border-color:rgba(245,166,35,.4);box-shadow:0 30px 80px -50px rgba(245,166,35,.5)}
.ba-arrow{display:flex;align-items:center;justify-content:center;color:var(--gold);align-self:center}
@media(max-width:760px){.ba{grid-template-columns:1fr}.ba-arrow{transform:rotate(90deg);padding:4px 0}}
/* edges with check icon */
.card.edge{gap:8px}
.edge-ic{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:10px;background:rgba(245,166,35,.14);color:var(--gold);margin-bottom:4px}
/* feature lists with checks */
.feat{list-style:none;padding:0}
.feat li{display:flex;gap:10px;align-items:flex-start}
.feat li .ck{color:var(--gold);flex:none;margin-top:3px}
/* premium pricing cards */
.price-card{padding:0;overflow:hidden;gap:0;display:flex;flex-direction:column;transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease}
.price-card{transform-style:preserve-3d;will-change:transform;transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease}
.price-card:hover{border-color:rgba(245,166,35,.5);box-shadow:0 44px 100px -50px rgba(245,166,35,.45)}
.mchart{width:100%;height:100%;display:block;background:radial-gradient(120% 90% at 50% 0%,#0a1120,#03060c)}
.shot.live{position:relative}
.live-dot{position:absolute;top:9px;left:10px;font-size:9px;font-weight:800;letter-spacing:.14em;color:#25c9a8;display:flex;align-items:center;gap:5px}
.live-dot:before{content:'';width:6px;height:6px;border-radius:50%;background:#25c9a8;box-shadow:0 0 8px #25c9a8;animation:pulse 1.4s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
.pc-top{position:relative;overflow:hidden;padding:30px 28px 24px;background:linear-gradient(160deg,rgba(245,166,35,.12),rgba(20,30,50,.2));border-bottom:1px solid var(--border)}
.pc-num{position:absolute;top:10px;right:22px;font-size:96px;font-weight:800;line-height:1;color:rgba(245,166,35,.09);letter-spacing:-.04em;pointer-events:none}
.pc-name{font-size:clamp(24px,2.7vw,34px);font-weight:800;margin:0;letter-spacing:-.02em;line-height:1.05}
.pc-badge{display:inline-block;font-size:11px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;color:var(--gold2);background:rgba(245,166,35,.12);padding:5px 11px;border-radius:999px;margin-bottom:14px}
.pc-tag{margin:6px 0 0;color:var(--text3);font-size:14px}
.pc-price{display:flex;align-items:baseline;gap:8px;margin-top:16px}
.pc-amt{font-size:38px;font-weight:800;color:var(--gold2);line-height:1}
.pc-per{font-size:14px;color:var(--text3);font-weight:700}
.price-card .shot{margin:22px 26px 0}
.pc-desc{margin:18px 26px 0}
.price-card .feat{margin:16px 26px 0;gap:9px;display:flex;flex-direction:column}
.price-card .btn{margin:22px 26px 0}
.price-card .fine{margin:12px 26px 26px}
/* stat tiles */
.stat-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-top:34px}
.stat{padding:26px 22px;text-align:center;display:flex;flex-direction:column;gap:8px}
.stat-n{font-size:clamp(22px,2.6vw,30px);font-weight:800;color:var(--gold2)}
.stat-k{font-size:13.5px;color:var(--text2);line-height:1.5}
/* CTA band */
.cta-band{margin-top:10px;border-radius:28px;padding:clamp(40px,6vw,72px) clamp(24px,5vw,64px);text-align:center;background:linear-gradient(125deg,#b5811f,#d9ac3a 45%,#eccf6f);box-shadow:0 40px 110px -50px rgba(245,166,35,.7)}
.cta-kick{display:inline-block;font-size:12px;letter-spacing:.18em;text-transform:uppercase;font-weight:800;color:#5a4410;margin-bottom:14px}
.cta-band h2{color:#161208;font-size:clamp(26px,3.6vw,44px);margin:0 0 14px;font-weight:800}
.cta-band p{color:#4a3a12;font-size:clamp(14px,1.3vw,17px);line-height:1.6;max-width:56ch;margin:0 auto 28px}
.cta-btn{background:#151006;color:var(--gold2);padding:16px 32px;font-size:16px}
.cta-btn:hover{background:#0a0b0f}
.cta-fine{display:block;margin-top:18px;font-size:13px;color:#5a4410;font-weight:600}
/* indicators */
.ind{gap:14px}
.shot{aspect-ratio:16/10;border-radius:12px;overflow:hidden;border:1px solid var(--border)}
.price{font-weight:800;font-size:26px;color:var(--gold2);margin:0}
.feat{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px;font-size:13.5px;line-height:1.5;color:var(--text2)}
.fine{font-size:12px;color:var(--text3);margin:0}
/* marquee */
.marquee{margin-top:34px;overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)}
.track{display:flex;gap:18px;width:max-content;animation:lmr-scroll 40s linear infinite}
.cert{margin:0;flex:none;width:200px;aspect-ratio:1;border-radius:12px;overflow:hidden}
.grayscale{filter:grayscale(1) contrast(1.05)}
@keyframes lmr-scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
/* cta */
.cta{text-align:center;padding:clamp(40px,6vw,80px) clamp(24px,5vw,72px);border-radius:26px}
/* contact */
.socials{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-top:26px}
.soc{width:54px;height:54px;display:flex;align-items:center;justify-content:center;border-radius:14px;background:var(--glass);border:1px solid var(--border);color:var(--gold);transition:transform .15s,border-color .15s}
.soc:hover{transform:translateY(-3px);border-color:rgba(245,166,35,.6)}
.foot{margin-top:60px;border-top:1px solid var(--border);padding-top:26px;display:flex;flex-direction:column;gap:10px;color:var(--text3);font-size:13px;text-align:center}
/* modal */
.modal-bg{position:fixed;inset:0;z-index:200;background:rgba(3,6,12,.72);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px}
.modal{max-width:560px;width:100%;padding:36px;display:flex;flex-direction:column;gap:14px}
`;

const styleEl = document.createElement('style'); styleEl.textContent = CSS; document.head.appendChild(styleEl);
const boot = document.getElementById('boot'); if (boot) boot.remove();
createRoot(document.getElementById('root')).render(<App />);
