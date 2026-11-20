'use strict';

// Lift Logic — the numbers of a run (delivered, gave up, waits, energy, blocks, empty trips…) and the stars
// it earns. A mission has three star conditions; the first is the goal and passes the mission, each of the
// other two adds a star. A condition is one test or a list of tests that must all hold. Wait and energy
// limits are scaled by the difficulty; block limits never are. Returns text keys with params; ui/ translates
// them. Used by ui/results.js, game.js and tools/missions-check.js.

const Stats = {
  compute(r) {
    r = r || run;
    const end = r.tEnd !== null && r.tEnd !== undefined ? r.tEnd : r.t;
    const waits = r.people.map((p) => {
      let w = (p.tBoard !== null ? p.tBoard : p.state === 'gaveup' ? p.tOff : end) - p.t0;
      if (p.furious) w += Math.max(0, w - p.patience);
      // a trip with a change of lifts: the waits on both landings
      w += p.waitAcc || 0;
      return { id: p.id, name: p.name, who: p.who, from: p.from, to: p.to, t0: p.t0, wait: w, state: p.state, furious: p.furious };
    });
    const sum = waits.reduce((s, w) => s + w.wait, 0);
    let stops = 0;
    for (const L of r.lifts) stops += L.stops;
    const notArrived = r.total - r.delivered;
    return {
      total: r.total, delivered: r.delivered, gaveUp: r.gaveUp, notArrived,
      furious: r.people.filter((p) => p.furious).length,
      avgWait: waits.length ? sum / waits.length : 0,
      maxWait: waits.reduce((m, w) => Math.max(m, w.wait), 0),
      energy: Math.round(r.energy), blocks: r.blocks, stops,
      emptyTrips: r.counters.emptyTrips, fullStops: r.counters.fullStops, says: r.counters.says,
      wrongWay: r.counters.wrongWay, pranks: r.counters.pranks,
      time: end, waits, errors: Object.keys(r.errors || {}).length
    };
  },

  // the story goals of some missions
  story: {
    // every stop of the lift has a `say` with the floor number in it
    sayStops(r) {
      const stops = r.stopsLog.filter((s) => !s.auto);
      const ok = stops.filter((s) => s.said.some((t) => new RegExp('(^|[^0-9-])' + s.floor + '($|[^0-9])').test(t))).length;
      return { ok: stops.length > 0 && ok === stops.length, value: ok + ' / ' + stops.length };
    },
    // the variable `stops` holds the number of stops at the end
    countStops(r) {
      const L = r.lifts[0];
      const v = Object.prototype.hasOwnProperty.call(L.vars, 'stops') ? L.vars.stops : r.vars.stops;
      return { ok: Number(v) === L.stops && L.stops > 0, value: String(v === undefined ? '—' : v) + ' / ' + L.stops };
    },
    // every emergency was reached within its limit
    emergencies(r, c) {
      const served = r.log.filter((e) => e.type === 'emergencyServed');
      const all = r.log.filter((e) => e.type === 'emergency').length;
      const worst = served.reduce((m, e) => Math.max(m, e.waited), 0);
      const limit = c.s * r.diff.limits;
      return { ok: served.length === all && worst <= limit, value: fmtNum(worst) + ' s' };
    },
    // the people of a given character were all delivered
    delivered(r, c) {
      const ps = r.people.filter((p) => p.who === c.who);
      const ok = ps.length > 0 && ps.every((p) => p.state === 'done');
      return { ok, value: ps.filter((p) => p.state === 'done').length + ' / ' + ps.length };
    },
    // the lift never rode anyone the wrong way first
    noWrongWay(r) { return { ok: r.counters.wrongWay === 0, value: String(r.counters.wrongWay) }; },
    wrongWayMax(r, c) { return { ok: r.counters.wrongWay <= c.n, value: String(r.counters.wrongWay) }; },
    // the full lift stopped for calls it could not take at most n times
    fullStopsMax(r, c) { return { ok: r.counters.fullStops <= c.n, value: String(r.counters.fullStops) }; },
    // the longest ride of a given character, from getting on to getting off (a bed goes straight there)
    rideMax(r, c) {
      const ps = r.people.filter((p) => p.who === c.who && p.state === 'done');
      const worst = ps.reduce((m, p) => Math.max(m, p.tOff - p.tBoard), 0);
      const all = r.people.filter((p) => p.who === c.who).length;
      return { ok: all > 0 && ps.length === all && worst <= c.s * r.diff.limits + 1e-9, value: fmtNum(worst) + ' s' };
    },
    // slow walkers left behind by doors that closed while they were on their way
    leftBehindMax(r, c) { return { ok: r.counters.leftBehind <= c.n, value: String(r.counters.leftBehind) }; },
    // stops where nobody got on or off (the prankster's buttons)
    nobodyStopsMax(r, c) { return { ok: r.counters.nobodyStops <= c.n, value: String(r.counters.nobodyStops) }; },
    // stops for nobody at floors only the prankster pressed
    prankStopsMax(r, c) { return { ok: r.counters.prankStops <= c.n, value: String(r.counters.prankStops) }; },
    // no block went wrong during the day (a floor out of the lift's range, a missing list item…)
    noErrors(r) {
      const n = Object.values(r.errors || {}).filter((e) => !e.flash).length;
      return { ok: n === 0, value: String(n) };
    },
    // the program defines an own block with at least one input, and uses it
    ownInput(r) {
      const own = ownBlocks(r.program).filter((o) => o.kinds.length > 0);
      let used = false;
      Prog.walk(r.program, (b) => { if (b.op === 'call' && own.some((o) => o.name === b.name)) used = true; });
      return { ok: used, value: used ? '✓' : '✗' };
    },
    // the program uses one of the given blocks (the lesson of the mission)
    uses(r, c) {
      const ops = Prog.ops(r.program);
      const ok = c.ops.some((op) => ops.indexOf(op) >= 0);
      return { ok, value: ok ? '✓' : '✗' };
    }
  }
};

const Stars = {
  // { key, params } of a single test, for the mission card and the results
  label(c) {
    switch (c.k) {
      case 'all': return { key: 'Deliver everyone' };
      case 'share': return { key: 'Deliver at least {p}% of the people', params: { p: Math.round(c.p * 100) } };
      case 'noGaveUp': return { key: 'Nobody gives up' };
      case 'gaveUpMax': return { key: 'At most {n} give up', params: { n: c.n } };
      case 'avgWait': return { key: 'Average wait ≤ {s} s', params: { s: c.s } };
      case 'maxWait': return { key: 'Longest wait ≤ {s} s', params: { s: c.s } };
      case 'energy': return { key: 'Energy ≤ {e} ⚡', params: { e: c.e } };
      case 'blocks': return { key: 'At most {n} blocks', params: { n: c.n } };
      case 'emptyMax': return { key: c.n ? 'At most {n} empty trips' : 'No empty trips', params: { n: c.n } };
      case 'within': return { key: 'Everyone delivered within {s} s', params: { s: c.s } };
      case 'story': return { key: c.text, params: c.params || {} };
      default: return { key: c.k };
    }
  },
  // the limit of a test at a difficulty (waits and time scale; energy only gets looser — the engineer's
  // energy is often the least possible; blocks never scale)
  scaled(c, diff) {
    const k = (DIFFICULTY[diff] || DIFFICULTY.medium).limits;
    const o = Object.assign({}, c);
    if (c.s !== undefined && c.k !== 'story') o.s = Math.round(c.s * k * 10) / 10;
    if (c.e !== undefined) o.e = Math.round(c.e * Math.max(1, k));
    return o;
  },
  test(c, st, r) {
    switch (c.k) {
      case 'all': return { ok: st.total > 0 && st.delivered === st.total, value: st.delivered + ' / ' + st.total };
      case 'share': return { ok: st.delivered >= Math.ceil(st.total * c.p), value: st.delivered + ' / ' + st.total };
      case 'noGaveUp': return { ok: st.gaveUp === 0 && st.furious === 0, value: String(st.gaveUp + st.furious) };
      case 'gaveUpMax': return { ok: st.gaveUp + st.furious <= c.n, value: String(st.gaveUp + st.furious) };
      case 'avgWait': return { ok: st.avgWait <= c.s + 1e-9, value: fmtNum(st.avgWait) + ' s' };
      case 'maxWait': return { ok: st.maxWait <= c.s + 1e-9, value: fmtNum(st.maxWait) + ' s' };
      case 'energy': return { ok: st.energy <= c.e, value: st.energy + ' ⚡' };
      case 'blocks': return { ok: st.blocks <= c.n, value: String(st.blocks) };
      case 'emptyMax': return { ok: st.emptyTrips <= (c.n || 0), value: String(st.emptyTrips) };
      case 'within': return { ok: st.delivered === st.total && st.time <= c.s + 1e-9, value: fmtNum(st.time) + ' s' };
      case 'story': return Stats.story[c.id](r, c);
      default: return { ok: false, value: '?' };
    }
  },
  // the three stars of a finished run
  judge(r) {
    r = r || run;
    const st = Stats.compute(r);
    const lines = r.mission.stars.map((cond) => {
      const list = Array.isArray(cond) ? cond : [cond];
      const parts = list.map((c0) => {
        const c = Stars.scaled(c0, r.difficulty);
        const res = Stars.test(c, st, r);
        return Object.assign({ ok: res.ok, value: res.value }, Stars.label(c));
      });
      return { ok: parts.every((p) => p.ok), parts };
    });
    const pass = lines[0].ok && !r.stopped && !r.forceFail;
    const stars = pass ? 1 + (lines[1].ok ? 1 : 0) + (lines[2].ok ? 1 : 0) : 0;
    return { stars, pass, lines, stats: st };
  }
};
