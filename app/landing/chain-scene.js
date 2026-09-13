// LMR Capitals — "The Chain" 3D scene for the #method section.
// A ring of metallic torus links that assemble as the section scrolls and
// settle into a full circle at the finale. Exposes the API the landing
// component drives: createChainScene(canvas,{count}) -> { setProgress, setScale,
// setSpacing, setThickness, setMetal, setTilt, setGlow, setSwaySpeed, setHover,
// getRotationDeg, dispose }.

import * as THREE from 'three';

const METAL = {
  gold:  { color: 0xF5A623, emissive: 0x5a3a05 },
  iron:  { color: 0x8B5A2B, emissive: 0x2a1a0a },
  steel: { color: 0x8FA9BC, emissive: 0x1a2833 },
};

export async function createChainScene(canvas, opts = {}) {
  const count = opts.count ?? 7;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(3, 5, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffe0a0, 0.8); rim.position.set(-4, -2, 4); scene.add(rim);

  const ring = new THREE.Group();
  scene.add(ring);

  const state = {
    progress: 0, scale: 1, spacing: 1.1, thickness: 0.18,
    metal: 'gold', tilt: 8, glow: 0.75, sway: 0.5, hover: null, rot: 0,
  };

  // Build `count` torus links evenly around a circle, each tilted 90° from the
  // next so they interlock like a real chain.
  const links = [];
  function buildLinks() {
    links.forEach((l) => { l.geometry.dispose(); l.material.dispose(); ring.remove(l); });
    links.length = 0;
    const m = METAL[state.metal] || METAL.gold;
    for (let i = 0; i < count; i++) {
      const geo = new THREE.TorusGeometry(0.62, state.thickness, 20, 48);
      const mat = new THREE.MeshStandardMaterial({
        color: m.color, emissive: m.emissive, emissiveIntensity: state.glow,
        metalness: 0.95, roughness: 0.28,
      });
      const link = new THREE.Mesh(geo, mat);
      link.userData.index = i;
      ring.add(link);
      links.push(link);
    }
    layout();
  }

  function layout() {
    const R = 2.4 * state.spacing;
    for (let i = 0; i < links.length; i++) {
      const a = (i / links.length) * Math.PI * 2;
      const link = links[i];
      link.position.set(Math.cos(a) * R, Math.sin(a) * R, 0);
      // orient each link tangent to the circle, alternating so they interlock
      link.rotation.set(i % 2 ? Math.PI / 2 : 0, 0, a + Math.PI / 2);
      link.userData.baseRot = link.rotation.clone();
    }
  }

  function resize() {
    const w = canvas.clientWidth || canvas.width || 800;
    const h = canvas.clientHeight || canvas.height || 600;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }

  buildLinks();
  resize();
  window.addEventListener('resize', resize);

  const clock = new THREE.Clock();
  let raf = 0, disposed = false;

  function frame() {
    if (disposed) return;
    const t = clock.getElapsedTime();
    const p = state.progress;

    // Ring rotates continuously (sway); a little faster near the finale.
    state.rot += (0.06 + p * 0.12) * state.sway * 0.6 * 0.016 * 60 * 0.016;
    ring.rotation.z = t * 0.15 * state.sway + p * 0.6;
    ring.rotation.x = (state.tilt * Math.PI / 180) * (0.4 + 0.6 * p);
    ring.scale.setScalar(state.scale * (0.72 + p * 0.28));

    // Camera pulls back as the section progresses so the full ring reveals.
    camera.position.z = 9 - p * 2.2;

    // Staggered assembly: each link fades/scales in across 0 → 0.75.
    for (let i = 0; i < links.length; i++) {
      const reveal = clamp01((p - (i / links.length) * 0.7) / 0.22);
      const link = links[i];
      const hovered = state.hover === i;
      const s = (0.2 + reveal * 0.8) * (hovered ? 1.18 : 1);
      link.scale.setScalar(s);
      link.material.opacity = reveal;
      link.material.transparent = reveal < 1;
      link.material.emissiveIntensity = state.glow * (hovered ? 2.2 : 1) * (0.4 + reveal * 0.6);
      // gentle individual sway
      const br = link.userData.baseRot;
      if (br) link.rotation.x = br.x + Math.sin(t * 0.8 + i) * 0.06;
    }

    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  function clamp01(v) { return Math.max(0, Math.min(1, v)); }

  return {
    setProgress(p) { state.progress = clamp01(p); },
    setScale(v) { state.scale = v; },
    setSpacing(v) { state.spacing = v; layout(); },
    setThickness(v) { if (v !== state.thickness) { state.thickness = v; buildLinks(); } },
    setMetal(v) { if (v !== state.metal) { state.metal = v; buildLinks(); } },
    setTilt(v) { state.tilt = v; },
    setGlow(v) { state.glow = v; },
    setSwaySpeed(v) { state.sway = v; },
    setHover(i) { state.hover = i; },
    getRotationDeg() { return (ring.rotation.z * 180 / Math.PI) % 360; },
    dispose() {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      links.forEach((l) => { l.geometry.dispose(); l.material.dispose(); });
      renderer.dispose();
    },
  };
}
