// Shared by the React hero and the script-free motion-frames poster.
export const MARKET_CSS = `
.market-art{--ring-fast:60s;--ring-medium:90s;--ring-slow:180s;--market-drift:18s;--price-drift:27s;position:absolute;inset:0;width:100%;height:100%;overflow:hidden;pointer-events:none}
.market-art svg{width:100%;height:100%;display:block}
.market-art .market-grid{stroke:#8396b1;stroke-width:.7;opacity:.13}
.market-art .time-ring{fill:none;stroke:#c2cddd;stroke-width:.7;opacity:.19}
.market-art .ring-fast,.market-art .ring-medium,.market-art .ring-slow{transform-origin:1120px 350px}
.market-art .ring-fast{animation:market-orbit var(--ring-fast) linear infinite}
.market-art .ring-medium{animation:market-orbit var(--ring-medium) linear infinite reverse}
.market-art .ring-slow{animation:market-orbit var(--ring-slow) linear infinite}
.market-art .ring-counter{transform-box:fill-box;transform-origin:center;animation:market-orbit var(--ring-fast) linear infinite reverse}
.market-art .time-label{fill:#b7c4d5;font:12px Archivo,system-ui,sans-serif;letter-spacing:3px}
.market-art .market-price{stroke:#f5b647;stroke-width:2.7;fill:none;opacity:.7}
.market-art .market-candles{animation:market-drift var(--market-drift) ease-in-out infinite alternate}
.market-art .price-field{animation:market-drift var(--price-drift) ease-in-out infinite alternate-reverse}
.market-art .candle{fill:#60756a;stroke:#93b0a1;opacity:.32}
.market-art .candle.down{fill:#6b4145;stroke:#b17477}
.market-art .candle path{stroke-width:1.5;fill:none}
@keyframes market-orbit{to{transform:rotate(360deg)}}
@keyframes market-drift{from{transform:translate3d(-10px,6px,0)}to{transform:translate3d(12px,-9px,0)}}
html[data-motion=off] .market-art *,html[data-page-hidden=true] .market-art *,.market-art[data-active=false] *{animation-play-state:paused!important}
@media(prefers-reduced-motion:reduce){html:not([data-motion=on]) .market-art *{animation:none}}
`;

export const MARKET_SVG = `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs><linearGradient id="market-volume" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f5a623" stop-opacity=".11"/><stop offset="1" stop-color="#f5a623" stop-opacity="0"/></linearGradient></defs>
<g class="market-grid"><path d="M180 0v900M500 0v900M820 0v900M1140 0v900M1460 0v900M0 200h1600M0 440h1600M0 680h1600"/></g>
<g data-od-id="rings">
<g class="ring-slow"><circle class="time-ring" cx="1120" cy="350" r="320"/><path class="time-ring" d="M1440 350h18M1120 30V12M800 350h-18M1120 670v18"/></g>
<g class="ring-medium"><circle class="time-ring" cx="1120" cy="350" r="250" stroke-dasharray="2 12"/><circle cx="1120" cy="100" r="3" fill="#b7c4d5" opacity=".5"/></g>
<g class="ring-fast"><circle class="time-ring" cx="1120" cy="350" r="183"/><g class="ring-counter"><text class="time-label" x="1100" y="167">D</text></g><circle cx="1120" cy="533" r="3" fill="#ffd987" opacity=".6"/></g>
</g>
<g class="price-field" data-od-id="focal"><path d="M-40 650C100 585 153 710 287 639S463 485 586 506S746 586 870 491S1041 319 1172 354S1354 456 1640 235V900H-40Z" fill="url(#market-volume)"/><path class="market-price" d="M-40 650C100 585 153 710 287 639S463 485 586 506S746 586 870 491S1041 319 1172 354S1354 456 1640 235"/></g>
<g class="market-candles">
<g class="candle down"><path d="M105 630v165"/><rect x="94" y="665" width="22" height="75" rx="2"/></g>
<g class="candle"><path d="M365 520v175"/><rect x="354" y="557" width="22" height="91" rx="2"/></g>
<g class="candle down"><path d="M661 475v165"/><rect x="650" y="508" width="22" height="83" rx="2"/></g>
<g class="candle"><path d="M960 361v167"/><rect x="949" y="394" width="22" height="80" rx="2"/></g>
<g class="candle"><path d="M1203 261v173"/><rect x="1192" y="295" width="22" height="86" rx="2"/></g>
<g class="candle"><path d="M1490 163v179"/><rect x="1479" y="201" width="22" height="91" rx="2"/></g>
</g></svg>`;
