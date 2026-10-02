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
  let newChar = CHARACTERS[0].id; // character picked for a new player
  let setTab = 'math';    // task type shown in the settings
  let readExample = null; // the reading example on the settings screen (🔊 Listen says it)

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
    o.classList.toggle('overScene', id === 'pausePanel');
    placeOverlay();
    o.querySelectorAll('.panel').forEach(p => { p.hidden = p.id !== id; });
    Nav.setRoot($(id));
  }

  // The pause dialog covers only the scene, so the task stays readable next to it (a pause is time to think).
  function placeOverlay() {
    const o = $('overlay'), on = o.classList.contains('overScene');
    const r = on ? $('sceneWrap').getBoundingClientRect() : null;
    for (const k of ['left', 'top', 'width', 'height']) o.style[k] = on ? r[k] + 'px' : '';
  }

  function hideOverlay() {
    $('overlay').hidden = true;
    Confetti.stop();
  }

  const overlayOpen = () => !$('overlay').hidden;

  const tierOf = Stars.tierOf;
  const starHTML = Stars.html;

  // Earned stars of a process, small (at most 8, then +N).
  function starsHTML(levels) {
    let h = '';
    levels.slice(0, 8).forEach(lv => { h += starHTML(lv, 'small'); });
    if (levels.length > 8) h += `<span class="more">+${levels.length - 8}</span>`;
    return h;
  }

  // One step cell of a track: done perfectly (✓), done with mistakes (↻, can be replayed for more coins),
  // the next step, or a future one (also every step after a finished level that isn't perfect yet).
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
        title += ' — replay with 0–1 mistakes for more coins and the level star';
      }
    } else if (Progress.playable(p, proc, n)) cls.push('current');
    else cls.push('future');
    const boss = Progress.bossKind(n);
    if (boss) { cls.push('boss'); title += ` (${boss.name.toLowerCase()}, up to ${boss.gems} 💎)`; }
    return { cls: cls.join(' '), inner: inner + (boss ? `<i>${boss.icon}</i>` : ''), title, playable: Progress.playable(p, proc, n) };
  }

  // The level's goal star at the end of a track.
  const goalHTML = (p, proc, lv) => starHTML(lv, 'goal' + (Progress.levelDone(p, proc, lv) ? ' earned' : ''));

  // Static track (result dialog) of the level that holds step `n`.
  function trackHTML(p, proc, n) {
    const lv = Progress.levelOf(n);
    let h = '<span class="track">';
    for (let i = 0; i < TRACK_LEN; i++) {
      const c = cellInfo(p, proc, lv * TRACK_LEN + i + 1);
      h += `<span class="${c.cls}" title="${c.title}">${c.inner}</span>`;
    }
    return h + goalHTML(p, proc, lv) + '</span>';
  }

  const viewBlock = {}; // process id -> level shown on the home screen

  // Interactive track: every playable cell is a button; ‹ › page through the levels.
  function trackEl(p, proc, isFirst) {
    const cur = Progress.currentLevel(p, proc);
    const next = Progress.nextStep(p, proc);
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
    wrap.append(pager(-1, 'Earlier levels'));
    for (let i = 0; i < TRACK_LEN; i++) {
      const n = block * TRACK_LEN + i + 1;
      const c = cellInfo(p, proc, n);
      const b = el('button', c.cls + (isFirst && n === next ? ' default' : ''), c.inner);
      b.title = c.title;
      b.dataset.proc = proc.id;
      b.dataset.step = n;
      if (c.playable) b.addEventListener('click', () => startLesson(proc, n));
      else b.disabled = true;
      wrap.append(b);
    }
    wrap.insertAdjacentHTML('beforeend', goalHTML(p, proc, block));
    wrap.append(pager(1, 'Later levels'));
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

  function limitText(v) { return 'up to ' + Tasks.fmt(v); }

  const speedText = id => { const sp = SPEEDS.find(s => s.id === id); return `${sp.icon} ${sp.name}`; };

  // Types that can't run here (Reading without a voice) are listed as off; Math stands in when nothing else is left.
  function summary(st) {
    const parts = Tasks.usable(st).map(type => `${typeSummary(st, type)} · <b>🪙 ${Tasks.price(st, type).coins}</b> per task` +
      (st.types.includes(type) ? '' : ' (instead)'));
    st.types.filter(type => Tasks.blocked(st, type)).forEach(type => parts.push(`${typeSummary(st, type)} · 🔇 off on this device`));
    const am = ANSWER_MODES.find(a => a.id === st.answerMode);
    return parts.join(' &nbsp;|&nbsp; ') + ` · ${am.icon} ${am.name} · ${st.lessonLength} tasks` +
      ` = <b>🪙 ${Tasks.lessonCoins(st, st.lessonLength)}</b> per lesson`;
  }

  function typeSummary(st, type) {
    if (type === 'read') {
      const rd = st.read;
      const what = rd.size ? `words up to <b>${rd.size}</b> letters${rd.words > 1 ? ` · ${rd.words} words` : ''}` : '<b>letters</b>';
      return `📖 ${READ_LANGS.find(l => l.id === rd.lang).name} ${what} · ${speedText(rd.speed)}`;
    }
    if (type === 'scale') {
      const sc = st.scale;
      return `📏 Scales ${limitText(sc.limit)} · <b>${sc.parts.join(', ')}</b> parts` +
        `${sc.labels === 'some' ? ' · every other number' : ''} · ${speedText(sc.speed)}`;
    }
    const m = st.math;
    const ops = m.ops.map(id => {
      const op = OPERATIONS.find(o => o.id === id);
      return `<b>${op.sign}</b> ${limitText(m.limits[id])}`;
    }).join(', ');
    return `🔢 ${ops} · ${m.operands} numbers${m.mix && m.ops.length > 1 && m.operands > 2 ? ' · mixed' : ''} · ${speedText(m.speed)}`;
  }

  // Price of a task type's settings: the coins per task and the steps that make them up.
  function priceHTML(st, type) {
    const p = Tasks.price(st, type);
    const steps = p.steps.map(s => `<span class="pStep">${s.label} <b>${s.add ? '+' + s.add : '×' + s.mul}</b></span>`).join('');
    return { big: `🪙 ${p.coins} <small>per task</small>`, steps };
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
        `<span class="pAvatar">${Look.ofPlayer(p, 'mini')}${hungryBadge(p)}</span><span class="pName">${esc(p.name)}</span>` +
        `<span class="pMeta">🪙 ${p.coins} · 💎 ${p.gems} · ${starHTML(Math.max(0, Progress.bestLevel(p)), 'small' + (Progress.bestLevel(p) < 0 ? ' dim' : ''))} ${Progress.totalStars(p)}</span>`);
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

  // A 🍽 badge on a hungry character.
  const hungryBadge = p => (Shop.fullness(p) < FULL_HUNGRY ? '<i class="hungry" title="Hungry">🍽</i>' : '');

  function selectPlayer(id) {
    current = Store.get(id);
    if (!current) return;
    Store.setLast(id);
    openHome();
  }

  function openNewPlayer() {
    $('nameInput').value = '';
    newChar = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)].id;
    renderChars();
    showScreen('new');
  }

  // The characters to pick from, each drawn happy; the picked one waves (arms up) and its favourite food is shown.
  function renderChars() {
    const g = $('charGrid');
    g.innerHTML = '';
    for (const c of CHARACTERS) {
      const b = el('button', 'charBtn');
      b.dataset.id = c.id;
      b.title = c.name;
      b.addEventListener('click', () => { newChar = c.id; Sfx.squeak(); markChar(); });
      g.append(b);
    }
    markChar();
  }

  function markChar() {
    $('charGrid').querySelectorAll('.charBtn').forEach(b => {
      const on = b.dataset.id === newChar;
      const c = CHARACTERS.find(x => x.id === b.dataset.id);
      b.classList.toggle('on', on);
      b.innerHTML = Look.svg(c.id, {}, on ? 'giggle' : 'happy') + `<span class="charName">${c.name}</span>`;
    });
    const c = CHARACTERS.find(x => x.id === newChar);
    $('charNote').textContent = `${c.name} loves ${c.loves.map(id => FOODS.find(f => f.id === id).name.toLowerCase()).join(' and ')}.`;
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
    current = Store.create(name, newChar);
    openHome();
  }

  // ---------- home ----------

  function openHome() {
    renderHome();
    showScreen('home');
  }

  function renderHome() {
    const p = current;
    $('homeAvatar').innerHTML = Look.ofPlayer(p, 'mini', 'head') + hungryBadge(p);
    $('homeName').textContent = p.name;
    const full = Shop.fullness(p);
    $('homeMood').textContent = full < FULL_HUNGRY ? `🏠 ${Shop.charOf(p).name} is hungry!` : '🏠 My room';
    $('roomBtn').classList.toggle('needs', full < FULL_HUNGRY);
    $('homeCoins').textContent = p.coins;
    $('homeGems').textContent = p.gems;
    $('trainingSummary').innerHTML = summary(p.settings);
    const list = $('processList');
    list.innerHTML = '';
    let first = true;
    for (const proc of PROCESSES) {
      const row = el('div', 'procRow' + (proc.ready ? '' : ' soon'));
      const main = el('div', 'procMain', `<span class="procName">${proc.name}</span>`);
      if (proc.ready) main.append(trackEl(p, proc, first));
      else main.insertAdjacentHTML('beforeend', '<span class="soonLabel">Coming soon</span>');
      const side = el('div', 'procSide', proc.ready ? sideHTML(p, proc) : '');
      row.append(el('span', 'procIcon', proc.icon), main, side);
      if (proc.ready) first = false;
      list.append(row);
    }
  }

  // Right side of a process row: the level, the next step or what opens the next level, earned stars, ↻ count.
  function sideHTML(p, proc) {
    const lv = Progress.currentLevel(p, proc);
    const tier = tierOf(lv);
    let h = `<span class="procLevel">${starHTML(lv, 'small' + (Progress.levelDone(p, proc, lv) ? '' : ' dim'))} ${tier.name} level</span>`;
    if (Progress.locked(p, proc)) {
      const left = Progress.toPerfect(p, proc, lv);
      h += `<span class="procLock" title="Replay the ↻ steps with 0–1 mistakes">🔒 ↻ ${left} ${left === 1 ? 'step' : 'steps'} to open ${tierOf(lv + 1).name}</span>`;
    } else h += `<span class="procStep">Step ${p.progress[proc.id] + 1}</span>`;
    const stars = Progress.stars(p, proc);
    if (stars.length) h += `<span class="procStars">${starsHTML(stars)}</span>`;
    const fix = toImprove(p, proc);
    if (fix && !Progress.locked(p, proc)) h += `<span class="procFix" title="Steps you can replay for more coins">↻ ${fix} to improve</span>`;
    return h;
  }

  // ---------- settings ----------

  function shake(b) {
    b.classList.remove('shake');
    void b.offsetWidth;
    b.classList.add('shake');
  }

  // onPick may return false to refuse the change (the button shakes).
  function segment(container, items, isOn, onPick) {
    container.innerHTML = '';
    for (const it of items) {
      const b = el('button', 'segBtn', it.html);
      b.addEventListener('click', () => { if (onPick(it.value) === false) shake(b); refreshSettings(); });
      b._isOn = () => isOn(it.value);
      container.append(b);
    }
  }

  const speedItems = () => SPEEDS.map(s => ({ value: s.id, html: `<span class="spIcon">${s.icon}</span><span class="spName">${s.name}</span>` }));

  function buildSettings() {
    // Task type tabs and each pane's "use in lessons" switch.
    const tabs = $('typeTabs');
    for (const tt of TASK_TYPES) {
      const t = el('button', 'tab', `${tt.icon} ${tt.name}<span class="tabPrice"></span><span class="tabUse">✓</span><span class="tabNa" title="Off on this device">🔇</span>`);
      t.dataset.type = tt.id;
      t.addEventListener('click', () => { setTab = tt.id; refreshSettings(); });
      tabs.append(t);
    }
    document.querySelectorAll('#screenSettings .pane').forEach(pane => {
      const sw = pane.querySelector('.useSwitch');
      sw.addEventListener('click', () => {
        const st = current.settings, type = pane.dataset.type;
        const why = Tasks.blocked(st, type);
        if (st.types.includes(type)) {
          if (st.types.length === 1) { shake(sw); return; }
          st.types = st.types.filter(x => x !== type);
        } else if (why && why.hard) { shake(sw); return; } // this device can't speak at all
        else st.types = TASK_TYPES.map(x => x.id).filter(id => id === type || st.types.includes(id));
        saveSettings();
      });
    });

    const ops = $('opsRow');
    ops.innerHTML = '';
    for (const op of OPERATIONS) {
      const col = el('div', 'opCol');
      const t = el('button', 'opToggle', `<span class="opSign">${op.sign}</span><span class="opName">${op.name}</span><span class="check">✓</span>`);
      t.dataset.op = op.id;
      t.addEventListener('click', () => {
        const m = current.settings.math;
        if (m.ops.includes(op.id)) {
          if (m.ops.length === 1) { shake(t); return; }
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
    segment($('speedSeg'), speedItems(),
      v => current.settings.math.speed === v, v => { current.settings.math.speed = v; saveSettings(false); });

    // Scales.
    const sc = () => current.settings.scale;
    segment($('partsSeg'), SCALE_PARTS.map(n => ({ value: n, html: String(n) })),
      v => sc().parts.includes(v), v => {
        if (sc().parts.includes(v)) {
          if (sc().parts.length === 1) return false;
          sc().parts = sc().parts.filter(x => x !== v);
        } else sc().parts = SCALE_PARTS.filter(n => n === v || sc().parts.includes(n));
        saveSettings(false);
      });
    segment($('scaleLimitSeg'), SCALE_LIMITS.map(n => ({ value: n, html: Tasks.fmt(n) })),
      v => sc().limit === v, v => { sc().limit = v; saveSettings(false); });
    segment($('labelsSeg'), SCALE_LABELS.map(l => ({ value: l.id, html: l.name })),
      v => sc().labels === v, v => { sc().labels = v; saveSettings(false); });
    segment($('scaleSpeedSeg'), speedItems(),
      v => sc().speed === v, v => { sc().speed = v; saveSettings(false); });
    // Reading.
    const rd = () => current.settings.read;
    segment($('langSeg'), READ_LANGS.map(l => ({ value: l.id, html: `${l.name}<span class="noVoice" title="No voice on this device"> 🔇</span>` })),
      v => rd().lang === v, v => { rd().lang = v; saveSettings(false); });
    segment($('sizeSeg'), READ_SIZES.map(n => ({ value: n, html: n ? String(n) : 'Letters' })),
      v => rd().size === v, v => { rd().size = v; saveSettings(false); });
    segment($('wordsSeg'), READ_WORD_COUNTS.map(n => ({ value: n, html: String(n) })),
      v => rd().words === v, v => {
        if (!rd().size) return false; // letters come one at a time
        rd().words = v;
        saveSettings(false);
      });
    segment($('readSpeedSeg'), speedItems(),
      v => rd().speed === v, v => { rd().speed = v; saveSettings(false); });
    $('readListen').addEventListener('click', () => { if (readExample) ReadTasks.say(readExample); });

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
    $('setPlayer').textContent = '· ' + Shop.charOf(current).emoji + ' ' + current.name;
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
    const n = st.lessonLength;
    $('lengthNote').textContent = `Up to 🪙 ${Tasks.lessonCoins(st, n)} per lesson, ` +
      `🪙 ${Tasks.lessonCoins(st, n - 1 + BOSS_HITS)} with a boss (${BOSS_HITS} hits for the last task)`;
    $('typeTabs').querySelectorAll('.tab').forEach(t => {
      t.querySelector('.tabPrice').textContent = '🪙' + Tasks.price(st, t.dataset.type).coins;
      t.classList.toggle('on', t.dataset.type === setTab);
      t.classList.toggle('used', st.types.includes(t.dataset.type));
      t.classList.toggle('na', !!Tasks.blocked(st, t.dataset.type));
    });
    document.querySelectorAll('#screenSettings .pane').forEach(pane => {
      const type = pane.dataset.type, used = st.types.includes(type);
      pane.hidden = type !== setTab;
      pane.classList.toggle('unused', !used);
      const sw = pane.querySelector('.useSwitch');
      sw.classList.toggle('on', used);
      sw.setAttribute('aria-checked', used);
      sw.querySelector('.switchLabel').textContent = used ? 'Used in lessons' : 'Not used';
      const pr = priceHTML(st, type);
      pane.querySelector('.priceBig').innerHTML = pr.big;
      pane.querySelector('.priceSteps').innerHTML = pr.steps;
      const why = Tasks.blocked(st, type);
      pane.querySelector('.useNote').textContent = why ? (used ? '🔇 Off on this device — see below' : '🔇 Not available on this device')
        : !used ? 'Switch on to get these tasks in lessons'
        : st.types.length > 1 ? 'Mixed with the other task types' : 'The only task type — switch another one on to mix';
    });
    if (setTab === 'math') {
      $('speedHint').textContent = `· about ${Math.round(Tasks.typicalFailTime(st, 'math'))} s per task`;
      const ex = Tasks.make(st, 'math');
      $('exampleText').textContent = ex.solution;
    } else if (setTab === 'scale') {
      $('scaleSpeedHint').textContent = `· about ${Math.round(Tasks.typicalFailTime(st, 'scale'))} s per task`;
      const ex = Tasks.make(st, 'scale');
      $('scaleExample').innerHTML = ScaleTasks.svg(ex) + `<b>▼ = ${Tasks.fmt(ex.answer)}</b>`;
    } else {
      const why = Tasks.blocked(st, 'read');
      $('readWarn').hidden = !why;
      $('readWarn').textContent = why ? '🔇 ' + why.text : '';
      $('langSeg').querySelectorAll('.segBtn').forEach((b, i) => b.classList.toggle('mute', !Speech.hasVoice(READ_LANGS[i].id)));
      const letters = !st.read.size;
      $('wordsBlock').classList.toggle('off', letters);
      $('wordsSeg').querySelectorAll('.segBtn').forEach(b => { b.disabled = letters; });
      $('wordsNote').textContent = letters ? 'Letters come one at a time' : st.read.words === 1 ? 'One word' : 'A short phrase that makes sense';
      $('readSpeedHint').textContent = `· about ${Math.round(Tasks.typicalFailTime(st, 'read'))} s per task`;
      readExample = Tasks.make(st, 'read');
      $('readExample').textContent = readExample.answer;
      $('readListen').disabled = !!why;
    }
  }

  function openSettings() {
    refreshSettings();
    showScreen('settings');
  }

  // ---------- room ----------

  function openRoom() {
    Room.open(current);
    showScreen('room');
  }

  function leaveRoom() {
    Room.close();
    openHome();
  }

  // ---------- lesson ----------

  function startLesson(proc, step) {
    goFullscreen();
    paused = false;
    Confetti.stop();
    showScreen('lesson');
    Lesson.start(current, proc, step, lessonEnded);
    Nav.setRoot($('taskPanel'));
    Quality.reset();
  }

  // Pausing costs coins: the Coin Muncher eats them while the dialog is open (see Lesson.pause).
  function pause() {
    if (screen !== 'lesson' || paused || overlayOpen() || !Lesson.canPause()) return;
    paused = true;
    Speech.stop();
    const fee = Lesson.pause();
    Muncher.show(fee, Lesson.taskCoins());
    $('speedNote').hidden = true;
    renderPauseSpeed();
    showPanel('pausePanel');
  }

  // Pause dialog: the current task's type one speed slower / faster — the speed icons and the new price per task.
  function renderPauseSpeed() {
    const type = Lesson.curType(), st = current.settings;
    const i = SPEEDS.findIndex(sp => sp.id === st[type].speed);
    const tt = TASK_TYPES.find(x => x.id === type);
    const now = Tasks.price(st, type).coins;
    const priceAt = id => { const s2 = JSON.parse(JSON.stringify(st)); s2[type].speed = id; return Tasks.price(s2, type).coins; };
    const option = (btn, j) => {
      const on = j >= 0 && j < SPEEDS.length;
      $(btn).hidden = !on;
      $(btn).dataset.speed = on ? SPEEDS[j].id : '';
      if (on) {
        $(btn).querySelector('.spChange').innerHTML = `${tt.icon} ${tt.name}: ${SPEEDS[i].icon} → ${SPEEDS[j].icon} ${SPEEDS[j].name}` +
          `<small>🪙 ${now} → <b>${priceAt(SPEEDS[j].id)}</b> per task</small>`;
      }
    };
    option('slowerBtn', i - 1);
    option('fasterBtn', i + 1);
  }

  // A speed button in the pause dialog: the setting is saved and the lesson pays the new price from this task on.
  function changeSpeed(btn) {
    const id = btn.dataset.speed;
    if (!id) return;
    const type = Lesson.curType();
    Lesson.setSpeed(type, id); // the lesson's settings are the player's
    Store.save();
    Muncher.refill(Lesson.taskCoins());
    const sp = SPEEDS.find(x => x.id === id), tt = TASK_TYPES.find(x => x.id === type);
    $('speedNote').hidden = false;
    $('speedNote').textContent = `✓ ${tt.icon} ${tt.name} is now ${sp.icon} ${sp.name}: 🪙 ${Tasks.price(current.settings, type).coins} per task`;
    renderPauseSpeed();
    if (btn.hidden) Nav.focusDefault();
  }

  function resume() {
    paused = false;
    Muncher.hide();
    hideOverlay();
    Nav.setRoot($('taskPanel'));
    Quality.reset();
    Lesson.resume(); // the same task goes on (a reading one is said again)
  }

  function quitLesson() {
    paused = false;
    Muncher.hide();
    Lesson.stop();
    openHome();
  }

  function lessonEnded(r) {
    const p = current;
    const proc = r.proc;
    const lv = Progress.levelOf(r.step);
    const wasDone = Progress.levelDone(p, proc, lv);
    let coins = 0, gems = 0, rate = 0, rule = '', gemRule = '';
    const coinsBefore = p.coins, gemsBefore = p.gems;
    const replay = r.step <= p.progress[proc.id];
    if (r.won) {
      // The answers' prices less what the Coin Muncher ate in pauses, cut by the mistakes; a replay pays only what beats
      // the step's best. Same for a boss's diamonds.
      rate = COIN_RULES.find(c => r.mistakes <= c.maxMistakes).rate;
      const got = Math.round((r.earned - r.eaten) * rate / MAX_RATE);
      const before = replay ? p.best[proc.id][r.step - 1] : 0;
      coins = Math.max(0, got - before);
      rule = `${r.earned} for the answers` + (r.eaten ? ` − ${r.eaten} 😋 eaten in pauses` : '') +
        (rate < MAX_RATE ? ` × ${Math.round(100 * rate / MAX_RATE)}% for ${r.mistakes} mistakes` : '') +
        (!replay ? '' : got > before ? ` · ${got} − ${before} from before` : ` · you got ${before} here before`);
      const boss = Progress.bossKind(r.step);
      const gGot = Progress.gems(r.step, rate);
      const gBefore = replay ? p.bestGems[proc.id][r.step - 1] : 0;
      if (boss) {
        gems = Math.max(0, gGot - gBefore);
        gemRule = `${boss.name}: ${gGot} of ${boss.gems} 💎` + (replay && gBefore ? ` · ${gBefore} before` : '');
      }
      if (!r.cheated) {
        if (replay) {
          p.rates[proc.id][r.step - 1] = Math.max(p.rates[proc.id][r.step - 1], rate);
          p.best[proc.id][r.step - 1] = Math.max(before, got);
          p.bestGems[proc.id][r.step - 1] = Math.max(gBefore, gGot);
        } else {
          p.progress[proc.id]++;
          p.rates[proc.id].push(rate);
          p.best[proc.id].push(got);
          p.bestGems[proc.id].push(gGot);
        }
        p.coins += coins;
        p.gems += gems;
        Store.save();
      }
      Sfx.win();
      if (coins && !r.cheated) setTimeout(() => Sfx.coins(), 900);
      if (gems && !r.cheated) setTimeout(() => Sfx.gems(), 1150);
    } else Sfx.lose();
    // All steps of the level perfect just now: its star, the next level opens.
    const levelUp = r.won && !wasDone && Progress.levelDone(p, proc, lv);
    if (levelUp) setTimeout(() => Sfx.star(), 1400);
    const shut = r.won && !levelUp && Progress.locked(p, proc) && Progress.currentLevel(p, proc) === lv;
    const next = r.won ? Progress.nextStep(p, proc) : r.step;
    const slow = slowerOffer(p.settings, r, rate);
    lastResult = { proc, next, step: r.step, slow };
    delete viewBlock[proc.id]; // home shows the current level again (a new one after a level-up)

    $('resIcon').textContent = r.won ? proc.winIcon : proc.loseIcon;
    $('resTitle').textContent = r.won ? proc.winTitle : proc.loseTitle;
    $('resText').textContent = r.won
      ? `Step ${r.step} ${replay ? 'replayed' : 'done'}! ${r.mistakes === 0 ? 'No mistakes — perfect!' : r.mistakes === 1 ? '1 mistake.' : r.mistakes + ' mistakes.'}` +
        (shut ? ` Replay the ↻ steps with 0–1 mistakes to earn the ${tierOf(lv).name} star and open the ${tierOf(lv + 1).name} level.`
          : rate < MAX_RATE ? ' Replay it with 0–1 mistakes for more coins.'
          : replay && !coins && !levelUp ? ' Harder settings or a faster speed pay more per task.' : '')
      : r.bossLeft > 0 ? `The boss needed ${r.bossLeft} more ${r.bossLeft === 1 ? 'hit' : 'hits'}. Try again — you can do it!`
      : `You solved ${r.done} of ${r.total}. Try again — you can do it!`;
    $('resCoins').hidden = !r.won;
    $('resCoins').innerHTML = r.won
      ? `<span class="coinBig">+${r.cheated ? 0 : coins} 🪙${gemRule ? ` <span class="gemBig">+${r.cheated ? 0 : gems} 💎</span>` : ''}</span>` +
        `<span class="coinRule">${rule} · total ${p.coins}</span>` +
        (gemRule ? `<span class="coinRule">${gemRule} · total ${p.gems} 💎</span>` : '')
      : '';
    const buyable = r.won && !r.cheated ? Shop.newlyAffordable(p, coinsBefore, gemsBefore) : null;
    $('resShop').hidden = !buyable;
    $('resShop').textContent = buyable ? `🛍️ Now you can buy: ${buyable.name} (${Shop.costText(buyable)})` : '';
    $('resStar').hidden = !levelUp;
    if (levelUp) {
      $('resStar').innerHTML = `<div class="levelUp">${starHTML(lv, 'huge')}<span>You earned the <b>${tierOf(lv).name}</b> star!<br>` +
        `The <b>${tierOf(lv + 1).name}</b> level is open — ${TRACK_LEN} new steps.</span></div>` +
        Stars.ladder(Progress.stars(p, proc), lv + 1);
    }
    $('resTrack').innerHTML = trackHTML(p, proc, r.step);
    $('resCheat').hidden = !r.cheated;
    $('resAgainBtn').textContent = !r.won ? 'Try again ↻' : next <= p.progress[proc.id] ? `Replay step ${next} ↻` : 'Next lesson ▶';
    // Lost, or lost coins to mistakes: the same step a speed slower is one press away (the default after a defeat).
    $('resSlow').hidden = $('resSlowBtn').hidden = !slow;
    if (slow) {
      $('resSlow').textContent = (r.won ? 'Lots of mistakes? Replay it slower: ' : 'Too fast? Try it slower: ') + slow.text;
      $('resSlowBtn').textContent = r.won ? '🐢 Replay slower' : '🐢 Try slower';
    }
    $('resSlowBtn').classList.toggle('default', !!slow && !r.won);
    $('resAgainBtn').classList.toggle('default', !slow || r.won);
    $('resultPanel').classList.toggle('won', r.won);
    showPanel('resultPanel');
    if (r.won) Confetti.start(levelUp ? FIREWORKS_TIME : 0);
  }

  // After a defeat or a win with coins lost to mistakes: the task types that had the mistakes (or ran out of time), one
  // speed slower. Null when the lesson was perfect or they are all at the slowest speed already.
  function slowerOffer(st, r, rate) {
    if (r.won && rate >= MAX_RATE) return null;
    const used = Tasks.usable(st);
    const types = (r.missTypes.length ? r.missTypes : used).filter(t => used.includes(t) && st[t].speed !== SPEEDS[0].id);
    if (!types.length) return null;
    const after = JSON.parse(JSON.stringify(st));
    types.forEach(t => { after[t].speed = SPEEDS[SPEEDS.findIndex(sp => sp.id === st[t].speed) - 1].id; });
    const name = t => { const tt = TASK_TYPES.find(x => x.id === t); return tt.icon + ' ' + tt.name; };
    const text = types.map(t => `${name(t)} ${speedText(st[t].speed)} → ${speedText(after[t].speed)}`).join(', ') +
      ` (🪙 ${Tasks.lessonCoins(st, st.lessonLength)} → ${Tasks.lessonCoins(after, st.lessonLength)} per lesson)`;
    return { types, after, text };
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
    else if (screen === 'room') leaveRoom();
    else if (screen === 'home') { renderPlayers(); showScreen('players'); }
  }

  const ARROWS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };

  document.addEventListener('keydown', e => {
    Sfx.unlock();
    const k = e.key;
    const inInput = e.target && e.target.tagName === 'INPUT';
    const typing = screen === 'lesson' && !overlayOpen() && Lesson.typing();
    const isBack = k === 'Escape' || k === 'GoBack' || k === 'BrowserBack' || e.keyCode === 461 || e.keyCode === 10009 ||
      (k === 'Backspace' && !inInput && !typing);
    if (isBack) { e.preventDefault(); back(); return; }

    if (screen === 'lesson' && !overlayOpen()) {
      if (k === 'p' || k === 'P') { pause(); return; }
      if (Lesson.key(e)) { e.preventDefault(); return; }
    }
    if (screen === 'room' && Room.key(e)) { e.preventDefault(); return; }
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

  window.addEventListener('resize', () => { Lesson.resize(); Confetti.resize(); if (overlayOpen()) placeOverlay(); });

  $('createBtn').addEventListener('click', createPlayer);
  $('cancelNewBtn').addEventListener('click', () => { renderPlayers(); showScreen('players'); });
  $('settingsBtn').addEventListener('click', openSettings);
  $('roomBtn').addEventListener('click', openRoom);
  $('shopBtn').addEventListener('click', openRoom);
  $('roomBack').addEventListener('click', leaveRoom);
  $('playersBtn').addEventListener('click', () => { renderPlayers(); showScreen('players'); });
  $('settingsDone').addEventListener('click', openHome);
  $('pauseBtn').addEventListener('click', pause);
  $('resumeBtn').addEventListener('click', resume);
  ['slowerBtn', 'fasterBtn'].forEach(id => $(id).addEventListener('click', () => changeSpeed($(id))));
  $('quitBtn').addEventListener('click', quitLesson);
  $('resHomeBtn').addEventListener('click', () => { Lesson.stop(); openHome(); });
  $('resAgainBtn').addEventListener('click', () => {
    if (!lastResult) return;
    startLesson(lastResult.proc, lastResult.next);
  });
  $('resSlowBtn').addEventListener('click', () => {
    const slow = lastResult && lastResult.slow;
    if (!slow) return;
    slow.types.forEach(t => { current.settings[t].speed = slow.after[t].speed; });
    Store.save();
    startLesson(lastResult.proc, lastResult.step);
  });
  [...$('choices').children].forEach(b => b.addEventListener('click', () => Lesson.choiceClick(b)));
  $('numpad').querySelectorAll('button').forEach(b => b.addEventListener('click', () => Lesson.padClick(b)));
  $('sayBtn').addEventListener('click', () => Lesson.sayTask());
  // Touch: no page scroll / pinch zoom over the scene.
  ['touchstart', 'touchmove'].forEach(t => $('sceneWrap').addEventListener(t, e => e.preventDefault(), { passive: false }));
  $('nameInput').maxLength = NAME_MAX;

  Store.load();
  Stars.init();
  Confetti.init($('fx'));
  buildSettings();
  renderPlayers();
  showScreen('players');

  Quality.onChange(() => { Lesson.resize(); Confetti.resize(); });
  // Voices load asynchronously: show what Reading can do on this device once they are known.
  Speech.onChange(() => {
    if (!current) return;
    if (screen === 'settings') refreshSettings();
    else if (screen === 'home') renderHome();
  });

  let last = performance.now();
  function frame(now) {
    const raw = (now - last) / 1000;
    const dt = Math.min(0.05, raw);
    last = now;
    if (screen === 'lesson') {
      if (!paused) Lesson.update(dt);
      else if (!$('pausePanel').hidden) {
        // Real time (a slow frame rate doesn't slow the Muncher down; a hidden tab doesn't count).
        const pdt = Math.min(0.5, raw);
        const n = Lesson.pauseTick(pdt);
        if (n) Muncher.eat(n, Lesson.taskCoins());
        Muncher.update(pdt);
      }
      Lesson.draw();
      if (!overlayOpen()) Quality.frame(raw);
    }
    if (screen === 'room') Room.update(dt);
    Confetti.update(dt);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
