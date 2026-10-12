// Mobile navigation only. Delegate to the existing Journal buttons; never read or write records.
(() => {
  const mobileBar = document.querySelector('.mobile-bar');
  const sourceNav = document.querySelector('.sb-nav');
  if (!mobileBar || !sourceNav) return;
  const embedded = window.parent !== window;
  document.documentElement.classList.toggle('journal-embedded', embedded);
  const brand = mobileBar.querySelector(':scope > span');
  if (brand) {
    brand.className = 'journal-mobile-brand';
    brand.replaceChildren();
    const image = document.createElement('img'); image.src = '/icons/lmr-icon-circle.png'; image.alt = '';
    const label = document.createElement('span');
    const title = document.createElement('strong'); title.textContent = 'LMR ';
    const capitals = document.createElement('b'); capitals.textContent = 'CAPITALS'; title.append(capitals);
    const subtitle = document.createElement('small'); subtitle.textContent = 'Trading Journal';
    label.append(title, subtitle); brand.append(image, label);
  }
  const menu = mobileBar.querySelector('.menu-btn');
  if (menu) {
    menu.setAttribute('aria-label', 'All Journal sections');
    menu.setAttribute('aria-controls', 'sidebar');
    menu.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
  }
  const nav = document.createElement('nav'); nav.className = 'journal-mobile-sections';
  nav.setAttribute('aria-label', 'Trading Journal sections');
  const items = [...sourceNav.querySelectorAll('button[data-panel]')];
  const links = items.map(source => {
    const button = document.createElement('button'); button.type = 'button';
    const icon = source.querySelector('svg'); if (icon) { const copy = icon.cloneNode(true); copy.setAttribute('aria-hidden', 'true'); button.append(copy); }
    button.append(document.createTextNode(source.textContent.trim()));
    button.addEventListener('click', () => {
      // navTo closes its existing drawer by toggling it. Start it open so a tab
      // selection closes it rather than unexpectedly covering the selected page.
      const sidebar = document.getElementById('sidebar'), overlay = document.getElementById('overlay');
      if (window.innerWidth <= 900) { sidebar?.classList.add('open'); overlay?.classList.add('show'); }
      source.click();
      if (window.innerWidth <= 900) { sidebar?.classList.remove('open'); overlay?.classList.remove('show'); }
    });
    nav.append(button); return { source, button };
  });
  mobileBar.after(nav);
  let selected;
  const sync = () => {
    let current;
    for (const {source, button} of links) {
      const active = source.classList.contains('active');
      if (active) { button.setAttribute('aria-current', 'page'); current = button; }
      else button.removeAttribute('aria-current');
    }
    if (current && current !== selected && window.innerWidth <= 760) current.scrollIntoView({block:'nearest', inline:'nearest', behavior:'instant'});
    selected = current;
    menu?.setAttribute('aria-expanded', String(document.getElementById('sidebar')?.classList.contains('open') || false));
  };
  new MutationObserver(sync).observe(sourceNav, {subtree:true, attributes:true, attributeFilter:['class']});
  const sidebar = document.getElementById('sidebar');
  if (sidebar) new MutationObserver(sync).observe(sidebar, {attributes:true, attributeFilter:['class']});
  sync();
})();
