// LMR Capitals — 3D-forward landing page.
// A persistent WebGL scene (particle nebula + the interlocking "Chain") sits
// behind glass content. Scroll drives the camera + chain assembly + per-section
// colour; mouse drives parallax. Copy carried from "The Chain" design.
// Sign-in CTAs route to the app (/) → signup → paywall.

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { createScene } from './scene-3d.js';
import { createChainScene } from './chain-scene.js';

const goApp = () => { window.location.href = '/'; };
const clamp01 = (v) => Math.max(0, Math.min(1, v));

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
  { k: 'LMR Methodology', c: 'The master framework binding every link — the shared language, rules, and philosophy every other link inherits from.' },
  { k: 'The Monthly Chain', c: 'Monthly analysis tracks the quarterly shift (STS/LTS bias) and market profile so every smaller decision stays aligned with the bigger picture.' },
  { k: 'The Weekly Chain', c: 'Each week is mapped against the MMBM and MMSM models — the dominant profile and how price should deliver across the five sessions ahead.' },
  { k: 'The Daily Chain', c: 'Each day opens with a bias, key HTF points of interest, and a session plan — and closes with a full review before the next link forms.' },
  { k: 'Session Profiling', c: 'London and New York are each classified — Accumulation, Manipulation, Distribution, Reversal, Continuation — to anticipate the move before it happens.' },
  { k: 'The Trade', c: 'Every trade is tagged with its model, session, emotion, and outcome — the link every other link exists to set up cleanly.' },
  { k: 'Discipline & Journaling', c: 'The final link that closes the loop — honest review feeds straight back into the methodology, and the chain begins again.' },
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

function Placeholder({ label, style }) {
  return <div data-image-slot={label} style={{ width: '100%', height: '100%', minHeight: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,rgba(20,30,50,.6),rgba(6,11,20,.6))', color: '#3c4b66', fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', textAlign: 'center', padding: 14, lineHeight: 1.5, border: '1px dashed rgba(120,140,180,.18)', borderRadius: 10, ...style }}>{label}</div>;
}

function App() {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const chainSecRef = useRef(null);
  const monitorCanvasRef = useRef(null);
  const [activeStage, setActiveStage] = useState(0);
  const [card, setCard] = useState(null);

  useEffect(() => {
    let scene;
    try { scene = createScene(canvasRef.current); } catch (e) { scene = null; }
    sceneRef.current = scene;

    // Dedicated, framed chain inside the #method monitor.
    let chainScene = null;
    if (monitorCanvasRef.current) {
      createChainScene(monitorCanvasRef.current, { count: 7 })
        .then((s) => { chainScene = s; s.setMetal('gold'); s.setSpacing(1.15); s.setThickness(0.2); })
        .catch(() => {});
    }

    const calc = (el) => { if (!el) return 0; const vh = innerHeight; const r = el.getBoundingClientRect(); const total = r.height - vh; return total <= 0 ? (r.top < 0 ? 1 : 0) : clamp01(-r.top / total); };
    const onScroll = () => {
      const doc = document.documentElement;
      const p = clamp01(scrollY / ((doc.scrollHeight - innerHeight) || 1));
      scene && scene.setScroll(p);
      const cp = calc(chainSecRef.current);
      scene && scene.setChainProgress(cp);
      chainScene && chainScene.setProgress(cp);
      setActiveStage(Math.max(0, Math.min(STAGES.length - 1, Math.floor(cp * STAGES.length - 1e-6))));
    };
    const onMouse = (e) => { scene && scene.setMouse((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1); };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('mousemove', onMouse, { passive: true });
    onScroll();

    // section → scene theme index
    const secs = Array.from(document.querySelectorAll('[data-scene]'));
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) scene && scene.setSection(parseInt(e.target.getAttribute('data-scene'), 10) || 0); });
    }, { threshold: 0.4 });
    secs.forEach((s) => io.observe(s));

    return () => { removeEventListener('scroll', onScroll); removeEventListener('mousemove', onMouse); io.disconnect(); if (scene) scene.dispose(); if (chainScene) chainScene.dispose(); };
  }, []);

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

        {/* METHOD — the Chain (drives the 3D) */}
        <section id="method" ref={chainSecRef} className="chain-sec" data-scene="3">
          <div className="chain-sticky">
            <div className="chain-copy">
              <span className="kick">How We Do It — The Chain</span>
              <h2 className="h2 gold" style={{ minHeight: '2.2em' }}>{STAGES[activeStage].k}</h2>
              <p className="body">{STAGES[activeStage].c}</p>
              <div className="steps">
                {STAGES.map((s, i) => (
                  <div key={i} className={'step' + (i === activeStage ? ' on' : '')}>
                    <span className="stepn">{String(i + 1).padStart(2, '0')}</span>
                    <span className="stepk">{s.k}</span>
                  </div>
                ))}
              </div>
              <p className="hint">Scroll — the chain assembles link by link ↓</p>
            </div>
            <div className="monitor">
              <div className="screen">
                <canvas ref={monitorCanvasRef} className="screen-canvas" />
                <div className="scanlines" />
                <div className="screenglow" />
                <span className="screenlabel">THE CHAIN · LIVE</span>
              </div>
              <div className="stand" />
              <div className="base" />
            </div>
          </div>
        </section>

        {/* CONVICTION */}
        <section className="wrap" data-scene="4">
          <Reveal style={{ textAlign: 'center', maxWidth: 820, margin: '0 auto' }}>
            <span className="kick">From Analysis to Conviction</span>
            <h2 className="h2">The Chain Doesn't Just Predict the Market. It Rewires the Trader.</h2>
            <p className="body">Five markets confirming one direction isn't a signal — it's permission to act without doubt.</p>
          </Reveal>
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
/* method / chain */
.chain-sec{position:relative;height:360vh}
.chain-sticky{position:sticky;top:0;height:100vh;display:flex;align-items:center;justify-content:space-between;gap:clamp(24px,4vw,64px);max-width:1180px;margin:0 auto;padding:0 clamp(20px,5vw,72px)}
.chain-copy{flex:1;max-width:520px}
/* monitor that frames the 3D chain */
.monitor{flex:1;max-width:620px;display:flex;flex-direction:column;align-items:center}
.screen{position:relative;width:100%;aspect-ratio:16/10;background:#03060c;border:12px solid #0b0f16;border-radius:16px;overflow:hidden;box-shadow:0 40px 100px -30px rgba(0,0,0,.9),0 0 60px -10px rgba(245,166,35,.25),inset 0 0 60px rgba(0,0,0,.6)}
.screen-canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.scanlines{position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(255,255,255,.03) 0 1px,transparent 1px 3px);mix-blend-mode:overlay}
.screenglow{position:absolute;inset:0;pointer-events:none;background:radial-gradient(120% 90% at 50% 0%,rgba(245,166,35,.14),transparent 55%),radial-gradient(100% 100% at 50% 120%,rgba(42,92,255,.12),transparent 60%);box-shadow:inset 0 0 40px rgba(0,0,0,.5)}
.screenlabel{position:absolute;top:10px;left:12px;font-size:10px;letter-spacing:.18em;color:rgba(245,166,35,.7);font-weight:700}
.stand{width:14px;height:34px;background:linear-gradient(180deg,#0b0f16,#05070d);margin-top:-1px}
.base{width:150px;height:12px;border-radius:0 0 10px 10px;background:linear-gradient(180deg,#0b0f16,#080b12);box-shadow:0 14px 30px -10px rgba(0,0,0,.8)}
@media(max-width:900px){.chain-sticky{flex-direction:column;justify-content:center;gap:24px}.chain-copy{max-width:100%}.monitor{max-width:100%;width:100%}.screen{aspect-ratio:16/11}.steps{display:none}}
.steps{display:flex;flex-direction:column;gap:2px;margin:26px 0 0;border-left:1px solid var(--border);padding-left:18px}
.step{display:flex;align-items:center;gap:12px;padding:7px 0;opacity:.4;transition:opacity .3s,transform .3s}
.step.on{opacity:1;transform:translateX(4px)}
.step.on .stepk{color:var(--gold2)}
.stepn{font-size:12px;font-weight:800;color:var(--gold);width:22px}
.stepk{font-size:14.5px;font-weight:600;color:var(--text2)}
.hint{font-size:12px;letter-spacing:.06em;color:var(--text3);margin-top:24px}
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
