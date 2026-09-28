// The local app registers a root service worker that caches every same-origin GET.
// Remove it before loading Vite modules so this preview always uses current code.
async function startPreview() {
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  if (loopback && 'serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      const appWorkers = registrations.filter(registration =>
        [registration.active, registration.waiting, registration.installing].some(worker =>
          worker && new URL(worker.scriptURL).pathname === '/sw.js'
        )
      );
      if (appWorkers.length) {
        const controlled = Boolean(navigator.serviceWorker.controller);
        await Promise.all(appWorkers.map(registration => registration.unregister()));
        if (controlled) {
          location.reload();
          return;
        }
      }
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.filter(name => name.startsWith('lmr-v')).map(async name => {
          const cache = await caches.open(name);
          const requests = await cache.keys();
          await Promise.all(requests.filter(request => {
            const path = new URL(request.url).pathname;
            return path.startsWith('/web/') || path.startsWith('/__local-preview/') || path.startsWith('/@vite/') || path.startsWith('/@react-refresh') || path.startsWith('/node_modules/');
          }).map(request => cache.delete(request)));
        }));
      }
    } catch (error) {
      console.warn('Local preview cache reset was unavailable.', error);
    }
  }
  const showFailure = () => {
    const root = document.getElementById('root');
    if (root && (!root.hasChildNodes() || root.querySelector('#boot'))) root.innerHTML = '<main role="alert" style="max-width:44rem;margin:12vh auto;padding:2rem;color:#edf2f7;font:18px/1.5 system-ui"><h1>Page could not load</h1><p>Reload this tab to try again.</p><button style="padding:.8rem 1.2rem;cursor:pointer" onclick="location.reload()">Reload page</button></main>';
  };
  window.addEventListener('error', showFailure, { once: true });
  setTimeout(showFailure, 5000);
  try {
    await import('./experience-app.jsx');
  } catch (error) {
    console.error('Preview could not start.', error);
    showFailure();
  }
}

startPreview();
