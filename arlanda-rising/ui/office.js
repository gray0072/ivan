'use strict';

// Arlanda Rising — the Office between missions (and between Free Play's rounds), with time stopped: the airport on the
// map behind, the money and the loans (borrow or repay here), the last months' books, what the airport has, the five
// meters, the People screen and the Ops Center (hire, train, put in systems, drills — at once, on the airport that
// carries over), what waits for an answer (a manager's raise), and the next mission or round a tap away. Used by
// game.js; it works on the world of Game.holder() (the campaign's or Free Play's), which is S while it is open.

const Office = (() => {
  const LOAN_STEP = 5e6;

  function show() {
    const p = document.getElementById('office'), h = Game.holder();
    if (!h || !h.world) { if (Campaign.data && Campaign.data.next) Game.openMission(Campaign.data.next); else Game.toMenu(); return; }
    const w = h.world;
    S = w;
    const nm = h.free ? null : Campaign.nextMission();
    let html = '<h1>🏢 ' + Text.esc(tr(h.free ? 'Free Play' : 'The Office')) + '</h1><p class="when">' + Text.esc(fmtDate(w.day)) + ' · ' +
      Text.esc(w.owner === 'Swedavia' ? tr('Owner: Swedavia') : tr('Owner: Luftfartsverket (LFV)')) + '</p>';
    html += '<div class="btnRow"><button class="btn secondary" data-go="people">👥 ' + Text.esc(tr('People')) + '</button>' +
      '<button class="btn secondary" data-go="ops">🛠️ ' + Text.esc(tr('Ops Center')) + '</button></div>';
    // what waits for an answer
    const asks = (w.people && w.people.asks) || [];
    for (const d of asks) {
      const m = w.people.managers[d];
      if (m) html += '<p class="warn">' + Text.esc(tr('{name} asks for a raise — answer in People, or it counts as "not now".', { name: MANAGERS[m.id].name })) + '</p>';
    }
    if (w.people && w.people.strike && w.people.strike.to > w.day) html += '<p class="warn">' + Text.esc(tr('Strike notice: {dept} from {d}', { dept: Text.dept(w.people.strike.dept), d: fmtDate(w.people.strike.from) })) + '</p>';
    html += '<div class="cards">';
    // money
    const room = Math.max(0, (w.loanLimit || 0) - w.loans);
    html += '<div class="ocard"><h3>💰 ' + Text.esc(tr('Money')) + '</h3><p class="big' + (w.money < 0 ? ' neg' : '') + '">' + sek(w.money) + '</p>' +
      '<p>' + Text.esc(tr('Loans: {m}', { m: sek(w.loans) })) + ' · ' + Text.esc(tr('{r} a year', { r: Math.round(LOAN_RATE * 100) + ' %' })) + '</p>' +
      '<div class="btnRow small"><button class="btn toggle" data-loan="borrow"' + (room <= 0 ? ' disabled' : '') + '>+' + sek(LOAN_STEP) + '</button>' +
      '<button class="btn toggle" data-loan="repay"' + (w.loans <= 0 || w.money <= 0 ? ' disabled' : '') + '>−' + sek(LOAN_STEP) + '</button></div></div>';
    // the books
    const hist = (w.finance.history || []).slice(-6);
    if (hist.length) {
      html += '<div class="ocard"><h3>📊 ' + Text.esc(tr('The last months')) + '</h3><table class="books"><tr><th></th><th>' + Text.esc(tr('In')) + '</th><th>' + Text.esc(tr('Out')) + '</th><th>' + Text.esc(tr('Result')) + '</th></tr>' +
        hist.map((x) => {
          const inn = Object.values(x.in).reduce((a, b) => a + b, 0), out = Object.values(x.out).reduce((a, b) => a + b, 0);
          const y = Math.floor(x.month / 12), mo = x.month % 12;
          return '<tr><td>' + (mo + 1) + '/' + String(y).slice(2) + '</td><td>' + sek(inn) + '</td><td>' + sek(out) + '</td><td class="' + (inn - out < 0 ? 'neg' : 'pos') + '">' + sek(inn - out) + '</td></tr>';
        }).join('') + '</table></div>';
    }
    // what the airport has
    const has = {};
    for (const it of w.airport.items) has[it.kind] = (has[it.kind] || 0) + 1;
    html += '<div class="ocard"><h3>🛫 ' + Text.esc(tr('Your airport')) + '</h3><ul class="has">' +
      Object.keys(has).map((k) => '<li>' + Text.esc(tr(BUILDINGS[k] ? BUILDINGS[k].name : k)) + (has[k] > 1 ? ' × ' + has[k] : '') + '</li>').join('') +
      '<li>' + Text.esc(tr('Stands: {n}', { n: w.airport.stands.length })) + '</li><li>' + Text.esc(tr('Check-in desks: {n}', { n: w.airport.desks })) + '</li>' +
      (has.fireStation ? '<li>' + Text.esc(tr('Fire category {n}', { n: Airport.fireCat() })) + '</li>' : '') + '</ul></div>';
    html += '<div class="ocard"><h3>📈 ' + Text.esc(tr('The meters')) + '</h3><ul class="has">' + METERS.map((x) => '<li>' + x.icon + ' ' + Text.esc(Text.meterName(x.k)) + ': <b>' +
      (x.k === 'passengers' ? Text.paxStars(w.meters[x.k]) + '★' : Math.round(w.meters[x.k])) + '</b></li>').join('') + '</ul></div>';
    html += '</div>';
    if (nm) html += '<p class="label">' + Text.esc(tr('Next: {name} · ~{n} min', { name: tr(nm.name), n: Text.minutes(nm) })) + '</p>';
    if (h.free) html += '<p class="label">' + Text.esc(tr('Round {n} comes next.', { n: h.round })) + '</p>';
    p.innerHTML = html;
    p.querySelectorAll('[data-loan]').forEach((b) => b.addEventListener('click', () => {
      Sfx.play('click');
      if (b.dataset.loan === 'borrow') Finance.borrow(LOAN_STEP); else Finance.repay(LOAN_STEP);
      Game.keepWorld();
      show();
    }));
    p.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => { Sfx.play('click'); open(b.dataset.go); }));
    p.appendChild(Screens.row(
      Screens.btn(tr(h.free ? 'Main Menu' : 'Timeline'), 'secondary', () => (h.free ? Game.toMenu() : Game.toTimeline())),
      nm ? Screens.btn(tr('Next mission'), 'default big', () => Game.openMission(nm.id)) : null,
      h.free ? Screens.btn(tr('Next round'), 'default big', () => Game.freeRound()) : null
    ));
    Screens.show('office');
  }
  // the People screen or the Ops Center, editable, coming back here
  function open(which) {
    const back = () => show();
    if (which === 'people') PeopleUI.show({ back, edit: true });
    else OpsCenter.show({ back, edit: true });
  }
  return { show, open };
})();
