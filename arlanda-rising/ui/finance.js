'use strict';

// Arlanda Rising — the Finance screen (SPEC.md "Screens", key F, or the money in the HUD): the money and the loans (borrow
// or repay in the Office), the month so far and the last month closed by line, a chart of the money month by month with
// each month's result, every investment the airport owns with what it earns and costs a month and its payback from the
// airport's own traffic (sim/invest.js) — and, under Details (closed by default, its state remembered), the net present
// value and the what-if of the small builds before they are bought. Used by game.js and ui/office.js.

const FinanceUI = (() => {
  const $ = (id) => document.getElementById(id);
  let back = null, editable = false;
  const LOAN_STEP = 5e6;
  // the lines of the books as shown
  const LINES = { fees: 'Fees (in summary)', landing: 'Landing fees', passenger: 'Passenger fees', stands: 'Stand time', shops: 'Shops and cafés',
    parking: 'Car parks', rail: 'The train', rent: 'Rent from the brands', deals: 'Deals', owner: 'From the owner', 'owner loan': "The owner's loan",
    loans: 'Loans', wages: 'Wages', upkeep: 'Upkeep', systems: 'Systems', interest: 'Interest', security: 'Security', desks: 'Check-in desks',
    construction: 'Building', build: 'Buying', penalties: 'Penalties to airlines', hiring: 'Hiring', training: 'Training', drills: 'Drills', cheat: 'Cheat',
    estate: 'Real estate', border: 'Passport booths', energy: 'Energy', biofuel: 'Biofuel', permit: 'Permit fines', deicing: 'De-icing fluid',
    stranded: 'Stranded passengers', overtime: 'Overtime' };

  function show(opts) {
    back = opts.back; editable = !!opts.edit;
    render();
    Screens.show('finance');
  }

  function books(b) {
    const keys = [...new Set(Object.keys(b.in).concat(Object.keys(b.out)))].sort((x, y) => ((b.in[y] || 0) - (b.out[y] || 0)) - ((b.in[x] || 0) - (b.out[x] || 0)));
    let inn = 0, out = 0;
    const rows = keys.map((k) => {
      const a = b.in[k] || 0, o = b.out[k] || 0;
      inn += a; out += o;
      return '<tr><td>' + Text.esc(tr(LINES[k] || k)) + '</td><td>' + (a ? sek(a) : '') + '</td><td>' + (o ? sek(o) : '') + '</td></tr>';
    }).join('');
    return '<table class="books"><tr><th></th><th>' + Text.esc(tr('In')) + '</th><th>' + Text.esc(tr('Out')) + '</th></tr>' + rows +
      '<tr class="sum"><td>' + Text.esc(tr('Result')) + '</td><td colspan="2" class="' + (inn - out < 0 ? 'neg' : 'pos') + '">' + sek(inn - out) + '</td></tr></table>';
  }

  function payback(m) {
    if (m.payback === null) return '<span class="neg">' + Text.esc(tr('never at today\'s traffic')) + '</span>';
    const n = Math.max(1, Math.round(m.payback));
    return Text.esc(n <= 24 ? tr('{n} months', { n }) : tr('{n} years', { n: Text.num(n / 12, 1) }));
  }

  function render() {
    const p = $('finance'), details = Settings.get('finDetails') === 'open';
    const room = Math.max(0, (S.loanLimit || 0) - S.loans);
    let html = '<h1>📊 ' + Text.esc(tr('Finance')) + '</h1><p class="when">' + Text.esc(fmtDate(S.day)) + '</p><div class="cards">';
    html += '<div class="ocard"><h3>💰 ' + Text.esc(tr('Money')) + '</h3><p class="big' + (S.money < 0 ? ' neg' : '') + '">' + sek(S.money) + '</p>' +
      '<p>' + Text.esc(tr('Loans: {m}', { m: sek(S.loans) })) + ' · ' + Text.esc(tr('{r} a year', { r: Math.round(LOAN_RATE * 100) + ' %' })) + '</p>' +
      '<p class="fine">' + Text.esc(tr('The owner allows {k} more.', { k: sek(room) })) + '</p>' +
      (editable ? '<div class="btnRow small"><button class="btn toggle" data-loan="borrow"' + (room <= 0 ? ' disabled' : '') + '>+' + sek(LOAN_STEP) + '</button>' +
        '<button class="btn toggle" data-loan="repay"' + (S.loans <= 0 || S.money <= 0 ? ' disabled' : '') + '>−' + sek(LOAN_STEP) + '</button></div>' : '') + '</div>';
    html += '<div class="ocard"><h3>🗓️ ' + Text.esc(tr('This month so far')) + '</h3>' + books(S.finance.cur) + '</div>';
    const last = S.finance.history[S.finance.history.length - 1];
    if (last) html += '<div class="ocard"><h3>📒 ' + Text.esc(tr('The last month')) + ' <small>' + (last.month % 12 + 1) + '/' + Math.floor(last.month / 12) + '</small></h3>' + books(last) + '</div>';
    html += '</div><p class="label">' + Text.esc(tr('Money, month by month')) + '</p><div class="cvWrap"><canvas id="cashChart"></canvas></div>';
    // the investments
    const list = Invest.list();
    html += '<p class="label">' + Text.esc(tr('Investments')) + '</p>';
    if (!list.length) html += '<p class="fine">' + Text.esc(tr('Nothing that earns yet: shops, car parks, systems and the train show here.')) + '</p>';
    else {
      html += '<table class="ops inv"><tr><th></th><th>' + Text.esc(tr('Price')) + '</th><th>' + Text.esc(tr('A month')) + '</th><th>' + Text.esc(tr('Pays back')) + '</th>' +
        (details ? '<th>' + Text.esc(tr('Net present value')) + '</th>' : '') + '</tr>' +
        list.map((x) => '<tr><td><b>' + Text.esc(x.key === 'brand' ? x.name : tr(x.name)) + '</b>' + (x.key === 'brand' ? '<small>' + Text.esc(tr(TERMINALS[x.term].name)) + '</small>' : '') +
          (x.key === 'system' ? '<small>' + Text.esc(Text.dom(x.dom)) + '</small>' : '') + '</td><td>' + sek(x.price) + '</td><td class="' + (x.net < 0 ? 'neg' : 'pos') + '">' + sek(x.net) +
          (details ? '<small>' + Text.esc(tr('{a} in, {b} out', { a: sek(x.in), b: sek(x.out) })) + '</small>' : '') + '</td><td>' + payback(x) + '</td>' +
          (details ? '<td class="' + (x.npv < 0 ? 'neg' : 'pos') + '">' + sek(x.npv) + '</td>' : '') + '</tr>').join('') + '</table>';
    }
    html += '<p class="fine">' + Text.esc(tr('Payback is the price divided by what it earns a month, from the last 30 days of traffic.')) + '</p>';
    html += '<button class="btn toggle details" data-details="1">' + Text.esc(details ? tr('Hide the details') : tr('Details: net present value and what-ifs')) + '</button>';
    if (details) {
      html += '<p class="fine">' + Text.esc(tr('The net present value adds up {y} years of what it earns, each year counted {r} % less than the one before — money later is worth less than money now. Above zero, it is worth more than it costs.', { y: NPV_YEARS, r: Math.round(NPV_RATE * 100) })) + '</p>';
      const kinds = ['parkingSmall', 'parkingBig', 'cafe', 'restaurant', 'dutyFree', 'lane', 'busStop', 'offices', 'hotelExt', 'solar'].filter((k) => BUILDINGS[k] && (!BUILDINGS[k].from || Calendar.year() >= BUILDINGS[k].from));
      html += '<p class="label">' + Text.esc(tr('What if you built…')) + '</p><table class="ops inv"><tr><th></th><th>' + Text.esc(tr('Price')) + '</th><th>' + Text.esc(tr('A month')) + '</th><th>' +
        Text.esc(tr('Pays back')) + '</th><th>' + Text.esc(tr('Net present value')) + '</th></tr>' + kinds.map((k) => {
        const m = Invest.whatIf(k);
        return '<tr><td>' + Text.esc(tr(BUILDINGS[k].name)) + '</td><td>' + sek(m.price) + '</td><td class="' + (m.net < 0 ? 'neg' : 'pos') + '">' + sek(m.net) + '</td><td>' + payback(m) + '</td><td class="' + (m.npv < 0 ? 'neg' : 'pos') + '">' + sek(m.npv) + '</td></tr>';
      }).join('') + '</table>';
    }
    p.innerHTML = html;
    p.appendChild(Screens.row(Screens.btn(tr('Back'), 'default', () => back())));
    // drawn once the panel shows, at its real width
    requestAnimationFrame(() => { const cv = $('cashChart'); if (cv) chart(cv); });
  }

  // the money at each month's close, and each month's result as a bar under it
  function chart(cv) {
    const hist = S.finance.history.slice(-60);
    const w = Math.max(280, cv.parentNode.clientWidth), h = 170, dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.width = w + 'px'; cv.style.height = h + 'px';
    const c = cv.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = 'rgba(255,255,255,0.05)'; c.fillRect(0, 0, w, h);
    if (hist.length < 2) { c.fillStyle = '#aab'; c.font = '12px Arial'; c.textAlign = 'center'; c.fillText(tr('The chart grows month by month.'), w / 2, h / 2); return; }
    const res = hist.map((x) => Object.values(x.in).reduce((a, b) => a + b, 0) - Object.values(x.out).reduce((a, b) => a + b, 0));
    const vals = hist.map((x) => x.money);
    const lo = Math.min(0, ...vals), hi = Math.max(1, ...vals), rmax = Math.max(1, ...res.map(Math.abs));
    const X = (i) => 62 + (w - 72) * i / (hist.length - 1), Y = (v) => 10 + (h * 0.62) * (1 - (v - lo) / (hi - lo));
    // the zero line, the results as bars, the money as a line
    c.strokeStyle = 'rgba(255,255,255,0.25)'; c.beginPath(); c.moveTo(62, Y(0)); c.lineTo(w - 10, Y(0)); c.stroke();
    const by = h - 30;
    res.forEach((r, i) => { const bh = (h * 0.22) * Math.abs(r) / rmax; c.fillStyle = r >= 0 ? '#5ec27a' : '#e35b4f'; c.fillRect(X(i) - 2, r >= 0 ? by - bh : by, 4, bh); });
    c.strokeStyle = '#ffd65a'; c.lineWidth = 2; c.beginPath();
    vals.forEach((v, i) => (i ? c.lineTo(X(i), Y(v)) : c.moveTo(X(i), Y(v))));
    c.stroke();
    c.fillStyle = '#c9d1d9'; c.font = '10px Arial'; c.textAlign = 'right';
    c.fillText(money(hi, true), 58, Y(hi) + 4); c.fillText(money(lo, true), 58, Y(lo));
    c.textAlign = 'left';
    const first = hist[0].month, lastM = hist[hist.length - 1].month;
    c.fillText((first % 12 + 1) + '/' + Math.floor(first / 12), 62, h - 4);
    c.textAlign = 'right'; c.fillText((lastM % 12 + 1) + '/' + Math.floor(lastM / 12), w - 10, h - 4);
  }

  $('finance').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.details) { Sfx.play('click'); Settings.set('finDetails', Settings.get('finDetails') === 'open' ? 'closed' : 'open'); render(); return; }
    if (b.dataset.loan && editable) {
      Sfx.play('click');
      if (b.dataset.loan === 'borrow') Finance.borrow(LOAN_STEP); else Finance.repay(LOAN_STEP);
      Game.keepWorld();
      render();
    }
  });

  return { show, render };
})();
