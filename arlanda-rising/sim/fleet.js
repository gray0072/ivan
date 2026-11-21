'use strict';

// Arlanda Rising — what the airport's own vehicles did, for their cards on the map: each fuel truck's aircraft and
// litres, each snowplough's runs, the square metres it swept and the snow it moved; for the stage being played
// (S.ops.fleet) and since the airport opened (S.airport.fleet). Only counts — nothing in the sim reads them back.
// Counted by sim/turnaround.js (a truck sets off to an aircraft) and sim/runways.js (a convoy or the apron team sets
// off); read by ui/sitecard.js.
//
// Which plough is which (`places`): the runways' convoys, in the order they set off, take ploughs 0, 1, 2… — a full
// convoy each, the last one all that is left — and the apron's team the last one (render/traffic.js draws them in the
// same places), so with the apron being swept a convoy is one plough short.

const Fleet = {
  blank() { return { fuelN: 0, fuelL: 0, runs: 0, m2: 0, m3: 0, trucks: [], ploughs: [] }; },
  ops() { return S.ops ? (S.ops.fleet = S.ops.fleet || this.blank()) : this.blank(); },
  all() { return (S.airport.fleet = S.airport.fleet || this.blank()); },
  // litres a fuel truck puts into an aircraft of a type
  litres(type) { return Math.round(AIRCRAFT[type].mtow * FUEL_L_PER_T / 100) * 100; },
  // truck i sets off to fill flight f
  fuelled(i, f) {
    const l = this.litres(f.type);
    for (const s of [this.ops(), this.all()]) {
      s.fuelN++; s.fuelL += l;
      const t = s.trucks[i] = s.trucks[i] || { n: 0, l: 0 };
      t.n++; t.l += l;
    }
  },
  // the ploughs taking a surface now: a convoy for a runway, one for the apron
  crew(id) {
    const n = Airport.ploughs(), ap = S.airport.apron;
    if (!n) return [];
    if (id === 'apron') return [n - 1];
    // the convoys out on the other runways keep theirs (sim/runways.js sends another one out when there are ploughs for it)
    const busy = S.airport.runways.filter((r) => r.id !== id && r.plough && r.plough > S.clock).length * PLOUGH_CONVOY;
    const k = ap.plough && ap.plough > S.clock && n > 1 ? n - 1 : n;
    return Array.from({ length: Math.max(0, k - busy) }, (_, i) => busy + i);
  },
  // the area of a surface in m²
  area(id) {
    if (id === 'apron') return S.airport.stands.length * PLOUGH_APRON_M2;
    const rw = Airport.runway(id);
    return rw ? rw.len * PLOUGH_SWEEP_W : 0;
  },
  // what fuel truck i does now in a stage: { f, step: 'to' | 'fuel' | 'back' } or null (at the depot)
  truck(i) {
    if (!S.ops) return null;
    const t = S.clock, half = FUEL_DRIVE / 2;
    const f = S.ops.flights.find((g) => g.tr && g.tr.truck === i && g.tr.fuelFrom !== undefined && t >= g.tr.fuelFrom && t < g.tr.fuelEnd + half);
    return f ? { f, step: t < f.tr.fuelFrom + half ? 'to' : t < f.tr.fuelEnd ? 'fuel' : 'back' } : null;
  },
  // where every plough is now in a stage: plough i → { id: the surface, q: the share swept } or null (at the shed)
  places() {
    const n = Airport.ploughs(), ap = S.airport.apron, t = S.clock, out = new Array(n).fill(null);
    if (!S.ops || !n) return out;
    const rws = S.airport.runways.filter((r) => r.plough && r.ploughFrom !== undefined).sort((a, b) => a.ploughFrom - b.ploughFrom);
    // with a single plough out on a runway the apron waits for it
    const apronOut = !!(ap.plough && ap.ploughFrom !== undefined) && n > (rws.length ? 1 : 0);
    const q = (s) => clamp((t - s.ploughFrom) / (s.plough - s.ploughFrom), 0, 1);
    if (apronOut) out[n - 1] = { id: 'apron', q: q(ap) };
    const pool = n - (apronOut ? 1 : 0);
    let k = 0;
    rws.forEach((rw, j) => {
      const m = j === rws.length - 1 ? pool - k : Math.min(PLOUGH_CONVOY, pool - k);
      for (let e = 0; e < m; e++) out[k++] = { id: rw.id, q: q(rw) };
    });
    return out;
  },
  plough(i) { return this.places()[i] || null; },
  // a convoy (or the apron's team) sets off to clear `mm` of snow off a surface
  ploughed(id, mm) {
    const who = this.crew(id), m2 = this.area(id), m3 = m2 * Math.max(0, mm - PLOUGH_LEFT_MM) / 1000;
    if (!who.length) return;
    for (const s of [this.ops(), this.all()]) {
      s.runs++; s.m2 += m2; s.m3 += m3;
      for (const i of who) {
        const p = s.ploughs[i] = s.ploughs[i] || { runs: 0, m2: 0, m3: 0 };
        p.runs++; p.m2 += m2 / who.length; p.m3 += m3 / who.length;
      }
    }
  }
};
