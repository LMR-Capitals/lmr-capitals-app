// LMR Capitals — landing page (React port of the Claude Design "The Chain" page).
// Faithful transcription of the design component: cinematic monitor-zoom intro,
// the three.js Chain (#method), the scroll-driven Conviction sequence, the
// indicators, certificate marquee, and the reverse outro. Sign-in CTAs route
// into the app (/) → signup → paywall.

import React from 'react';
import { createRoot } from 'react-dom/client';
import { createChainScene } from './chain-scene.js';

/* Parse an inline-CSS string into a React style object so the design's original
   style strings can be reused verbatim. Custom props (--x) pass through. */
function css(str) {
  const o = {};
  if (!str) return o;
  for (const decl of String(str).split(';')) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    const k = decl.slice(0, i).trim();
    const v = decl.slice(i + 1).trim();
    if (!k) continue;
    if (k.startsWith('--')) { o[k] = v; continue; }
    o[k.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = v;
  }
  return o;
}
const goApp = () => { window.location.href = '/'; };

function ImageSlot({ label, src, style }) {
  if (src) return <img src={src} alt="" className="grayscale" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...style }} />;
  return (
    <div data-image-slot={label} style={{ width: '100%', height: '100%', minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#0b1524,#060b14)', color: '#3c4b66', fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', textAlign: 'center', padding: 14, lineHeight: 1.5, ...style }}>
      {label}
    </div>
  );
}

class Landing extends React.Component {
  state = { introP: 0, chainP: 0, activeCard: null, morphRect: null, morphed: false, outroP: 0, convSeqP: 0, ringRotationDeg: 0 };
  introEl = null; chainEl = null;

  setIntroRef = (el) => { this.introEl = el; };
  setChainRef = (el) => { this.chainEl = el; };
  setOutroRef = (el) => { this.outroEl = el; };
  setContentBezelRef = (el) => { this.contentBezelEl = el; };
  setConvSeqRef = (el) => { this.convSeqEl = el; };
  setChainCanvasRef = (el) => { this.chainCanvasEl = el; };

  goToConvSeq = (i) => {
    if (!this.convSeqEl) return;
    const rect = this.convSeqEl.getBoundingClientRect();
    const targetLocal = (i + 0.5) * 0.25;
    const travel = this.convSeqEl.offsetHeight - window.innerHeight;
    const targetY = window.scrollY + rect.top + targetLocal * travel;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  };

  calcProgress(el) {
    if (!el) return 0;
    const vh = window.innerHeight;
    const r = el.getBoundingClientRect();
    const total = r.height - vh;
    if (total <= 0) return 1;
    return Math.min(1, Math.max(0, -r.top / total));
  }

  onScroll = () => {
    const introP = this.calcProgress(this.introEl);
    const chainP = this.calcProgress(this.chainEl);
    const outroP = this.calcProgress(this.outroEl);
    const convSeqP = this.calcProgress(this.convSeqEl);
    if (Math.abs(introP - this.state.introP) > 0.002 || Math.abs(chainP - this.state.chainP) > 0.002 || Math.abs(outroP - (this.state.outroP || 0)) > 0.002 || Math.abs(convSeqP - (this.state.convSeqP || 0)) > 0.002) {
      this.setState({ introP, chainP, outroP, convSeqP });
    }
  };

  componentDidMount() {
    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', this.onScroll);
    this.onScroll();
    if (this.chainCanvasEl) {
      createChainScene(this.chainCanvasEl, { count: 7, extraRing: 0 }).then((scene) => {
        this.chainScene = scene;
        this._ringSyncLoop();
        scene.setScale(this.props.chainScale ?? 1);
        scene.setSpacing(this.props.chainSpacing ?? 1.1);
        scene.setThickness(this.props.chainThickness ?? 0.18);
        scene.setMetal(this.props.chainMetal ?? 'gold');
        this._lastMetal = this.props.chainMetal ?? 'gold';
      }).catch(() => {});
    }
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onScroll);
    if (this.chainScene) this.chainScene.dispose();
    if (this._ringSyncRaf) cancelAnimationFrame(this._ringSyncRaf);
  }

  _ringSyncLoop = () => {
    if (this.chainScene) {
      const deg = this.chainScene.getRotationDeg();
      if (Math.abs((deg || 0) - (this.state.ringRotationDeg || 0)) > 0.3) this.setState({ ringRotationDeg: deg });
    }
    this._ringSyncRaf = requestAnimationFrame(this._ringSyncLoop);
  };

  combinedMove = (e) => {
    const el = e.currentTarget; const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    el.style.setProperty('--spot', '1');
    const dx = (e.clientX - r.left - r.width / 2) * 0.05;
    const dy = (e.clientY - r.top - r.height / 2) * 0.05;
    el.style.transform = `translate(${dx}px, ${dy}px)`;
  };
  combinedLeave = (e) => { const el = e.currentTarget; el.style.setProperty('--spot', '0'); el.style.transform = 'translate(0,0)'; };
  closeDialog = (e) => { if (e) e.stopPropagation(); this.setState({ morphed: false }); setTimeout(() => this.setState({ activeCard: null, morphRect: null }), 400); };
  stop = (e) => { e.stopPropagation(); };
  openCard2(e, item) {
    const rect = e.currentTarget.getBoundingClientRect();
    this.setState({ activeCard: item, morphRect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height }, morphed: false });
    requestAnimationFrame(() => requestAnimationFrame(() => this.setState({ morphed: true })));
  }

  renderVals() {
    const introP = this.state.introP;
    const chainP = this.state.chainP;
    const screenStyle = {
      position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
      width: (38 + introP * 62) + 'vw', height: (24 + introP * 76) + 'vh',
      borderRadius: (14 - introP * 14) + 'px', overflow: 'hidden',
      border: (2 - introP * 2) + 'px solid rgba(245,166,35,0.55)',
      boxShadow: '0 0 ' + (40 + introP * 20) + 'px rgba(245,166,35,' + (0.12 + introP * 0.08) + ')',
      background: '#060B14',
    };
    const roomOpacity = Math.max(0, 1 - introP * 1.6);
    const noteColors = { yellow: ['#e8cf6a', '#d9bd4f'], white: ['#eceae0', '#dcd9cc'], blue: ['#a9c9dd', '#8fb3cb'], green: ['#b7cf9f', '#a0bd85'] };
    const textColors = { yellow: ['#2b2405', '#4a4014'], white: ['#20201c', '#4a483f'], blue: ['#122430', '#33505f'], green: ['#1e2b12', '#3d4d2c'] };
    const stickyNoteData = [
      { title: 'Position Sizing Catastrophe', copy: 'Over-positioning repeatedly; taking full size when you should be taking partials.', top: '13%', left: '4%', rot: -9, color: 'yellow' },
      { title: 'Greedy Execution', copy: "Refusing to take profits at key levels, then revenge trading the same setup without fresh context.", top: '18%', left: '24%', rot: 6, color: 'blue' },
      { title: 'Capital Disrespect', copy: "Trading sizes that don't match your account; no risk management discipline.", top: '12%', left: '45%', rot: -4, color: 'green' },
      { title: 'Selective Trading', copy: "Trading during London when your setups don't form; forcing trades in dead time.", top: '20%', left: '66%', rot: 8, color: 'white' },
      { title: 'Profit-to-Loss Conversion', copy: 'Converting winning trades into losses by holding too long or re-entering emotionally.', top: '13%', left: '85%', rot: -6, color: 'yellow' },
      { title: 'Context Blindness', copy: 'Missing HTF confirmation; trading setups without verifying the broader framework is "Delivered".', top: '38%', left: '2%', rot: 5, color: 'green' },
      { title: 'Fear-Based Paralysis', copy: 'Fear of blowing the funded account ironically causes you to skip winning trades entirely.', top: '32%', left: '81%', rot: -7, color: 'blue' },
      { title: 'Emotional Override', copy: 'Focusing on the number, not the process — you know the models but emotions hijack execution.', top: '58%', left: '7%', rot: 7, color: 'white' },
    ];
    const stickyNotes = stickyNoteData.map((n) => {
      const [c1, c2] = noteColors[n.color]; const [t1, t2] = textColors[n.color];
      return {
        title: n.title, copy: n.copy, titleColor: t1, copyColor: t2,
        style: { position: 'absolute', top: n.top, left: n.left, width: '168px', transform: `rotate(${n.rot}deg)`, background: `linear-gradient(178deg, ${c1}, ${c2})`, boxShadow: '0 10px 18px -6px rgba(0,0,0,0.55), 0 2px 4px rgba(0,0,0,0.35)', padding: '16px 12px 12px', borderRadius: '2px', opacity: roomOpacity, pointerEvents: 'none' },
        pinStyle: { position: 'absolute', top: '-6px', left: '50%', transform: 'translateX(-50%)', width: '10px', height: '10px', borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #e8574a, #9c2317)', boxShadow: '0 2px 3px rgba(0,0,0,0.5)' },
      };
    });
    const heroTextOpacity = Math.min(1, Math.max(0.85, (introP - 0.15) / 0.55));
    const heroTextTranslate = Math.round((1 - heroTextOpacity) * 16);
    const heroContentScale = 0.34 + introP * 0.66;
    const heroContentStyle = { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', padding: 'clamp(20px,6vw,110px)', opacity: heroTextOpacity, transform: `translateY(${heroTextTranslate}px) scale(${heroContentScale})`, transformOrigin: 'left center' };
    const flyT = Math.min(1, Math.max(0, (introP - 0.85) / 0.15));
    const flyEase = flyT * flyT * (3 - 2 * flyT);
    const chainBigT = Math.min(1, introP / 0.3);
    const chainBigOpacity = 1 - chainBigT;
    const chainBigScale = 1 + (1 - chainBigT) * 0.4;
    const chainFlyStyle = { color: '#F5A623', display: 'inline-block', textShadow: `0 0 ${20 + flyEase * 30}px rgba(245,166,35,${0.6 + flyEase * 0.4})`, transition: 'text-shadow .2s ease' };
    const restLineOpacity = chainBigT;
    const restLineStyle = { display: 'block', fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#FBC873', margin: '0 0 14px', opacity: restLineOpacity };
    const restLineBlockStyle = { display: 'block', opacity: restLineOpacity };
    const restLineParaStyle = { fontSize: 'clamp(13px,1.3vw,17px)', lineHeight: 1.6, maxWidth: '52ch', margin: '20px 0 0', color: 'color-mix(in srgb, #EDEFF3 82%, transparent)', opacity: restLineOpacity };
    const restLineRowStyle = { display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '24px', opacity: restLineOpacity };
    const scrollHintOpacity = Math.max(0, 1 - introP * 4);

    const pillars = [
      { num: '01', title: 'Trading Journal & Track Record', copy: 'Every trade — entry, exit, model, session, risk, and result — is logged in real time.', detail: 'Daily, weekly, and monthly reports turn raw data into a transparent track record, reviewed honestly, wins and losses alike — the same ledger that backs every public result LMR Capitals shows.' },
      { num: '02', title: 'Education & Mentorship', copy: 'I teach the LMR methodology to traders who want structure over guesswork.', detail: 'The MMBM/MMSM weekly models, session profiling, HTF bias, and the psychology of staying consistent under pressure — taught from the exact playbook run in the live journal, not a simplified version of it.' },
      { num: '03', title: 'Fund & Signal Management', copy: 'For clients seeking disciplined, rules-based exposure.', detail: "LMR Capitals offers managed accounts and trade signals built on the exact process documented in this journal — full transparency, no black boxes, no strategy you can't see reasoned through in real time." },
    ];
    const chainStages = [
      { title: 'LMR Methodology', copy: 'The master framework binding every link — the shared language, rules, and philosophy that every other card in the chain inherits from.' },
      { title: 'The Monthly Chain', copy: 'Monthly analysis tracks the broader quarterly shift (STS/LTS bias) and market profile — trending, retracing, consolidating, or manipulative — to keep every smaller decision aligned with the bigger picture.' },
      { title: 'The Weekly Chain', copy: 'Every week is mapped against the MMBM and MMSM weekly models, identifying the dominant profile and how price is expected to deliver across the five sessions ahead.' },
      { title: 'The Daily Chain', copy: 'Each day begins with a defined bias, key HTF points of interest, and a session plan — then closes with a full review of execution, P&L, and lessons before the next link forms.' },
      { title: 'Session Profiling', copy: 'London and New York sessions are each classified — Accumulation, Manipulation, Distribution, Rebalance/Reversal, Retracement/Continuation — to anticipate how price should move before it moves.' },
      { title: 'The Trade', copy: 'Every trade is tagged with its model, session, emotion, and outcome — the link every other link exists to set up cleanly.' },
      { title: 'Discipline & Journaling', copy: 'The final link that closes the loop — daily review and honest logging feed straight back into the methodology, starting the chain again.' },
    ];
    const metal = this.props.chainMetal ?? 'gold';
    const tilt = this.props.chainTilt ?? 8;
    const glow = this.props.chainGlow ?? 0.75;
    const metalDots = { gold: '#F5A623', iron: '#8B5A2B', steel: '#8FA9BC' };
    const dotBase = metalDots[metal] || metalDots.gold;
    const activeIdx = Math.max(0, Math.min(chainStages.length - 1, Math.floor((chainP - 0.75 / chainStages.length) * chainStages.length + 1e-9)));
    const dots = chainStages.map((s, i) => ({ dotSize: i === activeIdx ? 28 : 14, dotColor: i === activeIdx ? dotBase : `${dotBase}4D` }));
    const scale = this.props.chainScale ?? 1;
    const spacingProp = this.props.chainSpacing ?? 1.1;
    const thickness = this.props.chainThickness ?? 0.18;
    const swaySpeed = this.props.chainSwaySpeed ?? 0.5;
    if (this.chainScene) {
      this.chainScene.setProgress(chainP);
      if (metal !== this._lastMetal) { this.chainScene.setMetal(metal); this._lastMetal = metal; }
      this.chainScene.setTilt(tilt); this.chainScene.setGlow(glow); this.chainScene.setScale(scale);
      this.chainScene.setSpacing(spacingProp); this.chainScene.setThickness(thickness); this.chainScene.setSwaySpeed(swaySpeed);
    }
    let dialogStyle = null, backdropOpacity = 0, dialogContentOpacity = 0;
    if (this.state.activeCard) {
      const r = this.state.morphRect || { top: 0, left: 0, width: 0, height: 0 };
      const morphed = this.state.morphed;
      dialogStyle = morphed
        ? { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 'min(600px,90vw)', maxHeight: '80vh', overflowY: 'auto' }
        : { position: 'fixed', top: r.top + 'px', left: r.left + 'px', width: r.width + 'px', height: r.height + 'px', transform: 'none', overflow: 'hidden' };
      Object.assign(dialogStyle, { borderRadius: '20px', background: '#10192A', border: '1px solid rgba(245,166,35,0.35)', boxShadow: '0 30px 80px rgba(0,0,0,0.6)', zIndex: 200, transition: 'all .45s cubic-bezier(.22,1,.36,1)' });
      backdropOpacity = morphed ? 1 : 0; dialogContentOpacity = morphed ? 1 : 0;
    }
    const pillarsWithHandler = pillars.map((p) => ({ ...p, _open: (e) => this.openCard2(e, p) }));
    const svgIcon = (path) => React.createElement('svg', { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }, path);
    const socialLinks = [
      { label: 'X / Twitter', href: 'https://x.com/lmrcapitals', icon: React.createElement('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'currentColor' }, React.createElement('path', { d: 'M18.9 2H22l-7.2 8.2L23 22h-6.6l-5.2-6.8L5 22H2l7.7-8.8L1.5 2h6.8l4.7 6.2L18.9 2z' })) },
      { label: 'Discord', href: 'https://discord.gg/jfkzn5GS', icon: svgIcon(React.createElement('path', { d: 'M8 12a1 1 0 102 0 1 1 0 00-2 0zm6 0a1 1 0 102 0 1 1 0 00-2 0zM7 8.5C9.5 7.2 14.5 7.2 17 8.5m-11 7c2.5 1.3 7.5 1.3 11 0M5 8.5C4 12 4 15 5.3 17.5c0 0 1 1 3 1.5l.7-1.5m10-9c1 3.5 1 6.5-.3 9 0 0-1 1-3 1.5l-.7-1.5' })) },
      { label: 'YouTube', href: 'https://www.youtube.com/@LMRcapitals', icon: React.createElement('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8 }, React.createElement('rect', { x: 2, y: 5, width: 20, height: 14, rx: 4 }), React.createElement('path', { d: 'M10 9l6 3-6 3V9z', fill: 'currentColor', stroke: 'none' })) },
      { label: 'Instagram', href: 'https://www.instagram.com/lmrcapitals/', icon: svgIcon([React.createElement('rect', { key: 'r', x: 3, y: 3, width: 18, height: 18, rx: 5 }), React.createElement('circle', { key: 'c', cx: 12, cy: 12, r: 4 }), React.createElement('circle', { key: 'd', cx: 17.5, cy: 6.5, r: 0.6, fill: 'currentColor', stroke: 'none' })]) },
      { label: 'Email', href: 'mailto:admin@lmrcapitals.com', icon: svgIcon([React.createElement('rect', { key: 'r', x: 2.5, y: 5, width: 19, height: 14, rx: 3 }), React.createElement('path', { key: 'p', d: 'M3 6l9 7 9-7' })]) },
    ];
    const clamp01 = (v) => Math.max(0, Math.min(1, v));
    const convSeqP = this.state.convSeqP || 0;
    const qSize = 0.25;
    const localP = (i) => clamp01((convSeqP - i * qSize) / qSize);
    const panelOpacity = (i) => { const l = localP(i); return Math.min(clamp01(l / 0.08), clamp01((1 - l) / 0.08)); };
    const panelStyle = (i, extra) => { const op = panelOpacity(i); return { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: op, pointerEvents: op > 0.5 ? 'auto' : 'none', zIndex: Math.round(op * 10), ...extra }; };
    const convPanelStyle0 = panelStyle(0), convPanelStyle1 = panelStyle(1), convPanelStyle2 = panelStyle(2), convPanelStyle3 = panelStyle(3);
    const convHintStyle = { position: 'absolute', bottom: '22px', left: '50%', transform: 'translateX(-50%)', color: 'color-mix(in srgb, var(--color-text) 55%, transparent)', fontSize: '11px', letterSpacing: '0.14em', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', zIndex: 20, opacity: convSeqP < 0.03 ? 1 : 0, transition: 'opacity .4s ease', pointerEvents: 'none' };
    const convProgressPct = (clamp01(convSeqP) * 100) + '%';
    const convRailDots = [0, 1, 2, 3].map((i) => ({ onClick: () => this.goToConvSeq(i), style: { width: '8px', height: panelOpacity(i) > 0.5 ? '24px' : '8px', borderRadius: panelOpacity(i) > 0.5 ? '4px' : '50%', background: panelOpacity(i) > 0.5 ? 'var(--color-accent-700)' : 'color-mix(in srgb, var(--color-text) 25%, transparent)', cursor: 'pointer', transition: 'all .35s cubic-bezier(.22,.61,.36,1)' } }));
    const p0 = localP(0);
    const conv0 = {
      kicker: { display: 'block', fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--color-accent-700)', marginBottom: '16px', opacity: clamp01((p0 - 0.05) / 0.35), transform: `translateY(${(1 - clamp01((p0 - 0.05) / 0.35)) * 10}px)` },
      lines: ["The Chain Doesn't Just", 'Predict the Market. It', 'Rewires the Trader.'].map((text, i) => { const lp = clamp01((p0 - (0.15 + i * 0.12)) / 0.4); return { text, style: { display: 'block', opacity: lp, transform: `translateY(${(1 - lp) * 20}px)` } }; }),
      sub: (() => { const sp = clamp01((p0 - 0.55) / 0.35); return { color: 'color-mix(in srgb, var(--color-text) 70%, transparent)', fontSize: '16px', lineHeight: '25px', maxWidth: '480px', margin: 0, opacity: sp, transform: `translateY(${(1 - sp) * 10}px)` }; })(),
      visual: (() => { const vp = clamp01((p0 - 0.25) / 0.5); return { flex: 1, margin: 0, aspectRatio: '4/3', borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--color-divider)', opacity: vp, transform: `scale(${0.94 + vp * 0.06})` }; })(),
    };
    const p1 = localP(1);
    const beforeTexts = ['Hesitation before every entry', 'Self-doubt after every stop-out', 'Discipline that has to be forced', 'Reacting to headlines and noise', '"Am I right about this?"'];
    const afterTexts = ['Alignment across every timeframe', 'Thesis stays intact through the drawdown', 'Patience has a reason, not just willpower', 'Anchored to structure, not sentiment', '"Is the chain confirming?"'];
    const bColP = clamp01((p1 - 0.05) / 0.3); const aColP = clamp01((p1 - 0.1) / 0.25);
    const chainStart = 0.28, chainEnd = 0.92; const afterChainP = clamp01((p1 - chainStart) / (chainEnd - chainStart)); const nAfter = afterTexts.length;
    const conv1 = {
      beforeCol: { display: 'flex', flexDirection: 'column', gap: '10px', opacity: bColP, transform: `translateX(${(1 - bColP) * -40}px)` },
      beforeItems: beforeTexts.map((text, i) => { const ip = clamp01((p1 - (0.08 + i * 0.045)) / 0.3); return { text, style: { fontSize: '15px', lineHeight: '23px', color: 'color-mix(in srgb, var(--color-text) 65%, transparent)', opacity: 0.55 + ip * 0.45, transform: `translateX(${(1 - ip) * 14}px)` } }; }),
      divider: { background: 'linear-gradient(180deg, transparent, var(--color-accent-700), transparent)', width: '1px', justifySelf: 'center', opacity: clamp01((p1 - 0.15) / 0.35), height: clamp01((p1 - 0.15) / 0.35) * 100 + '%' },
      afterCol: { opacity: aColP, transform: `translateX(${(1 - aColP) * 30}px)` },
      chainFill: { position: 'absolute', left: '5px', top: '6px', width: '2px', height: afterChainP * 100 + '%', background: 'linear-gradient(180deg, #2dd4bf, var(--color-accent-700))', boxShadow: '0 0 8px rgba(45,212,191,.5)' },
      afterItems: afterTexts.map((text, i) => {
        const threshold = i / (nAfter - 1); const lit = afterChainP >= threshold - 0.02; const localNodeP = clamp01((afterChainP - threshold + 0.18) / 0.18);
        return { text, nodeStyle: `background:${lit ? '#e6c65c' : 'var(--color-surface)'};border:2px solid ${lit ? '#e6c65c' : 'var(--color-divider)'};box-shadow:${lit ? '0 0 10px 2px rgba(230,198,92,.6)' : 'none'};transform:scale(${0.6 + localNodeP * 0.4});transition:all .3s cubic-bezier(.34,1.56,.64,1);`, textStyle: { fontSize: '15px', lineHeight: '23px', color: lit ? 'var(--color-text)' : 'color-mix(in srgb, var(--color-text) 55%, transparent)', opacity: 0.45 + localNodeP * 0.55, transform: `translateX(${(1 - localNodeP) * 10}px)` } };
      }),
      quote: (() => { const qp = clamp01((p1 - 0.85) / 0.15); return { textAlign: 'center', color: 'var(--color-accent-700)', fontStyle: 'italic', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 'clamp(18px,2vw,24px)', margin: 0, maxWidth: '44ch', opacity: qp, transform: `translateY(${(1 - qp) * 12}px)` }; })(),
    };
    const p2 = localP(2);
    const nodePts = [{ x: 28, y: 16 }, { x: 72, y: 50 }, { x: 28, y: 84 }];
    const hyp = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
    const len1 = hyp(nodePts[0], nodePts[1]), len2 = hyp(nodePts[1], nodePts[2]);
    const seg1P = clamp01((p2 - 0.1) / 0.4), seg2P = clamp01((p2 - 0.5) / 0.4);
    const iron = [90, 93, 104], goldRgb = [230, 198, 92];
    const mixColor = (t) => `rgb(${iron.map((c, i) => Math.round(c + (goldRgb[i] - c) * t)).join(',')})`;
    const lineStyle = (len, segP) => ({ fill: 'none', stroke: mixColor(segP), strokeWidth: 0.9, strokeLinecap: 'round', strokeDasharray: len, strokeDashoffset: len * (1 - segP), filter: segP > 0.8 ? 'drop-shadow(0 0 4px rgba(230,198,92,.75))' : 'none', transition: 'stroke-dashoffset .1s linear, stroke .1s linear' });
    const conv2 = {
      seg1: { x1: nodePts[0].x, y1: nodePts[0].y, x2: nodePts[1].x, y2: nodePts[1].y, style: lineStyle(len1, seg1P) },
      seg2: { x1: nodePts[1].x, y1: nodePts[1].y, x2: nodePts[2].x, y2: nodePts[2].y, style: lineStyle(len2, seg2P) },
    };
    const convictionEdges = [
      { title: 'Leading, Not Lagging', copy: "The chain confirms direction across markets before price commits — so you're positioned ahead of the move, not reacting to it.", icon: svgIcon(React.createElement('path', { d: 'M3 17l6-6 4 4 8-8M15 7h6v6' })) },
      { title: 'Confluence Over Opinion', copy: 'One market never decides a trade. Five markets agreeing removes opinion from the equation entirely.', icon: svgIcon([React.createElement('rect', { key: 'a', x: 4, y: 14, width: 16, height: 5 }), React.createElement('rect', { key: 'b', x: 4, y: 8, width: 16, height: 5 }), React.createElement('rect', { key: 'c', x: 4, y: 2, width: 16, height: 5 })]) },
      { title: 'Built-In Risk Filter', copy: 'When the chain breaks, the thesis breaks with it — an objective reason to exit before the loss becomes a story.', icon: svgIcon(React.createElement('path', { d: 'M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z' })) },
    ].map((edge, i) => {
      const cp = clamp01((p2 - (0.08 + i * 0.15)) / 0.45);
      const nodeLp = i === 0 ? clamp01((p2 - 0 + 0.2) / 0.2) : i === 1 ? clamp01((p2 - 0.5 + 0.2) / 0.2) : clamp01((p2 - 1 + 0.2) / 0.2);
      const borderCol = mixColor(nodeLp);
      return { ...edge, cardStyle: { padding: '30px 26px', borderRadius: '14px', border: `1.5px solid ${borderCol}`, background: 'var(--color-surface)', boxShadow: nodeLp > 0.75 ? `0 0 22px -4px rgba(230,198,92,${0.15 + nodeLp * 0.35})` : 'none', opacity: cp, transform: `scale(${0.82 + cp * 0.18}) translateY(${(1 - cp) * 16}px)`, transition: 'border-color .3s ease, box-shadow .3s ease' } };
    });
    conv2.leftCards = [convictionEdges[0], convictionEdges[2]]; conv2.rightCards = [convictionEdges[1]];
    const p3 = localP(3);
    const conv3 = {
      words: "Conviction Isn't a Feeling. It's Five Markets Agreeing Before You Click the Trigger.".split(' ').map((text, i) => { const wp = clamp01((p3 - i * 0.035) / 0.5); return { text, style: { display: 'inline-block', opacity: wp, transform: `translateY(${(1 - wp) * 16}px) scale(${0.98 + wp * 0.02})`, filter: `blur(${(1 - wp) * 3}px)` } }; }),
      sub: (() => { const sp = clamp01((p3 - 0.55) / 0.4); return { fontSize: '17px', color: '#4a3a12', opacity: sp * 0.85, maxWidth: '640px', margin: '0 auto', transform: `translateY(${(1 - sp) * 10}px)` }; })(),
    };
    const trackSlides = Array.from({ length: 24 }, (_, i) => ({ id: `track-${i}` }));
    const trackSliderStyle = { display: 'flex', gap: '20px', width: 'max-content', animation: 'lmr-track-scroll 32s linear infinite' };
    const indicators = [
      { name: 'LMR ICT Everything', tagline: 'All-in-one ICT charting suite', price: '$40 / month', desc: 'One indicator that replaces a dozen — every key level, session and time window from the LMR playbook drawn on your chart automatically, with a live bias panel keeping you honest.', features: ['Session boxes & vertical session lines for London and New York', 'Time-window macros — the exact delivery windows that matter', 'Midnight, Sunday, Weekly & Monthly opening price lines', 'Previous day / week / month highs & lows, plus RTH high–low', 'Equilibrium with Premium / Discount zones', 'Live Bias panel, trade Checklist panel & A+ Setup Score'], cta: 'Get Access — $40/mo →', mailto: 'mailto:admin@lmrcapitals.com?subject=LMR%20ICT%20Everything%20%E2%80%94%20Subscription%20(%2440%2Fmonth)', imgLabel: 'LMR ICT Everything — TradingView screenshot' },
      { name: 'LMR 90-Min Cycle', tagline: 'Session Quarters + Live AMD Detector', price: '$40 / month', desc: 'The market moves in 90-minute quarters — Accumulation, Manipulation, Distribution. This indicator maps every session into its A-M-D blocks and tells you, live, which phase price is in.', features: ['Asia, London, NY AM & NY PM session boxes with 90-minute quarter blocks', 'Live AMD phase engine — Accumulation → Manipulation → Distribution', 'Judas-swing confirmation on the manipulation block', 'Bull / bear distribution confirmed by ATR displacement', 'True Open lines for every session', 'Live dashboard — session, block, phase & status at a glance'], cta: 'Get Access — $40/mo →', mailto: 'mailto:admin@lmrcapitals.com?subject=LMR%2090-Min%20Cycle%20%E2%80%94%20Subscription%20(%2440%2Fmonth)', imgLabel: 'LMR 90-Min Cycle — TradingView screenshot' },
    ];
    const outroP = this.state.outroP || 0;
    const solutionNotes = (() => {
      const op = Math.max(0, Math.min(1, (outroP - 0.35) / 0.45));
      const cats = [
        { title: 'You stop guessing on one instrument', color: 'yellow', left: '3%', icon: 'M9 3v18M4 8l5-5 5 5M15 21V3M20 16l-5 5-5-5', bullets: ["Instead of reading NQ in isolation, you're reading the outcome of five markets that already agree with each other."] },
        { title: 'You get ahead of the move, not behind it', color: 'blue', left: '22.4%', icon: 'M3 17l6-6 4 4 8-8M15 7h6v6', bullets: ['Equities are the last link in the sequence — by the time price confirms on the chart, the Chain already told you which way it was leaning.'] },
        { title: 'Your patience becomes logical, not forced', color: 'green', left: '41.8%', icon: 'M12 2a10 10 0 1 0 10 10M12 6v6l4 2', bullets: ["You're not disciplining yourself to wait — you're waiting because the chain hasn't confirmed yet. That's a reason, not willpower."] },
        { title: 'A loss stops being a crisis of confidence', color: 'white', left: '61.2%', icon: 'M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z', bullets: ["One red trade doesn't break the thesis if the macro chain is still intact — which keeps you out of revenge-trading and FOMO entries."] },
        { title: 'A built-in filter for bad setups', color: 'yellow', left: '80.6%', icon: 'M3 4h18l-7 9v6l-4 2v-8L3 4z', bullets: ["A textbook-looking entry that fights the Chain's direction isn't a signal anymore — it's a trap you now know to skip."] },
      ];
      return cats.map((n) => {
        const [c1, c2] = noteColors[n.color]; const [t1, t2] = textColors[n.color];
        return { title: n.title, bullets: n.bullets, titleColor: t1, copyColor: t2, iconPath: n.icon,
          style: { position: 'absolute', top: '9%', left: n.left, width: '16.5%', background: `linear-gradient(178deg, ${c1}, ${c2})`, boxShadow: '0 10px 18px -6px rgba(0,0,0,0.55), 0 2px 4px rgba(0,0,0,0.35)', padding: '14px 12px 10px', borderRadius: '2px', opacity: op, pointerEvents: 'none', zIndex: 1 },
          pinStyle: { position: 'absolute', top: '-6px', left: '50%', transform: 'translateX(-50%)', width: '10px', height: '10px', borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #e8574a, #9c2317)', boxShadow: '0 2px 3px rgba(0,0,0,0.5)' } };
      });
    })();
    const outroScreenStyle = (() => { const p = outroP; return { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: (100 - p * 62) + 'vw', height: (100 - p * 76) + 'vh', borderRadius: (14 * p) + 'px', overflow: 'hidden', border: (2 * p) + 'px solid rgba(245,166,35,0.55)', background: 'radial-gradient(120% 100% at 50% 0%, rgba(245,166,35,0.10), transparent 60%), rgba(6,11,20,0.55)', boxShadow: p > 0.05 ? `0 0 ${40 + p * 20}px rgba(245,166,35,${0.12 + p * 0.08}), 0 ${p * 40}px ${p * 120}px rgba(0,0,0,0.6)` : 'none' }; })();
    const finaleEase2 = Math.max(0, Math.min(1, (chainP - 0.97) / 0.03));
    const smooth = finaleEase2 * finaleEase2 * (3 - 2 * finaleEase2);
    const radialCards = chainStages.map((s, i) => {
      const angle = (i / chainStages.length) * 360 - 90 - (this.state.ringRotationDeg || 0);
      const labelFade = Math.max(0, (smooth - 0.55) / 0.45);
      return { title: s.title, copy: s.copy, onEnter: () => { if (this.chainScene) this.chainScene.setHover(i); }, onLeave: () => { if (this.chainScene) this.chainScene.setHover(null); },
        lineStyle: { position: 'absolute', top: '50%', left: '50%', width: '38%', height: '2px', background: `linear-gradient(90deg, rgba(122,81,17,${labelFade}) 0%, rgba(122,81,17,${labelFade * 0.7}) 100%)`, transformOrigin: 'left center', transform: `translate(0,-50%) rotate(${angle}deg) translateX(34%)`, opacity: labelFade },
        style: { position: 'absolute', top: '50%', left: '50%', transform: `translate(-50%,-50%) rotate(${angle}deg) translate(88%) rotate(${-angle}deg)`, opacity: labelFade, pointerEvents: labelFade > 0.3 ? 'auto' : 'none', background: 'rgba(6,8,15,0.82)', border: '1px solid #7A5111', borderRadius: '10px', padding: '12px 14px', width: '190px', boxShadow: '0 0 18px rgba(122,81,17,0.5)' } };
    });
    return {
      screenStyle, roomOpacity, stickyNotes, heroContentStyle, chainBigOpacity, chainBigScale, chainFlyStyle,
      restLineStyle, restLineBlockStyle, restLineParaStyle, restLineRowStyle, scrollHintOpacity,
      pillars: pillarsWithHandler, dots, chainStages, activeLink: chainStages[activeIdx],
      isFinale: chainP > 0.97, notFinale: chainP <= 0.97, radialCards,
      contentBezelStyle: { position: 'relative', borderRadius: '14px', border: '10px solid #0b0f16', boxShadow: '0 30px 90px rgba(0,0,0,0.55), inset 0 0 60px rgba(0,0,0,0.45)', background: '#03060C' },
      dialogStyle, backdropOpacity, dialogContentOpacity,
      convPanelStyle0, convPanelStyle1, convPanelStyle2, convPanelStyle3, convHintStyle, convRailDots, convProgressPct,
      conv0, conv1, conv2, conv3, indicators, socialLinks, trackSlides, trackSliderStyle,
      outroChainOpacity: Math.min(1, outroP * 6), outroRoomOpacity: Math.min(1, outroP * 1.6), solutionNotes, outroScreenStyle,
      chartHoverMove: (e) => { const img = e.currentTarget.querySelector('img'); if (!img) return; const r = e.currentTarget.getBoundingClientRect(); img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`; img.style.transform = 'scale(1.8)'; },
      chartHoverLeave: (e) => { const img = e.currentTarget.querySelector('img'); if (img) img.style.transform = 'scale(1)'; },
    };
  }

  render() {
    const v = this.renderVals();
    return (
      <div style={css('--color-bg:#05080F;--color-surface:#0C1220;--color-text:#EDF2FF;--color-accent:#F5A623;--color-accent-2:#F5A623;--color-accent-600:#E8901A;--color-accent-700:#FFD166;--color-accent-800:#2A1B04;--color-accent-100:#1C1608;--color-neutral-900:#05080F;--color-divider:rgba(255,255,255,.10);background:radial-gradient(ellipse 140% 60% at 60% -5%,rgba(20,60,120,.22) 0%,var(--color-bg) 55%) fixed;color:var(--color-text)')}>

        <nav className="nav" style={css('position:fixed;top:0;left:0;right:0;z-index:50;padding-inline:clamp(20px,5vw,72px);display:flex;align-items:center;justify-content:space-between;gap:24px;padding-block:16px;background:color-mix(in srgb, #060B14 82%, transparent);backdrop-filter:blur(10px);border-bottom:1px solid var(--color-divider)')}>
          <div style={css('display:flex;align-items:center;gap:12px')}>
            <div style={css('width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#F5A623,#E8901A);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;color:#0a0b0f')}>LMR</div>
            <span className="nav-brand">LMR <strong>Capitals</strong></span>
          </div>
          <div style={css('display:flex;align-items:center;gap:28px;flex-wrap:wrap')}>
            <a href="#about" style={css('text-decoration:none;font-size:14px')}>About</a>
            <a href="#what" style={css('text-decoration:none;font-size:14px')}>What We Do</a>
            <a href="#method" style={css('text-decoration:none;font-size:14px')}>Methodology</a>
            <a href="#indicators" style={css('text-decoration:none;font-size:14px')}>Indicators</a>
            <a href="#contact" style={css('text-decoration:none;font-size:14px')}>Contact</a>
          </div>
          <button type="button" className="btn btn-secondary" onClick={goApp}>Sign In</button>
        </nav>

        {/* ===== CINEMATIC INTRO ===== */}
        <div ref={this.setIntroRef} style={css('position:relative;height:260vh')}>
          <div style={css('position:sticky;top:0;height:100vh;overflow:hidden;background:#03060C')}>
            <div style={{ position: 'absolute', inset: 0, opacity: v.roomOpacity }}>
              <ImageSlot label="Wide room photo — desk, person facing a monitor" />
              <div style={css('position:absolute;inset:0;background:linear-gradient(180deg, rgba(6,11,20,0.1) 0%, rgba(6,11,20,0.75) 100%)')}></div>
            </div>
            {v.stickyNotes.map((note, i) => (
              <div key={i} style={note.style}>
                <div style={note.pinStyle}></div>
                <p style={{ ...css('margin:0 0 4px;font-family:var(--font-heading);font-weight:800;font-size:12.5px;line-height:15px'), color: note.titleColor }}>{note.title}</p>
                <p style={{ margin: 0, fontSize: '10.5px', lineHeight: '14px', color: note.copyColor }}>{note.copy}</p>
              </div>
            ))}
            <div style={v.screenStyle}>
              <div style={css('position:absolute;inset:0;background:radial-gradient(120% 100% at 50% 0%, rgba(245,166,35,0.10), transparent 60%), rgba(6,11,20,0.55)')}></div>
              <div style={{ ...css('position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none'), opacity: v.chainBigOpacity }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: '#F5A623', fontSize: 'clamp(24px,4.2vw,58px)', letterSpacing: '-0.01em', transform: `scale(${v.chainBigScale})`, textShadow: '0 0 40px rgba(245,166,35,0.7)' }}>The Chain</span>
              </div>
              <div style={v.heroContentStyle}>
                <span style={v.restLineStyle}>Trader · Mentor · Fund Manager</span>
                <h1 style={css('font-family:var(--font-heading);font-weight:800;font-size:clamp(28px,5.4vw,78px);line-height:1.05;letter-spacing:-0.02em;margin:0;color:#EDEFF3')}>
                  <span style={v.restLineBlockStyle}>Trade With a System.</span>
                  <span style={v.restLineBlockStyle}>Master <span style={v.chainFlyStyle}>The Chain</span>.</span>
                </h1>
                <p style={v.restLineParaStyle}>A structured Daily → Weekly → Monthly methodology — every trade, every model, every lesson logged in real time.</p>
                <div style={v.restLineRowStyle}>
                  <button type="button" className="btn btn-primary" onClick={goApp}>Sign In / Sign Up →</button>
                  <a href="#about" style={css('text-decoration:none')}><button type="button" className="btn btn-ghost">Learn More</button></a>
                </div>
              </div>
            </div>
            <div style={{ ...css('position:absolute;bottom:28px;left:50%;transform:translateX(-50%);font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:color-mix(in srgb, #EDEFF3 55%, transparent)'), opacity: v.scrollHintOpacity }}>Scroll ↓</div>
          </div>
        </div>

        <div style={css('max-width:1400px;margin:0 auto;padding:24px clamp(16px,3vw,40px) 0')}>
          <div ref={this.setContentBezelRef} style={v.contentBezelStyle}>
            <div style={css('position:absolute;inset:0;pointer-events:none;background:radial-gradient(120% 40% at 50% 0%, rgba(245,166,35,0.05), transparent 60%)')}></div>

            <div style={css('max-width:1200px;margin:0 auto;padding:0 clamp(20px,5vw,72px)')}>
              <section id="about" style={css('padding:56px 0 84px')}>
                <span style={css('display:block;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:var(--color-accent-700);margin:0 0 14px')}>Who I Am</span>
                <h2 style={css('font-family:var(--font-heading);font-weight:800;font-size:32px;line-height:42px;letter-spacing:-0.015em;margin:0')}>A Trader Who Treats Trading Like a Business</h2>
                <p style={css('font-size:15.5px;line-height:28px;color:color-mix(in srgb, var(--color-text) 78%, transparent);margin:28px 0 0;max-width:64ch')}>I'm the founder and head trader at LMR Capitals. Every session starts with a plan and ends with a review — daily bias, higher-timeframe points of interest, session profile, execution, and the emotions behind every decision are logged in this journal, and organized end to end by one system: The Chain.</p>
              </section>
              <hr className="hr" style={css('margin:0')} />
              <section id="what" style={css('padding:84px 0 70px')}>
                <span style={css('display:block;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:var(--color-accent-700);margin:0 0 14px')}>What We Do</span>
                <h2 style={css('font-family:var(--font-heading);font-weight:800;font-size:32px;line-height:42px;letter-spacing:-0.015em;margin:0 0 8px')}>Three Ways LMR Capitals Operates</h2>
                <p style={css('font-size:15.5px;line-height:28px;color:color-mix(in srgb, var(--color-text) 78%, transparent);margin:0 0 32px;max-width:60ch')}>One methodology, applied across three connected pillars — my own trading, the traders I mentor, and the clients I work with. Click a card for the full picture.</p>
                <div style={css('display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:28px')}>
                  {v.pillars.map((item, i) => (
                    <div key={i} onMouseMove={this.combinedMove} onMouseLeave={this.combinedLeave} onClick={item._open} className="spot-card" style={css('position:relative;cursor:pointer;padding:32px 28px;border-radius:18px;background:var(--color-surface);border:1px solid rgba(245,166,35,0.16);transition:transform .12s ease-out')}>
                      <div className="spot-border"></div>
                      <p style={css('font-family:var(--font-heading);font-weight:800;font-size:15px;color:#F5A623;margin:0 0 14px')}>{item.num}</p>
                      <h3 style={css('font-family:var(--font-heading);font-weight:800;font-size:22px;line-height:1.25;letter-spacing:-0.01em;margin:0 0 12px')}>{item.title}</h3>
                      <p style={css('font-size:14.5px;line-height:24px;margin:0;color:color-mix(in srgb, var(--color-text) 75%, transparent)')}>{item.copy}</p>
                      <span style={css('display:inline-block;margin-top:18px;font-size:13px;color:#FBC873;letter-spacing:0.02em')}>Read more →</span>
                    </div>
                  ))}
                </div>
              </section>
              <hr className="hr" style={css('margin:0')} />
            </div>

            {/* ===== METHOD: chain scroller ===== */}
            <section id="method" ref={this.setChainRef} style={css('position:relative;height:520vh')}>
              <div style={css('position:sticky;top:0;height:100vh;overflow:hidden;max-width:1200px;margin:0 auto;padding:0 clamp(20px,5vw,72px)')}>
                <canvas ref={this.setChainCanvasRef} style={css('width:100%;height:100%;display:block')}></canvas>
                <div style={css('position:absolute;inset:0;pointer-events:none')}>
                  {v.radialCards.map((rc, i) => (<div key={'l' + i} style={rc.lineStyle}></div>))}
                  {v.radialCards.map((rc, i) => (
                    <div key={'c' + i} style={rc.style} onMouseEnter={rc.onEnter} onMouseLeave={rc.onLeave}>
                      <p style={css('margin:0 0 4px;font-family:var(--font-heading);font-weight:800;font-size:13px;color:#FFD166')}>{rc.title}</p>
                      <p style={css('margin:0;font-size:11px;line-height:16px;color:color-mix(in srgb, var(--color-text) 80%, transparent)')}>{rc.copy}</p>
                    </div>
                  ))}
                </div>
                {v.notFinale && (
                  <>
                    <div style={css('position:absolute;top:50%;left:clamp(20px,5vw,72px);max-width:52ch;transform:translateY(-50%);pointer-events:none')}>
                      <span style={css('display:block;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:var(--color-accent-700);margin:0 0 14px')}>How We Do It — The Chain</span>
                      <h2 style={css('font-family:var(--font-heading);font-weight:800;font-size:clamp(24px,2.6vw,36px);line-height:1.15;letter-spacing:-0.015em;margin:0 0 18px;color:#FFD166;text-shadow:0 0 28px rgba(122,81,17,0.65)')}>{v.activeLink.title}</h2>
                      <p style={css('font-size:15px;line-height:26px;margin:0;color:color-mix(in srgb, var(--color-text) 82%, transparent)')}>{v.activeLink.copy}</p>
                      <div style={css('display:flex;gap:10px;margin-top:28px')}>
                        {v.dots.map((lk2, i) => (<span key={i} style={{ width: lk2.dotSize + 'px', height: '6px', borderRadius: '3px', background: lk2.dotColor, transition: 'all .3s ease' }}></span>))}
                      </div>
                    </div>
                    <div style={css('position:absolute;top:35%;left:36%;width:2px;height:15%;background:linear-gradient(180deg, rgba(245,166,35,0.05), rgba(245,166,35,0.55));pointer-events:none')}></div>
                    <div style={css('position:absolute;top:50%;left:36%;width:34%;height:2px;background:linear-gradient(90deg, rgba(245,166,35,0.55), rgba(245,166,35,0.15));pointer-events:none')}></div>
                  </>
                )}
                {v.isFinale && (
                  <span style={css('position:absolute;top:clamp(20px,6vh,56px);left:50%;transform:translateX(-50%);font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#7A5111;pointer-events:none')}>The Chain — Connected in Full Circle</span>
                )}
              </div>
            </section>

            {/* ===== CONVICTION ===== */}
            <section id="conviction" ref={this.setConvSeqRef} style={css('position:relative;height:420vh')}>
              <div style={css('position:sticky;top:0;height:100vh;overflow:hidden;max-width:1200px;margin:0 auto;padding:0 clamp(20px,5vw,72px)')}>
                <div style={{ ...css('position:absolute;top:0;left:0;height:2px;background:var(--color-accent-700);z-index:30;transition:width .05s linear'), width: v.convProgressPct }}></div>
                <div style={css('position:absolute;right:8px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:14px;z-index:20')}>
                  {v.convRailDots.map((dot, i) => (<div key={i} onClick={dot.onClick} style={dot.style}></div>))}
                </div>
                <div style={v.convHintStyle}>
                  <span>SCROLL</span>
                  <div style={css('width:12px;height:12px;border-right:1.5px solid #9a9ba3;border-bottom:1.5px solid #9a9ba3;transform:rotate(45deg)')}></div>
                </div>

                {/* Panel 0 */}
                <div style={v.convPanelStyle0}>
                  <div style={css('display:flex;align-items:center;gap:5vw;max-width:1100px;width:100%;margin:0 auto;padding:0 4vw')}>
                    <div style={css('flex:1')}>
                      <div style={v.conv0.kicker}>FROM ANALYSIS TO CONVICTION</div>
                      <h2 style={css('font-family:var(--font-heading);font-weight:800;font-size:clamp(24px,3.1vw,40px);line-height:1.22;color:var(--color-text);margin:0 0 18px')}>
                        {v.conv0.lines.map((ln, i) => (<span key={i} style={ln.style}>{ln.text}</span>))}
                      </h2>
                      <p style={v.conv0.sub}>Five markets confirming one direction isn't a signal — it's permission to act without doubt.</p>
                    </div>
                    <figure className="grayscale" style={v.conv0.visual}>
                      <ImageSlot label="Day trader at desk, multi-monitor charts, mid-session" />
                    </figure>
                  </div>
                </div>

                {/* Panel 1 */}
                <div style={v.convPanelStyle1}>
                  <div style={css('display:flex;flex-direction:column;align-items:center;gap:2.2rem;max-width:1100px;width:100%;margin:0 auto;padding:0 4vw')}>
                    <div style={css('display:grid;grid-template-columns:1fr 1px 1fr;gap:3rem;width:100%;align-items:start')}>
                      <div style={v.conv1.beforeCol}>
                        <span style={css('display:block;font-size:13px;letter-spacing:0.08em;font-weight:700;text-transform:uppercase;color:#f0705a;margin:0 0 20px')}>Before the Chain</span>
                        <div style={css('display:flex;flex-direction:column;gap:14px')}>
                          {v.conv1.beforeItems.map((bi, i) => (<div key={i} style={bi.style}>{bi.text}</div>))}
                        </div>
                      </div>
                      <div style={v.conv1.divider}></div>
                      <div style={v.conv1.afterCol}>
                        <span style={css('display:block;font-size:13px;letter-spacing:0.08em;font-weight:700;text-transform:uppercase;color:#2dd4bf;margin:0 0 20px')}>After the Chain</span>
                        <div style={css('position:relative;padding-left:26px')}>
                          <div style={css('position:absolute;left:5px;top:6px;bottom:6px;width:2px;background:var(--color-divider)')}></div>
                          <div style={v.conv1.chainFill}></div>
                          {v.conv1.afterItems.map((ai, i) => (
                            <div key={i} style={css('position:relative;display:flex;align-items:center;padding:9px 0')}>
                              <div style={css(ai.nodeStyle + 'position:absolute;left:-26px;width:11px;height:11px;border-radius:50%')}></div>
                              <div style={ai.textStyle}>{ai.text}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <p style={v.conv1.quote}>"Patience stops being willpower and starts being logic."</p>
                  </div>
                </div>

                {/* Panel 2 */}
                <div style={v.convPanelStyle2}>
                  <div style={css('position:relative;max-width:1080px;width:100%;margin:0 auto;padding:0 4vw')}>
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={css('position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0')}>
                      <line x1={v.conv2.seg1.x1} y1={v.conv2.seg1.y1} x2={v.conv2.seg1.x2} y2={v.conv2.seg1.y2} style={v.conv2.seg1.style}></line>
                      <line x1={v.conv2.seg2.x1} y1={v.conv2.seg2.y1} x2={v.conv2.seg2.x2} y2={v.conv2.seg2.y2} style={v.conv2.seg2.style}></line>
                    </svg>
                    <div style={css('position:relative;z-index:1;display:grid;grid-template-columns:minmax(220px,320px) 1fr minmax(220px,320px);gap:24px;align-items:center')}>
                      <div style={css('grid-column:1;display:flex;flex-direction:column;gap:64px')}>
                        {v.conv2.leftCards.map((edge, i) => (
                          <div key={i} style={edge.cardStyle}>
                            <div style={css('color:var(--color-accent-700);margin-bottom:16px')}>{edge.icon}</div>
                            <h3 style={css('font-family:var(--font-heading);font-weight:800;font-size:18px;line-height:1.3;margin:0 0 8px;color:var(--color-text)')}>{edge.title}</h3>
                            <p style={css('font-size:14px;line-height:21px;margin:0;color:color-mix(in srgb, var(--color-text) 75%, transparent)')}>{edge.copy}</p>
                          </div>
                        ))}
                      </div>
                      <div style={css('grid-column:3;display:flex;align-items:center;justify-content:center')}>
                        {v.conv2.rightCards.map((edge, i) => (
                          <div key={i} style={edge.cardStyle}>
                            <div style={css('color:var(--color-accent-700);margin-bottom:16px')}>{edge.icon}</div>
                            <h3 style={css('font-family:var(--font-heading);font-weight:800;font-size:18px;line-height:1.3;margin:0 0 8px;color:var(--color-text)')}>{edge.title}</h3>
                            <p style={css('font-size:14px;line-height:21px;margin:0;color:color-mix(in srgb, var(--color-text) 75%, transparent)')}>{edge.copy}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Panel 3 */}
                <div style={v.convPanelStyle3}>
                  <div style={css('background:linear-gradient(120deg, #b5811f 0%, #d9ac3a 45%, #eccf6f 100%);border-radius:28px;max-width:1000px;width:100%;margin:0 4vw;padding:4.5vw 4vw;text-align:center')}>
                    <h2 style={css('font-family:var(--font-heading);font-weight:800;font-size:clamp(24px,3.6vw,46px);line-height:1.18;color:#161208;margin:0 0 20px')}>
                      {v.conv3.words.map((w, i) => (<span key={i} style={w.style}>{w.text}&nbsp;</span>))}
                    </h2>
                    <p style={v.conv3.sub}>This is what The Chain tracks before your finger ever hits the trigger.</p>
                  </div>
                </div>
              </div>
            </section>

            <div style={css('max-width:1200px;margin:0 auto;padding:0 clamp(20px,5vw,72px)')}>
              <hr className="hr" style={css('margin:0')} />
              <section id="indicators" style={css('padding:84px 0 70px')}>
                <span style={css('display:block;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:var(--color-accent-700);margin:0 0 14px')}>The Toolkit</span>
                <h2 style={css('font-family:var(--font-heading);font-weight:800;font-size:32px;line-height:42px;letter-spacing:-0.015em;margin:0 0 8px')}>LMR Indicators for TradingView</h2>
                <p style={css('font-size:15.5px;line-height:28px;color:color-mix(in srgb, var(--color-text) 78%, transparent);margin:0 0 32px;max-width:60ch')}>The same tools I trade with every session — built in-house on the LMR methodology, so the chart shows you exactly what the journal tracks.</p>
                <div style={css('display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:28px')}>
                  {v.indicators.map((ind, i) => (
                    <div key={i} className="card elev-sm" style={css('display:flex;flex-direction:column;gap:16px')}>
                      <div onMouseMove={v.chartHoverMove} onMouseLeave={v.chartHoverLeave} style={css('position:relative;overflow:hidden;border-radius:8px;border:1px solid var(--color-divider);cursor:zoom-in;aspect-ratio:16/10;background:var(--color-surface)')}>
                        <ImageSlot label={ind.imgLabel} style={{ transition: 'transform .5s cubic-bezier(.34,1.56,.64,1)' }} />
                      </div>
                      <div>
                        <p className="card-kicker">Pine Script v6 · TradingView</p>
                        <h3 className="card-title" style={css('margin:6px 0')}>{ind.name}</h3>
                        <p className="card-meta">{ind.tagline}</p>
                      </div>
                      <p style={css('font-family:var(--font-heading);font-weight:800;font-size:28px;margin:0;color:var(--color-accent-700)')}>{ind.price}</p>
                      <p className="card-body" style={css('margin:0')}>{ind.desc}</p>
                      <ul style={css('margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px;font-size:14px;line-height:20px;color:color-mix(in srgb, var(--color-text) 78%, transparent)')}>
                        {ind.features.map((f, j) => (<li key={j}>{f}</li>))}
                      </ul>
                      <a href={ind.mailto} style={css('text-decoration:none;margin-top:auto')}><button type="button" className="btn btn-primary btn-block">{ind.cta}</button></a>
                      <p style={css('font-size:12px;color:color-mix(in srgb, var(--color-text) 60%, transparent);margin:0')}>Invite-only access granted to your TradingView username after payment.</p>
                    </div>
                  ))}
                </div>
              </section>
              <hr className="hr" style={css('margin:0')} />
            </div>
          </div>
        </div>

        {/* ===== TRACK RECORD ===== */}
        <section style={css('padding:70px 0 84px;overflow:hidden')}>
          <div style={css('max-width:1200px;margin:0 auto;padding:0 clamp(20px,5vw,72px)')}>
            <span style={css('display:block;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:var(--color-accent-700);margin:0 0 14px')}>Proven Track Record</span>
            <h2 style={css('font-family:var(--font-heading);font-weight:800;font-size:32px;line-height:42px;letter-spacing:-0.015em;margin:0 0 14px;max-width:24ch')}>Verified Funded Passes &amp; Payouts</h2>
            <p style={css('font-size:15.5px;line-height:28px;color:color-mix(in srgb, var(--color-text) 78%, transparent);margin:0 0 32px;max-width:60ch')}>Real results from the LMR Capitals methodology — funded challenges passed and payouts collected, documented transparently.</p>
          </div>
          <div style={css('overflow:hidden;-webkit-mask-image:linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);mask-image:linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)')}>
            <div style={v.trackSliderStyle}>
              {v.trackSlides.concat(v.trackSlides).map((ts, i) => (
                <figure key={i} className="grayscale" style={css('margin:0;flex:none;width:220px;aspect-ratio:1;border-radius:10px;overflow:hidden')}>
                  <ImageSlot label="Funded pass / payout certificate" />
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* ===== CTA ===== */}
        <section style={css('background:#05080F')}>
          <div style={css('max-width:800px;margin:0 auto;padding:84px clamp(20px,5vw,72px);text-align:center')}>
            <h3 style={css('font-family:var(--font-heading);font-weight:800;font-size:clamp(30px,3.6vw,44px);line-height:1.15;letter-spacing:-0.015em;margin:0;color:#EDF2FF')}>See the System in Action</h3>
            <p style={css('font-size:16px;line-height:27px;margin:20px auto 0;max-width:52ch;color:color-mix(in srgb, var(--color-text) 72%, transparent)')}>Sign in to view the live journal, methodology breakdowns, and performance reports — or create an account to get started.</p>
            <div style={css('display:flex;justify-content:center;margin-top:36px')}>
              <button type="button" className="btn btn-primary" onClick={goApp}>Sign In / Sign Up →</button>
            </div>
          </div>
        </section>

        {/* ===== OUTRO ===== */}
        <div ref={this.setOutroRef} style={css('position:relative;height:180vh')}>
          <div style={css('position:sticky;top:0;height:100vh;overflow:hidden;pointer-events:none')}>
            <div style={{ position: 'absolute', inset: 0, opacity: v.outroRoomOpacity }}>
              <ImageSlot label="Wide room photo — desk, person facing a monitor" />
              <div style={css('position:absolute;inset:0;background:linear-gradient(180deg, rgba(6,11,20,0.1) 0%, rgba(6,11,20,0.75) 100%)')}></div>
            </div>
            {v.solutionNotes.map((note, i) => (
              <div key={i} style={note.style}>
                <div style={note.pinStyle}></div>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke={note.titleColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={css('margin-bottom:8px')}>
                  <path d={note.iconPath}></path>
                </svg>
                <p style={{ margin: '0 0 6px', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '12px', lineHeight: '15px', letterSpacing: '0.01em', color: note.titleColor }}>{note.title}</p>
                <ul style={css('margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:4px')}>
                  {note.bullets.map((b, j) => (<li key={j} style={{ fontSize: '10px', lineHeight: '14px', color: note.copyColor }}>{b}</li>))}
                </ul>
              </div>
            ))}
            <div style={v.outroScreenStyle}>
              <div style={css('position:absolute;inset:0;display:flex;align-items:center;justify-content:center')}>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: '#F5A623', fontSize: 'clamp(20px,4.2vw,58px)', letterSpacing: '-0.01em', opacity: v.outroChainOpacity, textShadow: '0 0 40px rgba(245,166,35,0.7)' }}>The Chain</span>
              </div>
            </div>
          </div>
        </div>

        <div style={css('max-width:1200px;margin:0 auto;padding:0 clamp(20px,5vw,72px)')}>
          <section id="contact" style={css('padding:84px 0 84px;text-align:center')}>
            <span style={css('display:block;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:var(--color-accent-700);margin:0 0 14px')}>Get In Touch</span>
            <h2 style={css('font-family:var(--font-heading);font-weight:800;font-size:clamp(28px,3.4vw,40px);line-height:1.2;letter-spacing:-0.015em;margin:0 0 16px')}>Connect With LMR Capitals</h2>
            <p style={css('font-size:16px;line-height:26px;margin:0 0 32px;color:color-mix(in srgb, var(--color-text) 72%, transparent)')}>Follow along, join the community, or reach out directly.</p>
            <div style={css('display:flex;gap:16px;flex-wrap:wrap;justify-content:center')}>
              {v.socialLinks.map((sl, i) => (
                <a key={i} href={sl.href} aria-label={sl.label} style={css('width:56px;height:56px;display:flex;align-items:center;justify-content:center;border-radius:12px;background:#141B2B;border:1px solid rgba(245,166,35,0.25);color:#F5A623;text-decoration:none')}>{sl.icon}</a>
              ))}
            </div>
          </section>
          <hr className="hr" style={css('margin:0')} />
          <footer style={css('padding:28px 0;font-size:13px;line-height:20px;color:color-mix(in srgb, var(--color-text) 65%, transparent);display:flex;flex-direction:column;gap:12px;background:#05080F')}>
            <p style={css('margin:0')}>LMR Capitals © 2026 · Built on The Chain methodology</p>
            <p style={css('margin:0;max-width:80ch')}>Futures trading involves substantial risk of loss and is not suitable for all investors. Past performance is not indicative of future results. All content is general information only and does not constitute financial advice.</p>
            <div style={css('display:flex;gap:20px')}>
              <a href="#" style={css('text-decoration:none;font-size:13px')}>Privacy Policy</a>
              <a href="#" style={css('text-decoration:none;font-size:13px')}>Terms of Service</a>
              <a href="#" style={css('text-decoration:none;font-size:13px')}>Risk Disclaimer</a>
            </div>
          </footer>
        </div>

        {this.state.activeCard && (
          <>
            <div onClick={this.closeDialog} style={{ ...css('position:fixed;inset:0;z-index:190;background:rgba(3,6,12,0.7);backdrop-filter:blur(4px);transition:opacity .35s ease'), opacity: v.backdropOpacity }}></div>
            <div onClick={this.stop} style={v.dialogStyle}>
              <div style={{ ...css('padding:36px;display:flex;flex-direction:column;gap:16px;transition:opacity .25s ease .1s'), opacity: v.dialogContentOpacity }}>
                <p style={css('font-family:var(--font-heading);font-weight:800;font-size:14px;color:#F5A623;margin:0')}>{this.state.activeCard.num}</p>
                <h3 style={css('font-family:var(--font-heading);font-weight:800;font-size:28px;line-height:1.2;margin:0')}>{this.state.activeCard.title}</h3>
                <p style={css('font-size:15.5px;line-height:26px;margin:0;color:color-mix(in srgb, #EDEFF3 82%, transparent)')}>{this.state.activeCard.copy}</p>
                <p style={css('font-size:15.5px;line-height:26px;margin:0;color:color-mix(in srgb, #EDEFF3 70%, transparent)')}>{this.state.activeCard.detail}</p>
                <button type="button" className="btn btn-ghost" onClick={this.closeDialog} style={css('align-self:flex-start;margin-top:8px')}>Close</button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }
}

const CSS = `
:root{--font-heading:"Archivo",system-ui,sans-serif;--font-body:"Archivo",system-ui,sans-serif;
  --space-1:4px;--space-2:8px;--space-3:12px;--space-4:16px;--radius-md:0px;
  --shadow-sm:0 1px 2px rgba(0,0,0,.4);--shadow-md:0 3px 10px rgba(0,0,0,.45);--shadow-lg:0 12px 32px rgba(0,0,0,.5);}
*,*::before,*::after{box-sizing:border-box}
body{margin:0;font-family:var(--font-body);font-size:15px;line-height:1.55;background:#05080F;color:#EDF2FF}
h1,h2,h3,h4,h5,h6{font-family:var(--font-heading);font-weight:800;margin:0}
p{margin:0 0 12px}
img{display:block;max-width:100%}
figure{margin:0}
a{color:var(--color-accent,#F5A623);text-underline-offset:3px}
.nav a{color:inherit;text-decoration:none;font-size:14px}
.nav a:hover{color:var(--color-accent)}
.nav-brand{font-family:var(--font-heading);font-weight:800;font-size:18px}
.grayscale{filter:grayscale(1) contrast(1.08)}
.hr{height:2px;border:0;margin:16px 0;background:var(--color-divider)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;text-decoration:none;
  font-family:var(--font-heading);font-weight:800;font-size:14px;line-height:1.2;color:var(--color-text);
  background:transparent;border:1px solid transparent;padding:8px 14px;border-radius:var(--radius-md)}
.btn:disabled{opacity:.45;cursor:not-allowed}
.btn-primary{background:var(--color-accent);color:#0a0b0f}
.btn-primary:hover{background:var(--color-accent-600)}
.btn-secondary{border-color:var(--color-divider)}
.btn-secondary:hover{background:color-mix(in srgb,var(--color-text) 7%,transparent)}
.btn-ghost{color:var(--color-accent);padding-inline:6px}
.btn-ghost:hover{background:color-mix(in srgb,var(--color-accent) 10%,transparent)}
.btn-block{width:100%;margin-top:8px;justify-content:flex-start;text-align:left}
.card{display:flex;flex-direction:column;gap:8px;padding:16px;border-radius:var(--radius-md);background:var(--color-surface)}
.card-kicker{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-accent)}
.card-title{font-family:var(--font-heading);font-weight:800;font-size:17px;line-height:1.2}
.card-body{margin:0;font-size:13px;opacity:.8;flex:1}
.card-meta{display:flex;align-items:center;gap:6px;font-size:11px;color:color-mix(in srgb,var(--color-text) 50%,transparent)}
.elev-sm{box-shadow:var(--shadow-sm)}
.spot-card:hover{border-color:rgba(245,166,35,0.4)!important}
.spot-border{content:'';position:absolute;inset:0;border-radius:18px;padding:1px;pointer-events:none;
  background:radial-gradient(260px circle at var(--mx,50%) var(--my,50%), #F5A623, transparent 70%);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;
  mask-composite:exclude;opacity:var(--spot,0);transition:opacity .25s ease}
@keyframes lmr-track-scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@keyframes lmr-icon-pulse{0%{transform:scale(1)}40%{transform:scale(1.18)}100%{transform:scale(1)}}
`;

const styleEl = document.createElement('style'); styleEl.textContent = CSS; document.head.appendChild(styleEl);
const boot = document.getElementById('boot'); if (boot) boot.remove();
createRoot(document.getElementById('root')).render(<Landing />);
