'use strict';

// ============================================================
// World Aviation — flight dynamics and ground handling
//
// A light six-degree-of-freedom model: real lift, drag, thrust
// and weight, angles of attack and sideslip, a stall break with
// a real recovery, propellers that lose static thrust with speed,
// density that falls with altitude, wind, gusts and turbulence,
// weight that changes everything, and a ground model with tyre
// friction, braking, nosewheel steering and surface detection.
//
// Attitude is kept as Euler angles (heading, pitch, roll) and
// driven by body rates, so pulling in a bank turns the aeroplane.
// The pitch axis has static stability towards a trim angle of
// attack, which keeps it flyable without being a spreadsheet.
//
// World axes: x = east, y = up, z = south; a heading of 0 is north.
// ============================================================

// Size of an aeroplane, metres: its real length, span and fuselage diameter, and how
// high the centre of the fuselage (the model's origin) sits above the ground on its wheels
function aircraftDims(ac) {
  const d = ac.dims;
  const r = d.fus / 2;
  return { len: d.len, span: d.span, fus: d.fus, radius: r, gearH: r + 0.5 + d.fus * 0.22 };
}

const Flight = {
  ac: null,             // aircraft definition from AIRCRAFT
  st: null,             // live state
  phase: 'GATE',
  phaseTime: 0,
  env: null,            // weather, wind, time acceleration
  world: null,          // departure airport
  arrival: null,        // destination airport
  contract: null,
  systems: null,        // Systems, for engine thrust
  route: null,          // taxi guidance route (array of nodes)
  ap: null,
  events: [],           // messages for the HUD
  timeAccelIndex: 0,
  elapsed: 0,           // flight time, simulated seconds
  realElapsed: 0,       // flight time, real seconds
  landed: null,         // touchdown record
  failure: null,        // set when the flight is lost

  // ---------- setup ----------
  init(opts) {
    const ac = opts.aircraft;
    this.ac = ac;
    this.dims = aircraftDims(ac);
    this.world = opts.from;
    this.arrival = opts.to;
    this.contract = opts.contract;
    this.systems = opts.systems || null;
    this.st = {
      pos: { x: 0, y: this.world.elev, z: 0 },
      vel: { x: 0, y: 0, z: 0 },
      hdg: this.world.hdg, pitch: 0, roll: 0,
      rollRate: 0, pitchRate: 0, yawRate: 0, turnRate: 0, trimAlpha: 3.2 * DEG,
      elevator: 0, aileron: 0, rudder: 0, steer: 0, throttle: 0,
      flaps: 0, flapsTarget: 0,
      gear: 1, gearTarget: 1,
      spoiler: 0, brakes: 0, brakeInput: 0, parkingBrake: true,
      onGround: true, wasAirborne: false,
      alpha: 0, beta: 0, ias: 0, tas: 0, vs: 0, gLoad: 1,
      fuel: 0, fuelFlow: 0, thrust: 0,
      gearH: this.dims.gearH, damage: 0, leakRate: 0,
      surface: 'apron', onPavement: true,
      axes: null
    };
    this.env = {
      wind: { x: 0, z: 0 }, turb: 0,
      timeAccel: 1, qnh: 1013, temp: 10, vis: 25000, cloudBase: 900, cloudTop: 3000,
      precip: 'none', icing: false, iceAmount: 0, forcedIce: false, shearT: 0,
      surfaceWind: { dir: 240, speed: 6 }, altWind: { dir: 250, speed: 40 }
    };
    this.events = [];
    this.track = [];                 // the flown track for the map: {x, z, air}
    this.landed = null;
    this.failure = null;
    this.elapsed = 0;
    this.realElapsed = 0;
    this.simTime = 0;
    this.acc = 0;
    this.timeAccelIndex = 0;
    this.timeAccelResume = 0;        // the step an emergency cut the time from, to climb back to
    this.resumeT = 0;
    this.cheatAccel = false;
    this.guidance = null;
    this.taxi = null;                // the taxi speed and its limit (sim/taxilimit.js)
    this.copilot = null;             // the first officer taxiing in (sim/copilot.js)
    this.followMe = false;           // a FOLLOW ME car leads the taxi in (a first visit; render/followme3d.js)
    this.navFailed = false; this.cargoShift = false; this.medical = false;
    this.meet = [];                  // who waits at the arrival stand: 'ambulance', 'fire', 'police' (Systems.finishChecklist)
    this.moneyFactor = 1; this.pendingRepPenalty = 0; this.noClearance = false; this.taxiOverspeed = 0;
    this.warnedBank = false;
    this.locCaptured = false; this.overRunway = false;
    this.ap = {
      on: false, nav: true, gs: false,
      alt: Math.round((this.world.elev + 3000) / FT / 100) * 100,     // feet
      hdg: this.world.hdgDeg, vsI: 0,
      altSet: false     // the pilot (or a checklist) chose the altitude: engaging keeps it
    };
    this.startGate = opts.gate || this.world.gates[0];
    // the short start: at the holding point, the engines running (Game), brakes off, cleared for take-off
    if (opts.skipPushback) { this.placeAtHold(); this.st.parkingBrake = false; this.setPhase('TAKEOFF'); }
    else { this.placeAtGate(this.startGate); this.setPhase('GATE'); }
    this.st.fuel = opts.blockFuel || ac.fuelCapKg * 0.75;
    this.updateAxes();
    return this;
  },

  placeAtGate(gate) {
    const a = this.world;
    this.st.pos.x = gate.standX; this.st.pos.z = gate.standZ;
    this.st.pos.y = a.elev + this.st.gearH;
    this.st.hdg = gate.parkHdg * DEG;
    this.route = World.findRoute(a, gate.laneNode, a.nodes.hold);
  },
  placeAtHold() {
    const a = this.world;
    const n = a.nodes.hold;
    this.st.pos.x = n.x; this.st.pos.z = n.z;
    this.st.pos.y = a.elev + this.st.gearH;
    this.st.hdg = wrapRad(a.hdg - Math.PI / 2);          // facing the runway
    this.route = [n];
  },

  setPhase(p) {
    this.phase = p;
    this.phaseTime = 0;
  },

  // ---------- controls ----------
  setThrottle(t) { this.st.throttle = clamp(t, 0, 1); },
  // the levers always move: out too fast, the overspeed warnings (and the damage) follow
  setFlaps(n) {
    this.st.flapsTarget = clamp(Math.round(n), 0, this.ac.flaps.length);
  },
  setGear(down) {
    const st = this.st;
    if (!down && st.onGround) { this.warn('GEAR', tr('Gear lever locked — weight on wheels')); this.gearReject = 'ground'; return; }
    if (down && st.gearFailed) { st.gearSelected = true; this.warn('GEAR', tr('Gear will not extend — work the checklist')); this.gearReject = 'failed'; return; }
    st.gearTarget = down ? 1 : 0;
  },
  // the pilot's spoiler lever (from then on it is the pilot's, not the autopilot's)
  toggleSpoiler() { this.st.spoiler = this.st.spoiler > 0.5 ? 0 : 1; if (this.ap) this.ap.spoiler = false; },

  warn(id, text) {
    if (this.events.some((e) => e.id === id && this.realElapsed - e.t < 6)) return;
    this.events.push({ id, text, t: this.realElapsed });
    this.recent = (this.recent || []).filter((e) => this.realElapsed - e.t < 6);
    if (!this.recent.some((e) => e.id === id)) Audio2.cue('warning');
    this.recent.push({ id, t: this.realElapsed });
  },
  // topic: a newer message on the same topic ('AP', 'TIME') replaces the one on the screen
  info(text, topic) { this.events.push({ id: 'info', text, topic, t: this.realElapsed }); },

  // ---------- derived values ----------
  // the surface under the aeroplane: the ground, or the water (not the sea bed under it)
  groundHeight() { return Terrain.surfaceAt(this.st.pos.x, this.st.pos.z); },
  altAgl() { return this.st.pos.y - this.st.gearH - this.groundHeight(); },
  density(alt) { return SIM.RHO_SL * Math.pow(1 - 2.25577e-5 * Math.max(0, alt), 4.2559); },
  weight() {
    const load = this.contract ? this.contract.payloadKg : 0;
    return this.ac.emptyKg + load + this.st.fuel;
  },
  headingDeg() { return (this.st.hdg * RAD + 360) % 360; },
  trackDeg() {
    const v = this.st.vel;
    if (Math.hypot(v.x, v.z) < 0.5) return this.headingDeg();
    return bearingDeg(0, 0, v.x, v.z);
  },
  groundSpeedKt() { return Math.hypot(this.st.vel.x, this.st.vel.z) / KTS; },
  flapCl() { const f = this.ac.flaps[Math.round(this.st.flaps) - 1]; return f ? f.cl : 0; },
  clMax() {
    // clean maximum lift plus whatever the flaps add, less what the ice takes away
    const st = this.st, ac = this.ac;
    const n = st.flaps, i = Math.floor(n), f = n - i;
    const cl0 = i > 0 ? ac.flaps[i - 1].cl : 0;
    const cl1 = i < ac.flaps.length ? ac.flaps[i].cl : cl0;
    return (ac.clMaxClean + lerp(cl0, cl1, f)) * (1 - this.env.iceAmount * 0.25);
  },
  // stall speed with the current weight, configuration and ice (IAS, knots)
  vsNow() {
    const v = Math.sqrt(2 * this.weight() * SIM.GRAVITY / (SIM.RHO_SL * this.ac.wingArea * this.clMax()));
    return v / KTS;
  },
  vsLanding() {
    const ac = this.ac;
    const cl = (ac.clMaxClean + ac.flaps[ac.flaps.length - 1].cl) * (1 - this.env.iceAmount * 0.25);
    return Math.sqrt(2 * this.weight() * SIM.GRAVITY / (SIM.RHO_SL * ac.wingArea * cl)) / KTS;
  },
  vRef() { return this.vsLanding() * 1.3 + this.ac.vrefAdd; },
  vr() {
    const ac = this.ac;
    const cl = (ac.clMaxClean + ac.flaps[1].cl);
    const vs2 = Math.sqrt(2 * this.weight() * SIM.GRAVITY / (SIM.RHO_SL * ac.wingArea * cl)) / KTS;
    return Math.max(ac.vr, vs2 * 1.12);
  },
  vFe() { const f = this.ac.flaps[this.st.flapsTarget - 1]; return f ? f.vfe : this.ac.vne; },
  stallMargin() { return this.st.ias / KTS - this.vsNow(); },

  // ---------- the wind at this moment ----------
  // the wind on an airfield's flags and windsock: the surface wind and its gusts, the same
  // wherever the aeroplane is and whichever way it turns (windAt follows the aeroplane)
  surfaceWindNow() {
    const e = this.env;
    const toward = windTowardHeading(e.surfaceWind.dir) * DEG;
    let vx = hdgX(toward) * e.surfaceWind.speed * KTS, vz = hdgZ(toward) * e.surfaceWind.speed * KTS;
    if (e.turb > 0) {
      const t = this.simTime;
      const g = (fbm(t * 0.7, 0, 2) - 0.5) * 2, g2 = (fbm(t * 0.55 + 31, 0, 2) - 0.5) * 2;
      const amp = e.turb * 7 * KTS * 0.25;
      vx += (g * 0.7 + g2 * 0.3) * amp;
      vz += (g2 * 0.7 - g * 0.3) * amp;
    }
    return { x: vx, y: 0, z: vz };
  },
  // calm: the steady wind only, without the gusts and a windshear (Flight.coast)
  windAt(alt, calm) {
    const e = this.env;
    const agl = Math.max(0, alt - this.groundHeight());
    const k = clamp(agl / 900, 0, 1);
    const sp = lerp(e.surfaceWind.speed, e.altWind.speed, k);
    let dir = e.surfaceWind.dir + wrapDeg(e.altWind.dir - e.surfaceWind.dir) * k;
    dir += Math.sin(this.st.pos.x / 40000 + this.st.pos.z / 33000) * 14 * k;
    const toward = windTowardHeading(dir) * DEG;
    let vx = hdgX(toward) * sp * KTS, vz = hdgZ(toward) * sp * KTS, vy = 0;
    if (calm) return { x: vx, y: vy, z: vz };
    // gusts and turbulence (fading out at a high time acceleration, SIM.TURB_FULL_ACCEL)
    if (e.turb > 0) {
      const t = this.simTime;
      const g = (fbm(t * 0.7, this.st.pos.x / 3000, 2) - 0.5) * 2;
      const g2 = (fbm(t * 0.55 + 31, this.st.pos.z / 3000, 2) - 0.5) * 2;
      const g3 = (fbm(t * 0.9 + 77, 13.1, 2) - 0.5) * 2;
      const amp = e.turb * 7 * KTS * clamp(agl / 600, 0.25, 1) * Math.min(1, SIM.TURB_FULL_ACCEL / Math.max(1, e.timeAccel));
      vx += (g * 0.7 + g2 * 0.3) * amp;
      vz += (g2 * 0.7 - g * 0.3) * amp;
      vy += g3 * amp * 0.35;
    }
    // a windshear: a downdraft and a sudden loss of headwind
    if (e.shearT > 0) {
      vy -= 7 * Math.sin(Math.PI * clamp(e.shearT / 14, 0, 1));
      const away = this.st.hdg;
      vx += hdgX(away) * 8 * Math.sin(Math.PI * clamp(e.shearT / 14, 0, 1));
      vz += hdgZ(away) * 8 * Math.sin(Math.PI * clamp(e.shearT / 14, 0, 1));
    }
    return { x: vx, y: vy, z: vz };
  },

  // ---------- main update ----------
  // dtReal: real seconds since the last frame. Returns the simulated seconds.
  update(dtReal) {
    this.realElapsed += dtReal;
    const accel = this.timeAccel(dtReal);
    this.acc += dtReal * accel;
    const dt = SIM.FIXED_DT;
    // the fastest steps in a steady cruise: most of the time is extrapolated (coast), the physics
    // flies a share of it after that, so the autopilot meets the new position and the picture
    // shows a live aeroplane
    let coast = 0;
    if (accel >= SIM.TIME_ACCEL_COAST_FROM && this.steadyCruise()) {
      const phys = Math.min(this.acc, dtReal * SIM.COAST_PHYS_ACCEL);
      coast = this.acc - phys;
      this.acc = phys;
      this.coast(coast);
    }
    this.coasting = coast > 0;
    let steps = Math.floor(this.acc / dt);
    if (steps > SIM.MAX_STEPS_PER_FRAME) { steps = SIM.MAX_STEPS_PER_FRAME; this.acc = 0; }
    else this.acc -= steps * dt;
    for (let i = 0; i < steps && !this.failure; i++) {
      this.step(dt);
      this.simTime += dt;
      this.elapsed += dt;
      this.phaseTime += dt;
    }
    this.recordTrack();
    return steps * dt + coast;
  },

  // Is the flight steady enough to be extrapolated? Level in the cruise on the autopilot's NAV,
  // the wings level, on the heading and at the speed it wants, nothing going on (SIM.COAST_*)
  steadyCruise() {
    const st = this.st, ap = this.ap;
    if (this.phase !== 'CRUISE' || !ap.on || !ap.nav || this.navFailed || st.onGround || this.failure) return false;
    if ((this.systems && this.systems.checklist) || this.env.shearT > 0 || st.spoiler > 0 || st.stallWarn) return false;
    if (Math.abs(st.vel.y) > SIM.COAST_MAX_VS_MS || Math.abs(st.roll) > SIM.COAST_MAX_BANK_DEG * DEG) return false;
    if (Math.abs(st.pos.y - ap.alt * FT) > SIM.COAST_MAX_ALT_ERR_M || (this.msa || 0) > st.pos.y - SIM.COAST_MAX_ALT_ERR_M) return false;
    if (Math.abs(wrapDeg(ap.hdg - this.headingDeg())) > SIM.COAST_MAX_HDG_ERR_DEG) return false;
    return ap.speed === undefined || Math.abs(st.ias / KTS - ap.speed) < SIM.COAST_MAX_SPD_ERR_KT;
  },
  // Dead reckoning through T simulated seconds of steady cruise, in COAST_STEP_S steps: the
  // height and the airspeed held, the heading turned towards the NAV heading (at most
  // COAST_TURN_DEG_S, as the autopilot's gentle corrections would), the steady wind of each
  // point added, the fuel burnt at the present flow. The physics that follows in the same frame
  // finds the aeroplane trimmed where it was, only further on.
  coast(T) {
    const st = this.st;
    const w0 = this.windAt(st.pos.y, true);
    const tas = Math.hypot(st.vel.x - w0.x, st.vel.z - w0.z);
    while (T > 1e-6) {
      const h = Math.min(SIM.COAST_STEP_S, T);
      T -= h;
      const turn = clamp(wrapDeg(this.navTarget().hdg - this.headingDeg()), -SIM.COAST_TURN_DEG_S * h, SIM.COAST_TURN_DEG_S * h);
      st.hdg = wrapRad(st.hdg + turn * DEG);
      const w = this.windAt(st.pos.y, true);
      st.vel.x = hdgX(st.hdg) * tas + w.x;
      st.vel.z = hdgZ(st.hdg) * tas + w.z;
      st.vel.y = 0;
      st.pos.x += st.vel.x * h;
      st.pos.z += st.vel.z * h;
      st.fuel = Math.max(0, st.fuel - (st.fuelFlow + st.leakRate) * h / 3600);
      this.simTime += h;
      this.elapsed += h;
      this.phaseTime += h;
    }
    st.rollRate = 0; st.pitchRate = 0; st.yawRate = 0; st.turnRate = 0;
  },

  // A point every 60 m on the ground and every 600 m in the air (or on a turn of 3°); when the
  // track gets long, every other point is dropped so it never costs much to keep or to draw.
  recordTrack() {
    const st = this.st, tr = this.track;
    const last = tr[tr.length - 1];
    const air = !st.onGround;
    if (last) {
      const d = Math.hypot(st.pos.x - last.x, st.pos.z - last.z);
      const turned = Math.abs(wrapDeg(this.headingDeg() - last.h)) > 3;
      if (d < (air ? 600 : 60) && !(turned && d > (air ? 150 : 20)) && last.air === air) return;
      // a jump (the final-approach cheat): start again (further than a frame flies at the fastest)
      if (d > Math.max(30000, Math.hypot(st.vel.x, st.vel.z) * this.env.timeAccel * SIM.MAX_FRAME_DT * 1.5)) tr.length = 0;
    }
    tr.push({ x: st.pos.x, z: st.pos.z, air, h: this.headingDeg() });
    if (tr.length > 2400) this.track = tr.filter((p, i) => i % 2 === 0 || i === tr.length - 1);
  },

  // The fastest step allowed now: on the autopilot the fastest of all (x512) at any height and in
  // any phase; flying by hand it depends on the height (SIM.TIME_ACCEL_MANUAL). Never on the
  // ground (but up to COPILOT.TIME_ACCEL while the first officer taxis), low down, in a checklist
  // or with ice building and the anti-ice off, and closing on the arrival it comes down by itself
  // (approachAccelMax).
  timeAccelMax() {
    this.approachCapped = false;
    if (this.timeHeld()) return 1;
    if (this.st.onGround) return this.copilot && this.copilot.on ? COPILOT.TIME_ACCEL : 1;
    const agl = this.altAgl();
    if (agl < SIM.TIME_ACCEL_MIN_ALT_M) return 1;
    let max = 1;
    if (this.ap.on) max = SIM.TIME_ACCEL_AP_MAX;
    else for (const t of SIM.TIME_ACCEL_MANUAL) if (agl / FT >= t.aglFt) max = t.max;
    const near = this.approachAccelMax();
    if (near < max) { max = near; this.approachCapped = true; }
    return max;
  },
  // The time slows down one step at a time, a step every TIME_ACCEL_SLOWDOWN_S real seconds, to
  // the step `floor` when `left` metres are flown: at every step the distance left must hold
  // that many seconds at each of the steps below it (down to the floor). The fastest step that
  // fits; at the present ground speed, so it is about gs × 3 s × the sum of the steps below:
  // at 250 m/s x512 needs 288 km and x256 96 km before x128, x128 95 km before x1.
  ladderMax(left, floor) {
    const steps = SIM.TIME_ACCEL_STEPS;
    const gs = Math.max(30, Math.hypot(this.st.vel.x, this.st.vel.z));
    let need = 0, max = floor;
    for (let i = steps.indexOf(floor) + 1; i < steps.length; i++) {
      need += gs * steps[i - 1] * SIM.TIME_ACCEL_SLOWDOWN_S;
      if (need > left) break;
      max = steps[i];
    }
    return max;
  },
  // Closing on the arrival the time is back at x1 TIME_ACCEL_X1_NM out
  approachAccelMax() {
    if (!this.arrival) return SIM.TIME_ACCEL_STEPS[SIM.TIME_ACCEL_STEPS.length - 1];
    const left = (this.accelDistNm() - SIM.TIME_ACCEL_X1_NM) * NM;
    return left <= 0 ? 1 : this.ladderMax(left, 1);
  },
  // how far out the descent starts: on the descent profile (aboveProfileFt), at least DESCENT_START_NM
  descentStartNm() {
    const lose = this.st.pos.y / FT - (this.arrival.elev / FT + 2500);
    return Math.max(SIM.DESCENT_START_NM, lose / 1000 * SIM.DESCENT_NM_PER_KFT + SIM.DESCENT_END_NM);
  },
  // The distance to the threshold divided by the cosine of the angle between the track and the
  // way to it (at most x5, TIME_ACCEL_MIN_COS): flown straight at the runway it is the distance
  // itself, flown past or around the airport it is longer, so the time stays fast there.
  accelDistNm() {
    const t = this.arrival.thr, st = this.st;
    const dx = t.x - st.pos.x, dz = t.z - st.pos.z;
    const d = Math.hypot(dx, dz), gs = Math.hypot(st.vel.x, st.vel.z);
    if (d < 1 || gs < 1) return d / NM;
    const cos = (dx * st.vel.x + dz * st.vel.z) / (d * gs);
    return d / Math.max(cos, SIM.TIME_ACCEL_MIN_COS) / NM;
  },
  timeAccelTop() {
    const max = this.timeAccelMax();
    let top = 0;
    SIM.TIME_ACCEL_STEPS.forEach((v, i) => { if (v <= max) top = i; });
    return top;
  },
  // something to deal with now (an emergency's checklist, ice building with the anti-ice off):
  // the time stays at x1 until it is done
  timeHeld() { return !!(this.systems && (this.systems.checklist || this.systems.iceHold)); },
  // an interruption: drop the clock back to real time; it climbs back to where it was, a step a
  // second, once nothing holds it (timeHeld)
  interruptTime() {
    const was = this.cheatAccel ? SIM.TIME_ACCEL_STEPS.length - 1 : this.timeAccelIndex;
    this.timeAccelResume = Math.max(this.timeAccelResume || 0, was); this.resumeT = 0;
    this.timeAccelIndex = 0; this.cheatAccel = false;
    this.env.timeAccel = 1;
  },
  timeAccel(dtReal = 0) {
    const e = this.env;
    // after an emergency the time climbs back to where it was, a step a second, once the checklist is
    // closed (and the anti-ice is on, if ice was building)
    if (this.timeAccelResume > this.timeAccelIndex && !this.timeHeld()) {
      this.resumeT += dtReal;
      if (this.resumeT >= SIM.TIME_ACCEL_RESUME_S) {
        this.resumeT = 0;
        if (this.timeAccelIndex < this.timeAccelTop()) {
          this.timeAccelIndex++;
          e.timeAccel = SIM.TIME_ACCEL_STEPS[this.timeAccelIndex];
          this.info(tr('TIME x{n}', { n: e.timeAccel }), 'TIME');
        } else this.timeAccelResume = 0;     // no faster allowed now: the pilot takes it from here
      }
    } else this.resumeT = 0;
    if (this.timeAccelIndex >= this.timeAccelResume) this.timeAccelResume = 0;
    if (this.timeAccelIndex === 0 && !this.cheatAccel) { e.timeAccel = 1; return 1; }
    const top = this.timeAccelTop();
    const was = e.timeAccel;
    // (the cheat holds while the autopilot may run at its fastest: extrapolated in a steady
    // cruise, elsewhere as fast as the physics steps of a frame go)
    if (this.cheatAccel && (!this.ap.on || SIM.TIME_ACCEL_STEPS[top] < SIM.TIME_ACCEL_AP_MAX)) this.cheatAccel = false;
    // the conditions got stricter (the autopilot is off, lower down, an emergency): step down to what is allowed
    if (this.timeAccelIndex > top) this.timeAccelIndex = top;
    e.timeAccel = this.cheatAccel ? SIM.TIME_ACCEL_CHEAT : SIM.TIME_ACCEL_STEPS[this.timeAccelIndex];
    if (e.timeAccel < was) {
      this.info(tr('TIME x{n}', { n: e.timeAccel }) + (this.approachCapped ? ' — ' + tr('approaching {id}', { id: this.arrival.id })
        : e.timeAccel > 1 && !this.ap.on ? ' — ' + tr('the most by hand at this height') : ''), 'TIME');
    }
    return e.timeAccel;
  },
  // dir = +1 (T, faster) or -1 (R, slower)
  changeTimeAccel(dir) {
    const steps = SIM.TIME_ACCEL_STEPS;
    const top = this.timeAccelTop();
    // T refused while a checklist or the ice holds the time: it still climbs back once that is done
    if (dir > 0 && this.timeHeld()) { this.warn('TIME', this.timeAccelLimitText()); return; }
    this.timeAccelResume = 0;                // the pilot sets the time: no climbing back after an emergency
    if (this.cheatAccel) { this.cheatAccel = false; this.timeAccelIndex = dir < 0 ? top : this.timeAccelIndex; }
    else if (dir > 0 && this.timeAccelIndex >= top) { this.warn('TIME', this.timeAccelLimitText()); return; }
    else if (dir < 0 && this.timeAccelIndex === 0) { this.info(tr('TIME x{n}', { n: 1 }), 'TIME'); return; }
    else this.timeAccelIndex = clamp(this.timeAccelIndex + dir, 0, top);
    this.env.timeAccel = steps[this.timeAccelIndex];
    this.info(tr('TIME x{n}', { n: this.env.timeAccel }), 'TIME');
  },
  // The first officer takes the taxi (on: the time goes to COPILOT.TIME_ACCEL) or gives it back
  // (the time back to x1)
  copilotTime(on) {
    this.timeAccelResume = 0; this.cheatAccel = false;
    this.timeAccelIndex = on ? Math.max(0, SIM.TIME_ACCEL_STEPS.indexOf(COPILOT.TIME_ACCEL)) : 0;
    this.env.timeAccel = SIM.TIME_ACCEL_STEPS[this.timeAccelIndex];
    this.info(tr('TIME x{n}', { n: this.env.timeAccel }), 'TIME');
  },
  // why T cannot go any faster
  timeAccelLimitText() {
    if (this.st.onGround && this.copilot && this.copilot.on && !this.timeHeld()) return tr('Time x{n} is the fastest on the ground', { n: COPILOT.TIME_ACCEL });
    if (this.st.onGround || this.altAgl() < SIM.TIME_ACCEL_MIN_ALT_M) {
      return tr('Time acceleration only in the air, above {alt} ft', { alt: fmtAlt(SIM.TIME_ACCEL_MIN_ALT_M) });
    }
    if (this.systems && this.systems.checklist) return tr('Work the checklist first — time runs at x1');
    if (this.systems && this.systems.iceHold) return tr('Anti-ice first (K) — time runs at x1');
    if (this.approachCapped) return tr('Approaching {id} — the time slows down by itself, x1 from {nm} out', { id: this.arrival.id, nm: Units.dist(SIM.TIME_ACCEL_X1_NM) });
    if (this.ap.on) return tr('Time x{n} is the fastest', { n: SIM.TIME_ACCEL_AP_MAX });
    const max = this.timeAccelMax();
    const next = SIM.TIME_ACCEL_MANUAL.find((t) => t.max > max);
    return next
      ? tr('By hand: time x{n} above {ft} ft AGL — the autopilot <kbd>Y</kbd> allows up to x{ap}', { n: next.max, ft: next.aglFt, ap: SIM.TIME_ACCEL_AP_MAX })
      : tr('By hand time x{n} is the most — the autopilot <kbd>Y</kbd> allows up to x{ap}', { n: max, ap: SIM.TIME_ACCEL_AP_MAX });
  },

  // body axes from the Euler angles
  updateAxes() {
    const st = this.st;
    const ch = Math.cos(st.hdg), sh = Math.sin(st.hdg);
    const cp = Math.cos(st.pitch), sp = Math.sin(st.pitch);
    const cr = Math.cos(st.roll), sr = Math.sin(st.roll);
    const nose = { x: sh * cp, y: sp, z: -ch * cp };
    const r0 = { x: ch, y: 0, z: sh };
    const up0 = { x: -sh * sp, y: cp, z: ch * sp };
    const right = { x: r0.x * cr - up0.x * sr, y: r0.y * cr - up0.y * sr, z: r0.z * cr - up0.z * sr };
    const up = { x: up0.x * cr + r0.x * sr, y: up0.y * cr + r0.y * sr, z: up0.z * cr + r0.z * sr };
    st.axes = { nose, right, up };
    return st.axes;
  },

  step(dt) {
    const st = this.st, ac = this.ac, e = this.env;
    this.updateAutopilot(dt);
    if (e.shearT > 0) e.shearT = Math.max(0, e.shearT - dt);

    // --- flaps and gear transitions
    if (st.flaps !== st.flapsTarget) {
      st.flaps = approach(st.flaps, st.flapsTarget, dt / SIM.FLAP_TRANSIT_S);
    }
    if (st.gear !== st.gearTarget) {
      st.gear = approach(st.gear, st.gearTarget, dt / SIM.GEAR_TRANSIT_S);
    }
    // brakes come on progressively
    st.brakes = approach(st.brakes, st.brakeInput, dt / SIM.BRAKE_RAMP_S);

    const { nose, right, up } = this.updateAxes();

    // --- air data
    const alt = st.pos.y;
    const wind = this.windAt(alt);
    const vrel = { x: st.vel.x - wind.x, y: st.vel.y - wind.y, z: st.vel.z - wind.z };
    const V = Math.hypot(vrel.x, vrel.y, vrel.z);
    const rho = this.density(alt);
    const q = 0.5 * rho * V * V;
    const vf = vrel.x * nose.x + vrel.y * nose.y + vrel.z * nose.z;
    const vu = vrel.x * up.x + vrel.y * up.y + vrel.z * up.z;
    const vr = vrel.x * right.x + vrel.y * right.y + vrel.z * right.z;
    st.tas = V;
    st.ias = V * Math.sqrt(rho / SIM.RHO_SL);
    st.alpha = V > 2 ? Math.atan2(-vu, Math.max(0.5, vf)) : 0;
    st.beta = V > 2 ? Math.asin(clamp(vr / V, -1, 1)) : 0;
    st.vs = st.vel.y;
    const qn = q / (q + 9000);                    // 0..1 control effectiveness
    const mass = this.weight();

    // --- forces in world axes
    let fx = 0, fy = -mass * SIM.GRAVITY, fz = 0;
    const aStall = SIM.STALL_AOA_DEG * DEG;
    if (V > 1) {
      const vhx = vrel.x / V, vhy = vrel.y / V, vhz = vrel.z / V;
      // lift: perpendicular to the airflow, in the plane of the wings' "up"
      const dot = up.x * vhx + up.y * vhy + up.z * vhz;
      let lx = up.x - vhx * dot, ly = up.y - vhy * dot, lz = up.z - vhz * dot;
      const ll = Math.hypot(lx, ly, lz) || 1;
      lx /= ll; ly /= ll; lz /= ll;
      const slope = ac.clMaxClean / (aStall * 0.92);
      const alphaEff = st.alpha;
      let cl;
      if (Math.abs(alphaEff) < aStall * 0.92) {
        cl = slope * alphaEff;
      } else {
        // past the break: lift collapses, drag rises fast
        const over = (Math.abs(alphaEff) - aStall * 0.92) / (aStall * 0.6);
        cl = Math.sign(alphaEff) * ac.clMaxClean * (1 - clamp(over, 0, 0.7));
      }
      cl += this.flapCl() * Math.min(1, st.flaps);
      cl *= (1 - e.iceAmount * 0.25);
      if (st.spoiler) cl *= 0.7;
      // ground effect: less induced drag in the last half wingspan
      const ge = clamp(this.altAgl() / (this.dims.span * 0.6), 0.4, 1);
      const cd = ac.cd0 + ac.kInd * cl * cl * ge + (ac.flaps[Math.round(st.flaps) - 1] || { cd: 0 }).cd +
        st.gear * ac.gearCd + st.spoiler * 0.06 + e.iceAmount * 0.025 + Math.abs(st.beta) * 0.25;
      const lift = q * ac.wingArea * cl;
      const drag = q * ac.wingArea * cd;
      fx += lx * lift - vhx * drag;
      fy += ly * lift - vhy * drag;
      fz += lz * lift - vhz * drag;
      // side force from sideslip
      const side = -q * ac.wingArea * 0.9 * st.beta;
      fx += right.x * side; fy += right.y * side; fz += right.z * side;
      st.cl = cl;
    }

    // --- thrust
    const sigma = rho / SIM.RHO_SL;
    let thrust = ac.thrust * this.thrustFraction() * Math.min(1, sigma * 1.3);
    if (ac.engineType === 'prop') {
      // a propeller loses static thrust as the airspeed builds
      thrust *= clamp(1 - (V / (V + 95)) * 0.62, 0.25, 1);
    }
    fx += nose.x * thrust; fy += nose.y * thrust; fz += nose.z * thrust;
    st.thrust = thrust;

    // --- integration
    st.gLoad = (fy + mass * SIM.GRAVITY) / (mass * SIM.GRAVITY);
    st.vel.x += fx / mass * dt; st.vel.y += fy / mass * dt; st.vel.z += fz / mass * dt;

    // --- rotation: body rates p (roll), q (pitch), r (yaw)
    const maxRoll = SIM.ROLL_RATE_MAX * ac.rollRate * (0.3 + 0.7 * qn);
    const maxPitch = SIM.PITCH_RATE_MAX * ac.pitchRate * (0.35 + 0.65 * qn);
    const maxYaw = SIM.YAW_RATE_MAX * ac.yawRate * (0.4 + 0.6 * qn);
    if (st.onGround) st.trimAlpha = (3.2 + st.flaps * 0.3) * DEG;      // take-off trim
    if (!st.onGround) {
      // pitch: elevator plus static stability pulling the nose to the trim angle of attack. The trim
      // follows the angle of attack being flown (faster with the autopilot), like an automatic trim,
      // so a heavy jet at a slow speed is not fighting its own stability — but never into the stall.
      // Not by hand low on the approach, though: there the trim stays where the approach left it,
      // so a pull in the flare (or a little too early) is given back when the stick is let go
      // and the nose comes down onto the glide path again, instead of being held up there while
      // the aeroplane floats past the runway and stalls.
      const trimTo = clamp(st.alpha, -2 * DEG, (SIM.STALL_WARN_AOA_DEG - 2) * DEG);
      const flare = !this.ap.on && this.phase === 'APPROACH' && this.altAgl() < SIM.FLARE_TRIM_HOLD_M;
      if (!flare) st.trimAlpha = approach(st.trimAlpha, trimTo, (this.ap.on ? 1.5 : 0.6) * DEG * dt);
      // scaled like the elevator, so a heavy jet's nose is as easy to hold as a light aircraft's
      const stability = -(st.alpha - st.trimAlpha) * 2.4 * qn * ac.pitchRate;
      // the elevator loses authority as the nose comes up, so it cannot be flown into a zoom
      const authority = 1 - smoothstep(0.3, 0.6, st.pitch * Math.sign(st.elevator)) * 0.8;
      let pitchCmd = st.elevator * authority * maxPitch + stability;
      if (this.cargoShift) pitchCmd -= 0.02;
      st.pitchRate = approach(st.pitchRate, pitchCmd, maxPitch * 4 * dt);
      // roll: ailerons and a gentle return towards wings level
      const spiral = -st.roll * 0.12 * qn;
      const rollCmd = st.aileron * maxRoll + spiral;
      st.rollRate = approach(st.rollRate, rollCmd, maxRoll * 5 * dt);
      // yaw: rudder, the fin keeping the nose into the airflow, a little adverse yaw
      const yawCmd = st.rudder * maxYaw + st.beta * 3.5 * qn - st.rollRate * 0.05;
      st.yawRate = approach(st.yawRate, yawCmd, maxYaw * 6 * dt);

      const cr = Math.cos(st.roll), sr = Math.sin(st.roll);
      const cp = Math.max(0.2, Math.cos(st.pitch));
      const pitchDot = st.pitchRate * cr - st.yawRate * sr;
      const hdgDot = (st.pitchRate * sr + st.yawRate * cr) / cp;
      st.turnRate = hdgDot;
      st.pitch += pitchDot * dt;
      st.roll = wrapRad(st.roll + st.rollRate * dt);
      st.hdg = wrapRad(st.hdg + hdgDot * dt);
      if (st.pitch > 0.62) { st.pitch = 0.62; st.pitchRate = Math.min(0, st.pitchRate); }
      if (st.pitch < -0.6) { st.pitch = -0.6; st.pitchRate = Math.max(0, st.pitchRate); }
      // past 70 degrees of bank the wing drops further and the roll is limited
      if (Math.abs(st.roll) > 1.2) {
        st.rollRate -= Math.sign(st.roll) * 0.8 * dt;
        if (!this.warnedBank) { this.warnedBank = true; this.warn('BANK', tr('BANK ANGLE — level the wings')); }
      } else if (Math.abs(st.roll) < 0.9) this.warnedBank = false;
      if (Math.abs(st.roll) > 1.5) { st.roll = Math.sign(st.roll) * 1.5; st.rollRate = 0; }
    }

    // --- integrate position
    st.pos.x += st.vel.x * dt;
    st.pos.y += st.vel.y * dt;
    st.pos.z += st.vel.z * dt;

    // --- ground contact
    const gh = this.groundHeight();
    const floor = gh + st.gearH * (0.3 + 0.7 * st.gear);
    if (st.pos.y <= floor || (st.onGround && st.pos.y < floor + 0.4 && st.vel.y < 1.2)) {
      if (!st.onGround) this.contact(-st.vel.y, gh);
      st.pos.y = floor;
      st.vel.y = Math.max(0, st.vel.y);
      st.onGround = true;
      this.groundStep(dt, maxPitch, maxYaw, qn);
    } else {
      if (st.onGround) { st.wasAirborne = true; st.liftoffAt = this.elapsed; }
      st.onGround = false;
    }

    // --- fuel burn
    const sys = this.systems;
    const running = sys ? sys.runningCount() : ac.engines;
    let perEng = lerp(ac.fuelFlowIdle, ac.fuelFlowCruise, st.throttle);
    if (st.onGround) perEng = lerp(SIM.FUEL_BURN_TAXI_PER_ENGINE, ac.fuelFlowIdle * 1.5, st.throttle);
    st.fuelFlow = perEng * running;
    st.fuel = Math.max(0, st.fuel - st.fuelFlow * dt / 3600 - st.leakRate * dt / 3600);

    // --- warnings
    const ias = st.ias / KTS;
    st.stallWarn = !st.onGround && ias > 30 && (ias < this.vsNow() * 1.08 || st.alpha > SIM.STALL_WARN_AOA_DEG * DEG);
    if (st.stallWarn) this.warn('STALL', tr('STALL — lower the nose, add power'));
    if (ias > ac.vne) {
      this.warn('OVERSPEED', tr('OVERSPEED — Vne {v} kt', { v: ac.vne }));
      st.damage = Math.min(1, st.damage + dt * 0.01 * (ias - ac.vne) / 10);
    }
    if (st.flaps > 0.5 && ias > this.flapVfeNow() + 10) {
      this.warn('FLAPSPEED', tr('Flap overspeed — retract the flaps or slow down'));
      st.damage = Math.min(1, st.damage + dt * 0.004);
    }
    if (st.gear > 0.05 && ias > ac.vlo + 25 && !st.onGround) this.warn('GEARSPEED', tr('Gear overspeed — slow down below {v} kt', { v: ac.vlo }));

    // a warning about a state goes off the screen the moment the state is put right
    const gr = this.gearReject;
    const live = {
      STALL: st.stallWarn,
      OVERSPEED: ias > ac.vne,
      FLAPSPEED: st.flaps > 0.5 && ias > this.flapVfeNow() + 10,
      GEARSPEED: st.gear > 0.05 && ias > ac.vlo + 25 && !st.onGround,
      SPOILERLAND: st.spoiler > 0.5 && !st.onGround,
      GEAR: gr === 'ground' ? st.onGround : gr === 'failed' ? !!st.gearFailed : false
    };
    const was = this.liveWarn || {};
    for (const id in live) if (was[id] && !live[id]) this.events.push({ id: 'clear', clear: id, t: this.realElapsed });
    if (!live.GEAR) this.gearReject = null;
    this.liveWarn = live;
  },

  // the limit speed of the flaps that are out right now (flaps up: no limit)
  flapVfeNow() { const n = Math.ceil(this.st.flaps - 0.02); return n > 0 ? this.ac.flaps[n - 1].vfe : this.ac.vne; },

  thrustFraction() {
    if (this.systems) return this.systems.thrustFraction();
    return this.st.throttle;
  },

  // ---------- ground ----------
  groundStep(dt, maxPitch, maxYaw, qn) {
    const st = this.st, ac = this.ac;
    const surf = this.surfaceAt(st.pos.x, st.pos.z);
    st.surface = surf.type;
    st.onPavement = surf.onPavement;

    // pitch: the nose wheel holds the nose down until rotation speed
    const ias = st.ias / KTS;
    const rotAuth = smoothstep(this.vr() * 0.7, this.vr() * 0.98, ias);
    const want = st.elevator > 0 ? st.elevator * rotAuth * maxPitch : -Math.max(0.05, st.pitch) * 1.5;
    st.pitchRate = approach(st.pitchRate, want, maxPitch * 3 * dt);
    st.pitch = clamp(st.pitch + st.pitchRate * dt, 0, 12 * DEG);
    if (st.pitch >= 12 * DEG - 1e-4 && st.elevator > 0.5 && ias > 40) this.warn('TAIL', tr('Tail strike — too much rotation'));
    st.roll = approach(st.roll, 0, dt * 0.8);
    st.rollRate = 0;

    // split velocity into along-track and cross-track of the current heading
    const fx = hdgX(st.hdg), fz = hdgZ(st.hdg);
    const rx = -fz, rz = fx;                       // right of the heading
    let vf = st.vel.x * fx + st.vel.z * fz;
    let vr = st.vel.x * rx + st.vel.z * rz;
    const speed = Math.abs(vf);

    // steering: the nosewheel at low speed, the rudder as the speed builds
    const wb = this.dims.len * 0.38;
    const steerMax = SIM.NOSEWHEEL_MAX_STEER_DEG * DEG * clamp(1 - speed / 26, 0.06, 1);
    // the hydraulic steering turns the nosewheel at its own pace, so a turn builds up gently
    st.steer = approach(st.steer || 0, st.rudder * steerMax, SIM.NOSEWHEEL_STEER_RATE_DEG * DEG * dt);
    const steer = st.steer;
    // the rudder and the fin only bite with some speed over the ground; a parked aeroplane does not weathervane
    const aero = st.parkingBrake ? 0 : smoothstep(2, 15, speed);
    const yaw = vf * Math.tan(steer) / wb + (st.rudder * maxYaw * 0.8 + st.beta * 1.2) * qn * aero;
    st.yawRate = approach(st.yawRate, yaw, SIM.GROUND_YAW_ACCEL * dt);
    st.turnRate = st.yawRate;
    st.hdg = wrapRad(st.hdg + st.yawRate * dt);

    // rolling friction and the brakes
    const g = SIM.GRAVITY;
    const sys = this.systems;
    const brakeFactor = sys ? sys.brakeFactor : 1;
    // the spoiler out on the ground dumps the lift and puts the weight on the wheels: the brakes bite harder
    let decel = surf.roll * g + surf.brake * st.brakes * brakeFactor * (1 + SIM.SPOILER_BRAKE_GAIN * st.spoiler) * g;
    if (st.parkingBrake) decel = Math.max(decel, 3.5);
    vf -= Math.sign(vf) * Math.min(Math.abs(vf), decel * dt);
    if (st.parkingBrake && Math.abs(vf) < 0.4) vf = 0;
    // tyres kill sideways movement
    vr *= Math.exp(-10 * dt);

    const nfx = hdgX(st.hdg), nfz = hdgZ(st.hdg);
    st.vel.x = vf * nfx + vr * -nfz;
    st.vel.z = vf * nfz + vr * nfx;

    // off-pavement consequences
    const gs = Math.hypot(st.vel.x, st.vel.z) / KTS;
    if (!surf.onPavement && gs > 25 && !surf.allowed) this.fail('excursion', tr('Runway excursion — you left the paved surface at {v} kt.', { v: Math.round(gs) }));
    else if (!surf.onPavement && gs > 40) {
      st.damage = Math.min(1, st.damage + dt * 0.03);
      this.warn('ROUGH', tr('Off the paved surface — rough field'));
    }
  },

  // the moment the wheels (or anything else) touch the ground
  contact(sinkMps, gh) {
    const st = this.st;
    if (!st.wasAirborne) return;
    const fpm = sinkMps / FPM;
    const bank = Math.abs(st.roll) * RAD;
    const pitch = st.pitch * RAD;
    const a = this.nearestApt();
    const loc = World.local(a, st.pos.x, st.pos.z);
    const onAirport = Math.abs(loc.t) < a.half + 400 && loc.across > -300 && loc.across < LAYOUT.TERMINAL + 150;
    if (gh < 0.3 && !onAirport) { this.fail('ditch', tr('You ditched in the water.')); return; }
    if (!onAirport) { this.fail('terrain', tr('Controlled flight into terrain — you hit the ground away from any runway.')); return; }
    if (bank > SIM.CRASH_BANK_DEG) { this.fail('wing', tr('A wing hit the ground — {b}° of bank at touchdown.', { b: Math.round(bank) })); return; }
    if (pitch < SIM.CRASH_PITCH_DEG) { this.fail('nose', tr('The nose hit the ground first and the nose gear collapsed.')); return; }
    if (st.gear < 0.9) { this.fail('gearup', tr('Landed with the gear up.')); return; }
    if (fpm > SIM.TOUCHDOWN_BREAK_FPM) { this.fail('gearbreak', tr('Touchdown at {v} fpm — the gear collapsed.', { v: Math.round(fpm) })); return; }
    this.touchdown(fpm, a, loc);
  },

  touchdown(fpm, a, loc) {
    const st = this.st;
    const bank = Math.abs(st.roll) * RAD;
    let damage = 0;
    if (bank > 9) { damage += 0.12; this.warn('STRIKE', tr('Wingtip strike — bank angle at touchdown')); }
    if (fpm > SIM.TOUCHDOWN_HARD_FPM) {
      damage += 0.18;
      this.warn('HARD', tr('Hard landing — {v} fpm', { v: Math.round(fpm) }));
    }
    const surf = this.surfaceAt(st.pos.x, st.pos.z);
    if (!surf.onPavement && !surf.allowed) damage += 0.3;
    st.damage = Math.min(1, st.damage + damage);
    // the first touchdown at the destination is the one that is graded
    if (!this.landed && a === this.arrival) {
      this.landed = {
        fpm: Math.round(Math.max(0, fpm)),
        bank: +bank.toFixed(1),
        ias: Math.round(st.ias / KTS),
        vref: Math.round(this.vRef()),
        crab: Math.round(wrapDeg(this.trackDeg() - this.headingDeg())),
        fromThr: Math.round(loc.t + a.half),
        offset: Math.round(loc.across),
        surf: surf.type,
        damage,
        t: this.elapsed
      };
      this.cabinReaction(this.cabinMood(fpm, bank, surf));
    } else if (this.landed && a === this.arrival && !this.landed.bounced && this.elapsed - this.landed.t < CABIN_REACTION.BOUNCE_S && fpm > 60) {
      this.landed.bounced = true;
      this.cabinReaction('bounce');
    }
    this.info(tr('TOUCHDOWN {v} fpm', { v: Math.round(Math.max(0, fpm)) }));
    Audio2.cue('touchdown', Math.max(0, fpm));
  },

  // how the passengers take the landing (CABIN_REACTION)
  cabinMood(fpm, bank, surf) {
    const R = CABIN_REACTION, moods = ['ovation', 'applause', 'polite', 'firm', 'rough', 'hard'];
    let i = fpm <= R.OVATION_FPM ? 0 : fpm <= R.APPLAUSE_FPM ? 1 : fpm <= R.POLITE_FPM ? 2
      : fpm <= R.FIRM_FPM ? 3 : fpm <= SIM.TOUCHDOWN_HARD_FPM ? 4 : 5;
    if (bank > R.BANK_DEG) i = Math.min(5, i + 1);
    if (!surf.onPavement) i = 5;
    return moods[i];
  },
  // the cabin heard (core/crowd.js) and a line about it; only with passengers on board, never
  // in the simulator (a practice landing)
  cabinReaction(mood) {
    const c = this.contract;
    if (!c || c.type !== 'pax' || !c.pax || this.practice) return;
    if (this.landed) this.landed.cabin = mood;
    this.info({
      ovation: tr('The cabin bursts into applause'),
      applause: tr('The passengers applaud'),
      polite: tr('A few passengers clap'),
      firm: tr('A firm one — the overhead bins rattle'),
      rough: tr('"Ooh!" from the cabin — cups fly in the galley'),
      hard: tr('Gasps in the cabin — the galley is a mess'),
      bounce: tr('"Whoa!" — the cabin felt that bounce')
    }[mood]);
    Audio2.cue('cabin', { mood, pax: c.pax });
  },

  nearestApt() {
    const st = this.st;
    const d1 = Math.hypot(st.pos.x - this.world.x, st.pos.z - this.world.z);
    const d2 = Math.hypot(st.pos.x - this.arrival.x, st.pos.z - this.arrival.z);
    return d2 < d1 ? this.arrival : this.world;
  },

  surfaceAt(x, z) {
    const a = this.nearestApt();
    const ac = this.ac;
    const wet = this.env.precip !== 'none';
    const snow = this.env.precip === 'snow' || this.env.snowy;
    const g = snow ? 0.55 : wet ? 0.75 : 1;           // braking grip
    const loc = World.local(a, x, z);
    if (Math.abs(loc.t) < a.half + 30 && Math.abs(loc.across) < RWY_HALF_WIDTH + 3) {
      return { type: 'runway', roll: 0.015, brake: 0.55 * g, onPavement: true, allowed: true };
    }
    const r = a.apronRect;
    if (loc.t > r.t0 && loc.t < r.t1 && loc.across > r.a0 && loc.across < r.a1) {
      return { type: 'apron', roll: 0.018, brake: 0.5 * g, onPavement: true, allowed: true };
    }
    for (let i = 0; i < a.twySegs.length; i++) {
      const s = a.twySegs[i];
      if (pointSegDist(x, z, s.x1, s.z1, s.x2, s.z2) < s.w / 2 + 5) {
        return { type: 'taxiway', roll: 0.018, brake: 0.5 * g, onPavement: true, allowed: true };
      }
    }
    // the paved fillets where taxiways meet (World.buildFillets)
    for (const f of a.fillets || []) {
      const p = f.world;
      for (let i = 0; i + 1 < p.length; i++) {
        if (pointSegDist(x, z, p[i].x, p[i].z, p[i + 1].x, p[i + 1].z) < f.w / 2 + 5) {
          return { type: 'taxiway', roll: 0.018, brake: 0.5 * g, onPavement: true, allowed: true };
        }
      }
    }
    if (a.arctic && snow) return { type: 'ice', roll: 0.04, brake: 0.18, onPavement: false, allowed: ac.surfaces.includes('ice') };
    return { type: 'grass', roll: 0.07, brake: 0.35, onPavement: false, allowed: ac.surfaces.includes('grass') };
  },

  fail(reason, text) {
    if (this.failure) return;
    this.failure = { reason, text };
    Audio2.cue('crash');
  },

  // ---------- navigation helpers ----------
  distToRunwayNm() {
    const t = this.arrival.thr;
    return Math.hypot(this.st.pos.x - t.x, this.st.pos.z - t.z) / NM;
  },
  arrivalBearing() {
    const t = this.arrival.thr;
    return bearingDeg(this.st.pos.x, this.st.pos.z, t.x, t.z);
  },
  distToDestNm() {
    return Math.hypot(this.st.pos.x - this.arrival.x, this.st.pos.z - this.arrival.z) / NM;
  },
  routeNm() {
    return Math.hypot(this.world.x - this.arrival.x, this.world.z - this.arrival.z) / NM;
  },
  // ILS-style deviations from the arrival runway
  ilsDeviation() {
    const a = this.arrival;
    const loc = World.local(a, this.st.pos.x, this.st.pos.z);
    const along = loc.t + a.half;                     // metres past the threshold (negative before it)
    const dist = Math.max(150, -along + 300);
    const targetAlt = a.elev + 15 + Math.max(0, -along) * Math.tan(SIM.GLIDESLOPE_DEG * DEG);
    const wheels = this.st.pos.y - this.st.gearH;
    const gsDeg = clamp((wheels - targetAlt) / dist * RAD, -9, 9);
    const locDeg = clamp(loc.across / dist * RAD, -9, 9);
    return { along, across: loc.across, dist, gsDeg, locDeg, targetAlt };
  },
  // progress along the route, 0 at the departure, 1 at the arrival
  progress() {
    const total = this.routeNm();
    return total > 0 ? clamp(1 - this.distToDestNm() / total, 0, 1) : 1;
  },
  // Where the NAV mode steers, like a real procedure: to an initial approach fix on the
  // extended centreline (FINAL_FIX_NM + 5 nm out), then down the localiser.
  // The turn onto the localiser is anticipated: at every distance from the centreline there is
  // a steepest closing angle from which a turn of the autopilot's radius at this speed (with a
  // margin, after a few seconds of rolling in) still rolls out on the line (locInterceptDeg).
  // The localiser is captured, near the approach, the moment the aeroplane's closing angle
  // reaches it, and from then on the commanded track follows it down to the line, so even a
  // fast jet turning in from the side or from behind does not swing through the centreline.
  // An aeroplane on the runway side of the fix heading out first flies to an entry point beside
  // the fix, from where the turn back onto the final fits.
  navTarget() {
    const a = this.arrival, st = this.st;
    const iafD = (SIM.FINAL_FIX_NM + 5) * NM;
    const loc = World.local(a, st.pos.x, st.pos.z);
    const before = -(loc.t + a.half);                 // metres before the threshold
    const v = Math.max(40, Math.hypot(st.vel.x, st.vel.z));
    // over the ground the turn is as wide as the fastest it gets: now, or on the final with the
    // wind along the runway (a tailwind on the final widens it a lot)
    const w = this.windAt(st.pos.y);
    const turnR = this.apTurnRadius(Math.max(v, st.tas + w.x * a.dirX + w.z * a.dirZ));
    const side = loc.across >= 0 ? 1 : -1;
    // the track's angle towards the centreline: 0 = along the final, 90 = straight at it, 180 = outbound
    const closing = wrapDeg(-wrapDeg(this.trackDeg() - a.hdgDeg) * side);
    const lim = this.locIntercept(Math.abs(loc.across), v, turnR);
    const limit = lim.deg;
    // the closing angle to fly: the limit, but never more than straight at the line, unless already
    // turning in from further round (outbound), where it only ever comes down
    const want = Math.min(limit, Math.max(90, closing - 20));
    // on the turn's circle, the bank that flies it, so the autopilot does not lag behind the curve
    const onCircle = lim.circle && want === limit;
    const turnIn = (h) => onCircle ? Math.sign(wrapDeg(a.hdgDeg - h)) * Math.atan(v * v / (SIM.GRAVITY * turnR)) : 0;
    if (!this.locCaptured) {
      const iaf = World.at(a, -a.half - iafD, 0);
      const nearIaf = Math.hypot(st.pos.x - iaf.x, st.pos.z - iaf.z) < Math.max(1.5 * NM, turnR * 1.2);
      // (far enough out that the turn ends established on the final)
      const inZone = before > SIM.LOC_MIN_EST_NM * NM + turnR && before < iafD + 3 * NM &&
        Math.abs(loc.across) < Math.max(1200, before * 0.3, turnR * 2.5);
      if (nearIaf || (inZone && closing >= limit - 3) || (inZone && Math.abs(loc.across) < 150 && Math.abs(closing) < 20)) {
        this.locCaptured = true;
        this.info(tr('Localiser captured — runway {rwy}', { rwy: a.rwyName }));
      }
    }
    if (this.locCaptured) {
      // the autopilot flies this as a track, so the wind drift is taken out too
      const hdg = (a.hdgDeg - side * want + 720) % 360;
      return { hdg, onFinal: true, bank: turnIn(hdg) };
    }
    // to the fix; from the runway side, heading out, to the entry point beside it instead
    let p = World.at(a, -a.half - iafD, 0);
    if (Math.abs(wrapDeg(bearingDeg(st.pos.x, st.pos.z, p.x, p.z) - a.hdgDeg)) > 100) {
      p = World.at(a, -a.half - iafD, side * turnR * 1.9);
      if (Math.hypot(st.pos.x - p.x, st.pos.z - p.z) < turnR * 1.5) {
        this.locCaptured = true;
        this.info(tr('Localiser captured — runway {rwy}', { rwy: a.rwyName }));
        const hdg = (a.hdgDeg - side * want + 720) % 360;
        return { hdg, onFinal: true, bank: turnIn(hdg) };
      }
    }
    return { hdg: bearingDeg(st.pos.x, st.pos.z, p.x, p.z), onFinal: false };
  },
  // the turn the localiser intercept plans on at this ground speed (m): the autopilot's turn
  // radius with the safety margin, plus the way flown while rolling into the bank (longer for a
  // heavy that rolls slowly)
  apTurnRadius(v) {
    return v * v / (SIM.GRAVITY * Math.tan(SIM.AP_BANK_DEG * DEG)) * SIM.LOC_TURN_MARGIN +
      v * SIM.AP_ROLL_IN_S * SIM.AP_ROLL_IN_REF / this.ac.rollRate;
  },
  // The steepest closing angle (deg, 0…180) at `across` metres from the centreline: no steeper
  // than the turn can still take out (a circle of radius turnR), and close to the line no
  // steeper than closing the gap in LOC_TIME_S seconds (a smooth, damped join).
  // {deg, circle: the turn's circle is what limits it}
  locIntercept(across, v, turnR) {
    const circle = Math.acos(clamp(1 - across / turnR, -1, 1)) * RAD;
    const gentle = Math.asin(clamp(across / (SIM.LOC_TIME_S * v), 0, 1)) * RAD;
    const g = gentle < 89.9 ? gentle : 180;
    return circle < g ? { deg: circle, circle: true } : { deg: g, circle: false };
  },
  // inside the arrival's cleared approach corridor (see Terrain.flattenAirports)?
  onCorridor() {
    const a = this.arrival;
    const loc = World.local(a, this.st.pos.x, this.st.pos.z);
    const before = -(loc.t + a.half);
    return before > -a.rwyLen && before < LAYOUT.CORRIDOR_LEN * 0.8 &&
      Math.abs(loc.across) < LAYOUT.CORRIDOR_HALF_WIDTH + Math.max(0, before) * 0.12;
  },

  bearingToTarget() {
    if (this.navFailed) return null;
    const g = this.guidance;
    if (this.st.onGround && g && g.visible) return g.bearing;
    return this.navTarget().hdg;
  },
  targetName() {
    return this.st.onGround ? (this.phase === 'EXIT' ? 'GATE' : 'RWY') : this.arrival.id;
  },
  targetDistNm() {
    return this.st.onGround ? 0 : this.distToRunwayNm();
  },

  // the highest ground ahead along the track (and a little to each side), plus a margin: metres MSL
  safeAltitude() {
    const st = this.st;
    const h = this.st.onGround ? this.st.hdg : Math.atan2(st.vel.x, -st.vel.z);
    const fx = hdgX(h), fz = hdgZ(h);
    let top = 0;
    for (let d = 0; d <= SIM.MSA_LOOKAHEAD_M; d += 1000) {
      for (const side of [-1500, 0, 1500]) {
        const x = st.pos.x + fx * d - fz * side, z = st.pos.z + fz * d + fx * side;
        top = Math.max(top, Terrain.surfaceAt(x, z));
      }
    }
    return top + SIM.MSA_MARGIN_M;
  },

  // ground proximity: the ground where the aeroplane will be in a few seconds
  terrainAhead() {
    const st = this.st, k = SIM.GPWS_LOOKAHEAD_S;
    const gx = st.pos.x + st.vel.x * k, gz = st.pos.z + st.vel.z * k;
    const ground = Math.max(Terrain.surfaceAt(gx, gz), Terrain.surfaceAt((st.pos.x + gx) / 2, (st.pos.z + gz) / 2));
    return st.pos.y - st.gearH + st.vel.y * k * 0.5 - ground;
  },

  // How far above the descent profile, ft: DESCENT_NM_PER_KFT nm per 1 000 ft, down to 2 500 ft
  // over the arrival DESCENT_END_NM out, where the localiser and the glideslope take over
  aboveProfileFt() {
    const profile = Math.max(0, this.distToRunwayNm() - SIM.DESCENT_END_NM) / SIM.DESCENT_NM_PER_KFT * 1000 + 2500;
    return (this.st.pos.y - this.arrival.elev) / FT - profile;
  },
  // the autopilot works the speed brake on the descent; the pilot's lever is left alone
  apSpeedBrake(out) {
    const st = this.st, ap = this.ap;
    if (out && !st.spoiler) {
      st.spoiler = 1; ap.spoiler = true;
      this.info(tr('Autopilot: speed brake out — high on the descent'));
    } else if (!out && ap.spoiler) {
      ap.spoiler = false;
      if (st.spoiler) { st.spoiler = 0; this.info(tr('Autopilot: speed brake in')); }
    }
  },
  // The autopilot's speed (IAS, kt). A constant indicated speed low down (the cruise speed's IAS
  // at the cruise level), the cruise TAS higher up. From the top of descent it slows in steps,
  // like a real arrival: 250 kt below 10 000 ft, then down towards the approach speed as the
  // runway gets closer (Vref + 50 at 20 nm, so the first flaps can go out on the localiser),
  // Vref + 30 on the approach and Vref + 5 in the last 5 nm. Never faster than the flaps and the
  // gear allow, never slower than 1.35 × the stall speed.
  apSpeedTarget() {
    const st = this.st, ac = this.ac;
    const sigma = this.density(st.pos.y) / SIM.RHO_SL;
    const cruiseIas = ac.cruiseTas * Math.sqrt(this.density(ac.cruiseAlt) / SIM.RHO_SL);
    let target = Math.min(ac.cruiseTas * Math.sqrt(sigma), cruiseIas, ac.vne * 0.9);
    const nm = this.distToRunwayNm(), vref = this.vRef();
    if (this.phase === 'DESCENT') {
      if (st.pos.y - this.arrival.elev < SIM.AP_SLOW_BELOW_FT * FT) target = Math.min(target, SIM.AP_SLOW_KT);
      target = Math.min(target, vref + 50 + Math.max(0, nm - 20) * 6);
    }
    if (this.phase === 'APPROACH') target = Math.min(target, vref + (nm < 5 ? 5 : 30));
    target = Math.min(target, this.flapVfeNow() - 8, st.gear > 0.05 ? ac.vlo : 999);
    return Math.max(target, this.vsNow() * 1.35, this.phase === 'APPROACH' ? vref : 0);
  },

  // the autopilot's best climb rate here (m/s): less the higher it is (SIM.AP_CEILING_RATIO)
  apClimbRate() {
    const ac = this.ac;
    return ac.climbRate * clamp(1 - this.st.pos.y / (ac.cruiseAlt * SIM.AP_CEILING_RATIO), SIM.AP_CLIMB_MIN_SHARE, 1);
  },

  // ---------- autopilot ----------
  // HDG / NAV laterally (NAV flies to the final fix and captures the localiser),
  // ALT hold or G/S vertically, and an autothrottle on the speed.
  updateAutopilot(dt) {
    const st = this.st, ap = this.ap, ac = this.ac;
    if (!ap.on) { ap.lastIas = undefined; this.apSpeedBrake(false); return; }
    if (st.onGround) { ap.on = false; return; }
    const ias = st.ias / KTS;

    // lateral
    let onFinal = false, bankFF = 0;
    if (ap.nav && !this.navFailed) {
      const n = this.navTarget();
      ap.hdg = Math.round(n.hdg);
      onFinal = n.onFinal;
      bankFF = n.bank || 0;
    }
    // on the localiser the command is a track, so fly the track (the heading crabs into the wind)
    const hdgErr = wrapDeg(ap.hdg - (onFinal ? this.trackDeg() : this.headingDeg()));
    const bankT = clamp(hdgErr * 1.2 + bankFF * RAD, -SIM.AP_BANK_DEG, SIM.AP_BANK_DEG) * DEG;
    st.aileron = clamp((bankT - st.roll) * 2.2 - st.rollRate * 0.8, -1, 1);
    st.rudder = 0;

    // the speed to fly (the autothrottle below, and the pitch in an idle descent)
    const spdT = this.apSpeedTarget();
    ap.speed = spdT;
    // high on the descent and still fast: the speed brake goes out, and in again on the profile
    if (this.phase === 'DESCENT') {
      const above = this.aboveProfileFt();
      // (not while the terrain holds it up: high above the profile then, it climbed with the speed
      // brake out, slowed and stalled)
      const msaHolds = (this.msa || 0) > st.pos.y - 300;
      if (above > SIM.AP_SPEEDBRAKE_HIGH_FT && ias > spdT - 5 && !msaHolds) this.apSpeedBrake(true);
      else if (msaHolds) this.apSpeedBrake(false);
      else if (above < 0) this.apSpeedBrake(false);
    } else this.apSpeedBrake(false);

    // vertical
    let vsT, idleDescent = false;
    const ils = this.ilsDeviation();
    // the glideslope is captured from below (or when already on it), never chased up from far below
    const corridor = onFinal && this.onCorridor();
    if (corridor && (ap.gs || (ils.along < 0 && ils.gsDeg > -0.25 && ils.gsDeg < SIM.GS_CAPTURE_ABOVE_DEG && ils.dist < (SIM.FINAL_FIX_NM + 4) * NM))) {
      if (!ap.gs) { ap.gs = true; this.info(tr('Glideslope captured')); }
      const gsV = -st.tas * Math.sin(SIM.GLIDESLOPE_DEG * DEG);
      vsT = gsV + (ils.targetAlt - (st.pos.y - st.gearH)) * 0.12;
      if (this.altAgl() < 60) {
        ap.on = false; ap.gs = false;
        this.warn('AP', tr('Autopilot disconnect — decision height, land it by hand'));
        return;
      }
      vsT = clamp(vsT, -15, 5);
    } else {
      // never below the minimum safe altitude over the terrain ahead
      this.msaT = (this.msaT || 0) - dt;
      if (this.msaT <= 0) { this.msaT = 1; this.msa = this.safeAltitude(); }
      // (off only once established in the approach corridor, where the ground is kept clear)
      const target = Math.max(ap.alt * FT, corridor ? 0 : this.msa || 0);
      if (target > ap.alt * FT + 30 && this.realElapsed - (this.msaWarnT || -99) > 30) {
        this.msaWarnT = this.realElapsed;
        this.info(tr('Terrain ahead — the autopilot holds {alt} ft', { alt: fmtAltFt(Math.ceil(target / FT / 100) * 100) }));
      }
      vsT = clamp((target - st.pos.y) * 0.05, -11, this.apClimbRate());
      // a climb (for the terrain, or back up to the selected altitude) only as steep as the
      // spare speed allows: never down to the stall — low and slow with the gear out, a full
      // climb rate up to a new safe altitude stalled the aeroplane and dropped the autopilot
      if (vsT > 0) vsT = Math.min(vsT, Math.max(0, ias - this.vsNow() * 1.3) * 0.35);
      // a descent like a real autopilot's: the thrust at idle and the speed on the elevator, so
      // when the aeroplane is faster than it should be the descent gets shallower (down to level
      // flight) until the drag has taken the extra speed off
      idleDescent = target - st.pos.y < -SIM.AP_IDLE_DESCENT_M;
      const over = ias - spdT;
      if (vsT < 0 && over > 0) vsT = Math.min(vsT + over * SIM.AP_DESCENT_SPEED_GAIN, 0.5);
    }
    // never trade the last of the speed for height
    const vs = this.vsNow();
    if (ias < vs * 1.25) vsT = Math.min(vsT, -1);
    const e = vsT - st.vel.y;
    ap.vsI = clamp(ap.vsI + e * dt, -20, 20);
    st.elevator = clamp(e * 0.09 + ap.vsI * 0.02 - st.pitchRate * 1.5, -0.8, 0.8);

    // autothrottle
    const target = spdT;
    // A smooth loop: the speed error moves the thrust levers, the speed trend (smoothed) damps
    // them, so they lead the slow engines instead of hunting between idle and full; the levers
    // move at most 12 % a second, like a real autothrottle.
    if (ap.lastIas === undefined) { ap.lastIas = ias; ap.accF = 0; }
    ap.accF += ((ias - ap.lastIas) / dt - ap.accF) * Math.min(1, dt / 1.5);
    ap.lastIas = ias;
    const want = idleDescent && ias > target - 10 ? -1                // idle in the descent (thrust only if far too slow)
      : (target - ias) * 0.03 - ap.accF * 0.35 - (e < -4 ? 0.3 : 0);
    st.throttle = clamp(st.throttle + clamp(want, -1, 1) * 0.12 * dt, 0, 1);
    if (st.stallWarn) { ap.on = false; this.warn('AP', tr('Autopilot disconnect — stall warning')); }
  }
};

function pointSegDist(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az;
  const len2 = dx * dx + dz * dz || 1;
  let t = ((px - ax) * dx + (pz - az) * dz) / len2;
  t = clamp(t, 0, 1);
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
}
