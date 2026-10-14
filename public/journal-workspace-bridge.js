// Navigation only. Authentication and entitlement remain in the Journal itself.
(() => {
  if (window.parent === window) {
    location.replace("/inner-circle#application");
    return;
  }
  const send = (action) => parent.postMessage({ type: "lmr-workspace-navigation", action }, location.origin);
  document.addEventListener("click", (event) => {
    const anchor = event.target.closest("a[href]");
    if (!anchor) return;
    const url = new URL(anchor.href, location.href);
    if (url.origin !== location.origin || !["/inner-circle", "/member/index.html"].includes(url.pathname)) return;
    event.preventDefault();
    send(url.hash === "#billing" ? "membership" : "circle");
  });
})();
