'use strict';

// Arlanda Rising — the game's language: English, Russian or Swedish, picked on the start screen. The English text
// stays in the code and is the key; tr() looks it up in the language tables (data/lang-ru.js, data/lang-sv.js)
// and fills in {name} params. A text with no translation is shown in English. Texts from data/ (mission
// briefings, names) go through tr() too, so they are in the tables as well. Used by every screen, the HUD and
// money() (core/utils.js) for the units.

const LANGS = { en: 'English', ru: 'Русский', sv: 'Svenska' };
const LANG_FLAGS = { en: 'gb', ru: 'ru', sv: 'se' };

const I18N = {
  lang: 'en',
  listeners: [],
  tables() { return { ru: typeof TEXT_RU !== 'undefined' ? TEXT_RU : null, sv: typeof TEXT_SV !== 'undefined' ? TEXT_SV : null }; },
  // the remembered language, else the one picked in the gallery, else the browser's
  load() {
    let l = Store.get(KEYS.lang) || Store.get('ivanGallery.lang');
    if (!LANGS[l]) {
      const b = (typeof navigator !== 'undefined' && (navigator.language || '')).slice(0, 2).toLowerCase();
      l = LANGS[b] ? b : 'en';
    }
    this.set(l, false);
  },
  set(lang, remember = true) {
    this.lang = LANGS[lang] ? lang : 'en';
    if (remember) Store.set(KEYS.lang, this.lang);
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.lang = this.lang;
      this.applyDom();
    }
    for (const fn of this.listeners) fn(this.lang);
  },
  onChange(fn) { this.listeners.push(fn); },
  // the static text in index.html: every [data-i18n] element keeps its English inner HTML as the key;
  // [data-i18n-title] does the same for the title attribute
  applyDom() {
    document.querySelectorAll('[data-i18n]').forEach((n) => {
      if (n.dataset.i18nKey === undefined) n.dataset.i18nKey = n.innerHTML.trim();
      n.innerHTML = tr(n.dataset.i18nKey);
    });
    document.querySelectorAll('[data-i18n-title]').forEach((n) => {
      n.title = tr(n.dataset.i18nTitle);
      n.setAttribute('aria-label', n.title);
    });
    document.querySelectorAll('.langPick button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === this.lang)));
  },
  // fills every .langPick in the page with the EN · RU · SV buttons
  buildPickers() {
    document.querySelectorAll('.langPick').forEach((box) => {
      box.innerHTML = Object.keys(LANGS).map((l) =>
        '<button type="button" data-lang="' + l + '" aria-pressed="' + (this.lang === l) + '" title="' + LANGS[l] + '">' +
        '<img src="art/flag-' + LANG_FLAGS[l] + '.svg?v=1" alt="">' + l.toUpperCase() + '</button>').join('');
      box.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-lang]');
        if (b) this.set(b.dataset.lang);
      });
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

// a date in the current language: "14 December 1959"
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function fmtDate(day, withYear = true) {
  const d = Calendar.date(day);
  return d.d + ' ' + tr(MONTHS[d.m - 1]) + (withYear ? ' ' + d.y : '');
}
