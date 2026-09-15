// LMR Capitals — "Transformation" Phase A: chaos → order metamorphosis.
// A 2D-canvas field of word-shards (the trader's "before" state) that start
// scattered, cold and jittering, and — as a gold "confirm" sweep crosses —
// snap into calm, aligned, gold-lit columns. Driven by a single 0..1 progress.
// API: createTransformScene(canvas, { words }) -> { setProgress(p), resize(), dispose() }

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (e0, e1, x) => { const t = clamp01((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };

export function createTransformScene(canvas, opts = {}) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { setProgress() {}, resize() {}, dispose() {} };
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const words = opts.words && opts.words.length ? opts.words : ['Hesitation', 'Self-doubt', 'Forced discipline', 'Reacting to noise', 'Doubt', 'Fear', 'FOMO', 'Revenge'];

  // deterministic RNG so the layout is intentional, not random each load
  let seed = 7723137;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

  // build shards: a grid of ordered slots, each with a scattered chaos origin
  const COLS = 4, ROWS = 4, N = COLS * ROWS;
  const shards = [];
  for (let i = 0; i < N; i++) {
    shards.push({
      word: words[i % words.length],
      col: i % COLS, row: (i / COLS) | 0,
      cx: rnd(), cy: rnd(),                 // chaos position (0..1 of field)
      crot: (rnd() - 0.5) * 0.9,            // chaos rotation (rad)
      ph: rnd() * Math.PI * 2,              // jitter phase
      spd: 0.6 + rnd() * 0.8,
    });
  }

  const state = { p: 0 };
  let raf = 0, disposed = false;
  const clock = { t0: performance.now() };

  function resize() {
    const w = canvas.clientWidth || 1000, h = canvas.clientHeight || 600;
    canvas.width = w * DPR; canvas.height = h * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  function draw() {
    if (disposed) return;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const t = (performance.now() - clock.t0) / 1000;
    ctx.clearRect(0, 0, w, h);
    const p = state.p;

    // ordered grid geometry (centred block)
    const gw = Math.min(w * 0.86, 900), gh = Math.min(h * 0.62, 460);
    const ox = (w - gw) / 2, oy = (h - gh) / 2 + h * 0.06; // biased down, clear of the headline
    const cellW = gw / COLS, cellH = gh / ROWS;

    // the gold "confirm" sweep travels left→right across the field
    const sweep = smooth(0.12, 0.72, p);
    const sweepX = lerp(-0.15, 1.15, sweep) * w;

    for (let i = 0; i < shards.length; i++) {
      const s = shards[i];
      const orderX = ox + s.col * cellW + cellW / 2;
      const orderY = oy + s.row * cellH + cellH / 2;
      const chaosX = 0.06 * w + s.cx * 0.88 * w;
      const chaosY = 0.08 * h + s.cy * 0.84 * h;
      // a shard converts once the sweep passes its ordered x (staggered, organic)
      const conv = clamp01((sweepX - orderX) / (cellW * 1.4) + 0.5) * smooth(0.05, 0.95, p);
      const e = easeInOut(conv);
      const jitter = (1 - e) * 7;
      const x = lerp(chaosX, orderX, e) + Math.sin(t * s.spd + s.ph) * jitter;
      const y = lerp(chaosY, orderY, e) + Math.cos(t * s.spd * 0.9 + s.ph) * jitter;
      const rot = lerp(s.crot, 0, e);

      const cw = Math.min(cellW * 0.86, 176), ch = 34;
      ctx.save();
      ctx.translate(x, y); ctx.rotate(rot);
      // chip
      const bg = e < 0.5 ? 'rgba(18,24,36,' + (0.5 + e * 0.4) + ')' : 'rgba(26,20,8,' + (0.55 + e * 0.35) + ')';
      ctx.fillStyle = bg; roundRect(-cw / 2, -ch / 2, cw, ch, 8); ctx.fill();
      // border + glow grey → gold
      const gr = Math.round(lerp(96, 245, e)), gg = Math.round(lerp(112, 166, e)), gb = Math.round(lerp(140, 35, e));
      ctx.strokeStyle = `rgba(${gr},${gg},${gb},${0.35 + e * 0.5})`; ctx.lineWidth = 1;
      if (e > 0.6) { ctx.shadowColor = 'rgba(245,166,35,' + ((e - 0.6) * 1.4) + ')'; ctx.shadowBlur = 14; }
      roundRect(-cw / 2, -ch / 2, cw, ch, 8); ctx.stroke();
      ctx.shadowBlur = 0;
      // label
      ctx.fillStyle = e < 0.5 ? `rgba(150,165,190,${0.6 + e * 0.3})` : `rgba(255,214,140,${0.7 + e * 0.3})`;
      ctx.font = '700 13px Archivo, system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(s.word, 0, 1);
      ctx.restore();
    }

    // the sweep line itself (visible while it travels)
    const sweepVis = smooth(0.1, 0.22, p) * (1 - smooth(0.68, 0.82, p));
    if (sweepVis > 0.01) {
      const g = ctx.createLinearGradient(sweepX - 40, 0, sweepX + 40, 0);
      g.addColorStop(0, 'rgba(245,166,35,0)'); g.addColorStop(0.5, `rgba(245,166,35,${0.5 * sweepVis})`); g.addColorStop(1, 'rgba(245,166,35,0)');
      ctx.fillStyle = g; ctx.fillRect(sweepX - 40, 0, 80, h);
      ctx.strokeStyle = `rgba(255,214,140,${0.7 * sweepVis})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sweepX, 0); ctx.lineTo(sweepX, h); ctx.stroke();
    }
    raf = requestAnimationFrame(draw);
  }
  raf = requestAnimationFrame(draw);
  function onVis() { if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = 0; } else if (!raf && !disposed) { raf = requestAnimationFrame(draw); } }
  document.addEventListener('visibilitychange', onVis);

  return {
    setProgress(p) { state.p = clamp01(p); },
    resize,
    dispose() { disposed = true; if (raf) cancelAnimationFrame(raf); window.removeEventListener('resize', resize); document.removeEventListener('visibilitychange', onVis); },
  };
}
