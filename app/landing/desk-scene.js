// LMR Capitals — "The Chain" cinematic desk scene for the #method section.
//
// A fully in-code (Blender-style) 3D room: a trader's desk with a monitor.
// The monitor's screen is alive — it renders the interlocking Chain. Scroll
// choreographs a single continuous camera move:
//
//   establish (wide room shot)  →  fly INTO the glowing screen  →
//   the Chain assembles link-by-link "inside" the display  →
//   pull BACK OUT so the content shrinks back into the monitor on the desk.
//
// The React overlay copy (the 7 stages) is synced to the same scroll progress,
// so the words appear to come out of the screen and return to it.
//
// API: createDeskScene(canvas) -> { setProgress(p), setMouse(x,y), resize(), dispose() }
// Never throws to the caller (returns a no-op shim on WebGL failure).

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const GOLD = 0xF5A623;
const GOLD2 = 0xFFD166;

// screen geometry (world units) — 16:10, sitting on the desk
const SCREEN_W = 3.4;
const SCREEN_H = 2.12;
const SCREEN_CX = 0;
const SCREEN_CY = 0.66;
const SCREEN_CZ = -1.0;   // screen face sits a touch in front of the bezel back

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const smooth = (e0, e1, x) => { const t = clamp01((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };

export function createDeskScene(canvas) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch (e) { return noop(); }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x04060c, 0.055);

  // Procedural studio environment — gives every metal surface something real to
  // reflect (no downloaded HDRI needed). This is what makes the iron read as
  // forged metal instead of flat plastic.
  try {
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  } catch (e) { /* env is a nicety; scene still renders without it */ }

  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 120);

  // ── lighting ──────────────────────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0x2a3550, 0.55));
  const key = new THREE.DirectionalLight(0xfff2d6, 1.35);
  key.position.set(5, 8, 6); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); key.shadow.camera.near = 1; key.shadow.camera.far = 30;
  key.shadow.camera.left = -8; key.shadow.camera.right = 8; key.shadow.camera.top = 8; key.shadow.camera.bottom = -8;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x3a6bff, 0.5); rim.position.set(-6, 3, -4); scene.add(rim);
  scene.add(new THREE.HemisphereLight(0x8fa6cc, 0x0a0e17, 0.55)); // gives the iron links dimension
  // the glow the monitor itself throws onto the desk + bezel (warm gold)
  const screenLight = new THREE.PointLight(GOLD, 1.5, 9, 2.0);
  screenLight.position.set(SCREEN_CX, SCREEN_CY, SCREEN_CZ + 0.5);
  scene.add(screenLight);

  // ── room: floor + back wall ────────────────────────────────────────────────
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x0a0e17, roughness: 0.85, metalness: 0.1 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), floorMat);
  floor.rotation.x = -Math.PI / 2; floor.position.y = -2.2; floor.receiveShadow = true;
  scene.add(floor);
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x070b14, roughness: 1 });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(60, 34), wallMat);
  wall.position.set(0, 6, -9); scene.add(wall);

  // ── the desk ────────────────────────────────────────────────────────────────
  const desk = new THREE.Group(); scene.add(desk);
  const deskTopMat = new THREE.MeshStandardMaterial({ color: 0x171c26, roughness: 0.55, metalness: 0.35 });
  const deskTop = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.22, 3.2), deskTopMat);
  deskTop.position.set(0, -1.22, -0.5); deskTop.castShadow = true; deskTop.receiveShadow = true;
  desk.add(deskTop);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x0c1018, roughness: 0.7, metalness: 0.3 });
  [[-3.2, -1.9], [3.2, -1.9], [-3.2, 0.9], [3.2, 0.9]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.7, 0.16), legMat);
    leg.position.set(x, -2.05, z - 0.5); leg.castShadow = true; desk.add(leg);
  });
  // desk mat (a soft dark pad under the gear)
  const padMat = new THREE.MeshStandardMaterial({ color: 0x0b0f18, roughness: 0.95 });
  const pad = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.03, 1.9), padMat);
  pad.position.set(0, -1.10, 0.15); pad.receiveShadow = true; desk.add(pad);

  // keyboard + mouse + mug for lived-in detail
  const kbMat = new THREE.MeshStandardMaterial({ color: 0x10151f, roughness: 0.6, metalness: 0.4 });
  const keyboard = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.08, 0.62), kbMat);
  keyboard.position.set(-0.15, -1.06, 0.5); keyboard.castShadow = true; desk.add(keyboard);
  const mouse = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.07, 0.4), kbMat);
  mouse.position.set(1.25, -1.06, 0.5); mouse.castShadow = true; desk.add(mouse);
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.32, 20), new THREE.MeshStandardMaterial({ color: 0x1a2130, roughness: 0.5, metalness: 0.5 }));
  mug.position.set(-1.95, -0.98, 0.35); mug.castShadow = true; desk.add(mug);

  // ── the monitor ──────────────────────────────────────────────────────────────
  const monitor = new THREE.Group(); scene.add(monitor);
  const bezelMat = new THREE.MeshStandardMaterial({ color: 0x05070c, roughness: 0.35, metalness: 0.7 });
  // bezel: a slab slightly larger than the screen, screen carved by placing the
  // display plane just in front of it
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(SCREEN_W + 0.26, SCREEN_H + 0.26, 0.16), bezelMat);
  bezel.position.set(SCREEN_CX, SCREEN_CY, SCREEN_CZ - 0.09); bezel.castShadow = true; monitor.add(bezel);
  // stand + base
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.7, 0.16), bezelMat);
  stand.position.set(SCREEN_CX, SCREEN_CY - SCREEN_H / 2 - 0.28, SCREEN_CZ - 0.12); stand.castShadow = true; monitor.add(stand);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 0.06, 32), bezelMat);
  base.position.set(SCREEN_CX, -1.10, SCREEN_CZ - 0.05); base.castShadow = true; monitor.add(base);

  // the live screen — an unlit textured plane (always reads as "on")
  const screenTex = makeScreenTexture();
  const screenMat = new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN_W, SCREEN_H), screenMat);
  screen.position.set(SCREEN_CX, SCREEN_CY, SCREEN_CZ + 0.005);
  monitor.add(screen);

  // ── the Chain — a clean straight run of real interlocking iron links ─────────
  // Seven elongated links (rounded-rectangle loops, not O-rings) laid left→right
  // — one per stage of the methodology. Each is threaded through its neighbour
  // and turned 90° so they truly interlock. Forged iron (reflecting the studio
  // env); they warm to gold as the chain turns and, once every link is
  // connected, pulse gold together.
  const CHAIN_CX = SCREEN_CX + 0.72;       // sits to the right; the copy block owns the left of the screen
  const CHAIN_CY = SCREEN_CY + 0.12;       // roughly centred vertically
  const chain = new THREE.Group();
  chain.position.set(CHAIN_CX, CHAIN_CY, SCREEN_CZ + 0.02);
  chain.scale.setScalar(0.60);             // whole 7-link chain fits inside the right of the screen, clear of the copy
  scene.add(chain);

  const LINKS = 7;
  const LINK_A = 0.16;    // straight-section half-length (link "length")
  const LINK_B = 0.12;    // end-cap radius (link "width")
  const LINK_T = 0.06;    // iron thickness (tube radius) — chunky forged stock
  const SPACING = LINK_A + LINK_B + 0.10;   // centre-to-centre → neighbours interlock without clumping
  const linkGeo = makeLinkGeometry(LINK_A, LINK_B, LINK_T);
  const links = [];
  const linkMat = () => new THREE.MeshStandardMaterial({ color: 0xC9922B, emissive: GOLD, emissiveIntensity: 0, metalness: 1.0, roughness: 0.17, transparent: true, opacity: 0 });
  const qFlat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI / 2); // long axis → X
  const qEdge = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2).multiply(qFlat); // +90° about run axis
  for (let i = 0; i < LINKS; i++) {
    const mesh = new THREE.Mesh(linkGeo, linkMat());
    mesh.castShadow = true;
    mesh.position.set((i - (LINKS - 1) / 2) * SPACING, 0, 0);
    mesh.quaternion.copy(i % 2 ? qEdge : qFlat);
    mesh.userData = { i, baseQ: (i % 2 ? qEdge : qFlat).clone() };
    chain.add(mesh); links.push(mesh);
  }

  // ── camera keyframes ─────────────────────────────────────────────────────────
  // fill distance so the screen height fills the frame with a small margin
  const vfov = (camera.fov * Math.PI) / 180;
  const fillD = (SCREEN_H * 0.74) / Math.tan(vfov / 2);   // a little breathing room around the chain
  const K = {
    est: { pos: [2.5, 1.75, 5.4], look: [0, 0.12, SCREEN_CZ], fov: 47 },  // wide establishing
    pre: { pos: [0.9, 1.05, 3.2], look: [0, 0.55, SCREEN_CZ], fov: 45 },  // approaching, straightening
    in: { pos: [SCREEN_CX, SCREEN_CY + 0.10, SCREEN_CZ + 3.75], look: [SCREEN_CX, SCREEN_CY, SCREEN_CZ], fov: 40 }, // monitor framed — the chain sits inside the screen, bezel visible
    out: { pos: [-1.9, 1.5, 5.0], look: [0, 0.2, SCREEN_CZ], fov: 47 },   // pulled back, new angle → hands off to Conviction
  };

  function camAt(p) {
    let A, B, t;
    if (p < 0.10) { A = K.est; B = K.pre; t = easeInOut(p / 0.10); }
    else if (p < 0.16) { A = K.pre; B = K.in; t = easeInOut((p - 0.10) / 0.06); }
    else if (p < 0.86) { A = K.in; B = K.in; t = 0; }               // hold framed on the monitor for the journey
    else { A = K.in; B = K.out; t = easeInOut((p - 0.86) / 0.14); }
    return {
      px: lerp(A.pos[0], B.pos[0], t), py: lerp(A.pos[1], B.pos[1], t), pz: lerp(A.pos[2], B.pos[2], t),
      lx: lerp(A.look[0], B.look[0], t), ly: lerp(A.look[1], B.look[1], t), lz: lerp(A.look[2], B.look[2], t),
      fov: lerp(A.fov, B.fov, t),
    };
  }

  // ── state / loop ──────────────────────────────────────────────────────────────
  const state = { p: 0, mx: 0, my: 0 };
  let mxE = 0, myE = 0;

  // ── bloom post-processing (for the "Connected in Full Circle" finale glow) ──
  let composer = null, bloom = null;
  try {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.2, 0.6, 0.82);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
  } catch (e) { composer = null; }

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    if (composer) composer.setSize(w, h);
  }
  resize();
  window.addEventListener('resize', resize);

  const clock = new THREE.Clock();
  let raf = 0, disposed = false;

  function frame() {
    if (disposed) return;
    const t = clock.getElapsedTime();
    const p = state.p;

    // ease mouse; suppress parallax while we're "inside" the screen so it stays legible
    const parallax = 1 - smooth(0.34, 0.44, p) * (1 - smooth(0.80, 0.90, p));
    mxE += (state.mx - mxE) * 0.05; myE += (state.my - myE) * 0.05;

    const c = camAt(p);
    camera.position.set(c.px + mxE * 0.5 * parallax, c.py - myE * 0.35 * parallax, c.pz);
    camera.lookAt(c.lx, c.ly, c.lz);
    if (Math.abs(camera.fov - c.fov) > 0.01) { camera.fov = c.fov; camera.updateProjectionMatrix(); }

    // ── in-monitor methodology journey ───────────────────────────────────────
    // Focus travels down the chain, forging one link per stage; the active link
    // pops + glows gold, forged links stay lit, upcoming links wait as dim iron.
    // At the end every link glows together, then the camera pulls back out.
    const jp = clamp01((p - 0.16) / 0.70);                 // 0..1 across the 7-stage journey
    const stageF = jp * LINKS;                              // 0..7 continuous
    const appear = smooth(0.15, 0.24, p);                  // whole chain fades in together and stays
    const connected = smooth(LINKS - 0.6, LINKS - 0.02, stageF); // all glow together at the finale
    // shallow 3/4 view; whole chain fixed and fully inside the screen (no panning),
    // no per-link forge — the GLOW travels down it link by link.
    chain.rotation.x = 0.34 + Math.sin(t * 0.35) * 0.02;
    chain.rotation.y = 0.46 + Math.sin(t * 0.45) * 0.03;  // stronger 3/4 so even end links show their loop (no edge-on hooks)
    chain.position.x = CHAIN_CX;
    const togetherPulse = connected * (0.15 + 0.15 * (0.5 + 0.5 * Math.sin(t * 2.0)));
    const activeF = stageF - 0.5;                           // continuous active-link index
    for (let i = 0; i < links.length; i++) {
      const l = links[i];
      const focus = Math.max(0, 1 - Math.abs(activeF - i) / 0.9); // brightest at the active link
      l.material.opacity = appear;                         // every link present once inside
      l.position.y = 0;
      l.position.z = focus * 0.12;                         // active link steps slightly forward
      l.scale.setScalar(0.98 + focus * 0.18);             // modest active pop — no lone giant link
      // polished gold; the active link glows brightest, all glow together at the end
      l.material.emissiveIntensity = appear * 0.05 + focus * 0.5 + togetherPulse;
    }

    // screen glow breathes; brighter while inside
    screenLight.intensity = 1.1 + 0.8 * smooth(0.10, 0.18, p) + Math.sin(t * 1.3) * 0.1;

    // bloom: subtle throughout, blooms up as the chain connects in full circle
    if (bloom) bloom.strength = 0.18 + connected * 1.15 + togetherPulse * 0.3;
    if (composer) composer.render(); else renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  function onVis() { if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = 0; } else if (!raf && !disposed) { raf = requestAnimationFrame(frame); } }
  document.addEventListener('visibilitychange', onVis);

  // Project the monitor screen's rectangle to CSS pixels so the HTML overlay can
  // lock to it (consistent placement on any display, not fixed viewport %).
  function getScreenRect() {
    const w = window.innerWidth, h = window.innerHeight;
    const proj = (x, y) => {
      const v = new THREE.Vector3(x, y, SCREEN_CZ + 0.005).project(camera);
      return { x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h };
    };
    const tl = proj(SCREEN_CX - SCREEN_W / 2, SCREEN_CY + SCREEN_H / 2);
    const br = proj(SCREEN_CX + SCREEN_W / 2, SCREEN_CY - SCREEN_H / 2);
    return { x: tl.x, y: tl.y, w: br.x - tl.x, h: br.y - tl.y };
  }

  return {
    setProgress(p) { state.p = clamp01(p); },
    setMouse(x, y) { state.mx = x; state.my = y; },
    getScreenRect,
    resize,
    dispose() {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
      scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) { const m = o.material; (Array.isArray(m) ? m : [m]).forEach((mm) => { if (mm.map) mm.map.dispose(); mm.dispose(); }); } });
      if (composer) composer.dispose();
      renderer.dispose();
    },
  };
}

// A real industrial chain link: a rounded-rectangle ("stadium") loop swept with
// a circular cross-section. Two straight sides + two semicircular caps — the
// classic elongated link, not an O-ring. a = straight half-length, b = cap
// radius, t = iron thickness.
export class LinkCurve extends THREE.Curve {
  constructor(a, b) { super(); this.a = a; this.b = b; this.total = 4 * a + 2 * Math.PI * b; }
  getPoint(u, target = new THREE.Vector3()) {
    const { a, b, total } = this;
    const s = u * total;
    const s1 = 2 * a, s2 = s1 + Math.PI * b, s3 = s2 + 2 * a;
    let x, y;
    if (s < s1) { x = b; y = -a + s; }                                   // right straight ↑
    else if (s < s2) { const f = (s - s1) / b; x = b * Math.cos(f); y = a + b * Math.sin(f); }   // top cap
    else if (s < s3) { x = -b; y = a - (s - s2); }                       // left straight ↓
    else { const f = (s - s3) / b; x = -b * Math.cos(f); y = -a - b * Math.sin(f); }             // bottom cap
    return target.set(x, y, 0);
  }
}
export function makeLinkGeometry(a, b, t) {
  return new THREE.TubeGeometry(new LinkCurve(a, b), 150, t, 14, true);
}

// A dark "display" texture: subtle grid, gold vignette, and a live label — so
// even before the chain fills it, the panel reads unmistakably as a monitor.
function makeScreenTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 640;
  const g = c.getContext('2d');
  const bg = g.createRadialGradient(512, 200, 60, 512, 320, 720);
  bg.addColorStop(0, '#0a1120'); bg.addColorStop(1, '#03060c');
  g.fillStyle = bg; g.fillRect(0, 0, 1024, 640);
  // faint grid
  g.strokeStyle = 'rgba(90,120,180,0.10)'; g.lineWidth = 1;
  for (let x = 0; x <= 1024; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 640); g.stroke(); }
  for (let y = 0; y <= 640; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(1024, y); g.stroke(); }
  // top gold vignette
  const gold = g.createLinearGradient(0, 0, 0, 260);
  gold.addColorStop(0, 'rgba(245,166,35,0.20)'); gold.addColorStop(1, 'rgba(245,166,35,0)');
  g.fillStyle = gold; g.fillRect(0, 0, 1024, 260);
  // labels
  g.fillStyle = 'rgba(245,166,35,0.85)'; g.font = '700 22px Archivo, system-ui, sans-serif';
  g.fillText('THE CHAIN · LIVE', 40, 54);
  g.fillStyle = 'rgba(174,185,204,0.5)'; g.font = '600 15px Archivo, system-ui, sans-serif';
  g.fillText('LMR CAPITALS · DAILY → WEEKLY → MONTHLY', 40, 604);
  // corner brackets
  g.strokeStyle = 'rgba(245,166,35,0.5)'; g.lineWidth = 2;
  const br = 28;
  [[40, 78, 1, 1], [984, 78, -1, 1], [40, 574, 1, -1], [984, 574, -1, -1]].forEach(([x, y, sx, sy]) => {
    g.beginPath(); g.moveTo(x, y + sy * br); g.lineTo(x, y); g.lineTo(x + sx * br, y); g.stroke();
  });
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

function noop() {
  return { setProgress() {}, setMouse() {}, resize() {}, dispose() {} };
}
