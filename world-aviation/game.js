'use strict';

// ============================================================
// World Aviation — the game: boot, main loop, the phase machine
// from the gate to the gate, and the wiring between input,
// flight model, systems, scene, HUD and screens.
// ============================================================

const AIRBORNE_PHASES = ['TAKEOFF', 'CLIMB', 'CRUISE', 'DESCENT', 'APPROACH'];

const Game = {
  mode: 'boot',            // boot | menu | ops | briefing | flying | debrief | failed | paused
  last: 0,
  flight: null,
  systems: null,
  setup: null,
  contract: null,
  res: null,
  cheated: false,
  cheatsUsed: 0,
  fuel0: 0,
  pushback: null,
  failure: null,
  camMode: 'cockpit',
  fps: 60, fpsAcc: 0, fpsN: 0,
  quality: 'medium',
  helpOpen: false,

  // ---------- boot ----------
  async boot() {
    if (this.booted) return;
    this.booted = true;
    HUD.init();
    UI.init();
    Input.init();
    Career.loadSettings();
    this.quality = pickQuality(Career.settings.quality);
    Audio2.setMuted(!Career.settings.sound);
    Cockpit.init();

    try {
      Scene3D.init(el('scene3d'));
    } catch (err) {
      const box = el('webglError');
      box.hidden = false;
      el('bootScreen').hidden = true;
      const p = box.querySelector('p');
      if (p) p.textContent = 'World Aviation renders the cockpit view with WebGL (' +
        (err && err.message ? err.message : 'unknown error') + '). Enable hardware acceleration in your browser, or try another one.';
      return;
    }
    World.init();
    Scene3D.setQuality(this.quality);
    Scene3D.resize();
    el('bootStatus').textContent = 'Ready';
    await frame();

    Input.onAction = (name, arg) => this.action(name, arg);
    window.addEventListener('resize', () => { Scene3D.resize(); });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.mode === 'flying') this.pause();
    });

    Career.load();
    this.last = performance.now();
    this.mode = 'menu';
    el('bootScreen').hidden = true;
    UI.showTitle();
    this.loop();
  },

  // ---------- main loop ----------
  loop() {
    requestAnimationFrame(() => this.loop());
    const now = performance.now();
    let dt = (now - this.last) / 1000;
    this.last = now;
    dt = clamp(dt, 0, SIM.MAX_FRAME_DT);
    this.fpsAcc += dt; this.fpsN++;
    if (this.fpsAcc > 0.5) {
      this.fps = this.fpsN / this.fpsAcc; this.fpsAcc = 0; this.fpsN = 0;
      if (this.mode === 'flying') this.autoQuality();
      const fe = el('fps');
      if (fe) fe.textContent = Math.round(this.fps) + ' fps · ' + Scene3D.quality.name;
    }
    if (this.mode === 'flying') this.frame(dt);
    else if (this.mode === 'paused' && this.flight) {
      Scene3D.render();
      this.draw2d(0);
    }
  },

  frame(dt) {
    const fl = this.flight, sys = this.systems, st = fl.st;
    const paused = this.helpOpen;
    const ax = Input.axes();

    if (!paused) {
      // controls (the autopilot flies the surfaces when it is engaged)
      if (!fl.ap.on) {
        st.elevator = ax.pitch;
        st.aileron = ax.roll;
        st.rudder = ax.rudder;
        // on the ground the arrows / the stick steer the nosewheel too
        if (st.onGround && !ax.rudder) st.rudder = ax.roll;
      } else if (Math.abs(ax.pitch) > 0.5 || Math.abs(ax.roll) > 0.5) {
        fl.ap.on = false;
        fl.warn('AP', 'Autopilot disconnected — you have control');
      }
      if (ax.throttle) fl.setThrottle(st.throttle + ax.throttle * dt * 0.45);
      if (Input.touchThrottle !== null) fl.setThrottle(approach(st.throttle, Input.touchThrottle, dt * 0.8));
      st.brakeInput = ax.brake;

      if (fl.phase === 'PUSHBACK') this.updatePushback(dt);
      const simDt = fl.update(dt);
      sys.update(simDt);
      this.updatePhase(dt);
      this.updateGuidance();
    }

    Scene3D.camMode = this.camMode;
    Scene3D.update(dt, fl, sys);
    Scene3D.render();
    this.draw2d(dt);
    Audio2.update(dt, fl, sys);

    // messages and panels
    while (fl.events.length) HUD.push(fl.events.shift());
    HUD.render();
    HUD.updateStrip(fl, sys, this.res);
    HUD.updateChecklist(sys, this.hintOn());
    HUD.updateGuidance(fl, dt);
    if (HUD.mapOpen) HUD.drawMap(fl, sys);

    if (fl.failure && this.mode === 'flying') this.failFlight(fl.failure);
  },

  hintOn() { return !!(Career.difficulty.qrhHint || (this.systems && this.systems.hint)); },

  draw2d(dt) {
    const c = el('ui');
    const ctx = this.ctx2d || (this.ctx2d = c.getContext('2d'));
    const w = window.innerWidth, h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (this.uiW !== w || this.uiH !== h || this.uiDpr !== dpr) {
      this.uiW = w; this.uiH = h; this.uiDpr = dpr;
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    const fl = this.flight;
    if (!fl) return;
    Cockpit.draw(ctx, w, h, dpr, fl, this.systems, dt, this.camMode === 'cockpit');
    Instruments.draw(ctx, w, h, dpr, fl, this.systems);
    ctx.save();
    ctx.scale(dpr, dpr);
    this.drawFpm(ctx, w, h, fl);
    this.drawIls(ctx, w, h, fl);
    ctx.restore();
  },

  // localiser / glideslope needles
  drawIls(ctx, w, h, fl) {
    if (fl.phase !== 'APPROACH' && fl.phase !== 'DESCENT') return;
    if (fl.distToRunwayNm() > SIM.APPROACH_NM + 4 || fl.navFailed) return;
    const d = fl.ilsDeviation();
    if (d.along > 0) return;
    const cx = w / 2, cy = Cockpit.panelTop(h) * 0.5;
    const R = Math.min(110, w * 0.16), V = Math.min(80, h * 0.12);
    ctx.save();
    ctx.strokeStyle = 'rgba(216,226,236,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - R, cy + V + 14); ctx.lineTo(cx + R, cy + V + 14);
    ctx.moveTo(cx + R + 14, cy - V); ctx.lineTo(cx + R + 14, cy + V);
    ctx.stroke();
    for (const k of [-1, -0.5, 0.5, 1]) {
      ctx.beginPath(); ctx.arc(cx + k * R, cy + V + 14, 2.5, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx + R + 14, cy + k * V, 2.5, 0, TAU); ctx.stroke();
    }
    // localiser diamond: where the runway is (right of you = needle right)
    const loc = clamp(-d.locDeg / 2.5, -1, 1);
    const gs = clamp(-d.gsDeg / 0.7, -1, 1);
    const diamond = (x, y, col) => {
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.moveTo(x, y - 7); ctx.lineTo(x + 6, y); ctx.lineTo(x, y + 7); ctx.lineTo(x - 6, y); ctx.closePath(); ctx.fill();
    };
    diamond(cx + loc * R, cy + V + 14, Math.abs(loc) >= 1 ? '#ff7a5c' : '#e65cf0');
    diamond(cx + R + 14, cy - gs * V, Math.abs(gs) >= 1 ? '#ff7a5c' : '#e65cf0');
    ctx.fillStyle = '#c8d2dc';
    ctx.font = '600 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LOC', cx - R - 18, cy + V + 18);
    ctx.fillText('G/S', cx + R + 14, cy - V - 8);
    if (Math.abs(d.gsDeg) < 0.25 && Math.abs(d.locDeg) < 0.6) {
      ctx.fillStyle = '#54d68a';
      ctx.font = '700 13px system-ui, sans-serif';
      ctx.fillText('ON GLIDE PATH', cx, cy - V - 8);
    }
    ctx.restore();
  },

  // flight path marker: where the aeroplane is actually going
  drawFpm(ctx, w, h, fl) {
    const st = fl.st;
    if (st.onGround || this.camMode !== 'cockpit') return;
    const ax = st.axes;
    const v = st.vel;
    const vf = v.x * ax.nose.x + v.y * ax.nose.y + v.z * ax.nose.z;
    if (vf < 5) return;
    const vu = v.x * ax.up.x + v.y * ax.up.y + v.z * ax.up.z;
    const vr = v.x * ax.right.x + v.y * ax.right.y + v.z * ax.right.z;
    const cam = Scene3D.camera;
    const f = (h / 2) / Math.tan(cam.fov * DEG / 2);
    // the cockpit camera looks a little below the nose
    const x = w / 2 + vr / vf * f;
    const y = h / 2 - (vu / vf - 0.06) * f;
    if (y > Cockpit.panelTop(h) - 10) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-st.roll);
    ctx.strokeStyle = '#54d68a';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-18, 0); ctx.lineTo(-7, 0); ctx.moveTo(18, 0); ctx.lineTo(7, 0); ctx.moveTo(0, -7); ctx.lineTo(0, -14);
    ctx.stroke();
    ctx.restore();
    // stall margin and fuel callouts
    const margin = fl.stallMargin();
    ctx.textAlign = 'center';
    ctx.font = '700 13px system-ui, sans-serif';
    if (margin < 12) {
      ctx.fillStyle = margin < 4 ? '#ff4d3d' : '#ffb03a';
      ctx.fillText(margin < 0 ? 'STALL' : 'SPEED  +' + Units.spd(margin), w / 2, Cockpit.panelTop(h) - 60);
    }
  },

  // ---------- pushback: the tug pushes you back onto the apron lane ----------
  updatePushback(dt) {
    const fl = this.flight, st = fl.st, p = this.pushback;
    p.t += dt;
    const k = smoothstep(0, 1, clamp(p.t / SIM.PUSHBACK_S, 0, 1));
    const turn = smoothstep(0.25, 1, clamp(p.t / SIM.PUSHBACK_S, 0, 1));
    const x = lerp(p.x0, p.x1, k), z = lerp(p.z0, p.z1, k);
    st.vel.x = 0; st.vel.z = 0;
    st.pos.x = x; st.pos.z = z;
    st.hdg = lerpAngle(p.h0, p.h1, turn);
    st.parkingBrake = false;
    if (p.t >= SIM.PUSHBACK_S) {
      st.parkingBrake = true;
      fl.setPhase('ENGINE_START');
      fl.info('Push back complete — tug disconnected, parking brake set');
    }
  },

  // ---------- the phase machine ----------
  updatePhase(dt) {
    const fl = this.flight, sys = this.systems, st = fl.st;
    const p = fl.phase;
    const speed = fl.groundSpeedKt();
    const apt = fl.world, arr = fl.arrival;

    // a touchdown at the destination ends the flying part, whatever the phase says
    if (AIRBORNE_PHASES.includes(p) && st.onGround && st.wasAirborne) {
      if (fl.nearestApt() === arr && fl.landed) { fl.setPhase('ROLLOUT'); return; }
      if (fl.nearestApt() === apt && speed < 30) {
        fl.fail('returned', 'You landed back at ' + apt.id + ' — the load was not delivered.');
        return;
      }
    }

    if (p === 'GATE') {
      HUD.setPrompt('<b>' + apt.id + ' · ' + this.flight.startGate.name + '</b> · doors closed, ready to go<br>' +
        'press <kbd>Enter</kbd> to call the tug for push back');
    } else if (p === 'PUSHBACK') {
      HUD.setPrompt('<b>Push back</b> · the tug is pushing you onto the apron<br>' +
        (sys.started ? 'engines starting' : 'you can start the engines now — <kbd>Enter</kbd>'));
    } else if (p === 'ENGINE_START') {
      const all = sys.runningCount() === fl.ac.engines;
      HUD.setPrompt(all
        ? '<b>Engines running</b><br>press <kbd>Enter</kbd> to release the parking brake and taxi'
        : sys.started ? '<b>Starting</b> · watch the N1 and EGT gauges' : '<b>Start the engines</b><br>press <kbd>Enter</kbd>');
    } else if (p === 'TAXI_OUT') {
      const g = fl.guidance;
      const hold = apt.nodes.hold;
      const dHold = Math.hypot(st.pos.x - hold.x, st.pos.z - hold.z);
      if (dHold < 30) {
        fl.setPhase('HOLD_SHORT');
        fl.info('Holding point runway ' + apt.rwyName + ' — stop and wait for the clearance');
      }
      HUD.setPrompt('<b>Taxi</b> to the holding point of runway ' + apt.rwyName +
        ' · throttle <kbd>1</kbd>–<kbd>3</kbd>, steer <kbd>←</kbd><kbd>→</kbd>, brake <kbd>B</kbd>' +
        (g && g.visible ? '<br>' + fmtDist(g.remaining) + ' to go' : '') +
        (speed > 25 ? ' · <b class="bad">too fast — keep below 20 kt</b>' : ''));
    } else if (p === 'HOLD_SHORT') {
      HUD.setPrompt('<b>Holding point runway ' + apt.rwyName + '</b>' + (speed > 2 ? ' · <b>stop here</b>' : '') +
        '<br>set flaps ' + this.takeoffFlaps() + ' <kbd>F</kbd>, then <kbd>Enter</kbd> for the take-off clearance');
    } else if (p === 'TAKEOFF') {
      const vr = Math.round(fl.vr());
      HUD.setPrompt(st.onGround
        ? '<b>Runway ' + apt.rwyName + ' · cleared for take-off</b><br>line up, full power <kbd>9</kbd>, rotate at Vr ' + vr +
          ' kt — pull back <kbd>↓</kbd>' + (st.flapsTarget < 1 ? ' · <b>flaps!</b>' : '')
        : '<b>Positive climb</b> · gear up <kbd>G</kbd>');
      if (!st.onGround && fl.altAgl() > 150) {
        fl.setPhase('CLIMB');
        fl.ap.alt = this.cruiseAltFt();
        fl.info('Climb to ' + fmtAltFt(fl.ap.alt) + ' ft — engage the autopilot with Y');
      }
    } else if (p === 'CLIMB') {
      HUD.setPrompt('<b>Climb</b> to ' + fmtAltFt(fl.ap.alt) + ' ft' +
        (st.gearTarget === 1 ? ' · gear up <kbd>G</kbd>' : '') + (st.flapsTarget > 0 && st.ias / KTS > fl.vr() + 25 ? ' · flaps up <kbd>V</kbd>' : '') +
        (!fl.ap.on ? ' · autopilot <kbd>Y</kbd>' : ''));
      if (Math.abs(st.pos.y / FT - fl.ap.alt) < 300) {
        fl.setPhase('CRUISE');
        fl.info('Cruise · time acceleration T');
      }
      if (fl.distToDestNm() < this.descentNm()) this.startDescent();
    } else if (p === 'CRUISE') {
      HUD.setPrompt('<b>Cruise · ' + Math.round(fl.distToDestNm()) + ' nm to ' + arr.id + '</b><br>' +
        (fl.ap.on ? 'autopilot NAV · time acceleration <kbd>T</kbd> (x' + fl.env.timeAccel + ')' : 'autopilot <kbd>Y</kbd> flies the route') +
        (this.res && fl.realElapsed > this.res.deadline * 0.75 ? ' · <b class="bad">running late</b>' : ''));
      if (fl.distToDestNm() < this.descentNm()) this.startDescent();
    } else if (p === 'DESCENT') {
      HUD.setPrompt('<b>Descent</b> to ' + fmtAltFt(fl.ap.alt) + ' ft · ' + Math.round(fl.distToRunwayNm()) + ' nm to runway ' + arr.rwyName);
      fl.navTarget();                                   // keeps the localiser capture up to date
      if (fl.locCaptured && fl.distToRunwayNm() < SIM.APPROACH_NM) {
        fl.setPhase('APPROACH');
        if (fl.timeAccelIndex || fl.cheatAccel) { fl.timeAccelIndex = 0; fl.cheatAccel = false; fl.info('TIME x1'); }
        fl.info('Approach runway ' + arr.rwyName + ' · Vref ' + Math.round(fl.vRef()) + ' kt · flaps and gear down');
      }
    } else if (p === 'APPROACH') {
      const nm = fl.distToRunwayNm();
      const need = [];
      if (st.flapsTarget < fl.ac.flaps.length && nm < 8) need.push('flaps <kbd>F</kbd>');
      if (st.gearTarget < 1 && nm < 7) need.push('<b>gear down</b> <kbd>G</kbd>');
      HUD.setPrompt('<b>Approach · runway ' + arr.rwyName + '</b> · ' + nm.toFixed(1) + ' nm · Vref ' + Math.round(fl.vRef()) + ' kt' +
        (need.length ? '<br>' + need.join(' · ') : (fl.ap.on ? '<br>autopilot flies the ILS down to 200 ft' : '')));
      if (nm < 1.5 && fl.altAgl() < 90 && st.gearTarget < 1) fl.warn('TOOLOWGEAR', 'TOO LOW — GEAR');
      // over the runway and still flying at its far end: go around and try again
      const loc = World.local(arr, st.pos.x, st.pos.z);
      const overRunway = Math.abs(loc.across) < 400 && loc.t > -arr.half && loc.t < arr.half;
      if (overRunway && !st.onGround) fl.overRunway = true;
      if (fl.overRunway && !st.onGround && loc.t > arr.half - 150) {
        fl.warn('GOAROUND', 'Go around — climb, and fly the approach again');
        fl.overRunway = false; fl.locCaptured = false; fl.ap.gs = false;
        fl.ap.alt = Math.round((arr.elev + 2500 * FT) / FT / 100) * 100;
        fl.setPhase('DESCENT');
      }
    } else if (p === 'ROLLOUT') {
      HUD.setPrompt('<b>Touchdown ' + (fl.landed ? fl.landed.fpm + ' fpm' : '') + '</b><br>' +
        'idle <kbd>0</kbd>, brakes <kbd>B</kbd>, spoiler <kbd>R</kbd> — slow below ' + SIM.ROLLOUT_EXIT_KT + ' kt');
      if (!st.onGround && fl.altAgl() > 15) {
        // touch-and-go: the next landing is the one that counts
        fl.landed = null;
        fl.setPhase('APPROACH');
      } else if (st.onGround && speed < SIM.ROLLOUT_EXIT_KT) {
        this.beginTaxiIn();
      }
    } else if (p === 'EXIT') {
      const gate = this.arrivalGate;
      const d = Math.hypot(st.pos.x - gate.standX, st.pos.z - gate.standZ);
      const align = Math.abs(wrapDeg(fl.headingDeg() - gate.parkHdg));
      const inBox = d < SIM.PARK_RADIUS_M && align < SIM.PARK_ALIGN_DEG;
      if (inBox && speed < 1.5) {
        if (!st.parkingBrake) HUD.setPrompt('<b>In the parking box</b><br>set the parking brake — <kbd>Space</kbd>');
        else {
          fl.setPhase('SHUTDOWN');
          sys.stopEngines();
          fl.info('Parking brake set — engines shutting down');
        }
      } else {
        HUD.setPrompt('<b>Taxi to ' + gate.name + '</b> · follow the arrow, keep below 20 kt' +
          (d < 80 ? '<br>stop on the stop bar — ' + Math.round(d) + ' m' + (align > SIM.PARK_ALIGN_DEG ? ', straighten up' : '') : ''));
      }
    } else if (p === 'SHUTDOWN') {
      HUD.setPrompt('<b>Shutting down</b> · ' + fl.ac.name + ' at ' + this.arrivalGate.name);
      if (sys.allStopped) fl.setPhase('PARKED');
    } else if (p === 'PARKED') {
      HUD.setPrompt('');
      if (!this.debriefShown) { this.debriefShown = true; this.finishFlight(false); }
    }

    // fuel starvation
    if (st.fuel <= 0.5 && !st.onGround) fl.warn('FUEL', 'Out of fuel — glide to the nearest field');
    // ground proximity: not on a stable final, where the ground is meant to come up
    if (!st.onGround && fl.altAgl() > 30 && !(p === 'APPROACH' && fl.onCorridor()) && p !== 'TAKEOFF' && fl.terrainAhead() < 120) {
      fl.warn('TERRAIN', 'TERRAIN — PULL UP');
    }
  },

  takeoffFlaps() { return this.flight.ac.flaps.length >= 5 ? 2 : 1; },
  cruiseAltFt() {
    const fl = this.flight;
    const nm = fl.routeNm();
    // short hops stay low, longer legs climb towards the type's cruise level
    const ft = clamp(nm * 120, 6000, fl.ac.cruiseAlt / FT * (nm > 250 ? 0.92 : 0.55));
    return Math.round((Math.max(ft, (Math.max(fl.world.elev, fl.arrival.elev) + 1500) / FT)) / 500) * 500;
  },
  // how far out the descent starts: 3 nm per 1 000 ft to lose, at least DESCENT_START_NM
  descentNm() {
    const fl = this.flight;
    const lose = fl.st.pos.y / FT - (fl.arrival.elev / FT + 2500);
    return Math.max(SIM.DESCENT_START_NM, lose / 1000 * 3.2 + 12);
  },
  // the altitude the flight plan wants now: the cruise level until the top of descent, then
  // 2 500 ft above the arrival for the approach
  programAltFt() {
    const fl = this.flight, arr = fl.arrival;
    if (fl.phase === 'DESCENT' || fl.phase === 'APPROACH') return Math.round((arr.elev + 2500 * FT) / FT / 100) * 100;
    return this.cruiseAltFt();
  },
  startDescent() {
    const fl = this.flight, arr = fl.arrival;
    fl.setPhase('DESCENT');
    fl.ap.alt = Math.round((arr.elev + 2500 * FT) / FT / 100) * 100;
    this.applyArrivalWeather();
    fl.info('Top of descent — ' + arr.id + ' runway ' + arr.rwyName + ', descend to ' + fmtAltFt(fl.ap.alt) + ' ft');
  },
  applyArrivalWeather() {
    const env = this.flight.env, w = this.setup.weather.arr;
    env.surfaceWind = { dir: w.dir, speed: w.speed };
    env.turb = w.turbulence;
    env.qnh = w.qnh; env.temp = w.temp; env.vis = w.vis;
    env.cloudBase = this.flight.arrival.elev + w.cloudBase;
    env.cloudTop = this.flight.arrival.elev + w.cloudTop;
    env.precip = w.precip; env.snowy = w.snow;
  },

  beginTaxiIn() {
    const fl = this.flight, a = fl.arrival, st = fl.st;
    const loc = World.local(a, st.pos.x, st.pos.z);
    const exit = World.exitAhead(a, loc.t);
    this.arrivalRoute = World.findRoute(a, exit, this.arrivalGate.node);
    fl.setPhase('EXIT');
    fl.info('Leave the runway at the next exit and taxi to ' + this.arrivalGate.name);
  },

  // ---------- guidance ----------
  updateGuidance() {
    const fl = this.flight, st = fl.st;
    if (!fl.guidance) fl.guidance = { visible: false, bearing: 0, dist: 0, remaining: 0 };
    const g = fl.guidance;
    g.visible = false;
    let target = null;
    const p = fl.phase;
    const look = Math.max(30, fl.dims.len * 0.65);         // pure pursuit: a carrot ahead on the taxi line
    if (p === 'TAXI_OUT' || p === 'ENGINE_START') {
      const prog = World.routeProgress(fl.world, fl.route, st.pos.x, st.pos.z, look);
      if (prog && p === 'TAXI_OUT') { target = prog.carrot; g.remaining = prog.remaining; g.deviation = prog.deviation; }
    } else if (p === 'HOLD_SHORT') {
      target = fl.world.nodes.hold;
      if (Math.hypot(target.x - st.pos.x, target.z - st.pos.z) < 12) target = null;
    } else if (p === 'TAKEOFF' && st.onGround) {
      // onto the runway at the line-up point, then straight down the centreline
      const a = fl.world;
      const loc = World.local(a, st.pos.x, st.pos.z);
      const start = a.nodes.rwyStart;
      if (Math.abs(loc.across) > 12 && loc.t < start.t + 40) target = World.at(a, start.t + 15, 0);
      else target = World.at(a, Math.max(loc.t, start.t) + 300, 0);
    } else if ((p === 'EXIT' || p === 'ROLLOUT') && this.arrivalRoute) {
      const prog = World.routeProgress(fl.arrival, this.arrivalRoute, st.pos.x, st.pos.z, look);
      if (prog) {
        // into the stand: aim at the stop bar itself for the last few metres
        target = prog.remaining < look * 0.6 ? this.arrivalRoute[this.arrivalRoute.length - 1] : prog.carrot;
        g.remaining = prog.remaining; g.deviation = prog.deviation;
      }
    } else if (!st.onGround && !fl.ap.on && !fl.navFailed && (p === 'DESCENT' || p === 'APPROACH' || p === 'CRUISE')) {
      g.visible = true;
      g.bearing = fl.navTarget().hdg;
      g.dist = fl.distToRunwayNm() * NM;
      return;
    }
    if (!target) return;
    g.visible = true;
    g.bearing = bearingDeg(st.pos.x, st.pos.z, target.x, target.z);
    g.dist = (p === 'TAXI_OUT' || p === 'EXIT' || p === 'ROLLOUT') && g.remaining ? g.remaining : Math.hypot(target.x - st.pos.x, target.z - st.pos.z);

    // the taxi assist on the easy difficulty keeps you on the line
    if (Career.difficulty.taxiAssist && st.onGround && fl.groundSpeedKt() > 1 && !Input.axes().rudder && !Input.axes().roll) {
      const rel = wrapDeg(g.bearing - fl.headingDeg());
      st.rudder = clamp(rel * 0.05, -0.8, 0.8);
    }
  },

  // ---------- actions ----------
  action(name, arg) {
    if (name === 'cheat') { this.cheat(arg); return; }
    if (this.mode === 'paused') { if (name === 'pause') this.pause(); return; }
    if (this.mode !== 'flying') return;
    const fl = this.flight;
    const sys = this.systems, st = fl.st;
    switch (name) {
      case 'gear': fl.setGear(st.gearTarget < 0.5); Audio2.cue('lever'); break;
      case 'flapsDown': fl.setFlaps(st.flapsTarget + 1); Audio2.cue('lever'); break;
      case 'flapsUp': fl.setFlaps(st.flapsTarget - 1); Audio2.cue('lever'); break;
      case 'ap':
        if (st.onGround) { fl.warn('AP', 'The autopilot engages in the air only'); break; }
        fl.ap.on = !fl.ap.on;
        if (fl.ap.on) {
          fl.ap.vsI = 0;
          if (!fl.ap.nav) fl.ap.hdg = Math.round(fl.headingDeg());
          if (fl.phase === 'TAKEOFF' || fl.phase === 'CLIMB') fl.ap.alt = Math.max(fl.ap.alt, this.cruiseAltFt());
        }
        fl.info('Autopilot ' + (fl.ap.on ? 'CMD · ' + (fl.ap.nav ? 'NAV' : 'HDG ' + fl.ap.hdg) + ' · ALT ' + fmtAltFt(fl.ap.alt) : 'off'));
        Audio2.cue('click');
        break;
      case 'timeAccel': fl.cycleTimeAccel(); break;
      case 'camera':
      {
        const modes = VIEW.MODES, n = modes.length;
        this.camMode = modes[(modes.indexOf(this.camMode) + (arg === -1 ? n - 1 : 1)) % n];
        fl.info('View: ' + VIEW.NAMES[this.camMode]);
      }
        break;
      case 'map': HUD.toggleMap(); break;
      case 'brightness': Instruments.bright = Instruments.bright > 0.6 ? 0.45 : 1; break;
      case 'spoiler': fl.toggleSpoiler(); fl.info('Spoiler ' + (st.spoiler ? 'out' : 'in')); break;
      case 'antiIce':
        sys.antiIce = !sys.antiIce;
        fl.info('Engine and wing anti-ice ' + (sys.antiIce ? 'ON' : 'off'));
        break;
      case 'parkBrake':
        if (fl.phase === 'PUSHBACK') break;
        st.parkingBrake = !st.parkingBrake;
        fl.info('Parking brake ' + (st.parkingBrake ? 'set' : 'released'));
        Audio2.cue('parkbrake', st.parkingBrake);
        break;
      case 'altUp': fl.ap.alt = Math.min(fl.ap.alt + 500, 41000); fl.info('Selected altitude ' + fmtAltFt(fl.ap.alt) + ' ft'); break;
      case 'altDown': fl.ap.alt = Math.max(1000, fl.ap.alt - 500); fl.info('Selected altitude ' + fmtAltFt(fl.ap.alt) + ' ft'); break;
      case 'hdgUp': case 'hdgDown':
        if (fl.ap.nav) { fl.ap.nav = false; fl.ap.hdg = Math.round(fl.headingDeg()); }
        fl.ap.hdg = (fl.ap.hdg + (name === 'hdgUp' ? 5 : 355)) % 360;
        fl.info('Heading ' + String(fl.ap.hdg).padStart(3, '0') + '° (HDG mode — N, or NAV on the touch screen, goes back to the programme)');
        break;
      case 'nav':
        // back on the programme: NAV along the route and the altitude for this phase of the flight
        if (st.onGround) { fl.info('NAV: the autopilot flies the route once you are in the air'); break; }
        fl.ap.nav = true; fl.locCaptured = false;
        fl.ap.alt = this.programAltFt();
        if (!fl.ap.on) { fl.ap.on = true; fl.ap.vsI = 0; }
        fl.info('Autopilot back on the programme — NAV to ' + fl.arrival.id + ' · ALT ' + fmtAltFt(fl.ap.alt) + ' ft');
        Audio2.cue('click');
        break;
      case 'throttlePreset': fl.setThrottle(arg); break;
      case 'starter': this.next(); break;
      case 'pause': this.pause(); break;
      case 'help': this.helpOpen = !this.helpOpen; el('helpPanel').hidden = !this.helpOpen; break;
      default: break;
    }
  },

  // Enter / the touch "Go" button: the next step of the ground procedure
  next() {
    const fl = this.flight, sys = this.systems, st = fl.st;
    const p = fl.phase;
    if (p === 'GATE') {
      const g = fl.startGate;
      const lane = g.laneNode;
      this.pushback = {
        t: 0, x0: st.pos.x, z0: st.pos.z, x1: lane.x, z1: lane.z,
        h0: st.hdg, h1: wrapRad(fl.world.hdg + Math.PI)
      };
      fl.setPhase('PUSHBACK');
      fl.info('Ground: push back approved — brakes released');
      Audio2.cue('click');
    } else if (p === 'PUSHBACK' || (p === 'ENGINE_START' && sys.runningCount() < fl.ac.engines)) {
      if (!sys.started) sys.startEngines();
    } else if (p === 'ENGINE_START') {
      st.parkingBrake = false;
      fl.setPhase('TAXI_OUT');
      fl.info('Taxi to holding point runway ' + fl.world.rwyName + ' — follow the arrow');
    } else if (p === 'HOLD_SHORT') {
      const w = fl.env.surfaceWind;
      st.parkingBrake = false;
      fl.setPhase('TAKEOFF');
      fl.info('Tower: wind ' + String(Math.round(w.dir)).padStart(3, '0') + '° ' + Math.round(w.speed) +
        ' kt, runway ' + fl.world.rwyName + ' cleared for take-off');
    } else if (p === 'TAXI_OUT') {
      fl.warn('HOLD', 'Taxi to the holding point first');
    }
  },

  doChecklistStep(i) {
    if (!this.systems || !this.systems.checklist) return;
    this.systems.doStep(i);
  },

  // ---------- cheats ----------
  cheat(digit) {
    if (digit === 0) {
      HUD.showBanner('Cheats: Alt+1 full fuel · Alt+2 no emergencies · Alt+3 jump to final · Alt+4 +10 000 kr · ' +
        'Alt+5 repair · Alt+6 time x16', 'cheat', 7000);
      return;
    }
    const fl = this.flight;
    if (!fl || this.mode !== 'flying') return;
    this.cheated = true; this.cheatsUsed++;
    const st = fl.st;
    let text = '';
    switch (digit) {
      case 1: st.fuel = fl.ac.fuelCapKg; text = 'full fuel tanks'; break;
      case 2: this.systems.noEmergencies = true; this.systems.queue = []; text = 'emergencies disabled for this flight'; break;
      case 3: {
        const a = fl.arrival;
        const dist = 12 * NM;
        const p = World.at(a, -a.half - dist, 0);
        const spd = Math.min(fl.vRef() * 1.35, fl.ac.flaps[1].vfe - 15) * KTS;
        st.pos.x = p.x; st.pos.z = p.z;
        st.pos.y = a.elev + 15 + dist * Math.tan(SIM.GLIDESLOPE_DEG * DEG) + st.gearH;
        st.hdg = a.hdg; st.pitch = 0.03; st.roll = 0;
        st.pitchRate = 0; st.rollRate = 0; st.yawRate = 0;
        st.vel.x = hdgX(a.hdg) * spd; st.vel.z = hdgZ(a.hdg) * spd; st.vel.y = 0;
        st.onGround = false; st.wasAirborne = true; st.parkingBrake = false;
        st.gearTarget = 0; st.gear = 0; st.flaps = st.flapsTarget = 2; st.throttle = 0.5;
        for (const e of this.systems.engines) if (!e.failed) { e.running = true; e.startPhase = 'idle'; e.n1 = 0.6; e.n2 = 0.8; }
        fl.ap.on = true; fl.ap.nav = true; fl.ap.alt = Math.round((st.pos.y) / FT / 100) * 100; fl.ap.vsI = 0;
        fl.locCaptured = true;
        this.applyArrivalWeather();
        fl.setPhase('APPROACH');
        Scene3D.warmup(fl);
        text = '12 nm final for ' + a.id + ' runway ' + a.rwyName;
        break;
      }
      case 4: Career.data.money += 10000; Career.save(); text = '+10 000 kr'; break;
      case 5: st.damage = 0; text = 'aircraft repaired'; break;
      case 6:
        if (st.onGround) { text = 'time x16 works in the air only'; break; }
        fl.cheatAccel = true; fl.ap.on = true; text = 'time acceleration x16'; break;
      default: return;
    }
    HUD.showBanner('Cheat: ' + text + ' — this flight will not be paid', 'cheat', 2600);
  },

  // ---------- starting and ending flights ----------
  // building a flight's world takes a moment: say so, then start
  launch(contract, opts) {
    const boot = el('bootScreen');
    el('bootStatus').textContent = 'Preparing the route ' + contract.fromId + ' → ' + contract.toId + '…';
    boot.hidden = false;
    el('screen').hidden = true;
    frame().then(frame).then(() => {
      this.startFlight(contract, opts);
      boot.hidden = true;
    });
  },

  startFlight(contract, opts) {
    opts = opts || {};
    this.contract = contract;
    this.setup = Career.flightSetup(contract, { seed: opts.seed || 0, skipPushback: opts.skipPushback });
    const s = this.setup;
    // the flight's own world: projection, terrain, airports laid out
    if (World.key !== contract.fromId + '>' + contract.toId) {
      World.prepare(contract.fromId, contract.toId);
      Scene3D.setTheatre();
    }
    s.from = World.here[contract.fromId];
    s.to = World.here[contract.toId];
    s.gate = s.from.gates[s.gateIndex];
    reseed(s.seed);
    this.cheated = false;
    this.cheatsUsed = 0;
    this.failure = null;
    this.flight = Flight.init({
      aircraft: s.aircraft, from: s.from, to: s.to, contract, gate: s.gate,
      blockFuel: s.blockFuel, skipPushback: s.skipPushback
    });
    this.pushback = null;
    this.camMode = 'cockpit';
    this.debriefShown = false;
    this.arrivalGate = s.to.gates[0];
    this.arrivalRoute = null;
    this.res = { deadline: contract.deadline };

    // weather into the flight environment
    const env = this.flight.env;
    const dep = s.weather.dep, cru = s.weather.cruise;
    env.surfaceWind = { dir: dep.dir, speed: dep.speed };
    env.altWind = { dir: cru.dir, speed: cru.speed };
    env.turb = dep.turbulence;
    env.qnh = dep.qnh;
    env.temp = dep.temp;
    env.vis = dep.vis;
    env.cloudBase = s.from.elev + dep.cloudBase;
    env.cloudTop = s.from.elev + dep.cloudTop;
    env.precip = dep.precip;
    env.snowy = dep.snow;
    env.sunAz = (dep.dir * DEG + Math.PI) % TAU;
    env.sunEl = clamp(0.18 + 0.5 * Math.max(0, Math.sin((Career.data.season + 1) / 12 * TAU)), 0.1, 0.9);

    const fx = s.fx;
    this.systems = Systems.init(this.flight, {
      rng: makeRng(s.seed ^ 0x5bd1e995), difficulty: Career.difficulty,
      responseFactor: fx.responseFactor * fx.responseFactor2, iceFactor: fx.iceFactor, hint: fx.hint
    });
    this.fuel0 = s.blockFuel;

    Scene3D.setFlightGates(s.skipPushback ? [this.arrivalGate] : [s.gate, this.arrivalGate]);
    Scene3D.warmup(this.flight);
    HUD.reset();
    HUD.setPrompt('');
    HUD.updateStrip(this.flight, this.systems, this.res);
    UI.lastContract = contract;
    this.helpOpen = false;
    el('helpPanel').hidden = true;
    this.mode = 'flying';
    Input.active = true;
    Input.reset();
    el('screen').hidden = true;
    el('hud').hidden = false;
    Audio2.resume();
    this.last = performance.now();
  },

  finishFlight(failed) {
    if (this.mode !== 'flying') return;
    const fl = this.flight, sys = this.systems;
    this.mode = failed ? 'failed' : 'debrief';
    Input.active = false;
    el('hud').hidden = true;
    if (HUD.mapOpen) HUD.toggleMap();
    const landed = fl.landed || { fpm: 0, bank: 0, ias: 0, vref: 0, crab: 0, fromThr: 0, offset: 0, damage: 0 };
    const diff = Career.difficulty;
    const grade = failed ? 'F' : this.gradeLanding(landed, fl, diff);
    const mishandled = sys.checklistFailed.length;
    const onTime = !failed && (diff.id === 'easy' || fl.realElapsed <= this.res.deadline);
    const result = {
      contract: this.contract, grade, failed, onTime, mishandled,
      handled: sys.checklistDone.length,
      damage: clamp(fl.st.damage, 0, 1), fuelUsed: this.fuel0 - fl.st.fuel,
      blockSec: fl.elapsed, realSec: fl.realElapsed, pushbackSkipped: this.setup.skipPushback,
      cheated: this.cheated, cheatsUsed: this.cheatsUsed,
      moneyFactor: fl.moneyFactor || 1, repPenalty: fl.pendingRepPenalty || 0
    };
    const payout = failed
      ? Career.failFlight({ contract: this.contract, reason: this.failure ? this.failure.text : 'Failed', cheated: this.cheated })
      : Career.payout(result);
    this.result = Object.assign({}, result, { payout });
    Audio2.update(0, null, null);
    UI.showDebrief(this.result, failed);
    Audio2.cue(grade === 'A+' || grade === 'A' ? 'good' : failed ? 'bad' : 'click');
  },

  gradeLanding(landed, fl, diff) {
    let score = 1;
    score -= clamp(Math.abs(landed.fpm - 150) / 650, 0, 1) * 0.26;
    score -= clamp(Math.abs(landed.ias - landed.vref) / 22, 0, 1) * 0.14;
    score -= clamp(Math.abs(landed.fromThr - 300) / Math.max(400, fl.arrival.rwyLen * 0.3), 0, 1) * 0.14;
    score -= clamp(Math.abs(landed.offset || 0) / 15, 0, 1) * 0.1;
    score -= clamp(Math.abs(landed.bank) / 12, 0, 1) * 0.1;
    score -= clamp(Math.abs(landed.crab) / 12, 0, 1) * 0.1;
    score -= clamp(fl.st.damage, 0, 1) * 0.4;
    if (landed.surf === 'grass' && fl.ac.surfaces.indexOf('grass') < 0) score -= 0.3;
    score += diff.gradeBonus + diff.touchdownTolerance * 0.2;
    if (score >= 0.96) return 'A+';
    if (score >= 0.88) return 'A';
    if (score >= 0.78) return 'B';
    if (score >= 0.66) return 'C';
    if (score >= 0.5) return 'D';
    if (score >= 0.3) return 'E';
    return 'F';
  },

  failFlight(f) {
    this.failure = f;
    HUD.setPrompt('');
    this.finishFlight(true);
  },

  pause() {
    if (this.mode === 'flying') {
      this.mode = 'paused';
      Input.active = false;
      Input.reset();
      Audio2.update(0, null, null);
      UI.showPause();
    } else if (this.mode === 'paused') {
      this.mode = 'flying';
      Input.active = true;
      el('screen').hidden = true;
      this.last = performance.now();
    }
  },

  abortToOps() {
    this.mode = 'ops';
    Input.active = false;
    this.flight = null;
    this.systems = null;
    el('hud').hidden = true;
    if (HUD.mapOpen) HUD.toggleMap();
    Audio2.update(0, null, null);
    UI.showOps();
  },

  // ---------- quality ----------
  autoQuality() {
    if (Career.settings.quality !== 'auto') return;
    this.lowFps = this.fps < 30 ? (this.lowFps || 0) + 1 : 0;
    if (this.lowFps >= 6 && this.quality !== 'low') {
      this.quality = this.quality === 'high' ? 'medium' : 'low';
      Scene3D.setQuality(this.quality);
      if (this.flight) Scene3D.warmup(this.flight);
      this.lowFps = 0;
    }
  }
};

function frame() { return new Promise((r) => requestAnimationFrame(() => r())); }
function fmtAltFt(ft) { return Math.round(ft).toLocaleString('en-US'); }
function pickQuality(setting) {
  if (setting && setting !== 'auto') return setting;
  return isCoarsePointer() ? 'medium' : 'high';
}

window.addEventListener('load', () => Game.boot());
