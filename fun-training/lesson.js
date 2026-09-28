// A lesson: tasks, the draining safety level, answers, win / lose.

const SCENES = { flower: createFlowerScene, zombies: createZombieScene, railway: createRailwayScene, balloon: createBalloonScene, campfire: createCampfireScene };

const Lesson = (() => {
  const $ = id => document.getElementById(id);
  const canvas = $('scene');
  const ctx = canvas.getContext('2d');
  let dpr = 1, cw = 0, ch = 0;

  let L = null; // current lesson state
  let onEnd = null;

  function resize() {
    const wrap = $('sceneWrap');
    cw = wrap.clientWidth;
    ch = wrap.clientHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2, 2560 / Math.max(1, cw), 1440 / Math.max(1, ch));
    canvas.width = Math.max(1, Math.round(cw * dpr));
    canvas.height = Math.max(1, Math.round(ch * dpr));
  }

  // step: 1-based step to play (a new one or a replay of a finished one).
  function start(player, proc, step, endCb) {
    onEnd = endCb;
    const st = player.settings;
    const isBoss = step % BOSS_EVERY === 0;
    L = {
      player, proc, st, step, isBoss,
      total: st.lessonLength,
      need: isBoss ? st.lessonLength - 1 : st.lessonLength, // normal tasks before the boss
      bossHp: 0,
      done: 0, mistakes: 0, cheated: false,
      f: 1, phase: 'intro', phaseT: 0, wrongT: 0, tickT: 0, noteT: 0,
      task: null, typed: '', lastWrong: false,
      scene: SCENES[proc.id]({ step: step - 1 }),
    };
    $('lsProc').textContent = proc.icon + ' ' + proc.name;
    $('lsStep').textContent = 'Step ' + step + (isBoss ? ' · Boss' : '');
    $('choices').hidden = st.answerMode !== 'choice';
    $('typeHint').hidden = st.answerMode !== 'type';
    $('wrongNote').textContent = '';
    showNote(isBoss ? 'Get ready! Boss at the end 👹' : 'Get ready!', false);
    resize();
    nextTask();
    updateInfo();
  }

  function nextTask() {
    L.task = Tasks.make(L.st.math);
    L.fail = Tasks.failTime(L.task, L.st.math, L.st.answerMode);
    L.typed = '';
    $('taskText').textContent = L.task.text;
    const len = L.task.text.length;
    $('taskCard').dataset.len = len > 17 ? 's' : len > 11 ? 'm' : 'l';
    renderAnswer();
    if (L.st.answerMode === 'choice') {
      const opts = Tasks.choices(L.task);
      [...$('choices').children].forEach((b, i) => {
        b.dataset.value = opts[i];
        b.querySelector('.val').textContent = Tasks.fmt(opts[i]);
        b.classList.remove('picked');
      });
    }
    const card = $('taskCard');
    card.classList.remove('ok', 'bad', 'pop');
    void card.offsetWidth;
    card.classList.add('pop');
  }

  function renderAnswer() {
    const box = $('answerBox');
    box.textContent = L.typed ? Tasks.fmt(Number(L.typed)) : '?';
    box.classList.toggle('empty', !L.typed);
    box.classList.toggle('typing', L.st.answerMode === 'type');
  }

  function showNote(text, boss, sub) {
    const n = $('readyNote');
    n.textContent = text;
    if (sub) {
      const s = document.createElement('small');
      s.textContent = sub;
      n.append(s);
    }
    n.classList.toggle('boss', boss);
    n.hidden = false;
    n.style.animation = 'none';
    void n.offsetWidth;
    n.style.animation = '';
    L.noteT = boss ? BOSS_NOTE_TIME : 0;
  }

  function updateInfo() {
    $('lsCount').textContent = L.done + ' / ' + L.total;
    const b = $('lsBoss');
    b.hidden = !L.isBoss;
    b.classList.toggle('active', L.bossHp > 0);
    b.textContent = L.bossHp > 0
      ? '👹 ' + '❤'.repeat(L.bossHp) + '♡'.repeat(BOSS_HITS - L.bossHp)
      : L.done >= L.total ? '👹 Defeated!' : '👹 Boss: ' + BOSS_HITS + ' hits';
    $('lsMistakes').textContent = L.mistakes;
    $('lsMistakesBox').classList.toggle('some', L.mistakes > 0);
    const bar = $('lsProgress');
    bar.style.width = (100 * L.done / L.total) + '%';
  }

  function submit(value) {
    if (!L || (L.phase !== 'play' && L.phase !== 'intro')) return;
    if (L.phase === 'intro') { L.phase = 'play'; $('readyNote').hidden = true; }
    const card = $('taskCard');
    card.classList.remove('ok', 'bad', 'pop');
    void card.offsetWidth;
    if (value === L.task.answer) {
      Sfx.correct();
      card.classList.add('ok');
      if (L.st.answerMode === 'type') { L.typed = String(value); renderAnswer(); }
      L.phaseT = 0;
      L.lastWrong = false;
      if (L.bossHp > 0) {
        // Boss round: each hit counts, the level is not refilled.
        L.bossHp--;
        if (L.bossHp === 0) {
          L.done++;
          L.phase = 'win';
          L.scene.win(L.done, L.total);
        } else {
          L.phase = 'feedback';
          L.scene.bossHit(L.bossHp);
        }
      } else {
        L.done++;
        L.f = 1;
        if (L.done >= L.need && !L.isBoss) {
          L.phase = 'win';
          L.scene.win(L.done, L.total);
        } else if (L.done >= L.need) {
          L.phase = 'feedback';
          L.bossHp = BOSS_HITS;
          L.scene.correct(L.done, L.total);
          L.scene.bossStart();
          Sfx.boss();
          showNote('👹 BOSS!', true, BOSS_HITS + ' correct answers to win');
        } else {
          L.phase = 'feedback';
          L.scene.correct(L.done, L.total);
        }
      }
    } else {
      L.mistakes++;
      Sfx.wrong();
      card.classList.add('bad');
      $('wrongNote').textContent = '✗  ' + L.task.text + ' = ' + Tasks.fmt(L.task.answer);
      L.wrongT = WRONG_SHOW_TIME;
      L.phase = 'feedback';
      L.phaseT = 0;
      L.lastWrong = true;
      L.scene.wrong();
    }
    updateInfo();
  }

  function update(dt) {
    if (!L) return;
    L.phaseT += dt;
    if (L.phase === 'intro' && L.phaseT >= INTRO_TIME) { L.phase = 'play'; $('readyNote').hidden = true; }
    if (L.noteT > 0) { L.noteT -= dt; if (L.noteT <= 0) $('readyNote').hidden = true; }
    const draining = L.phase === 'play' || (L.phase === 'feedback' && L.lastWrong);
    if (draining) {
      L.f -= dt / (L.fail * (L.bossHp > 0 ? BOSS_TIME_MUL : 1));
      if (L.f <= WARN_LEVEL) {
        L.tickT -= dt;
        if (L.tickT <= 0) { Sfx.tick(); L.tickT = L.f < WARN_LEVEL / 2 ? WARN_TICK / 2 : WARN_TICK; }
      }
      if (L.f <= 0) {
        L.f = 0;
        L.phase = 'lose';
        L.phaseT = 0;
        L.scene.lose();
      }
    }
    if (L.phase === 'feedback' && L.phaseT >= FEEDBACK_TIME) { L.phase = 'play'; nextTask(); }
    if (L.wrongT > 0) { L.wrongT -= dt; if (L.wrongT <= 0) $('wrongNote').textContent = ''; }
    if ((L.phase === 'win' || L.phase === 'lose') && L.phaseT >= END_ANIM_TIME) finish(L.phase === 'win');
    L.scene.update(dt, clamp(L.f, 0, 1));
  }

  function draw() {
    if (!L) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);
    L.scene.draw(ctx, cw, ch);
  }

  function finish(won) {
    const r = { won, proc: L.proc, done: L.done, total: L.total, mistakes: L.mistakes, cheated: L.cheated, step: L.step, isBoss: L.isBoss, bossLeft: L.bossHp };
    L.phase = 'done';
    if (onEnd) onEnd(r);
  }

  function cheat() {
    if (!L || L.phase !== 'play') return;
    L.cheated = true;
    showBanner('Cheat: answered correctly (this lesson won’t count)');
    submit(L.task.answer);
  }

  // Keys during the lesson. Returns true if handled.
  function key(e) {
    if (!L || L.phase === 'done') return false;
    const k = e.key;
    if (k === ']') { cheat(); return true; }
    if (L.st.answerMode === 'choice') {
      const n = Number(k);
      if (n >= 1 && n <= CHOICE_COUNT) {
        const b = $('choices').children[n - 1];
        b.classList.add('picked');
        submit(Number(b.dataset.value));
        return true;
      }
      return false; // arrows / Enter work through the focused buttons
    }
    if (/^[0-9]$/.test(k)) {
      if (L.typed.length < TYPE_MAX_DIGITS && (L.phase === 'play' || L.phase === 'intro')) {
        L.typed = (L.typed === '0' ? '' : L.typed) + k;
        renderAnswer();
      }
      return true;
    }
    if (k === 'Backspace') {
      if (L.phase === 'play' || L.phase === 'intro') { L.typed = L.typed.slice(0, -1); renderAnswer(); }
      return true;
    }
    if (k === 'Enter' || k === ' ') {
      if (L.typed && (L.phase === 'play' || L.phase === 'intro')) submit(Number(L.typed));
      return true;
    }
    return false;
  }

  function choiceClick(btn) {
    if (!L) return;
    btn.classList.add('picked');
    submit(Number(btn.dataset.value));
  }

  let bannerTimer = 0;
  function showBanner(text) {
    const b = $('banner');
    b.textContent = text;
    b.classList.add('show');
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => b.classList.remove('show'), 2200);
  }

  return {
    start, update, draw, key, resize, choiceClick,
    stop: () => { L = null; },
    active: () => !!L && L.phase !== 'done',
  };
})();
