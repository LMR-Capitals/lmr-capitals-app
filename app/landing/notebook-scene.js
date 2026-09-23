// LMR Capitals — Conviction Act 2: "The Playbook" written into a notebook.
//
// After the chain connects the cards, the desk offers a notepad. As the trader
// scrolls, the playbook — the "magical keys" of what to actually DO — is written
// onto the page one line at a time, in a handwriting hand, like journaling. A
// warm desk-lamp glow, cream ruled paper, spiral binding and a resting pen keep
// it in the same desk world as the methodology monitor.
//
// Driven by a single 0..1 progress (how much of the playbook is written).
// API: createNotebookScene(canvas, { title, subtitle, keys }) -> { setProgress(p), resize(), dispose() }
// Never throws to the caller (returns a no-op shim on WebGL failure).

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const smooth = (e0, e1, x) => { const t = clamp01((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };

export function createNotebookScene(canvas, opts = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch (e) { return noop(); }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;

  const title = opts.title || 'THE PLAYBOOK';
  const subtitle = opts.subtitle || 'What the chain asks of you.';
  const keys = (opts.keys && opts.keys.length ? opts.keys : ['Wait for the chain.', 'Trade the plan.', 'Log every trade.', 'Cut when it breaks.', 'Review, don’t react.']).slice(0, 6);

  const scene = new THREE.Scene();
  try {
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  } catch (e) { /* nicety */ }

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0.25, 7.15);
  camera.lookAt(0, -0.12, 0);

  // ── lighting: warm desk lamp from upper-left, cool fill ──────────────────────
  scene.add(new THREE.AmbientLight(0x2a3550, 0.5));
  const lamp = new THREE.PointLight(0xffe6b0, 15, 22, 2.0); lamp.position.set(-2.4, 3.4, 3.2); scene.add(lamp);
  const key = new THREE.DirectionalLight(0xfff2d6, 0.7); key.position.set(-3, 5, 5); scene.add(key);
  scene.add(new THREE.HemisphereLight(0x8fa6cc, 0x0a0e17, 0.4));

  const root = new THREE.Group();
  root.rotation.x = -0.16;                       // page tips back slightly, as if on the desk
  scene.add(root);

  // ── desk surface behind the pad (keeps it in the monitor's world) ────────────
  const desk = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), new THREE.MeshStandardMaterial({ color: 0x0a0e17, roughness: 0.9, metalness: 0.1 }));
  desk.position.set(0, 0, -0.6); root.add(desk);

  // ── the notepad ──────────────────────────────────────────────────────────────
  // portrait page; canvas texture holds paper + ruled lines + handwritten keys
  const PW = 3.25, PH = 4.02;                    // world size (portrait)
  const CW = 1040, CH = 1286;                    // texture size (same aspect)
  const pageCanvas = document.createElement('canvas'); pageCanvas.width = CW; pageCanvas.height = CH;
  const pctx = pageCanvas.getContext('2d');
  const pageTex = new THREE.CanvasTexture(pageCanvas); pageTex.anisotropy = 8;

  // pad backing (a thin slab under the page, so it reads as a physical pad)
  const backing = new THREE.Mesh(new THREE.BoxGeometry(PW + 0.14, PH + 0.14, 0.10), new THREE.MeshStandardMaterial({ color: 0x1a1f2b, roughness: 0.6, metalness: 0.3 }));
  backing.position.z = -0.055; root.add(backing);
  const page = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), new THREE.MeshStandardMaterial({ map: pageTex, roughness: 0.92, metalness: 0.0 }));
  page.position.z = 0.005; root.add(page);

  // spiral binding rings along the top edge
  const rings = new THREE.Group(); root.add(rings);
  const ringMat = new THREE.MeshStandardMaterial({ color: 0xcfd6e2, metalness: 1.0, roughness: 0.3 });
  const ringGeo = new THREE.TorusGeometry(0.055, 0.018, 10, 20);
  const RN = 13;
  for (let i = 0; i < RN; i++) {
    const m = new THREE.Mesh(ringGeo, ringMat);
    m.position.set(-PW / 2 + 0.18 + (i / (RN - 1)) * (PW - 0.36), PH / 2 - 0.02, 0.03);
    m.rotation.y = Math.PI / 2; rings.add(m);
  }

  // a pen resting across the lower page
  const pen = new THREE.Group();
  const penBody = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.7, 16), new THREE.MeshStandardMaterial({ color: 0x0e1320, metalness: 0.6, roughness: 0.35 }));
  const penTip = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.005, 0.22, 16), new THREE.MeshStandardMaterial({ color: 0xC9922B, metalness: 1.0, roughness: 0.25, emissive: 0xF5A623, emissiveIntensity: 0.2 }));
  penTip.position.y = -0.96; pen.add(penBody, penTip);
  pen.position.set(PW / 2 - 0.55, -PH / 2 + 0.62, 0.09);
  pen.rotation.z = 1.15; root.add(pen);

  // ── page drawing ─────────────────────────────────────────────────────────────
  const PAD = 92;
  const HEAD_Y = 150, SUB_Y = 214, DIV_Y = 250;
  const KEY_Y0 = 372, KEY_DY = (CH - KEY_Y0 - 120) / Math.max(1, keys.length);
  const MARGIN_X = 150, NUM_X = 118, TEXT_X = 196;

  function drawStatic() {
    // cream paper with a soft warm gradient
    const g = pctx.createLinearGradient(0, 0, 0, CH);
    g.addColorStop(0, '#f6efe0'); g.addColorStop(1, '#efe6d2');
    pctx.fillStyle = g; pctx.fillRect(0, 0, CW, CH);
    // subtle top shadow under the binding
    const sh = pctx.createLinearGradient(0, 0, 0, 90);
    sh.addColorStop(0, 'rgba(60,45,20,0.16)'); sh.addColorStop(1, 'rgba(60,45,20,0)');
    pctx.fillStyle = sh; pctx.fillRect(0, 0, CW, 90);
    // ruled lines
    pctx.strokeStyle = 'rgba(120,140,180,0.28)'; pctx.lineWidth = 1.5;
    for (let y = KEY_Y0 - 10; y < CH - 70; y += KEY_DY / 2) { pctx.beginPath(); pctx.moveTo(PAD, y); pctx.lineTo(CW - 60, y); pctx.stroke(); }
    // red margin line
    pctx.strokeStyle = 'rgba(200,90,70,0.5)'; pctx.lineWidth = 2;
    pctx.beginPath(); pctx.moveTo(MARGIN_X, 100); pctx.lineTo(MARGIN_X, CH - 60); pctx.stroke();
    // binding holes
    pctx.fillStyle = 'rgba(40,30,15,0.35)';
    for (let i = 0; i < RN; i++) { const x = 60 + (i / (RN - 1)) * (CW - 120); pctx.beginPath(); pctx.ellipse(x, 34, 15, 11, 0, 0, Math.PI * 2); pctx.fill(); }
    // header
    pctx.fillStyle = '#a9781e'; pctx.textAlign = 'left'; pctx.textBaseline = 'alphabetic';
    pctx.font = '800 62px Archivo, system-ui, sans-serif';
    pctx.fillText(title, PAD, HEAD_Y);
    pctx.fillStyle = 'rgba(90,70,35,0.85)'; pctx.font = '500 30px Archivo, system-ui, sans-serif';
    pctx.fillText(subtitle, PAD, SUB_Y);
    pctx.strokeStyle = 'rgba(169,120,30,0.7)'; pctx.lineWidth = 3;
    pctx.beginPath(); pctx.moveTo(PAD, DIV_Y); pctx.lineTo(CW - 150, DIV_Y); pctx.stroke();
  }

  // fit each key to one handwritten line
  const KEY_FONT = (px) => `600 ${px}px "Caveat", "Segoe Script", cursive`;
  function keyFontSize(text) {
    let px = 52; pctx.font = KEY_FONT(px);
    while (pctx.measureText(text).width > CW - TEXT_X - 90 && px > 30) { px -= 2; pctx.font = KEY_FONT(px); }
    return px;
  }

  let lastDraw = -1;
  let writeFront = null; // {cx, cy} in canvas coords of the active writing tip, or null
  function drawPage(writeF) {
    // writeF: 0..keys.length continuous (how many keys written)
    const q = Math.round(writeF * 100);
    if (q === lastDraw) return; lastDraw = q; // avoid needless redraws
    writeFront = null;
    drawStatic();
    for (let i = 0; i < keys.length; i++) {
      const y = KEY_Y0 + i * KEY_DY;
      const reveal = clamp01(writeF - i);          // 0..1 for this line
      if (reveal <= 0) continue;
      // gold key marker (a check in a ring)
      pctx.save();
      pctx.globalAlpha = Math.min(1, reveal * 3);
      pctx.strokeStyle = '#b5811f'; pctx.lineWidth = 3.5;
      pctx.beginPath(); pctx.arc(NUM_X, y - 14, 22, 0, Math.PI * 2); pctx.stroke();
      pctx.strokeStyle = '#c8952a'; pctx.lineWidth = 4.5; pctx.lineCap = 'round';
      pctx.beginPath(); pctx.moveTo(NUM_X - 10, y - 14); pctx.lineTo(NUM_X - 2, y - 6); pctx.lineTo(NUM_X + 12, y - 24); pctx.stroke();
      pctx.restore();
      // handwritten line, revealed left→right
      const fs = keyFontSize(keys[i]); pctx.font = KEY_FONT(fs);
      const w = pctx.measureText(keys[i]).width;
      const clipW = TEXT_X + w * clamp01(reveal * 1.08);
      pctx.save();
      pctx.beginPath(); pctx.rect(0, y - fs, clipW, fs * 1.8); pctx.clip();
      pctx.fillStyle = '#1c2736'; pctx.textAlign = 'left'; pctx.textBaseline = 'alphabetic';
      pctx.fillText(keys[i], TEXT_X, y);
      pctx.restore();
      // pen-tip gold glow at the writing front
      if (reveal < 1) {
        const gx = TEXT_X + w * clamp01(reveal * 1.08);
        pctx.save(); pctx.globalAlpha = 0.9; pctx.fillStyle = '#f5a623';
        pctx.shadowColor = '#f5a623'; pctx.shadowBlur = 18;
        pctx.beginPath(); pctx.arc(gx, y - 12, 5, 0, Math.PI * 2); pctx.fill(); pctx.restore();
        writeFront = { cx: gx, cy: y - 12 };           // hand the pen tip its target
      }
    }
    pageTex.needsUpdate = true;
  }
  drawPage(0);

  const state = { p: 0 };
  const clock = new THREE.Clock();
  let raf = 0, disposed = false, inView = true;

  function sizeOf() { return [canvas.clientWidth || 1000, canvas.clientHeight || 700]; }
  function resize() {
    const [w, h] = sizeOf();
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  function frame() {
    raf = 0;
    if (disposed || !inView || document.hidden) return;
    const t = clock.getElapsedTime();
    const p = state.p;
    root.rotation.y = Math.sin(t * 0.16) * 0.03;
    root.position.y = -0.02 + Math.sin(t * 0.5) * 0.006;
    lamp.intensity = 14 + Math.sin(t * 1.4) * 1.2;
    drawPage(p * keys.length);
    // drive the pen: tip follows the writing front, else eases back to rest
    let tx, ty;
    if (writeFront) {
      tx = (writeFront.cx / CW - 0.5) * PW - 0.93;   // subtract the rotated tip offset
      ty = (0.5 - writeFront.cy / CH) * PH + 0.42;
    } else { tx = PW / 2 - 0.55; ty = -PH / 2 + 0.62; }
    pen.position.x += (tx - pen.position.x) * 0.2;
    pen.position.y += (ty - pen.position.y) * 0.2;
    pen.position.z = 0.12;
    renderer.render(scene, camera);
    if (!disposed && inView && !document.hidden) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && !disposed && inView && !document.hidden) raf = requestAnimationFrame(frame); }
  kick();

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
      renderer.dispose();
    },
  };
}

function noop() { return { setProgress() {}, resize() {}, dispose() {} }; }
