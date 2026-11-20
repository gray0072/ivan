'use strict';

// Arlanda Rising — the campaign map: a timeline from 1958 to 2040 with the eight chapters as eras, each with its
// missions as stops (their stars and minutes); the next mission of the campaign marked, the passed ones open for a
// replay, the rest locked. Chapters not yet in the game are greyed. Used by game.js.

const Timeline = (() => {
  function show() {
    const p = document.getElementById('timeline');
    const next = Campaign.data && Campaign.data.next;
    let html = '<h1>' + Text.esc(tr('The campaign')) + '</h1><p class="fine">' + Text.esc(tr('Stars: {n}', { n: Progress.totalStars() })) + '</p><div class="eras">';
    for (const ch of CHAPTERS) {
      const list = MISSIONS.filter((m) => m.chapter === ch.n);
      html += '<section class="era' + (list.length ? '' : ' locked') + '"><h2><span>' + ch.n + '</span>' + Text.esc(tr(ch.name)) + '<small>' + ch.years + '</small></h2>';
      if (!list.length) html += '<p class="fine">🔒 ' + Text.esc(tr('Coming in a later version of the game.')) + '</p>';
      html += '<div class="stops">';
      for (const m of list) {
        const open = Progress.open(m.id) || m.id === next, best = Progress.best(m.id);
        html += '<button class="stop' + (m.id === next ? ' next' : '') + (open ? '' : ' lockedStop') + '" data-m="' + m.id + '"' + (open ? '' : ' disabled') + '>' +
          '<span class="num">' + m.n + '</span><b>' + Text.esc(tr(m.name)) + '</b><span class="st">' + (open ? Text.stars(best) : '🔒') + '</span>' +
          '<small>' + Calendar.date(Calendar.parse(m.date)).y + ' · ~' + Text.minutes(m) + ' ' + Text.esc(tr('min')) + '</small></button>';
      }
      html += '</div></section>';
    }
    html += '</div>';
    p.innerHTML = html;
    const nav = Screens.row(
      Campaign.exists() ? Screens.btn(tr('Office'), 'secondary', () => Game.toOffice()) : null,
      Screens.btn(tr('Main Menu'), 'secondary', () => Game.toMenu()),
      next ? Screens.btn(tr('Next mission'), 'default', () => Game.openMission(next)) : null
    );
    p.appendChild(nav);
    p.querySelectorAll('.stop').forEach((b) => b.addEventListener('click', () => { Sfx.play('click'); Game.openMission(b.dataset.m); }));
    Screens.show('timeline');
    const cur = p.querySelector('.stop.next');
    if (cur) cur.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  return { show };
})();
