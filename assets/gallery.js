// The root gallery's main script: the language switcher (the texts are in assets/gallery-lang.js),
// the tags of the cards and the filter by tag above them, the cards' release dates, the showcase GIFs on the cards, and
// picking up a new deploy (assets/update.js). The theme is assets/gallery-theme.js. The gallery
// holds no game state, so any moment is idle.

// ---- tags: every card lists its tags in data-tags; the filter shows one game kind at a time ----
const GalleryTags = (() => {
  let active = null; // the tag shown, null = all
  let texts = null;
  const nav = document.querySelector('nav.tags');
  const cards = [...document.querySelectorAll('a.card')];
  const tagsOf = (card) => (card.dataset.tags || '').split(/\s+/).filter(Boolean);

  function button(tag) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.tag = tag || '';
    b.addEventListener('click', () => { active = tag === active ? null : tag; update(); });
    return b;
  }

  function update() {
    for (const card of cards) card.hidden = !!active && !tagsOf(card).includes(active);
    for (const b of nav.querySelectorAll('button')) b.setAttribute('aria-pressed', (b.dataset.tag || null) === active);
  }

  // the labels in the chosen language; the filter lists the tags in gallery-lang.js's order
  function setTexts(t) {
    texts = t;
    for (const b of nav.querySelectorAll('button')) b.textContent = b.dataset.tag ? t.tags[b.dataset.tag] : t.tagAll;
    for (const li of document.querySelectorAll('.card-tags li')) li.textContent = t.tags[li.dataset.tag];
  }

  function init(t) {
    const used = new Set(cards.flatMap(tagsOf));
    nav.append(button(null), ...Object.keys(t.tags).filter(tag => used.has(tag)).map(button));
    for (const card of cards) {
      const list = card.querySelector('.card-tags');
      for (const tag of tagsOf(card)) {
        const li = document.createElement('li');
        li.dataset.tag = tag;
        list.append(li);
      }
    }
    setTexts(t);
    update();
  }

  return { init, setTexts };
})();

// ---- the language switcher ----
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
    GalleryTags.setTexts(t);
    GalleryTheme.setTexts(t);
    showDates(lang, t);
  }

  // a card's release date (the first commit of its game, in <time datetime>) short, in the
  // browser's own locale, not the gallery's language: 2026-11-20 in Sweden, 20.11.2026 in Russia,
  // 11/20/2026 in the US
  function showDates(lang, t) {
    const fmt = new Intl.DateTimeFormat(navigator.languages && navigator.languages.length ? navigator.languages : undefined,
      { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
    for (const el of document.querySelectorAll('time.released')) {
      el.textContent = fmt.format(new Date(el.dateTime + 'T00:00:00Z'));
      el.title = t.released;
    }
  }

  function init() {
    for (const b of document.querySelectorAll('.lang button')) {
      b.title = GALLERY_LANG[b.dataset.lang].name;
      b.addEventListener('click', () => {
        apply(b.dataset.lang);
        try { localStorage.setItem(KEY, b.dataset.lang); } catch (e) { /* private mode: not remembered */ }
      });
    }
    GalleryTags.init(GALLERY_LANG.en);
    apply(initial());
  }

  return { init };
})();

// ---- showcases: a card whose game has a docs/showcase.gif plays it in place of the screenshot ----
// With a mouse while the card is hovered or focused; on a touch screen while the card is fully in
// view. The GIF (2–5 MB) is fetched only then, never in data-saver mode or with reduced motion,
// and is not part of the gallery's offline copy.
function initShowcases() {
  if (navigator.connection && navigator.connection.saveData) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const imgs = [...document.querySelectorAll('img[data-showcase]')];
  const still = new Map(imgs.map(img => [img, img.getAttribute('src')]));
  const wanted = new Set();

  function play(img) {
    wanted.add(img);
    const gif = new Image();
    gif.onload = () => { if (wanted.has(img)) img.src = img.dataset.showcase; };
    gif.src = img.dataset.showcase;
  }
  function stop(img) {
    wanted.delete(img);
    if (img.getAttribute('src') !== still.get(img)) img.src = still.get(img);
  }

  if (matchMedia('(hover: hover)').matches) {
    for (const img of imgs) {
      const card = img.closest('a.card');
      card.addEventListener('mouseenter', () => play(img));
      card.addEventListener('mouseleave', () => stop(img));
      card.addEventListener('focus', () => play(img));
      card.addEventListener('blur', () => stop(img));
    }
  } else if ('IntersectionObserver' in window) {
    const seen = new IntersectionObserver((entries) => {
      for (const e of entries) (e.intersectionRatio >= 0.95 ? play : stop)(e.target);
    }, { threshold: [0, 0.95] });
    for (const img of imgs) seen.observe(img);
  }
}

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
window.addEventListener('load', () => {
  setTimeout(installGamesOffline, 3000);
  initShowcases();
});
