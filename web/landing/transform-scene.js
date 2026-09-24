// LMR Capitals — "Transformation" Phase A, rebuilt in 3D.
//
// The trader's "before" mind is noise: word-cards scattered in space, cold and
// tumbling. As a gold "confirm" sweep crosses, the cards snap into an aligned
// grid AND a single real interlocking iron chain — the same forged-gold links as
// the methodology monitor — forges through every card, connecting the whole grid
// "in full circle" with a gold bloom. The noise becomes one system.
//
// Driven by a single 0..1 progress (chaos → order → connected).
// API: createTransformScene(canvas, { words }) -> { setProgress(p), resize(), dispose() }
// Never throws to the caller (returns a no-op shim on WebGL failure).

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { makeLinkGeometry } from './desk-scene.js';

const GOLD = 0xF5A623;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const smooth = (e0, e1, x) => { const t = clamp01((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };

export function createTransformScene(canvas, opts = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch (e) { return noop(); }
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(DPR);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const words = (opts.words && opts.words.length ? opts.words : ['Hesitation', 'Self-doubt', 'Overtrading', 'Revenge trades', 'FOMO', 'No plan', 'Chasing noise', 'Forced entries']).slice(0, 8);
  while (words.length < 8) words.push(words[words.length % Math.max(1, words.length)]);

  const scene = new THREE.Scene();
  try {
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  } catch (e) { /* reflections are a nicety */ }

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0.55, 8.7);
  camera.lookAt(0, -0.35, 0);

  // ── lighting (mirrors the methodology desk so the metal reads the same) ──────
  scene.add(new THREE.AmbientLight(0x2a3550, 0.6));
  const key = new THREE.DirectionalLight(0xfff2d6, 1.3); key.position.set(4, 7, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0x3a6bff, 0.5); rim.position.set(-6, 2, -3); scene.add(rim);
  scene.add(new THREE.HemisphereLight(0x8fa6cc, 0x0a0e17, 0.55));
  const goldGlow = new THREE.PointLight(GOLD, 0.0, 20, 2.0); goldGlow.position.set(0, -0.3, 2.4); scene.add(goldGlow);

  // ── the grid: 8 cards in a 4×2 block, serpentine slot order (chain path) ─────
  const root = new THREE.Group();
  root.rotation.x = -0.10;                    // slight top-down tilt → real 3D depth
  scene.add(root);

  const COLS = 4, ROWS = 2;
  const COL_SP = 2.16, ROW_SP = 1.52;
  const GRID_CY = -0.32;                       // biased low so the headline clears it
  const CW = 1.5, CH = 0.6;
  const colX = (c) => (c - (COLS - 1) / 2) * COL_SP;
  const rowY = (r) => GRID_CY + ((ROWS - 1) / 2 - r) * ROW_SP;
  // serpentine slots: top row L→R, then bottom row R→L → a single U-path
  const slots = [];
  for (let c = 0; c < COLS; c++) slots.push([c, 0]);
  for (let c = COLS - 1; c >= 0; c--) slots.push([c, 1]);

  // deterministic scatter
  let seed = 7723137;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

  const plateGeo = new RoundedBoxGeometry(CW, CH, 0.12, 5, 0.15);
  const frameGeo = new RoundedBoxGeometry(CW + 0.12, CH + 0.12, 0.06, 4, 0.17);
  const cards = [];
  const orderPts = [];
  for (let i = 0; i < 8; i++) {
    const [c, r] = slots[i];
    const ox = colX(c), oy = rowY(r);
    const g = new THREE.Group();
    // gold frame (glows when ordered)
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x0a0d14, emissive: GOLD, emissiveIntensity: 0, metalness: 0.6, roughness: 0.3 });
    const frame = new THREE.Mesh(frameGeo, frameMat); frame.position.z = -0.035; g.add(frame);
    // dark glass plate
    const plate = new THREE.Mesh(plateGeo, new THREE.MeshStandardMaterial({ color: 0x0b0f1a, metalness: 0.15, roughness: 0.72 })); g.add(plate);
    // crisp word face (tinted grey → gold via material.color)
    const textMat = new THREE.MeshBasicMaterial({ map: makeWordTexture(words[i]), transparent: true, toneMapped: false, depthWrite: false, color: new THREE.Color(0x8ea0be) });
    const text = new THREE.Mesh(new THREE.PlaneGeometry(CW * 0.9, CH * 0.62), textMat); text.position.z = 0.07; g.add(text);

    const chaos = new THREE.Vector3(ox + (rnd() - 0.5) * 6.2, oy + (rnd() - 0.5) * 4.4, (rnd() - 0.5) * 4.0);
    const chaosQ = new THREE.Quaternion().setFromEuler(new THREE.Euler((rnd() - 0.5) * 1.4, (rnd() - 0.5) * 1.6, (rnd() - 0.5) * 1.1));
    g.position.copy(chaos); g.quaternion.copy(chaosQ);
    root.add(g);
    cards.push({ g, frameMat, textMat, order: new THREE.Vector3(ox, oy, 0), orderX: ox, chaos, chaosQ, ph: rnd() * 6.28, spd: 0.5 + rnd() * 0.7 });
    orderPts.push(new THREE.Vector3(ox, oy, 0));
  }

  // ── the chain: real interlocking links threaded along the serpentine path ────
  const LINK_A = 0.13, LINK_B = 0.10, LINK_T = 0.052;
  const SPACING = LINK_A + LINK_B + 0.085;
  const linkGeo = makeLinkGeometry(LINK_A, LINK_B, LINK_T);
  const upY = new THREE.Vector3(0, 1, 0);
  const chain = new THREE.Group(); root.add(chain);
  const links = [];
  const MARG = 0.04;                              // link run starts just past the card edge
  // build one gap-segment per consecutive card pair, edge-to-edge (clear of the text)
  const gaps = [];
  let totalGap = 0;
  for (let i = 0; i < orderPts.length - 1; i++) {
    const a = orderPts[i], b = orderPts[i + 1];
    const dir = new THREE.Vector3().subVectors(b, a).normalize();
    const halfAlong = Math.abs(dir.x) * CW / 2 + Math.abs(dir.y) * CH / 2;
    const start = new THREE.Vector3().copy(a).addScaledVector(dir, halfAlong + MARG);
    const end = new THREE.Vector3().copy(b).addScaledVector(dir, -(halfAlong + MARG));
    const len = start.distanceTo(end);
    gaps.push({ start, dir, len, s0: totalGap }); totalGap += len;
  }
  let parity = 0;
  for (const gap of gaps) {
    const nSeg = Math.max(1, Math.round(gap.len / SPACING));
    const step = gap.len / nSeg;
    for (let j = 0; j < nSeg; j++) {
      const s = (j + 0.5) * step;
      const pos = new THREE.Vector3().copy(gap.start).addScaledVector(gap.dir, s);
      const baseQ = new THREE.Quaternion().setFromUnitVectors(upY, gap.dir);
      if (parity % 2) baseQ.multiply(new THREE.Quaternion().setFromAxisAngle(upY, Math.PI / 2));
      parity++;
      const mat = new THREE.MeshStandardMaterial({ color: 0xC9922B, emissive: GOLD, emissiveIntensity: 0, metalness: 1.0, roughness: 0.17, transparent: true, opacity: 0 });
      const mesh = new THREE.Mesh(linkGeo, mat);
      mesh.position.copy(pos); mesh.quaternion.copy(baseQ); mesh.position.z = 0.02;
      chain.add(mesh); links.push({ mesh, mat, f: (gap.s0 + s) / totalGap });
    }
  }

  // ── bloom (transparent-safe) ────────────────────────────────────────────────
  let composer = null, bloom = null;
  try {
    composer = new EffectComposer(renderer);
    const rp = new RenderPass(scene, camera); rp.clearAlpha = 0; composer.addPass(rp);
    bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.15, 0.4, 0.85);
    composer.addPass(bloom); composer.addPass(new OutputPass());
  } catch (e) { composer = null; }

  const state = { p: 0 };
  const clock = new THREE.Clock();
  let raf = 0, disposed = false, inView = true;
  const GREY = new THREE.Color(0x8ea0be), GOLDC = new THREE.Color(0xFFD37A);
  const tmpC = new THREE.Color();
  const IDENTITY = new THREE.Quaternion();

  function sizeOf() { return [canvas.clientWidth || 1000, canvas.clientHeight || 700]; }
  function resize() {
    const [w, h] = sizeOf();
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    if (composer) composer.setSize(w, h);
    if (bloom) bloom.setSize(w, h);
  }
  resize();
  window.addEventListener('resize', resize);

  function frame() {
    raf = 0;
    if (disposed || !inView || document.hidden) return;
    const t = clock.getElapsedTime();
    const p = state.p;

    root.rotation.y = Math.sin(t * 0.18) * 0.05;

    // gold "confirm" sweep travels left → right across the grid in world X
    const sweepX = lerp(-5.2, 5.2, smooth(0.10, 0.74, p));
    const gp = smooth(0.03, 0.96, p);

    for (let i = 0; i < cards.length; i++) {
      const cd = cards[i];
      const conv = clamp01((sweepX - cd.orderX) / 1.7 + 0.5) * gp;
      const e = easeInOut(conv);
      // position: chaos → order, with a fading idle drift while still noise
      const drift = (1 - e) * 0.12;
      cd.g.position.set(
        lerp(cd.chaos.x, cd.order.x, e) + Math.sin(t * cd.spd + cd.ph) * drift,
        lerp(cd.chaos.y, cd.order.y, e) + Math.cos(t * cd.spd * 0.9 + cd.ph) * drift,
        lerp(cd.chaos.z, cd.order.z, e),
      );
      cd.g.quaternion.slerpQuaternions(cd.chaosQ, IDENTITY, e);
      cd.frameMat.emissiveIntensity = e * 0.85;
      cd.textMat.color.copy(tmpC.copy(GREY).lerp(GOLDC, e));
      cd.textMat.opacity = 0.35 + 0.65 * smooth(0, 0.35, conv + 0.05);
    }

    // chain forges along its length; every link glows together at the finale
    const forge = smooth(0.16, 0.9, p);
    const connected = smooth(0.86, 0.99, p);
    const pulse = connected * (0.16 + 0.16 * (0.5 + 0.5 * Math.sin(t * 2.0)));
    for (let i = 0; i < links.length; i++) {
      const ln = links[i];
      const on = smooth(ln.f - 0.06, ln.f + 0.02, forge);
      ln.mat.opacity = on;
      ln.mat.emissiveIntensity = on * 0.32 + pulse;
    }
    goldGlow.intensity = 0.2 * gp + connected * 0.55 + pulse * 0.5;
    if (bloom) bloom.strength = 0.08 + connected * 0.4 + pulse * 0.5;

    if (composer) composer.render(); else renderer.render(scene, camera);
    if (!disposed && inView && !document.hidden) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && !disposed && inView && !document.hidden) raf = requestAnimationFrame(frame); }
  kick();

  // pause when the section is off-screen (three WebGL contexts share the GPU)
  let io = null;
  try {
    io = new IntersectionObserver((es) => { inView = es[0].isIntersecting; if (inView) kick(); }, { threshold: 0 });
    io.observe(canvas);
  } catch (e) { inView = true; }
  function onVis() { if (!document.hidden) kick(); }
  document.addEventListener('visibilitychange', onVis);

  return {
    setProgress(p) { state.p = clamp01(p); kick(); },
    resize,
    dispose() {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
      if (io) io.disconnect();
      scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) { const m = o.material; (Array.isArray(m) ? m : [m]).forEach((mm) => { if (mm.map) mm.map.dispose(); mm.dispose(); }); } });
      if (composer) composer.dispose();
      renderer.dispose();
    },
  };
}

// White word on transparent, tinted at runtime via material.color (grey → gold).
function makeWordTexture(word) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 200;
  const g = c.getContext('2d');
  g.clearRect(0, 0, c.width, c.height);
  g.fillStyle = '#ffffff';
  let fs = 66;
  g.font = `800 ${fs}px Archivo, system-ui, sans-serif`;
  while (g.measureText(word).width > c.width - 48 && fs > 26) { fs -= 3; g.font = `800 ${fs}px Archivo, system-ui, sans-serif`; }
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(word, c.width / 2, c.height / 2 + 2);
  const tex = new THREE.CanvasTexture(c); tex.anisotropy = 4; tex.needsUpdate = true;
  return tex;
}

function noop() { return { setProgress() {}, resize() {}, dispose() {} }; }
