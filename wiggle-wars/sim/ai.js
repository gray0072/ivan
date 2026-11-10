'use strict';

// Wiggle Wars — the computer player. On a CPU worm's turn it waits a moment, then tries the shots
// it understands with the game's own physics (Weapons.predict: wind, bounces, fuses) and scores
// where each one would end: damage to the enemy, bonuses for kills and for worms near the water,
// a penalty for its own team. The trying is spread over several frames (a time budget per step).
// Then it turns, aims and charges like a player through Control, spoiled by the difficulty. With
// nothing worth firing it walks towards the enemy (or a crate close by) once and thinks again.
// Used by sim/turn.js while a CPU team plays.

const Ai = (() => {
  const BUDGET_MS = 7;
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

  function enemiesOf(team) { return match.worms.filter((w) => w.alive && w.hp > 0 && w.team !== team); }
  function nearWater(w) { return w.y > match.water - 60 || w.x < 60 || w.x > WORLD_W - 60; }

  // how good a blast at (x, y) would be for team `team`
  function scoreBlast(x, y, r, dmg, team, depth = 0) {
    let s = 0;
    for (const w of match.worms) {
      if (!w.alive || w.hp <= 0) continue;
      const d = Math.hypot(w.x - x, wormCenterY(w) - y), reach = r + WORM_R;
      if (d >= reach) continue;
      const amt = dmg * (1 - d / reach);
      const bonus = (amt >= w.hp ? AI_KILL_BONUS : 0) + (nearWater(w) && amt > 8 ? AI_WATER_BONUS : 0);
      if (w.team === team) s -= AI_OWN_WEIGHT * (Math.min(amt, w.hp) + bonus);
      else s += Math.min(amt, w.hp) + bonus;
    }
    if (depth === 0) {
      for (const o of match.objects) {
        if (o.type !== 'barrel' && o.type !== 'mine') continue;
        if (Math.hypot(o.x - x, o.y - o.r - y) < r + o.r) {
          const b = o.type === 'barrel' ? BARREL_BLAST : WEAPONS.mine;
          s += 0.8 * scoreBlast(o.x, o.y - o.r, b.r, b.dmg, team, 1);
        }
      }
    }
    return s;
  }

  function tryShot(w, team, ai, id, facing, aim, power) {
    const def = WEAPONS[id];
    const res = Weapons.predict(w, id, power, 3, { aim, facing, maxT: AI_SIM_TIME });
    if (res.end !== 'explode') return;
    let sc = scoreBlast(res.x, res.y, def.r, def.dmg, team);
    if (id === 'cluster') sc *= 1.3;
    if (def.ammo > 0) sc *= 0.92;
    let near = Infinity;
    for (const e of match.worms) if (e.alive && e.hp > 0 && e.team !== team) near = Math.min(near, Math.hypot(e.x - res.x, wormCenterY(e) - res.y));
    ai.cands.push({ weapon: id, facing, aim, power, fuse: 3, score: sc, near, fly: true });
  }
  // finer tries round the best flying shots so far: those that score, else those landing nearest an enemy.
  // level 1 is a quarter of the coarse grid's step, level 2 a sixteenth.
  function refineTasks(w, team, ai, level) {
    const rank = (c) => (c.score > 0 ? 1000 + c.score : -c.near);
    const seen = new Set();
    const best = ai.cands.filter((c) => c.fly && (c.score > 0 || c.near < 300)).sort((a, b) => rank(b) - rank(a))
      .filter((c) => { const k = c.weapon + c.facing + Math.round(c.aim / 3) + ':' + Math.round(c.power * 30); if (seen.has(k)) return false; seen.add(k); return true; })
      .slice(0, AI_REFINE);
    const k = level === 1 ? 4 : 16;
    const da = AI_ANGLE_STEP / k, dp = 1 / AI_POWER_STEPS / k;
    return best.map((c) => () => {
      for (let i = -2; i <= 2; i++) {
        for (let j = -3; j <= 3; j++) {
          if (!i && !j) continue;
          tryShot(w, team, ai, c.weapon, c.facing, clamp(c.aim + i * da * 2, AIM_MIN, AIM_MAX), clamp(c.power + j * dp * 2, 0.05, 1));
        }
      }
    });
  }

  // the list of tries for this worm, each a small function adding to ai.cands
  function tasks(w, team, ai) {
    const list = [];
    const tm = match.teams[team];
    const ready = (id) => weaponReady(tm, id);
    // the shots that fly: a coarse grid of aims and powers first, refined round the best later
    for (const id of ['bazooka', 'grenade', 'cluster']) {
      if (!ready(id)) continue;
      for (const facing of [-1, 1]) {
        for (let aim = -50; aim <= 85; aim += AI_ANGLE_STEP) {
          list.push(() => {
            for (let p = 2; p <= AI_POWER_STEPS; p++) tryShot(w, team, ai, id, facing, aim, p / AI_POWER_STEPS);
          });
        }
      }
    }
    if (ready('shotgun')) {
      list.push(() => {
        const c = { x: w.x, y: wormCenterY(w) };
        for (const facing of [-1, 1]) {
          for (let aim = -60; aim <= 60; aim += 2.5) {
            const dir = Weapons.aimDir(w, aim, facing);
            for (let d = 8; d <= WEAPONS.shotgun.range; d += 3) {
              const px = c.x + dir.x * d, py = c.y + dir.y * d;
              const hit = match.worms.find((o) => o.alive && o.hp > 0 && o !== w && Math.hypot(px - o.x, py - wormCenterY(o)) < WORM_R);
              if (hit) {
                const dmg = WEAPONS.shotgun.dmg * 2;
                let sc = Math.min(dmg, hit.hp) + (dmg >= hit.hp ? AI_KILL_BONUS : 0);
                if (hit.team === team) sc = -AI_OWN_WEIGHT * sc;
                ai.cands.push({ weapon: 'shotgun', facing, aim, power: 1, score: sc * 0.95 });
                break;
              }
              if (Terrain.solid(px, py)) break;
            }
          }
        }
      });
    }
    if (ready('bat')) {
      for (const e of enemiesOf(team)) {
        const dx = e.x - w.x, dy = wormCenterY(e) - wormCenterY(w);
        if (Math.hypot(dx, dy) < WEAPONS.bat.reach + WORM_R + 6) {
          const sc = Math.min(30, e.hp) + (e.hp <= 30 ? AI_KILL_BONUS : 0) + (nearWater(e) ? AI_WATER_BONUS * 1.5 : 10);
          ai.cands.push({ weapon: 'bat', facing: dx >= 0 ? 1 : -1, aim: 30, power: 1, score: sc });
        }
      }
    }
    if (ready('airstrike')) {
      list.push(() => {
        for (const e of enemiesOf(team)) {
          for (const facing of [-1, 1]) {
            const t = { x: e.x, y: wormCenterY(e) };
            let sc = 0;
            const def = WEAPONS.airstrike, g = gravityNow(), vx = facing * 90;
            for (let i = 0; i < def.bombs; i++) {
              const bx = t.x + (i - (def.bombs - 1) / 2) * def.gap, y0 = -60 - i * 30;
              const fall = Math.sqrt(2 * Math.max(40, t.y - y0) / g);
              const s = Weapons.makeShot('bomb', bx - vx * fall, y0, vx, 0, { r: def.r, dmg: def.dmg, wind: true, leftOwner: true });
              const ctx = { g, worms: match.worms, sim: true };
              for (let k = 0; k < 600; k++) {
                const r = Weapons.stepShot(s, SIM_DT, ctx);
                if (r === 'explode') { sc += scoreBlast(s.x, s.y, def.r, def.dmg, team); break; }
                if (r) break;
              }
            }
            ai.cands.push({ weapon: 'airstrike', facing, aim: 0, power: 1, target: t, score: sc * 0.85 });
          }
        }
      });
    }
    if (ready('homing')) {
      for (const e of enemiesOf(team)) {
        ai.cands.push({ weapon: 'homing', facing: e.x >= w.x ? 1 : -1, aim: 55, power: 0.55, target: { x: e.x, y: wormCenterY(e) },
          score: scoreBlast(e.x, wormCenterY(e), WEAPONS.homing.r, WEAPONS.homing.dmg, team) * 0.6 });
      }
    }
    return list;
  }

  function choose(ai) {
    const diff = DIFFICULTY[match.difficulty] || DIFFICULTY.medium;
    const c = ai.cands.sort((a, b) => b.score - a.score);
    if (!c.length) return null;
    let p = c[0];
    if (diff.pickTop > 1) {
      const good = c.filter((x) => x.score > Math.max(AI_MIN_SCORE, c[0].score * 0.4)).slice(0, diff.pickTop);
      if (good.length) p = good[Math.floor(Math.random() * good.length)];
    }
    p = Object.assign({}, p);
    if (p.weapon !== 'bat' && p.weapon !== 'airstrike') {
      p.aim = clamp(p.aim + (Math.random() * 2 - 1) * diff.aimErr, AIM_MIN, AIM_MAX);
      p.power = clamp(p.power * (1 + (Math.random() * 2 - 1) * diff.powErr), 0.05, 1);
    }
    return p;
  }

  // nothing to hit from here: teleport closer to the enemy, or drill towards it
  function escape(w) {
    const tm = match.teams[w.team], es = enemiesOf(w.team);
    if (!es.length) return null;
    const e = es.reduce((a, b) => (Math.hypot(a.x - w.x, a.y - w.y) < Math.hypot(b.x - w.x, b.y - w.y) ? a : b));
    if (weaponReady(tm, 'teleport')) {
      const spots = Terrain.standSpots(10, match.water).filter((s) => {
        const d = Math.hypot(s.x - e.x, s.y - e.y);
        return d > 140 && d < 420 && s.y < match.water - 40 && Math.abs(s.y - e.y) < 160;
      });
      if (spots.length) {
        const s = spots[Math.floor(Math.random() * spots.length)];
        return { weapon: 'teleport', facing: w.facing, aim: w.aim, power: 1, target: { x: s.x, y: s.y - WORM_R - 1 }, score: 1 };
      }
    }
    if (weaponReady(tm, 'drill')) {
      const facing = e.x >= w.x ? 1 : -1;
      const aim = clamp(Math.atan2(-(e.y - w.y), Math.abs(e.x - w.x)) / DEG, -45, 45);
      return { weapon: 'drill', facing, aim, power: 1, score: 1 };
    }
    return null;
  }

  // a direction to walk, or 0 when it would walk off a cliff into nothing
  function safeStep(w, dir) {
    const s = Physics.stepFrom(w.x, w.y, dir);
    if (!s) return 'wall';
    if (!s.fall) return 'ok';
    for (let k = 1; k < 90; k++) {
      const y = w.y + k;
      if (y > match.water - 12) return 'cliff';
      if (Terrain.solid(s.x, y + 1)) return 'ok';
    }
    return 'cliff';
  }

  function update(dt) {
    const t = match.turn, w = t.worm;
    if (!t.ai) t.ai = { phase: 'wait', t: 0, walked: false, crate: false };
    const ai = t.ai;
    ai.t += dt;
    switch (ai.phase) {
      case 'wait': {
        if (ai.t < AI_THINK) return;
        if (!w.grounded) {
          if (ai.t > 6) { Control.select('skip'); Control.useNow(1); ai.phase = 'done'; }
          return;
        }
        // a crate close by first
        if (!ai.crate) {
          ai.crate = true;
          const c = match.objects.find((o) => (o.type === 'crate' || o.type === 'gold') && o.grounded && Math.abs(o.x - w.x) < 80 && Math.abs(o.y - w.y) < 24);
          if (c) { ai.phase = 'walk'; ai.dir = c.x > w.x ? 1 : -1; ai.walkT = 0; ai.walkMax = 2; ai.lastX = w.x; ai.stuck = 0; return; }
        }
        ai.cands = []; ai.todo = tasks(w, w.team, ai); ai.refined = 0; ai.phase = 'think';
        return;
      }
      case 'think': {
        const t0 = now();
        while (ai.todo.length && now() - t0 < BUDGET_MS) ai.todo.shift()();
        if (ai.todo.length) return;
        if (ai.refined < 2) { ai.refined++; ai.todo = refineTasks(w, w.team, ai, ai.refined); if (ai.todo.length) return; }
        const p = choose(ai);
        if ((!p || p.score < AI_MIN_SCORE) && !ai.walked) {
          const es = enemiesOf(w.team);
          if (es.length) {
            const e = es.reduce((a, b) => (Math.abs(a.x - w.x) < Math.abs(b.x - w.x) ? a : b));
            ai.dir = e.x > w.x ? 1 : -1;
            ai.phase = 'walk'; ai.walkT = 0; ai.walkMax = AI_WALK_TIME; ai.lastX = w.x; ai.stuck = 0; ai.walked = true;
            return;
          }
        }
        ai.plan = p && p.score > 0 ? p : escape(w) || { weapon: 'skip', facing: w.facing, aim: w.aim, power: 1 };
        ai.phase = 'prep'; ai.t = 0;
        return;
      }
      case 'walk': {
        ai.walkT += dt;
        if (w.grounded) {
          const s = safeStep(w, ai.dir);
          if (s === 'cliff') ai.walkT = ai.walkMax;
          else if (s === 'wall') {
            ai.stuck += dt;
            if (ai.stuck > 0.3) { Control.jump(false); ai.stuck = -1; }
          } else Control.walk(ai.dir, dt);
        }
        if (ai.walkT >= ai.walkMax) { ai.phase = 'wait'; ai.t = AI_THINK * 0.6; }
        return;
      }
      case 'prep': {
        const p = ai.plan;
        if (!w.grounded) return;
        if (t.weapon !== p.weapon && !Control.select(p.weapon)) { p.weapon = 'skip'; Control.select('skip'); }
        if (p.weapon === 'skip') { Control.useNow(1); ai.phase = 'done'; return; }
        w.facing = p.facing;
        if (p.fuse) Control.setFuse(p.fuse);
        if (p.target && !t.target) Control.setTarget(p.target.x, p.target.y);
        const d = p.aim - w.aim, step = AI_AIM_SPEED * dt;
        if (Math.abs(d) > step) { w.aim += Math.sign(d) * step; return; }
        w.aim = p.aim;
        if (ai.t < 0.35) return;
        Control.fireDown();
        ai.phase = t.charging ? 'charge' : (t.shotsLeft ? 'again' : 'done');
        ai.t = 0;
        return;
      }
      case 'charge':
        if (t.power >= ai.plan.power) { t.power = ai.plan.power; Control.fireUp(); ai.phase = 'done'; }
        return;
      case 'again':
        if (ai.t > 0.7 && t.phase === 'play') { Control.fireDown(); ai.phase = t.shotsLeft ? 'again' : 'done'; ai.t = 0; }
        return;
    }
  }

  return { update, scoreBlast };
})();
