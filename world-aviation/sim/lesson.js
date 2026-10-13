'use strict';

// ============================================================
// World Aviation — the flight school's lesson under way: the
// lesson's flight (its contract, its calm weather, where it starts),
// its steps (data/lessons.js) ticked off as the flight does them,
// and the instructor's hands on the controls — the help a beginner
// gets so that a lesson ends well almost every time:
//   envelope  the nose and the bank kept within SCHOOL's limits, and
//             never into the stall warning (the stick is softened); in
//             the last 60 ft no climbing away from the runway and a
//             sink too fast for the gear caught (flareGuard);
//   ground    on the runway, the stick left alone, the nose held on
//             the centreline (the take-off roll and the rollout);
//   lateral   in the air, with the stick left alone, the wings held on
//             the runway's centreline (the departure's climbing out,
//             the arrival's on the final);
//   apFloor   the autopilot flies the glide path down to
//             SCHOOL.AP_FLOOR_FT instead of the decision height;
//   flare     the instructor flares from SCHOOL.FLARE_FT, idle.
// Every lesson has the envelope and the ground; its own may add more
// (the light aircraft's lateral), and each failed try adds more (the
// second: lateral and apFloor; the third: flare too). Used by
// game.js (each frame: shape the stick, then update), shown by
// ui/coach.js. Logic only: no drawing, no DOM, no sound.
// ============================================================

// the steps done with these move the lesson on past the steps before them that were never done
const LESSON_MILESTONES = ['atHold', 'taxiing', 'cleared', 'airborne', 'climbed', 'approach', 'touchdown', 'slowed', 'parked'];
const LESSON_PHASES = ['GATE', 'PUSHBACK', 'ENGINE_START', 'TAXI_OUT', 'HOLD_SHORT', 'TAKEOFF', 'CLIMB', 'CRUISE', 'DESCENT', 'APPROACH', 'ROLLOUT', 'EXIT', 'SHUTDOWN', 'PARKED'];

const Lesson = {
  cur: null,       // { def, attempt, i, okT, lookT, done: [state per step], t, passed }
  tries: {},       // the tries at each lesson this session (the help grows with them)

  byId(id) { return LESSONS.find((l) => l.id === id) || null; },
  stage(def) { return SCHOOL_STAGES.find((s) => s.id === def.stage); },
  aircraft(def) { return AIRCRAFT.find((a) => a.id === this.stage(def).aircraft); },
  // the lesson's number in the school (1 …)
  number(def) { return LESSONS.indexOf(def) + 1; },

  // ---------- the lesson's flight ----------
  // A contract for the simulator: no client, no pay, a light load and fuel for the leg, the
  // passenger stands at both ends (no passengers on board: no cabin), so the career is untouched
  contract(def) {
    const ac = this.aircraft(def);
    const from = World.byId[def.from], to = World.byId[def.to];
    const nm = geoDistanceNm(from.lat, from.lon, to.lat, to.lon) * WORLD.SCALE;
    const hours = nm / (ac.cruiseTas * 0.85) + 0.25;
    const fuelKg = Math.round(ac.fuelFlowCruise * ac.engines * hours);
    const blockFuel = Math.round(clamp(fuelKg * 1.5, ac.fuelCapKg * 0.15, ac.fuelCapKg * 0.6));
    const rng = makeRng(hashStr('school/' + def.id));
    return {
      id: 'school-' + def.id, lesson: def.id, client: tr('Flight school'), faction: 'pax', type: 'pax', urgent: false,
      ...World.pickGates(from, to, rng, World.zoneFor({ type: 'pax', faction: 'pax', aircraftId: ac.id })),
      fromId: from.id, toId: to.id, pax: 0, payloadKg: Math.round(ac.payloadKg * 0.35 / 10) * 10, payloadLabel: PAYLOAD.pax.label,
      distanceNm: Math.round(nm), blockMin: Math.round(hours * 60), pay: 0, fuelKg, blockFuel, repGain: 0, difficulty: 1,
      aircraftId: ac.id
    };
  },
  // the weather of a lesson: calm, clear, a day without rain (setup.weather from Career.flightSetup)
  calm(setup) {
    const w = setup.weather;
    for (const k of ['dep', 'arr']) {
      const a = k === 'dep' ? setup.from : setup.to;
      Object.assign(w[k], { dir: a.hdgDeg || 0, speed: 0, gust: 0, turbulence: 0, vis: 30000, cloudBase: 2400, cloudTop: 2700,
        precip: 'none', snow: false, lowCloud: false, temp: 15, qnh: 1013 });
    }
    Object.assign(w.cruise, { speed: Math.min(w.cruise.speed || 0, 12), turbulence: 0 });
    setup.timeOfDay = 'day';
  },

  // ---------- a lesson under way ----------
  start(def, fl) {
    const attempt = (this.tries[def.id] || 0) + 1;
    this.tries[def.id] = attempt;
    this.cur = { def, attempt, i: 0, okT: 0, lookT: 0, t: 0, passed: false, state: def.steps.map(() => '') };
    fl.lesson = def.id;
    fl.assist = this.assist();
    return this.cur;
  },
  stop() { this.cur = null; },
  // a lesson passed starts the count of its tries again
  passed(def) { this.tries[def.id] = 0; },

  // the help of this try: the lesson's own, more after each failed one
  assist() {
    const L = this.cur;
    const a = Object.assign({ envelope: true, ground: true }, L.def.assist || {});
    if (L.attempt >= 2) { a.lateral = true; a.ground = true; a.apFloorFt = SCHOOL.AP_FLOOR_FT; }
    if (L.attempt >= 3) a.flare = true;
    return a;
  },
  // what the next try adds (ui/school.js says it on a failed lesson)
  moreHelp(def) {
    const n = (this.tries[def.id] || 0) + 1;
    return n === 2 ? 'second' : n >= 3 ? 'third' : '';
  },

  step() { const L = this.cur; return L && L.def.steps[L.i]; },

  // Each frame (real seconds): the current step is done, a later one is done (ticked where it
  // is; a milestone passes the steps before it), a look step's time is up. Returns 'passed' once
  // every step is done or passed.
  update(game, dtReal) {
    const L = this.cur;
    if (!L || L.passed) return '';
    const steps = L.def.steps;
    L.t += dtReal;
    const ctx = { game, fl: game.flight, sys: game.systems, L };
    // later steps done already: ticked; a milestone passes everything before it
    for (let j = L.i + 1; j < steps.length; j++) {
      const s = steps[j];
      if (s.look || L.state[j] === 'done' || !this.met(s, ctx)) continue;
      L.state[j] = 'done';
      if (LESSON_MILESTONES.indexOf(s.done) >= 0) {
        for (let k = L.i; k < j; k++) if (!L.state[k]) L.state[k] = 'passed';
      }
    }
    while (L.i < steps.length && L.state[L.i] && L.okT === 0) { L.i++; L.lookT = 0; }
    if (L.i >= steps.length) { L.passed = true; return 'passed'; }
    const s = steps[L.i];
    // the whole flight's icing: a little while after its step lights up, in the climb or the cruise
    if (s.done === 'iceDealt') this.icing(ctx, dtReal);
    let ok;
    if (s.look) {
      L.lookT += dtReal;
      ok = L.lookT >= SCHOOL.LOOK_S || steps.slice(L.i + 1).some((n, k) => L.state[L.i + 1 + k] === 'done');
    } else ok = this.met(s, ctx);
    if (ok || L.okT > 0) {
      L.okT += dtReal;
      if (L.okT >= (s.look ? 0 : SCHOOL.STEP_HOLD_S)) {
        L.state[L.i] = 'done'; L.okT = 0; L.i++; L.lookT = 0;
        if (L.i >= steps.length) { L.passed = true; return 'passed'; }
      }
    }
    return '';
  },
  met(s, ctx) { const f = this.DONE[s.done]; return !!(f && f(ctx)); },

  // the icing of the whole flight (data/emergencies.js 'icing'), started by its step: in the climb or
  // the cruise; already past them, the step is passed
  icing(ctx, dtReal) {
    const { fl, sys, L } = ctx;
    if (sys.firedIds.icing || sys.checklist) return;
    if (fl.phase !== 'CLIMB' && fl.phase !== 'CRUISE') { L.state[L.i] = 'passed'; return; }
    // (simulated seconds: with the time sped up it comes at once)
    L.iceT = (L.iceT || 0) + dtReal * fl.env.timeAccel;
    if (L.iceT < SCHOOL.ICING_AFTER_S) return;
    const def = EMERGENCIES.find((e) => e.id === 'icing');
    if (def) sys.trigger(def);
  },

  // ---------- the steps' tests ----------
  DONE: {
    parkOff: ({ fl }) => !fl.st.parkingBrake,
    parkOn: ({ fl }) => fl.phase === 'HOLD_SHORT' && fl.st.parkingBrake,
    rolling: ({ fl }) => !fl.st.parkingBrake && fl.groundSpeedKt() > 3,
    atHold: ({ fl }) => Lesson.phaseAt(fl, 'HOLD_SHORT'),
    stopped: ({ fl }) => fl.phase === 'HOLD_SHORT' && fl.groundSpeedKt() < 1,
    takeoffFlaps: ({ fl, game }) => fl.st.flapsTarget >= game.takeoffFlaps() || fl.st.wasAirborne,
    linedUp: ({ fl }) => fl.st.wasAirborne || (fl.phase === 'TAKEOFF' && (Lesson.lined(fl) || fl.groundSpeedKt() > 40)),
    fullPower: ({ fl }) => fl.st.wasAirborne || (fl.phase === 'TAKEOFF' && fl.st.throttle > 0.85),
    nearVr: ({ fl }) => fl.st.wasAirborne || fl.st.ias / KTS > fl.vr() - 5,
    airborne: ({ fl }) => fl.st.wasAirborne,
    gearUp: ({ fl }) => fl.st.wasAirborne && fl.st.gearTarget < 1,
    climbed: ({ fl }) => fl.st.wasAirborne && !fl.st.onGround && fl.altAgl() > 1450 * FT,
    pushedBack: ({ fl }) => fl.phase !== 'GATE',
    starting: ({ sys }) => !!sys.started,
    running: ({ fl, sys }) => sys.runningCount() === fl.ac.engines,
    taxiing: ({ fl }) => Lesson.phaseAt(fl, 'TAXI_OUT'),
    cleared: ({ fl }) => Lesson.phaseAt(fl, 'TAKEOFF'),
    apOn: ({ fl }) => fl.ap.on && !fl.st.onGround,
    flapsUp: ({ fl }) => fl.st.wasAirborne && fl.st.flapsTarget === 0 && fl.st.gearTarget < 1,
    timeFast: ({ fl }) => fl.env.timeAccel >= 2,
    timeFaster: ({ fl }) => fl.env.timeAccel >= 8,
    iceDealt: ({ sys }) => !!sys.firedIds.icing && !sys.checklist,
    approach: ({ fl }) => Lesson.phaseAt(fl, 'APPROACH'),
    flaps3: ({ fl }) => fl.st.flapsTarget >= 3,
    flapsFull: ({ fl }) => fl.st.flapsTarget >= fl.ac.flaps.length,
    gearDown: ({ fl }) => fl.st.gearTarget >= 1,
    landingConfig: ({ fl }) => fl.st.gearTarget >= 1 && fl.st.flapsTarget >= fl.ac.flaps.length - 1,
    apOff: ({ fl }) => !!fl.landed || (fl.phase === 'APPROACH' && !fl.ap.on && fl.altAgl() < 400 * FT),
    touchdown: ({ fl }) => !!fl.landed,
    slowed: ({ fl }) => !!fl.landed && fl.st.onGround && fl.groundSpeedKt() < SIM.ROLLOUT_EXIT_KT,
    spoilerOut: ({ fl }) => !!fl.landed && fl.st.spoiler > 0,
    copilotOn: ({ fl }) => !!(fl.copilot && fl.copilot.on),
    parked: ({ fl }) => fl.phase === 'SHUTDOWN' || fl.phase === 'PARKED'
  },
  // the phase is p or one after it
  phaseAt(fl, p) { return LESSON_PHASES.indexOf(fl.phase) >= LESSON_PHASES.indexOf(p); },
  // lined up on the runway (as the take-off prompt has it)
  lined(fl) {
    const a = fl.world, st = fl.st, loc = World.local(a, st.pos.x, st.pos.z);
    return Math.abs(loc.across) < SIM.LINEUP_ACROSS_M && Math.abs(wrapDeg(fl.headingDeg() - a.hdgDeg)) < SIM.LINEUP_HDG_DEG;
  },

  // the numbers in the steps' texts
  params(game) {
    const fl = game.flight;
    const help = fl.assist || {};
    return { vr: Math.round(fl.vr()), vref: Math.round(fl.vRef()), to: game.takeoffFlaps(), full: fl.ac.flaps.length,
      floor: help.apFloorFt || SIM.DECISION_HEIGHT_FT, rwy: fl.arrival.rwyName };
  },

  // ---------- the instructor's hands ----------
  // The stick of this frame (Input.axes) shaped by the help of this try: returns the axes to fly.
  shape(ax, fl, dt) {
    const L = this.cur, a = fl.assist;
    if (!L || !a) return ax;
    ax = Object.assign({}, ax);
    const st = fl.st, S = SCHOOL;
    if (fl.ap.on) return ax;
    if (!st.onGround) {
      const here = fl.phase === 'APPROACH' ? fl.arrival : fl.phase === 'TAKEOFF' || fl.phase === 'CLIMB' ? fl.world : null;
      if (a.lateral && here && Math.abs(ax.roll) < S.HOLD_INPUT) ax.roll = this.holdTrack(fl, here);
      if (a.flare && fl.phase === 'APPROACH' && fl.altAgl() < S.FLARE_FT * FT && fl.distToRunwayNm() < 1.5) {
        // the instructor's flare: the sink rate brought down with the height, the thrust to idle
        const h = fl.altAgl();
        const vsT = -Math.max(S.FLARE_SINK_FPM * FPM, h * 0.25);
        ax.pitch = clamp((vsT - st.vel.y) * 0.5 - st.pitchRate * 2, -1, 1);
        if (h < 25 * FT) fl.setThrottle(0);
      }
      if (a.envelope) this.envelope(ax, st);
      if (a.envelope && fl.phase === 'APPROACH' && fl.altAgl() < S.FLARE_ZONE_FT * FT) this.flareGuard(ax, fl);
    } else if (a.ground && !(fl.copilot && fl.copilot.on)) {
      if (Math.abs(ax.roll) < S.HOLD_INPUT && Math.abs(ax.rudder) < S.HOLD_INPUT) {
        const steer = this.holdCentreline(fl);
        if (steer !== null) ax.roll = steer;
      }
      // full power before lining up would run off the side of the runway: the thrust held back
      // (and once rolling faster than a turn onto the runway, to idle; lined up once, it is the pilot's)
      const cap = fl.groundSpeedKt() < 20 ? S.LINEUP_THRUST : 0;
      if (fl.phase === 'TAKEOFF' && !L.linedUp && this.lined(fl)) L.linedUp = true;
      if (fl.phase === 'TAKEOFF' && !st.wasAirborne && !L.linedUp && st.throttle > cap) {
        fl.setThrottle(cap);
        fl.warn('SCHOOL', tr('Instructor: line up on the centreline first — I hold the thrust back'));
      }
    }
    return ax;
  },
  // nose and bank within the limits, never into the stall warning (the stick softened near them)
  envelope(ax, st) {
    const S = SCHOOL, pitch = st.pitch * RAD, bank = st.roll * RAD;
    if (ax.pitch > 0) ax.pitch *= clamp((S.PITCH_UP_MAX_DEG - pitch) / 3, 0, 1);
    if (pitch > S.PITCH_UP_MAX_DEG + 1) ax.pitch = Math.min(ax.pitch, -0.25);
    if (ax.pitch < 0) ax.pitch *= clamp((pitch + S.PITCH_DOWN_MAX_DEG) / 2, 0, 1);
    if (pitch < -S.PITCH_DOWN_MAX_DEG - 1) ax.pitch = Math.max(ax.pitch, 0.25);
    if (st.stallWarn || st.alpha * RAD > SIM.STALL_WARN_AOA_DEG - 1.5) ax.pitch = Math.min(ax.pitch, -0.3);
    if (ax.roll * bank > 0) ax.roll *= clamp((S.BANK_MAX_DEG - Math.abs(bank)) / 5, 0, 1);
    if (Math.abs(bank) > S.BANK_MAX_DEG + 2) ax.roll = -Math.sign(bank) * 0.4;
  },
  // The last few feet: a pull that would make the aeroplane climb away (and then drop, slow, from
  // high up) is held back, the nose no higher than a flare's, and a sink still too fast in the
  // last 30 ft is caught — the instructor's hands; the beginner still flares
  flareGuard(ax, fl) {
    const S = SCHOOL, st = fl.st, fpm = st.vel.y / FPM;
    if (st.pitch * RAD > S.FLARE_PITCH_MAX_DEG && ax.pitch > 0) ax.pitch = 0;
    if (fpm > 50) ax.pitch = Math.min(ax.pitch, -clamp(fpm / 400, 0.2, 1));
    if (fpm < -S.CATCH_FPM && fl.altAgl() < 30 * FT) ax.pitch = Math.max(ax.pitch, clamp(0.4 + (-fpm - S.CATCH_FPM) / 300, 0.4, 1));
  },
  // the wings flown onto the runway's centreline (its extension in the air): a track towards it,
  // a bank towards that track — the stick the instructor holds
  holdTrack(fl, a) {
    const S = SCHOOL, st = fl.st;
    const loc = World.local(a, st.pos.x, st.pos.z);
    const want = a.hdgDeg - clamp(loc.across * S.LAT_GAIN, -S.LAT_MAX_DEG, S.LAT_MAX_DEG);
    const err = wrapDeg(want - fl.trackDeg());
    const bankT = clamp(err * S.LAT_BANK_PER_DEG, -S.BANK_MAX_DEG / 2, S.BANK_MAX_DEG / 2) * DEG;
    return clamp((bankT - st.roll) * 2.2 - st.rollRate * 0.8, -1, 1);
  },
  // on the runway, fast enough and lined up: the nosewheel steered onto the centreline (null: not now)
  holdCentreline(fl) {
    const S = SCHOOL, st = fl.st, a = fl.nearestApt();
    const loc = World.local(a, st.pos.x, st.pos.z);
    const off = wrapDeg(fl.headingDeg() - a.hdgDeg);
    if (Math.abs(loc.across) > 25 || Math.abs(loc.t) > a.half + 30 || Math.abs(off) > 15 || fl.groundSpeedKt() < 12) return null;
    const want = -clamp(loc.across * S.GROUND_GAIN, -4, 4);
    return clamp((want - off) * 0.12 - st.yawRate * RAD * 0.25, -1, 1);
  }
};
