'use strict';

// Lift Logic — one lift: its motion along the shaft (a trapezoid of speed with the lift type's top speed
// and acceleration; the braking point of a floor), the doors (open, dwell, boarding, close, re-open),
// the plan (the ordered floors it will stop at), the arrow lamps, the cabin buttons, the load and the
// energy. A lift drives towards the first floor of its plan; arriving it opens and removes that floor;
// with the plan empty and the doors closed it is idle. A lift of a zone stops only at its floors; an express
// trip goes straight to its floor at the express speed. Used by sim/run.js each step; the program changes
// the plan through sim/vm.js.

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
      say: null, energy: 0, emptyTrips: 0, vars: {}, threads: [], every: {}, working: true, failing: 0, prankFloors: new Set(),
      zone: null, zoneLobby: -1, express: null, expressSpeed: spec.express || type.express || spec.speed || type.speed, litSeen: null
    };
  },

  here(L) { return Math.round(L.pos); },
  floor(L) { return floorLabel(Math.round(L.pos)); },
  load(L) { let s = 0; for (const p of L.riders) s += p.size; return s; },
  loadPct(L) { return Math.round(100 * Lift.load(L) / L.cap); },
  direction(L) { return L.moving ? (L.heading > 0 ? 'up' : 'down') : 'stopped'; },
  // a lift of a zone stops only at the floors of its zone (and at the lobby when its zone has it)
  canStopAt(L, label) {
    if (!hasFloor(label)) return false;
    if (!L.zone) return true;
    const i = floorIndex(label);
    return (i >= L.zone[0] && i <= L.zone[1]) || i === L.zoneLobby;
  },

  // the arrow lamps: set by the program for this stop; an empty lift answering a call of one direction
  // shows that direction; else the way to the next floor of the plan, none with an empty plan. The lamp
  // is lit as the doors open and stays for the whole stop (with none, everyone waiting gets on)
  arrow(L) {
    if (L.arrowOverride) return L.arrowOverride;
    if (L.stopArrow && !L.moving && L.doorPhase !== 'closed') return L.stopArrow;
    return Lift.planArrow(L);
  },
  planArrow(L) {
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
    if (L.failing && !L.moving && L.doorPhase === 'closed' && !L.riders.length && (!L.plan.length || run.t - L.failing >= BREAK_WAIT_MAX)) { Lift.breakDown(L); return; }
    if (L.say && run.t >= L.say.until) L.say = null;
    switch (L.doorPhase) {
      case 'closed':
        if (L.moving) { Lift.move(L, dt); break; }
        if (L.express !== null && floorIndex(L.express) !== Lift.here(L)) { L.idle = false; Lift.startMove(L); Lift.move(L, dt); break; }
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
          // a real lift standing still opens for a call at its own floor — but not again and again for a call it
          // just left lit (people there wait for a lift of another zone)
          const here = Lift.here(L);
          if ((Building.isLit(here, 'any') && !Lift.seenLit(L, here)) || L.cabin.has(floorLabel(here))) Lift.arrive(L, true);
        }
        break;
      case 'opening':
        Lift.mergePlan(L);
        L.doorT += dt;
        L.doors = Math.min(1, L.doorT / DOOR_TIME);
        if (L.doors >= 1) {
          L.doorPhase = 'open';
          L.openSince = run.t;
          L.stopArrow = Lift.planArrow(L);
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

  // the calls lit at floor i when the doors last closed there, still the same presses
  seenLit(L, i) {
    const s = L.litSeen, h = run.hall[i];
    if (!s || s.i !== i) return false;
    return (!h.up || h.upSeq === s.up) && (!h.down || h.downSeq === s.down);
  },

  // where the lift drives: an express trip's floor, else the first floor of the plan
  target(L) { return L.express !== null ? L.express : L.plan[0]; },

  startMove(L) {
    L.moving = true;
    L.late = false;
    L.heading = Math.sign(floorIndex(Lift.target(L)) - L.pos) || 1;
    L.energy += ENERGY_PER_START;
    run.energy += ENERGY_PER_START;
    L.tripId++;
    L.trip = { from: Lift.floor(L), riders: L.riders.length, t: run.t };
    L.curStop = null;
    L.arrowOverride = null;
    L.callDir = null;
    L.stopArrow = null;
    logEvent('depart', { lift: L.n, floor: Lift.floor(L), riders: L.riders.length });
    GameEvents.emit('depart', { lift: L });
  },

  move(L, dt) {
    if (L.express === null && (!L.plan.length || !hasFloor(L.plan[0]))) {
      // the plan was emptied on the way: stop at the next floor ahead
      const ahead = L.v > 0 ? Math.ceil(L.pos - 1e-6) : Math.floor(L.pos + 1e-6);
      const brakeTo = L.v > 0 ? Math.ceil(L.pos + L.v * L.v / (2 * L.accel) - 1e-6) : Math.floor(L.pos - L.v * L.v / (2 * L.accel) + 1e-6);
      L.plan = [floorLabel(clamp(L.v === 0 ? ahead : brakeTo, 0, run.floors.length - 1))];
    }
    // an express trip goes to its floor at the express speed, whatever the plan says meanwhile
    const ti = floorIndex(Lift.target(L));
    const top = L.express !== null ? L.expressSpeed : L.speed;
    const a = L.accel, d = ti - L.pos, s = Math.sign(d) || L.heading || 1;
    let v = L.v;
    if (v * s < 0) {
      v -= Math.sign(v) * Math.min(Math.abs(v), a * dt);
    } else {
      const stopV = Math.sqrt(2 * a * Math.abs(d));
      let sp = Math.abs(v);
      if (sp > stopV + a * dt * 1.01) { sp = Math.max(0, sp - a * dt); L.late = true; }
      else { sp = Math.min(top, sp + a * dt, stopV); L.late = false; }
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
    // the braking point of the nearest floor ahead the lift can still stop at (a fast lift needs more than
    // one floor to brake), when it is not the target: `when I'm about to pass floor` (never on an express trip)
    if (v !== 0 && L.express === null) {
      const dir = Math.sign(v), brake = v * v / (2 * a);
      let nf = dir > 0 ? Math.floor(L.pos + 1e-6) + 1 : Math.ceil(L.pos - 1e-6) - 1;
      while (nf >= 0 && nf < run.floors.length && Math.abs(nf - L.pos) < brake - 0.02) nf += dir;
      if (nf >= 0 && nf < run.floors.length && nf !== ti && (ti - nf) * dir > 0) {
        const gap = Math.abs(nf - L.pos);
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
    L.express = null;
    L.idle = false;
    L.doorPhase = 'opening';
    L.doorT = L.doors * DOOR_TIME;
    L.arrowOverride = null;
    L.holdUntil = 0;
    L.closeAsap = false;
    // an empty lift answering a call of one direction shows that direction for this stop
    const h = run.hall[i];
    L.callDir = !L.riders.length && h.up !== h.down ? (h.up ? 'up' : 'down') : null;
    L.stopArrow = null;
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

  // the lift goes out of service (a mission's breakdown): it finishes its riders and stands still for the
  // rest of the day; its program stops, the other lifts of the group have to cover
  breakDown(L) {
    L.working = false;
    L.failing = 0;
    L.plan = [];
    L.cabin.clear();
    L.threads = [];
    L.say = null;
    L.idle = true;
    logEvent('broken', { lift: L.n, floor: Lift.floor(L) });
    GameEvents.emit('broken', { lift: L });
  },

  // `cancel buttons inside` (anti-nuisance): every lit cabin button goes off, and whoever is inside presses
  // their own floor again
  cancelButtons(L) {
    if (!L.cabin.size) return;
    L.cabin.clear();
    L.prankFloors.clear();
    run.counters.cancels++;
    logEvent('cancelButtons', { lift: L.n, floor: Lift.floor(L) });
    for (const p of L.riders) Lift.pressInside(L, p.to);
  },

  // the floor the doors are open at was put in the plan again: it counts as reached
  mergePlan(L) {
    const label = Lift.floor(L);
    if (L.plan.indexOf(label) < 0) return;
    L.plan = L.plan.filter((f) => f !== label);
    L.arrivals[label] = (L.arrivals[label] || 0) + 1;
    const h = run.hall[Lift.here(L)];
    if (h.emergency) {
      h.emergency = false;
      logEvent('emergencyServed', { floor: label, waited: run.t - h.emergencyT });
    }
    if (L.doorPhase === 'closing') Lift.reopen(L);
  },

  reopen(L) {
    L.doorPhase = 'opening';
    L.doorT = L.doors * DOOR_TIME;
    GameEvents.emit('reopen', { lift: L });
  },

  // the hall call goes off when the lift opens with a matching arrow (both with no arrow) — but stays lit while
  // someone of that direction waits for a floor this lift doesn't stop at (another zone, another bank); slow
  // walkers waiting there start walking to the doors
  serveCalls(L) {
    const i = Lift.here(L), a = Lift.arrow(L);
    const stays = (dir) => !!L.zone && People.waitingAt(i).some((p) => p.dir === dir && !Lift.canStopAt(L, p.to));
    if (a !== 'down' && !stays('up')) Building.clear(i, 'up');
    if (a !== 'up' && !stays('down')) Building.clear(i, 'down');
    for (const p of People.waitingAt(i)) if (p.walk && p.reach === null) p.reach = run.t + p.walk;
  },
  // a slow walker who has not reached the doors yet
  walking(p) { return !!p.walk && (p.reach === null || run.t < p.reach); },

  // would a waiting person get on now (for the doors' light curtain)
  someoneBoards(L) {
    const i = Lift.here(L), a = Lift.arrow(L), room = L.cap - Lift.load(L);
    for (const p of People.waitingAt(i)) {
      if ((a === 'none' || p.dir === a || p.emergency) && p.size <= room && Lift.canStopAt(L, p.to) && !L.curStop.refused[p.id] && !Lift.walking(p)) return true;
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
    let coming = null;
    for (const p of People.waitingAt(i)) {
      // a doctor called to an emergency gets on whichever way the lift goes
      if (a !== 'none' && p.dir !== a && !p.emergency) continue;
      if (!Lift.canStopAt(L, p.to)) continue;
      if (Lift.walking(p)) { coming = coming || p; continue; }
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
      // a slow walker still on the way to the doors is left behind
      if (coming && Lift.load(L) + coming.size <= L.cap) {
        run.counters.leftBehind++;
        logEvent('leftBehind', { lift: L.n, floor: label, id: coming.id });
        GameEvents.emit('leftBehind', { lift: L, person: coming });
      }
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
    if (stop && !stop.auto && stop.boarded + stop.alighted === 0) {
      run.counters.nobodyStops++;
      // a stop for nobody at a floor only the prankster pressed
      if (L.prankFloors.has(stop.floor)) run.counters.prankStops++;
    }
    if (stop) L.prankFloors.delete(stop.floor);
    L.trip = null;
    // whoever was left behind presses again; a call still lit is heard again
    const pressed = {};
    for (const p of People.waitingAt(i)) if (!Building.isLit(i, p.dir) && Building.press(i, p.dir)) pressed[p.dir] = true;
    const h = run.hall[i];
    // (only to the other lifts when nobody waiting there can ride this one — they wait for a lift of another zone)
    const others = (dir) => !!L.zone && !People.waitingAt(i).some((p) => p.dir === dir && Lift.canStopAt(L, p.to));
    if (!run.bellBroken) for (const dir of ['up', 'down']) if (h[dir] && !pressed[dir]) VM.event('onCall', null, { floor: run.floors[i], direction: dir }, others(dir) ? L.n : 0);
    L.litSeen = { i, up: h.up ? h.upSeq : -1, down: h.down ? h.downSeq : -1 };
    logEvent('doorsClosed', { lift: L.n, floor: Lift.floor(L) });
    VM.event('onDoorsClose', L, {});
    GameEvents.emit('doorsClosed', { lift: L });
  }
};
