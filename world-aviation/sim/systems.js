'use strict';

// ============================================================
// World Aviation — aircraft systems, emergencies and the QRH
//
// Engines spool up with real-ish N1/N2 lag and the thrust follows
// N1, fuel burns per engine and can leak, hydraulics can fail, ice
// accretes in cloud and precipitation below freezing, and the cabin
// can depressurise. Emergencies are drawn per flight and interrupt
// it: the clock drops to 1x, the master caution lights, and a quick
// reference checklist (data/emergencies.js) has to be worked in time:
// each step with a real control (the thrust levers, anti-ice, the gear
// lever, the autopilot...) or, for the switches that exist only in the
// QRH, with Enter / the Go button. The checklist moves on by itself.
// ============================================================

const Systems = {
  flight: null,
  engines: [],
  rng: null,
  diff: null,
  queue: [],         // scheduled but not yet triggered
  firedIds: {},
  log: [],           // technical log entries for the debrief
  noEmergencies: false,
  responseFactor: 1, // from the CRM / Advanced Systems courses
  iceFactor: 1,
  hint: false,
  cabinAlt: 0,
  hydraulics: true,
  brakeFactor: 1,
  fire: false,
  warnings: {},
  checklist: null,   // {def, steps, stepIndex, timeLeft, limit, engine, okT, outcome}
  outcome: null,     // the last checklist's result for the screen: {title, text, ok, t, used, limit}
  checklistDone: [], // ids of emergencies handled correctly
  checklistFailed: [],

  init(flight, opts) {
    this.flight = flight;
    flight.systems = this;
    this.ac = flight.ac;
    this.rng = opts.rng;
    this.diff = opts.difficulty;
    this.noEmergencies = !!opts.noEmergencies;
    this.responseFactor = opts.responseFactor || 1;
    this.iceFactor = opts.iceFactor || 1;
    this.hint = !!opts.hint;
    this.engines = [];
    for (let i = 0; i < this.ac.engines; i++) {
      this.engines.push({
        i, running: false, n1: 0, n2: 0, egt: 15,
        fire: false, failed: false, bird: false,
        startPhase: 'off', startTimer: 0, shuttingDown: false
      });
    }
    this.queue = []; this.firedIds = {}; this.log = [];
    this.checklist = null; this.outcome = null;
    this.checklistDone = []; this.checklistFailed = [];
    this.fire = false;
    this.hydraulics = true; this.brakeFactor = 1;
    this.antiIce = false;
    this.depressurised = false;
    this.pressurised = true;
    this.cabinAlt = flight.world.elev;
    this.warnings = {};
    this.schedule();
    return this;
  },

  runningCount() {
    let n = 0;
    for (const e of this.engines) if (e.running && !e.failed) n++;
    return n;
  },
  // 0..1 share of the full thrust the engines give right now (follows N1)
  thrustFraction() {
    const idle = SIM.ENGINE_IDLE_N1;
    let sum = 0;
    for (const e of this.engines) {
      if (!e.running || e.failed) continue;
      sum += 0.04 + 0.96 * clamp((e.n1 - idle) / (0.97 - idle), 0, 1);
    }
    return sum / Math.max(1, this.engines.length);
  },

  // ---------- engine control ----------
  // the short start: the engines already turning at idle, nothing to start
  runEngines() {
    for (const e of this.engines) {
      if (e.failed) continue;
      e.running = true; e.startPhase = 'idle'; e.shuttingDown = false;
      e.n1 = SIM.ENGINE_IDLE_N1; e.n2 = 0.62; e.egt = 420;
    }
  },
  startEngines() {
    let started = 0;
    for (const e of this.engines) {
      if (e.running || e.failed || e.startPhase !== 'off') continue;
      e.startPhase = 'motoring';
      e.startTimer = -e.i * 2.5;                 // one after the other
      started++;
    }
    if (started) {
      this.flight.info(tr('Start: fuel boost on, ignition, starter engaged'));
      Audio2.cue('starter');
    }
    return started;
  },
  stopEngines() {
    for (const e of this.engines) {
      if (!e.running) continue;
      e.shuttingDown = true;
      e.startPhase = 'shutdown';
    }
  },

  // ---------- per frame ----------
  // dt: simulated seconds
  update(dt) {
    for (const e of this.engines) this.updateEngine(e, dt);
    this.updateIce(dt);
    this.updatePressurisation(dt);
    this.updateEvents(dt);
    this.updateWarnings();
  },

  updateEngine(e, dt) {
    const fl = this.flight, st = fl.st;
    const fuelOk = st.fuel > 0.5;
    const idle = SIM.ENGINE_IDLE_N1;
    if (e.startPhase === 'motoring') {
      e.startTimer += dt;
      if (e.startTimer < 0) return;
      e.n2 = approach(e.n2, 0.3, 0.07 * dt);
      e.egt = approach(e.egt, 40, 4 * dt);
      if (e.n2 >= 0.25 && fuelOk) {
        e.startPhase = 'lightoff'; e.startTimer = 0;
        Audio2.cue('lightoff');
        fl.info(tr('Engine {n}: light-off', { n: e.i + 1 }));
      }
    } else if (e.startPhase === 'lightoff') {
      e.startTimer += dt;
      e.n2 = approach(e.n2, 0.62, 0.12 * dt);
      e.egt = approach(e.egt, 560, 160 * dt);
      e.n1 = approach(e.n1, idle, 0.06 * dt);
      if (e.n1 >= idle - 0.005) {
        e.running = true; e.startPhase = 'idle';
        fl.info(tr('Engine {n} running', { n: e.i + 1 }));
        Audio2.cue('idle');
      } else if (e.startTimer > 20 || !fuelOk) {
        e.startPhase = 'off';
        fl.warn('START', tr('Engine {n} did not light off — check the fuel', { n: e.i + 1 }));
      }
    } else if (e.running) {
      if (e.shuttingDown) {
        e.n1 = approach(e.n1, 0, 0.08 * dt);
        e.n2 = approach(e.n2, 0, 0.08 * dt);
        e.egt = approach(e.egt, 60, 25 * dt);
        if (e.n1 < 0.03) { e.running = false; e.shuttingDown = false; e.startPhase = 'off'; e.n1 = 0; e.n2 = 0; }
      } else {
        let target = idle + st.throttle * (0.98 - idle);
        if (e.bird) target = Math.min(target, 0.7);
        // a jet spools up slowly from idle, a turboprop is quicker
        const rate = (fl.ac.engineType === 'jet' ? 0.22 : 0.4) * (0.4 + e.n1);
        e.n1 = approach(e.n1, target, rate * dt);
        e.n2 = approach(e.n2, 0.6 + (e.n1 - idle) * 0.5, rate * dt);
        e.egt = approach(e.egt, 420 + (e.n1 - idle) * 420 - (st.ias / KTS) * 0.1 + (e.bird ? 60 : 0), 60 * dt);
      }
    } else {
      e.n1 = approach(e.n1, 0, 0.1 * dt);
      e.n2 = approach(e.n2, 0, 0.08 * dt);
      e.egt = approach(e.egt, 15, 15 * dt);
    }
    if (e.fire) e.egt = approach(e.egt, 950, 40 * dt);
    if (!fuelOk && e.running) {
      // starved: the engine flames out in a second or two
      e.n1 = approach(e.n1, 0, 0.3 * dt);
      if (e.n1 < 0.1) { e.running = false; e.startPhase = 'off'; fl.warn('FLAMEOUT', tr('Engine {n} flameout — fuel exhausted', { n: e.i + 1 })); }
    }
  },

  updateIce(dt) {
    const fl = this.flight, e = fl.env, st = fl.st;
    const temp = e.temp - 6.5 * Math.max(0, st.pos.y - fl.world.elev) / 1000;
    const inCloud = st.pos.y > e.cloudBase && st.pos.y < e.cloudTop;
    const wet = inCloud || (e.precip !== 'none' && st.pos.y < e.cloudTop);
    const cold = temp > WEATHER.ICING_TEMP_MIN && temp < WEATHER.ICING_TEMP_MAX;
    const inIcing = (!st.onGround && wet && cold) || e.forcedIce;
    if (inIcing && !this.antiIce) {
      const rate = WEATHER.ICING_RATE * this.iceFactor * (fl.ac.engineType === 'prop' ? 1.3 : 1);
      e.iceAmount = clamp(e.iceAmount + rate * dt, 0, 1);
    } else {
      e.iceAmount = approach(e.iceAmount, 0, (this.antiIce ? 0.03 : 0.004) * dt);
    }
    e.icing = e.iceAmount > 0.08;
    if (inIcing && !this.antiIce && e.iceAmount > 0.15) fl.warn('ICE', tr('Ice building — engine anti-ice K'));
  },

  updatePressurisation(dt) {
    const fl = this.flight, st = fl.st;
    const target = Math.max(fl.world.elev, Math.min(st.pos.y * 0.3, 2400));
    if (this.depressurised) this.cabinAlt = approach(this.cabinAlt, st.pos.y, 300 * dt);
    else this.cabinAlt = approach(this.cabinAlt, target, 8 * dt);
    this.pressurised = this.cabinAlt < 3000;
  },

  // ---------- emergencies ----------
  schedule() {
    if (this.noEmergencies) return;
    const fl = this.flight;
    const pool = EMERGENCIES.filter((d) => !(d.cargoOnly && (!fl.contract || fl.contract.faction !== 'cargo')) &&
      !(d.retractGear && fl.ac.look && fl.ac.look.fixedGear));
    const d = this.diff;
    const count = d.emergencyOverlap >= 2 ? 2 : d.emergencyOverlap >= 1 ? (this.rng.chance(0.4) ? 2 : 1) : 1;
    const picked = [];
    let guard = 0;
    while (picked.length < count && guard++ < 40) {
      const def = this.rng.weighted(pool, (x) => x.weight);
      if (!picked.includes(def)) picked.push(def);
    }
    for (const def of picked) {
      const phase = this.rng.pick(def.phase);
      this.queue.push({ def, phase, when: this.rng.range(0.15, 0.85), delay: this.rng.range(8, 25), done: false });
    }
  },

  updateEvents(dt) {
    const fl = this.flight;
    if (this.noEmergencies) this.queue = [];
    // start the next scheduled event whose phase has come
    if (this.queue.length && !this.checklist) {
      const progress = fl.progress();
      for (const item of this.queue) {
        if (item.done || item.phase !== fl.phase) continue;
        let ready = fl.phaseTime > item.delay;
        if (item.phase === 'CRUISE' || item.phase === 'DESCENT') ready = ready && progress > item.when * 0.8;
        if (item.phase === 'APPROACH') ready = fl.distToRunwayNm() < 3 + item.when * 8;
        if (item.phase === 'TAKEOFF') ready = !fl.st.onGround && fl.altAgl() > 120;
        if (!ready) continue;
        this.trigger(item.def);
        item.done = true;
        break;
      }
    }
    // run the open checklist (the clock is real time: the trigger cut time acceleration)
    const c = this.checklist;
    if (c) {
      c.timeLeft -= dt;
      const step = c.steps[c.stepIndex];
      // a step worked with a control ticks by itself (and stays ticked, even if the autothrottle
      // then moves the levers), and the next one lights up a moment later
      if (step && !this.isSwitch(step) && (c.okT > 0 || this.stepMet(step))) {
        c.okT += dt;
        if (c.okT >= QRH.STEP_HOLD) { c.okT = 0; this.advance(); }
      } else c.okT = 0;
      if (this.checklist && this.checklist.timeLeft <= 0) this.escalate('out of time');
    }
  },

  trigger(def) {
    const fl = this.flight;
    if (this.firedIds[def.id]) return;
    this.firedIds[def.id] = true;
    const limit = def.limit * this.responseFactor * (this.diff.qrhTimeFactor || 1);
    const engine = this.applyTrigger(def);
    this.checklist = { def, steps: def.steps.slice(), stepIndex: 0, timeLeft: limit, limit, engine, okT: 0, outcome: null };
    this.outcome = null;
    Audio2.cue('caution');
    fl.warn(def.id.toUpperCase(), tr(def.title));
    // the interruption: drop the clock back to real time (it climbs back once the checklist is closed)
    const was = fl.cheatAccel ? SIM.TIME_ACCEL_STEPS.length - 1 : fl.timeAccelIndex;
    fl.timeAccelResume = Math.max(fl.timeAccelResume || 0, was); fl.resumeT = 0;
    fl.timeAccelIndex = 0; fl.cheatAccel = false;
    fl.env.timeAccel = 1;
  },

  pickEngine() {
    const live = this.engines.filter((e) => e.running && !e.failed);
    return live.length ? live[this.rng.int(0, live.length - 1)] : this.engines[0];
  },

  // what happens to the aeroplane; returns the index of the engine it happened to (or null)
  applyTrigger(def) {
    const fl = this.flight, st = fl.st;
    let eng = null;
    switch (def.id) {
      case 'eng_fire': eng = this.pickEngine(); eng.fire = true; this.fire = true; break;
      case 'eng_fail': eng = this.pickEngine(); eng.failed = true; eng.running = false; eng.startPhase = 'off'; break;
      case 'fuel_leak': st.leakRate = fl.ac.fuelCapKg * this.rng.range(0.4, 0.8); break;   // kg per hour
      case 'hydraulic': this.hydraulics = false; this.brakeFactor = 0.35; break;
      case 'depress': this.depressurised = true; break;
      case 'gear': st.gearFailed = true; st.gearSelected = false; if (st.gearTarget === 1 && st.gear < 1) st.gearTarget = st.gear; break;
      case 'nav': fl.navFailed = true; break;
      case 'bird': eng = this.pickEngine(); eng.bird = true; break;
      case 'icing': fl.env.forcedIce = true; this.antiIce = false; break;
      case 'windshear': fl.env.shearT = 14; break;
      case 'cargoshift': fl.cargoShift = true; break;
      case 'medical': fl.medical = true; break;
      case 'overweight': st.overweight = true; break;
      case 'overspeed': {
        // a gust: the speed jumps past Vne
        const k = (fl.ac.vne + 8) * KTS / Math.max(1, st.ias);
        if (k > 1) { st.vel.x *= k; st.vel.z *= k; }
        break;
      }
      default: break;
    }
    this.log.push({ t: fl.elapsed, text: def.title });
    return eng ? eng.i : null;
  },

  // a step that is a switch in the QRH (Enter / Go / a tap), not a control of the aeroplane
  isSwitch(step) { return step.kind === 'switch' || step.kind === 'setAlt' || step.kind === 'setAltBy'; },

  // a step's or a message's text with the engine number filled in (c: the checklist, or its outcome)
  qrhText(s, c) {
    c = c || this.checklist;
    const e = c && c.engine !== null && c.engine !== undefined ? c.engine + 1 : 1;
    return String(s).replace(/\{e\}/g, e);
  },

  // has the current step's control been worked?
  stepMet(step) {
    const fl = this.flight, st = fl.st;
    switch (step.kind) {
      case 'idle': return st.throttle <= QRH.IDLE_MAX;
      case 'thrustMax': return st.throttle <= step.value + 0.005;
      case 'thrustMin': return st.throttle >= step.value - 0.005;
      case 'antiIce': return this.antiIce;
      case 'gearDown': return st.gearTarget >= 0.5 || !!st.gearSelected;
      case 'spoiler': return st.spoiler > 0.5;
      case 'apOff': return !fl.ap.on;
      case 'parkBrake': return !!st.parkingBrake;
      case 'climb': return st.vel.y / FT * 60 >= QRH.CLIMB_FPM;
      case 'slowVne': return st.ias / KTS < fl.ac.vne + step.value;
      default: return false;
    }
  },

  // Enter / the Go button / a tap on the step works the current switch. Returns true when it
  // did, the step itself when that step is done with a control instead (the screen says which).
  confirm() {
    const c = this.checklist;
    const step = c && c.steps[c.stepIndex];
    if (!step) return false;
    const fl = this.flight;
    if (!this.isSwitch(step)) { Audio2.cue('bad'); return step; }
    if (step.kind !== 'switch') {
      const ft = step.kind === 'setAlt' ? step.value : Math.round((fl.st.pos.y / FT + step.value) / 100) * 100;
      const floor = Math.round((fl.arrival.elev + 600) / FT / 100) * 100;
      fl.ap.alt = Math.max(floor, Math.min(fl.ap.alt, ft));
      fl.ap.altSet = true;            // chosen for the emergency: <kbd>N</kbd> goes back to the programme
      if (!fl.ap.on && !fl.st.onGround) { fl.ap.on = true; fl.ap.vsI = 0; }
      fl.info(tr('Autopilot ALT {alt} ft — descending', { alt: fmtAltFt(fl.ap.alt) }));
    }
    Audio2.cue('click');
    this.advance();
    return true;
  },

  // the current step is done: its effect, then the next step (or the end of the checklist)
  advance() {
    const c = this.checklist;
    const step = c.steps[c.stepIndex];
    const fl = this.flight, st = fl.st;
    const eng = c.engine !== null && c.engine !== undefined ? this.engines[c.engine] : null;
    if (step.effect === 'bottle' && !c.bottle2 && this.rng.chance(QRH.BOTTLE2_CHANCE)) {
      // the fire is still burning: one more step
      c.bottle2 = true;
      c.steps.splice(c.stepIndex + 1, 0, { kind: 'switch', text: 'FIRE STILL ON — fire bottle 2, DISCHARGE',
        why: 'The first bottle was not enough. The second one is the last.' });
      Audio2.cue('caution');
    } else if (step.effect === 'relight' && eng) {
      if (this.rng.chance(QRH.RELIGHT_CHANCE)) {
        eng.failed = false; eng.startPhase = 'motoring'; eng.startTimer = 0; eng.n2 = Math.max(eng.n2, 0.15);
        c.outcome = 'Relight! Engine {e} is starting again — watch its N1 come up.';
      }
    } else if (step.effect === 'freefall') {
      st.gearFailed = false; st.gearTarget = 1;
      Audio2.cue('lever');
    }
    c.stepIndex++;
    if (c.stepIndex >= c.steps.length) this.finishChecklist();
  },

  // Effects that fire when a checklist is completed
  finishChecklist() {
    const c = this.checklist;
    this.checklist = null;
    const def = c.def;
    const fl = this.flight, st = fl.st;
    switch (def.id) {
      case 'eng_fire': {
        const e = this.engines.find((x) => x.fire);
        if (e) { e.fire = false; e.running = false; e.failed = true; e.n1 = 0; e.n2 = 0; }
        this.fire = false;
        this.log.push({ t: fl.elapsed, text: 'Engine ' + (e ? e.i + 1 : 1) + ' inflight shutdown complete' });
        break;
      }
      case 'fuel_leak': st.leakRate = 0; break;
      case 'depress': this.depressurised = false; break;
      case 'hydraulic': this.brakeFactor = 0.6; break;
      case 'gear': st.gearFailed = false; st.gearTarget = 1; st.gearSelected = false; break;
      case 'icing': fl.env.forcedIce = false; this.antiIce = true; break;
      case 'nav': fl.navFailed = false; break;
      case 'medical': fl.medicalResolved = true; break;
      case 'cargoshift': fl.cargoShift = false; break;
      case 'overweight': st.overweight = false; break;
      default: break;
    }
    this.checklistDone.push(def.id);
    const used = Math.max(1, Math.round(c.limit - c.timeLeft));
    // the outcome keeps the English text and the engine: the HUD shows it in the game's language
    this.outcome = { title: def.title, text: c.outcome || def.done, engine: c.engine, ok: true,
      t: fl.realElapsed, used, limit: Math.round(c.limit) };
    fl.info(tr('{title} — checklist complete in {s} s', { title: tr(def.title), s: used }));
    Audio2.cue('resolved');
  },

  escalate(reason) {
    const c = this.checklist;
    if (!c) return;
    const def = c.def;
    this.checklist = null;
    this.checklistFailed.push(def.id);
    const fl = this.flight, st = fl.st;
    const dmg = (Career.difficulty && Career.difficulty.damageFactor) || 1;
    if (def.penalty) {
      if (def.penalty.damage) st.damage = clamp(st.damage + def.penalty.damage * dmg, 0, 1);
      if (def.penalty.fuel) st.fuel *= (1 - def.penalty.fuel);
      if (def.penalty.penaltyRep) fl.pendingRepPenalty = (fl.pendingRepPenalty || 0) + def.penalty.penaltyRep;
      if (def.penalty.moneyFactor) fl.moneyFactor = (fl.moneyFactor || 1) * (1 + def.penalty.moneyFactor);
    }
    switch (def.id) {
      case 'eng_fire': {
        const e = this.engines.find((x) => x.fire) || this.engines[0];
        e.running = false; e.failed = true; e.fire = false; this.fire = false;
        break;
      }
      case 'fuel_leak': st.leakRate *= 0.5; break;
      case 'gear': st.gearFailed = false; st.gearTarget = 1; st.gear = 1; st.gearSelected = false; st.damage = clamp(st.damage + 0.1, 0, 1); break;
      case 'icing': fl.env.forcedIce = false; this.antiIce = true; break;
      case 'nav': fl.navFailed = false; break;
      case 'bird': { const e = this.engines.find((x) => x.bird); if (e) { e.running = false; e.failed = true; } break; }
      case 'medical': fl.medicalResolved = false; break;
      case 'depress': this.depressurised = false; break;
      default: break;
    }
    fl.warn('QRH', tr(def.escTitle || def.title) + ' — ' + tr(reason));
    this.log.push({ t: fl.elapsed, text: def.escTitle || def.title });
    this.outcome = { title: def.escTitle || def.title, text: def.esc, engine: c.engine, ok: false, t: fl.realElapsed };
    Audio2.cue('warning');
  },

  updateWarnings() {
    const fl = this.flight, st = fl.st;
    const w = this.warnings = {};
    if (this.checklist) w[this.checklist.def.id] = true;
    if (this.fire) w.fire = true;
    if (st.leakRate > 0) w.fuelLeak = true;
    if (!this.hydraulics) w.hydraulic = true;
    if (fl.env.iceAmount > 0.08) w.ice = true;
    if (!this.pressurised) w.cabin = true;
    if (st.stallWarn) w.stall = true;
    if (this.engines.some((e) => e.failed || e.fire || e.bird || (e.startPhase === 'off' && fl.phase !== 'GATE' && fl.phase !== 'PUSHBACK' && fl.phase !== 'ENGINE_START' && fl.phase !== 'SHUTDOWN' && fl.phase !== 'PARKED'))) w.engine = true;
    if (st.fuel < this.ac.fuelCapKg * 0.06) w.fuelLow = true;
    if (st.damage > 0.15) w.damage = true;
    if (st.gearFailed) w.gear = true;
    this.anyWarning = Object.keys(w).length > 0;
  },

  // ---------- start / stop ----------
  get started() { return this.engines.some((e) => e.running || e.startPhase === 'motoring' || e.startPhase === 'lightoff'); },
  get allStopped() { return this.engines.every((e) => !e.running && e.startPhase !== 'shutdown'); }
};
