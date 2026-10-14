import React from "react";
import { journalImageUrl } from "./journal-media.mjs";

// Journal HTML becomes React nodes. No innerHTML, event attributes, styles,
// embeds or active elements from an editor are inserted into the member page.
const tags = new Set([
  "p",
  "div",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "blockquote",
  "ul",
  "ol",
  "li",
  "h2",
  "h3",
  "h4",
  "pre",
  "code",
  "span",
  "figure",
  "figcaption",
  "hr",
]);
const discard = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "svg",
  "math",
  "form",
  "input",
  "button",
  "textarea",
  "video",
  "audio",
]);
export default function JournalContent({ content, onChart }) {
  if (!content) return null;
  const document = new DOMParser().parseFromString(content, "text/html");
  const charts = [...document.querySelectorAll("img")].filter(node => journalImageUrl(node.getAttribute("src")) && !node.closest([...discard].join(","))).length;
  const render = (node, key) => {
    if (node.nodeType === 3) return node.textContent;
    if (node.nodeType !== 1) return null;
    const tag = node.tagName.toLowerCase();
    if (discard.has(tag)) return null;
    if (tag === "img") {
      const src = journalImageUrl(node.getAttribute("src"));
      const chart = src ? (
        <img
          key={key}
          src={src}
          alt={node.getAttribute("alt") || "LMR observation chart"}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : null;
      return chart && onChart ? <button key={key} className="observation-chart" onClick={() => onChart(src)} aria-label={`Expand ${node.getAttribute("alt") || "observation chart"}`}>{chart}</button> : chart;
    }
    const children = Array.from(node.childNodes, (child, index) =>
      render(child, `${key}-${index}`),
    );
    if (!tags.has(tag))
      return <React.Fragment key={key}>{children}</React.Fragment>;
    const chartOnly = node.querySelector("img") && !node.textContent.trim();
    return React.createElement(tag, { key, className: chartOnly ? "journal-chart" : undefined }, ...children);
  };
  return (
    <div className="journal-content" style={{"--journal-chart-columns":Math.max(1,Math.min(charts,4))}}>
      {Array.from(document.body.childNodes, (node, index) =>
        render(node, index),
      )}
    </div>
  );
}
