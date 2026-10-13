'use strict';

// ============================================================
// World Aviation — the comic line after a hard but successful
// landing: which trait of the graded touchdown was the roughest
// (LANDING_JOKE in constants.js) and a line about it for the
// flight's client group (data/landingjokes.js), picked the same
// way every time for the same landing. Shown by the debrief
// (UI.showDebrief in ui/ui.js), never after a lost flight or a
// practice landing.
// ============================================================

const LandingJoke = {
  // the roughest trait of the touchdown, or '' when nothing was rough
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
    return best;
  },

  // the client group a line is for: the bush & SAR operators, a flight with passengers, or freight
  group(c) {
    return c.faction === 'bush' ? 'bush' : c.type === 'pax' && c.pax ? 'pax' : 'cargo';
  },

  // the line itself, { icon, text }, or null
  pick(contract, landed, rwyLen) {
    if (!contract || !landed) return null;
    const trait = this.trait(landed, rwyLen);
    if (!trait) return null;
    // the group's lines that fit the load (a line about the patient only on an air ambulance flight)
    const all = (LANDING_JOKES[this.group(contract)] || []).filter((j) => !j.loads || j.loads.indexOf(contract.type) >= 0);
    const some = all.filter((j) => j.trait === trait);
    const list = some.length ? some : all;
    if (!list.length) return null;
    // a hash of the contract and the touchdown: the same line every time the debrief is drawn
    const seed = contract.id + '|' + landed.fpm + '|' + landed.fromThr + '|' + landed.offset;
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
    return list[(h >>> 0) % list.length];
  },

  // the debrief's quote line under the touchdown numbers, or ''
  html(result, failed) {
    const fl = Game.flight;
    if (failed || !fl || Game.practice || fl.practice) return '';
    const j = this.pick(result.contract, fl.landed, fl.arrival && fl.arrival.rwyLen);
    return j ? '<p class="landingJoke"><span class="ljIcon" aria-hidden="true">' + j.icon + '</span><span class="ljText">' + esc(tr(j.text)) + '</span></p>' : '';
  }
};
