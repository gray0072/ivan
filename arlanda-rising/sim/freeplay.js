'use strict';

// Arlanda Rising — Free Play (SPEC.md "Free Play and Challenge Days"): an endless airport with no frame. It starts
// from an era the campaign has opened (the open airport of 1963, the jet age of 1976, the domestic boom of 1989),
// then goes on in rounds: each round is a mission made here from the airport as it is — a month of plan time with
// two offers from the Offers board (airlines, shops, managers, teams, systems, wage rounds) and a peak of ops time
// flown from the airlines' own routes — with a rolling goal and no stars. The airport carries over from round to
// round (arlandaRising.freeplay.v1). Deterministic: a round is made from the world's seed and its number.

const FREE_OPENS_FIRST = null;
const FREE_ERAS = [
  { id: '1963', name: 'The open airport, 1963', date: '1963-04-01', opens: FREE_OPENS_FIRST,
    requires: ['site', 'runway1', 'apron1', 'tower1', 'terminal1', 'lights1'],
    setup: { open: true, budget: 40e6, loanLimit: 80e6, items: { fuelTruck: 2, plough: 4 }, desks: 4,
      airlines: { SK: [{ type: 'CRVL', perDay: 11, load: 0.68 }, { type: 'DC8', perDay: 2, load: 0.72 }] },
      unlock: { stands: 1, turnaround: 1, checkin: 1, snow: 1 } } },
  { id: '1976', name: 'The jet age, 1976', date: '1976-09-06', opens: '2-11',
    requires: ['site', 'runway1', 'apron1', 'tower1', 'terminal1', 'lights1', 'apron2', 'apron2.bigStand', 'bagHall', 'ils1', 'runway2', 'intlTerminal'],
    setup: { open: true, budget: 60e6, loanLimit: 150e6, items: { fuelTruck: 4, plough: 4, crashTender: 2 }, desks: 18,
      airlines: { SK: [{ type: 'DC9', perDay: 14, load: 0.7 }, { type: 'DC8', perDay: 3, load: 0.72 }, { type: 'B747', perDay: 2, load: 0.68 }],
        LH: [{ type: 'B727', perDay: 2, load: 0.7 }], AY: [{ type: 'DC9', perDay: 2, load: 0.7 }] },
      domains: { stands: 1, turnaround: 1, checkin: 1, snow: 1, baggage: 2 }, unlock: { stands: 1, turnaround: 1, checkin: 1, snow: 1, baggage: 2 } } },
  { id: '1989', name: 'Everyone flies, 1990', date: '1990-03-05', opens: '3-11',
    requires: ['site', 'runway1', 'apron1', 'tower1', 'terminal1', 'lights1', 'apron2', 'apron2.bigStand', 'bagHall', 'ils1', 'runway2', 'intlTerminal', 'domTerminal', 'computerRoom'],
    setup: { open: true, budget: 80e6, loanLimit: 200e6, items: { fuelTruck: 5, plough: 5, crashTender: 2 }, desks: 26, it: 3,
      airlines: { SK: [{ type: 'DC9', perDay: 18, load: 0.72 }, { type: 'MD81', perDay: 6, load: 0.72 }, { type: 'B747', perDay: 2, load: 0.7 }],
        LF: [{ type: 'F28', perDay: 30, load: 0.74 }], LH: [{ type: 'B727', perDay: 4, load: 0.7 }], AY: [{ type: 'DC9', perDay: 4, load: 0.7 }] },
      domains: { stands: 2, turnaround: 1, checkin: 1, snow: 1, baggage: 2, info: 2 },
      unlock: { stands: 2, turnaround: 1, checkin: 2, snow: 2, baggage: 2, info: 2 } } },
  // session 4: the open skies of 2000, with the shops' units, the security lanes, the train and the rivals
  { id: '1999', name: 'Open skies, 2000', date: '2000-02-07', opens: '4-11',
    requires: ['site', 'runway1', 'apron1', 'tower1', 'terminal1', 'lights1', 'apron2', 'apron2.bigStand', 'bagHall', 'ils1', 'runway2', 'intlTerminal', 'domTerminal', 'computerRoom', 'terminal2', 'arlandaExpress', 'sorterHall'],
    setup: { open: true, openSkies: true, units: true, lanes: 8, budget: 100e6, loanLimit: 400e6, items: { fuelTruck: 6, plough: 6, crashTender: 2, generator: 1 }, desks: 36, it: 6,
      airlines: { SK: [{ type: 'MD87', perDay: 16, load: 0.74 }, { type: 'B737', perDay: 14, load: 0.74 }, { type: 'DC9', perDay: 8, load: 0.72 }],
        BRAATHENS: [{ type: 'B737', perDay: 6, load: 0.72 }], LH: [{ type: 'B737', perDay: 5, load: 0.72 }], AY: [{ type: 'MD87', perDay: 5, load: 0.72 }] },
      domains: { stands: 2, turnaround: 1, checkin: 2, snow: 2, baggage: 3, info: 2 }, terms: { SK: 't2' }, rivals: { pull: 1, months: 1 },
      unlock: { stands: 2, turnaround: 1, checkin: 2, snow: 2, baggage: 3, info: 2 } } }
];

// game minutes on the ground by type, for the flights made from the routes
const FREE_TURN = { DC3: 30, CV44: 35, DC6B: 55, CRVL: 40, DC8: 65, DC9: 40, B727: 50, B747: 125, DC10: 75, F28: 35, MD81: 40,
  B737: 40, B767: 90, MD87: 40, F100: 35, F50: 25, BA46: 35, A320: 55, B757: 60 };
const FREE_OPENS = '2-11';         // the mission whose pass opens Free Play
const FREE_PLAN_DAYS = 40;         // days of plan time in a round
const FREE_GOAL_ONTIME = 0.7;      // the rolling goal of a round's ops stage

const FreePlay = {
  // Free Play opens after chapter 2; each era once the campaign has reached it
  any() { return Progress.best(FREE_OPENS) > 0; },
  open(eraId) { const e = FREE_ERAS.find((x) => x.id === eraId); return !!e && this.any() && (!e.opens || Progress.best(e.opens) > 0); },

  // a new Free Play: the era's airport, built by the owner
  start(eraId, difficulty) {
    const era = FREE_ERAS.find((x) => x.id === eraId);
    const def = { id: 'free', name: era.name, kind: 'free', date: era.date, requires: era.requires, setup: era.setup,
      stages: [{ name: 'Setting up', mode: 'plan', days: 1, goal: [] }], goal: [], stars: [] };
    Missions.start('free', difficulty, null, def);
    const w = Missions.world();
    return { era: eraId, difficulty, round: 1, world: w, startedAt: Date.now() };
  },

  // ---------- a round made from the airport ----------
  round(fp) {
    const w = fp.world, seed = hashOf('free', w.seed, fp.round);
    let rs = seed;
    const rnd = () => { const r = rngNext(rs); rs = r[1]; return r[0]; };
    const pick = (list) => list[Math.floor(rnd() * list.length)];
    const day = w.day + 3, date = Calendar.date(day), ymd = date.y + '-' + String(date.m).padStart(2, '0') + '-' + String(date.d).padStart(2, '0');
    const offers = this.offers(w, rnd, date.y);
    const choices = [];
    while (offers.length && choices.length < 2) {
      const o = offers.splice(Math.floor(rnd() * offers.length), 1)[0];
      if (choices.some((c) => c.group === o.group)) continue;
      o.id = 'f' + fp.round + '_' + choices.length;
      o.at = 4 + choices.length * 14;
      choices.push(o);
    }
    const opsDay = day + FREE_PLAN_DAYS + 2, od = Calendar.date(opsDay);
    const morning = fp.round % 2 === 1;
    const from = morning ? '07:00' : '16:00', to = morning ? '10:00' : '19:00';
    const winter = od.m === 12 || od.m <= 2, autumn = od.m >= 10 && od.m <= 11;
    const weather = { temp: winter ? -6 : autumn ? 5 : od.m >= 6 && od.m <= 8 ? 19 : 9, wind: [pick([20, 190, 210, 240, 270]), Math.round(5 + rnd() * 10)] };
    if (winter && rnd() < 0.6) weather.snow = [[morning ? '07:30' : '16:30', morning ? '09:00' : '18:00', 1.5 + rnd() * 1.5]];
    if (autumn && rnd() < 0.4) weather.fog = [[morning ? '07:00' : '16:00', morning ? '07:50' : '16:50', 300]];
    const hands = ['stand', 'checkin', 'fuel'];
    if (w.domains.baggage !== undefined) hands.push('bags');
    if (w.domains.info !== undefined) hands.push('announce');
    if (winter) hands.push('plough');
    return {
      id: 'free', name: 'Free Play', kind: 'free', date: ymd, free: true, round: fp.round,
      aim: 'Keep your airport running: answer the offers, then fly a peak on time.',
      brief: [], hands, setup: {},
      stages: [
        { name: 'A month of business', mode: 'plan', days: FREE_PLAN_DAYS, goal: [], choices },
        { name: morning ? 'Morning peak' : 'Evening peak', mode: 'ops', date: od.y + '-' + String(od.m).padStart(2, '0') + '-' + String(od.d).padStart(2, '0'),
          from, to, weather, desks: Math.min(w.airport.desks, 6), flights: this.flights(w, from, od.m, rnd), goal: [{ k: 'onTime', p: FREE_GOAL_ONTIME }] }
      ],
      goal: [], stars: []
    };
  },
  // the peak's flights from the airlines' routes: a peak hour is about 1/12 of the day's flights
  flights(w, from, month, rnd) {
    const out = [], t0 = clockMin(from);
    let base = 100;
    for (const code of Object.keys(w.airlines)) {
      for (const r of w.airlines[code].routes || []) {
        if (r.months && r.months.indexOf(month) < 0) continue;
        const n = Math.max(r.perDay >= 2 ? 1 : 0, Math.round(r.perDay * 3 / 10 * (0.9 + rnd() * 0.3)));
        if (!n) continue;
        const a = t0 + 5 + Math.round(rnd() * 20), b = t0 + 150 - Math.round(rnd() * 20);
        out.push({ al: code, type: r.type, n, from: fmtClock(a), to: fmtClock(n === 1 ? a : b), turn: FREE_TURN[r.type] || 45, load: r.load || 0.7, base });
        base += 100;
      }
    }
    return out;
  },
  // the Offers board: what may be offered now, by group (sim/offers.js; two offers of different groups make a round)
  offers(w, rnd, year) { return Offers.make(w, rnd, year); },

  // a round passed: the airport carries over to the next one
  passed(fp, world) { fp.world = world; fp.round++; return fp; }
};
