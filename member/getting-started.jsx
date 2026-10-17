import React, { useState } from "react";
import Icon from "./icons";
import { guideUrl } from "./guidelines.mjs";
import { onboardingKey } from "./enrollment.mjs";

export default function GettingStarted({ userId, data, go, premium }) {
  const key = onboardingKey(userId);
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(key) === "true"; } catch { return false; }
  });
  const firstChapterDone = data.learning?.some(row => row.chapter_no === 1 && row.completed_at);
  const profileDone = !!(data.profile?.display_name && data.profile?.timezone);
  if (dismissed || firstChapterDone) return null;
  return <section className="getting-started" aria-label="Getting started with Inner Circle">
    <div className="getting-started-heading"><div><h2>Start here. Learn one idea at a time.</h2><p>{premium ? "Your paid workspace is open. Begin with the foundations, then explore the live desk." : "No previous knowledge needed. Read Fundamentals, work through Trading Mathematics, then continue into the LMR reference."}</p></div><button className="text-button" onClick={() => { setDismissed(true); try { localStorage.setItem(key, "true"); } catch { /* A blocked storage setting must not prevent exploration. */ } }}>I’ll explore on my own</button></div>
    <ol><li><button onClick={() => go("terminology")}><Icon name="terminology" size={18} /><span>Start Fundamentals<small>Trading, investing, markets and brokers—all on one page</small></span><Icon name="arrow" size={15} /></button></li><li><button onClick={() => go("resources")}><Icon name="resources" size={18} /><span>Open your starter kit<small>Checklist, glossary and reflection worksheet</small></span><Icon name="arrow" size={15} /></button></li><li><button onClick={() => go("questions")}><Icon name="questions" size={18} /><span>Ask a private question<small>Included with your free account</small></span><Icon name="arrow" size={15} /></button></li></ol>
  </section>;
}
