'use strict';

// Arlanda Rising — the mission card and the card before each stage. The mission card: the year and season, Astrid's
// briefing in two or three bubbles, the goal and the two goals for ★★ and ★★★ (with the best stars so far), the
// stages and the minutes, what is new in the mission, the difficulty, Start. The stage card before play: the
// stage's name and time, its goals, and before the first stage "Meanwhile…" — what happened since the last mission.
// Used by game.js.

const SEASONS = ['Winter', 'Winter', 'Spring', 'Spring', 'Spring', 'Summer', 'Summer', 'Summer', 'Autumn', 'Autumn', 'Autumn', 'Winter'];

const MissionCard = (() => {
  const $ = (id) => document.getElementById(id);

  function show(id, replay) {
    const m = MISSION[id], p = $('missionCard');
    const day = Calendar.parse(m.date), d = Calendar.date(day);
    let diff = Game.campaignDiff(id);
    const starGoals = m.stars.map((g, i) => '<li>' + Text.stars(i + 2) + ' <span>' + Text.esc(Text.goal(g)) + '</span></li>').join('');
    p.innerHTML =
      '<div class="mcHead"><span class="chap">' + Text.esc(tr('Chapter {n}: {name}', { n: m.chapter, name: tr(CHAPTERS[m.chapter - 1].name) })) + ' · ' + m.n + '/11</span>' +
      '<h1>' + Text.esc(tr(m.name)) + '</h1><p class="when">' + Text.esc(fmtDate(day)) + ' · ' + Text.esc(tr(SEASONS[d.m - 1])) + ' · ~' + Text.minutes(m) + ' ' + Text.esc(tr('min')) + '</p></div>' +
      '<div class="astrid"><div class="face">👵</div><div class="bubbles">' + m.brief.map((b) => '<p class="bubble">' + Text.esc(tr(b)) + '</p>').join('') + '</div></div>' +
      '<div class="goalLine"><b>' + Text.stars(1) + '</b> ' + Text.esc(tr(m.aim || '')) + '</div>' +
      '<ul class="starGoals">' + starGoals + '</ul>' +
      '<p class="best">' + Text.esc(tr('Best so far:')) + ' ' + Text.stars(Progress.best(id)) + '</p>' +
      '<div class="stagesList">' + m.stages.map((s, i) => '<span class="stg">' + (s.mode === 'ops' ? '🛬' : '🏗️') + ' ' + (i + 1) + '. ' + Text.esc(tr(s.name)) + ' <small>' + Text.esc(Text.stageWhen(s)) + '</small></span>').join('') + '</div>' +
      (m.news ? '<div class="news"><p class="label">' + Text.esc(tr('New in this mission')) + '</p>' + m.news.map((n) => '<p>' + n.icon + ' ' + Text.esc(tr(n.text)) + '</p>').join('') + '</div>' : '') +
      (replay ? '<p class="fine">' + Text.esc(tr('A replay: it can earn stars, and your campaign stays as it is.')) + '</p>' : '');
    p.appendChild(Screens.diffPicker(diff, (x) => { diff = x; }));
    p.appendChild(Screens.row(Screens.btn(tr('Back'), 'secondary', () => Game.toTimeline()), Screens.btn(tr('Start'), 'default big', () => Game.startMission(id, diff))));
    Screens.show('missionCard');
  }

  // a line of "Meanwhile…" about the people and the systems (sim/missions.js MEANWHILE_NEWS)
  function news(e) {
    const mg = (id) => (MANAGERS[id] || {}).name || id;
    switch (e.type) {
      case 'settled': return tr('{dept}: a new wage deal, +{p}.', { dept: Text.dept(e.dept), p: Text.num(e.raise * 100, 1) + ' %' });
      case 'strikeNotice': return tr('{dept}: a strike notice for {d}.', { dept: Text.dept(e.dept), d: fmtDate(e.from) });
      case 'strikeOver': return tr('{dept}: the strike is over.', { dept: Text.dept(e.dept) });
      case 'poached': return tr('{name} has left for {by}.', { name: mg(e.id), by: e.by });
      case 'retired': return tr('{name} has retired. Thank you!', { name: mg(e.id) });
      case 'raiseAsk': return tr('{name} asks for a raise.', { name: mg(e.id) });
      case 'teamReady': return tr('A new team works on {dom}.', { dom: Text.dom(e.dom) });
      case 'systemLive': return tr('{sys} is live.', { sys: Text.level(e.dom, S.domains[e.dom]) });
    }
    return '';
  }

  // before each stage
  function stage() {
    const m = Missions.def(), st = Missions.stage(), i = S.mission.stage, p = $('stageIntro');
    let html = '<p class="chap">' + Text.esc(tr(m.name)) + ' · ' + Text.esc(tr('Stage {i} of {n}', { i: i + 1, n: m.stages.length })) + '</p>' +
      '<h1>' + (st.mode === 'ops' ? '🛬 ' : '🏗️ ') + Text.esc(tr(st.name)) + '</h1><p class="when">' + Text.esc(fmtDate(S.day)) + ' · ' + Text.esc(Text.stageWhen(st)) + '</p>';
    const mw = S.mission.meanwhile;
    if (i === 0 && mw && mw.to - mw.from > 3) {
      const months = Math.max(1, Math.round((mw.to - mw.from) / 30.4));
      html += '<div class="meanwhile"><b>' + Text.esc(tr('Meanwhile…')) + '</b><p>' + Text.esc(tr('{n} months have passed since your last mission.', { n: months })) + ' ' +
        (mw.flights > 0 ? Text.esc(tr('About {f} flights came and went, with {p} passengers.', { f: Math.round(mw.flights), p: groupThousands(Math.round(mw.pax)) })) + ' ' : '') +
        Text.esc(tr('Money: {a} → {b}.', { a: sek(mw.money0), b: sek(mw.money1) })) +
        (mw.ownerLoan ? ' ' + Text.esc(tr('The owner lent you {m} to start with.', { m: sek(mw.ownerLoan) })) : '') + '</p>' +
        (mw.news || []).map((e) => '<p>• ' + Text.esc(news(e)) + '</p>').join('') + '</div>';
    }
    if (st.mode === 'ops' && S.ops) {
      const notes = [];
      if (S.ops.strike) notes.push('✊ ' + tr('{dept} is on strike today.', { dept: Text.dept(S.ops.strike) }));
      for (const d of Object.keys(S.ops.absence || {})) if (People.jobs(d) && Systems.working(d) === 1 && People.capacity(d) < 0.95 && S.ops.strike !== d) notes.push('🤒 ' + tr('{dept}: {p} away today.', { dept: Text.dept(d), p: Text.pct(S.ops.absence[d]) }));
      if (notes.length) html += '<div class="meanwhile">' + notes.map((n) => '<p>' + Text.esc(n) + '</p>').join('') + '</div>';
    }
    const goals = Goals.all(st.goal, S.mission.st);
    html += goals.length ? '<p class="label">' + Text.esc(tr('Goals of this stage')) + '</p><ul class="goals plain">' + goals.map((g) => '<li>' + Text.esc(Text.goal(g.goal)) + '</li>').join('') + '</ul>'
      : '<p class="fine">' + Text.esc(tr('No goal in this stage: get ready for the next one.')) + '</p>';
    if (st.mode === 'plan') html += '<p class="fine">' + Text.esc(tr('One day passes every second. Start the jobs in the panel on the right.')) + '</p>';
    else html += '<p class="fine">' + Text.esc(tr('One hour takes about a minute. Do the tasks in the tray on the left.')) + '</p>';
    p.innerHTML = html;
    p.appendChild(Screens.row(Screens.btn(tr('Go!'), 'default big', () => Game.play())));
    Screens.show('stageIntro');
  }

  return { show, stage };
})();
