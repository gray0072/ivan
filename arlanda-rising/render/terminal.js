'use strict';

// Arlanda Rising — the Terminal view's drawing (session 4): a cut-away plan of one terminal, departures from left to
// right — the kerb with its coaches, taxis and (from November 1999) the train, the check-in hall with its desks and the
// queue as people, security with its lanes and their queue, the airside walk with the shop units and their brands'
// signs, the gates with the aircraft and the passengers waiting — and over each queue its wait. In ops time the people
// are the stage's own passengers (sim/passengers.js: who is in which queue, who is airside, who is boarding); in plan
// time and in the Office a calm flow drawn from the terminal's passengers a day. The kerb's own tab shows its desks.
// Draws into the canvas it is given; `hits` lists the units for a tap. Used by ui/terminalview.js.

const TermArt = (() => {
  const C = { floor: '#e9e4d8', wall: '#8f8a80', land: '#c9cfd4', road: '#4b4f54', glass: '#9cc3d8', desk: '#c89b63', lane: '#7a8794',
    walk: '#f4efe4', gate: '#d8d2c4', apron: '#b9b6ae', text: '#2b2f33', dim: '#6b7076', queue: '#d9534f', people: ['#2f6fb3', '#c8102e', '#3a8f4b', '#e0a020', '#7b4ea3', '#333'] };
  let hits = [];

  // the people of the terminal now: queues, airside and at the gates (passengers)
  function crowd(term) {
    const out = { checkin: 0, sec: 0, airside: 0, gates: [], live: !!S.ops };
    if (S.ops) {
      const mine = (id) => { const f = Flights.get(id); return f && Terminal.of(f.al, f.intl) === term; };
      for (const c of S.ops.queue) if (mine(c[0])) out.checkin += c[1];
      for (const c of S.ops.sec || []) if (mine(c[0])) out.sec += c[1];
      for (const f of S.ops.flights) {
        if (Terminal.of(f.al, f.intl) !== term || Flights.over(f) || f.st === 'taxiOut' || !f.booked) continue;
        const through = f.checked;
        if (f.tr && f.tr.board !== null && f.tr.ready === null) out.gates.push({ f, n: Math.max(0, through * 0.6) });
        else if (f.st === 'turn' || f.st === 'parked' || f.st === 'waitStand' || f.st === 'taxiIn') { out.airside += through; out.gates.push({ f, n: through * 0.3 }); }
        else out.airside += through * 0.5;
      }
    } else {
      const day = Invest.termPax(term);
      out.checkin = day / 60; out.sec = day / 120; out.airside = day / 25;
    }
    return out;
  }

  function people(c, n, x0, y0, x1, y1, seed, t, snake) {
    const k = Math.min(160, Math.round(n / 3));
    for (let i = 0; i < k; i++) {
      let x, y;
      if (snake) {
        // a queue: rows back and forth from the front (right) to the back (left)
        const per = Math.max(4, Math.floor((x1 - x0) / 7)), row = Math.floor(i / per), col = i % per;
        x = row % 2 ? x0 + 4 + col * 7 : x1 - 4 - col * 7;
        y = y1 - 6 - row * 7;
        if (y < y0) break;
      } else {
        const h = hashOf(seed, i), u = (h & 1023) / 1023, v = ((h >> 10) & 1023) / 1023, sp = 0.2 + ((h >> 20) & 15) / 40;
        x = x0 + (x1 - x0) * ((u + t * sp * 0.02) % 1);
        y = y0 + (y1 - y0) * v;
      }
      c.fillStyle = C.people[i % C.people.length];
      c.beginPath(); c.arc(x, y, 2.6, 0, Math.PI * 2); c.fill();
    }
  }
  // a label, kept inside the canvas (a narrow phone cuts nothing off) and squeezed to `maxW` when given
  function label(c, text, x, y, color, size, align, maxW) {
    c.fillStyle = color || C.text; c.font = '600 ' + (size || 12) + 'px Arial, sans-serif'; c.textAlign = 'left'; c.textBaseline = 'middle';
    const W = c.canvas.clientWidth || c.canvas.width, w = Math.min(c.measureText(text).width, maxW || Infinity);
    let x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
    x0 = Math.max(2, Math.min(W - 2 - w, x0));
    c.fillText(text, x0, y, maxW);
  }
  // a label on a pale backing, readable over the people and the walls
  function tag(c, text, x, y, size) {
    c.font = '600 ' + size + 'px Arial, sans-serif';
    const w = c.measureText(text).width + 8;
    c.fillStyle = 'rgba(244,240,232,0.85)'; BrandArt.round(c, x - w / 2, y - size / 2 - 2, w, size + 4, 4); c.fill();
    label(c, text, x, y, C.dim, size);
  }
  function waitTag(c, min, x, y) {
    const m = Math.round(min), col = m >= 15 ? C.queue : m >= 6 ? '#e0a020' : '#3a8f4b';
    const text = tr('{n} min', { n: m });
    c.font = '700 12px Arial, sans-serif';
    const w = c.measureText(text).width + 12;
    c.fillStyle = col; BrandArt.round(c, x - w / 2, y - 9, w, 18, 9); c.fill();
    label(c, text, x, y + 1, '#fff', 12);
  }
  // a unit's width by its size
  const UW = { kiosk: 1, unit: 1.5, big: 2.4, desk: 1 };

  function draw(c, W, H, term, sel, t) {
    hits = [];
    c.clearRect(0, 0, W, H);
    if (term === 'kerb' || term === 'sky') { kerb(c, W, H, sel, t, term); return; }
    const cr = crowd(term), def = TERMINALS[term];
    const X = [0, W * 0.13, W * 0.33, W * 0.44, W * 0.84, W];
    const top = 34, bot = H - 8, fs = Math.max(8.5, Math.min(12, W / 70));
    // the land, the road and the kerb
    c.fillStyle = C.land; c.fillRect(0, 0, W, H);
    c.fillStyle = C.road; c.fillRect(0, top, X[1] * 0.55, bot - top);
    c.fillStyle = C.floor; c.fillRect(X[1], top, X[4] - X[1], bot - top);
    c.fillStyle = C.walk; c.fillRect(X[3], top + 50, X[4] - X[3], bot - top - 100);
    c.fillStyle = C.apron; c.fillRect(X[4], top, W - X[4], bot - top);
    c.strokeStyle = C.wall; c.lineWidth = 3; c.strokeRect(X[1], top, X[4] - X[1], bot - top);
    // the zones' names, bilingual like the real signs: Swedish over English
    const zone = (sv, en, x) => { label(c, sv, x, 9, C.dim, fs - 1); label(c, en, x, 22, C.text, fs); };
    zone('Incheckning', 'Check-in', (X[1] + X[2]) / 2);
    zone('Säkerhet', 'Security', (X[2] + X[3]) / 2);
    label(c, tr(def.name), (X[3] + X[4]) / 2, 16, C.text, fs, 'center', X[4] - X[3] - 4);
    zone('Utgång', 'Gates', (X[4] + W) / 2);
    // the kerb: coaches, taxis, the train
    const kx = X[1] * 0.27;
    if (Airport.has('busStop')) { c.fillStyle = '#e8e8e8'; c.fillRect(kx - 9, top + 20, 18, 46); label(c, 'Flygbussarna', kx, top + 76, C.dim, 9); }
    c.fillStyle = '#f2c230'; for (let i = 0; i < 3; i++) c.fillRect(kx - 7, top + 100 + i * 26, 14, 20);
    if (Terminal.trainRuns()) { c.fillStyle = '#f7d117'; c.fillRect(X[1] * 0.6, bot - 60, 10, 52); tag(c, 'Arlanda Express', X[1] * 0.78, bot - 70, 9); }
    // check-in: the desks along the far wall, the open ones lit; the queue in front
    const desks = S.airport.desks, open = S.ops ? S.ops.desksOpen : Math.round(desks * 0.5);
    const share = term === 'intl' ? 0.5 : term === 't2' ? 0.25 : 0.35, nd = Math.max(2, Math.min(14, Math.round(desks * share))), on = Math.max(0, Math.min(nd, Math.round(open * share)));
    for (let i = 0; i < nd; i++) {
      const y = top + 14 + i * ((bot - top - 28) / nd);
      c.fillStyle = i < on ? C.desk : '#b8b0a2'; c.fillRect(X[2] - 22, y, 12, (bot - top - 28) / nd - 4);
      if (i < on) { c.fillStyle = '#2b2f33'; c.beginPath(); c.arc(X[2] - 6, y + 5, 2.6, 0, Math.PI * 2); c.fill(); }
    }
    people(c, cr.checkin, X[1] + 8, top + 30, X[2] - 30, bot - 10, 'q' + term, t, true);
    if (S.ops) waitTag(c, Passengers.wait(), (X[1] + X[2]) / 2 - 10, top + 24);
    // security: its lanes, and the queue before them
    const lanes = Terminal.lanes();
    if (lanes) {
      const nl = Math.max(1, Math.min(8, Math.round(lanes * (term === 'intl' ? 0.5 : 0.3))));
      for (let i = 0; i < nl; i++) {
        const y = top + 40 + i * ((bot - top - 80) / nl);
        c.fillStyle = C.lane; c.fillRect(X[3] - 18, y, 12, (bot - top - 80) / nl - 8);
        c.fillStyle = '#5a6570'; c.fillRect(X[3] - 30, y + 4, 10, 6);
      }
      people(c, cr.sec, X[2] + 6, top + 30, X[3] - 34, bot - 10, 's' + term, t, true);
      if (S.ops) waitTag(c, Passengers.secWait(), (X[2] + X[3]) / 2 - 10, top + 24);
      tag(c, tr('{n} lanes', { n: lanes }), (X[2] + X[3]) / 2, bot - 12, 10);
    } else label(c, tr('No security check yet'), (X[2] + X[3]) / 2, (top + bot) / 2, C.dim, 10);
    // session 5: the passport booths after security, for the flights outside Schengen
    if (Terminal.borderOn() && (term === 'intl' || term === 't2')) {
      const nb = Math.min(8, S.airport.booths), open = Terminal.booths(), by = bot - 96;
      for (let i = 0; i < nb; i++) {
        c.fillStyle = i < open ? '#2f5f8f' : '#a9b3bd';
        c.fillRect(X[3] + 12 + i * 16, by, 12, 14);
      }
      tag(c, 'Passkontroll · ' + tr('Passport control'), X[3] + 12 + nb * 8, by - 10, 9);
      if (S.ops) waitTag(c, Passengers.borderWait() > 99 ? 99 : Passengers.borderWait(), X[3] + 24 + nb * 16, by + 7);
    }
    // airside: the shop units above and below the walk
    const units = Terminal.units(term);
    const rows = [units.filter((u, i) => i % 2 === 0), units.filter((u, i) => i % 2 === 1)];
    rows.forEach((row, r) => {
      const sum = row.reduce((s, u) => s + UW[u.size], 0) || 1, gap = 6, avail = X[4] - X[3] - 16 - gap * (row.length - 1);
      let x = X[3] + 8;
      for (const u of row) {
        const w = avail * UW[u.size] / sum, y = r === 0 ? top + 6 : bot - 44, h = 38;
        if (u.brand) BrandArt.sign(c, u.brand, x, y, w, h);
        else {
          c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(x, y, w, h);
          c.setLineDash([4, 3]); c.strokeStyle = C.dim; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); c.setLineDash([]);
          label(c, w < 90 ? 'Ledig' : 'Ledig · ' + tr('To let'), x + w / 2, y + h / 2 - 5, C.dim, Math.min(10, fs), 'center', w - 4);
          label(c, tr({ kiosk: 'kiosk', unit: 'unit', big: 'big unit' }[u.size]), x + w / 2, y + h / 2 + 9, C.dim, Math.min(9, fs - 1), 'center', w - 4);
        }
        if (sel === u.id) { c.strokeStyle = '#ffd65a'; c.lineWidth = 3; c.strokeRect(x - 2, y - 2, w + 4, h + 4); }
        hits.push({ id: u.id, x, y, w, h });
        x += w + gap;
      }
    });
    if (!units.length) label(c, tr('The shop units come with chapter 4.'), (X[3] + X[4]) / 2, (top + bot) / 2, C.dim, 11);
    people(c, cr.airside, X[3] + 10, top + 56, X[4] - 10, bot - 56, 'a' + term, t, false);
    // the gates: the next departures of this terminal and who is waiting for them
    const list = S.ops ? cr.gates.slice(0, 5) : [];
    list.forEach((g, i) => {
      const y = top + 16 + i * ((bot - top - 20) / 5), h = (bot - top - 20) / 5 - 8;
      c.fillStyle = C.gate; c.fillRect(X[4] + 6, y, W - X[4] - 12, h);
      label(c, g.f.no + ' · ' + fmtClock(g.f.std), X[4] + 12, y + 10, C.text, 11, 'left', W - X[4] - 18);
      people(c, g.n, X[4] + 12, y + 18, W - 16, y + h - 4, 'g' + g.f.id, t, false);
    });
    if (!list.length) for (let i = 0; i < 4; i++) { const y = top + 20 + i * 80; c.fillStyle = C.gate; c.fillRect(X[4] + 6, y, W - X[4] - 12, 60); label(c, String(i + 1), X[4] + 16, y + 10, C.dim, 11); }
  }

  // the kerb's tab: the road, the stops, the train, and the desks for car rental and taxis (session 5: Sky City's hall
  // has the same plan, with its shops in units of their sizes)
  function kerb(c, W, H, sel, t, term) {
    c.fillStyle = C.land; c.fillRect(0, 0, W, H);
    c.fillStyle = C.road; c.fillRect(0, H * 0.55, W, H * 0.25);
    c.fillStyle = C.floor; c.fillRect(0, 22, W, H * 0.5);
    c.strokeStyle = C.wall; c.lineWidth = 3; c.strokeRect(0, 22, W, H * 0.5);
    label(c, term === 'sky' ? 'Sky City · ' + tr('Shops, the hotel and the station') : 'Ankomsthall · Arrivals hall', W / 2, 12, C.text, 12);
    const units = Terminal.units(term || 'kerb'), sum = units.reduce((s, u) => s + UW[u.size], 0) || 1, avail = W - 20 - 8 * units.length;
    let ux = 10;
    units.forEach((u) => {
      const w = avail * UW[u.size] / sum, x = ux, y = 40, h = 40;
      ux += w + 8;
      if (u.brand) BrandArt.sign(c, u.brand, x, y, w, h);
      else { c.setLineDash([4, 3]); c.strokeStyle = C.dim; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); c.setLineDash([]); label(c, 'Ledig · ' + tr('To let'), x + w / 2, y + h / 2, C.dim, 10); }
      if (sel === u.id) { c.strokeStyle = '#ffd65a'; c.lineWidth = 3; c.strokeRect(x - 2, y - 2, w + 4, h + 4); }
      hits.push({ id: u.id, x, y, w, h });
    });
    people(c, Invest.paxDay() / 30, 20, 96, W - 20, H * 0.5, 'k', t, false);
    // the road: coaches and taxis come and go
    const ry = H * 0.6;
    for (let i = 0; i < 4; i++) { const x = ((t * 30 + i * W / 4) % (W + 60)) - 30; c.fillStyle = '#f2c230'; c.fillRect(x, ry + 8, 24, 12); }
    if (Airport.has('busStop')) { c.fillStyle = '#e8e8e8'; c.fillRect(W * 0.2, ry + 26, 50, 16); label(c, 'Flygbussarna', W * 0.2 + 25, ry + 52, C.text, 10); }
    if (Airport.has('railStation')) {
      c.fillStyle = '#5c6066'; c.fillRect(0, H - 22, W, 14);
      if (Terminal.trainRuns()) { const x = ((t * 60) % (W + 200)) - 200; c.fillStyle = '#f7d117'; c.fillRect(x, H - 20, 180, 10); }
      label(c, Terminal.trainRuns() ? 'Arlanda Express' : tr('The trains run from 24 November 1999'), W * 0.75, H - 30, C.text, 10);
    }
  }

  function hit(x, y) { return hits.find((h) => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) || null; }
  return { draw, hit };
})();
