// LMR Capitals — small 2D "concept charts" for the Conviction back half.
// Each chart animates from chaos (grey, noisy) → order (gold, structured) on a
// single 0..1 progress, with gentle idle motion. Used behind the Rewiring rows
// and inside each of the Four Shifts.
// API: createChart(canvas, { kind }) -> { setProgress(p), setKind(k), resize(), dispose() }

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (e0, e1, x) => { const t = clamp01((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
const GREY = [120, 138, 168], GOLD = [245, 166, 35], GOLD2 = [255, 209, 122], TEAL = [53, 208, 160], CORAL = [240, 112, 90];
const rgba = (c, a) => `rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

export function createChart(canvas, opts = {}) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { setProgress() {}, setKind() {}, resize() {}, dispose() {} };
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const state = { p: 0, kind: opts.kind || 'uptrend' };
  let raf = 0, disposed = false, inView = true;
  const clock = { t0: performance.now() };

  // deterministic noise per index
  let seed = 4242;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const NOISE = Array.from({ length: 64 }, () => rnd() - 0.5);

  function resize() {
    const w = canvas.clientWidth || 600, h = canvas.clientHeight || 320;
    canvas.width = w * DPR; canvas.height = h * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  function draw() {
    raf = 0;
    if (disposed || !inView || document.hidden) return;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const t = (performance.now() - clock.t0) / 1000;
    const p = state.p;
    ctx.clearRect(0, 0, w, h);
    const pad = Math.min(w, h) * 0.12;
    const x0 = pad, x1 = w - pad, y0 = h - pad, y1 = pad; // chart box (y0 bottom)
    // faint baseline grid, warms to gold
    const gc = mix(GREY, GOLD, p);
    ctx.strokeStyle = rgba(gc, 0.12); ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) { const y = lerp(y0, y1, i / 4); ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); }

    const k = state.kind;
    if (k === 'scatter-grid') drawScatterGrid(w, h, x0, x1, y0, y1, p, t);
    else if (k === 'equity') drawLine(x0, x1, y0, y1, p, t, 'equity');
    else if (k === 'candles') drawCandles(x0, x1, y0, y1, p, t);
    else if (k === 'structure') drawLine(x0, x1, y0, y1, p, t, 'structure');
    else drawLine(x0, x1, y0, y1, p, t, 'uptrend');

    raf = requestAnimationFrame(draw);
  }

  // a noisy line that resolves into a clean rising shape (uptrend/equity/structure)
  function drawLine(x0, x1, y0, y1, p, t, mode) {
    const N = 46;
    const col = mix(GREY, GOLD, smooth(0.1, 0.8, p));
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const f = i / N;
      const x = lerp(x0, x1, f);
      let base;                                  // ordered target 0..1 (0 bottom)
      if (mode === 'equity') base = Math.pow(f, 0.85);
      else if (mode === 'structure') base = 0.15 + 0.7 * f + Math.sin(f * 6.28 * 1.5) * 0.06; // gentle higher-highs
      else base = f;                              // uptrend
      const chaos = 0.5 + NOISE[i % NOISE.length] * 0.9 + Math.sin(t * 1.3 + i) * 0.06 * (1 - p);
      const v = lerp(clamp01(chaos), clamp01(base), smooth(0.05, 0.9, p));
      const jitter = (1 - p) * (NOISE[(i * 7) % NOISE.length]) * 18 * (1 - smooth(0, 0.6, p));
      pts.push([x, lerp(y0, y1, v) + jitter]);
    }
    // glow under the line grows with p
    ctx.save();
    const grad = ctx.createLinearGradient(0, y1, 0, y0);
    grad.addColorStop(0, rgba(col, 0.22 * p)); grad.addColorStop(1, rgba(col, 0));
    ctx.beginPath(); ctx.moveTo(pts[0][0], y0);
    pts.forEach(([x, y]) => ctx.lineTo(x, y)); ctx.lineTo(pts[pts.length - 1][0], y0); ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();
    ctx.restore();
    // the line
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.strokeStyle = rgba(col, 0.55 + 0.4 * p); ctx.lineWidth = 2.4 + p * 1.2; ctx.lineJoin = 'round';
    if (p > 0.55) { ctx.shadowColor = rgba(GOLD, (p - 0.55) * 1.6); ctx.shadowBlur = 16; }
    ctx.stroke(); ctx.shadowBlur = 0;
    // leading dot
    const last = pts[pts.length - 1];
    ctx.fillStyle = rgba(mix(col, GOLD2, p), 0.9); ctx.beginPath(); ctx.arc(last[0], last[1], 3 + p * 2, 0, 6.28); ctx.fill();
  }

  // scattered dots that snap onto a neat grid
  function drawScatterGrid(w, h, x0, x1, y0, y1, p, t) {
    const cols = 6, rows = 4, e = smooth(0.05, 0.9, p);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const gx = lerp(x0, x1, cols === 1 ? 0.5 : c / (cols - 1));
      const gy = lerp(y1, y0, rows === 1 ? 0.5 : r / (rows - 1));
      const cx = lerp(x0, x1, (NOISE[i % NOISE.length] + 0.5));
      const cy = lerp(y1, y0, (NOISE[(i * 3) % NOISE.length] + 0.5));
      const x = lerp(cx, gx, e) + Math.sin(t + i) * (1 - e) * 6;
      const y = lerp(cy, gy, e) + Math.cos(t * 0.9 + i) * (1 - e) * 6;
      const col = mix(GREY, GOLD, e);
      if (e > 0.6) { ctx.shadowColor = rgba(GOLD, (e - 0.6) * 1.4); ctx.shadowBlur = 12; }
      ctx.fillStyle = rgba(col, 0.5 + 0.5 * e); ctx.beginPath(); ctx.arc(x, y, 4 + e * 2, 0, 6.28); ctx.fill(); ctx.shadowBlur = 0;
    }
  }

  // random candles resolve into one deliberate clean uptrend
  function drawCandles(x0, x1, y0, y1, p, t) {
    const N = 12, e = smooth(0.05, 0.9, p), cw = (x1 - x0) / N * 0.5;
    let prev = 0.2;
    for (let i = 0; i < N; i++) {
      const x = lerp(x0, x1, (i + 0.5) / N);
      const trend = 0.15 + 0.62 * (i / (N - 1));
      const chaosO = clamp01(0.5 + NOISE[i % NOISE.length]);
      const chaosC = clamp01(0.5 + NOISE[(i * 5) % NOISE.length]);
      const o = lerp(chaosO, clamp01(prev), e);
      const cl = lerp(chaosC, clamp01(trend + 0.04), e);
      prev = trend + 0.04;
      const up = cl >= o;
      const col = e > 0.5 ? (up ? mix(GREY, TEAL, e) : mix(GREY, CORAL, e)) : GREY;
      const yo = lerp(y0, y1, o), yc = lerp(y0, y1, cl);
      const wickH = (1 - e) * 10 + 6;
      ctx.strokeStyle = rgba(col, 0.6 + 0.3 * e); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x, Math.min(yo, yc) - wickH); ctx.lineTo(x, Math.max(yo, yc) + wickH); ctx.stroke();
      ctx.fillStyle = rgba(col, 0.45 + 0.5 * e);
      ctx.fillRect(x - cw / 2, Math.min(yo, yc), cw, Math.max(2, Math.abs(yc - yo)));
    }
  }

  function kick() { if (!raf && !disposed && inView && !document.hidden) raf = requestAnimationFrame(draw); }
  kick();
  let io = null;
  try { io = new IntersectionObserver((es) => { inView = es[0].isIntersecting; if (inView) kick(); }, { threshold: 0 }); io.observe(canvas); } catch (e) { inView = true; }
  function onVis() { if (!document.hidden) kick(); }
  document.addEventListener('visibilitychange', onVis);

  return {
    setProgress(p) { state.p = clamp01(p); kick(); },
    setKind(k) { if (k && k !== state.kind) { state.kind = k; kick(); } },
    resize,
    dispose() { disposed = true; if (raf) cancelAnimationFrame(raf); window.removeEventListener('resize', resize); document.removeEventListener('visibilitychange', onVis); if (io) io.disconnect(); },
  };
}
