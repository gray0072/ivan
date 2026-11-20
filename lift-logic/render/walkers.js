'use strict';

// Lift Logic — the people walking between a landing and a cabin, so nobody pops in or out of a lift: getting
// on (from their place in the queue into the cabin, which hides them until they are in), getting off to
// change lifts (from the cabin back to the queue), and the errands of a character who rides again straight
// away (`errand` in data/people.js): Pete the Postman walks to the mailbox by the lift and drops a letter in,
// Leo takes a box from the pile on the street and puts it on the pile upstairs — and waits there, so his next
// ride starts where he stands. Draws the mailboxes and the box piles too. The walks follow the run's clock, so
// they pause with it and keep up at every speed. Reads `run`, never changes it. Used by render/building.js.

const Walkers = (() => {
  const { ctx, st } = View;
  const ERRAND_WALK = 0.7;   // s of the run's clock from the cabin to the mailbox / the pile
  const ERRAND_DROP = 0.3;   // s the letter or the box takes to go in / down before someone walks on
  const ERRAND_MAX = 20;     // s an errand waits for the next ride before walking away
  let forRun = null;
  let entering = [], errands = [], letters = [], piles = {}, mail = {}, mailboxes = false;

  // the mission's errands, counted once per run: the boxes on the street, whether there are mailboxes
  function ensure() {
    if (forRun === run) return;
    forRun = run;
    entering = []; errands = []; letters = []; piles = {}; mail = {}; mailboxes = false;
    if (!run) return;
    const trips = run.people.map((p) => ({ who: p.who, from: p.from, to: p.dest })).concat(run.pending, run.chains);
    for (const e of trips) {
      const c = PEOPLE[e.who];
      if (!c || !c.errand) continue;
      if (c.errand === 'mail') mailboxes = true;
      const fi = floorIndex(e.from);
      if (c.errand === 'boxes' && floorIndex(e.to) > fi) piles[fi] = (piles[fi] || 0) + 1;
    }
  }

  const cabinX = (g, n) => g.shaftLeft(n - 1) + g.sw / 2;
  const landY = (g, i) => g.floorY(i) + g.fh - 3;
  const mailboxX = (g) => g.shaftX - 38;
  const pileX = (g) => g.numW + 8;
  function spotX(g, er) { return er.kind === 'mail' ? mailboxX(g) + 6 : pileX(g) + g.fh * 0.5; }

  // ---------- the run's events ----------
  // someone appears: the next ride of a person on an errand starts where they stand; Leo picks up a box
  GameEvents.on('appear', (e) => {
    ensure();
    const p = e.person, c = PEOPLE[p.who] || {};
    const k = errands.findIndex((er) => er.person.who === p.who && er.fi === p.fi);
    if (k >= 0) {
      const er = errands[k];
      if (!er.done) finish(er);
      st.pos[p.id] = { x: er.x !== undefined ? er.x : View.layout().shaftX - 24, y: 0, person: p };
      errands.splice(k, 1);
    }
    if (c.errand === 'boxes' && p.ti > p.fi && piles[p.fi] > 0) piles[p.fi]--;
  });
  GameEvents.on('board', (e) => {
    ensure();
    const pos = st.pos[e.person.id];
    entering.push({ person: e.person, lift: e.lift.n, fi: e.person.fi, x0: pos ? pos.x : null, t0: run.t, dur: BOARD_TIME * e.person.board * 0.9 });
  });
  // off to change lifts: they walk from the cabin to the queue
  GameEvents.on('transfer', (e) => {
    ensure();
    const g = View.layout();
    if (g) st.pos[e.person.id] = { x: cabinX(g, e.lift.n), y: 0, person: e.person };
  });
  GameEvents.on('delivered', (e) => {
    ensure();
    const p = e.person, c = PEOPLE[p.who] || {};
    if (!c.errand) return;
    const again = run.chains.some((ch) => ch.after === p.key && floorIndex(ch.from) === p.ti);
    errands.push({ person: p, kind: c.errand, fi: p.ti, lift: e.lift.n, t0: run.t, stay: again, box: c.errand === 'boxes' && p.ti > p.fi, done: false });
  });

  function finish(er) {
    er.done = true;
    if (er.kind === 'mail') { mail[er.fi] = true; letters.push({ fi: er.fi, t: 0 }); }
    if (er.box) piles[er.fi] = (piles[er.fi] || 0) + 1;
  }

  // a delivered person whose errand the walkers draw (render/building.js leaves out their usual walk away)
  function takes(p) { return !!(PEOPLE[p.who] || {}).errand; }

  // the riders still walking in: the cabin doesn't draw them yet
  function inside() {
    ensure();
    const ids = new Set();
    for (const w of entering) ids.add(w.person.id);
    return ids;
  }

  // ---------- drawing ----------
  // behind the people: the mailboxes on the wall by the lift, the piles of boxes
  function drawBack(g) {
    ensure();
    for (let i = 0; i < g.n; i++) {
      const y = g.floorY(i);
      if (y > st.h || y + g.fh < 0) continue;
      if (mailboxes) mailbox(mailboxX(g), y + g.fh * 0.3, g.fh, mail[i]);
      if (piles[i]) pile(pileX(g), landY(g, i), g.fh, piles[i]);
    }
  }

  function mailbox(x, y, fh, full) {
    const w = clamp(fh * 0.26, 10, 18), h = w * 0.8;
    ctx.fillStyle = st.eyes ? '#8d959e' : '#2f6fd0';
    roundRect(ctx, x, y, w, h, 2); ctx.fill();
    ctx.fillStyle = '#16212e';
    ctx.fillRect(x + w * 0.2, y + h * 0.25, w * 0.6, Math.max(1.5, h * 0.12));
    // the little flag goes up once a letter is in
    ctx.fillStyle = st.eyes ? '#6b7480' : full ? '#e53935' : '#90a4ae';
    if (full) {
      ctx.fillRect(x + w, y - h * 0.35, Math.max(1.5, w * 0.1), h * 0.6);
      ctx.fillRect(x + w, y - h * 0.35, w * 0.3, h * 0.25);
    } else ctx.fillRect(x + w, y + h * 0.3, w * 0.35, Math.max(1.5, w * 0.1));
  }

  function pile(x, y, fh, n) {
    const b = clamp(fh * 0.2, 7, 14);
    const per = 3;
    for (let k = 0; k < n; k++) {
      const row = Math.floor(k / per), col = k % per;
      const bx = x + col * b * 1.05 + (row % 2) * b * 0.5, by = y - (row + 1) * b * 0.95;
      ctx.fillStyle = st.eyes ? '#8d959e' : '#c8955a';
      ctx.fillRect(bx, by, b, b * 0.9);
      ctx.strokeStyle = st.eyes ? '#6b7480' : '#8a5f2f'; ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, b, b * 0.9);
      ctx.beginPath(); ctx.moveTo(bx + b / 2, by); ctx.lineTo(bx + b / 2, by + b * 0.3); ctx.stroke();
    }
  }

  // in front of the cabins: people walking in, people on an errand, the letters going into a mailbox
  function drawFront(g, dt) {
    ensure();
    const size = g.fh * 0.78, inSize = (g.fh - 6) * 0.62;
    entering = entering.filter((w) => {
      const L = run.lifts[w.lift - 1];
      const u = (run.t - w.t0) / Math.max(0.05, w.dur);
      if (!L || u >= 1 || u < 0 || L.moving || w.person.state !== 'riding') return false;
      const x0 = w.x0 !== null ? w.x0 : g.shaftX - 24;
      const x = lerp(x0, cabinX(g, w.lift), u), y = lerp(landY(g, w.fi), g.baseY - L.pos * g.fh - 5, u);
      if (y > -g.fh && y < st.h + g.fh) Art.person(ctx, x, y, lerp(size, inSize, u), w.person, { grey: st.eyes, walk: run.t * 14 });
      return true;
    });
    errands = errands.filter((er) => {
      const u = (run.t - er.t0) / ERRAND_WALK;
      if (u < 0) return false;
      const tx = spotX(g, er);
      er.x = lerp(cabinX(g, er.lift), tx, Math.min(1, u));
      if (u >= 1 && !er.done) finish(er);
      // nobody rides again: on to the street or the stairs after the drop
      if ((!er.stay && u >= 1 + ERRAND_DROP / ERRAND_WALK) || run.t - er.t0 > ERRAND_MAX) {
        st.leaving.push({ person: er.person, floor: er.person.to, x0: er.x, dir: -1, t: 0, item: er.box ? null : undefined });
        return false;
      }
      const y = landY(g, er.fi);
      if (y > -g.fh && y < st.h + g.fh) Art.person(ctx, er.x, y, size, er.person, { grey: st.eyes, walk: u < 1 ? run.t * 14 : 0, item: er.box && er.done ? null : undefined });
      return true;
    });
    letters = letters.filter((l) => (l.t += dt) < 0.45);
    for (const l of letters) {
      const u = l.t / 0.45, y0 = landY(g, l.fi) - size * 0.45, y1 = g.floorY(l.fi) + g.fh * 0.3;
      const x = lerp(mailboxX(g) + size * 0.3, mailboxX(g) + clamp(g.fh * 0.13, 5, 9), u), y = lerp(y0, y1, u);
      const w = clamp(g.fh * 0.14, 6, 10);
      ctx.globalAlpha = 1 - u * 0.6;
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x - w / 2, y - w * 0.35, w, w * 0.7);
      ctx.strokeStyle = '#7d8a99'; ctx.lineWidth = 0.8; ctx.strokeRect(x - w / 2, y - w * 0.35, w, w * 0.7);
      ctx.beginPath(); ctx.moveTo(x - w / 2, y - w * 0.35); ctx.lineTo(x, y); ctx.lineTo(x + w / 2, y - w * 0.35); ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  return { drawBack, drawFront, inside, takes };
})();
