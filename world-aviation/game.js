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
      if (p) p.textContent = tr('World Aviation renders the cockpit view with WebGL ({err}). Enable hardware acceleration in your browser, or try another one.',
        { err: err && err.message ? err.message : tr('unknown error') });
      return;
    }
    World.init();
    Scene3D.setQuality(this.quality);
    Scene3D.resize();
    el('bootStatus').textContent = tr('Ready');
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
        // the surfaces follow the stick at their actuators' rate
        const rate = CONTROLS.SURFACE_RATE;
        st.elevator = approach(st.elevator, ax.pitch, rate.elevator * dt);
        st.aileron = approach(st.aileron, ax.roll, rate.aileron * dt);
        // on the ground the arrows / the stick steer the nosewheel too
        st.rudder = approach(st.rudder, st.onGround && !ax.rudder ? ax.roll : ax.rudder, rate.rudder * dt);
      } else if (Math.abs(ax.pitch) > 0.5 || Math.abs(ax.roll) > 0.5) {
        fl.ap.on = false;
        fl.warn('AP', tr('Autopilot disconnected — you have control'));
      }
      // the keys move the lever, which maps to thrust on a curve (finer at low power)
      if (ax.throttle) fl.setThrottle(throttleFromLever(leverFromThrottle(st.throttle) + ax.throttle * dt * CONTROLS.THROTTLE_KEY_RATE));
      // the slider sets a target; once there (or when the autothrottle takes over) it lets go of the levers
      const tt = Input.touchThrottle;
      if (tt !== null) {
        if (fl.ap.on && !Input.touch.thr) Input.touchThrottle = null;
        else {
          fl.setThrottle(approach(st.throttle, tt, dt * 0.8));
          if (!Input.touch.thr && Math.abs(st.throttle - tt) < 0.002) Input.touchThrottle = null;
        }
      }
      Input.syncThrottle(st.throttle);
      st.brakeInput = ax.brake;

      if (fl.phase === 'PUSHBACK') this.updatePushback(dt);
      const simDt = fl.update(dt);
      sys.update(simDt);
      if (this.practice) this.updatePractice(dt);
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
    HUD.updateMini(fl, sys, this.helpOpen);

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
    this.drawApproachPath(ctx, w, h, fl);
    this.drawIls(ctx, w, h, fl);
    ctx.restore();
  },

  // The ILS, shown so that it reads at a glance: the localiser scale (magenta) carries a
  // little runway that sits where the runway is, the glideslope scale (cyan) a triangle that
  // sits where the glide path is, and a line of plain words says what to do. Off the view
  // ahead: on a desktop on the right, past the centre window post (on the left while the
  // checklist fills the right side); on a phone high in the middle, between the buttons.
  // The landing aid setting turns it off.
  drawIls(ctx, w, h, fl) {
    if (fl.phase !== 'APPROACH' && fl.phase !== 'DESCENT') return;
    if (Career.settings.landingAid === false) return;
    if (fl.distToRunwayNm() > SIM.APPROACH_NM + 4 || fl.navFailed) return;
    const d = fl.ilsDeviation();
    if (d.along > 0) return;
    const top = Cockpit.panelTop(h);
    const inside = this.camMode === 'cockpit';
    const side = !Input.isCoarse;
    const R = side ? Math.min(90, w * 0.08) : Math.min(110, w * 0.12), V = Math.min(70, h * 0.1);
    let cx = inside ? w / 2 : w - R - 110, cy = inside ? top * 0.5 : top * 0.56;
    if (side) {
      const cb = el('checklist'), qrh = cb && !cb.hidden;
      cy = top * 0.56;
      // the glide path scale and its label reach about R + 70 to the right of the centre
      cx = qrh ? R + 70 : Math.min(w - R - 80, Math.max(inside ? Cockpit.postX(w, h) + R + 70 : 0, w - R - 110));
    } else if (inside) {
      // between the left column (strip and prompt) and the buttons
      const left = Math.min(300, w * 0.34) + 20, right = w - (HUD.buttonsW || 232) - 16;
      cx = (left + right) / 2;
    }
    const LOC = '#e65cf0', GS = '#4fd8ff';
    const loc = clamp(-d.locDeg / 2.5, -1, 1);       // + : the runway is to the right
    const gs = clamp(-d.gsDeg / 0.7, -1, 1);         // + : the glide path is above you
    const ly = cy + V + 16, gx = cx + R + 18;
    ctx.save();
    // dark outlines instead of a panel: the colours read against a bright sky, the view stays open
    ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 3;
    const say = (t, x, y, c) => {
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(8,12,18,0.8)'; ctx.strokeText(t, x, y);
      ctx.fillStyle = c; ctx.fillText(t, x, y);
    };
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(216,226,236,0.45)';
    ctx.beginPath();
    ctx.moveTo(cx - R, ly); ctx.lineTo(cx + R, ly);
    ctx.moveTo(gx, cy - V); ctx.lineTo(gx, cy + V);
    ctx.stroke();
    for (const k of [-1, -0.5, 0.5, 1]) {
      ctx.beginPath(); ctx.arc(cx + k * R, ly, 2.5, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.arc(gx, cy + k * V, 2.5, 0, TAU); ctx.stroke();
    }
    // the centre marks: you
    ctx.strokeStyle = '#ffd97a'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(cx, ly - 9); ctx.lineTo(cx, ly + 9); ctx.moveTo(gx - 9, cy); ctx.lineTo(gx + 9, cy); ctx.stroke();
    // the runway on the localiser scale: a little runway seen from the approach
    const rx = cx + loc * R;
    ctx.fillStyle = Math.abs(loc) >= 1 ? '#ff7a5c' : LOC;
    ctx.beginPath(); ctx.moveTo(rx - 3, ly - 12); ctx.lineTo(rx + 3, ly - 12); ctx.lineTo(rx + 7, ly + 12); ctx.lineTo(rx - 7, ly + 12); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(rx, ly - 10); ctx.lineTo(rx, ly + 11); ctx.stroke(); ctx.setLineDash([]);
    // the glide path on the glideslope scale: a triangle pointing at the scale
    const gy = cy - gs * V;
    ctx.fillStyle = Math.abs(gs) >= 1 ? '#ff7a5c' : GS;
    ctx.beginPath(); ctx.moveTo(gx - 3, gy); ctx.lineTo(gx + 13, gy - 8); ctx.lineTo(gx + 13, gy + 8); ctx.closePath(); ctx.fill();
    // labels and plain words
    ctx.font = '700 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 0;
    say(tr('RUNWAY'), cx - R - 34, ly + 4, LOC);
    say(tr('GLIDE PATH'), gx + 4, cy - V - 9, GS);
    const words = [];
    if (Math.abs(d.locDeg) < 0.6) words.push([tr('on the centreline'), '#54d68a']);
    else words.push([tr(loc > 0 ? 'runway to the RIGHT ▶ turn right' : '◀ runway to the LEFT turn left'), LOC]);
    if (Math.abs(d.gsDeg) < 0.25) words.push([tr('on the glide path'), '#54d68a']);
    else words.push([tr(gs > 0 ? 'LOW ▲ descend less' : 'HIGH ▼ descend more'), GS]);
    ctx.font = '700 12px system-ui, sans-serif';
    const both = Math.abs(d.locDeg) < 0.6 && Math.abs(d.gsDeg) < 0.25;
    // the words stay on the screen however long they are in the game's language
    const at = (t) => clamp(cx, ctx.measureText(t).width / 2 + 12, w - ctx.measureText(t).width / 2 - 12);
    const all = tr('ON THE CENTRELINE AND THE GLIDE PATH');
    if (both) say(all, at(all), ly + 30, '#54d68a');
    else words.forEach(([t, c], i) => say(t, at(t), ly + 28 + i * 15, c));
    ctx.restore();
  },

  // The approach in the world: a dot on the extended centreline at the height of the glide
  // path every nautical mile out to 12 nm, and the threshold. Projected through whichever
  // camera is in use, so it works from the cockpit and from every outside view; flying down
  // the line of dots is flying the ILS.
  drawApproachPath(ctx, w, h, fl) {
    const p = fl.phase;
    if (fl.st.onGround || fl.navFailed || !(p === 'DESCENT' || p === 'APPROACH' || p === 'CRUISE')) return;
    if (Career.settings.landingAid === false) return;
    const nm = fl.distToRunwayNm();
    if (nm > 30) return;
    const a = fl.arrival, cam = Scene3D.camera;
    const v = this.pathVec || (this.pathVec = new THREE.Vector3());
    cam.updateMatrixWorld();
    const top = Cockpit.panelTop(h);
    const fade = clamp((30 - nm) / 8, 0, 1);
    const pts = [];
    for (let k = 0; k <= 12; k++) {
      const q = World.at(a, -a.half - k * NM, 0);
      v.set(q.x, a.elev + 15 + k * NM * Math.tan(SIM.GLIDESLOPE_DEG * DEG), q.z).project(cam);
      if (v.z > 1 || v.z < -1) { pts.push(null); continue; }
      // the dots grow as they come closer
      const dist = Math.hypot(q.x - cam.position.x, a.elev + k * NM * 0.05 - cam.position.y, q.z - cam.position.z);
      pts.push({ x: (v.x + 1) / 2 * w, y: (1 - v.y) / 2 * h, k, r: clamp(5000 / Math.max(1, dist), 2, 8) });
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, top);
    ctx.clip();
    ctx.globalAlpha = fade;
    ctx.strokeStyle = 'rgba(230,92,240,0.45)'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    let pen = false;
    for (const q of pts) { if (!q) { pen = false; continue; } if (pen) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); pen = true; }
    ctx.stroke();
    ctx.font = '700 11px system-ui, sans-serif';
    ctx.textAlign = 'left';
    for (const q of pts) {
      if (!q) continue;
      if (q.k === 0) {
        // the threshold: the runway's number
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.moveTo(q.x, q.y + 2); ctx.lineTo(q.x - 6, q.y - 8); ctx.lineTo(q.x + 6, q.y - 8); ctx.closePath(); ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(8,12,18,0.8)'; ctx.strokeText('RWY ' + a.rwyName, q.x + 9, q.y - 2);
        ctx.fillText('RWY ' + a.rwyName, q.x + 9, q.y - 2);
        continue;
      }
      const r = q.r;
      ctx.fillStyle = '#e65cf0';
      ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, TAU); ctx.fill();
      if (q.k % 4 === 0) { ctx.fillStyle = 'rgba(240,200,250,0.9)'; ctx.fillText(Units.dist(q.k), q.x + r + 4, q.y + 4); }
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
    // the point 1 km down the flight path, through the cockpit camera (which looks a little below the nose)
    const cam = Scene3D.camera;
    const sp = Math.hypot(v.x, v.y, v.z);
    const p = this.fpmVec || (this.fpmVec = new THREE.Vector3());
    p.set(cam.position.x + v.x / sp * 1000, cam.position.y + v.y / sp * 1000, cam.position.z + v.z / sp * 1000);
    cam.updateMatrixWorld();
    p.project(cam);
    if (p.z > 1) return;
    const x = (p.x + 1) / 2 * w;
    const y = (1 - p.y) / 2 * h;
    if (y > Cockpit.panelTop(h) - 10 || y < 0 || x < 0 || x > w) return;
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
      ctx.fillText(margin < 0 ? tr('STALL') : tr('SPEED') + '  +' + Units.spd(margin), w / 2, Cockpit.panelTop(h) - 60);
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
      fl.info(tr('Push back complete — tug disconnected, parking brake set'));
    }
  },

  // ---------- the phase machine ----------
  updatePhase(dt) {
    const fl = this.flight, sys = this.systems, st = fl.st;
    const p = fl.phase;
    const speed = fl.groundSpeedKt();
    const apt = fl.world, arr = fl.arrival;
    // a new phase unfolds the prompt the player folded away on a touch screen
    if (p !== this.promptPhase) { this.promptPhase = p; if (HUD.expandPrompt) HUD.expandPrompt(); }

    // a touchdown at the destination ends the flying part, whatever the phase says
    if (AIRBORNE_PHASES.includes(p) && st.onGround && st.wasAirborne) {
      if (fl.nearestApt() === arr && fl.landed) { fl.setPhase('ROLLOUT'); return; }
      if (fl.nearestApt() === apt && speed < 30) {
        fl.fail('returned', tr('You landed back at {id} — the load was not delivered.', { id: apt.id }));
        return;
      }
    }

    // off without asking the tower: the flight goes on (the prompts and the arrow move on to the
    // climb), but the tower is not amused
    if ((p === 'ENGINE_START' || p === 'TAXI_OUT' || p === 'HOLD_SHORT') && (!st.onGround || speed > SIM.TAKEOFF_NO_CLEARANCE_KT)) {
      fl.noClearance = true;
      st.parkingBrake = false;
      fl.setPhase('TAKEOFF');
      fl.warn('CLEARANCE', tr('Tower: you took off without a clearance — this will be reported'));
      return;
    }

    if (p === 'GATE') {
      HUD.setPrompt('<b>' + apt.id + ' · ' + gateName(this.flight.startGate) + '</b> · ' + tr('doors closed, ready to go') + '<br>' +
        tr('press <kbd>Enter</kbd> to call the tug for push back'));
    } else if (p === 'PUSHBACK') {
      HUD.setPrompt(tr('<b>Push back</b> · the tug is pushing you onto the apron') + '<br>' +
        tr(sys.started ? 'engines starting' : 'you can start the engines now — <kbd>Enter</kbd>'));
    } else if (p === 'ENGINE_START') {
      const all = sys.runningCount() === fl.ac.engines;
      // the engines running and the parking brake off (Space / Park): off you go
      if (all && !st.parkingBrake) {
        fl.setPhase('TAXI_OUT');
        fl.info(tr('Taxi to holding point runway {rwy} — follow the arrow', { rwy: apt.rwyName }));
        return;
      }
      HUD.setPrompt(tr(all
        ? '<b>Engines running</b><br>release the parking brake <kbd>Space</kbd> and taxi'
        : sys.started ? '<b>Starting</b> · watch the N1 and EGT gauges' : '<b>Start the engines</b><br>press <kbd>Enter</kbd>'));
    } else if (p === 'TAXI_OUT') {
      const g = fl.guidance;
      const hold = apt.nodes.hold;
      const dHold = Math.hypot(st.pos.x - hold.x, st.pos.z - hold.z);
      if (dHold < 30) {
        fl.setPhase('HOLD_SHORT');
        fl.info(tr('Holding point runway {rwy} — stop and wait for the clearance', { rwy: apt.rwyName }));
      }
      HUD.setPrompt(tr('<b>Taxi</b> to the holding point of runway {rwy}', { rwy: apt.rwyName }) +
        ' · ' + tr('throttle <kbd>1</kbd>–<kbd>3</kbd>, steer <kbd>←</kbd><kbd>→</kbd>, brake <kbd>B</kbd>') +
        (g && g.visible ? '<br>' + tr('{d} to go', { d: fmtDist(g.remaining) }) : '') +
        (speed > 25 ? ' · <b class="bad">' + tr('too fast — keep below 20 kt') + '</b>' : ''));
    } else if (p === 'HOLD_SHORT') {
      HUD.setPrompt('<b>' + tr('Holding point runway {rwy}', { rwy: apt.rwyName }) + '</b>' + (speed > 2 ? ' · <b>' + tr('stop here') + '</b>' : '') +
        '<br>' + tr('set flaps {n} <kbd>F</kbd>, then <kbd>Enter</kbd> for the take-off clearance', { n: this.takeoffFlaps() }));
    } else if (p === 'TAKEOFF') {
      const vr = Math.round(fl.vr());
      HUD.setPrompt(st.onGround
        ? '<b>' + tr('Runway {rwy}', { rwy: apt.rwyName }) + ' · ' + tr(fl.noClearance ? 'no clearance!' : 'cleared for take-off') + '</b><br>' +
          tr('line up, full power <kbd>9</kbd>, rotate at Vr {vr} kt — pull back <kbd>↓</kbd>', { vr }) + (st.flapsTarget < 1 ? ' · <b>' + tr('flaps!') + '</b>' : '')
        : tr('<b>Positive climb</b> · gear up <kbd>G</kbd>'));
      if (!st.onGround && fl.altAgl() > 150) {
        fl.setPhase('CLIMB');
        fl.ap.alt = this.cruiseAltFt();
        fl.info(tr('Climb to {alt} ft — engage the autopilot <kbd>Y</kbd>', { alt: fmtAltFt(fl.ap.alt) }));
      }
    } else if (p === 'CLIMB') {
      HUD.setPrompt(tr('<b>Climb</b> to {alt} ft', { alt: fmtAltFt(fl.ap.alt) }) +
        (st.gearTarget === 1 ? ' · ' + tr('gear up <kbd>G</kbd>') : '') + (st.flapsTarget > 0 && st.ias / KTS > fl.vr() + 25 ? ' · ' + tr('flaps up <kbd>V</kbd>') : '') +
        (!fl.ap.on ? ' · ' + tr('autopilot <kbd>Y</kbd>') : ''));
      if (Math.abs(st.pos.y / FT - fl.ap.alt) < 300) {
        fl.setPhase('CRUISE');
        fl.info(tr('Cruise · time acceleration: <kbd>T</kbd> faster, <kbd>R</kbd> slower'));
      }
      if (fl.distToDestNm() < this.descentNm()) this.startDescent();
    } else if (p === 'CRUISE') {
      HUD.setPrompt('<b>' + tr('Cruise · {nm} nm to {id}', { nm: Math.round(fl.distToDestNm()), id: arr.id }) + '</b><br>' +
        (fl.ap.on ? tr('autopilot NAV · time <kbd>T</kbd> faster, <kbd>R</kbd> slower (x{n})', { n: fl.env.timeAccel }) : tr('autopilot <kbd>Y</kbd> flies the route')) +
        (this.res && fl.realElapsed > this.res.deadline * 0.75 ? ' · <b class="bad">' + tr('running late') + '</b>' : ''));
      if (fl.distToDestNm() < this.descentNm()) this.startDescent();
    } else if (p === 'DESCENT') {
      HUD.setPrompt(tr('<b>Descent</b> to {alt} ft · {nm} nm to runway {rwy}', { alt: fmtAltFt(fl.ap.alt), nm: Math.round(fl.distToRunwayNm()), rwy: arr.rwyName }));
      fl.navTarget();                                   // keeps the localiser capture up to date
      if (fl.locCaptured && fl.distToRunwayNm() < SIM.APPROACH_NM) {
        fl.setPhase('APPROACH');
        fl.info(tr('Approach runway {rwy} · Vref {v} kt · flaps and gear down', { rwy: arr.rwyName, v: Math.round(fl.vRef()) }));
      }
    } else if (p === 'APPROACH') {
      const nm = fl.distToRunwayNm();
      const need = [];
      if (st.flapsTarget < fl.ac.flaps.length && nm < 8) need.push(tr('flaps <kbd>F</kbd>'));
      if (st.gearTarget < 1 && nm < 7) need.push(tr('<b>gear down</b> <kbd>G</kbd>'));
      const head = '<b>' + tr('Approach · runway {rwy}', { rwy: arr.rwyName }) + '</b> · ' + nm.toFixed(1) + ' nm · Vref ' + Math.round(fl.vRef()) + ' kt';
      if (this.practice) {
        // the gear and the flaps are part of the practice
        const cfg = [];
        if (st.gearTarget < 1) cfg.push(tr('<b>gear down</b> <kbd>G</kbd>'));
        if (st.flapsTarget < fl.ac.flaps.length) cfg.push(tr('flaps <kbd>F</kbd>'));
        HUD.setPrompt(head + '<br>' + (!this.practice.handed
          ? tr('practice: the autopilot holds the glide path for {s} s, then it is yours', { s: PRACTICE.AP_SECONDS })
          : cfg.length ? cfg.join(' · ') + ' · ' + tr('slow to Vref')
            : tr('practice: land, then idle <kbd>0</kbd> and brake <kbd>B</kbd> below {v} kt', { v: SIM.ROLLOUT_EXIT_KT })));
      } else {
        HUD.setPrompt(head + (need.length ? '<br>' + need.join(' · ') : (fl.ap.on ? '<br>' + tr('autopilot flies the ILS down to 200 ft') : '')));
      }
      if (nm < 1.5 && fl.altAgl() < 90 && st.gearTarget < 1) fl.warn('TOOLOWGEAR', tr('TOO LOW — GEAR'));
      // over the runway and still flying at its far end: go around and try again
      const loc = World.local(arr, st.pos.x, st.pos.z);
      const overRunway = Math.abs(loc.across) < 400 && loc.t > -arr.half && loc.t < arr.half;
      if (overRunway && !st.onGround) fl.overRunway = true;
      if (this.practice && ((fl.overRunway && !st.onGround && loc.t > arr.half - 150) || nm > PRACTICE.START_NM + 2 || fl.altAgl() > PRACTICE.MAX_AGL_FT * FT)) {
        this.endPractice(false, tr('No landing — you flew away from the runway'));
        return;
      }
      if (fl.overRunway && !st.onGround && loc.t > arr.half - 150) {
        fl.warn('GOAROUND', tr('Go around — climb, and fly the approach again'));
        fl.overRunway = false; fl.locCaptured = false; fl.ap.gs = false;
        fl.ap.alt = Math.round((arr.elev + 2500 * FT) / FT / 100) * 100;
        fl.setPhase('DESCENT');
      }
    } else if (p === 'ROLLOUT') {
      HUD.setPrompt('<b>' + tr('Touchdown') + ' ' + (fl.landed ? fl.landed.fpm + ' fpm' : '') + '</b><br>' +
        tr('idle <kbd>0</kbd>, brakes <kbd>B</kbd>, spoiler <kbd>/</kbd> — slow below {v} kt', { v: SIM.ROLLOUT_EXIT_KT }));
      if (!st.onGround && fl.altAgl() > 15) {
        // touch-and-go: the next landing is the one that counts (a practice is over)
        if (this.practice) { this.endPractice(false, tr('You took off again — the landing did not hold')); return; }
        fl.landed = null;
        fl.setPhase('APPROACH');
      } else if (st.onGround && speed < SIM.ROLLOUT_EXIT_KT) {
        if (this.practice) this.endPractice(true);
        else this.beginTaxiIn();
      }
    } else if (p === 'EXIT') {
      const gate = this.arrivalGate;
      const d = Math.hypot(st.pos.x - gate.standX, st.pos.z - gate.standZ);
      const align = Math.abs(wrapDeg(fl.headingDeg() - gate.parkHdg));
      const inBox = d < SIM.PARK_RADIUS_M && align < SIM.PARK_ALIGN_DEG;
      if (inBox && speed < 1.5) {
        if (!st.parkingBrake) HUD.setPrompt(tr('<b>In the parking box</b><br>set the parking brake — <kbd>Space</kbd>'));
        else {
          fl.setPhase('SHUTDOWN');
          sys.stopEngines();
          fl.info(tr('Parking brake set — engines shutting down'));
        }
      } else {
        HUD.setPrompt('<b>' + tr('Taxi to {gate}', { gate: gateName(gate) }) + '</b> · ' + tr('follow the arrow, keep below 20 kt') +
          (d < 80 ? '<br>' + tr('stop on the stop bar — {d} m', { d: Math.round(d) }) + (align > SIM.PARK_ALIGN_DEG ? ', ' + tr('straighten up') : '') : ''));
      }
    } else if (p === 'SHUTDOWN') {
      HUD.setPrompt(tr('<b>Shutting down</b> · {ac} at {gate}', { ac: fl.ac.name, gate: gateName(this.arrivalGate) }));
      if (sys.allStopped) fl.setPhase('PARKED');
    } else if (p === 'PARKED') {
      HUD.setPrompt('');
      if (!this.debriefShown) { this.debriefShown = true; this.finishFlight(false); }
    }

    // fuel starvation
    if (st.fuel <= 0.5 && !st.onGround) fl.warn('FUEL', tr('Out of fuel — glide to the nearest field'));
    // ground proximity: not on a stable final, where the ground is meant to come up
    if (!st.onGround && fl.altAgl() > 30 && !(p === 'APPROACH' && fl.onCorridor()) && p !== 'TAKEOFF' && fl.terrainAhead() < 120) {
      fl.warn('TERRAIN', tr('TERRAIN — PULL UP'));
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
    fl.info(tr('Top of descent — {id} runway {rwy}, descend to {alt} ft', { id: arr.id, rwy: arr.rwyName, alt: fmtAltFt(fl.ap.alt) }));
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
    fl.info(tr('Leave the runway at the next exit and taxi to {gate}', { gate: gateName(this.arrivalGate) }));
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
        if (st.onGround) { fl.warn('AP', tr('The autopilot engages in the air only')); break; }
        fl.ap.on = !fl.ap.on;
        if (fl.ap.on) {
          fl.ap.vsI = 0;
          if (!fl.ap.nav) fl.ap.hdg = Math.round(fl.headingDeg());
          if (fl.phase === 'TAKEOFF' || fl.phase === 'CLIMB') fl.ap.alt = Math.max(fl.ap.alt, this.cruiseAltFt());
        }
        fl.info(tr('Autopilot') + ' ' + (fl.ap.on ? 'CMD · ' + (fl.ap.nav ? 'NAV' : 'HDG ' + fl.ap.hdg) + ' · ALT ' + fmtAltFt(fl.ap.alt) : tr('off')));
        Audio2.cue('click');
        break;
      case 'timeFaster': fl.changeTimeAccel(1); break;
      case 'timeSlower': fl.changeTimeAccel(-1); break;
      case 'camera':
      {
        const modes = VIEW.MODES, n = modes.length;
        this.camMode = modes[(modes.indexOf(this.camMode) + (arg === -1 ? n - 1 : 1)) % n];
        fl.info(tr('View: {v}', { v: tr(VIEW.NAMES[this.camMode]) }));
      }
        break;
      case 'map': HUD.toggleMap(); break;
      case 'prompt': HUD.togglePrompt(); break;
      case 'brightness': Instruments.bright = Instruments.bright > 0.6 ? 0.45 : 1; break;
      case 'spoiler': fl.toggleSpoiler(); fl.info(tr(st.spoiler ? 'Spoiler out' : 'Spoiler in')); break;
      case 'antiIce':
        sys.antiIce = !sys.antiIce;
        fl.info(tr(sys.antiIce ? 'Engine and wing anti-ice ON' : 'Engine and wing anti-ice off'));
        break;
      case 'parkBrake':
        if (fl.phase === 'PUSHBACK') break;
        st.parkingBrake = !st.parkingBrake;
        fl.info(tr(st.parkingBrake ? 'Parking brake set' : 'Parking brake released'));
        Audio2.cue('parkbrake', st.parkingBrake);
        break;
      case 'altUp': fl.ap.alt = Math.min(fl.ap.alt + 500, 41000); fl.info(tr('Selected altitude {alt} ft', { alt: fmtAltFt(fl.ap.alt) })); break;
      case 'altDown': fl.ap.alt = Math.max(1000, fl.ap.alt - 500); fl.info(tr('Selected altitude {alt} ft', { alt: fmtAltFt(fl.ap.alt) })); break;
      case 'hdgUp': case 'hdgDown':
        if (fl.ap.nav) { fl.ap.nav = false; fl.ap.hdg = Math.round(fl.headingDeg()); }
        fl.ap.hdg = (fl.ap.hdg + (name === 'hdgUp' ? 5 : 355)) % 360;
        fl.info(tr('Heading {h}° (HDG mode — <kbd>N</kbd> goes back to the programme)', { h: String(fl.ap.hdg).padStart(3, '0') }));
        break;
      case 'nav':
        // back on the programme: NAV along the route and the altitude for this phase of the flight
        if (st.onGround) { fl.info(tr('NAV: the autopilot flies the route once you are in the air')); break; }
        fl.ap.nav = true; fl.locCaptured = false;
        fl.ap.alt = this.programAltFt();
        if (!fl.ap.on) { fl.ap.on = true; fl.ap.vsI = 0; }
        fl.info(tr('Autopilot back on the programme — NAV to {id} · ALT {alt} ft', { id: fl.arrival.id, alt: fmtAltFt(fl.ap.alt) }));
        Audio2.cue('click');
        break;
      case 'throttlePreset': fl.setThrottle(arg); break;
      case 'starter':
        // with a checklist open, Enter / Go works its current switch
        if (sys.checklist) this.doChecklistStep(sys.checklist.stepIndex);
        else this.next();
        break;
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
      fl.info(tr('Ground: push back approved — brakes released'));
      Audio2.cue('click');
    } else if (p === 'PUSHBACK' || (p === 'ENGINE_START' && sys.runningCount() < fl.ac.engines)) {
      if (!sys.started) sys.startEngines();
    } else if (p === 'ENGINE_START') {
      fl.warn('BRAKE', tr('Release the parking brake to taxi — <kbd>Space</kbd>'));
    } else if (p === 'HOLD_SHORT') {
      const w = fl.env.surfaceWind;
      st.parkingBrake = false;
      fl.setPhase('TAKEOFF');
      fl.info(tr('Tower: wind {d}° {v} kt, runway {rwy} cleared for take-off',
        { d: String(Math.round(w.dir)).padStart(3, '0'), v: Math.round(w.speed), rwy: fl.world.rwyName }));
    } else if (p === 'TAXI_OUT') {
      fl.warn('HOLD', tr('Taxi to the holding point first'));
    }
  },

  // Enter, the Go button or a tap on step i of the open checklist: the current step's switch
  // is worked; a step done with a control (or a later step) only says what to do
  doChecklistStep(i) {
    const sys = this.systems, c = sys && sys.checklist;
    if (!c) return;
    const step = c.steps[c.stepIndex];
    if (i !== c.stepIndex) { Audio2.cue('bad'); HUD.nudgeChecklist(tr('Step {n} first — the order matters', { n: c.stepIndex + 1 })); return; }
    const r = sys.confirm();
    if (r && r !== true) HUD.nudgeChecklist(tr('This one is done with the controls: {c}', { c: HUD.qrhControl(step, false) }));
  },

  // ---------- cheats ----------
  cheat(digit) {
    if (digit === 0) {
      HUD.showBanner('Cheats: Alt+1 full fuel · Alt+2 no emergencies · Alt+3 jump to final · Alt+4 +10 000 kr · ' +
        'Alt+5 repair · Alt+6 time x' + SIM.TIME_ACCEL_CHEAT, 'cheat', 7000);
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
      case 3:
        this.placeOnFinal(12, false);
        text = '12 nm final for ' + fl.arrival.id + ' runway ' + fl.arrival.rwyName;
        break;
      case 4: Career.data.money += 10000; Career.save(); text = '+10 000 kr'; break;
      case 5: st.damage = 0; text = 'aircraft repaired'; break;
      case 6:
        if (st.onGround) { text = 'time x' + SIM.TIME_ACCEL_CHEAT + ' works in the air only'; break; }
        fl.cheatAccel = true; fl.ap.on = true; text = 'time acceleration x' + SIM.TIME_ACCEL_CHEAT; break;
      default: return;
    }
    HUD.showBanner('Cheat: ' + text + ' — this flight will not be paid', 'cheat', 2600);
  },

  // On the final approach to the arrival runway, `nm` out on the glide path, the autopilot
  // flying the ILS, gear up: with take-off flaps and level (the final-approach cheat, 12 nm),
  // or clean and already descending on the glide path (the practice landing: the gear, the
  // flaps and the speed are the pilot's job)
  placeOnFinal(nm, practice) {
    const fl = this.flight, st = fl.st, a = fl.arrival;
    const dist = nm * NM;
    const p = World.at(a, -a.half - dist, 0);
    st.gearTarget = st.gear = 0;
    st.flaps = st.flapsTarget = practice ? 0 : 2;
    const spd = (practice ? Math.max(fl.vRef() + 25, fl.vsNow() * 1.4) : Math.min(fl.vRef() * 1.35, fl.ac.flaps[1].vfe - 15)) * KTS;
    st.pos.x = p.x; st.pos.z = p.z;
    st.pos.y = a.elev + 15 + dist * Math.tan(SIM.GLIDESLOPE_DEG * DEG) + st.gearH;
    st.hdg = a.hdg; st.pitch = practice ? 0 : 0.03; st.roll = 0;
    st.pitchRate = 0; st.rollRate = 0; st.yawRate = 0;
    st.vel.x = hdgX(a.hdg) * spd; st.vel.z = hdgZ(a.hdg) * spd;
    st.vel.y = practice ? -spd * Math.sin(SIM.GLIDESLOPE_DEG * DEG) : 0;
    st.onGround = false; st.wasAirborne = true; st.parkingBrake = false;
    st.throttle = practice ? 0.4 : 0.5;
    for (const e of this.systems.engines) if (!e.failed) { e.running = true; e.startPhase = 'idle'; e.n1 = 0.6; e.n2 = 0.8; }
    fl.ap.on = true; fl.ap.nav = true; fl.ap.alt = Math.round((st.pos.y) / FT / 100) * 100; fl.ap.vsI = 0;
    fl.locCaptured = true;
    if (practice) fl.ap.gs = true;
    this.applyArrivalWeather();
    fl.setPhase('APPROACH');
    Scene3D.warmup(fl);
  },

  // ---------- the practice landing ----------
  // Started from the briefing: on the final at the destination, the autopilot holds the glide
  // path for PRACTICE.AP_SECONDS, then you land and brake below SIM.ROLLOUT_EXIT_KT. A paid
  // simulator session: no damage bills, no lost reputation, and a good landing earns a little.
  updatePractice(dt) {
    const pr = this.practice, fl = this.flight;
    if (pr.handed) return;
    pr.t += dt;
    if (pr.t >= PRACTICE.AP_SECONDS) {
      pr.handed = true;
      fl.ap.on = false;
      fl.warn('AP', tr('Your controls — gear, flaps, land and brake below {v} kt', { v: SIM.ROLLOUT_EXIT_KT }));
    }
  },
  endPractice(ok, reason) {
    if (this.mode !== 'flying') return;
    const fl = this.flight;
    ok = ok && !!fl.landed;
    this.mode = 'practice';
    Input.active = false;
    el('hud').hidden = true;
    if (HUD.mapOpen) HUD.closeMap();
    const grade = ok ? this.gradeLanding(fl.landed, fl, Career.difficulty) : '';
    const rep = ok ? Career.practiceReward(this.contract, grade, this.cheated) : 0;
    this.result = { practice: true, ok, grade, reason: reason || '', landed: ok ? fl.landed : null, rep, fee: this.practice.fee,
      contract: this.contract, cheated: this.cheated };
    Audio2.update(0, null, null);
    UI.showPracticeResult(this.result);
    Audio2.cue(ok && (grade === 'A+' || grade === 'A') ? 'good' : ok ? 'click' : 'bad');
  },

  // ---------- starting and ending flights ----------
  // building a flight's world takes a moment: say so, then start
  launch(contract, opts) {
    const boot = el('bootScreen');
    el('bootStatus').textContent = tr('Preparing the route {from} → {to}…', { from: contract.fromId, to: contract.toId });
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
    // a practice landing has no deadline
    this.practice = opts.practice ? { t: 0, handed: false, fee: opts.fee || 0 } : null;
    this.flight.practice = !!this.practice;
    this.res = this.practice ? null : { deadline: contract.deadline };

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
    // the time of day: the departure's local hour, the clock runs on with the flight (Scene3D)
    this.setup.timeOfDay = Career.timeOfDay;
    env.hour0 = TIME_OF_DAY[this.setup.timeOfDay].hour;

    const fx = s.fx;
    this.systems = Systems.init(this.flight, {
      rng: makeRng(s.seed ^ 0x5bd1e995), difficulty: Career.difficulty,
      responseFactor: fx.responseFactor * fx.responseFactor2, iceFactor: fx.iceFactor, hint: fx.hint
    });
    this.fuel0 = s.blockFuel;
    if (this.practice) {
      this.systems.noEmergencies = true;
      this.systems.queue = [];
      this.placeOnFinal(PRACTICE.START_NM, true);
    }

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
    if (HUD.mapOpen) HUD.closeMap();
    const landed = fl.landed || { fpm: 0, bank: 0, ias: 0, vref: 0, crab: 0, fromThr: 0, offset: 0, damage: 0 };
    const diff = Career.difficulty;
    const grade = failed ? 'F' : this.gradeLanding(landed, fl, diff);
    const mishandled = sys.checklistFailed.length;
    const onTime = !failed && (diff.id === 'easy' || fl.realElapsed <= this.res.deadline);
    const result = {
      contract: this.contract, grade, failed, onTime, mishandled,
      handled: sys.checklistDone.length,
      damage: clamp(fl.st.damage, 0, 1), fuelUsed: this.fuel0 - fl.st.fuel,
      blockSec: fl.elapsed, realSec: fl.realElapsed, pushbackSkipped: this.setup.skipPushback, timeOfDay: this.setup.timeOfDay,
      cheated: this.cheated, cheatsUsed: this.cheatsUsed,
      moneyFactor: fl.moneyFactor || 1, repPenalty: (fl.pendingRepPenalty || 0) + (fl.noClearance ? 5 : 0),
      noClearance: !!fl.noClearance
    };
    const payout = failed
      ? Career.failFlight({ contract: this.contract, reason: this.failure ? this.failure.text : tr('Failed'), cheated: this.cheated })
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
    // a practice that goes wrong costs nothing more than its fee
    if (this.practice) { this.endPractice(false, f.text); return; }
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
    if (HUD.mapOpen) HUD.closeMap();
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
// a stand's name in the game's language ("Gate 3")
function gateName(g) { return g.number ? tr('Gate {n}', { n: g.number }) : tr(g.name); }
function pickQuality(setting) {
  if (setting && setting !== 'auto') return setting;
  return isCoarsePointer() ? 'medium' : 'high';
}

window.addEventListener('load', () => Game.boot());
