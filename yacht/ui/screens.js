'use strict';

// Yacht — the panels over the table: a stack of them (the start screen, the group editor, pause,
// game over, statistics, a question), the start screen's content, the difficulty and sound toggles,
// the how-to-play table and the banner. The buttons are wired in game.js. Used by game.js.

const Screens = {
  stack: [],
  bannerTimer: 0,
  difficulty: 'easy',

  open(id) {
    const top = this.stack[this.stack.length - 1];
    if (top) document.getElementById(top).hidden = true;
    this.stack.push(id);
    document.getElementById(id).hidden = false;
    document.getElementById('overlay').hidden = false;
    document.getElementById('overlay').scrollTop = 0;
  },
  back() {
    const top = this.stack.pop();
    if (top) document.getElementById(top).hidden = true;
    const prev = this.stack[this.stack.length - 1];
    if (prev) document.getElementById(prev).hidden = false;
    else document.getElementById('overlay').hidden = true;
  },
  closeAll() {
    while (this.stack.length) this.back();
  },
  top() { return this.stack[this.stack.length - 1] || null; },

  banner(text) {
    const b = document.getElementById('banner');
    b.textContent = text;
    b.classList.add('show');
    clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => b.classList.remove('show'), BANNER_MS);
  },

  // A question with two answers; returns to the panel it was asked from
  confirm(title, text, yes, onYes) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmText').textContent = text;
    document.getElementById('confirmYes').textContent = yes;
    this.onYes = onYes;
    this.open('confirmPanel');
  },

  // ---------- toggles ----------
  renderDifficulty() {
    document.querySelectorAll('.diffPick').forEach((box) => {
      box.innerHTML = ['easy', 'medium', 'hard'].map((d) =>
        '<button type="button" class="btn toggle" data-diff="' + d + '" aria-pressed="' + (d === this.difficulty) + '">' +
        esc(tr(d === 'easy' ? 'Easy' : d === 'medium' ? 'Medium' : 'Hard')) + '</button>').join('');
    });
    const text = this.difficulty === 'easy' ? tr('Free rows show what the dice would score, and the best move is suggested.')
      : this.difficulty === 'medium' ? tr('Free rows show what the dice would score. No advice.')
        : tr('No help: work the points out yourself.');
    document.querySelectorAll('.diffText').forEach((p) => { p.textContent = text; });
  },
  setDifficulty(d) {
    this.difficulty = d;
    Groups.setSetting('difficulty', d);
    this.renderDifficulty();
  },
  renderSound() {
    document.querySelectorAll('button[data-sound]').forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.sound === 'on') === soundOn)));
    const icon = document.getElementById('soundBtn');
    icon.textContent = soundOn ? '🔊' : '🔇';
  },

  // ---------- the start screen ----------
  renderMenu() {
    const groups = Groups.all();
    const active = Groups.active();
    const list = document.getElementById('groupList');
    list.innerHTML = groups.map((g) =>
      '<button type="button" class="groupItem" data-group="' + esc(g.id) + '" aria-pressed="' + (!!active && g.id === active.id) + '">' +
      '<b>' + esc(g.name) + '</b><span>' + esc(g.players.map((p) => p.name).join(', ')) + '</span></button>').join('');
    const has = !!active;
    document.getElementById('groupActions').hidden = !has;
    document.getElementById('newGroupBtn').classList.toggle('default', !has);
    document.getElementById('groupsLabel').hidden = !has;
    if (!has) return;
    const cur = active.current;
    const contBox = document.getElementById('continueBox');
    contBox.hidden = !cur;
    document.getElementById('newGameBtn').classList.toggle('default', !cur);
    document.getElementById('newGameBtn').classList.toggle('secondary', !!cur);
    if (cur) {
      const left = rowsLeft(cur.players[cur.turn].cells);
      document.getElementById('continueInfo').textContent = tr('Round {n} of {all}: {name} to play', {
        n: ALL_ROWS.length - left + 1, all: ALL_ROWS.length, name: cur.players[cur.turn].name
      });
    }
  },

  // ---------- how to play ----------
  renderHelp() {
    const rows = COMBO_ROWS.map((r) => '<tr><th scope="row">' + esc(rowLabel(r)) + '</th><td><b>' + esc(tr(r.name)) + '.</b> ' + esc(tr(r.needs)) + '</td></tr>').join('');
    document.getElementById('helpRows').innerHTML = rows +
      '<tr><th scope="row">6…1</th><td><b>' + esc(tr('School')) + '.</b> ' + esc(tr('Three dice of the row\'s face close it: +, no points. Each die more adds that face: four twos score 2, five fours score 8. A row not closed costs −{n}.', { n: SCHOOL_MISS })) + '</td></tr>';
  },

  // ---------- game over ----------
  renderOver(summaryList, cheated) {
    const winners = summaryList.filter((s) => s.place === 1);
    let line;
    if (summaryList.length === 1) line = tr('Your total: {n}', { n: numText(summaryList[0].total) });
    else if (winners.length > 1) line = tr('A shared first place: {names}!', { names: winners.map((w) => w.name).join(', ') });
    else line = tr('{name} wins!', { name: winners[0].name });
    document.getElementById('overTitle').textContent = line;
    const sorted = summaryList.slice().sort((a, b) => a.place - b.place);
    document.getElementById('overList').innerHTML = sorted.map((s) =>
      '<tr class="' + (s.place === 1 ? 'winner' : '') + '"><td>' + esc(romanPlace(s.place)) + '</td><td class="nm">' + esc(s.name) + '</td><td>' + esc(numText(s.game)) + '</td><td>' + esc(signed(s.school)) + '</td><td><b>' + esc(numText(s.total)) + '</b></td></tr>').join('');
    document.getElementById('overCheat').hidden = !cheated;
  }
};
