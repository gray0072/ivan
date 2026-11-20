'use strict';

// Lift Logic — one lift: its motion along the shaft (a trapezoid of speed with the lift type's top speed
// and acceleration; the braking point of a floor), the doors (open, dwell, boarding, close, re-open),
// the plan (the ordered floors it will stop at), the arrow lamps, the cabin buttons, the load and the
// energy. A lift drives towards the first floor of its plan; arriving it opens and removes that floor;
// with the plan empty and the doors closed it is idle. Used by sim/run.js each step; the program
// changes the plan through sim/vm.js.

const Lift = {
  create(n, spec) {
    const type = LIFT_TYPES[spec.type] || LIFT_TYPES.standard;
    const at = floorIndex(spec.at !== undefined ? spec.at : run.lobby);
    return {
      n, letter: 'ABCDEFGH'[n - 1], type: spec.type, look: type,
      speed: spec.speed || type.speed, accel: spec.accel || type.accel, cap: spec.cap || type.cap,
      pos: at < 0 ? 0 : at, v: 0, moving: false, late: false, heading: 0,
      doorPhase: 'closed', doorT: 0, doors: 0,
      plan: [], cabin: new Set(), riders: [],
      idle: true, arrivals: {}, stops: 0, arrowOverride: null, callDir: null, holdUntil: 0, closeAsap: false,
      busyUntil: 0, openSince: 0, curStop: null, trip: null, tripId: 0, passFired: '',
      say: null, energy: 0, emptyTrips: 0, vars: {}, threads: [], every: {}, working: true,
      zone: null
    };
  },

  here(L) { return Math.round(L.pos); },
  floor(L) { return floorLabel(Math.round(L.pos)); },
  load(L) { let s = 0; for (const p of L.riders) s += p.size; return s; },
  loadPct(L) { return Math.round(100 * Lift.load(L) / L.cap); },
  direction(L) { return L.moving ? (L.heading > 0 ? 'up' : 'down') : 'stopped'; },
  // a lift of a zone stops only at the floors of its zone
  canStopAt(L, label) {
    if (!hasFloor(label)) return false;
    if (!L.zone) return true;
    const i = floorIndex(label);
    return i >= L.zone[0] && i <= L.zone[1];
  },

  // the arrow lamps: set by the program for this stop; an empty lift answering a call of one direction
  // shows that direction; else the way to the next floor of the plan, none with an empty plan
  arrow(L) {
    if (L.arrowOverride) return L.arrowOverride;
    if (L.callDir && !L.moving) return L.callDir;
    const here = floorLabel(Lift.here(L));
    for (const f of L.plan) {
      if (f === here) continue;
      return floorIndex(f) > Lift.here(L) ? 'up' : 'down';
    }
    return 'none';
  },

  // ---------- the plan ----------
  planAdd(L, label) { if (L.plan.indexOf(label) < 0) L.plan.push(label); },
  planFirst(L, label) { L.plan = [label].concat(L.plan.filter((f) => f !== label)); },
  planRemove(L, label) { L.plan = L.plan.filter((f) => f !== label); },
  planClear(L) { L.plan = []; },

  // `stop here` from `when I'm about to pass floor`: possible while the lift can still brake for it
  stopHere(L, label) {
    const i = floorIndex(label);
    if (!L.moving || i < 0) return false;
    const d = i - L.pos;
    if (Math.sign(d) !== Math.sign(L.v) && Math.abs(d) > 1e-6) return false;
    const brake = L.v * L.v / (2 * L.accel);
    if (Math.abs(d) < brake - 0.02) return false;
    Lift.planFirst(L, label);
    return true;
  },

  pressInside(L, label) {
    if (L.cabin.has(label)) return;
    if (!L.moving && L.doorPhase !== 'closed' && label === Lift.floor(L)) return;
    L.cabin.add(label);
    logEvent('button', { lift: L.n, floor: label });
    VM.event('onButton', L, { floor: label });
    GameEvents.emit('buttonInside', { lift: L, floor: label });
  },

  // ---------- each step ----------
  update(L, dt) {
    if (!L.working) return;
    if (L.say && run.t >= L.say.until) L.say = null;
    switch (L.doorPhase) {
      case 'closed':
        if (L.moving) { Lift.move(L, dt); break; }
        if (L.plan.length) {
          while (L.plan.length && !hasFloor(L.plan[0])) L.plan.shift();
          if (!L.plan.length) break;
          L.idle = false;
          if (floorIndex(L.plan[0]) === Lift.here(L)) { Lift.arrive(L, false); break; }
          Lift.startMove(L);
          Lift.move(L, dt);
        } else {
          if (!L.idle) {
            L.idle = true;
            logEvent('idle', { lift: L.n, floor: Lift.floor(L) });
            VM.event('onIdle', L, {});
          }
          // a real lift standing still opens for a call at its own floor
          const here = Lift.here(L);
          if (Building.isLit(here, 'any') || L.cabin.has(floorLabel(here))) Lift.arrive(L, true);
        }
        break;
      case 'opening':
        Lift.mergePlan(L);
        L.doorT += dt;
        L.doors = Math.min(1, L.doorT / DOOR_TIME);
        if (L.doors >= 1) {
          L.doorPhase = 'open';
          L.openSince = run.t;
          Lift.serveCalls(L);
        }
        break;
      case 'open':
        Lift.mergePlan(L);
        Lift.boarding(L);
        break;
      case 'closing':
        Lift.mergePlan(L);
        if (L.doorPhase !== 'closing') break;
        L.doorT += dt;
        L.doors = Math.max(0, 1 - L.doorT / DOOR_TIME);
        // someone steps into the doorway: the light curtain opens them again
        if (!L.closeAsap && Lift.someoneBoards(L)) { Lift.reopen(L); break; }
        if (L.doors <= 0) Lift.doorsClosed(L);
        break;
    }
  },

  startMove(L) {
    L.moving = true;
    L.late = false;
    L.heading = Math.sign(floorIndex(L.plan[0]) - L.pos) || 1;
    L.energy += ENERGY_PER_START;
    run.energy += ENERGY_PER_START;
    L.tripId++;
    L.trip = { from: Lift.floor(L), riders: L.riders.length, t: run.t };
    L.curStop = null;
    L.arrowOverride = null;
    L.callDir = null;
    logEvent('depart', { lift: L.n, floor: Lift.floor(L), riders: L.riders.length });
    GameEvents.emit('depart', { lift: L });
  },

  move(L, dt) {
    if (!L.plan.length || !hasFloor(L.plan[0])) {
      // the plan was emptied on the way: stop at the next floor ahead
      const ahead = L.v > 0 ? Math.ceil(L.pos - 1e-6) : Math.floor(L.pos + 1e-6);
      const brakeTo = L.v > 0 ? Math.ceil(L.pos + L.v * L.v / (2 * L.accel) - 1e-6) : Math.floor(L.pos - L.v * L.v / (2 * L.accel) + 1e-6);
      L.plan = [floorLabel(clamp(L.v === 0 ? ahead : brakeTo, 0, run.floors.length - 1))];
    }
    const ti = floorIndex(L.plan[0]);
    const a = L.accel, d = ti - L.pos, s = Math.sign(d) || L.heading || 1;
    let v = L.v;
    if (v * s < 0) {
      v -= Math.sign(v) * Math.min(Math.abs(v), a * dt);
    } else {
      const stopV = Math.sqrt(2 * a * Math.abs(d));
      let sp = Math.abs(v);
      if (sp > stopV + a * dt * 1.01) { sp = Math.max(0, sp - a * dt); L.late = true; }
      else { sp = Math.min(L.speed, sp + a * dt, stopV); L.late = false; }
      v = s * sp;
    }
    const old = L.pos;
    const np = old + v * dt;
    L.heading = v !== 0 ? Math.sign(v) : s;
    let arrived = false, to = np;
    if (!L.late && ((ti - np) * s <= 1e-9 || Math.abs(ti - np) < 1e-4)) { to = ti; arrived = true; }
    const dist = Math.abs(to - old);
    L.energy += dist * ENERGY_PER_FLOOR;
    run.energy += dist * ENERGY_PER_FLOOR;
    // floors crossed without stopping (for the Inspector)
    const lo = Math.min(old, to), hi = Math.max(old, to);
    for (let k = Math.ceil(lo + 1e-6); k <= Math.floor(hi - 1e-6); k++) {
      if (k === ti && arrived) continue;
      logEvent('pass', { lift: L.n, floor: floorLabel(k) });
    }
    L.pos = to;
    if (arrived) { L.v = 0; Lift.arrive(L, false); return; }
    L.v = v;
    // the braking point of the next floor that is not the target: `when I'm about to pass floor`
    if (v !== 0) {
      const dir = Math.sign(v);
      const nf = dir > 0 ? Math.floor(L.pos + 1e-6) + 1 : Math.ceil(L.pos - 1e-6) - 1;
      if (nf >= 0 && nf < run.floors.length && nf !== ti && (ti - nf) * dir > 0) {
        const gap = Math.abs(nf - L.pos), brake = v * v / (2 * a);
        const key = L.tripId + ':' + nf;
        if (gap <= brake + PASS_MARGIN + Math.abs(v) * dt && L.passFired !== key) {
          L.passFired = key;
          VM.event('onPass', L, { floor: floorLabel(nf) });
        }
      }
    }
  },

  arrive(L, auto) {
    L.moving = false;
    L.late = false;
    L.v = 0;
    L.pos = Lift.here(L);
    const label = Lift.floor(L), i = Lift.here(L);
    L.plan = L.plan.filter((f) => f !== label);
    L.arrivals[label] = (L.arrivals[label] || 0) + 1;
    L.idle = false;
    L.doorPhase = 'opening';
    L.doorT = L.doors * DOOR_TIME;
    L.arrowOverride = null;
    L.holdUntil = 0;
    L.closeAsap = false;
    // an empty lift answering a call of one direction shows that direction for this stop
    const h = run.hall[i];
    L.callDir = !L.riders.length && h.up !== h.down ? (h.up ? 'up' : 'down') : null;
    if (!auto) L.stops++;
    L.curStop = { lift: L.n, floor: label, t: run.t, said: [], auto, boarded: 0, alighted: 0, refused: {} };
    run.stopsLog.push(L.curStop);
    L.cabin.delete(label);
    if (run.hall[i].emergency) {
      run.hall[i].emergency = false;
      logEvent('emergencyServed', { floor: label, waited: run.t - run.hall[i].emergencyT });
    }
    logEvent('stop', { lift: L.n, floor: label, riders: L.riders.length, auto });
    if (!auto) VM.event('onArrive', L, { floor: label });
    GameEvents.emit('arrive', { lift: L, floor: label });
  },

  // the floor the doors are open at was put in the plan again: it counts as reached
  mergePlan(L) {
    const label = Lift.floor(L);
    if (L.plan.indexOf(label) < 0) return;
    L.plan = L.plan.filter((f) => f !== label);
    L.arrivals[label] = (L.arrivals[label] || 0) + 1;
    if (L.doorPhase === 'closing') Lift.reopen(L);
  },

  reopen(L) {
    L.doorPhase = 'opening';
    L.doorT = L.doors * DOOR_TIME;
    GameEvents.emit('reopen', { lift: L });
  },

  // the hall call goes off when the lift opens with a matching arrow (both with no arrow)
  serveCalls(L) {
    const i = Lift.here(L), a = Lift.arrow(L);
    if (a !== 'down') Building.clear(i, 'up');
    if (a !== 'up') Building.clear(i, 'down');
  },

  // would a waiting person get on now (for the doors' light curtain)
  someoneBoards(L) {
    const i = Lift.here(L), a = Lift.arrow(L), room = L.cap - Lift.load(L);
    for (const p of People.waitingAt(i)) {
      if ((a === 'none' || p.dir === a) && p.size <= room && Lift.canStopAt(L, p.to) && !L.curStop.refused[p.id]) return true;
    }
    return false;
  },

  // one person at a time gets off, then on; the doors close when nobody moves and the dwell is over
  boarding(L) {
    if (L.busyUntil > run.t) return;
    const label = Lift.floor(L), i = Lift.here(L);
    const off = L.riders.find((p) => p.to === label);
    if (off) {
      People.alight(off, L);
      L.busyUntil = run.t + BOARD_TIME * off.board;
      L.curStop.alighted++;
      return;
    }
    Lift.serveCalls(L);
    const a = Lift.arrow(L);
    for (const p of People.waitingAt(i)) {
      if (a !== 'none' && p.dir !== a) continue;
      if (!Lift.canStopAt(L, p.to)) continue;
      if (Lift.load(L) + p.size > L.cap) {
        if (!L.curStop.refused[p.id]) {
          L.curStop.refused[p.id] = true;
          run.counters.refused++;
          logEvent('refused', { lift: L.n, floor: label, id: p.id });
          GameEvents.emit('tooHeavy', { lift: L, person: p });
        }
        continue;
      }
      People.board(p, L);
      L.busyUntil = run.t + BOARD_TIME * p.board;
      L.curStop.boarded++;
      return;
    }
    if (run.t >= L.holdUntil && (L.closeAsap || run.t - L.openSince >= DWELL_MIN)) {
      L.doorPhase = 'closing';
      L.doorT = 0;
      GameEvents.emit('doorsClosing', { lift: L });
    }
  },

  doorsClosed(L) {
    L.doorPhase = 'closed';
    L.doors = 0;
    L.doorT = 0;
    const i = Lift.here(L), stop = L.curStop;
    if (stop && !stop.auto && L.trip && L.trip.riders === 0 && stop.boarded + stop.alighted === 0) {
      L.emptyTrips++;
      run.counters.emptyTrips++;
      logEvent('emptyTrip', { lift: L.n, from: L.trip.from, to: stop.floor });
    }
    if (stop && Object.keys(stop.refused).length && stop.boarded === 0 && stop.alighted === 0) run.counters.fullStops++;
    L.trip = null;
    // whoever was left behind presses again; a call still lit is heard again
    const pressed = {};
    for (const p of People.waitingAt(i)) if (!Building.isLit(i, p.dir) && Building.press(i, p.dir)) pressed[p.dir] = true;
    const h = run.hall[i];
    for (const dir of ['up', 'down']) if (h[dir] && !pressed[dir]) VM.event('onCall', null, { floor: run.floors[i], direction: dir });
    logEvent('doorsClosed', { lift: L.n, floor: Lift.floor(L) });
    VM.event('onDoorsClose', L, {});
    GameEvents.emit('doorsClosed', { lift: L });
  }
};
