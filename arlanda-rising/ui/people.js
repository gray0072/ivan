'use strict';

// Arlanda Rising — the People screen (SPEC.md "Screens"): the departments (jobs, morale, fatigue, skill, absence
// today, the wage level, the union and its next round, the temps), their managers (perks, flaw, mood, a raise asked
// for), the managers' candidates in pairs for a team without a head, the IT people and the summer holidays. Opened
// from the Office (key P) on the campaign's or Free Play's airport, where every button works at once (time is
// stopped), or during play to look only (the game pauses). Used by game.js and ui/office.js.

const PeopleUI = (() => {
  const $ = (id) => document.getElementById(id);
  let back = null, editable = false;

  function bar(v) { return '<span class="mbar small"><i class="' + (v < 40 ? 'low' : v < 60 ? 'mid' : '') + '" style="width:' + Math.round(v) + '%"></i></span>'; }

  function show(opts) {
    back = opts.back; editable = !!opts.edit;
    render();
    Screens.show('people');
  }

  function render() {
    const p = $('people');
    const pp = S.people;
    let html = '<h1>👥 ' + Text.esc(tr('People')) + '</h1><p class="when">' + Text.esc(fmtDate(S.day)) + ' · 👷 ' + Text.esc(Text.meterName('staff')) + ': <b>' + Math.round(S.meters.staff) + '</b></p>';
    if (!pp || !Object.keys(pp.depts).some((d) => People.jobs(d) > 0)) {
      html += '<p class="fine">' + Text.esc(tr('No teams yet: every task is done by hand. Teams come with chapter 2.')) + '</p>';
    } else {
      html += '<div class="cards">';
      for (const id of Object.keys(pp.depts)) {
        const jobs = People.jobs(id);
        if (!jobs) continue;
        const d = pp.depts[id], m = pp.managers[id];
        html += '<div class="ocard"><h3>' + Text.esc(Text.dept(id)) + ' <small>' + Text.esc(tr('{n} jobs', { n: jobs })) + '</small></h3>' +
          '<p class="kv">' + Text.esc(tr('Morale')) + ' ' + bar(d.morale) + ' <b>' + Math.round(d.morale) + '</b></p>' +
          '<p class="kv">' + Text.esc(tr('Skill')) + ' ' + bar(d.skill) + ' <b>' + Math.round(d.skill) + '</b></p>' +
          '<p class="kv">' + Text.esc(tr('Fatigue')) + ' ' + bar(100 - d.fatigue) + ' <b>' + Math.round(d.fatigue) + '</b></p>' +
          '<p>' + Text.esc(tr('Away today: {p}', { p: Text.pct(People.absence(id)) })) + (d.temps > S.day ? ' · ' + Text.esc(tr('temps until {d}', { d: fmtDate(d.temps) })) : '') + '</p>' +
          '<p>' + Text.esc(tr('Wages: {m} a month', { m: sek(jobs * (id === 'it' ? IT_JOB : STAFF_MONTH) * d.wageX) })) + (d.wageX > 1.001 ? ' (+' + Math.round((d.wageX - 1) * 100) + ' %)' : '') + '</p>' +
          '<p>✊ ' + Text.esc(tr((DEPTS[id] || {}).union || '')) + ': ' + Text.esc(tr('mood {m}, next round {d}', { m: Math.round(d.union.mood), d: fmtDate(d.union.next) })) + '</p>';
        if (pp.strike && pp.strike.dept === id) html += '<p class="warn">' + Text.esc(tr('Strike notice: from {d}', { d: fmtDate(pp.strike.from) })) + '</p>';
        if (m) {
          html += '<div class="mgrBox"><b>' + Text.esc(Text.manager(m.id)) + '</b> <small>' + Text.esc(tr('mood {m}', { m: Math.round(m.mood) })) + '</small><br>' +
            Text.managerLines(m.id).map((l) => '<small>' + Text.esc(l) + '</small>').join('<br>') + '</div>';
          if (pp.asks.indexOf(id) >= 0) html += '<p class="warn">' + Text.esc(tr('{name} asks for a raise of 12 %.', { name: MANAGERS[m.id].name })) + '</p>' +
            (editable ? '<div class="btnRow small"><button class="btn toggle" data-raise="' + id + '" data-give="1">' + Text.esc(tr('Give it')) + '</button><button class="btn toggle" data-raise="' + id + '" data-give="0">' + Text.esc(tr('Not now')) + '</button></div>' : '');
        }
        if (editable) {
          html += '<div class="btnRow small">' +
            (d.skill < SKILL_MAX ? '<button class="btn toggle" data-train="' + id + '">🎓 ' + Text.esc(tr('Course')) + ' <small>' + sek(TRAIN_COST * jobs) + '</small></button>' : '') +
            (id !== 'it' && !(d.temps > S.day) ? '<button class="btn toggle" data-temps="' + id + '">🧑‍🔧 ' + Text.esc(tr('Temps')) + ' <small>' + sek(TEMPS_JOB * People.tempJobs(id)) + ' / ' + Text.esc(tr('month')) + '</small></button>' : '') +
            '</div>';
        }
        html += '</div>';
      }
      html += '</div>';
    }
    // candidates for a team without a head, two at a time
    const year = Calendar.year();
    const open = Object.keys(DEPTS).filter((d) => People.jobs(d) > 0 && !(pp && pp.managers[d]));
    const pairs = open.map((d) => Object.keys(MANAGERS).filter((id) => MANAGERS[id].dept === d && MANAGERS[id].from <= year).slice(0, 2)).filter((c) => c.length);
    if (pairs.length) {
      html += '<p class="label">' + Text.esc(tr('Candidates')) + '</p><div class="cards">';
      for (const c of pairs) {
        for (const id of c) {
          const m = MANAGERS[id];
          html += '<div class="ocard"><h3>' + Text.esc(Text.manager(id)) + ' <small>' + Text.esc(Text.dept(m.dept)) + '</small></h3>' +
            Text.managerLines(id).map((l) => '<p>' + Text.esc(l) + '</p>').join('') + '<p>' + Text.esc(tr('salary {m} a month', { m: sek(MANAGER_SALARY * m.salary) })) + '</p>' +
            (editable ? '<button class="btn toggle" data-mgr="' + id + '">' + Text.esc(tr('Hire')) + '</button>' : '') + '</div>';
        }
      }
      html += '</div>';
    }
    // IT, the summer
    if (pp) {
      html += '<div class="ocard wideCard"><p>💻 ' + Text.esc(tr('IT people: {a} of {n} needed', { a: pp.it, n: Systems.itNeed() })) +
        (editable ? ' <button class="btn toggle" data-it="1">+1</button> <button class="btn toggle" data-it="-1"' + (pp.it ? '' : ' disabled') + '>−1</button>' : '') + '</p>' +
        '<p>🏖️ ' + Text.esc(pp.summer === 'spread' ? tr('The July holidays are spread over the summer.') : tr('In July a third of every team is on holiday.')) +
        (editable && pp.summer !== 'spread' ? ' <button class="btn toggle" data-summer="1">' + Text.esc(tr('Spread them')) + '</button>' : '') + '</p></div>';
    }
    p.innerHTML = html;
    p.appendChild(Screens.row(Screens.btn(tr('Back'), 'default', () => back())));
  }

  // every change is made on the world and kept at once
  $('people').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || !editable || !b.dataset) return;
    let done = false;
    if (b.dataset.train) done = Actions.train(b.dataset.train);
    else if (b.dataset.temps) done = Actions.temps(b.dataset.temps);
    else if (b.dataset.raise) done = Actions.raise(b.dataset.raise, b.dataset.give === '1');
    else if (b.dataset.mgr) done = Actions.manager(b.dataset.mgr);
    else if (b.dataset.it) done = Actions.hireIT(+b.dataset.it);
    else if (b.dataset.summer) done = Actions.summer('spread');
    if (!done) return;
    Sfx.play('click');
    Game.keepWorld();
    render();
  });

  return { show, render };
})();
