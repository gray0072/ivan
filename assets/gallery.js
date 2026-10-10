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

GalleryLang.init();
AppUpdate.watch(() => true);
