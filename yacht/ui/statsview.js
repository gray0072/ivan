'use strict';

// Yacht — the statistics dialog of a group: tabs Players, Rows and Games, worked out by sim/stats.js.
// Used by game.js.

const StatsView = {
  groupId: null,
  tab: 'players',

  open(groupId) {
    this.groupId = groupId;
    this.render();
    Screens.open('statsPanel');
  },

  render() {
    const group = this.groupId ? Groups.get(this.groupId) : null;
    const games = group ? group.games : [];
    document.getElementById('statsTitle').textContent = group ? tr('Statistics: {name}', { name: group.name }) : tr('Statistics');
    document.getElementById('statsCount').textContent = tr('Finished games: {n}', { n: games.length });
    document.getElementById('statsRunning').hidden = !(group && group.current);
    document.querySelectorAll('#statsTabs button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tab === this.tab)));
    document.getElementById('statsClearBtn').hidden = !games.length;
    const box = document.getElementById('statsBody');
    if (!games.length) {
      box.innerHTML = '<p class="fine">' + esc(tr('No finished games yet. They appear here when a game ends.')) + '</p>';
      return;
    }
    if (this.tab === 'players') box.innerHTML = this.playersHtml(playerStats(games));
    else if (this.tab === 'rows') box.innerHTML = this.rowsHtml(playerStats(games));
    else box.innerHTML = this.gamesHtml(games);
  },

  playersHtml(list) {
    const head = ['Player', 'Games', 'Wins', 'Average', 'Best', 'Worst', 'Avg. place', 'Best game sum', 'Best school', 'Generals', 'Doubled rows', 'School rows missed'];
    return '<div class="statsWrap"><table class="stats"><thead><tr>' + head.map((h) => '<th scope="col">' + esc(tr(h)) + '</th>').join('') + '</tr></thead><tbody>' +
      list.map((p) => '<tr><th scope="row">' + esc(p.name) + '</th><td>' + [
        p.games, p.wins, esc(dec1(p.average).replace('-', '−')), esc(numText(p.best)), esc(numText(p.worst)), esc(dec1(p.averagePlace)),
        esc(numText(p.bestGame)), esc(signed(p.bestSchool)), p.generals, p.doubled, p.missed
      ].join('</td><td>') + '</td></tr>').join('') + '</tbody></table></div>';
  },

  rowsHtml(list) {
    return '<p class="fine">' + esc(tr('The average points per row; a row given up counts as 0.')) + '</p><div class="statsWrap"><table class="stats"><thead><tr><th scope="col">' + esc(tr('Row')) + '</th>' +
      list.map((p) => '<th scope="col">' + esc(p.name) + '</th>').join('') + '</tr></thead><tbody>' +
      ALL_ROWS.map((r) => '<tr><th scope="row">' + esc(rowLabel(r)) + '</th>' +
        list.map((p) => '<td>' + esc(dec1(p.rows[r.id]).replace('-', '−')) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
  },

  gamesHtml(games) {
    const level = { easy: tr('Easy'), medium: tr('Medium'), hard: tr('Hard') };
    return '<ul class="gameList">' + games.slice().reverse().map((g) => {
      const date = new Date(g.at).toLocaleDateString(I18N.lang, { year: 'numeric', month: 'short', day: 'numeric' });
      const sorted = g.players.slice().sort((a, b) => a.place - b.place);
      return '<li><div class="gameHead">' + esc(date) + ' · ' + esc(level[g.difficulty] || '') + '</div><div>' +
        sorted.map((p) => '<span class="' + (p.place === 1 ? 'won' : '') + '">' + esc(romanPlace(p.place)) + ' ' + esc(p.name) + ' ' + esc(numText(p.total)) + '</span>').join(' · ') + '</div></li>';
    }).join('') + '</ul>';
  }
};
