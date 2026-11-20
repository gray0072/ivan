'use strict';

// Arlanda Rising — the overlay screens and what they share: showing one panel at a time, the difficulty picker
// (start screen, mission card, pause, results — pre-selected), the Sound On / Off switch, and the start screen,
// the pause menu, the settings and the confirm dialog. The other screens have their own files (timeline,
// missioncard, results, office). Buttons call game.js; Space / Enter press the panel's default button.

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
    if (m && saved.data && saved.data.state && saved.data.state.mission) {
      const st = saved.data.state.mission;
      p.appendChild(row(btn(tr('Continue mission'), 'default big', () => Game.continueMission())));
      p.appendChild(el('p', 'saveInfo', Text.esc(tr('{name} — stage {i} of {n}', { name: tr(m.name), i: st.stage + 1, n: m.stages.length }))));
    }
    if (Campaign.exists()) {
      const nm = Campaign.nextMission();
      p.appendChild(row(btn(tr('Continue'), m ? '' : 'default big', () => Game.toTimeline())));
      p.appendChild(el('p', 'saveInfo', Text.esc(nm ? tr('Chapter {n}: {name} · next: {mission}', { n: nm.chapter, name: tr(CHAPTERS[nm.chapter - 1].name), mission: tr(nm.name) }) : tr('Chapter 1 is done — more chapters are coming.'))));
    }
    p.appendChild(row(btn(tr('New Campaign'), Campaign.exists() || m ? 'secondary' : 'default big', () => Game.askNewCampaign())));
    p.appendChild(diffPicker(Settings.difficulty(), (d) => Settings.setDifficulty(d)));
    p.appendChild(soundRow());
    p.appendChild(row(btn(tr('Settings'), 'secondary', () => settings('menu')), btn(tr('How to play'), 'secondary', () => help())));
    p.appendChild(el('p', 'fine about', Text.esc(tr('A free, non-commercial fan game; not affiliated with or endorsed by Swedavia or any company shown. Names and logos belong to their owners.'))));
    I18N.buildPickers();
    I18N.applyDom();
    show('menu');
  }

  function help() {
    const p = $('help');
    p.innerHTML = '<h1>' + Text.esc(tr('How to play')) + '</h1>' + [
      'You are the director of Stockholm Arlanda. Each mission is a few minutes long, in two or three stages, and it is saved all the time: close the game whenever you like and go on later from the same moment.',
      'In a build stage, one day passes every second. Start the jobs in the panel: each takes days and money, and only as many at once as you have crews. Choices stop the time until you pick one.',
      'In an operations stage, one hour takes about a minute. The task tray on the left fills with jobs: tap a task to do the obvious thing, or drag a landing aircraft onto a stand. A task you miss goes to the duty manager, who does it late and not always well.',
      'The bar at the bottom opens check-in desks, sends the ploughs, picks the runway direction when the wind is calm and buys small things: a remote stand, a fuel truck, a plough.',
      'Mouse: click and drag, the wheel zooms, right drag or the arrow keys move the map. Keys: Space pause, 1–4 speed, N skip to the next task, Q do the oldest task, Esc pause menu.',
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
    col.appendChild(btn(tr('Retry stage'), 'secondary', () => Game.retryStage()));
    p.appendChild(col);
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

  return { show, hide, menu, pause, settings, confirm, diffPicker, soundRow, btn, row, el, pressDefault, get current() { return current; } };
})();
