'use strict';

// Lift Logic — the people, drawn in code: a round head with a face whose mood goes 🙂 → 😐 → 😟 → 😠 as they
// wait, a body in the character's colour, a smaller figure for kids, and what they carry (a box, a suitcase,
// a bed, a pizza, a cat…). Grey and faceless in the Lift's eyes. Used by render/building.js and the screens.

const Art = {};

Art.person = function (ctx, x, y, h, p, opts = {}) {
  const c = PEOPLE[p.who] || PEOPLE.neighbour;
  const look = c.look;
  const kid = look.kid;
  const s = h * (kid ? 0.78 : 1);
  const grey = opts.grey;
  const body = grey ? '#9aa3ad' : look.body, hair = grey ? '#7d858e' : look.hair;
  ctx.save();
  ctx.translate(x, y);
  if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
  const r = s * 0.17;            // head radius
  const bw = s * 0.34, bh = s * 0.42;
  // legs
  ctx.fillStyle = grey ? '#6b7480' : '#3b4252';
  const step = opts.walk ? Math.sin(opts.walk) * s * 0.05 : 0;
  ctx.fillRect(-bw * 0.36 + step, -s * 0.24, bw * 0.28, s * 0.24);
  ctx.fillRect(bw * 0.08 - step, -s * 0.24, bw * 0.28, s * 0.24);
  // body
  ctx.fillStyle = body;
  roundRect(ctx, -bw / 2, -s * 0.24 - bh, bw, bh, bw * 0.35);
  ctx.fill();
  // head
  const hy = -s * 0.24 - bh - r * 0.9;
  ctx.fillStyle = grey ? '#b7bec6' : '#f2c9a0';
  ctx.beginPath(); ctx.arc(0, hy, r, 0, Math.PI * 2); ctx.fill();
  // hair
  ctx.fillStyle = hair;
  ctx.beginPath(); ctx.arc(0, hy - r * 0.15, r * 1.02, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
  if (!grey) Art.face(ctx, 0, hy, r, opts.mood || 0);
  // what they carry
  if (look.item) Art.item(ctx, look.item, bw * 0.55, -s * 0.3, s, grey);
  ctx.restore();
};

// the face: 0 happy … 3 angry (red cheeks, frown, eyebrows)
Art.face = function (ctx, x, y, r, mood) {
  if (mood >= 3) { ctx.fillStyle = 'rgba(230,60,40,0.55)'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = '#2b2b2b';
  const ey = y - r * 0.08;
  ctx.beginPath(); ctx.arc(x - r * 0.36, ey, r * 0.11, 0, Math.PI * 2); ctx.arc(x + r * 0.36, ey, r * 0.11, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#2b2b2b';
  ctx.lineWidth = Math.max(1, r * 0.13);
  ctx.lineCap = 'round';
  ctx.beginPath();
  const my = y + r * 0.42;
  if (mood === 0) ctx.arc(x, my - r * 0.25, r * 0.32, Math.PI * 0.2, Math.PI * 0.8);
  else if (mood === 1) { ctx.moveTo(x - r * 0.28, my); ctx.lineTo(x + r * 0.28, my); }
  else ctx.arc(x, my + r * 0.18, r * 0.3, Math.PI * 1.2, Math.PI * 1.8);
  ctx.stroke();
  if (mood >= 2) {
    ctx.beginPath();
    const k = mood >= 3 ? 1 : -1;
    ctx.moveTo(x - r * 0.55, ey - r * 0.32 - k * r * 0.1); ctx.lineTo(x - r * 0.18, ey - r * 0.3 + k * r * 0.1);
    ctx.moveTo(x + r * 0.55, ey - r * 0.32 - k * r * 0.1); ctx.lineTo(x + r * 0.18, ey - r * 0.3 + k * r * 0.1);
    ctx.stroke();
  }
};

Art.item = function (ctx, item, x, y, s, grey) {
  const g = (c) => (grey ? '#8d959e' : c);
  ctx.save();
  ctx.translate(x, y);
  switch (item) {
    case 'box': ctx.fillStyle = g('#c8955a'); ctx.fillRect(-s * 0.05, -s * 0.22, s * 0.3, s * 0.24); ctx.strokeStyle = g('#8a5f2f'); ctx.lineWidth = 1; ctx.strokeRect(-s * 0.05, -s * 0.22, s * 0.3, s * 0.24); break;
    case 'suitcase': ctx.fillStyle = g('#7b3f9e'); roundRect(ctx, 0, -s * 0.05, s * 0.22, s * 0.3, 3); ctx.fill(); ctx.fillStyle = g('#333'); ctx.fillRect(s * 0.07, -s * 0.1, s * 0.08, s * 0.05); break;
    case 'bed': ctx.fillStyle = g('#ffffff'); ctx.fillRect(-s * 0.1, 0, s * 0.9, s * 0.12); ctx.fillStyle = g('#7fb8d6'); ctx.fillRect(s * 0.25, -s * 0.04, s * 0.5, s * 0.08); ctx.fillStyle = g('#888'); ctx.fillRect(-s * 0.08, s * 0.12, s * 0.04, s * 0.12); ctx.fillRect(s * 0.74, s * 0.12, s * 0.04, s * 0.12); break;
    case 'cart': ctx.strokeStyle = g('#555'); ctx.lineWidth = 2; ctx.strokeRect(0, -s * 0.05, s * 0.3, s * 0.22); ctx.fillStyle = g('#4aa3df'); ctx.fillRect(s * 0.02, -s * 0.02, s * 0.26, s * 0.08); break;
    case 'pizza': ctx.fillStyle = g('#e8b04a'); ctx.fillRect(-s * 0.02, -s * 0.12, s * 0.32, s * 0.05); ctx.fillStyle = g('#c0392b'); ctx.fillRect(s * 0.02, -s * 0.12, s * 0.24, s * 0.02); break;
    case 'bag': ctx.fillStyle = g('#8d6e45'); roundRect(ctx, -s * 0.02, -s * 0.12, s * 0.18, s * 0.16, 3); ctx.fill(); break;
    case 'cat': ctx.fillStyle = g('#e08a3c'); ctx.beginPath(); ctx.ellipse(s * 0.08, -s * 0.1, s * 0.11, s * 0.07, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(s * 0.18, -s * 0.16, s * 0.05, 0, Math.PI * 2); ctx.fill(); break;
    case 'cake': ctx.fillStyle = g('#fff3e0'); ctx.fillRect(-s * 0.02, -s * 0.3, s * 0.24, s * 0.12); ctx.fillRect(s * 0.02, -s * 0.4, s * 0.16, s * 0.1); ctx.fillStyle = g('#e91e63'); ctx.fillRect(s * 0.08, -s * 0.46, s * 0.04, s * 0.06); break;
    case 'flowers': ctx.fillStyle = g('#4caf50'); ctx.fillRect(s * 0.04, -s * 0.15, s * 0.03, s * 0.16); ctx.fillStyle = g('#ff4081'); ctx.beginPath(); ctx.arc(s * 0.055, -s * 0.18, s * 0.06, 0, Math.PI * 2); ctx.fill(); break;
    case 'case': ctx.fillStyle = g('#4e342e'); ctx.fillRect(0, -s * 0.02, s * 0.2, s * 0.14); break;
    case 'clipboard': ctx.fillStyle = g('#a1887f'); ctx.fillRect(-s * 0.02, -s * 0.16, s * 0.14, s * 0.18); ctx.fillStyle = g('#fff'); ctx.fillRect(0, -s * 0.13, s * 0.1, s * 0.12); break;
  }
  ctx.restore();
};

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// a portrait of a character for the mission card and the screens (a canvas of the given size)
Art.portrait = function (canvas, who, mood = 0) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const c = PEOPLE[who] || PEOPLE.neighbour;
  ctx.fillStyle = shade(c.look.body, 0.75);
  ctx.beginPath(); ctx.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2); ctx.fill();
  ctx.save();
  ctx.beginPath(); ctx.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2); ctx.clip();
  Art.person(ctx, w / 2, h * 1.18, h * 1.25, { who }, { mood });
  ctx.restore();
};
