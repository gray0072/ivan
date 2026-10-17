'use strict';

// ============================================================
// World Aviation — the comic lines in the debrief after a
// successful flight: one about the touchdown (its roughest trait,
// or a butter or a good landing) and one about a moment of the
// flight (a go-around, the grass, a taxi overspeed, an emergency,
// the fuel, the weather, the schedule), when it had one
// (LANDING_JOKE in constants.js), each picked from the lines of
// the flight's client group (data/landingjokes.js) the same way
// every time for the same flight. Shown by the debrief
// (UI.showDebrief in ui/ui.js), never after a lost flight or a
// practice landing.
// ============================================================

const LandingJoke = {
  // the roughest trait of the touchdown; nothing rough: 'butter' or 'good'
  trait(landed, rwyLen) {
    const J = LANDING_JOKE;
    const past = {
      hard: landed.fpm / J.HARD_FPM,
      bounce: landed.bounced ? J.BOUNCE_K : 0,
      bank: Math.abs(landed.bank) / J.BANK_DEG,
      offset: Math.abs(landed.offset || 0) / J.OFFSET_M,
      long: landed.fromThr / Math.max(J.LONG_MIN_M, (rwyLen || 0) * J.LONG_SHARE)
    };
    let best = '', most = 1;
    for (const k in past) if (past[k] > most) { most = past[k]; best = k; }
    return best || (landed.fpm <= J.BUTTER_FPM ? 'butter' : 'good');
  },

  // the moment of the flight worth a line, the first that happened, or ''
  moment(fl, result) {
    const J = LANDING_JOKE, c = result.contract;
    if (fl.goArounds > 0) return 'goAround';
    if (fl.offPaveM >= J.GRASS_M) return 'grass';
    if (result.taxiOverspeed) return 'taxiFast';
    if (result.handled > 0) return 'emergency';
    if (fl.st.fuel < fl.ac.fuelCapKg * J.LOW_FUEL_SHARE) return 'lowFuel';
    const w = Game.setup && Game.setup.weather && Game.setup.weather.arr, a = fl.arrival;
    if (w && a && Math.abs(Math.sin(wrapDeg(w.dir - a.hdgDeg) * DEG) * w.speed) >= J.XWIND_KT) return 'crosswind';
    if (w && (w.precip === 'snow' || w.snow)) return 'snow';
    if (result.timeOfDay === 'night') return 'night';
    const landed = fl.landed;
    if (landed && fl.st.liftoffAt !== undefined && c.blockMin) {
      const diff = (landed.t - fl.st.liftoffAt) / 60 - c.blockMin;
      if (diff <= -J.EARLY_MIN) return 'early';
      if (diff >= J.LATE_MIN) return 'late';
    }
    return '';
  },

  // the client group a line is for: the bush & SAR operators, a flight with passengers, or freight
  group(c) {
    return c.faction === 'bush' ? 'bush' : c.type === 'pax' && c.pax ? 'pax' : 'cargo';
  },

  // a line, { icon, text }, from a list of lines for one trait or moment, or null: the ones that
  // fit the flight's group (`groups`, none = every group) and its load (`loads`: the patient only
  // on an air ambulance flight), picked by a hash of the contract and the touchdown
  choose(lines, c, key, seed) {
    const g = this.group(c);
    const fit = (lines || []).filter((j) => (!j.groups || j.groups.indexOf(g) >= 0) && (!j.loads || j.loads.indexOf(c.type) >= 0));
    const some = fit.filter((j) => j.trait === key);
    if (!some.length) return null;
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
    return some[(h >>> 0) % some.length];
  },

  // the two lines, each { icon, text } or null
  pick(contract, landed, rwyLen, fl, result) {
    if (!contract || !landed) return [];
    const seed = contract.id + '|' + landed.fpm + '|' + landed.fromThr + '|' + landed.offset;
    const trait = this.trait(landed, rwyLen);
    // a rough trait the group has no line for: any of its rough ones
    const own = LANDING_JOKES[this.group(contract)] || [];
    let first = this.choose(own, contract, trait, seed);
    if (!first && trait !== 'butter' && trait !== 'good') {
      const rough = own.filter((j) => j.trait !== 'butter' && j.trait !== 'good').map((j) => Object.assign({}, j, { trait }));
      first = this.choose(rough, contract, trait, seed);
    }
    const m = fl && result ? this.moment(fl, result) : '';
    const second = m ? this.choose(FLIGHT_JOKES, contract, m, seed + '|' + m) : null;
    return [first, second];
  },

  // the debrief's quote lines under the touchdown numbers, or ''
  html(result, failed) {
    const fl = Game.flight;
    if (failed || !fl || Game.practice || fl.practice || fl.lesson) return '';
    return this.pick(result.contract, fl.landed, fl.arrival && fl.arrival.rwyLen, fl, result).filter(Boolean).map((j) =>
      '<p class="landingJoke"><span class="ljIcon" aria-hidden="true">' + j.icon + '</span><span class="ljText">' + esc(tr(j.text)) + '</span></p>').join('');
  }
};
