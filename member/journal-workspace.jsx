import React, { useEffect, useRef, useState } from "react";
import { journalWorkspaceMessage } from "./portal-flow.mjs";
import Icon from "./icons";
import { Button } from "./ui";

export default function JournalWorkspace({ active, preview, administrator, onNavigate, onVerify, onAccessCheck }) {
  const [visited, setVisited] = useState(active);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const frame = useRef(null);
  useEffect(() => { if (active) setVisited(true); }, [active]);
  useEffect(() => {
    const receive = (event) => {
      const action = journalWorkspaceMessage(event, frame.current?.contentWindow, location.origin);
      if (action === "circle") onNavigate(administrator ? "admin" : "dashboard");
      if (action === "membership") onNavigate("billing");
      if (action === "verify") onVerify();
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [onNavigate, onVerify, administrator]);
  useEffect(() => {
    if (!visited || ready || preview) return;
    const timeout = setTimeout(() => setFailed(true), 20000);
    return () => clearTimeout(timeout);
  }, [visited, ready, preview, attempt]);
  if (!visited && !active) return null;
  return <section className="journal-workspace" id="workspace-journal" tabIndex={-1} hidden={!active} aria-label="Trading Journal workspace">
    {preview ? <JournalPreview /> : <>
      {!ready && <div className="journal-loading" role="status">
        {!failed ? <><span className="spinner" />Opening your Trading Journal…</> : <><h2>The Journal is taking longer to open.</h2><p>Check your connection, then try again.</p><Button onClick={() => { setFailed(false); setReady(false); setAttempt((value) => value + 1); }}>Retry Journal</Button></>}
      </div>}
      <iframe key={attempt} ref={frame} src="/app/workspace.html" title="LMR Trading Journal" sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-popups allow-popups-to-escape-sandbox" onLoad={() => {
        try {
          const url = new URL(frame.current.contentWindow.location.href);
          if (url.pathname.startsWith("/admin")) { onVerify(); return; }
          if (["/inner-circle", "/member/index.html"].includes(url.pathname)) {
            onNavigate(url.hash === "#billing" ? "billing" : url.hash === "#admin-hub" ? "settings" : administrator ? "admin" : "dashboard");
            onAccessCheck();
            setFailed(true); return;
          }
          if (url.pathname === "/app/workspace.html" && frame.current.contentDocument?.getElementById("mainApp")) { setReady(true); setFailed(false); }
          else setFailed(true);
        } catch { setFailed(true); }
      }} />
    </>}
  </section>;
}

function JournalPreview() {
  const [page, setPage] = useState("Today"), [note, setNote] = useState("");
  return <div className="journal-preview-layout">
    <aside className="journal-preview-nav"><div className="workspace-label">THE CHAIN METHODOLOGY</div><h2>Trading Journal</h2><nav aria-label="Journal preview navigation">{["Today", "Daily pages", "Trades", "Observations", "Achievements"].map((label) => <button key={label} className={`nav-item ${page === label ? "active" : ""}`} aria-current={page === label ? "page" : undefined} onClick={() => setPage(label)}><Icon name={label === "Today" ? "calendar" : label === "Trades" ? "executions" : "application"} />{label}</button>)}</nav></aside>
    <div className="journal-preview-page"><span className="tag">JOURNAL WORKSPACE PREVIEW</span><h1>{page}</h1><p>Plan. Execute. Review. Built on THE Chain Methodology.</p><section className="panel form-panel"><h2>Keep your place as you switch.</h2><p>This sample note stays here when you return to Inner Circle and switch back. Your real Journal opens after account and access verification.</p><label htmlFor="workspace-preview-note">Your session plan</label><textarea id="workspace-preview-note" placeholder="What are you observing in this session?" value={note} onChange={(event) => setNote(event.target.value)} /><small>Preview only · Nothing is saved to your account.</small></section></div>
  </div>;
}
