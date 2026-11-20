'use strict';

// Arlanda Rising — the five meters (Airlines, Passengers, Neighbours, Staff, Safety; 0–100, Passengers shown as
// 1–5 stars). Each flight's result pulls the Passengers meter and its airline's mood toward how well it
// went (a moving average, so one bad flight dents but does not break them); noise pulls the Neighbours;
// close calls knock Safety down and it recovers slowly to the airport's base. Used by sim/flights.js,
// sim/runways.js, the decisions and the screens.

const Meters = {
  pull(name, target, w) { S.meters[name] = clamp(S.meters[name] + (clamp(target, 0, 100) - S.meters[name]) * w, 0, 100); },
  airline(code) {
    if (!S.airlines[code]) S.airlines[code] = { mood: 70, routes: [] };
    return S.airlines[code];
  },
  // the Airlines meter: the airlines' moods weighted by their flights a day (1 each when none are planned)
  updateAirlines() {
    let sum = 0, w = 0;
    for (const code of Object.keys(S.airlines)) {
      const al = S.airlines[code];
      const n = Math.max(1, (al.routes || []).reduce((s, r) => s + r.perDay, 0));
      sum += al.mood * n; w += n;
    }
    if (w) S.meters.airlines = sum / w;
  },
  // a departure has left: how its passengers and its airline feel about it
  departed(f) {
    const al = this.airline(f.al), t = (AIRLINES[f.al] || {}).temper || {};
    const wait = (f.paxServed ? f.waitSum / f.paxServed : 0) + (f.secServed ? f.secWait / f.secServed : 0);
    const walk = !Stands.contact(f.stand) && f.booked > 0 ? REMOTE_WALK_MOOD * (S.airport.apron.snow > 1 ? 2 : 1) : 0;
    const missed = f.booked ? f.missed / f.booked : 0;
    // session 3: lost bags, and a late flight nobody told the passengers about
    const unann = (f.ann === 'asked' && S.clock - f.annAsk > ANNOUNCE_OK) || (f.ann === 'done' && f.annAt - f.annAsk > ANNOUNCE_OK);
    if (unann) S.mission.st.unannounced++;
    // session 4: the brands of its terminal and the way to the airport (the coaches, the train)
    const extra = (f.lostBags ? LOST_BAG_MOOD : 0) + (unann ? ANNOUNCE_MOOD : 0) - Terminal.groundPax() - Terminal.paxBonus(Terminal.of(f.al, f.intl));
    if (f.booked > 0) this.pull('passengers', 92 - wait * 1.2 - Math.max(0, f.delay - 5) * 0.8 - walk * 4 - missed * 80 - extra, METER_EMA.passengers);
    const impatience = (t.patience || 1) / diff().patience;
    let target = 92 - Math.max(0, f.adelay - 5) * 1.5 * impatience - (t.contact && !Stands.contact(f.stand) ? 8 : 0) - missed * 40;
    // an operations head who knows every airline's temper: their mood falls more slowly
    const calm = People.perk('stands', 'mood');
    if (calm && target < al.mood) target = al.mood + (target - al.mood) * (1 - calm);
    al.mood = clamp(al.mood + (clamp(target, 0, 100) - al.mood) * METER_EMA.airlines, 0, 100);
    Airlines.departed(f);
    this.updateAirlines();
  },
  // an arrival sent to another airport, or a departure cancelled
  lost(f) {
    const al = this.airline(f.al);
    al.mood = clamp(al.mood + (10 - al.mood) * METER_EMA.airlines * 2, 0, 100);
    this.pull('passengers', 10, METER_EMA.passengers * 2);
    this.updateAirlines();
  },
  // noise units of one movement over the towns
  noise(units) {
    this.pull('neighbours', (S.airport.neighboursBase || 72) - units * NEIGHBOURS_NOISE_K, METER_EMA.neighbours);
  },
  closeCall() {
    S.meters.safety = clamp(S.meters.safety - SAFETY_CLOSE_CALL, 0, 100);
    if (S.mission && S.mission.st) S.mission.st.closeCalls++;
    logEvent('closeCall', {});
  },
  // every ops step: Safety recovers toward the airport's base
  step(dt) {
    const base = S.airport.safetyBase;
    if (S.meters.safety < base) S.meters.safety = Math.min(base, S.meters.safety + SAFETY_RECOVER_HOUR * dt / 60);
  },
  // once a month: the airlines' moods follow the fee level
  feesMonth() {
    const d = FEE_MOOD[S.airport.fees] || 0;
    if (!d) return;
    for (const code of Object.keys(S.airlines)) {
      const al = S.airlines[code], t = (AIRLINES[code] || {}).temper || {};
      al.mood = clamp(al.mood + d * (d < 0 ? (t.fees || 1) : 1), 0, 100);
    }
    this.updateAirlines();
  },
  // a decision's change to the meters: { neighbours: +8, … }
  change(delta) {
    for (const k of Object.keys(delta || {})) {
      if (k === 'airlines') { for (const c of Object.keys(S.airlines)) S.airlines[c].mood = clamp(S.airlines[c].mood + delta[k], 0, 100); this.updateAirlines(); }
      else S.meters[k] = clamp(S.meters[k] + delta[k], 0, 100);
    }
  }
};
