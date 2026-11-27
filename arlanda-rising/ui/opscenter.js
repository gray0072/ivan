'use strict';

// Arlanda Rising — the Ops Center (SPEC.md "Screens"): one row per domain the airport has — its level, who or what
// does the work, the system's uptime and failures, the monthly cost (the team's wages and the licence), the fallback
// readiness as "practice" (Text.practice: its word, how fast it falls, the last drill, what a failure would mean now, the
// Drill button), the department's head (or "No head — find one", a button to Departments), and the next steps of its ladder
// (Text.ladder: a team to hire, a system to buy with its price and running cost — straight from the hands too, and from
// a team what happens to it: kept as the fallback or let go —, a team hired back beside a system), a drill; and the IT
// people and the backup power. The first tab of the bar it shares with Finance and Departments (ui/analytics.js
// InfoTabs). From the Office (key O) every button works at once; in plan time too (teams and systems after their days);
// in ops time it is to look only (Free Play's played day: everything works, ready after its nights). Opened through
// InfoTabs (game.js, ui/office.js).

const OpsCenter = (() => {
  const $ = (id) => document.getElementById(id);
  let back = null, editable = false;

  function show(opts) {
    back = opts.back; editable = !!opts.edit;
    render();
    Screens.show('opsCenter');
  }

  function who(d) {
    const lv = S.domains[d] || 0;
    if (lv === 0) return tr('You, by hand');
    if (lv === 1) return tr('A team');
    return S.sys && S.sys[d] && S.sys[d].kept ? tr('A system, with the team as the fallback') : tr('A system, no fallback');
  }

  function render() {
    const p = $('opsCenter');
    let html = Analytics.tabsHtml('ops') + '<h1>🛠️ ' + Text.esc(tr('Ops Center')) + '</h1><p class="when">' + Text.esc(fmtNow()) + '</p><table class="ops"><tr><th></th><th>' + Text.esc(tr('Level')) +
      '</th><th>' + Text.esc(tr('Uptime')) + '</th><th>' + Text.esc(tr('A month')) + '</th><th>' + Text.esc(tr('Practice')) + '</th><th class="actCol"></th></tr>';
    for (const d of Object.keys(S.domains)) {
      const lv = S.domains[d] || 0, L = DOMAINS[d].levels[lv], r = S.sys && S.sys[d];
      const jobs = People.jobs(d), wage = jobs * STAFF_MONTH * (People.has(d) ? S.people.depts[d].wageX : 1);
      const up = r && lv >= 2 && r.upMin + r.downMin > 0 ? Text.pct(r.upMin / (r.upMin + r.downMin)) + (r.fails ? ' · ' + (r.fails === 1 ? tr('1 failure') : tr('{n} failures', { n: r.fails })) : '') : '—';
      const ready = lv >= 2 && r ? Text.pct(r.readiness) + ' · ' + Text.practiceWord(r.readiness) : '—';
      // the next steps of the ladder: what they cost on their line, the buttons when it can be changed here
      let act = '';
      for (const st of Text.ladder(d)) {
        const btns = editable ? (st.acts || []).map((a) => '<button class="btn toggle" ' + a.data + '>' + Text.esc(a.label) + ' <small>' + Text.esc(a.sum) + '</small></button>').join('') : '';
        act += '<div class="lad"><small><b>' + Text.esc(st.title) + '</b>' + (st.sub ? ' · ' + Text.esc(st.sub) : '') + '</small>' + (st.wait ? '<small class="wait">' + Text.esc(st.wait) + '</small>' : '') +
          (st.notes || []).slice(0, 1).map((n) => '<small class="ladNote">' + Text.esc(n) + '</small>').join('') + (btns ? '<div class="ladActs">' + btns + '</div>' : '') +
          (st.notes || []).slice(1).map((n) => '<small class="ladNote">' + Text.esc(n) + '</small>').join('') + '</div>';
      }
      // the practice (the fallback readiness): its word, how fast it falls, the last drill, what a failure would mean, Drill
      act += Text.practice(d, editable);
      // the department's head, or none yet: Departments has the candidates
      const head = Text.headLine(d);
      const headHtml = head ? '<small>' + Text.esc(head) + (!People.manager(d) ? ' <button class="btn toggle small" data-tab="people">👥 ' + Text.esc(tr('Departments')) + '</button>' : '') + '</small>' : '';
      html += '<tr><td><b>' + DOMAINS[d].icon + ' ' + Text.esc(Text.dom(d)) + '</b><small>' + Text.esc(who(d)) + '</small>' + headHtml + (act ? '<div class="acts under">' + act + '</div>' : '') + '</td><td>' + Text.esc(tr(L.name)) + '</td><td>' + Text.esc(up) +
        '</td><td>' + sekBare(wage + (lv >= 2 ? L.month || 0 : 0)) + '</td><td>' + Text.esc(ready) + '</td><td class="actCol">' + (act ? '<div class="acts">' + act + '</div>' : '') + '</td></tr>';
    }
    html += '</table>';
    const need = Systems.itNeed();
    html += '<p>💻 ' + Text.esc(tr('IT people: {a} of {n} needed', { a: S.people ? S.people.it : 0, n: need })) + (need && Systems.itFactor() < 1 ? ' — ' + Text.esc(tr('too few: failures come more often and take longer')) : '') + '</p>' +
      '<p>🔋 ' + Text.esc(Airport.has('generator') ? tr('Backup power: the systems keep running in a power cut.') : tr('No backup power: a power cut stops every system.')) + '</p>' +
      '<p class="fine">' + Text.esc(tr('Practice (the fallback readiness) is how well the staff still know the manual way. It fades every month without a drill.')) + '</p>';
    p.innerHTML = html;
    p.appendChild(Screens.row(Screens.btn(tr('Back'), 'default', () => back())));
  }

  $('opsCenter').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    // a tab of the bar, or Departments for a head (ui/analytics.js InfoTabs)
    if (b && b.dataset.tab) { Sfx.play('click'); InfoTabs.open(b.dataset.tab); return; }
    if (!b || !editable) return;
    let done = false;
    if (b.dataset.up) done = Actions.upgrade(b.dataset.up, b.dataset.how);
    else if (b.dataset.sys) done = Actions.system(b.dataset.sys, b.dataset.how);
    else if (b.dataset.back) done = Actions.hireBack(b.dataset.back);
    else if (b.dataset.drill) done = Actions.drill(b.dataset.drill);
    if (!done) return;
    Sfx.play('chord');
    Game.keepWorld();
    render();
  });

  return { show, render };
})();
