import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Logo } from "./ui";
import Icon from "./icons";
import { enrollmentReady, accountRegistrationReady } from "./config";
import { provider, policies, joiningSteps, accessComparison, guideUrl, policyDraftVersion } from "./guidelines.mjs";
import "./member.css";
import "./guide.css";

function Guide() {
  const [section, setSection] = useState(location.hash.slice(1) || "start");
  const selected = policies[section];
  useEffect(() => {
    const change = () => { setSection(location.hash.slice(1) || "start"); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  useEffect(() => { document.title = `${selected?.title || "Joining guide"} · LMR Inner Circle`; }, [selected]);
  return <div className="guide-shell">
    <a className="guide-skip" href="#guide-content" onClick={event => { event.preventDefault(); document.getElementById("guide-content").focus(); }}>Skip to content</a>
    <header className="guide-header">
      <a href="/" aria-label="LMR Capitals home"><Logo /></a>
      <a className="button" href="/inner-circle">Sign in <Icon name="arrow" size={16} /></a>
    </header>
    <div className="guide-layout">
      <aside className="guide-navigation">
        <a href={`${guideUrl}#start`} aria-current={!selected ? "page" : undefined}>Joining guide</a>
        {Object.entries(policies).map(([key, policy]) => <a key={key} href={`${guideUrl}#${key}`} aria-current={key === section ? "page" : undefined}>{policy.title}</a>)}
        <div className="guide-help"><p>Need help with your account?</p><a href={`mailto:${provider.contact}`}>{provider.contact}</a></div>
      </aside>
      <main id="guide-content" tabIndex={-1} className="guide-main">
        {selected ? <>
          <a className="text-button" href={`${guideUrl}#start`}>← Back to the joining guide</a>
          <h1>{selected.title}</h1>
          {selected.draft && !accountRegistrationReady && <div className="banner"><Icon name="shield" size={18} /><span><strong>Draft for review · {policyDraftVersion}</strong><br />These policies are available to read. They have not yet been approved for new registration or payment.</span></div>}
          <p className="guide-introduction">{selected.draft && accountRegistrationReady ? selected.title === policies.terms.title ? "These terms describe your free account, the proposed membership service and your responsibilities in the Inner Circle." : "How your account and membership information is used, stored and handled." : selected.introduction}</p>
          <article className="policy-document">{selected.sections.map(item => <section key={item.title}><h2>{item.title}</h2>{item.paragraphs.map(p => <p key={p}>{p}</p>)}</section>)}</article>
          <a className="button" href={`${guideUrl}#start`}>Return to joining guide</a>
        </> : <>
          <h1>Find your place<br />in the Inner Circle.</h1>
          <p className="guide-introduction">Start with the language. Build the process. Join the live desk when you are ready. Your learning journey is built on THE Chain Methodology.</p>
          <div className="guide-actions"><a className="button gold" href="/inner-circle?signup=1">Create a free account <Icon name="arrow" size={16} /></a><a href="/inner-circle" className="text-button">Already have an account? Sign in</a></div>
          {!enrollmentReady && <p className="guide-availability">{accountRegistrationReady ? "Free registration is open. New paid enrollment is awaiting the billing release." : "New registration and paid enrollment are awaiting final policy approval. Existing account holders can sign in."}</p>}
          <section className="guide-journey"><h2>From your first chapter to your live workspace.</h2><ol>{joiningSteps.map(step => <li key={step.title}><h3>{step.title}</h3><p>{step.body}</p></li>)}</ol></section>
          <section className="guide-comparison"><h2>Choose the access that fits your learning.</h2><p>Use the same account when you upgrade. A membership never includes administrator permissions.</p><div className="guide-table-wrap"><table><caption className="sr-only">Free account and paid membership access</caption><thead><tr><th scope="col">Inside your workspace</th><th scope="col">Free account</th><th scope="col">Paid membership</th></tr></thead><tbody>{accessComparison.map(([feature, free, paid]) => <tr key={feature}><th scope="row">{feature}</th><td>{free}</td><td>{paid}</td></tr>)}</tbody></table></div></section>
          <section className="guide-before"><h2>Before you subscribe.</h2><ul><li>Review the total, currency, billing interval and recurring payment details in Stripe before confirming.</li><li>Subscriptions renew according to the checkout terms until cancelled. Check the effective cancellation date in your billing confirmation.</li><li>Refund requests are reviewed case by case. Australian Consumer Law rights remain protected.</li><li>Mentorship access lets you submit a request. LMR confirms availability and scheduling separately.</li><li>Trading carries substantial risk. Content and achievements do not guarantee your results.</li></ul><div className="guide-policy-links">{Object.entries(policies).map(([key, policy]) => <a key={key} href={`${guideUrl}#${key}`}>{policy.title}<Icon name="arrow" size={15} /></a>)}</div></section>
          <section className="guide-faq"><h2>A few things worth knowing.</h2>{[
            ["Do I need a card to create a free account?", "No. The free account and learning chapters do not require Stripe checkout. Membership is a separate decision."],
            ["How do I unlock the next chapter?", "Study the current chapter and complete its knowledge check. The dashboard shows your saved progress and the next chapter available to you."],
            ["I paid, but access is still locked. What should I do?", "Open Profile → Membership and refresh your status. Payment must be verified before paid access opens. If your paid invoice is confirmed and access remains locked, email LMR with the invoice reference. Avoid purchasing a second subscription."],
            ["What happens if I leave checkout?", "Leaving or cancelling checkout does not by itself activate membership. Your free learning account remains available. Check your membership status and any invoice before trying again."],
            ["Where do I cancel or get billing help?", "Open Profile → Membership to see the available Stripe billing controls. If billing controls are unavailable, contact admin@lmrcapitals.com from your account email. Check the effective cancellation date after the request is confirmed."],
            ["Where are notifications and settings?", "Open the bell at the top of Inner Circle for notifications. Your profile menu contains your profile, notification settings and membership controls."],
          ].map(([question, answer]) => <details key={question}><summary>{question}<Icon name="chevron" size={16} /></summary><p>{answer}</p></details>)}</section>
          <section className="guide-support"><h2>Your first step can stay simple.</h2><p>{accountRegistrationReady ? "Create your account, then start Chapter 1. You can decide about membership later." : "Create your account when registration opens, then start Chapter 1. You can decide about membership later."}</p><a className="button gold" href="/inner-circle?signup=1">Go to free registration <Icon name="arrow" size={16} /></a></section>
        </>}
        <footer className="guide-footer"><p>{provider.name} · {provider.businessName}<br />ABN {provider.abn} · {provider.location}</p><p>Built on THE Chain Methodology.<br /><a href={`mailto:${provider.contact}`}>Contact LMR</a> · <a href="/inner-circle">Return to Inner Circle</a></p></footer>
      </main>
    </div>
  </div>;
}
createRoot(document.getElementById("root")).render(<Guide />);
