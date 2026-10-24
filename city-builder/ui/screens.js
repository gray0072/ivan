'use strict';

// City Builder — the screens over the map: the start menu (continue, difficulty, sound, how to
// play, records), the pause dialog, the milestone dialog, the bankruptcy screen and the "new city?"
// question; plus the date and duration texts the HUD shares. game.js wires their buttons to the
// flow; arrow keys move the focus between the visible buttons (moveFocus / pressDefault).

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DIFFICULTY_TEXT = {
  easy: 'More money at the start, higher taxes, cheaper upkeep, rare disasters and six months to get out of debt.',
  medium: 'A normal city: some fires and floods, four months to get out of debt.',
  hard: 'Little money, lower taxes, costly upkeep, frequent disasters and only three months in debt.'
};
const DIFFICULTY_NAMES = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

function dateText(month) {
  return tr('{month}, Year {year}', { month: tr(MONTH_NAMES[month % MONTHS_PER_YEAR]), year: Math.floor(month / MONTHS_PER_YEAR) + 1 });
}
function durationText(months) {
  const y = Math.floor(months / MONTHS_PER_YEAR), m = months % MONTHS_PER_YEAR;
  return y ? tr('{y} y {m} mo', { y, m }) : tr('{n} mo', { n: m });
}

const Screens = (() => {
  const overlay = document.getElementById('overlay');
  const panels = {
    menu: document.getElementById('menu'),
    pause: document.getElementById('pausePanel'),
    milestone: document.getElementById('milestonePanel'),
    gameOver: document.getElementById('gameOverPanel'),
    confirm: document.getElementById('confirmPanel')
  };
  let current = null;
  let difficulty = Storage.difficulty();

  function show(name) {
    overlay.style.display = 'flex';
    for (const k in panels) panels[k].hidden = k !== name;
    current = name;
    if (name === 'menu') renderMenu();
    syncSound();
    overlay.scrollTop = 0;
  }
  function hide() {
    overlay.style.display = 'none';
    current = null;
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }

  // a row of Easy / Medium / Hard toggles; picking one remembers it
  function diffRow(el, textEl) {
    el.innerHTML = DIFFICULTY_ORDER.map((d) =>
      '<button class="btn toggle' + (d === difficulty ? ' on' : '') + '" data-diff="' + d + '">' + tr(DIFFICULTY_NAMES[d]) + '</button>').join('');
    if (textEl) textEl.textContent = tr(DIFFICULTY_TEXT[difficulty]);
  }
  function pickDifficulty(d) {
    difficulty = d;
    Storage.setDifficulty(d);
    diffRow(document.getElementById('menuDiff'), document.getElementById('menuDiffText'));
    diffRow(document.getElementById('overDiff'));
  }
  overlay.addEventListener('click', (e) => {
    const b = e.target.closest('[data-diff]');
    if (b) pickDifficulty(b.dataset.diff);
    const s = e.target.closest('[data-sound]');
    if (s) { setSound(s.dataset.sound === 'on'); syncSound(); }
  });
  function syncSound() {
    document.querySelectorAll('[data-sound]').forEach((b) => b.classList.toggle('on', (b.dataset.sound === 'on') === soundOn));
  }

  function renderMenu() {
    const saved = Storage.loadCity();
    const box = document.getElementById('continueBox');
    box.hidden = !saved;
    if (saved) {
      const pop = saved.stats ? saved.stats.population : 0;
      document.getElementById('saveInfo').textContent = tr('{name} · {pop} residents · {date} · {difficulty}',
        { name: saved.name, pop: number(pop), date: dateText(saved.month), difficulty: tr(DIFFICULTY_NAMES[saved.difficulty]) });
    }
    document.getElementById('newBtn').classList.toggle('default', !saved);
    diffRow(document.getElementById('menuDiff'), document.getElementById('menuDiffText'));
    renderRecords();
  }

  function renderRecords() {
    const all = Storage.records();
    const rows = DIFFICULTY_ORDER.filter((d) => all[d] && Object.keys(all[d]).length);
    document.getElementById('records').hidden = !rows.length;
    document.querySelector('#records tbody').innerHTML = rows.map((d) => {
      const r = all[d];
      const cells = MILESTONES.slice(1).map((m) => '<td>' + (r[m.id] !== undefined ? durationText(r[m.id]) : '—') + '</td>').join('');
      return '<tr><td>' + tr(DIFFICULTY_NAMES[d]) + '</td>' + cells + '<td>' + (r.maxPop ? number(r.maxPop) : '—') + '</td></tr>';
    }).join('');
  }

  function showMilestone(e) {
    const m = MILESTONES[e.index];
    document.getElementById('msBigIcon').textContent = m.icon;
    document.getElementById('msTitle').textContent = tr('{name} is now a {title}!', { name: city.name, title: tr(m.name) });
    const opened = [...Object.keys(BUILDINGS), ...Object.keys(TOOL_INFO)].filter((k) => (BUILDINGS[k] || TOOL_INFO[k]).unlock === e.index);
    document.getElementById('msUnlocks').innerHTML = opened.length
      ? tr('New: {list}', { list: '<b>' + opened.map((k) => tr((BUILDINGS[k] || TOOL_INFO[k]).name)).join(', ') + '</b>' })
      : tr('Your residents are proud of their city!');
    document.getElementById('msTime').textContent = durationText(e.months);
    document.getElementById('msBestLabel').textContent = tr('Best ({difficulty})', { difficulty: tr(DIFFICULTY_NAMES[city.difficulty]) });
    document.getElementById('msBest').textContent = e.record ? durationText(e.record.best) : '—';
    document.getElementById('msRecord').hidden = !(e.record && e.record.isNew);
    document.getElementById('msCheat').hidden = !city.cheated;
    show('milestone');
  }

  function showGameOver() {
    document.getElementById('gameOverText').textContent = tr('{name} ran out of money after {time}. It had {pop} residents.',
      { name: city.name, time: durationText(city.month), pop: number(city.stats.population) });
    diffRow(document.getElementById('overDiff'));
    show('gameOver');
  }

  function confirmNew(saved) {
    document.getElementById('confirmText').textContent = tr('Your saved city {name} will be lost.', { name: saved.name });
    show('confirm');
  }

  // ---------- the keyboard in the menus ----------
  function visibleButtons() {
    if (!current) return [];
    return [...panels[current].querySelectorAll('button')].filter((b) => b.offsetParent !== null);
  }
  function moveFocus(dx, dy) {
    const list = visibleButtons();
    if (!list.length) return;
    const from = list.includes(document.activeElement) ? document.activeElement : list.find((b) => b.classList.contains('default')) || list[0];
    if (from !== document.activeElement && !list.includes(document.activeElement)) { from.focus(); if (!dx && !dy) return; }
    const r0 = from.getBoundingClientRect(), cx = r0.left + r0.width / 2, cy = r0.top + r0.height / 2;
    let best = null, bestD = Infinity;
    for (const b of list) {
      if (b === from) continue;
      const r = b.getBoundingClientRect(), bx = r.left + r.width / 2, by = r.top + r.height / 2;
      const ax = bx - cx, ay = by - cy;
      if (dx && Math.sign(ax) !== dx || dy && Math.sign(ay) !== dy) continue;
      if (dx && Math.abs(ax) < 2 || dy && Math.abs(ay) < 2) continue;
      const d = dx ? Math.abs(ax) + Math.abs(ay) * 3 : Math.abs(ay) + Math.abs(ax) * 3;
      if (d < bestD) { bestD = d; best = b; }
    }
    if (best) best.focus();
  }
  function pressDefault() {
    const list = visibleButtons();
    const b = list.includes(document.activeElement) ? document.activeElement : list.find((x) => x.classList.contains('default'));
    if (b) b.click();
  }

  return { show, hide, showMilestone, showGameOver, confirmNew, renderMenu, moveFocus, pressDefault, syncSound,
    get current() { return current; }, get difficulty() { return difficulty; } };
})();
