// LMR Capitals — landing "peripherals": the micro-UX layer that turns the page
// from a template into a product. Smooth inertia scroll (Lenis), a slim gold
// scroll-progress rail, a custom gold cursor with a soft trailing ring, and
// magnetic buttons. All guarded and pointer-aware; on touch / reduced-motion it
// no-ops gracefully. Returns a dispose().
import Lenis from 'lenis';

export function initPeripherals() {
  const cleanups = [];
  const finePointer = window.matchMedia && window.matchMedia('(pointer:fine)').matches;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  // ── smooth inertia scroll ───────────────────────────────────────────────────
  let lenis = null;
  const noSmooth = typeof location !== 'undefined' && /nolenis/.test(location.search); // harness/debug escape hatch
  if (!reduce && !noSmooth) {
    try {
      lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1.0, smoothWheel: true });
      let rafId = 0;
      const raf = (t) => { lenis.raf(t); rafId = requestAnimationFrame(raf); };
      rafId = requestAnimationFrame(raf);
      cleanups.push(() => { cancelAnimationFrame(rafId); lenis.destroy(); });
    } catch (e) { lenis = null; }
  }

  // ── gold scroll-progress rail ───────────────────────────────────────────────
  const bar = document.createElement('div'); bar.className = 'lmr-progress'; document.body.appendChild(bar);
  const onScrollBar = () => {
    const doc = document.documentElement;
    const max = (doc.scrollHeight - innerHeight) || 1;
    bar.style.transform = `scaleX(${Math.max(0, Math.min(1, scrollY / max))})`;
  };
  addEventListener('scroll', onScrollBar, { passive: true });
  onScrollBar();
  cleanups.push(() => { removeEventListener('scroll', onScrollBar); bar.remove(); });

  // ── custom gold cursor (fine pointers only) ─────────────────────────────────
  if (finePointer && !reduce) {
    const dot = document.createElement('div'); dot.className = 'lmr-cur-dot';
    const ring = document.createElement('div'); ring.className = 'lmr-cur-ring';
    document.body.appendChild(dot); document.body.appendChild(ring);
    document.documentElement.classList.add('lmr-cursor-on');
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, hot = false;
    const onMove = (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px,${my}px)`;
      const t = e.target;
      hot = !!(t && t.closest && t.closest('a,button,.tilt3d,.price-card,.btn,input,textarea'));
      ring.classList.toggle('hot', hot);
    };
    let rafC = 0;
    const tick = () => { rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18; ring.style.transform = `translate(${rx}px,${ry}px)`; rafC = requestAnimationFrame(tick); };
    rafC = requestAnimationFrame(tick);
    addEventListener('mousemove', onMove, { passive: true });
    const onDown = () => ring.classList.add('down'), onUp = () => ring.classList.remove('down');
    addEventListener('mousedown', onDown); addEventListener('mouseup', onUp);
    cleanups.push(() => { cancelAnimationFrame(rafC); removeEventListener('mousemove', onMove); removeEventListener('mousedown', onDown); removeEventListener('mouseup', onUp); dot.remove(); ring.remove(); document.documentElement.classList.remove('lmr-cursor-on'); });
  }

  // ── magnetic buttons ────────────────────────────────────────────────────────
  if (finePointer && !reduce) {
    const btns = Array.from(document.querySelectorAll('.btn, .brand'));
    const handlers = [];
    btns.forEach((b) => {
      const move = (e) => { const r = b.getBoundingClientRect(); const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2); b.style.transform = `translate(${dx * 0.25}px, ${dy * 0.3}px)`; };
      const leave = () => { b.style.transform = ''; };
      b.addEventListener('mousemove', move); b.addEventListener('mouseleave', leave);
      handlers.push([b, move, leave]);
    });
    cleanups.push(() => handlers.forEach(([b, m, l]) => { b.removeEventListener('mousemove', m); b.removeEventListener('mouseleave', l); b.style.transform = ''; }));
  }

  return { lenis, dispose() { cleanups.forEach((fn) => { try { fn(); } catch (e) {} }); } };
}
