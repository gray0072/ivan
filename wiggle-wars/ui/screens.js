'use strict';

// Wiggle Wars — the screens over the game: the start menu (versus, campaign, difficulty, sound,
// how to play), the campaign's missions, a mission's briefing, the pause dialog and the results.
// game.js wires their buttons to the flow; arrow keys move the focus between the visible buttons
// (moveFocus / pressDefault), as in the other games.

const DIFFICULTY_NAMES = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
const DIFFICULTY_TEXT = {
  easy: 'The computer often misses, and a long aim guide shows where your shot will fly.',
  medium: 'The computer aims well; a short aim guide.',
  hard: 'The computer rarely misses, no aim guide, and tougher enemies in the campaign.'
};

function starsHtml(n, max = 3) {
  let s = '';
  for (let i = 0; i < max; i++) s += '<span class="star' + (i < n ? ' on' : '') + '">★</span>';
  return s;
}
function goalLine(m) {
  const g = m.goal;
  if (g.type === 'targets') return tr('Break {n} targets in {turns} turns', { n: g.count, turns: g.turns });
  if (g.type === 'crate') return tr('Get the golden crate in {turns} turns', { turns: g.turns });
  return tr('Defeat the enemy team');
}

const Screens = (() => {
  const $ = (id) => document.getElementById(id);
  const overlay = $('overlay');
  const panels = {
    menu: $('menu'), setup: $('setupPanel'), campaign: $('campaignPanel'), briefing: $('briefingPanel'),
    pause: $('pausePanel'), result: $('resultPanel')
  };
  let current = null;
  let difficulty = Storage.difficulty();
  let briefIndex = 0;

  function show(name) {
    overlay.style.display = 'flex';
    for (const k in panels) panels[k].hidden = k !== name;
    current = name;
    if (name === 'menu') renderMenu();
    if (name === 'campaign') renderCampaign();
    syncSound();
    overlay.scrollTop = 0;
    for (const k in panels) if (!panels[k].hidden) panels[k].scrollTop = 0;
  }
  function hide() {
    overlay.style.display = 'none';
    current = null;
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }

  // ---------- difficulty and sound ----------
  function diffRow(el, textEl) {
    el.innerHTML = DIFFICULTY_ORDER.map((d) =>
      '<button class="btn toggle' + (d === difficulty ? ' on' : '') + '" data-diff="' + d + '">' + tr(DIFFICULTY_NAMES[d]) + '</button>').join('');
    if (textEl) textEl.textContent = tr(DIFFICULTY_TEXT[difficulty]);
  }
  function pickDifficulty(d) {
    difficulty = d;
    Storage.setDifficulty(d);
    diffRow($('menuDiff'), $('menuDiffText'));
    diffRow($('resultDiff'));
    if (current === 'menu') renderMenu();
    if (current === 'campaign') renderCampaign();
    if (current === 'briefing') briefing(briefIndex);
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

  // ---------- menu ----------
  function renderMenu() {
    diffRow($('menuDiff'), $('menuDiffText'));
    $('campaignStars').innerHTML = '<span class="star on">★</span> ' + Storage.totalStars(difficulty) + ' / ' + MISSIONS.length * 3;
    Render.logo($('logoWorm'));
  }
  $('helpBtn').addEventListener('click', () => { $('help').hidden = !$('help').hidden; });

  // ---------- campaign ----------
  function renderCampaign() {
    const list = $('missionList');
    list.innerHTML = '';
    $('campaignTotal').innerHTML = tr('{difficulty}: {stars} of {max} stars', { difficulty: tr(DIFFICULTY_NAMES[difficulty]), stars: Storage.totalStars(difficulty), max: MISSIONS.length * 3 });
    MISSIONS.forEach((m, i) => {
      const open = Storage.unlocked(i);
      const b = document.createElement('button');
      b.className = 'mission' + (open ? '' : ' locked');
      b.dataset.mission = i;
      const num = document.createElement('span'); num.className = 'mNum'; num.textContent = open ? String(i + 1) : '🔒';
      const name = document.createElement('span'); name.className = 'mName'; name.textContent = tr(m.name);
      const st = document.createElement('span'); st.className = 'mStars'; st.innerHTML = starsHtml(Storage.stars(i, difficulty));
      b.append(num, name, st);
      list.appendChild(b);
    });
  }
  $('missionList').addEventListener('click', (e) => {
    const b = e.target.closest('[data-mission]');
    if (!b) return;
    if (b.classList.contains('locked')) { Hud.say(tr('Win the mission before this one first.')); return; }
    briefing(+b.dataset.mission);
  });

  function briefing(i) {
    briefIndex = i;
    const m = MISSIONS[i];
    $('briefNum').textContent = tr('Mission {n}', { n: i + 1 });
    $('briefName').textContent = tr(m.name);
    $('briefStory').textContent = tr(m.story);
    $('briefGoal').textContent = goalLine(m);
    $('briefYou').textContent = tr('{n} × {hp} health', { n: m.you.n, hp: m.you.hp || 100 });
    $('briefEnemyRow').hidden = !m.enemy;
    if (m.enemy) $('briefEnemy').textContent = tr('{n} × {hp} health', { n: m.enemy.n, hp: Math.round(m.enemy.hp * DIFFICULTY[difficulty].enemyHp) });
    $('briefBest').innerHTML = starsHtml(Storage.stars(i, difficulty));
    const w = $('briefWeapons');
    w.innerHTML = '';
    for (const id of missionWeapons(i)) {
      const cell = document.createElement('span');
      cell.className = 'wi' + (m.adds.includes(id) ? ' new' : '');
      cell.title = tr(WEAPONS[id].name);
      cell.appendChild(WeaponArt.icon(id, 30));
      w.appendChild(cell);
    }
    show('briefing');
  }

  // ---------- results ----------
  function result(r, info) {
    const m = match;
    let title;
    if (m.mode === 'campaign') title = r.winner === 0 ? tr('Mission complete!') : tr('Mission failed');
    else title = r.winner < 0 ? tr('Draw!') : tr('{team} wins!', { team: m.teams[r.winner].name });
    $('resultTitle').textContent = title;
    $('resultStars').innerHTML = m.mode === 'campaign' && r.winner === 0 ? starsHtml(r.stars) : '';
    $('resultBest').hidden = !info.newBest;
    let text = '';
    if (m.mode === 'campaign' && r.winner !== 0) text = r.reason === 'turns' ? tr('Out of turns. Try again!') : tr('Your team is gone. Try again!');
    if (m.mode === 'campaign' && r.winner === 0 && m.goal && m.goal.type !== 'defeat') text = tr('Turns used: {n} (★★★ for {par} or fewer).', { n: m.teams[0].turns, par: m.goal.par });
    $('resultText').textContent = text;
    const rows = m.teams.map((t) => {
      const c = teamColor(t.color);
      return '<tr><td style="color:' + c.light + '">' + escapeHtml(t.name) + '</td><td>' + t.stats.dmg + '</td><td>' + t.stats.kills + '</td><td>' + livingWorms(t).length + ' / ' + t.worms.length + '</td></tr>';
    }).join('');
    $('resultTable').innerHTML = '<thead><tr><th></th><th>' + tr('Damage') + '</th><th>' + tr('Kills') + '</th><th>' + tr('Worms left') + '</th></tr></thead><tbody>' + rows + '</tbody>';
    $('resultCheat').hidden = !m.cheated;
    diffRow($('resultDiff'));
    const nextOk = m.mode === 'campaign' && r.winner === 0 && m.mission < MISSIONS.length - 1 && Storage.unlocked(m.mission + 1);
    $('nextBtn').hidden = !nextOk;
    $('againBtn').textContent = m.mode === 'campaign' ? tr('Retry') : tr('Play Again');
    $('againBtn').classList.toggle('default', !nextOk);
    show('result');
  }
  function escapeHtml(s) { return String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch])); }

  // ---------- the keyboard in the menus ----------
  function visibleButtons() {
    if (!current) return [];
    return [...panels[current].querySelectorAll('button')].filter((b) => b.offsetParent !== null);
  }
  function moveFocus(dx, dy) {
    const list = visibleButtons();
    if (!list.length) return;
    const from = list.includes(document.activeElement) ? document.activeElement : list.find((b) => b.classList.contains('default')) || list[0];
    if (from !== document.activeElement) { from.focus(); return; }
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

  return { show, hide, briefing, result, renderMenu, moveFocus, pressDefault, syncSound,
    get current() { return current; }, get difficulty() { return difficulty; }, get briefIndex() { return briefIndex; } };
})();
