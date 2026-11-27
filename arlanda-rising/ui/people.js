'use strict';

// Arlanda Rising — the Departments screen (SPEC.md "Screens", spec/people.md; RU «Службы»): the departments (jobs,
// morale, fatigue, skill, absence today, the wage level, the union and its next round, the temps); who does the work —
// the team (Dismiss, paid: the domain back to the hands), the fallback team beside a system (Dismiss) or none (Hire a
// team as the fallback) — and the system's practice (Text.practice: the fallback readiness as a word, how fast it falls,
// the last drill, what a failure would mean now, Drill); their heads (perks, flaw, mood, a raise asked for, when they
// retire, Dismiss, Find a replacement → after HEAD_SEARCH_DAYS two candidates, or keep the head) — or, in a department
// without one, "No head — find one" with its two candidates and Hire (why the last head left, and that the team keeps
// working); the work still done by hand with Hire; the IT people (+1, −1 paid) and the summer holidays; session 6: the
// share on furlough, the jobs gone and Recruit. Every dismissal shows its price and takes a second tap within
// SELL_CONFIRM_MS. A tab of the bar it shares with the Ops Center and Finance (ui/analytics.js InfoTabs), opened from
// the Office (key P) on the campaign's or Free Play's airport, where every button works at once (time is stopped), in
// plan time (the same, new people after their days), and in ops time (P, or a tab of Finance: the money or a meter in
// the HUD), where a head can be hired (or a found candidate taken) at once and a raise answered (the game pauses).
// Free Play's played day is plan time too: everything works, and what takes days says the nights (Text.days, readyIn).
// Opened through InfoTabs (game.js, ui/office.js).

const PeopleUI = (() => {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => Text.esc(s);
  // editable: true (everything), 'heads' (ops time: hire a head, answer a raise), false (look only)
  let back = null, editable = false;
  const can = (what) => editable === true || (editable === 'heads' && (what === 'mgr' || what === 'raise'));
  // the destructive button waiting for its second tap, and since when
  let armed = null, armedAt = 0;

  function bar(v) { return '<span class="mbar small"><i class="' + (v < 40 ? 'low' : v < 60 ? 'mid' : '') + '" style="width:' + Math.round(v) + '%"></i></span>'; }
  // a price on a button: the sum short, or "no severance"
  const price = (m) => m ? sekBare(m) : tr('no severance');
  // a button that lets people go: its price on it; the first tap arms it ("Tap again: …"), a second within
  // SELL_CONFIRM_MS does it
  function danger(key, label, m) {
    const on = armed === key && performance.now() - armedAt < SELL_CONFIRM_MS;
    return '<button class="btn toggle' + (on ? ' confirm' : '') + '" data-arm="' + key + '">🚪 ' + esc(on ? tr('Tap again: {what}', { what: label }) : label) + ' <small>' + esc(price(m)) + '</small></button>';
  }

  function show(opts) {
    back = opts.back; editable = opts.edit === 'heads' ? 'heads' : !!opts.edit;
    armed = null;
    render();
    Screens.show('people');
  }

  function render() {
    const p = $('people');
    const pp = S.people;
    let html = Analytics.tabsHtml('people') + '<h1>👥 ' + esc(tr('Departments')) + '</h1><p class="when">' + esc(fmtNow()) + ' · 👷 ' + esc(Text.meterName('staff')) + ': <b>' + Math.round(S.meters.staff) + '</b></p>';
    if (!pp || !Object.keys(pp.depts).some((d) => People.jobs(d) > 0)) {
      html += '<p class="fine">' + esc(tr('No teams yet: every task is done by hand. Teams come with chapter 2.')) + '</p>';
    } else {
      html += '<div class="cards">';
      for (const id of Object.keys(pp.depts)) {
        const jobs = People.jobs(id);
        if (!jobs) continue;
        const d = pp.depts[id], m = pp.managers[id];
        html += '<div class="ocard"><h3>' + esc(Text.dept(id)) + ' <small>' + esc(Text.jobs(jobs)) + '</small></h3>' +
          '<p class="kv">' + esc(tr('Morale')) + ' ' + bar(d.morale) + ' <b>' + Math.round(d.morale) + '</b></p>' +
          '<p class="kv">' + esc(tr('Skill')) + ' ' + bar(d.skill) + ' <b>' + Math.round(d.skill) + '</b></p>' +
          '<p class="kv">' + esc(tr('Fatigue')) + ' ' + bar(100 - d.fatigue) + ' <b>' + Math.round(d.fatigue) + '</b></p>' +
          '<p>' + esc(tr('Away today: {p}', { p: Text.pct(People.absence(id)) })) + (d.temps > S.day ? ' · ' + esc(tr('temps until {d}', { d: fmtDate(d.temps) })) : '') + '</p>' +
          '<p>' + esc(tr('Wages: {m} a month', { m: sek(jobs * (id === 'it' ? IT_JOB : STAFF_MONTH) * d.wageX) })) + (d.wageX > 1.001 ? ' (+' + Math.round((d.wageX - 1) * 100) + ' %)' : '') + '</p>' +
          '<p>✊ ' + esc(tr((DEPTS[id] || {}).union || '')) + ': ' + esc(tr('mood {m}, next round {d}', { m: Math.round(d.union.mood), d: fmtDate(d.union.next) })) + '</p>';
        if (pp.strike && pp.strike.dept === id) html += '<p class="warn">' + esc(tr('Strike notice: from {d}', { d: fmtDate(pp.strike.from) })) + '</p>';
        // session 6: furlough, jobs gone, new people on their way
        if (People.furloughed(id)) html += '<p>🏠 ' + esc(tr('{p} on furlough until {d}', { p: Text.pct(People.furloughed(id)), d: fmtDate(d.furlough.until) })) + '</p>';
        const rh = pp.hiring.find((h) => h.dom === id && h.rehire);
        if (People.cut(id) > 0) html += '<p class="warn">' + esc(tr('{p} of the jobs are empty', { p: Text.pct(People.cut(id)) })) + (rh ? ' · ' + esc(newPeople(rh.at)) : '') + '</p>' +
          (can('rehire') && !rh ? '<div class="btnRow small"><button class="btn toggle" data-rehire="' + id + '">📝 ' + esc(tr('Recruit')) + '</button></div>' : '');
        if (id !== 'it' && DOMAINS[id]) html += work(id) + Text.practice(id, can('drill'));
        if (m) html += head(id, m);
        else if (id !== 'it' || pp.it > 0) html += noHead(id);
        if (can('train')) {
          html += '<div class="btnRow small">' +
            (d.skill < SKILL_MAX ? '<button class="btn toggle" data-train="' + id + '">🎓 ' + esc(tr('Course')) + ' <small>' + sekBare(TRAIN_COST * jobs) + '</small></button>' : '') +
            (id !== 'it' && !(d.temps > S.day) ? '<button class="btn toggle" data-temps="' + id + '">🧑‍🔧 ' + esc(tr('Temps')) + ' <small>' + sekBare(TEMPS_JOB * People.tempJobs(id)) + ' / ' + esc(tr('month')) + '</small></button>' : '') +
            '</div>';
        }
        html += '</div>';
      }
      html += '</div>';
    }
    html += byHand();
    // IT, the summer
    if (pp) {
      const need = Systems.itNeed();
      html += '<div class="ocard wideCard"><p>💻 ' + esc(tr('IT people: {a} of {n} needed', { a: pp.it, n: need })) + (need && Systems.itFactor() < 1 ? ' — ' + esc(tr('too few: failures come more often and take longer')) : '') + '</p>' +
        (can('it') ? '<div class="btnRow small"><button class="btn toggle" data-it="1">+1 <small>' + sekBare(HIRE_COST) + '</small></button>' +
          (pp.it ? danger('it', tr('Let one go'), People.itCutPrice(1)) : '') + '</div>' +
          (pp.it ? '<p class="fine">' + esc(tr('One let go is paid {n} months of wages; IT\'s morale drops a little.', { n: LAYOFF_PAY_MONTHS }) + (pp.it === 1 && pp.managers.it ? ' ' + tr('The last one goes with the head of IT.') : '')) + '</p>' : '') : '') +
        '<p>🏖️ ' + esc(pp.summer === 'spread' ? tr('The July holidays are spread over the summer.') : tr('In July a third of every team is on holiday.')) +
        (can('summer') && pp.summer !== 'spread' ? ' <button class="btn toggle" data-summer="1">' + esc(tr('Spread them')) + '</button>' : '') + '</p></div>';
    }
    p.innerHTML = html;
    p.appendChild(Screens.row(Screens.btn(tr('Back'), 'default', () => back())));
  }

  // when the jobs filled again start: the day — in Free Play the nights to the dawn they start by (Free.nights)
  function newPeople(at) {
    if (!S.free) return tr('new people start {d}', { d: fmtDate(at) });
    const n = Free.nights(Math.max(0, at - S.day));
    return n === 1 ? tr('new people start tomorrow') : tr('new people start in {n} nights', { n });
  }

  // who does a domain's work: the team (Dismiss: the work back to the hands), the fallback team beside a system
  // (Dismiss: a failure then comes to the tray), or no fallback (Hire a team as the fallback)
  function work(id) {
    const lv = S.domains[id] || 0, L1 = DOMAINS[id].levels[1], r = S.sys && S.sys[id];
    const kind = People.teamKind(id), hiring = S.people.hiring.find((h) => h.dom === id && h.back);
    const layoff = tr('Pays {n} months of wages a job; every team\'s morale −{m}, the unions angrier, the neighbours unhappy.', { n: LAYOFF_PAY_MONTHS, m: LAYOFF_MORALE });
    let h = '';
    if (kind === 'team') {
      const m = People.manager(id);
      h += '<p>👷 ' + esc(tr('A team does the work: {what}', { what: tr(L1.name) })) + '</p>';
      if (can('dismiss') && !People.dismissCannot(id)) {
        h += '<div class="btnRow small">' + danger('team:' + id, tr('Dismiss the team'), People.dismissPrice(id)) + '</div>' +
          '<p class="fine">' + esc(tr('The work comes back to you, by hand.') + (m ? ' ' + tr('{name}, its head, goes too.', { name: People.mdef(m.id).name }) : '') + ' ' + layoff) + '</p>';
      }
    } else if (kind === 'fallback') {
      h += '<p>👷 ' + esc(tr('Fallback team: {jobs} — takes over when the system fails', { jobs: Text.jobs(People.teamJobs(id)) })) + '</p>';
      if (can('dismiss') && !People.dismissCannot(id)) {
        h += '<div class="btnRow small">' + danger('team:' + id, tr('Dismiss the fallback team'), People.dismissPrice(id)) + '</div>' +
          '<p class="fine">' + esc(tr('Then a failure brings the work to you.') + ' ' + layoff) + '</p>';
      }
    } else if (lv >= 2 && L1 && L1.staff) {
      if (hiring) h += '<p>👷 ' + esc(tr('A team as the fallback') + ' · ' + Text.readyIn(Math.max(0, hiring.at - S.day))) + '</p>';
      else {
        h += '<p class="warn">👷 ' + esc(tr('No team as the fallback') + ' — ' + tr('When the system fails, the work comes to you.')) + '</p>';
        if (can('hire') && People.canHireBack(id)) h += '<div class="btnRow small"><button class="btn toggle" data-back="' + id + '">' + esc(r && r.laidOff ? tr('Hire a team back') : tr('Hire a team as the fallback')) +
          ' <small>' + sekBare(HIRE_COST * L1.staff) + ' · ' + esc(Text.days(S.plan ? People.hireDays(id) : 0)) + '</small></button></div>';
      }
    }
    return h;
  }

  // the domains still worked by hand that a team can take now (or one is on its way): Hire, its jobs, price and days
  function byHand() {
    const list = Object.keys(S.domains).filter((d) => !(S.domains[d] || 0) && ((S.unlock || {})[d] || 0) >= 1 && DOMAINS[d].levels[1] && DOMAINS[d].levels[1].staff &&
      Calendar.year() >= DOMAINS[d].levels[1].from && !(DEPTS[d] || {}).police && !(S.sys && S.sys[d] && S.sys[d].installAt));
    if (!list.length) return '';
    let h = '<div class="ocard wideCard"><h3>✋ ' + esc(tr('Done by hand')) + '</h3>';
    for (const d of list) {
      const L1 = DOMAINS[d].levels[1], hiring = S.people && S.people.hiring.find((x) => x.dom === d);
      h += '<p>' + DOMAINS[d].icon + ' <b>' + esc(Text.dom(d)) + '</b> · ' + esc(tr('Hire: {what}', { what: tr(L1.name) }) + ' · ' + Text.jobs(L1.staff)) +
        (hiring ? ' · ' + esc(Text.readyIn(Math.max(0, hiring.at - S.day))) :
          can('hire') && !Systems.cannot(d, 1) ? ' <button class="btn toggle" data-up="' + d + '">' + esc(tr('Hire')) + ' <small>' + sekBare(Systems.price(d, 'keep', 1)) + ' · ' + esc(Text.days(S.plan ? People.hireDays(d) : 0)) + '</small></button>' : '') + '</p>';
    }
    return h + '<p class="fine">' + esc(tr('A team does these tasks for wages every month; systems are bought in the Ops Center.')) + '</p></div>';
  }

  // a head: perks and flaw, mood, when they retire, a raise asked; Dismiss and Find a replacement, a search on its way,
  // or its two candidates (Hire instead, or keep the head)
  function head(id, m) {
    const pp = S.people, def = People.mdef(m.id), s = People.searching(id);
    let h = '<div class="mgrBox"><b>' + esc(Text.manager(m.id)) + '</b> <small>' + esc(tr('mood {m}', { m: Math.round(m.mood) })) + ' · ' + esc(tr('salary {m} a month', { m: sek(MANAGER_SALARY * m.salaryX) })) + '</small><br>' +
      Text.managerLines(m.id).map((l) => '<small>' + esc(l) + '</small>').join('<br>') + '<br><small>⏳ ' + esc(Text.retire(id)) + '</small></div>';
    if (pp.asks.indexOf(id) >= 0) h += '<p class="warn">' + esc(tr('{name} asks for a raise of 12 %.', { name: def.name })) + '</p>' +
      (can('raise') ? '<div class="btnRow small"><button class="btn toggle" data-raise="' + id + '" data-give="1">' + esc(tr('Give it')) + '</button><button class="btn toggle" data-raise="' + id + '" data-give="0">' + esc(tr('Not now')) + '</button></div>' : '');
    const pay = People.headPay(id);
    if (s && s.cands) {
      h += '<p class="warn">🔍 ' + esc(tr('The search found two candidates. Take one, or keep {name}.', { name: def.name })) + '</p>' +
        '<p class="fine">' + esc(pay ? tr('Taking one pays {name} {n} months of salary.', { name: def.name, n: HEAD_PAY_MONTHS }) : tr('Close to retiring: leaves on the pension, no severance.')) + '</p>';
      for (const c of s.cands) {
        const cm = People.mdef(c);
        h += '<div class="mgrBox"><b>' + esc(Text.manager(c)) + '</b> <small>' + esc(tr('salary {m} a month', { m: sek(MANAGER_SALARY * cm.salary) })) + '</small><br>' +
          Text.managerLines(c).map((l) => '<small>' + esc(l) + '</small>').join('<br>') +
          (can('mgr') ? '<div class="btnRow small"><button class="btn toggle" data-pick="' + c + '" data-dept="' + id + '">' + esc(tr('Hire instead of {name}', { name: def.name })) + ' <small>' + esc(price(pay)) + '</small></button></div>' : '') + '</div>';
      }
      if (can('mgr')) h += '<div class="btnRow small"><button class="btn toggle" data-keep="' + id + '">' + esc(tr('Keep {name}', { name: def.name })) + '</button></div>';
    } else if (s) {
      // Free Play: the nights to the dawn the candidates come by (the days run at night)
      const nn = S.free ? Free.nights(Math.max(0, s.at - S.day)) : 0;
      h += '<p>🔍 ' + esc(!S.free ? tr('A search is on: two candidates in {t} ({d}). {name} keeps working.', { t: Text.span(s.at - S.day), d: fmtDate(s.at), name: def.name }) :
        nn === 1 ? tr('A search is on: two candidates tomorrow. {name} keeps working.', { name: def.name }) : tr('A search is on: two candidates in {n} nights. {name} keeps working.', { n: nn, name: def.name })) + '</p>' +
        (S.free ? '' : '<p class="fine">' + esc(tr('The days run in plan time and between missions; a stage of a day stops them.')) + '</p>') +
        (can('dismiss') ? '<div class="btnRow small"><button class="btn toggle" data-keep="' + id + '">' + esc(tr('Keep {name}, drop the search', { name: def.name })) + '</button></div>' : '');
    } else if (can('dismiss')) {
      h += '<div class="btnRow small">' + danger('head:' + id, tr('Dismiss'), pay) +
        '<button class="btn toggle" data-search="' + id + '">🔍 ' + esc(tr('Find a replacement')) + ' <small>' + sekBare(HEAD_SEARCH_COST) + ' · ' + esc(S.free ? Text.days(HEAD_SEARCH_DAYS) : Text.span(HEAD_SEARCH_DAYS)) + '</small></button></div>' +
        '<p class="fine">' + esc((pay ? tr('Dismissing pays {n} months of salary; the team works on without a head.', { n: HEAD_PAY_MONTHS }) : tr('Close to retiring: leaves on the pension, no severance.')) + ' ' +
          tr('A search takes {t}; {name} works on meanwhile.', { t: S.free ? Text.days(HEAD_SEARCH_DAYS) : Text.span(HEAD_SEARCH_DAYS), name: def.name })) + '</p>';
    }
    return h;
  }

  // a department without a head: why the last one left, that the team works on, and the two candidates with Hire
  function noHead(id) {
    const v = S.people.vacant && S.people.vacant[id], left = v && People.mdef(v.id);
    let h = '<p class="warn">👔 ' + esc(tr('No head — find one')) + '</p>';
    if (left) h += '<p class="fine">' + esc(v.why === 'poached' ? tr('{name} has left for another airport.', { name: left.name }) : v.why === 'dismissed' ? tr('{name} was dismissed.', { name: left.name }) : tr('{name} has retired.', { name: left.name })) + ' ' +
      esc(tr('The team keeps working — only the head\'s skill is gone.')) + '</p>';
    for (const c of People.candidates(id)) {
      const m = People.mdef(c);
      h += '<div class="mgrBox"><b>' + esc(Text.manager(c)) + '</b> <small>' + esc(tr('salary {m} a month', { m: sek(MANAGER_SALARY * m.salary) })) + '</small><br>' +
        Text.managerLines(c).map((l) => '<small>' + esc(l) + '</small>').join('<br>') +
        (can('mgr') ? '<div class="btnRow small"><button class="btn toggle" data-mgr="' + c + '">' + esc(tr('Hire')) + '</button></div>' : '') + '</div>';
    }
    if (!editable) h += '<p class="fine">' + esc(tr('Heads are hired here in the Office or during a mission.')) + '</p>';
    return h;
  }

  // what a destructive button does on its second tap
  function doArmed(key) {
    const [what, id] = key.split(':');
    if (what === 'it') return Actions.hireIT(-1);
    if (what === 'team') return Actions.dismiss(id);
    if (what === 'head') return Actions.dismissHead(id);
    return false;
  }

  // every change is made on the world and kept at once
  $('people').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b && b.dataset.tab) { Sfx.play('click'); InfoTabs.open(b.dataset.tab); return; }
    if (!b || !editable || !b.dataset) return;
    const ds = b.dataset;
    // in ops time ('heads') only a head hired, a found candidate taken or the head kept after a search, a raise answered
    const what = ds.mgr || ds.pick || (ds.keep && (People.searching(ds.keep) || {}).cands) ? 'mgr' : ds.raise ? 'raise' : 'other';
    if (!can(what)) return;
    // a dismissal: the first tap arms it, the second (within SELL_CONFIRM_MS) does it
    if (ds.arm) {
      Sfx.play('click');
      if (armed === ds.arm && performance.now() - armedAt < SELL_CONFIRM_MS) {
        armed = null;
        if (doArmed(ds.arm)) { Sfx.play('coins'); Game.keepWorld(); Game.acted(); }
      } else {
        const key = ds.arm;
        armed = key; armedAt = performance.now();
        setTimeout(() => { if (armed === key) { armed = null; if (!$('people').hidden) render(); } }, SELL_CONFIRM_MS);
      }
      render();
      return;
    }
    let done = false;
    if (ds.train) done = Actions.train(ds.train);
    else if (ds.temps) done = Actions.temps(ds.temps);
    else if (ds.raise) done = Actions.raise(ds.raise, ds.give === '1');
    else if (ds.mgr) done = Actions.manager(ds.mgr);
    else if (ds.pick) done = Actions.pickHead(ds.dept, ds.pick);
    else if (ds.keep) done = Actions.dropSearch(ds.keep);
    else if (ds.search) done = Actions.search(ds.search);
    else if (ds.it) done = Actions.hireIT(+ds.it);
    else if (ds.summer) done = Actions.summer('spread');
    else if (ds.rehire) done = Actions.rehire(ds.rehire);
    else if (ds.back) done = Actions.hireBack(ds.back);
    else if (ds.up) done = Actions.upgrade(ds.up, 'keep');
    else if (ds.drill) done = Actions.drill(ds.drill);
    if (!done) return;
    Sfx.play('click');
    Game.keepWorld();
    Game.acted();
    render();
  });

  return { show, render };
})();
