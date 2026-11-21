'use strict';

// Arlanda Rising — small helpers shared by every other file: math, a repeatable random generator whose state
// is a plain number (it lives in the saved game, so a resumed mission draws the same numbers), a stable
// hash, clock formatting and money() — every sum of the game in Swedish kronor, written the same way
// everywhere. Used by sim/, the screens and tools/missions-check.js.

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }

// one step of mulberry32: the generator's state in, [a number in 0..1, the next state] out
function rngNext(state) {
  const a = (state + 0x6D2B79F5) >>> 0;
  let t = a;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, a];
}

// a stable 32-bit hash of any number of strings / numbers
function hashOf(...parts) {
  let h = 2166136261 >>> 0;
  const s = parts.map((p) => String(p)).join('|');
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}

// "08:05" → 485 (minutes since midnight); a number stays a number
function clockMin(v) {
  if (typeof v === 'number') return v;
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(v));
  if (!m) throw new Error('not a clock time: ' + v);
  return Number(m[1]) * 60 + Number(m[2]);
}
// minutes since midnight → "08:05"
function fmtClock(min) {
  min = ((Math.floor(min) % 1440) + 1440) % 1440;
  return String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0');
}

// 1234567 → "1 234 567", the groups split by a no-break space
function groupThousands(n) {
  const s = String(Math.abs(Math.round(n)));
  return (n < 0 ? '−' : '') + s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// The units of money by the language: SEK / kSEK / MSEK in English, kronor in Russian and Swedish.
const MONEY_UNITS = {
  en: ['SEK', 'kSEK', 'MSEK'],
  ru: ['крон', 'тыс. крон', 'млн крон'],
  sv: ['kr', 'tkr', 'Mkr']
};
// Every sum of the game: "1 200 000 SEK" in full, or short ("1.2 MSEK", "20 kSEK") when `short` is true
// (Settings: sums in full or short). The number comes first, the unit by the language.
function money(v, short) {
  const lang = typeof I18N !== 'undefined' && MONEY_UNITS[I18N.lang] ? I18N.lang : 'en';
  const u = MONEY_UNITS[lang];
  const dec = lang === 'en' ? '.' : ',';
  const a = Math.abs(v), sign = v < 0 ? '−' : '';
  // one decimal under 100 when it has one: 1.2, 45, 120
  const num = (x) => {
    const r = Math.round(x * 10) / 10;
    return r >= 100 || Number.isInteger(r) ? groupThousands(Math.round(r)) : String(r).replace('.', dec);
  };
  if (short && a >= 1e6) return sign + num(a / 1e6) + ' ' + u[2];
  if (short && a >= 1e4) return sign + num(a / 1e3) + ' ' + u[1];
  return groupThousands(v) + ' ' + u[0];
}
// the HUD's money on a phone held upright: always short and without the currency ("1.2 M", "45 k", "1,2 млн")
const MONEY_BARE = { en: ['', 'k', 'M'], ru: ['', 'тыс.', 'млн'], sv: ['', 'k', 'M'] };
function moneyBare(v) {
  const lang = typeof I18N !== 'undefined' && MONEY_BARE[I18N.lang] ? I18N.lang : 'en';
  const u = MONEY_BARE[lang], dec = lang === 'en' ? '.' : ',';
  const a = Math.abs(v), sign = v < 0 ? '−' : '';
  const num = (x) => { const r = Math.round(x * 10) / 10; return r >= 100 || Number.isInteger(r) ? groupThousands(Math.round(r)) : String(r).replace('.', dec); };
  if (a >= 1e6) return sign + num(a / 1e6) + ' ' + u[2];
  if (a >= 1e4) return sign + num(a / 1e3) + ' ' + u[1];
  return groupThousands(v);
}
