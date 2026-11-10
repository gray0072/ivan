'use strict';

// Wiggle Wars — the main loop and the flow: the start menu with the silent demo behind it, the
// versus setup, the campaign and its briefings, a match, the pause, the results and the cheats.
// It turns keys, the touch joystick and taps into Control calls, runs sim/ in fixed steps (slower
// during the winning kill's slow motion), then draws the frame and the HUD.

let state = 'menu';      // 'menu' (any menu screen, the demo runs) | 'playing' | 'paused' | 'result'
let lastStart = null;    // { mode: 'versus', s } | { mode: 'campaign', i } — for Restart / Play Again
let overTime = 0;        // s since the match ended
let demoOver = 0;

const $ = (id) => document.getElementById(id);

// ---------- the flow ----------
function startDemo() { newDemo(); Camera.reset(); demoOver = 0; }

function begin() {
  Camera.reset();
  Screens.hide();
  Arsenal.close();
  Input.release();
  Hud.show(true);
  fireworks.stop();
  overTime = 0;
  state = 'playing';
}
function startVersus(s) {
  ensureAudio(); enterFullscreen();
  s = s || Setup.settings;
  lastStart = { mode: 'versus', s };
  newVersus(s, Screens.difficulty);
  begin();
}
function startMission(i) {
  ensureAudio(); enterFullscreen();
  lastStart = { mode: 'campaign', i };
  newMission(i, Screens.difficulty, Storage.settings().teams[0].color);
  begin();
}
function restart(sameMap) {
  if (!lastStart) return;
  if (lastStart.mode === 'campaign') startMission(lastStart.i);
  else if (sameMap) startVersus(Object.assign({}, lastStart.s, { map: match.kind, theme: match.themeId, seed: match.seed }));
  else startVersus(Object.assign({}, lastStart.s, { seed: lastStart.s.map === 'random' ? null : randomSeed() }));
}
function toMenu(screen = 'menu') {
  state = 'menu';
  Hud.show(false);
  Arsenal.close();
  Loops.stopAll();
  fireworks.stop();
  if (!match || match.mode !== 'demo') startDemo();
  if (screen === 'setup') Setup.open();
  Screens.show(screen);
}
function pause() {
  if (state !== 'playing') return;
  state = 'paused';
  Arsenal.close();
  Control.fireUp();
  Loops.stopAll();
  Screens.show('pause');
}
function resume() {
  if (state !== 'paused') return;
  Screens.hide();
  state = 'playing';
}
function showResult() {
  state = 'result';
  Hud.show(false);
  Arsenal.close();
  const r = match.result;
  let newBest = false;
  if (match.mode === 'campaign' && r.winner === 0 && !match.cheated) newBest = Storage.saveStars(match.mission, match.difficulty, r.stars);
  Screens.result(r, { newBest });
  const humanWon = r.winner >= 0 && !match.teams[r.winner].cpu;
  if (humanWon) { Sfx.win(); fireworks.start(); } else Sfx.lose();
}

// ---------- the controls each step ----------
function steer(dt) {
  if (state !== 'playing' || !Control.ready()) return;
  const team = activeTeam();
  if (team.cpu) return;
  const k = Input.keys, st = Input.stick();
  let dir = (k.ArrowRight ? 1 : 0) - (k.ArrowLeft ? 1 : 0);
  let aim = (k.ArrowUp ? 1 : 0) - (k.ArrowDown ? 1 : 0);
  const w = activeWorm();
  if (w.state === 'jet') {
    const up = k.ArrowUp || k.Space || Hud.held.fire || st.y < -0.35 ? 1 : 0;
    const side = dir || (st.x > 0.35 ? 1 : st.x < -0.35 ? -1 : 0);
    Control.jet(up, side);
    return;
  }
  if (st.x || st.y) {
    if (Math.abs(st.x) >= Math.abs(st.y)) dir = Math.sign(st.x);
    else aim = -st.y * 1.2;
  }
  if (dir) { Control.walk(dir, dt); Camera.follow(); }
  if (aim) Control.aim(aim * AIM_SPEED * dt * (k.ShiftLeft || k.ShiftRight ? 0.3 : 1));
}

// ---------- keys ----------
function onKey(e, down, repeat) {
  if (down) ensureAudio();
  if (down && e.shiftKey && /^Digit\d$/.test(e.code)) {
    if (cheat(+e.code.slice(5))) e.preventDefault();
    return;
  }
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab', 'Backspace'].includes(e.code)) e.preventDefault();
  if (state !== 'playing') {
    if (!down || repeat) return;
    if (e.code === 'ArrowUp') Screens.moveFocus(0, -1);
    else if (e.code === 'ArrowDown') Screens.moveFocus(0, 1);
    else if (e.code === 'ArrowLeft') Screens.moveFocus(-1, 0);
    else if (e.code === 'ArrowRight') Screens.moveFocus(1, 0);
    else if (e.code === 'Space' || e.code === 'Enter' || e.code === 'NumpadEnter') Screens.pressDefault();
    else if (e.code === 'Escape') back();
    return;
  }
  if (e.code === 'Escape' && down) { if (Arsenal.isOpen()) Arsenal.close(); else pause(); return; }
  if (e.code === 'Space') {
    if (down && !repeat) { Arsenal.close(); Control.fireDown(); Camera.follow(); }
    if (!down) Control.fireUp();
    return;
  }
  if (!down || repeat) return;
  if (e.code === 'Enter' || e.code === 'NumpadEnter') Control.jump(false);
  else if (e.code === 'Backspace') Control.jump(true);
  else if (/^Digit[1-5]$/.test(e.code)) Control.setFuse(+e.code.slice(5));
  else if (e.code === 'KeyQ' || e.code === 'KeyW' || e.code === 'Tab') Arsenal.toggle();
  else if (e.code === 'KeyC') Camera.follow();
}
function back() {
  const c = Screens.current;
  if (c === 'setup' || c === 'campaign') Screens.show('menu');
  else if (c === 'briefing') Screens.show('campaign');
  else if (c === 'pause') resume();
  else if (c === 'result') toMenu();
}

// ---------- cheats (Shift + digit) ----------
function cheat(n) {
  if (n === 9) { Storage.openAll(); if (Screens.current === 'campaign') Screens.show('campaign'); Hud.say(tr('Cheat: every mission is open')); if (match && match.mode !== 'demo') match.cheated = true; return true; }
  if (state !== 'playing' || !match.turn || match.over) return false;
  const t = match.turn, team = activeTeam();
  const enemies = match.worms.filter((w) => w.alive && w.team !== t.team);
  let text = '';
  switch (n) {
    case 1: enemies.forEach((w) => { w.hp = 0; }); Turn.toSettle(); text = 'Cheat: every enemy worm is out'; break;
    case 2: team.worms.forEach((w) => { if (w.alive) w.hp = 0; }); Turn.toSettle(); text = 'Cheat: your team is out'; break;
    case 3: team.allWeapons = true; for (const id of WEAPON_ORDER) team.ammo[id] = -1; text = 'Cheat: every weapon, endless ammo'; break;
    case 4: team.worms.forEach((w) => { if (w.alive) w.hp = Math.round(team.startHp / team.worms.length); }); text = 'Cheat: full health'; break;
    case 5: Objects.dropCrate(Math.round(activeWorm().x)); text = 'Cheat: a crate'; break;
    case 6: match.wind = 0; text = 'Cheat: no wind'; break;
    case 7: match.suddenDeath = true; GameEvents.emit('suddenDeath', {}); text = 'Cheat: sudden death'; break;
    case 8: enemies.forEach((w) => { w.hp = 1; }); text = 'Cheat: enemies at 1 health'; break;
    case 0: t.timerStopped = true; text = 'Cheat: the timer stops'; break;
    default: return false;
  }
  match.cheated = true;
  Hud.say(tr(text));
  return true;
}

// ---------- pointer ----------
Object.assign(Input.handlers, {
  key: onKey,
  joyAllowed: () => state === 'playing' && !!match.turn && !activeTeam().cpu,
  tap(x, y) {
    ensureAudio();
    if (state !== 'playing') return;
    if (Arsenal.isOpen()) { Arsenal.close(); return; }
    if (!Control.canFire() || activeTeam().cpu) return;
    if (WEAPONS[match.turn.weapon].target) {
      const p = Camera.toWorld(x, y);
      Control.setTarget(p.x, p.y);
    }
  },
  hover(x, y) { Render.view.hover = x === null || isCoarsePointer ? null : Camera.toWorld(x, y); },
  pan(dx, dy) { if (state === 'playing' || state === 'result') Camera.pan(dx, dy); },
  zoom(f, x, y) { if (state === 'playing' || state === 'result') Camera.zoomAt(f, x, y); },
  menu() { if (state === 'playing') Arsenal.toggle(); }
});

// ---------- messages ----------
const say = (fn) => (e) => { if (!e.demo && match && match.mode !== 'demo' && state === 'playing') { const t = fn(e); if (t) Hud.say(t); } };
GameEvents.on('turnStart', say((e) => {
  const allHuman = match.teams.length > 1 && match.teams.every((t) => !t.cpu);
  if (allHuman) return tr('{team}, your turn! — {name}', { team: e.team.name, name: e.worm.name });
  return e.team.name + ' — ' + e.worm.name;
}));
GameEvents.on('suddenDeath', say(() => tr('Sudden death! The water rises after every turn.')));
GameEvents.on('refused', say((e) => tr(e.text)));
GameEvents.on('targetBroken', say((e) => (e.left ? tr('Target hit! {n} left.', { n: e.left }) : tr('All targets hit!'))));
GameEvents.on('power', say((e) => (e.weapon === 'double' ? tr('Double damage this turn!') : tr('Low gravity this turn!'))));
GameEvents.on('crateDrop', say(() => tr('A crate is coming!')));
GameEvents.on('pickup', say((e) => {
  const team = match.teams[e.worm.team].name;
  if (e.kind === 'health') return tr('{name}: +{n} health', { name: e.worm.name, n: HEALTH_CRATE });
  if (e.kind === 'gold') return tr('{name} got the golden crate!', { name: e.worm.name });
  return tr('{team}: +1 {weapon}', { team, weapon: tr(WEAPONS[e.weapon].name) });
}));

// ---------- buttons ----------
$('versusBtn').addEventListener('click', () => { ensureAudio(); Setup.open(); Screens.show('setup'); });
$('campaignBtn').addEventListener('click', () => { ensureAudio(); Screens.show('campaign'); });
$('setupBack').addEventListener('click', () => Screens.show('menu'));
$('startBtn').addEventListener('click', () => startVersus());
$('campaignBack').addEventListener('click', () => Screens.show('menu'));
$('briefStart').addEventListener('click', () => startMission(Screens.briefIndex));
$('briefBack').addEventListener('click', () => Screens.show('campaign'));
$('pauseBtn').addEventListener('click', pause);
$('resumeBtn').addEventListener('click', resume);
$('restartBtn').addEventListener('click', () => restart(true));
$('pauseMenuBtn').addEventListener('click', () => toMenu());
$('nextBtn').addEventListener('click', () => startMission(match.mission + 1));
$('againBtn').addEventListener('click', () => restart(false));
$('resultMenuBtn').addEventListener('click', () => toMenu(lastStart && lastStart.mode === 'campaign' ? 'campaign' : 'menu'));
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

I18N.onChange(() => {
  const c = Screens.current;
  if (c === 'menu' || c === 'campaign') Screens.show(c);
  else if (c === 'setup') Setup.refresh();
  else if (c === 'briefing') Screens.briefing(Screens.briefIndex);
  else if (c === 'result') Screens.result(match.result, {});
});

// ---------- the loop ----------
let acc = 0, lastT = performance.now();
const frameDue = frameLimiter();
function frame(now) {
  requestAnimationFrame(frame);
  if (!frameDue(now)) return;
  const dt = Math.min(0.1, (now - lastT) / 1000);
  lastT = now;
  if (match && state !== 'paused') {
    let scale = 1;
    if (match.slowmo > 0) { match.slowmo -= dt; scale = SLOWMO; }
    acc += dt * scale;
    let n = 0;
    while (acc >= SIM_DT && n < MAX_STEPS_PER_FRAME) { steer(SIM_DT); Turn.step(SIM_DT); acc -= SIM_DT; n++; }
    if (n === MAX_STEPS_PER_FRAME) acc = 0;
    if (state === 'playing' && match.over) { overTime += dt; if (overTime > 2.2) showResult(); }
    if (state === 'menu' && match.mode === 'demo' && match.over) { demoOver += dt; if (demoOver > 3) startDemo(); }
    if (state === 'menu' && match.mode !== 'demo') startDemo();
  }
  Render.draw(state === 'paused' ? 0 : dt);
  Hud.update();
}

I18N.buildPickers();
I18N.load();
Input.attach($('game'));
startDemo();
Screens.show('menu');
AppUpdate.watch(() => state === 'menu');
requestAnimationFrame(frame);
