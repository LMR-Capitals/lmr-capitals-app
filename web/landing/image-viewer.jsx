import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

const VIEWER_TIMING = { enter: .35, exit: .2, zoom: .25 };
export function ImageViewer({ src, title, reduced, onClose }) {
  const ref = useRef(null);
  const [closing, setClosing] = useState(false), [zoom, setZoom] = useState(false), [broken, setBroken] = useState(false);
  useEffect(() => {
    const previous = document.activeElement, overflow = document.body.style.overflow;
    ref.current.showModal(); document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  }, []);
  const close = () => reduced ? onClose() : setClosing(true);
  return <dialog ref={ref} className="image-viewer" aria-label={title} onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === event.currentTarget) close(); }}>
    <motion.div className="image-viewer-panel" initial={reduced ? false : { scale: .86, opacity: 0 }} animate={{ scale: closing ? .86 : 1, opacity: closing ? 0 : 1 }} transition={{ duration: reduced ? 0 : closing ? VIEWER_TIMING.exit : VIEWER_TIMING.enter, ease: [.16, 1, .3, 1] }} onAnimationComplete={() => { if (closing) onClose(); }}>
      <header><h2>{title}</h2><div><button type="button" disabled={broken} aria-pressed={zoom} onClick={() => setZoom(value => !value)}>{zoom ? 'Fit image' : 'Zoom in'}</button><button autoFocus type="button" onClick={close} aria-label="Close image viewer">Close</button></div></header>
      <div className={`image-viewer-stage${zoom ? ' is-zoomed' : ''}`} tabIndex={zoom ? 0 : -1} aria-label="Image. Use scrollbars to explore when zoomed.">{broken ? <p role="status">This image could not load.</p> : <motion.img src={src} alt={title} draggable="false" onError={() => setBroken(true)} animate={{ scale: zoom ? 1.8 : 1 }} transition={{ duration: reduced ? 0 : VIEWER_TIMING.zoom }} style={{ transformOrigin: 'top left' }} />}</div>
    </motion.div>
  </dialog>;
}
