'use strict';

// Arlanda Rising — the Ops Center (SPEC.md "Screens"): one row per domain the airport has — its level, who or what
// does the work, the system's uptime and failures, the monthly cost (the team's wages and the licence), the fallback
// readiness, and the next level with its price and running cost (a team to hire, a system to put in: keep the team
// as the fallback or let it go), a drill; and the IT people and the backup power. From the Office (key O) every
// button works at once; during play it is to look only. Used by game.js and ui/office.js.

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
    let html = '<h1>🛠️ ' + Text.esc(tr('Ops Center')) + '</h1><p class="when">' + Text.esc(fmtDate(S.day)) + '</p><table class="ops"><tr><th></th><th>' + Text.esc(tr('Level')) +
      '</th><th>' + Text.esc(tr('Uptime')) + '</th><th>' + Text.esc(tr('A month')) + '</th><th>' + Text.esc(tr('Readiness')) + '</th><th class="actCol"></th></tr>';
    for (const d of Object.keys(S.domains)) {
      const lv = S.domains[d] || 0, L = DOMAINS[d].levels[lv], r = S.sys && S.sys[d];
      const jobs = People.jobs(d), wage = jobs * STAFF_MONTH * (People.has(d) ? S.people.depts[d].wageX : 1);
      const up = r && lv >= 2 && r.upMin + r.downMin > 0 ? Text.pct(r.upMin / (r.upMin + r.downMin)) + (r.fails ? ' · ' + (r.fails === 1 ? tr('1 failure') : tr('{n} failures', { n: r.fails })) : '') : '—';
      const ready = lv >= 2 ? Text.pct(r ? r.readiness : 1) : '—';
      let act = '';
      if (editable) {
        const next = DOMAINS[d].levels[lv + 1], why = Systems.cannot(d), unlocked = ((S.unlock || {})[d] || 0) >= lv + 1;
        if (next && !why && unlocked) {
          if (lv === 0) act += '<button class="btn toggle" data-up="' + d + '" data-how="keep">' + Text.esc(tr('Hire: {what}', { what: tr(next.name) })) + ' <small>' + sekBare(Systems.price(d)) + '</small></button>';
          else act += '<button class="btn toggle" data-up="' + d + '" data-how="keep">' + Text.esc(tr('{what}, keep the team', { what: tr(next.name) })) + ' <small>' + sekBare(Systems.price(d, 'keep')) + '</small></button>' +
            (lv === 1 ? '<button class="btn toggle" data-up="' + d + '" data-how="layoff">' + Text.esc(tr('… let it go')) + ' <small>' + sekBare(Systems.price(d, 'layoff')) + '</small></button>' : '');
        } else if (next && unlocked && why === 'room') act += '<small class="wait">' + Text.esc(tr('Needs the computer room')) + '</small>';
        else if (next && unlocked && why === 'hall') act += '<small class="wait">' + Text.esc(tr('Needs the baggage hall')) + '</small>';
        else if (next && unlocked && why === 'pads') act += '<small class="wait">' + Text.esc(tr('Needs the remote de-icing pads')) + '</small>';
        if (lv >= 2 && r && r.readiness < 1) act += '<button class="btn toggle" data-drill="' + d + '">' + Text.esc(tr('Drill')) + ' <small>' + sekBare(DRILL_COST) + '</small></button>';
      }
      html += '<tr><td><b>' + DOMAINS[d].icon + ' ' + Text.esc(Text.dom(d)) + '</b><small>' + Text.esc(who(d)) + '</small>' + (act ? '<div class="acts under">' + act + '</div>' : '') + '</td><td>' + Text.esc(tr(L.name)) + '</td><td>' + Text.esc(up) +
        '</td><td>' + sekBare(wage + (lv >= 2 ? L.month || 0 : 0)) + '</td><td>' + Text.esc(ready) + '</td><td class="actCol">' + (act ? '<div class="acts">' + act + '</div>' : '') + '</td></tr>';
    }
    html += '</table>';
    const need = Systems.itNeed();
    html += '<p>💻 ' + Text.esc(tr('IT people: {a} of {n} needed', { a: S.people ? S.people.it : 0, n: need })) + (need && Systems.itFactor() < 1 ? ' — ' + Text.esc(tr('too few: failures come more often and take longer')) : '') + '</p>' +
      '<p>🔋 ' + Text.esc(Airport.has('generator') ? tr('Backup power: the systems keep running in a power cut.') : tr('No backup power: a power cut stops every system.')) + '</p>' +
      '<p class="fine">' + Text.esc(tr('Readiness is how well the staff still know the manual way. It fades every month without a drill.')) + '</p>';
    p.innerHTML = html;
    p.appendChild(Screens.row(Screens.btn(tr('Back'), 'default', () => back())));
  }

  $('opsCenter').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || !editable) return;
    let done = false;
    if (b.dataset.up) done = Actions.upgrade(b.dataset.up, b.dataset.how);
    else if (b.dataset.drill) done = Actions.drill(b.dataset.drill);
    if (!done) return;
    Sfx.play('chord');
    Game.keepWorld();
    render();
  });

  return { show, render };
})();
