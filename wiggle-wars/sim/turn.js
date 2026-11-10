'use strict';

// Wiggle Wars — the turn and the whole match step by step. Turn.step(dt) moves the world (shots,
// objects, worms, delayed blasts) and runs the turn's phases: intro → play → retreat → settle →
// deaths → the next turn, with the timer, the wind, crates, sudden death, the end of the match and
// the campaign's stars. Control is what a player (game.js) or the computer (sim/ai.js) does with
// the active worm: walk, aim, jump, pick a weapon, a fuse, a target, fire.
//
// match.turn = { team, worm, phase, t, timer, weapon, fuse, power, charging, used, shotsLeft,
//   target, plankAngle, double, lowgrav, hurt, moved, settleT, quiet, dying, ticked, timerStopped, ai }

const Turn = (() => {
  function nextWorm(team) {
    const n = team.worms.length;
    for (let k = 0; k < n; k++) {
      const i = (team.next + k) % n;
      const w = team.worms[i];
      if (w.alive && w.hp > 0) { team.next = i + 1; return w; }
    }
    return null;
  }
  function defaultWeapon(team) {
    for (const id of [team.lastWeapon, 'bazooka', 'grenade', 'shotgun']) if (id && weaponReady(team, id) && WEAPONS[id].kind !== 'power') return id;
    return WEAPON_ORDER.find((id) => weaponReady(team, id) && WEAPONS[id].kind !== 'power') || 'skip';
  }

  function start() {
    const n = match.teams.length;
    let ti = match.turn ? (match.turn.team + 1) % n : match.firstTeam;
    for (let k = 0; k < n && !livingWorms(match.teams[ti]).length; k++) ti = (ti + 1) % n;
    const team = match.teams[ti];
    match.turnCount++;
    match.round = Math.floor((match.turnCount - 1) / n) + 1;
    team.turns++;
    const worm = nextWorm(team);
    match.wind = (Math.random() * 2 - 1) * (WIND_SETTING[match.windSetting] || 0);
    match.turn = {
      team: ti, worm, phase: 'intro', t: 0, timer: match.turnTime, weapon: defaultWeapon(team), fuse: team.fuse || 3,
      power: 0, charging: false, used: false, shotsLeft: null, target: null, plankAngle: 0,
      double: false, lowgrav: false, hurt: false, moved: false, settleT: 0, quiet: 0, dying: null,
      ticked: Math.ceil(match.turnTime), timerStopped: false, ai: null
    };
    worm.aim = worm.aim || 0;
    match.focus = worm;
    if (match.settings.sd && match.round > match.settings.sd && !match.suddenDeath) {
      match.suddenDeath = true;
      GameEvents.emit('suddenDeath', { demo: match.mode === 'demo' });
    }
    GameEvents.emit('turnStart', { team, worm, demo: match.mode === 'demo' });
    if (Math.random() < (CRATE_CHANCE[match.crates] || 0)) Objects.dropCrate();
  }

  // ---------- the phases ----------
  function toSettle() {
    const t = match.turn, w = t.worm;
    t.charging = false;
    if (w.state === 'drill') Weapons.stopDrill(w);
    if (w.state === 'jet') Weapons.stopJet(w);
    t.phase = 'settle'; t.settleT = 0; t.quiet = 0;
  }
  function quiet() {
    if (match.shots.length || match.timers.length) return false;
    if (match.worms.some((w) => w.alive && (!w.grounded || w.state !== 'idle'))) return false;
    return Objects.quiet();
  }
  function drown(w) {
    w.alive = false; w.hp = 0; w.drowned = true; w.state = 'idle';
    GameEvents.emit('drown', { worm: w, demo: match.mode === 'demo' });
    if (match.turn && w === match.turn.worm) match.turn.hurt = true;
  }

  function finishTurn() {
    if (match.suddenDeath) {
      match.water -= SD_RISE;
      GameEvents.emit('waterRise', { demo: match.mode === 'demo' });
      for (const w of match.worms) if (w.alive && wormCenterY(w) > match.water) drown(w);
      for (const o of match.objects.slice()) if (o.y - o.r > match.water) Objects.remove(o);
    }
    const res = outcome();
    if (res) { end(res); return; }
    start();
  }

  // the match's end, or null when it goes on
  function outcome() {
    const alive = match.teams.map((t) => livingWorms(t).length > 0);
    const g = match.goal;
    if (g && g.type === 'targets') {
      if (match.targetsLeft === 0) return { winner: 0 };
      if (!alive[0] || match.teams[0].turns >= g.turns) return { winner: 1, reason: 'turns' };
      return null;
    }
    if (g && g.type === 'crate') {
      if (match.goldTaken) return { winner: 0 };
      if (!alive[0] || match.goldLost) return { winner: 1 };
      if (match.teams[0].turns >= g.turns && match.turn.team === match.teams.length - 1) return { winner: 1, reason: 'turns' };
      return null;
    }
    const left = alive.map((a, i) => (a ? i : -1)).filter((i) => i >= 0);
    if (left.length > 1) return null;
    return { winner: left.length ? left[0] : -1 };
  }

  function end(res) {
    match.over = true;
    const g = match.goal, me = match.teams[0];
    let stars = 0;
    if (match.mode === 'campaign' && res.winner === 0) {
      if (!g || g.type === 'defeat') {
        const share = teamHealth(me) / me.startHp;
        stars = share >= STAR_HEALTH[1] ? 3 : share >= STAR_HEALTH[0] ? 2 : 1;
      } else {
        stars = me.turns <= g.par ? 3 : me.turns <= g.par + 2 ? 2 : 1;
      }
    }
    match.result = Object.assign({ stars }, res);
    match.turn.phase = 'over';
    GameEvents.emit('matchOver', { result: match.result, demo: match.mode === 'demo' });
  }

  function phases(dt) {
    const t = match.turn, w = t.worm;
    t.t += dt;
    switch (t.phase) {
      case 'intro':
        if (t.t >= TURN_INTRO) { t.phase = 'play'; t.t = 0; }
        break;
      case 'play':
        if (!t.timerStopped) t.timer -= dt;
        if (t.timer <= TICK_FROM && Math.ceil(t.timer) < t.ticked && t.timer > 0) {
          t.ticked = Math.ceil(t.timer);
          GameEvents.emit('tick', { left: t.ticked, demo: match.mode === 'demo' });
        }
        if (t.charging) {
          t.power = Math.min(1, t.power + dt / CHARGE_TIME);
          if (t.power >= 1) Control.fireUp();
        }
        if (match.teams[t.team].cpu && t.phase === 'play') Ai.update(dt);
        if (t.phase === 'play' && (t.timer <= 0 || t.hurt || !w.alive)) toSettle();
        break;
      case 'retreat':
        t.timer -= dt;
        if (t.timer <= 0 || t.hurt || !w.alive) toSettle();
        break;
      case 'settle':
        t.settleT += dt;
        t.quiet = quiet() ? t.quiet + dt : 0;
        if (t.quiet >= SETTLE_QUIET || t.settleT > SETTLE_MAX) { t.phase = 'deaths'; t.dying = null; t.t = 0; }
        break;
      case 'deaths': {
        if (!t.dying) {
          t.dying = match.worms.find((q) => q.alive && q.hp <= 0) || null;
          t.t = 0;
          if (!t.dying) { finishTurn(); break; }
          match.focus = t.dying;
        }
        if (t.t >= DEATH_DELAY) {
          const d = t.dying;
          d.alive = false; d.state = 'idle';
          GameEvents.emit('death', { worm: d, demo: match.mode === 'demo' });
          Objects.add('grave', d.x, d.y, { color: match.teams[d.team].color });
          Weapons.explode(d.x, d.y - WORM_R, DEATH_BLAST.r, DEATH_BLAST.dmg, {});
          t.dying = null;
          t.phase = 'settle'; t.settleT = 0; t.quiet = 0;
        }
        break;
      }
    }
  }

  // one fixed step of the whole match
  function step(dt) {
    Weapons.updateShots(dt);
    Objects.update(dt);
    const g = gravityNow();
    for (const w of match.worms) {
      if (!w.alive) continue;
      if (w.state === 'drill') { Weapons.updateTools(w, dt); continue; }
      if (w.state === 'jet') Weapons.updateTools(w, dt);
      const r = Physics.update(w, dt, g);
      if (r === 'land') {
        if (w.state === 'jet' && w.air > 0.25) Weapons.stopJet(w);
        if (w.impact > FALL_SAFE) {
          Weapons.hurt(w, (w.impact - FALL_SAFE) * FALL_DMG, {});
          GameEvents.emit('land', { worm: w, hard: true, demo: match.mode === 'demo' });
        } else if (w.impact > 120) GameEvents.emit('land', { worm: w, hard: false, demo: match.mode === 'demo' });
        w.thrown = false;
      } else if (r === 'water') drown(w);
      if (w.state === 'jet' && w.jet.fuel <= 0 && w.grounded) Weapons.stopJet(w);
    }
    for (let i = match.timers.length - 1; i >= 0; i--) {
      const tm = match.timers[i];
      tm.t -= dt;
      if (tm.t <= 0) { match.timers.splice(i, 1); Weapons.explode(tm.x, tm.y, tm.r, tm.dmg, tm.src); }
    }
    if (!match.decided) {
      const standing = match.teams.filter((tm) => livingWorms(tm).length > 0).length;
      if (match.teams.length > 1 && standing <= 1 && (!match.goal || match.goal.type === 'defeat')) {
        match.decided = true;
        match.slowmo = SLOWMO_TIME;
      }
    }
    if (match.turn && !match.over) phases(dt);
  }

  return { start, step, toSettle, quiet, defaultWeapon, end };
})();

// ---------- what a player does with the active worm ----------
const Control = {
  ready() {
    const t = match && match.turn;
    return !!(t && !match.over && (t.phase === 'play' || t.phase === 'retreat') && t.worm.alive && t.worm.hp > 0);
  },
  playing() { return this.ready() && match.turn.phase === 'play'; },
  canFire() {
    const t = match.turn;
    return this.playing() && !t.used && t.worm.state === 'idle';
  },
  walk(dir, dt) {
    if (!this.ready()) return;
    const t = match.turn, w = t.worm;
    if (w.state !== 'idle' || t.charging) return;
    if (!w.grounded) return;
    if (w.facing !== dir) { w.facing = dir; t.moved = true; }
    if (Physics.walk(w, dir, dt)) {
      t.moved = true;
      if (!w.walkSound || w.walkSound < 0) { w.walkSound = 0.22; GameEvents.emit('step', { demo: match.mode === 'demo' }); }
      w.walkSound -= dt;
    }
  },
  aim(delta) {
    if (!this.ready()) return;
    const t = match.turn;
    if (WEAPONS[t.weapon].kind === 'plank' && t.phase === 'play') t.plankAngle = ((t.plankAngle + delta) % 360 + 360) % 360;
    else t.worm.aim = clamp(t.worm.aim + delta, AIM_MIN, AIM_MAX);
  },
  jump(back) {
    if (!this.ready()) return;
    const t = match.turn, w = t.worm;
    if (w.state !== 'idle' || t.charging) return;
    if (Physics.jump(w, back)) { t.moved = true; GameEvents.emit('jump', { back, demo: match.mode === 'demo' }); }
  },
  select(id) {
    if (!this.canFire() || match.turn.charging || match.turn.shotsLeft !== null) return false;
    const team = activeTeam();
    if (!weaponReady(team, id)) return false;
    match.turn.weapon = id;
    match.turn.target = null;
    GameEvents.emit('select', { weapon: id, demo: match.mode === 'demo' });
    return true;
  },
  setFuse(s) {
    if (!this.ready()) return;
    match.turn.fuse = clamp(Math.round(s), 1, 5);
    activeTeam().fuse = match.turn.fuse;
  },
  setTarget(x, y) {
    if (!this.canFire()) return false;
    const def = WEAPONS[match.turn.weapon];
    if (!def.target) return false;
    match.turn.target = { x, y };
    GameEvents.emit('target', { x, y, demo: match.mode === 'demo' });
    return true;
  },
  fireDown() {
    if (!this.ready()) return;
    const t = match.turn, w = t.worm;
    if (w.state === 'drill') { Weapons.stopDrill(w); return; }
    if (w.state === 'jet' || !this.canFire() || t.charging) return;
    const def = WEAPONS[t.weapon];
    if (!weaponReady(activeTeam(), t.weapon)) return;
    if (def.target && !t.target) { GameEvents.emit('refused', { text: 'Pick a target first: tap or click the map.' }); return; }
    if (def.kind === 'missile' || def.kind === 'grenade') {
      if (!w.grounded) return;
      t.charging = true; t.power = 0;
      GameEvents.emit('charge', { demo: match.mode === 'demo' });
    } else this.useNow(1);
  },
  fireUp() {
    const t = match && match.turn;
    if (!t || !t.charging) return;
    this.useNow(t.power);
  },
  useNow(power) {
    const t = match.turn, w = t.worm, team = activeTeam();
    t.charging = false;
    const id = t.weapon, def = WEAPONS[id];
    if (def.kind !== 'skip' && def.kind !== 'power' && def.kind !== 'jetpack' && !w.grounded && w.state === 'idle') return;
    if (!Weapons.use(w, id, { power })) return;
    const firstShot = def.kind !== 'hitscan' || t.shotsLeft === null;
    if (firstShot && team.ammo[id] > 0) team.ammo[id]--;
    if (def.kind !== 'power' && def.kind !== 'skip' && def.kind !== 'jetpack') team.lastWeapon = id;
    if (def.kind === 'missile' || def.kind === 'grenade') team.lastPower = power;
    t.moved = true;
    if (def.kind === 'hitscan') {
      t.shotsLeft = (t.shotsLeft === null ? def.shots : t.shotsLeft) - 1;
      if (t.shotsLeft > 0) return;
    }
    if (def.keepsTurn) {
      if (!weaponReady(team, t.weapon)) t.weapon = Turn.defaultWeapon(team);
      return;
    }
    if (def.kind === 'skip') { Turn.toSettle(); return; }
    t.used = true;
    t.phase = 'retreat';
    t.timer = def.retreat || RETREAT_TIME;
  },
  jet(up, side) {
    const w = activeWorm();
    if (!w || w.state !== 'jet') return;
    w.jet.up = up; w.jet.side = side;
  }
};
