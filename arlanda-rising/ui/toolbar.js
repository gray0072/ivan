'use strict';

// Arlanda Rising — the bar at the bottom of the game view: the check-in desks open of those there are (Open 2 of 4
// desks, − / +; session 7: under them who runs them — "Terminal service runs them", the system, or "Your call: 12 min"
// while the player's own − / + holds; the same for the lanes and the booths), the ploughs to send when there is snow, the runway direction — the wind's (Runway 19 · the wind decides)
// or, when it is calm, the player's: 01 lands over Märsta, 19 takes off over it, and which is quieter with the flights of
// the next hour — and the small builds of the era (a remote stand, a fuel truck, a plough, a desk; in plan time with the
// airport open also a kiosk, a café and car parks). Session 5: the security lanes and the passport booths open (− / +),
// de-icing trucks, booths, offices and hotel wings, a solar park and electric vehicles. A buy asks for a second tap with
// its price first. A thing with a limit (fuel and de-icing trucks, ploughs, crash tenders, the desks the halls have room
// for, the remote stands: Airport.cap) shows how many there are of the most (⛽ Fuel truck 3/6, 🧳 Check-in desk 4/12) and,
// at the limit, is disabled with the reason. The airport's own shops show the cells they take in a terminal beside the
// price, the cells free in all the terminals (🏪 Shop cells 3 of 6 free), and are disabled with the reason when no
// terminal has the room (Airport.roomFor). The car parks show their places against those the drivers need (🚗 Car parks
// 300 places, 700 needed), each what it would add a month, and are disabled once the places cover the need. The words come
// from ui/text.js (capWhy, buyTip, buyWhy, buyGain, parkingLine, dirOver), for the menus to share. Used by game.js.

const BUILD_ICONS = { stand: '🅿️', fuelTruck: '⛽', plough: '🚜', desk: '🧳', kiosk: '🏪', cafe: '☕', parkingSmall: '🚗', parkingBig: '🚙',
  crashTender: '🚒', generator: '🔋', dutyFree: '🛍️', restaurant: '🍽️', busStop: '🚌', lane: '🛂',
  deicer: '🧊', booth: '🛃', offices: '🏢', hotelExt: '🏨', solar: '☀️', evehicles: '🔌' };

const Toolbar = (() => {
  const box = document.getElementById('toolbar');
  let key = '', armed = null, armedAt = 0;

  function buys() {
    const m = Missions.def(), hands = S.mission.hands, y = Calendar.year(), out = [];
    const ok = (k) => BUILDINGS[k] && BUILDINGS[k].small && (!BUILDINGS[k].from || y >= BUILDINGS[k].from);
    if (S.ops) {
      if (S.airport.stands.length) out.push('stand');
      if (hands.indexOf('fuel') >= 0) out.push('fuelTruck');
      if (hands.indexOf('plough') >= 0 || Airport.ploughs() > 0) out.push('plough');
      if (Terminal.built('kerb')) out.push('desk');
      if (Object.keys(S.domains).some((d) => S.domains[d] >= 2) && !Airport.has('generator')) out.push('generator');
      if (S.airport.lanes) out.push('lane');
      // session 5: de-icing trucks while they are needed, passport booths
      if (S.domains.deice !== undefined && Systems.working('deice') < 2) out.push('deicer');
      if (Terminal.borderOn()) out.push('booth');
    } else if (S.plan && S.airport.open) {
      if (S.airport.lanes) out.push('lane');
      if (Terminal.borderOn()) out.push('booth');
      if (S.domains.deice !== undefined) out.push('deicer');
      // session 5: the free plots (real estate) and, from chapter 6, the green builds
      if (y >= 2000) out.push('offices', 'hotelExt');
      if (Green.on()) { if (Airport.count('solar') < 2) out.push('solar'); if (!Airport.has('evehicles')) out.push('evehicles'); }
      out.push('kiosk', 'cafe', 'parkingSmall', 'parkingBig', 'desk', 'stand');
      if (y >= 1963) out.push('crashTender', 'restaurant');
      if (Object.keys(S.domains).some((d) => S.domains[d] >= 2) && !Airport.has('generator')) out.push('generator');
      if (Airport.has('intlTerminal')) out.push('dutyFree');
      if (!Airport.has('busStop')) out.push('busStop');
    }
    void m;
    return out.filter(ok);
  }

  // who runs a kind of counter, as the small line under it: '' (the player), the team or the system, or the player's
  // own choice holding for n more minutes
  function runs(k) {
    const by = Passengers.runBy(k);
    if (!by) return '';
    const held = Passengers.held(k);
    if (held) return '✋ ' + tr('Your call: {n} min', { n: Math.ceil(held) });
    const dom = { desks: 'checkin', lanes: 'security', booths: 'border' }[k];
    if (by === 'system') return '⚙️ ' + tr('{sys} runs them', { sys: Text.level(dom, S.domains[dom]) });
    return '👥 ' + tr('{dept} runs them', { dept: Text.dept(dom) });
  }
  const runLine = (t) => (t ? '<br><small>' + Text.esc(t) + '</small>' : '');

  function render() {
    if (!S || !S.mission || (!S.ops && !S.plan)) { box.hidden = true; key = ''; return; }
    const parts = [];
    if (S.ops) {
      if (S.airport.desks > 0) parts.push(['desks', S.ops.desksOpen, S.airport.desks, runs('desks')]);
      for (const id of Runways.surfaces()) {
        const s = Runways.surface(id);
        if (s.snow >= 0.8 || s.plough) parts.push(['plough', id, !!s.plough || S.ops.ploughQueue.indexOf(id) >= 0, Airport.ploughs() > 0]);
      }
      if (Terminal.lanes()) parts.push(Terminal.secDomain() ? ['lanes', Terminal.lanes(), Terminal.lanesUp(), Passengers.secWait(), runs('lanes')] : ['sec', Passengers.secWait(), Terminal.lanes()]);
      if (Terminal.borderOn()) parts.push(['booths', Terminal.booths(), S.airport.booths, Passengers.borderWait(), runs('booths')]);
      const rw = Runways.main();
      if (rw) { const calm = Weather.now().wind < CALM_WIND; parts.push(['dir', Runways.direction(rw), calm, calm ? Runways.noiseAhead().dir : null]); }
      // the teams that are short or on strike today (overtime brings everybody in), the systems that are down
      for (const d of Object.keys(S.domains)) {
        if (Systems.down(d)) parts.push(['down', d, Math.ceil(S.ops.down[d].until - S.clock)]);
        else if (Systems.working(d) === 1 && People.capacity(d) < 0.95) parts.push(['short', d, People.capacity(d), People.striking(d), !!(S.ops.overtime && S.ops.overtime[d])]);
      }
    }
    const b = buys();
    const k = JSON.stringify(parts.map((p) => p.map((x) => (typeof x === 'number' ? Math.round(x * 100) : x)))) + b.join() + armed + I18N.lang + (Settings.short() ? 1 : 0) + Math.floor(S.money / 1e5) + JSON.stringify((S.plan && S.plan.buys) || []) + S.airport.items.length +
      '|' + S.airport.stands.length + '|' + S.airport.runways.length + '|' + (b.some((k) => BUILDINGS[k].places) ? Airport.parkingNeed() : '');
    box.hidden = false;
    if (k === key) return;
    key = k;
    let html = '';
    for (const p of parts) {
      // the desks open of those there are ("Open 2 of 4 desks"), apart from the desks to buy (🧳 Check-in desk 4/12)
      if (p[0] === 'desks') html += '<div class="tgroup"><span class="tl" title="' + Text.esc(tr('Open desks check in the passengers and cost wages by the hour. To have more desks, buy them below.')) + '">🧳 ' +
        Text.esc(tr('Open {open} of {n} desks', { open: '\u0001', n: p[2] })).replace('\u0001', '<b>' + p[1] + '</b>') + runLine(p[3]) + '</span>' +
        '<button class="tb small" data-act="deskMinus"' + (p[1] <= 0 ? ' disabled' : '') + '>−</button><button class="tb small" data-act="deskPlus"' + (p[1] >= p[2] ? ' disabled' : '') + '>+</button></div>';
      else if (p[0] === 'plough') html += '<button class="tb' + (p[2] ? ' busy' : '') + '" data-act="plough" data-s="' + p[1] + '"' + (p[2] || !p[3] ? ' disabled' : '') + '>🚜 ' +
        Text.esc(p[2] ? tr('Ploughing') : tr('Plough')) + '<small>' + Text.esc(Text.surface(p[1])) + '</small></button>';
      // the wind decides the direction; when it is calm the player does: each button says what it flies over the town,
      // and the group which one is quieter for the neighbours with the flights of the next hour (Runways.noiseAhead)
      else if (p[0] === 'dir' && !p[2]) html += '<div class="tgroup"><span class="tl" title="' + Text.esc(tr('Into the wind')) + '">🛫 ' + Text.esc(tr('Runway')) + ' <b>' + p[1] + '</b> · ' + Text.esc(tr('the wind decides')) + '</span></div>';
      else if (p[0] === 'dir') html += '<div class="tgroup"><span class="tl" title="' + Text.esc(tr('Calm wind: you choose the direction. Take-offs are louder than landings: the neighbours hear which way they fly.')) + '">🛫 ' + Text.esc(tr('Runway')) +
        (p[3] ? '<br><small>🏡 ' + Text.esc(tr('{dir} is quieter now', { dir: p[3] })) + '</small>' : '') + '</span>' +
        ['01', '19'].map((d) => '<button class="tb' + (p[1].slice(0, 2) === d ? ' on' : '') + '" data-act="dir" data-d="' + d + '">' + d + '<small>' + Text.esc(Text.dirOver(d)) + '</small></button>').join('') + '</div>';
      else if (p[0] === 'sec') html += '<div class="tgroup' + (p[1] >= 10 ? ' warnGroup' : '') + '"><span class="tl">🛂 ' + Text.esc(tr('Security {n} min · {l} lanes', { n: Math.round(p[1]), l: p[2] })) + '</span>' +
        '<button class="tb small" data-act="tview" title="' + Text.esc(tr('Terminal view (T)')) + '">🏪</button></div>';
      else if (p[0] === 'lanes') html += '<div class="tgroup' + (p[3] >= 10 ? ' warnGroup' : '') + '"><span class="tl">🛂 ' + Text.esc(tr('Lanes')) + ' <b>' + p[1] + '/' + p[2] + '</b> · ' +
        Text.esc(tr('{n} min', { n: Math.round(p[3]) })) + runLine(p[4]) + '</span><button class="tb small" data-act="laneMinus"' + (p[1] <= 1 ? ' disabled' : '') + '>−</button><button class="tb small" data-act="lanePlus"' +
        (p[1] >= p[2] ? ' disabled' : '') + '>+</button></div>';
      else if (p[0] === 'booths') html += '<div class="tgroup' + (p[3] >= 10 ? ' warnGroup' : '') + '"><span class="tl">🛃 ' + Text.esc(tr('Booths')) + ' <b>' + p[1] + '/' + p[2] + '</b> · ' +
        Text.esc(tr('{n} min', { n: Math.round(Math.min(99, p[3])) })) + runLine(p[4]) + '</span><button class="tb small" data-act="boothMinus"' + (p[1] <= 0 ? ' disabled' : '') + '>−</button><button class="tb small" data-act="boothPlus"' +
        (p[1] >= p[2] ? ' disabled' : '') + '>+</button></div>';
      else if (p[0] === 'down') html += '<div class="tgroup warnGroup"><span class="tl">⚠️ ' + Text.esc(tr('{sys} is down: {n} min', { sys: Text.level(p[1], S.domains[p[1]]), n: p[2] })) + '</span></div>';
      else if (p[0] === 'short') html += '<div class="tgroup warnGroup"><span class="tl">' + (p[3] ? '✊ ' : '🤒 ') + Text.esc(p[3] ? tr('{dept} on strike', { dept: Text.dept(p[1]) }) : tr('{dept}: {p} at work', { dept: Text.dept(p[1]), p: Math.round(p[2] * 100) + ' %' })) + '</span>' +
        (p[3] ? '' : '<button class="tb small" data-act="overtime" data-d="' + p[1] + '" title="' + Text.esc(tr('Everybody in, at overtime pay')) + '">⏱️ ' + Text.esc(tr('Overtime')) + '</button>') + '</div>';
    }
    // the shops' cells free in the terminals, and how much of the drivers the car parks take
    if (b.some((k) => BUILDINGS[k].cells)) {
      const max = Airport.cellsMax(), free = max - Airport.cellsTaken();
      html += '<div class="tgroup' + (free <= 0 ? ' fullGroup' : '') + '"><span class="tl" title="' + Text.esc(tr('Your own shops take cells in the terminals: a kiosk 1, a café 2, a restaurant 3, a duty-free shop 4. Each terminal adds its cells. To make room, sell a shop from its terminal\'s card: tap the terminal.')) + '">🏪 ' +
        Text.esc(tr('Shop cells')) + ' <b>' + Text.esc(tr('{free} of {max} free', { free, max })) + '</b></span></div>';
    }
    // the car parks' places against those the drivers need at today's traffic (green once they cover it)
    if (b.some((k) => BUILDINGS[k].places)) {
      html += '<div class="tgroup' + (Airport.places(true) >= Airport.parkingNeed() ? ' fullGroup' : '') + '"><span class="tl" title="' + Text.esc(Text.parkingTip()) + '">🚗 ' + Text.esc(tr('Car parks')) +
        ' <b>' + Text.esc(Text.parkingLine()) + '</b></span></div>';
    }
    // a thing with a limit (Airport.cap: the vehicles, the desks, the remote stands) shows how many there are of the most
    // worth having, 3/6, and why it stops there; a shop the cells it takes, and with no terminal that has them free, why it
    // cannot be bought; a car park what it would add a month, and nothing once the drivers have their places
    for (const kind of b) {
      const bd = BUILDINGS[kind], conf = armed === kind, full = Airport.full(kind), cap = Airport.cap(kind);
      const n = Airport.owned(kind), tip = Text.buyTip(kind), gain = bd.places && !full ? Text.buyGain(kind) : '';
      html += '<button class="tb buy' + (conf ? ' confirm' : '') + '" data-buy="' + kind + '"' + (full ? ' disabled' : '') + (S.money < bd.price && !conf ? ' data-poor="1"' : '') +
        (tip ? ' title="' + Text.esc(tip) + '"' : '') + '>' + BUILD_ICONS[kind] + ' ' +
        Text.esc(conf ? tr('Buy?') : tr(bd.name)) + (cap ? ' <em>' + n + '/' + cap.max + '</em>' : n && (bd.shop || bd.places) ? ' <em>×' + n + '</em>' : '') + '<small>' +
        (full ? Text.esc(Text.buyWhy(kind)) :
          sekBare(bd.price) + (bd.cells ? ' · ' + Text.esc(Text.cells(bd.cells)) : '') + (bd.days && S.plan ? ' · ' + tr('{n} days', { n: bd.days }) : '') + (gain ? ' · ' + Text.esc(gain) : '')) + '</small></button>';
    }
    box.innerHTML = html;
  }

  box.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn || btn.disabled || !S || !S.mission) return;
    Sfx.play('click');
    const act = btn.dataset.act;
    if (act === 'deskPlus') Actions.desks(S.ops.desksOpen + 1);
    else if (act === 'deskMinus') Actions.desks(S.ops.desksOpen - 1);
    else if (act === 'lanePlus') Actions.lanes(Terminal.lanes() + 1);
    else if (act === 'laneMinus') Actions.lanes(Terminal.lanes() - 1);
    else if (act === 'boothPlus') Actions.booths(Terminal.booths() + 1);
    else if (act === 'boothMinus') Actions.booths(Terminal.booths() - 1);
    else if (act === 'plough') Actions.plough(btn.dataset.s);
    else if (act === 'dir') Actions.dir(btn.dataset.d);
    else if (act === 'tview') Game.openPanel('terminal');
    else if (act === 'overtime') { if (Actions.overtime(btn.dataset.d)) Game.banner(tr('Overtime: everybody in for {dept}', { dept: Text.dept(btn.dataset.d) })); }
    else if (btn.dataset.buy) {
      const kind = btn.dataset.buy;
      if (armed === kind && performance.now() - armedAt < BUY_CONFIRM_MS) {
        armed = null;
        if (Actions.buy(kind)) { Game.banner(tr('Bought: {what}', { what: tr(BUILDINGS[kind].name) })); Sfx.play('coins'); }
      } else { armed = kind; armedAt = performance.now(); setTimeout(() => { if (armed === kind) { armed = null; key = ''; } }, BUY_CONFIRM_MS); }
    }
    Game.acted();
    key = '';
  });

  return { render, reset() { key = ''; armed = null; } };
})();
