'use strict';

// Lift Logic — the run bar and the run in progress: ▶ Run (turns into ■ Stop), ⏸ pause, ⏭ step (until the
// next block runs), the speed (×1 ×2 ×4 ×16, a tap cycles), ⏩ skip to the end (the rest at full speed
// without drawing), 👁 the Lift's eyes, and the grip that resizes the building and the code (a double tap
// gives the whole screen to one of them). Runner drives sim/run.js in fixed steps from the frame loop, and
// replays a day to a moment for the Inspector's "Show me". Used by game.js and ui/results.js.

const Runner = (() => {
  const $ = (id) => document.getElementById(id);
  const st = { state: 'edit', paused: false, speed: 1, acc: 0, mission: null, cheated: false, replay: false, stepping: null, glowAt: 0, errCount: 0 };

  function setMission(m) { st.mission = m; st.state = 'edit'; st.paused = false; st.cheated = false; preview(); sync(); }
  // the building of the mission, standing still, before a run
  function preview() {
    Run.start(st.mission, Prog.empty(), Screens.difficulty);
    run.preview = true;
    View.reset();
  }

  function go(opts = {}) {
    ensureAudio();
    enterFullscreen();
    Hud.closeCard();
    Progress.saveProgram(st.mission.id, Editor.prog);
    const hasHat = Editor.prog.scripts.some((s) => s.blocks[0] && blockDef(s.blocks[0]).shape === 'hat');
    if (!hasHat) Hud.toast(tr('Your program needs an event block like "when ▶ clicked" on top, or it won\'t start.'), 3600);
    Run.start(st.mission, Editor.prog, Screens.difficulty, { cheated: st.cheated, seed: opts.seed });
    st.state = 'running';
    st.paused = false;
    st.acc = 0;
    st.replay = !!opts.replay;
    st.errCount = 0;
    View.reset();
    Editor.clearMarks();
    Guide.done('run');
    GameEvents.emit('runStart', {});
    sync();
  }
  function stop() {
    if (st.state !== 'running') return;
    st.state = 'edit';
    if (run) run.stopped = true;
    Editor.applyGlow({});
    GameEvents.emit('runStop', {});
    sync();
  }
  function togglePause() {
    if (st.state !== 'running') return;
    st.paused = !st.paused;
    sync();
  }
  // run until the set of running blocks changes (at most a few seconds of the day)
  function step() {
    if (st.state !== 'running') { go(); st.paused = true; }
    st.paused = true;
    const before = JSON.stringify(VM.active());
    GameEvents.mute(true);
    try {
      for (let k = 0; k < 60 / SIM_DT && !run.over; k++) {
        Run.step();
        if (JSON.stringify(VM.active()) !== before && k > 0) break;
      }
    } finally { GameEvents.mute(false); }
    Editor.applyGlow(VM.active());
    sync();
    if (run.over) finish();
  }
  function cycleSpeed(to) {
    const i = SPEEDS.indexOf(st.speed);
    st.speed = to !== undefined ? to : SPEEDS[(i + 1) % SPEEDS.length];
    const s = Progress.settings(); s.speed = st.speed; Progress.saveSettings(s);
    sync();
  }
  function skip() {
    if (st.state !== 'running') go();
    Run.finish();
    finish();
  }
  // the Inspector's "Show me": the same day again, fast up to just before the moment, then ×1
  function showMe(t) {
    Screens.hide();
    go({ replay: true });
    Run.finish(Math.max(0, t - SHOW_ME_BEFORE));
    st.speed = 1;
    Hud.banner(tr('Replay: watch closely!'), 2200);
    sync();
  }

  function finish() {
    st.state = 'over';
    Editor.applyGlow({});
    Editor.setMarks(run.errors);
    sync();
    GameEvents.emit('runEnd', {});
    Results.show(run, { cheated: st.cheated || run.cheated, replay: st.replay });
  }

  // every frame: advance the day by the elapsed time × the speed
  function frame(dt) {
    if (st.state !== 'running' || st.paused || !run) return;
    st.acc += Math.min(dt, 0.1) * st.speed;
    let n = 0;
    const max = st.speed > 16 ? 4000 : 800;
    while (st.acc >= SIM_DT && n < max && !run.over) { Run.step(); st.acc -= SIM_DT; n++; }
    if (n >= max) st.acc = 0;
    const now = performance.now();
    if (now - st.glowAt > 90) {
      st.glowAt = now;
      Editor.applyGlow(VM.active());
      TextView.glow();
      const errs = Object.keys(run.errors).length;
      if (errs !== st.errCount) { st.errCount = errs; Editor.setMarks(run.errors); }
    }
    if (run.over) finish();
  }

  function sync() {
    const running = st.state === 'running';
    $('runBtn').classList.toggle('stop', running);
    $('runBtn').querySelector('.ico').textContent = running ? '■' : '▶';
    $('runBtn').querySelector('.lbl').textContent = running ? tr('Stop') : tr('Run');
    $('pauseBtn').textContent = st.paused && running ? '▶' : '⏸';
    $('pauseBtn').disabled = !running;
    $('speedBtn').textContent = '×' + st.speed;
    $('eyesBtn').classList.toggle('on', !!View.st.eyes);
    Music.play(running ? 'lively' : (st.mission ? 'calm' : null));
  }

  $('runBtn').addEventListener('click', () => (st.state === 'running' ? stop() : go()));
  $('pauseBtn').addEventListener('click', togglePause);
  $('stepBtn').addEventListener('click', step);
  $('speedBtn').addEventListener('click', () => cycleSpeed());
  $('skipBtn').addEventListener('click', skip);
  $('eyesBtn').addEventListener('click', () => toggleEyes());
  function toggleEyes() { View.st.eyes = !View.st.eyes; Hud.closeCard(); sync(); if (View.st.eyes) Hud.toast(tr('Lift\'s eyes: this is all your lift can sense.')); }

  // the grip: drag to share the screen between the building and the code; a double tap gives it all to one
  const grip = $('grip');
  let gripDrag = null, lastTap = 0;
  $('runbar').addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    const now = Date.now();
    if (now - lastTap < 320) { toggleFull(); lastTap = 0; return; }
    lastTap = now;
    $('runbar').setPointerCapture(e.pointerId);
    gripDrag = { y: e.clientY, split: split() };
  });
  $('runbar').addEventListener('pointermove', (e) => {
    if (!gripDrag) return;
    const app = $('app').getBoundingClientRect();
    if (document.body.classList.contains('wide')) return;
    setSplit(clamp(gripDrag.split + (e.clientY - gripDrag.y) / app.height, 0.12, 0.85));
  });
  $('runbar').addEventListener('pointerup', () => { if (gripDrag) { const s = Progress.settings(); s.split = split(); Progress.saveSettings(s); } gripDrag = null; });
  function split() { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--split')) || 0.45; }
  function setSplit(v) { document.documentElement.style.setProperty('--split', v.toFixed(3)); View.resize(); Editor.render(); }
  function toggleFull() { const v = split(); setSplit(v > 0.8 ? 0.45 : v < 0.15 ? 0.45 : (v >= 0.45 ? 0.12 : 0.85)); }
  grip.title = tr('Drag to resize');

  return { setMission, go, stop, togglePause, step, cycleSpeed, skip, showMe, frame, sync, toggleEyes, setSplit, preview,
    get state() { return st.state; }, get paused() { return st.paused; }, get speed() { return st.speed; }, get mission() { return st.mission; },
    set cheated(v) { st.cheated = v; }, get cheated() { return st.cheated; }, set speed(v) { st.speed = v; } };
})();
