// Picks up a new deploy in a page left open — above all an installed Android app, which is
// resumed from the background rather than started, so the browser never reloads it on its own.
// On every return to the foreground (and once an hour while open) it fetches this page's
// index.html and compares its scripts and styles (the ?v=N links, inline blocks) with the ones
// the running page was built from. A new version is applied by reloading, but only while the
// game says it is idle — on its start screen, never in the middle of a game.
// The same file is copied into every project and the root gallery; used by the main loop:
//   AppUpdate.watch(() => gameState === 'start');

const AppUpdate = (() => {
  const CHECK_MS = 60 * 60 * 1000; // how often a page left open in the foreground looks for a new version
  const IDLE_POLL_MS = 2000;       // how often a found update looks for an idle moment to reload in
  // sessionStorage: the version this tab already reloaded into once. Keyed by the page's path, so
  // every app on the shared gray0072.github.io origin keeps its own.
  const RELOADED_KEY = location.pathname + 'update.reloadedFor';

  let isIdle = () => true;
  let baseline = null;
  let pending = null;
  let checking = false;

  function signature(doc) {
    return [...doc.querySelectorAll('script, style, link[rel="stylesheet"]')]
      .map(el => el.getAttribute('src') || el.getAttribute('href') || el.textContent)
      .join('\n');
  }

  function reloadedFor() {
    try { return sessionStorage.getItem(RELOADED_KEY); } catch (e) { return null; }
  }

  function tryApply() {
    if (!pending || !isIdle()) return;
    try { sessionStorage.setItem(RELOADED_KEY, pending); } catch (e) { /* storage blocked */ }
    location.reload();
  }

  async function check() {
    if (pending || checking || baseline === null) return;
    if (document.visibilityState !== 'visible' || !navigator.onLine) return;
    checking = true;
    try {
      const res = await fetch(location.pathname, { cache: 'no-store' });
      if (!res.ok) return;
      const latest = signature(new DOMParser().parseFromString(await res.text(), 'text/html'));
      if (latest === baseline) return;
      // Already reloaded for exactly this version once: whatever still differs is not an update
      // this page can pick up, and reloading again would only loop.
      if (latest === reloadedFor()) { baseline = latest; return; }
      pending = latest;
      tryApply();
      setInterval(tryApply, IDLE_POLL_MS);
    } catch (e) {
      // offline or the server hiccupped — the next check tries again
    } finally {
      checking = false;
    }
  }

  function watch(idle) {
    if (!/^https?:$/.test(location.protocol)) return; // opened from file:// — nothing to fetch
    isIdle = idle;
    const start = () => {
      baseline = signature(document);
      document.addEventListener('visibilitychange', check);
      setInterval(check, CHECK_MS);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
  }

  return { watch };
})();
