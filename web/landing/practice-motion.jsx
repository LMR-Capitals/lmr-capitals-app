import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

// Scroll owns every frame. Each word gets a long hold, with no timer advancing it.
export const PRACTICE_PACING = { scrollSpan: 370, crossfade: .055 };
const WORDS = [['Plan', 'Set the context'], ['Execute', 'Require confirmation'], ['Review', 'Record the lesson']];

function PracticeWord({ index, progress, reduced }) {
  const start = index / 3, end = (index + 1) / 3, fade = PRACTICE_PACING.crossfade;
  const strength = useTransform(progress, value => {
    if (reduced) return 1;
    const entry = index === 0 ? 1 : Math.min(1, Math.max(0, (value - start + fade) / (fade * 2)));
    const exit = index === 2 ? 1 : Math.min(1, Math.max(0, (end + fade - value) / (fade * 2)));
    return Math.min(entry, exit);
  });
  const scale = useTransform(strength, [0, 1], [1, 1.065]);
  return <span className="practice-word">
    <motion.i className="practice-glow" aria-hidden="true" style={{ opacity: strength }} />
    <motion.strong style={{ scale: reduced ? 1 : scale }}>{WORDS[index][0]}<motion.b aria-hidden="true" style={{ opacity: strength }}>{WORDS[index][0]}</motion.b></motion.strong>
    <small>{WORDS[index][1]}</small>
    <motion.i className="practice-underline" aria-hidden="true" style={{ scaleX: strength }} />
  </span>;
}

export function PracticeSequence({ reduced }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 18%', 'end end'] });
  return <div ref={ref} className={`process-scroll${reduced ? ' is-still' : ''}`} style={{ '--practice-span': PRACTICE_PACING.scrollSpan }}>
    <div className="process-sticky"><div className="who-process" aria-label="LMR practice: plan, execute, review">
      {WORDS.map(([word], index) => <React.Fragment key={word}>{index > 0 && <i className="practice-connector" aria-hidden="true" />}<PracticeWord index={index} progress={scrollYProgress} reduced={reduced} /></React.Fragment>)}
    </div><div className="process-baseline"><span>Context before action. Review before repetition.</span>{!reduced && <span>Scroll to follow the process ↓</span>}</div></div>
  </div>;
}

// Layers share their parent's scroll position, but settle in sequence in 3D space.
export function ArtworkLayer({ children, progress, reduced, order = 0, as = 'div', className = '' }) {
  const Tag = as === 'b' ? motion.b : as === 'strong' ? motion.strong : motion.div;
  const start = .04 + order * .035, settle = .39 + order * .035;
  const y = useTransform(progress, [start, settle, .85, 1], [32 + order * 7, 0, 0, -10]);
  const z = useTransform(progress, [start, settle, .85, 1], [100 + order * 24, 10 + order * 4, 10 + order * 4, 0]);
  const opacity = useTransform(progress, [start, settle], [.38, 1]);
  return <Tag className={`art-depth-layer ${className}`} style={reduced ? {} : { y, z, opacity }}>{children}</Tag>;
}
