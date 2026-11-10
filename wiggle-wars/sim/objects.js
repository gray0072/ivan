'use strict';

// Wiggle Wars — the things lying on the land: crates (health, weapon, tool) parachuted in, the
// campaign's golden crate and targets, mines, oil barrels and gravestones. Each is a small body
// (sim/physics.js); mines count down when a worm comes close, barrels blow up when hurt enough,
// crates are picked up by touching them. Used by sim/turn.js (each step, crate drops), sim/weapons.js
// (blasts, shotgun hits) and sim/match.js (the map's objects).

const Objects = (() => {
  const SIZE = { crate: CRATE_R, gold: CRATE_R + 1, mine: 4, barrel: 9, target: TARGET_R, grave: 6 };

  function add(type, x, y, extra) {
    const o = Object.assign({ type, x, y, vx: 0, vy: 0, grounded: false, r: SIZE[type], air: 0 }, extra);
    match.objects.push(o);
    return o;
  }
  function remove(o) {
    const i = match.objects.indexOf(o);
    if (i >= 0) match.objects.splice(i, 1);
  }

  // ---------- crates ----------
  function weighted(list, rnd) {
    const total = list.reduce((s, x) => s + x.w, 0);
    let r = rnd() * total;
    for (const x of list) { r -= x.w; if (r <= 0) return x.id; }
    return list.length ? list[list.length - 1].id : null;
  }
  // what a new crate holds: { kind, weapon }
  function crateContent(rnd = Math.random) {
    let r = rnd();
    let kind = r < CRATE_KINDS.health ? 'health' : r < CRATE_KINDS.health + CRATE_KINDS.weapon ? 'weapon' : 'tool';
    if (kind === 'weapon') {
      const list = Object.keys(WEAPONS).filter((id) => WEAPONS[id].crate > 0 && match.enabled.includes(id)).map((id) => ({ id, w: WEAPONS[id].crate }));
      if (!list.length) kind = 'tool';
      else return { kind, weapon: weighted(list, rnd) };
    }
    if (kind === 'tool') {
      const list = TOOL_CRATE.filter((id) => WEAPONS[id].crateOnly || match.enabled.includes(id));
      return list.length ? { kind, weapon: list[Math.floor(rnd() * list.length)] } : { kind: 'health' };
    }
    return { kind };
  }
  // a crate falling from the top at x (a random place over the land when none is given)
  function dropCrate(x) {
    if (x === undefined) {
      const spots = Terrain.standSpots(12, match.water).filter((s) => match.worms.every((w) => !w.alive || Math.abs(w.x - s.x) > 30));
      if (!spots.length) return null;
      x = spots[Math.floor(Math.random() * spots.length)].x;
    }
    let y = 10;
    while (y < match.water && !Physics.fits(x, y, CRATE_R)) y += 4; // a cave's ceiling: start under it
    const o = add('crate', x, y, Object.assign({ parachute: true }, crateContent()));
    GameEvents.emit('crateDrop', { crate: o, demo: match.mode === 'demo' });
    return o;
  }
  function pickUp(o, w) {
    remove(o);
    const team = match.teams[w.team];
    if (o.type === 'gold') { match.goldTaken = true; GameEvents.emit('pickup', { worm: w, kind: 'gold', demo: match.mode === 'demo' }); return; }
    if (o.kind === 'health') w.hp += HEALTH_CRATE;
    else if (team.ammo[o.weapon] !== -1) team.ammo[o.weapon] = (team.ammo[o.weapon] || 0) + 1;
    GameEvents.emit('pickup', { worm: w, kind: o.kind, weapon: o.weapon, demo: match.mode === 'demo' });
  }

  // ---------- each step ----------
  function update(dt) {
    const g = GRAVITY * match.gravity;
    for (let i = match.objects.length - 1; i >= 0; i--) {
      const o = match.objects[i];
      const r = Physics.update(o, dt, g);
      if (r === 'water') {
        match.objects.splice(i, 1);
        if (o.type === 'gold') match.goldLost = true;
        GameEvents.emit('splash', { x: o.x, y: match.water, small: true, demo: match.mode === 'demo' });
        continue;
      }
      if (r === 'land' && o.type === 'crate') GameEvents.emit('crateLand', { x: o.x, y: o.y, demo: match.mode === 'demo' });
      if (o.type === 'crate' || o.type === 'gold') {
        const w = match.worms.find((q) => q.alive && q.hp > 0 && Math.hypot(q.x - o.x, wormCenterY(q) - (o.y - o.r)) < CRATE_PICK);
        if (w) pickUp(o, w);
      } else if (o.type === 'mine') {
        if (o.armed > 0) { o.armed -= dt; continue; }
        if (o.fuse === undefined || o.fuse === null) {
          if (match.worms.some((q) => q.alive && Math.hypot(q.x - o.x, wormCenterY(q) - o.y) < MINE_TRIGGER)) {
            o.fuse = MINE_FUSE; o.beep = 0;
            GameEvents.emit('mineTrigger', { x: o.x, y: o.y, demo: match.mode === 'demo' });
          }
        } else {
          o.fuse -= dt; o.beep -= dt;
          if (o.beep <= 0) { o.beep = 0.25; GameEvents.emit('mineBeep', { demo: match.mode === 'demo' }); }
          if (o.fuse <= 0) {
            match.objects.splice(i, 1);
            Weapons.explode(o.x, o.y - 3, WEAPONS.mine.r, WEAPONS.mine.dmg, { team: o.team });
          }
        }
      }
    }
  }

  // an explosion's effect on every object in its reach
  function blast(x, y, r, dmg, src) {
    for (const o of match.objects.slice()) {
      const d = Math.hypot(o.x - x, o.y - o.r - y);
      if (d > r + o.r) continue;
      const f = 1 - d / (r + o.r);
      if (o.type === 'barrel') {
        o.hp -= dmg * f + 1;
        if (o.hp <= 0) chain(o, BARREL_BLAST.r, BARREL_BLAST.dmg, src);
        else if (d > 0.5) Weapons.push(o, (o.x - x) / d, (o.y - o.r - y) / d, dmg * f * KNOCK * 0.6);
      } else if (o.type === 'mine') {
        chain(o, WEAPONS.mine.r, WEAPONS.mine.dmg, src);
      } else if (o.type === 'crate') {
        remove(o);
        GameEvents.emit('crateGone', { x: o.x, y: o.y - o.r });
      } else if (o.type === 'target') {
        breakTarget(o);
      } else if (d > 0.5) {
        Weapons.push(o, (o.x - x) / d, (o.y - o.r - y) / d, dmg * f * KNOCK * 0.5);
      }
    }
  }
  // a barrel or a mine set off by another blast goes off a moment later
  function chain(o, r, dmg, src) {
    remove(o);
    match.timers.push({ t: CHAIN_DELAY, x: o.x, y: o.y - o.r, r, dmg, src: { team: src && src.team } });
  }
  function breakTarget(o) {
    remove(o);
    match.targetsLeft = match.objects.filter((q) => q.type === 'target').length;
    GameEvents.emit('targetBroken', { x: o.x, y: o.y - o.r, left: match.targetsLeft, demo: match.mode === 'demo' });
  }
  // a shotgun pellet at (x, y): true when it hit a barrel or a target there
  function hitAt(x, y, src, dmg) {
    const o = match.objects.find((q) => (q.type === 'barrel' || q.type === 'target') && Math.hypot(q.x - x, q.y - q.r - y) < q.r);
    if (!o) return false;
    if (o.type === 'target') breakTarget(o);
    else { o.hp -= dmg; if (o.hp <= 0) chain(o, BARREL_BLAST.r, BARREL_BLAST.dmg, src); }
    return true;
  }

  // nothing moving or ticking
  function quiet() {
    return match.objects.every((o) => o.grounded && !(o.type === 'mine' && o.fuse !== undefined && o.fuse !== null) &&
      !(o.type === 'mine' && o.armed > 0 && !o.grounded));
  }

  return { add, remove, dropCrate, update, blast, hitAt, quiet, crateContent };
})();
