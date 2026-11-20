'use strict';

// Lift Logic — the main loop and the flow: the start menu, the buildings, the mission card, a mission (the
// editor and the building, runs and their results), the pause menu and the cheats. Each frame it advances
// the run (ui/runbar.js), draws the building and the HUD, moves the guide's finger and sets the hum and the
// music's tempo. The rules live in sim/, the screens and the editor in ui/.

const $ = (id) => document.getElementById(id);
let mission = null;

// ---------- the flow ----------
function startMission(m, prog) {
  ensureAudio();
  enterFullscreen();
  mission = m;
  Progress.setLast(m.id);
  $('app').hidden = false;
  layoutMode();
  View.resize();
  Palette.reset();
  Editor.load(prog, m);
  Palette.setup(m);
  Hints.begin(m);
  Runner.setMission(m);
  $('missionName').textContent = m.id + ' · ' + tr(m.name);
  Hud.targets(m, false);
  Screens.hide();
  Editor.render();
}
function leaveMission(to) {
  if (Runner.state === 'running') Runner.stop();
  if (mission) Progress.saveProgram(mission.id, Editor.prog);
  $('app').hidden = true;
  fireworks.stop();
  Music.play(null);
  Screens.show(to);
}
function openPause() {
  if (!mission) return;
  if (Runner.state === 'running' && !pausedByMenu) { pausedByMenu = !runnerPaused(); if (pausedByMenu) Runner.togglePause(); }
  Screens.show('pause');
}
let pausedByMenu = false;
function runnerPaused() { return Runner.paused; }
function resume() {
  Screens.hide();
  if (pausedByMenu && Runner.state === 'running') Runner.togglePause();
  pausedByMenu = false;
}

// a lift goes out of order: everybody should know
GameEvents.on('broken', (e) => { if (run && !run.preview) Hud.banner(tr('Lift {l} is out of order!', { l: e.lift.letter }), 2600); });
// the building's news: the weather changes, an announcement
GameEvents.on('happening', (e) => { if (run && !run.preview && e.text) Hud.banner(tr(e.text), 3200); });

Screens.on('start', startMission);
Screens.on('inMission', () => !!mission && !$('app').hidden);
Screens.on('difficultyChanged', () => { if (Runner.state === 'running') { pausedByMenu = false; Runner.stop(); } Hud.targets(mission, false); });

$('menuBtn').addEventListener('click', openPause);
$('hintBtn').addEventListener('click', () => { ensureAudio(); Hints.open(); });
$('resumeBtn').addEventListener('click', resume);
$('restartBtn').addEventListener('click', () => { pausedByMenu = false; Screens.hide(); Runner.stop(); Runner.go(); });
$('cardBtn').addEventListener('click', () => Screens.openBrief(mission));
$('pauseMapBtn').addEventListener('click', () => leaveMission('map'));
$('pauseMenuBtn').addEventListener('click', () => leaveMission('menu'));
$('clearBtn').addEventListener('click', () => {
  Slots.info(tr('Clear program'), '<p>' + tr('Remove every block of this mission\'s program?') + '</p>', [
    { label: tr('Clear'), cls: 'default', fn: () => {
      Screens.hide();
      if (Runner.state === 'running') Runner.stop();
      const start = mission.start ? Prog.parse(mission.start) : Prog.empty();
      Editor.change(() => { const p = Editor.prog; p.scripts = start.scripts; p.vars = start.vars; p.lists = start.lists; }, true);
    } }, { label: tr('Cancel') }]);
});
// the results' buttons
$('nextBtn').addEventListener('click', () => {
  const i = MISSIONS.indexOf(mission);
  fireworks.stop();
  leaveMission('menu');
  Screens.openBrief(MISSIONS[i + 1]);
});
$('editBtn').addEventListener('click', () => { fireworks.stop(); Screens.hide(); Runner.preview(); });
$('retryBtn').addEventListener('click', () => { fireworks.stop(); Screens.hide(); Runner.go(); });
$('resultMapBtn').addEventListener('click', () => { fireworks.stop(); Screens.buildingId = mission.building; leaveMission('building'); });
$('paperBack').addEventListener('click', () => Screens.show('result'));
// the code tools
$('undoBtn').addEventListener('click', () => Editor.undo());
$('redoBtn').addEventListener('click', () => Editor.redo());
$('zoomIn').addEventListener('click', () => Editor.zoomBy(1.15));
$('zoomOut').addEventListener('click', () => Editor.zoomBy(1 / 1.15));
$('textBtn').addEventListener('click', () => TextView.open());
$('chips').addEventListener('click', () => Guide.done('chip'));
Editor.onChange(() => { if (mission) Progress.saveProgram(mission.id, Editor.prog); Hud.blockCount(); });

// a wide screen puts the building, the palette and the scripts side by side
function layoutMode() {
  const wide = window.innerWidth >= 860 && window.innerWidth > window.innerHeight * 1.1;
  if (document.body.classList.contains('wide') !== wide) {
    document.body.classList.toggle('wide', wide);
    if (mission) Palette.setup(mission);
  }
}
window.addEventListener('resize', () => { layoutMode(); View.resize(); Editor.render(); });

// ---------- keys ----------
window.addEventListener('keydown', (e) => {
  ensureAudio();
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  if (e.shiftKey && /^Digit\d$/.test(e.code)) { if (cheat(+e.code.slice(5))) e.preventDefault(); return; }
  if (Slots.isOpen()) { if (e.code === 'Escape') Slots.hide(); return; }
  if (TextView.isOpen()) { if (e.code === 'Escape') TextView.close(); return; }
  if (Screens.current) {
    if (e.repeat) return;
    if (e.code === 'ArrowUp' || e.code === 'ArrowLeft') { e.preventDefault(); Screens.moveFocus(0, -1); }
    else if (e.code === 'ArrowDown' || e.code === 'ArrowRight') { e.preventDefault(); Screens.moveFocus(0, 1); }
    else if (e.code === 'Space' || e.code === 'Enter' || e.code === 'NumpadEnter') { e.preventDefault(); Screens.pressDefault(); }
    else if (e.code === 'Escape') back();
    return;
  }
  if (!mission) return;
  if (Editor.key(e)) { e.preventDefault(); return; }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  switch (e.code) {
    case 'Space': e.preventDefault(); Runner.state === 'running' ? Runner.stop() : Runner.go(); break;
    case 'KeyP': Runner.togglePause(); break;
    case 'KeyS': Runner.step(); break;
    case 'KeyE': Runner.toggleEyes(); break;
    case 'Digit1': case 'Digit2': case 'Digit3': case 'Digit4': Runner.cycleSpeed(SPEEDS[+e.code.slice(5) - 1]); break;
    case 'Escape': openPause(); break;
  }
});
function back() {
  const c = Screens.current;
  if (c === 'pause') resume();
  else if (c === 'map' || c === 'museum') Screens.show('menu');
  else if (c === 'building') Screens.show('map');
  else if (c === 'brief') $('briefBack').click();
  else if (c === 'result') $('editBtn').click();
  else if (c === 'paper') Screens.show('result');
}

// ---------- cheats (Shift + digit, for testing) ----------
function cheat(n) {
  const inRun = mission && run && !run.preview && Runner.state === 'running';
  const mark = () => { Runner.cheated = true; if (run) run.cheated = true; };
  if (n === 9) { Progress.openAll(); Hud.banner(tr('Cheat: every building and mission is open')); if (Screens.current) Screens.show(Screens.current); return true; }
  if (!mission) return false;
  if (n === 1) {
    mark();
    Progress.cheatPass(mission.id);
    Hud.banner(tr('Cheat: mission passed with ★★★ (nothing saved)'));
    return true;
  }
  if (n === 2) { mark(); const s = Hints.solution(); if (s) Editor.change(() => { const p = Editor.prog; p.scripts = Prog.renew(s.scripts); p.vars = s.vars; p.lists = s.lists; }); Hud.banner(tr('Cheat: the engineer\'s solution is loaded')); return true; }
  if (n === 3) { mark(); Palette.openAll(); Hud.banner(tr('Cheat: every block in the palette')); return true; }
  if (n === 4) { mark(); Runner.speed = CHEAT_SPEED; Runner.sync(); Hud.banner(tr('Cheat: speed ×100')); return true; }
  if (!inRun) return false;
  if (n === 5) {
    mark();
    for (const q of run.queues) for (const p of q.splice(0)) { p.state = 'done'; p.tBoard = p.tOff = run.t; run.delivered++; People.release(p); }
    for (const L of run.lifts) for (const p of L.riders.splice(0)) { p.state = 'done'; p.tOff = run.t; run.delivered++; People.release(p); }
    Hud.banner(tr('Cheat: everyone delivered by magic'));
    return true;
  }
  if (n === 6) {
    mark();
    const f = run.floors[Math.floor(Math.random() * run.floors.length)];
    for (let k = 0; k < 10; k++) {
      const to = run.floors.filter((x) => x !== f)[Math.floor(Math.random() * (run.floors.length - 1))];
      run.pending.unshift({ seq: 1e6 + k, t: run.t, from: f, to, who: k === 0 ? 'prankster' : 'neighbour' });
      run.total++;
    }
    Hud.banner(tr('Cheat: a wave of 10 people on floor {f}', { f }));
    return true;
  }
  if (n === 7) { mark(); run.cheatPatience = true; for (const p of run.people) p.patience = 1e6; Hud.banner(tr('Cheat: endless patience')); return true; }
  if (n === 8) { debugOn = !debugOn; Hud.banner(tr('Cheat: the VM debug overlay')); return true; }
  if (n === 0) { mark(); run.forceFail = true; Run.end('cheat'); Hud.banner(tr('Cheat: the run fails')); return true; }
  return false;
}
let debugOn = false;
function debugOverlay() {
  if (!debugOn || !run) return;
  const ctx = View.ctx;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(View.st.w - 220, 40, 214, 16 + run.lifts.reduce((s, L) => s + L.threads.length, 0) * 14 + run.lifts.length * 14);
  ctx.fillStyle = '#9f9'; ctx.font = '11px monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  let y = 46;
  for (const L of run.lifts) {
    ctx.fillText('lift ' + L.letter + ' plan [' + L.plan.join(',') + '] ' + L.doorPhase, View.st.w - 214, y); y += 14;
    for (const th of L.threads) { ctx.fillText(' #' + th.id + ' ' + th.hat.op + ' @' + (BLOCK[(Prog.find(run.program, th.cur) || { block: { op: '?' } }).block.op] || { op: '?' }).op + (th.wait ? ' wait:' + th.wait.type : ''), View.st.w - 214, y); y += 14; }
  }
}

// ---------- the frame loop ----------
let lastT = performance.now(), targetAt = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - lastT) / 1000);
  lastT = now;
  Runner.frame(dt);
  if (!$('app').hidden) {
    BuildingView.draw(dt);
    debugOverlay();
    Hud.update();
    if (now - targetAt > 250) { targetAt = now; Hud.targets(mission, Runner.state === 'running'); }
  }
  Guide.frame(Runner.state);
  soundFrame();
}

// ---------- start ----------
I18N.load();
I18N.buildPickers();
I18N.applyDom();
I18N.onChange(() => {
  Screens.diffRows();
  if (Screens.current) Screens.show(Screens.current);
  if (mission) { $('missionName').textContent = mission.id + ' · ' + tr(mission.name); Editor.render(); Palette.refresh(); Runner.sync(); }
});
{
  const s = Progress.settings();
  Runner.speed = SPEEDS.indexOf(s.speed) >= 0 ? s.speed : 1;
  document.documentElement.style.setProperty('--split', String(s.split || 0.45));
}
layoutMode();
Screens.show('menu');
AppUpdate.watch(() => Screens.current === 'menu' || Screens.current === 'map' || Screens.current === 'building');
requestAnimationFrame(frame);
