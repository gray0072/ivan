'use strict';

// Yacht — the statistics of a group, worked out from its finished games: per player and per row.
// Plain functions, no DOM. A finished game is the summary made by summarizeRun() and kept in the
// group's `games` (core/groups.js). Read by ui/statsview.js.

// what a finished game keeps: `c` = the rows' points, `d` = the doubled rows
function summarizeRun(run) {
  return {
    id: run.id,
    at: new Date().toISOString(),
    difficulty: run.difficulty,
    players: standings(run).map((s) => {
      const c = {}, d = [];
      for (const r of ALL_ROWS) {
        c[r.id] = s.cells[r.id].p;
        if (s.cells[r.id].d) d.push(r.id);
      }
      return { id: s.id, name: s.name, c, d, game: s.game, school: s.school, total: s.total, place: s.place };
    })
  };
}

// one line per player who ever played in the group, under their latest name, best first
function playerStats(games) {
  const byId = {};
  // the games are kept oldest first, so the latest name is the one that stays
  for (const g of games) {
    for (const p of g.players) {
      const e = byId[p.id] || (byId[p.id] = {
        id: p.id, name: p.name, games: 0, wins: 0, sum: 0, placeSum: 0, best: -Infinity, worst: Infinity,
        bestGame: -Infinity, bestSchool: -Infinity, missed: 0, generals: 0, doubled: 0, rows: {}
      });
      e.name = p.name;
      e.games++;
      if (p.place === 1) e.wins++;
      e.sum += p.total;
      e.placeSum += p.place;
      e.best = Math.max(e.best, p.total);
      e.worst = Math.min(e.worst, p.total);
      e.bestGame = Math.max(e.bestGame, p.game);
      e.bestSchool = Math.max(e.bestSchool, p.school);
      for (const r of SCHOOL_ROWS) if (p.c[r.id] < 0) e.missed++;
      if (p.c.g > 0) e.generals++;
      e.doubled += p.d.length;
      for (const r of ALL_ROWS) e.rows[r.id] = (e.rows[r.id] || 0) + p.c[r.id];
    }
  }
  const list = Object.values(byId);
  for (const e of list) {
    e.average = e.sum / e.games;
    e.averagePlace = e.placeSum / e.games;
    for (const r of ALL_ROWS) e.rows[r.id] /= e.games;
  }
  list.sort((a, b) => b.wins - a.wins || b.average - a.average);
  return list;
}
