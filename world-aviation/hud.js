'use strict';

// ============================================================
// World Aviation — the heads-up layer: messages, the QRH checklist
// panel, the contract strip, phase prompts, taxi guidance, the
// moving map and the cheat banner. DOM for the text panels, a
// small canvas for the map and the steering arrow.
// ============================================================

const HUD = {
  messages: [],
  mapOpen: false,
  bannerText: '',
  bannerT: 0,

  init() {
    this.box = el('hud');
    this.msgBox = el('messages');
    this.checklistBox = el('checklist');
    this.strip = el('strip');
    this.prompt = el('prompt');
    this.banner = el('banner');
    this.mapCanvas = el('mapCanvas');
    this.mapCtx = this.mapCanvas ? this.mapCanvas.getContext('2d') : null;
    this.arrow = el('taxiArrow');
  },

  reset() {
    this.messages = [];
    this.checklistKey = '';
    this.hideBanner();
    if (this.checklistBox) { this.checklistBox.hidden = true; this.checklistBox.innerHTML = ''; }
    if (this.msgBox) this.msgBox.innerHTML = '';
    this.msgKey = '';
  },

  // ---------- messages ----------
  push(msg) {
    const now = performance.now();
    const last = this.messages[this.messages.length - 1];
    if (last && last.text === msg.text && now - last.t < 3000) return;
    this.messages.push({ text: msg.text, kind: msg.id, t: now });
    while (this.messages.length > 5) this.messages.shift();
  },
  render() {
    if (!this.msgBox) return;
    const now = performance.now();
    this.messages = this.messages.filter((m) => now - m.t < 7000);
    const key = this.messages.map((m) => m.t).join(',');
    if (key !== this.msgKey) {
      this.msgKey = key;
      this.msgBox.innerHTML = this.messages.map((m) =>
        '<div class="msg ' + (m.kind === 'info' ? 'info' : 'warn') + '">' + esc(m.text) + '</div>').join('');
    }
    // fade the old ones out
    const nodes = this.msgBox.children;
    for (let i = 0; i < nodes.length && i < this.messages.length; i++) {
      nodes[i].style.opacity = clamp(1 - (now - this.messages[i].t - 5200) / 1800, 0.15, 1);
    }
  },

  // ---------- contract strip ----------
  updateStrip(fl, sys, res) {
    if (!this.strip) return;
    const c = fl.contract;
    if (!c) { this.strip.hidden = true; return; }
    this.strip.hidden = false;
    const left = res ? Math.max(0, res.deadline - fl.realElapsed) : 0;
    const late = res && fl.realElapsed > res.deadline;
    const fuelPct = clamp(fl.st.fuel / fl.ac.fuelCapKg, 0, 1);
    this.strip.innerHTML =
      '<div class="stripRow"><b>' + esc(c.client) + '</b><span>' + c.type.toUpperCase() + '</span></div>' +
      '<div class="stripRow big">' + c.fromId + ' → ' + c.toId + '</div>' +
      '<div class="stripRow"><span>' + (c.pax ? c.pax + ' pax · ' : '') + Math.round(c.payloadKg).toLocaleString('sv-SE') + ' kg</span>' +
      '<span>' + Math.round(c.distanceNm) + ' nm</span></div>' +
      '<div class="stripRow"><span>FUEL ' + Math.round(fl.st.fuel) + '/' + fl.ac.fuelCapKg + ' kg</span>' +
      '<span class="' + (fuelPct < 0.15 ? 'bad' : '') + '">' + Math.round(fuelPct * 100) + '%</span></div>' +
      '<div class="stripRow"><span>PAY</span><b>' + fmtMoney(c.pay) + '</b></div>' +
      (res && Career.difficulty.id !== 'easy' ? '<div class="stripRow"><span>' + (late ? 'LATE BY' : 'TIME LEFT') + '</span><b class="' +
        (late ? 'bad' : (left < 60 ? 'warn' : 'good')) + '">' + fmtTime(late ? fl.realElapsed - res.deadline : left) + '</b></div>' : '');
  },

  // ---------- phase prompt ----------
  setPrompt(html) {
    if (!this.prompt) return;
    if (!html) { this.prompt.hidden = true; this.promptHtml = ''; return; }
    if (Input.isCoarse) html = touchPrompt(html);
    this.prompt.hidden = false;
    if (html !== this.promptHtml) { this.promptHtml = html; this.prompt.innerHTML = html; }
  },

  showBanner(text, kind, ms) {
    if (!this.banner) return;
    this.banner.hidden = false;
    this.banner.className = 'banner ' + (kind || '');
    this.banner.textContent = text;
    clearTimeout(this.bannerTimer);
    if (ms) this.bannerTimer = setTimeout(() => this.hideBanner(), ms);
  },
  hideBanner() { if (this.banner) this.banner.hidden = true; },

  // ---------- QRH checklist ----------
  // The buttons are rebuilt only when the checklist or its step changes, so a
  // click is never lost to a DOM swap; the timer is updated every frame.
  updateChecklist(sys, hint) {
    const box = this.checklistBox;
    if (!box) return;
    const c = sys && sys.checklist;
    if (!c) {
      if (!box.hidden) { box.hidden = true; box.innerHTML = ''; this.checklistKey = ''; }
      return;
    }
    const key = c.def.id + ':' + c.stepIndex;
    if (key !== this.checklistKey) {
      this.checklistKey = key;
      box.hidden = false;
      const step = c.def.steps[c.stepIndex];
      const buttons = c.def.steps.map((st, i) => {
        const done = i < c.stepIndex;
        const cur = i === c.stepIndex && hint;
        let extra = '';
        if (st.kind === 'setPower') extra = ' <b>' + Math.round(st.value * 100) + '%</b>';
        if (st.kind === 'setAlt') extra = ' <b>' + st.value.toLocaleString('en-US') + ' ft</b>';
        return '<button type="button" class="qrhStep' + (done ? ' done' : '') + (cur ? ' cur' : '') + '" data-step="' + i + '"' +
          (done ? ' disabled' : '') + '>' + (done ? '&#10003; ' : '') + esc(st.text) + extra + '</button>';
      });
      // without a hint the remaining steps are shuffled: you have to know the order
      const order = c.def.steps.map((st, i) => i);
      if (!hint) {
        const rng = makeRng(hashStr(c.def.id));
        const pending = rng.shuffle(order.filter((i) => i >= c.stepIndex));
        order.splice(c.stepIndex, pending.length, ...pending);
      }
      box.innerHTML =
        '<div class="qrhHead"><div class="qrhTitle">' + esc(c.def.title) + '</div>' +
        '<div class="qrhTimer"><div class="qrhBar"><i></i></div><span></span></div></div>' +
        '<div class="qrhSub">QRH &middot; ' + (hint ? 'work the steps top to bottom' : 'work the steps in the right order') + '</div>' +
        (hint && step ? '<div class="qrhHint">Next: ' + esc(step.text) + '</div>' : '') +
        order.map((i) => buttons[i]).join('');
      box.querySelectorAll('[data-step]').forEach((b) => {
        b.addEventListener('click', () => Game.doChecklistStep(parseInt(b.getAttribute('data-step'), 10)));
      });
    }
    const pct = clamp(c.timeLeft / c.limit, 0, 1);
    const bar = box.querySelector('.qrhBar i'), num = box.querySelector('.qrhTimer span');
    if (bar) { bar.style.width = (pct * 100) + '%'; bar.style.background = pct < 0.3 ? '#ff7a5c' : '#7de08a'; }
    if (num) num.textContent = Math.max(0, Math.ceil(c.timeLeft)) + ' s';
  },

  // ---------- taxi guidance ----------
  updateGuidance(fl, dt) {
    const elx = this.arrow;
    if (!elx) return;
    const guide = fl.guidance;
    if (!guide || !guide.visible) { elx.hidden = true; return; }
    elx.hidden = false;
    const rel = wrapDeg(guide.bearing - fl.headingDeg());
    elx.querySelector('svg').style.transform = 'rotate(' + rel + 'deg)';
    elx.classList.toggle('near', guide.dist < 90);
    const d = guide.dist;
    elx.querySelector('b').textContent = d >= NM * 2 ? Math.round(d / NM) + ' nm' : d > 999 ? (d / 1000).toFixed(1) + ' km' : Math.round(d) + ' m';
  },

  // ---------- map ----------
  toggleMap() {
    this.mapOpen = !this.mapOpen;
    const m = el('mapOverlay');
    if (m) m.hidden = !this.mapOpen;
    return this.mapOpen;
  },
  drawMap(fl, sys) {
    if (!this.mapOpen || !this.mapCtx) return;
    const cv = this.mapCanvas, g = this.mapCtx;
    const w = cv.width, h = cv.height;
    g.clearRect(0, 0, w, h);
    const from = fl.world, to = fl.arrival;
    const p0 = { x: from.x, z: from.z }, p1 = { x: to.x, z: to.z };
    const st = fl.st;
    // fit departure, arrival and the aeroplane
    const minX = Math.min(p0.x, p1.x, st.pos.x) - 20000;
    const maxX = Math.max(p0.x, p1.x, st.pos.x) + 20000;
    const minZ = Math.min(p0.z, p1.z, st.pos.z) - 20000;
    const maxZ = Math.max(p0.z, p1.z, st.pos.z) + 20000;
    const sc = Math.min(w / (maxX - minX), h / (maxZ - minZ));
    const X = (x) => (x - minX) * sc + (w - (maxX - minX) * sc) / 2;
    const Y = (z) => (z - minZ) * sc + (h - (maxZ - minZ) * sc) / 2;      // north (-z) is up
    // the coastline and the islands
    g.fillStyle = '#1d2a22';
    g.strokeStyle = '#35503f';
    g.lineWidth = 1;
    const near = (poly) => poly.some((p) => geoDistanceNm(p[1], p[0], Theatre.lat0, Theatre.lon0) < 3500);
    for (const poly of LAND_POLYGONS) {
      if (!near(poly)) continue;
      g.beginPath();
      poly.forEach((p, i) => {
        const q = Theatre.toWorld(p[1], p[0]);
        if (i) g.lineTo(X(q.x), Y(q.z)); else g.moveTo(X(q.x), Y(q.z));
      });
      g.closePath(); g.fill(); g.stroke();
    }
    g.fillStyle = '#0b1420';
    for (const poly of WATER_POLYGONS) {
      if (!near(poly)) continue;
      g.beginPath();
      poly.forEach((p, i) => {
        const q = Theatre.toWorld(p[1], p[0]);
        if (i) g.lineTo(X(q.x), Y(q.z)); else g.moveTo(X(q.x), Y(q.z));
      });
      g.closePath(); g.fill();
    }
    // other airports
    for (const a of World.airports) {
      if (a === from || a === to) continue;
      g.fillStyle = '#6b7c8c';
      g.fillRect(X(a.x) - 2, Y(a.z) - 2, 4, 4);
      g.font = '500 10px system-ui, sans-serif';
      g.textAlign = 'left';
      g.fillText(a.id, X(a.x) + 4, Y(a.z) + 3);
    }
    // route
    g.strokeStyle = '#3d6f9c';
    g.lineWidth = 2;
    g.setLineDash([7, 6]);
    g.beginPath(); g.moveTo(X(p0.x), Y(p0.z)); g.lineTo(X(p1.x), Y(p1.z)); g.stroke();
    g.setLineDash([]);
    // flown part
    g.strokeStyle = '#54d68a';
    g.beginPath(); g.moveTo(X(p0.x), Y(p0.z)); g.lineTo(X(st.pos.x), Y(st.pos.z)); g.stroke();
    // airports
    const dot = (p, label, colour, r) => {
      g.fillStyle = colour;
      g.beginPath(); g.arc(X(p.x), Y(p.z), r, 0, TAU); g.fill();
      g.fillStyle = '#dfe7ee';
      g.font = '600 12px system-ui, sans-serif';
      g.textAlign = 'center';
      g.fillText(label, X(p.x), Y(p.z) - r - 5);
    };
    dot(p0, from.id, '#ffd54a', 5);
    dot(p1, to.id, '#7de08a', 5);
    // aircraft
    g.save();
    g.translate(X(st.pos.x), Y(st.pos.z));
    g.rotate(fl.headingDeg() * DEG);
    g.fillStyle = '#ff8a5c';
    g.beginPath();
    g.moveTo(0, -9); g.lineTo(7, 7); g.lineTo(0, 3); g.lineTo(-7, 7);
    g.closePath(); g.fill();
    g.restore();
    // scale bar, in real nautical miles (the world is drawn compressed by WORLD.SCALE)
    const pxPerNm = sc * NM * WORLD.SCALE;
    const nm = [10, 25, 50, 100, 250, 500, 1000].find((v) => v * pxPerNm > 60) || 1000;
    g.strokeStyle = '#8d99a6'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(20, h - 20); g.lineTo(20 + nm * pxPerNm, h - 20); g.stroke();
    g.fillStyle = '#8d99a6';
    g.font = '600 11px system-ui, sans-serif';
    g.textAlign = 'left';
    g.fillText(nm + ' nm', 22, h - 26);
  }
};

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// On a touch screen the prompts name the on-screen buttons instead of the keys
const TOUCH_KEYS = [
  ['<kbd>Enter</kbd>', '<b>Go</b>'], ['<kbd>Space</kbd>', '<b>Park</b>'], ['<kbd>G</kbd>', '<b>Gear</b>'],
  ['<kbd>F</kbd>', '<b>Flap +</b>'], ['<kbd>V</kbd>', '<b>Flap −</b>'], ['<kbd>B</kbd>', '<b>Brake</b>'],
  ['<kbd>Y</kbd>', '<b>AP</b>'], ['<kbd>T</kbd>', '<b>Time</b>'], ['<kbd>9</kbd>', 'throttle slider up'],
  ['<kbd>0</kbd>', 'throttle slider down'], ['<kbd>1</kbd>–<kbd>3</kbd>', 'a little throttle'],
  ['<kbd>←</kbd><kbd>→</kbd>', 'the stick'], ['<kbd>↓</kbd>', 'stick down'], [', spoiler <kbd>R</kbd>', '']
];
function touchPrompt(html) {
  for (const [k, t] of TOUCH_KEYS) html = html.split(k).join(t);
  return html.replace(/<kbd>[^<]*<\/kbd>/g, '');
}
