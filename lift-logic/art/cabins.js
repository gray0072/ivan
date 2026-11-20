'use strict';

// Lift Logic — the lift cabin: its frame in the lift type's colours, the people inside, the sliding doors,
// and the display above with the floor number and the arrow ▲ ▼ (drawn, not a font's glyph). Used by
// render/building.js and the start screen's logo.

Art.cabin = function (ctx, x, y, w, h, L, opts = {}) {
  const look = L.look || LIFT_TYPES.standard;
  // the cabin box
  ctx.fillStyle = look.body;
  roundRect(ctx, x, y, w, h, 3);
  ctx.fill();
  ctx.fillStyle = shade(look.body, -0.35);
  ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
  // the people inside
  const riders = L.riders || [];
  const per = Math.max(3, Math.floor((w - 6) / (h * 0.32)));
  riders.forEach((p, k) => {
    if (opts.hide && opts.hide.has(p.id)) return; // still walking in (render/walkers.js)
    const col = k % per, row = Math.floor(k / per);
    const px = x + 6 + (col + 0.5) * ((w - 12) / per) + (row % 2) * 3;
    Art.person(ctx, px, y + h - 3 - row * h * 0.12, h * 0.62, p, { grey: opts.grey, mood: 0 });
  });
  // the doors
  const open = clamp(L.doors || 0, 0, 1);
  const dw = (w - 6) / 2 * (1 - open);
  // glass doors: the people inside show through
  ctx.fillStyle = look.doors;
  ctx.globalAlpha = 0.55;
  ctx.fillRect(x + 3, y + 3, dw, h - 6);
  ctx.fillRect(x + w - 3 - dw, y + 3, dw, h - 6);
  ctx.globalAlpha = 1;
  if (dw > 1) {
    ctx.strokeStyle = shade(look.doors, -0.25);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 3 + dw, y + 4); ctx.lineTo(x + 3 + dw, y + h - 4);
    ctx.moveTo(x + w - 3 - dw, y + 4); ctx.lineTo(x + w - 3 - dw, y + h - 4);
    ctx.stroke();
  }
  ctx.strokeStyle = look.trim;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 3);
  ctx.stroke();
};

// the display: floor number and arrow on a dark panel
Art.display = function (ctx, cx, y, label, arrow, size, letter) {
  const w = size * 2.4, h = size * 1.15;
  ctx.fillStyle = '#16212e';
  roundRect(ctx, cx - w / 2, y - h, w, h, 3);
  ctx.fill();
  ctx.fillStyle = '#ffb547';
  ctx.font = 'bold ' + Math.round(size * 0.82) + 'px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(label), cx + size * 0.35, y - h / 2 + 1);
  if (arrow === 'up' || arrow === 'down') Art.triangle(ctx, cx - size * 0.62, y - h / 2, size * 0.32, arrow === 'up', '#7CFC9A');
  if (letter) {
    ctx.fillStyle = '#9fb0c3';
    ctx.font = 'bold ' + Math.round(size * 0.55) + 'px "Segoe UI", Arial, sans-serif';
    ctx.fillText(letter, cx, y - h - size * 0.4);
  }
};

Art.triangle = function (ctx, cx, cy, r, up, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  if (up) { ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy + r * 0.7); ctx.lineTo(cx - r, cy + r * 0.7); }
  else { ctx.moveTo(cx, cy + r); ctx.lineTo(cx + r, cy - r * 0.7); ctx.lineTo(cx - r, cy - r * 0.7); }
  ctx.closePath();
  ctx.fill();
};

// the call buttons ▲ ▼ of a landing (lit when pressed)
Art.callButtons = function (ctx, x, y, r, up, down, hasUp, hasDown, emergency) {
  ctx.fillStyle = '#c9d3dd';
  roundRect(ctx, x - r * 1.3, y - r * 2.6, r * 2.6, r * 5.2, r * 0.6);
  ctx.fill();
  if (hasUp) { ctx.fillStyle = up ? '#ffcf3f' : '#ffffff'; ctx.beginPath(); ctx.arc(x, y - r * 1.2, r, 0, Math.PI * 2); ctx.fill(); Art.triangle(ctx, x, y - r * 1.2, r * 0.5, true, up ? '#8a5a00' : '#7a8794'); }
  if (hasDown) { ctx.fillStyle = down ? '#ffcf3f' : '#ffffff'; ctx.beginPath(); ctx.arc(x, y + r * 1.2, r, 0, Math.PI * 2); ctx.fill(); Art.triangle(ctx, x, y + r * 1.2, r * 0.5, false, down ? '#8a5a00' : '#7a8794'); }
  if (emergency) { ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.arc(x + r * 2.1, y, r * 0.8, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(x + r * 2.1 - r * 0.15, y - r * 0.5, r * 0.3, r); ctx.fillRect(x + r * 2.1 - r * 0.5, y - r * 0.15, r, r * 0.3); }
};
