// LMR Capitals — persistent WebGL scene behind the 3D-forward landing page.
// A drifting particle nebula + the interlocking "Chain" centerpiece. Driven by
// scroll (camera dolly + chain assembly + theme colour) and mouse parallax.
// API: createScene(canvas) -> { setScroll(p), setSection(i), setMouse(x,y),
//      setChainProgress(p), dispose() }.  Never throws to the caller.

import * as THREE from 'three';

const THEMES = [
  { a: 0xF5A623, b: 0x2a5cff },  // hero — gold + deep blue
  { a: 0xF5A623, b: 0x1e6bff },  // about
  { a: 0xF5A623, b: 0x8a5cff },  // what we do
  { a: 0xFFD166, b: 0x2dd4bf },  // the chain
  { a: 0x2dd4bf, b: 0xf0705a },  // conviction (teal ↔ coral)
  { a: 0xF5A623, b: 0x2a5cff },  // indicators / rest
];

export function createScene(canvas) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch (e) {
    return noop();
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05070d, 0.03);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
  camera.position.set(0, 0, 16);

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(4, 6, 8); scene.add(key);
  const warm = new THREE.PointLight(0xF5A623, 1.6, 60); warm.position.set(0, 0, 6); scene.add(warm);
  const cool = new THREE.PointLight(0x2a5cff, 1.1, 60); cool.position.set(-8, -4, 4); scene.add(cool);

  // ── particle nebula ──────────────────────────────────────────────────────
  const COUNT = Math.max(1200, Math.min(4200, Math.floor((window.innerWidth || 1200) * 2.4)));
  const pos = new Float32Array(COUNT * 3);
  const col = new Float32Array(COUNT * 3);
  const cA = new THREE.Color(THEMES[0].a), cB = new THREE.Color(THEMES[0].b);
  for (let i = 0; i < COUNT; i++) {
    // disc-ish cloud with depth
    const r = 6 + Math.pow(Math.random(), 0.6) * 34;
    const a = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * 26;
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = Math.sin(a) * r - 8;
    const c = Math.random() < 0.5 ? cA : cB;
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const pMat = new THREE.PointsMaterial({ size: 0.09, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  // ── the Chain: a ring of interlocking torus links ────────────────────────
  const chain = new THREE.Group();
  scene.add(chain);
  const LINKS = 7;
  const links = [];
  let linkThickness = 0.2;
  function buildChain(colorHex) {
    links.forEach((l) => { l.geometry.dispose(); l.material.dispose(); chain.remove(l); });
    links.length = 0;
    for (let i = 0; i < LINKS; i++) {
      const geo = new THREE.TorusGeometry(0.7, linkThickness, 20, 52);
      const mat = new THREE.MeshStandardMaterial({ color: colorHex, emissive: colorHex, emissiveIntensity: 0.45, metalness: 0.95, roughness: 0.25, transparent: true });
      const link = new THREE.Mesh(geo, mat);
      chain.add(link); links.push(link);
    }
    layoutChain();
  }
  function layoutChain() {
    const R = 3.0;
    for (let i = 0; i < links.length; i++) {
      const a = (i / links.length) * Math.PI * 2;
      const link = links[i];
      link.position.set(Math.cos(a) * R, Math.sin(a) * R, 0);
      link.rotation.set(i % 2 ? Math.PI / 2 : 0, 0, a + Math.PI / 2);
      link.userData.base = link.rotation.clone();
    }
  }
  buildChain(0xF5A623);

  const state = { scroll: 0, section: 0, chainP: 0, mx: 0, my: 0, themeT: 0, targetTheme: 0 };
  const curA = new THREE.Color(THEMES[0].a), curB = new THREE.Color(THEMES[0].b);

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  const clock = new THREE.Clock();
  let raf = 0, disposed = false, mxE = 0, myE = 0;

  function frame() {
    if (disposed) return;
    const t = clock.getElapsedTime();
    const p = state.scroll;

    // ease mouse
    mxE += (state.mx - mxE) * 0.05; myE += (state.my - myE) * 0.05;

    // theme colour lerp toward the active section
    const th = THEMES[Math.max(0, Math.min(THEMES.length - 1, state.section))];
    curA.lerp(new THREE.Color(th.a), 0.03);
    curB.lerp(new THREE.Color(th.b), 0.03);
    warm.color.copy(curA); cool.color.copy(curB);
    links.forEach((l) => { l.material.color.copy(curA); l.material.emissive.copy(curA); });

    // particles: slow rotation + parallax + gentle vertical drift
    particles.rotation.y = t * 0.02 + mxE * 0.3;
    particles.rotation.x = -0.1 + myE * 0.2;
    pMat.opacity = 0.55 + 0.3 * Math.sin(t * 0.4) * 0.2 + 0.2;

    // chain: continuous spin, scroll assembles + tilts, mouse parallax
    chain.rotation.z = t * 0.12 + p * 0.8;
    chain.rotation.x = 0.35 + p * 0.5 + myE * 0.35;
    chain.rotation.y = mxE * 0.5;
    const cp = clamp01(state.chainP);
    chain.scale.setScalar(0.8 + cp * 0.35);
    for (let i = 0; i < links.length; i++) {
      const reveal = clamp01((cp - (i / links.length) * 0.6) / 0.3) * 0.7 + 0.3;
      const l = links[i];
      l.material.opacity = reveal;
      l.material.emissiveIntensity = 0.3 + reveal * 0.5;
      if (l.userData.base) l.rotation.x = l.userData.base.x + Math.sin(t * 0.7 + i) * 0.05;
    }

    // camera dolly through the scroll + subtle parallax
    camera.position.z = 16 - p * 6;
    camera.position.x = mxE * 1.2;
    camera.position.y = -myE * 0.8 + p * 1.2;
    camera.lookAt(0, p * 0.6, 0);

    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  function clamp01(v) { return Math.max(0, Math.min(1, v)); }
  function onVis() { if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = 0; } else if (!raf && !disposed) { raf = requestAnimationFrame(frame); } }
  document.addEventListener('visibilitychange', onVis);

  return {
    setScroll(p) { state.scroll = clamp01(p); },
    setSection(i) { state.section = i | 0; },
    setChainProgress(p) { state.chainP = clamp01(p); },
    setMouse(x, y) { state.mx = x; state.my = y; },
    dispose() {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
      links.forEach((l) => { l.geometry.dispose(); l.material.dispose(); });
      pGeo.dispose(); pMat.dispose();
      renderer.dispose();
    },
  };
}

function noop() {
  return { setScroll() {}, setSection() {}, setChainProgress() {}, setMouse() {}, dispose() {} };
}
