'use strict';

// Arlanda Rising — the buildings with their roofs off (the 🏠 button in the HUD, or R): a cut-away of the ground floor
// as in a doll's house — the floor, the back walls (west and north) a storey high with their windows, the front walls
// (south and east) cut low — and inside what the building does, alive with the stage's numbers:
//   a terminal's hall — the check-in desks (the open ones staffed, their sign green) with a queue of passengers at each,
//     the security lanes with their arches and queue, the flight screens, the airport's own shops in the terminal's
//     cells (each in its colour with its sign, the free cells empty bays to count), the brands' shops in their colours with
//     shoppers, the gates' seats filling before boarding and the passengers walking airside;
//   a pier — the gates' seats and desks, the kiosks, the moving walkway and the corridor;
//   Sky City — its shops round the walls and the food court; the hotel — the lobby and the rooms;
//   offices and the security operations centre — desks and screens; the baggage halls — belts with the bags running;
//   the computer room — racks blinking (red while a system is down); the fire station — the tenders in their bays;
//   Cargo City — racks, containers and forklifts; the generator, the pumps;
//   a control tower's glass cab (`cab`, called by render/airport.js on top of the shaft) — consoles round the windows
//     with their screens (a radar scope and paper strips in the old tower) and the controllers at them.
// How many people stand in each queue comes from the stage (TermArt.crowd: the passengers of the terminal at check-in,
// at security, airside and at the gates); between missions a calm flow from the passengers a day. Detail drops with the
// zoom: zones only from far, furniture nearer, people as dots from 0.7 and as figures from 1. Drawn by render/airport.js in place of a
// finished building while the roofs are off (MapView.view.cut).

const Interiors = (() => {
  // the inside of each building drawn (data/layout.js keys)
  const KIND = {
    terminal1: 'hall', intlTerminal: 'hall', domTerminal: 'hall', terminal2: 'hall', terminal3: 'hall', waiting: 'gates', intlPier: 'pier', pierF: 'pier', pier2040: 'pier', pierArm: 'pier',
    skyCity: 'mall', hotel: 'hotel', hotelExt: 'hotel', offices: 'office', offices2: 'office', cyberCentre: 'soc', bagHall: 'bags', sorterHall: 'bags',
    computerRoom: 'servers', fireStation: 'fire', cargoCity: 'cargo', generator: 'plant', aquifer: 'pumps'
  };
  // whose passengers fill it
  const TERM = { terminal1: 't1', waiting: 't1', intlTerminal: 'intl', domTerminal: 'dom', terminal2: 't2', terminal3: 't3', pierF: 'intl', pier2040: 'intl', pierArm: 'intl' };
  // the project whose desks a terminal has (data/masterplan.js `desks`)
  const DESKS = { terminal1: 'terminal1', intlTerminal: 'intlTerminal', domTerminal: 'domTerminal', terminal2: 'terminal2', terminal3: 'terminal3' };
  const CLOTHES = ['#2f6fb3', '#c8102e', '#3a8f4b', '#e0a020', '#7b4ea3', '#333a44', '#e8e4d8', '#d96c9a', '#2b8c8c', '#8a5a3a'];
  const SKIN = ['#f0d5bc', '#e8c9a8', '#c99b74', '#8d5a3b'];
  const STAFF = '#1f3f8f', HIVIS = PAL.hiVis;
  // Sky City's shops before any brand has a unit: a café, a newsagent, a gift shop… in plain colours
  const PLAIN = [['#8a5a3a', '#f4efe4'], ['#2f6fb3', '#ffffff'], ['#3a8f4b', '#ffffff'], ['#c8102e', '#ffffff'], ['#e0a020', '#222222']];
  // the airport's own shops: a cell's length along the hall (m), each kind's sign
  const CELL = 7, SHOP_ICON = { kiosk: '🏪', cafe: '☕', restaurant: '🍽️', dutyFree: '🛍️' };
  const WALL_BACK = 4, WALL_FRONT = 1.1, TW = 0.5;   // m: the back walls' height, the front walls' (cut), their thickness
  const FLOOR = { hall: '#ebe6db', gates: '#b9c4cf', pier: '#e6e8ea', mall: '#efe8da', hotel: '#c9a77c', office: '#d9dcdf', soc: '#3a4450', bags: '#a9adb1',
    servers: '#cfd4d8', fire: '#9a9893', cargo: '#b0aca4', plant: '#9fa39a', pumps: '#a6acb0' };
  let T = 0, Z = 1, frameSc = null, crowds = {};

  function has(key) { return !!KIND[key]; }

  // ---------- small things ----------
  // a person standing (or sitting) at x, y; i picks the clothes; far away a dot
  function man(c, x, y, i, sit, col) {
    const z1 = sit ? 1.45 : 2.0;
    if (Z < 0.7) return;
    if (Z < 1) {
      const b = P(x, y, z1 * 0.6);
      c.fillStyle = col || CLOTHES[i % CLOTHES.length]; c.fillRect(b[0] - 0.6, b[1] - 0.9, 1.2, 1.8);
      return;
    }
    const a = P(x, y, sit ? 0.5 : 0.05), b = P(x, y, z1);
    c.strokeStyle = col || CLOTHES[i % CLOTHES.length]; c.lineWidth = 0.8; c.lineCap = 'round';
    c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
    c.fillStyle = SKIN[(i >> 2) % SKIN.length];
    c.beginPath(); c.arc(b[0], b[1] - 0.4, 0.42, 0, Math.PI * 2); c.fill();
  }
  const box = (c, x0, y0, x1, y1, z0, z1, col, top) => Iso.box(c, x0, y0, x1, y1, z0, z1, col, top);
  const flat = (c, x0, y0, x1, y1, z, col) => Iso.poly(c, [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]], col);
  const h01 = (k, i, s) => (hashOf(k, i, s) % 1000) / 1000;
  // a walker going up and down a strip [xa, xb] × [ya, yb] along y (or along x when `alongX`)
  function walker(key, i, xa, xb, ya, yb, alongX) {
    const u = h01(key, i, 'u'), v = h01(key, i, 'v'), sp = 0.8 + h01(key, i, 's') * 0.8, dir = i % 2 ? 1 : -1;
    if (alongX) {
      const len = xb - xa, s = ((v * len + dir * T * sp) % len + len) % len;
      return [xa + s, ya + u * (yb - ya)];
    }
    const len = yb - ya, s = ((v * len + dir * T * sp) % len + len) % len;
    return [xa + u * (xb - xa), ya + s];
  }
  function table(put, x, y, k, key, seated) {
    put(x, y + 1, (c) => {
      box(c, x - 0.5, y - 0.5, x + 0.5, y + 0.5, 0, 0.75, '#e6d2b0');
      for (const [dx, dy] of [[-1, 0], [1, 0]]) box(c, x + dx - 0.25, y + dy - 0.25, x + dx + 0.25, y + dy + 0.25, 0, 0.45, '#6b4a2e');
    });
    for (let s = 0; s < 2; s++) if (h01(key, k, s) < seated) put(x + (s ? 1 : -1), y, (c) => man(c, x + (s ? 1 : -1), y, k * 2 + s, true));
  }
  function counter(c, x0, y0, x1, y1, col) { box(c, x0, y0, x1, y1, 0, 1.1, col || '#c89b63', shade(col || '#c89b63', 0.35)); }

  // ---------- the people of a terminal, once a frame ----------
  function crowd(term) {
    if (!crowds[term]) {
      let k = { checkin: 0, sec: 0, airside: 0, gates: 0 };
      try {
        const cr = TermArt.crowd(term);
        k = { checkin: cr.checkin, sec: cr.sec, airside: cr.airside, gates: cr.gates.reduce((s, g) => s + g.n, 0) };
      } catch (e) { /* no terminal data yet */ }
      crowds[term] = k;
    }
    return crowds[term];
  }
  // the share of the international terminal's airside crowd a building of it takes: its hall, its pier, Pier F, your
  // pier (and its arm) share it
  function intlShare(sc) {
    let n = 2;
    if (sc.items.pierF) n++;
    if (sc.items.pier2040) n++;
    if (sc.items.pierArm) n++;
    return 1 / n;
  }
  function openShare(what) {
    if (!S.ops) return 0.6;
    if (what === 'desks') return S.airport.desks ? clamp(S.ops.desksOpen / S.airport.desks, 0, 1) : 0;
    return S.airport.lanes ? clamp((S.ops.lanesOpen !== undefined ? S.ops.lanesOpen : S.airport.lanes) / S.airport.lanes, 0, 1) : 0;
  }
  // which of n things are open when k are: spread along the row
  function openSet(n, k) {
    const s = new Set();
    for (let i = 0; i < k; i++) s.add(Math.min(n - 1, Math.round((i + 0.5) * n / k - 0.5)));
    return s;
  }
  // a queue of m people from (x, y) going east, in lines `dy` apart once a line reaches xEnd
  function queue(put, key, m, x, y, xEnd, dy, lines) {
    const per = Math.max(1, Math.floor((xEnd - x) / 1.05));
    for (let i = 0; i < m && i < per * lines; i++) {
      const line = Math.floor(i / per), col = i % per;
      const px = line % 2 ? xEnd - col * 1.05 : x + col * 1.05, py = y + line * dy + (h01(key, i, 'j') - 0.5) * 0.3;
      put(px, py, (c) => man(c, px, py, hashOf(key, i)));
    }
  }

  // ---------- the shell ----------
  function shell(c, sc, b, h, wall, floor, glass) {
    const [x0, y0, x1, y1] = b, hb = Math.min(h, WALL_BACK);
    flat(c, x0, y0, x1, y1, 0.08, floor);
    box(c, x0, y0, x0 + TW, y1, 0, hb, wall);
    box(c, x0, y1 - TW, x1, y1, 0, hb, wall);
    if (glass && Z >= 0.45) {
      Iso.winEast(c, y0 + 1, y1 - 1, x0 + TW, 0.9, hb - 0.5, Math.max(2, Math.round((y1 - y0) / 7)), glass);
      Iso.winSouth(c, x0 + 1, x1 - 1, y1 - TW, 0.9, hb - 0.5, Math.max(2, Math.round((x1 - x0) / 7)), glass);
    }
  }
  function front(c, b, wall) {
    const [x0, y0, x1, y1] = b;
    box(c, x0, y0, x1, y0 + TW, 0, WALL_FRONT, wall);
    box(c, x1 - TW, y0, x1, y1, 0, WALL_FRONT, wall);
  }

  // ---------- a terminal's hall: landside east, airside west ----------
  function hall(put, c, sc, key, b) {
    const [x0, y0, x1, y1] = b, W = x1 - x0, L = y1 - y0, X = (u) => x0 + u * W, Y = (v) => y0 + v * L;
    const term = TERM[key], cr = crowd(term), share = term === 'intl' ? intlShare(sc) : 1;
    const sec = (S.airport.lanes || 0) > 0;
    // the zones on the floor: security grey, the gates' carpet
    flat(c, X(0.02), y0 + 1, X(0.2), y1 - 1, 0.1, FLOOR.gates);
    if (sec) flat(c, X(0.42), Y(0.2), X(0.58), Y(0.8), 0.1, '#d2d3cf');
    if (Z < 0.45) return;
    // check-in: a row of desks, a belt behind them, a queue at each open one
    const pid = DESKS[key], fit = clamp(Math.floor(L * 0.7 / 4.5), 3, 30);
    const nd = clamp((PROJECTS[pid] && PROJECTS[pid].desks) || 4, 3, fit), open = openSet(nd, Math.max(1, Math.round(nd * openShare('desks'))));
    const dx = X(0.76), qn = clamp(Math.round(cr.checkin / 2.5), 0, 150), per = Math.ceil(qn / open.size);
    let o = 0;
    for (let j = 0; j < nd; j++) {
      const y = Y(0.15) + j * (L * 0.7) / (nd - 1), on = open.has(j);
      put(dx, y, (c) => {
        box(c, dx - 3.2, y - 2, dx - 2.4, y + 2, 0, 0.5, '#3a3d41');
        counter(c, dx - 0.8, y - 1.6, dx + 0.8, y + 1.6);
        box(c, dx - 0.15, y - 0.5, dx + 0.15, y + 0.5, 1.1, 2.6, '#4a4f55', on ? '#3fbf6a' : '#6b7076');
      });
      if (on) {
        put(dx - 1.5, y, (c) => man(c, dx - 1.5, y, 3, false, STAFF));
        if (o < qn) queue(put, key + 'q' + j, Math.min(per, qn - o), dx + 1.8, y - 0.6, X(0.97), 1.2, 2);
        o += per;
      }
    }
    // the flight screens between check-in and security
    put(X(0.66), Y(0.5), (c) => { box(c, X(0.66) - 0.15, Y(0.5) - 0.15, X(0.66) + 0.15, Y(0.5) + 0.15, 0, 2, '#6b7076'); box(c, X(0.66) - 0.2, Y(0.5) - 2.5, X(0.66) + 0.2, Y(0.5) + 2.5, 2, 3.4, '#1f2a3a', '#2c5aa0'); });
    // people coming in from the kerb with their bags, and plants along the hall
    for (let i = 0; i < clamp(Math.round(cr.checkin / 10) + 6, 6, 30); i++) {
      const p = walker(key + 'k', i, X(0.86), X(0.97), Y(0.04), Y(0.96));
      put(p[0], p[1], (c) => { man(c, p[0], p[1], i + 11); if (Z >= 1.6) box(c, p[0] + 0.3, p[1] - 0.2, p[0] + 0.8, p[1] + 0.2, 0, 0.6, '#2b2f33'); });
    }
    for (let y = y0 + 12; y < y1 - 8; y += 28) for (const u of [0.4, 0.88]) { const px = X(u), py = y; put(px, py, (c) => { box(c, px - 0.6, py - 0.6, px + 0.6, py + 0.6, 0, 0.7, '#8a6a4a'); box(c, px - 0.8, py - 0.8, px + 0.8, py + 0.8, 0.7, 2, '#3f7a3a', '#5a9a4a'); }); }
    // the walk to security
    for (let i = 0; i < clamp(Math.round(cr.checkin / 12) + 6, 6, 30); i++) {
      const p = walker(key + 'w', i, X(0.6), X(0.72), Y(0.1), Y(0.9));
      put(p[0], p[1], (c) => man(c, p[0], p[1], i + 5));
    }
    // security: lanes east–west, an arch in each, the queue east of them
    if (sec) {
      const nl = clamp(Math.round(nd / 2), 2, Math.floor(L * 0.6 / 5)), lo = openSet(nl, Math.max(1, Math.round(nl * openShare('lanes'))));
      const sq = clamp(Math.round(cr.sec / 2.5), 0, 120), sp = Math.ceil(sq / lo.size);
      let so = 0;
      for (let k = 0; k < nl; k++) {
        const y = Y(0.5) + (k - (nl - 1) / 2) * 5, xa = X(0.42), xb = X(0.58), xm = X(0.5), on = lo.has(k);
        put(xb, y, (c) => {
          box(c, xa, y - 0.6, xb, y + 0.6, 0, 0.9, '#7a8794');
          if (Z >= 0.8) for (let t = 0; t < 3; t++) { const tx = xa + ((T * 0.6 + t * 2.2) % (xb - xa)); box(c, tx, y - 0.35, tx + 0.7, y + 0.35, 0.9, 1.05, '#9aa5ad'); }
          box(c, xm - 0.3, y - 1.4, xm + 0.3, y - 1.1, 0, 2.3, '#cfd3d6');
          box(c, xm - 0.3, y + 1.1, xm + 0.3, y + 1.4, 0, 2.3, '#cfd3d6');
          box(c, xm - 0.3, y - 1.4, xm + 0.3, y + 1.4, 2.2, 2.5, on ? '#cfd3d6' : '#8a8f94');
        });
        if (on) {
          put(xm - 1, y + 2, (c) => man(c, xm - 1, y + 2, 7, false, STAFF));
          if (so < sq) queue(put, key + 's' + k, Math.min(sp, sq - so), X(0.6), y - 0.5, X(0.7), 1.0, 2);
          so += sp;
        }
      }
    }
    const after = cells(put, c, key, term, X(0.26), X(0.38), y0 + 3, y1 - 3);
    shops(put, c, key, term, X(0.26), X(0.38), after, y1 - 3);
    seats(put, key, X(0.03), X(0.19), y0 + 3, y1 - 3, cr.gates * share);
    for (let i = 0; i < clamp(Math.round(cr.airside * share / 4), 6, 90); i++) {
      const p = walker(key + 'a', i, X(0.2), X(0.25), y0 + 2, y1 - 2);
      put(p[0], p[1], (c) => man(c, p[0], p[1], i));
    }
  }

  // the airport's own shops in the terminal's cells (Airport.shopsIn), in a column [xa, xb] from ya (the walk on their west
  // side): each shop as long as its cells, in its colour with its sign, a counter, tables or shelves by its kind and a seam
  // on the floor between its cells; one being fitted behind a striped barrier; each free cell an empty bay between low
  // partitions, so the cells can be counted. Returns where the brands' units start.
  function cells(put, c, key, term, xa, xb, ya, yb) {
    const max = Airport.cellsMax(term);
    if (!max) return ya;
    const list = Airport.shopsIn(term), taken = list.reduce((s, x) => s + x.cells, 0);
    const parts = list.map((x) => ({ kind: x.kind, cells: x.cells, fit: !!x.buy })).concat(Array.from({ length: Math.max(0, max - taken) }, () => ({ cells: 1 })));
    let y = ya;
    parts.forEach((p, i) => {
      const s0 = y, s1 = y + p.cells * CELL - 0.3;
      if (s1 > yb) return;
      const col = p.kind ? PAL.shop[p.kind] || '#888' : null;
      flat(c, xa, s0, xb, s1, 0.12, !col ? '#dcdedf' : p.fit ? '#cfc9bd' : mix(col, '#ffffff', 0.6));
      if (col && !p.fit) for (let k = 1; k < p.cells; k++) { const sy = s0 + k * CELL - 0.15; flat(c, xa + 0.3, sy - 0.06, xb - 0.4, sy + 0.06, 0.13, shade(col, 0.25)); }
      put(xb, s1, (c) => {
        // the partition on its north side, the back wall
        box(c, xa + 0.2, s1, xb, s1 + 0.3, 0, col ? 2.2 : 1.2, '#dcdcd8');
        box(c, xb - 0.4, s0, xb, s1, 0, col ? 2.6 : 1.2, col && !p.fit ? col : '#c9ccce');
        if (!col) return;
        if (p.fit) { for (let k = 0; k < (s1 - s0) / 1.2 - 1; k++) box(c, xa + 0.3, s0 + k * 1.2, xa + 0.5, s0 + k * 1.2 + 1.2, 0.5, 0.9, k % 2 ? '#222' : '#f2a020'); return; }
        box(c, xb - 0.5, s0 + 0.3, xb - 0.1, s1 - 0.3, 2.6, 3.5, col, '#ffffff');
        if (Z >= 0.8) shopInside(c, p.kind, xa, xb, s0, s1, col);
        if (Z >= 1.2) { const q = P(xb - 0.3, (s0 + s1) / 2, 5.2), sz = Math.min(4, 15 / Z); Icons.draw(c, SHOP_ICON[p.kind], q[0], q[1], sz); }
      });
      if (col && !p.fit) for (let k = 0; k < p.cells; k++) {
        const px = xa + 0.7 + h01(key + 'c' + i, k, 'x') * (xb - xa - 2.6), py = s0 + 1 + k * CELL + h01(key + 'c' + i, k, 'y') * (CELL - 2.4);
        put(px, py, (c) => man(c, px, py, i * 5 + k));
      }
      y = s1 + 0.3;
    });
    return y + 3;
  }
  // what stands in an own shop: a kiosk's counter and racks, a café's counter and a table a cell, the restaurant's tables,
  // the duty-free's shelves
  function shopInside(c, kind, xa, xb, s0, s1, col) {
    const mid = (xa + xb) / 2;
    if (kind === 'dutyFree') {
      for (let y = s0 + 1.2, r = 0; y < s1 - 1.2; y += 2.4, r++) box(c, mid - 0.4, y, xb - 1, y + 1.2, 0, 1.5, '#e8e4dc', ['#d96c9a', '#e0a020', '#7b4ea3', '#2f6fb3'][r % 4]);
      counter(c, xa + 0.4, s0 + 0.6, xa + 1.3, s0 + 2.4, '#222');
    } else if (kind === 'kiosk') {
      counter(c, xa + 0.4, s0 + 0.8, xa + 1.3, s1 - 0.8, '#e6d2b0');
      box(c, xb - 1.6, s0 + 0.8, xb - 0.8, s1 - 0.8, 0, 1.8, '#f4f1ea', col);
    } else {
      counter(c, xb - 1.8, s0 + 0.6, xb - 0.9, s1 - 0.6, '#6b4a2e');
      for (let y = s0 + 2.5; y < s1 - 1.5; y += kind === 'restaurant' ? 3 : 5) { box(c, mid - 1.1, y - 0.5, mid - 0.1, y + 0.5, 0, 0.75, '#e6d2b0'); box(c, mid - 1.9, y - 0.25, mid - 1.4, y + 0.25, 0, 0.45, '#6b4a2e'); }
    }
  }

  // the brands' shops of a terminal in a column [xa, xb] (the walk on their west side), from ya to yb
  function shops(put, c, key, term, xa, xb, ya, yb) {
    const units = (Terminal.units(term) || []).filter((u) => u.size !== 'desk');
    const LEN = { kiosk: 6, unit: 10, big: 16 };
    let y = ya;
    units.forEach((u, i) => {
      const len = LEN[u.size] || 8;
      if (y + len > yb) return;
      const b = u.brand && BRANDS[u.brand], open = !!(b || u.plain), col = b ? b.sign[0] : u.plain ? u.plain[0] : '#b8bcc0', fg = b ? b.sign[1] : u.plain ? u.plain[1] : '#f4efe4', s0 = y, s1 = y + len;
      flat(c, xa, s0, xb, s1, 0.12, open ? mix(col, '#ffffff', 0.55) : '#d4d6d8');
      put(xb, s1, (c) => {
        box(c, xb - 0.4, s0, xb, s1, 0, 2.6, col);
        box(c, xa + 0.2, s1 - 0.3, xb - 0.4, s1, 0, 2.2, '#dcdcd8');
        box(c, xb - 0.5, s0 + 0.5, xb - 0.1, s1 - 0.5, 2.6, 3.5, col, fg);
        if (Z >= 0.8 && open) for (let k = 0; k < Math.floor(len / 4); k++) box(c, xa + 1.2, s0 + 1.5 + k * 4, xb - 1.4, s0 + 2.6 + k * 4, 0, 1.3, shade(col, 0.3), fg);
      });
      if (open) for (let k = 0; k < 1 + (hashOf(key, i) % 3); k++) {
        const px = xa + 0.6 + h01(key + i, k, 'x') * (xb - xa - 1.4), py = s0 + 0.8 + ((h01(key + i, k, 'y') * (len - 1.6) + T * 0.3 * (k % 2 ? 1 : -1)) % (len - 1.6) + (len - 1.6)) % (len - 1.6);
        put(px, py, (c) => man(c, px, py, i * 3 + k));
      }
      y = s1 + 1;
    });
  }

  // the gates' seats in rows along y in [xa, xb] × [ya, yb] with n passengers on them, a gate desk at each group
  function seats(put, key, xa, xb, ya, yb, n) {
    const rows = Math.max(1, Math.floor((xb - xa) / 2.4)), group = 9, gap = 4;
    const slots = [];
    for (let g = ya; g + group <= yb; g += group + gap) {
      for (let r = 0; r < rows; r++) {
        const x = xa + 0.8 + r * 2.4;
        put(x + 0.5, g, (c) => { box(c, x - 0.35, g, x + 0.35, g + group, 0, 0.45, '#2b4a7a'); box(c, x - 0.55, g, x - 0.35, g + group, 0, 0.95, '#22406b'); });
        for (let s = 0; s < group / 0.85 - 1; s++) slots.push([x, g + 0.5 + s * 0.85]);
      }
      const gy = g + group + gap / 2;
      if (gy < yb) put(xa + 0.4, gy, (c) => { counter(c, xa - 0.4, gy - 1, xa + 0.6, gy + 1, '#8f969c'); box(c, xa - 0.1, gy - 0.1, xa + 0.1, gy + 0.1, 1.1, 3, '#555', '#1f3f8f'); });
    }
    const m = Math.min(slots.length, Math.round(n / 2));
    for (let i = 0; i < m; i++) {
      const s = slots[(i * 7919) % slots.length];
      put(s[0] + 0.1, s[1], (c) => man(c, s[0] + 0.1, s[1], hashOf(key, i), true));
    }
  }

  // ---------- a pier: the gates on the apron side (west), the corridor, the kiosks ----------
  function pier(put, c, sc, key, b) {
    const [x0, y0, x1, y1] = b, W = x1 - x0, X = (u) => x0 + u * W;
    const cr = crowd('intl'), share = intlShare(sc);
    flat(c, X(0.02), y0 + 1, X(0.4), y1 - 1, 0.1, FLOOR.gates);
    if (Z < 0.45) return;
    seats(put, key, X(0.04), X(0.38), y0 + 3, y1 - 3, cr.gates * share);
    // the moving walkway and the people on it
    const wx = X(0.66);
    put(wx + 1.2, y0 + 4, (c) => box(c, wx - 0.9, y0 + 4, wx + 0.9, y1 - 4, 0, 0.25, '#3a3d41', '#5a5f64'));
    for (let i = 0; i < clamp(Math.round(cr.airside * share / 30), 2, 20); i++) {
      const len = y1 - y0 - 10, s = ((h01(key, i, 'm') * len + T * 2.2) % len + len) % len, py = y0 + 5 + s;
      put(wx, py, (c) => man(c, wx, py, i + 3));
    }
    for (let i = 0; i < clamp(Math.round(cr.airside * share / 4), 6, 90); i++) {
      const p = walker(key, i, X(0.42), X(0.58), y0 + 2, y1 - 2);
      put(p[0], p[1], (c) => man(c, p[0], p[1], i));
    }
    // a kiosk now and then on the east side, in the colours of the terminal's brands (none before a brand has a unit)
    const brands = Terminal.units('intl').filter((u) => u.brand).map((u) => BRANDS[u.brand]);
    for (let y = y0 + 20, k = 0; brands.length && y + 9 < y1 - 4; y += 60, k++) {
      const br = brands[k % brands.length], col = br.sign[0], fg = br.sign[1], xa = X(0.76), xb = X(0.95), ya = y, yb = y + 9;
      flat(c, xa, ya, xb, yb, 0.12, mix(col, '#ffffff', 0.55));
      put(xb, yb, (c) => { box(c, xb - 0.4, ya, xb, yb, 0, 2.6, col); box(c, xb - 0.5, ya + 0.5, xb - 0.1, yb - 0.5, 2.6, 3.4, col, fg); counter(c, xa + 0.5, ya + 2, xa + 1.5, yb - 2, '#e6d2b0'); });
      put(xa + 3, ya + 4, (c) => man(c, xa + 3, ya + 4, k + 2));
    }
  }

  // ---------- Sky City: shops round the walls, the food court in the middle ----------
  function mall(put, c, sc, key, b) {
    const [x0, y0, x1, y1] = b, W = x1 - x0;
    if (Z < 0.45) return;
    const units = Terminal.units('sky').filter((u) => u.size !== 'desk');
    const list = units.length ? units : PLAIN.map((p, i) => ({ size: i % 2 ? 'kiosk' : 'unit', brand: null, plain: p }));
    // along the north wall, east to west, and along the west wall
    let x = x1 - 2;
    list.forEach((u, i) => {
      const len = { kiosk: 7, unit: 11, big: 17 }[u.size] || 9;
      if (x - len < x0 + 2) return;
      const br = u.brand && BRANDS[u.brand], col = br ? br.sign[0] : u.plain ? u.plain[0] : '#b8bcc0', fg = br ? br.sign[1] : u.plain ? u.plain[1] : '#f4efe4', xa = x - len, xb = x, ya = y1 - 9, yb = y1 - TW;
      flat(c, xa, ya, xb, yb, 0.12, br || u.plain ? mix(col, '#ffffff', 0.55) : '#d4d6d8');
      put(xb, ya, (c) => { box(c, xa, yb - 0.4, xb, yb, 0, 2.6, col); box(c, xa + 0.5, yb - 0.5, xb - 0.5, yb - 0.1, 2.6, 3.5, col, fg); box(c, xb - 0.2, ya, xb, yb, 0, 2.2, '#dcdcd8'); });
      put(xa + len / 2, ya + 3, (c) => man(c, xa + len / 2, ya + 3, i));
      x = xa - 1;
    });
    for (let i = 0, k = 0; i < 4; i++) for (let j = 0; j < 3; j++, k++) table(put, x0 + W * 0.25 + i * W * 0.15, y0 + 8 + j * 7, k, key, 0.55);
    for (let i = 0; i < 26; i++) { const p = walker(key, i, x0 + 3, x1 - 3, y0 + 3, y1 - 11, i % 3 === 0); put(p[0], p[1], (c) => man(c, p[0], p[1], i)); }
  }

  // ---------- the hotel: the lobby east, the rooms west ----------
  function hotel(put, c, sc, key, b) {
    const [x0, y0, x1, y1] = b, W = x1 - x0;
    if (Z < 0.45) return;
    const lx = x0 + W * 0.62;
    flat(c, lx, y0 + 0.5, x1 - 0.5, y1 - 0.5, 0.12, '#e8e2d6');
    put(x1 - 3, y1 - 6, (c) => counter(c, x1 - 4, y1 - 12, x1 - 3, y1 - 4, '#6b4a2e'));
    put(x1 - 2, y1 - 8, (c) => man(c, x1 - 2, y1 - 8, 1, false, STAFF));
    for (let k = 0; k < 2; k++) { const y = y0 + 4 + k * 8; put(lx + 4, y, (c) => { box(c, lx + 2, y, lx + 6, y + 1.2, 0, 0.7, '#b8322a'); box(c, lx + 2, y + 1, lx + 6, y + 1.5, 0, 1.2, '#9a2a22'); }); }
    for (let i = 0; i < 5; i++) { const p = walker(key, i, lx + 1, x1 - 6, y0 + 2, y1 - 2); put(p[0], p[1], (c) => man(c, p[0], p[1], i + 2)); }
    // the rooms: low partitions, a bed and a chair in each
    const rw = 6, rh = 4.5;
    for (let x = x0 + 1; x + rw <= lx - 1; x += rw) for (let y = y0 + 1; y + rh <= y1 - 1; y += rh) {
      const bx = x, by = y;
      put(bx + rw, by, (c) => {
        box(c, bx, by, bx + rw, by + 0.2, 0, 1.2, '#e3dfd6');
        box(c, bx + rw - 0.2, by, bx + rw, by + rh, 0, 1.2, '#e3dfd6');
        box(c, bx + 0.6, by + 0.8, bx + 2.8, by + 2.6, 0, 0.55, '#f4f4f0', CLOTHES[(hashOf(key, bx, by) % 5)]);
        box(c, bx + 4, by + 2.8, bx + 5, by + 3.8, 0, 0.75, '#6b4a2e');
      });
    }
  }

  // ---------- offices and the security operations centre ----------
  function office(put, c, sc, key, b, soc) {
    const [x0, y0, x1, y1] = b;
    if (Z < 0.45) return;
    const hr = sc.t / 60, busy = soc ? 0.8 : hr >= 8 && hr < 17 ? 0.85 : 0.12;
    if (soc) put(x0 + 1, y1 - 1, (c) => { for (let i = 0; i < 3; i++) Iso.poly(c, [[x0 + 3 + i * 7, y1 - TW - 0.05, 1.2], [x0 + 9 + i * 7, y1 - TW - 0.05, 1.2], [x0 + 9 + i * 7, y1 - TW - 0.05, 3.6], [x0 + 3 + i * 7, y1 - TW - 0.05, 3.6]], i === 1 ? '#c0392b' : '#1d6fa5'); });
    let k = 0;
    for (let x = x0 + 2.5; x + 2 < x1 - 1; x += 4) for (let y = y0 + 2.5; y + 1.5 < y1 - (soc ? 4 : 1.5); y += 3.2, k++) {
      const dx = x, dy = y, on = h01(key, k, 'o') < busy;
      put(dx + 1.6, dy, (c) => {
        box(c, dx, dy, dx + 1.6, dy + 0.8, 0, 0.75, '#e8e4dc');
        box(c, dx + 0.6, dy + 0.55, dx + 1.0, dy + 0.65, 0.75, 1.25, '#1f2a3a', on ? '#5fb3ff' : '#333');
      });
      if (on) put(dx + 0.8, dy - 0.5, (c) => man(c, dx + 0.8, dy - 0.5, hashOf(key, k), true));
    }
  }

  // ---------- the baggage halls: belt loops with the bags running, carts on the airside ----------
  function bags(put, c, sc, key, b) {
    const [x0, y0, x1, y1] = b, W = x1 - x0, L = y1 - y0;
    if (Z < 0.45) return;
    const going = S.ops ? S.ops.flights.filter((f) => f.tr && f.tr.bags === 'going').length : 2;
    const loops = Math.max(1, Math.floor((W - 8) / 9));
    for (let l = 0; l < loops; l++) {
      const xa = x0 + 6 + l * 9, xb = xa + 5, ya = y0 + 5, yb = y1 - 5;
      put(xb, ya, (c) => { box(c, xa, ya, xb, yb, 0, 0.7, '#3a3d41', '#55595e'); flat(c, xa + 1, ya + 1, xb - 1, yb - 1, 0.72, '#a9adb1'); });
      const per = 2 * (xb - xa) + 2 * (yb - ya), nb = clamp(6 + going * 4, 6, 40);
      if (Z >= 0.8) for (let i = 0; i < nb; i++) {
        let s = ((i / nb) * per + T * 1.5 + l * 7) % per, px, py;
        const w = xb - xa, h = yb - ya;
        if (s < h) { px = xa + 0.5; py = ya + s; } else if ((s -= h) < w) { px = xa + s; py = yb - 0.5; } else if ((s -= w) < h) { px = xb - 0.5; py = yb - s; } else { s -= h; px = xb - s; py = ya + 0.5; }
        const bc = ['#2b2f33', '#8e2a1e', '#2f6fb3', '#3a8f4b', '#c89b63'][hashOf(key, l, i) % 5];
        put(px, py, (c) => box(c, px - 0.3, py - 0.25, px + 0.3, py + 0.25, 0.7, 1.15, bc));
      }
      put(xb + 1.5, (ya + yb) / 2, (c) => man(c, xb + 1.5, (ya + yb) / 2, 2, false, HIVIS));
    }
    for (let i = 0; i < Math.min(3, Math.floor(L / 25)); i++) { const y = y0 + 8 + i * 22; put(x0 + 3, y, (c) => Vehicles.bagTrain(c, x0 + 3, y, 0, 2)); }
  }

  // ---------- the computer room: racks with their lights ----------
  function servers(put, c, sc, key, b) {
    const [x0, y0, x1, y1] = b;
    if (Z < 0.45) return;
    const down = S.ops && S.ops.down && Object.keys(S.ops.down).some((d) => S.ops.down[d]);
    for (let x = x0 + 3; x + 1 < x1 - 3; x += 3.5) {
      const rx = x;
      put(rx + 1, y0 + 3, (c) => {
        box(c, rx, y0 + 3, rx + 1, y1 - 5, 0, 2.1, '#2a2f36');
        if (Z >= 1.2) for (let y = y0 + 3.5, i = 0; y < y1 - 5.3; y += 0.9, i++) for (let z = 0.4; z < 2; z += 0.45) {
          const blink = (Math.floor(T * 3 + i * 1.7 + z * 5) % 4) !== 0;
          if (!blink) continue;
          Iso.poly(c, [[rx + 1.03, y, z], [rx + 1.03, y + 0.25, z], [rx + 1.03, y + 0.25, z + 0.12], [rx + 1.03, y, z + 0.12]], down && i % 3 === 0 ? '#ff4136' : '#3fe07a');
        }
      });
    }
    put(x1 - 3, y1 - 3, (c) => { box(c, x1 - 4.5, y1 - 3.5, x1 - 2.5, y1 - 2.7, 0, 0.75, '#e8e4dc'); man(c, x1 - 3.5, y1 - 2.2, 4, true); });
  }

  // ---------- the fire station: the tenders in their six bays, the crew room behind ----------
  // (with the roofs on they stand nose out on the apron in front of their open doors: render/airport.js fireStation)
  function fire(put, c, sc, key, b) {
    const [x0, y0, x1, y1] = b;
    if (Z < 0.45) return;
    const bays = AirportArt.fireBays(sc);
    // the bays' floor with a yellow line between two bays, the crew room's floor behind them
    flat(c, x0 + 0.5, y0 + 0.5, x1 - 0.5, y0 + 13, 0.1, '#a3a7ab');
    for (const bay of bays.slice(1)) flat(c, bay.x - 4.15, y0 + 0.5, bay.x - 3.85, y0 + 13, 0.12, '#f2c230');
    for (const bay of bays) if (bay.tender) put(bay.x, y0 + 6.5, (c) => Vehicles.crashTender(c, bay.x, y0 + 6.5, 180));
    flat(c, x0 + 1, y0 + 15, x1 - 1, y1 - 1, 0.12, '#c9a77c');
    // the lockers along the back wall, the crew at their tables, one getting ready by the tenders
    put(x1 - 2, y1 - 1.5, (c) => box(c, x0 + 3, y1 - 1.6, x1 - 3, y1 - 0.8, 0, 1.9, '#b8322a'));
    table(put, x0 + 12, y1 - 7, 0, key, 0.9);
    table(put, x0 + 26, y1 - 7, 1, key, 0.7);
    table(put, x0 + 40, y1 - 7, 2, key, 0.5);
    put(bays[2].x + 4, y0 + 10, (c) => man(c, bays[2].x + 4, y0 + 10, 3, false, '#26324a'));
  }

  // ---------- Cargo City: racks of goods, containers, forklifts ----------
  function cargo(put, c, sc, key, b) {
    const [x0, y0, x1, y1] = b, W = x1 - x0;
    if (Z < 0.45) return;
    const goods = ['#c89b63', '#a97c4c', '#e6d2b0', '#2f6fb3', '#8e2a1e'];
    for (let r = 0; r < 4; r++) {
      const x = x0 + W * 0.3 + r * W * 0.14;
      for (let y = y0 + 6, k = 0; y + 10 < y1 - 6; y += 14, k++) {
        const rx = x, ry = y, g = goods[hashOf(key, r, k) % goods.length];
        put(rx + 2, ry, (c) => { box(c, rx, ry, rx + 2, ry + 10, 0, 2.6, g, shade(g, 0.3)); box(c, rx, ry, rx + 2, ry + 10, 2.6, 2.8, '#d0811f'); });
      }
    }
    // the unit-load devices on the airside (west), waiting for an aircraft
    for (let y = y0 + 8, k = 0; y + 3 < y1 - 8; y += 18, k++) { const yy = y; put(x0 + 5, yy, (c) => { box(c, x0 + 3, yy, x0 + 6, yy + 2.6, 0, 1.6, '#aeb4ba'); box(c, x0 + 3, yy + 3.2, x0 + 6, yy + 5.8, 0, 1.6, '#aeb4ba'); }); }
    for (let i = 0; i < 5; i++) {
      const p = walker(key + 'f', i, x0 + W * 0.24, x0 + W * 0.28, y0 + 6, y1 - 6), hd = i % 2 ? 0 : 180;
      put(p[0], p[1], (c) => { Iso.obox(c, p[0], p[1], 2.4, 1.2, 0.2, 1.2, hd, '#e0a020'); Iso.obox(c, p[0], p[1] + (hd ? -1.3 : 1.3), 0.3, 1, 0, 2.6, hd, '#444'); });
    }
    for (let i = 0; i < 8; i++) { const p = walker(key, i, x0 + W * 0.18, x0 + W * 0.9, y0 + 4, y1 - 4); put(p[0], p[1], (c) => man(c, p[0], p[1], i, false, i % 2 ? HIVIS : PAL.hiVisOrange)); }
  }

  // the generator: two engines and their exhaust; the aquifer's pump house: pumps and pipes
  function plant(put, c, sc, key, b, pumps) {
    const [x0, y0, x1, y1] = b, W = x1 - x0, L = y1 - y0;
    if (Z < 0.45) return;
    if (pumps) {
      put(x1 - 2, y0 + L / 2, (c) => { box(c, x0 + 2, y0 + L / 2 - 0.4, x1 - 2, y0 + L / 2 + 0.4, 0.3, 1.1, '#2f6fb3'); for (let i = 0; i < 3; i++) box(c, x0 + 4 + i * (W - 8) / 2 - 1, y0 + L / 2 - 1.5, x0 + 4 + i * (W - 8) / 2 + 1, y0 + L / 2 + 1.5, 0, 2, '#4a7fb5'); });
      put(x0 + 4, y0 + 4, (c) => man(c, x0 + 4, y0 + 4, 2, false, HIVIS));
      return;
    }
    put(x1 - 1, y0 + 1, (c) => { box(c, x0 + 1.5, y0 + 2, x1 - 1.5, y0 + 4.5, 0, 1.8, '#5d6b4a'); box(c, x0 + 1.5, y0 + 6.5, x1 - 1.5, y0 + 9, 0, 1.8, '#5d6b4a'); box(c, x1 - 2.5, y0 + 2.5, x1 - 2, y0 + 3, 1.8, 3.4, '#555'); });
  }

  // ---------- the waiting room of the first terminal ----------
  function gates(put, c, sc, key, b) {
    const [x0, y0, x1, y1] = b;
    if (Z < 0.45) return;
    seats(put, key, x0 + 2, x1 - 6, y0 + 2, y1 - 2, crowd('t1').gates);
    for (let i = 0; i < 4; i++) { const p = walker(key, i, x1 - 5, x1 - 2, y0 + 2, y1 - 2); put(p[0], p[1], (c) => man(c, p[0], p[1], i)); }
  }

  // ---------- a control tower's glass cab, its roof off ----------
  // drawn by render/airport.js on top of the tower's shaft: the cab's floor at height z0, its square [cx ± half, cy ± half];
  // `old`: the tower of 1960 (consoles with a round radar scope and the paper strips), else the tower of 2001 (flat
  // screens). The back windows (west and north) stand to the cab's height, the front ones are cut to the sill; consoles
  // run round the windows with the controllers at them, looking out — more of them the more runways there are, two at night
  function cab(c, sc, key, cx, cy, half, z0, old) {
    if (frameSc !== sc) { frameSc = sc; crowds = {}; T = S.ops ? sc.t : sc.anim; Z = Cam.zoom; }
    const x0 = cx - half, y0 = cy - half, x1 = cx + half, y1 = cy + half, H = 3.4;
    const glassCol = sc.dark > 0.3 ? 'rgba(150,230,200,0.45)' : 'rgba(127,166,189,0.55)', sill = '#cfcbc2';
    c.save();
    c.translate(0, -z0 * ISO_Z);
    flat(c, x0, y0, x1, y1, 0.02, '#3d444c');
    // the back windows: a sill, the glass leaning out a little, the mullions
    box(c, x0, y0, x0 + TW, y1, 0, WALL_FRONT, sill);
    box(c, x0, y1 - TW, x1, y1, 0, WALL_FRONT, sill);
    Iso.poly(c, [[x0, y0, WALL_FRONT], [x0, y1, WALL_FRONT], [x0 - 0.3, y1 + 0.3, H], [x0 - 0.3, y0, H]], glassCol);
    Iso.poly(c, [[x0, y1, WALL_FRONT], [x1, y1, WALL_FRONT], [x1, y1 + 0.3, H], [x0 - 0.3, y1 + 0.3, H]], glassCol);
    c.strokeStyle = '#5e646a'; c.lineWidth = 0.15;
    c.beginPath();
    for (let i = 0; i <= 3; i++) {
      const y = y0 + (y1 - y0) * i / 3, x = x0 + (x1 - x0) * i / 3;
      c.moveTo(...P(x0, y, WALL_FRONT)); c.lineTo(...P(x0 - 0.3, y + 0.3 * i / 3, H));
      c.moveTo(...P(x, y1, WALL_FRONT)); c.lineTo(...P(x - 0.3 * (1 - i / 3), y1 + 0.3, H));
    }
    c.stroke();
    if (Z >= 0.45) {
      const hr = sc.t / 60, night = hr < 6 || hr >= 23;
      const n = night ? 2 : clamp((old ? 1 : 2) + S.airport.runways.length, 2, 8);
      const items = [], put = (x, y, fn) => items.push({ d: depthOf(x, y), fn });
      // the consoles round the windows, two places on each side: the place's console and the controller's chair
      const D = 0.9, sp = (x1 - x0) / 4, places = [];
      for (const k of [1, 3]) {
        places.push({ con: [x0 + k * sp - 1, y1 - TW - D, x0 + k * sp + 1, y1 - TW], seat: [x0 + k * sp, y1 - TW - D - 0.7] });
        places.push({ con: [x0 + TW, y0 + k * sp - 1, x0 + TW + D, y0 + k * sp + 1], seat: [x0 + TW + D + 0.7, y0 + k * sp] });
        places.push({ con: [x1 - TW - D, y0 + k * sp - 1, x1 - TW, y0 + k * sp + 1], seat: [x1 - TW - D - 0.7, y0 + k * sp] });
        places.push({ con: [x0 + k * sp - 1, y0 + TW, x0 + k * sp + 1, y0 + TW + D], seat: [x0 + k * sp, y0 + TW + D + 0.7] });
      }
      const on = openSet(places.length, Math.min(n, places.length));
      places.forEach((p, i) => {
        const [a0, b0, a1, b1] = p.con, staffed = on.has(i), glow = staffed || sc.dark > 0.3 ? (old ? '#7dffb0' : '#5fb3ff') : '#333';
        put(a1, b0, (c) => {
          box(c, a0, b0, a1, b1, 0, 0.8, old ? '#8a8f86' : '#d9dcdf', old ? '#6d7268' : '#c4c8cc');
          const mx = (a0 + a1) / 2, my = (b0 + b1) / 2;
          if (old && i % 2 === 0) {
            // the radar scope, its line sweeping round
            const u = P(mx, my, 0.82), a = T * 2 + i;
            c.fillStyle = '#123322'; c.beginPath(); c.ellipse(u[0], u[1], 0.6, 0.3, 0, 0, Math.PI * 2); c.fill();
            c.strokeStyle = glow; c.lineWidth = 0.08; c.beginPath(); c.moveTo(u[0], u[1]); c.lineTo(u[0] + Math.cos(a) * 0.6, u[1] + Math.sin(a) * 0.3); c.stroke();
          } else if (old) {
            // the strip board: the flights' paper strips
            for (let s = 0; s < 4; s++) flat(c, mx - 0.5, my - 0.6 + s * 0.3, mx + 0.5, my - 0.45 + s * 0.3, 0.82, s % 2 ? '#f4efe4' : '#e8d27a');
          } else {
            // two flat screens on the console
            for (const d of [-0.6, 0.6]) {
              const sx = (a1 - a0) > (b1 - b0) ? mx + d : mx, sy = (a1 - a0) > (b1 - b0) ? my : my + d;
              box(c, sx - 0.3, sy - 0.3, sx + 0.3, sy + 0.3, 0.8, 1.35, '#1f2a3a', glow);
            }
          }
        });
        if (staffed) put(p.seat[0], p.seat[1], (c) => man(c, p.seat[0], p.seat[1], hashOf(key, i), true, i % 3 ? null : '#e8e4d8'));
      });
      // the stairs and the lift coming up in the middle, the supervisor walking between the places
      put(cx + 0.9, cy - 0.9, (c) => box(c, cx - 0.9, cy - 0.9, cx + 0.9, cy + 0.9, 0, 0.5, '#6b7177'));
      if (!night) { const p = walker(key, 0, x0 + 3, x1 - 3, cy - 2.2, cy - 1.9, true); put(p[0], p[1], (c) => man(c, p[0], p[1], 5)); }
      items.sort((p, q) => p.d - q.d);
      for (const it of items) it.fn(c);
    }
    // the front windows, cut to the sill
    box(c, x0, y0, x1, y0 + TW, 0, WALL_FRONT, sill);
    box(c, x1 - TW, y0, x1, y1, 0, WALL_FRONT, sill);
    c.restore();
  }

  const DRAW = { hall, gates, pier, mall, hotel, office, soc: (p, c, sc, k, b) => office(p, c, sc, k, b, true), bags, servers, fire, cargo,
    plant, pumps: (p, c, sc, k, b) => plant(p, c, sc, k, b, true) };

  // the building `key` cut away: its box on the ground, its height, its walls' colour
  function draw(c, sc, key, b, h, wall) {
    if (frameSc !== sc) { frameSc = sc; crowds = {}; T = S.ops ? sc.t : sc.anim; Z = Cam.zoom; }
    const [x0, y0, x1, y1] = b, kind = KIND[key];
    // nothing to draw off the screen
    const a = Cam.toScreen(x0, y1, 0), d = Cam.toScreen(x1, y0, 0), l = Cam.toScreen(x0, y0, 0), r = Cam.toScreen(x1, y1, 0);
    if (Math.max(a[0], d[0], l[0], r[0]) < -20 || Math.min(a[0], d[0], l[0], r[0]) > Cam.W + 20 || Math.max(a[1], d[1], l[1], r[1]) < -40 || Math.min(a[1], d[1], l[1], r[1]) - 40 > Cam.H) return;
    const glass = sc.dark > 0.3 ? mix(PAL.glass, '#ffd27a', clamp(sc.dark, 0, 1)) : PAL.glass;
    const glazed = kind === 'hall' || kind === 'pier' || kind === 'mall' || kind === 'gates' || kind === 'hotel' || kind === 'office';
    shell(c, sc, b, h, wall, FLOOR[kind], glazed ? glass : null);
    const items = [];
    DRAW[kind]((x, y, fn) => items.push({ d: depthOf(x, y), fn }), c, sc, key, b);
    items.sort((p, q) => p.d - q.d);
    for (const it of items) it.fn(c);
    front(c, b, wall);
    if (sc.dark > 0.3) sc.lights.push({ x: (x0 + x1) / 2, y: (y0 + y1) / 2, z: 2, col: '255,225,170', r: Math.min(60, Math.max(x1 - x0, y1 - y0) * 0.45), flood: true });
  }

  return { has, draw, cab, KIND };
})();
