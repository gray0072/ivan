'use strict';

// Wiggle Wars — the pictures of the weapons and tools, drawn on a canvas in a box of −1 … 1
// (scaled by the caller): used by the arsenal, the weapon button and, rotated along the aim, in
// a worm's hands (render/render.js). All plain shapes, no image files.

const WeaponArt = (() => {
  function rr(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function line(c, w) { c.lineWidth = w; c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = '#1b2430'; }

  const DRAW = {
    bazooka(c) {
      line(c, 0.09);
      c.fillStyle = '#5f7f3a'; rr(c, -0.95, -0.22, 1.7, 0.44, 0.1); c.fill(); c.stroke();
      c.fillStyle = '#3f5a24'; rr(c, 0.62, -0.3, 0.3, 0.6, 0.08); c.fill(); c.stroke();
      c.fillStyle = '#2b2f36'; rr(c, -0.35, 0.18, 0.18, 0.42, 0.05); c.fill(); c.stroke();
      c.fillStyle = '#e6c84a'; c.fillRect(-0.6, -0.22, 0.12, 0.44);
    },
    homing(c) {
      line(c, 0.09);
      c.fillStyle = '#e9edf2';
      c.beginPath(); c.moveTo(0.95, 0); c.lineTo(0.5, -0.24); c.lineTo(-0.7, -0.24); c.lineTo(-0.7, 0.24); c.lineTo(0.5, 0.24); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#e5534b';
      c.beginPath(); c.moveTo(-0.7, -0.24); c.lineTo(-0.95, -0.55); c.lineTo(-0.45, -0.24); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(-0.7, 0.24); c.lineTo(-0.95, 0.55); c.lineTo(-0.45, 0.24); c.fill(); c.stroke();
      c.strokeStyle = '#e5534b'; c.lineWidth = 0.08;
      c.beginPath(); c.arc(0.15, 0, 0.14, 0, Math.PI * 2); c.stroke();
    },
    grenade(c, color = '#5d8a35') {
      line(c, 0.09);
      c.fillStyle = color;
      c.beginPath(); c.ellipse(0, 0.12, 0.58, 0.7, 0, 0, Math.PI * 2); c.fill(); c.stroke();
      c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 0.07;
      c.beginPath(); c.moveTo(-0.55, 0.1); c.lineTo(0.55, 0.1); c.moveTo(0, -0.55); c.lineTo(0, 0.8); c.stroke();
      line(c, 0.09);
      c.fillStyle = '#9aa5b1'; rr(c, -0.22, -0.82, 0.44, 0.3, 0.06); c.fill(); c.stroke();
      c.strokeStyle = '#d8b13a'; c.lineWidth = 0.09;
      c.beginPath(); c.arc(0.4, -0.72, 0.18, 0, Math.PI * 2); c.stroke();
    },
    cluster(c) {
      DRAW.grenade(c, '#c8452f');
      c.fillStyle = '#ffd54f';
      for (const [x, y] of [[-0.25, 0.25], [0.2, 0.4], [0.05, -0.1], [-0.1, 0.62], [0.32, 0.0]]) { c.beginPath(); c.arc(x, y, 0.09, 0, Math.PI * 2); c.fill(); }
    },
    shotgun(c) {
      line(c, 0.08);
      c.fillStyle = '#8a5a32'; c.beginPath(); c.moveTo(-0.95, -0.05); c.lineTo(-0.3, -0.12); c.lineTo(-0.3, 0.14); c.lineTo(-0.9, 0.42); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#4b5563'; rr(c, -0.35, -0.16, 1.3, 0.16, 0.04); c.fill(); c.stroke();
      rr(c, -0.35, 0.02, 1.15, 0.14, 0.04); c.fill(); c.stroke();
      c.fillStyle = '#8a5a32'; rr(c, 0.05, 0.12, 0.45, 0.16, 0.05); c.fill(); c.stroke();
    },
    bat(c) {
      line(c, 0.08);
      c.fillStyle = '#d6a35c';
      c.beginPath(); c.moveTo(-0.95, -0.06); c.lineTo(-0.35, -0.08); c.quadraticCurveTo(0.6, -0.24, 0.92, -0.18); c.quadraticCurveTo(1.0, 0, 0.92, 0.18);
      c.quadraticCurveTo(0.6, 0.24, -0.35, 0.08); c.lineTo(-0.95, 0.06); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#3b3f46'; rr(c, -0.98, -0.1, 0.32, 0.2, 0.05); c.fill();
    },
    dynamite(c) {
      line(c, 0.08);
      c.fillStyle = '#d63a2f'; rr(c, -0.32, -0.55, 0.64, 1.35, 0.12); c.fill(); c.stroke();
      c.fillStyle = '#f3e3b5'; c.fillRect(-0.32, -0.05, 0.64, 0.22);
      c.strokeStyle = '#3b3f46'; c.lineWidth = 0.07; c.beginPath(); c.moveTo(0, -0.55); c.quadraticCurveTo(0.15, -0.8, 0.35, -0.82); c.stroke();
      c.fillStyle = '#ffcf33'; c.beginPath(); c.arc(0.4, -0.85, 0.14, 0, Math.PI * 2); c.fill();
    },
    mine(c) {
      line(c, 0.08);
      c.fillStyle = '#3d434c';
      c.beginPath(); c.moveTo(-0.85, 0.45); c.lineTo(-0.6, -0.05); c.quadraticCurveTo(0, -0.45, 0.6, -0.05); c.lineTo(0.85, 0.45); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#2a2f36'; rr(c, -0.95, 0.4, 1.9, 0.22, 0.08); c.fill(); c.stroke();
      c.fillStyle = '#ff4d3d'; c.beginPath(); c.arc(0, -0.2, 0.13, 0, Math.PI * 2); c.fill();
    },
    airstrike(c) {
      line(c, 0.07);
      c.fillStyle = '#7b8794';
      c.beginPath(); c.moveTo(-0.9, -0.5); c.lineTo(0.75, -0.5); c.quadraticCurveTo(0.98, -0.42, 0.75, -0.34); c.lineTo(-0.85, -0.34); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(-0.1, -0.42); c.lineTo(-0.45, -0.05); c.lineTo(-0.25, -0.05); c.lineTo(0.2, -0.42); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(-0.75, -0.42); c.lineTo(-0.95, -0.75); c.lineTo(-0.8, -0.75); c.lineTo(-0.6, -0.42); c.fill(); c.stroke();
      c.fillStyle = '#2b2f36';
      for (const [x, y] of [[-0.45, 0.25], [0, 0.45], [0.45, 0.65]]) { c.beginPath(); c.ellipse(x, y, 0.1, 0.17, 0, 0, Math.PI * 2); c.fill(); }
    },
    drill(c) {
      line(c, 0.08);
      c.fillStyle = '#f0b429'; rr(c, -0.95, -0.3, 0.75, 0.6, 0.1); c.fill(); c.stroke();
      c.fillStyle = '#b8c2cc'; c.beginPath(); c.moveTo(-0.2, -0.26); c.lineTo(0.95, 0); c.lineTo(-0.2, 0.26); c.closePath(); c.fill(); c.stroke();
      c.strokeStyle = '#6b7785'; c.lineWidth = 0.06;
      c.beginPath(); for (const x of [0.05, 0.3, 0.55]) { const h = 0.26 * (0.95 - x) / 1.15; c.moveTo(x, -h); c.lineTo(x + 0.12, h); } c.stroke();
    },
    jetpack(c) {
      line(c, 0.08);
      c.fillStyle = '#9aa5b1'; rr(c, -0.6, -0.7, 0.5, 1.1, 0.2); c.fill(); c.stroke(); rr(c, 0.1, -0.7, 0.5, 1.1, 0.2); c.fill(); c.stroke();
      c.fillStyle = '#ff8a3d';
      c.beginPath(); c.moveTo(-0.5, 0.42); c.lineTo(-0.35, 0.95); c.lineTo(-0.2, 0.42); c.fill();
      c.beginPath(); c.moveTo(0.2, 0.42); c.lineTo(0.35, 0.95); c.lineTo(0.5, 0.42); c.fill();
    },
    teleport(c) {
      c.strokeStyle = '#a66bff'; c.lineWidth = 0.14; c.lineCap = 'round';
      c.beginPath();
      for (let a = 0; a < Math.PI * 5; a += 0.2) { const r = 0.12 + a * 0.055; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      c.stroke();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(0.55, -0.55, 0.1, 0, Math.PI * 2); c.fill();
    },
    plank(c) {
      c.save(); c.rotate(-0.35);
      line(c, 0.07);
      c.fillStyle = '#c0392b'; c.fillRect(-0.95, -0.2, 1.9, 0.4); c.strokeRect(-0.95, -0.2, 1.9, 0.4);
      c.strokeStyle = '#7d2118'; c.lineWidth = 0.06; c.beginPath();
      for (let x = -0.95; x < 0.9; x += 0.4) { c.moveTo(x, -0.16); c.lineTo(x + 0.2, 0.16); c.lineTo(x + 0.4, -0.16); }
      c.stroke(); c.restore();
    },
    double(c) {
      c.fillStyle = '#ff5a3d'; c.beginPath();
      for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, r = i % 2 ? 0.45 : 0.95; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      c.closePath(); c.fill();
      c.fillStyle = '#fff'; c.font = 'bold 0.62px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('x2', 0, 0.06);
    },
    lowgrav(c) {
      c.fillStyle = '#f2f2d0'; c.beginPath(); c.arc(0, 0.1, 0.62, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#c9c9a8';
      for (const [x, y, r] of [[-0.2, -0.1, 0.14], [0.25, 0.25, 0.1], [0.1, -0.25, 0.07]]) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
      c.strokeStyle = '#9fd3ff'; c.lineWidth = 0.1; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-0.8, -0.55); c.lineTo(-0.8, -0.95); c.moveTo(-0.92, -0.82); c.lineTo(-0.8, -0.95); c.lineTo(-0.68, -0.82); c.stroke();
    },
    skip(c) {
      line(c, 0.09);
      c.fillStyle = '#e8d6a8';
      c.beginPath(); c.moveTo(-0.5, -0.85); c.lineTo(0.5, -0.85); c.lineTo(0.08, 0); c.lineTo(0.5, 0.85); c.lineTo(-0.5, 0.85); c.lineTo(-0.08, 0); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#d8a23a'; c.beginPath(); c.moveTo(-0.3, 0.75); c.lineTo(0.3, 0.75); c.lineTo(0, 0.35); c.fill();
    }
  };

  // weapon `id` centred on (x, y), `size` px across
  function draw(c, id, x, y, size) {
    const f = DRAW[id];
    if (!f) return;
    c.save();
    c.translate(x, y);
    c.scale(size / 2, size / 2);
    f(c);
    c.restore();
  }
  // a small canvas with the picture, for the DOM (arsenal, buttons)
  function icon(id, px = 40) {
    const cv = document.createElement('canvas');
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    cv.width = cv.height = Math.round(px * dpr);
    cv.style.width = cv.style.height = px + 'px';
    const c = cv.getContext('2d');
    c.scale(dpr, dpr);
    draw(c, id, px / 2, px / 2, px * 0.86);
    return cv;
  }

  return { draw, icon };
})();
