import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, MotionConfig, useInView, useMotionValue, useScroll, useTransform } from 'motion/react';
import { createClient } from '@supabase/supabase-js';
import { TradingJourney } from './trading-journey.jsx';
import { MARKET_CSS, MARKET_SVG } from './market-art.js';
import { PracticeSequence, ArtworkLayer } from './practice-motion.jsx';
import { InfiniteSlider, wrapSliderPosition } from './infinite-slider.jsx';
import './experience-design.css';
import { ImageViewer } from './image-viewer.jsx';
import { RecentTrades } from './recent-trades.jsx';

const NAV = [['top', 'Home'], ['about', 'Who I Am'], ['what', 'What We Do'], ['method', 'Methodology'], ['record', 'Track Records'], ['plans', 'Plans'], ['contact', 'Contact']];
const previewPage = location.pathname.endsWith('/experience-preview.html');
const EASE = [.16, 1, .3, 1];
const TIMING = { reveal: .7, feedback: .22, gallerySpeed: 25, contactTitle: .65, contactLineDelay: .12, socialEnter: .48, socialDelay: .16, socialStagger: .09 };
const SOCIAL = [
  { label: 'X / Twitter', short: 'X', href: 'https://x.com/lmrcapitals', path: 'M18.9 2H22l-7.2 8.2L23 22h-6.6l-5.2-6.8L5 22H2l7.7-8.8L1.5 2h6.8l4.7 6.2L18.9 2z', fill: true },
  { label: 'Discord', short: 'Discord', href: 'https://discord.gg/jfkzn5GS', discord: true },
  { label: 'YouTube', short: 'YouTube', href: 'https://www.youtube.com/@LMRcapitals', path: 'M10 9l6 3-6 3V9z', rect: [2, 5, 20, 14, 4] },
  { label: 'Instagram', short: 'Instagram', href: 'https://www.instagram.com/lmrcapitals/', path: 'M12 8a4 4 0 100 8 4 4 0 000-8z', rect: [3, 3, 18, 18, 5] },
  { label: 'Email', short: 'Email', href: 'mailto:admin@lmrcapitals.com', path: 'M3 6l9 7 9-7', rect: [2.5, 5, 19, 14, 3] },
];
const supabase = createClient('https://agrvylclhvxyevsmmexf.supabase.co', 'sb_publishable_vUhBxc3efVrs41yc9WZmAA_SnhBIrDh', { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });

function Arrow({ diagonal = false }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={diagonal ? 'M5 19 19 5M5 5h14v14' : 'M3 12h17m-7-7 7 7-7 7'} /></svg>;
}
function Mark() {
  return <span className="brand-lockup"><span className="brand-mark-frame"><img src="/icons/lmr-icon-color.png" alt="" width="78" height="78" /></span><b>Capitals</b></span>;
}
function SocialIcon({ item }) {
  if (item.discord) return <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5c2.6-.8 5.4-.8 8 0l.9-1.3 2.4.8 1.3 3.1c1.2 2.7 1.8 5.8 1.4 9-1.3 1.2-2.9 2-4.6 2.6l-1.1-1.8c.6-.3 1.1-.6 1.6-1a15 15 0 0 1-11.8 0c.5.4 1 .7 1.6 1l-1.1 1.8c-1.7-.6-3.3-1.4-4.6-2.6-.4-3.2.2-6.3 1.4-9L4.7 5l2.4-.8L8 5.5Z" /><circle className="discord-eye" cx="8.8" cy="12.25" r="1.25" /><circle className="discord-eye" cx="15.2" cy="12.25" r="1.25" /></svg>;
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill={item.fill ? 'currentColor' : 'none'} stroke={item.fill ? 'none' : 'currentColor'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{item.rect && <rect x={item.rect[0]} y={item.rect[1]} width={item.rect[2]} height={item.rect[3]} rx={item.rect[4]} />}<path d={item.path} /></svg>;
}
function Reveal({ children, reduced, className = '' }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, .25, .75, 1], [18, 0, 0, -18]);
  const opacity = useTransform(scrollYProgress, [0, .25, .75, 1], [.72, 1, 1, .72]);
  return <motion.div ref={ref} className={className} style={reduced ? {} : { y, opacity }}>{children}</motion.div>;
}
function useMotionPreference() {
  const [system, setSystem] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [choice, setChoice] = useState(() => {
    const query = new URLSearchParams(location.search).get('motion');
    if (query === 'on' || query === 'off') return query;
    try { return sessionStorage.getItem('lmr-preview-motion') || 'system'; } catch { return 'system'; }
  });
  const reduced = choice === 'off' || choice === 'system' && system;
  useEffect(() => { const media = matchMedia('(prefers-reduced-motion: reduce)'); const change = () => setSystem(media.matches); media.addEventListener('change', change); return () => media.removeEventListener('change', change); }, []);
  useEffect(() => { document.documentElement.dataset.motion = reduced ? 'off' : 'on'; return () => { delete document.documentElement.dataset.motion; }; }, [reduced]);
  useEffect(() => { const change = () => { document.documentElement.dataset.pageHidden = String(document.hidden); }; change(); document.addEventListener('visibilitychange', change); return () => document.removeEventListener('visibilitychange', change); }, []);
  const toggle = () => { const next = reduced ? 'on' : 'off'; setChoice(next); try { sessionStorage.setItem('lmr-preview-motion', next); } catch {} const url = new URL(location.href); url.searchParams.set('motion', next); history.replaceState(null, '', url); };
  return [reduced, toggle];
}

function Header({ reduced, toggleMotion }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('top');
  const menuRef = useRef(null), navRef = useRef(null);
  useEffect(() => {
    let frame = 0;
    const update = () => { frame = 0; let id = 'top'; for (const [candidate] of NAV) { if (document.getElementById(candidate)?.getBoundingClientRect().top <= window.innerHeight * .36) id = candidate; } setActive(id); };
    const scroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update(); window.addEventListener('scroll', scroll, { passive: true }); window.addEventListener('resize', scroll);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', scroll); window.removeEventListener('resize', scroll); };
  }, []);
  useEffect(() => {
    if (!open) return;
    navRef.current?.querySelector('a')?.focus();
    const key = event => {
      if (event.key === 'Escape') { setOpen(false); menuRef.current?.focus(); }
      if (event.key === 'Tab') {
        const items = [...navRef.current.querySelectorAll('a'), menuRef.current];
        const index = items.indexOf(document.activeElement);
        if (event.shiftKey && index === 0) { event.preventDefault(); items.at(-1).focus(); }
        if (!event.shiftKey && index === items.length - 1) { event.preventDefault(); items[0].focus(); }
      }
    };
    document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key);
  }, [open]);
  return <header className="site-header"><div className="shell header-inner">
    <a href="#top" className="brand" aria-label="LMR Capitals — back to top" onClick={() => setOpen(false)}><Mark /></a>
    <nav ref={navRef} id="main-navigation" className={`nav${open ? ' nav-open' : ''}`} aria-label="Primary navigation">{NAV.map(([id, label]) => <a key={id} href={`#${id}`} aria-current={active === id ? 'location' : undefined} onClick={() => { setOpen(false); if (window.innerWidth <= 900) requestAnimationFrame(() => { const section = document.getElementById(id); section?.setAttribute('tabindex', '-1'); section?.focus({ preventScroll: true }); }); }}>{label}{active === id && <motion.span className="nav-active" layoutId="active-section" transition={{ duration: reduced ? 0 : .28, ease: EASE }} />}</a>)}</nav>
    <div className="header-actions"><button className="motion-toggle" type="button" onClick={toggleMotion} aria-pressed={!reduced} aria-label={`Page motion ${reduced ? 'off' : 'on'}. ${reduced ? 'Enable' : 'Disable'} animation`}><span className="motion-dot" />Motion <b>{reduced ? 'off' : 'on'}</b></button><a className="button button-gold header-signin" href="/member/index.html">Sign In</a><button ref={menuRef} className="menu-toggle" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="main-navigation" onClick={() => setOpen(value => !value)}><span /><span /></button></div>
  </div></header>;
}

function Hero({ reduced }) {
  const ref = useRef(null), active = useInView(ref);
  return <section ref={ref} id="top" className="hero" aria-labelledby="hero-title" data-od-id="stage">
    <style>{MARKET_CSS}</style><div className="market-art" data-active={active && !reduced} dangerouslySetInnerHTML={{ __html: MARKET_SVG }} /><div className="hero-shade" />
    <div className="shell hero-frame" data-od-id="chrome"><span>A DOCUMENTED TRADING PRACTICE</span><span>LMR CAPITALS / THE CHAIN</span></div>
    <div className="shell hero-content"><p className="hero-role">Trader <i /> Mentor <i /> Fund Manager</p><h1 id="hero-title" data-od-id="headline">Trade With a System.<br />Master <em>The Chain.</em></h1><p className="hero-body">LMR Capitals is the professional trading practice and journal behind a structured Daily → Weekly → Monthly methodology. Every trade, every model, and every lesson is logged here in real time—and the same framework powers the mentorship and managed accounts I run for clients.</p><div className="hero-actions"><a className="button button-gold" href="/member/index.html">Sign In / Sign Up <Arrow /></a><a className="button button-outline" href="#about">Learn More <Arrow /></a></div></div>
    <div className="shell hero-baseline"><span>Context. Execution. Review.</span><a href="#about">Follow the process <Arrow /></a><span>DAILY / WEEKLY / MONTHLY</span></div>
  </section>;
}

function Who({ reduced }) {
  return <section id="about" className="who-section section-space"><div className="shell"><div className="who-layout"><Reveal reduced={reduced}><h2>A trader who treats trading <em>like a business.</em></h2></Reveal><div className="who-detail"><span className="section-label">Who I Am</span><p>I’m the founder and head trader at LMR Capitals. Every session starts with a plan and ends with a review—daily bias, higher-timeframe points of interest, session profile, execution, and the emotions behind every decision are logged in this journal, organized end to end by one system: The Chain.</p><a className="text-link" href="#method">Inside the methodology <Arrow diagonal /></a></div></div><PracticeSequence reduced={reduced} /></div></section>;
}

const PILLARS = [
  { word: 'Document', title: 'Trading Journal & Track Record', copy: 'Every trade—entry, exit, model, session, risk, and result—is logged in real time. Daily, weekly, and monthly reports turn that data into a transparent track record.', link: '#record', action: 'Explore the records' },
  { word: 'Learn', title: 'Education & Mentorship', copy: 'The MMBM/MMSM weekly models, session profiling, higher-timeframe bias, and the psychology of consistency—taught from the same playbook used in the live journal.', link: '#method', action: 'Follow The Chain' },
  { word: 'Apply', title: 'Fund & Signal Management', copy: 'For clients seeking disciplined, rules-based exposure, managed accounts and trade signals are built on the process documented in the journal.', link: '#contact', action: 'Get in touch' },
];
function PillarArtwork({ index, progress, reduced }) {
  const layer = { progress, reduced };
  return <div className={`pillar-art pillar-art-${index}`} aria-hidden="true">
    {index === 0 && <div className="journal-specimen"><div className="specimen-title">LMR / JOURNAL <span>PLAN → REVIEW</span></div><ArtworkLayer {...layer} as="strong">The decision.<br /><em>Not just the result.</em></ArtworkLayer><div className="journal-ledger">{['Context', 'Model + session', 'Risk + execution', 'Emotion + lesson'].map((field, i) => <ArtworkLayer {...layer} order={i + 1} key={field}><span>0{i + 1}</span><b>{field}</b><i /></ArtworkLayer>)}</div></div>}
    {index === 1 && <div className="model-specimen"><span>ONE PLAYBOOK / CONNECTED TIMEFRAMES</span><div className="timeframe-stack">{[['Monthly', 'Context'], ['Weekly', 'Model'], ['Daily', 'Plan'], ['Session', 'Observe']].map(([label, detail], i) => <ArtworkLayer {...layer} as="b" order={i} key={label}>{label}<small>{detail}</small></ArtworkLayer>)}</div><ArtworkLayer {...layer} order={4}><p>Understand the relationship.<br />Then apply the process.</p></ArtworkLayer></div>}
    {index === 2 && <div className="decision-specimen"><span>THE SAME RULES / EVERY DECISION</span><div className="decision-route">{['CONTEXT', 'CONFIRMATION', 'EXECUTION'].map((label, i) => <React.Fragment key={label}>{i > 0 && <i />}<ArtworkLayer {...layer} as="b" order={i}>{label}</ArtworkLayer></React.Fragment>)}</div><ArtworkLayer {...layer} order={3} className="decision-return">REVIEW RETURNS TO THE PLAN <Arrow /></ArtworkLayer><ArtworkLayer {...layer} order={4} as="strong">A defined process.<br /><em>A documented decision.</em></ArtworkLayer></div>}
  </div>;
}
function Pillar({ item, index, reduced }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 95%', 'end 5%'] });
  const scale = useTransform(scrollYProgress, [0, .4, .78, 1], [.88, 1, 1, .97]);
  const rotateX = useTransform(scrollYProgress, [0, .4, .78, 1], [24, 0, 0, -7]);
  const rotateY = useTransform(scrollYProgress, [0, .4, .78, 1], [index % 2 ? 17 : -17, 0, 0, index % 2 ? -5 : 5]);
  const y = useTransform(scrollYProgress, [0, .4, .78, 1], [75, 0, 0, -25]);
  const copyX = useTransform(scrollYProgress, [0, .35, .8, 1], [index % 2 ? 18 : -18, 0, 0, index % 2 ? -18 : 18]);
  const copyOpacity = useTransform(scrollYProgress, [0, .3, .8, 1], [.5, 1, 1, .5]);
  return <article ref={ref} className="pillar-chapter"><motion.div className="pillar-copy" style={reduced ? {} : { x: copyX, opacity: copyOpacity }}><span className="pillar-word">{item.word}</span><h3>{item.title}</h3><p>{item.copy}</p><a className="text-link" href={item.link}>{item.action}<Arrow diagonal /></a></motion.div><motion.div className="pillar-art-wrap" style={reduced ? {} : { scale, rotateX, rotateY, y }}><PillarArtwork index={index} progress={scrollYProgress} reduced={reduced} /></motion.div></article>;
}
function What({ reduced }) {
  return <section id="what" className="what-section section-space shell"><div className="section-intro"><Reveal reduced={reduced}><h2>What We Do at<br /><em>LMR Capitals.</em></h2></Reveal><p>One methodology, applied across three connected pillars: my own trading, the traders I mentor, and the clients I work with.</p></div><div className="pillar-list">{PILLARS.map((item, index) => <Pillar key={item.word} item={item} index={index} reduced={reduced} />)}</div></section>;
}

function RecordCard({ item, onOpen, duplicate = false }) {
  const [broken, setBroken] = useState(false);
  const image = !broken && typeof item.image === 'string' && (/^data:image\/(png|jpe?g|webp);base64,/i.test(item.image) || /^https:\/\//i.test(item.image));
  const payout = item.category?.toLowerCase().includes('payout');
  const amount = Number(item.amount);
  const parsedDate = new Date(`${item.achieved_on}T12:00:00Z`);
  const date = !Number.isNaN(parsedDate.getTime()) ? new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(parsedDate) : '';
  return <article className="record"><div className="record-media">{image ? <button type="button" className="record-image-button" tabIndex={duplicate ? -1 : 0} aria-label={`Expand ${item.title || 'certificate'}`} onClick={() => onOpen(item)}><img src={item.image} alt={`${item.category || 'Achievement'} certificate${item.firm ? ` from ${item.firm}` : ''}`} loading="lazy" draggable="false" onError={() => setBroken(true)} /><span>View certificate</span></button> : <div className="record-placeholder"><span>LMR CAPITALS / PUBLIC JOURNAL</span><strong>{payout ? 'Payout' : 'Published record'}</strong><i /><span>{broken ? 'Certificate image unavailable' : 'A documented achievement'}</span></div>}</div><div className="record-body"><span className="record-category">{item.category || 'Achievement'}</span><h3>{item.title || item.category || 'Published achievement'}</h3><p>{[item.firm, date].filter(Boolean).join(' · ')}</p>{payout && Number.isFinite(amount) && amount > 0 && <strong className="record-amount">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)}</strong>}</div></article>;
}

function RecordGallery({ records, reduced }) {
  const ref = useRef(null), drag = useRef(null), suppressClick = useRef(false);
  const [selected, setSelected] = useState(null);
  const visible = useInView(ref);
  const x = useMotionValue(0);
  const [width, setWidth] = useState(0), [revision, setRevision] = useState(0);
  const [paused, setPaused] = useState(false), [hover, setHover] = useState(false), [focus, setFocus] = useState(false), [dragging, setDragging] = useState(false);
  const loop = records.length > 1 && !reduced;
  const moving = loop && visible && !paused && !hover && !focus && !dragging && !selected;
  const wrap = value => wrapSliderPosition(value, width);
  const moveBy = delta => { if (loop) { x.set(wrap(x.get() - delta)); setRevision(value => value + 1); } else ref.current?.scrollBy({ left: delta, behavior: reduced ? 'instant' : 'smooth' }); };
  const start = event => {
    if (!loop || event.pointerType === 'mouse' && event.button !== 0) return;
    suppressClick.current = false;
    drag.current = { id: event.pointerId, start: event.clientX, y: event.clientY, x: x.get(), touch: event.pointerType !== 'mouse', accepted: false };
    setDragging(true);
  };
  const move = event => {
    const d = drag.current; if (!d || d.id !== event.pointerId) return;
    const dx = event.clientX - d.start, dy = event.clientY - d.y;
    if (!d.accepted && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) { drag.current = null; setDragging(false); return; }
    if (!d.accepted && Math.abs(dx) > 8) { d.accepted = true; suppressClick.current = true; event.currentTarget.setPointerCapture(event.pointerId); }
    if (d.accepted) x.set(wrap(d.x + dx));
  };
  const end = event => { if (drag.current?.id !== event.pointerId) return; drag.current = null; setDragging(false); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); };
  return <>
    <div className="record-toolbar"><span>{records.length} published records <i /> Funded passes & payouts</span><div className="record-tools"><span className="drag-hint">Drag to explore</span><button type="button" aria-label="Previous records" onClick={() => moveBy(-350)}>←</button>{loop && <button className="ticker-toggle" type="button" aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? 'Play ticker' : 'Pause ticker'}</button>}<button type="button" aria-label="Next records" onClick={() => moveBy(350)}>→</button></div></div>
    <div ref={ref} className={`record-gallery${loop ? ' is-looping' : ' is-static'}${dragging ? ' is-dragging' : ''}`} role="region" aria-label="Published records. Hover to pause; drag, swipe, or use arrow keys to browse." tabIndex={0} data-moving={moving}
      onClickCapture={event => { if (suppressClick.current && event.detail !== 0) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; } }}
      onPointerEnter={event => { if (event.pointerType === 'mouse') setHover(true); }} onPointerLeave={() => { setHover(false); if (drag.current && !drag.current.accepted) { drag.current = null; setDragging(false); } }} onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={() => { drag.current = null; setDragging(false); }}
      onFocus={() => setFocus(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocus(false); }} onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); setFocus(true); moveBy(event.key === 'ArrowRight' ? 350 : -350); } }}>
      <InfiniteSlider translation={x} running={moving} enabled={loop} speed={TIMING.gallerySpeed} viewportRef={ref} onMeasure={setWidth} revision={revision}>{records.map(item => <RecordCard key={item.id} item={item} onOpen={setSelected} />)}</InfiniteSlider>
    </div>
    {selected && <ImageViewer src={selected.image} title={selected.title || 'Certificate'} reduced={reduced} onClose={() => setSelected(null)} />}
  </>;
}
function Proof({ reduced }) {
  const [state, setState] = useState({ status: 'loading', records: [] }), [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let alive = true;
    // Preserve the public-only query. No member session or private journal data is used.
    supabase.from('lmr_achievements').select('id,title,category,firm,amount,achieved_on,caption,image').eq('is_public', true).order('achieved_on', { ascending: false }).limit(12)
      .then(({ data, error }) => { if (alive) setState(error ? { status: 'error', records: [] } : { status: 'ready', records: data || [] }); })
      .catch(() => { if (alive) setState({ status: 'error', records: [] }); });
    return () => { alive = false; };
  }, [refresh]);
  return <section id="record" className="proof-section section-space" aria-labelledby="record-title"><div className="shell"><div className="section-intro"><Reveal reduced={reduced}><h2 id="record-title">The record belongs<br /><em>in the open.</em></h2></Reveal><p>Funded passes and payouts published from the LMR journal. Select records are shown here only when marked public.</p></div>
    {state.status === 'loading' && <p className="records-status" role="status">Loading public records…</p>}
    {state.status === 'error' && <div className="records-status" role="status">Public records could not load. <button type="button" onClick={() => { setState({ status: 'loading', records: [] }); setRefresh(value => value + 1); }}>Try again</button></div>}
    {state.status === 'ready' && !state.records.length && <p className="records-status">No public funded-pass or payout records are available yet.</p>}
    {state.records.length > 0 && <><RecordGallery records={state.records} reduced={reduced} /><p className="proof-note">Showing published achievements only. Certificates and amounts come from the public journal record.</p></>}
  </div></section>;
}

const LEGAL = {
  terms: { title: 'Terms of Service', paragraphs: ['The final Terms of Service must describe account access, subscriptions, indicator licensing, cancellations, and the obligations of LMR Capitals and its users.', 'This design preview does not create a trial, purchase, subscription, or agreement. Final terms must be reviewed and approved before publication.'] },
  privacy: { title: 'Privacy Policy', paragraphs: ['This preview reads only achievements explicitly marked public in the LMR journal. The account application has separate sign-in and data features.', 'The final policy must explain what personal data the production app collects, why it is used, who processes it, retention, security, and how users can make privacy requests. It requires review before publication.'] },
  risk: { title: 'Risk Disclosure', paragraphs: ['Futures trading involves substantial risk of loss and is not suitable for all investors. Past performance is not indicative of future results.', 'All content is general information only and does not constitute financial advice.'] },
};
function LegalPreview({ kind, onClose }) {
  const ref = useRef(null);
  useEffect(() => { const previous = document.activeElement; ref.current?.showModal(); return () => previous?.focus(); }, []);
  return <dialog ref={ref} className="legal-dialog" onCancel={onClose} onClose={onClose} aria-labelledby="legal-title"><button className="legal-close" type="button" aria-label="Close disclosure" onClick={onClose}>×</button><h2 id="legal-title">{LEGAL[kind].title}</h2>{LEGAL[kind].paragraphs.map(text => <p key={text}>{text}</p>)}{previewPage && kind !== 'risk' && <small>Design preview only. No final legal policy has been supplied for this project.</small>}</dialog>;
}
function Plans({ reduced }) {
  return <section id="plans" className="plans-section section-space" aria-labelledby="plans-title"><div className="shell plans-layout">
    <div className="plans-intro"><Reveal reduced={reduced}><h2 id="plans-title">The system stays <em>within reach.</em></h2></Reveal><p>Create a free Inner Circle account for chapter learning and resources. Membership unlocks live analysis, observations, private support and the trading application.</p><a className="button button-gold" href="/inner-circle?signup=1">Join free Inner Circle <Arrow /></a></div>
    <div className="plans-prices" aria-label="LMR Capitals app subscription options">
      <div className="plans-price"><div><h3>Monthly</h3><p>Billed monthly with paid membership.</p></div><div className="plans-amount"><strong>$25</strong><span>/ month</span></div></div>
      <div className="plans-price"><div><h3>Yearly</h3><p>Billed yearly with paid membership. Save $30 compared with 12 monthly payments.</p></div><div className="plans-amount"><strong>$270</strong><span>/ year</span></div></div>
      <p className="plans-footnote">Your account starts free. Choose membership after sign-in; the final price, currency, taxes and renewal terms appear in Stripe before you confirm.</p>
    </div>
  </div></section>;
}
function Contact({ reduced }) {
  const ref = useRef(null), inView = useInView(ref, { once: false, amount: .2 });
  const enter = reduced || inView;
  return <section ref={ref} id="contact" className="contact-section section-space shell" aria-labelledby="contact-title">
    <h2 id="contact-title"><span className="contact-line"><motion.span initial={false} animate={{ y: enter ? 0 : '104%' }} transition={{ duration: TIMING.contactTitle, ease: EASE }}>Connect with</motion.span></span><span className="contact-line"><motion.em initial={false} animate={{ y: enter ? 0 : '104%' }} transition={{ duration: TIMING.contactTitle, delay: reduced ? 0 : TIMING.contactLineDelay, ease: EASE }}>LMR Capitals.</motion.em></span></h2>
    <div className="contact-bottom"><p>Follow along, join the community,<br />or reach out directly.</p><a className="contact-email" href="mailto:admin@lmrcapitals.com">admin@lmrcapitals.com <Arrow diagonal /></a></div>
    <nav className="contact-socials" aria-label="LMR social channels">{SOCIAL.map((item, index) => <motion.a key={item.label} href={item.href} aria-label={item.label} initial={false} animate={{ y: enter ? 0 : 65, opacity: enter ? 1 : .25 }} transition={{ duration: TIMING.socialEnter, delay: reduced ? 0 : TIMING.socialDelay + index * TIMING.socialStagger, ease: EASE }}><SocialIcon item={item} /><span>{item.short}</span><Arrow diagonal /></motion.a>)}</nav>
  </section>;
}
function App() {
  const [reduced, toggleMotion] = useMotionPreference();
  const [legalOpen, setLegalOpen] = useState(null);
  return <MotionConfig reducedMotion={reduced ? 'always' : 'never'} transition={{ ease: EASE }}>
    <a className="skip-link" href="#main">Skip to main content</a>{previewPage && <div className="preview-ribbon">Interactive homepage preview <span>Not the published site</span></div>}<Header reduced={reduced} toggleMotion={toggleMotion} />
    <main id="main"><Hero reduced={reduced} /><Who reduced={reduced} /><What reduced={reduced} /><TradingJourney reduced={reduced} /><Proof reduced={reduced} />
      <RecentTrades reduced={reduced} /><Plans reduced={reduced} /><Contact reduced={reduced} />
    </main>
    <footer className="footer"><div className="shell footer-inner"><div className="footer-brand"><Mark /><p>Built on The Chain methodology.<br /><span className="footer-abn">ABN 24 168 533 274</span></p></div><nav className="footer-links" aria-label="Information"><span>Information</span><div><a href="/inner-circle/guide">Joining guide</a><a href="/inner-circle/guide#terms">Account terms</a><a href="/inner-circle/guide#privacy">Privacy notice</a>{Object.entries(LEGAL).filter(([key]) => previewPage || key === 'risk').map(([key, item]) => <button key={key} type="button" onClick={() => setLegalOpen(key)}>{item.title}</button>)}</div></nav></div><div className="shell footer-bottom"><span>LMR Capitals © {new Date().getFullYear()}</span>{previewPage && <span>Policy wording in this preview requires review before publication.</span>}</div></footer>
    {legalOpen && <LegalPreview kind={legalOpen} onClose={() => setLegalOpen(null)} />}
  </MotionConfig>;
}

const container = document.getElementById('root');
const root = container.__lmrCinematicRoot || createRoot(container);
container.__lmrCinematicRoot = root;
root.render(<App />);
