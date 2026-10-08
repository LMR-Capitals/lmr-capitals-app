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
    <div className="getting-started-heading"><div><h2>Make your first link in the Chain.</h2><p>{premium ? "Your paid workspace is open. Begin with the foundations, then explore the live desk." : "Your foundation is free. Start Chapter 1 and keep your learning moving."}</p></div><button className="text-button" onClick={() => { setDismissed(true); try { localStorage.setItem(key, "true"); } catch { /* A blocked storage setting must not prevent exploration. */ } }}>I’ll explore on my own</button></div>
    <ol><li><button onClick={() => go("profile")}><Icon name={profileDone ? "check" : "profile"} size={18} /><span>{profileDone ? "Your profile is ready" : "Set your name & time zone"}<small>{profileDone ? "You can edit it anytime" : "Help LMR understand your learning journey"}</small></span><Icon name="arrow" size={15} /></button></li><li><button onClick={() => go("terminology")}><Icon name="terminology" size={18} /><span>Begin Chapter 1<small>Complete its check to unlock Chapter 2</small></span><Icon name="arrow" size={15} /></button></li><li><a href={guideUrl}><Icon name="shield" size={18} /><span>Know your workspace<small>Access, membership & community guidelines</small></span><Icon name="arrow" size={15} /></a></li></ol>
  </section>;
}
