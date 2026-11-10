'use strict';

// Wiggle Wars — the arsenal: a panel with a cell per weapon the active team has (its picture,
// name and ammo; greyed with "in N rounds" while it is not ready yet), Skip turn last. A tap or a
// click picks the weapon and closes it; the description of the hovered or current weapon shows
// under the grid. Opened by the weapon button, Q / W / Tab or the right mouse button (game.js).

const Arsenal = (() => {
  const panel = document.getElementById('arsenal');
  const grid = document.getElementById('arsenalGrid');
  const desc = document.getElementById('arsenalDesc');

  function isOpen() { return !panel.hidden; }
  function close() { panel.hidden = true; }
  function open() {
    if (!Control.canFire() || match.teams[match.turn.team].cpu) return;
    render();
    panel.hidden = false;
  }
  function toggle() { if (isOpen()) close(); else open(); }

  function render() {
    const team = activeTeam(), t = match.turn;
    grid.innerHTML = '';
    for (const id of WEAPON_ORDER) {
      const def = WEAPONS[id];
      const n = team.ammo[id];
      if (!def.always && !n) continue;
      const ready = weaponReady(team, id);
      const b = document.createElement('button');
      b.className = 'wCell' + (ready ? '' : ' wait') + (t.weapon === id ? ' on' : '');
      b.appendChild(WeaponArt.icon(id, 36));
      const name = document.createElement('span');
      name.className = 'wn';
      name.textContent = tr(def.name);
      b.appendChild(name);
      const am = document.createElement('span');
      am.className = 'wa';
      am.textContent = ready ? (n === -1 || def.always ? '∞' : '×' + n) : tr('in {n}', { n: weaponWaits(team, id) });
      b.appendChild(am);
      b.title = tr(def.desc);
      b.addEventListener('mouseenter', () => { desc.textContent = tr(def.desc); });
      b.addEventListener('click', () => {
        if (!ready) { desc.textContent = tr('Ready in {n} rounds.', { n: weaponWaits(team, id) }); return; }
        if (Control.select(id)) close();
      });
      grid.appendChild(b);
    }
    desc.textContent = tr(WEAPONS[t.weapon].desc);
  }

  document.getElementById('arsenalClose').addEventListener('click', close);
  return { open, close, toggle, isOpen };
})();
