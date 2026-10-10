'use strict';

// ============================================================
// World Aviation — the game: boot, main loop, the phase machine
// from the gate to the gate, and the wiring between input,
// flight model, systems, scene, HUD and screens.
// ============================================================

const AIRBORNE_PHASES = ['TAKEOFF', 'CLIMB', 'CRUISE', 'DESCENT', 'APPROACH'];

const Game = {
  mode: 'boot',            // boot | menu | ops | briefing | tour | flying | debrief | failed | paused
  last: 0,
  flight: null,
  systems: null,
  setup: null,
  contract: null,
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
    // a tap anywhere skips the camera's flight at the start or the end
    el('cine').addEventListener('pointerdown', (e) => { e.preventDefault(); if (this.mode === 'flying' || this.mode === 'tour') this.skipCine(); });

    Career.load();
    this.last = performance.now();
    this.mode = 'menu';
    el('bootScreen').hidden = true;
    // A new deploy reloads the page only on the title or the operations screen, never from the
    // briefing to the debrief of a flight (core/update.js)
    AppUpdate.watch(() => this.mode === 'menu' || this.mode === 'ops');
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
      if (fe) fe.textContent = Math.round(this.fps) + ' fps · ' + Scene3D.quality.name + (Scene3D.shed.size ? ' −' + Scene3D.shed.size : '');
    }
    if (this.mode === 'flying') this.frame(dt);
    else if (this.mode === 'tour') this.tourFrame(dt);
    else if (Audio2.t) Audio2.update(0, null, null);   // no engine, wind or wheel sound outside a flight
    else if (this.mode === 'paused' && this.flight) {
      Scene3D.render();
      this.draw2d(0);
    }
  },

  frame(dt) {
    const fl = this.flight, sys = this.systems, st = fl.st;
    const paused = this.helpOpen;
    const ax = Input.axes();
    // the camera's flight at the start or the end: the aeroplane stands still meanwhile
    const shot = this.cineShot();

    if (!paused && !shot) {
      // the first officer taxiing: the stick, the brakes or the throttle take the controls back
      if (fl.copilot && fl.copilot.on && (Math.abs(ax.roll) > COPILOT.TAKEOVER_INPUT || ax.brake > COPILOT.TAKEOVER_INPUT ||
        ax.throttle || Input.touch.thr)) this.copilotOff(tr('You have control — the first officer let go'));
      if (fl.copilot && fl.copilot.on) {
        Input.touchThrottle = null;
        Copilot.update(fl, dt * fl.env.timeAccel);
        Input.syncThrottle(st.throttle);
      } else this.pilotControls(dt, ax);

      if (fl.phase === 'PUSHBACK') this.updatePushback(dt);
      const simDt = fl.update(dt);
      sys.update(simDt);
      if (this.practice) this.updatePractice(simDt);
      this.updatePhase(dt);
      Guidance.update(this);
      TaxiLimit.update(fl);
    }
    if (shot && !paused) this.updateCine(dt);
    const cine = this.cineShot();

    Scene3D.cine = cine ? Cinematic : null;
    Scene3D.panelHidden = Instruments.hidden;
    Scene3D.camMode = cine ? (Cinematic.inside() ? 'cockpit' : 'cine') : this.camMode;
    Scene3D.pipRect = this.mode === 'flying' && !cine ? HUD.updatePip(fl, sys, this.camMode, this.helpOpen) : null;
    Scene3D.update(dt, fl, sys);
    Scene3D.render();
    this.draw2d(dt);
    // a flight that ended in this frame (a practice landing, the debrief) is already silenced: keep it so
    Audio2.update(dt, this.mode === 'flying' ? fl : null, sys);
    if (!cine) Cabin.update(this.mode === 'flying' ? fl : null, sys, this);

    // messages and panels (the tower's clearance at the runway waits for the end of the intro)
    if (!cine) while (fl.events.length) HUD.push(fl.events.shift());
    HUD.render();
    HUD.updateStrip(fl, sys);
    HUD.updateButtons(fl, sys);
    HUD.updateChecklist(sys, this.hintOn());
    HUD.updateGuidance(fl, dt);
    if (HUD.mapOpen) HUD.drawMap(fl, sys);
    HUD.updateMini(fl, sys, this.helpOpen);

    if (fl.failure && this.mode === 'flying') this.failFlight(fl.failure);
  },

  // the pilot's controls (the autopilot flies the surfaces when it is engaged)
  pilotControls(dt, ax) {
    const fl = this.flight, st = fl.st;
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
    // in the camera's flights only the rain or snow outside, and inside the cockpit fading in
    const shot = this.cineShot(), inside = shot ? Cinematic.inside() : this.camMode === 'cockpit';
    const alpha = shot && inside ? Cinematic.insideAmount().toFixed(3) : '';
    if (c.style.opacity !== alpha) c.style.opacity = alpha;
    Cockpit.draw(ctx, w, h, dpr, fl, this.systems, dt, inside);
    if (shot && !inside) return;
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
  // ahead, at the right edge of the windscreen (on a desktop on the left while the checklist
  // fills the right side): the glide path scale as far from the window pillar as the whole is
  // from the panel on a phone; on a tablet under the buttons, held upright above the heading
  // strip. On a phone at three quarters of the size and without the words (the scales say it, and the view needs the room).
  // The landing aid setting turns it off.
  drawIls(ctx, w, h, fl) {
    if (fl.phase !== 'APPROACH' && fl.phase !== 'DESCENT') return;
    if (Career.settings.landingAid === false) return;
    // (on the descent by the distance over the cosine of the angle off the way to the runway, so
    // passing the airport or flying away from it does not bring it up early)
    if (fl.navFailed || (fl.phase === 'DESCENT' ? fl.accelDistNm() : fl.distToRunwayNm()) > SIM.ILS_AID_NM) return;
    const d = fl.ilsDeviation();
    if (d.along > 0) return;
    const top = Cockpit.panelTop(h);
    const inside = this.camMode === 'cockpit';
    const side = !Input.isCoarse, upright = Cockpit.portrait(w, h);
    const phone = Input.isCoarse && Math.min(w, h) < 600;
    const k = phone ? 0.75 : 1;                       // the symbols' scale
    const R = (side ? Math.min(90, w * 0.08) : upright ? w * 0.1 : Math.min(110, w * 0.12)) * k;
    const V = (upright ? 40 : Math.min(70, h * 0.1)) * k;
    // how far the whole reaches right of the glide path scale (its triangle; and its label but on
    // a phone) and below the localiser scale (its runway; and the two lines of words but on a phone)
    ctx.font = '700 11px system-ui, sans-serif';
    const right = phone ? 13 * k : Math.max(13, ctx.measureText(tr('GLIDE PATH')).width / 2 + 4);
    const below = phone ? 12 * k : 47;
    // the gap to the window pillar on the right and to the glareshield below (it rises about
    // 10 px over the panel's top out there)
    const gap = phone ? 14 : 20, edge = (inside ? w - Cockpit.pillarW(w, h) : w) - gap, floor = top - 10 - gap;
    let gx = edge - right;
    let cy = inside ? top * 0.5 : top * 0.56;
    if (side) {
      // a computer: on the left while a QRH checklist fills the right side
      const cb = el('checklist');
      if (cb && !cb.hidden) gx = 2 * R + 70 + 18;
    } else if (phone) {
      // a phone: just above the panel, under the buttons on its side
      cy = floor - below - 16 * k - V;
    } else if (upright) {
      // a tablet held upright: above the heading strip and its window (about 60 px over the
      // panel), where the panel has them
      cy = (Instruments.compact(w, h) ? floor : top - 62) - below - 16 - V;
    } else {
      // a tablet on its side: under the buttons in the top right corner
      cy = Math.max(top * 0.56, (HUD.buttonsH || 170) + V + 40);
    }
    const cx = gx - 18 * k - R;
    const LOC = '#e65cf0', GS = '#4fd8ff';
    const loc = clamp(-d.locDeg / 2.5, -1, 1);       // + : the runway is to the right
    const gs = clamp(-d.gsDeg / 0.7, -1, 1);         // + : the glide path is above you
    const ly = cy + V + 16 * k;
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
    for (const f of [-1, -0.5, 0.5, 1]) {
      ctx.beginPath(); ctx.arc(cx + f * R, ly, 2.5 * k, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.arc(gx, cy + f * V, 2.5 * k, 0, TAU); ctx.stroke();
    }
    // the centre marks: you
    ctx.strokeStyle = '#ffd97a'; ctx.lineWidth = 2.5 * Math.sqrt(k);
    ctx.beginPath(); ctx.moveTo(cx, ly - 9 * k); ctx.lineTo(cx, ly + 9 * k); ctx.moveTo(gx - 9 * k, cy); ctx.lineTo(gx + 9 * k, cy); ctx.stroke();
    // the runway on the localiser scale: a little runway seen from the approach
    const rx = cx + loc * R;
    ctx.fillStyle = Math.abs(loc) >= 1 ? '#ff7a5c' : LOC;
    ctx.beginPath(); ctx.moveTo(rx - 3 * k, ly - 12 * k); ctx.lineTo(rx + 3 * k, ly - 12 * k); ctx.lineTo(rx + 7 * k, ly + 12 * k); ctx.lineTo(rx - 7 * k, ly + 12 * k); ctx.closePath(); ctx.fill();
    if (!phone) {
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(rx, ly - 10); ctx.lineTo(rx, ly + 11); ctx.stroke(); ctx.setLineDash([]);
    }
    // the glide path on the glideslope scale: a triangle pointing at the scale
    const gy = cy - gs * V;
    ctx.fillStyle = Math.abs(gs) >= 1 ? '#ff7a5c' : GS;
    ctx.beginPath(); ctx.moveTo(gx - 3 * k, gy); ctx.lineTo(gx + 13 * k, gy - 8 * k); ctx.lineTo(gx + 13 * k, gy + 8 * k); ctx.closePath(); ctx.fill();
    if (phone) { ctx.restore(); return; }
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
    const at = (t) => clamp(cx, ctx.measureText(t).width / 2 + 12, edge - ctx.measureText(t).width / 2);
    const all = tr('ON THE CENTRELINE AND THE GLIDE PATH');
    if (both) say(all, at(all), ly + 30, '#54d68a');
    else words.forEach(([t, c], i) => say(t, at(t), ly + 28 + i * 15, c));
    ctx.restore();
  },

  // The approach in the world: a ring on the extended centreline at the height of the glide
  // path every nautical mile out to 12 nm, and the threshold with the runway's name. Projected
  // through whichever camera is in use, so it works from the cockpit and from every outside
  // view; flying down the line of rings is flying the ILS. The rings are see-through, so the
  // airport shows through them, and where they crowd together far out the ones that would
  // overlap are left out, and so are the distances that would run into another label.
  drawApproachPath(ctx, w, h, fl) {
    const p = fl.phase;
    if (fl.st.onGround || fl.navFailed || !(p === 'DESCENT' || p === 'APPROACH' || p === 'CRUISE')) return;
    if (Career.settings.landingAid === false) return;
    // on the localiser by the distance itself, before it by the distance over the cosine of the
    // angle between the track and the way to the runway (Flight.accelDistNm): flown past or
    // round the airport, or away from it, it is longer, so the path is not up too early
    const nm = p === 'APPROACH' ? fl.distToRunwayNm() : fl.accelDistNm();
    if (nm > SIM.GLIDE_AID_NM) return;
    const a = fl.arrival, cam = Scene3D.camera;
    const v = this.pathVec || (this.pathVec = new THREE.Vector3());
    cam.updateMatrixWorld();
    const top = Cockpit.panelTop(h);
    const fade = clamp((SIM.GLIDE_AID_NM - nm) / SIM.GLIDE_AID_FADE_NM, 0, 1);
    const pts = [];
    for (let k = 0; k <= 12; k++) {
      const q = World.at(a, -a.half - k * NM, 0);
      v.set(q.x, a.elev + 15 + k * NM * Math.tan(SIM.GLIDESLOPE_DEG * DEG), q.z).project(cam);
      if (v.z > 1 || v.z < -1) { pts.push(null); continue; }
      // the dots grow as they come closer
      const dist = Math.hypot(q.x - cam.position.x, a.elev + k * NM * 0.05 - cam.position.y, q.z - cam.position.z);
      pts.push({ x: (v.x + 1) / 2 * w, y: (1 - v.y) / 2 * h, k, r: clamp(4500 / Math.max(1, dist), 1.8, 6.5) });
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, top);
    ctx.clip();
    ctx.globalAlpha = fade;
    ctx.strokeStyle = 'rgba(230,92,240,0.35)'; ctx.lineWidth = 1.2;
    ctx.beginPath();
    let pen = false;
    for (const q of pts) { if (!q) { pen = false; continue; } if (pen) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); pen = true; }
    ctx.stroke();
    ctx.font = '700 11px system-ui, sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const boxes = [];                           // the labels drawn so far: [x0, y0, x1, y1]
    const free = (b) => boxes.every((o) => b[2] < o[0] || b[0] > o[2] || b[3] < o[1] || b[1] > o[3]);
    // the threshold's tag with the runway's name (drawn over the rings, its place kept first)
    const th = pts[0];
    const tag = th && tr('Runway {rwy}', { rwy: a.rwyName }), tagW = th ? ctx.measureText(tag).width + 12 : 0;
    if (th) boxes.push([th.x + 12, th.y - 13, th.x + 12 + tagW, th.y + 4]);
    // the rings, the nearest (the biggest) first
    const drawn = [];
    for (let i = pts.length - 1; i >= 1; i--) {
      const q = pts[i];
      if (!q) continue;
      if (drawn.some((o) => Math.hypot(q.x - o.x, q.y - o.y) < q.r + o.r + 2)) continue;
      drawn.push(q);
      ctx.fillStyle = 'rgba(230,92,240,0.22)';
      ctx.strokeStyle = 'rgba(240,120,250,0.9)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, TAU); ctx.fill(); ctx.stroke();
    }
    // the distance every 4 nm, where it has room
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(8,12,18,0.7)'; ctx.fillStyle = 'rgba(240,200,250,0.95)';
    for (const q of drawn) {
      if (q.k % 4) continue;
      const t = Units.dist(q.k), tw = ctx.measureText(t).width, x = q.x + q.r + 5;
      const b = [x - 2, q.y - 8, x + tw + 2, q.y + 8];
      if (!free(b)) continue;
      boxes.push(b);
      ctx.strokeText(t, x, q.y); ctx.fillText(t, x, q.y);
    }
    // the threshold: a white marker pointing down at it and the runway's name on a dark tag
    if (th) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.moveTo(th.x, th.y + 1); ctx.lineTo(th.x - 5, th.y - 7); ctx.lineTo(th.x + 5, th.y - 7); ctx.closePath(); ctx.fill();
      const [bx, by] = boxes[0];
      ctx.fillStyle = 'rgba(10,14,20,0.62)';
      roundRect(ctx, bx, by, tagW, 17, 8.5); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillText(tag, bx + 6, by + 9);
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
    this.releaseEmergencyAlt();

    // a touchdown at the destination ends the flying part, whatever the phase says
    if (AIRBORNE_PHASES.includes(p) && st.onGround && st.wasAirborne) {
      if (fl.nearestApt() === arr && fl.landed) { fl.setPhase('ROLLOUT'); return; }
      if (fl.nearestApt() === apt && speed < 30) {
        fl.fail('returned', tr('You landed back at {id} — the load was not delivered.', { id: apt.id }));
        return;
      }
    }

    // off the ground without asking the tower: the flight goes on (the prompts and the arrow move
    // on to the climb), but the tower is not amused
    if ((p === 'ENGINE_START' || p === 'TAXI_OUT' || p === 'HOLD_SHORT') && !st.onGround) {
      fl.noClearance = true;
      st.parkingBrake = false;
      fl.setPhase('TAKEOFF');
      fl.warn('CLEARANCE', tr('Tower: you took off without a clearance — this will be reported'));
      return;
    }

    // taxiing at TAXI.FINE_OVER times the limit there (sim/taxilimit.js; off the runway, where a
    // take-off or a landing roll is not taxiing): reported once a flight and fined on the
    // debrief, the fastest speed remembered
    const taxi = fl.taxi;
    if (taxi && st.onGround && speed > taxi.limit * TAXI.FINE_OVER) {
      const here = fl.nearestApt(), loc = here ? World.local(here, st.pos.x, st.pos.z) : null;
      const onRunway = loc && Math.abs(loc.across) < here.rwyHalfWidth + 10 && Math.abs(loc.t) < here.half + 100;
      if (!onRunway) {
        if (!fl.taxiOverspeed) fl.warn('TAXISPEED', tr('Taxi overspeed — {v} kt, the limit is {max} kt: this will be reported', { v: Math.round(speed), max: taxi.limit }));
        fl.taxiOverspeed = Math.max(fl.taxiOverspeed || 0, Math.round(speed));
      }
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
        (g && g.visible ? '<br>' + tr('{d} to go', { d: fmtDist(g.remaining) }) : '') + this.taxiSpeedHint());
    } else if (p === 'HOLD_SHORT') {
      HUD.setPrompt('<b>' + tr('Holding point runway {rwy}', { rwy: apt.rwyName }) + '</b>' + (speed > 2 ? ' · <b>' + tr('stop here') + '</b>' : '') +
        '<br>' + tr('set flaps {n} <kbd>F</kbd>, then <kbd>Enter</kbd> for the take-off clearance', { n: this.takeoffFlaps() }));
    } else if (p === 'TAKEOFF') {
      // on the ground the steps still to do, in order, the next one in bold: the take-off
      // flaps, onto the runway and lined up on the centreline, full power and rotate at Vr
      let steps = '';
      if (st.onGround) {
        const vr = Math.round(fl.vr());
        const loc = World.local(apt, st.pos.x, st.pos.z);
        const lined = Math.abs(loc.across) < SIM.LINEUP_ACROSS_M && Math.abs(wrapDeg(fl.headingDeg() - apt.hdgDeg)) < SIM.LINEUP_HDG_DEG;
        const todo = [];
        if (st.flapsTarget < this.takeoffFlaps() && st.ias / KTS < fl.vr()) todo.push(tr('flaps {n} <kbd>F</kbd>', { n: this.takeoffFlaps() }));
        if (!lined && speed < 40) todo.push(tr('taxi onto the runway and line up — follow the arrow'));
        todo.push(tr(Input.invertPitch ? 'full power <kbd>9</kbd>, rotate at Vr {vr} kt — nose up <kbd>↑</kbd>' : 'full power <kbd>9</kbd>, rotate at Vr {vr} kt — pull back <kbd>↓</kbd>', { vr }));
        steps = todo.map((t, i) => (i ? t : '<b>' + t + '</b>')).join(' · ');
      }
      HUD.setPrompt(st.onGround
        ? '<b>' + tr('Runway {rwy}', { rwy: apt.rwyName }) + ' · ' + tr(fl.noClearance ? 'no clearance!' : 'cleared for take-off') + '</b><br>' + steps
        : tr('<b>Positive climb</b> · gear up <kbd>G</kbd>'));
      if (!st.onGround && fl.altAgl() > 150) {
        fl.setPhase('CLIMB');
        fl.ap.alt = this.cruiseAltFt(); fl.ap.altSet = false;
        fl.info(tr('Climb to {alt} ft — engage the autopilot <kbd>Y</kbd>', { alt: fmtAltFt(fl.ap.alt) }), 'AP');
      }
    } else if (p === 'CLIMB') {
      HUD.setPrompt(tr('<b>Climb</b> to {alt} ft', { alt: fmtAltFt(fl.ap.alt) }) +
        (st.gearTarget === 1 ? ' · ' + tr('gear up <kbd>G</kbd>') : '') + (st.flapsTarget > 0 && st.ias / KTS > fl.vr() + 25 ? ' · ' + tr('flaps up <kbd>V</kbd>') : '') +
        (!fl.ap.on ? ' · ' + tr('autopilot <kbd>Y</kbd>') : ''));
      if (Math.abs(st.pos.y / FT - fl.ap.alt) < 300) {
        fl.setPhase('CRUISE');
        fl.info(tr('Cruise · time acceleration: <kbd>T</kbd> faster, <kbd>R</kbd> slower'), 'TIME');
      }
      if (fl.distToDestNm() < this.descentNm()) this.startDescent();
    } else if (p === 'CRUISE') {
      const low = fl.ap.emergency && fl.ap.alt < this.cruiseAltFt() - 1000;
      HUD.setPrompt('<b>' + tr('Cruise · {nm} nm to {id}', { nm: Math.round(fl.distToDestNm()), id: arr.id }) + '</b><br>' +
        (fl.ap.on ? tr('autopilot NAV · time <kbd>T</kbd> faster, <kbd>R</kbd> slower (x{n})', { n: fl.env.timeAccel }) : tr('autopilot <kbd>Y</kbd> flies the route')) +
        (low ? '<br>' + tr('{alt} ft for the emergency — back to {cruise} ft when it is over, or now with <kbd>N</kbd>', { alt: fmtAltFt(fl.ap.alt), cruise: fmtAltFt(this.cruiseAltFt()) }) : ''));
      if (fl.distToDestNm() < this.descentNm()) this.startDescent();
    } else if (p === 'DESCENT') {
      HUD.setPrompt(tr('<b>Descent</b> to {alt} ft · {nm} nm to runway {rwy}', { alt: fmtAltFt(fl.ap.alt), nm: Math.round(fl.distToRunwayNm()), rwy: arr.rwyName }) + this.spoilerHint());
      fl.navTarget();                                   // keeps the localiser capture up to date
      if (fl.locCaptured && fl.distToRunwayNm() < SIM.APPROACH_NM) {
        fl.setPhase('APPROACH');
        fl.info(tr('Approach runway {rwy} · Vref {v} kt · flaps and gear down', { rwy: arr.rwyName, v: Math.round(fl.vRef()) }));
      }
    } else if (p === 'APPROACH') {
      const nm = fl.distToRunwayNm();
      const need = [];
      // configured before the glideslope: the flaps step by step as the speed allows, then the gear
      if (st.flapsTarget < fl.ac.flaps.length && nm < SIM.FLAPS_PROMPT_NM && this.nextFlapFits()) need.push(this.landingFlapsText());
      if (st.gearTarget < 1 && nm < SIM.GEAR_PROMPT_NM) need.push(tr('<b>gear down</b> <kbd>G</kbd>'));
      const head = '<b>' + tr('Approach · runway {rwy}', { rwy: arr.rwyName }) + '</b> · ' + nm.toFixed(1) + ' nm · Vref ' + Math.round(fl.vRef()) + ' kt';
      if (this.practice) {
        // the gear and the flaps are part of the practice
        const cfg = [];
        if (st.gearTarget < 1) cfg.push(tr('<b>gear down</b> <kbd>G</kbd>'));
        if (st.flapsTarget < fl.ac.flaps.length) cfg.push(this.landingFlapsText());
        HUD.setPrompt(head + '<br>' + (!this.practice.handed
          ? tr('practice: the autopilot holds the glide path for {s} s, then it is yours', { s: PRACTICE.AP_SECONDS })
          : cfg.length ? cfg.join(' · ') + ' · ' + tr('slow to Vref')
            : tr('practice: land, then idle <kbd>0</kbd> and brake <kbd>B</kbd> below {v} kt', { v: SIM.ROLLOUT_EXIT_KT })));
      } else {
        HUD.setPrompt(head + (need.length ? '<br>' + need.join(' · ') : (fl.ap.on ? '<br>' + tr('autopilot flies the ILS down to 200 ft') : '')) + this.spoilerHint());
      }
      if (st.spoiler && !st.onGround && fl.altAgl() < 150) fl.warn('SPOILERLAND', tr('Spoiler in for the landing — <kbd>/</kbd>'));
      if (nm < 1.5 && fl.altAgl() < 90 && st.gearTarget < 1) fl.warn('TOOLOWGEAR', tr('TOO LOW — GEAR'));
      // over the runway and still flying at its far end: go around and try again
      const loc = World.local(arr, st.pos.x, st.pos.z);
      const overRunway = Math.abs(loc.across) < 400 && loc.t > -arr.half && loc.t < arr.half;
      if (overRunway && !st.onGround) fl.overRunway = true;
      if (this.practice && ((fl.overRunway && !st.onGround && loc.t > arr.half - 150) || nm > this.practice.startNm + 2 || fl.altAgl() > PRACTICE.MAX_AGL_FT * FT)) {
        this.endPractice(false, tr('No landing — you flew away from the runway'));
        return;
      }
      if (fl.overRunway && !st.onGround && loc.t > arr.half - 150) {
        fl.warn('GOAROUND', tr('Go around — climb, and fly the approach again'));
        fl.overRunway = false; fl.locCaptured = false; fl.ap.gs = false;
        fl.ap.alt = Math.round((arr.elev + 2500 * FT) / FT / 100) * 100; fl.ap.altSet = false;
        fl.setPhase('DESCENT');
      }
    } else if (p === 'ROLLOUT') {
      HUD.setPrompt('<b>' + tr('Touchdown') + ' ' + (fl.landed ? fl.landed.fpm + ' fpm' : '') + '</b><br>' +
        tr('idle <kbd>0</kbd>, spoiler <kbd>/</kbd> (it puts the weight on the wheels), brakes <kbd>B</kbd> — slow below {v} kt', { v: SIM.ROLLOUT_EXIT_KT }));
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
      if (st.spoiler && !this.spoilerTold) { this.spoilerTold = true; fl.info(tr('Off the runway — spoiler in <kbd>/</kbd>')); }
      const gate = this.arrivalGate, g = fl.guidance, fo = fl.copilot;
      const d = Math.hypot(st.pos.x - gate.standX, st.pos.z - gate.standZ);
      const align = Math.abs(wrapDeg(fl.headingDeg() - gate.parkHdg));
      const inBox = d < SIM.PARK_RADIUS_M && align < SIM.PARK_ALIGN_DEG;
      if (fo && fo.on && fo.done) this.copilotOff(tr('First officer: your controls — turn in to {gate} and stop on the stop bar', { gate: gateName(gate) }));
      if (fo && fo.on) {
        HUD.setPrompt('<b>' + tr('The first officer is taxiing to {gate}', { gate: gateName(gate) }) + '</b>' +
          (g && g.visible ? ' · ' + tr('{d} to go', { d: fmtDist(g.remaining) }) : '') + '<br>' +
          (Input.isCoarse ? tr('<kbd>Enter</kbd> takes the controls back')
            : tr('time <kbd>T</kbd> faster, <kbd>R</kbd> slower (x{n}) · <kbd>Enter</kbd> takes the controls back', { n: fl.env.timeAccel })));
      } else if (inBox && speed < 1.5) {
        if (!st.parkingBrake) HUD.setPrompt(tr('<b>In the parking box</b><br>set the parking brake — <kbd>Space</kbd>'));
        else {
          fl.setPhase('SHUTDOWN');
          sys.stopEngines();
          fl.info(tr('Parking brake set — engines shutting down'));
        }
      } else {
        const flights = Career.flightsIn(fl.ac.id);
        const help = d < 80 ? '<br>' + tr('stop on the stop bar — {d} m', { d: Math.round(d) }) + (align > SIM.PARK_ALIGN_DEG ? ', ' + tr('straighten up') : '')
          : Copilot.left(fl) < COPILOT.HANDOVER_M ? ''
          : flights >= COPILOT.FLIGHTS ? '<br>' + tr('<kbd>Enter</kbd> — the first officer taxis, time x{n}', { n: COPILOT.TIME_ACCEL })
          : '<br>' + tr('after {n} flights in this type the first officer taxis for you ({k} of {n})', { n: COPILOT.FLIGHTS, k: flights });
        HUD.setPrompt('<b>' + tr('Taxi to {gate}', { gate: gateName(gate) }) + '</b> · ' +
          tr(fl.followMe && Copilot.left(fl) > 0 ? 'follow the FOLLOW ME car' : 'follow the arrow') + this.taxiSpeedHint() + help);
      }
    } else if (p === 'SHUTDOWN') {
      HUD.setPrompt(tr('<b>Shutting down</b> · {ac} at {gate}', { ac: fl.ac.name, gate: gateName(this.arrivalGate) }));
      if (sys.allStopped) fl.setPhase('PARKED');
    } else if (p === 'PARKED') {
      HUD.setPrompt('');
      // the camera flies out to the aeroplane at its gate, then the debrief
      if (!this.debriefShown) { this.debriefShown = true; if (!this.startCine('outro')) this.finishFlight(false); }
    }

    // fuel starvation
    if (st.fuel <= 0.5 && !st.onGround) fl.warn('FUEL', tr('Out of fuel — glide to the nearest field'));
    // ground proximity: not on a stable final, where the ground is meant to come up
    if (!st.onGround && fl.altAgl() > 30 && !(p === 'APPROACH' && fl.onCorridor()) && p !== 'TAKEOFF' && fl.terrainAhead() < 120) {
      fl.warn('TERRAIN', tr('TERRAIN — PULL UP'));
    }
  },

  // the prompt's word on the taxi speed (sim/taxilimit.js): over the limit (amber), or more
  // than TAXI.RED_OVER times over it (red)
  taxiSpeedHint() {
    const t = this.flight.taxi;
    if (!t || !t.level) return '';
    const v = Math.round(t.shown);
    return ' · <b' + (t.level > 1 ? ' class="bad">' + tr('too fast — slow down to {v} kt', { v }) : '>' + tr('slow down to {v} kt', { v })) + '</b>';
  },

  // When the spoiler (the speed brake) helps, and when it has to go in: high on the descent it
  // gets you down, too fast on the approach it slows you, and it is in before the landing
  // (on the runway it goes out again, to put the weight on the wheels).
  spoilerHint() {
    const fl = this.flight, st = fl.st, arr = fl.arrival;
    if (st.onGround) return '';
    if (fl.phase === 'DESCENT') {
      if (fl.ap.on) return '';                          // the autopilot works the speed brake itself
      const high = fl.aboveProfileFt() > 0;
      if (high && !st.spoiler) return '<br>' + tr('<b>high</b> — spoiler <kbd>/</kbd> to come down faster');
      if (!high && st.spoiler) return '<br>' + tr('on the profile — spoiler in <kbd>/</kbd>');
      return '';
    }
    if (st.spoiler) return '<br>' + tr('<b>spoiler in</b> <kbd>/</kbd> before the landing');
    if (st.ias / KTS > fl.vRef() + 40 && fl.distToRunwayNm() < 12) return '<br>' + tr('<b>fast</b> — idle and spoiler <kbd>/</kbd> to slow down');
    return '';
  },

  // the next flap step fits the speed now (or it is the last few miles: then it is asked for anyway)
  nextFlapFits() {
    const fl = this.flight, f = fl.ac.flaps[fl.st.flapsTarget];
    return !f || fl.st.ias / KTS <= f.vfe + 5 || fl.distToRunwayNm() < SIM.GEAR_PROMPT_NM;
  },
  // the flaps to set now: the furthest step the speed allows, at least the next one
  landingFlapsText() {
    const fl = this.flight, flaps = fl.ac.flaps, ias = fl.st.ias / KTS;
    let n = fl.st.flapsTarget + 1;
    while (n < flaps.length && flaps[n].vfe + 5 >= ias) n++;
    return tr('<b>flaps {n}</b> <kbd>F</kbd>', { n });
  },
  takeoffFlaps() { return this.flight.ac.flaps.length >= 5 ? 2 : 1; },
  cruiseAltFt() {
    const fl = this.flight;
    const nm = fl.routeNm();
    // short hops stay low, longer legs climb towards the type's cruise level
    const ft = clamp(nm * 120, 6000, fl.ac.cruiseAlt / FT * (nm > 250 ? 0.92 : 0.55));
    return Math.round((Math.max(ft, (Math.max(fl.world.elev, fl.arrival.elev) + 1500) / FT)) / 500) * 500;
  },
  // how far out the descent starts (Flight.descentStartNm)
  descentNm() { return this.flight.descentStartNm(); },
  // An altitude a checklist chose (icing: lower, out of the cloud; the cabin altitude: 10 000 ft)
  // holds only while the emergency lasts: the ice gone with the anti-ice on, or the cabin holding
  // its pressure again, and SIM.EMERGENCY_ALT_HOLD_S of flight later, the autopilot climbs back to
  // the flight plan's altitude (held for good, a whole leg was flown at 2 300 ft, hours late).
  // N, the top of descent or an altitude the pilot selects ends it too.
  releaseEmergencyAlt() {
    const fl = this.flight, sys = this.systems, ap = fl.ap;
    if (!ap.emergency) return;
    if (!ap.altSet || (fl.phase !== 'CLIMB' && fl.phase !== 'CRUISE')) { ap.emergency = null; return; }
    const over = !sys.checklist && (ap.emergency === 'icing' ? !fl.env.forcedIce && sys.antiIce && fl.env.iceAmount < 0.05
      : ap.emergency === 'depress' ? sys.pressurised && !sys.depressurised : true);
    if (!over) { ap.emergencyOver = null; return; }
    if (ap.emergencyOver === null || ap.emergencyOver === undefined) ap.emergencyOver = fl.elapsed;
    if (fl.elapsed - ap.emergencyOver < SIM.EMERGENCY_ALT_HOLD_S) return;
    ap.emergency = null;
    ap.alt = this.programAltFt(); ap.altSet = false;
    fl.info(tr('The emergency is over — autopilot back to the flight plan, ALT {alt} ft', { alt: fmtAltFt(ap.alt) }), 'AP');
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
    fl.ap.alt = Math.round((arr.elev + 2500 * FT) / FT / 100) * 100; fl.ap.altSet = false;
    this.applyArrivalWeather();
    fl.info(tr('Top of descent — {id} runway {rwy}, descend to {alt} ft', { id: arr.id, rwy: arr.rwyName, alt: fmtAltFt(fl.ap.alt) }));
  },
  applyArrivalWeather() {
    const env = this.flight.env, w = this.setup.weather.arr;
    env.surfaceWind = { dir: w.dir, speed: w.speed };
    env.turb = w.turbulence;
    env.qnh = w.qnh; env.temp = w.temp; env.vis = w.vis;
    env.tempElev = this.flight.arrival.elev;       // the height the temperature was measured at
    env.cloudBase = this.flight.arrival.elev + w.cloudBase;
    env.cloudTop = this.flight.arrival.elev + w.cloudTop;
    env.precip = w.precip; env.snowy = w.snow;
  },

  beginTaxiIn() {
    const fl = this.flight, a = fl.arrival, st = fl.st;
    const loc = World.local(a, st.pos.x, st.pos.z);
    const exit = Guidance.exitFor(a, loc.t, Math.hypot(st.vel.x, st.vel.z));
    this.arrivalRoute = World.findRoute(a, exit, this.arrivalGate.node);
    fl.setPhase('EXIT');
    fl.info(tr(fl.followMe ? 'Ground: welcome to {id} — a FOLLOW ME car waits past the exit and leads you to {gate}'
      : 'Leave the runway at the next exit and taxi to {gate}', { id: a.id, gate: gateName(this.arrivalGate) }));
  },

  // ---------- actions ----------
  action(name, arg) {
    // the look round an airport: Enter, Space and Esc end it
    if (this.mode === 'tour') { if (name === 'starter' || name === 'parkBrake' || name === 'pause') this.skipCine(); return; }
    if (name === 'cheat') { this.cheat(arg); return; }
    if (this.mode === 'paused') { if (name === 'pause') this.pause(); return; }
    if (this.mode !== 'flying') return;
    // the camera's flight: Enter, Space and Esc skip it, the rest waits for the cockpit
    if (this.cineShot()) { if (name === 'starter' || name === 'parkBrake' || name === 'pause') this.skipCine(); return; }
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
          // the altitude the flight plan wants now (the cruise level, or 2 500 ft over the arrival
          // after the top of descent), not wherever the aeroplane happens to be; an altitude the
          // pilot or a checklist chose stays (on the approach the glideslope takes over anyway)
          if (!fl.ap.altSet && fl.phase !== 'APPROACH') fl.ap.alt = this.programAltFt();
        }
        fl.info(tr('Autopilot') + ' ' + (fl.ap.on ? 'CMD · ' + (fl.ap.nav ? 'NAV' : 'HDG ' + fl.ap.hdg) + ' · ALT ' + Units.alt(fl.ap.alt) : tr('off')), 'AP');
        Audio2.cue('click');
        break;
      case 'timeFaster': fl.changeTimeAccel(1); break;
      case 'timeSlower': fl.changeTimeAccel(-1); break;
      case 'camera':
      {
        const modes = VIEW.MODES, n = modes.length;
        // C the next view, X (or Shift+C) the one before, Z straight to the cockpit
        this.camMode = arg === 'cockpit' ? 'cockpit' : modes[(modes.indexOf(this.camMode) + (arg === -1 ? n - 1 : 1)) % n];
        fl.info(tr('View: {v}', { v: tr(VIEW.NAMES[this.camMode]) }));
      }
        break;
      case 'map': HUD.toggleMap(); break;
      case 'prompt': HUD.togglePrompt(); break;
      case 'brightness':
        Instruments.nextLight();
        fl.info([tr('Instrument lights: dim'), tr('Instrument lights: medium'), tr('Instrument lights: bright')][Instruments.light] ||
          tr('Instruments hidden — <kbd>I</kbd> brings them back'));
        break;
      case 'spoiler': fl.toggleSpoiler(); fl.info(tr(st.spoiler ? 'Spoiler out' : 'Spoiler in')); break;
      case 'antiIce':
        sys.antiIce = !sys.antiIce;
        fl.info(tr(sys.antiIce ? 'Engine and wing anti-ice ON' : 'Engine and wing anti-ice off'));
        break;
      case 'parkBrake':
        if (fl.phase === 'PUSHBACK') break;
        if (fl.copilot && fl.copilot.on) this.copilotOff(tr('You have control — the first officer let go'));
        st.parkingBrake = !st.parkingBrake;
        fl.info(tr(st.parkingBrake ? 'Parking brake set' : 'Parking brake released'));
        Audio2.cue('parkbrake', st.parkingBrake);
        break;
      case 'altUp': fl.ap.alt = Math.min(fl.ap.alt + 500, 41000); fl.ap.altSet = true; fl.ap.emergency = null; fl.info(tr('Selected altitude {alt} ft', { alt: fmtAltFt(fl.ap.alt) })); break;
      case 'altDown': fl.ap.alt = Math.max(1000, fl.ap.alt - 500); fl.ap.altSet = true; fl.ap.emergency = null; fl.info(tr('Selected altitude {alt} ft', { alt: fmtAltFt(fl.ap.alt) })); break;
      case 'hdgUp': case 'hdgDown':
        if (fl.ap.nav) { fl.ap.nav = false; fl.ap.hdg = Math.round(fl.headingDeg()); }
        fl.ap.hdg = (fl.ap.hdg + (name === 'hdgUp' ? 5 : 355)) % 360;
        fl.info(tr('Heading {h}° (HDG mode — <kbd>N</kbd> goes back to the programme)', { h: String(fl.ap.hdg).padStart(3, '0') }));
        break;
      case 'nav':
        // back on the programme: NAV along the route and the altitude for this phase of the flight
        if (st.onGround) { fl.info(tr('NAV: the autopilot flies the route once you are in the air')); break; }
        fl.ap.nav = true; fl.locCaptured = false;
        fl.ap.alt = this.programAltFt(); fl.ap.altSet = false;
        if (!fl.ap.on) { fl.ap.on = true; fl.ap.vsI = 0; }
        fl.info(tr('Autopilot back on the programme — NAV to {id} · ALT {alt} ft', { id: fl.arrival.id, alt: fmtAltFt(fl.ap.alt) }), 'AP');
        Audio2.cue('click');
        break;
      case 'throttlePreset':
        if (fl.copilot && fl.copilot.on) this.copilotOff(tr('You have control — the first officer let go'));
        fl.setThrottle(arg);
        break;
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
      st.parkingBrake = false;
      fl.setPhase('TAKEOFF');
      this.takeoffClearance();
    } else if (p === 'TAXI_OUT') {
      fl.warn('HOLD', tr('Taxi to the holding point first'));
    } else if (p === 'EXIT') {
      this.toggleCopilot();
    }
  },

  // Enter after the landing: the first officer taxis in (sim/copilot.js), once the pilot has flown
  // COPILOT.FLIGHTS flights in the type; Enter again takes the controls back
  toggleCopilot() {
    const fl = this.flight, c = fl.copilot;
    if (c && c.on) { this.copilotOff(tr('You have control — the first officer let go')); return; }
    const flights = Career.flightsIn(fl.ac.id);
    if (flights < COPILOT.FLIGHTS) {
      fl.warn('COPILOT', tr('The first officer taxis in once you have flown {n} flights in the {ac} — {k} so far', { n: COPILOT.FLIGHTS, ac: fl.ac.name, k: flights }));
      return;
    }
    if (Copilot.left(fl) < COPILOT.HANDOVER_M) { fl.info(tr('Nearly there — park it yourself')); return; }
    fl.copilot = { on: true, thrI: 0, done: false };
    fl.copilotTime(true);
    fl.info(tr('First officer: my controls — taxiing to {gate}', { gate: gateName(this.arrivalGate) }));
    Audio2.cue('click');
  },
  // the first officer lets go: the time back to x1, the brakes off, the throttle where it is
  copilotOff(text) {
    const fl = this.flight;
    fl.copilot.on = false;
    fl.st.brakeInput = 0;
    fl.copilotTime(false);
    fl.info(text);
  },

  takeoffClearance() {
    const fl = this.flight, w = fl.env.surfaceWind;
    fl.info(tr('Tower: wind {d}° {v} kt, runway {rwy} cleared for take-off',
      { d: String(Math.round(w.dir)).padStart(3, '0'), v: Math.round(w.speed), rwy: fl.world.rwyName }));
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
    // in the Mriya's assembly hall the hall's own cheats (ui/mriya.js)
    if (typeof MriyaScreen !== 'undefined' && MriyaScreen.isOpen()) { MriyaScreen.cheat(digit); return; }
    if (digit === 0) {
      HUD.showBanner('Cheats: Alt+1 full fuel · Alt+2 no emergencies · Alt+3 jump to final · Alt+4 +10 000 kr · ' +
        'Alt+5 repair · Alt+6 time x' + SIM.TIME_ACCEL_CHEAT, 'cheat', 7000);
      return;
    }
    const fl = this.flight;
    if (!fl || this.mode !== 'flying') return;
    if (this.cineShot() && Cinematic.shot.kind === 'intro') this.endCine();
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
  // (the practice starts as far out as it flies in PRACTICE.AP_SECONDS on the autopilot, so it
  // hands over PRACTICE.HANDOVER_NM out)
  placeOnFinal(nm, practice) {
    const fl = this.flight, st = fl.st, a = fl.arrival;
    st.gearTarget = st.gear = 0;
    st.flaps = st.flapsTarget = practice ? 0 : 2;
    const spd = (practice ? Math.max(fl.vRef() + 25, fl.vsNow() * 1.4) : Math.min(fl.vRef() * 1.35, fl.ac.flaps[1].vfe - 15)) * KTS;
    if (practice) {
      nm = PRACTICE.HANDOVER_NM + spd * Math.cos(SIM.GLIDESLOPE_DEG * DEG) * PRACTICE.AP_SECONDS / NM;
      this.practice.startNm = nm;
    }
    const dist = nm * NM;
    const p = World.at(a, -a.half - dist, 0);
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
    this.stopCine();
    this.contract = contract;
    this.spoilerTold = false;
    this.setup = Career.flightSetup(contract, { seed: opts.seed || 0, skipPushback: opts.skipPushback });
    const s = this.setup;
    // the flight's own world: projection, terrain, airports laid out
    if (World.key !== contract.fromId + '>' + contract.toId) {
      World.prepare(contract.fromId, contract.toId);
      Scene3D.setTheatre();
    }
    s.from = World.here[contract.fromId];
    s.to = World.here[contract.toId];
    this.drawGates(contract, s.from, s.to);
    s.gate = s.from.gates[contract.depGate];
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
    this.arrivalGate = s.to.gates[contract.arrGate];
    this.arrivalRoute = null;
    this.practice = opts.practice ? { t: 0, handed: false, fee: opts.fee || 0 } : null;
    this.flight.practice = !!this.practice;
    // the first landing at an airport: a FOLLOW ME car leads the way to the stand
    this.flight.followMe = !this.practice && Career.visitsTo(contract.toId) === 0;

    // weather into the flight environment
    const env = this.flight.env;
    const dep = s.weather.dep, cru = s.weather.cruise;
    env.surfaceWind = { dir: dep.dir, speed: dep.speed };
    env.altWind = { dir: cru.dir, speed: cru.speed };
    env.turb = dep.turbulence;
    env.qnh = dep.qnh;
    env.temp = dep.temp;
    env.tempElev = s.from.elev;
    env.vis = dep.vis;
    env.cloudBase = s.from.elev + dep.cloudBase;
    env.cloudTop = s.from.elev + dep.cloudTop;
    env.precip = dep.precip;
    env.snowy = dep.snow;
    // the time of day: the departure's local hour, the clock runs on with the flight (Scene3D)
    this.setup.timeOfDay = Career.timeOfDay;
    env.hour0 = TIME_OF_DAY[this.setup.timeOfDay].hour;
    // the night sky of this contract: the moon's phase (0 new, 0.5 full) and the season's stars
    env.moonPhase = (hashStr(contract.id + '/moon') >>> 0) % 10000 / 10000;
    env.month = Career.data.season || 0;

    const fx = s.fx;
    this.systems = Systems.init(this.flight, {
      rng: makeRng(s.seed ^ 0x5bd1e995), difficulty: Career.difficulty,
      responseFactor: fx.responseFactor * fx.responseFactor2, iceFactor: fx.iceFactor, hint: fx.hint
    });
    this.fuel0 = s.blockFuel;
    if (this.practice) {
      this.systems.noEmergencies = true;
      this.systems.queue = [];
      this.placeOnFinal(0, true);
    } else if (s.skipPushback) {
      // the short start pays no procedure bonus, so it skips the formalities: the engines are
      // running and the tower has already cleared you — flaps, line up, full power
      this.systems.runEngines();
      this.takeoffClearance();
    }

    Scene3D.setFlightGates(s.skipPushback ? [this.arrivalGate] : [s.gate, this.arrivalGate], this.arrivalGate);
    Scene3D.warmup(this.flight);
    HUD.reset();
    HUD.setPrompt('');
    HUD.updateStrip(this.flight, this.systems);
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
    // the camera flies in from a wide shot to the captain's seat (not into a practice on the final)
    if (!this.practice) this.startCine('intro');
  },

  // the stands at both ends, drawn with the contract (a contract from an older save draws them now)
  drawGates(contract, from, to) {
    if (contract.depGate < from.gates.length && contract.arrGate < to.gates.length) return;
    Object.assign(contract, World.pickGates(from, to, makeRng(hashStr(contract.id))));
    Career.save();
  },

  // ---------- a look round an airport (from the briefing, free: TOUR, render/cinematic.js) ----------
  // end: 'dep' or 'arr'. The own aeroplane stands where the flight finds it there: at the
  // departure stand (or the holding point, for the short start), or parked at the arrival stand;
  // the weather and the hour are the ones it meets there, in a clear spell. Nothing runs but the
  // camera; at the end (or Enter, Space, Esc, a tap) the briefing is back.
  tour(contract, end) {
    if (typeof Cinematic === 'undefined' || !Scene3D.camera) return;
    const boot = el('bootScreen');
    el('bootStatus').textContent = tr('Flying out to {id}…', { id: end === 'dep' ? contract.fromId : contract.toId });
    boot.hidden = false;
    el('screen').hidden = true;
    this.mode = 'ops';
    frame().then(frame).then(() => {
      this.startTour(contract, end);
      boot.hidden = true;
    });
  },

  startTour(contract, end) {
    this.stopCine();
    const s = Career.flightSetup(contract, { seed: 0, skipPushback: Career.skipPushback });
    if (World.key !== contract.fromId + '>' + contract.toId) {
      World.prepare(contract.fromId, contract.toId);
      Scene3D.setTheatre();
    }
    const from = World.here[contract.fromId], to = World.here[contract.toId];
    this.drawGates(contract, from, to);
    const dep = end === 'dep', a = dep ? from : to;
    const atHold = dep && s.skipPushback;
    const gate = dep ? from.gates[contract.depGate] : to.gates[contract.arrGate];
    this.contract = contract;
    this.practice = null;
    this.flight = Flight.init({ aircraft: s.aircraft, from: a, to, contract, gate, blockFuel: s.blockFuel, skipPushback: atHold });
    this.systems = Systems.init(this.flight, { rng: makeRng(s.seed), difficulty: Career.difficulty, noEmergencies: true });
    if (atHold) this.systems.runEngines();
    const fl = this.flight, env = fl.env, w = dep ? s.weather.dep : s.weather.arr;
    env.surfaceWind = { dir: w.dir, speed: w.speed };
    env.qnh = w.qnh; env.temp = w.temp; env.tempElev = a.elev;
    env.vis = Math.max(w.vis, TOUR.MIN_VIS_M);
    env.cloudBase = a.elev + Math.max(w.cloudBase, TOUR.MIN_CLOUD_M);
    env.cloudTop = Math.max(a.elev + w.cloudTop, env.cloudBase + 300);
    env.precip = w.precip; env.snowy = w.snow;
    // the local solar hour there: the departure's, or the landing's (the flight time and the
    // longitudes between)
    const hour = TIME_OF_DAY[Career.timeOfDay].hour;
    env.hour0 = dep ? hour : hour + contract.blockMin / 60 + (((to.lon - from.lon) % 360 + 540) % 360 - 180) / 15;
    env.moonPhase = (hashStr(contract.id + '/moon') >>> 0) % 10000 / 10000;
    env.month = Career.data.season || 0;

    Scene3D.setFlightGates(atHold ? [] : [gate], dep ? null : gate);
    Scene3D.warmup(fl);
    Cinematic.tour(fl, a);
    this.mode = 'tour';
    this.helpOpen = false;
    Input.active = true;          // Enter, Space and Esc end it (action)
    Input.reset();
    el('screen').hidden = true;
    el('hud').hidden = true;
    if (HUD.mapOpen) HUD.closeMap();
    Audio2.update(0, null, null);
    document.body.classList.add('touring');       // no flight controls over it (styles.css)
    const box = el('cine');
    box.hidden = false;
    box.classList.add('bars');
    const what = atHold ? tr('Your aircraft · holding point, runway {rwy}', { rwy: a.rwyName })
      : tr('Your aircraft · {gate}', { gate: esc(gateName(gate)) });
    const flag = typeof flagImg === 'function' ? flagImg(a) : '';
    this.tourCaps = [
      [0.6, Cinematic.shot.marks.runway, '<b>' + flag + esc(aptName(a)) + '</b><span>' + a.id + ' · ' + esc(aptCity(a)) + '</span>'],
      [Cinematic.shot.marks.runway + 0.8, Cinematic.shot.marks.apron, '<b>' + tr('Runway {rwy}', { rwy: a.rwyName }) + '</b><span>' + a.rwyLen + ' m · ' + Math.round(a.elev / FT) + ' ft</span>'],
      [Cinematic.shot.marks.own + 1.5, Infinity, '<b>' + what + '</b><span>' + esc(fl.ac.name) + '</span>']
    ];
    this.tourCap = -1;
    const cap = el('cineCaption');
    cap.classList.remove('on');
    el('cineSkip').innerHTML = Input.isCoarse ? esc(tr('Tap to skip')) : esc(tr('Skip')) + ' <kbd>Enter</kbd>';
    const f = el('cineFade');
    f.classList.remove('in'); void f.offsetWidth; f.classList.add('in');
    this.last = performance.now();
  },

  // each frame of the tour: only the camera moves (the scene round the aeroplane, which stands still)
  tourFrame(dt) {
    if (Cinematic.update(dt)) { this.endTour(); return; }
    const fl = this.flight, sh = Cinematic.shot;
    Scene3D.cine = Cinematic;
    Scene3D.panelHidden = true;
    Scene3D.camMode = 'cine';
    Scene3D.pipRect = null;
    Scene3D.update(dt, fl, this.systems);
    Scene3D.render();
    this.draw2d(dt);
    const i = this.tourCaps.findIndex((c) => sh.t >= c[0] && sh.t < c[1]);
    const cap = el('cineCaption');
    if (i !== this.tourCap) {
      this.tourCap = i;
      if (i >= 0) cap.innerHTML = this.tourCaps[i][2];
    }
    cap.classList.toggle('on', i >= 0);
  },

  endTour() {
    this.stopCine();
    document.body.classList.remove('touring');
    this.mode = 'briefing';
    this.flight = null;
    this.systems = null;
    Input.active = false;
    Input.reset();
    UI.showBriefing(this.contract.id);
  },

  // ---------- the camera's flights at the start and the end (render/cinematic.js) ----------
  // (left out of the headless runs)
  cineShot() { return typeof Cinematic !== 'undefined' ? Cinematic.shot : null; },

  startCine(kind) {
    if (typeof Cinematic === 'undefined' || !Scene3D.camera) return false;
    const fl = this.flight, c = this.contract;
    Cinematic.start(kind, fl, { atRunway: !!this.setup.skipPushback, fromOutside: kind === 'outro' && this.camMode !== 'cockpit' });
    this.camMode = 'cockpit';
    const box = el('cine');
    box.hidden = false;
    box.classList.toggle('bars', !Cinematic.inside());
    el('hud').hidden = true;
    if (HUD.mapOpen) HUD.closeMap();
    const flag = (a) => (typeof flagImg === 'function' ? flagImg(a) : '');
    const cap = el('cineCaption');
    cap.classList.remove('on');
    cap.innerHTML = kind === 'intro'
      ? '<b>' + routeHtml(flag(fl.world) + esc(aptCity(fl.world)), flag(fl.arrival) + esc(aptCity(fl.arrival))) + '</b><span>' + esc(c.client) + ' · ' + esc(fl.ac.name) + '</span>'
      : '<b>' + flag(fl.arrival) + esc(aptCity(fl.arrival)) + '</b><span>' + fl.arrival.id + ' · ' + esc(gateName(this.arrivalGate)) + '</span>';
    el('cineSkip').innerHTML = Input.isCoarse ? esc(tr('Tap to skip')) : esc(tr('Skip')) + ' <kbd>Enter</kbd>';
    if (kind === 'intro') {
      const f = el('cineFade');
      f.classList.remove('in'); void f.offsetWidth; f.classList.add('in');
    }
    return true;
  },

  // each frame of a shot: the camera, the letterbox bars while outside, the caption
  updateCine(dt) {
    if (Cinematic.update(dt)) { this.endCine(); return; }
    const sh = Cinematic.shot;
    el('cine').classList.toggle('bars', !Cinematic.inside());
    const cap = sh.kind === 'intro' ? sh.t > 0.6 && sh.t < CINEMATIC.CAPTION_S : sh.t > sh.inT1 + 0.8;
    el('cineCaption').classList.toggle('on', cap);
  },

  // Enter, Space, Esc or a tap: to the end of the shot (the next frame ends it, so the key that
  // skipped the fly-out does not also press a button of the debrief)
  skipCine() { if (this.cineShot()) Cinematic.skip(); },

  endCine() {
    const sh = this.cineShot();
    this.stopCine();
    if (!sh) return;
    if (sh.kind === 'outro') { this.finishFlight(false); return; }
    el('hud').hidden = false;
    Input.reset();
  },

  stopCine() {
    if (typeof Cinematic === 'undefined') return;
    Cinematic.stop();
    Scene3D.cine = null;
    const box = el('cine');
    box.hidden = true;
    box.classList.remove('bars');
    el('cineCaption').classList.remove('on');
    el('ui').style.opacity = '';
  },

  finishFlight(failed) {
    if (this.mode !== 'flying') return;
    const fl = this.flight, sys = this.systems;
    this.stopCine();
    this.mode = failed ? 'failed' : 'debrief';
    Input.active = false;
    el('hud').hidden = true;
    if (HUD.mapOpen) HUD.closeMap();
    const landed = fl.landed || { fpm: 0, bank: 0, ias: 0, vref: 0, crab: 0, fromThr: 0, offset: 0, damage: 0 };
    const diff = Career.difficulty;
    const grade = failed ? 'F' : this.gradeLanding(landed, fl, diff);
    const mishandled = sys.checklistFailed.length;
    const result = {
      contract: this.contract, grade, failed, mishandled,
      handled: sys.checklistDone.length,
      damage: clamp(fl.st.damage, 0, 1), fuelUsed: this.fuel0 - fl.st.fuel,
      blockSec: fl.elapsed, realSec: fl.realElapsed, pushbackSkipped: this.setup.skipPushback, timeOfDay: this.setup.timeOfDay,
      cheated: this.cheated, cheatsUsed: this.cheatsUsed,
      moneyFactor: fl.moneyFactor || 1, repPenalty: (fl.pendingRepPenalty || 0) + (fl.noClearance ? 5 : 0) + (fl.taxiOverspeed ? 2 : 0),
      noClearance: !!fl.noClearance, taxiOverspeed: fl.taxiOverspeed || 0
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
    this.stopCine();
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
  // (every half second of a flight, with the frame rate: AUTO_QUALITY)
  autoQuality() {
    if (Career.settings.quality !== 'auto') { if (Scene3D.shed.size) Scene3D.setShed([]); return; }
    const A = AUTO_QUALITY, now = performance.now(), per = 2;      // samples a second
    // a stutter while something big was built is not the scene being too heavy
    if (now - Scene3D.builtAt < A.GRACE_S * 1000) { this.lowFps = this.highFps = 0; return; }
    this.lowFps = this.fps < A.LOW_FPS ? (this.lowFps || 0) + 1 : 0;
    this.highFps = this.fps > A.HIGH_FPS ? (this.highFps || 0) + 1 : 0;
    const n = Scene3D.shed.size;
    if (this.lowFps >= A.LOW_S * per) {
      this.lowFps = 0;
      // slow again soon after a step was taken back: that one stays shed
      if (now - (this.raisedAt || -Infinity) < A.RELAPSE_S * 1000) this.shedFloor = n + 1;
      if (n < A.STEPS.length) Scene3D.setShed(A.STEPS.slice(0, n + 1));
      else if (this.quality !== 'low') {
        this.quality = this.quality === 'high' ? 'medium' : 'low';
        Scene3D.setQuality(this.quality);
        if (this.flight) Scene3D.warmup(this.flight);
      }
    } else if (this.highFps >= A.HIGH_S * per && n > (this.shedFloor || 0)) {
      this.highFps = 0;
      this.raisedAt = now;
      Scene3D.setShed(A.STEPS.slice(0, n - 1));
    }
  }
};

function frame() { return new Promise((r) => requestAnimationFrame(() => r())); }
function fmtAltFt(ft) { return Math.round(ft).toLocaleString('en-US'); }
// a stand's name in the game's language ("Gate 3")
function gateName(g) {
  if (!g.number) return tr(g.name);
  return g.terminals > 1 ? tr('Terminal {t}, gate {n}', { n: g.number, t: g.terminal }) : tr('Gate {n}', { n: g.number });
}
function pickQuality(setting) {
  if (setting && setting !== 'auto') return setting;
  return isCoarsePointer() ? 'medium' : 'high';
}

window.addEventListener('load', () => Game.boot());
