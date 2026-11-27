'use strict';

// Arlanda Rising — the calendar and the sun. Days are counted from 1 January EPOCH_YEAR (S.day), the time of day
// in minutes (S.clock, Swedish standard time). The sun's height follows the real latitude (59.65° N) and
// the date: dark winter afternoons, white nights round midsummer (Free Play: one late-spring day's sun all
// year). Used by the weather, the runways (no movements in the dark without lights), the noise and the screens.

const Calendar = {
  dayOf(y, m, d) { return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(EPOCH_YEAR, 0, 1)) / 864e5); },
  date(day) {
    const t = new Date(Date.UTC(EPOCH_YEAR, 0, 1) + day * 864e5);
    return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), dow: t.getUTCDay() };
  },
  // "1962-04-01" → a day number
  parse(s) { const p = String(s).split('-').map(Number); return this.dayOf(p[0], p[1], p[2] || 1); },
  // the year of the world: in Free Play the history's year (it runs faster than the months, sim/free.js), else the date's
  year() { return S && S.free ? this.yearOf(S.day) : this.date(S.day).y; },
  // a month of the books ("3/1962"): its year as the history had it then in Free Play
  monthLabel(key) { const y = Math.floor(key / 12), m = key % 12 + 1; return m + '/' + this.yearOf(this.dayOf(y, m, FREE_DAY_OF_MONTH)); },
  // the year a day shows: in Free Play the history's year then (S.free.years: [day, year] from the day it began)
  yearOf(day) {
    if (!S || !S.free || !S.free.years || !S.free.years.length) return this.date(day).y;
    let y = S.free.years[0][1];
    for (const e of S.free.years) if (e[0] <= day) y = e[1]; else break;
    return y;
  },
  month() { return this.date(S.day).m; },
  // a month key for the books: 1962 * 12 + 3
  monthKey(day) { const d = this.date(day); return d.y * 12 + d.m - 1; },
  winter(day) { const m = this.date(day).m; return m === 12 || m <= 2; },
  // the sun's elevation in degrees at a day and minute (standard time, UTC+1; the equation of time left out). Free Play
  // has one sun every month, FREE_SUN_DOY's: its light and dark do not follow the calendar (the runways, the weather's
  // dark, the hints and the map all ask here)
  sunElevation(day, min) {
    let n = FREE_SUN_DOY;
    if (!(S && S.free)) {
      const d = this.date(day);
      n = Math.round((Date.UTC(d.y, d.m - 1, d.d) - Date.UTC(d.y, 0, 1)) / 864e5) + 1;
    }
    const decl = 23.44 * Math.sin(2 * Math.PI * (284 + n) / 365) * Math.PI / 180;
    const lat = LATITUDE * Math.PI / 180;
    const solar = (min / 60 - 1) + 17.92 / 15;          // UTC+1 → local solar time at 17.92° E
    const h = (solar - 12) * 15 * Math.PI / 180;
    const s = Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(h);
    return Math.asin(clamp(s, -1, 1)) * 180 / Math.PI;
  },
  // dark enough that a runway needs its lights: the sun more than 6° under the horizon (civil twilight)
  dark(day, min) { return this.sunElevation(day, min) < -6; },
  night(min) { return min >= NIGHT_FROM || min < NIGHT_TO; }
};
