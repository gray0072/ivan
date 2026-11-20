'use strict';

// Lift Logic — the minimap of a tall building: a strip at the right edge of the building view, shown only
// when the building doesn't fit. A tick per floor with a lit call (red when the call has waited long, a red
// blink for an emergency), a dot per lift (grey when out of order), and a frame around the part on screen.
// A tap on the strip scrolls the view there. Drawn by render/building.js, tapped through render/view.js.

const Minimap = (() => {
  const W = 16;          // px wide
  const LONG_WAIT = 30;  // s a call has waited before its tick turns red
  const COLORS = ['#ffb547', '#7fd1ff', '#9be37a', '#ff8ad8', '#c9a3ff', '#ffe082', '#80cbc4', '#ef9a9a'];
  let box = null;

  function draw(g) {
    box = null;
    if (!run || g.totalH <= g.view + 1) return;
    const { ctx, st } = View;
    const x = st.w - W - 4, top = g.top, h = g.view;
    box = { x, top, h, n: g.n };
    ctx.fillStyle = 'rgba(10,20,35,0.6)';
    roundRect(ctx, x, top, W, h, 6); ctx.fill();
    const fy = (i) => top + h - (i + 0.5) * h / g.n;
    // the part of the building on screen
    const lo = clamp((g.baseY - (st.h - g.ground)) / g.fh, 0, g.n), hi = clamp((g.baseY - g.top) / g.fh, 0, g.n);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5;
    roundRect(ctx, x + 1, top + h - hi * h / g.n, W - 2, Math.max(4, (hi - lo) * h / g.n), 3); ctx.stroke();
    // the calls
    const blink = Math.floor(performance.now() / 300) % 2 === 0;
    for (let i = 0; i < g.n; i++) {
      const c = run.hall[i];
      if (!c.up && !c.down && !c.emergency) continue;
      const long = Building.waitingTime(i, 'any') > LONG_WAIT;
      ctx.fillStyle = c.emergency ? (blink ? '#ff1744' : '#ffffff') : long ? '#ff5252' : '#ffd23f';
      ctx.fillRect(x + 2, fy(i) - 1.5, 5, 3);
    }
    // the lifts
    for (const L of run.lifts) {
      ctx.fillStyle = L.working ? COLORS[(L.n - 1) % COLORS.length] : '#7c8a99';
      ctx.beginPath(); ctx.arc(x + W - 5, top + h - (L.pos + 0.5) * h / g.n, 3, 0, Math.PI * 2); ctx.fill();
    }
  }

  // a tap on the strip: the floor there is brought to the middle of the view
  function tap(x, y, g) {
    if (!box || x < box.x - 6 || y < box.top || y > box.top + box.h) return false;
    const i = clamp(Math.floor((box.top + box.h - y) / box.h * box.n), 0, box.n - 1);
    View.st.manual = true;
    View.st.camY = i * g.fh + g.fh / 2 - g.view / 2;
    return true;
  }

  return { draw, tap };
})();
