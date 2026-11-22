'use strict';

// Arlanda Rising — the card of a building or a vehicle tapped on the map: what it is (data/sites.js), whether it stands,
// is being built or is closed, its main numbers (size, jobs, upkeep or rent) and what it is doing now — a terminal's
// passengers at check-in, at security, airside and at the gates, its desks and lanes, its brands, the airport's own shops
// in its cells ("Shops: 4 / 6 cells") each with a Sell button in plan time (a second tap sells it: Actions.sell); the tower's runway and
// movements; the fire category and the crash tenders of the most worth having; the bags; the systems; and for a fuel
// truck or a snowplough where it is, how many the airport has of the most worth having (Airport.cap) and what it did
// this stage and since the airport opened (sim/fleet.js). Refreshed while it is open; the building or the vehicle is
// ringed on the map (MapView.view). Used by game.js.

const SiteCard = (() => {
  const box = document.getElementById('siteCard');
  let sel = null;   // { key } of a building (the card's key, data/sites.js) or { kind: 'fuel' | 'plough', i }
  let armed = null, armedAt = 0;   // the shop (item id) whose Sell was tapped once: a second tap sells it

  const cardKey = (k) => (SITES[k] && SITES[k].same) || k;
  function open(what) {
    sel = what.vehicle ? { kind: what.vehicle.kind, i: what.vehicle.i } : { key: cardKey(what.site.key) };
    MapView.view.site = sel.key || null;
    MapView.view.partOf = cardKey;
    MapView.view.vehicle = sel.kind ? { kind: sel.kind, i: sel.i } : null;
    box.dataset.html = '';
    render();
    box.hidden = false;
  }
  function close() {
    sel = null; box.hidden = true;
    MapView.view.site = null; MapView.view.vehicle = null;
  }

  const row = (k, v) => '<tr><td>' + Text.esc(k) + '</td><td>' + Text.esc(v) + '</td></tr>';
  const head = (icon, name, state) => '<button class="x" aria-label="Close">✕</button><div class="scHead"><span class="scIcon">' + icon + '</span><div><b>' +
    Text.esc(name) + '</b>' + (state ? '<small>' + Text.esc(state) + '</small>' : '') + '</div></div>';
  const people = (n) => groupThousands(Math.round(n));
  const litres = (n) => tr('{n} L', { n: groupThousands(n) });
  const m2 = (n) => groupThousands(n) + ' m²';
  const m3 = (n) => groupThousands(n) + ' m³';
  const runs = (n) => (n === 1 ? tr('1 run') : tr('{n} runs', { n }));
  const planes = (n) => (n === 1 ? tr('1 aircraft') : tr('{n} aircraft', { n }));
  // a queue's wait; 999 when nothing is open
  const wait = (m) => (m >= 999 ? tr('nothing open') : Text.duration(Math.round(m)));
  const section = (title) => '</table><h4>' + Text.esc(title) + '</h4><table>';

  // the building's size from data/layout.js: "75 × 255 m, 14 m high"
  function size(key) {
    const L = LAYOUT[key];
    if (!L) return null;
    let b = L.box, h = L.h;
    if (key === 'pier2040' && S.airport.pierDesign === 'satellite') b = L.sat;
    if (key === 'pierArm') { b = LAYOUT.pier2040.arm; h = LAYOUT.pier2040.h - 2; }
    if (!b && L.base) b = [0, 0, L.base, L.base];
    if (!b) return null;
    const w = Math.round(b[2] - b[0]), l = Math.round(b[3] - b[1]);
    return h ? tr('{w} × {l} m, {h} m high', { w, l, h: Math.round(h) }) : tr('{w} × {l} m', { w, l });
  }
  // stands, is being built (its share), or is closed
  function state(d) {
    const n = Airport.count(d.item);
    const pr = d.project && S.airport.projects[d.project];
    if (!n && pr) {
      const st = pr.stages[d.stage];
      return tr('Being built: {p}', { p: Text.pct(st ? st.p : 0) });
    }
    for (const t of Object.keys(TERMINALS)) if (TERMINALS[t].item === d.item && Terminal.mothballed(t)) return tr('Closed until better times');
    return n > 1 ? tr('{n} of them', { n }) : tr('Open');
  }

  // ---------- a building ----------
  function building(key) {
    const d = SITES[key], B = BUILDINGS[d.item] || {}, n = Math.max(1, Airport.count(d.item));
    let html = head(d.icon, tr(d.term ? Terminal.name(d.term) : B.name || key), state(d)) + '<p class="about">' + Text.esc(tr(d.about)) + '</p><table>';
    const sz = size(key);
    if (sz) html += row(tr('Size'), sz);
    if (B.staff) html += row(tr('Staff'), Text.jobs(B.staff * n));
    const price = S.airport.items.filter((it) => it.kind === d.item).reduce((s, it) => s + (it.price || 0), 0);
    if (price > 0) html += row(tr('Upkeep a month'), sek(price * UPKEEP_YEAR / 12));
    if (B.rent) html += row(tr('Rent a month'), sek(B.rent * n));
    html += live(d);
    return html + '</table>';
  }

  // what it does now
  function live(d) {
    let h = '';
    const ops = !!S.ops, t = S.clock;
    switch (d.does) {
      case 'terminal': case 'pier': {
        const term = d.term, cr = TermArt.crowd(term);
        h += section(ops ? tr('Now') : tr('A usual day'));
        if (ops) {
          const deps = S.ops.flights.filter((f) => f.booked > 0 && !f.training && Terminal.of(f.al, f.intl, f.type) === term);
          if (d.does === 'terminal') {
            h += row(tr('Departures this stage'), String(deps.length));
            h += row(tr('Queueing at check-in'), people(cr.checkin) + ' · ' + wait(Passengers.wait()));
            if (S.airport.lanes) h += row(tr('Queueing at security'), people(cr.sec) + ' · ' + wait(Passengers.secWait()));
            h += row(tr('Check-in desks open'), S.ops.desksOpen + ' / ' + S.airport.desks);
            h += row(tr('Room for check-in desks'), tr('{n} in all the halls', { n: Airport.deskRoom() }));
            if (S.airport.lanes) h += row(tr('Security lanes open'), Terminal.lanes() + ' / ' + S.airport.lanes);
          }
          h += row(tr('Airside'), people(cr.airside));
          h += row(tr('At the gates'), people(cr.gates.reduce((s, g) => s + g.n, 0)));
          const boarding = deps.filter((f) => f.tr && f.tr.board !== null && f.tr.ready === null).map((f) => f.no);
          h += row(tr('Boarding'), boarding.length ? boarding.join(', ') : '—');
        } else h += row(tr('Passengers a day'), people(Invest.termPax(term)));
        const brands = Terminal.units(term).filter((u) => u.brand).map((u) => BRANDS[u.brand].name);
        if (S.airport.units) h += row(tr('Brands'), brands.length ? brands.join(', ') : tr('none yet'));
        if (d.does === 'terminal' && Airport.cellsMax(term)) h += cells(term);
        break;
      }
      case 'mall': {
        const brands = Terminal.units('sky').filter((u) => u.brand).map((u) => BRANDS[u.brand].name);
        h += row(tr('Shops'), brands.length ? brands.join(', ') : tr('none yet'));
        h += row(tr('Visitors a day'), people(Invest.termPax('sky')));
        break;
      }
      case 'tower': {
        const rw = Runways.inUse();
        h += section(ops ? tr('Now') : tr('The runways'));
        if (ops) {
          if (rw) h += row(tr('Runway in use'), rw.name + ' · ' + Runways.direction(rw));
          h += row(tr('Landings this stage'), String(S.ops.flights.filter((f) => f.landed !== null && f.landed !== undefined).length));
          h += row(tr('Take-offs this stage'), String(S.ops.flights.filter((f) => f.airborne !== undefined).length));
          h += row(tr('Holding, waiting to land'), String(S.ops.flights.filter((f) => f.st === 'approach' && f.eta !== null && t > f.eta + 0.5).length));
          h += row(tr('Visibility'), groupThousands(Weather.now().vis) + ' ' + tr('m'));
        } else h += row(tr('Runways'), S.airport.runways.map((r) => r.name).join(', ') || '—');
        break;
      }
      case 'fire':
        h += row(tr('Fire category'), String(Airport.fireCat()));
        h += row(tr('Crash tenders bought'), worth('crashTender'));
        break;
      case 'bags':
        if (S.domains.baggage !== undefined) h += row(tr('Baggage'), Text.level('baggage', S.domains.baggage));
        if (ops) {
          h += row(tr('Carts out now'), String(S.ops.flights.filter((f) => f.tr && f.tr.bags === 'going').length));
          h += row(tr('Bags lost this mission'), String(S.mission.st.lostBags || 0));
        }
        break;
      case 'servers': {
        const sys = Object.keys(S.domains).filter((k) => S.domains[k] >= 2);
        h += row(tr('Systems it runs'), sys.length ? sys.map((k) => Text.dom(k)).join(', ') : '—');
        const down = ops ? Object.keys(S.ops.down || {}).filter((k) => S.ops.down[k]) : [];
        if (ops) h += row(tr('Down now'), down.length ? down.map((k) => Text.dom(k)).join(', ') : tr('nothing'));
        break;
      }
      case 'power':
        h += row(tr('Power'), ops && S.ops.blackout > t ? tr('a blackout: everything is dark') : tr('from the grid; the generator is ready'));
        break;
      case 'cargo':
        h += row(tr('Cargo stands'), String(Airport.count('cargoStand')));
        break;
      case 'parking':
        h += row(tr('Car parks'), Text.parkingLine());
        h += row(tr('Drivers who park at the airport'), Text.pct(Airport.parkingShare()));
        h += row(tr('Parking fees a month'), sek(Airport.parkingMonth()));
        break;
    }
    return h;
  }

  // the airport's own shops in the terminal's cells: "Shops: 4 / 6 cells", each shop with the cells it takes and, where
  // shops can be bought (plan time), a Sell button with what it brings back (a second tap sells it); the free cells
  function cells(term) {
    const max = Airport.cellsMax(term), taken = Airport.cellsTaken(term), list = Airport.shopsIn(term), sell = Airport.canSell();
    let h = '</table><h4>' + Text.esc(tr('Shops: {n} / {max} cells', { n: taken, max })) + '</h4><table class="cells">';
    for (const s of list) {
      const name = BUILD_ICONS[s.kind] + ' ' + Text.esc(tr(BUILDINGS[s.kind].name)), size = Text.esc(Text.cells(s.cells));
      let act = '';
      if (s.buy) act = '<small>' + Text.esc(tr('ready in {n} days', { n: s.buy.done - S.day })) + '</small>';
      else if (sell) {
        const conf = armed === s.it.id;
        act = '<button class="tb small sell' + (conf ? ' confirm' : '') + '" data-sell="' + s.it.id + '">' + Text.esc(conf ? tr('Sell? +{m}', { m: sekBare(Airport.sellPrice(s.it)) }) : tr('Sell +{m}', { m: sekBare(Airport.sellPrice(s.it)) })) + '</button>';
      }
      h += '<tr><td>' + name + '</td><td>' + size + '</td><td>' + act + '</td></tr>';
    }
    if (taken < max) h += '<tr class="free"><td>' + Text.esc(tr('Free')) + '</td><td>' + Text.esc(Text.cells(max - taken)) + '</td><td></td></tr>';
    if (!sell && list.some((s) => s.it)) h += '<tr><td colspan="3" class="fine">' + Text.esc(tr('Shops are bought and sold in plan time.')) + '</td></tr>';
    return h + '</table><table>';
  }

  // how many of a vehicle the airport has of the most worth having (Airport.cap): "3 of 6 worth having"
  function worth(kind) { const cap = Airport.cap(kind); return tr('{n} of {max} worth having', { n: Airport.owned(kind), max: cap.max }); }

  // ---------- a vehicle ----------
  function vehicle(kind, i) {
    const d = SITES[kind === 'fuel' ? 'fuelTruck' : 'plough'], B = BUILDINGS[d.item];
    const now = Fleet.ops(), all = Fleet.all();
    let st, html;
    if (kind === 'fuel') {
      const w = Fleet.truck(i);
      st = !w ? tr('At the depot, ready') : w.step === 'to' ? tr('Driving to {flight}', { flight: w.f.no }) : w.step === 'fuel' ? tr('Fuelling {flight}', { flight: w.f.no }) : tr('Driving back to the depot');
      const me = now.trucks[i] || { n: 0, l: 0 }, ever = all.trucks[i] || { n: 0, l: 0 };
      html = head(d.icon, tr(B.name) + ' ' + (i + 1), st) + '<p class="about">' + Text.esc(tr(d.about)) + '</p><table>';
      html += row(tr('Fuel trucks'), worth('fuelTruck'));
      if (S.ops) {
        html += section(tr('This stage'));
        html += row(tr('Aircraft fuelled'), String(me.n)) + row(tr('Fuel pumped'), litres(me.l));
        html += row(tr('All {n} trucks', { n: Airport.fuelTrucks() }), planes(now.fuelN) + ' · ' + litres(now.fuelL));
      }
      html += section(tr('Since the airport opened'));
      html += row(tr('Aircraft fuelled'), String(ever.n)) + row(tr('Fuel pumped'), litres(ever.l));
      html += row(tr('All the trucks'), planes(all.fuelN) + ' · ' + litres(all.fuelL));
    } else {
      const w = Fleet.plough(i);
      st = !w ? tr('At the shed, ready') : tr('Sweeping: {surface}, {p} done', { surface: Text.surface(w.id), p: Text.pct(w.q) });
      const me = now.ploughs[i] || { runs: 0, m2: 0, m3: 0 }, ever = all.ploughs[i] || { runs: 0, m2: 0, m3: 0 };
      html = head(d.icon, tr(B.name) + ' ' + (i + 1), st) + '<p class="about">' + Text.esc(tr(d.about)) + '</p><table>';
      html += row(tr('Snowploughs'), worth('plough'));
      if (S.ops) {
        html += section(tr('This stage'));
        html += row(tr('Runs'), String(me.runs)) + row(tr('Swept'), m2(Math.round(me.m2))) + row(tr('Snow moved'), m3(Math.round(me.m3)));
        html += row(tr('All {n} ploughs', { n: Airport.ploughs() }), runs(now.runs) + ' · ' + m2(Math.round(now.m2)) + ' · ' + m3(Math.round(now.m3)));
        const snow = S.airport.runways.map((r) => r.name + ' ' + Text.num(r.snow, 1)).concat([tr('apron') + ' ' + Text.num(S.airport.apron.snow, 1)]);
        html += row(tr('Snow now, mm'), snow.join(' · '));
      }
      html += section(tr('Since the airport opened'));
      html += row(tr('Runs'), String(ever.runs)) + row(tr('Swept'), m2(Math.round(ever.m2))) + row(tr('Snow moved'), m3(Math.round(ever.m3)));
    }
    return html + '</table>';
  }

  function render() {
    if (!sel || !S || !S.airport) { if (!box.hidden) close(); return; }
    let html;
    if (sel.kind) {
      const n = sel.kind === 'fuel' ? Airport.fuelTrucks() : Airport.ploughs();
      if (sel.i >= n) { close(); return; }
      html = vehicle(sel.kind, sel.i);
    } else {
      if (!SITES[sel.key]) { close(); return; }
      html = building(sel.key);
    }
    if (box.dataset.html !== html) { box.innerHTML = html; box.dataset.html = html; }
  }
  box.addEventListener('click', (e) => {
    if (e.target.closest('.x')) { close(); return; }
    const b = e.target.closest('button[data-sell]');
    if (!b) return;
    const id = +b.dataset.sell;
    Sfx.play('click');
    if (armed === id && performance.now() - armedAt < BUY_CONFIRM_MS) {
      armed = null;
      const it = S.airport.items.find((x) => x.id === id), m = it ? Airport.sellPrice(it) : 0;
      if (it && Actions.sell(id)) { Game.banner(tr('Sold: {what}, +{m}', { what: tr(BUILDINGS[it.kind].name), m: sek(m) })); Sfx.play('coins'); }
    } else { armed = id; armedAt = performance.now(); setTimeout(() => { if (armed === id) armed = null; }, BUY_CONFIRM_MS); }
    Game.acted();
    render();
  });

  return { open, close, render };
})();
