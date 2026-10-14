/*
 * Adapted from Motion Primitives Infinite Slider by ibelick.
 * https://github.com/ibelick/motion-primitives/blob/main/components/core/infinite-slider.tsx
 * MIT license: see motion-primitives.LICENSE.txt.
 * Preview adaptation: controlled pause/translation, native ResizeObserver,
 * enough inaccessible duplicates for wide screens, and stable resume after drag.
 */
import React, { useEffect, useRef, useState } from 'react';
import { animate, motion } from 'motion/react';

export const wrapSliderPosition = (value, width) => width > 0 ? -(((-value % width) + width) % width) : 0;

export function InfiniteSlider({ children, translation, running, enabled, speed = 25, viewportRef, onMeasure, revision = 0 }) {
  const groupRef = useRef(null);
  const [width, setWidth] = useState(0), [copies, setCopies] = useState(2);
  const [cycle, setCycle] = useState(0), [hidden, setHidden] = useState(() => document.hidden);
  useEffect(() => {
    const visibility = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', visibility);
    return () => document.removeEventListener('visibilitychange', visibility);
  }, []);
  useEffect(() => {
    const measure = () => {
      const size = groupRef.current?.getBoundingClientRect().width || 0;
      setWidth(size); onMeasure(size);
      setCopies(size ? Math.max(2, Math.ceil((viewportRef.current?.clientWidth || 0) / size) + 1) : 2);
      translation.set(wrapSliderPosition(translation.get(), size));
    };
    const observer = new ResizeObserver(measure);
    if (groupRef.current) observer.observe(groupRef.current);
    if (viewportRef.current) observer.observe(viewportRef.current);
    measure();
    return () => observer.disconnect();
  }, [enabled, onMeasure, translation, viewportRef]);
  useEffect(() => {
    if (!enabled || !running || hidden || !width) return;
    const from = wrapSliderPosition(translation.get(), width);
    translation.set(from);
    // Finish the remaining distance at the same speed before beginning a new loop.
    const controls = animate(translation, [from, -width], {
      ease: 'linear', duration: (width + from) / speed,
      onComplete: () => { translation.set(0); setCycle(value => value + 1); },
    });
    return () => controls.stop();
  }, [enabled, running, hidden, width, speed, translation, cycle, revision]);
  return <motion.div className="record-track infinite-slider" data-slider="motion-primitives" style={{ x: enabled ? translation : 0 }}>
    <div ref={groupRef} className="record-group">{children}</div>
    {enabled && Array.from({ length: copies - 1 }, (_, index) => <div key={index} className="record-group" aria-hidden="true">{React.Children.map(children, child => React.cloneElement(child, { duplicate: true }))}</div>)}
  </motion.div>;
}
