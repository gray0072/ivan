'use strict';

// ============================================================
// World Aviation — a look at an aircraft type from the hangar
// (free, SHOWCASE in constants.js): the type, gear up, flies
// straight and level over the airport the pilot is at, on a
// clear afternoon, while the camera circles it from every side,
// over it and under its belly (Cinematic.around); then the
// hangar is back, scrolled where it was. Used by UI (the 360°
// button on a hangar card) and Game (its loop, the keys, the tap
// that ends it and the pause, shared with the look round an
// airport: Game.tourPaused).
// ============================================================

const Showcase = {
  acId: null,
  scroll: 0,            // where the hangar was scrolled to

  // from the hangar: the loading screen, then the flight
  open(id) {
    if (typeof Cinematic === 'undefined' || !Scene3D.camera) return;
    const ac = AIRCRAFT.find((a) => a.id === id), here = Career.here();
    if (!ac || !here) return;
    this.acId = id;
    this.scroll = UI.screen.scrollTop;
    const boot = el('bootScreen');
    el('bootStatus').textContent = tr('Flying out to {id}…', { id: here.id });
    boot.hidden = false;
    el('screen').hidden = true;
    frame().then(frame).then(() => {
      this.start(ac, here.id);
      Game.holdBoot();                 // up until the scene has been drawn (Game.revealScene)
    });
  },

  start(ac, id) {
    const S = SHOWCASE;
    Game.stopCine();
    // the world there: the last flight's, if the airport is in it
    if (!World.here[id]) {
      World.prepare(id, id);
      Scene3D.setTheatre();
    }
    const a = World.here[id];
    Game.contract = null;
    Game.practice = null;
    const fl = Game.flight = Flight.init({ aircraft: ac, from: a, to: a, gate: a.gates[0], skipPushback: true });
    const sys = Game.systems = Systems.init(fl, { rng: makeRng(1), difficulty: Career.difficulty, noEmergencies: true });
    sys.runEngines();
    for (const e of sys.engines) if (!e.failed) { e.n1 = 0.6; e.n2 = 0.8; }
    Cinematic.around(fl);

    // along the runway, over its middle halfway through, high enough for the camera to pass under it
    const st = fl.st, v = fl.vRef() * S.SPEED_VREF * KTS, half = v * (S.DUR_S + S.HOLD_S) / 2;
    let ground = a.elev;
    for (let i = 0; i <= 12; i++) {
      const q = World.at(a, -half + half * i / 6, 0);
      ground = Math.max(ground, Terrain.surfaceAt(q.x, q.z));
    }
    const p = World.at(a, -half, 0);
    st.pos.x = p.x; st.pos.z = p.z;
    st.pos.y = ground + Math.max(S.AGL_M, Cinematic.shot.reach + 60) + st.gearH;
    st.hdg = a.hdg; st.pitch = 0.03; st.roll = 0;
    st.pitchRate = 0; st.rollRate = 0; st.yawRate = 0;
    st.vel.x = hdgX(a.hdg) * v; st.vel.z = hdgZ(a.hdg) * v; st.vel.y = 0;
    st.onGround = false; st.wasAirborne = true; st.parkingBrake = false;
    st.gear = st.gearTarget = 0;
    st.flaps = st.flapsTarget = 0;
    st.throttle = 0.55;
    fl.setPhase('CRUISE');
    fl.updateAxes();

    // a clear, calm afternoon
    const env = fl.env;
    env.surfaceWind = { dir: 0, speed: 0 };
    env.altWind = { dir: 0, speed: 0 };
    env.wind = { x: 0, z: 0 };
    env.turb = 0;
    env.vis = S.VIS_M;
    env.cloudBase = a.elev + S.CLOUD_M;
    env.cloudTop = env.cloudBase + 600;
    env.precip = 'none'; env.snowy = false;
    env.tempElev = a.elev;
    env.hour0 = S.HOUR;
    env.moonPhase = 0.5;
    env.month = Career.data.season || 0;

    Scene3D.setFlightGates([], null);
    Scene3D.warmup(fl);
    Game.mode = 'showcase';
    Game.helpOpen = false;
    Input.active = true;          // Enter, Space and Esc end it, P pauses it (Game.action)
    Input.reset();
    el('screen').hidden = true;
    el('hud').hidden = true;
    if (HUD.mapOpen) HUD.closeMap();
    Audio2.update(0, null, null);
    document.body.classList.add('touring');       // no flight controls over it (styles.css)
    const box = el('cine');
    box.hidden = false;
    box.classList.add('bars');
    const name = '<b>' + esc(ac.name) + '</b>';
    Game.tourCaps = [
      [0.8, 8, name + '<span>' + esc(tr(ac.klass)) + '</span>'],
      [S.DUR_S - 6, Infinity, name + '<span>' + esc(tr('Over {apt}', { apt: aptName(a) })) + '</span>']
    ];
    Game.tourCap = -1;
    Game.tourPaused = false;
    Game.tourPauseButton();
    el('cineCaption').classList.remove('on');
    el('cineSkip').innerHTML = Input.isCoarse ? esc(tr('Tap to skip')) : esc(tr('Skip')) + ' <kbd>Enter</kbd>';
    const f = el('cineFade');
    f.classList.remove('in'); void f.offsetWidth; f.classList.add('in');
    Game.last = performance.now();
  },

  // each frame: the aeroplane flies on, the camera round it; paused, nothing moves
  frame(dt) {
    if (Game.tourPaused) dt = 0;
    if (Cinematic.update(dt)) { this.end(); return; }
    const fl = Game.flight, st = fl.st;
    st.pos.x += st.vel.x * dt;
    st.pos.z += st.vel.z * dt;
    Scene3D.cine = Cinematic;
    Scene3D.panelHidden = true;
    Scene3D.camMode = 'cine';
    Scene3D.pipRect = null;
    Scene3D.update(dt, fl, Game.systems);
    Scene3D.render();
    Game.draw2d(dt);
    Game.tourCaption();
  },

  // back to the hangar, where it was, the type's button in focus
  end() {
    Game.stopCine();
    document.body.classList.remove('touring');
    Game.flight = null;
    Game.systems = null;
    Input.active = false;
    Input.reset();
    UI.tab = 'hangar';
    UI.showOps();
    UI.screen.scrollTop = this.scroll;
    const b = UI.screen.querySelector('button[data-act="showcase"][data-v="' + this.acId + '"]');
    if (b && !isCoarsePointer()) b.focus({ preventScroll: true });
  }
};
