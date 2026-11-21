'use strict';

// Arlanda Rising — the player's settings on this device (arlandaRising.settings.v1): Kaj's hints (Full, Short or
// Off), the graphics quality (Auto, High or Low: Low draws at one pixel per CSS pixel), sums in full or short
// ("1 200 000 SEK" or "1.2 MSEK"); and the difficulty (arlandaRising.difficulty). Read by the screens, the map's
// resolution and money(). The sound's switch lives in core/audio.js.

const Settings = (() => {
  const DEF = { hints: 'full', quality: 'auto', sums: 'short' };
  let data = Object.assign({}, DEF, Store.json(KEYS.settings, {}));
  return {
    get(k) { return data[k]; },
    set(k, v) { data[k] = v; Store.setJson(KEYS.settings, data); },
    hints() { return data.hints; },
    quality() {
      if (data.quality !== 'auto') return data.quality;
      // a small, weak device draws at 1×: few cores or little memory
      const cores = navigator.hardwareConcurrency || 4, mem = navigator.deviceMemory || 4;
      return cores <= 4 && mem <= 3 ? 'low' : 'high';
    },
    short() { return data.sums === 'short'; },
    difficulty() { const d = Store.get(KEYS.difficulty); return DIFFICULTY[d] ? d : 'medium'; },
    setDifficulty(d) { if (DIFFICULTY[d]) Store.set(KEYS.difficulty, d); }
  };
})();

// every sum on the screens: full or short by the setting
function sek(v) { return money(v, Settings.short()); }
// a sum where room is short — a table's cell, a price on a button, a chart's axis: the same number without the
// currency ("1.2 M", "45 k", "1,2 млн" short; "1 200 000" in full). Sentences and the big sums keep sek().
function sekBare(v) { return Settings.short() ? moneyBare(v) : groupThousands(v); }
