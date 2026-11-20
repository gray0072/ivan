'use strict';

// Lift Logic — the screens over the game: the start menu (Continue, Buildings, the Lift Museum, the cloud
// save's account row, difficulty, sound, music, how to play), the campaign map of buildings, a building's path of missions, the mission
// card (the client's lines, the goal, the stars, the new blocks, Grandpa Gears' card), the pause menu,
// the results' panel and the newspaper. game.js wires their buttons to the flow; arrow keys move the focus
// between the visible buttons, Space / Enter press the focused or the default one.

const DIFFICULTY_NAMES = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
const DIFFICULTY_TEXT = {
  easy: 'Patient people, fewer of them, looser star limits; the Inspector names the block that helps.',
  medium: 'The day as it is meant to be.',
  hard: 'Impatient people, more of them, stricter waits; hints open later.'
};

const Screens = (() => {
  const $ = (id) => document.getElementById(id);
  const overlay = $('overlay');
  const panels = { menu: $('menu'), map: $('mapPanel'), building: $('buildingPanel'), brief: $('briefPanel'), pause: $('pausePanel'),
    result: $('resultPanel'), museum: $('museumPanel'), paper: $('paperPanel') };
  let current = null;
  let difficulty = DIFFICULTY[Store.get(KEYS.difficulty)] ? Store.get(KEYS.difficulty) : 'easy';
  let buildingId = 'grandma', brief = null;
  const handlers = {};

  function show(name) {
    overlay.style.display = 'flex';
    for (const k in panels) panels[k].hidden = k !== name;
    current = name;
    if (name === 'menu') renderMenu();
    if (name === 'map') renderMap();
    if (name === 'building') renderBuilding(buildingId);
    if (name === 'museum') Museum.render();
    diffRows();
    syncSound();
    overlay.scrollTop = 0;
    for (const k in panels) if (!panels[k].hidden) panels[k].scrollTop = 0;
  }
  function hide() {
    overlay.style.display = 'none';
    current = null;
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }
  function on(name, fn) { handlers[name] = fn; }
  function call(name, ...a) { if (handlers[name]) handlers[name](...a); }

  // ---------- difficulty, sound, music ----------
  function diffRows() {
    for (const id of ['menuDiff', 'pauseDiff', 'resultDiff']) {
      $(id).innerHTML = DIFFICULTY_ORDER.map((d) => '<button class="btn toggle' + (d === difficulty ? ' on' : '') + '" data-diff="' + d + '">' + tr(DIFFICULTY_NAMES[d]) + '</button>').join('');
    }
    $('menuDiffText').textContent = tr(DIFFICULTY_TEXT[difficulty]);
  }
  function pickDifficulty(d) {
    if (d === difficulty) return;
    difficulty = d;
    Store.set(KEYS.difficulty, d);
    diffRows();
    if (current === 'menu') renderMenu();
    if (current === 'building') renderBuilding(buildingId);
    if (current === 'pause') call('difficultyChanged');
    if (Runner.mission) Hud.targets(Runner.mission, false);
  }
  overlay.addEventListener('click', (e) => {
    const b = e.target.closest('[data-diff]');
    if (b) { Sfx.tap(); pickDifficulty(b.dataset.diff); }
    const s = e.target.closest('[data-sound]');
    if (s) { ensureAudio(); setSound(s.dataset.sound === 'on'); syncSound(); }
    const m = e.target.closest('[data-music]');
    if (m) { ensureAudio(); setMusic(m.dataset.music === 'on'); syncSound(); }
  });
  function syncSound() {
    document.querySelectorAll('[data-sound]').forEach((b) => b.classList.toggle('on', (b.dataset.sound === 'on') === soundOn));
    document.querySelectorAll('[data-music]').forEach((b) => b.classList.toggle('on', (b.dataset.music === 'on') === musicOn));
  }

  // ---------- the start menu ----------
  function renderMenu() {
    const n = Progress.next();
    $('continueName').textContent = n ? (n.id + ' · ' + tr(n.name)) : '';
    $('totalStars').textContent = '★ ' + Progress.total();
    Art.logo($('logo'));
    renderAccount();
  }
  // the cloud save (core/cloud.js): Sign in with Google, or how the sync goes, the account and Sign out
  function renderAccount() {
    const row = $('accountRow'), st = Cloud.status;
    row.hidden = st === 'unavailable';
    if (row.hidden) return;
    const signIn = '<button class="btn small cloudIn" data-cloud="in">' + GOOGLE_G_SVG + escapeHtml(tr('Sign in with Google')) + '</button>';
    // a sign-in that could not go (no network) or did not finish
    const notice = Cloud.notice ? '<p class="fine cloudNotice">' + escapeHtml(Cloud.notice === 'offline'
      ? tr('No network — sign in once you are online.') : tr('The sign-in did not finish — try again.')) + '</p>' : '';
    if (st === 'off') {
      row.innerHTML = signIn + '<p class="fine">' + escapeHtml(tr('Keep your stars and programs in the cloud and play on any device.')) + '</p>' + notice;
      return;
    }
    const email = Cloud.email ? '<p class="fine">☁ ' + escapeHtml(Cloud.email) + '</p>' : '';
    // signed in, but the account's copy could not be read: try again, or play on with this device's progress
    if (st === 'loadFailed') {
      row.innerHTML = '<span class="cloudState loadFailed">' + escapeHtml(tr('Couldn\'t load your cloud progress')) + '</span>' +
        '<div class="cloudChoice"><button class="btn small" data-cloud="retry">' + escapeHtml(tr('Try again')) + '</button>' +
        '<button class="btn small secondary" data-cloud="local">' + escapeHtml(tr('Play with the progress on this device')) + '</button></div>' + email;
      return;
    }
    const text = { syncing: tr('Syncing…'), synced: tr('Synced'), error: tr('Sync failed — it tries again later'),
      local: tr('Playing with the progress on this device — it syncs once the network is back'),
      signedOut: tr('Signed out — sign in again to sync') }[st];
    row.innerHTML = '<span class="cloudState ' + st + '">' + escapeHtml(text) + '</span>' +
      (st === 'signedOut' ? signIn : '<button class="btn small secondary" data-cloud="out">' + escapeHtml(tr('Sign out')) + '</button>') +
      email + notice;
  }
  $('accountRow').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cloud]');
    if (!b) return;
    Sfx.tap();
    if (b.dataset.cloud === 'in') Cloud.signIn();
    else if (b.dataset.cloud === 'retry') Cloud.retry();
    else if (b.dataset.cloud === 'local') Cloud.playLocal();
    else { Cloud.signOut(); renderAccount(); }
  });
  $('continueBtn').addEventListener('click', () => { ensureAudio(); const n = Progress.next(); if (n) openBrief(n); });
  $('mapBtn').addEventListener('click', () => { ensureAudio(); show('map'); });
  $('museumBtn').addEventListener('click', () => { ensureAudio(); show('museum'); });
  $('museumBack').addEventListener('click', () => show('menu'));
  $('helpBtn').addEventListener('click', () => { $('help').hidden = !$('help').hidden; });

  // ---------- the map of buildings ----------
  function renderMap() {
    const possible = MISSIONS.length * 3;
    $('mapTotal').textContent = tr('★ {n} of {m}', { n: Progress.total(), m: possible });
    const list = $('buildingList');
    list.innerHTML = '';
    for (const b of BUILDINGS) {
      const open = Progress.buildingOpen(b);
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'bcard' + (open ? '' : ' locked');
      const cv = document.createElement('canvas');
      cv.width = 160; cv.height = 120;
      Art.silhouette(cv, b.id, !open);
      card.appendChild(cv);
      const info = document.createElement('div');
      const ms = buildingMissions(b.id);
      const cond = !b.ready ? tr('🚧 Under construction — coming in an update') : !open ? tr('🔒 Pass the exam of the building before') : '';
      info.innerHTML = '<b>' + b.chapter + '. ' + escapeHtml(tr(b.name)) + '</b><span class="fine">' + escapeHtml(tr(b.idea)) + '</span>' +
        (ms.length ? '<span class="starsSmall">★ ' + Progress.buildingStars(b.id) + ' / ' + ms.length * 3 + '</span>' : '') +
        (cond ? '<span class="cond">' + cond + '</span>' : '');
      card.appendChild(info);
      if (open) card.addEventListener('click', () => { Sfx.tap(); buildingId = b.id; show('building'); });
      list.appendChild(card);
    }
  }
  $('mapBack').addEventListener('click', () => show('menu'));

  // ---------- a building ----------
  function renderBuilding(id) {
    const b = BUILDING[id];
    $('bName').textContent = tr(b.name);
    $('bLine').textContent = '“' + tr(b.client.line) + '” — ' + tr(b.client.name);
    $('bIdea').textContent = tr('You learn: {idea}', { idea: tr(b.idea) });
    Art.portrait($('clientFace'), b.client.look);
    const path = $('missionPath');
    path.innerHTML = '';
    for (const m of buildingMissions(id)) {
      const open = Progress.missionOpen(m);
      const s = Progress.stars(m.id, difficulty);
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'mstop k-' + m.kind + (open ? '' : ' locked') + (m.kind === 'exam' ? ' exam' : '');
      el.innerHTML = '<span class="num">' + (m.kind === 'exam' ? '🏆' : m.n) + '</span><span class="mname">' + escapeHtml(tr(m.name)) + '</span>' +
        '<span class="kind">' + tr(KIND_NAMES[m.kind]) + '</span>' +
        '<span class="mstars">' + [0, 1, 2].map((i) => '<i class="' + (i < s ? 'on' : '') + '">★</i>').join('') +
        (Progress.usedHint3(m.id, difficulty) ? '💡' : '') + (Progress.data.medals[m.id] ? '🏅' : '') + '</span>' + (open ? '' : '<span class="lockIcon">🔒</span>');
      if (open) el.addEventListener('click', () => { Sfx.tap(); openBrief(m); });
      path.appendChild(el);
    }
  }
  $('buildingBack').addEventListener('click', () => show('map'));

  // ---------- the mission card ----------
  function openBrief(m) {
    brief = m;
    buildingId = m.building;
    const b = BUILDING[m.building];
    $('briefNum').textContent = tr(b.name) + ' · ' + tr('Mission {n}', { n: m.n }) + ' · ' + tr(KIND_NAMES[m.kind]);
    $('briefName').textContent = tr(m.name);
    Art.portrait($('briefFace'), b.client.look);
    $('briefText').innerHTML = m.brief.map((l) => '<p>' + escapeHtml(tr(l)) + '</p>').join('');
    $('briefGoal').textContent = tr(m.goal);
    $('briefStars').innerHTML = m.stars.map((cond, i) => {
      const list = Array.isArray(cond) ? cond : [cond];
      const text = list.map((c) => { const l = Stars.label(Stars.scaled(c, difficulty)); return escapeHtml(tr(l.key, l.params)); }).join(' + ');
      const got = Progress.stars(m.id, difficulty) > i;
      return '<div class="sline' + (got ? ' ok' : '') + '"><span class="snum">' + '★'.repeat(i + 1) + '</span><span>' + text + '</span></div>';
    }).join('');
    // the new blocks of this mission
    const nb = $('briefNew');
    nb.innerHTML = '';
    if ((m.newBlocks && m.newBlocks.length) || m.ownBlocks) {
      const t = document.createElement('p');
      t.className = 'label';
      t.textContent = tr('New blocks');
      nb.appendChild(t);
      const row = document.createElement('div');
      row.className = 'newBlocks';
      for (const op of m.newBlocks || []) row.appendChild(BlockView.el(BlockView.make(op)));
      // My Blocks: an example of an own block, its define hat and its use
      if (m.ownBlocks) {
        const hat = Prog.renew(ownDefine(tr('my block'), []));
        row.appendChild(BlockView.el(hat));
        row.appendChild(BlockView.el(BlockView.make('call', { name: hat.name, kinds: [] })));
      }
      nb.appendChild(row);
    }
    const c = CONCEPTS[m.concept];
    $('briefConcept').innerHTML = c ? '<div class="concept"><span class="gears">👴</span><div><b>' + tr('Grandpa Gears:') + ' ' + escapeHtml(tr(c.title)) + '</b><p>' + escapeHtml(tr(c.text)) + '</p><p><i>' + escapeHtml(tr(c.like)) + '</i></p></div></div>' : '';
    // start from the last program of the building, or empty
    const own = Progress.program(m.id);
    const prev = !own && !m.start ? lastOfBuilding(m) : null;
    $('briefChoice').hidden = !prev;
    $('startLast').classList.add('on'); $('startEmpty').classList.remove('on');
    show('brief');
  }
  function lastOfBuilding(m) {
    for (let n = m.n - 1; n >= 1; n--) { const p = Progress.program(m.chapter + '-' + n); if (p && p.scripts && p.scripts.length) return p; }
    return null;
  }
  $('startLast').addEventListener('click', () => { $('startLast').classList.add('on'); $('startEmpty').classList.remove('on'); });
  $('startEmpty').addEventListener('click', () => { $('startEmpty').classList.add('on'); $('startLast').classList.remove('on'); });
  $('briefStart').addEventListener('click', () => {
    const m = brief;
    let prog = Progress.program(m.id);
    if (!prog && m.start) prog = Prog.parse(m.start);
    if (!prog && !$('briefChoice').hidden && $('startLast').classList.contains('on')) prog = Prog.renew(lastOfBuilding(m));
    call('start', m, prog || Prog.parse('when ▶ clicked'));
  });
  $('briefBack').addEventListener('click', () => { if (Runner.mission === brief && Runner.state !== 'menu' && handlers.inMission && handlers.inMission()) hide(); else show('building'); });

  // ---------- keys in the menus ----------
  function visibleButtons() {
    const p = current && panels[current];
    if (!p) return [];
    return [...p.querySelectorAll('button')].filter((b) => !b.disabled && b.offsetParent !== null);
  }
  function moveFocus(dx, dy) {
    const list = visibleButtons();
    if (!list.length) return;
    const cur = document.activeElement;
    let i = list.indexOf(cur);
    if (i < 0) { (list.find((b) => b.classList.contains('default')) || list[0]).focus(); return; }
    i = clamp(i + (dy || dx), 0, list.length - 1);
    list[i].focus();
  }
  function pressDefault() {
    const list = visibleButtons();
    const cur = document.activeElement;
    if (cur && list.indexOf(cur) >= 0) { cur.click(); return; }
    const d = list.find((b) => b.classList.contains('default'));
    if (d) d.click();
  }

  return { show, hide, on, openBrief, renderMenu, renderAccount, moveFocus, pressDefault, diffRows,
    get current() { return current; }, get difficulty() { return difficulty; }, get brief() { return brief; }, set buildingId(v) { buildingId = v; } };
})();

// Google's "G", on the sign-in button
const GOOGLE_G_SVG = '<svg class="gLogo" viewBox="0 0 48 48" aria-hidden="true">' +
  '<path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z"/>' +
  '<path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 7l7.5 5.8c4.4-4 6.8-10 6.8-17.3z"/>' +
  '<path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.8-6.1z"/>' +
  '<path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.2 0-11.5-4.1-13.4-9.8l-7.9 6.1C6.6 42.6 14.6 48 24 48z"/></svg>';

const KIND_NAMES = { build: 'Build', fill: 'Fill the gaps', fix: 'Fix the bug', tiny: 'Tiny program', beat: 'Beat the number', exam: 'Exam' };
