// LMR Capitals — "The Rewiring": the trader finally aligns the puzzle.
// Scattered, tumbling pieces of one picture drift in and lock into a clean grid
// as you scroll — the picture (a gold rising structure) only resolves once every
// piece is in place. Driven by a single 0..1 progress. 2D canvas (verifiable).
// API: createPuzzle(canvas) -> { setProgress(p), resize(), dispose() }

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (e0, e1, x) => { const t = clamp01((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };

export function createPuzzle(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { setProgress() {}, resize() {}, dispose() {} };
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const COLS = 5, ROWS = 3, N = COLS * ROWS;
  let seed = 20240517;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  // per-piece scatter + a shuffled lock order so it assembles organically
  const pieces = [];
  const order = [];
  for (let i = 0; i < N; i++) { order.push(i); pieces.push({ dx: (rnd() - 0.5), dy: (rnd() - 0.5), rot: (rnd() - 0.5) * 1.6, ph: rnd() * 6.28 }); }
  for (let i = order.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; const t = order[i]; order[i] = order[j]; order[j] = t; }
  const rank = new Array(N); order.forEach((pieceIdx, r) => { rank[pieceIdx] = r / (N - 1); });

  // offscreen target picture: dark panel + gold rising structure + faint grid
  const pic = document.createElement('canvas');
  function paintPic(w, h) {
    pic.width = w; pic.height = h; const g = pic.getContext('2d');
    g.clearRect(0, 0, w, h);
    const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#0c1120'); bg.addColorStop(1, '#060a12');
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(120,140,180,0.10)'; g.lineWidth = 1;
    for (let x = 0; x <= w; x += w / 10) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 0; y <= h; y += h / 6) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    // gold rising structure (higher highs / higher lows)
    const pad = w * 0.06; const pts = [];
    const NP = 42;
    for (let i = 0; i <= NP; i++) { const f = i / NP; const x = lerp(pad, w - pad, f); const base = 0.16 + 0.66 * f + Math.sin(f * 6.28 * 1.4) * 0.06; pts.push([x, lerp(h - pad, pad, base)]); }
    const grad = g.createLinearGradient(0, pad, 0, h - pad); grad.addColorStop(0, 'rgba(245,166,35,0.22)'); grad.addColorStop(1, 'rgba(245,166,35,0)');
    g.beginPath(); g.moveTo(pts[0][0], h - pad); pts.forEach(([x, y]) => g.lineTo(x, y)); g.lineTo(pts[pts.length - 1][0], h - pad); g.closePath(); g.fillStyle = grad; g.fill();
    g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.strokeStyle = '#F5A623'; g.lineWidth = 3.2; g.lineJoin = 'round'; g.shadowColor = 'rgba(245,166,35,0.7)'; g.shadowBlur = 14; g.stroke(); g.shadowBlur = 0;
    g.fillStyle = 'rgba(255,209,122,0.9)'; g.beginPath(); g.arc(pts[pts.length - 1][0], pts[pts.length - 1][1], 5, 0, 6.28); g.fill();
  }

  const state = { p: 0 };
  let raf = 0, disposed = false, inView = true;
  const clock = { t0: performance.now() };

  function boardRect(w, h) { const bw = Math.min(w * 0.7, 760), bh = Math.min(h * 0.62, 430); return { x: (w - bw) / 2, y: (h - bh) / 2, w: bw, h: bh }; }
  function resize() {
    const w = canvas.clientWidth || 900, h = canvas.clientHeight || 500;
    canvas.width = w * DPR; canvas.height = h * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const b = boardRect(w, h); paintPic(Math.max(2, Math.round(b.w)), Math.max(2, Math.round(b.h)));
  }
  resize(); window.addEventListener('resize', resize);

  function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  function draw() {
    raf = 0; if (disposed || !inView || document.hidden) return;
    const w = canvas.clientWidth, h = canvas.clientHeight, t = (performance.now() - clock.t0) / 1000, p = state.p;
    ctx.clearRect(0, 0, w, h);
    const b = boardRect(w, h);
    const cw = b.w / COLS, ch = b.h / ROWS, gap = 3;
    for (let i = 0; i < N; i++) {
      const col = i % COLS, row = (i / COLS) | 0;
      const pc = pieces[i];
      const conv = clamp01((p * 1.35 - rank[i] * 0.55) / 0.45);
      const e = conv * conv * (3 - 2 * conv);
      const tx = b.x + col * cw + cw / 2, ty = b.y + row * ch + ch / 2;               // locked centre
      const sx = tx + pc.dx * w * 0.7, sy = ty + pc.dy * h * 0.7;                      // scattered origin
      const jit = (1 - e) * 6;
      const x = lerp(sx, tx, e) + Math.sin(t * 0.9 + pc.ph) * jit;
      const y = lerp(sy, ty, e) + Math.cos(t * 0.8 + pc.ph) * jit;
      const rot = lerp(pc.rot, 0, e);
      ctx.save();
      ctx.globalAlpha = 0.28 + 0.72 * e;
      ctx.translate(x, y); ctx.rotate(rot);
      roundRect(-cw / 2 + gap / 2, -ch / 2 + gap / 2, cw - gap, ch - gap, 7); ctx.save(); ctx.clip();
      // draw this piece's slice of the target picture, aligned to where it will lock
      ctx.drawImage(pic, col * cw, row * ch, cw, ch, -cw / 2 + gap / 2, -ch / 2 + gap / 2, cw - gap, ch - gap);
      // cold tint while unaligned
      if (e < 0.98) { ctx.fillStyle = `rgba(10,14,22,${(1 - e) * 0.55})`; ctx.fillRect(-cw / 2, -ch / 2, cw, ch); }
      ctx.restore();
      // edge: grey while loose → gold when locked
      const gr = Math.round(lerp(90, 245, e)), gg = Math.round(lerp(105, 166, e)), gb = Math.round(lerp(135, 35, e));
      ctx.strokeStyle = `rgba(${gr},${gg},${gb},${0.4 + 0.5 * e})`; ctx.lineWidth = 1.2;
      if (e > 0.7) { ctx.shadowColor = 'rgba(245,166,35,' + (e - 0.7) * 1.2 + ')'; ctx.shadowBlur = 10; }
      roundRect(-cw / 2 + gap / 2, -ch / 2 + gap / 2, cw - gap, ch - gap, 7); ctx.stroke(); ctx.shadowBlur = 0;
      ctx.restore();
    }
    raf = requestAnimationFrame(draw);
  }
  function kick() { if (!raf && !disposed && inView && !document.hidden) raf = requestAnimationFrame(draw); }
  kick();
  let io = null;
  try { io = new IntersectionObserver((es) => { inView = es[0].isIntersecting; if (inView) kick(); }, { threshold: 0 }); io.observe(canvas); } catch (e) { inView = true; }
  function onVis() { if (!document.hidden) kick(); }
  document.addEventListener('visibilitychange', onVis);

  return {
    setProgress(p) { state.p = clamp01(p); kick(); },
    resize,
    dispose() { disposed = true; if (raf) cancelAnimationFrame(raf); window.removeEventListener('resize', resize); document.removeEventListener('visibilitychange', onVis); if (io) io.disconnect(); },
  };
}
