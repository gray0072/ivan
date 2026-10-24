'use strict';

// City Builder — the procedural drawings: every building (each house level, the shop, the factory,
// the park…), ruins, trees, cars, trucks and planes, in isometric projection. A drawing works in
// "world units": P(u, v, z) puts a point of the map (u, v in tiles, z in px up) on the canvas, with
// the building's top corner at (0, 0). render/render.js caches the buildings and trees as images
// and draws the vehicles live.

function P(u, v, z = 0) { return [(u - v) * TILE_HW, (u + v) * TILE_HH - z]; }

function poly(c, pts, fill) {
  c.beginPath();
  c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
  c.closePath();
  c.fillStyle = fill;
  c.fill();
}
// a flat rectangle of the map at height z
function flat(c, u0, v0, u1, v1, z, fill) { poly(c, [P(u0, v0, z), P(u1, v0, z), P(u1, v1, z), P(u0, v1, z)], fill); }
// a rectangle on the front-left wall (the plane v = const) and on the front-right one (u = const)
function onLeft(c, v, u0, u1, z0, z1, fill) { poly(c, [P(u0, v, z0), P(u1, v, z0), P(u1, v, z1), P(u0, v, z1)], fill); }
function onRight(c, u, v0, v1, z0, z1, fill) { poly(c, [P(u, v0, z0), P(u, v1, z0), P(u, v1, z1), P(u, v0, z1)], fill); }

// a box: the top, the front-left wall (lit) and the front-right wall (in shade)
function box(c, u0, v0, u1, v1, z0, z1, color, top) {
  onLeft(c, v1, u0, u1, z0, z1, color);
  onRight(c, u1, v0, v1, z0, z1, shade(color, -0.22));
  flat(c, u0, v0, u1, v1, z1, top || shade(color, 0.18));
}
// a grid of windows on a wall
function windowsLeft(c, v, u0, u1, z0, z1, cols, rows, fill) {
  const du = (u1 - u0) / cols, dz = (z1 - z0) / rows;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++)
    onLeft(c, v + 0.001, u0 + du * (i + 0.25), u0 + du * (i + 0.75), z0 + dz * (j + 0.3), z0 + dz * (j + 0.75), fill);
}
function windowsRight(c, u, v0, v1, z0, z1, cols, rows, fill) {
  const dv = (v1 - v0) / cols, dz = (z1 - z0) / rows;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++)
    onRight(c, u + 0.001, v0 + dv * (i + 0.25), v0 + dv * (i + 0.75), z0 + dz * (j + 0.3), z0 + dz * (j + 0.75), fill);
}
// a gable roof with its ridge along u (the gable end faces front-right) or along v (it faces front-left)
function gableU(c, u0, v0, u1, v1, z, rise, roof, wall) {
  const vm = (v0 + v1) / 2;
  poly(c, [P(u0, v0, z), P(u1, v0, z), P(u1, vm, z + rise), P(u0, vm, z + rise)], shade(roof, 0.15));
  poly(c, [P(u0, v1, z), P(u1, v1, z), P(u1, vm, z + rise), P(u0, vm, z + rise)], roof);
  poly(c, [P(u1, v0, z), P(u1, v1, z), P(u1, vm, z + rise)], shade(wall, -0.22));
}
function gableV(c, u0, v0, u1, v1, z, rise, roof, wall) {
  const um = (u0 + u1) / 2;
  poly(c, [P(u0, v0, z), P(u0, v1, z), P(um, v1, z + rise), P(um, v0, z + rise)], shade(roof, 0.15));
  poly(c, [P(u1, v0, z), P(u1, v1, z), P(um, v1, z + rise), P(um, v0, z + rise)], shade(roof, -0.15));
  poly(c, [P(u0, v1, z), P(u1, v1, z), P(um, v1, z + rise)], wall);
}
// an upright cylinder (a tank, a chimney) standing at (u, v)
function cylinder(c, u, v, r, z0, z1, color) {
  const [x, y0] = P(u, v, z0), [, y1] = P(u, v, z1);
  const rx = r * TILE_HW * Math.SQRT2, ry = r * TILE_HH * Math.SQRT2;
  c.fillStyle = shade(color, -0.2);
  c.beginPath(); c.ellipse(x, y0, rx, ry, 0, 0, Math.PI); c.lineTo(x - rx, y1); c.ellipse(x, y1, rx, ry, 0, Math.PI, 0, true); c.closePath(); c.fill();
  c.fillStyle = color;
  c.fillRect(x - rx, y1, rx * 0.8, y0 - y1);
  c.fillStyle = shade(color, 0.2);
  c.beginPath(); c.ellipse(x, y1, rx, ry, 0, 0, Math.PI * 2); c.fill();
}
// a flat ellipse on the map (a pond, a pitch), radii in tiles
function groundEllipse(c, u, v, ru, rv, z, fill) {
  c.save();
  const [x, y] = P(u, v, z);
  c.translate(x, y);
  c.transform(TILE_HW, TILE_HH, -TILE_HW, TILE_HH, 0, 0);
  c.beginPath(); c.ellipse(0, 0, ru, rv, 0, 0, Math.PI * 2);
  c.restore();
  c.fillStyle = fill;
  c.fill();
}

// ---------- trees ----------
function tree(c, u, v, s, kind, tone = 0) {
  const [x, y] = P(u, v);
  c.fillStyle = 'rgba(0,0,0,0.16)';
  c.beginPath(); c.ellipse(x + 4 * s, y + 1, 10 * s, 4.5 * s, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#6d4c41';
  c.fillRect(x - 1.5 * s, y - 9 * s, 3 * s, 9 * s);
  if (kind === 'pine') {
    const g = shade('#2e7d32', tone);
    poly(c, [[x, y - 34 * s], [x - 10 * s, y - 9 * s], [x + 10 * s, y - 9 * s]], g);
    poly(c, [[x, y - 34 * s], [x, y - 9 * s], [x + 10 * s, y - 9 * s]], shade('#1b5e20', tone));
    poly(c, [[x, y - 42 * s], [x - 7 * s, y - 22 * s], [x + 7 * s, y - 22 * s]], shade('#388e3c', tone));
  } else {
    const g = kind === 'birch' ? '#8bc34a' : '#43a047';
    c.fillStyle = shade(g, -0.25 + tone);
    c.beginPath(); c.arc(x + 2 * s, y - 15 * s, 10 * s, 0, Math.PI * 2); c.fill();
    c.fillStyle = shade(g, tone);
    c.beginPath(); c.arc(x - 1 * s, y - 18 * s, 9 * s, 0, Math.PI * 2); c.fill();
    c.fillStyle = shade(g, 0.25 + tone);
    c.beginPath(); c.arc(x - 4 * s, y - 21 * s, 4.5 * s, 0, Math.PI * 2); c.fill();
  }
}
// a forest tile: two or three trees, placed by the variant
function drawForest(c, variant) {
  const r = seededRandom(variant * 7919 + 13);
  const n = 2 + (r() < 0.6 ? 1 : 0);
  const spots = [[0.3, 0.3], [0.72, 0.38], [0.4, 0.75], [0.75, 0.78]];
  for (let i = 0; i < n; i++) {
    const [u, v] = spots[(i + variant) % 4];
    tree(c, u + (r() - 0.5) * 0.12, v + (r() - 0.5) * 0.12, 0.85 + r() * 0.35, r() < 0.55 ? 'pine' : 'oak', (r() - 0.5) * 0.15);
  }
}

// ---------- buildings ----------
const WALLS = ['#f5e6c8', '#e8d5b0', '#f2f2ee', '#ffe0b2', '#d7ccc8', '#c5e1a5', '#b3e5fc', '#ffccbc'];
const ROOFS = ['#c0392b', '#a0522d', '#5d6d7e', '#8e3b2e', '#2e86c1', '#6e2c00', '#b03a2e', '#566573'];
const TOWER = ['#e0d6c8', '#b0bec5', '#c9a27e', '#e6ee9c', '#90caf9', '#d7ccc8', '#ffcc80', '#cfd8dc'];
const GLASS = '#5b7c99';
const LAWN = '#8cc152';

function lot(c, w, h, fill) { flat(c, 0.03, 0.03, w - 0.03, h - 0.03, 0, fill); }

function drawHouse(c, level, variant) {
  const wall = WALLS[variant % WALLS.length], roof = ROOFS[(variant * 3) % ROOFS.length];
  lot(c, 1, 1, LAWN);
  if (level === 1) {
    flat(c, 0.42, 0.75, 0.58, 1, 0, '#d9c8a0');
    box(c, 0.22, 0.28, 0.78, 0.75, 0, 14, wall);
    onLeft(c, 0.751, 0.42, 0.56, 0, 9, '#795548');
    onRight(c, 0.781, 0.4, 0.6, 5, 10, GLASS);
    gableU(c, 0.18, 0.24, 0.82, 0.79, 14, 12, roof, wall);
    tree(c, 0.12, 0.15, 0.6, variant % 2 ? 'oak' : 'birch');
  } else if (level === 2) {
    flat(c, 0.4, 0.82, 0.56, 1, 0, '#d9c8a0');
    box(c, 0.14, 0.18, 0.86, 0.82, 0, 28, wall);
    windowsLeft(c, 0.82, 0.14, 0.86, 2, 28, 3, 2, GLASS);
    windowsRight(c, 0.86, 0.18, 0.82, 2, 28, 3, 2, GLASS);
    onLeft(c, 0.821, 0.42, 0.54, 0, 10, '#6d4c41');
    gableV(c, 0.1, 0.14, 0.9, 0.86, 28, 16, roof, wall);
    box(c, 0.25, 0.3, 0.33, 0.38, 34, 46, '#8d6e63');
  } else {
    const t = TOWER[variant % TOWER.length];
    flat(c, 0.05, 0.05, 0.95, 0.95, 0, '#b8bcc0');
    box(c, 0.1, 0.1, 0.9, 0.9, 0, 72, t);
    windowsLeft(c, 0.9, 0.1, 0.9, 4, 70, 4, 7, GLASS);
    windowsRight(c, 0.9, 0.1, 0.9, 4, 70, 4, 7, GLASS);
    onLeft(c, 0.901, 0.42, 0.58, 0, 8, '#455a64');
    flat(c, 0.14, 0.14, 0.86, 0.86, 72.5, shade(t, -0.1));
    box(c, 0.3, 0.25, 0.5, 0.45, 72, 80, '#9e9e9e');
    box(c, 0.6, 0.55, 0.75, 0.7, 72, 77, '#bdbdbd');
  }
}

function drawShop(c, variant) {
  const colors = ['#ef5350', '#42a5f5', '#66bb6a', '#ffa726'];
  const a = colors[variant % 4];
  lot(c, 1, 1, '#c8c8c0');
  box(c, 0.14, 0.16, 0.86, 0.8, 0, 20, '#fafafa');
  onLeft(c, 0.801, 0.2, 0.8, 2, 13, GLASS);
  onRight(c, 0.861, 0.22, 0.74, 2, 13, GLASS);
  onLeft(c, 0.802, 0.44, 0.56, 0, 11, '#37474f');
  // a striped awning over the front
  for (let i = 0; i < 6; i++) {
    const u0 = 0.14 + i * 0.12;
    poly(c, [P(u0, 0.8, 17), P(u0 + 0.12, 0.8, 17), P(u0 + 0.12, 0.95, 12), P(u0, 0.95, 12)], i % 2 ? '#ffffff' : a);
  }
  box(c, 0.3, 0.35, 0.7, 0.45, 20, 30, a);
  onLeft(c, 0.451, 0.34, 0.66, 22, 28, '#ffffff');
}

function drawFactory(c, variant) {
  lot(c, 2, 2, '#a5a59a');
  const wall = variant % 2 ? '#b0705a' : '#9e9e9e';
  box(c, 0.15, 0.2, 1.55, 1.85, 0, 26, wall);
  windowsLeft(c, 1.85, 0.15, 1.55, 6, 20, 5, 1, '#78909c');
  onLeft(c, 1.851, 0.7, 1.05, 0, 16, '#546e7a');
  // a saw-tooth roof: four teeth along v
  for (let i = 0; i < 4; i++) {
    const v0 = 0.2 + i * 0.4125, v1 = v0 + 0.4125;
    poly(c, [P(0.15, v0, 26), P(1.55, v0, 26), P(1.55, v1, 38), P(0.15, v1, 38)], '#8d9aa5');
    poly(c, [P(0.15, v1, 26), P(1.55, v1, 26), P(1.55, v1, 38), P(0.15, v1, 38)], '#cfe3f1');
    poly(c, [P(1.55, v0, 26), P(1.55, v1, 26), P(1.55, v1, 38)], shade(wall, -0.22));
  }
  cylinder(c, 1.75, 0.5, 0.11, 0, 72, '#8d6e63');
  box(c, 1.66, 0.41, 1.84, 0.59, 66, 72, '#d84315');
  cylinder(c, 1.75, 1.45, 0.2, 0, 26, '#cfd8dc');
  cylinder(c, 1.75, 1.0, 0.16, 0, 20, '#b0bec5');
}

function drawPark(c, variant) {
  lot(c, 1, 1, '#7cc04a');
  flat(c, 0.44, 0, 0.56, 1, 0.2, '#e3cf9a');
  flat(c, 0, 0.44, 1, 0.56, 0.2, '#e3cf9a');
  groundEllipse(c, 0.5, 0.5, 0.16, 0.16, 0.5, '#bdbdbd');
  groundEllipse(c, 0.5, 0.5, 0.12, 0.12, 1, '#4fc3f7');
  const r = seededRandom(variant + 3);
  for (let i = 0; i < 8; i++) {
    const [x, y] = P(0.1 + r() * 0.25 + (i % 2) * 0.6, 0.65 + r() * 0.25);
    c.fillStyle = ['#e91e63', '#ffeb3b', '#ff5722', '#ffffff'][i % 4];
    c.beginPath(); c.arc(x, y, 1.6, 0, Math.PI * 2); c.fill();
  }
  tree(c, 0.22, 0.22, 0.75, 'oak');
  tree(c, 0.78, 0.25, 0.7, variant % 2 ? 'pine' : 'birch');
  tree(c, 0.25, 0.78, 0.6, 'birch');
  box(c, 0.66, 0.74, 0.86, 0.8, 0, 4, '#8d6e63');
}

function drawFireStation(c) {
  lot(c, 2, 2, '#bdbdbd');
  flat(c, 0.2, 1.45, 1.8, 1.97, 0.3, '#9e9e9e');
  box(c, 0.2, 0.3, 1.8, 1.45, 0, 26, '#c62828');
  windowsRight(c, 1.8, 0.3, 1.45, 14, 24, 3, 1, '#ffecb3');
  for (let i = 0; i < 3; i++) onLeft(c, 1.451, 0.75 + i * 0.35, 1.02 + i * 0.35, 0, 16, '#eceff1');
  for (let i = 0; i < 3; i++) for (let k = 1; k < 4; k++) onLeft(c, 1.452, 0.75 + i * 0.35, 1.02 + i * 0.35, k * 4, k * 4 + 0.6, '#90a4ae');
  flat(c, 0.2, 0.3, 1.8, 1.45, 26.5, '#8e1c1c');
  box(c, 0.25, 0.3, 0.65, 0.7, 0, 52, '#b71c1c');
  windowsLeft(c, 0.7, 0.25, 0.65, 30, 50, 1, 2, '#ffecb3');
  gableU(c, 0.22, 0.27, 0.68, 0.73, 52, 10, '#37474f', '#b71c1c');
  onLeft(c, 1.453, 0.25, 0.6, 18, 24, '#ffffff');
}

function drawEmbankment(c) {
  box(c, 0.04, 0.04, 0.96, 0.96, 0, 8, '#9e9e94', '#bdbdb3');
  for (let i = 1; i < 4; i++) {
    onLeft(c, 0.961, 0.04 + i * 0.23, 0.05 + i * 0.23, 0, 8, '#7d7d74');
    onRight(c, 0.961, 0.04 + i * 0.23, 0.05 + i * 0.23, 0, 8, '#6d6d65');
  }
}

function drawSchool(c) {
  lot(c, 2, 2, LAWN);
  // the sports court
  flat(c, 1.0, 1.0, 1.9, 1.9, 0.3, '#43a047');
  c.strokeStyle = '#ffffff'; c.lineWidth = 1;
  c.beginPath(); const q = [P(1.08, 1.08, 0.5), P(1.82, 1.08, 0.5), P(1.82, 1.82, 0.5), P(1.08, 1.82, 0.5)];
  c.moveTo(...q[0]); q.slice(1).forEach((p) => c.lineTo(...p)); c.closePath(); c.stroke();
  c.beginPath(); c.moveTo(...P(1.45, 1.08, 0.5)); c.lineTo(...P(1.45, 1.82, 0.5)); c.stroke();
  const wall = '#ffcc80';
  box(c, 0.12, 0.15, 0.82, 1.85, 0, 30, wall);
  windowsRight(c, 0.82, 0.15, 1.85, 3, 29, 6, 2, GLASS);
  windowsLeft(c, 1.85, 0.12, 0.82, 3, 29, 2, 2, GLASS);
  flat(c, 0.12, 0.15, 0.82, 1.85, 30.5, '#e65100');
  box(c, 0.82, 0.15, 1.85, 0.85, 0, 30, wall);
  windowsRight(c, 1.85, 0.15, 0.85, 3, 29, 2, 2, GLASS);
  windowsLeft(c, 0.85, 0.82, 1.85, 3, 29, 3, 2, GLASS);
  onLeft(c, 0.851, 1.2, 1.45, 0, 14, '#5d4037');
  flat(c, 0.82, 0.15, 1.85, 0.85, 30.5, '#e65100');
  // the flag
  const [fx, fy] = P(1.6, 0.95);
  c.fillStyle = '#9e9e9e'; c.fillRect(fx - 0.8, fy - 56, 1.6, 56);
  c.fillStyle = '#1e88e5'; c.fillRect(fx + 0.8, fy - 56, 14, 9);
}

function drawStadium(c) {
  lot(c, 3, 3, '#9e9e9e');
  const h = 26, [cx, cy] = P(1.5, 1.5);
  const rx = 1.4 * TILE_HW * Math.SQRT2 * 0.98, ry = 1.4 * TILE_HH * Math.SQRT2 * 0.98;
  c.fillStyle = '#78909c';
  c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI); c.lineTo(cx - rx, cy - h); c.ellipse(cx, cy - h, rx, ry, 0, Math.PI, 0, true); c.closePath(); c.fill();
  c.fillStyle = '#90a4ae';
  c.fillRect(cx - rx, cy - h, rx * 0.7, h);
  c.fillStyle = '#eceff1';
  c.beginPath(); c.ellipse(cx, cy - h, rx, ry, 0, 0, Math.PI * 2); c.fill();
  // the seats, red and blue rings, then the pitch down in the bowl
  c.fillStyle = '#e53935'; c.beginPath(); c.ellipse(cx, cy - h + 2, rx * 0.9, ry * 0.9, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#1e88e5'; c.beginPath(); c.ellipse(cx, cy - h + 5, rx * 0.78, ry * 0.78, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#546e7a'; c.beginPath(); c.ellipse(cx, cy - h + 7, rx * 0.68, ry * 0.68, 0, 0, Math.PI * 2); c.fill();
  c.save();
  c.beginPath(); c.ellipse(cx, cy - h + 7, rx * 0.68, ry * 0.68, 0, 0, Math.PI * 2); c.clip();
  const pz = h - 8;
  flat(c, 0.6, 0.8, 2.4, 2.2, pz, '#4caf50');
  for (let i = 0; i < 6; i++) flat(c, 0.6 + i * 0.3, 0.8, 0.75 + i * 0.3, 2.2, pz, '#5cbf60');
  c.strokeStyle = '#ffffff'; c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(...P(1.5, 0.8, pz)); c.lineTo(...P(1.5, 2.2, pz)); c.stroke();
  c.restore();
  // four floodlights
  for (const [u, v] of [[0.25, 0.25], [2.75, 0.25], [0.25, 2.75], [2.75, 2.75]]) {
    const [x, y] = P(u, v);
    c.fillStyle = '#607d8b'; c.fillRect(x - 1, y - 60, 2, 60);
    c.fillStyle = '#fffde7'; c.fillRect(x - 5, y - 64, 10, 5);
  }
}

// a plane seen from above, laid on the map: nose along +u in its own frame (scale in tiles)
function planeShape(c, s, color) {
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(0.5 * s, 0);
  c.quadraticCurveTo(0.45 * s, 0.05 * s, 0.3 * s, 0.05 * s);
  c.lineTo(-0.42 * s, 0.05 * s); c.lineTo(-0.5 * s, 0.02 * s); c.lineTo(-0.5 * s, -0.02 * s); c.lineTo(-0.42 * s, -0.05 * s);
  c.lineTo(0.3 * s, -0.05 * s);
  c.quadraticCurveTo(0.45 * s, -0.05 * s, 0.5 * s, 0);
  c.fill();
  c.beginPath();
  c.moveTo(0.1 * s, 0); c.lineTo(-0.12 * s, 0.42 * s); c.lineTo(-0.2 * s, 0.42 * s); c.lineTo(-0.08 * s, 0);
  c.lineTo(-0.2 * s, -0.42 * s); c.lineTo(-0.12 * s, -0.42 * s); c.closePath(); c.fill();
  c.beginPath();
  c.moveTo(-0.36 * s, 0); c.lineTo(-0.46 * s, 0.17 * s); c.lineTo(-0.5 * s, 0.17 * s); c.lineTo(-0.47 * s, 0);
  c.lineTo(-0.5 * s, -0.17 * s); c.lineTo(-0.46 * s, -0.17 * s); c.closePath(); c.fill();
}
// a plane at (u, v), z px up, heading (du, dv); its shadow on the ground under it
function drawPlane(c, u, v, z, du, dv, s, color) {
  const ang = Math.atan2(dv, du);
  for (const [zz, col] of [[0, 'rgba(0,0,0,0.22)'], [z, color]]) {
    c.save();
    const [x, y] = P(u + (zz ? 0 : z * 0.012), v - (zz ? 0 : z * 0.012), zz);
    c.translate(x, y);
    c.transform(TILE_HW, TILE_HH, -TILE_HW, TILE_HH, 0, 0);
    c.rotate(ang);
    planeShape(c, s, col);
    c.restore();
  }
}

function drawAirport(c) {
  lot(c, 4, 8, '#9ccc65');
  flat(c, 0.15, 0.15, 2.1, 7.85, 0.2, '#cfd2d4');
  flat(c, 2.1, 0.6, 2.55, 7.4, 0.2, '#8a8f94');
  flat(c, 2.6, 0.2, 3.7, 7.8, 0.3, '#55595e');
  for (let i = 0; i < 12; i++) flat(c, 3.12, 0.6 + i * 0.58, 3.18, 0.88 + i * 0.58, 0.5, '#ffffff');
  for (let i = 0; i < 5; i++) {
    flat(c, 2.72 + i * 0.18, 0.3, 2.8 + i * 0.18, 0.6, 0.5, '#ffffff');
    flat(c, 2.72 + i * 0.18, 7.4, 2.8 + i * 0.18, 7.7, 0.5, '#ffffff');
  }
  box(c, 0.25, 2.0, 1.4, 5.8, 0, 22, '#90a4ae');
  windowsRight(c, 1.4, 2.0, 5.8, 4, 20, 10, 1, '#4fc3f7');
  windowsLeft(c, 5.8, 0.25, 1.4, 4, 20, 3, 1, '#4fc3f7');
  flat(c, 0.25, 2.0, 1.4, 5.8, 22.5, '#eceff1');
  // the control tower
  box(c, 0.5, 0.5, 0.8, 0.8, 0, 60, '#eceff1');
  box(c, 0.38, 0.38, 0.92, 0.92, 60, 72, '#4fc3f7', '#cfd8dc');
  box(c, 0.45, 0.45, 0.85, 0.85, 72, 76, '#607d8b');
  drawPlane(c, 1.8, 3.0, 0, -1, 0, 1.0, '#ffffff');
  drawPlane(c, 1.8, 4.8, 0, -1, 0, 0.9, '#fafafa');
}

function drawRuins(c, w, h) {
  lot(c, w, h, '#5d5449');
  const r = seededRandom(w * 31 + h);
  for (let i = 0; i < 4 + w * h * 2; i++) {
    const u = 0.1 + r() * (w - 0.35), v = 0.1 + r() * (h - 0.35);
    box(c, u, v, u + 0.12 + r() * 0.15, v + 0.12 + r() * 0.15, 0, 3 + r() * 12, r() < 0.5 ? '#4e342e' : '#616161');
  }
}

// how tall each drawing can get (px), for the image cache's bounds and the fires on top
const SPRITE_HEIGHT = {
  house: [0, 30, 50, 82], shop: 32, factory: 76, park: 30, fireStation: 64, embankment: 10,
  school: 58, stadium: 66, airport: 80, ruins: 20, forest: 46
};
function spriteHeight(type, level) {
  const h = SPRITE_HEIGHT[type];
  return Array.isArray(h) ? h[level] : h;
}
// how many looks each kind has (the cache keeps one image per look)
const SPRITE_VARIANTS = { house: 8, shop: 4, factory: 2, park: 2 };

// draws a building's look into c, its top corner at (0, 0)
function drawBuildingSprite(c, type, level, variant, w, h) {
  switch (type) {
    case 'house': return drawHouse(c, level, variant);
    case 'shop': return drawShop(c, variant);
    case 'factory': return drawFactory(c, variant);
    case 'park': return drawPark(c, variant);
    case 'fireStation': return drawFireStation(c);
    case 'embankment': return drawEmbankment(c);
    case 'school': return drawSchool(c);
    case 'stadium': return drawStadium(c);
    case 'airport': return drawAirport(c);
    case 'ruins': return drawRuins(c, w, h);
  }
}

// ---------- vehicles (drawn live) ----------
// a small car on the map at (u, v) heading (du, dv); len and wid in tiles
function drawCar(c, u, v, du, dv, color, len = 0.3, wid = 0.15, tall = 6) {
  const ang = Math.atan2(dv, du);
  const rect = (z, l, w, fill, dx = 0) => {
    c.save();
    const [x, y] = P(u, v, z);
    c.translate(x, y);
    c.transform(TILE_HW, TILE_HH, -TILE_HW, TILE_HH, 0, 0);
    c.rotate(ang);
    c.fillStyle = fill;
    c.fillRect(-l / 2 + dx, -w / 2, l, w);
    c.restore();
  };
  rect(0, len, wid, 'rgba(0,0,0,0.3)');
  rect(tall * 0.5, len, wid, shade(color, -0.3));
  rect(tall, len, wid, color);
  rect(tall + 2.5, len * 0.5, wid * 0.85, shade(color, 0.3), -len * 0.06);
}
function drawTruck(c, u, v, du, dv, t) {
  drawCar(c, u, v, du, dv, '#d32f2f', 0.42, 0.18, 8);
  const [x, y] = P(u, v, 12);
  c.fillStyle = Math.floor(t * 6) % 2 ? '#2196f3' : '#ff1744';
  c.beginPath(); c.arc(x, y, 2, 0, Math.PI * 2); c.fill();
}
