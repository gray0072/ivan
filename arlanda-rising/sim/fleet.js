'use strict';

// Arlanda Rising — what the airport's own vehicles did, for their cards on the map: each fuel truck's aircraft and
// litres, each snowplough's runs, the square metres it swept and the snow it moved; for the stage being played
// (S.ops.fleet) and since the airport opened (S.airport.fleet). Only counts — nothing in the sim reads them back.
// Counted by sim/turnaround.js (a truck sets off to an aircraft) and sim/runways.js (a convoy or the apron team sets
// off); read by ui/sitecard.js.
//
// Which plough is which: a runway's convoy takes ploughs 0, 1, 2… and the apron's team the last one (render/traffic.js
// draws them in the same places), so with the apron being swept a convoy is one plough short.

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
    const k = ap.plough && ap.plough > S.clock && n > 1 ? n - 1 : n;
    return Array.from({ length: k }, (_, i) => i);
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
  // where plough i is now in a stage: { id: the surface, q: the share swept } or null (at the shed)
  plough(i) {
    if (!S.ops) return null;
    const n = Airport.ploughs(), ap = S.airport.apron, t = S.clock;
    const rw = S.airport.runways.find((r) => r.plough && r.ploughFrom !== undefined);
    const apronOut = !!(ap.plough && ap.ploughFrom !== undefined) && n > (rw ? 1 : 0);
    const convoy = rw ? n - (apronOut ? 1 : 0) : 0;
    if (apronOut && i === n - 1) return { id: 'apron', q: clamp((t - ap.ploughFrom) / (ap.plough - ap.ploughFrom), 0, 1) };
    if (rw && i < convoy) return { id: rw.id, q: clamp((t - rw.ploughFrom) / (rw.plough - rw.ploughFrom), 0, 1) };
    return null;
  },
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
