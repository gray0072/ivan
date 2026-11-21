// The root gallery's theme: System (the default: follows the device's light or dark mode), Light
// or Dark, switched by the button at the top right and remembered as ivanGallery.theme. Loaded in
// <head>, before the page is drawn, so a page set to Light never flashes dark. The colours are in
// assets/gallery.css (:root[data-theme]); the button's labels come from assets/gallery-lang.js
// through GalleryTheme.setTexts, called by the language switcher.

const GalleryTheme = (() => {
  // localStorage is shared with every app on gray0072.github.io, hence the prefix
  const KEY = 'ivanGallery.theme';
  const MODES = ['system', 'light', 'dark'];
  const LABEL = { system: 'themeSystem', light: 'themeLight', dark: 'themeDark' };
  let mode = 'system';
  let texts = null;

  try {
    const s = localStorage.getItem(KEY);
    if (MODES.includes(s)) mode = s;
  } catch (e) { /* storage blocked: the system theme */ }

  // the browser's bar: each <meta name="theme-color"> keeps its own colour for System, both take
  // the forced theme's colour otherwise
  function themeColors() {
    const metas = [...document.querySelectorAll('meta[name="theme-color"]')];
    for (const m of metas) if (!m.dataset.own) m.dataset.own = m.content;
    const of = (scheme) => (metas.find(m => m.media.includes(scheme)) || {}).dataset.own;
    for (const m of metas) m.content = mode === 'system' ? m.dataset.own : of(mode);
  }

  function label() {
    const b = document.querySelector('[data-theme-btn]');
    if (!b) return;
    b.dataset.mode = mode;
    if (!texts) return;
    const text = texts.theme + ': ' + texts[LABEL[mode]];
    b.setAttribute('aria-label', text);
    b.title = text;
  }

  function apply() {
    const root = document.documentElement;
    if (mode === 'system') root.removeAttribute('data-theme');
    else root.dataset.theme = mode;
    themeColors();
    label();
  }

  function init() {
    const b = document.querySelector('[data-theme-btn]');
    if (b) b.addEventListener('click', () => {
      mode = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
      try { localStorage.setItem(KEY, mode); } catch (e) { /* private mode: not remembered */ }
      apply();
    });
    label();
  }

  function setTexts(t) { texts = t; label(); }

  apply();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return { setTexts };
})();
