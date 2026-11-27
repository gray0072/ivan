'use strict';

// Arlanda Rising — the Airlines screen (SPEC.md "Screens", key A): from chapter 4 the Offers board at the top (two
// offers between missions, taken at once in the Office: sim/offers.js), then a card for each airline flying here or
// that could — its emblem, kind and temper in words, mood, flights a day, the fees it pays a month, its on-time share,
// its route incentive and its rival airport — and the route-incentive tool: a share of its fees off for two years, to
// court an airline that is not here yet (it says yes when the share is what its temper needs) or to keep one that is.
// In the Office every button works at once; during play it is to look only. Used by game.js and ui/office.js.

const AirlinesUI = (() => {
  const $ = (id) => document.getElementById(id);
  let back = null, editable = false;
  const KIND = { home: 'Home carrier', domestic: 'Domestic', charter: 'Charter', network: 'European network', lowcost: 'Low-cost', longhaul: 'Long-haul', cargo: 'Cargo', business: 'Business jets', future: 'Future' };

  function show(opts) {
    back = opts.back; editable = !!opts.edit;
    render();
    Screens.show('airlines');
  }

  // the airline's temper in words, from its numbers
  function temper(code) {
    const t = (AIRLINES[code] || {}).temper || {}, out = [];
    if (t.contact) out.push(tr('Wants stands next to the terminal.'));
    else out.push(tr('Remote stands and buses are fine.'));
    if ((t.fees || 1) >= 2) out.push(tr('Every krona of fees counts: it leaves for a cheaper airport.'));
    else if ((t.fees || 1) >= 1.4) out.push(tr('Watches the fees closely.'));
    if ((t.patience || 1) <= 0.9) out.push(tr('Patient with delays.'));
    else if ((t.patience || 1) >= 1.2) out.push(tr('Quick to get upset by delays.'));
    return out;
  }

  function board() {
    const b = Offers.board();
    if (!b || !b.cards.length) return '';
    let html = '<p class="label">📋 ' + Text.esc(tr('The Offers board')) + '</p><div class="cards">';
    b.cards.forEach((def, i) => {
      const p = {};
      for (const key of Object.keys(def.params || {})) p[key] = typeof def.params[key] === 'string' ? tr(def.params[key]) : key.indexOf('sek') === 0 ? sek(def.params[key]) : def.params[key];
      html += '<div class="ocard"><h3>' + (def.icon || '') + ' ' + Text.esc(tr(def.title, p)) + '</h3><p>' + Text.esc(tr(def.text, p)) + '</p>';
      if (b.taken[i]) html += '<p class="fine">✓ ' + Text.esc(tr((def.options.find((o) => o.id === b.taken[i]) || {}).label || '')) + '</p>';
      else html += '<div class="opts">' + def.options.map((o) => '<button class="opt" data-offer="' + i + '" data-opt="' + o.id + '"' + (editable ? '' : ' disabled') + '><b>' +
        Text.esc(o.manager ? Text.manager(o.manager) : tr(o.label || o.id)) + '</b><small>' + Text.esc(Text.effects(o)) + '</small></button>').join('') + '</div>';
      html += '</div>';
    });
    return html + '</div><p class="fine">' + Text.esc(tr('New offers come when the calendar moves on, after the next mission.')) + '</p>';
  }

  function render() {
    const p = $('airlines'), y = Calendar.year();
    let html = '<h1>✈️ ' + Text.esc(tr('Airlines')) + '</h1><p class="when">' + Text.esc(fmtNow()) + ' · ✈️ ' + Text.esc(Text.meterName('airlines')) + ': <b>' + Math.round(S.meters.airlines) + '</b>' +
      (S.airport.fees && S.airport.fees !== 'normal' ? ' · ' + Text.esc(tr(S.airport.fees === 'low' ? 'Fees: lower' : 'Fees: higher')) : '') + '</p>';
    html += board();
    const codes = Object.keys(AIRLINES).filter((c) => Airlines.perDay(c) > 0 || (S.airport.openSkies && Airlines.inEra(c) && Airlines.courtRoute(c)));
    codes.sort((a, b) => Airlines.perDay(b) - Airlines.perDay(a));
    html += '<div class="cards">';
    for (const code of codes) {
      const d = AIRLINES[code], al = S.airlines[code] || { mood: 70, routes: [] }, n = Airlines.perDay(code), ot = Airlines.onTime(code);
      html += '<div class="ocard"><h3><img class="emb" src="' + Emblems.url(code, y) + '" alt=""> ' + Text.esc(d.name) + ' <small>' + Text.esc(tr(KIND[d.kind] || d.kind)) + '</small></h3>';
      if (n > 0) {
        html += '<p class="kv">' + Text.esc(tr('Mood')) + ' <span class="mbar small"><i class="' + (al.mood < 45 ? 'low' : al.mood < 60 ? 'mid' : '') + '" style="width:' + Math.round(al.mood) + '%"></i></span> <b>' + Math.round(al.mood) + '</b></p>' +
          '<p>' + Text.esc(tr('{n} flights a day · fees {m} a month', { n: Text.num(n, 1), m: sek(Airlines.monthFees(code)) })) + '</p>' +
          (ot !== null ? '<p>' + Text.esc(tr('On time here: {p}', { p: Text.pct(ot) })) + '</p>' : '');
        if (al.incentive && S.day < al.incentive.until) html += '<p class="fine">🤝 ' + Text.esc(tr('{p} off its fees until {d}', { p: Text.pct(al.incentive.share), d: fmtDate(al.incentive.until) })) + '</p>';
        if (al.term) html += '<p class="fine">🏢 ' + Text.esc(tr(Terminal.name(al.term))) + '</p>';
      } else {
        const r = Airlines.courtRoute(code);
        html += '<p>' + Text.esc(tr('Not flying here. It would start {n} flights a day with its {type}.', { n: r.perDay, type: AIRCRAFT[r.type].name })) + '</p>';
      }
      html += '<p class="fine">' + temper(code).map((x) => Text.esc(x)).join(' ') + (d.rival && S.airport.rivals ? ' ' + Text.esc(tr('Its other choice: {r}.', { r: tr(d.rival) })) : '') + '</p>';
      if (editable && S.airport.openSkies) {
        if (n > 0 && !(al.incentive && S.day < al.incentive.until)) html += '<div class="btnRow small"><button class="btn toggle" data-inc="' + code + '" data-share="0.1">🤝 ' + Text.esc(tr('{p} off for two years', { p: '10 %' })) + '</button></div>';
        else if (n === 0) html += '<div class="btnRow small">' + [0.1, 0.25, 0.5].map((s) => '<button class="btn toggle" data-court="' + code + '" data-share="' + s + '">🤝 ' + Math.round(s * 100) + ' %</button>').join('') + '</div>' +
          '<p class="fine">' + Text.esc(tr('Court it: offer a share off its fees for two years.')) + '</p>';
      }
      html += '</div>';
    }
    html += '</div>';
    if (!S.airport.openSkies) html += '<p class="fine">' + Text.esc(tr('Route incentives and the Offers board come with chapter 4.')) + '</p>';
    p.innerHTML = html;
    p.appendChild(Screens.row(Screens.btn(tr('Back'), 'default', () => back())));
  }

  $('airlines').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || !editable) return;
    if (b.dataset.offer !== undefined) {
      if (Actions.offer(+b.dataset.offer, b.dataset.opt)) { Sfx.play('chord'); Game.keepWorld(); render(); }
      return;
    }
    if (b.dataset.court) {
      const code = b.dataset.court, ok = Actions.court(code, +b.dataset.share);
      Game.banner(ok ? tr('{al} says yes: its first flights come soon.', { al: AIRLINES[code].name }) : tr('{al} says no: it wants more.', { al: AIRLINES[code].name }), 3500);
      Sfx.play(ok ? 'chord' : 'sad');
      Game.keepWorld(); render();
      return;
    }
    if (b.dataset.inc) { if (Actions.incentive(b.dataset.inc, +b.dataset.share)) { Sfx.play('click'); Game.keepWorld(); render(); } }
  });

  return { show, render };
})();
