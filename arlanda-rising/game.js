'use strict';

// Arlanda Rising — the main loop and the flow between the screens: the start screen over a slow flyover, the
// campaign's timeline, the mission card, the card before each stage, play (the sim advanced at the chosen speed,
// the HUD, the tray, the toolbar, the plan panel), the stage card, the results and the Office. It wires the map's
// gestures (tap a task or an aircraft, drag one to a stand, pan, pinch), the keys and the cheats, keeps the running
// mission saved (every AUTOSAVE_SECONDS, at each stage's end and when the page is hidden) and records the stars;
// Free Play's rounds, the People screen and the Ops Center (keys P and O), and the cloud save's idle moments; session 4:
// the Terminal view (T: live in an ops stage, the stage runs on behind it), the Airlines screen (A), Finance (F, or the
// money in the HUD) and the Challenge Days; the roofs on or off (R or the 🏠 button: the buildings cut away with their
// insides) and the card of a building, a fuel truck or a plough tapped on the map.

const Game = {
  screen: 'menu',     // menu, timeline, card, office, free, challenges, intro, play, tview, pause, info, panel, stageCard, results
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
    else if (FreeSave.exists()) S = JSON.parse(JSON.stringify(FreeSave.data.world));
    else S = this.demoWorld();
  },
  // the airport the Office works on: the campaign's, or Free Play's; changes made there are kept at once
  freeOffice: false,
  holder() {
    if (this.freeOffice && FreeSave.exists()) return { free: true, world: FreeSave.data.world, round: FreeSave.data.round };
    if (Campaign.data) return { free: false, world: Campaign.data.world };
    return null;
  },
  keepWorld() {
    const h = this.holder();
    if (!h || !S || S.mission) return;
    if (h.free) { FreeSave.data.world = S; FreeSave.save(); } else { Campaign.data.world = S; Campaign.save(); }
  },

  // ---------- the flow ----------
  toMenu() {
    if (S && S.mission && this.run) this.save();
    this.leaveMission();
    this.screen = 'menu';
    this.showWorld();
    MapView.frame('whole');
    Screens.menu();
    Cloud.idleNow();
  },
  toTimeline() {
    if (S && S.mission && this.run) this.save();
    this.leaveMission();
    this.screen = 'timeline';
    this.showWorld();
    Timeline.show();
    Cloud.idleNow();
  },
  toOffice(free) {
    this.leaveMission();
    this.freeOffice = !!free;
    if (!free && !Campaign.exists()) { this.toTimeline(); return; }
    this.screen = 'office';
    Office.show();
    MapView.frame('build');
    Cloud.idleNow();
  },
  // ---------- Free Play ----------
  toFree() {
    if (S && S.mission && this.run) this.save();
    this.leaveMission();
    this.screen = 'free';
    this.showWorld();
    Screens.freePlay();
    Cloud.idleNow();
  },
  startFree(era, diff) {
    const go = () => { Settings.setDifficulty(diff); FreeSave.data = FreePlay.start(era, diff); FreeSave.save(); S = null; this.toOffice(true); };
    if (FreeSave.exists()) Screens.confirm(tr('Start a new Free Play?'), tr('The airport of your Free Play starts again. Your campaign stays as it is.'), tr('Yes, start again'), go, () => this.toFree());
    else go();
  },
  freeRound() {
    const fp = FreeSave.data;
    if (!fp) { this.toFree(); return; }
    enterFullscreen();
    this.leaveMission();
    Missions.start('free', fp.difficulty, fp.world, FreePlay.round(fp));
    this.run = { id: 'free', free: true, campaign: false, difficulty: fp.difficulty };
    this.actions = 0;
    Hints.reset(); Tray.reset(); PlanUI.reset(); Toolbar.reset(); FlightCard.close(); SiteCard.close();
    this.save();
    this.intro();
  },
  // the People screen, the Ops Center, the Terminal view, Airlines and Finance: from the Office to work in, during play
  // to look at (the game pauses) — the Terminal view in an ops stage is live, and in a plan stage its shops can be chosen
  // (`tab`: Finance opened on an analytics tab, e.g. 'staff' from a meter in the HUD)
  openPanel(which, tab) {
    if (this.screen === 'office') { Office.open(which, tab); return; }
    if (this.screen !== 'play' || !S || !S.mission) return;
    const back = () => this.resume();
    if (which === 'terminal' && S.ops) { this.screen = 'tview'; TermView.show({ back }); return; }
    if (this.speed) this.lastSpeed = this.speed;
    this.speed = 0;
    this.screen = 'panel';
    if (which === 'people') PeopleUI.show({ back });
    else if (which === 'ops') OpsCenter.show({ back });
    else if (which === 'terminal') TermView.show({ back, edit: !!S.plan });
    else if (which === 'airlines') AirlinesUI.show({ back });
    else if (which === 'finance') FinanceUI.show({ back, tab });
  },
  // ---------- the Challenge Days ----------
  toChallenges() {
    if (S && S.mission && this.run) this.save();
    this.leaveMission();
    this.screen = 'challenges';
    this.showWorld();
    ChallengesUI.show();
    Cloud.idleNow();
  },
  startChallenge(id, diff) {
    enterFullscreen();
    this.leaveMission();
    Settings.setDifficulty(diff);
    Missions.start(id, diff, null, Challenges.def(id));
    this.run = { id, challenge: true, campaign: false, difficulty: diff };
    this.actions = 0;
    Hints.reset(); Tray.reset(); PlanUI.reset(); Toolbar.reset(); FlightCard.close(); SiteCard.close();
    this.save();
    this.intro();
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
    FlightCard.close(); SiteCard.close(); PlanUI.reset(); Tray.reset(); Toolbar.reset();
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
    this.run = { id, campaign: wf.campaign, difficulty: diff, cid: wf.campaign && Campaign.data ? Campaign.data.campaignId : null };
    this.actions = 0;
    Hints.reset(); Tray.reset(); PlanUI.reset(); Toolbar.reset(); FlightCard.close(); SiteCard.close();
    this.save();
    this.intro();
  },
  replay(id, diff) { this.startMission(id, diff); },
  // the card before a stage; the camera goes where the stage happens
  intro() {
    this.screen = 'intro';
    this.speed = 0;
    this.lastSpeed = 1;   // every stage starts at ▶, whatever the last one ran at
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
  // from the pause menu: the mission's card with where it stands (read only); Back or Esc goes back to the pause menu
  missionInfo() {
    if (this.screen !== 'pause' || !S || !S.mission) return;
    this.screen = 'info';
    MissionCard.info(() => this.backToPause());
  },
  backToPause() { this.screen = 'pause'; Screens.pause(); },
  resume() {
    Screens.hide();
    const live = this.screen === 'tview';
    this.screen = 'play';
    if (!live) this.speed = this.lastSpeed || 1;
  },
  nextStage() { Missions.next(); this.save(); this.intro(); },
  retryStage() { Missions.retry(); FlightCard.close(); SiteCard.close(); this.pick = null; this.save(); this.intro(); },
  restartMission(diff) {
    if (diff && diff !== S.difficulty) { this.startMission(this.run.id, diff); return; }
    Missions.restart(); FlightCard.close(); SiteCard.close(); this.pick = null; this.actions = 0; this.save(); this.intro();
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
    if (this.run.challenge) {
      const pass = S.mission.status === 'done';
      let newBest = false;
      if (pass && !S.mission.cheated) newBest = ChallengeSave.record(this.run.id, this.run.difficulty, Challenges.score(S.mission.total), S.mission.stars);
      Autosave.clear();
      this.screen = 'results';
      this.speed = 0;
      this.panels(false);
      ChallengesUI.results({ newBest });
      return;
    }
    if (this.run.free) {
      const pass = S.mission.status === 'done';
      if (pass && FreeSave.data) { FreePlay.passed(FreeSave.data, Missions.world()); FreeSave.save(); }
      Autosave.clear();
      this.screen = 'results';
      this.speed = 0;
      this.panels(false);
      Results.mission({ free: true });
      return;
    }
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
  // ⏭️ or N: the time jumps to the next task; the banner saying so shows only the first time on this device (Settings
  // 'skipTold'), afterwards it would only cover the map
  skip() {
    if (!Sim.skip() || Settings.get('skipTold')) return;
    Settings.set('skipTold', 1);
    this.banner(tr('Skipped to the next task'));
  },

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
      // the Terminal view of an ops stage is live: the stage runs on behind it
      const running = this.screen === 'play' || this.screen === 'tview';
      if (running && this.speed > 0) Sim.advance(dt, SPEEDS[this.speed]);
      if (running && Autosave.due(dt)) this.save();
      if (this.screen === 'tview') TermView.frame(dt);
      const st = S.mission.status;
      if (running && (st === 'stageDone' || st === 'stageFailed')) {
        this.speed = 0; this.save(); FlightCard.close(); SiteCard.close(); this.pick = null;
        this.screen = 'stageCard'; this.panels(false); Results.stage();
      } else if (running && (st === 'done' || st === 'failed')) {
        FlightCard.close(); SiteCard.close(); this.pick = null;
        this.missionEnd();
      }
      if (S.mission) {
        const live = this.screen === 'play' || this.screen === 'intro' || this.screen === 'pause' || this.screen === 'info' || this.screen === 'panel' || this.screen === 'tview';
        if (live) {
          Hud.update();
          Tray.render();
          Toolbar.render();
          PlanUI.render();
          if (this.screen === 'play') PlanUI.decision();
          FlightCard.render();
          SiteCard.render();
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
    if (this.screen !== 'tview' && TermView.open) TermView.frame(dt);
    // the roofs off (the 🏠 button): never over the start screen's flyover
    MapView.view.cut = this.cut && this.screen !== 'menu';
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
      else if (this.screen === 'info') this.backToPause();
      else if (this.screen === 'panel' || this.screen === 'tview') this.resume();
      else if (this.screen === 'timeline' || this.screen === 'office' || this.screen === 'card' || this.screen === 'free' || this.screen === 'challenges') this.toMenu();
      return;
    }
    const PANEL_KEYS = { KeyP: 'people', KeyO: 'ops', KeyT: 'terminal', KeyA: 'airlines', KeyF: 'finance' };
    if (PANEL_KEYS[e.code] && (this.screen === 'office' || this.screen === 'play')) { this.openPanel(PANEL_KEYS[e.code]); return; }
    if (overlay && (e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter')) { if (Screens.pressDefault()) e.preventDefault(); return; }
    if (this.screen !== 'play' || !S || !S.mission) return;
    if (e.code === 'Space') { e.preventDefault(); if (this.speed) { this.lastSpeed = this.speed; this.speed = 0; } else this.speed = this.lastSpeed || 1; return; }
    const dig = /^Digit([1-4])$/.exec(e.code);
    if (dig) { this.speed = +dig[1] - 1; if (this.speed) this.lastSpeed = this.speed; return; }
    if (e.code === 'KeyN') { this.skip(); return; }
    if (e.code === 'KeyQ' && S.ops && S.ops.tasks.length) { this.doTask(S.ops.tasks[0].id); return; }
    if (e.code === 'KeyR') { this.roofs(); return; }
  },
  // the roofs on or off, as in a doll's house: the buildings cut away with their insides (render/interiors.js); the
  // choice is kept on this device (Settings 'roofs')
  cut: false,
  roofs(off) {
    this.cut = off === undefined ? !this.cut : !!off;
    Settings.set('roofs', this.cut ? 'off' : 'on');
    document.getElementById('roofBtn').classList.toggle('on', this.cut);
    if (off === undefined && this.screen === 'play') this.banner(this.cut ? (Cam.zoom < 1.5 ? tr('Roofs off: zoom in to watch the people inside') : tr('Roofs off: you see inside the buildings')) : tr('Roofs on'));
  },
  cheat(e) {
    const m = /^Digit([1-8])$/.exec(e.code);
    let text = null;
    if (m) {
      const first = MISSIONS.find((x) => x.chapter === +m[1]);
      if (first) { this.startMission(first.id, Settings.difficulty()); Cheats.mark(); this.run.campaign = false; text = tr('Cheat: chapter {n}, the first mission', { n: m[1] }); }
      else text = tr('Cheat: chapter {n} is not in the game yet', { n: m[1] });
    } else if (S && S.mission && S.mission.status === 'running') {
      if (e.code === 'KeyM' && Cheats.money()) text = tr('Cheat: +100 MSEK');
      else if (e.code === 'KeyS' && Cheats.snowstorm()) text = tr('Cheat: a snowstorm');
      else if (e.code === 'KeyA' && Cheats.domainsUp()) text = tr('Cheat: every domain one level up');
      else if (e.code === 'KeyW' && Cheats.winStage()) text = tr('Cheat: the stage is won');
      else if (e.code === 'KeyD' && Cheats.endStage()) text = tr('Cheat: skipped to the end of the stage');
      else if (e.code === 'KeyK') { const d = Cheats.strike(); text = d ? tr('Cheat: {dept} on strike', { dept: Text.dept(d) }) : tr('Cheat: no team to strike yet'); }
      else if (e.code === 'KeyF') { const d = Cheats.failure(); text = d ? tr('Cheat: {sys} has failed', { sys: Text.level(d, S.domains[d]) }) : tr('Cheat: no system to fail now'); }
      else if (e.code === 'KeyE') { const id = Cheats.event(); text = id ? tr('Cheat: a random event') : tr('Cheat: no event in plan time'); }
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
      const h = MapView.hit(x, y, !!this.pick);
      if (h && h.stand && this.pick) { this.standPicked(this.pick, h.stand); return; }
      if (h && h.flight) {
        SiteCard.close();
        FlightCard.open(h.flight);
        this.pick = this.needsStand(h.flight) ? h.flight.id : null;
        return;
      }
      // a building or a fuel truck or a plough: its card
      if (h && (h.site || h.vehicle)) { FlightCard.close(); this.pick = null; SiteCard.open(h); return; }
      FlightCard.close(); SiteCard.close();
      this.pick = null;
    };
    H.longPress = (x, y) => {
      if (!S || !S.mission || this.screen !== 'play') return;
      const h = MapView.hit(x, y);
      if (h && h.flight) { SiteCard.close(); FlightCard.open(h.flight); }
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
      const h = MapView.hit(x, y, true);
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
    FreeSave.load();
    ChallengeSave.load();
    I18N.onChange(() => {
      if (this.screen === 'menu') Screens.menu();
      else if (this.screen === 'timeline') Timeline.show();
      else if (this.screen === 'office') Office.show();
      else if (this.screen === 'free') Screens.freePlay();
      else if (this.screen === 'challenges') ChallengesUI.show();
      Tray.reset(); Toolbar.reset(); PlanUI.reset();
    });
    this.wireInput();
    // session 5: the line of a scripted or random event, a permit broken
    GameEvents.on('script', (e) => { if (e.text && this.screen === 'play') this.banner(tr(e.text), 5000); });
    GameEvents.on('randomEvent', (e) => { if (this.screen === 'play') { this.banner(tr(e.text), 5500); Sfx.play('alarm'); } });
    GameEvents.on('permitBroken', () => { if (this.screen === 'play') this.banner(tr('The environmental permit is broken this month: a fine.'), 4500); });
    document.querySelectorAll('.speeds button').forEach((b) => b.addEventListener('click', () => {
      Sfx.unlock();
      if (this.screen !== 'play') return;
      this.speed = +b.dataset.speed;
      if (this.speed) this.lastSpeed = this.speed;
    }));
    document.getElementById('skipBtn').addEventListener('click', () => this.skip());
    document.getElementById('pauseBtn').addEventListener('click', () => this.pauseMenu());
    document.getElementById('roofBtn').addEventListener('click', () => { Sfx.unlock(); if (this.screen === 'play') this.roofs(); });
    this.roofs(Settings.get('roofs') === 'off');
    document.getElementById('moneyChip').addEventListener('click', () => { if (S && S.mission) this.openPanel('finance'); });
    // a meter or the green rating in the HUD: its tab of Finance's analytics (ui/analytics.js)
    document.getElementById('meters').addEventListener('click', (e) => { const m = e.target.closest('.meter'); if (m && S && S.mission) { Sfx.unlock(); this.openPanel('finance', m.dataset.m); } });
    document.getElementById('greenChip').addEventListener('click', () => { if (S && S.mission) this.openPanel('finance', 'green'); });
    // the mission is saved the moment the page goes away (a phone that locks, a time limit, a call)
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') this.save(); });
    window.addEventListener('pagehide', () => this.save());
    // the cloud save (core/cloud.js): merges only on the screens with no mission in memory; a save from another
    // device redraws the screen that shows it
    Cloud.idle = () => ['menu', 'timeline', 'office', 'free', 'challenges'].indexOf(this.screen) >= 0;
    Cloud.onChange = (changed) => {
      if (changed) { Progress.load(); Campaign.load(); FreeSave.load(); ChallengeSave.load(); }
      if (this.screen === 'menu') Screens.menu();
      else if (changed && this.screen === 'timeline') Timeline.show();
      else if (changed && this.screen === 'office') Office.show();
      else if (changed && this.screen === 'free') Screens.freePlay();
      else if (changed && this.screen === 'challenges') ChallengesUI.show();
    };
    Cloud.init();
    AppUpdate.watch(() => this.screen === 'menu' || this.screen === 'timeline' || this.screen === 'office' || this.screen === 'free' || this.screen === 'challenges');
    this.toMenu();
    requestAnimationFrame((t) => this.frame(t));
  }
};

Game.init();
