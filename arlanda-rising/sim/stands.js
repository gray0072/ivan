'use strict';

// Arlanda Rising — the stands: which aircraft fits which stand (the ICAO size code from the wingspan), which
// stands are free, the obvious choice for an arrival (what one tap in the tray does: the nearest free stand
// that fits, next to the terminal when the airline wants that, the big stands kept for big aircraft), the
// duty manager's poorer choice, and assigning an aircraft to a stand. Used by sim/tasks.js and
// sim/flights.js.

const Stands = {
  // the size code of a type: A < 15 m span, B < 24, C < 36, D < 52, E < 65, F up to 80
  codeOf(type) {
    const s = AIRCRAFT[type].span;
    return s < 15 ? 'A' : s < 24 ? 'B' : s < 36 ? 'C' : s < 52 ? 'D' : s < 65 ? 'E' : 'F';
  },
  fits(st, type) { return SIZE_CODES.indexOf(st.code) >= SIZE_CODES.indexOf(this.codeOf(type)); },
  contact(id) { const st = id && Airport.stand(id); return !!(st && st.contact); },
  free(st, f) { return (!st.occ || st.occ === f.id) && (!st.res || st.res === f.id) && !st.closed; },
  // the stands an aircraft fits, best first: next to the terminal if its airline wants it, then the smallest
  // that fits (big stands stay free for big aircraft), then the nearest
  ranked(f) {
    const wantsContact = ((AIRLINES[f.al] || {}).temper || {}).contact && f.booked > 0;
    return S.airport.stands.filter((st) => this.fits(st, f.type) && !st.closed).sort((a, b) =>
      (wantsContact ? (b.contact - a.contact) : 0) ||
      (SIZE_CODES.indexOf(a.code) - SIZE_CODES.indexOf(b.code)) || (a.dist - b.dist) || (a.id < b.id ? -1 : 1));
  },
  // when a stand will be free: now, or the planned departure of the aircraft on it (or reserved for it)
  freeAt(st, f) {
    let t = S.clock;
    for (const id of [st.occ, st.res]) {
      if (!id || id === f.id) continue;
      const o = Flights.get(id);
      if (o) t = Math.max(t, o.std || S.clock + 120);
    }
    return t;
  },
  // the obvious stand: the best one free now, else the one that frees first
  best(f) {
    const list = this.ranked(f);
    const now = list.find((st) => this.free(st, f));
    if (now) return now;
    let pick = null, at = Infinity;
    for (const st of list) { if (st.res && st.res !== f.id) continue; const t = this.freeAt(st, f); if (t < at) { at = t; pick = st; } }
    return pick;
  },
  // the duty manager's choice: the first free stand that fits by number, else the best
  poor(f) {
    const list = S.airport.stands.filter((st) => this.fits(st, f.type) && this.free(st, f));
    return list.length ? list[list.length - 1] : this.best(f);
  },
  assign(f, st) {
    if (!st) return false;
    if (f.stand && f.stand !== st.id) { const old = Airport.stand(f.stand); if (old && old.res === f.id) old.res = null; }
    if (st.res && st.res !== f.id) return false;
    if (!st.occ || st.occ !== f.id) st.res = f.id;
    f.stand = st.id;
    logEvent('standAssigned', { flight: f.no, stand: st.name });
    return true;
  },
  release(f) {
    for (const st of S.airport.stands) {
      if (st.occ === f.id) st.occ = null;
      if (st.res === f.id) st.res = null;
    }
  }
};
