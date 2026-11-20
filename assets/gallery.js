// The root gallery's only script: the language switcher (the texts are in assets/gallery-lang.js)
// and picking up a new deploy (assets/update.js). The gallery holds no game state, so any moment
// is idle.

const GalleryLang = (() => {
  // localStorage is shared with every app on gray0072.github.io, hence the prefix
  const KEY = 'ivanGallery.lang';

  function saved() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  // the saved choice, else the browser's language, else English
  function initial() {
    const s = saved();
    if (GALLERY_LANG[s]) return s;
    for (const l of navigator.languages || [navigator.language || '']) {
      const code = String(l).slice(0, 2).toLowerCase();
      if (GALLERY_LANG[code]) return code;
    }
    return 'en';
  }

  function apply(lang) {
    const t = GALLERY_LANG[lang];
    document.documentElement.lang = lang;
    document.title = t.title;
    document.querySelector('meta[name="description"]').content = t.description;
    for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t[el.dataset.i18n];
    for (const el of document.querySelectorAll('[data-i18n-alt]')) el.alt = t[el.dataset.i18nAlt];
    for (const el of document.querySelectorAll('[data-i18n-aria]')) el.setAttribute('aria-label', t[el.dataset.i18nAria]);
    for (const b of document.querySelectorAll('.lang button')) b.setAttribute('aria-pressed', b.dataset.lang === lang);
  }

  function init() {
    for (const b of document.querySelectorAll('.lang button')) {
      b.title = GALLERY_LANG[b.dataset.lang].name;
      b.addEventListener('click', () => {
        apply(b.dataset.lang);
        try { localStorage.setItem(KEY, b.dataset.lang); } catch (e) { /* private mode: not remembered */ }
      });
    }
    apply(initial());
  }

  return { init };
})();

// Offline copies of the games: once the gallery is open on a network (not in data-saver mode),
// every game's own service worker (<game>/sw.js) is installed too, so a game started from the
// gallery works without a network later even if it was never opened before.
function installGamesOffline() {
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  if (navigator.connection && navigator.connection.saveData) return;
  for (const card of document.querySelectorAll('a.card')) {
    const folder = card.getAttribute('href');
    if (!/^[a-z0-9-]+\/$/.test(folder)) continue;
    navigator.serviceWorker.register(folder + 'sw.js', { scope: folder, updateViaCache: 'none' })
      .catch(() => { /* that game simply stays online-only until it is opened */ });
  }
}

GalleryLang.init();
AppUpdate.watch(() => true);
// a few seconds after the load, so the gallery's own pictures come first
window.addEventListener('load', () => setTimeout(installGamesOffline, 3000));
