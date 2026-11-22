'use strict';

// Arlanda Rising — the bar's buy menu: three category buttons at the bottom of the game view in ops and plan time, in
// every kind of mission (data/buildings.js BUY_MENU: 🛍️ Services, 🚜 Vehicles, 🏗️ Build; keys 5, 6, 7), each opening a
// sheet of cards — a bottom sheet on a phone held upright, a panel above the bar's right end elsewhere. A card shows the
// small build's sign and name, how many the airport has (of the most worth having: Airport.cap), what it does in a line,
// its price, when it is ready (in ops time at once; in plan time after its days, or when the stage ends if that comes
// first), what it costs a month to run, and for what earns — the shops, the car parks, the rents, the solar park — what it
// earns and its profit a month and payback at today's departing passengers (Invest: the sim's own income rules), with
// the same at twice the passengers, since the profit grows with the traffic. What cannot be bought says why in plain
// words (its limit, no room, what it needs: Airport.why); what a later mission opens, or a later year, is listed under
// 🔒 Later with that mission's number and name. A buy takes a second tap (BUY_CONFIRM_MS); a card the money does not
// cover says by how much, with a button to Finance's loans. The sheet does not stop the time (as the bar's − / + do not):
// ⏸ or Space does. ✕, Esc, the category's button again or a tap outside close it. Used by ui/toolbar.js and game.js.

const BuyMenu = (() => {
  const cats = document.getElementById('tcats'), sheet = document.getElementById('buySheet');
  let open = null, key = '', armed = null, armedAt = 0, pressing = false, seen = {};

  const cat = (id) => BUY_MENU.find((c) => c.id === id);
  const earns = (b, kind) => !!(b.shop || b.places || b.rent || kind === 'solar');
  // the kinds the running mission opens (data/missions `unlocks`): marked new, and their category's button gets a dot
  const fresh = () => (S && S.mission && !S.mission.def && (Missions.def().unlocks || [])) || [];
  const seenKey = (id) => S.mission.id + ':' + id;
  // departing passengers a day, rounded to two figures for the eye
  const paxRound = (p) => { if (p < 100) return Math.round(p); const e = Math.pow(10, Math.floor(Math.log10(p)) - 1); return Math.round(p / e) * e; };

  // the category buttons in the bar
  function renderCats() {
    const nw = fresh();
    const k = BUY_MENU.map((c) => c.id + (open === c.id ? 1 : 0) + (nw.some((x) => c.items.indexOf(x) >= 0) && !seen[seenKey(c.id)] ? 'n' : '')).join() + I18N.lang;
    if (cats.dataset.k === k) return;
    cats.dataset.k = k;
    cats.innerHTML = BUY_MENU.map((c, i) => {
      const dot = nw.some((x) => c.items.indexOf(x) >= 0) && !seen[seenKey(c.id)];
      return '<button class="tcat' + (open === c.id ? ' on' : '') + '" data-cat="' + c.id + '" aria-expanded="' + (open === c.id) + '" title="' + Text.esc(tr(c.name)) + ' (' + (5 + i) + ')">' +
        '<span class="ci">' + c.icon + (dot ? '<i class="dot"></i>' : '') + '</span><span class="cn">' + Text.esc(tr(c.name)) + '</span></button>';
    }).join('');
  }

  // when a build bought now is ready
  function ready(b) {
    if (S.ops || !b.days) return tr('ready at once');
    if (S.plan && S.day + b.days >= S.plan.end) return tr('ready when this stage ends');
    return tr('ready in {n} days', { n: b.days });
  }
  const net = (m) => (m.net >= 0 ? tr('profit {m} a month', { m: sek(m.net) }) : tr('loses {m} a month', { m: sek(-m.net) }));
  const payback = (m) => (m.payback !== null ? tr('pays back in {n} months', { n: Math.max(1, Math.round(m.payback)) }) : tr('never pays back at today\'s traffic'));

  // what it earns, for the kinds that earn: at today's passengers, and at twice as many for those that grow with them
  function earnLines(kind, b) {
    const m = Invest.whatIf(kind), pax = Invest.paxDay(), out = [];
    if (b.shop || b.places) {
      if (pax <= 0) return ['<p class="bEarn">' + Text.esc(tr('No departing passengers yet: it earns once the flights come.')) + '</p>'];
      out.push('<p class="bEarn">' + Text.esc(tr('Now, at ~{pax} departing passengers a day: earns {in}, {net}', { pax: groupThousands(paxRound(pax)), in: sek(m.in), net: net(m) })) + ' · ' + Text.esc(payback(m)) + '</p>');
      const m2 = Invest.at(2, () => Invest.whatIf(kind));
      out.push('<p class="bGrow">📈 ' + Text.esc(tr('×2 passengers: {net}', { net: net(m2) })) + (m2.payback !== null ? ' · ' + Text.esc(payback(m2)) : '') + '</p>');
    } else if (b.rent) out.push('<p class="bEarn">' + Text.esc(tr('Rent {m} a month, whatever the traffic', { m: sek(b.rent) })) + ': ' + Text.esc(net(m)) + ' · ' + Text.esc(payback(m)) + '</p>');
    else if (m.in > 0) out.push('<p class="bEarn">' + Text.esc(tr('Saves {m} a month of energy', { m: sek(m.in) })) + ': ' + Text.esc(net(m)) + ' · ' + Text.esc(payback(m)) + '</p>');
    return out;
  }

  function card(kind, nw) {
    const b = BUILDINGS[kind], why = Airport.why(kind), cap = Airport.cap(kind), n = Airport.owned(kind), m = Invest.whatIf(kind);
    const conf = armed === kind, off = !!why, tip = Text.buyTip(kind);
    let h = '<div class="bcard' + (off ? ' off' : '') + '"' + (tip ? ' title="' + Text.esc(tip) + '"' : '') + '><div class="bTop"><span class="bIco">' + b.icon + '</span><div class="bName"><span><b>' + Text.esc(tr(b.name)) + '</b>' +
      (cap ? ' <em>' + n + '/' + cap.max + '</em>' : n ? ' <em>×' + n + '</em>' : '') + (nw.indexOf(kind) >= 0 ? ' <span class="bNew">' + Text.esc(tr('New')) + '</span>' : '') +
      '</span><small>' + Text.esc(tr(b.about)) + '</small></div></div>';
    h += '<p class="bFacts">' + Text.esc(sek(b.price) + ' · ' + ready(b) + ' · ' + tr('{m} a month to run', { m: sek(m.out) }) + (b.staff ? ' (' + Text.jobs(b.staff) + ')' : '')) + '</p>';
    if (earns(b, kind)) h += earnLines(kind, b).join('');
    // the limit, as a line while there is room (amber once it is reached), the cells a shop takes, the car parks' need
    // (a phone shows no tooltip: at the limit the explanation is a line of its own)
    if (why) h += '<p class="bWhy">' + Text.esc(why.why === 'needs' ? Text.needWhy(why.need) : Text.buyWhy(kind)) + '</p>' + (why.why === 'full' && tip ? '<p class="bNote">' + Text.esc(tip) + '</p>' : '');
    else if (cap) h += '<p class="bNote">' + Text.esc(cap.why === 'hall' ? tr('Room for {n} more in the halls', { n: cap.max - n }) : Text.capWhy(cap)) + '</p>';
    else if (b.cells) h += '<p class="bNote">' + Text.esc(tr('Takes {cells} in a terminal', { cells: Text.cells(b.cells) })) + '</p>';
    if (!why) {
      const short = b.price - S.money;
      if (short > 0) h += '<p class="bShort">' + Text.esc(tr('Not enough money: {m} short', { m: sek(short) })) + '</p>';
      h += '<div class="bActs"><button class="tb buyBtn' + (conf ? ' confirm' : '') + '" data-buy="' + kind + '">' + Text.esc(conf ? tr('Tap again to buy') : tr('Buy') + ' · ' + sek(b.price)) + '</button>' +
        (short > 0 ? '<button class="tb finBtn" data-fin="1">💰 ' + Text.esc(tr('Borrow in Finance')) + '</button>' : '') + '</div>';
    }
    return h + '</div>';
  }

  // the line of a thing a later mission opens (its number and name, even when its year has not come either) or a later
  // year; in the order they open
  function later(kind) {
    const b = BUILDINGS[kind], at = Missions.lockedBy(kind);
    const t = at ? tr('Opens in mission {id}: {name}', { id: at, name: tr(MISSION[at].name) }) : tr('From {y}', { y: b.from });
    return '<li>🔒 ' + b.icon + ' <b>' + Text.esc(tr(b.name)) + '</b> <small>' + Text.esc(t) + '</small></li>';
  }
  const opensAt = (kind) => { const at = Missions.lockedBy(kind); return at ? Calendar.parse(MISSION[at].date) : Calendar.parse(BUILDINGS[kind].from + '-01-01'); };

  function renderSheet() {
    if (!open) { sheet.hidden = true; return; }
    const c = cat(open), nw = fresh();
    const buyable = c.items.filter((k) => { const w = Airport.why(k); return !w || w.why === 'needs' || w.why === 'full'; });
    const locked = c.items.filter((k) => buyable.indexOf(k) < 0).sort((x, y) => opensAt(x) - opensAt(y));
    const pax = Invest.paxDay();
    // what changes a card: the money against each price, the counts, the day against the plan's end, the traffic
    const k = [open, armed, I18N.lang, Settings.short() ? 1 : 0, !!S.ops, Calendar.year(), S.mission.id, paxRound(pax), S.airport.items.length, S.airport.stands.length, S.airport.desks,
      JSON.stringify((S.plan && S.plan.buys) || []), c.items.map((x) => (Airport.why(x) || {}).why + (S.money >= BUILDINGS[x].price ? '' : Math.round((BUILDINGS[x].price - S.money) / 1e5)) +
        (S.plan && S.day + (BUILDINGS[x].days || 0) >= S.plan.end ? 'e' : '')).join(), Airport.places(true), Airport.parkingNeed(), S.airport.lanes, S.airport.booths].join('|');
    sheet.hidden = false;
    if (k === key || pressing) return;
    key = k;
    const focus = document.activeElement && sheet.contains(document.activeElement) ? document.activeElement.dataset.buy || document.activeElement.dataset.tab || null : null;
    // the list keeps its place when a card changes under the finger (a buy armed, a price now covered)
    const body = sheet.querySelector('.shBody'), top = body && sheet.dataset.cat === open ? body.scrollTop : 0;
    let h = '<div class="shHead"><div class="shTabs" role="tablist">' + BUY_MENU.map((x) => '<button class="shTab' + (x.id === open ? ' on' : '') + '" role="tab" aria-selected="' + (x.id === open) + '" data-tab="' + x.id + '">' + x.icon + ' ' + Text.esc(tr(x.name)) + '</button>').join('') +
      '</div><button class="x" aria-label="' + Text.esc(tr('Close')) + '">✕</button></div><div class="shBody">';
    // the sheet's own lines: the traffic the shops and car parks earn from, the cells and the places; when a buy is ready
    const info = [];
    if (open === 'services') {
      info.push(pax > 0 ? '🧳 ' + tr('~{pax} departing passengers a day now. Shops and car parks earn from each of them: more passengers, more profit.', { pax: groupThousands(paxRound(pax)) }) : '🧳 ' + tr('No departing passengers yet: shops and car parks earn once the flights come.'));
      if (Airport.cellsMax()) info.push('🏪 ' + tr('Shop cells') + ': ' + tr('{free} of {max} free', { free: Airport.cellsMax() - Airport.cellsTaken(), max: Airport.cellsMax() }));
      if (pax > 0) info.push('🚗 ' + tr('Car parks') + ': ' + Text.parkingLine());
    }
    info.push(S.ops ? '⏱️ ' + tr('Ops time: what you buy is there at once.') : '⏱️ ' + tr('Plan time: each takes its days; what is still being built when the stage ends is finished then.'));
    h += '<ul class="shInfo">' + info.map((t) => '<li>' + Text.esc(t) + '</li>').join('') + '</ul>';
    h += '<div class="bcards">' + (buyable.length ? buyable.map((x) => card(x, nw)).join('') : '<p class="bNone">' + Text.esc(tr('Nothing here yet.')) + '</p>') + '</div>';
    if (locked.length) h += '<p class="shLater">' + Text.esc(tr('Later')) + '</p><ul class="later">' + locked.map(later).join('') + '</ul>';
    sheet.innerHTML = h + '</div>';
    sheet.dataset.cat = open;
    if (top) sheet.querySelector('.shBody').scrollTop = top;
    if (focus) { const el = sheet.querySelector('[data-buy="' + focus + '"],[data-tab="' + focus + '"]'); if (el) el.focus({ preventScroll: true }); }
  }

  function render() {
    if (!S || !S.mission || (!S.ops && !S.plan)) { if (open) close(); sheet.hidden = true; return; }
    renderCats();
    renderSheet();
    // the sheet sits on the bar: its height for the CSS
    const bar = document.getElementById('toolbar');
    if (!bar.hidden) document.documentElement.style.setProperty('--barH', bar.offsetHeight + 'px');
  }

  function show(id) {
    open = id; key = ''; armed = null;
    if (S && S.mission) seen[seenKey(id)] = true;
    render();
  }
  function close() { open = null; key = ''; armed = null; sheet.hidden = true; cats.dataset.k = ''; }
  function toggle(id) { if (open === id) close(); else show(id); cats.dataset.k = ''; }

  cats.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-cat]');
    if (!b || !S || !S.mission) return;
    Sfx.play('click');
    toggle(b.dataset.cat);
  });
  sheet.addEventListener('pointerdown', () => { pressing = true; });
  window.addEventListener('pointerup', () => { pressing = false; });
  window.addEventListener('pointercancel', () => { pressing = false; });
  sheet.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn || btn.disabled || !S || !S.mission) return;
    Sfx.play('click');
    if (btn.classList.contains('x')) { close(); return; }
    if (btn.dataset.tab) { show(btn.dataset.tab); cats.dataset.k = ''; return; }
    if (btn.dataset.fin) { Game.openPanel('finance'); return; }
    const kind = btn.dataset.buy;
    if (!kind) return;
    if (armed === kind && performance.now() - armedAt < BUY_CONFIRM_MS) {
      armed = null;
      if (Actions.buy(kind)) { Game.banner(tr('Bought: {what}', { what: tr(BUILDINGS[kind].name) })); Sfx.play('coins'); }
      Game.acted();
    } else { armed = kind; armedAt = performance.now(); setTimeout(() => { if (armed === kind) { armed = null; key = ''; } }, BUY_CONFIRM_MS); }
    key = '';
  });
  // a tap anywhere else closes the sheet (not on the screens over the game: Finance opened from a card keeps it open)
  document.addEventListener('pointerdown', (e) => {
    if (!open || sheet.contains(e.target) || cats.contains(e.target) || e.target.closest('#overlay')) return;
    close();
  }, true);

  return { render, show, close, toggle, isOpen: () => !!open, reset: close };
})();
