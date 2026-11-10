'use strict';

// Wiggle Wars — what sits over the game while it is played: the turn timer with the worm's name,
// the wind gauge, the campaign's goal, the teams' health bars, the banner, the weapon and fuse
// buttons and, on touch screens, Fire / Jump / Back flip. Updated every frame by game.js; the
// buttons call Control and the arsenal.

const Hud = (() => {
  const $ = (id) => document.getElementById(id);
  const hud = $('hud'), bars = $('teamBars'), controls = $('controls'), touchBtns = $('touchBtns');
  const banner = $('banner');
  let bannerTimer = 0, barsFor = null, weaponShown = null, last = {};
  const held = { fire: false };

  function show(on) {
    hud.hidden = !on; bars.hidden = !on; controls.hidden = !on;
    touchBtns.hidden = !(on && isCoarsePointer);
    if (!on) { banner.style.opacity = 0; held.fire = false; }
  }

  function say(text, ms = 2200) {
    banner.textContent = text;
    banner.style.opacity = 1;
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => { banner.style.opacity = 0; }, ms);
  }

  function set(el, key, value, prop = 'textContent') {
    if (last[key] === value) return;
    last[key] = value;
    el[prop] = value;
  }

  function buildBars() {
    barsFor = match;
    bars.innerHTML = match.teams.map((t, i) => {
      const c = teamColor(t.color);
      return '<div class="tBar" data-team="' + i + '"><span class="tName" style="color:' + c.light + '"></span>' +
        '<div class="tTrack"><div class="tFill" style="background:' + c.main + '"></div></div><b class="tHp"></b></div>';
    }).join('');
    bars.querySelectorAll('.tName').forEach((el, i) => { el.textContent = match.teams[i].name; });
    last = {};
  }

  function goalText() {
    const g = match.goal;
    if (!g || match.mode !== 'campaign') return '';
    const turnPart = g.turns ? ' · ' + tr('Turn {n} / {max}', { n: Math.min(match.teams[0].turns, g.turns), max: g.turns }) : '';
    if (g.type === 'targets') return '🎯 ' + tr('Targets {n} / {max}', { n: g.count - match.targetsLeft, max: g.count }) + turnPart;
    if (g.type === 'crate') return '📦 ' + tr('Get the golden crate') + turnPart;
    return '';
  }

  function update() {
    if (!match || hud.hidden) return;
    if (barsFor !== match) buildBars();
    const t = match.turn, team = t ? match.teams[t.team] : null;
    const col = team ? teamColor(team.color) : null;
    // the timer
    const n = t && (t.phase === 'play' || t.phase === 'retreat') ? Math.max(0, Math.ceil(t.timer)) : '';
    set($('timerNum'), 'timer', String(t && t.timerStopped && t.phase === 'play' ? '∞' : n));
    set($('timer'), 'timerCls', 'timer' + (t && t.phase === 'retreat' ? ' retreat' : '') + (t && t.phase === 'play' && t.timer <= TICK_FROM ? ' hurry' : ''), 'className');
    $('timer').style.borderColor = col ? col.main : '';
    set($('timerWho'), 'who', t ? (team.cpu ? '🤖 ' : '') + t.worm.name : '');
    // the wind
    const wv = match.wind * (match.windMul || 1);
    const w = Math.round(Math.min(1, Math.abs(wv) / 1.8) * 100);
    $('windL').style.width = wv < 0 ? w / 2 + '%' : '0%';
    $('windR').style.width = wv > 0 ? w / 2 + '%' : '0%';
    const arrows = Math.abs(wv) < 0.05 ? '—' : (wv < 0 ? '←' : '→').repeat(Math.max(1, Math.min(3, Math.ceil(Math.abs(wv) / 0.6))));
    set($('windText'), 'windText', arrows);
    // the goal
    const g = goalText();
    $('goal').hidden = !g;
    set($('goal'), 'goal', g);
    // the teams
    match.teams.forEach((tm, i) => {
      const hp = teamHealth(tm), share = tm.startHp ? Math.min(1, hp / tm.startHp) : 0;
      const row = bars.children[i];
      if (!row) return;
      row.querySelector('.tFill').style.width = Math.round(share * 100) + '%';
      set(row.querySelector('.tHp'), 'th' + i, String(hp));
      row.classList.toggle('on', !!t && t.team === i);
    });
    // the controls
    const mine = !!(t && !team.cpu && Control.ready());
    controls.classList.toggle('off', !mine);
    const id = t ? t.weapon : null;
    if (id && (id !== weaponShown || last.ammoTeam !== team)) {
      weaponShown = id; last.ammoTeam = team;
      const box = controls.querySelector('.wIcon');
      box.innerHTML = '';
      box.appendChild(WeaponArt.icon(id, 30));
    }
    if (id) {
      controls.querySelector('.wName').textContent = tr(WEAPONS[id].name);
      const a = team.ammo[id];
      controls.querySelector('.wAmmo').textContent = a === -1 || WEAPONS[id].always ? '∞' : '×' + a;
    }
    const fuse = id && WEAPONS[id].fuse;
    $('fuseBtn').hidden = !fuse;
    if (fuse) set($('fuseBtn'), 'fuse', tr('{n} s', { n: t.fuse }));
    const jet = t && t.worm.state === 'jet';
    set($('fireBtn'), 'fireText', jet ? tr('Up') : t && t.worm.state === 'drill' ? tr('Stop') : tr('Fire'));
  }

  // ---------- the buttons ----------
  function press(el, down, up) {
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); ensureAudio(); el.classList.add('down'); down(); });
    const off = (e) => { if (!el.classList.contains('down')) return; el.classList.remove('down'); if (up) up(e); };
    el.addEventListener('pointerup', off);
    el.addEventListener('pointercancel', off);
    el.addEventListener('pointerleave', off);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  press($('fireBtn'), () => { held.fire = true; Control.fireDown(); }, () => { held.fire = false; Control.fireUp(); });
  press($('jumpBtn'), () => Control.jump(false));
  press($('flipBtn'), () => Control.jump(true));
  $('weaponBtn').addEventListener('click', () => { ensureAudio(); Arsenal.toggle(); });
  $('fuseBtn').addEventListener('click', () => { if (match && match.turn) Control.setFuse(match.turn.fuse % 5 + 1); });

  return { show, say, update, held };
})();
