// A lesson: tasks, the draining safety level, answers, win / lose.

const SCENES = { flower: createFlowerScene, zombies: createZombieScene, railway: createRailwayScene, balloon: createBalloonScene, campfire: createCampfireScene, panda: createPandaScene };

const Lesson = (() => {
  const $ = id => document.getElementById(id);
  const canvas = $('scene');
  const ctx = canvas.getContext('2d');
  let dpr = 1, cw = 0, ch = 0;

  let L = null; // current lesson state
  let onEnd = null;

  // The scene's box also changes without a window resize (the panel below it grows in portrait).
  if (window.ResizeObserver) new ResizeObserver(() => { if (L) resize(); }).observe($('sceneWrap'));

  function resize() {
    const wrap = $('sceneWrap');
    cw = wrap.clientWidth;
    ch = wrap.clientHeight;
    dpr = Quality.canvasScale(cw, ch);
    canvas.width = Math.max(1, Math.round(cw * dpr));
    canvas.height = Math.max(1, Math.round(ch * dpr));
  }

  // step: 1-based step to play (a new one or a replay of a finished one).
  function start(player, proc, step, endCb) {
    onEnd = endCb;
    const st = player.settings;
    const boss = Progress.bossKind(step); // null on a normal step
    const isBoss = !!boss;
    const types = Tasks.usable(st); // enabled types this device can run (Reading needs a voice)
    L = {
      player, proc, st, step, isBoss, boss,
      total: st.lessonLength,
      need: isBoss ? st.lessonLength - 1 : st.lessonLength, // normal tasks before the boss
      bossHp: 0,
      done: 0, mistakes: 0, cheated: false,
      types,
      prices: Object.fromEntries(types.map(t => [t, Tasks.price(st, t).coins])), // coins per correct answer, by task type
      earned: 0, // coins of the correct answers so far (the share paid depends on the mistakes)
      paid: 0,   // correct answers so far, boss hits included
      typeSeq: typeSequence(types, isBoss ? st.lessonLength - 1 + BOSS_HITS : st.lessonLength),
      maxCoins: 0, // the lesson's price: coins of all its answers (boss hits included) with no mistakes
      f: 1, phase: 'intro', phaseT: 0, wrongT: 0, tickT: 0, noteT: 0,
      task: null, typed: '', lastWrong: false, mode: 'choice', opts: [],
      scene: SCENES[proc.id]({ step: step - 1 }),
    };
    L.maxCoins = L.typeSeq.reduce((s, t) => s + L.prices[t], 0);
    $('lsProc').textContent = proc.icon + ' ' + proc.name;
    $('lsStep').textContent = 'Step ' + step + (isBoss ? ' · ' + boss.name : '');
    $('wrongNote').textContent = '';
    $('taskPanel').classList.toggle('twoLineNote', types.includes('scale'));
    showNote(isBoss ? `Get ready! ${boss.name} at the end ${boss.icon}` : 'Get ready!', false, isBoss ? `Beat it for up to ${boss.gems} 💎` : '');
    resize();
    nextTask();
    updateInfo();
  }

  // Task type of each correct answer: an even split in random order, so a lesson's coins are the same
  // every time it's played with the same settings (a perfect replay pays exactly what's missing).
  // A wrong answer brings another task of the same type. The extra ones of an uneven split go to the first types.
  function typeSequence(types, count) {
    const seq = [];
    for (let i = 0; i < count; i++) seq.push(types[i % types.length]);
    for (let i = seq.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [seq[i], seq[j]] = [seq[j], seq[i]];
    }
    return seq;
  }

  function nextTask() {
    L.task = Tasks.make(L.st, L.typeSeq[Math.min(L.paid, L.typeSeq.length - 1)]);
    L.fail = Tasks.failTime(L.task, L.st);
    L.typed = '';
    const type = L.task.type;
    setMode(L.st.answerMode === 'type' && !Tasks.choiceOnly(type) ? 'type' : 'choice');
    $('taskPrice').textContent = '🪙 ' + L.prices[type];
    $('taskText').hidden = type !== 'math';
    $('taskScale').hidden = type !== 'scale';
    $('taskRead').hidden = type !== 'read';
    $('ansLine').hidden = type === 'read';
    $('ansPrefix').textContent = type === 'scale' ? '▼ =' : '=';
    if (type === 'scale') $('taskScale').innerHTML = ScaleTasks.svg(L.task);
    else if (type === 'math') {
      $('taskText').textContent = L.task.text;
      const len = L.task.text.length;
      $('taskCard').dataset.len = len > 17 ? 's' : len > 11 ? 'm' : 'l';
    }
    renderAnswer();
    if (L.mode === 'choice') {
      L.opts = Tasks.choices(L.task);
      // Words and phrases get a smaller font the longer the longest option is.
      const long = Math.max(...L.opts.map(o => Tasks.label(o).length));
      $('choices').dataset.len = long > 14 ? 'xs' : long > 9 ? 's' : long > 6 ? 'm' : '';
      [...$('choices').children].forEach((b, i) => {
        b.querySelector('.val').textContent = Tasks.label(L.opts[i]);
        b.classList.remove('picked');
      });
    }
    const card = $('taskCard');
    card.classList.remove('ok', 'bad', 'pop');
    void card.offsetWidth;
    card.classList.add('pop');
    sayTask();
  }

  // Answer controls for the task: four buttons, or typing (with the number pad on touch screens).
  // Reading is always picked, so a lesson mixing it with typed math switches between the two.
  function setMode(mode) {
    L.mode = mode;
    const choice = mode === 'choice';
    const pad = !choice && matchMedia('(pointer: coarse)').matches;
    const wasHidden = $('choices').hidden;
    $('choices').hidden = !choice;
    $('numpad').hidden = !pad;
    $('typeHint').hidden = choice || pad;
    if (choice && wasHidden) $('choices').children[0].focus();
  }

  // A reading task: the voice says it (again).
  function sayTask() {
    if (L && L.task && L.task.type === 'read' && L.phase !== 'done') ReadTasks.say(L.task);
  }

  function renderAnswer() {
    const box = $('answerBox');
    box.textContent = L.typed ? Tasks.fmt(Number(L.typed)) : '?';
    box.classList.toggle('empty', !L.typed);
    box.classList.toggle('typing', L.mode === 'type');
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
    b.textContent = !L.isBoss ? ''
      : L.bossHp > 0 ? L.boss.icon + ' ' + '❤'.repeat(L.bossHp) + '♡'.repeat(BOSS_HITS - L.bossHp)
      : L.done >= L.total ? L.boss.icon + ' Defeated!' : `${L.boss.icon} ${L.boss.name}: ${BOSS_HITS} hits · up to ${L.boss.gems} 💎`;
    $('lsMistakes').textContent = L.mistakes;
    $('lsEarned').textContent = L.earned;
    $('lsCoinMax').textContent = L.maxCoins;
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
      if (L.mode === 'type') { L.typed = String(value); renderAnswer(); }
      L.phaseT = 0;
      L.lastWrong = false;
      L.earned += L.prices[L.task.type]; // every boss hit pays too
      L.paid++;
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
          showNote(L.boss.note, true, BOSS_HITS + ' correct answers to win' + L.boss.hint);
        } else {
          L.phase = 'feedback';
          L.scene.correct(L.done, L.total);
        }
      }
    } else {
      L.mistakes++;
      Sfx.wrong();
      card.classList.add('bad');
      $('wrongNote').textContent = '✗  ' + L.task.solution;
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
      L.f -= dt / (L.fail * (L.bossHp > 0 ? L.boss.timeMul : 1));
      if (L.f <= WARN_LEVEL) {
        L.tickT -= dt;
        if (L.tickT <= 0) { Sfx.tick(); L.tickT = L.f < WARN_LEVEL / 2 ? WARN_TICK / 2 : WARN_TICK; }
      }
      if (L.f <= 0) {
        L.f = 0;
        L.phase = 'lose';
        L.phaseT = 0;
        L.scene.lose();
        Speech.stop();
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
    Speech.stop();
    const r = { won, proc: L.proc, done: L.done, total: L.total, mistakes: L.mistakes, earned: L.earned, cheated: L.cheated, step: L.step, isBoss: L.isBoss, bossLeft: L.bossHp };
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
    if (L.mode === 'choice') {
      const n = Number(k);
      if (n >= 1 && n <= CHOICE_COUNT) {
        $('choices').children[n - 1].classList.add('picked');
        submit(L.opts[n - 1]);
        return true;
      }
      if (L.task.type === 'read' && (k === '0' || k === 'r' || k === 'R')) { sayTask(); return true; }
      return false; // arrows / Enter work through the focused buttons
    }
    return typeKey(k);
  }

  // Typing mode: a digit, Backspace or Enter / Space, from the keyboard or the on-screen number pad.
  function typeKey(k) {
    const open = L.phase === 'play' || L.phase === 'intro';
    if (/^[0-9]$/.test(k)) {
      if (L.typed.length < TYPE_MAX_DIGITS && open) {
        L.typed = (L.typed === '0' ? '' : L.typed) + k;
        renderAnswer();
      }
      return true;
    }
    if (k === 'Backspace') {
      if (open) { L.typed = L.typed.slice(0, -1); renderAnswer(); }
      return true;
    }
    if (k === 'Enter' || k === ' ') {
      if (L.typed && open) submit(Number(L.typed));
      return true;
    }
    return false;
  }

  function padClick(btn) {
    if (!L || L.phase === 'done' || L.mode !== 'type') return;
    typeKey(btn.dataset.key);
  }

  function choiceClick(btn) {
    if (!L) return;
    btn.classList.add('picked');
    submit(L.opts[[...$('choices').children].indexOf(btn)]);
  }

  return {
    start, update, draw, key, resize, choiceClick, padClick, sayTask,
    stop: () => { L = null; Speech.stop(); },
    active: () => !!L && L.phase !== 'done',
    typing: () => !!L && L.mode === 'type', // the current task's answer is typed (Backspace deletes, not back)
  };
})();
