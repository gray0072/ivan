'use strict';

// Arlanda Rising — the cards after play: the stage card (passed or not, its goals with their values, the tasks the
// player and the duty manager did, the money of the stage; Continue, or Retry stage / Restart mission), and the
// mission results (the stars, the goals for them, the five meters, the work done by hand and by others, a line
// from Astrid or Kaj; after the chapter's exam the front page of the local paper). Used by game.js.

const Results = (() => {
  const $ = (id) => document.getElementById(id);

  function work(st) {
    let html = '<p class="work">' + Text.esc(tr('You did {a} tasks; the duty manager did {b}; others did {c}.', { a: st.tasksPlayer, b: st.tasksDuty, c: (st.tasksAuto || 0) + (st.tasksPeople || 0) + (st.tasksSys || 0) })) + '</p>';
    if (st.tasksPeople || st.tasksSys) html += '<p class="work">' + Text.esc(tr('Your teams did {a} tasks, your systems {b}.', { a: st.tasksPeople || 0, b: st.tasksSys || 0 })) +
      (st.failures ? ' ' + Text.esc(tr('{n} failures.', { n: st.failures })) : '') + (st.short ? ' ' + Text.esc(tr('{n} tasks came to you because a team was short.', { n: st.short })) : '') + '</p>';
    return html;
  }

  function stage() {
    const m = Missions.def(), i = S.mission.stage, r = S.mission.results[i], p = $('stageCard');
    const pass = r.pass;
    let html = '<p class="chap">' + Text.esc(tr(m.name)) + ' · ' + Text.esc(tr('Stage {i} of {n}', { i: i + 1, n: m.stages.length })) + '</p>' +
      '<h1>' + (pass ? '✔ ' : '✖ ') + Text.esc(tr(m.stages[i].name)) + '</h1><p class="verdict ' + (pass ? 'ok' : 'no') + '">' +
      Text.esc(pass ? tr('Stage passed!') : r.replaced ? tr('Too many months in debt: the owner has replaced the director.') : tr('Not this time.')) + '</p>';
    if (r.goals.length) html += Text.goalsHtml(r.goals);
    html += work(r.st) + '<p class="work">' + Text.esc(tr('Money in the stage: {a} in, {b} out.', { a: sek(r.st.income), b: sek(r.st.cost) })) + '</p>';
    if (pass && i + 1 < m.stages.length) html += '<p class="label">' + Text.esc(tr('Next: {name} · {when}', { name: tr(m.stages[i + 1].name), when: Text.stageWhen(m.stages[i + 1]) })) + '</p>';
    p.innerHTML = html;
    if (pass) p.appendChild(Screens.row(Screens.btn(tr('Main Menu'), 'secondary', () => Game.toMenu()), Screens.btn(tr('Continue'), 'default big', () => Game.nextStage())));
    else p.appendChild(Screens.row(Screens.btn(tr('Restart mission'), 'secondary', () => Game.restartMission(S.difficulty)), Screens.btn(tr('Retry stage'), 'default big', () => Game.retryStage())));
    Screens.show('stageCard');
    Sfx.play(pass ? 'coins' : 'sad');
  }

  const LINES = {
    3: ['Astrid: “Even the old controllers at Bromma would be jealous.”', 'Kaj: “Three stars! I’ll tell every jackdaw in Märsta.”'],
    2: ['Kaj: “Not bad for someone who can’t fly.”', 'Astrid: “Good work. One more idea, and it would have been perfect.”'],
    1: ['Astrid: “It flew. Next time, let’s make it fly on time.”', 'Kaj: “Done is done. Shiny is better, though.”'],
    0: ['Kaj: “The owner is on the phone. Shall I say you’re out?”', 'Astrid: “Every airport has days like this. Try again.”']
  };

  // the front page after a chapter's exam (the mission's own `paper`)
  function newspaper(m, stars) {
    if (m.kind !== 'exam' || !stars || !m.paper) return '';
    return '<div class="paper"><div class="mast">ARLANDA-BLADET <small>' + Text.esc(fmtDate(S.day)) + '</small></div>' +
      '<h2>' + Text.esc(tr(m.paper.head)) + '</h2><p>' + Text.esc(tr(m.paper.text)) + '</p></div>';
  }

  function mission(info) {
    const m = Missions.def(), j = S.mission.judged, stars = S.mission.stars, tot = S.mission.total, p = $('results');
    const pass = S.mission.status === 'done';
    const lines = LINES[pass ? stars : 0];
    let html = newspaper(m, stars) +
      '<h1>' + Text.esc(pass ? tr('Mission complete!') : tr('Mission failed')) + '</h1><p class="chap">' + Text.esc(tr(m.name)) + '</p>' +
      '<div class="bigStars">' + Text.stars(stars) + '</div>';
    if (info.newBest) html += '<p class="record">' + Text.esc(tr('New best!')) + '</p>';
    if (S.mission.cheated) html += '<p class="fine warn">' + Text.esc(tr('Cheats were used: this run saves no stars.')) + '</p>';
    if (j.goal.length) html += Text.goalsHtml(j.goal);
    html += '<p class="label">' + Text.esc(tr('For more stars')) + '</p>' + Text.goalsHtml(j.stars);
    html += '<div class="meterRow">' + METERS.map((x) => '<span>' + x.icon + ' ' + (x.k === 'passengers' ? Text.paxStars(S.meters[x.k]) + '★' : Math.round(S.meters[x.k])) + '</span>').join('') + '</div>';
    html += work(tot);
    html += '<p class="quote">' + Text.esc(tr(lines[(S.mission.stage + stars) % lines.length])) + '</p>';
    const nx = info.next;
    if (nx) html += '<p class="label">' + Text.esc(tr('Next: {name} · ~{n} min', { name: tr(nx.name), n: Text.minutes(nx) })) + '</p>';
    // session 6: the final exam is the last mission of the game
    else if (pass && !nx && m.chapter >= CHAPTERS.length) html += '<p class="fine">🎉 ' + Text.esc(tr('You have played the whole campaign: from a pine forest in 1958 to your own Arlanda of 2040. Free Play and the Challenge Days go on.')) + '</p>';
    else if (pass && !nx) html += '<p class="fine">' + Text.esc(tr('That was the last mission of chapter {n}. {next} comes in a later version of the game.', { n: m.chapter, next: tr((CHAPTERS[m.chapter] || {}).name || '') })) + '</p>';
    if (pass && CHALLENGES.some((c) => c.opens === m.id)) html += '<p class="fine">🏆 ' + Text.esc(tr('A Challenge Day is open: a longer day with a score, from the start screen.')) + '</p>';
    p.innerHTML = html;
    let d = S.difficulty;
    p.appendChild(Screens.diffPicker(d, (x) => { d = x; }));
    p.appendChild(Screens.row(
      Screens.btn(tr('Replay'), 'secondary', () => Game.replay(m.id, d)),
      info.campaign ? Screens.btn(tr('Office'), 'secondary', () => Game.toOffice()) : Screens.btn(tr('Timeline'), 'secondary', () => Game.toTimeline()),
      nx && pass ? Screens.btn(tr('Next mission'), 'default big', () => Game.openMission(nx.id)) : null
    ));
    Screens.show('results');
    Sfx.play(pass ? (m.kind === 'exam' ? 'press' : 'chord') : 'sad');
  }

  return { stage, mission };
})();
