'use strict';

// Arlanda Rising — the Departments screen (SPEC.md "Screens"; RU «Службы»): the departments (jobs, morale, fatigue, skill, absence
// today, the wage level, the union and its next round, the temps), their managers (perks, flaw, mood, a raise asked
// for) — or, in a department without one, "No head — find one" with its two candidates and Hire (why the last head
// left, and that the team keeps working), the IT people and the summer holidays; session 6: the share on furlough, the
// jobs gone and Recruit (new people at once here, after the clearance's weeks in plan time). A tab of the bar it shares
// with the Ops Center and Finance (ui/analytics.js InfoTabs), opened from the Office (key P) on the campaign's or Free
// Play's airport, where every button works at once (time is stopped), in plan time (the same, new people after their
// days), and in ops time (P, or a tab of Finance: the money or a meter in the HUD), where a head can be hired at once
// and a raise answered (the game pauses). Opened through InfoTabs (game.js, ui/office.js).

const PeopleUI = (() => {
  const $ = (id) => document.getElementById(id);
  // editable: true (everything), 'heads' (ops time: hire a head, answer a raise), false (look only)
  let back = null, editable = false;
  const can = (what) => editable === true || (editable === 'heads' && (what === 'mgr' || what === 'raise'));

  function bar(v) { return '<span class="mbar small"><i class="' + (v < 40 ? 'low' : v < 60 ? 'mid' : '') + '" style="width:' + Math.round(v) + '%"></i></span>'; }

  function show(opts) {
    back = opts.back; editable = opts.edit === 'heads' ? 'heads' : !!opts.edit;
    render();
    Screens.show('people');
  }

  function render() {
    const p = $('people');
    const pp = S.people;
    let html = Analytics.tabsHtml('people') + '<h1>👥 ' + Text.esc(tr('Departments')) + '</h1><p class="when">' + Text.esc(fmtDate(S.day)) + ' · 👷 ' + Text.esc(Text.meterName('staff')) + ': <b>' + Math.round(S.meters.staff) + '</b></p>';
    if (!pp || !Object.keys(pp.depts).some((d) => People.jobs(d) > 0)) {
      html += '<p class="fine">' + Text.esc(tr('No teams yet: every task is done by hand. Teams come with chapter 2.')) + '</p>';
    } else {
      html += '<div class="cards">';
      for (const id of Object.keys(pp.depts)) {
        const jobs = People.jobs(id);
        if (!jobs) continue;
        const d = pp.depts[id], m = pp.managers[id];
        html += '<div class="ocard"><h3>' + Text.esc(Text.dept(id)) + ' <small>' + Text.esc(Text.jobs(jobs)) + '</small></h3>' +
          '<p class="kv">' + Text.esc(tr('Morale')) + ' ' + bar(d.morale) + ' <b>' + Math.round(d.morale) + '</b></p>' +
          '<p class="kv">' + Text.esc(tr('Skill')) + ' ' + bar(d.skill) + ' <b>' + Math.round(d.skill) + '</b></p>' +
          '<p class="kv">' + Text.esc(tr('Fatigue')) + ' ' + bar(100 - d.fatigue) + ' <b>' + Math.round(d.fatigue) + '</b></p>' +
          '<p>' + Text.esc(tr('Away today: {p}', { p: Text.pct(People.absence(id)) })) + (d.temps > S.day ? ' · ' + Text.esc(tr('temps until {d}', { d: fmtDate(d.temps) })) : '') + '</p>' +
          '<p>' + Text.esc(tr('Wages: {m} a month', { m: sek(jobs * (id === 'it' ? IT_JOB : STAFF_MONTH) * d.wageX) })) + (d.wageX > 1.001 ? ' (+' + Math.round((d.wageX - 1) * 100) + ' %)' : '') + '</p>' +
          '<p>✊ ' + Text.esc(tr((DEPTS[id] || {}).union || '')) + ': ' + Text.esc(tr('mood {m}, next round {d}', { m: Math.round(d.union.mood), d: fmtDate(d.union.next) })) + '</p>';
        if (pp.strike && pp.strike.dept === id) html += '<p class="warn">' + Text.esc(tr('Strike notice: from {d}', { d: fmtDate(pp.strike.from) })) + '</p>';
        // session 6: furlough, jobs gone, new people on their way
        if (People.furloughed(id)) html += '<p>🏠 ' + Text.esc(tr('{p} on furlough until {d}', { p: Text.pct(People.furloughed(id)), d: fmtDate(d.furlough.until) })) + '</p>';
        const rh = pp.hiring.find((h) => h.dom === id && h.rehire);
        if (People.cut(id) > 0) html += '<p class="warn">' + Text.esc(tr('{p} of the jobs are empty', { p: Text.pct(People.cut(id)) })) + (rh ? ' · ' + Text.esc(tr('new people start {d}', { d: fmtDate(rh.at) })) : '') + '</p>' +
          (can('rehire') && !rh ? '<div class="btnRow small"><button class="btn toggle" data-rehire="' + id + '">📝 ' + Text.esc(tr('Recruit')) + '</button></div>' : '');
        if (m) {
          html += '<div class="mgrBox"><b>' + Text.esc(Text.manager(m.id)) + '</b> <small>' + Text.esc(tr('mood {m}', { m: Math.round(m.mood) })) + '</small><br>' +
            Text.managerLines(m.id).map((l) => '<small>' + Text.esc(l) + '</small>').join('<br>') + '</div>';
          if (pp.asks.indexOf(id) >= 0) html += '<p class="warn">' + Text.esc(tr('{name} asks for a raise of 12 %.', { name: People.mdef(m.id).name })) + '</p>' +
            (can('raise') ? '<div class="btnRow small"><button class="btn toggle" data-raise="' + id + '" data-give="1">' + Text.esc(tr('Give it')) + '</button><button class="btn toggle" data-raise="' + id + '" data-give="0">' + Text.esc(tr('Not now')) + '</button></div>' : '');
        } else if (id !== 'it' || pp.it > 0) html += noHead(id);
        if (can('train')) {
          html += '<div class="btnRow small">' +
            (d.skill < SKILL_MAX ? '<button class="btn toggle" data-train="' + id + '">🎓 ' + Text.esc(tr('Course')) + ' <small>' + sekBare(TRAIN_COST * jobs) + '</small></button>' : '') +
            (id !== 'it' && !(d.temps > S.day) ? '<button class="btn toggle" data-temps="' + id + '">🧑‍🔧 ' + Text.esc(tr('Temps')) + ' <small>' + sekBare(TEMPS_JOB * People.tempJobs(id)) + ' / ' + Text.esc(tr('month')) + '</small></button>' : '') +
            '</div>';
        }
        html += '</div>';
      }
      html += '</div>';
    }
    // IT, the summer
    if (pp) {
      html += '<div class="ocard wideCard"><p>💻 ' + Text.esc(tr('IT people: {a} of {n} needed', { a: pp.it, n: Systems.itNeed() })) +
        (can('it') ? ' <button class="btn toggle" data-it="1">+1</button> <button class="btn toggle" data-it="-1"' + (pp.it ? '' : ' disabled') + '>−1</button>' : '') + '</p>' +
        '<p>🏖️ ' + Text.esc(pp.summer === 'spread' ? tr('The July holidays are spread over the summer.') : tr('In July a third of every team is on holiday.')) +
        (can('summer') && pp.summer !== 'spread' ? ' <button class="btn toggle" data-summer="1">' + Text.esc(tr('Spread them')) + '</button>' : '') + '</p></div>';
    }
    p.innerHTML = html;
    p.appendChild(Screens.row(Screens.btn(tr('Back'), 'default', () => back())));
  }

  // a department without a head: why the last one left, that the team works on, and the two candidates with Hire
  function noHead(id) {
    const v = S.people.vacant && S.people.vacant[id], left = v && People.mdef(v.id);
    let h = '<p class="warn">👔 ' + Text.esc(tr('No head — find one')) + '</p>';
    if (left) h += '<p class="fine">' + Text.esc(v.why === 'poached' ? tr('{name} has left for another airport.', { name: left.name }) : tr('{name} has retired.', { name: left.name })) + ' ' +
      Text.esc(tr('The team keeps working — only the head\'s skill is gone.')) + '</p>';
    for (const c of People.candidates(id)) {
      const m = People.mdef(c);
      h += '<div class="mgrBox"><b>' + Text.esc(Text.manager(c)) + '</b> <small>' + Text.esc(tr('salary {m} a month', { m: sek(MANAGER_SALARY * m.salary) })) + '</small><br>' +
        Text.managerLines(c).map((l) => '<small>' + Text.esc(l) + '</small>').join('<br>') +
        (can('mgr') ? '<div class="btnRow small"><button class="btn toggle" data-mgr="' + c + '">' + Text.esc(tr('Hire')) + '</button></div>' : '') + '</div>';
    }
    if (!editable) h += '<p class="fine">' + Text.esc(tr('Heads are hired here in the Office or during a mission.')) + '</p>';
    return h;
  }

  // every change is made on the world and kept at once
  $('people').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b && b.dataset.tab) { Sfx.play('click'); InfoTabs.open(b.dataset.tab); return; }
    if (!b || !editable || !b.dataset) return;
    if (!can(b.dataset.mgr ? 'mgr' : b.dataset.raise ? 'raise' : 'other')) return;
    let done = false;
    if (b.dataset.train) done = Actions.train(b.dataset.train);
    else if (b.dataset.temps) done = Actions.temps(b.dataset.temps);
    else if (b.dataset.raise) done = Actions.raise(b.dataset.raise, b.dataset.give === '1');
    else if (b.dataset.mgr) done = Actions.manager(b.dataset.mgr);
    else if (b.dataset.it) done = Actions.hireIT(+b.dataset.it);
    else if (b.dataset.summer) done = Actions.summer('spread');
    else if (b.dataset.rehire) done = Actions.rehire(b.dataset.rehire);
    if (!done) return;
    Sfx.play('click');
    Game.keepWorld();
    Game.acted();
    render();
  });

  return { show, render };
})();
