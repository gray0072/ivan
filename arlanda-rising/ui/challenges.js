'use strict';

// Arlanda Rising — the Challenge Days screen (from the start screen, open after chapter 3): each day with its years, its
// minutes, its aim and the best score and stars kept on each difficulty, or what opens it; the difficulty; Start. And
// the results of a day: the score with its parts, the stars, a new best. Used by game.js.

const ChallengesUI = (() => {
  const $ = (id) => document.getElementById(id);

  function show() {
    const p = $('challenges');
    p.innerHTML = '<h1>🏆 ' + Text.esc(tr('Challenge Days')) + '</h1><p class="fine">' + Text.esc(tr('Longer days of about twenty minutes, with a score: points for every flight on time and for happy passengers, less for delays, queues and what goes wrong. Saved at any moment, like a mission.')) + '</p>';
    let d = Settings.difficulty();
    const list = Screens.el('div', 'cards');
    for (const c of CHALLENGES) {
      const open = Challenges.open(c.id);
      const card = Screens.el('div', 'ocard', '<h3>' + Text.esc(tr(c.name)) + ' <small>~' + Text.minutes(c) + ' ' + Text.esc(tr('min')) + '</small></h3><p>' + Text.esc(tr(c.aim)) + '</p>' +
        (open ? '<p class="fine">' + DIFFICULTY_ORDER.map((x) => { const b = ChallengeSave.best(c.id, x); return Text.esc(tr({ easy: 'Easy', medium: 'Medium', hard: 'Hard' }[x])) + ': ' + (b ? Text.stars(b.stars) + ' ' + b.score : '—'); }).join(' · ') + '</p>' +
          '<p class="fine">' + Text.esc(tr('Stars at {a}, {b} and {c} points.', { a: c.starsAt[0], b: c.starsAt[1], c: c.starsAt[2] })) + '</p>'
          : '<p class="fine">🔒 ' + Text.esc(tr('Opens after: {m}', { m: tr(MISSION[c.opens].name) })) + '</p>'));
      if (open) card.appendChild(Screens.row(Screens.btn(tr('Start'), 'default', () => Game.startChallenge(c.id, d))));
      list.appendChild(card);
    }
    p.appendChild(list);
    p.appendChild(Screens.diffPicker(d, (x) => { d = x; }));
    p.appendChild(Screens.row(Screens.btn(tr('Back'), 'secondary', () => Game.toMenu())));
    Screens.show('challenges');
  }

  function results(info) {
    const m = Missions.def(), tot = S.mission.total, p = $('results'), pass = S.mission.status === 'done';
    const score = Challenges.score(tot);
    let html = '<h1>' + Text.esc(pass ? tr('Challenge done!') : tr('Challenge missed')) + '</h1><p class="chap">' + Text.esc(tr(m.name)) + '</p>' +
      '<div class="bigStars">' + Text.stars(S.mission.stars) + '</div><p class="score">' + Text.esc(tr('{n} points', { n: score })) + '</p>';
    if (info.newBest) html += '<p class="record">' + Text.esc(tr('New best!')) + '</p>';
    if (S.mission.cheated) html += '<p class="fine warn">' + Text.esc(tr('Cheats were used: this run saves no stars.')) + '</p>';
    html += '<table class="books parts">' + Challenges.parts(tot).map((x) => '<tr><td>' + Text.esc(tr(x[0])) + '</td><td>' + x[1] + '</td><td class="' + (x[2] < 0 ? 'neg' : 'pos') + '">' + (x[2] > 0 ? '+' : '') + Math.round(x[2]) + '</td></tr>').join('') + '</table>';
    html += '<p class="fine">' + Text.esc(tr('Stars at {a}, {b} and {c} points.', { a: m.starsAt[0], b: m.starsAt[1], c: m.starsAt[2] })) + '</p>';
    html += '<div class="meterRow">' + METERS.map((x) => '<span>' + x.icon + ' ' + (x.k === 'passengers' ? Text.paxStars(S.meters[x.k]) + '★' : Math.round(S.meters[x.k])) + '</span>').join('') + '</div>';
    p.innerHTML = html;
    let d = S.difficulty;
    p.appendChild(Screens.diffPicker(d, (x) => { d = x; }));
    p.appendChild(Screens.row(
      Screens.btn(tr('Challenge Days'), 'secondary', () => Game.toChallenges()),
      Screens.btn(tr('Play again'), 'default big', () => Game.startChallenge(m.id, d))
    ));
    Screens.show('results');
    Sfx.play(pass ? 'chord' : 'sad');
  }

  return { show, results };
})();
