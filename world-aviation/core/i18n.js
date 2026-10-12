'use strict';

// ============================================================
// World Aviation — the game's language: English, Russian or
// Swedish, picked on the title screen. The English text stays in
// the code and is the key; tr() looks it up in the language tables
// (data/lang-ru.js, data/lang-sv.js) and fills in {name} params.
// A text with no translation is shown in English. The course names
// and the exams have their own tables (data/quizzes.js).
// Used by every screen, the HUD and the messages of the simulation.
// ============================================================

const LANGS = { en: 'English', ru: 'Русский', sv: 'Svenska' };

const I18N = {
  lang: 'en',
  tables() { return { ru: typeof TEXT_RU !== 'undefined' ? TEXT_RU : null, sv: typeof TEXT_SV !== 'undefined' ? TEXT_SV : null }; },
  set(lang) {
    this.lang = LANGS[lang] ? lang : 'en';
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.lang = this.lang;
      this.applyDom();
    }
  },
  // for the first visit: the language picked in the gallery, else the browser's
  guess() {
    try {
      const g = localStorage.getItem('ivanGallery.lang');
      if (LANGS[g]) return g;
    } catch (e) { /* no storage: fall through */ }
    const l = (typeof navigator !== 'undefined' && (navigator.language || '')).slice(0, 2).toLowerCase();
    return LANGS[l] ? l : 'en';
  },
  // the static text in index.html: every [data-i18n] element keeps its English inner HTML as the key
  applyDom() {
    document.querySelectorAll('[data-i18n]').forEach((n) => {
      if (n.dataset.i18nKey === undefined) n.dataset.i18nKey = n.innerHTML.trim();
      n.innerHTML = tr(n.dataset.i18nKey);
    });
  }
};

// the text in the current language, with {name} filled in from params
function tr(s, params) {
  if (s === null || s === undefined) return '';
  let out = String(s);
  if (I18N.lang !== 'en') {
    const t = I18N.tables()[I18N.lang];
    if (t && Object.prototype.hasOwnProperty.call(t, out)) out = t[out];
  }
  if (params) out = out.replace(/\{(\w+)\}/g, (all, k) => (params[k] !== undefined ? params[k] : all));
  return out;
}

// a short word that means something else elsewhere (the VSI's UP, the gear's UP): its table key
// is the context, a space and the word ('VSI UP'); untranslated it is the word itself
function trIn(ctx, s) {
  const k = ctx + ' ' + s, t = tr(k);
  return t === k ? s : t;
}

// an airport's name and its city in the game's language, or in `lang` (the voice's): the
// Russian and Swedish ones from data/airport-names.js, else the English
function aptName(a, lang) { return aptWord(a, lang, 0) || a.name; }
function aptCity(a, lang) { return aptWord(a, lang, 1) || a.city; }
// an airport's country in the game's language ('' where the city is the country: Singapore)
function aptCountry(a) {
  const c = a && a.country ? tr(a.country) : '';
  return c && c !== aptCity(a) ? c : '';
}
// the city and its country: "Kiruna, Sweden" (the flags alone do not always say it)
function aptPlace(a) { const c = aptCountry(a); return aptCity(a) + (c ? ', ' + c : ''); }
function aptWord(a, lang, k) {
  const l = lang || I18N.lang, n = typeof AIRPORT_NAMES !== 'undefined' && a && AIRPORT_NAMES[a.id];
  if (!n || l === 'en') return '';
  return (l === 'ru' ? n[k] : l === 'sv' ? n[2 + k] : '') || '';
}
