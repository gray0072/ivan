'use strict';

// Arlanda Rising — the overlay screens and what they share: showing one panel at a time, the difficulty picker
// (start screen, mission card, pause, results — pre-selected), the Sound On / Off switch, and the start screen,
// the pause menu (with the running mission's card, ui/missioncard.js), the settings, the confirm dialog, the cloud save's account row and the Free Play screen. The
// other screens have their own files (timeline, missioncard, results, office, people, opscenter). Buttons call
// game.js; Space / Enter press the panel's default button.

// Google's "G", on the sign-in button
const GOOGLE_G_SVG = '<svg class="gLogo" viewBox="0 0 48 48" aria-hidden="true">' +
  '<path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z"/>' +
  '<path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 7l7.5 5.8c4.4-4 6.8-10 6.8-17.3z"/>' +
  '<path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.8-6.1z"/>' +
  '<path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.2 0-11.5-4.1-13.4-9.8l-7.9 6.1C6.6 42.6 14.6 48 24 48z"/></svg>';


const DIFF_TEXT = {
  easy: 'More money, calmer weather, patient airlines and longer deadlines.',
  medium: 'The game as it is meant to be played.',
  hard: 'Less money, late flights, harsh weather, impatient airlines and short deadlines.'
};

const Screens = (() => {
  const overlay = document.getElementById('overlay');
  const $ = (id) => document.getElementById(id);
  let current = null;

  function show(id) {
    for (const p of overlay.querySelectorAll('.panel')) p.hidden = p.id !== id;
    overlay.hidden = !id;
    current = id;
    if (id) { const p = $(id); p.scrollTop = 0; }
  }
  function hide() { show(null); }

  // the three difficulty buttons with a line on what the chosen one changes
  function diffPicker(cur, onPick) {
    const html = '<p class="label">' + Text.esc(tr('Difficulty')) + '</p><div class="btnRow diff">' + DIFFICULTY_ORDER.map((d) =>
      '<button class="btn toggle' + (d === cur ? ' on' : '') + '" data-diff="' + d + '">' + Text.esc(tr({ easy: 'Easy', medium: 'Medium', hard: 'Hard' }[d])) + '</button>').join('') +
      '</div><p class="fine diffText">' + Text.esc(tr(DIFF_TEXT[cur])) + '</p>';
    const wrap = document.createElement('div');
    wrap.className = 'diffBox';
    wrap.innerHTML = html;
    wrap.addEventListener('click', (e) => {
      const b = e.target.closest('[data-diff]');
      if (!b) return;
      Sfx.play('click');
      wrap.querySelectorAll('[data-diff]').forEach((x) => x.classList.toggle('on', x === b));
      wrap.querySelector('.diffText').textContent = tr(DIFF_TEXT[b.dataset.diff]);
      onPick(b.dataset.diff);
    });
    return wrap;
  }
  function soundRow() {
    const wrap = document.createElement('div');
    wrap.className = 'btnRow small';
    const paint = () => {
      wrap.innerHTML = '<span>' + Text.esc(tr('Sound')) + '</span>' + ['on', 'off'].map((v) =>
        '<button class="btn toggle' + ((v === 'on') === Sfx.on ? ' on' : '') + '" data-sound="' + v + '">' + Text.esc(tr(v === 'on' ? 'On' : 'Off')) + '</button>').join('');
    };
    paint();
    wrap.addEventListener('click', (e) => {
      const b = e.target.closest('[data-sound]');
      if (!b) return;
      Sfx.setOn(b.dataset.sound === 'on');
      Sfx.unlock();
      Sfx.play('click');
      paint();
    });
    return wrap;
  }
  function btn(text, cls, fn) {
    const b = document.createElement('button');
    b.className = 'btn ' + (cls || '');
    b.textContent = text;
    b.addEventListener('click', () => { Sfx.unlock(); Sfx.play('click'); fn(); });
    return b;
  }
  function row(...buttons) { const r = document.createElement('div'); r.className = 'btnRow'; buttons.filter(Boolean).forEach((b) => r.appendChild(b)); return r; }
  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }

  // ---------- the start screen ----------
  function menu() {
    const p = $('menu');
    p.innerHTML = '<div class="langPick" role="group" aria-label="Language"></div>' +
      '<div class="title"><img class="logoIcon" src="icon.svg?v=1" alt=""><h1>Arlanda Rising</h1></div>' +
      '<p class="tagline">' + Text.esc(tr('Run Stockholm Arlanda, from the forest of 1958 to the airport of tomorrow.')) + '</p>';
    const saved = Autosave.read();
    const m = saved && saved.run && MISSION[saved.run.id];
    const free = saved && saved.run && (saved.run.free || saved.run.challenge) && saved.data && saved.data.state && saved.data.state.mission;
    if ((m || free) && saved.data && saved.data.state && saved.data.state.mission) {
      const st = saved.data.state.mission, def = free ? st.def : m;
      p.appendChild(row(btn(tr('Continue mission'), 'default big', () => Game.continueMission())));
      const name = saved.run.challenge ? tr('Challenge Days') + ' · ' + tr(def.name) : free ? tr('Free Play') + ' · ' + tr('round {n}', { n: def.round }) : tr(m.name);
      p.appendChild(el('p', 'saveInfo', Text.esc(tr('{name} — stage {i} of {n}', { name, i: st.stage + 1, n: def.stages.length })) +
        (saved.from ? ' · ' + Text.esc(tr('saved on another device at {t}', { t: new Date(saved.savedAt).toLocaleTimeString(I18N.lang, { hour: '2-digit', minute: '2-digit' }) })) : '')));
    }
    if (Campaign.exists()) {
      const nm = Campaign.nextMission();
      p.appendChild(row(btn(tr('Continue'), m || free ? '' : 'default big', () => Game.toTimeline())));
      const last = MISSIONS[MISSIONS.length - 1];
      p.appendChild(el('p', 'saveInfo', Text.esc(nm ? tr('Chapter {n}: {name} · next: {mission}', { n: nm.chapter, name: tr(CHAPTERS[nm.chapter - 1].name), mission: tr(nm.name) }) : tr('Chapter {n} is done — more chapters are coming.', { n: last.chapter }))));
    }
    p.appendChild(row(btn(tr('New Campaign'), Campaign.exists() || m || free ? 'secondary' : 'default big', () => Game.askNewCampaign()),
      FreePlay.any() || FreeSave.exists() ? btn(tr('Free Play'), 'secondary', () => Game.toFree()) : null,
      Challenges.any() ? btn(tr('Challenge Days'), 'secondary', () => Game.toChallenges()) : null));
    p.appendChild(diffPicker(Settings.difficulty(), (d) => Settings.setDifficulty(d)));
    p.appendChild(soundRow());
    p.appendChild(row(btn(tr('Settings'), 'secondary', () => settings('menu')), btn(tr('How to play'), 'secondary', () => help())));
    const acct = el('div', 'account');
    acct.id = 'accountRow';
    p.appendChild(acct);
    renderAccount();
    p.appendChild(el('p', 'fine about', Text.esc(tr('A free, non-commercial fan game; not affiliated with or endorsed by Swedavia or any company shown. Names and logos belong to their owners.'))));
    I18N.buildPickers();
    I18N.applyDom();
    show('menu');
  }

  // ---------- the cloud save's row on the start screen (core/cloud.js) ----------
  function renderAccount() {
    const row = $('accountRow');
    if (!row) return;
    const st = Cloud.status;
    row.hidden = st === 'unavailable';
    if (row.hidden) return;
    const signIn = '<button class="btn small cloudIn" data-cloud="in">' + GOOGLE_G_SVG + Text.esc(tr('Sign in with Google')) + '</button>';
    const notice = Cloud.notice ? '<p class="fine cloudNotice">' + Text.esc(Cloud.notice === 'offline' ? tr('No network — sign in once you are online.') : tr('The sign-in did not finish — try again.')) + '</p>' : '';
    if (st === 'off') {
      row.innerHTML = signIn + '<p class="fine">' + Text.esc(tr('Keep your campaign and stars in the cloud and play on any device.')) + '</p>' + notice;
      return;
    }
    const email = Cloud.email ? '<p class="fine">☁ ' + Text.esc(Cloud.email) + '</p>' : '';
    if (st === 'loadFailed') {
      row.innerHTML = '<span class="cloudState loadFailed">' + Text.esc(tr("Couldn't load your cloud progress")) + '</span>' +
        '<div class="cloudChoice"><button class="btn small" data-cloud="retry">' + Text.esc(tr('Try again')) + '</button>' +
        '<button class="btn small secondary" data-cloud="local">' + Text.esc(tr('Play with the progress on this device')) + '</button></div>' + email;
      return;
    }
    const text = { syncing: tr('Syncing…'), synced: tr('Synced'), error: tr('Sync failed — it tries again later'),
      local: tr('Playing with the progress on this device — it syncs once the network is back'),
      signedOut: tr('Signed out — sign in again to sync') }[st];
    row.innerHTML = '<span class="cloudState ' + st + '">' + Text.esc(text) + '</span>' +
      (st === 'signedOut' ? signIn : '<button class="btn small secondary" data-cloud="out">' + Text.esc(tr('Sign out')) + '</button>') + email + notice;
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('#accountRow [data-cloud]');
    if (!b) return;
    Sfx.play('click');
    if (b.dataset.cloud === 'in') Cloud.signIn();
    else if (b.dataset.cloud === 'retry') Cloud.retry();
    else if (b.dataset.cloud === 'local') Cloud.playLocal();
    else { Cloud.signOut(); renderAccount(); }
  });

  // ---------- Free Play: go on with the airport, or start one from an era the campaign has opened ----------
  function freePlay() {
    const p = $('freePlay');
    p.innerHTML = '<h1>🛫 ' + Text.esc(tr('Free Play')) + '</h1><p class="fine">' + Text.esc(tr('An endless airport: offers to answer, peaks to fly, no stars and no frame. Every round is a month of business and a busy peak.')) + '</p>';
    const fp = FreeSave.data;
    if (FreeSave.exists()) {
      const era = FREE_ERAS.find((x) => x.id === fp.era);
      p.appendChild(row(btn(tr('Continue Free Play'), 'default big', () => Game.toOffice(true))));
      p.appendChild(el('p', 'saveInfo', Text.esc(tr('{era} · round {n} · {date}', { era: tr(era ? era.name : ''), n: fp.round, date: fmtDate(fp.world.day) }))));
    }
    p.appendChild(el('p', 'label', Text.esc(tr('Start from'))));
    let d = Settings.difficulty();
    const eras = el('div', 'btnCol');
    for (const era of FREE_ERAS) {
      const ok = FreePlay.open(era.id);
      const b = btn((ok ? '' : '🔒 ') + tr(era.name), FreeSave.exists() ? 'secondary' : 'default', () => { if (ok) Game.startFree(era.id, d); });
      b.disabled = !ok;
      eras.appendChild(b);
    }
    p.appendChild(eras);
    p.appendChild(diffPicker(d, (x) => { d = x; }));
    p.appendChild(row(btn(tr('Back'), 'secondary', () => Game.toMenu())));
    show('freePlay');
  }

  function help() {
    const p = $('help');
    p.innerHTML = '<h1>' + Text.esc(tr('How to play')) + '</h1>' + [
      'You are the director of Stockholm Arlanda. Each mission is a few minutes long, in two or three stages, and it is saved all the time: close the game whenever you like and go on later from the same moment.',
      'In a build stage, one day passes every second. Start the jobs in the panel: each takes days and money, and only as many at once as you have crews. Choices stop the time until you pick one.',
      'In an operations stage, one hour takes about a minute. The task tray on the left fills with jobs: tap a task to do the obvious thing, or drag a landing aircraft onto a stand. A task you miss goes to the duty manager, who does it late and not always well.',
      'The bar at the bottom opens check-in desks, sends the ploughs and picks the runway direction when the wind is calm. Its three buttons buy small things in any mission: Services (shops, car parks, rent), Vehicles (trucks, ploughs, crash tenders), Build (stands, desks, lanes and more) — each card with its price, its days and, for what earns, its profit and payback at today\'s traffic. What a later mission teaches stays locked until then.',
      'Mouse: click and drag, the wheel zooms, right drag or the arrow keys move the map. Keys: Space pause, 1–4 speed, 5–7 Services, Vehicles, Build, N skip to the next task, Q do the oldest task, Esc pause menu.',
      'From chapter 4 on, the Terminal view (T) shows the queues and the shop units: put real shops and cafés there — each pays rent and earns more when the queues are short. Airlines (A) shows every airline\'s mood and temper, the Offers board and route incentives; Finance (F) the books, the payback of every investment and, under Details, its net present value. Challenge Days open after chapter 3.',
      'From chapter 2 on, teams, managers and systems take whole kinds of work off your hands — for wages and licences every month. In the Office, People (P) and the Ops Center (O) hire them, train them and hold drills; when a team is short, Overtime in the bar below brings everybody in. Free Play opens after chapter 2.',
      'Phone and tablet: the game goes fullscreen. Drag with one finger to move the map, pinch with two to zoom, tap a task or drag it to a stand, hold a finger on an aircraft to see its card.'
    ].map((t) => '<p>' + Text.esc(tr(t)) + '</p>').join('');
    p.appendChild(row(btn(tr('Back'), 'default', () => menu())));
    show('help');
  }

  function settings(back) {
    const p = $('settings');
    p.innerHTML = '<h1>' + Text.esc(tr('Settings')) + '</h1>';
    const opt = (label, key, vals, names) => {
      const wrap = el('div', 'setRow', '<span>' + Text.esc(tr(label)) + '</span>');
      for (let i = 0; i < vals.length; i++) {
        const b = btn(tr(names[i]), 'toggle' + (Settings.get(key) === vals[i] ? ' on' : ''), () => {
          Settings.set(key, vals[i]);
          if (key === 'quality') MapView.resize();
          settings(back);
        });
        wrap.appendChild(b);
      }
      p.appendChild(wrap);
    };
    opt('Hints', 'hints', ['full', 'short', 'off'], ['Full', 'Short', 'Off']);
    opt('Graphics', 'quality', ['auto', 'high', 'low'], ['Auto', 'High', 'Low']);
    opt('Sums', 'sums', ['full', 'short'], ['1 200 000 SEK', '1.2 MSEK']);
    p.appendChild(row(btn(tr('Back'), 'default', () => (back === 'pause' ? pause() : menu()))));
    show('settings');
  }

  function pause() {
    const p = $('pause');
    p.innerHTML = '<h1>⏸ ' + Text.esc(tr('Paused')) + '</h1>';
    const col = el('div', 'btnCol');
    col.appendChild(btn(tr('Continue'), 'default', () => Game.resume()));
    // the mission's card with where it stands now (ui/missioncard.js): looking changes nothing
    const md = Missions.def();
    col.appendChild(btn('📋 ' + tr('The mission') + (MISSION[md.id] ? ' ' + md.id : ''), 'secondary', () => Game.missionInfo()));
    col.appendChild(btn(tr('Retry stage'), 'secondary', () => Game.retryStage()));
    p.appendChild(col);
    // session 7: the teams and their heads, also on a phone (no P or O key there)
    p.appendChild(row(btn('👥 ' + tr('People'), 'secondary', () => Game.pausePanel('people')), btn('🛠️ ' + tr('Ops Center'), 'secondary', () => Game.pausePanel('ops'))));
    let d = S.difficulty;
    p.appendChild(diffPicker(d, (x) => { d = x; }));
    p.appendChild(row(btn(tr('Restart mission'), 'secondary', () => Game.restartMission(d))));
    p.appendChild(soundRow());
    p.appendChild(row(btn(tr('Settings'), 'secondary', () => settings('pause')), btn(tr('Main Menu'), 'secondary', () => Game.toMenu())));
    p.appendChild(el('p', 'fine', Text.esc(tr('The mission is saved: Main Menu keeps it, and Continue mission goes on from here.'))));
    show('pause');
  }

  function confirm(title, text, yes, onYes, onNo) {
    const p = $('confirm');
    p.innerHTML = '<h1>' + Text.esc(title) + '</h1><p>' + Text.esc(text) + '</p>';
    p.appendChild(row(btn(yes, 'default', onYes), btn(tr('Cancel'), 'secondary', onNo)));
    show('confirm');
  }

  // Space / Enter press the focused button in the panel, or its default one
  function pressDefault() {
    if (!current) return false;
    const p = $(current);
    const f = document.activeElement;
    if (f && f.tagName === 'BUTTON' && p.contains(f)) { f.click(); return true; }
    const d = p.querySelector('button.default');
    if (d) { d.click(); return true; }
    return false;
  }

  return { show, hide, menu, pause, settings, confirm, diffPicker, soundRow, btn, row, el, pressDefault, renderAccount, freePlay, get current() { return current; } };
})();
