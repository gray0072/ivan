'use strict';

// Arlanda Rising — the Terminal view (SPEC.md "Screens", key T): a tab for each terminal that stands and one for the kerb,
// the cut-away plan drawn by render/terminal.js (live in an ops stage: the queues and their waits, who is airside, who
// boards), and the card of the unit tapped: its brand with the rent it pays, what it earns a month and its payback, or
// the brands of the era that fit it — each with the same numbers — to open there. Brands are placed in the Office and in
// a plan stage (the time is stopped); in an ops stage the view is to watch, and the stage runs on behind it. Used by
// game.js and ui/office.js.

const TermView = (() => {
  const $ = (id) => document.getElementById(id);
  let back = null, editable = false, term = null, sel = null, cv = null, t = 0, key = '';

  function terms() { return TERMINAL_ORDER.filter((x) => Terminal.built(x) && (x !== 't1' || !(Airport.has('intlTerminal') && Airport.has('domTerminal')))); }

  function show(opts) {
    back = opts.back; editable = !!opts.edit;
    const list = terms();
    if (!term || list.indexOf(term) < 0) term = list.indexOf('intl') >= 0 ? 'intl' : list[0] || 't1';
    sel = null;
    render();
    Screens.show('terminal');
  }

  function render() {
    const p = $('terminal');
    const list = terms();
    let html = '<h1>🏪 ' + Text.esc(tr('Terminal view')) + '</h1><p class="when">' + Text.esc(fmtDate(S.day) + (S.ops ? ' · ' + fmtClock(S.clock) : '')) + '</p>' +
      '<div class="tabs">' + list.map((x) => '<button class="btn toggle' + (x === term ? ' on' : '') + '" data-term="' + x + '">' + Text.esc(tr(TERMINALS[x].name)) + '</button>').join('') + '</div>' +
      '<div class="cvWrap"><canvas id="termCanvas"></canvas></div><div id="termInfo" class="fine"></div><div id="unitCard"></div>';
    p.innerHTML = html;
    p.appendChild(Screens.row(Screens.btn(tr('Back'), 'default', () => back())));
    cv = $('termCanvas');
    key = '';
    info();
    unitCard();
    frame(0);
  }

  // the line under the plan: passengers, waits, desks, lanes, the brands' rent
  function info() {
    const el = $('termInfo');
    if (!el) return;
    const parts = [];
    if (term !== 'kerb') {
      parts.push(tr('About {n} passengers a day leave from here.', { n: groupThousands(Invest.termPax(term)) }));
      if (S.ops) parts.push(tr('Check-in: {a} min · security: {b} min', { a: Math.round(Passengers.wait()), b: Math.round(Passengers.secWait()) }));
    }
    const units = Terminal.units(term), rent = units.reduce((s, u) => s + (u.brand ? BRANDS[u.brand].rent : 0), 0);
    if (units.length) parts.push(tr('{a} of {b} units let · rent {m} a month', { a: units.filter((u) => u.brand).length, b: units.length, m: sek(rent) }));
    if (!editable) parts.push(S.ops ? tr('The stage goes on while you watch. Shops are chosen in the Office or a build stage.') : tr('To look only.'));
    el.textContent = parts.join(' · ');
  }

  // the card of the unit tapped
  function unitCard() {
    const el = $('unitCard');
    if (!el) return;
    const u = sel && Terminal.unit(sel);
    if (!u) { el.innerHTML = Terminal.units(term).length ? '<p class="fine">' + Text.esc(tr('Tap a unit to see it or to choose a brand for it.')) + '</p>' : ''; return; }
    let html = '<div class="ocard wideCard">';
    const sizeName = tr({ kiosk: 'kiosk', unit: 'unit', big: 'big unit', desk: 'desk' }[u.size]);
    if (u.brand) {
      const b = BRANDS[u.brand], m = Invest.money(u.price || UNIT_FIT[u.size], Invest.brand(u.brand, u.term));
      html += '<h3><img class="brandImg" src="' + BrandArt.url(u.brand) + '" alt=""> ' + Text.esc(b.name) + ' <small>' + Text.esc(sizeName) + '</small></h3>' +
        '<p>' + Text.esc(tr('Rent {r} a month · earns about {m} a month in all', { r: sek(b.rent), m: sek(m.in) })) + '</p>' +
        '<p class="fine">' + Text.esc(tr(FIT_TEXT[b.fit])) + (b.pax ? ' · ' + Text.esc(tr('Passengers +{n}', { n: b.pax })) : '') + '</p>' +
        '<p class="fine">' + Text.esc(tr('Since {y} in Sweden.', { y: b.from })) + '</p>';
      if (editable) html += '<div class="btnRow small"><button class="btn toggle" data-close="' + u.id + '">' + Text.esc(tr('Close it')) + '</button></div>';
    } else {
      html += '<h3>' + Text.esc(tr('An empty {size}', { size: sizeName })) + ' <small>' + Text.esc(tr('fit-out {m}', { m: sek(UNIT_FIT[u.size]) })) + '</small></h3>';
      const ids = brandsFor(Calendar.year(), u.size).filter((id) => !Terminal.units(u.term).some((x) => x.brand === id));
      if (!ids.length) html += '<p class="fine">' + Text.esc(tr('No brand of this year fits here.')) + '</p>';
      html += '<div class="brandList">' + ids.map((id) => {
        const b = BRANDS[id], m = Invest.whatIfBrand(id, u.term, u.size);
        return '<button class="brandOpt" data-brand="' + id + '"' + (editable ? '' : ' disabled') + '><img class="brandImg" src="' + BrandArt.url(id) + '" alt="">' +
          '<small>' + Text.esc(tr('rent {r} · about {m} a month', { r: sek(b.rent), m: sek(m.in) })) + '<br>' + Text.esc(m.payback !== null ? tr('pays back in {n} months', { n: Math.max(1, Math.round(m.payback)) }) : tr('never pays back at today\'s traffic')) +
          ' · ' + Text.esc(tr(FIT_TEXT[b.fit])) + '</small></button>';
      }).join('') + '</div>';
    }
    el.innerHTML = html + '</div>';
  }

  const FIT_TEXT = { all: 'For everybody', business: 'Business travellers spend more here', leisure: 'Holiday travellers spend more here',
    family: 'Families spend more here in summer and at Christmas', intl: 'Only international passengers buy here' };

  // each frame while it is open: the plan redrawn (the people move; in ops the queues change)
  function frame(dt) {
    if (!cv || Screens.current !== 'terminal') return;
    t += dt || 0;
    if (!cv.parentNode.clientWidth) return;
    const w = Math.max(300, cv.parentNode.clientWidth), h = Math.round(Math.min(420, Math.max(260, w * 0.5)));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.width = w + 'px'; cv.style.height = h + 'px'; }
    const c = cv.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    TermArt.draw(c, w, h, term, sel, t);
    // the info line follows the queues
    const k = S.ops ? Math.round(Passengers.wait()) + ':' + Math.round(Passengers.secWait()) + ':' + Math.floor(S.clock) : '';
    if (k !== key) { key = k; info(); }
  }

  $('terminal').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b && b.dataset.term) { Sfx.play('click'); term = b.dataset.term; sel = null; render(); return; }
    if (b && b.dataset.brand && editable && sel) {
      if (Actions.brand(sel, b.dataset.brand)) { Sfx.play('coins'); Game.banner(tr('{brand} opens in {term}', { brand: BRANDS[b.dataset.brand].name, term: tr(TERMINALS[term].name) })); Game.keepWorld(); Game.acted(); }
      else Sfx.play('sad');
      unitCard(); info();
      return;
    }
    if (b && b.dataset.close && editable) { if (Actions.closeBrand(b.dataset.close)) { Sfx.play('click'); Game.keepWorld(); } unitCard(); info(); return; }
    if (e.target === cv) {
      const r = cv.getBoundingClientRect(), h = TermArt.hit(e.clientX - r.left, e.clientY - r.top);
      sel = h ? h.id : null;
      if (h) Sfx.play('click');
      unitCard();
    }
  });

  return { show, frame, render, get open() { return Screens.current === 'terminal'; } };
})();
