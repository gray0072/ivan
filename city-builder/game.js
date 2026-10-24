'use strict';

// City Builder — the main loop and the flow: the start menu, a new or continued city, playing,
// the pause, the milestones, bankruptcy and the cheats. It turns taps, drags and keys into building
// (sim/build.js), runs sim/ each frame at the chosen speed and hands the renderer what to draw.

let state = 'menu';       // 'menu' | 'playing' | 'paused' | 'milestone' | 'over'
let preview = false;      // the city on screen is only the menu's background (nothing saved)
let hover = null;         // the tile under the mouse
let hoverAt = null;       // the map point under the mouse (fractional), to centre a ghost on it
let pointer = null;       // the last pointer position, for the price tip
let lastTouch = isCoarsePointer;
let lineDrag = null;      // a line of road / embankment / bulldozer being drawn: { tool, x0, y0, x1, y1 }
let pending = null;       // a big building tapped on a touch screen, waiting for ✔: { type, x, y }
let overlayOn = false;    // the happiness faces over the houses
let lastSpeed = 1;
let confirmFrom = 'menu';

const $ = (id) => document.getElementById(id);

// ---------- what is being placed ----------
// a building centred on the map point (u, v)
function ghostAt(type, u, v) {
  const d = BUILDINGS[type];
  const x = Math.floor(u - d.w / 2 + 0.5), y = Math.floor(v - d.h / 2 + 0.5);
  const c = placeCheck(type, x, y);
  return { type, x, y, ok: c.ok, cost: c.cost, reason: c.reason };
}
function currentView() {
  const tool = Toolbar.tool;
  let ghost = null, line = null;
  if (state === 'playing' || state === 'paused') {
    if (lineDrag) {
      const tiles = lineTiles(lineDrag.x0, lineDrag.y0, lineDrag.x1, lineDrag.y1);
      const plan = linePlan(lineDrag.tool, tiles);
      line = { tool: lineDrag.tool, tiles, steps: plan.steps, cost: plan.cost };
    } else if (pending) {
      const c = placeCheck(pending.type, pending.x, pending.y);
      ghost = { type: pending.type, x: pending.x, y: pending.y, ok: c.ok, cost: c.cost, reason: c.reason };
    } else if (tool && BUILDINGS[tool] && hover && !lastTouch) {
      ghost = ghostAt(tool, hoverAt.u, hoverAt.v);
    }
  }
  return { tool, hover: lastTouch || state !== 'playing' ? null : hover, ghost, line, selected: Info.building, overlay: overlayOn };
}

// the price (or why not) next to the pointer, or above a ghost waiting for ✔
function updateTip(v) {
  const tip = $('tip');
  let text = '', bad = false, x = 0, y = 0;
  if (v.line && v.line.steps.length) {
    text = (v.line.tool === 'bulldoze' ? '🚜 ' : '') + money(v.line.cost);
    bad = v.line.cost > city.money;
  } else if (v.ghost) {
    text = v.ghost.ok ? money(v.ghost.cost) : tr(v.ghost.reason);
    bad = !v.ghost.ok;
  }
  if (text && pending) {
    const d = BUILDINGS[pending.type];
    [x, y] = Renderer.mapToScreen(pending.x + d.w / 2, pending.y + d.h / 2, spriteHeight(pending.type, 1) + 20);
    x -= 30;
  } else if (text && pointer) {
    x = pointer.x + 18; y = pointer.y + 14;
  } else text = '';
  if (!text) { tip.style.display = 'none'; return; }
  tip.textContent = text;
  tip.classList.toggle('bad', bad);
  tip.style.display = 'block';
  tip.style.left = Math.round(Math.min(x, window.innerWidth - tip.offsetWidth - 4)) + 'px';
  tip.style.top = Math.round(y) + 'px';
}

function clearPlacing() {
  lineDrag = null;
  pending = null;
  $('confirmBar').hidden = true;
}

// ---------- the map's gestures ----------
function tileClamped(x, y) {
  const m = Renderer.screenToMap(x, y);
  return { x: clamp(Math.floor(m.u), 0, MAP_SIZE - 1), y: clamp(Math.floor(m.v), 0, MAP_SIZE - 1) };
}
Object.assign(Input.handlers, {
  hover(x, y) {
    lastTouch = false;
    pointer = x === null ? null : { x, y };
    hover = x === null ? null : Renderer.tileAt(x, y);
    hoverAt = x === null ? null : Renderer.screenToMap(x, y);
  },
  tap(x, y, touch) {
    lastTouch = touch;
    if (state !== 'playing') return;
    ensureAudio();
    const t = Renderer.tileAt(x, y);
    if (!t) return;
    const tool = Toolbar.tool;
    if (!tool) {
      const b = buildingAt(t.x, t.y);
      if (b) { Info.open(b); Budget.close(); Sfx.click(); } else Info.close();
      return;
    }
    if (tool === 'road' || tool === 'bulldoze') { applyLine(tool, [[t.x, t.y]]); return; }
    const d = BUILDINGS[tool];
    const m = Renderer.screenToMap(x, y);
    const g = ghostAt(tool, m.u, m.v);
    if (touch && d.w * d.h > 1) {
      pending = { type: tool, x: g.x, y: g.y };
      $('confirmBar').hidden = false;
      return;
    }
    placeBuilding(tool, g.x, g.y);
  },
  dragStart(x, y, touch) {
    lastTouch = touch;
    const tool = Toolbar.tool;
    if (state === 'playing' && tool && LINE_TOOLS.includes(tool)) {
      const t = Renderer.tileAt(x, y);
      if (t) { lineDrag = { tool, x0: t.x, y0: t.y, x1: t.x, y1: t.y }; return 'line'; }
    }
    return 'pan';
  },
  dragMove(x, y) {
    pointer = { x, y };
    if (!lineDrag) return;
    const t = tileClamped(x, y);
    lineDrag.x1 = t.x; lineDrag.y1 = t.y;
  },
  dragEnd() {
    if (!lineDrag) return;
    ensureAudio();
    applyLine(lineDrag.tool, lineTiles(lineDrag.x0, lineDrag.y0, lineDrag.x1, lineDrag.y1));
    lineDrag = null;
  },
  cancel() { lineDrag = null; },
  pan(dx, dy) { if (state === 'playing' || state === 'menu') Renderer.panBy(dx, dy); },
  zoom(f, x, y) { if (state === 'playing') Renderer.zoomAt(f, x, y); },
  key: onKey
});

// ---------- the keyboard ----------
const ARROWS = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
function onKey(e) {
  if (Screens.current) {
    if (ARROWS[e.code]) { e.preventDefault(); Screens.moveFocus(...ARROWS[e.code]); }
    else if (e.code === 'Space' || e.code === 'Enter' || e.code === 'NumpadEnter') { e.preventDefault(); Screens.pressDefault(); }
    else if (e.code === 'Escape' && state === 'paused') resume();
    return;
  }
  if (state !== 'playing' || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.target && e.target.tagName === 'INPUT' && e.code !== 'Escape') return;
  if (ARROWS[e.code]) { e.preventDefault(); return; }
  if (e.code === 'Escape') {
    if (lineDrag || pending) clearPlacing();
    else if (Toolbar.tool) Toolbar.pick(null);
    else if (Info.building) Info.close();
    else if (Budget.isOpen) Budget.close();
    else pauseGame();
    return;
  }
  if (e.code === 'Space') {
    e.preventDefault();
    if (run.speed) { lastSpeed = run.speed; run.speed = 0; } else run.speed = lastSpeed || 1;
    return;
  }
  if (e.key === '+' || e.key === '=' || e.code === 'NumpadAdd') { run.speed = Math.min(3, run.speed + 1); return; }
  if (e.key === '-' || e.code === 'NumpadSubtract') { run.speed = Math.max(0, run.speed - 1); return; }
  if (/^Digit\d$/.test(e.code) && !e.shiftKey) { cheat(+e.code.slice(5)); return; }
  // by the key's place, not its letter: R is R on a Russian keyboard too
  if (/^Key[A-Z]$/.test(e.code)) {
    const t = Toolbar.toolForKey(e.code.slice(3));
    if (t) Toolbar.pick(Toolbar.tool === t ? null : t);
  }
}
function panKeys(dt) {
  let dx = 0, dy = 0;
  for (const code in ARROWS) if (Input.keys[code]) { dx += ARROWS[code][0]; dy += ARROWS[code][1]; }
  if (dx || dy) Renderer.panBy(-dx * PAN_KEY_SPEED * dt, -dy * PAN_KEY_SPEED * dt);
}

// ---------- the cheats (keyboard only): the city no longer counts for the records ----------
function cheat(n) {
  let text = '';
  if (n >= 1 && n <= 4) {
    city.milestone = Math.max(city.milestone, n);
    text = tr('Cheat: the city is a {title}', { title: tr(MILESTONES[n].name) });
  } else if (n === 5) {
    city.money += 10000;
    text = tr('Cheat: +$10 000');
  } else if (n === 6) {
    if (!startFire()) return;
    text = tr('Cheat: a fire');
  } else if (n === 7) {
    if (city.flood) return;
    startFlood();
    text = tr('Cheat: a flood');
  } else if (n === 8) {
    for (const h of city.buildings) if (h.type === 'house' && !h.ruin) { h.level = Math.min(3, h.level + 1); h.residents = HOUSE_CAPACITY[h.level]; }
    text = tr('Cheat: every house grows');
  } else if (n === 0) {
    city.cheatUnlockAll = true;
    text = tr('Cheat: every building unlocked');
  } else return;
  city.cheated = true;
  run.happyDirty = true;
  Toolbar.refresh();
  Hud.showBanner('🧪 ' + text);
}

// ---------- the flow ----------
function focusCamera() {
  const houses = city.buildings.filter((b) => b.type === 'house');
  const zoom = isCoarsePointer ? ZOOM_START_PHONE : ZOOM_START;
  if (houses.length) {
    const u = houses.reduce((s, b) => s + b.x, 0) / houses.length, v = houses.reduce((s, b) => s + b.y, 0) / houses.length;
    Renderer.centerOn(u + 0.5, v + 0.5, zoom);
  } else {
    Renderer.centerOn(HIGHWAY_LEN + 3, city.highwayY + 0.5, zoom);
  }
}
function setPlayingUi(on) {
  Hud.setVisible(on);
  Toolbar.visible = on;
  if (!on) { Info.close(); Budget.close(); clearPlacing(); $('tip').style.display = 'none'; }
}
function startPlaying() {
  state = 'playing';
  Screens.hide();
  setPlayingUi(true);
  Toolbar.refresh();
  ensureAudio();
  Ambience.start();
  enterFullscreen();
}
function continueGame() {
  if (preview) return;
  startPlaying();
}
function newGame(from) {
  const saved = Storage.loadCity();
  if (saved) { confirmFrom = from; Screens.confirmNew(saved); return; }
  reallyNew();
}
function reallyNew() {
  newCity(Screens.difficulty);
  preview = false;
  run.speed = 1;
  overlayOn = false;
  $('overlayBtn').classList.remove('on');
  Toolbar.pick(null);
  focusCamera();
  refreshStats();
  Storage.saveCity(city);
  startPlaying();
}
function pauseGame() {
  if (state !== 'playing') return;
  state = 'paused';
  Input.reset();
  lineDrag = null;
  Storage.saveCity(city);
  Ambience.stop();
  Screens.show('pause');
}
function resume() {
  state = 'playing';
  Screens.hide();
  ensureAudio();
  Ambience.start();
  enterFullscreen();
}
function toMenu() {
  if (!preview) Storage.saveCity(city);
  state = 'menu';
  setPlayingUi(false);
  Ambience.stop();
  Screens.show('menu');
}

// ---------- the buttons ----------
$('continueBtn').addEventListener('click', continueGame);
$('newBtn').addEventListener('click', () => newGame('menu'));
$('helpBtn').addEventListener('click', () => { $('help').hidden = !$('help').hidden; });
$('resumeBtn').addEventListener('click', resume);
$('pauseBudgetBtn').addEventListener('click', () => { resume(); Budget.open(); });
$('pauseNewBtn').addEventListener('click', () => newGame('pause'));
$('pauseMenuBtn').addEventListener('click', toMenu);
$('confirmYes').addEventListener('click', reallyNew);
$('confirmNo').addEventListener('click', () => Screens.show(confirmFrom));
$('msContinue').addEventListener('click', () => { fireworks.stop(); resume(); });
$('againBtn').addEventListener('click', reallyNew);
$('overMenuBtn').addEventListener('click', () => { state = 'menu'; Screens.show('menu'); });
$('moneyBtn').addEventListener('click', () => { Info.close(); Budget.toggle(); });
$('pauseBtn').addEventListener('click', pauseGame);
$('overlayBtn').addEventListener('click', () => { overlayOn = !overlayOn; $('overlayBtn').classList.toggle('on', overlayOn); });
document.querySelectorAll('.speeds button').forEach((b) => b.addEventListener('click', () => { run.speed = +b.dataset.speed; if (run.speed) lastSpeed = run.speed; }));
$('placeOk').addEventListener('click', () => {
  if (pending) placeBuilding(pending.type, pending.x, pending.y);
  clearPlacing();
});
$('placeNo').addEventListener('click', clearPlacing);
Toolbar.onPick = (t) => { clearPlacing(); if (t) { Info.close(); Budget.close(); } };
Hud.onShowMe = () => {
  const b = city.buildings.find((x) => x.fire);
  if (b) { const d = def(b); Renderer.centerOn(b.x + d.w / 2, b.y + d.h / 2); }
};

// ---------- what the logic reports ----------
GameEvents.on('cantBuild', (e) => Hud.showBanner(tr(e.reason)));
GameEvents.on('month', () => { if (!preview) Storage.saveCity(city); });
GameEvents.on('fire', () => Hud.showBanner(tr('🔥 A fire broke out!')));
GameEvents.on('burnedDown', () => Hud.showBanner(tr('A building burned down. Build a fire station nearby!')));
GameEvents.on('extinguished', () => Hud.showBanner(tr('🚒 The firefighters put the fire out!')));
GameEvents.on('flood', () => Hud.showBanner(tr('🌊 Spring flood! The river is rising.')));
GameEvents.on('floodOver', (e) => Hud.showBanner(e.hit ? tr('The water has gone down. Repair the damaged buildings.') : tr('The water has gone down. Nothing was damaged!')));
GameEvents.on('debt', (e) => Hud.showBanner(tr('💸 The city is in debt! Raise taxes or build less.')));
GameEvents.on('houseGrew', (e) => { if (e.b.level === 3) Hud.showBanner(tr('🏢 A house grew into an apartment block!')); });
GameEvents.on('milestone', (e) => {
  state = 'milestone';
  clearPlacing();
  Input.reset();
  Storage.saveCity(city);
  Toolbar.refresh();
  Screens.showMilestone(e);
  if (e.index === MILESTONES.length - 1) fireworks.start();
});
GameEvents.on('bankrupt', () => {
  state = 'over';
  Storage.clearCity();
  preview = true;
  setPlayingUi(false);
  Ambience.stop();
  Screens.showGameOver();
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) return;
  if (state === 'playing') pauseGame();
  else if (city && !preview) Storage.saveCity(city);
});
window.addEventListener('pagehide', () => { if (city && !preview && state !== 'over') Storage.saveCity(city); });

// ---------- the main loop ----------
const frameDue = frameLimiter();
let lastT = performance.now(), uiT = 0;
function loop(now) {
  requestAnimationFrame(loop);
  if (!frameDue(now)) return;
  const dt = Math.min(0.1, (now - lastT) / 1000);
  lastT = now;
  if (state === 'playing') {
    const sim = dt * SPEEDS[run.speed];
    if (sim > 0) { cityUpdate(sim); trafficUpdate(sim); } else refreshStats();
    panKeys(dt);
  }
  if (state === 'playing' || state === 'paused' || state === 'milestone') {
    Ambience.set(city.stats.population / 2000);
    Hud.update();
    uiT += dt;
    if (uiT > 0.25) { uiT = 0; Toolbar.refresh(); Info.refresh(); Budget.refresh(); }
  }
  const v = currentView();
  Renderer.draw(v);
  updateTip(state === 'playing' ? v : {});
}

function boot() {
  I18N.load();
  I18N.buildPickers();
  I18N.onChange(() => {
    Toolbar.refresh(); Hud.refresh(); Info.refresh(); Budget.refresh();
    if (Screens.current === 'menu') Screens.renderMenu();
  });
  Input.attach($('game'));
  const saved = Storage.loadCity();
  if (saved) {
    city = Object.assign({ cheatUnlockAll: false, flood: null, debtMonths: 0 }, saved);
    reindex();
  } else {
    newCity('medium', 7);
    preview = true;
  }
  refreshStats();
  focusCamera();
  Toolbar.build();
  Screens.show('menu');
  AppUpdate.watch(() => state === 'menu');
  requestAnimationFrame(loop);
}
boot();
