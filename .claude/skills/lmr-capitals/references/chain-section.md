# "The Chain" animation — implementation notes

The live implementation is the `#lmrChain` section inside
`LMR Capitals APP_files/index.html`, inserted right before the "How We Do It"
(`#lp-how`) methodology section. It is self-contained: one `<style id="lmrchain-style">`,
one `<section id="lmrChain">`, one `<script>`, plus an inline `<svg><defs>` of the
molten link symbols. A standalone, openable copy is built as `LMR-Chain.html`.

## Why it's built this way

- **Dependency-free** (no GSAP/CDN) so it drops into the vanilla app with zero
  build and works offline. A GSAP+ScrollTrigger+Lenis version exists for when a
  build permits external libs, but the shipped landing version is pure JS/CSS/SVG.
- **Fully namespaced** so it can't collide with the 14.6k-line app:
  - wrapper id `#lmrChain`; every rule is `#lmrChain .lc-…`
  - classes prefixed `lc-` (`.lc-scroll`, `.lc-sticky`, `.lc-lift`, `.lc-link`,
    `.lc-wrap`, `.lc-svg`, `.lc-card`, `.lc-drips`, `.lc-flash`, `.lc-ring`,
    `.lc-badge`, `.lc-rail`, `.lc-step`, `.lc-molten`, …)
  - keyframes prefixed `lc_` (`lc_rise`, `lc_flicker`, `lc_halo`, `lc_lavafall`,
    `lc_flash`, `lc_ring`, `lc_pip`)
  - SVG ids prefixed `lc` (`lcMolten`, `lcMoltenH`, `lcCore`, `lcCoreH`, `lcNut`,
    `lcLinkV`, `lcLinkH`)

## Structure & scroll mechanic (sideways / horizontal)

- `.lc-scroll` is a tall wrapper (`height:560vh`) giving scroll runway. Inside it,
  `.lc-sticky` is `position:sticky; top:0; height:100vh` — the pinned stage.
- `.lc-lift` is a horizontal strip; each `.lc-link[data-i]` is absolutely
  positioned by inline `left:` (x). Links alternate orientation for interlock:
  vertical capsule `#lcLinkV` and horizontal capsule `#lcLinkH`, with hex "nut"
  bolt heads (`#lcNut`).
- On scroll, JS computes progress `p = clamp(-wrap.top / (wrap.height - vh), 0, 1)`
  and sets `lc-lift` `translateX` so the active link centers; `active =
  round(p*(N-1))`. Links get `active` / `done` / `wait`; the rail steps mirror it.
  A newly-`done` link fires its `.lc-ring` (shockwave); a newly-`active` link fires
  its `.lc-flash` (ignite). Cards (`.lc-cardpos` alternating `.up`/`.down`) fade in
  only for the active link. Drips animate only on the active (hot) link.

## THE gotcha (this is what silently breaks it)

The landing does not scroll the window — it scrolls inside `#landingPage`
(`position:fixed; overflow-y:auto`). The scroll listener MUST target that
container:

```js
var scroller = scope.closest('#landingPage');
(scroller || window).addEventListener('scroll', onScroll, { passive:true });
```

Falling back to `window` keeps the standalone `LMR-Chain.html` (which scrolls the
body) working. If the chain appears "frozen" on the site but works in the
standalone file, this binding is the first thing to check.

## Molten look

Each link stroke uses a vertical/horizontal molten gradient (`#lcMolten`/`#lcMoltenH`:
dark-red ends → white-hot core band) over a brighter thin core stroke
(`#lcCore`/`#lcCoreH`) plus a faint white highlight; a `lc_flicker` drop-shadow
animation makes it glow like living lava, and `.lc-wrap::before` is a blurred heat
halo. Cards carry a molten bottom edge (`.lc-molten`) and warm ember borders.

## Tuning knobs the user commonly asks for

- **Travel speed / dwell:** `.lc-scroll` height (bigger = slower).
- **Link spacing / interlock:** inline `left:` step (currently 110px) + link
  `centers` in the script (`left + 80`).
- **Heat/brightness:** `lc_flicker` drop-shadow values + `#lcMolten` stops.
- **Drip volume/cadence:** `.lc-drop` count / `animation-delay` / `-duration`.
- **Card size/side:** `.lc-card` width; `.up`/`.down` per link; nudge `.lc-tag`
  top so cards clear the sticky `.lp-nav`.
