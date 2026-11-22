'use strict';

// Arlanda Rising — the bar at the bottom of the game view: in ops time its live part — the check-in desks open of
// those there are (Open 2 of 4 desks, − / +; under them who runs them — "Terminal service runs them", the system, or
// "Your call: 12 min" while the player's own − / + holds; the same for the lanes and the booths), the ploughs to send
// when there is snow, the runway direction — the wind's (Runway 19 · the wind decides) or, when it is calm, the player's:
// 01 lands over Märsta, 19 takes off over it, and which is quieter with the flights of the next hour —, the teams that
// are short or on strike (Overtime) and the systems that are down; and always, in ops and plan time, the buy menu's three
// category buttons at its right end (ui/buymenu.js: Services, Vehicles, Build — every small build is bought there, in
// any kind of mission). Used by game.js.

const Toolbar = (() => {
  const box = document.getElementById('toolbar');
  const live = document.getElementById('tlive');
  let key = '';

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
    if (!S || !S.mission || (!S.ops && !S.plan)) { box.hidden = true; key = ''; BuyMenu.render(); return; }
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
    const k = JSON.stringify(parts.map((p) => p.map((x) => (typeof x === 'number' ? Math.round(x * 100) : x)))) + I18N.lang;
    box.hidden = false;
    BuyMenu.render();
    if (k === key) return;
    key = k;
    let html = '';
    for (const p of parts) {
      // the desks open of those there are ("Open 2 of 4 desks"), apart from the desks to buy (Build: 🧳 Check-in desk 4/12)
      if (p[0] === 'desks') html += '<div class="tgroup"><span class="tl" title="' + Text.esc(tr('Open desks check in the passengers and cost wages by the hour. More desks are bought under Build, at the right of this bar.')) + '">🧳 ' +
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
    live.innerHTML = html;
  }

  live.addEventListener('click', (e) => {
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
    Game.acted();
    key = '';
  });

  return { render, reset() { key = ''; BuyMenu.reset(); } };
})();
