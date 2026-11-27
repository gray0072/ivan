'use strict';

// Arlanda Rising — the Finance screen (SPEC.md "Screens", key F, or the money in the HUD): the loans at its top (what is
// owed, the owner's limit and the room left, the interest; Borrow and Repay wherever it is opened — ops time, plan time,
// the Office — with the reason when one cannot be pressed; the same card in the Office), the money, the month so far and the last month closed by line, a chart of the money month by month with
// each month's result, every investment the airport owns with what it earns and costs a month and its payback from the
// airport's own traffic (sim/invest.js) — and, under Details (closed by default, its state remembered), the net present
// value and the what-if of the small builds before they are bought. Tabs at the top lead to the analytics of the five
// meters and the green rating (ui/analytics.js), opened straight from a meter in the HUD or the Office, and to the Ops
// Center and Departments (the same tab bar on their screens, InfoTabs). Opened through InfoTabs (game.js, ui/office.js).

const FinanceUI = (() => {
  const $ = (id) => document.getElementById(id);
  let back = null;
  // the lines of the books as shown
  const LINES = { fees: 'Fees (in summary)', landing: 'Landing fees', passenger: 'Passenger fees', stands: 'Stand time', shops: 'Shops and cafés',
    parking: 'Car parks', rail: 'The train', rent: 'Rent from the brands', deals: 'Deals', owner: 'From the owner', 'owner loan': "The owner's loan",
    loans: 'Loans', wages: 'Wages', upkeep: 'Upkeep', systems: 'Systems', interest: 'Interest', security: 'Security', desks: 'Check-in desks',
    construction: 'Building', build: 'Buying', sold: 'Shops sold', penalties: 'Penalties to airlines', hiring: 'Hiring', training: 'Training', drills: 'Drills', cheat: 'Cheat',
    estate: 'Real estate', border: 'Passport booths', energy: 'Energy', biofuel: 'Biofuel', permit: 'Permit fines', deicing: 'De-icing fluid',
    stranded: 'Stranded passengers', overtime: 'Overtime' };

  // the column's name, and "NPV" on a narrow screen (styles.css)
  const npvHead = () => '<span class="long">' + Text.esc(tr('Net present value')) + '</span><span class="short">NPV</span>';

  // the tab shown: the money, or one of the analytics' (ui/analytics.js)
  let tab = 'finance';
  function show(opts) {
    back = opts.back;
    tab = opts.tab && Analytics.has(opts.tab) ? opts.tab : 'finance';
    render();
    Screens.show('finance');
  }

  function books(b) {
    const keys = [...new Set(Object.keys(b.in).concat(Object.keys(b.out)))].sort((x, y) => ((b.in[y] || 0) - (b.out[y] || 0)) - ((b.in[x] || 0) - (b.out[x] || 0)));
    let inn = 0, out = 0;
    const rows = keys.map((k) => {
      const a = b.in[k] || 0, o = b.out[k] || 0;
      inn += a; out += o;
      return '<tr><td>' + Text.esc(tr(LINES[k] || k)) + '</td><td>' + (a ? sekBare(a) : '') + '</td><td>' + (o ? sekBare(o) : '') + '</td></tr>';
    }).join('');
    return '<table class="books"><tr><th></th><th>' + Text.esc(tr('In')) + '</th><th>' + Text.esc(tr('Out')) + '</th></tr>' + rows +
      '<tr class="sum"><td>' + Text.esc(tr('Result')) + '</td><td colspan="2" class="' + (inn - out < 0 ? 'neg' : 'pos') + '">' + sekBare(inn - out) + '</td></tr></table>';
  }

  // a price in a table: bare, or a dash for what cost the airport nothing (built by the owner or a partner)
  function price(v) { return v ? sekBare(v) : '—'; }
  function payback(m) {
    if (!m.price) return '—';
    if (m.payback === null) return '<span class="neg">' + Text.esc(tr('never at today\'s traffic')) + '</span>';
    const n = Math.max(1, Math.round(m.payback));
    return Text.esc(n === 1 ? tr('1 month') : n <= 24 ? tr('{n} months', { n }) : tr('{n} years', { n: Text.num(n / 12, 1) }));
  }

  // the loans' card (here at the top, and in the Office): what is owed, the owner's limit (sim/finance.js) and the room
  // left, the interest a month and a year, Borrow / Repay a step with the reason under one that cannot be pressed
  const WHY = { limit: () => tr('Limit reached'), debt: () => tr('No debt'), cash: () => tr('No money to repay') };
  function loanCard() {
    const step = Finance.step(), num = (label, v, cls) => '<div><small>' + Text.esc(label) + '</small><b' + (cls ? ' class="' + cls + '"' : '') + '>' + v + '</b></div>';
    const btn = (what, label) => {
      const why = Finance.cannot(what);
      return '<span class="loanBtn"><button class="btn toggle" data-loan="' + what + '"' + (why ? ' disabled' : '') + '>' + Text.esc(label) + '</button>' +
        (why ? '<small>' + Text.esc(WHY[why]()) + '</small>' : '') + '</span>';
    };
    return '<div class="ocard loanCard"><h3>🏦 ' + Text.esc(tr('Loans')) + '</h3><div class="loanNums">' +
      num(tr('Owed now'), sek(S.loans), 'big') + num(tr("The owner's limit"), sek(Finance.limit())) + num(tr('Room left'), sek(Finance.room())) +
      num(tr('Interest'), Text.esc(tr('{m} a month', { m: sek(S.loans * LOAN_RATE / 12) })) + ' <small>' + Text.esc(tr('{r} a year', { r: Math.round(LOAN_RATE * 100) + ' %' })) + '</small>') + '</div>' +
      '<div class="btnRow small loanBtns">' + btn('borrow', tr('Borrow {m}', { m: '+' + sek(step) })) + btn('repay', tr('Repay {m}', { m: '−' + sek(step) })) + '</div>' +
      '<p class="fine">' + Text.esc(tr('The interest is paid every month, and the goals count your money less what you owe. {n} months in a row below zero and the owner replaces you.', { n: DEBT_MONTHS[S.difficulty] || DEBT_MONTHS.medium })) + '</p></div>';
  }
  // a press of Borrow or Repay, from Finance or the Office
  function loan(what) {
    if (Finance.cannot(what)) return false;
    Sfx.play('click');
    if (what === 'borrow') Finance.borrow(Finance.step()); else Finance.repay(Finance.step());
    if (S.mission) Game.acted(); else Game.keepWorld();
    return true;
  }

  function render() {
    const p = $('finance');
    if (tab !== 'finance') {
      p.innerHTML = Analytics.tabsHtml(tab) + Analytics.html(tab);
      p.appendChild(Screens.row(Screens.btn(tr('Back'), 'default', () => back())));
      requestAnimationFrame(() => { const cv = $('statsChart'); if (cv) Analytics.draw(cv, tab); });
      return;
    }
    const details = Settings.get('finDetails') === 'open';
    let html = Analytics.tabsHtml(tab) + '<h1>📊 ' + Text.esc(tr('Finance')) + '</h1><p class="when">' + Text.esc(fmtNow()) + '</p>' + loanCard() + '<div class="cards">';
    html += '<div class="ocard"><h3>💰 ' + Text.esc(tr('Money')) + '</h3><p class="big' + (S.money < 0 ? ' neg' : '') + '">' + sek(S.money) + '</p>' +
      '<p class="fine">' + Text.esc(tr('Your own: {m}', { m: sek(S.money - S.loans) })) + '</p></div>';
    html += '<div class="ocard"><h3>🗓️ ' + Text.esc(tr('This month so far')) + '</h3>' + books(S.finance.cur) + '</div>';
    const last = S.finance.history[S.finance.history.length - 1];
    if (last) html += '<div class="ocard"><h3>📒 ' + Text.esc(tr('The last month')) + ' <small>' + Calendar.monthLabel(last.month) + '</small></h3>' + books(last) + '</div>';
    html += '</div><p class="label">' + Text.esc(tr('Money, month by month')) + '</p><div class="cvWrap"><canvas id="cashChart"></canvas></div>';
    // the investments
    const list = Invest.list();
    html += '<p class="label">' + Text.esc(tr('Investments')) + '</p>';
    if (!list.length) html += '<p class="fine">' + Text.esc(tr('Nothing that earns yet: shops, car parks, systems and the train show here.')) + '</p>';
    else {
      html += '<table class="ops inv"><tr><th></th><th>' + Text.esc(tr('Price')) + '</th><th>' + Text.esc(tr('A month')) + '</th><th>' + Text.esc(tr('Pays back')) + '</th>' +
        (details ? '<th>' + npvHead() + '</th>' : '') + '</tr>' +
        list.map((x) => '<tr><td><b>' + Text.esc(x.key === 'brand' ? x.name : tr(x.name)) + '</b>' + (x.key === 'brand' ? '<small>' + Text.esc(tr(Terminal.name(x.term))) + '</small>' : '') +
          (x.key === 'system' ? '<small>' + Text.esc(Text.dom(x.dom)) + '</small>' : '') + '</td><td>' + price(x.price) + '</td><td class="' + (x.net < 0 ? 'neg' : 'pos') + '">' + sekBare(x.net) +
          (details ? '<small>' + Text.esc(tr('{a} in, {b} out', { a: sekBare(x.in), b: sekBare(x.out) })) + '</small>' : '') + '</td><td>' + payback(x) + '</td>' +
          (details ? '<td class="' + (x.npv < 0 ? 'neg' : 'pos') + '">' + sekBare(x.npv) + '</td>' : '') + '</tr>').join('') + '</table>';
    }
    html += '<p class="fine">' + Text.esc(tr('Payback is the price divided by what it earns a month, from the last 30 days of traffic.')) + '</p>';
    html += '<button class="btn toggle details" data-details="1">' + Text.esc(details ? tr('Hide the details') : tr('Details: net present value and what-ifs')) + '</button>';
    if (details) {
      html += '<p class="fine">' + Text.esc(tr('The net present value adds up {y} years of what it earns, each year counted {r} % less than the one before — money later is worth less than money now. Above zero, it is worth more than it costs.', { y: NPV_YEARS, r: Math.round(NPV_RATE * 100) })) + '</p>';
      const kinds = ['parkingSmall', 'parkingBig', 'cafe', 'restaurant', 'dutyFree', 'lane', 'busStop', 'offices', 'hotelExt', 'solar'].filter((k) => BUILDINGS[k] && (!BUILDINGS[k].from || Calendar.year() >= BUILDINGS[k].from));
      html += '<p class="label">' + Text.esc(tr('What if you built…')) + '</p><table class="ops inv"><tr><th></th><th>' + Text.esc(tr('Price')) + '</th><th>' + Text.esc(tr('A month')) + '</th><th>' +
        Text.esc(tr('Pays back')) + '</th><th>' + npvHead() + '</th></tr>' + kinds.map((k) => {
        const m = Invest.whatIf(k);
        return '<tr><td>' + Text.esc(tr(BUILDINGS[k].name)) + '</td><td>' + price(m.price) + '</td><td class="' + (m.net < 0 ? 'neg' : 'pos') + '">' + sekBare(m.net) + '</td><td>' + payback(m) + '</td><td class="' + (m.npv < 0 ? 'neg' : 'pos') + '">' + sekBare(m.npv) + '</td></tr>';
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
    c.fillText(moneyBare(hi), 58, Y(hi) + 4); c.fillText(moneyBare(lo), 58, Y(lo));
    c.textAlign = 'left';
    const first = hist[0].month, lastM = hist[hist.length - 1].month;
    c.fillText(Calendar.monthLabel(first), 62, h - 4);
    c.textAlign = 'right'; c.fillText(Calendar.monthLabel(lastM), w - 10, h - 4);
  }

  $('finance').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    // a tab: an analytics page here, or the Ops Center or Departments (ui/analytics.js InfoTabs)
    if (b.dataset.tab) { Sfx.play('click'); InfoTabs.open(b.dataset.tab); return; }
    if (b.dataset.range) { Sfx.play('click'); Settings.set('statsRange', b.dataset.range); render(); return; }
    if (b.dataset.details) { Sfx.play('click'); Settings.set('finDetails', Settings.get('finDetails') === 'open' ? 'closed' : 'open'); render(); return; }
    if (b.dataset.loan && loan(b.dataset.loan)) render();
  });

  return { show, render, loanCard, loan };
})();
