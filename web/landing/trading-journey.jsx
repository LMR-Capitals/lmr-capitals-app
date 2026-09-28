import React, { useEffect, useMemo, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useMotionValueEvent, useScroll, useTransform } from 'motion/react';
import { CHAPTERS, METHOD_COUNT, makeTimeline, sampleTimeline, chapterProgress } from './journey-content.js';

function useViewport() {
  const read = () => ({ phone: window.innerWidth <= 820, short: window.innerHeight < 690 });
  const [viewport, setViewport] = useState(read);
  useEffect(() => { const onResize = () => setViewport(read()); window.addEventListener('resize', onResize); return () => window.removeEventListener('resize', onResize); }, []);
  return viewport;
}

function ChapterCopy({ chapter, index, headingId }) {
  return <>
    <div className="journey-chapter-index"><span>{index < METHOD_COUNT ? 'THE CHAIN' : 'AT THE DESK'}</span><span>{String(index < METHOD_COUNT ? index + 1 : index - METHOD_COUNT + 1).padStart(2, '0')} / {index < METHOD_COUNT ? '07' : '04'}</span></div>
    <h3 id={headingId}>{chapter.title}</h3>
    <p className="journey-question">{chapter.question}</p>
    <p className="journey-explanation">{chapter.copy}</p>
    <ul className="journey-fields">{chapter.fields.map(field => <li key={field}>{field}</li>)}</ul>
  </>;
}

function FlowingJourney({ reason, onCinematic }) {
  return <section id="method" className="flowing-journey shell" aria-labelledby="method-title">
    <div className="reading-monitor" aria-hidden="true"><strong>THE CHAIN</strong><span>Monthly → Weekly → Daily → Session → Trade → Journal</span></div>
    <div className="section-intro"><h2 id="method-title">Every decision <em>connects.</em></h2><p>From the larger market context to the decision at the desk. Follow the process at your own pace.</p></div>
    <div className="reading-mode-note"><span>{reason}</span>{onCinematic && <button type="button" onClick={onCinematic}>Return to cinematic view</button>}</div>
    {CHAPTERS.map((chapter, index) => <React.Fragment key={chapter.id}>
      {index === METHOD_COUNT && <div id="conviction" className="desk-chapter-heading"><h2>From the monitor.<br /><em>To the decision.</em></h2><p>The same desk. The same plan. Now apply what The Chain has made visible.</p></div>}
      <article id={`chapter-${chapter.id}`} className="flowing-chapter"><ChapterCopy chapter={chapter} index={index} /></article>
    </React.Fragment>)}
    <p className="journey-disclaimer">Illustrative decision process—not a live trade or performance claim.</p>
    <a className="text-link" href="#record">Explore the public records <span aria-hidden="true">↗</span></a>
  </section>;
}

export function TradingJourney({ reduced }) {
  const viewport = useViewport();
  const [reading, setReading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [overflow, setOverflow] = useState(false);
  const timeline = useMemo(() => makeTimeline(viewport.phone), [viewport.phone]);
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const copyRef = useRef(null);
  const sceneRef = useRef(null);
  const travelRef = useRef(null);
  const sampleRef = useRef(sampleTimeline(0, timeline));
  const [current, setCurrent] = useState(sampleRef.current);
  const flowing = reduced || viewport.short || reading || failed || overflow;
  const opacity = useMotionValue(1);
  const landingMask = useTransform(opacity, value => `inset(0% 0% ${(1 - value) * 100}% 0%)`);
  const y = useMotionValue(0);
  const { scrollYProgress } = useScroll({ target: rootRef, offset: ['start start', 'end end'] });

  useEffect(() => { if (flowing) travelRef.current?.stop(); }, [flowing]);

  useMotionValueEvent(scrollYProgress, 'change', progress => {
    if (flowing) return;
    const sample = sampleTimeline(progress, timeline);
    sampleRef.current = sample;
    opacity.set(sample.opacity);
    y.set((1 - sample.opacity) * 14);
    setCurrent(previous => previous.phase === sample.phase && previous.chapter === sample.chapter ? previous : sample);
    sceneRef.current?.setProgress(sample);
  });

  useEffect(() => {
    if (flowing) return undefined;
    const root = rootRef.current;
    let disposed = false, loading = false, visible = false;
    setReady(false);
    const observer = new IntersectionObserver(async ([entry]) => {
      visible = entry.isIntersecting;
      sceneRef.current?.setActive(visible);
      if (!visible || loading) return;
      loading = true;
      try {
        const { createTradingJourneyScene } = await import('./trading-journey-scene.js');
        if (disposed) return;
        sceneRef.current = createTradingJourneyScene(canvasRef.current, { compact: viewport.phone, onFailure: () => setFailed(true) });
        const travel = root.offsetHeight - window.innerHeight;
        const initial = sampleTimeline(-root.getBoundingClientRect().top / Math.max(1, travel), timeline);
        sampleRef.current = initial; setCurrent(initial); opacity.set(initial.opacity); y.set((1 - initial.opacity) * 14);
        sceneRef.current.setProgress(initial); sceneRef.current.setActive(visible); setReady(true);
      } catch (error) { if (!disposed) { console.warn('Trading scene unavailable; showing the readable journey.', error); setFailed(true); } }
    }, { rootMargin: '400px 0px' });
    observer.observe(root);
    return () => { disposed = true; observer.disconnect(); sceneRef.current?.dispose(); sceneRef.current = null; };
  }, [flowing, timeline, viewport.phone, opacity, y]);

  // Text size and narrow/short viewports must never trap copy inside the pinned frame.
  useEffect(() => {
    if (flowing || !ready || !copyRef.current || current.phase === 'handoff') return undefined;
    const check = () => { const node = copyRef.current; if (node && node.scrollHeight > node.clientHeight + 4) setOverflow(true); };
    let cancelled = false, first = 0, second = 0;
    const schedule = () => { cancelAnimationFrame(first); cancelAnimationFrame(second); first = requestAnimationFrame(() => { second = requestAnimationFrame(() => { if (!cancelled) check(); }); }); };
    const observer = new ResizeObserver(schedule); observer.observe(copyRef.current);
    document.fonts?.ready.then(() => { if (!cancelled) schedule(); });
    schedule();
    return () => { cancelled = true; observer.disconnect(); cancelAnimationFrame(first); cancelAnimationFrame(second); };
  }, [current.chapter, current.phase, flowing, ready]);

  useEffect(() => {
    const onResize = () => setOverflow(false);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const stop = () => travelRef.current?.stop();
    const onKey = event => { if (['PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown', ' '].includes(event.key)) stop(); };
    const onAnchor = event => { if (event.target.closest?.('a[href^="#"]')) stop(); };
    window.addEventListener('wheel', stop, { passive: true });
    window.addEventListener('touchstart', stop, { passive: true });
    window.addEventListener('keydown', onKey);
    document.addEventListener('click', onAnchor);
    return () => { stop(); window.removeEventListener('wheel', stop); window.removeEventListener('touchstart', stop); window.removeEventListener('keydown', onKey); document.removeEventListener('click', onAnchor); };
  }, []);

  const jump = index => {
    const root = rootRef.current;
    if (!root) return;
    const progress = chapterProgress(index, timeline);
    const top = window.scrollY + root.getBoundingClientRect().top + progress * (root.offsetHeight - window.innerHeight);
    travelRef.current?.stop();
    travelRef.current = animate(window.scrollY, top, {
      duration: current.phase === 'entry' ? 2.6 : 1.65,
      ease: [.22, 1, .36, 1],
      onUpdate: value => window.scrollTo({ top: value, behavior: 'instant' }),
    });
    const hash = index < METHOD_COUNT ? '#method' : '#conviction';
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${hash}`);
  };

  // Keep a real root ref in both layouts, so Motion never observes a missing element.
  if (flowing) return <div ref={rootRef} data-journey-mode="reading"><FlowingJourney
    reason={failed ? 'The 3D view is unavailable. Every chapter is available below.' : reduced ? 'Motion is off. The full process is here to read.' : viewport.short || overflow ? 'Reading layout keeps every chapter visible at this screen or text size.' : 'Reading view'}
    onCinematic={reading && !reduced && !viewport.short && !failed && !overflow ? () => setReading(false) : undefined}
  /></div>;

  const transition = ['entry', 'exit'].includes(current.phase);
  const title = current.phase === 'entry' ? <>It all runs<br />from <em>one desk.</em></> : current.phase === 'handoff' ? <>From the monitor.<br /><em>To the decision.</em></> : <>Close the journal.<br /><em>Carry the lesson.</em></>;
  return <section ref={rootRef} id="method" className="trading-journey" style={{ '--journey-span': timeline.total + 100 }} aria-labelledby="method-title" data-journey-mode="cinematic" data-phase={current.phase} data-chapter={current.chapter}>
    <h2 id="method-title" className="visually-hidden">The Chain: from market context to conviction</h2>
    <div id="conviction" className="journey-anchor" style={{ top: `${timeline.conviction}svh` }} />
    <div className="journey-sticky">
      <div className="journey-scene" aria-hidden="true"><canvas ref={canvasRef} /><div className="journey-scene-floor" />{!ready && <span className="scene-loading">Preparing the desk…</span>}</div>
      <div className="journey-topline"><span>LMR / THE CONNECTED PRACTICE</span><button type="button" onClick={() => setReading(true)}>Read all chapters</button></div>
      <p className="journey-scene-note">Illustrative process · Not a live trade or performance claim</p>
      <motion.div ref={copyRef} className={`journey-copy${transition ? ' is-transition' : ''}`} style={{ opacity, y: current.phase === 'handoff' || current.phase === 'desk' ? 0 : y, clipPath: current.phase === 'handoff' ? landingMask : 'none' }}>
        {transition ? <><h3>{title}</h3><p className="journey-explanation">{current.phase === 'entry' ? 'Every session, every model, every lesson—organized end to end by one system. Step inside the monitor and follow the links.' : current.phase === 'handoff' ? 'The methodology is learned. Now comes the decision. Bring the context back to the desk, and separate what happened from what remains unconfirmed.' : 'The review returns to the next plan. Beyond this illustrative process, the public journal records stand on their own.'}</p><p className="journey-transition-label">{current.phase === 'entry' ? 'SCROLL TO ENTER THE MONITOR' : current.phase === 'handoff' ? 'OBSERVE · CONFIRM · WAIT · REVIEW' : 'CONTINUE TO THE PUBLIC RECORDS'}</p></> : <ChapterCopy chapter={CHAPTERS[current.chapter]} index={current.chapter} />}
        {current.phase === 'entry' && <button type="button" className="journey-enter" onClick={() => jump(0)}>Enter the monitor <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M3 12h17m-6-6 6 6-6 6" /></svg></button>}
      </motion.div>
      <div className="journey-controls">
        <div className="journey-progress" aria-hidden="true"><motion.i style={{ scaleX: scrollYProgress }} /></div>
        <button className="chapter-arrow" type="button" aria-label="Previous chapter" disabled={current.chapter === 0} onClick={() => jump(current.chapter - 1)}>←</button>
        <label className="chapter-select"><span className="visually-hidden">Choose a journey chapter</span><select value={current.chapter} onChange={event => jump(Number(event.target.value))}>{CHAPTERS.map((chapter, index) => <option key={chapter.id} value={index}>{index < METHOD_COUNT ? 'The Chain' : 'At the desk'} / {chapter.short}</option>)}</select></label>
        <button className="chapter-arrow" type="button" aria-label="Next chapter" disabled={current.chapter === CHAPTERS.length - 1} onClick={() => jump(current.phase === 'entry' ? 0 : current.chapter + 1)}>→</button>
        <a href="#record" className="journey-skip">Skip to Track Records ↗</a>
      </div>
    </div>
    <div className="visually-hidden"><p>Illustrative decision process, not a live trade or a performance claim.</p><ol>{CHAPTERS.map(chapter => <li key={chapter.id}><strong>{chapter.title}</strong><p>{chapter.copy}</p></li>)}</ol></div>
  </section>;
}
