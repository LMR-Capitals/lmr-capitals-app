import React, { useState } from 'react';
import { foundationPages, eurUsdPractice } from './foundation-content.mjs';
import { Button } from './ui';
import './foundation-reader.css';

const diagrams = {
  ownership: { title: 'What do you hold?', items: [['Share', 'A small ownership stake'], ['Bond', 'A loan to an issuer'], ['Derivative', 'A contract linked to a value']], caption: 'The product determines your rights. The holding period alone does not.' },
  'market-map': { title: 'Markets and their subject', items: [['Forex', 'Currencies'], ['Stocks', 'Company ownership'], ['Bonds', 'Debt']], caption: 'An index measures a selected market or group. A CFD or future is a way of getting exposure, not a separate underlying asset.' },
  currency: { title: 'Reading EUR/USD = 1.1000', items: [['EUR', 'Base: one euro'], ['1.1000', 'The exchange rate'], ['USD', 'Quote: 1.10 dollars']], caption: 'One euro is priced in US dollars. If this quote rises, the euro buys more dollars.', connected: true },
  derivatives: { title: 'One underlying, different contracts', items: [['Gold', 'Underlying asset'], ['Gold CFD', 'Contract with a provider'], ['Gold future', 'Exchange-traded contract']], caption: 'Both contracts reference gold. They have different terms, costs and settlement arrangements.' },
  'bond-yield': { title: 'Same $5 annual coupon, different purchase price', items: [['Price $100', '$5 ÷ $100 = 5%'], ['Price $80', '$5 ÷ $80 = 6.25%']], caption: 'Current yield rises as price falls when the coupon stays fixed. These are simplified current yields, not total returns.' },
  engine: { title: 'A way to read an economic release', items: [['Expected', 'What did people anticipate?'], ['Actual', 'What was announced?'], ['Reaction', 'What changed in prices?']], caption: 'The difference between expectations and the announcement can matter. Other news may affect the reaction too.', connected: true },
  pips: { title: 'A 25-pip EUR/USD move', items: [['1.1000', 'Starting price'], ['+ 0.0025', '25 × 0.0001'], ['1.1025', 'Ending price']], caption: 'Pips measure movement. Position size determines its money value.', connected: true },
  margin: { title: 'Three different amounts in the same example', items: [['$5,500', 'Market exposure'], ['$275', 'Margin at 5%'], ['$10', 'Planned 20-pip loss']], caption: '5,000 EUR/USD units at 1.1000; USD account. The planned loss excludes costs and slippage and is not a maximum loss.' },
  reward: { title: 'A hypothetical 1:2 risk-to-reward plan', items: [['−$10', 'Planned loss: 1R'], ['+$20', 'Target profit: 2R']], caption: 'R is the planned risk amount. The target is twice the risk; that says nothing about its probability.' }
};
function Diagram({ type }) {
  const diagram = diagrams[type];
  if (!diagram) return null;
  return <figure className="foundation-diagram" aria-label={diagram.title}>
    <p className="diagram-title">{diagram.title}</p>
    <div className={`diagram-nodes ${diagram.connected ? 'connected' : ''}`}>
      {diagram.items.map(([title, text]) => <div className="diagram-node" key={title}><strong>{title}</strong><span>{text}</span></div>)}
    </div>
    {type === 'reward' && <svg className="reward-bars" viewBox="0 0 480 64" role="img" aria-label="The reward bar is twice as long as the risk bar"><rect x="0" y="2" width="160" height="22" fill="#f4a6a3"/><rect x="0" y="38" width="320" height="22" fill="#8fceb2"/></svg>}
    <figcaption>{diagram.caption}</figcaption>
  </figure>;
}
function PositionPractice() {
  const [risk, setRisk] = useState('10');
  const [stop, setStop] = useState('20');
  const result = eurUsdPractice(Number(risk), Number(stop));
  return <div className="position-practice">
    <h4>Try the numbers</h4>
    <p>Change the stop from 20 to 40 pips and watch the position shrink. EUR/USD only, USD account, no costs or slippage. Values are examples, not recommended settings.</p>
    <div className="practice-inputs">
      <label>Planned risk (USD)<input type="number" min="0.01" step="any" value={risk} onChange={e => setRisk(e.target.value)} /></label>
      <label>Stop distance (pips)<input type="number" min="0.01" step="any" value={stop} onChange={e => setStop(e.target.value)} /></label>
    </div>
    <output aria-live="polite" aria-atomic="true">{result ? <><strong>{result.units.toLocaleString('en-US')} units</strong><span>${result.pipValue.toFixed(4)} per pip · ${result.plannedLoss.toFixed(2)} planned loss before costs</span></> : 'Enter positive values that produce a position of at least one unit.'}</output>
    <p className="practice-note">Rounded down to whole units for teaching. Your provider may require larger order increments. Check its specifications before using a real order size.</p>
  </div>;
}
export default function FoundationReader({ pageId, search = '', onNext, onQuestion }) {
  const page = foundationPages[pageId];
  const query = search.trim().toLowerCase();
  const sections = page.sections.filter(section => !query || [section.title, ...section.paragraphs, section.example || ''].join(' ').toLowerCase().includes(query));
  const sources = [...new Map(page.sections.flatMap(s => s.sources || []).map(s => [s[1], s])).values()];
  const focusSection = id => { const target = document.getElementById(`foundation-${id}`); target?.scrollIntoView({ block: 'start' }); target?.focus({ preventScroll: true }); };
  return <article className="foundation-reader" aria-labelledby={`foundation-title-${pageId}`}>
    <header className="foundation-heading"><h2 id={`foundation-title-${pageId}`} tabIndex={-1}>{page.title}</h2><p>{page.introduction}</p><p className="reading-time">{page.duration}</p></header>
    {!query && <nav className="foundation-contents" aria-label={`${page.title} topics on this page`}><p>On this page</p>{page.sections.map(section => <button key={section.id} onClick={() => focusSection(section.id)}>{section.title}</button>)}</nav>}
    {query && <p role="status">{sections.length ? `${sections.length} matching topics on this page for “${search}”.` : `No topics on this page match “${search}”. Clear the search or choose another part of the course.`}</p>}
    {sections.map(section => <section className="foundation-section" key={section.id} aria-labelledby={`foundation-${section.id}`}>
      <h3 id={`foundation-${section.id}`} tabIndex={-1}>{section.title}</h3>
      {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
      {section.example && <div className="foundation-example"><h4>Example</h4><p>{section.example}</p></div>}
      {section.diagram && <Diagram type={section.diagram} />}
      {section.calculator && <PositionPractice />}
    </section>)}
    {!query && <section className="foundation-practice"><h3>Before you move on</h3><p>Try answering in your own words, then open the explanation. This is practice; it does not change your saved chapter progress.</p><p><strong>{page.question}</strong></p><details><summary>Read the explanation</summary><p>{page.answer}</p></details></section>}
    <details className="foundation-sources"><summary>Sources and further reading</summary><p>Original LMR explanations and diagrams. BabyPips informed the forex topics; the links below provide further reading. These organizations do not endorse this course.</p><ul>{sources.map(([label, url]) => <li key={url}><a href={url} target="_blank" rel="noopener noreferrer">{label}</a></li>)}</ul></details>
    <footer className="foundation-next"><Button gold onClick={onNext}>{pageId === 'fundamentals' ? 'Next: Trading Mathematics' : 'Continue to the LMR reference'}</Button><Button onClick={onQuestion}>Ask a question about this page</Button></footer>
  </article>;
}
