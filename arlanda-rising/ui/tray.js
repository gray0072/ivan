'use strict';

// Arlanda Rising — the task tray on the left (SPEC.md "Hands: the task tray"): one card per task with its icon,
// its line and a ring that runs out at its deadline. A tap on a card does the obvious thing; a stand task can also
// be dragged onto a stand on the map, or opened with "Pick" (then the stands light up: green where the aircraft
// fits and is free, red where it does not) and a tap on a stand chooses it. Used by game.js every frame.

const Tray = (() => {
  const box = document.getElementById('tray');
  let ids = '';
  let drag = null;   // { task, el, ghost, x0, y0, moved }

  function render() {
    if (!S || !S.ops) { box.hidden = true; ids = ''; return; }
    box.hidden = false;
    const tasks = S.ops.tasks;
    const key = tasks.map((k) => k.id).join(',') + '|' + (Game.pick || '');
    // never rebuilt under a finger that drags a card
    if (key !== ids && !drag) {
      ids = key;
      box.innerHTML = tasks.map((k) => {
        const f = Flights.get(k.target);
        const logo = f ? '<img class="logo" alt="" src="' + Emblems.url(f.al, Calendar.year()) + '">' : '<span class="ticon">' + Text.taskIcon(k.kind) + '</span>';
        const pick = k.kind === 'stand' ? '<button class="pick' + (Game.pick === k.target ? ' on' : '') + '" data-pick="' + k.target + '">' + Text.esc(tr('Pick')) + '</button>' : '';
        return '<div class="task" data-id="' + k.id + '" data-kind="' + k.kind + '">' +
          '<svg class="ring" viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.5"/><circle class="left" cx="18" cy="18" r="15.5"/></svg>' + logo +
          '<span class="tt"></span>' + pick + '</div>';
      }).join('') + (tasks.length ? '' : '<div class="trayEmpty">' + Text.esc(tr('No tasks right now')) + '</div>');
    }
    // the lines and the rings, every frame
    for (const k of tasks) {
      const el = box.querySelector('.task[data-id="' + k.id + '"]');
      if (!el) continue;
      const left = clamp((k.due - S.clock) / (k.due - k.t0), 0, 1);
      el.querySelector('.left').style.strokeDashoffset = String(97.4 * (1 - left));
      el.classList.toggle('late', left < 0.3);
      const t = Text.task(k);
      const tt = el.querySelector('.tt');
      if (tt.textContent !== t) tt.textContent = t;
    }
  }

  // taps and drags on the cards
  box.addEventListener('pointerdown', (e) => {
    const card = e.target.closest('.task');
    if (!card || e.target.closest('.pick')) return;
    const task = S.ops.tasks.find((k) => k.id === +card.dataset.id);
    if (!task) return;
    drag = { task, el: card, x0: e.clientX, y0: e.clientY, moved: false, ghost: null };
    try { box.setPointerCapture(e.pointerId); } catch (err) { /* gone */ }
  });
  box.addEventListener('pointermove', (e) => {
    if (!drag) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > TAP_SLOP && drag.task.kind === 'stand') {
      drag.moved = true;
      Game.pick = drag.task.target;
      drag.ghost = drag.el.cloneNode(true);
      drag.ghost.classList.add('ghost');
      document.body.appendChild(drag.ghost);
    }
    if (drag.ghost) { drag.ghost.style.left = (e.clientX - 30) + 'px'; drag.ghost.style.top = (e.clientY - 22) + 'px'; }
  });
  const end = (e, cancel) => {
    if (!drag) return;
    const d = drag;
    drag = null;
    if (d.ghost) {
      d.ghost.remove();
      const h = !cancel && MapView.hit(e.clientX, e.clientY);
      if (h && h.stand) Game.standPicked(d.task.target, h.stand);
      else Game.pick = null;
      return;
    }
    if (!cancel) Game.doTask(d.task.id);
  };
  box.addEventListener('pointerup', (e) => end(e, false));
  box.addEventListener('pointercancel', (e) => end(e, true));
  box.addEventListener('click', (e) => {
    const p = e.target.closest('.pick');
    if (p) Game.pick = Game.pick === p.dataset.pick ? null : p.dataset.pick;
  });

  return { render, reset() { ids = ''; } };
})();
