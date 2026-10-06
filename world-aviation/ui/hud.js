'use strict';

// ============================================================
// World Aviation — the heads-up layer: messages, the QRH checklist
// panel, the contract strip, phase prompts, taxi guidance, the
// moving map (big, or a mini map in the corner of a large desktop
// screen) and the cheat banner. DOM for the text panels, canvases
// for the maps.
// ============================================================

const HUD = {
  messages: [],
  mapOpen: false,          // the big map overlay
  miniWanted: true,        // the mini map in the corner (large desktop screens only), remembered
  promptCollapsed: false,  // touch screens: the prompt folded to one line by a tap
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
    this.mini = el('miniMap');
    try { this.miniWanted = localStorage.getItem('worldAviation.miniMap') !== 'off'; } catch (e) { /* storage blocked */ }
    // on a touch screen a tap folds the prompt to its first line, and opens it again
    if (this.prompt) this.prompt.addEventListener('pointerdown', (e) => { e.stopPropagation(); this.togglePrompt(); });
    // and a tap anywhere on the big map closes it (it covers the buttons, the Map one too)
    const mo = el('mapOverlay');
    if (mo) mo.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); this.closeMap(); });
  },

  reset() {
    this.messages = [];
    this.checklistKey = '';
    this.stripKey = '';
    this.hideBanner();
    if (this.checklistBox) { this.checklistBox.hidden = true; this.checklistBox.innerHTML = ''; }
    if (this.msgBox) this.msgBox.innerHTML = '';
    this.msgKey = '';
  },

  // ---------- messages ----------
  push(msg) {
    // the warning's cause is put right: take it off the screen now
    if (msg.id === 'clear') { this.messages = this.messages.filter((m) => m.kind !== msg.clear); return; }
    const now = performance.now();
    const last = this.messages[this.messages.length - 1];
    if (last && last.text === msg.text && now - last.t < 3000) return;
    this.messages.push({ text: msg.text, kind: msg.id, t: now });
    while (this.messages.length > 5) this.messages.shift();
  },
  render() {
    if (!this.msgBox) return;
    const now = performance.now();
    // touch screens: the messages fit between the left column and the buttons, whatever their width
    if (Input.isCoarse && this.box && (this.btnN = (this.btnN || 0) + 1) % 30 === 1) {
      const tb = el('touchButtons');
      this.buttonsW = tb ? tb.offsetWidth : 0;
      if (this.buttonsW) this.box.style.setProperty('--buttonsW', this.buttonsW + 'px');
    }
    this.messages = this.messages.filter((m) => now - m.t < 7000);
    const key = this.messages.map((m) => m.t).join(',');
    if (key !== this.msgKey) {
      this.msgKey = key;
      this.msgBox.innerHTML = this.messages.map((m) =>
        '<div class="msg ' + (m.kind === 'info' ? 'info' : 'warn') + '">' + keysHtml(Units.text(m.text)) + '</div>').join('');
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
    // the route, the airports with their countries and the expected flight time: built once a
    // flight (the flags are images), the live figures under it whenever they change
    const key = c.id + '|' + I18N.lang + '|' + Units.metric + '|' + !!fl.practice;
    if (this.stripKey !== key) {
      this.stripKey = key;
      const apt = (id) => {
        const a = World.byId[id];
        return '<div class="stripApt">' + (typeof flagImg === 'function' ? flagImg(a) : '') + '<b>' + a.id + '</b> ' + esc(a.name) +
          ' · <span>' + esc(tr(a.country)) + '</span></div>';
      };
      this.strip.innerHTML =
        (fl.practice ? '<div class="stripRow big"><span class="good">' + tr('PRACTICE LANDING') + '</span></div>' : '') +
        '<div class="stripRow"><b>' + esc(c.client) + '</b><span>' + esc(tr(PAYLOAD[c.type] ? PAYLOAD[c.type].name : c.type).toUpperCase()) + '</span></div>' +
        '<div class="stripRow big">' + c.fromId + ' → ' + c.toId + '</div>' +
        apt(c.fromId) + apt(c.toId) +
        '<div class="stripRow"><span>' + (c.pax ? tr('{n} pax', { n: c.pax }) + ' · ' : '') + Math.round(c.payloadKg).toLocaleString('sv-SE') + ' kg</span>' +
        '<span>' + Units.dist(c.distanceNm) + '</span></div>' +
        '<div class="stripRow"><span>' + tr('FLIGHT TIME') + '</span><span>' + fmtDuration(c.blockMin) + '</span></div>' +
        '<div class="stripLive"></div>';
      this.stripLive = this.strip.querySelector('.stripLive');
      this.stripLiveHtml = '';
    }
    const left = res ? Math.max(0, res.deadline - fl.realElapsed) : 0;
    const late = res && fl.realElapsed > res.deadline;
    const fuelPct = clamp(fl.st.fuel / fl.ac.fuelCapKg, 0, 1);
    const html =
      '<div class="stripRow"><span>' + tr('FUEL') + ' ' + Math.round(fl.st.fuel) + '/' + fl.ac.fuelCapKg + ' kg</span>' +
      '<span class="' + (fuelPct < 0.15 ? 'bad' : '') + '">' + Math.round(fuelPct * 100) + '%</span></div>' +
      '<div class="stripRow"><span>' + tr('PAY') + '</span><b>' + fmtMoney(c.pay) + '</b></div>' +
      '<div class="stripRow"><span>' + tr('LOCAL TIME') + '</span><span>' + fmtClock(((fl.env.hour0 || 12) * 3600 + fl.elapsed) % 86400) + '</span></div>' +
      (res && Career.difficulty.id !== 'easy' ? '<div class="stripRow"><span>' + tr(late ? 'LATE BY' : 'TIME LEFT') + '</span><b class="' +
        (late ? 'bad' : (left < 60 ? 'warn' : 'good')) + '">' + fmtTime(late ? fl.realElapsed - res.deadline : left) + '</b></div>' : '');
    if (this.stripLive && html !== this.stripLiveHtml) { this.stripLiveHtml = html; this.stripLive.innerHTML = html; }
  },

  // ---------- phase prompt ----------
  setPrompt(html) {
    if (!this.prompt) return;
    if (!html) { this.prompt.hidden = true; this.promptHtml = ''; return; }
    if (Input.isCoarse) html = touchPrompt(html);
    html = Units.text(html);
    this.prompt.hidden = false;
    if (html !== this.promptHtml) {
      this.promptHtml = html;
      // the first line stays when the prompt is folded
      const i = html.indexOf('<br>');
      this.prompt.innerHTML = i < 0 ? html : html.slice(0, i) + '<span class="more">' + html.slice(i) + '</span>';
    }
  },
  // touch screens only: folded, the prompt shows its first line; a new phase unfolds it
  togglePrompt(open) {
    if (!this.prompt || !Input.isCoarse) return;
    this.promptCollapsed = open === undefined ? !this.promptCollapsed : !open;
    this.prompt.classList.toggle('collapsed', this.promptCollapsed);
  },
  expandPrompt() { if (this.promptCollapsed) this.togglePrompt(true); },

  showBanner(text, kind, ms) {
    if (!this.banner) return;
    this.banner.hidden = false;
    this.banner.className = 'banner ' + (kind || '');
    this.banner.textContent = Units.text(text);
    clearTimeout(this.bannerTimer);
    if (ms) this.bannerTimer = setTimeout(() => this.hideBanner(), ms);
  },
  hideBanner() { if (this.banner) this.banner.hidden = true; },

  // ---------- QRH checklist ----------
  // The emergency, what it is, and its steps top to bottom. Each step shows the control that
  // works it (Enter for the QRH switches, the real controls for the rest); the current one is
  // lit, and with checklist hints it says why. Once done or failed, the result stays a while.
  // The panel is rebuilt only when something in it changes, so a tap is never lost to a DOM
  // swap; the timer is updated every frame.
  updateChecklist(sys, hint) {
    const box = this.checklistBox;
    if (!box) return;
    const c = sys && sys.checklist;
    const fl = sys && sys.flight;
    const out = !c && sys && sys.outcome && fl && fl.realElapsed - sys.outcome.t < QRH.OUTCOME_SEC ? sys.outcome : null;
    if (!c && !out) {
      if (!box.hidden) { box.hidden = true; box.innerHTML = ''; this.checklistKey = ''; }
      return;
    }
    const nudge = this.nudge && performance.now() - this.nudge.t < 2600 ? this.nudge.text : '';
    const key = c ? c.def.id + ':' + c.stepIndex + ':' + c.steps.length + ':' + (c.okT > 0) + ':' + nudge + ':' + hint
      : 'out:' + out.t;
    if (key !== this.checklistKey) {
      this.checklistKey = key;
      box.hidden = false;
      box.classList.toggle('qrhDone', !c && out.ok);
      box.classList.toggle('qrhLost', !c && !out.ok);
      if (!c) {
        box.innerHTML = '<div class="qrhTitle">' + (out.ok ? '&#10003; ' : '&#10007; ') + esc(tr(out.title)) + '</div>' +
          (out.ok ? '<div class="qrhSub">' + tr('Checklist complete in {a} s of {b} s', { a: out.used, b: out.limit }) + '</div>' : '') +
          '<div class="qrhWhat">' + esc(Units.text(sys.qrhText(tr(out.text), out))) + '</div>';
        return;
      }
      const coarse = Input.isCoarse;
      const rows = c.steps.map((st, i) => {
        const done = i < c.stepIndex || (i === c.stepIndex && c.okT > 0);
        const cur = i === c.stepIndex && !done;
        const cls = 'qrhStep' + (done ? ' done' : cur ? ' cur' : ' later');
        return '<button type="button" class="' + cls + '" data-step="' + i + '"' + (done ? ' disabled' : '') + '>' +
          '<span class="qrhN">' + (done ? '&#10003;' : i + 1) + '</span>' +
          '<span class="qrhT">' + esc(Units.text(sys.qrhText(tr(st.text)))) + '</span>' +
          '<kbd>' + esc(this.qrhControl(st, true, coarse)) + '</kbd>' +
          (cur && hint && st.why ? '<span class="qrhWhy">' + esc(tr(st.why)) + '</span>' : '') +
          '</button>';
      }).join('');
      box.innerHTML =
        '<div class="qrhHead"><div class="qrhTitle">' + esc(tr(c.def.title)) + '</div>' +
        '<div class="qrhTimer"><div class="qrhBar"><i></i></div><span></span></div></div>' +
        '<div class="qrhWhat">' + esc(Units.text(sys.qrhText(tr(c.def.what || '')))) + '</div>' +
        rows +
        (nudge ? '<div class="qrhNudge">' + esc(nudge) + '</div>'
          : '<div class="qrhSub">' + tr(coarse ? 'Tap the lit switch (or Go); the other steps tick when you use the control shown.'
            : '<kbd>Enter</kbd> works the lit switch; the other steps tick when you use the control shown.') + '</div>');
      box.querySelectorAll('[data-step]').forEach((b) => {
        b.addEventListener('click', () => Game.doChecklistStep(parseInt(b.getAttribute('data-step'), 10)));
      });
    }
    if (!c) return;
    const pct = clamp(c.timeLeft / c.limit, 0, 1);
    const bar = box.querySelector('.qrhBar i'), num = box.querySelector('.qrhTimer span');
    if (bar) { bar.style.width = (pct * 100) + '%'; bar.style.background = pct < 0.3 ? '#ff7a5c' : '#7de08a'; }
    if (num) num.textContent = Math.max(0, Math.ceil(c.timeLeft)) + ' s';
  },
  // a short line in the checklist panel: a wrong key, or a step that wants a control
  nudgeChecklist(text) { this.nudge = { text, t: performance.now() }; },
  // the control that works a checklist step: short (the badge) or as a phrase
  qrhControl(step, short, coarse) {
    if (coarse === undefined) coarse = Input.isCoarse;
    const pct = Math.round((step.value || 0) * 100);
    const p = { pct, d: Math.round(pct / 10) };
    const T = {
      switch: ['Enter', 'tap', 'press Enter', 'tap the step'],
      setAlt: ['Enter', 'tap', 'press Enter', 'tap the step'],
      setAltBy: ['Enter', 'tap', 'press Enter', 'tap the step'],
      idle: ['0', 'THR ▼', 'press 0 — thrust to idle', 'pull the throttle slider all the way down'],
      thrustMax: ['{d}', 'THR {pct}%', 'press {d} or lower — thrust {pct} %', 'throttle slider to {pct} % or less'],
      thrustMin: ['9', 'THR ▲', 'press 9 — full thrust', 'push the throttle slider all the way up'],
      antiIce: ['K', 'Ice', 'press K — anti-ice', 'the Ice button'],
      gearDown: ['G', 'Gear', 'press G — gear lever', 'the Gear button'],
      spoiler: ['/', 'Spoiler', 'press / — speed brake', 'the Spoiler button'],
      apOff: ['Y', 'AP', 'press Y — autopilot off', 'the AP button'],
      parkBrake: ['Space', 'Park', 'press Space — parking brake', 'the Park button'],
      climb: ['↓', 'stick ▼', 'hold ↓ — pull the nose up', 'drag the stick down — nose up'],
      slowVne: ['speed', 'speed', 'wait for the speed to drop', 'wait for the speed to drop']
    }[step.kind] || ['Enter', 'tap', 'press Enter', 'tap the step'];
    return tr(T[(short ? 0 : 2) + (coarse ? 1 : 0)], p);
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
    elx.querySelector('b').textContent = d >= NM * 2 ? Units.dist(d / NM) : d > 999 ? (d / 1000).toFixed(1) + ' km' : Math.round(d) + ' m';
  },

  // ---------- map ----------
  // A large desktop window keeps a mini map in the top right corner; M cycles
  // mini -> big -> off -> mini. Elsewhere M opens and closes the big map.
  bigScreen() {
    return !Input.isCoarse && window.innerWidth >= CONTROLS.MINIMAP_MIN_W && window.innerHeight >= CONTROLS.MINIMAP_MIN_H;
  },
  toggleMap() {
    if (this.bigScreen()) {
      if (this.mapOpen) { this.mapOpen = false; this.miniWanted = false; }
      else if (this.miniWanted) this.mapOpen = true;
      else this.miniWanted = true;
      try { localStorage.setItem('worldAviation.miniMap', this.miniWanted ? 'on' : 'off'); } catch (e) { /* storage blocked */ }
    } else this.mapOpen = !this.mapOpen;
    this.showMapOverlay();
    return this.mapOpen;
  },
  closeMap() { this.mapOpen = false; this.showMapOverlay(); },
  showMapOverlay() {
    const m = el('mapOverlay');
    if (!m) return;
    m.hidden = !this.mapOpen;
    const hint = m.querySelector('p');
    if (hint) hint.innerHTML = tr('Moving map &middot; north up') + ' &middot; ' +
      tr(Input.isCoarse ? 'tap anywhere to close' : this.bigScreen() ? '<kbd>M</kbd> to hide' : '<kbd>M</kbd> to close');
  },
  // the mini map is there when it helps and gone when it would be in the way: in the air,
  // not during a checklist, not on the last 1 000 ft of the approach
  updateMini(fl, sys, helpOpen) {
    const cv = this.mini;
    if (!cv) return;
    const st = fl.st;
    const show = this.bigScreen() && this.miniWanted && !this.mapOpen && !helpOpen && !st.onGround &&
      fl.phase !== 'TAKEOFF' && !(sys && sys.checklist) && !(fl.phase === 'APPROACH' && fl.altAgl() < 1000 * FT);
    if (cv.hidden === show) cv.hidden = !show;
    if (!show) return;
    const now = performance.now();
    if (now - (this.miniT || 0) < 1000 / CONTROLS.MINIMAP_FPS) return;
    this.miniT = now;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    const g = this.miniCtx || (this.miniCtx = cv.getContext('2d'));
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.paintMap(g, w, h, fl, true);
  },
  drawMap(fl, sys) {
    if (!this.mapOpen || !this.mapCtx) return;
    const cv = this.mapCanvas;
    this.paintMap(this.mapCtx, cv.width, cv.height, fl, false);
  },
  paintMap(g, w, h, fl, mini) {
    g.clearRect(0, 0, w, h);
    const from = fl.world, to = fl.arrival;
    const p0 = { x: from.x, z: from.z }, p1 = { x: to.x, z: to.z };
    const st = fl.st;
    // What the map frames. The big map: departure, arrival and the aeroplane. The mini map
    // follows the flight: the whole route for the first half, then only the aeroplane, the
    // arrival and its final approach, so the map zooms in as you get closer and the runway
    // and its arrow stay big enough to read; it glides from one framing to the next.
    const fin = World.at(to, -to.half - 12 * NM, 0);
    const pts = [p1, st.pos];
    if (!mini || fl.distToDestNm() > fl.routeNm() * 0.5) pts.push(p0);
    if (mini) pts.push(fin);
    const bx0 = Math.min(...pts.map((p) => p.x)), bx1 = Math.max(...pts.map((p) => p.x));
    const bz0 = Math.min(...pts.map((p) => p.z)), bz1 = Math.max(...pts.map((p) => p.z));
    const pad = mini ? Math.max(3000, Math.max(bx1 - bx0, bz1 - bz0) * 0.12) : 20000;
    const want = [bx0 - pad, bx1 + pad, bz0 - pad, bz1 + pad];
    let b = want;
    if (mini) {
      const cur = this.miniBox && this.miniBoxFlight === fl ? this.miniBox : want;
      b = cur.map((v, i) => v + (want[i] - v) * 0.15);
      this.miniBox = b; this.miniBoxFlight = fl;
    }
    const [minX, maxX, minZ, maxZ] = b;
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
      if (mini) continue;
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
    // the track flown so far: yellow on the ground, green in the air, up to the aeroplane
    const track = fl.track || [];
    g.lineWidth = 2.5;
    g.lineJoin = 'round'; g.lineCap = 'round';
    for (let i = 1; i <= track.length; i++) {
      const a = track[i - 1], b = i < track.length ? track[i] : { x: st.pos.x, z: st.pos.z, air: !st.onGround };
      g.strokeStyle = a.air || b.air ? '#54d68a' : '#ffd54a';
      g.beginPath(); g.moveTo(X(a.x), Y(a.z)); g.lineTo(X(b.x), Y(b.z)); g.stroke();
    }
    // the arrival runway and its final approach: the extended centreline out to 12 nm, an
    // arrow flying down it towards the threshold, and the runway number
    {
      const fin = World.at(to, -to.half - 12 * NM, 0), thr = World.at(to, -to.half, 0), end = World.at(to, to.half, 0);
      const fx = X(fin.x), fy = Y(fin.z), tx = X(thr.x), ty = Y(thr.z);
      const len = Math.hypot(tx - fx, ty - fy) || 1, ux = (tx - fx) / len, uy = (ty - fy) / len;
      g.strokeStyle = 'rgba(230,92,240,0.85)'; g.lineWidth = mini ? 1.5 : 2;
      g.setLineDash([5, 4]);
      g.beginPath(); g.moveTo(fx, fy); g.lineTo(tx, ty); g.stroke();
      g.setLineDash([]);
      // the runway itself, at least a few pixels long
      const rl = Math.max(mini ? 7 : 10, Math.hypot(X(end.x) - tx, Y(end.z) - ty));
      g.strokeStyle = '#f2f5f8'; g.lineWidth = mini ? 3 : 4;
      g.beginPath(); g.moveTo(tx, ty); g.lineTo(tx + ux * rl, ty + uy * rl); g.stroke();
      // the arrow in the middle of the final, pointing the way you land
      const ax = fx + ux * len * 0.55, ay = fy + uy * len * 0.55, s = mini ? 6 : 8;
      g.fillStyle = '#e65cf0';
      g.beginPath();
      g.moveTo(ax + ux * s, ay + uy * s);
      g.lineTo(ax - ux * s - uy * s * 0.7, ay - uy * s + ux * s * 0.7);
      g.lineTo(ax - ux * s + uy * s * 0.7, ay - uy * s - ux * s * 0.7);
      g.closePath(); g.fill();
      if (len > 30) {
        g.fillStyle = '#f0c8fa';
        g.font = (mini ? '600 10px' : '600 11px') + ' system-ui, sans-serif';
        g.textAlign = 'center';
        g.fillText('RWY ' + to.rwyName, fx - ux * 12, fy - uy * 12 + 4);
      }
    }
    // airports
    const dot = (p, label, colour, r) => {
      g.fillStyle = colour;
      g.beginPath(); g.arc(X(p.x), Y(p.z), r, 0, TAU); g.fill();
      g.fillStyle = '#dfe7ee';
      g.font = mini ? '600 11px system-ui, sans-serif' : '600 12px system-ui, sans-serif';
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
    if (mini) {
      // instead of a scale bar: how far to go
      g.fillStyle = '#c8d4df';
      g.font = '600 11px system-ui, sans-serif';
      g.textAlign = 'right';
      g.fillText(tr('{d} to {id}', { d: Units.dist(fl.distToDestNm()), id: to.id }), w - 8, h - 8);
      return;
    }
    // scale bar, in real nautical miles (world metres are WORLD.SCALE real metres)
    const pxPerUnit = sc * WORLD.SCALE * (Units.metric ? 1000 : NM);     // real km or nm
    const len = [10, 25, 50, 100, 250, 500, 1000, 2000].find((v) => v * pxPerUnit > 60) || 2000;
    g.strokeStyle = '#8d99a6'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(20, h - 20); g.lineTo(20 + len * pxPerUnit, h - 20); g.stroke();
    g.fillStyle = '#8d99a6';
    g.font = '600 11px system-ui, sans-serif';
    g.textAlign = 'left';
    g.fillText(len + (Units.metric ? ' km' : ' nm'), 22, h - 26);
  }
};

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// On a touch screen the prompts name the on-screen buttons instead of the keys
// (the button names as on the buttons, in the game's language)
const TOUCH_KEYS = [
  ['<kbd>Enter</kbd>', 'Go', 1], ['<kbd>Space</kbd>', 'Park', 1], ['<kbd>G</kbd>', 'Gear', 1],
  ['<kbd>F</kbd>', 'Flap +', 1], ['<kbd>V</kbd>', 'Flap −', 1], ['<kbd>B</kbd>', 'Brake', 1],
  ['<kbd>Y</kbd>', 'AP', 1], ['<kbd>N</kbd>', 'NAV', 1], ['<kbd>K</kbd>', 'Ice', 1], ['<kbd>M</kbd>', 'Map', 1], ['<kbd>C</kbd>', 'View', 1],
  ['<kbd>T</kbd>', 'Time +', 1], ['<kbd>R</kbd>', 'Time −', 1], ['<kbd>9</kbd>', 'throttle slider up'],
  ['<kbd>0</kbd>', 'throttle slider down'], ['<kbd>1</kbd>–<kbd>3</kbd>', 'a little throttle'],
  ['<kbd>←</kbd><kbd>→</kbd>', 'the stick'], ['<kbd>↓</kbd>', 'stick down'], ['<kbd>/</kbd>', 'Spoiler', 1]
];
// a message is plain text with the keys in <kbd>: escaped, the keys kept (on a touch screen
// swapped for the button names)
function keysHtml(text) {
  const html = esc(text).replace(/&lt;kbd&gt;(.*?)&lt;\/kbd&gt;/g, '<kbd>$1</kbd>');
  return Input.isCoarse ? touchPrompt(html) : html;
}
function touchPrompt(html) {
  for (const [k, t, btn] of TOUCH_KEYS) html = html.split(k).join(btn ? '<b>' + tr(t) + '</b>' : tr(t));
  return html.replace(/<kbd>[^<]*<\/kbd>/g, '');
}
