'use strict';

// Arlanda Rising — the Office between missions (and between Free Play's rounds), with time stopped: the airport on the
// map behind, the money and the loans (borrow or repay here: FinanceUI's loans card), the last months' books, what the airport has, the five
// meters, the Ops Center and Departments (hire, train, put in systems, drills — at once, on the airport that
// carries over), what waits for an answer (a manager's raise), the terminals to mothball and open again (session 6), and
// the next mission or round a tap away. Used by
// game.js; it works on the world of Game.holder() (the campaign's or Free Play's), which is S while it is open.

const Office = (() => {
  function show() {
    const p = document.getElementById('office'), h = Game.holder();
    if (!h || !h.world) { if (Campaign.data && Campaign.data.next) Game.openMission(Campaign.data.next); else Game.toMenu(); return; }
    const w = h.world;
    S = w;
    const nm = h.free ? null : Campaign.nextMission();
    let html = '<h1>🏢 ' + Text.esc(tr(h.free ? 'Free Play' : 'The Office')) + '</h1><p class="when">' + Text.esc(fmtDate(w.day)) + ' · ' +
      Text.esc(w.owner === 'Swedavia' ? tr('Owner: Swedavia') : tr('Owner: Luftfartsverket (LFV)')) + '</p>';
    // the Ops Center, Finance and Departments are tabs of one screen (ui/analytics.js InfoTabs), each with its button
    html += '<div class="btnRow"><button class="btn secondary" data-go="ops">🛠️ ' + Text.esc(tr('Ops Center')) + '</button>' +
      '<button class="btn secondary" data-go="finance">📊 ' + Text.esc(tr('Finance')) + '</button>' +
      '<button class="btn secondary" data-go="people">👥 ' + Text.esc(tr('Departments')) + '</button>' +
      '<button class="btn secondary" data-go="airlines">✈️ ' + Text.esc(tr('Airlines')) + '</button>' +
      (w.airport.units ? '<button class="btn secondary" data-go="terminal">🏪 ' + Text.esc(tr('Terminal view')) + '</button>' : '') + '</div>';
    // the Offers board waiting (chapter 4 on)
    const bd = Offers.board();
    if (bd && bd.cards.length && Object.keys(bd.taken).length < bd.cards.length) html += '<p class="warn">📋 ' + Text.esc(tr('The Offers board has {n} offers — see Airlines.', { n: bd.cards.length - Object.keys(bd.taken).length })) + '</p>';
    // what waits for an answer
    const asks = (w.people && w.people.asks) || [];
    for (const d of asks) {
      const m = w.people.managers[d];
      if (m) html += '<p class="warn">' + Text.esc(tr('{name} asks for a raise — answer in Departments, or it counts as "not now".', { name: People.mdef(m.id).name })) + '</p>';
    }
    // session 7: a department whose head has left: the team works on, Departments has two candidates
    for (const d of Object.keys((w.people && w.people.vacant) || {})) {
      const v = w.people.vacant[d], m = People.mdef(v.id);
      if (!People.staffed(d) || w.people.managers[d]) continue;
      html += '<p class="warn">👔 ' + Text.esc((v.why === 'poached' ? tr('{name}, head of {dept}, has left for another airport.', { name: m ? m.name : '', dept: Text.dept(d) }) : tr('{name}, head of {dept}, has retired.', { name: m ? m.name : '', dept: Text.dept(d) })) + ' ' +
        tr('The team keeps working — only the head\'s skill is gone.')) + ' <button class="btn toggle" data-go="people">👥 ' + Text.esc(tr('Find a new head')) + '</button></p>';
    }
    if (w.people && w.people.strike && w.people.strike.to > w.day) html += '<p class="warn">' + Text.esc(tr('Strike notice: {dept} from {d}', { dept: Text.dept(w.people.strike.dept), d: fmtDate(w.people.strike.from) })) + '</p>';
    html += '<div class="cards">';
    // money
    html += '<div class="ocard"><h3>💰 ' + Text.esc(tr('Money')) + '</h3><p class="big' + (w.money < 0 ? ' neg' : '') + '">' + sek(w.money) + '</p>' +
      '<p class="fine">' + Text.esc(tr('Your own: {m}', { m: sek(w.money - w.loans) })) + '</p></div>' + FinanceUI.loanCard();
    // the books
    const hist = (w.finance.history || []).slice(-6);
    if (hist.length) {
      html += '<div class="ocard"><h3>📊 ' + Text.esc(tr('The last months')) + '</h3><table class="books"><tr><th></th><th>' + Text.esc(tr('In')) + '</th><th>' + Text.esc(tr('Out')) + '</th><th>' + Text.esc(tr('Result')) + '</th></tr>' +
        hist.map((x) => {
          const inn = Object.values(x.in).reduce((a, b) => a + b, 0), out = Object.values(x.out).reduce((a, b) => a + b, 0);
          const y = Math.floor(x.month / 12), mo = x.month % 12;
          return '<tr><td>' + (mo + 1) + '/' + String(y).slice(2) + '</td><td>' + sekBare(inn) + '</td><td>' + sekBare(out) + '</td><td class="' + (inn - out < 0 ? 'neg' : 'pos') + '">' + sekBare(inn - out) + '</td></tr>';
        }).join('') + '</table></div>';
    }
    // what the airport has
    const has = {};
    for (const it of w.airport.items) has[it.kind] = (has[it.kind] || 0) + 1;
    html += '<div class="ocard"><h3>🛫 ' + Text.esc(tr('Your airport')) + '</h3><ul class="has">' +
      Object.keys(has).map((k) => '<li>' + Text.esc(tr(Terminal.itemName(k))) + (has[k] > 1 ? ' × ' + has[k] : '') + '</li>').join('') +
      '<li>' + Text.esc(tr('Stands: {n}', { n: w.airport.stands.length })) + '</li><li>' + Text.esc(tr('Check-in desks: {n}', { n: w.airport.desks })) + '</li>' +
      (has.fireStation ? '<li>' + Text.esc(tr('Fire category {n}', { n: Airport.fireCat() })) + '</li>' :
        Airport.siteFireWatch() ? '<li>' + Text.esc(tr('Fire category {n}: the building site\'s fire watch, until the fire station stands', { n: Airport.fireCat() })) + '</li>' : '') + '</ul></div>';
    html += '<div class="ocard"><h3>📈 ' + Text.esc(tr('The meters')) + '</h3><ul class="has">' + METERS.map((x) => '<li>' + x.icon + ' ' + Text.esc(Text.meterName(x.k)) + ': <b>' +
      (x.k === 'passengers' ? Text.paxStars(w.meters[x.k]) + '★' : Math.round(w.meters[x.k])) + '</b></li>').join('') + '</ul>' +
      // their history and what moves them: the analytics tabs of Finance (ui/analytics.js)
      '<div class="btnRow small"><button class="btn toggle" data-go="finance" data-tab="passengers">📈 ' + Text.esc(tr('What moves them')) + '</button></div></div>';
    // session 5: the rents of the real estate; from chapter 6 the green rating, the energy and the permit
    const rent = Airport.rent();
    if (rent || Green.on()) {
      html += '<div class="ocard"><h3>🌿 ' + Text.esc(tr(Green.on() ? 'Green and real estate' : 'Real estate')) + '</h3><ul class="has">';
      if (rent) html += '<li>🏬 ' + Text.esc(tr('Rents: {m} a month', { m: sek(rent) })) + '</li>';
      if (Green.on()) {
        const pm = Green.permit();
        html += '<li>🌿 ' + Text.esc(tr('Green rating')) + ': <b>' + Green.rating() + '</b></li><li>🔥 ' + Text.esc(tr('Energy: {m} a month', { m: sek(Green.energyMonth()) })) + '</li>';
        if (w.airport.biofuel) html += '<li>🌱 ' + Text.esc(tr('{p} of the fuel bio: {m} a month', { p: Text.pct(w.airport.biofuel), m: sek(Green.biofuelMonth()) })) + '</li>';
        if (w.airport.permit) html += '<li' + (pm && pm.broken ? ' class="neg"' : '') + '>📜 ' + Text.esc(tr('Permit: {n} of {cap} flights a day', { n: Math.round(Green.perDay()), cap: w.airport.permit.perDay || '—' }) +
          (w.airport.permit.green ? ' · ' + tr('green rating at least {g}', { g: w.airport.permit.green }) : '')) + '</li>';
      }
      html += '</ul></div>';
    }
    // session 6: the terminals that can be mothballed in a crisis and opened again, and the traffic there is
    const closable = ['t2', 't3', 'dom'].filter((t) => Terminal.built(t));
    if (closable.length && (w.airport.demand !== undefined || Terminal.mothballCount())) {
      html += '<div class="ocard"><h3>🔒 ' + Text.esc(tr('Terminals')) + '</h3><ul class="has">';
      if (w.airport.demand !== undefined && w.airport.demand < 1) html += '<li>✈️ ' + Text.esc(tr('Traffic: {p} of normal', { p: Text.pct(Summary.demand()) })) + '</li>';
      for (const t of closable) {
        const m = w.airport.mothballed && w.airport.mothballed[t], closed = Terminal.mothballed(t);
        html += '<li>' + Text.esc(tr(Terminal.name(t))) + ': <b>' + Text.esc(closed ? (m === true ? tr('mothballed') : tr('opens {d}', { d: fmtDate(m) })) : tr('open')) + '</b> ' +
          (m === true ? '<button class="btn toggle" data-term="reopen" data-t="' + t + '">' + Text.esc(tr('Open again')) + ' <small>' + sekBare(REOPEN_COST) + '</small></button>' :
            !closed ? '<button class="btn toggle" data-term="mothball" data-t="' + t + '">' + Text.esc(tr('Mothball')) + '</button>' : '') + '</li>';
      }
      html += '</ul></div>';
    }
    html += '</div>';
    if (nm) html += '<p class="label">' + Text.esc(tr('Next: {name} · ~{n} min', { name: tr(nm.name), n: Text.minutes(nm) })) + '</p>';
    if (h.free) html += '<p class="label">' + Text.esc(tr('Round {n} comes next.', { n: h.round })) + '</p>';
    p.innerHTML = html;
    p.querySelectorAll('[data-loan]').forEach((b) => b.addEventListener('click', () => { if (FinanceUI.loan(b.dataset.loan)) show(); }));
    p.querySelectorAll('[data-term]').forEach((b) => b.addEventListener('click', () => {
      if (!(b.dataset.term === 'reopen' ? Actions.reopen(b.dataset.t) : Actions.mothball(b.dataset.t))) return;
      Sfx.play('click');
      Game.keepWorld();
      show();
    }));
    p.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => { Sfx.play('click'); open(b.dataset.go, b.dataset.tab); }));
    p.appendChild(Screens.row(
      Screens.btn(tr(h.free ? 'Main Menu' : 'Timeline'), 'secondary', () => (h.free ? Game.toMenu() : Game.toTimeline())),
      nm ? Screens.btn(tr('Next mission'), 'default big', () => Game.openMission(nm.id)) : null,
      h.free ? Screens.btn(tr('Next round'), 'default big', () => Game.freeRound()) : null
    ));
    Screens.show('office');
  }
  // a screen, editable, coming back here: the Ops Center, Finance (on `tab`) or Departments — one screen with tabs —,
  // the Terminal view or Airlines
  function open(which, tab) {
    const back = () => show();
    if (which === 'terminal') TermView.show({ back, edit: true });
    else if (which === 'airlines') AirlinesUI.show({ back, edit: true });
    else InfoTabs.open(which === 'finance' ? tab || 'finance' : which, { back, edit: { people: true, ops: true } });
  }
  return { show, open };
})();
