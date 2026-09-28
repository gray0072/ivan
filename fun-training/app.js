// Screens, settings UI, keyboard / remote routing and the main loop.

(() => {
  const $ = id => document.getElementById(id);
  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  let screen = 'players';
  let current = null;     // current player
  let paused = false;
  let lastResult = null;
  let newAvatar = AVATARS[0];

  // ---------- helpers ----------

  function showScreen(name) {
    screen = name;
    document.querySelectorAll('.screen').forEach(s => { s.hidden = true; });
    const s = $('screen' + name[0].toUpperCase() + name.slice(1));
    s.hidden = false;
    hideOverlay();
    Nav.setRoot(s);
  }

  function showPanel(id) {
    const o = $('overlay');
    o.hidden = false;
    o.querySelectorAll('.panel').forEach(p => { p.hidden = p.id !== id; });
    Nav.setRoot($(id));
  }

  function hideOverlay() {
    $('overlay').hidden = true;
    Confetti.stop();
  }

  const overlayOpen = () => !$('overlay').hidden;

  const tierOf = i => STAR_TIERS[Math.min(i, STAR_TIERS.length - 1)];

  function starHTML(i, cls = '') {
    const tier = tierOf(i);
    return tier.color === 'rainbow'
      ? `<span class="star rainbow ${cls}" title="${tier.name} star">★</span>`
      : `<span class="star ${cls}" style="--c:${tier.color}" title="${tier.name} star">★</span>`;
  }

  function starsHTML(count) {
    let h = '';
    for (let i = 0; i < Math.min(count, 8); i++) h += starHTML(i, 'small');
    if (count > 8) h += `<span class="more">+${count - 8}</span>`;
    return h;
  }

  // One step cell of a track: done perfectly (✓), done with mistakes (↻, can be replayed for more coins),
  // the next step, or a future one.
  function cellInfo(p, proc, n) {
    const steps = p.progress[proc.id];
    const cls = ['cell'];
    let inner = String(n), title = 'Step ' + n;
    if (n <= steps) {
      const rate = p.rates[proc.id][n - 1];
      if (rate >= MAX_RATE) { cls.push('done'); inner = '✓'; title += ' — perfect'; }
      else {
        cls.push('partial', 'r' + rate);
        inner = '↻';
        title += ` — replay with 0–1 mistakes for ${MAX_RATE - rate} more coins per task`;
      }
    } else if (n === steps + 1) cls.push('current');
    else cls.push('future');
    if (n % BOSS_EVERY === 0) { cls.push('boss'); title += ' (boss)'; }
    return { cls: cls.join(' '), inner: inner + (n % BOSS_EVERY === 0 ? '<i>💀</i>' : ''), title, playable: n <= steps + 1 };
  }

  // Static track (result dialog) of the block that holds step `n`.
  function trackHTML(p, proc, n) {
    const block = Math.floor((n - 1) / TRACK_LEN);
    let h = '<span class="track">';
    for (let i = 0; i < TRACK_LEN; i++) {
      const c = cellInfo(p, proc, block * TRACK_LEN + i + 1);
      h += `<span class="${c.cls}" title="${c.title}">${c.inner}</span>`;
    }
    const earned = p.progress[proc.id] >= (block + 1) * TRACK_LEN;
    return h + starHTML(block, 'goal' + (earned ? ' earned' : '')) + '</span>';
  }

  const viewBlock = {}; // process id -> block shown on the home screen

  // Interactive track: every playable cell is a button; ‹ › page through blocks of 10.
  function trackEl(p, proc, isFirst) {
    const steps = p.progress[proc.id];
    const cur = Math.floor(steps / TRACK_LEN);
    let block = viewBlock[proc.id];
    if (block === undefined || block > cur) block = viewBlock[proc.id] = cur;
    const wrap = el('div', 'track');
    const pager = (dir, label) => {
      const b = el('button', 'pageBtn', dir < 0 ? '‹' : '›');
      b.setAttribute('aria-label', label);
      const on = dir < 0 ? block > 0 : block < cur;
      if (!on) { b.disabled = true; b.classList.add('off'); }
      b.addEventListener('click', () => { viewBlock[proc.id] = block + dir; renderHome(); focusCell(proc.id, dir); });
      return b;
    };
    wrap.append(pager(-1, 'Earlier steps'));
    for (let i = 0; i < TRACK_LEN; i++) {
      const n = block * TRACK_LEN + i + 1;
      const c = cellInfo(p, proc, n);
      const b = el('button', c.cls + (isFirst && n === steps + 1 ? ' default' : ''), c.inner);
      b.title = c.title;
      b.dataset.proc = proc.id;
      b.dataset.step = n;
      if (c.playable) b.addEventListener('click', () => startLesson(proc, n));
      else b.disabled = true;
      wrap.append(b);
    }
    const earned = steps >= (block + 1) * TRACK_LEN;
    wrap.insertAdjacentHTML('beforeend', starHTML(block, 'goal' + (earned ? ' earned' : '')));
    wrap.append(pager(1, 'Later steps'));
    return wrap;
  }

  // After paging, keep the focus on that process's track.
  function focusCell(procId, dir) {
    const cells = [...document.querySelectorAll(`#processList .cell[data-proc="${procId}"]:not([disabled])`)];
    const b = dir < 0 ? cells[0] : cells[cells.length - 1];
    if (b) b.focus();
  }

  function toImprove(p, proc) {
    return p.rates[proc.id].filter(r => r < MAX_RATE).length;
  }

  function totalStars(p) {
    return PROCESSES.reduce((s, pr) => s + Math.floor(p.progress[pr.id] / TRACK_LEN), 0);
  }

  function limitText(v) { return 'up to ' + Tasks.fmt(v); }

  function summary(st) {
    const m = st.math;
    const ops = m.ops.map(id => {
      const op = OPERATIONS.find(o => o.id === id);
      return `<b>${op.sign}</b> ${limitText(m.limits[id])}`;
    }).join(', ');
    const sp = SPEEDS.find(s => s.id === m.speed);
    const am = ANSWER_MODES.find(a => a.id === st.answerMode);
    return `🔢 ${ops} · ${m.operands} numbers${m.mix && m.ops.length > 1 && m.operands > 2 ? ' · mixed' : ''} · ${sp.icon} ${sp.name} · ${am.icon} ${am.name} · ${st.lessonLength} tasks`;
  }

  function goFullscreen() {
    if (!matchMedia('(pointer: coarse)').matches || document.fullscreenElement) return;
    const d = document.documentElement;
    try {
      const r = (d.requestFullscreen || d.webkitRequestFullscreen).call(d, { navigationUI: 'hide' });
      if (r && r.catch) r.catch(() => {});
    } catch (e) { /* not supported (iPhone) */ }
  }

  // ---------- players ----------

  function renderPlayers() {
    const list = $('playerList');
    list.innerHTML = '';
    const players = Store.players();
    const lastId = Store.lastId();
    for (const p of players) {
      const slot = el('div', 'playerSlot');
      const card = el('button', 'playerCard' + (p.id === lastId ? ' default' : ''),
        `<span class="pAvatar">${p.avatar}</span><span class="pName">${esc(p.name)}</span>` +
        `<span class="pMeta">🪙 ${p.coins} · ${starHTML(0, 'small')} ${totalStars(p)}</span>`);
      card.addEventListener('click', () => selectPlayer(p.id));
      const del = el('button', 'pDelete', '🗑 Delete');
      let armed = 0;
      del.addEventListener('click', () => {
        if (armed) {
          clearTimeout(armed);
          Store.remove(p.id);
          renderPlayers();
          Nav.setRoot($('screenPlayers'));
          return;
        }
        del.classList.add('armed');
        del.textContent = 'Sure? Press again';
        armed = setTimeout(() => { armed = 0; del.classList.remove('armed'); del.textContent = '🗑 Delete'; }, DELETE_CONFIRM_TIME * 1000);
      });
      slot.append(card, del);
      list.append(slot);
    }
    const slot = el('div', 'playerSlot');
    const add = el('button', 'playerCard newCard' + (players.some(p => p.id === lastId) ? '' : ' default'),
      '<span class="pAvatar">＋</span><span class="pName">New player</span>');
    add.addEventListener('click', openNewPlayer);
    slot.append(add);
    list.append(slot);
  }

  function selectPlayer(id) {
    current = Store.get(id);
    if (!current) return;
    Store.setLast(id);
    openHome();
  }

  function openNewPlayer() {
    $('nameInput').value = '';
    newAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
    renderAvatars();
    showScreen('new');
  }

  function renderAvatars() {
    const g = $('avatarGrid');
    g.innerHTML = '';
    for (const a of AVATARS) {
      const b = el('button', 'avatarBtn' + (a === newAvatar ? ' on' : ''), a);
      b.addEventListener('click', () => {
        newAvatar = a;
        g.querySelectorAll('.avatarBtn').forEach(x => x.classList.toggle('on', x === b));
      });
      g.append(b);
    }
  }

  function createPlayer() {
    const input = $('nameInput');
    const name = input.value.trim();
    if (!name) {
      input.classList.remove('shake');
      void input.offsetWidth;
      input.classList.add('shake');
      input.focus();
      return;
    }
    current = Store.create(name, newAvatar);
    openHome();
  }

  // ---------- home ----------

  function openHome() {
    renderHome();
    showScreen('home');
  }

  function renderHome() {
    const p = current;
    $('homeAvatar').textContent = p.avatar;
    $('homeName').textContent = p.name;
    $('homeCoins').textContent = p.coins;
    $('trainingSummary').innerHTML = summary(p.settings);
    const list = $('processList');
    list.innerHTML = '';
    let first = true;
    for (const proc of PROCESSES) {
      const steps = p.progress[proc.id];
      const row = el('div', 'procRow' + (proc.ready ? '' : ' soon'));
      const main = el('div', 'procMain', `<span class="procName">${proc.name}</span>`);
      if (proc.ready) main.append(trackEl(p, proc, first));
      else main.insertAdjacentHTML('beforeend', '<span class="soonLabel">Coming soon</span>');
      const fix = proc.ready ? toImprove(p, proc) : 0;
      const side = el('div', 'procSide', proc.ready
        ? `<span class="procStep">Step ${steps + 1}</span><span class="procStars">${starsHTML(Math.floor(steps / TRACK_LEN))}</span>` +
          (fix ? `<span class="procFix" title="Steps you can replay for more coins">↻ ${fix} to improve</span>` : '')
        : '');
      row.append(el('span', 'procIcon', proc.icon), main, side);
      if (proc.ready) first = false;
      list.append(row);
    }
  }

  // ---------- settings ----------

  function segment(container, items, isOn, onPick) {
    container.innerHTML = '';
    for (const it of items) {
      const b = el('button', 'segBtn', it.html);
      b.addEventListener('click', () => { onPick(it.value); refreshSettings(); });
      b._isOn = () => isOn(it.value);
      container.append(b);
    }
  }

  function buildSettings() {
    const ops = $('opsRow');
    ops.innerHTML = '';
    for (const op of OPERATIONS) {
      const col = el('div', 'opCol');
      const t = el('button', 'opToggle', `<span class="opSign">${op.sign}</span><span class="opName">${op.name}</span><span class="check">✓</span>`);
      t.dataset.op = op.id;
      t.addEventListener('click', () => {
        const m = current.settings.math;
        if (m.ops.includes(op.id)) {
          if (m.ops.length === 1) { t.classList.remove('shake'); void t.offsetWidth; t.classList.add('shake'); return; }
          m.ops = m.ops.filter(x => x !== op.id);
        } else m.ops = OPERATIONS.map(o => o.id).filter(id => id === op.id || m.ops.includes(id));
        saveSettings();
      });
      const stepper = el('div', 'stepper');
      const minus = el('button', 'stepBtn', '‹');
      const val = el('span', 'stepVal');
      const plus = el('button', 'stepBtn', '›');
      const change = d => {
        const m = current.settings.math;
        const i = clamp(LIMITS.indexOf(m.limits[op.id]) + d, 0, LIMITS.length - 1);
        m.limits[op.id] = LIMITS[i];
        saveSettings();
      };
      minus.setAttribute('aria-label', op.name + ' limit down');
      plus.setAttribute('aria-label', op.name + ' limit up');
      minus.addEventListener('click', () => change(-1));
      plus.addEventListener('click', () => change(1));
      stepper.append(minus, val, plus);
      col.append(t, stepper);
      col._refresh = () => {
        const m = current.settings.math;
        const on = m.ops.includes(op.id);
        col.classList.toggle('on', on);
        t.setAttribute('aria-pressed', on);
        val.textContent = limitText(m.limits[op.id]);
      };
      ops.append(col);
    }
    segment($('operandSeg'), OPERAND_COUNTS.map(n => ({ value: n, html: String(n) })),
      v => current.settings.math.operands === v, v => { current.settings.math.operands = v; saveSettings(false); });
    segment($('speedSeg'), SPEEDS.map(s => ({ value: s.id, html: `<span class="spIcon">${s.icon}</span><span class="spName">${s.name}</span>` })),
      v => current.settings.math.speed === v, v => { current.settings.math.speed = v; saveSettings(false); });
    segment($('answerSeg'), ANSWER_MODES.map(a => ({ value: a.id, html: `${a.icon} ${a.name}` })),
      v => current.settings.answerMode === v, v => { current.settings.answerMode = v; saveSettings(false); });
    segment($('lengthSeg'), LESSON_LENGTHS.map(n => ({ value: n, html: String(n) })),
      v => current.settings.lessonLength === v, v => { current.settings.lessonLength = v; saveSettings(false); });
    $('mixBtn').addEventListener('click', () => {
      current.settings.math.mix = !current.settings.math.mix;
      saveSettings();
    });
  }

  function saveSettings(refresh = true) {
    Store.save();
    if (refresh) refreshSettings();
  }

  function refreshSettings() {
    const st = current.settings, m = st.math;
    $('setPlayer').textContent = '· ' + current.avatar + ' ' + current.name;
    $('opsRow').querySelectorAll('.opCol').forEach(c => c._refresh());
    document.querySelectorAll('#screenSettings .segBtn').forEach(b => {
      b.classList.toggle('on', b._isOn());
      b.setAttribute('aria-pressed', b._isOn());
    });
    const multi = m.ops.length > 1;
    const canMix = multi && m.operands > 2;
    $('mixBlock').classList.toggle('off', !canMix);
    $('mixBtn').disabled = !canMix;
    const mixOn = canMix && m.mix;
    $('mixBtn').setAttribute('aria-checked', mixOn);
    $('mixBtn').classList.toggle('on', mixOn);
    $('mixBtn').querySelector('.switchLabel').textContent = mixOn ? 'On' : 'Off';
    $('mixNote').textContent = !multi ? 'Pick two or more operations' : m.operands === 2 ? 'Works with 3–4 numbers' : m.mix ? 'One task can mix them' : 'One operation per task';
    const secs = Tasks.typicalFailTime(m, st.answerMode);
    $('speedHint').textContent = `· about ${Math.round(secs)} s per task`;
    const ex = Tasks.make(m);
    $('exampleText').textContent = ex.text + ' = ' + Tasks.fmt(ex.answer);
  }

  function openSettings() {
    refreshSettings();
    showScreen('settings');
  }

  // ---------- lesson ----------

  function startLesson(proc, step) {
    goFullscreen();
    paused = false;
    Confetti.stop();
    showScreen('lesson');
    Lesson.start(current, proc, step, lessonEnded);
    Nav.setRoot($('taskPanel'));
  }

  function pause() {
    if (screen !== 'lesson' || paused || overlayOpen() || !Lesson.active()) return;
    paused = true;
    showPanel('pausePanel');
  }

  function resume() {
    paused = false;
    hideOverlay();
    Nav.setRoot($('taskPanel'));
  }

  function quitLesson() {
    paused = false;
    Lesson.stop();
    openHome();
  }

  function lessonEnded(r) {
    lastResult = r;
    const p = current;
    const proc = r.proc;
    let coins = 0, perTask = 0, star = -1, rule = '';
    const replay = r.step <= p.progress[proc.id];
    if (r.won) {
      perTask = COIN_RULES.find(c => r.mistakes <= c.maxMistakes).perTask;
      const before = replay ? p.rates[proc.id][r.step - 1] : 0;
      coins = Math.max(0, perTask - before) * r.total;
      rule = !replay ? `${perTask} per task`
        : perTask > before ? `${before} → ${perTask} per task`
        : `already earned ${before} per task`;
      if (!r.cheated) {
        if (replay) p.rates[proc.id][r.step - 1] = Math.max(before, perTask);
        else {
          p.progress[proc.id]++;
          p.rates[proc.id].push(perTask);
          if (p.progress[proc.id] % TRACK_LEN === 0) star = p.progress[proc.id] / TRACK_LEN - 1;
        }
        p.coins += coins;
        Store.save();
      }
      Sfx.win();
      if (coins && !r.cheated) setTimeout(() => Sfx.coins(), 900);
      if (star >= 0) setTimeout(() => Sfx.star(), 1400);
    } else Sfx.lose();

    $('resIcon').textContent = r.won ? proc.winIcon : proc.loseIcon;
    $('resTitle').textContent = r.won ? proc.winTitle : proc.loseTitle;
    $('resText').textContent = r.won
      ? `Step ${r.step} ${replay ? 'replayed' : 'done'}! ${r.mistakes === 0 ? 'No mistakes — perfect!' : r.mistakes === 1 ? '1 mistake.' : r.mistakes + ' mistakes.'}` +
        (perTask < MAX_RATE ? ' Replay it with 0–1 mistakes for more coins.' : '')
      : r.bossLeft > 0 ? `The boss needed ${r.bossLeft} more ${r.bossLeft === 1 ? 'hit' : 'hits'}. Try again — you can do it!`
      : `You solved ${r.done} of ${r.total}. Try again — you can do it!`;
    $('resCoins').hidden = !r.won;
    $('resCoins').innerHTML = r.won
      ? `<span class="coinBig">+${r.cheated ? 0 : coins} 🪙</span><span class="coinRule">${rule} · total ${p.coins}</span>`
      : '';
    $('resStar').hidden = star < 0;
    if (star >= 0) $('resStar').innerHTML = `${starHTML(star, 'huge')}<span>You earned a <b>${tierOf(star).name}</b> star!</span>`;
    $('resTrack').innerHTML = trackHTML(p, proc, r.step);
    $('resCheat').hidden = !r.cheated;
    $('resAgainBtn').textContent = r.won ? 'Next lesson ▶' : 'Try again ↻';
    $('resultPanel').classList.toggle('won', r.won);
    showPanel('resultPanel');
    if (r.won) Confetti.start();
  }

  // ---------- wiring ----------

  function back() {
    if (overlayOpen()) {
      if (!$('pausePanel').hidden) resume();
      else { Lesson.stop(); openHome(); }
      return;
    }
    if (screen === 'lesson') pause();
    else if (screen === 'new') { renderPlayers(); showScreen('players'); }
    else if (screen === 'settings') openHome();
    else if (screen === 'home') { renderPlayers(); showScreen('players'); }
  }

  const ARROWS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };

  document.addEventListener('keydown', e => {
    Sfx.unlock();
    const k = e.key;
    const inInput = e.target && e.target.tagName === 'INPUT';
    const typing = screen === 'lesson' && !overlayOpen() && current && current.settings.answerMode === 'type';
    const isBack = k === 'Escape' || k === 'GoBack' || k === 'BrowserBack' || e.keyCode === 461 || e.keyCode === 10009 ||
      (k === 'Backspace' && !inInput && !typing);
    if (isBack) { e.preventDefault(); back(); return; }

    if (screen === 'lesson' && !overlayOpen()) {
      if (k === 'p' || k === 'P') { pause(); return; }
      if (Lesson.key(e)) { e.preventDefault(); return; }
    }
    if (ARROWS[k]) {
      if (inInput && (k === 'ArrowLeft' || k === 'ArrowRight')) return;
      e.preventDefault();
      Nav.move(ARROWS[k]);
      return;
    }
    if (k === 'Enter' || k === ' ') {
      if (inInput) {
        if (k === 'Enter') { e.preventDefault(); if (screen === 'new') createPlayer(); }
        return;
      }
      if (Nav.pressDefault()) e.preventDefault();
    }
  });

  document.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (b && !b.classList.contains('choice')) Sfx.click();
  });

  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

  window.addEventListener('resize', () => { Lesson.resize(); Confetti.resize(); });

  $('createBtn').addEventListener('click', createPlayer);
  $('cancelNewBtn').addEventListener('click', () => { renderPlayers(); showScreen('players'); });
  $('settingsBtn').addEventListener('click', openSettings);
  $('playersBtn').addEventListener('click', () => { renderPlayers(); showScreen('players'); });
  $('settingsDone').addEventListener('click', openHome);
  $('pauseBtn').addEventListener('click', pause);
  $('resumeBtn').addEventListener('click', resume);
  $('quitBtn').addEventListener('click', quitLesson);
  $('resHomeBtn').addEventListener('click', () => { Lesson.stop(); openHome(); });
  $('resAgainBtn').addEventListener('click', () => {
    if (!lastResult) return;
    const proc = lastResult.proc;
    startLesson(proc, lastResult.won ? current.progress[proc.id] + 1 : lastResult.step);
  });
  [...$('choices').children].forEach(b => b.addEventListener('click', () => Lesson.choiceClick(b)));
  $('nameInput').maxLength = NAME_MAX;

  Store.load();
  Confetti.init($('fx'));
  buildSettings();
  renderPlayers();
  showScreen('players');

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (screen === 'lesson') {
      if (!paused) Lesson.update(dt);
      Lesson.draw();
    }
    Confetti.update(dt);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
