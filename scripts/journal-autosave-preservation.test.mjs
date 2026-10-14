import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../app/app.html', import.meta.url), 'utf8');
const debounce = source.slice(source.indexOf('const _autoSaveTimers={};'), source.indexOf('// Chain completion meter'));
const teardown = source.slice(source.indexOf('// Sync when tab goes to background or page closes'), source.indexOf('// ── SESSION TIMEOUT'));
const serviceWorkerStart = source.indexOf("if ('serviceWorker' in navigator) {");
const serviceWorker = source.slice(serviceWorkerStart, source.indexOf('</script>', serviceWorkerStart));

function fixture() {
  const events = new Map();
  const timers = new Map();
  let timerId = 0;
  const storage = new Map();
  const context = vm.createContext({
    state: { daily: {} }, STORE_KEY: 'isolated-test-journal', _sbDirty: false,
    document: { visibilityState: 'visible', activeElement: null, getElementById: () => null, addEventListener: (name, fn) => {
      const handlers = events.get(name) || []; handlers.push(fn); events.set(name, handlers);
    } },
    window: { addEventListener: (name, fn) => events.set(name, [fn]) },
    localStorage: { setItem: (key, value) => storage.set(key, value) },
    setTimeout: fn => { timers.set(++timerId, fn); return timerId; }, clearTimeout: id => timers.delete(id),
    setInterval: fn => { timers.set(++timerId, fn); return timerId; }, clearInterval: id => timers.delete(id),
    sbDoSafeSync: () => {}, checkSessionTimeout: () => {},
    navigator: { serviceWorker: { controller: {}, addEventListener: (name, fn) => events.set(name, [fn]) } },
    location: { reload: () => { context.reloads = (context.reloads || 0) + 1; } },
  });
  vm.runInContext(debounce + '\n' + teardown + '\n' + serviceWorker, context);
  return { context, storage, events, fire: name => { for (const handler of events.get(name) || []) handler(); } };
}

for (const event of ['beforeunload', 'pagehide', 'visibilitychange']) {
  const f = fixture();
  vm.runInContext("autoSave('daily',()=>state.daily['2026-10-07']={tradePlan:'just typed'});", f.context);
  if (event === 'visibilitychange') f.context.document.visibilityState = 'hidden';
  f.fire(event);
  assert.equal(JSON.parse(f.storage.get('isolated-test-journal')).daily['2026-10-07'].tradePlan, 'just typed');
  assert.equal(vm.runInContext('_autoSaveTimers.daily', f.context), null);
}
const active = fixture();
active.context.document.activeElement = { tagName: 'TEXTAREA', closest: selector => selector === '#p-today' };
vm.runInContext("autoSave('daily',()=>state.daily['2026-10-07']={tradePlan:'preserve before deploy reload'});", active.context);
active.fire('controllerchange');
assert.equal(active.context.reloads || 0, 0, 'Deploy refresh must defer while a chain field is being edited.');
active.context.document.visibilityState = 'hidden';
active.fire('visibilitychange');
assert.equal(active.context.reloads, 1);
assert.equal(JSON.parse(active.storage.get('isolated-test-journal')).daily['2026-10-07'].tradePlan, 'preserve before deploy reload');
active.fire('controllerchange');
assert.equal(active.context.reloads, 1, 'A service-worker update may reload only once.');

const debounced = fixture();
vm.runInContext("debounceSave('note',()=>state.note='first'); debounceSave('note',()=>state.note='latest'); flushAutoSaves();", debounced.context);
assert.equal(debounced.context.state.note, 'latest');
console.log('PASS: pending Journal saves flush before exit, and deployment refresh waits for a safe moment. No production records touched.');
