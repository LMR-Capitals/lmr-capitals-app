// LMR Capitals — 3D-forward landing page.
// A persistent WebGL scene (particle nebula + the interlocking "Chain") sits
// behind glass content. Scroll drives the camera + chain assembly + per-section
// colour; mouse drives parallax. Copy carried from "The Chain" design.
// Sign-in CTAs route to the app (/) → signup → paywall.

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { createScene } from './scene-3d.js';
import { createDeskScene } from './desk-scene.js';

const goApp = () => { window.location.href = '/'; };
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const smooth = (e0, e1, x) => { const t = clamp01((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };

/* ── scroll-reveal ───────────────────────────────────────────────────────── */
function Reveal({ children, className = '', style, delay = 0, as: Tag = 'div' }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver((es) => { es.forEach((e) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }); }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={className} style={{ opacity: seen ? 1 : 0, transform: seen ? 'none' : 'translateY(26px)', transition: `opacity .8s cubic-bezier(.22,1,.36,1) ${delay}s, transform .8s cubic-bezier(.22,1,.36,1) ${delay}s`, ...style }}>
      {children}
    </Tag>
  );
}

const PILLARS = [
  { num: '01', title: 'Trading Journal & Track Record', copy: 'Every trade — entry, exit, model, session, risk, and result — is logged in real time.', detail: 'Daily, weekly, and monthly reports turn raw data into a transparent track record, reviewed honestly, wins and losses alike — the same ledger that backs every public result LMR Capitals shows.' },
  { num: '02', title: 'Education & Mentorship', copy: 'I teach the LMR methodology to traders who want structure over guesswork.', detail: 'The MMBM/MMSM weekly models, session profiling, HTF bias, and the psychology of staying consistent under pressure — taught from the exact playbook run in the live journal, not a simplified version of it.' },
  { num: '03', title: 'Fund & Signal Management', copy: 'For clients seeking disciplined, rules-based exposure.', detail: "Managed accounts and trade signals built on the exact process documented in this journal — full transparency, no black boxes, no strategy you can't see reasoned through in real time." },
];
const STAGES = [
  { k: 'LMR Methodology', c: 'The master framework binding every link — the shared language, rules, and philosophy that every other card in the chain inherits from.' },
  { k: 'The Monthly Chain', c: 'Monthly analysis tracks the broader quarterly shift (STS/LTS bias) and market profile — trending, retracing, consolidating, or manipulative — to keep every smaller decision aligned with the bigger picture.' },
  { k: 'The Weekly Chain', c: 'Every week is mapped against the MMBM and MMSM weekly models, identifying the dominant profile and how price is expected to deliver across the five sessions ahead.' },
  { k: 'The Daily Chain', c: 'Each day begins with a defined bias, key HTF points of interest, and a session plan — then closes with a full review of execution, P&L, and lessons before the next link forms.' },
  { k: 'Session Profiling', c: 'London and New York sessions are each classified — Accumulation, Manipulation, Distribution, Rebalance/Reversal, Retracement/Continuation — to anticipate how price should move before it moves.' },
  { k: 'The Trade', c: 'Every trade is tagged with its model, session, emotion, and outcome — the link every other link exists to set up cleanly.' },
  { k: 'Discipline & Journaling', c: 'The final link that closes the loop — daily review and honest logging feed straight back into the methodology, starting the chain again.' },
];
const BEFORE = ['Hesitation before every entry', 'Self-doubt after every stop-out', 'Discipline that has to be forced', 'Reacting to headlines and noise', '"Am I right about this?"'];
const AFTER = ['Alignment across every timeframe', 'Thesis stays intact through the drawdown', 'Patience has a reason, not just willpower', 'Anchored to structure, not sentiment', '"Is the chain confirming?"'];
const EDGES = [
  { t: 'Leading, Not Lagging', c: "The chain confirms direction across markets before price commits — you're positioned ahead of the move, not reacting to it." },
  { t: 'Confluence Over Opinion', c: 'One market never decides a trade. Five markets agreeing removes opinion from the equation entirely.' },
  { t: 'Built-In Risk Filter', c: 'When the chain breaks, the thesis breaks with it — an objective reason to exit before the loss becomes a story.' },
];
const INDICATORS = [
  { name: 'LMR ICT Everything', tagline: 'All-in-one ICT charting suite', price: '$40 / month', desc: 'One indicator that replaces a dozen — every key level, session and time window from the LMR playbook drawn automatically, with a live bias panel keeping you honest.', features: ['Session boxes & vertical session lines (London / New York)', 'Time-window macros — the exact delivery windows that matter', 'Midnight, Sunday, Weekly & Monthly opening price lines', 'Prev day / week / month highs & lows, plus RTH high–low', 'Equilibrium with Premium / Discount zones', 'Live Bias panel, Checklist panel & A+ Setup Score'], mailto: 'mailto:admin@lmrcapitals.com?subject=LMR%20ICT%20Everything' },
  { name: 'LMR 90-Min Cycle', tagline: 'Session Quarters + Live AMD Detector', price: '$40 / month', desc: 'The market moves in 90-minute quarters — Accumulation, Manipulation, Distribution. This maps every session into its A-M-D blocks and tells you, live, which phase price is in.', features: ['Asia, London, NY AM & NY PM boxes with 90-min quarter blocks', 'Live AMD phase engine — Accumulation → Manipulation → Distribution', 'Judas-swing confirmation on the manipulation block', 'Bull / bear distribution confirmed by ATR displacement', 'True Open lines for every session', 'Live dashboard — session, block, phase & status at a glance'], mailto: 'mailto:admin@lmrcapitals.com?subject=LMR%2090-Min%20Cycle' },
];
const SOCIAL = [
  { label: 'X / Twitter', href: 'https://x.com/lmrcapitals', d: 'M18.9 2H22l-7.2 8.2L23 22h-6.6l-5.2-6.8L5 22H2l7.7-8.8L1.5 2h6.8l4.7 6.2L18.9 2z', fill: true },
  { label: 'Discord', href: 'https://discord.gg/jfkzn5GS', d: 'M8 12a1 1 0 102 0 1 1 0 00-2 0zm6 0a1 1 0 102 0 1 1 0 00-2 0zM7 8.5C9.5 7.2 14.5 7.2 17 8.5m-11 7c2.5 1.3 7.5 1.3 11 0' },
  { label: 'YouTube', href: 'https://www.youtube.com/@LMRcapitals', d: 'M10 9l6 3-6 3V9z', fill: true, rect: true },
  { label: 'Instagram', href: 'https://www.instagram.com/lmrcapitals/', d: 'M12 8a4 4 0 100 8 4 4 0 000-8z', rect2: true },
  { label: 'Email', href: 'mailto:admin@lmrcapitals.com', d: 'M3 6l9 7 9-7', rect3: true },
];

/* ── "Five Markets Align → Conviction" — the new model for the Conviction act ─ */
const MARKETS = [
  { k: 'NQ', a0: -46 }, { k: 'ES', a0: 30 }, { k: 'YM', a0: -20 }, { k: 'DXY', a0: 54 }, { k: 'GOLD', a0: -36 },
];
function FiveMarkets({ align }) {
  const locked = Math.round(clamp01(align) * MARKETS.length);
  return (
    <div className="fm">
      <div className="fm-line" style={{ opacity: align, transform: `scaleX(${0.2 + align * 0.8})` }} />
      <div className="fm-row">
        {MARKETS.map((m, i) => {
          const on = i < locked;
          const ang = m.a0 * (1 - clamp01((align - i * 0.06) / 0.7)); // staggered snap to vertical
          return (
            <div key={i} className={'fm-mkt' + (on ? ' on' : '')}>
              <span className="fm-k">{m.k}</span>
              <svg className="fm-arrow" viewBox="0 0 40 84" style={{ transform: `rotate(${ang}deg)` }}>
                <line x1="20" y1="78" x2="20" y2="16" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                <path d="M7 30 L20 9 L33 30" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="fm-dot" />
            </div>
          );
        })}
      </div>
      <div className="fm-readout">
        <span className="fm-count">{locked} / {MARKETS.length}</span>
        <span className="fm-lbl">{locked >= MARKETS.length ? 'MARKETS ALIGNED' : 'CONFIRMING…'}</span>
      </div>
      <div className="fm-meter"><span style={{ width: `${align * 100}%` }} /></div>
    </div>
  );
}

function Placeholder({ label, style }) {
  return <div data-image-slot={label} style={{ width: '100%', height: '100%', minHeight: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,rgba(20,30,50,.6),rgba(6,11,20,.6))', color: '#3c4b66', fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', textAlign: 'center', padding: 14, lineHeight: 1.5, border: '1px dashed rgba(120,140,180,.18)', borderRadius: 10, ...style }}>{label}</div>;
}

function App() {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const chainSecRef = useRef(null);
  const deskCanvasRef = useRef(null);
  const convRef = useRef(null);
  const [activeStage, setActiveStage] = useState(0);
  const [mp, setMp] = useState(0);          // #method scroll progress 0..1
  const [convP, setConvP] = useState(0);    // conviction scroll progress 0..1
  const [screenRect, setScreenRect] = useState(null); // monitor screen rect in CSS px
  const [card, setCard] = useState(null);

  useEffect(() => {
    let scene;
    try { scene = createScene(canvasRef.current); } catch (e) { scene = null; }
    sceneRef.current = scene;

    // The cinematic desk + monitor. Camera flies into the screen; the Chain
    // assembles "inside" it; then it pulls back out onto the desk.
    let desk = null;
    try { desk = createDeskScene(deskCanvasRef.current); } catch (e) { desk = null; }

    const calc = (el) => { if (!el) return 0; const vh = innerHeight; const r = el.getBoundingClientRect(); const total = r.height - vh; return total <= 0 ? (r.top < 0 ? 1 : 0) : clamp01(-r.top / total); };
    const onScroll = () => {
      const doc = document.documentElement;
      const p = clamp01(scrollY / ((doc.scrollHeight - innerHeight) || 1));
      scene && scene.setScroll(p);
      const cp = calc(chainSecRef.current);
      scene && scene.setChainProgress(cp);
      desk && desk.setProgress(cp);
      setMp(cp);
      // lock the overlay to the monitor screen's actual projected rectangle
      if (desk && desk.getScreenRect) { const r = desk.getScreenRect(); if (r && r.w > 0) setScreenRect(r); }
      // the 7-stage in-monitor journey runs across 0.16 → 0.86
      const inside = clamp01((cp - 0.16) / (0.86 - 0.16));
      setActiveStage(Math.max(0, Math.min(STAGES.length - 1, Math.floor(inside * STAGES.length - 1e-6))));
      setConvP(calc(convRef.current));
    };
    const onResize = () => { if (desk && desk.getScreenRect) { const r = desk.getScreenRect(); if (r && r.w > 0) setScreenRect(r); } };
    addEventListener('resize', onResize);
    // the rect depends on the rendered camera; sample a couple of frames after mount
    const t0 = setTimeout(onResize, 120), t1 = setTimeout(onResize, 500);
    const onMouse = (e) => {
      const mx = (e.clientX / innerWidth) * 2 - 1, my = (e.clientY / innerHeight) * 2 - 1;
      scene && scene.setMouse(mx, my);
      desk && desk.setMouse(mx, my);
    };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('mousemove', onMouse, { passive: true });
    onScroll();

    // section → scene theme index
    const secs = Array.from(document.querySelectorAll('[data-scene]'));
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) scene && scene.setSection(parseInt(e.target.getAttribute('data-scene'), 10) || 0); });
    }, { threshold: 0.4 });
    secs.forEach((s) => io.observe(s));

    return () => { removeEventListener('scroll', onScroll); removeEventListener('mousemove', onMouse); removeEventListener('resize', onResize); clearTimeout(t0); clearTimeout(t1); io.disconnect(); if (scene) scene.dispose(); if (desk) desk.dispose(); };
  }, []);

  // overlay copy timing, synced to the camera choreography
  const introOpacity = 1 - smooth(0.04, 0.13, mp);                       // fades as we fly in
  const insideOpacity = smooth(0.15, 0.20, mp) * (1 - smooth(0.88, 0.95, mp)); // in across the journey
  const journeyProgress = clamp01((mp - 0.16) / (0.86 - 0.16));          // 0..1 through the 7 stages
  // overlay elements locked to the monitor screen rectangle (falls back to CSS % if unknown)
  const R = screenRect;
  const copyPos = R ? { left: R.x + R.w * 0.05, top: R.y + R.h * 0.52, width: R.w * 0.34, transform: 'translateY(-50%)' } : null;
  const connPos = R ? { left: R.x + R.w * 0.26, top: R.y + R.h * 0.30, width: R.w * 0.32, height: R.h * 0.24 } : null;
  const finalePos = R ? { left: R.x + R.w * 0.5, top: R.y + R.h * 0.07, transform: 'translateX(-50%)' } : null;

  const S = 'clamp(20px,5vw,72px)';
  return (
    <>
      <canvas ref={canvasRef} id="bg3d" />
      <div className="veil" />
      <div className="page">
        {/* NAV */}
        <nav className="nav">
          <div className="brand"><span className="dot">LMR</span><span>LMR <strong>Capitals</strong></span></div>
          <div className="links">
            <a href="#about">About</a><a href="#what">What We Do</a><a href="#method">Methodology</a><a href="#indicators">Indicators</a><a href="#contact">Contact</a>
          </div>
          <button className="btn btn-ghost" onClick={goApp}>Sign In</button>
        </nav>

        {/* HERO */}
        <section className="hero" data-scene="0">
          <Reveal><span className="eyebrow">Trader · Mentor · Fund Manager</span></Reveal>
          <Reveal delay={0.05}><h1 className="h1">Trade With a System.<br />Master <span className="gold">The Chain</span>.</h1></Reveal>
          <Reveal delay={0.12}><p className="lead">A structured Daily → Weekly → Monthly methodology — every trade, every model, every lesson logged in real time, and organized end to end by one system.</p></Reveal>
          <Reveal delay={0.2}><div className="row">
            <button className="btn btn-gold" onClick={goApp}>Start Free Trial →</button>
            <a className="btn btn-ghost" href="#about">Learn More</a>
          </div></Reveal>
          <div className="scrollhint">Scroll ↓</div>
        </section>

        {/* ABOUT */}
        <section id="about" className="wrap" data-scene="1">
          <Reveal className="glass pad">
            <span className="kick">Who I Am</span>
            <h2 className="h2">A Trader Who Treats Trading Like a Business</h2>
            <p className="body">I'm the founder and head trader at LMR Capitals. Every session starts with a plan and ends with a review — daily bias, higher-timeframe points of interest, session profile, execution, and the emotions behind every decision are logged in this journal, and organized end to end by one system: The Chain.</p>
          </Reveal>
        </section>

        {/* WHAT WE DO */}
        <section id="what" className="wrap" data-scene="2">
          <Reveal><span className="kick">What We Do</span><h2 className="h2">Three Ways LMR Capitals Operates</h2>
            <p className="body" style={{ maxWidth: '60ch' }}>One methodology, applied across three connected pillars — my own trading, the traders I mentor, and the clients I work with.</p></Reveal>
          <div className="grid3">
            {PILLARS.map((p, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <button className="glass card tilt" onClick={() => setCard(p)}>
                  <span className="cnum">{p.num}</span>
                  <h3 className="h3">{p.title}</h3>
                  <p className="body sm">{p.copy}</p>
                  <span className="more">Read more →</span>
                </button>
              </Reveal>
            ))}
          </div>
        </section>

        {/* METHOD — the Chain: camera flies INTO the trader's monitor, the
            content plays inside the screen, then shrinks back onto the desk. */}
        <section id="method" ref={chainSecRef} className="method-sec" data-scene="3">
          <div className="method-sticky">
            <canvas ref={deskCanvasRef} className="desk-canvas" />
            <div className="method-veil" />

            {/* establishing caption — visible on the wide desk shot, fades as we fly in */}
            <div className="method-intro" style={{ opacity: introOpacity, pointerEvents: introOpacity < 0.1 ? 'none' : 'auto' }}>
              <span className="kick">How We Do It — The Chain</span>
              <h2 className="h2">It All Runs From One Desk</h2>
              <p className="body">Every session, every model, every lesson — organized end to end by one system. Step inside the screen.</p>
              <p className="hint">Scroll — fly into the monitor ↓</p>
            </div>

            {/* finale line, inside the screen, when the chain is complete */}
            {activeStage === STAGES.length - 1 && journeyProgress > 0.94 && (
              <span className="chain-finale" style={{ opacity: insideOpacity, ...(finalePos || {}) }}>The Chain — Connected in Full Circle</span>
            )}

            {/* thin gold connector line from the copy to the link (per the design) */}
            <svg className="chain-connector" style={{ opacity: insideOpacity * 0.85, ...(connPos || {}) }} preserveAspectRatio="none" viewBox="0 0 100 100">
              <path d="M1,72 L1,18 L99,18" fill="none" stroke="rgba(245,166,35,0.5)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              <circle cx="99" cy="18" r="2.4" fill="#F5A623" vectorEffect="non-scaling-stroke" />
            </svg>

            {/* inside-the-screen methodology — left copy block + dash-dots (per the design) */}
            <div className="method-inside" style={{ opacity: insideOpacity, pointerEvents: insideOpacity < 0.1 ? 'none' : 'auto', ...(copyPos || {}) }}>
              <span className="kick">How We Do It — The Chain</span>
              <div className="stagecard" key={activeStage}>
                <h2 className="h2 gold">{STAGES[activeStage].k}</h2>
                <p className="body">{STAGES[activeStage].c}</p>
              </div>
              <div className="chain-dots">
                {STAGES.map((s, i) => (
                  <span key={i} className={'cdot' + (i === activeStage ? ' on' : '')} title={s.k} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CONVICTION — new model: five markets align → conviction (scroll-driven) */}
        <section ref={convRef} className="conv-sec" data-scene="4">
          <div className="conv-sticky">
            <div className="conv-head">
              <span className="kick">From Analysis to Conviction</span>
              <h2 className="h2">The Chain Doesn't Just Predict the Market.<br />It <span className="gold">Rewires the Trader</span>.</h2>
              <p className="body" style={{ maxWidth: '52ch', margin: '14px auto 0' }}>Five markets confirming one direction isn't a signal — it's permission to act without doubt.</p>
            </div>
            <FiveMarkets align={smooth(0.06, 0.74, convP)} />
            <div className={'conv-stamp' + (smooth(0.06, 0.74, convP) > 0.99 ? ' on' : '')}>
              <span>CONVICTION CONFIRMED</span>
            </div>
          </div>
        </section>

        {/* CONVICTION — before / after + edges + closing */}
        <section className="wrap" data-scene="4">
          <div className="grid2">
            <Reveal className="glass pad">
              <span className="tag coral">Before the Chain</span>
              <ul className="list">{BEFORE.map((b, i) => <li key={i}>{b}</li>)}</ul>
            </Reveal>
            <Reveal delay={0.1} className="glass pad">
              <span className="tag teal">After the Chain</span>
              <ul className="list gold-list">{AFTER.map((b, i) => <li key={i}>{b}</li>)}</ul>
            </Reveal>
          </div>
          <div className="grid3" style={{ marginTop: 24 }}>
            {EDGES.map((e, i) => (
              <Reveal key={i} delay={i * 0.08} className="glass card">
                <h3 className="h3 sm">{e.t}</h3>
                <p className="body sm">{e.c}</p>
              </Reveal>
            ))}
          </div>
          <Reveal className="closing" delay={0.05}>
            <h2>Conviction Isn't a Feeling. It's Five Markets Agreeing Before You Click the Trigger.</h2>
            <p>This is what The Chain tracks before your finger ever hits the trigger.</p>
          </Reveal>
        </section>

        {/* INDICATORS */}
        <section id="indicators" className="wrap" data-scene="5">
          <Reveal><span className="kick">The Toolkit</span><h2 className="h2">LMR Indicators for TradingView</h2>
            <p className="body" style={{ maxWidth: '60ch' }}>The same tools I trade with every session — built in-house on the LMR methodology, so the chart shows exactly what the journal tracks.</p></Reveal>
          <div className="grid2">
            {INDICATORS.map((ind, i) => (
              <Reveal key={i} delay={i * 0.08} className="glass card ind">
                <div className="shot"><Placeholder label={ind.name + ' — TradingView screenshot'} /></div>
                <p className="kick sm">Pine Script v6 · TradingView</p>
                <h3 className="h3">{ind.name}</h3>
                <p className="body sm" style={{ margin: 0, color: 'var(--text3)' }}>{ind.tagline}</p>
                <p className="price">{ind.price}</p>
                <p className="body sm">{ind.desc}</p>
                <ul className="feat">{ind.features.map((f, j) => <li key={j}>{f}</li>)}</ul>
                <a className="btn btn-gold block" href={ind.mailto}>Get Access — $40/mo →</a>
                <p className="fine">Invite-only access granted to your TradingView username after payment.</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* TRACK RECORD */}
        <section className="wrap" data-scene="5">
          <Reveal><span className="kick">Proven Track Record</span><h2 className="h2">Verified Funded Passes &amp; Payouts</h2>
            <p className="body" style={{ maxWidth: '60ch' }}>Real results from the LMR Capitals methodology — funded challenges passed and payouts collected, documented transparently.</p></Reveal>
          <div className="marquee">
            <div className="track">
              {Array.from({ length: 24 }).concat(Array.from({ length: 24 })).map((_, i) => (
                <figure key={i} className="cert grayscale"><Placeholder label="Funded pass / payout" /></figure>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="wrap" data-scene="5">
          <Reveal className="cta glass">
            <h2 className="h2">See the System in Action</h2>
            <p className="body" style={{ maxWidth: '52ch', margin: '0 auto 28px' }}>Sign in to view the live journal, methodology breakdowns, and performance reports — or create an account to get started.</p>
            <button className="btn btn-gold big" onClick={goApp}>Sign In / Sign Up →</button>
          </Reveal>
        </section>

        {/* CONTACT + FOOTER */}
        <section id="contact" className="wrap" data-scene="5" style={{ textAlign: 'center' }}>
          <Reveal>
            <span className="kick">Get In Touch</span><h2 className="h2">Connect With LMR Capitals</h2>
            <p className="body">Follow along, join the community, or reach out directly.</p>
            <div className="socials">
              {SOCIAL.map((s, i) => (
                <a key={i} href={s.href} aria-label={s.label} className="soc">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={s.fill ? 'currentColor' : 'none'} stroke={s.fill ? 'none' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {s.rect && <rect x="2" y="5" width="20" height="14" rx="4" fill="none" stroke="currentColor" />}
                    {s.rect2 && <rect x="3" y="3" width="18" height="18" rx="5" />}
                    {s.rect3 && <rect x="2.5" y="5" width="19" height="14" rx="3" />}
                    <path d={s.d} />
                  </svg>
                </a>
              ))}
            </div>
          </Reveal>
          <footer className="foot">
            <p>LMR Capitals © 2026 · Built on The Chain methodology</p>
            <p className="fine">Futures trading involves substantial risk of loss and is not suitable for all investors. Past performance is not indicative of future results. All content is general information only and does not constitute financial advice.</p>
          </footer>
        </section>
      </div>

      {card && (
        <div className="modal-bg" onClick={() => setCard(null)}>
          <div className="modal glass" onClick={(e) => e.stopPropagation()}>
            <span className="cnum">{card.num}</span>
            <h3 className="h3">{card.title}</h3>
            <p className="body">{card.copy}</p>
            <p className="body sm">{card.detail}</p>
            <button className="btn btn-ghost" onClick={() => setCard(null)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}

const CSS = `
:root{--bg:#05070d;--text:#EDF2FF;--text2:#aeb9cc;--text3:#7c8aa3;--gold:#F5A623;--gold2:#FFD166;--teal:#2dd4bf;--coral:#f0705a;--border:rgba(130,150,190,.16);--glass:rgba(14,20,34,.52)}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font-family:'Archivo',system-ui,sans-serif;overflow-x:hidden}
h1,h2,h3{font-family:'Archivo',system-ui,sans-serif;font-weight:800;margin:0;letter-spacing:-.02em;line-height:1.08}
a{color:var(--gold);text-decoration:none}
#bg3d{position:fixed;inset:0;width:100vw;height:100vh;z-index:0;display:block}
.veil{position:fixed;inset:0;z-index:1;pointer-events:none;background:radial-gradient(120% 90% at 50% 0%,transparent 40%,rgba(5,7,13,.65) 100%)}
.page{position:relative;z-index:2}
.wrap{max-width:1180px;margin:0 auto;padding:clamp(70px,11vh,150px) ${'clamp(20px,5vw,72px)'}}
.kick{display:block;font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:var(--gold2);font-weight:700;margin-bottom:14px}
.kick.sm{font-size:10px;margin:0}
.h1{font-size:clamp(38px,7vw,86px)}
.h2{font-size:clamp(26px,3.4vw,42px);margin-bottom:14px}
.h3{font-size:22px}.h3.sm{font-size:18px;margin-bottom:8px}
.gold{color:var(--gold)}
.body{font-size:clamp(14px,1.2vw,16.5px);line-height:1.7;color:var(--text2);margin:0}
.body.sm{font-size:14px;line-height:1.6}
.lead{font-size:clamp(15px,1.5vw,19px);line-height:1.7;color:var(--text2);max-width:56ch;margin:22px 0 0}
.row{display:flex;gap:16px;flex-wrap:wrap;margin-top:32px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;font-family:'Archivo';font-weight:800;font-size:15px;padding:13px 22px;border-radius:12px;border:1px solid transparent;transition:transform .1s,filter .15s,background .15s}
.btn:active{transform:translateY(1px)}
.btn-gold{background:linear-gradient(135deg,var(--gold2),var(--gold));color:#0a0b0f;box-shadow:0 12px 34px -12px rgba(245,166,35,.7)}
.btn-gold:hover{filter:brightness(1.07)}
.btn-gold.big{padding:16px 30px;font-size:16px}.btn-gold.block{width:100%;margin-top:auto}
.btn-ghost{background:rgba(255,255,255,.05);color:var(--text);border-color:var(--border)}
.btn-ghost:hover{background:rgba(255,255,255,.1)}
.glass{background:var(--glass);border:1px solid var(--border);border-radius:20px;backdrop-filter:blur(18px) saturate(140%);-webkit-backdrop-filter:blur(18px) saturate(140%);box-shadow:0 30px 80px -40px rgba(0,0,0,.8),inset 0 1px 0 rgba(255,255,255,.05)}
.pad{padding:clamp(26px,3.5vw,44px)}
/* nav */
.nav{position:fixed;top:0;left:0;right:0;z-index:50;display:flex;align-items:center;justify-content:space-between;gap:24px;padding:14px clamp(20px,5vw,72px);background:rgba(6,11,20,.55);backdrop-filter:blur(12px);border-bottom:1px solid var(--border)}
.brand{display:flex;align-items:center;gap:11px;font-weight:800;font-size:17px}
.brand .dot{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--gold2),var(--gold));color:#0a0b0f;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800}
.brand strong{color:var(--gold)}
.nav .links{display:flex;gap:26px}
.nav .links a{color:var(--text2);font-size:14px;font-weight:600}
.nav .links a:hover{color:var(--gold)}
@media(max-width:780px){.nav .links{display:none}}
/* hero */
.hero{position:relative;min-height:100vh;display:flex;flex-direction:column;justify-content:center;max-width:1180px;margin:0 auto;padding:0 clamp(20px,5vw,72px)}
.scrollhint{position:absolute;bottom:34px;left:clamp(20px,5vw,72px);font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--text3)}
/* grids */
.grid3{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:22px;margin-top:34px}
.grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:22px;margin-top:34px}
.card{padding:30px 26px;text-align:left;color:inherit;cursor:pointer;display:flex;flex-direction:column;gap:10px;width:100%;font:inherit}
.card.tilt{transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease}
.card.tilt:hover{transform:translateY(-5px);border-color:rgba(245,166,35,.55);box-shadow:0 40px 90px -40px rgba(245,166,35,.4)}
.cnum{font-weight:800;color:var(--gold);font-size:15px}
.more{color:var(--gold2);font-size:13px;margin-top:6px}
/* method / chain — cinematic desk + monitor */
.method-sec{position:relative;height:840vh}
.method-sticky{position:sticky;top:0;height:100vh;width:100%;overflow:hidden}
.desk-canvas{position:absolute;inset:0;width:100%;height:100%;display:block;z-index:0}
.method-veil{position:absolute;inset:0;z-index:1;pointer-events:none;background:radial-gradient(120% 120% at 50% 45%,transparent 55%,rgba(4,6,12,.72) 100%)}
/* establishing caption sits low-left over the wide desk shot */
.method-intro{position:absolute;z-index:2;left:clamp(20px,6vw,90px);bottom:clamp(48px,10vh,120px);max-width:min(560px,80vw);transition:opacity .4s ease}
.method-intro .hint{margin-top:18px}
/* inside-the-screen content — a caption bar along the bottom so the chain (upper/centre) stays clear */
/* methodology copy — left-aligned, vertically centred inside the screen (per the design) */
.method-inside{position:absolute;z-index:2;top:50%;left:13%;transform:translateY(-50%);width:min(360px,32vw);text-align:left;transition:opacity .5s ease}
.method-inside .kick{margin-bottom:14px}
.method-inside .h2{font-size:clamp(22px,2.4vw,34px);line-height:1.15;margin-bottom:16px;color:var(--gold2);text-shadow:0 0 28px rgba(122,81,17,.65)}
.method-inside .body{margin:0;max-width:52ch;font-size:clamp(13px,1.05vw,15px);line-height:1.7}
/* dash-dots progress: active dot grows */
.chain-dots{display:flex;gap:10px;margin-top:28px}
.cdot{width:14px;height:6px;border-radius:3px;background:rgba(245,166,35,.30);transition:all .35s cubic-bezier(.22,1,.36,1)}
.cdot.on{width:28px;background:var(--gold);box-shadow:0 0 12px rgba(245,166,35,.7)}
/* connector callout line from copy toward the link */
.chain-connector{position:absolute;z-index:1;left:29%;top:34%;width:34%;height:22%;pointer-events:none;transition:opacity .5s ease}
/* per-stage crossfade */
.stagecard{animation:stageIn .55s cubic-bezier(.22,1,.36,1)}
@keyframes stageIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
/* finale line, centred near the top of the screen */
.chain-finale{position:absolute;z-index:2;top:12%;left:50%;transform:translateX(-50%);font-size:13px;letter-spacing:.1em;text-transform:uppercase;font-weight:800;color:var(--gold2);text-shadow:0 0 24px rgba(245,166,35,.6);transition:opacity .5s ease;white-space:nowrap}
@media(max-width:780px){.method-inside{left:8%;width:70vw}}
.method-inside .step{border:1px solid var(--border);border-radius:999px;padding:7px 14px;background:rgba(10,16,28,.5);backdrop-filter:blur(8px)}
.method-inside .step .stepk{font-size:12.5px}
.method-inside .h2{text-shadow:0 2px 30px rgba(245,166,35,.35)}
.steps{display:flex;gap:2px}
.step{display:flex;align-items:center;gap:10px;opacity:.4;transition:opacity .3s,transform .3s,border-color .3s}
.step.on{opacity:1;border-color:rgba(245,166,35,.5)}
.step.on .stepk{color:var(--gold2)}
.stepn{font-size:12px;font-weight:800;color:var(--gold)}
.stepk{font-size:14.5px;font-weight:600;color:var(--text2)}
.hint{font-size:12px;letter-spacing:.06em;color:var(--text3)}
@media(max-width:780px){.method-inside .step .stepn{display:none}.method-intro{bottom:40px}}
/* conviction */
.tag{display:inline-block;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:4px 12px;border-radius:999px;margin-bottom:16px}
.tag.coral{background:rgba(240,112,90,.14);color:var(--coral)}
.tag.teal{background:rgba(45,212,191,.14);color:var(--teal)}
.list{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:12px}
.list li{font-size:15px;color:var(--text2);padding-left:20px;position:relative}
.list li:before{content:'';position:absolute;left:0;top:9px;width:7px;height:7px;border-radius:50%;background:var(--coral)}
.gold-list li{color:var(--text)}
.gold-list li:before{background:var(--gold)}
.closing{margin-top:34px;border-radius:26px;padding:clamp(34px,5vw,64px);text-align:center;background:linear-gradient(120deg,#b5811f,#d9ac3a 45%,#eccf6f)}
.closing h2{color:#161208;font-size:clamp(24px,3.2vw,40px);margin-bottom:14px}
.closing p{color:#4a3a12;font-size:16px;margin:0}
/* conviction — new model: five markets align */
.conv-sec{position:relative;height:300vh}
.conv-sticky{position:sticky;top:0;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(24px,4vh,54px);max-width:1100px;margin:0 auto;padding:0 clamp(20px,5vw,72px);text-align:center}
.conv-head .kick{margin-bottom:12px}
.conv-head .h2{font-size:clamp(24px,3vw,42px)}
.fm{width:100%;max-width:760px;position:relative}
.fm-line{position:absolute;top:34px;left:8%;right:8%;height:2px;background:linear-gradient(90deg,transparent,var(--gold),transparent);transform-origin:center;box-shadow:0 0 16px rgba(245,166,35,.6);pointer-events:none}
.fm-row{display:flex;justify-content:space-between;align-items:flex-end;gap:clamp(8px,2vw,26px)}
.fm-mkt{flex:1;display:flex;flex-direction:column;align-items:center;gap:12px;color:#5b6b86;transition:color .4s ease}
.fm-mkt.on{color:var(--gold2)}
.fm-arrow{width:clamp(30px,5vw,46px);height:auto;transition:filter .4s ease;transform-origin:50% 78%}
.fm-mkt.on .fm-arrow{filter:drop-shadow(0 0 10px rgba(245,166,35,.75))}
.fm-k{font-size:13px;font-weight:800;letter-spacing:.08em}
.fm-dot{width:9px;height:9px;border-radius:50%;background:currentColor;opacity:.5;transition:opacity .4s,box-shadow .4s}
.fm-mkt.on .fm-dot{opacity:1;box-shadow:0 0 12px rgba(245,166,35,.9)}
.fm-readout{display:flex;align-items:baseline;justify-content:center;gap:12px;margin-top:30px}
.fm-count{font-size:clamp(26px,4vw,44px);font-weight:800;color:var(--gold);letter-spacing:.02em}
.fm-lbl{font-size:12px;letter-spacing:.18em;font-weight:800;color:var(--text3)}
.fm-meter{margin:16px auto 0;width:min(320px,60%);height:4px;border-radius:3px;background:rgba(130,150,190,.2);overflow:hidden}
.fm-meter span{display:block;height:100%;background:linear-gradient(90deg,var(--gold),var(--gold2));box-shadow:0 0 12px rgba(245,166,35,.7);border-radius:3px}
.conv-stamp{opacity:0;transform:scale(.9);transition:opacity .5s ease,transform .5s cubic-bezier(.22,1,.36,1)}
.conv-stamp.on{opacity:1;transform:scale(1)}
.conv-stamp span{display:inline-block;font-size:clamp(14px,1.6vw,20px);font-weight:800;letter-spacing:.22em;color:#0a0b0f;background:linear-gradient(120deg,var(--gold2),var(--gold));padding:12px 26px;border-radius:999px;box-shadow:0 14px 40px -12px rgba(245,166,35,.8)}
@media(max-width:640px){.fm-k{font-size:11px}.fm-lbl{display:none}}
/* indicators */
.ind{gap:14px}
.shot{aspect-ratio:16/10;border-radius:12px;overflow:hidden;border:1px solid var(--border)}
.price{font-weight:800;font-size:26px;color:var(--gold2);margin:0}
.feat{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px;font-size:13.5px;line-height:1.5;color:var(--text2)}
.fine{font-size:12px;color:var(--text3);margin:0}
/* marquee */
.marquee{margin-top:34px;overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)}
.track{display:flex;gap:18px;width:max-content;animation:lmr-scroll 40s linear infinite}
.cert{margin:0;flex:none;width:200px;aspect-ratio:1;border-radius:12px;overflow:hidden}
.grayscale{filter:grayscale(1) contrast(1.05)}
@keyframes lmr-scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
/* cta */
.cta{text-align:center;padding:clamp(40px,6vw,80px) clamp(24px,5vw,72px);border-radius:26px}
/* contact */
.socials{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-top:26px}
.soc{width:54px;height:54px;display:flex;align-items:center;justify-content:center;border-radius:14px;background:var(--glass);border:1px solid var(--border);color:var(--gold);transition:transform .15s,border-color .15s}
.soc:hover{transform:translateY(-3px);border-color:rgba(245,166,35,.6)}
.foot{margin-top:60px;border-top:1px solid var(--border);padding-top:26px;display:flex;flex-direction:column;gap:10px;color:var(--text3);font-size:13px;text-align:center}
/* modal */
.modal-bg{position:fixed;inset:0;z-index:200;background:rgba(3,6,12,.72);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px}
.modal{max-width:560px;width:100%;padding:36px;display:flex;flex-direction:column;gap:14px}
`;

const styleEl = document.createElement('style'); styleEl.textContent = CSS; document.head.appendChild(styleEl);
const boot = document.getElementById('boot'); if (boot) boot.remove();
createRoot(document.getElementById('root')).render(<App />);
