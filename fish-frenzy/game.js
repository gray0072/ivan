'use strict';

// Fish Frenzy main loop: the renderer and the graphics setting, the flow between the screens (start, demo,
// pause, milestones, game over, the test cheat) and the per-frame update that runs the sim/ files in order.
// Loaded last; the state it drives lives in sim/state.js.

(function () {
  const renderer = createRenderer(document.getElementById('game'));
  // Graphics quality (Auto or one of the GRAPHICS presets), picked on the start screen and remembered between visits
  const GRAPHICS_KEY = 'fishFrenzy.gfx';
  let graphicsKey = 'auto';
  try {
    const saved = localStorage.getItem(GRAPHICS_KEY);
    if (GRAPHICS[saved]) graphicsKey = saved;
  } catch (err) { /* storage blocked */ }
  function applyGraphics(key) {
    renderer.setGraphics(key);
    crowdShare = renderer.crowd;
  }
  const autoGraphics = createAutoGraphics((key) => { if (graphicsKey === 'auto') applyGraphics(key); });
  function activeGraphics() { return graphicsKey === 'auto' ? autoGraphics.key : graphicsKey; }
  applyGraphics(activeGraphics());
  function resize() {
    screenW = window.innerWidth;
    screenH = window.innerHeight;
    renderer.resize(screenW, screenH);
  }
  window.addEventListener('resize', resize);
  resize();

  // A new deploy reloads the page only on the start screen, never mid-game (core/update.js)
  AppUpdate.watch(() => gameState === 'start');
  let demoStartedAt = 0;
  let demoRestartT = 0;

  // ---------- Demo pilot (demo.js): steers the player in demo mode ----------
  const demoPilot = createDemoPilot({
    player, npcs, foods,
    get difficulty() { return difficulty; },
    stageIndexForR, speedForR, turnRateForR, npcSpeed, npcSurfaceMargin, nearestJelly, jellyEscapeHeading, avoidEdges
  });

  // ---------- Start screen buttons ----------
  document.querySelectorAll('#menu .btn[data-difficulty]').forEach((btn) => {
    btn.addEventListener('click', () => startGame(btn.dataset.difficulty));
  });
  const graphicsBtns = document.querySelectorAll('#menu .btn[data-graphics]');
  function setGraphics(key) {
    graphicsKey = key;
    applyGraphics(activeGraphics());
    graphicsBtns.forEach((b) => b.classList.toggle('active', b.dataset.graphics === key));
    try { localStorage.setItem(GRAPHICS_KEY, key); } catch (err) { /* storage blocked */ }
  }
  graphicsBtns.forEach((btn) => btn.addEventListener('click', () => setGraphics(btn.dataset.graphics)));
  setGraphics(graphicsKey);
  // Sound on / off, on the start screen and in the pause (core/audio.js keeps and remembers it)
  const soundBtns = document.querySelectorAll('#overlay .btn[data-sound]');
  function showSound() { soundBtns.forEach((b) => b.classList.toggle('active', (b.dataset.sound === 'on') === soundOn)); }
  soundBtns.forEach((btn) => btn.addEventListener('click', () => { setSound(btn.dataset.sound === 'on'); showSound(); }));
  showSound();
  document.getElementById('demoBtn').addEventListener('click', () => startGame('easy', true));
  function exitDemo() {
    demo = false;
    clearTimeout(demoRestartT);
    resetTouches();
    gameState = 'start';
    showPanel('menu');
  }
  // Keys pressed before the demo started (e.g. the Space that clicked the Demo button) don't count
  window.addEventListener('keydown', (e) => {
    if (demo && !e.repeat && e.timeStamp > demoStartedAt) exitDemo();
  });
  ['mousedown', 'touchstart'].forEach((type) => document.getElementById('game').addEventListener(type, () => {
    if (demo) exitDemo();
  }));

  // ---------- Game over and milestone dialog buttons ----------
  document.getElementById('againBtn').addEventListener('click', () => startGame(difficultyKey));
  document.getElementById('menuBtn').addEventListener('click', () => showPanel('menu'));
  document.getElementById('restartBtn').addEventListener('click', () => {
    fireworks.stop();
    startGame(difficultyKey);
  });
  document.getElementById('kingMenuBtn').addEventListener('click', () => {
    fireworks.stop();
    gameState = 'start';
    showPanel('menu');
  });
  document.getElementById('continueBtn').addEventListener('click', () => {
    fireworks.stop();
    hideOverlay();
    resetTouches();
    player.invulnTimer = Math.max(player.invulnTimer, 1.5);
    gameState = 'playing';
  });

  // ---------- Pause (the button top right, or Esc / P) ----------
  const pauseBtn = document.getElementById('pauseBtn');
  function pauseGame() {
    if (gameState !== 'playing' || demo) return;
    saveBiggest();
    gameState = 'paused';
    resetTouches();
    showPanel('pause');
  }
  function resumeGame() {
    enterFullscreen();
    hideOverlay();
    resetTouches();
    gameState = 'playing';
  }
  pauseBtn.addEventListener('click', () => { pauseBtn.blur(); pauseGame(); });
  window.addEventListener('keydown', (e) => {
    if ((e.key !== 'Escape' && e.key !== 'p' && e.key !== 'P') || e.repeat) return;
    if (gameState === 'playing') pauseGame();
    else if (!panels.pause.hidden && overlay.style.display !== 'none') resumeGame();
  });
  // Leaving the tab / switching apps pauses, so the game waits for you when you come back
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });
  document.getElementById('resumeBtn').addEventListener('click', resumeGame);
  document.getElementById('pauseRestartBtn').addEventListener('click', () => startGame(difficultyKey));
  document.getElementById('pauseMenuBtn').addEventListener('click', () => {
    gameState = 'start';
    showPanel('menu');
  });

  // ---------- Start and end of a run ----------
  function startGame(key, isDemo = false) {
    enterFullscreen();
    ensureAudio();
    resetTouches();
    clearTimeout(demoRestartT);
    demo = isDemo;
    demoStartedAt = performance.now();
    difficultyKey = key;
    difficulty = DIFFICULTIES[key];
    document.getElementById('difficultyName').textContent = difficulty.label + (demo ? ' · Demo' : '');
    hideOverlay();
    gameState = 'playing';
    elapsed = 0;
    cheated = demo;  // demo runs never set records
    reachedFinalStage = false;
    reachedMaxSize = false;
    lastStageIndex = 0;
    player.x = 0;
    player.y = FLOOR_Y - WATER_DEPTH / 2;
    player.air = null;
    player.heading = 0;
    player.r = BASE_R;
    runMaxR = BASE_R;
    player.growQueue.length = 0;
    player.turnInput = 0;
    player.boost = difficulty.boostMax;
    player.stunTimer = 0;
    player.invulnTimer = SPAWN_GRACE;
    player.alive = true;
    player.caught = false;
    demoPilot.reset();
    particles.length = 0;
    bubbles.length = 0;
    drops.length = 0;
    foams.length = 0;
    feathers.length = 0;
    resetWorld();
    if (demo) showBanner('Demo — press any key or tap to exit');
  }

  function endGame(reason) {
    gameState = 'over';
    saveBiggest();
    GameEvents.emit('gameOver', { reason });
    resetTouches();
    if (demo) {
      showBanner('💀 ' + reason);
      demoRestartT = setTimeout(() => startGame('easy', true), DEMO_RESTART_DELAY * 1000);
      return;
    }
    showGameOver(reason);
  }

  // Messages for the player's run-ins with the gulls (their sounds are in ui/sounds.js)
  GameEvents.on('gull', ({ fish, hit }) => {
    if (fish !== player) return;
    if (hit === 'eaten') showBanner('🐦 Gull snack!');
    else if (hit === 'scared') showBanner('🐦 Shoo! The gull flew off');
  });

  // ---------- Test cheat: digits set the player's size (1-5 = each stage, 6-9 = bigger Sea King, 0 = max size) ----------
  window.addEventListener('keydown', (e) => {
    if (gameState !== 'playing' || e.repeat) return;
    const level = parseInt(e.key, 10);
    if (!(level >= 0 && level <= 9)) return;
    saveBiggest();  // the size grown fairly before the cheat still counts
    cheated = true;
    player.r = CHEAT_RADII[level];
    player.growQueue.length = 0;
    // Going down lets stage-ups fire again; going up is left to update(), so the Sea King dialog can be tested
    const si = stageIndexForR(player.r);
    if (si < lastStageIndex) lastStageIndex = si;
    showBanner('Cheat: level ' + (level === 0 ? 'MAX' : level) + ' — ' + STAGES[si].name);
  });

  // ---------- Update ----------
  // Steering from the keys and the joystick (or the demo pilot), -1..1
  function steering(dt) {
    let turnTarget = (keys['ArrowRight'] || keys['d'] ? 1 : 0) - (keys['ArrowLeft'] || keys['a'] ? 1 : 0);
    // Joystick points in the direction to swim; turn toward it proportionally
    if (joystick.id !== null && Math.hypot(joystick.dx, joystick.dy) / JOY_RADIUS > JOY_DEADZONE) {
      const want = Math.atan2(joystick.dy, joystick.dx);
      turnTarget += clamp(angDiff(want, player.heading) * 2.5, -1, 1);
    }
    return demo ? demoPilot.turnTarget(dt) : clamp(turnTarget, -1, 1);
  }

  // New stages show a banner; the Sea King and the maximum size open their milestone dialog
  function checkStages() {
    const afterStage = stageIndexForR(player.r);
    if (afterStage > lastStageIndex) {
      lastStageIndex = afterStage;
      GameEvents.emit('stageUp', { stage: afterStage });
      if (afterStage === STAGES.length - 1 && !reachedFinalStage) {
        reachedFinalStage = true;
        showMilestoneDialog('king');
      } else {
        showBanner('New stage: ' + STAGES[afterStage].name + '!' +
          (afterStage === JELLY_EATER_STAGE ? ' Jellyfish can\'t sting you anymore — eat them!' : ''));
      }
    }
    if (gameState === 'playing' && !reachedMaxSize && player.r >= MAX_R) {
      reachedMaxSize = true;
      player.growQueue.length = 0;
      showMilestoneDialog('max');
    }
  }

  let last = performance.now();
  function update(dt) {
    // after a gull snatched the player, keep it flying off with the catch behind the game-over panel
    if (gameState === 'over' && player.caught) for (const b of birds) if (b.leaving) updateBird(b, dt);
    if (gameState !== 'playing') return;

    elapsed += dt;
    if (player.stunTimer > 0) player.stunTimer -= dt;
    if (player.invulnTimer > 0) player.invulnTimer -= dt;

    const turnTarget = steering(dt);
    const boostHeld = demo ? demoPilot.dash : keys['ArrowUp'] || keys['w'] || keys['Control'] || isTouchBoosting();
    updatePlayer(dt, turnTarget, boostHeld);

    updateJellies(dt);
    for (const n of npcs) updateNpc(n, dt);
    npcsEat(dt);
    updatePopulation();
    updateBirds(dt);

    applyQueuedGrowth(dt);
    const death = playerCollisions(dt);
    if (death) { endGame(death); return; }

    checkStages();
    updateEffects(dt);

    runMaxR = Math.max(runMaxR, player.r);
    updateHud();
  }

  // ---------- Rendering (render.js) ----------
  // Everything the renderer draws from; the game state changes, so it is read through a getter
  const view = {
    player, foods, npcs, jellies, birds, feathers, drops, foams, particles, bubbles,
    worldToScreen, currentZoom, depthFrac, stageIndexForR, chompOpen,
    get playing() { return gameState === 'playing'; },
    get radar() { return radarOn; }
  };

  // Radar on only while a predator could reach the player from the nearest screen edge faster than one can react
  // and turn away (see RADAR_REACTION)
  let radarOn = false;
  function updateRadarNeed() {
    const edge = Math.min(screenW, screenH) / 2 / currentZoom();
    const closing = speedForR(player.r) + npcSpeed(player.r * EAT_MARGIN) * (1.2 + NPC_BOOST_ADD);
    const need = RADAR_REACTION + Math.PI / 2 / turnRateForR(player.r);
    const t = edge / closing;
    radarOn = radarOn ? t < need * RADAR_HYSTERESIS : t < need;
  }

  const graphicsLabel = () => (graphicsKey === 'auto' ? 'Auto ' : '') + GRAPHICS[activeGraphics()].label;
  const frameDue = frameLimiter();
  let wasPlaying = false;
  function loop(now) {
    requestAnimationFrame(loop);
    if (!frameDue(now)) return;
    const frameTime = (now - last) / 1000;
    const dt = Math.min(frameTime, 0.05);
    last = now;
    // Auto graphics measures only steady play: menus, pauses and dialogs don't count
    const isPlaying = gameState === 'playing';
    if (graphicsKey === 'auto' && isPlaying) {
      if (!wasPlaying) autoGraphics.reset();
      else autoGraphics.frame(frameTime);
    }
    wasPlaying = isPlaying;
    update(dt);
    updateRadarNeed();
    renderer.render(view);
    countFps(now, graphicsLabel);
    const hidePause = gameState !== 'playing' || demo;
    if (pauseBtn.hidden !== hidePause) pauseBtn.hidden = hidePause;
  }
  requestAnimationFrame(loop);
})();
