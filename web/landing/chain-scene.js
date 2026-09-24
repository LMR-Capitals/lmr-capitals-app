// LMR Capitals — "The Chain": full-frame 3D scroll-driven chain (rebuilt to the
// client's CHAIN-HANDOFF spec). Seven stadium-tube gold links rise in, light per
// stage on scroll, then lock into a single spinning closed ring in the last 3%.
// Self-contained (three.js only). Sync factory (three is bundled).
// API: createChainScene(canvas,{count,extraRing}) -> { setProgress, setHover,
//   getRotationDeg, setMetal, setScale, setThickness, setSpacing, setTilt,
//   setGlow, setSwaySpeed, dispose }

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const METALS = {
  gold: { color: 0xF5A623, emissive: 0xB5720F },
  iron: { color: 0x8f9299, emissive: 0x20242c },
  steel: { color: 0xcfd6e2, emissive: 0x2a3242 },
};
const lerp = THREE.MathUtils.lerp;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const smoothstep = (t) => { t = clamp01(t); return t * t * (3 - 2 * t); };

function stadiumShape(width, height) {
  const r = width / 2, sx = width / 2, sy = Math.max(0.001, height / 2 - r);
  const s = new THREE.Shape();
  s.moveTo(sx, -sy);
  s.lineTo(sx, sy);
  s.absarc(0, sy, r, 0, Math.PI, false);
  s.lineTo(-sx, -sy);
  s.absarc(0, -sy, r, Math.PI, Math.PI * 2, false);
  return s;
}
function linkGeometry(scale, thickness) {
  const shape = stadiumShape(1.1 * scale, 2.0 * scale);
  const pts = shape.getPoints(96).map((p) => new THREE.Vector3(p.x, p.y, 0));
  const curve = new THREE.CatmullRomCurve3(pts, true);
  return new THREE.TubeGeometry(curve, 200, thickness * scale, 20, true);
}

export function createChainScene(canvas, opts = {}) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' }); }
  catch (e) { return noop(); }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  // metals need something to reflect or they render black — give them a lit room env
  try { const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; } catch (e) { /* env is a nicety */ }
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0, 0, 10);

  const keyLight = new THREE.DirectionalLight(0xfff2d6, 3.2); keyLight.position.set(4, 5, 7); scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0xffcf7a, 1.8); rimLight.position.set(-5, -1, -4); scene.add(rimLight);
  scene.add(new THREE.AmbientLight(0x241a10, 0.5));
  const glowLight = new THREE.PointLight(0xf5a623, 4, 14, 2); glowLight.position.set(0, 0, 5); scene.add(glowLight);

  const count = opts.count || 5;
  const extra = opts.extraRing == null ? 2 : opts.extraRing;
  const total = count + extra;
  const group = new THREE.Group(); scene.add(group);

  const cfg = { scale: 1, thickness: 0.18, spacing: 1.1, metal: 'gold', tilt: 6, glow: 1, sway: 1 };
  let geo = linkGeometry(cfg.scale, cfg.thickness);
  const links = [];
  function restY(i) { return ((total - 1) / 2 - i) * cfg.spacing; }
  function buildLinks() {
    links.forEach((l) => { group.remove(l.mesh); l.mesh.material.dispose(); });
    links.length = 0;
    const m = METALS[cfg.metal] || METALS.gold;
    for (let i = 0; i < total; i++) {
      // links in the chain are solid opaque gold (no see-through/ghosting); only the
      // extra ring links, which appear during the finale, fade in via opacity.
      const isExtra = i >= count;
      // start as cold iron; step() forges the active link (and the finale ring) to gold
      const mat = new THREE.MeshPhysicalMaterial({ color: 0x9aa0a8, emissive: 0x0e1013, emissiveIntensity: 0, metalness: 1, roughness: 0.55, clearcoat: 0.8, clearcoatRoughness: 0.15, envMapIntensity: 1.4, transparent: isExtra, opacity: isExtra ? 0 : 1 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(0, restY(i), 0);
      mesh.rotation.y = i % 2 ? Math.PI / 2 : 0;
      group.add(mesh);
      links.push({ mesh, baseRotY: mesh.rotation.y });
    }
  }
  buildLinks();

  // iron ↔ gold: links sit as cold iron; the ACTIVE link (and the whole finale
  // ring) forge to glowing gold. Scratch colours reused each frame.
  const cIron = new THREE.Color(0x9aa0a8), cGold = new THREE.Color(METALS.gold.color);
  const eIron = new THREE.Color(0x0e1013), eGold = new THREE.Color(METALS.gold.emissive);
  const tmpCol = new THREE.Color(), tmpEm = new THREE.Color();

  const state = { p: 0, hover: null };
  let raf = 0, disposed = false, inView = true;
  let gY = -cfg.spacing * total * 0.65;   // eased vertical position (only damped state; everything else is a pure fn of scroll)

  function resize() {
    const w = canvas.clientWidth || 800, h = canvas.clientHeight || 600;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  resize(); window.addEventListener('resize', resize);

  function step() {
    if (disposed) return;
    const p = state.p;
    const activeIdx = Math.max(0, Math.min(count - 1, Math.floor((p - 0.75 / count) * count)));
    const sliceFrac = p * count - Math.floor(p * count);
    const rise = smoothstep(p / 0.18);
    const finaleT = smoothstep((p - 0.88) / 0.10);   // ring forms 0.88→0.98, holds closed 0.98→1.0

    // group position: rise in from below, keep the active link centred through the
    // stages while biased right of centre (leaving the left column for the copy),
    // then re-centre (X→0, Y→0) as the finale ring forms so it sits dead-centre.
    const offX = camera.aspect > 1.1 ? 1.9 : 0;   // desktop: chain right, copy left
    const activeTargetGY = lerp(-cfg.spacing * total * 0.65, -restY(activeIdx), rise);
    const targetGY = lerp(activeTargetGY, 0, finaleT);
    const targetGX = lerp(offX, 0, finaleT);
    gY = lerp(gY, targetGY, 0.12); group.position.y = gY;
    group.position.x = lerp(group.position.x, targetGX, 0.12);

    // tilt is a pure function of scroll — no time-based sway, no accumulating spin,
    // so the whole sequence reverses exactly when you scroll back up and never drifts.
    group.rotation.x = (cfg.tilt * Math.PI / 180) * (1 - finaleT);
    group.rotation.z = 0;

    const ringR = (cfg.spacing * total) / (Math.PI * 2) * 1.05;
    for (let i = 0; i < links.length; i++) {
      const l = links[i], mat = l.mesh.material;
      // finale per-link stagger
      const fe = smoothstep((finaleT - (i / total) * 0.5) / 0.5);
      // position: rest column → ring point
      const ang = (i / total) * Math.PI * 2 - Math.PI / 2;
      const ringX = Math.cos(ang) * ringR, ringY = Math.sin(ang) * ringR;
      l.mesh.position.x = lerp(l.mesh.position.x, lerp(0, ringX, fe), 0.16);
      l.mesh.position.y = lerp(l.mesh.position.y, lerp(restY(i), ringY, fe), 0.16);
      l.mesh.rotation.y = lerp(l.mesh.rotation.y, lerp(l.baseRotY, 0, fe), 0.14);
      l.mesh.rotation.z = lerp(l.mesh.rotation.z, fe * (ang + Math.PI / 2), 0.14);
      // scale: active pop, finale settle ~0.95
      const isActive = i === activeIdx;
      const baseScale = isActive ? 1.12 : 1.0;
      const tScale = lerp(baseScale, 0.95, fe);
      const cur = l.mesh.scale.x; const ns = lerp(cur, tScale, 0.14); l.mesh.scale.setScalar(ns);
      // opacity: chain links stay solid; only extra ring links fade in for the finale
      if (i >= count) mat.opacity = lerp(mat.opacity, fe, 0.14);
      // iron → gold: only the ACTIVE link forges to gold (single glow); everything
      // else stays cold iron until the finale, when the whole ring turns gold.
      const goldness = Math.max(isActive ? 1 : 0, fe);
      tmpCol.copy(cIron).lerp(cGold, goldness); mat.color.lerp(tmpCol, 0.2);
      tmpEm.copy(eIron).lerp(eGold, goldness); mat.emissive.lerp(tmpEm, 0.2);
      mat.roughness = lerp(mat.roughness, lerp(0.55, 0.22, goldness), 0.2);
      let em = goldness * (0.55 + 0.35 * clamp01(sliceFrac)) * cfg.glow;   // gold links glow, iron stays dark
      if (state.hover === i) em += 0.5 * cfg.glow;
      mat.emissiveIntensity = lerp(mat.emissiveIntensity, em, 0.15);
    }
    glowLight.intensity = 2.2 + finaleT * 3;

    renderer.render(scene, camera);
  }
  function loop() { raf = 0; if (disposed || !inView || document.hidden) return; step(); raf = requestAnimationFrame(loop); }
  function kick() { if (!raf && !disposed && inView && !document.hidden) raf = requestAnimationFrame(loop); }
  kick();
  let io = null;
  try { io = new IntersectionObserver((es) => { inView = es[0].isIntersecting; if (inView) kick(); }, { threshold: 0 }); io.observe(canvas); } catch (e) { inView = true; }
  function onVis() { if (!document.hidden) kick(); }
  document.addEventListener('visibilitychange', onVis);

  function rebuildGeo() { const old = geo; geo = linkGeometry(cfg.scale, cfg.thickness); links.forEach((l) => { l.mesh.geometry = geo; }); old.dispose(); }

  return {
    setProgress(p) { state.p = clamp01(p); step(); kick(); },
    setHover(i) { state.hover = (i == null ? null : i | 0); step(); kick(); },
    resize() { resize(); step(); },
    getRotationDeg() { return group.rotation.z * 180 / Math.PI; },
    setMetal(m) { if (m && m !== cfg.metal && METALS[m]) { cfg.metal = m; buildLinks(); } },
    setScale(s) { if (s && s !== cfg.scale) { cfg.scale = s; rebuildGeo(); } },
    setThickness(t2) { if (t2 && t2 !== cfg.thickness) { cfg.thickness = t2; rebuildGeo(); } },
    setSpacing(s) { if (s) { cfg.spacing = s; links.forEach((l, i) => { l.mesh.position.y = restY(i); }); } },
    setTilt(deg) { cfg.tilt = deg; },
    setGlow(g) { cfg.glow = g; },
    setSwaySpeed(s) { cfg.sway = s; },
    dispose() {
      disposed = true; if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize); document.removeEventListener('visibilitychange', onVis); if (io) io.disconnect();
      links.forEach((l) => l.mesh.material.dispose()); geo.dispose(); renderer.dispose();
    },
  };
}

function noop() { return { setProgress() {}, setHover() {}, getRotationDeg() { return 0; }, setMetal() {}, setScale() {}, setThickness() {}, setSpacing() {}, setTilt() {}, setGlow() {}, setSwaySpeed() {}, dispose() {} }; }
