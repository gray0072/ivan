'use strict';

// Arlanda Rising — the Office between missions, with time stopped: the campaign's airport on the map behind, the
// money and the loans (borrow or repay here), the last months' books, what the airport has, the five meters, and
// the next mission a tap away. Long-term choices (hiring, offers, systems) join it with the later sessions.
// Used by game.js; it shows the campaign's world, which is S while the Office is open.

const Office = (() => {
  const LOAN_STEP = 5e6;

  function show() {
    const p = document.getElementById('office'), w = Campaign.data.world;
    if (!w) { Game.openMission(Campaign.data.next); return; }
    const nm = Campaign.nextMission();
    let html = '<h1>🏢 ' + Text.esc(tr('The Office')) + '</h1><p class="when">' + Text.esc(fmtDate(w.day)) + ' · ' + Text.esc(tr('Owner: Luftfartsverket (LFV)')) + '</p>';
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
        hist.map((h) => {
          const inn = Object.values(h.in).reduce((a, b) => a + b, 0), out = Object.values(h.out).reduce((a, b) => a + b, 0);
          const y = Math.floor(h.month / 12), mo = h.month % 12;
          return '<tr><td>' + (mo + 1) + '/' + String(y).slice(2) + '</td><td>' + sek(inn) + '</td><td>' + sek(out) + '</td><td class="' + (inn - out < 0 ? 'neg' : 'pos') + '">' + sek(inn - out) + '</td></tr>';
        }).join('') + '</table></div>';
    }
    // what the airport has
    const has = {};
    for (const it of w.airport.items) has[it.kind] = (has[it.kind] || 0) + 1;
    html += '<div class="ocard"><h3>🛫 ' + Text.esc(tr('Your airport')) + '</h3><ul class="has">' +
      Object.keys(has).map((k) => '<li>' + Text.esc(tr(BUILDINGS[k] ? BUILDINGS[k].name : k)) + (has[k] > 1 ? ' × ' + has[k] : '') + '</li>').join('') +
      '<li>' + Text.esc(tr('Stands: {n}', { n: w.airport.stands.length })) + '</li><li>' + Text.esc(tr('Check-in desks: {n}', { n: w.airport.desks })) + '</li></ul></div>';
    html += '<div class="ocard"><h3>📈 ' + Text.esc(tr('The meters')) + '</h3><ul class="has">' + METERS.map((x) => '<li>' + x.icon + ' ' + Text.esc(Text.meterName(x.k)) + ': <b>' +
      (x.k === 'passengers' ? Text.paxStars(w.meters[x.k]) + '★' : Math.round(w.meters[x.k])) + '</b></li>').join('') + '</ul></div>';
    html += '</div>';
    if (nm) html += '<p class="label">' + Text.esc(tr('Next: {name} · ~{n} min', { name: tr(nm.name), n: Text.minutes(nm) })) + '</p>';
    p.innerHTML = html;
    p.querySelectorAll('[data-loan]').forEach((b) => b.addEventListener('click', () => {
      Sfx.play('click');
      // the loan is taken on the campaign's world, then kept
      S = Campaign.data.world;
      if (b.dataset.loan === 'borrow') Finance.borrow(LOAN_STEP); else Finance.repay(LOAN_STEP);
      Campaign.data.world = S;
      Campaign.save();
      show();
    }));
    p.appendChild(Screens.row(
      Screens.btn(tr('Timeline'), 'secondary', () => Game.toTimeline()),
      nm ? Screens.btn(tr('Next mission'), 'default big', () => Game.openMission(nm.id)) : null
    ));
    Screens.show('office');
  }
  return { show };
})();
