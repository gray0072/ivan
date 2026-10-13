'use strict';

// ============================================================
// World Aviation — after a collision (sim/collide.js): the camera
// shows it, and then what follows. Game hands over to it (mode
// 'incident') when the flight reports a touch (Flight.incident) or a
// failure with a `contact`, and runs Incident.frame every frame:
//   1. crash — the camera goes outside on the spot, shaken at the
//      impact, and circles it slowly (Cinematic.crash; INCIDENT.CRASH_S,
//      Enter, Space, Esc or a tap go on at once), the caption says what
//      was hit and how fast; a lost flight has smoke and fire rising;
//   2. a touch: the card asks — pay the compensation (Career.compensation)
//      and go on, or end the flight; while it is up the camera circles on;
//   3. paid: a fade to black and back, a tug at the nose pulls the
//      aeroplane back along the way it came (Collide.towPath, COLLIDE.TOW_M;
//      Cinematic.tow beside the nose), a fade again, and the pilot's own
//      view is back: the parking brake set, the throttle at idle, the
//      compensation on the invoice;
//   4. the flight ended, or a vehicle hit from CRASH_KT to POLICE_KT: a
//      police car drives up with its blue lights flashing and its siren,
//      "The police stopped the flight" — then the debrief, a small fine;
//   5. a lost flight (a building or an aeroplane at CRASH_KT or more, or
//      in the air): the shot holds INCIDENT.CRASH_HOLD_S, then the debrief.
// A practice landing ends after the first shot; in a flight school's
// lesson a touch asks nothing: the tug pulls the aeroplane clear for
// free. With no scene (the headless runs) a touch is paid for (in a
// lesson not) and pulled clear at once, and a lost
// flight goes straight to its debrief. What it draws goes to
// Scene3D.incident (render/incident3d.js).
// ============================================================

const Incident = {
  s: null,          // { contact, failure, stage, t, cost, fine, camMode, path, police }
  view: null,       // Scene3D.incident: { tug, police, smoke }

  shows() { return typeof Cinematic !== 'undefined' && !!Scene3D.camera; },

  // contact: what happened (sim/collide.js); failure: the flight's failure when it is lost
  begin(game, contact, failure) {
    const fl = game.flight;
    const touch = contact.tier === 'touch';
    const cost = Career.compensation(game.contract, contact);
    this.s = { contact, failure, stage: 'crash', t: 0, cost, fine: Career.policeFine(game.contract), camMode: game.camMode };
    if (fl.copilot && fl.copilot.on) { fl.copilot.on = false; fl.copilotTime(false); }
    if (!this.shows()) {
      if (touch && !game.practice) { if (!game.lesson) this.pay(fl); this.pullClear(fl, Collide.towPath(fl)); fl.incident = null; return; }
      this.finish(game);
      return;
    }
    game.stopCine();
    game.mode = 'incident';
    game.helpOpen = false;
    Input.active = true;              // Enter, Space and Esc go on (Game.action → action)
    Input.reset();
    el('hud').hidden = true;
    if (HUD.mapOpen) HUD.closeMap();
    document.body.classList.add('incident');      // no flight controls over it (styles.css)
    this.view = { tug: false, police: null, smoke: null };
    if (contact.tier === 'crash') this.view.smoke = { x: contact.x, y: contact.y, z: contact.z, t0: Scene3D.time, fire: true };
    Scene3D.incident = this.view;
    Cinematic.crash(fl, contact, { shake: touch ? 0.33 : 1 });
    const box = el('cine');
    box.hidden = false;
    box.classList.add('bars');
    const text = touch ? contact.text : failure ? failure.text : contact.what;
    this.caption('<b>' + esc(tr(touch ? 'Collision' : contact.tier === 'police' ? 'Collision — the police are called' : 'The flight is lost')) + '</b><span>' + esc(text) + '</span>');
    this.skipText();
    if (!touch) Audio2.update(0, null, null);
  },

  caption(html) {
    const cap = el('cineCaption');
    cap.innerHTML = html;
    cap.classList.add('on');
  },
  skipText() {
    el('cineSkip').innerHTML = Input.isCoarse ? esc(tr('Tap to go on')) : esc(tr('Go on')) + ' <kbd>Enter</kbd>';
  },
  fade(black) {
    const f = el('cineFade');
    f.classList.remove('in');
    if (black) f.classList.add('black');
    else { f.classList.remove('black'); void f.offsetWidth; f.classList.add('in'); }
  },

  // each frame while Game.mode is 'incident'
  frame(game, dt) {
    const S = this.s, fl = game.flight, sys = game.systems, I = INCIDENT;
    S.t += dt;
    Cinematic.update(dt);
    switch (S.stage) {
      case 'crash':
        if (S.t < I.CRASH_S) break;
        // (a lesson asks for nothing: the tug pulls the aeroplane clear for free)
        if (S.contact.tier === 'touch' && game.lesson) { S.stage = 'fadeTow'; S.t = 0; this.fade(true); }
        else if (S.contact.tier === 'touch' && !game.practice) this.ask(game);
        else if (S.contact.tier === 'police') this.police(game);
        else { S.stage = 'lost'; S.t = 0; }
        break;
      case 'lost':
        if (S.t >= I.CRASH_HOLD_S) { this.finish(game); return; }
        break;
      case 'police':
        this.view.police.k = S.t / (I.POLICE_S * 0.75);
        if (S.t >= I.POLICE_S) { this.finish(game); return; }
        break;
      case 'fadeTow':
        if (S.t >= I.FADE_S) this.tow(game);
        break;
      case 'tow': {
        const move = S.path.len / COLLIDE.TOW_MS;
        Collide.towAt(fl, S.path, (S.t - I.TUG_WAIT_S) * COLLIDE.TOW_MS);
        if (S.t >= I.TUG_WAIT_S * 2 + move) { S.stage = 'fadeBack'; S.t = 0; this.fade(true); el('cineCaption').classList.remove('on'); }
        break;
      }
      case 'fadeBack':
        if (S.t >= I.FADE_S) { this.resume(game); return; }
        break;
    }
    // the scene from the camera's shot, as in the look round an airport (Game.tourFrame)
    Scene3D.cine = Cinematic;
    Scene3D.panelHidden = true;
    Scene3D.camMode = 'cine';
    Scene3D.pipRect = null;
    Scene3D.update(dt, fl, sys);
    Scene3D.render();
    game.draw2d(dt);
    // the engines run on while the aeroplane only stands (a lost flight is silent)
    if (S.contact.tier === 'touch' && (!game.practice || game.lesson)) Audio2.update(dt, fl, sys);
  },

  // Enter, Space, Esc or a tap: on to the end of the shot now
  action(game, name) {
    const S = this.s;
    if (!S || (name !== 'starter' && name !== 'parkBrake' && name !== 'pause' && name !== 'tap')) return;
    if (S.stage === 'crash') S.t = Math.max(S.t, INCIDENT.CRASH_S);
    else if (S.stage === 'lost') S.t = INCIDENT.CRASH_HOLD_S;
    else if (S.stage === 'police') S.t = INCIDENT.POLICE_S;
    else if (S.stage === 'tow') S.t = Math.max(S.t, INCIDENT.TUG_WAIT_S + S.path.len / COLLIDE.TOW_MS);
  },

  // ---------- the choice ----------
  ask(game) {
    const S = this.s, c = S.contact;
    S.stage = 'ask';
    Input.active = false;              // the card's buttons have the keys (UI.key)
    Input.reset();
    el('cineCaption').classList.remove('on');
    el('cineSkip').textContent = '';
    UI.panel(
      '<h2>' + tr('Collision') + '</h2>' +
      '<p class="lead">' + esc(c.text) + '</p>' +
      '<p>' + tr('The owner asks {sum} in compensation. Pay it, and a tug pulls you clear and you taxi on; the repairs to your aircraft come on the invoice as well.', { sum: fmtMoney(S.cost) }) + '</p>' +
      '<p>' + tr('Or end the flight here: the police take over, the flight is lost, and you pay the compensation and a fine of {fine}.', { fine: fmtMoney(S.fine) }) + '</p>' +
      '<div class="btnRow"><button class="btn default" data-act="incidentPay">' + tr('Pay {sum} and go on', { sum: fmtMoney(S.cost) }) + '</button>' +
      '<button class="btn" data-act="incidentStop">' + tr('End the flight') + '</button></div>', 'narrow');
    UI.screen.dataset.view = 'incident';
  },

  // the card's buttons (UI.action)
  choose(game, pay) {
    const S = this.s, fl = game.flight;
    if (!S || S.stage !== 'ask') return;
    el('screen').hidden = true;
    Input.active = true;
    Input.reset();
    this.skipText();
    if (pay) {
      this.pay(fl);
      S.stage = 'fadeTow'; S.t = 0;
      this.fade(true);
      return;
    }
    // ended: the police take it from here (the compensation is paid all the same: police)
    S.failure = fl.failure = { reason: 'police', text: tr('You ended the flight after touching {what} — the police took over.', { what: S.contact.what }), contact: S.contact, shown: true };
    Audio2.update(0, null, null);
    this.police(game);
  },

  pay(fl) {
    this.owe(fl);
    fl.pendingRepPenalty = (fl.pendingRepPenalty || 0) + COLLIDE.COMP_REP;
  },
  // the compensation for what was hit, on the invoice once
  owe(fl) {
    const S = this.s;
    if (S.owed) return;
    S.owed = true;
    fl.compensations.push({ what: S.contact.what, cost: S.cost });
  },

  // ---------- the tug ----------
  tow(game) {
    const S = this.s, fl = game.flight, st = fl.st, c = S.contact;
    S.path = Collide.towPath(fl);
    S.stage = 'tow'; S.t = 0;
    this.view.tug = true;
    // the camera on the side away from what was hit, unless a building is there
    const ax = fl.updateAxes(), d = fl.dims;
    const right = (c.ox - st.pos.x) * ax.right.x + (c.oz - st.pos.z) * ax.right.z;
    const a = fl.nearestApt();
    const eyeOn = (side) => new THREE.Vector3(st.pos.x + ax.right.x * side * (d.span * 0.5 + 12) + ax.nose.x * (d.len * 0.75 + 9),
      st.pos.y + d.fus + 6, st.pos.z + ax.right.z * side * (d.span * 0.5 + 12) + ax.nose.z * (d.len * 0.75 + 9));
    let side = right > 0 ? -1 : 1;
    if (a && Collide.nearBuilding(a, eyeOn(side), 6) && !Collide.nearBuilding(a, eyeOn(-side), 6)) side = -side;
    Cinematic.tow(fl, side, INCIDENT.TUG_WAIT_S * 2 + S.path.len / COLLIDE.TOW_MS);
    el('cine').classList.add('bars');
    this.caption('<b>' + esc(tr('A tug pulls you clear')) + '</b><span>' + esc(game.lesson ? tr('In the simulator it costs nothing')
      : tr('Compensation {sum} — on the invoice', { sum: fmtMoney(S.cost) })) + '</span>');
    this.fade(false);
  },

  // pulled clear (Collide.towDone): stopped, the brake set, the throttle at idle
  pullClear(fl, path) {
    const st = fl.st;
    Collide.towDone(fl, path);
    st.parkingBrake = true;
    st.brakeInput = 0;
    fl.setThrottle(0);
    Input.touchThrottle = null;
    Input.syncThrottle(0);
  },

  // back to the flight, in the view the pilot had
  resume(game) {
    const S = this.s, fl = game.flight;
    this.pullClear(fl, S.path);
    fl.incident = null;
    this.clear();
    game.stopCine();
    game.camMode = S.camMode;
    game.mode = 'flying';
    el('hud').hidden = false;
    Input.active = true;
    Input.reset();
    game.last = performance.now();
    // in from black, then the overlay goes (unless another shot has begun)
    const box = el('cine');
    box.hidden = false;
    box.classList.remove('bars');
    this.fade(false);
    setTimeout(() => { if (!game.cineShot() && game.mode !== 'incident') box.hidden = true; }, 1100);
    fl.info(game.lesson ? tr('Tug disconnected, parking brake set — release it and taxi on.')
      : tr('Tug disconnected, parking brake set — the compensation of {sum} is on the invoice. Taxi on.', { sum: fmtMoney(S.cost) }));
    this.s = null;
  },

  // ---------- the police ----------
  police(game) {
    const S = this.s, fl = game.flight, st = fl.st, d = fl.dims, I = INCIDENT;
    S.stage = 'police'; S.t = 0;
    this.owe(fl);
    // it stops ahead of the nose on the camera's side, coming in from further ahead and across
    const eye = Cinematic.vec;
    const fx = Math.sin(st.hdg), fz = -Math.cos(st.hdg);
    let tx = eye[0] - st.pos.x, tz = eye[2] - st.pos.z;
    const tl = Math.hypot(tx, tz) || 1;
    tx /= tl; tz /= tl;
    let px = -tz, pz = tx;
    if (px * fx + pz * fz < 0) { px = -px; pz = -pz; }
    const x1 = st.pos.x + fx * (d.len / 2 + 8) + tx * 6, z1 = st.pos.z + fz * (d.len / 2 + 8) + tz * 6;
    const F = I.POLICE_FROM_M;
    this.view.police = { x0: x1 + px * F + tx * 15, z0: z1 + pz * F + tz * 15, cx: x1 + px * F * 0.35 + tx * 12, cz: z1 + pz * F * 0.35 + tz * 12, x1, z1, k: 0 };
    const gy = Terrain.surfaceAt(st.pos.x, st.pos.z);
    Cinematic.toward([(x1 + st.pos.x) / 2, gy + 2, (z1 + st.pos.z) / 2], [0, 2, 0]);
    this.caption('<b>' + esc(tr('The police stopped the flight')) + '</b><span>' + esc(tr('Flight {from} → {to} · a fine of {fine}', { from: fl.contract.fromId, to: fl.contract.toId, fine: fmtMoney(S.fine) })) + '</span>');
    Audio2.cue('siren');
  },

  // ---------- the flight lost: the debrief ----------
  finish(game) {
    const S = this.s, fl = game.flight;
    const f = S.failure || fl.failure || { reason: 'collision', text: S.contact.text || S.contact.what, contact: S.contact };
    f.shown = true;
    if (!fl.failure) fl.failure = f;
    if (S.contact.tier === 'police') this.owe(fl);
    this.clear();
    if (game.mode === 'incident') {
      game.stopCine();
      game.mode = 'flying';
    }
    this.s = null;
    game.failFlight(f);
  },

  clear() {
    this.view = null;
    Scene3D.incident = null;
    if (!this.shows()) return;
    el('cineFade').classList.remove('black');
    document.body.classList.remove('incident');
  }
};
