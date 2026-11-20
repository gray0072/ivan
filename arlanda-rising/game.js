'use strict';

// Arlanda Rising — the main loop and the flow between the screens: the start screen over a slow flyover, the
// campaign's timeline, the mission card, the card before each stage, play (the sim advanced at the chosen speed,
// the HUD, the tray, the toolbar, the plan panel), the stage card, the results and the Office. It wires the map's
// gestures (tap a task or an aircraft, drag one to a stand, pan, pinch), the keys and the cheats, keeps the running
// mission saved (every AUTOSAVE_SECONDS, at each stage's end and when the page is hidden) and records the stars.

const Game = {
  screen: 'menu',     // menu, timeline, card, office, intro, play, pause, stageCard, results
  speed: 0, lastSpeed: 1,
  run: null,          // { id, campaign, difficulty } of the mission being played
  pick: null,         // a flight whose stand the player is choosing on the map
  actions: 0,         // things the player did in this mission (the guiding finger)
  display: null,      // the world the map shows outside a mission

  // ---------- the worlds shown outside a mission ----------
  demoWorld() {
    S = newWorld(7, 'medium');
    S.day = Calendar.dayOf(1962, 4, 1);
    for (const id of ['site', 'runway1', 'apron1', 'tower1', 'terminal1', 'lights1']) Construction.ownerBuilds(id);
    S.airport.projects.terminal1.stages.kiosk.p = 1;
    Airport.addItem('fuelTruck'); Airport.addItem('fuelTruck'); Airport.addItem('plough'); Airport.addItem('plough');
    return S;
  },
  showWorld() {
    if (Campaign.exists() && Campaign.data.world) S = JSON.parse(JSON.stringify(Campaign.data.world));
    else S = this.demoWorld();
  },

  // ---------- the flow ----------
  toMenu() {
    if (S && S.mission && this.run) this.save();
    this.leaveMission();
    this.screen = 'menu';
    this.showWorld();
    MapView.frame('whole');
    Screens.menu();
  },
  toTimeline() {
    if (S && S.mission && this.run) this.save();
    this.leaveMission();
    this.screen = 'timeline';
    this.showWorld();
    Timeline.show();
  },
  toOffice() {
    this.leaveMission();
    if (!Campaign.exists()) { this.toTimeline(); return; }
    this.screen = 'office';
    this.showWorld();
    MapView.frame('build');
    Office.show();
  },
  openMission(id) {
    this.leaveMission();
    this.screen = 'card';
    this.showWorld();
    MissionCard.show(id, !(Campaign.data && Campaign.data.next === id));
  },
  campaignDiff(id) { return Campaign.data && Campaign.data.next === id && Campaign.data.difficulty ? Campaign.data.difficulty : Settings.difficulty(); },
  askNewCampaign() {
    const go = () => { Autosave.clear(); Campaign.start(Settings.difficulty()); this.openMission(MISSIONS[0].id); };
    if (Campaign.exists() || Autosave.read()) Screens.confirm(tr('Start a new campaign?'), tr('Your airport starts again from the forest of 1958. Your stars stay.'), tr('Yes, a new campaign'), go, () => this.toMenu());
    else go();
  },
  leaveMission() {
    this.run = null; this.speed = 0; this.pick = null;
    S = null;
    FlightCard.close(); PlanUI.reset(); Tray.reset(); Toolbar.reset();
    this.hud(false);
  },
  // the play panels (the HUD stays) hidden behind a card
  panels(on) { if (!on) for (const id of ['goalsBox', 'tray', 'toolbar', 'planPanel', 'decision', 'hint', 'finger', 'flightCard']) document.getElementById(id).hidden = true; },
  hud(on) {
    document.getElementById('hud').hidden = !on;
    if (!on) for (const id of ['goalsBox', 'tray', 'toolbar', 'planPanel', 'decision', 'hint', 'finger']) document.getElementById(id).hidden = true;
  },

  startMission(id, diff) {
    enterFullscreen();
    let wf = Campaign.worldFor(id);
    if (!wf) {
      if (!Campaign.exists() && id === MISSIONS[0].id) { Campaign.start(diff); wf = Campaign.worldFor(id); } else wf = { world: null, campaign: false };
    }
    if (wf.campaign) { Campaign.keepSnapshot(id, wf.world); Campaign.data.difficulty = diff; Campaign.save(); }
    Settings.setDifficulty(diff);
    Missions.start(id, diff, wf.world);
    this.run = { id, campaign: wf.campaign, difficulty: diff };
    this.actions = 0;
    Hints.reset(); Tray.reset(); PlanUI.reset(); Toolbar.reset(); FlightCard.close();
    this.save();
    this.intro();
  },
  replay(id, diff) { this.startMission(id, diff); },
  // the card before a stage; the camera goes where the stage happens
  intro() {
    this.screen = 'intro';
    this.speed = 0;
    this.hud(true);
    const st = Missions.stage();
    const proj = (Missions.def().setup || {}).projects || [];
    MapView.frame(st.mode === 'ops' ? 'ops' : proj.indexOf('site') >= 0 ? 'site' : proj.indexOf('lights1') >= 0 ? 'whole' : 'build');
    MissionCard.stage();
  },
  play() {
    enterFullscreen();
    Sfx.unlock();
    Screens.hide();
    this.screen = 'play';
    this.speed = this.lastSpeed || 1;
  },
  pauseMenu() {
    if (this.screen !== 'play') return;
    if (this.speed) this.lastSpeed = this.speed;
    this.speed = 0;
    this.screen = 'pause';
    this.save();
    Screens.pause();
  },
  resume() { Screens.hide(); this.screen = 'play'; this.speed = this.lastSpeed || 1; },
  nextStage() { Missions.next(); this.save(); this.intro(); },
  retryStage() { Missions.retry(); FlightCard.close(); this.pick = null; this.save(); this.intro(); },
  restartMission(diff) {
    if (diff && diff !== S.difficulty) { this.startMission(this.run.id, diff); return; }
    Missions.restart(); FlightCard.close(); this.pick = null; this.actions = 0; this.save(); this.intro();
  },
  continueMission() {
    enterFullscreen();
    const saved = Autosave.read();
    if (!saved || !saved.data) { this.toMenu(); return; }
    Missions.resume(saved.data);
    this.run = saved.run;
    this.hud(true);
    const st = S.mission.status;
    if (st === 'stageDone' || st === 'stageFailed') { this.screen = 'stageCard'; this.panels(false); Results.stage(); return; }
    // at that very moment, paused, with a line on the goal
    Screens.hide();
    this.screen = 'play';
    this.speed = 0;
    this.lastSpeed = 1;
    MapView.frame(S.ops ? 'ops' : 'build');
    this.banner(tr('Paused. Press ▶ to go on: {aim}', { aim: tr(Missions.def().aim || '') }), 5000);
  },
  save() {
    if (!S || !S.mission || !this.run) return;
    if (S.mission.status === 'done' || S.mission.status === 'failed') return;
    Autosave.write({ run: this.run, data: Missions.save() });
  },
  // the mission is over: stars into the progress, the campaign goes on, the results
  missionEnd() {
    const id = this.run.id, pass = S.mission.status === 'done', stars = S.mission.stars;
    let newBest = false;
    if (pass && !S.mission.cheated) newBest = Progress.record(id, this.run.difficulty, stars, S.mission.medal);
    if (pass && this.run.campaign) Campaign.passed(id, stars, Missions.world());
    Autosave.clear();
    const i = MISSIONS.findIndex((m) => m.id === id);
    const next = pass && MISSIONS[i + 1] ? MISSIONS[i + 1] : null;
    this.screen = 'results';
    this.speed = 0;
    this.panels(false);
    Results.mission({ newBest, next, campaign: this.run.campaign });
  },

  // ---------- what the player does on the map and in the tray ----------
  acted() { this.actions++; },
  doTask(id) { if (S && S.ops && Actions.task(id)) { this.acted(); if (this.pick && !S.ops.tasks.some((k) => k.target === this.pick)) this.pick = null; } },
  standPicked(fid, stand) {
    const f = Flights.get(fid);
    this.pick = null;
    if (!f) return;
    if (!Stands.fits(stand, f.type)) { this.banner(tr('{no} does not fit stand {s}: it needs a bigger one.', { no: f.no, s: stand.name })); Sfx.play('sad'); return; }
    if (Actions.stand(fid, stand.id)) { this.acted(); Sfx.play('click'); this.banner(tr('{no} → stand {s}', { no: f.no, s: stand.name })); } else this.banner(tr('Stand {s} is taken.', { s: stand.name }));
  },
  needsStand(f) { return S.ops && S.ops.tasks.some((k) => k.kind === 'stand' && k.target === f.id); },

  banner(text, ms) {
    const b = document.getElementById('banner');
    b.textContent = text;
    b.classList.add('on');
    clearTimeout(this._bt);
    this._bt = setTimeout(() => b.classList.remove('on'), ms || BANNER_MS);
  },

  // ---------- each frame ----------
  last: 0,
  frame(now) {
    const dt = Math.min(0.1, (now - (this.last || now)) / 1000);
    this.last = now;
    if (this.screen === 'menu') { Cam.x += dt * 12 / Cam.zoom * 0.2; Cam.clamp(); }
    if (!Screens.current || this.screen === 'play') {
      const k = KEY_PAN * dt, K = Input.keys;
      if (K.ArrowLeft) Cam.panBy(k, 0);
      if (K.ArrowRight) Cam.panBy(-k, 0);
      if (K.ArrowUp) Cam.panBy(0, k);
      if (K.ArrowDown) Cam.panBy(0, -k);
    }
    if (S && S.mission && this.run) {
      if (this.screen === 'play' && this.speed > 0) Sim.advance(dt, SPEEDS[this.speed]);
      if (this.screen === 'play' && Autosave.due(dt)) this.save();
      const st = S.mission.status;
      if (this.screen === 'play' && (st === 'stageDone' || st === 'stageFailed')) {
        this.speed = 0; this.save(); FlightCard.close(); this.pick = null;
        this.screen = 'stageCard'; this.panels(false); Results.stage();
      } else if (this.screen === 'play' && (st === 'done' || st === 'failed')) {
        FlightCard.close(); this.pick = null;
        this.missionEnd();
      }
      if (S.mission) {
        const live = this.screen === 'play' || this.screen === 'intro' || this.screen === 'pause';
        if (live) {
          Hud.update();
          Tray.render();
          Toolbar.render();
          PlanUI.render();
          if (this.screen === 'play') PlanUI.decision();
          FlightCard.render();
          Hints.step(dt);
        }
        // the stands lit while a stand is being chosen
        const f = this.pick && S.ops && Flights.get(this.pick);
        if (f) {
          const mark = {};
          for (const s of S.airport.stands) mark[s.id] = Stands.fits(s, f.type) && Stands.free(s, f) ? '#5ee07a' : '#e35b4f';
          MapView.view.standMark = mark;
        } else { MapView.view.standMark = null; if (this.pick) this.pick = null; }
        MapView.view.selected = FlightCard.id && S.ops ? Flights.get(FlightCard.id) : null;
      }
    } else MapView.view.standMark = null;
    MapView.draw(dt);
    requestAnimationFrame((t) => this.frame(t));
  },

  // ---------- keys ----------
  key(e) {
    Sfx.unlock();
    if (e.shiftKey && this.cheat(e)) { e.preventDefault(); return; }
    const overlay = !!Screens.current;
    if (e.code === 'Escape') {
      if (this.screen === 'play') this.pauseMenu();
      else if (this.screen === 'pause') this.resume();
      else if (this.screen === 'timeline' || this.screen === 'office' || this.screen === 'card') this.toMenu();
      return;
    }
    if (overlay && (e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter')) { if (Screens.pressDefault()) e.preventDefault(); return; }
    if (this.screen !== 'play' || !S || !S.mission) return;
    if (e.code === 'Space') { e.preventDefault(); if (this.speed) { this.lastSpeed = this.speed; this.speed = 0; } else this.speed = this.lastSpeed || 1; return; }
    const dig = /^Digit([1-4])$/.exec(e.code);
    if (dig) { this.speed = +dig[1] - 1; if (this.speed) this.lastSpeed = this.speed; return; }
    if (e.code === 'KeyN') { if (Sim.skip()) this.banner(tr('Skipped to the next task')); return; }
    if (e.code === 'KeyQ' && S.ops && S.ops.tasks.length) { this.doTask(S.ops.tasks[0].id); return; }
  },
  cheat(e) {
    const m = /^Digit([1-8])$/.exec(e.code);
    let text = null;
    if (m) {
      if (+m[1] === 1) { this.startMission('1-1', Settings.difficulty()); Cheats.mark(); this.run.campaign = false; text = tr('Cheat: chapter 1, the first mission'); }
      else text = tr('Cheat: chapter {n} is not in the game yet', { n: m[1] });
    } else if (S && S.mission && S.mission.status === 'running') {
      if (e.code === 'KeyM' && Cheats.money()) text = tr('Cheat: +100 MSEK');
      else if (e.code === 'KeyS' && Cheats.snowstorm()) text = tr('Cheat: a snowstorm');
      else if (e.code === 'KeyA' && Cheats.domainsUp()) text = tr('Cheat: every domain one level up');
      else if (e.code === 'KeyW' && Cheats.winStage()) text = tr('Cheat: the stage is won');
      else if (e.code === 'KeyD' && Cheats.endStage()) text = tr('Cheat: skipped to the end of the stage');
      else if (e.code === 'KeyK' || e.code === 'KeyF') text = tr('Cheat: strikes and failures come in a later version');
    }
    if (!text) return false;
    this.banner(text);
    return true;
  },

  // ---------- the map's gestures ----------
  wireInput() {
    const H = Input.handlers;
    H.pan = (dx, dy) => Cam.panBy(dx, dy);
    H.zoom = (f, x, y) => Cam.zoomAt(f, x, y);
    H.tap = (x, y) => {
      Sfx.unlock();
      if (!S || !S.mission || this.screen !== 'play') return;
      const h = MapView.hit(x, y);
      if (h && h.stand && this.pick) { this.standPicked(this.pick, h.stand); return; }
      if (h && h.flight) {
        FlightCard.open(h.flight);
        this.pick = this.needsStand(h.flight) ? h.flight.id : null;
        return;
      }
      FlightCard.close();
      this.pick = null;
    };
    H.longPress = (x, y) => {
      if (!S || !S.mission || this.screen !== 'play') return;
      const h = MapView.hit(x, y);
      if (h && h.flight) FlightCard.open(h.flight);
    };
    let dragging = null;
    H.dragStart = (x, y) => {
      if (!S || !S.ops || this.screen !== 'play') return 'pan';
      const h = MapView.hit(x, y);
      if (h && h.flight && this.needsStand(h.flight)) { dragging = h.flight.id; this.pick = dragging; return 'drag'; }
      return 'pan';
    };
    H.dragMove = () => {};
    H.dragEnd = (x, y) => {
      const h = MapView.hit(x, y);
      if (dragging && h && h.stand) this.standPicked(dragging, h.stand);
      dragging = null;
    };
    H.cancel = () => { dragging = null; };
    H.key = (e) => this.key(e);
    Input.attach(MapView.canvas);
  },

  init() {
    I18N.load();
    Progress.load();
    Campaign.load();
    I18N.onChange(() => {
      if (this.screen === 'menu') Screens.menu();
      else if (this.screen === 'timeline') Timeline.show();
      else if (this.screen === 'office') Office.show();
      Tray.reset(); Toolbar.reset(); PlanUI.reset();
    });
    this.wireInput();
    document.querySelectorAll('.speeds button').forEach((b) => b.addEventListener('click', () => {
      Sfx.unlock();
      if (this.screen !== 'play') return;
      this.speed = +b.dataset.speed;
      if (this.speed) this.lastSpeed = this.speed;
    }));
    document.getElementById('skipBtn').addEventListener('click', () => { if (Sim.skip()) this.banner(tr('Skipped to the next task')); });
    document.getElementById('pauseBtn').addEventListener('click', () => this.pauseMenu());
    document.getElementById('moneyChip').addEventListener('click', () => {
      if (S && S.mission) this.banner(tr('Money {m} · loans {l} · the owner allows {k}', { m: sek(S.money), l: sek(S.loans), k: sek(S.loanLimit || 0) }), 4000);
    });
    // the mission is saved the moment the page goes away (a phone that locks, a time limit, a call)
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') this.save(); });
    window.addEventListener('pagehide', () => this.save());
    AppUpdate.watch(() => this.screen === 'menu' || this.screen === 'timeline' || this.screen === 'office');
    this.toMenu();
    requestAnimationFrame((t) => this.frame(t));
  }
};

Game.init();
