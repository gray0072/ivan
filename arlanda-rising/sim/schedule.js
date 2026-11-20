'use strict';

// Arlanda Rising — the flights of an ops stage, made at its start from the stage's script. Each line of the
// script is a series: { al, type, n, from, to, turn, load, route, training, parked }:
//   n flights of an airline's type arriving between `from` and `to`, each leaving `turn` minutes after its
//   planned arrival; `parked` ones stand on the apron at the start and only leave (their departures spread
//   between `from` and `to`); `training` flights carry no passengers (school flying). Arrivals come early
//   or late by the difficulty's randomness. `waiver`: the flight may land although the fire category is too low
//   (a one-off permission). Session 5: `ns` — a flight outside the Schengen area (else its airline's own `ns`), `vip` — a
//   state or VIP flight kept apart on its own stand.
// Used by sim/ops.js; the flights live in S.ops.flights.

const Schedule = {
  make(stage) {
    const out = [];
    let num = 0;
    for (const line of stage.flights || []) {
      // a series that flies only after a choice: when: [decision id, option id…]
      if (line.when && line.when.slice(1).indexOf(S.mission.choices[line.when[0]]) < 0) continue;
      const from = clockMin(line.from), to = clockMin(line.to);
      for (let i = 0; i < line.n; i++) {
        const at = line.n === 1 ? from : from + (to - from) * i / (line.n - 1);
        out.push(this.flight(line, Math.round(at), ++num));
      }
    }
    out.sort((a, b) => (a.sta || a.std) - (b.sta || b.std));
    return out;
  },
  flight(line, at, num) {
    const a = AIRCRAFT[line.type];
    const booked = line.training ? 0 : Math.round(a.seats * (line.load || 0.7) * randRange(0.85, 1.1));
    const f = {
      id: 'f' + nextId(), al: line.al, type: line.type, intl: line.intl !== undefined ? line.intl : (AIRLINES[line.al] || {}).intl,
      // session 5: outside the Schengen area (passport control once it is on): the line's own, else its airline's
      ns: line.ns !== undefined ? !!line.ns : !!(AIRLINES[line.al] || {}).ns,
      no: line.al.slice(0, 2) + ' ' + (line.training ? 'T' + num : String((line.base || 100) + num)),
      route: line.route ? line.route[num % line.route.length] : null,
      training: !!line.training, booked, paxArr: line.training ? 0 : Math.round(a.seats * (line.load || 0.7) * randRange(0.8, 1.05)),
      sta: null, eta: null, std: null, st: 'sched', stand: null, landed: null, inBlock: null, offBlock: null,
      checked: 0, waitSum: 0, paxServed: 0, missed: 0, delay: 0, adelay: 0, extraTaxi: 0, tr: null
    };
    if (line.waiver) f.waiver = true;
    // session 5: an aircraft that stays for days (a guest's): it lands and keeps its stand; its departure is not this stage's
    if (line.stay) f.stay = true;
    if (line.parked) {
      f.std = at;
      f.st = 'parked';
      f.paxArr = 0;
    } else {
      f.sta = at;
      // early or late: mostly a little late, by the difficulty's randomness
      f.eta = Math.round((at + (rand() + rand() + rand() - 1.2) * diff().jitter) * 4) / 4;
      f.std = at + (line.turn || 45);
    }
    return f;
  }
};
