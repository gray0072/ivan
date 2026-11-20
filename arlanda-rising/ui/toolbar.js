'use strict';

// Arlanda Rising — the bar at the bottom of the game view: the check-in desks open (− / +), the ploughs to send when
// there is snow, the runway direction when the wind is calm (01 lands over Märsta, 19 takes off over it), and the
// small builds of the era (a remote stand, a fuel truck, a plough, a desk; in plan time with the airport open also
// a kiosk, a café and car parks). Session 5: the security lanes and the passport booths open (− / +), de-icing trucks,
// booths, offices and hotel wings, a solar park and electric vehicles. A buy asks for a second tap with its price
// first. Used by game.js.

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
      if (Airport.has('terminal')) out.push('desk');
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
      if (Airport.has('intlTerminal') && !Airport.has('dutyFree')) out.push('dutyFree');
      if (!Airport.has('busStop')) out.push('busStop');
    }
    void m;
    return out.filter(ok);
  }

  function render() {
    if (!S || !S.mission || (!S.ops && !S.plan)) { box.hidden = true; key = ''; return; }
    const parts = [];
    if (S.ops) {
      if (S.airport.desks > 0) parts.push(['desks', S.ops.desksOpen, S.airport.desks]);
      for (const id of Runways.surfaces()) {
        const s = Runways.surface(id);
        if (s.snow >= 0.8 || s.plough) parts.push(['plough', id, !!s.plough || S.ops.ploughQueue.indexOf(id) >= 0, Airport.ploughs() > 0]);
      }
      if (Terminal.lanes()) parts.push(Terminal.secDomain() ? ['lanes', Terminal.lanes(), Terminal.lanesUp(), Passengers.secWait()] : ['sec', Passengers.secWait(), Terminal.lanes()]);
      if (Terminal.borderOn()) parts.push(['booths', Terminal.booths(), S.airport.booths, Passengers.borderWait()]);
      const rw = Runways.main();
      if (rw) { const w = Weather.now(); parts.push(['dir', Runways.direction(rw), w.wind < CALM_WIND]); }
      // the teams that are short or on strike today (overtime brings everybody in), the systems that are down
      for (const d of Object.keys(S.domains)) {
        if (Systems.down(d)) parts.push(['down', d, Math.ceil(S.ops.down[d].until - S.clock)]);
        else if (Systems.working(d) === 1 && People.capacity(d) < 0.95) parts.push(['short', d, People.capacity(d), People.striking(d), !!(S.ops.overtime && S.ops.overtime[d])]);
      }
    }
    const b = buys();
    const k = JSON.stringify(parts.map((p) => p.map((x) => (typeof x === 'number' ? Math.round(x * 100) : x)))) + b.join() + armed + I18N.lang + (Settings.short() ? 1 : 0) + Math.floor(S.money / 1e5);
    box.hidden = false;
    if (k === key) return;
    key = k;
    let html = '';
    for (const p of parts) {
      if (p[0] === 'desks') html += '<div class="tgroup"><span class="tl">🧳 ' + Text.esc(tr('Desks open')) + ' <b>' + p[1] + '/' + p[2] + '</b></span>' +
        '<button class="tb small" data-act="deskMinus"' + (p[1] <= 0 ? ' disabled' : '') + '>−</button><button class="tb small" data-act="deskPlus"' + (p[1] >= p[2] ? ' disabled' : '') + '>+</button></div>';
      else if (p[0] === 'plough') html += '<button class="tb' + (p[2] ? ' busy' : '') + '" data-act="plough" data-s="' + p[1] + '"' + (p[2] || !p[3] ? ' disabled' : '') + '>🚜 ' +
        Text.esc(p[2] ? tr('Ploughing') : tr('Plough')) + '<small>' + Text.esc(Text.surface(p[1])) + '</small></button>';
      else if (p[0] === 'dir') html += '<div class="tgroup"><span class="tl" title="' + Text.esc(p[2] ? tr('Calm wind: you choose the direction') : tr('Into the wind')) + '">🛫 ' + Text.esc(tr('Runway')) + '</span>' +
        ['01', '19'].map((d) => '<button class="tb small' + (p[1] === d ? ' on' : '') + '" data-act="dir" data-d="' + d + '"' + (p[2] ? '' : ' disabled') + '>' + d + '</button>').join('') + '</div>';
      else if (p[0] === 'sec') html += '<div class="tgroup' + (p[1] >= 10 ? ' warnGroup' : '') + '"><span class="tl">🛂 ' + Text.esc(tr('Security {n} min · {l} lanes', { n: Math.round(p[1]), l: p[2] })) + '</span>' +
        '<button class="tb small" data-act="tview" title="' + Text.esc(tr('Terminal view (T)')) + '">🏪</button></div>';
      else if (p[0] === 'lanes') html += '<div class="tgroup' + (p[3] >= 10 ? ' warnGroup' : '') + '"><span class="tl">🛂 ' + Text.esc(tr('Lanes')) + ' <b>' + p[1] + '/' + p[2] + '</b> · ' +
        Text.esc(tr('{n} min', { n: Math.round(p[3]) })) + '</span><button class="tb small" data-act="laneMinus"' + (p[1] <= 1 ? ' disabled' : '') + '>−</button><button class="tb small" data-act="lanePlus"' +
        (p[1] >= p[2] ? ' disabled' : '') + '>+</button></div>';
      else if (p[0] === 'booths') html += '<div class="tgroup' + (p[3] >= 10 ? ' warnGroup' : '') + '"><span class="tl">🛃 ' + Text.esc(tr('Booths')) + ' <b>' + p[1] + '/' + p[2] + '</b> · ' +
        Text.esc(tr('{n} min', { n: Math.round(Math.min(99, p[3])) })) + '</span><button class="tb small" data-act="boothMinus"' + (p[1] <= 0 ? ' disabled' : '') + '>−</button><button class="tb small" data-act="boothPlus"' +
        (p[1] >= p[2] ? ' disabled' : '') + '>+</button></div>';
      else if (p[0] === 'down') html += '<div class="tgroup warnGroup"><span class="tl">⚠️ ' + Text.esc(tr('{sys} is down: {n} min', { sys: Text.level(p[1], S.domains[p[1]]), n: p[2] })) + '</span></div>';
      else if (p[0] === 'short') html += '<div class="tgroup warnGroup"><span class="tl">' + (p[3] ? '✊ ' : '🤒 ') + Text.esc(p[3] ? tr('{dept} on strike', { dept: Text.dept(p[1]) }) : tr('{dept}: {p} at work', { dept: Text.dept(p[1]), p: Math.round(p[2] * 100) + ' %' })) + '</span>' +
        (p[3] ? '' : '<button class="tb small" data-act="overtime" data-d="' + p[1] + '" title="' + Text.esc(tr('Everybody in, at overtime pay')) + '">⏱️ ' + Text.esc(tr('Overtime')) + '</button>') + '</div>';
    }
    for (const kind of b) {
      const bd = BUILDINGS[kind], conf = armed === kind;
      html += '<button class="tb buy' + (conf ? ' confirm' : '') + '" data-buy="' + kind + '"' + (S.money < bd.price && !conf ? ' data-poor="1"' : '') + '>' + BUILD_ICONS[kind] + ' ' +
        Text.esc(conf ? tr('Buy?') : tr(bd.name)) + '<small>' + sek(bd.price) + (bd.days && S.plan ? ' · ' + tr('{n} days', { n: bd.days }) : '') + '</small></button>';
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
