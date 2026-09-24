// LMR Capitals — hero focal: a few interlocking forged-gold chain links slowly
// turning with mouse parallax, so the hero sets the 3D tone from the first frame.
// Reuses the methodology monitor's link model + material language.
// API: createHeroFocal(canvas) -> { setMouse(x,y), resize(), dispose() }

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { makeLinkGeometry } from './desk-scene.js';

const GOLD = 0xF5A623;

export function createHeroFocal(canvas) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' }); }
  catch (e) { return { setMouse() {}, resize() {}, dispose() {} }; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;

  const scene = new THREE.Scene();
  try { const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; } catch (e) {}

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, 6.2);

  scene.add(new THREE.AmbientLight(0x2a3550, 0.6));
  const key = new THREE.DirectionalLight(0xfff2d6, 1.5); key.position.set(4, 6, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0x3a6bff, 0.6); rim.position.set(-6, -2, -3); scene.add(rim);
  const glow = new THREE.PointLight(GOLD, 1.8, 24, 2); glow.position.set(0, 0, 3.5); scene.add(glow);

  // three interlocking links, alternating orientation so they truly thread
  const root = new THREE.Group(); scene.add(root);
  const linkGeo = makeLinkGeometry(0.17, 0.13, 0.065);
  const LINKS = 3, SPACING = 0.17 + 0.13 + 0.10;
  const qFlat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI / 2);
  const qEdge = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2).multiply(qFlat);
  for (let i = 0; i < LINKS; i++) {
    const mat = new THREE.MeshStandardMaterial({ color: 0xC9922B, emissive: GOLD, emissiveIntensity: 0.32, metalness: 1.0, roughness: 0.16 });
    const m = new THREE.Mesh(linkGeo, mat);
    m.position.x = (i - (LINKS - 1) / 2) * SPACING;
    m.quaternion.copy(i % 2 ? qEdge : qFlat);
    root.add(m);
  }
  root.scale.setScalar(1.9);

  const state = { mx: 0, my: 0 };
  let mxE = 0, myE = 0, raf = 0, disposed = false, inView = true;
  const clock = new THREE.Clock();

  function resize() {
    const w = canvas.clientWidth || 600, h = canvas.clientHeight || 600;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  resize(); window.addEventListener('resize', resize);

  function frame() {
    raf = 0; if (disposed || !inView || document.hidden) return;
    const t = clock.getElapsedTime();
    mxE += (state.mx - mxE) * 0.05; myE += (state.my - myE) * 0.05;
    root.rotation.y = t * 0.35 + mxE * 0.5;
    root.rotation.x = 0.2 + Math.sin(t * 0.4) * 0.08 + myE * 0.4;
    glow.intensity = 1.6 + Math.sin(t * 1.5) * 0.3;
    renderer.render(scene, camera);
    if (!disposed && inView && !document.hidden) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && !disposed && inView && !document.hidden) raf = requestAnimationFrame(frame); }
  kick();
  let io = null;
  try { io = new IntersectionObserver((es) => { inView = es[0].isIntersecting; if (inView) kick(); }, { threshold: 0 }); io.observe(canvas); } catch (e) { inView = true; }
  function onVis() { if (!document.hidden) kick(); }
  document.addEventListener('visibilitychange', onVis);

  return {
    setMouse(x, y) { state.mx = x; state.my = y; kick(); },
    resize,
    dispose() {
      disposed = true; if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize); document.removeEventListener('visibilitychange', onVis); if (io) io.disconnect();
      scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
      renderer.dispose();
    },
  };
}
