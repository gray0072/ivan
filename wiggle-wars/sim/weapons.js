'use strict';

// Wiggle Wars — using a weapon, the shots in the air and explosions. use() does what the weapon
// does (fires a shot, swings, drops, calls an air strike, starts the drill or the jetpack, builds
// a plank, teleports); stepShot() moves a shot one step and says when it explodes or sinks, the
// same function for real shots and for the ones the AI and the aim guide only try (sim = true:
// no events, no changes); explode() carves the land, hurts and pushes worms and sets off objects.
// Used by sim/turn.js (Control), sim/objects.js (mines, barrels) and sim/ai.js.

const Weapons = (() => {
  // the unit vector of a worm's aim
  function aimDir(w, aim = w.aim, facing = w.facing) {
    const a = aim * DEG;
    return { x: Math.cos(a) * facing, y: -Math.sin(a) };
  }
  function center(w) { return { x: w.x, y: w.y - WORM_R }; }

  // ---------- damage ----------
  function hurt(w, amount, src) {
    if (!w.alive || amount <= 0) return;
    const was = w.hp;
    w.hp = Math.max(0, w.hp - Math.round(amount));
    const dealt = was - w.hp;
    if (!dealt) return;
    GameEvents.emit('damage', { worm: w, amount: dealt });
    if (src && src.team !== undefined && src.team !== w.team) {
      const t = match.teams[src.team];
      t.stats.dmg += dealt;
      if (w.hp === 0) t.stats.kills++;
    }
    if (match.turn && w === match.turn.worm) match.turn.hurt = true;
  }
  function push(b, nx, ny, speed) {
    b.grounded = false; b.thrown = true; b.air = 0;
    b.vx += nx * speed;
    b.vy += ny * speed - speed * KNOCK_LIFT;
    if (b.state && b.state !== 'idle') b.state = 'idle';
  }

  function explode(x, y, r, dmg, src = {}) {
    if (src.double) dmg *= 2;
    if (r > 0) Terrain.carve(x, y, r);
    for (const w of match.worms) {
      if (!w.alive) continue;
      const dx = w.x - x, dy = wormCenterY(w) - y, d = Math.hypot(dx, dy);
      const reach = r + WORM_R;
      if (d >= reach) continue;
      const amount = Math.round(dmg * (1 - d / reach));
      if (amount <= 0) continue;
      hurt(w, amount, src);
      if (d < 1) push(w, 0, -1, amount * KNOCK); else push(w, dx / d, dy / d, amount * KNOCK);
    }
    Objects.blast(x, y, r, dmg, src);
    GameEvents.emit('explosion', { x, y, r, demo: match.mode === 'demo' });
  }

  // ---------- shots ----------
  function makeShot(kind, x, y, vx, vy, props) {
    return Object.assign({ kind, x, y, vx, vy, age: 0, fuse: null, rest: false, leftOwner: false }, props);
  }
  // a shot fired by worm w with weapon id at power 0..1 (not yet in the match)
  function launch(w, id, power, fuse, target) {
    const def = WEAPONS[id], dir = aimDir(w), c = center(w);
    const sp = def.speed * clamp(power, 0.08, 1);
    const shot = makeShot(def.kind, c.x + dir.x * 10, c.y + dir.y * 10, dir.x * sp, dir.y * sp, {
      w: id, r: def.r, dmg: def.dmg, wind: !!def.wind, bounce: def.bounce || 0, owner: w, team: w.team
    });
    if (def.kind === 'grenade') shot.fuse = fuse;
    if (def.homing && target) shot.homing = Object.assign({ tx: target.x, ty: target.y }, def.homing);
    return shot;
  }

  // moves a shot one step: 'explode', 'sink' or null. ctx.sim: only trying (no events)
  function stepShot(s, dt, ctx) {
    s.age += dt;
    if (s.fuse !== null) {
      s.fuse -= dt;
      if (s.fuse <= 0) return 'explode';
    }
    const h = s.homing;
    if (h && s.age > h.after && s.age < h.after + h.time) {
      const want = Math.atan2(h.ty - s.y, h.tx - s.x);
      let cur = Math.atan2(s.vy, s.vx);
      let d = want - cur;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      cur += clamp(d, -h.turn * dt, h.turn * dt);
      const sp = lerp(Math.hypot(s.vx, s.vy), h.speed, 0.1);
      s.vx = Math.cos(cur) * sp; s.vy = Math.sin(cur) * sp;
    } else if (!s.rest) {
      s.vy += ctx.g * dt;
      if (s.wind) s.vx += match.wind * WIND_MAX * match.windMul * dt;
    }
    if (s.rest) {
      if (Terrain.solid(s.x, s.y + 3) || Terrain.solid(s.x - 2, s.y + 3) || Terrain.solid(s.x + 2, s.y + 3)) return null;
      s.rest = false;
    }
    const sp = Math.hypot(s.vx, s.vy);
    const n = Math.max(1, Math.ceil(sp * dt / 2));
    const sx = s.vx * dt / n, sy = s.vy * dt / n;
    const bouncy = s.kind === 'grenade' || s.kind === 'dynamite';
    for (let i = 0; i < n; i++) {
      const nx = s.x + sx, ny = s.y + sy;
      // worms
      let hitWorm = null;
      for (const w of ctx.worms) {
        if (!w.alive) continue;
        const d = Math.hypot(nx - w.x, ny - wormCenterY(w));
        if (w === s.owner && !s.leftOwner) { if (d > WORM_R + 5) s.leftOwner = true; continue; }
        if (d < WORM_R + 3) { hitWorm = w; break; }
      }
      if (hitWorm) {
        if (!bouncy) { s.x = nx; s.y = ny; return 'explode'; }
        const ex = s.x - hitWorm.x, ey = s.y - wormCenterY(hitWorm), el = Math.hypot(ex, ey) || 1;
        reflect(s, ex / el, ey / el, ctx);
        break;
      }
      if (Terrain.solid(nx, ny)) {
        if (!bouncy) { s.x = nx; s.y = ny; return 'explode'; }
        const nrm = Terrain.normal(s.x, s.y, 6) || (() => { const l = Math.hypot(s.vx, s.vy) || 1; return { x: -s.vx / l, y: -s.vy / l }; })();
        reflect(s, nrm.x, nrm.y, ctx);
        break;
      }
      s.x = nx; s.y = ny;
    }
    if (s.y > match.water) return 'sink';
    if (s.x < -700 || s.x > WORLD_W + 700 || s.y < -4000) return 'sink';
    return null;
  }
  function reflect(s, nx, ny, ctx) {
    const vn = s.vx * nx + s.vy * ny;
    if (vn < 0) {
      s.vx -= (1 + s.bounce) * vn * nx;
      s.vy -= (1 + s.bounce) * vn * ny;
      s.vx *= 0.85; s.vy *= 0.85;
      if (!ctx.sim && -vn > 70) GameEvents.emit('bounce', { x: s.x, y: s.y, demo: match.mode === 'demo' });
    }
    if (Math.hypot(s.vx, s.vy) < 30) { s.vx = 0; s.vy = 0; s.rest = true; }
  }

  // a shot's end: its blast (and a cluster bomb's bomblets)
  function burst(s) {
    explode(s.x, s.y, s.r, s.dmg, { team: s.team, double: s.double });
    const def = WEAPONS[s.w];
    if (def && def.bomblets && s.kind === 'grenade') {
      const b = def.bomblets;
      for (let i = 0; i < b.n; i++) {
        const a = -Math.PI / 2 + (i - (b.n - 1) / 2) * 0.45 + (Math.random() - 0.5) * 0.2;
        const sp = b.speed * (0.75 + Math.random() * 0.5);
        match.shots.push(makeShot('bomblet', s.x, s.y - 4, Math.cos(a) * sp, Math.sin(a) * sp,
          { w: null, r: b.r, dmg: b.dmg, team: s.team, double: s.double, leftOwner: true }));
      }
    }
  }

  function updateShots(dt) {
    const ctx = { g: gravityNow(), worms: match.worms };
    for (let i = match.shots.length - 1; i >= 0; i--) {
      const s = match.shots[i];
      const r = stepShot(s, dt, ctx);
      if (s.trace && (s.age * 60 | 0) % 3 === 0) s.trace.push(s.x, s.y);
      if (r === 'explode') { match.shots.splice(i, 1); burst(s); }
      else if (r === 'sink') {
        match.shots.splice(i, 1);
        if (s.y > match.water) GameEvents.emit('splash', { x: s.x, y: match.water, small: true, demo: match.mode === 'demo' });
      }
    }
  }

  // where a shot fired now would end, by the game's own physics (the AI, the aim guide)
  function predict(w, id, power, fuse, opts = {}) {
    const s = launch(w, id, power, fuse, opts.target);
    if (opts.aim !== undefined) {
      const dir = aimDir(w, opts.aim, opts.facing), c = center(w), sp = WEAPONS[id].speed * clamp(power, 0.08, 1);
      s.x = c.x + dir.x * 10; s.y = c.y + dir.y * 10; s.vx = dir.x * sp; s.vy = dir.y * sp;
    }
    const ctx = { g: opts.g || gravityNow(), worms: match.worms, sim: true };
    const pts = opts.points ? [] : null;
    const maxT = opts.maxT || AI_SIM_TIME;
    for (let t = 0; t < maxT; t += SIM_DT) {
      const r = stepShot(s, SIM_DT, ctx);
      if (pts && ((t * 60) | 0) % 3 === 0) pts.push(s.x, s.y);
      if (r) return { x: s.x, y: s.y, end: r, points: pts, t };
    }
    return { x: s.x, y: s.y, end: 'time', points: pts, t: maxT };
  }

  // ---------- using a weapon ----------
  // does what weapon id does for worm w; false when it can't (nothing is used up then)
  function use(w, id, opts) {
    const def = WEAPONS[id], turn = match.turn;
    const dir = aimDir(w), c = center(w);
    const demo = match.mode === 'demo';
    switch (def.kind) {
      case 'missile':
      case 'grenade': {
        const s = launch(w, id, opts.power, turn.fuse, turn.target);
        s.double = turn.double;
        s.trace = [s.x, s.y];
        match.teams[w.team].trace = s.trace;
        match.shots.push(s);
        match.focus = s;
        GameEvents.emit('fire', { weapon: id, x: c.x, y: c.y, power: opts.power, demo });
        return true;
      }
      case 'hitscan': {
        let x1 = c.x, y1 = c.y, hit = null;
        for (let d = 8; d <= def.range; d += 2) {
          const px = c.x + dir.x * d, py = c.y + dir.y * d;
          x1 = px; y1 = py;
          hit = match.worms.find((o) => o.alive && o !== w && Math.hypot(px - o.x, py - wormCenterY(o)) < WORM_R);
          if (hit) break;
          if (Objects.hitAt(px, py, { team: w.team, double: turn.double }, def.dmg)) break;
          if (Terrain.solid(px, py)) { explode(px, py, def.r, def.dmg / 2, { team: w.team, double: turn.double }); break; }
        }
        if (hit) {
          hurt(hit, def.dmg * (turn.double ? 2 : 1), { team: w.team });
          push(hit, dir.x, dir.y, 220);
        }
        GameEvents.emit('shotgun', { x0: c.x, y0: c.y, x1, y1, demo });
        return true;
      }
      case 'melee': {
        const px = c.x + dir.x * 10, py = c.y + dir.y * 10;
        let any = false;
        for (const o of match.worms) {
          if (!o.alive || o === w) continue;
          if (Math.hypot(px - o.x, py - wormCenterY(o)) > def.reach + WORM_R) continue;
          any = true;
          hurt(o, def.dmg * (turn.double ? 2 : 1), { team: w.team });
          o.grounded = false; o.thrown = true; o.air = 0;
          o.vx = dir.x * def.push;
          o.vy = Math.min(dir.y * def.push, -def.push * 0.3);
          o.y -= 2;
          match.focus = o;
        }
        GameEvents.emit('bat', { x: px, y: py, hit: any, demo });
        return true;
      }
      case 'drop': {
        const x = w.x + w.facing * 7, y = c.y;
        if (def.mine) {
          Objects.add('mine', x, y, { vx: w.facing * 40, vy: -60, armed: MINE_ARM, team: w.team });
        } else {
          const s = makeShot('dynamite', x, y, w.facing * 40, -60, { w: id, r: def.r, dmg: def.dmg, bounce: 0.15, owner: w, team: w.team, leftOwner: true, double: turn.double });
          s.fuse = def.fuseTime;
          match.shots.push(s);
        }
        GameEvents.emit('drop', { weapon: id, demo });
        return true;
      }
      case 'airstrike': {
        const t = turn.target;
        if (!t) return false;
        const g = gravityNow(), vx = w.facing * 90;
        for (let i = 0; i < def.bombs; i++) {
          const bx = t.x + (i - (def.bombs - 1) / 2) * def.gap;
          const y0 = -60 - i * 30;
          const fall = Math.sqrt(2 * Math.max(40, t.y - y0) / g);
          const s = makeShot('bomb', bx - vx * fall, y0, vx, 0, { w: id, r: def.r, dmg: def.dmg, wind: true, team: w.team, leftOwner: true, double: turn.double });
          match.shots.push(s);
          if (i === (def.bombs >> 1)) match.focus = s;
        }
        GameEvents.emit('airstrike', { x: t.x, y: t.y, dir: w.facing, demo });
        return true;
      }
      case 'drill': {
        w.state = 'drill';
        w.drill = { t: def.time, x: dir.x, y: dir.y };
        w.grounded = false; w.vx = 0; w.vy = 0;
        GameEvents.emit('drill', { on: true, demo });
        return true;
      }
      case 'jetpack': {
        w.state = 'jet';
        w.jet = { fuel: def.fuel, up: 0, side: 0 };
        w.grounded = false; w.thrown = false; w.air = 0; w.vy = -140; w.y -= 2;
        GameEvents.emit('jetpack', { on: true, demo });
        return true;
      }
      case 'teleport': {
        const t = turn.target;
        if (!t) return false;
        const fx = Math.round(t.x), fy = Math.round(t.y + WORM_R);
        if (fx < 12 || fx > WORLD_W - 12 || t.y < 10 || fy > match.water - 24 || !Physics.fits(fx, fy)) {
          GameEvents.emit('refused', { text: 'There is no room there.' });
          return false;
        }
        const from = { x: w.x, y: c.y };
        w.x = fx; w.y = fy; w.vx = 0; w.vy = 0; w.grounded = false; w.thrown = false; w.air = 0;
        GameEvents.emit('teleport', { from, to: { x: fx, y: fy - WORM_R }, demo });
        return true;
      }
      case 'plank': {
        const t = turn.target;
        if (!t) return false;
        if (Math.hypot(t.x - c.x, t.y - c.y) > def.range) { GameEvents.emit('refused', { text: 'Too far away.' }); return false; }
        const ang = turn.plankAngle * DEG;
        for (const o of match.worms) {
          if (!o.alive) continue;
          const cy = wormCenterY(o);
          for (const [ox, oy] of [[0, 0], [0, -WORM_R], [0, WORM_R], [-WORM_R, 0], [WORM_R, 0]]) {
            if (Terrain.inPlank(o.x + ox, cy + oy, t.x, t.y, ang, def.len, def.thick + 2)) {
              GameEvents.emit('refused', { text: 'A worm is in the way.' });
              return false;
            }
          }
        }
        Terrain.addPlank(t.x, t.y, ang, def.len, def.thick);
        GameEvents.emit('plankBuilt', { x: t.x, y: t.y, demo });
        return true;
      }
      case 'power': {
        if (id === 'double') turn.double = true;
        if (id === 'lowgrav') turn.lowgrav = true;
        GameEvents.emit('power', { weapon: id, demo });
        return true;
      }
      case 'skip':
        return true;
    }
    return false;
  }

  // the drill and the jetpack, one step of each for a worm using it
  function updateTools(w, dt) {
    if (w.state === 'drill') {
      const d = w.drill;
      d.t -= dt;
      const sp = WEAPONS.drill.speed * dt;
      const nx = w.x + d.x * sp, ny = w.y + d.y * sp;
      if (nx < 4 || nx > WORLD_W - 4 || ny < WORM_R * 2) d.t = 0;
      else { w.x = nx; w.y = ny; }
      Terrain.carve(w.x, w.y - WORM_R, WEAPONS.drill.r);
      if (d.t <= 0) stopDrill(w);
      return true;
    }
    if (w.state === 'jet') {
      const j = w.jet, def = WEAPONS.jetpack;
      if (j.fuel > 0 && (j.up || j.side)) {
        w.vy -= def.thrust * j.up * dt;
        w.vx += def.side * j.side * dt;
        j.fuel = Math.max(0, j.fuel - dt * (j.up ? 1 : 0.6));
        if (j.side) w.facing = j.side > 0 ? 1 : -1;
      } else w.vx *= 1 - 1.2 * dt;
      const sp = Math.hypot(w.vx, w.vy);
      if (sp > def.max) { w.vx *= def.max / sp; w.vy *= def.max / sp; }
      return false; // the normal physics moves it
    }
    return false;
  }
  function stopDrill(w) {
    if (w.state !== 'drill') return;
    w.state = 'idle'; w.drill = null; w.grounded = false; w.vx = 0; w.vy = 0; w.thrown = false;
    if (!Physics.fits(w.x, w.y)) Physics.unstick(w, WORM_R);
    GameEvents.emit('drill', { on: false, demo: match.mode === 'demo' });
  }
  function stopJet(w) {
    if (w.state !== 'jet') return;
    w.state = 'idle'; w.jet = null;
    GameEvents.emit('jetpack', { on: false, demo: match.mode === 'demo' });
  }

  return { aimDir, hurt, push, explode, launch, stepShot, updateShots, predict, use, updateTools, stopDrill, stopJet, makeShot };
})();
