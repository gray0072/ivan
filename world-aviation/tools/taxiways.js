'use strict';

// ============================================================
// World Aviation — the taxiway debug plan (tools/taxiways.html)
//
// Open tools/taxiways.html (from file:// is fine). It lays an airport out as a flight does
// (World.makeAirport) and draws from above only what lies on the ground of the taxi network:
// the runway, the paved shapes of the taxiways (render/taxiways.js), the very marking strips
// and lights the game builds (Airport3D.buildMarkings / buildLights, read back from their
// meshes), and on request the ground texture and the taxi graph (nodes, lines, the fillets'
// arcs and centres). Pick the airport and a place to look at; drag to pan, the wheel (or a
// pinch) to zoom. The hash keeps the choice: taxiways.html#ARN/start.
// ============================================================

const cv = document.getElementById('cv');
const g = cv.getContext('2d');
const $ = (id) => document.getElementById(id);
const DPR = Math.min(2, window.devicePixelRatio || 1);

World.init();
const cam = { t: 0, across: 0, k: 1 };    // the middle of the view (runway-local metres), pixels per metre
let A = null;                             // the airport and what was built of it: { a, marks, lights, ground, plan }

// a marking mesh's triangles as drawn near: each vertex its line's point moved by its offset
// (render/airport3d.js markBatch: the vertex shader widens only the lines too thin to see)
function markCorners(geo) {
  const p = geo.attributes.position.array, o = geo.attributes.markOff ? geo.attributes.markOff.array : null;
  if (!o) return p;
  const out = new Float32Array(p.length);
  for (let i = 0, j = 0; i < p.length; i += 3, j += 2) { out[i] = p[i] + o[j]; out[i + 1] = p[i + 1]; out[i + 2] = p[i + 2] + o[j + 1]; }
  return out;
}

// the places to look at: [name, t, across, pixels per metre]
function views(a) {
  const n = a.nodes, L = LAYOUT, out = [['whole airport', (a.apronT0 + a.apronT1) / 2, 200, 0]];
  const near = (name, p, k) => out.push([name, p.t, p.across, k || 3]);
  near('start (holding point)', n.twyStart, 3);
  near('line-up', n.rwyStart, 2);
  a.exits.forEach((e, i) => near('exit ' + (i + 1) + (e.rapid ? ' (rapid)' : ''), { t: e.t + 80, across: 90 }, 1.6));
  near('taxiway end', n.twyEnd, 3);
  for (const t of a.apronLanes) near('lane at t ' + Math.round(t), { t, across: L.TWY_OFFSET + 60 }, 2.5);
  a.gates.forEach((gt) => near(gt.name, { t: gt.t, across: L.APRON_LANE + 30 }, 3));
  return out;
}

function build(id) {
  const meta = World.byId[id] || World.list[0];
  const a = World.makeAirport(meta, { x: 0, z: 0 });
  const meshes = [];
  const at = (obj) => { meshes.push(obj); return obj; };
  const tex = (c) => new THREE.CanvasTexture(c);
  Airport3D.buildMarkings(a, at, tex);
  const marks = meshes.filter((m) => m.isMesh && m.material && m.material.color && !m.material.map).map((m) => ({
    pos: markCorners(m.geometry), color: '#' + m.material.color.clone().convertLinearToSRGB().getHexString()
  }));
  const rec = {};
  meshes.length = 0;
  Airport3D.buildLights(a, rec, at);
  const lights = [];
  for (const p of [rec.lights, rec.twyLights]) {
    if (!p) continue;
    const pos = p.geometry.attributes.position.array, col = p.geometry.attributes.color.array;
    for (let i = 0; i < pos.length; i += 3) lights.push({ t: -pos[i + 2], across: pos[i], c: [col[i], col[i + 1], col[i + 2]], twy: p === rec.twyLights });
  }
  A = { a, marks, lights, ground: null, plan: Taxiways.plan(a) };
  const sel = $('view');
  sel.innerHTML = '';
  views(a).forEach((v, i) => { const o = document.createElement('option'); o.value = i; o.textContent = v[0]; sel.appendChild(o); });
  A.views = views(a);
}

function ground() {
  if (!A.ground) {
    const look = AIRPORT_LOOK[A.a.id] || ['star', '#2a5d8f'];
    A.ground = makeGroundCanvas(A.a, { symbol: look[0], color: look[1], airlines: airlinesAt(A.a), paint: buildingPaint(A.a) }, 4096);
    A.ground.box = groundBox(A.a);
  }
  return A.ground;
}

function look(i) {
  const v = A.views[i] || A.views[0];
  cam.t = v[1]; cam.across = v[2];
  cam.k = v[3] || Math.min(cv.width / DPR / (A.a.rwyLen + 600), (cv.height / DPR - 40) / 700);
}

// screen from runway-local metres: t to the right, across down (the terminal below the runway)
const X = (t) => (t - cam.t) * cam.k + cv.width / DPR / 2;
const Y = (ac) => (ac - cam.across) * cam.k + cv.height / DPR / 2 + 20;

function draw() {
  const W = cv.width / DPR, H = cv.height / DPR, a = A.a, night = $('night').checked;
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  g.fillStyle = night ? '#07090c' : '#4f5d3d';
  g.fillRect(0, 0, W, H);
  if ($('showGround').checked) {
    const gr = ground(), b = gr.box, k = cam.k;
    const sx = gr.cv.width / (b.aMax - b.aMin), sy = gr.cv.height / (b.tMax - b.tMin);
    g.setTransform(0, DPR * k / sx, -DPR * k / sy, 0, DPR * X(b.tMax), DPR * Y(b.aMin));
    g.drawImage(gr.cv, 0, 0);
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  // the runway and the apron
  const e = RWY_HALF_WIDTH, r = a.apronRect;
  const box = (t0, t1, a0, a1, c) => { g.fillStyle = c; g.fillRect(X(t0), Y(a0), (t1 - t0) * cam.k, (a1 - a0) * cam.k); };
  // (the taxiways under the apron, as in the ground texture, and the runway over both, as its mesh)
  if ($('showPave').checked && !$('showGround').checked) drawPlan(night);
  if (!$('showGround').checked) box(r.t0, r.t1, r.a0, r.a1, night ? '#202224' : '#9b9e9e');
  box(-a.half - RWY_BLAST, a.half + RWY_BLAST, -e - RWY_SHOULDER, e + RWY_SHOULDER, night ? '#1c1d1f' : '#5a5850');
  box(-a.half, a.half, -e, e, night ? '#141517' : '#45484c');
  if ($('showGraph').checked) drawGraph();
  if ($('showMarks').checked) {
    for (const m of A.marks) {
      g.fillStyle = m.color;
      g.globalAlpha = night ? 0.35 : 1;
      const p = m.pos;
      g.beginPath();
      for (let i = 0; i < p.length; i += 9) {
        g.moveTo(X(-p[i + 2]), Y(p[i])); g.lineTo(X(-p[i + 5]), Y(p[i + 3])); g.lineTo(X(-p[i + 8]), Y(p[i + 6])); g.closePath();
      }
      g.fill();
    }
    g.globalAlpha = 1;
  }
  if ($('showLights').checked) {
    const rad = Math.max(1.2, Math.min(4, cam.k * 0.5));
    for (const l of A.lights) {
      g.fillStyle = 'rgb(' + l.c.map((v) => Math.round(Math.min(1, v) * 255)).join(',') + ')';
      g.beginPath(); g.arc(X(l.t), Y(l.across), l.twy ? rad * 0.8 : rad, 0, TAU); g.fill();
    }
  }
  $('info').textContent = a.id + ' ' + a.name + ' · ' + a.terminal + ' · runway ' + a.rwyLen + ' m · ' + a.nodeList.length + ' nodes, ' +
    (a.fillets || []).length + ' fillets · ' + cam.k.toFixed(2) + ' px/m';
}

// the paved shapes of render/taxiways.js: filled, and their outlines
function drawPlan(night) {
  const path = (pts) => { pts.forEach(([t, ac], i) => (i ? g.lineTo(X(t), Y(ac)) : g.moveTo(X(t), Y(ac)))); g.closePath(); };
  // the hangars' pads (the plan's fixed paved areas after the runway and the apron)
  g.fillStyle = night ? '#25272a' : '#8c8f90';
  for (const b of A.plan.rects.slice(2)) g.fillRect(X(b[0]), Y(b[2]), (b[1] - b[0]) * cam.k, (b[3] - b[2]) * cam.k);
  // (each set as one path: the union, as the ground texture fills it)
  g.fillStyle = night ? '#1a1b1d' : '#8a8574';
  g.beginPath(); for (const s of Taxiways.pavement(A.plan, TWY_SHOULDER)) path(s); g.fill();
  g.fillStyle = night ? '#25272a' : '#65696d';
  const pave = Taxiways.pavement(A.plan, 0);
  g.beginPath(); for (const s of pave) path(s); g.fill();
  // each piece's outline, faint: where the pieces meet
  if ($('showGraph').checked) {
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1;
    for (const s of pave) { g.beginPath(); path(s); g.stroke(); }
  }
}

function drawGraph() {
  const a = A.a;
  g.lineWidth = 1;
  g.strokeStyle = 'rgba(0,200,255,0.8)';
  for (const n of a.nodeList) for (const e of n.edges) { g.beginPath(); g.moveTo(X(n.t), Y(n.across)); g.lineTo(X(e.to.t), Y(e.to.across)); g.stroke(); }
  g.strokeStyle = 'rgba(255,60,200,0.9)';
  for (const f of a.fillets || []) {
    g.beginPath(); f.pts.forEach(([t, ac], i) => (i ? g.lineTo(X(t), Y(ac)) : g.moveTo(X(t), Y(ac)))); g.stroke();
  }
  g.fillStyle = '#00c8ff'; g.font = '11px system-ui';
  for (const n of a.nodeList) {
    g.fillRect(X(n.t) - 2, Y(n.across) - 2, 4, 4);
    if (cam.k > 1.2) g.fillText(n.id, X(n.t) + 4, Y(n.across) - 4);
  }
}

function resize() {
  cv.width = Math.round(innerWidth * DPR); cv.height = Math.round(innerHeight * DPR);
  draw();
}

// ---- the controls
const aptSel = $('apt');
World.list.slice().sort((p, q) => p.id.localeCompare(q.id)).forEach((m) => {
  const o = document.createElement('option'); o.value = m.id; o.textContent = m.id + ' — ' + m.name + ' (' + m.terminal + ')'; aptSel.appendChild(o);
});
function fromHash() {
  const [id, view] = decodeURIComponent(location.hash.slice(1)).split('/');
  aptSel.value = World.byId[id] ? id : 'ARN';
  build(aptSel.value);
  const i = A.views.findIndex((v) => v[0].startsWith(view || '~'));
  $('view').value = Math.max(0, i);
  look(Math.max(0, i));
}
aptSel.onchange = () => { location.hash = aptSel.value; };
$('view').onchange = () => { location.hash = aptSel.value + '/' + A.views[$('view').value][0]; };
window.onhashchange = () => { fromHash(); draw(); };
for (const id of ['showGround', 'showPave', 'showMarks', 'showLights', 'showGraph', 'night']) $(id).onchange = draw;

const ptrs = new Map();
cv.addEventListener('pointerdown', (ev) => { cv.setPointerCapture(ev.pointerId); ptrs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY }); });
cv.addEventListener('pointerup', (ev) => ptrs.delete(ev.pointerId));
cv.addEventListener('pointercancel', (ev) => ptrs.delete(ev.pointerId));
cv.addEventListener('pointermove', (ev) => {
  const p = ptrs.get(ev.pointerId);
  if (!p) return;
  if (ptrs.size === 2) {
    const o = [...ptrs.entries()].find(([k]) => k !== ev.pointerId)[1];
    const d0 = Math.hypot(p.x - o.x, p.y - o.y), d1 = Math.hypot(ev.clientX - o.x, ev.clientY - o.y);
    if (d0 > 0) zoomAt((o.x + ev.clientX) / 2, (o.y + ev.clientY) / 2, d1 / d0);
  } else {
    cam.t -= (ev.clientX - p.x) / cam.k; cam.across -= (ev.clientY - p.y) / cam.k;
  }
  p.x = ev.clientX; p.y = ev.clientY;
  draw();
});
function zoomAt(sx, sy, f) {
  const t = cam.t + (sx - cv.width / DPR / 2) / cam.k, ac = cam.across + (sy - cv.height / DPR / 2 - 20) / cam.k;
  cam.k = clamp(cam.k * f, 0.05, 60);
  cam.t = t - (sx - cv.width / DPR / 2) / cam.k; cam.across = ac - (sy - cv.height / DPR / 2 - 20) / cam.k;
}
cv.addEventListener('wheel', (ev) => { ev.preventDefault(); zoomAt(ev.clientX, ev.clientY, Math.exp(-ev.deltaY * 0.0015)); draw(); }, { passive: false });
window.addEventListener('resize', resize);

fromHash();
resize();
