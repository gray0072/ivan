'use strict';

// Lift Logic — the passengers of a run: who comes when (the mission's fixed schedule, the flows drawn
// from the seeded random, and people who come back a while after an earlier ride), the queue on every
// landing, getting on and off, the cabin buttons they press, their mood as they wait and giving up.
// The program never reads a person — only the buttons they press. Used by sim/run.js and sim/lift.js.

const People = {
  init() {
    const m = run.mission, rnd = run.rng;
    run.people = [];
    run.queues = run.floors.map(() => []);
    run.pending = [];
    run.chains = [];
    run.usedNames = {};
    let seq = 0;
    for (const e of m.schedule || []) {
      const entry = Object.assign({ seq: seq++ }, e);
      if (e.after) run.chains.push(entry);
      else run.pending.push(entry);
    }
    const flowShare = run.diff.flow;
    for (const f of m.flows || []) {
      const rate = (f.perMin / 60) * (f.fixed ? 1 : flowShare);
      if (rate <= 0) continue;
      let t = f.t0 || 0;
      for (;;) {
        t += -Math.log(1 - rnd()) / rate;
        if (t > f.t1) break;
        const from = People.pickFloor(f.from, null, rnd);
        const to = People.pickFloor(f.to, from, rnd);
        if (from === null || to === null || from === to) continue;
        const who = People.pickWho(f.who, rnd);
        run.pending.push({ seq: seq++, t, from, to, who, emergency: !!f.emergency });
      }
    }
    run.pending.sort((a, b) => a.t - b.t || a.seq - b.seq);
    run.total = run.pending.length + run.chains.length;
  },

  // a floor from a flow's description: a label, a list of labels, 'any', 'upper' (not the lobby), 'lobby'
  pickFloor(spec, not, rnd) {
    let list;
    if (typeof spec === 'number') return spec;
    if (Array.isArray(spec)) list = spec;
    else if (spec === 'lobby') return run.lobby;
    else if (spec === 'upper') list = run.floors.filter((f) => f !== run.lobby);
    else list = run.floors.slice();
    list = list.filter((f) => f !== not);
    if (!list.length) return null;
    return list[Math.floor(rnd() * list.length)];
  },
  // a character from a flow's mix: 'kid' or [['kid', 3], ['teacher', 1]]
  pickWho(spec, rnd) {
    if (!Array.isArray(spec)) return spec || 'neighbour';
    const sum = spec.reduce((s, w) => s + w[1], 0);
    let r = rnd() * sum;
    for (const w of spec) { r -= w[1]; if (r <= 0) return w[0]; }
    return spec[spec.length - 1][0];
  },
  pickName(who) {
    const c = PEOPLE[who];
    if (c.name) return c.name;
    const pool = c.names;
    for (let k = 0; k < 6; k++) {
      const n = pool[Math.floor(run.rng() * pool.length)];
      if (!run.usedNames[n]) { run.usedNames[n] = true; return n; }
    }
    return pool[Math.floor(run.rng() * pool.length)];
  },

  waitingAt(i) { return run.queues[i]; },

  // everyone whose time has come appears on their landing and presses ▲ or ▼
  spawnDue() {
    while (run.pending.length && run.pending[0].t <= run.t + 1e-9) People.spawn(run.pending.shift());
  },

  spawn(e) {
    const c = PEOPLE[e.who] || PEOPLE.neighbour;
    const fi = floorIndex(e.from), ti = floorIndex(e.to);
    if (fi < 0 || ti < 0 || fi === ti) return;
    const p = {
      id: run.people.length + 1, key: e.id || null, who: e.who, name: e.name || People.pickName(e.who),
      from: e.from, to: e.to, fi, ti, dir: ti > fi ? 'up' : 'down',
      t0: run.t, size: e.size || c.size, board: c.board, prank: !!c.prank,
      patience: (e.patience || c.patience) * run.diff.patience * (run.cheatPatience ? 1e6 : 1),
      state: 'waiting', mood: 0, lift: 0, tBoard: null, tOff: null, furious: false, emergency: !!e.emergency,
      firstMove: 0, wrongWay: false, story: e.story || null
    };
    run.people.push(p);
    run.queues[fi].push(p);
    logEvent('appear', { id: p.id, floor: p.from, to: p.to });
    GameEvents.emit('appear', { person: p });
    Building.press(fi, p.dir);
    if (p.emergency) Building.emergency(fi);
  },

  board(p, L) {
    const q = run.queues[p.fi];
    q.splice(q.indexOf(p), 1);
    p.state = 'riding';
    p.lift = L.n;
    p.tBoard = run.t;
    L.riders.push(p);
    logEvent('board', { id: p.id, lift: L.n, floor: p.from, wait: run.t - p.t0 });
    GameEvents.emit('board', { person: p, lift: L });
    Lift.pressInside(L, p.to);
    if (p.prank) {
      run.counters.pranks++;
      for (const f of run.floors) if (Lift.canStopAt(L, f)) Lift.pressInside(L, f);
    }
  },

  alight(p, L) {
    L.riders.splice(L.riders.indexOf(p), 1);
    p.state = 'done';
    p.tOff = run.t;
    run.delivered++;
    if (p.wrongWay) run.counters.wrongWay++;
    logEvent('delivered', { id: p.id, lift: L.n, floor: p.to, wait: p.tBoard - p.t0, trip: run.t - p.t0 });
    GameEvents.emit('delivered', { person: p, lift: L });
    People.release(p);
  },

  // the people who come back a while after this one got off (Grandma back from the bakery)
  release(p) {
    if (!p.key) return;
    for (const e of run.chains.slice()) {
      if (e.after !== p.key) continue;
      run.chains.splice(run.chains.indexOf(e), 1);
      const at = Object.assign({}, e, { t: run.t + (e.delay || 0) });
      delete at.after;
      run.pending.push(at);
    }
    run.pending.sort((a, b) => a.t - b.t || a.seq - b.seq);
  },
  // a person who gave up never comes back for the next part of the story
  dropChains(p) {
    if (!p.key) return;
    const gone = run.chains.filter((e) => e.after === p.key);
    for (const e of gone) {
      run.chains.splice(run.chains.indexOf(e), 1);
      run.total--;
      People.dropChains({ key: e.id });
    }
  },

  update() {
    for (const L of run.lifts) {
      // a rider whose lift moves away from their floor first rode the wrong way
      if (!L.moving) continue;
      for (const p of L.riders) {
        if (p.firstMove) continue;
        p.firstMove = L.heading;
        if ((p.ti > p.fi ? 1 : -1) !== L.heading) p.wrongWay = true;
      }
    }
    for (let i = 0; i < run.queues.length; i++) {
      const q = run.queues[i];
      for (let k = q.length - 1; k >= 0; k--) {
        const p = q[k];
        const ratio = (run.t - p.t0) / p.patience;
        const mood = ratio >= 1 ? 3 : ratio >= MOOD_STEPS[2] ? 3 : ratio >= MOOD_STEPS[1] ? 2 : ratio >= MOOD_STEPS[0] ? 1 : 0;
        if (mood !== p.mood) { p.mood = mood; GameEvents.emit('mood', { person: p }); }
        if (ratio < 1 || p.furious) continue;
        if (Math.abs(p.ti - p.fi) <= STAIRS_MAX) {
          q.splice(k, 1);
          p.state = 'gaveup';
          p.tOff = run.t;
          run.gaveUp++;
          logEvent('gaveUp', { id: p.id, floor: p.from, to: p.to, wait: run.t - p.t0 });
          GameEvents.emit('gaveUp', { person: p });
          People.dropChains(p);
        } else {
          p.furious = true;
          logEvent('furious', { id: p.id, floor: p.from });
          GameEvents.emit('furious', { person: p });
        }
      }
    }
  },

  // still somewhere in the building: waiting or riding
  active() {
    for (const q of run.queues) if (q.length) return true;
    for (const L of run.lifts) if (L.riders.length) return true;
    return false;
  }
};
