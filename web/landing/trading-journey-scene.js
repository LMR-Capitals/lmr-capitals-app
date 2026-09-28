import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CHAPTERS, METHOD_COUNT, clamp, ease } from './journey-content.js';
import { drawJourneyDiagram } from './journey-diagrams.js';
import { notebookState } from './desk-choreography.js';

// One renderer, one desk, and an offscreen monitor feed. No actor or raster room image.
export function createTradingJourneyScene(canvas, { compact = false, onFailure = () => {} } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !compact, powerPreference: 'default' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.25 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .95;
  renderer.shadowMap.enabled = !compact;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  const resources = new Set();
  const own = resource => { resources.add(resource); return resource; };
  const pmrem = own(new THREE.PMREMGenerator(renderer));
  const environment = new RoomEnvironment();
  const environmentTarget = own(pmrem.fromScene(environment, 0.035));
  environment.dispose();
  scene.environment = environmentTarget.texture;
  const material = (color, roughness = .65, metalness = .1) => own(new THREE.MeshStandardMaterial({ color, roughness, metalness }));
  const black = material('#111823', .5, .45);
  const metal = material('#3a4554', .32, .8);
  const gold = material('#be8d42', .3, .85);
  const deskMaterial = material('#080e16', .84, .12);
  const matMaterial = material('#101c26', .96, 0);
  const mesh = (geometry, mat, parent = scene) => { const o = new THREE.Mesh(own(geometry), mat); o.castShadow = !compact; o.receiveShadow = !compact; parent.add(o); return o; };
  const box = (size, position, mat, parent = scene) => { const o = mesh(new THREE.BoxGeometry(...size), mat, parent); o.position.set(...position); return o; };
  function roundedPanel(w, h, d, r, mat, position, parent = scene) {
    const s = new THREE.Shape();
    s.moveTo(-w / 2 + r, -h / 2);
    s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    const o = mesh(new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: .025, bevelThickness: .025, curveSegments: 8 }), mat, parent);
    o.position.set(...position); return o;
  }
  scene.add(new THREE.HemisphereLight('#adcbe6', '#050912', .85));
  const key = new THREE.DirectionalLight('#fff2d9', 2.4); key.position.set(-5, 9, 8); key.castShadow = !compact; key.shadow.mapSize.set(1024,1024); key.shadow.camera.left=-9;key.shadow.camera.right=9;key.shadow.camera.top=9;key.shadow.camera.bottom=-9;key.shadow.normalBias=.025;scene.add(key);
  const rim = new THREE.DirectionalLight('#7898bc', 1.4); rim.position.set(6, 6, -4); scene.add(rim);
  const lamp = new THREE.PointLight('#ffd18b', 16, 18, 2); lamp.position.set(-3, 4, 1); scene.add(lamp);

  // Physical continuity: all desk objects stay mounted for every chapter.
  roundedPanel(13.5, 7.4, .25, .3, deskMaterial, [0, -.14, 1.25]).rotation.x = -Math.PI / 2;
  box([13.3, .024, .025], [0, -.11, 4.91], gold);
  const deskMat = roundedPanel(10.5, 5.1, .024, .23, matMaterial, [0, .155, 1.35]); deskMat.rotation.x = -Math.PI / 2;
  const matEdge = new THREE.LineSegments(own(new THREE.EdgesGeometry(new THREE.PlaneGeometry(10.1, 4.72))), own(new THREE.LineBasicMaterial({ color: '#53606c', transparent: true, opacity: .32 })));
  matEdge.rotation.x = -Math.PI / 2; matEdge.position.set(0, .18, 1.35); scene.add(matEdge);
  box([.45, 1.25, .32], [0, .7, -1.85], metal);
  roundedPanel(2.6, 1.3, .1, .2, metal, [0, .15, -1.68]).rotation.x = -Math.PI / 2;
  const screenW = 8.2, screenH = 4.45, screenY = 3.55, screenZ = -2.1;
  roundedPanel(screenW + .48, screenH + .48, .22, .16, metal, [0, screenY, screenZ - .2]);
  roundedPanel(screenW + .34, screenH + .34, .15, .1, black, [0, screenY, screenZ - .04]);
  box([screenW - .1, .025, .03], [0, screenY - screenH / 2 - .12, screenZ + .07], metal);
  const led = mesh(new THREE.SphereGeometry(.025, 8, 8), own(new THREE.MeshBasicMaterial({ color: '#f9cd80' })));
  led.position.set(screenW / 2 - .13, screenY - screenH / 2 - .13, screenZ + .1);

  // The monitor is a real render target, not a separately positioned DOM canvas.
  const target = own(new THREE.WebGLRenderTarget(compact ? 1024 : 1536, compact ? 576 : 864));
  target.texture.colorSpace = THREE.SRGBColorSpace;
  const screenMat = own(new THREE.MeshBasicMaterial({ map: target.texture, toneMapped: false }));
  const screen = mesh(new THREE.PlaneGeometry(screenW, screenH), screenMat);
  screen.position.set(0, screenY, screenZ + .14);
  screen.castShadow = false;
  const feed = new THREE.Scene(); feed.background = new THREE.Color('#081320'); feed.environment = environmentTarget.texture;
  const feedCamera = new THREE.PerspectiveCamera(34, 16 / 9, .1, 80);
  feedCamera.position.set(0, 0, 14.5);
  feed.add(new THREE.HemisphereLight('#e6eff9', '#152136', 2));
  const chainLight = new THREE.DirectionalLight('#fff3d8', 5); chainLight.position.set(3, 4, 7); feed.add(chainLight);
  const chainRim = new THREE.DirectionalLight('#698cad', 3); chainRim.position.set(-4, 2, -3); feed.add(chainRim);

  function canvasTexture(width, height) {
    const element = document.createElement('canvas'); element.width = width; element.height = height;
    const texture = own(new THREE.CanvasTexture(element)); texture.colorSpace = THREE.SRGBColorSpace;
    return { element, ctx: element.getContext('2d'), texture };
  }
  const feedArt = canvasTexture(1600, 900);
  const feedBackdrop = mesh(new THREE.PlaneGeometry(17.9, 10.1), own(new THREE.MeshBasicMaterial({ map: feedArt.texture })), feed);
  feedBackdrop.position.z = -1.2;
  const diagram = canvasTexture(720, 740);
  const diagramMaterial = own(new THREE.MeshBasicMaterial({ map: diagram.texture, transparent: true, toneMapped: false, depthWrite: false }));
  const diagramPlane = mesh(new THREE.PlaneGeometry(5.7, 5.86), diagramMaterial, feed);
  diagramPlane.position.set(2.55, -.2, -.3);
  // The requested timeframe diagrams replace the decorative metal chain model.

  // Keyboard, mouse, plan, and journal are authored geometry.
  roundedPanel(4.6, 1.48, .12, .1, black, [-.75, .24, -.55]).rotation.x = -Math.PI / 2;
  const caps = new THREE.InstancedMesh(own(new THREE.BoxGeometry(.27, .08, .24)), metal, 56);
  const transform = new THREE.Object3D();
  for (let i = 0; i < 56; i++) { transform.position.set(-2.85 + i % 14 * .32, .44, -1.07 + Math.floor(i / 14) * .31); transform.updateMatrix(); caps.setMatrixAt(i, transform.matrix); }
  scene.add(caps); box([1.6, .075, .22], [-.6, .44, .11], metal);
  const mouse = mesh(new THREE.SphereGeometry(1, 20, 12), black); mouse.scale.set(.43, .22, .69); mouse.position.set(2.35, .37, .12);
  box([.018, .014, .4], [2.35, .585, -.04], gold);

  const paper = canvasTexture(800, 1000);
  const paperMat = own(new THREE.MeshStandardMaterial({ map: paper.texture, roughness: .9 }));
  // A substantial notebook stays on the LEFT. The chapter display is the desk mat,
  // not a second book, and remains part of the same physical world through the tilt.
  roundedPanel(4.05, 4.6, .14, .07, black, [-3.02, .21, 2.4]).rotation.x = -Math.PI / 2;
  const pages = material('#b5b0a3', .92, 0);
  box([3.82, .1, 4.36], [-3.02, .39, 2.4], pages);
  const paperMesh = mesh(new THREE.PlaneGeometry(3.78, 4.34), paperMat);
  paperMesh.rotation.x = -Math.PI / 2; paperMesh.position.set(-3.02, .451, 2.4);
  for (let i = 0; i < 10; i++) {
    const binding = mesh(new THREE.TorusGeometry(.12, .025, 6, 12), metal);
    binding.rotation.y = Math.PI / 2; binding.position.set(-4.82, .47, .55 + i * .4);
  }
  const coverArt = canvasTexture(800, 1000);
  const coverPivot = new THREE.Group(); coverPivot.position.set(-5.045, .52, 2.4); scene.add(coverPivot);
  box([4.05, .10, 4.6], [2.025, 0, 0], black, coverPivot);
  const coverFace = mesh(new THREE.PlaneGeometry(3.94, 4.48), own(new THREE.MeshStandardMaterial({ map: coverArt.texture, roughness: .7 })), coverPivot);
  coverFace.rotation.x = -Math.PI / 2; coverFace.position.set(2.025, .057, 0);
  let lastCompleted = null;
  function drawCover(completed) {
    const c = coverArt.ctx;
    c.fillStyle = '#101e2c'; c.fillRect(0, 0, 800, 1000);
    c.strokeStyle = '#bd9655'; c.lineWidth = 2; c.strokeRect(45, 45, 710, 910);
    c.fillStyle = '#eac681'; c.font = '600 26px Archivo, sans-serif'; c.fillText('LMR CAPITALS', 80, 125);
    c.font = '700 83px Archivo, sans-serif'; c.fillText('THE CHAIN', 80, 425, 640);
    c.font = '600 34px Archivo, sans-serif'; c.fillText(completed ? 'COMPLETED' : 'START', 80, 495);
    c.fillStyle = '#d8e1e9'; c.font = '26px Archivo, sans-serif'; c.fillText('PLAN → DECISION → REVIEW', 80, 890, 640);
    coverArt.texture.needsUpdate = true;
  }
  // Flat fabric mouse pad beside the notebook; no tablet bezel or camera.
  roundedPanel(5.8, 4.46, .025, .10, matMaterial, [2.06, .20, 2.45]).rotation.x = -Math.PI / 2;
  const journalArt = canvasTexture(1200, 1050);
  const journalPage = mesh(new THREE.PlaneGeometry(5.5, 4.16), own(new THREE.MeshBasicMaterial({ map: journalArt.texture, toneMapped: false })));
  journalPage.rotation.x = -Math.PI / 2; journalPage.position.set(2.06, .235, 2.45);
  const pen = mesh(new THREE.CylinderGeometry(.045, .045, 2.2, 12), gold); pen.rotation.z = Math.PI / 2; pen.rotation.y = -.25; pen.position.set(-.78, .29, 3.85);

  function drawDesk(chapter) {
    const c = paper.ctx;
    c.fillStyle = '#bdb6a6'; c.fillRect(0, 0, 800, 1000);
    c.fillStyle = '#1d2630'; c.font = '600 25px sans-serif'; c.fillText('LMR CAPITALS / DAILY PLAN', 58, 85);
    c.fillRect(58, 117, 684, 2); c.font = 'bold 57px sans-serif'; c.fillText('Plan first.', 58, 217);
    c.fillText('Decide second.', 58, 290);
    (chapter.fields || ['CONTEXT', 'LOCATION', 'CONFIRMATION']).forEach((label, i) => { c.font = '600 22px sans-serif'; c.fillText(label.split(' / ')[0].toUpperCase(), 58, 414 + i * 155, 670); c.fillStyle = '#959a9b'; c.fillRect(58, 450 + i * 155, 650, 2); c.fillRect(58, 480 + i * 155, 460, 2); c.fillStyle = '#1d2630'; });
    c.font = '24px sans-serif'; c.fillText('A missing link is a reason to wait.', 58, 950); paper.texture.needsUpdate = true;
    const j = journalArt.ctx;
    j.fillStyle = '#0c1a26'; j.fillRect(0, 0, 1200, 1050);
    // Desktop uses crisp, selectable DOM text projected onto this same surface.
    if (!compact) { journalArt.texture.needsUpdate = true; return; }
    j.fillStyle = '#e5bd77'; j.font = '600 28px Archivo, sans-serif'; j.fillText('LMR / AT THE DESK', 65, 75);
    j.fillStyle = '#40556b'; j.fillRect(65, 110, 1070, 2);
    const wrap = (text, y, lineHeight) => {
      let line = '';
      for (const word of text.split(/\s+/)) {
        const next = line ? `${line} ${word}` : word;
        if (line && j.measureText(next).width > 1070) { j.fillText(line, 65, y); y += lineHeight; line = word; } else line = next;
      }
      j.fillText(line, 65, y); return y + lineHeight;
    };
    j.fillStyle = '#edf2f7'; j.font = '700 58px Archivo, sans-serif';
    let y = wrap(chapter.title, 205, 70) + 25;
    j.fillStyle = '#e5bd77'; j.font = '500 34px Archivo, sans-serif'; y = wrap(chapter.question, y, 46) + 25;
    j.fillStyle = '#dce6ef'; j.font = '34px Archivo, sans-serif'; y = wrap(chapter.copy, y, 49) + 30;
    j.font = '500 27px Archivo, sans-serif';
    chapter.fields.forEach(field => { j.fillStyle = '#40556b'; j.fillRect(65, y - 24, 1070, 1); j.fillStyle = '#e5bd77'; y = wrap(field, y + 13, 37) + 22; });
    journalArt.texture.needsUpdate = true;
  }
  function drawFeed(index) {
    const ctx = feedArt.ctx;
    ctx.fillStyle = '#081320'; ctx.fillRect(0, 0, 1600, 900);
    ctx.strokeStyle = '#142538'; ctx.lineWidth = 1;
    for (let x = 0; x < 1600; x += 100) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 900); ctx.stroke(); }
    for (let y = 0; y < 900; y += 100) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1600, y); ctx.stroke(); }
    ctx.fillStyle = '#c19b5e'; ctx.font = '600 20px Archivo, sans-serif'; ctx.fillText('LMR / THE CHAIN', 75, 70);
    ctx.fillStyle = '#8298af'; ctx.font = '18px Archivo, sans-serif'; ctx.fillText('CONTEXT → EXECUTION → REVIEW', 75, 850);
    ctx.textAlign='right';ctx.fillStyle='#e9c884';ctx.font='600 26px Archivo, sans-serif';ctx.fillText(`${String(index+1).padStart(2,'0')} / ${CHAPTERS[index].short.toUpperCase()}`,1515,70);ctx.textAlign='left';
    feedArt.texture.needsUpdate = true;
    drawJourneyDiagram(diagram.ctx, index); diagram.texture.needsUpdate = true;
  }

  let frame = 0, disposed = false, active = false, lastChapter = -1;
  let state = { phase: 'entry', chapter: 0, local: 0 };
  const look = new THREE.Vector3(), from = new THREE.Vector3(), to = new THREE.Vector3();
  function render() {
    frame = 0;
    if (disposed || !active || document.hidden) return;
    const { phase, chapter, local } = state;
    const stage = Math.min(chapter, 6);
    if (chapter !== lastChapter) { drawFeed(stage); drawDesk(CHAPTERS[chapter]); lastChapter = chapter; }
    const notebook = notebookState(state);
    coverPivot.rotation.z = notebook.open * 2.2;
    pen.position.set(THREE.MathUtils.lerp(-3.02, -.55, notebook.penAway), THREE.MathUtils.lerp(.64, .30, notebook.penAway) + Math.sin(notebook.penAway * Math.PI) * .8, THREE.MathUtils.lerp(3.0, 4.6, notebook.penAway));
    if (lastCompleted !== notebook.completed) { drawCover(notebook.completed); lastCompleted = notebook.completed; }
    const modelEnter = phase === 'method' ? ease(clamp(local / .15)) : 1;
    diagramMaterial.opacity = modelEnter;
    diagramPlane.position.x = 3.55 + (1 - modelEnter) * .65;
    diagramPlane.scale.setScalar(.96 + modelEnter * .04);
    // Fit, rather than cover: the four physical bezels remain visible at every
    // aspect ratio. Continue with the SAME camera and desk for the handoff.
    const aspect = camera.aspect;
    const monitorDistance = Math.max((screenW + .48) / (2 * Math.tan(THREE.MathUtils.degToRad(19)) * aspect),(screenH + .48) / (2 * Math.tan(THREE.MathUtils.degToRad(19)))) * 1.045;
    const wideDistance = compact ? 14 : 14.5;
    let entry = phase === 'entry' ? ease(local) : 1;
    let desk = phase === 'handoff' ? ease(local) : (phase === 'desk' || phase === 'exit') ? 1 : 0;
    from.set(compact ? 0 : -1, 6.5, screenZ + wideDistance);
    to.set(0, screenY, screenZ + monitorDistance);
    camera.position.copy(from).lerp(to, entry);
    look.set(compact ? 0 : THREE.MathUtils.lerp(-2.1,0,entry), THREE.MathUtils.lerp(1.8, screenY, entry), screenZ);
    if (desk > 0) {
      const back = ease(clamp(desk / .5));
      const tilt = ease(clamp((desk - .3) / .7));
      camera.position.lerp(new THREE.Vector3(compact ? 0 : -.7,5.3,screenZ+11.7),back);
      look.lerp(new THREE.Vector3(compact ? 0 : -1.2,2.4,screenZ),back);
      const deskDistance = compact ? 9.5 : Math.max(11.4 / (2 * Math.tan(THREE.MathUtils.degToRad(19)) * aspect), 6.1 / (2 * Math.tan(THREE.MathUtils.degToRad(19))));
      // End directly above the desk: notebook left, flat pad right, both full size.
      to.set(0,deskDistance,compact ? 6.6 : 2.401);
      camera.position.lerp(to,tilt);
      look.lerp(new THREE.Vector3(0,.15,compact ? 1.8 : 2.4),tilt);
    }
    if (phase === 'exit') { const exit = ease(local); camera.position.y += exit * 1.5; camera.position.z += exit * 1.8; }
    camera.lookAt(look);
    camera.updateMatrixWorld();
    if ((phase === 'desk' || phase === 'handoff') && !compact) {
      const rect = canvas.getBoundingClientRect();
      const a = new THREE.Vector3(-.69,.235,.37).project(camera);
      const b = new THREE.Vector3(4.81,.235,4.53).project(camera);
      const style = canvas.parentElement.parentElement.style;
      style.setProperty('--pad-x', `${(a.x+1)*rect.width/2}px`);
      style.setProperty('--pad-y', `${(1-a.y)*rect.height/2}px`);
      style.setProperty('--pad-width', `${(b.x-a.x)*rect.width/2}px`);
      style.setProperty('--pad-height', `${(a.y-b.y)*rect.height/2}px`);
    }
    if (phase === 'method' && !compact) {
      const rect = canvas.getBoundingClientRect();
      const a = new THREE.Vector3(-screenW/2,screenY+screenH/2,screenZ+.14).project(camera);
      const b = new THREE.Vector3(screenW/2,screenY-screenH/2,screenZ+.14).project(camera);
      const style = canvas.parentElement.parentElement.style;
      style.setProperty('--screen-x', `${(a.x+1)*rect.width/2}px`);
      style.setProperty('--screen-y', `${(1-a.y)*rect.height/2}px`);
      style.setProperty('--screen-width', `${(b.x-a.x)*rect.width/2}px`);
      style.setProperty('--screen-height', `${(a.y-b.y)*rect.height/2}px`);
    }
    renderer.setRenderTarget(target); renderer.render(feed, feedCamera);
    renderer.setRenderTarget(null); renderer.render(scene, camera);
  }
  function schedule() { if (!frame && active && !disposed && !document.hidden) frame = requestAnimationFrame(render); }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    renderer.setSize(rect.width, rect.height, false); camera.aspect = rect.width / rect.height; camera.updateProjectionMatrix(); schedule();
  }
  const observer = new ResizeObserver(resize); observer.observe(canvas);
  const onVisibility = () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else schedule(); };
  const onLost = event => { event.preventDefault(); onFailure(); };
  canvas.addEventListener('webglcontextlost', onLost);
  document.addEventListener('visibilitychange', onVisibility);
  resize();
  // Repaint text textures when Archivo finishes loading; no continuous render loop.
  document.fonts?.ready.then(() => { if (!disposed) { lastChapter = -1; lastCompleted = null; schedule(); } });
  return {
    setProgress(next) { state = next; schedule(); },
    setActive(value) { active = value; if (value) schedule(); else { cancelAnimationFrame(frame); frame = 0; } },
    resize,
    dispose() {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility); canvas.removeEventListener('webglcontextlost', onLost);
      resources.forEach(resource => resource.dispose()); renderer.dispose();
    },
  };
}
