'use strict';

// ============================================================
// World Aviation — the instrument panel, drawn with Canvas 2D on
// the overlay canvas: airspeed tape with V-speeds, attitude
// indicator with the radio altitude, altimeter with the selected altitude bug, heading
// indicator with the route, VSI, engine gauges and the warning
// lights. Everything is vector-drawn so it stays sharp at any size.
// ============================================================

// on a touch screen the thrust lever (#throttleZone in styles.css: 62 px wide, 8 px from the
// edge) stands on the right edge of the panel: the gauges keep out of this many pixels
const PHONE_THROTTLE_W = 78;
// held upright the round gauges are this share of the size that would fill the panel's width
const PHONE_UPRIGHT_GAUGES = 0.8;

const Instruments = {
  ctx: null, w: 0, h: 0, dpr: 1,
  light: CONTROLS.INSTRUMENT_LIGHTS.length - 1,   // the instrument lights: an index into CONTROLS.INSTRUMENT_LIGHTS (bright), past its end the panel is hidden

  get bright() { return CONTROLS.INSTRUMENT_LIGHTS[this.light] || 0; },
  get hidden() { return this.light >= CONTROLS.INSTRUMENT_LIGHTS.length; },
  // I: dim → medium → bright → hidden → dim
  nextLight() { this.light = (this.light + 1) % (CONTROLS.INSTRUMENT_LIGHTS.length + 1); },
  // a phone held upright: the radius of its four round gauges (two by two left of the thrust
  // lever); the panel is made as tall as they need (Cockpit.panelTop)
  uprightR(w, h) {
    return Math.min((w - PHONE_THROTTLE_W - 6) / 4.3, (Math.min(h * 0.42, 360) - 36) / 4.3, 92) * PHONE_UPRIGHT_GAUGES;
  },

  // a phone or a small window: no engine gauges and no heading strip, the configuration smaller
  compact(w, h) { return w < 760 || h < 560; },

  draw(ctx, w, h, dpr, fl, sys) {
    if (this.hidden) return;
    this.ctx = ctx; this.w = w; this.h = h; this.dpr = dpr;
    const st = fl.st, ac = fl.ac;
    const compact = this.compact(w, h);
    const top = Cockpit.panelTop(h);
    const panelH = h - top;
    ctx.save();
    ctx.scale(dpr, dpr);

    // panel background
    const g = ctx.createLinearGradient(0, top, 0, h);
    g.addColorStop(0, '#2a2f36');
    g.addColorStop(0.06, '#1b1f25');
    g.addColorStop(1, '#12151a');
    ctx.fillStyle = g;
    ctx.fillRect(0, top, w, panelH);
    ctx.strokeStyle = '#454d57';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, top + 0.5); ctx.lineTo(w, top + 0.5); ctx.stroke();

    // blocks: engines on the left, the configuration (with the caution lights under it) on the
    // right, the round gauges in a row in the space between
    const y = top + panelH * 0.52;
    if (!compact) {
      // (on a tablet the configuration moves left of the thrust lever)
      const engW = 160, cfgW = 160;
      const cfgX = w - 12 - cfgW - (Input.isCoarse ? PHONE_THROTTLE_W - 8 : 0);
      const c0 = 12 + engW + 10, c1 = cfgX - 10;
      const cx = (c0 + c1) / 2;
      const r = Math.min(panelH * 0.4, (c1 - c0) / 8.96, 100);
      this.tc(ctx, cx - 3.86 * r, y, r * 0.62, fl);
      this.asi(ctx, cx - 2.12 * r, y, r, fl);
      this.adi(ctx, cx, y, r, fl);
      this.alt(ctx, cx + 2.12 * r, y, r, fl);
      this.vsi(ctx, cx + 3.86 * r, y, r * 0.62, fl);
      this.engines(ctx, 12, top + 10, engW, panelH - 20, fl, sys);
      this.config(ctx, cfgX, top + 10, cfgW, panelH - 20, fl, sys);
      this.hsi(ctx, cx, top - 22, Math.min(w * 0.5, 460), 24, fl, sys);
    } else if (Cockpit.portrait(w, h)) {
      // a phone held upright: the configuration on one line, the four gauges two by two, and
      // the right edge left to the thrust lever (the touch slider sits over it)
      // (no heading strip on a phone: the taxi arrow, the map and the route marker do its job)
      const lineH = 20;
      this.configLine(ctx, 8, top + 6, w - 16, lineH, fl, sys);
      const x0 = 6, x1 = w - PHONE_THROTTLE_W, y0 = top + 10 + lineH, y1 = h - 6;
      const r = this.uprightR(w, h);
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, d = r * 1.08;
      this.asi(ctx, cx - d, cy - d, r, fl);
      this.adi(ctx, cx + d, cy - d, r, fl);
      this.alt(ctx, cx - d, cy + d, r, fl);
      this.vsi(ctx, cx + d, cy + d, r, fl);
    } else if (Input.isCoarse) {
      // a phone on its side: the four gauges in a row between the configuration (what the
      // buttons do not show) and the thrust lever on the right edge
      const cfgW = 124;
      const c0 = 6 + cfgW + 6, c1 = w - PHONE_THROTTLE_W;
      const r = Math.min(panelH * 0.43, (c1 - c0) / 8.6, 90), s = 2.1 * r;
      const cx = (c0 + c1) / 2;
      this.asi(ctx, cx - 1.5 * s, y, r, fl);
      this.adi(ctx, cx - 0.5 * s, y, r, fl);
      this.alt(ctx, cx + 0.5 * s, y, r, fl);
      this.vsi(ctx, cx + 1.5 * s, y, r, fl);
      this.config(ctx, 6, top + 6, cfgW, panelH - 12, fl, sys, true);
    } else {
      // a small window on a computer
      const cfgW = 124;
      const c0 = 6 + cfgW + 6, c1 = w - 6;
      const r = Math.min(panelH * 0.43, (c1 - c0) / 7.6, 90);
      const cx = c0 + (c1 - c0) / 2 - 0.86 * r;
      this.asi(ctx, cx - 2.1 * r, y, r, fl);
      this.adi(ctx, cx, y, r, fl);
      this.alt(ctx, cx + 2.1 * r, y, r, fl);
      this.vsi(ctx, cx + 3.82 * r, y, r * 0.62, fl);
      this.config(ctx, 6, top + 6, cfgW, panelH - 12, fl, sys);
      this.hsi(ctx, w / 2, top - 18, Math.min(w * 0.62, 420), 22, fl, sys);
    }
    // instrument lights dimmed
    if (this.bright < 1) {
      ctx.fillStyle = 'rgba(0,0,0,' + (1 - this.bright) * CONTROLS.INSTRUMENT_DIM_DARK + ')';
      ctx.fillRect(0, top, w, panelH);
    }
    ctx.restore();
  },

  // ---------- helpers ----------
  // the case and the face; the name and the unit go where the dial has no ticks: `at` is their
  // centre as a fraction of the radius (default: the bottom of the face); with at.mid the name
  // and all the unit's lines together are centred on that height
  bezel(ctx, x, y, r, label, sub, at) {
    const lx = x + (at ? at.x : 0) * r;
    let ly = y + (at ? at.y : 0.82) * r;
    if (at && at.mid && label) {
      // the name's capitals reach about 0.1 r above its baseline, the unit's last line ends on its own
      const lines = sub ? String(sub).split('\n').length : 0;
      const top = ly - r * 0.1, bottom = lines ? ly + r * (0.13 + (lines - 1) * 0.12) : ly;
      ly -= (top + bottom) / 2 - ly;
    }
    ctx.save();
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
    g.addColorStop(0, '#23282f');
    g.addColorStop(1, '#0d1014');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#5c6773';
    ctx.lineWidth = Math.max(1.5, r * 0.035);
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
    ctx.strokeStyle = '#39414a';
    ctx.beginPath(); ctx.arc(x, y, r * 0.93, 0, TAU); ctx.stroke();
    if (label) {
      ctx.fillStyle = '#8d99a6';
      ctx.font = '600 ' + Math.round(r * 0.14) + 'px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, lx, ly);
    }
    if (sub) {
      ctx.fillStyle = '#6f7b88';
      ctx.font = '500 ' + Math.max(7, Math.round(r * 0.1)) + 'px system-ui, sans-serif';
      ctx.textAlign = 'center';
      // a long unit goes on two lines ("fpm" over "×1000")
      String(sub).split('\n').forEach((s, i) => ctx.fillText(s, lx, ly + r * (0.13 + i * 0.12)));
    }
    ctx.restore();
  },

  // ---------- airspeed ----------
  // The dial starts at zero (so the needle never sits on a number it is not showing), in knots
  // or km/h; the needle is pointed, its tip exactly on the speed.
  asi(ctx, x, y, r, fl) {
    const st = fl.st, ac = fl.ac;
    const k = Units.metric ? 1.852 : 1;
    const v = st.ias / KTS * k;
    this.bezel(ctx, x, y, r, 'AIRSPEED', Units.metric ? 'km/h' : 'kt', { x: 0, y: 0.7 });
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r * 0.93, 0, TAU); ctx.clip();
    ctx.translate(x, y);
    const a0 = 120 * DEG, a1 = 420 * DEG;
    const vmax = Units.metric ? Math.ceil(ac.vne * k * 1.1 / 100) * 100 : Math.ceil(ac.vne * 1.1 / 50) * 50;
    const ang = (s) => a0 + (a1 - a0) * clamp(s / vmax, 0, 1);
    // coloured arcs: white flap range, green normal range, amber caution, red line at Vne
    ctx.lineWidth = r * 0.07;
    ctx.strokeStyle = '#e6edf3';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.84, ang(fl.vsLanding() * k), ang(ac.flaps[0].vfe * k)); ctx.stroke();
    ctx.strokeStyle = '#4ac47f';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.76, ang(fl.vsNow() * k), ang(ac.vne * 0.9 * k)); ctx.stroke();
    ctx.strokeStyle = '#e8b13a';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.76, ang(ac.vne * 0.9 * k), ang(ac.vne * k)); ctx.stroke();
    ctx.strokeStyle = '#e0574a';
    ctx.lineWidth = r * 0.12;
    ctx.beginPath(); ctx.arc(0, 0, r * 0.78, ang(ac.vne * k), ang(ac.vne * k + vmax * 0.008)); ctx.stroke();
    // ticks every `minor`, a longer one every 2, a number every `label`
    const win = { w: r * 0.6, y: r * 0.24, h: r * 0.25 };             // the digital window, under the centre
    const minor = vmax <= 250 ? 10 : vmax <= 500 ? 20 : 50;
    const label = [20, 40, 50, 100, 200, 250].find((l) => l % minor === 0 && vmax / l <= (r < 70 ? 5 : 7)) || 200;
    ctx.strokeStyle = '#c8d2dc';
    ctx.fillStyle = '#c8d2dc';
    ctx.font = '600 ' + Math.max(8, Math.round(r * 0.15)) + 'px system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let s = 0; s <= vmax; s += minor) {
      const a = ang(s);
      const major = s % (minor * 2) === 0;
      ctx.lineWidth = major ? r * 0.035 : r * 0.018;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9);
      ctx.lineTo(Math.cos(a) * r * (major ? 0.77 : 0.83), Math.sin(a) * r * (major ? 0.77 : 0.83));
      ctx.stroke();
      if (s > 0 && s % label === 0 && r > 40) {
        // a number that would run into the digital window (the last one, near the red line) is left out
        const tx = Math.cos(a) * r * 0.6, ty = Math.sin(a) * r * 0.6;
        const hw = ctx.measureText(String(s)).width / 2 + r * 0.03, hh = r * 0.09;
        if (tx + hw > -win.w / 2 && tx - hw < win.w / 2 && ty + hh > win.y && ty - hh < win.y + win.h) continue;
        ctx.fillText(String(s), tx, ty);
      }
    }
    // V-speed bugs
    const bug = (s, color) => {
      ctx.save();
      ctx.rotate(ang(s * k));
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(r * 0.95, 0); ctx.lineTo(r * 0.72, -r * 0.07); ctx.lineTo(r * 0.72, r * 0.07);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    };
    bug(fl.vRef(), '#54d68a');
    bug(fl.vr(), '#7fc4ff');
    if (fl.ap.on && fl.ap.speed) bug(fl.ap.speed, '#e65cf0');
    // digital window (under the needle)
    ctx.fillStyle = '#05070a';
    ctx.strokeStyle = '#4c5561';
    ctx.lineWidth = 1;
    roundRect(ctx, -win.w / 2, win.y, win.w, win.h, 3);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7de08a';
    ctx.font = '700 ' + Math.round(r * 0.18) + 'px ui-monospace, monospace';
    ctx.fillText(String(Math.round(v)), 0, r * 0.37);
    // the true airspeed over the centre: high up the needle (IAS) reads far below it, and the
    // type's cruise speed in the hangar is a true airspeed
    if (r > 40 && st.tas / KTS > 30) {
      ctx.fillStyle = '#8fb8d8';
      ctx.font = '600 ' + Math.max(8, Math.round(r * 0.12)) + 'px system-ui, sans-serif';
      ctx.fillText('TAS ' + Math.round(st.tas / KTS * k), 0, -r * 0.3);
    }
    // the needle: pointed, the tip on the speed
    ctx.rotate(ang(v));
    pointer(ctx, r * 0.86, r * 0.045, r * 0.2, '#f5f7fa');
    ctx.fillStyle = '#0e1116';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.08, 0, TAU); ctx.fill();
    ctx.restore();
  },
  vs0(fl) {
    const st = fl.st, ac = fl.ac;
    const rho = fl.density(st.pos.y);
    const clMax = ac.clMaxFlap;
    return Math.sqrt(2 * fl.weight() * SIM.GRAVITY / (rho * ac.wingArea * clMax)) / KTS * 1.0;
  },

  // ---------- attitude ----------
  adi(ctx, x, y, r, fl) {
    const st = fl.st;
    this.bezel(ctx, x, y, r, 'ATTITUDE', null);
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r * 0.93, 0, TAU); ctx.clip();
    ctx.translate(x, y);
    ctx.rotate(-st.roll);
    const pitchPx = st.pitch / DEG * (r * 0.028);
    ctx.translate(0, pitchPx);
    // sky and ground
    ctx.fillStyle = '#3f7fbf';
    ctx.fillRect(-r * 2, -r * 3, r * 4, r * 3);
    ctx.fillStyle = '#6b4a2a';
    ctx.fillRect(-r * 2, 0, r * 4, r * 3);
    ctx.strokeStyle = '#f4f7fa'; ctx.lineWidth = Math.max(1.2, r * 0.02);
    ctx.beginPath(); ctx.moveTo(-r * 2, 0); ctx.lineTo(r * 2, 0); ctx.stroke();
    // pitch ladder
    ctx.strokeStyle = '#e6edf3';
    ctx.fillStyle = '#e6edf3';
    ctx.font = '600 ' + Math.round(r * 0.12) + 'px system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let p = -30; p <= 30; p += 5) {
      if (p === 0) continue;
      const yy = -p * r * 0.028;
      const w = (p % 10 === 0) ? r * 0.42 : r * 0.22;
      ctx.lineWidth = p % 10 === 0 ? r * 0.018 : r * 0.012;
      ctx.beginPath(); ctx.moveTo(-w, yy); ctx.lineTo(w, yy); ctx.stroke();
      if (p % 10 === 0 && r > 46) {
        ctx.fillText(String(Math.abs(p)), -w - r * 0.14, yy);
        ctx.fillText(String(Math.abs(p)), w + r * 0.14, yy);
      }
    }
    ctx.rotate(st.roll);
    ctx.translate(0, -pitchPx);
    // fixed aircraft symbol
    ctx.strokeStyle = '#ffd54a';
    ctx.lineWidth = Math.max(2, r * 0.045);
    ctx.beginPath();
    ctx.moveTo(-r * 0.42, 0); ctx.lineTo(-r * 0.16, 0);
    ctx.moveTo(r * 0.16, 0); ctx.lineTo(r * 0.42, 0);
    ctx.moveTo(-r * 0.16, 0); ctx.lineTo(0, r * 0.12);
    ctx.moveTo(r * 0.16, 0); ctx.lineTo(0, r * 0.12);
    ctx.stroke();
    ctx.restore();
    // bank scale
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = '#e6edf3';
    ctx.lineWidth = Math.max(1, r * 0.02);
    for (const a of [-60, -45, -30, -20, -10, 0, 10, 20, 30, 45, 60]) {
      const ang = (-90 + a) * DEG;
      const inner = (a % 30 === 0) ? r * 0.78 : r * 0.84;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * r * 0.93, Math.sin(ang) * r * 0.93);
      ctx.lineTo(Math.cos(ang) * inner, Math.sin(ang) * inner);
      ctx.stroke();
    }
    // roll pointer
    ctx.rotate(-st.roll);
    ctx.fillStyle = '#ffd54a';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.86); ctx.lineTo(-r * 0.05, -r * 0.76); ctx.lineTo(r * 0.05, -r * 0.76);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    this.radioAlt(ctx, x, y, r, fl);
  },

  // The radio altitude: the height of the wheels above the ground or the water right below,
  // where the eye is on the approach — under the aircraft symbol, like on a real PFD. It
  // appears below RADIO_ALT_MAX_FT in the air (the altimeter stays barometric, above the sea),
  // counts in finer steps close to the ground and turns amber below the decision height on
  // the way down to land.
  radioAlt(ctx, x, y, r, fl) {
    const st = fl.st;
    if (st.onGround) return;
    const agl = Math.max(0, fl.altAgl());
    if (agl / FT > SIM.RADIO_ALT_MAX_FT) return;
    let v;
    if (Units.metric) v = agl >= 20 ? Math.round(agl / 5) * 5 : Math.round(agl);
    else {
      const ft = agl / FT;
      v = ft >= 50 ? Math.round(ft / 10) * 10 : ft >= 10 ? Math.round(ft / 5) * 5 : Math.round(ft);
    }
    const landing = (fl.phase === 'APPROACH' || fl.phase === 'DESCENT') && st.vel.y < 0;
    const minimums = landing && agl / FT < SIM.DECISION_HEIGHT_FT;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(5,7,10,0.88)';
    ctx.strokeStyle = minimums ? '#ffb340' : '#4c5561';
    ctx.lineWidth = minimums ? Math.max(1.5, r * 0.025) : 1;
    roundRect(ctx, -r * 0.36, r * 0.36, r * 0.72, r * 0.26, 3);
    ctx.fill(); ctx.stroke();
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#8d99a6';
    ctx.font = '600 ' + Math.max(7, Math.round(r * 0.11)) + 'px system-ui, sans-serif';
    ctx.fillText('RA', -r * 0.32, r * 0.49);
    ctx.textAlign = 'right';
    ctx.fillStyle = minimums ? '#ffb340' : '#7de08a';
    ctx.font = '700 ' + Math.round(r * 0.19) + 'px ui-monospace, monospace';
    ctx.fillText(String(v), r * 0.32, r * 0.495);
    ctx.restore();
  },

  // ---------- altimeter ----------
  alt(ctx, x, y, r, fl) {
    const st = fl.st;
    const ft = Units.metric ? st.pos.y : st.pos.y / FT;          // the dial's unit: ft, or m
    this.bezel(ctx, x, y, r, 'ALT', Units.metric ? 'm' : 'ft', { x: 0, y: -0.33 });
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = '#c8d2dc';
    ctx.fillStyle = '#dfe7ee';
    ctx.font = '600 ' + Math.round(r * 0.2) + 'px system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let i = 0; i < 50; i++) {
      const a = i / 50 * TAU - Math.PI / 2;
      const major = i % 5 === 0;
      ctx.lineWidth = major ? r * 0.04 : r * 0.018;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9);
      ctx.lineTo(Math.cos(a) * r * (major ? 0.76 : 0.83), Math.sin(a) * r * (major ? 0.76 : 0.83));
      ctx.stroke();
      if (major && r > 40) ctx.fillText(String(i / 5), Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62);
    }
    // selected altitude bug on the rim, on the short (thousands) needle's scale: one turn is
    // 10 000 ft (or m), so the bug sits where the short needle will be when it gets there
    const sel = Units.metric ? fl.ap.alt * FT : fl.ap.alt;
    const sa = (sel % 10000) / 10000 * TAU - Math.PI / 2;
    ctx.fillStyle = '#e65cf0';
    ctx.beginPath();
    ctx.moveTo(Math.cos(sa) * r * 0.93, Math.sin(sa) * r * 0.93);
    ctx.lineTo(Math.cos(sa + 0.07) * r * 0.99, Math.sin(sa + 0.07) * r * 0.99);
    ctx.lineTo(Math.cos(sa - 0.07) * r * 0.99, Math.sin(sa - 0.07) * r * 0.99);
    ctx.closePath(); ctx.fill();
    // digital window, between the hub and the 4 / 5 / 6 so it hides none of them
    ctx.fillStyle = '#05070a';
    ctx.strokeStyle = '#4c5561';
    ctx.lineWidth = 1;
    roundRect(ctx, -r * 0.35, r * 0.11, r * 0.7, r * 0.27, 3);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7de08a';
    ctx.font = '700 ' + Math.round(r * 0.19) + 'px ui-monospace, monospace';
    ctx.fillText(String(Math.round(ft / 10) * 10), 0, r * 0.245);
    // needles: thousands (short, wide) and hundreds (long)
    const needle = (a, len, wid, col) => {
      ctx.save();
      ctx.rotate(a);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(-wid, r * 0.1); ctx.lineTo(0, -len); ctx.lineTo(wid, r * 0.1);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    };
    const pos = (v, turn) => (((v % turn) + turn) % turn) / turn * TAU;
    needle(pos(ft, 10000), r * 0.5, r * 0.07, '#c8d2dc');
    needle(pos(ft, 1000), r * 0.84, r * 0.035, '#f5f7fa');
    ctx.fillStyle = '#0e1116';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.07, 0, TAU); ctx.fill();
    ctx.restore();
  },

  // ---------- turn coordinator ----------
  tc(ctx, x, y, r, fl) {
    const st = fl.st;
    this.bezel(ctx, x, y, r, 'TURN', null);
    ctx.save();
    ctx.translate(x, y);
    const turnRate = (st.turnRate || 0) * RAD;
    ctx.fillStyle = '#f2f5f8';
    ctx.strokeStyle = '#8d99a6';
    ctx.lineWidth = r * 0.05;
    const g = clamp(turnRate / 3, -1.4, 1.4);
    const ang = -25 * DEG;
    ctx.beginPath(); ctx.arc(0, 0, r * 0.72, ang - 0.35, ang + 0.35); ctx.stroke();
    ctx.rotate(g);
    ctx.beginPath(); ctx.moveTo(0, -r * 0.2); ctx.lineTo(-r * 0.05, r * 0.55); ctx.lineTo(0, r * 0.42); ctx.lineTo(r * 0.05, r * 0.55);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8d99a6';
    ctx.font = '600 ' + Math.round(r * 0.22) + 'px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('L', -r * 0.62, r * 0.3);
    ctx.fillText('R', r * 0.62, r * 0.3);
    ctx.restore();
  },

  // ---------- VSI ----------
  // Zero at 3 o'clock, climb up and descent down, the full scale at ±150°; the ticks and the
  // numbers sit on the arc the needle swings on, so it reads true everywhere.
  vsi(ctx, x, y, r, fl) {
    const metric = Units.metric;
    const v = metric ? fl.st.vs : fl.st.vs / FPM;                 // m/s or fpm
    const vmax = metric ? 10 : 2000;
    const majors = metric ? [2, 4, 6, 8, 10] : [500, 1000, 1500, 2000];
    const minor = metric ? 1 : 250;
    this.bezel(ctx, x, y, r, 'V/S', metric ? 'm/s' : 'fpm\n×1000', { x: -0.55, y: 0, mid: true });
    ctx.save();
    ctx.translate(x, y);
    const ang = (s) => -clamp(s, -vmax, vmax) / vmax * 150 * DEG;
    ctx.strokeStyle = '#c8d2dc';
    ctx.fillStyle = '#c8d2dc';
    ctx.font = '600 ' + Math.max(7, Math.round(r * 0.17)) + 'px system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let s = -vmax; s <= vmax + 1e-6; s += minor) {
      const a = ang(s);
      const major = s === 0 || majors.indexOf(Math.abs(s)) >= 0;
      ctx.lineWidth = major ? r * 0.04 : r * 0.02;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9);
      ctx.lineTo(Math.cos(a) * r * (major ? 0.74 : 0.82), Math.sin(a) * r * (major ? 0.74 : 0.82));
      ctx.stroke();
      if (major && r > 30 && Math.abs(s) < vmax - 1e-6 || s === 0) {
        const txt = s === 0 ? '0' : metric ? String(Math.abs(s)) : String(Math.abs(s) / 1000);
        if (s !== 0 && Math.abs(s) % (metric ? 4 : 1000) !== 0 && r < 60) continue;
        ctx.fillText(txt, Math.cos(a) * r * 0.56, Math.sin(a) * r * 0.56);
      }
    }
    ctx.font = '600 ' + Math.max(7, Math.round(r * 0.15)) + 'px system-ui, sans-serif';
    ctx.fillText('UP', -r * 0.18, -r * 0.22);
    ctx.fillText('DN', -r * 0.18, r * 0.22);
    ctx.rotate(ang(v));
    pointer(ctx, r * 0.84, r * 0.05, r * 0.12, '#f5f7fa');
    ctx.fillStyle = '#0e1116';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.08, 0, TAU); ctx.fill();
    ctx.restore();
  },

  // ---------- heading strip ----------
  hsi(ctx, cx, y, w, hh, fl, sys) {
    const st = fl.st;
    const hdg = fl.headingDeg();
    const pxPerDeg = w / 60;
    ctx.save();
    // tape
    ctx.fillStyle = 'rgba(14,18,24,0.72)';
    ctx.beginPath();
    roundRect(ctx, cx - w / 2, y - hh / 2, w, hh, 6);
    ctx.fill();
    ctx.strokeStyle = '#4c5561';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath(); ctx.rect(cx - w / 2, y - hh / 2, w, hh); ctx.clip();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let d = -35; d <= 35; d += 5) {
      const deg = Math.round(hdg / 5) * 5 + d;
      const x = cx + wrapDeg(deg - hdg) * pxPerDeg;
      const major = ((deg % 10) + 360) % 10 === 0;
      ctx.strokeStyle = '#c8d2dc';
      ctx.lineWidth = major ? 1.6 : 1;
      ctx.beginPath();
      ctx.moveTo(x, y + hh / 2 - 1); ctx.lineTo(x, y + hh / 2 - (major ? 9 : 5));
      ctx.stroke();
      if (major) {
        ctx.fillStyle = '#dfe7ee';
        ctx.font = '600 ' + Math.round(hh * 0.36) + 'px system-ui, sans-serif';
        const lbl = ['N', 'E', 'S', 'W'][Math.round((((deg % 360) + 360) % 360) / 90) % 4];
        ctx.fillText(((deg % 360) + 360) % 360 % 90 === 0 ? lbl : String(((deg % 360) + 360) % 360), x, y - hh * 0.08);
      }
    }
    // route marker (magenta) and the selected heading bug
    const b = fl.bearingToTarget();
    if (fl.ap.on && !fl.ap.nav) {
      const hx = cx + wrapDeg(fl.ap.hdg - hdg) * pxPerDeg;
      ctx.fillStyle = '#7fc4ff';
      ctx.fillRect(hx - 4, y - hh / 2, 8, 4);
    }
    if (b !== null) {
      const bx = cx + wrapDeg(b - hdg) * pxPerDeg;
      ctx.fillStyle = '#e65cf0';
      ctx.beginPath();
      ctx.moveTo(bx, y + hh / 2 - 1); ctx.lineTo(bx - 5, y + hh / 2 + 5); ctx.lineTo(bx + 5, y + hh / 2 + 5);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    // lubber line and digital heading
    ctx.fillStyle = '#ffd54a';
    ctx.beginPath();
    ctx.moveTo(cx, y + hh / 2 + 2); ctx.lineTo(cx - 6, y + hh / 2 + 12); ctx.lineTo(cx + 6, y + hh / 2 + 12);
    ctx.closePath(); ctx.fill();
    // digital heading in its own box over the middle of the tape
    ctx.fillStyle = '#0b0f14';
    ctx.strokeStyle = '#ffd54a';
    ctx.lineWidth = 1;
    roundRect(ctx, cx - 24, y - hh / 2 - 18, 48, 17, 3);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffe9a6';
    ctx.font = '700 12px ui-monospace, monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(Math.round(hdg) % 360).padStart(3, '0') + '°', cx, y - hh / 2 - 9.5);
  },

  // ---------- engines ----------
  engines(ctx, x, y, w, h, fl, sys) {
    const ac = fl.ac;
    ctx.save();
    ctx.fillStyle = 'rgba(14,18,24,0.72)';
    roundRect(ctx, x, y, w, h, 6); ctx.fill();
    ctx.strokeStyle = '#3c444e'; ctx.stroke();
    ctx.fillStyle = '#9aa7b4';
    ctx.font = '600 10px system-ui, sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(ac.name.toUpperCase(), x + 8, y + 6);
    if (!sys) { ctx.restore(); return; }
    const n = sys.engines.length;
    const rowH = Math.min(26, (h - 56) / Math.max(1, n * 2));
    for (let i = 0; i < n; i++) {
      const e = sys.engines[i];
      const ry = y + 22 + i * rowH * 2;
      ctx.fillStyle = '#c8d2dc';
      ctx.font = '600 10px system-ui, sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('ENG ' + (i + 1), x + 8, ry + 2);
      const col = e.fire ? '#ff4d3d' : e.failed ? '#6b7682' : '#5ec8f0';
      this.bar(ctx, x + 52, ry, w - 60, rowH - 4, e.n1, col,
        e.fire ? 'FIRE' : e.failed ? 'FAIL' : e.startPhase === 'motoring' || e.startPhase === 'lightoff' ? 'START' : (e.n1 * 100).toFixed(0) + '% N1');
      this.bar(ctx, x + 52, ry + rowH, w - 60, rowH - 4, clamp(e.egt / 1000, 0, 1), '#f0a35e', Math.round(e.egt) + '°');
    }
    // fuel
    const fy = y + h - 22;
    ctx.fillStyle = '#c8d2dc';
    ctx.font = '600 10px system-ui, sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('FUEL', x + 8, fy);
    this.bar(ctx, x + 52, fy - 2, w - 60, 12, clamp(fl.st.fuel / ac.fuelCapKg, 0, 1), '#7de08a',
      Math.round(fl.st.fuel) + ' / ' + ac.fuelCapKg + ' kg');
    ctx.restore();
  },
  bar(ctx, x, y, w, h, v, color, label) {
    ctx.fillStyle = '#232a32';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w * clamp(v, 0, 1), h);
    ctx.strokeStyle = '#3c444e';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    if (label) {
      ctx.fillStyle = '#e8eef5';
      ctx.font = '600 9px ui-monospace, monospace';
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText(label, x + w - 4, y + h / 2);
    }
  },

  // ---------- configuration ----------
  // What a phone shows of it: the throttle is on the slider, the brakes, the spoiler, the
  // anti-ice and the autopilot light up on their buttons, the route is on the map and the strip
  phoneConfig(fl) {
    const st = fl.st;
    return [
      ['FLAPS', st.flaps === st.flapsTarget ? String(st.flaps) : Math.round(st.flaps) + '>' + st.flapsTarget,
        st.flaps > fl.ac.flaps.length - 3 ? '#e8b13a' : '#dfe7ee'],
      ['GEAR', st.gear >= 1 ? 'DOWN' : st.gear <= 0 ? 'UP' : Math.round(st.gear * 100) + '%',
        st.gear >= 1 ? '#7de08a' : st.gear <= 0 ? '#c8d2dc' : '#e8b13a'],
      ['AP', (fl.ap.on ? (fl.ap.gs ? 'G/S' : fl.ap.nav ? 'NAV' : 'HDG') : 'off') + ' x' + fl.env.timeAccel, fl.ap.on ? '#7de08a' : '#c8d2dc'],
      ['ICE', fl.env.iceAmount > 0.02 ? Math.round(fl.env.iceAmount * 100) + '%' : '—',
        fl.env.iceAmount > 0.2 ? '#ff7a5c' : fl.env.iceAmount > 0.02 ? '#e8b13a' : '#c8d2dc']
    ];
  },

  // the phone's configuration on one line across the panel (held upright)
  configLine(ctx, x, y, w, h, fl) {
    const items = this.phoneConfig(fl);
    const cell = w / items.length;
    ctx.save();
    ctx.fillStyle = 'rgba(14,18,24,0.72)';
    roundRect(ctx, x, y, w, h, 5); ctx.fill();
    ctx.strokeStyle = '#3c444e'; ctx.stroke();
    ctx.textBaseline = 'middle';
    items.forEach(([label, value, color], i) => {
      const cx = x + cell * i + cell / 2;
      ctx.fillStyle = '#8d99a6';
      ctx.font = '600 9px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(label, cx - 2, y + h / 2);
      ctx.fillStyle = color;
      ctx.font = '700 11px ui-monospace, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(value, cx + 2, y + h / 2);
    });
    ctx.restore();
  },

  config(ctx, x, y, w, h, fl, sys, phone) {
    const st = fl.st;
    ctx.save();
    ctx.fillStyle = 'rgba(14,18,24,0.72)';
    roundRect(ctx, x, y, w, h, 6); ctx.fill();
    ctx.strokeStyle = '#3c444e'; ctx.stroke();
    // (on a computer the caution lights follow the lines; in a low panel the lines close up)
    const step = phone ? 22 : Math.min(17, (h - 8 - this.CAUTION_H - 22) / 7);
    const lightsY = y + 10 + 7 * step + 12;
    const line = (i, label, value, color) => {
      const yy = y + (phone ? 14 : 10) + i * step;
      if (yy > y + h - 8) return;
      ctx.fillStyle = '#8d99a6';
      ctx.font = '600 ' + (phone ? 11 : 10) + 'px system-ui, sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(label, x + 8, yy);
      ctx.fillStyle = color || '#dfe7ee';
      ctx.font = '700 ' + (phone ? 13 : 11) + 'px ui-monospace, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(value, x + w - 8, yy);
    };
    if (phone) {
      this.phoneConfig(fl).forEach(([label, value, color], i) => line(i, label, value, color));
      ctx.restore();
      return;
    }
    const brakeTxt = st.parkingBrake ? 'PARK' : st.brakes > 0.02 ? Math.round(st.brakes * 100) + '%' : '-';
    line(0, 'THROTTLE', Math.round(st.throttle * 100) + '%');
    line(1, 'FLAPS', st.flaps === st.flapsTarget ? String(st.flaps) : Math.round(st.flaps) + '>' + st.flapsTarget,
      st.flaps > fl.ac.flaps.length - 3 ? '#e8b13a' : '#dfe7ee');
    line(2, 'GEAR', st.gear >= 1 ? 'DOWN' : st.gear <= 0 ? 'UP' : Math.round(st.gear * 100) + '%',
      st.gear >= 1 ? '#7de08a' : st.gear <= 0 ? '#c8d2dc' : '#e8b13a');
    line(3, 'BRAKES', brakeTxt, st.parkingBrake ? '#ff7a5c' : '#dfe7ee');
    line(4, 'SPOILER', st.spoiler ? 'OUT' : '—', st.spoiler ? '#ff7a5c' : '#dfe7ee');
    line(5, 'AP / TIME', (fl.ap.on ? (fl.ap.gs ? 'G/S' : fl.ap.nav ? 'NAV' : 'HDG') : 'off') + '  x' + fl.env.timeAccel, fl.ap.on ? '#7de08a' : '#c8d2dc');
    line(6, 'ANTI-ICE', sys && sys.antiIce ? 'ON' : 'off', sys && sys.antiIce ? '#7fc4ff' : '#c8d2dc');
    line(7, 'ICE', fl.env.iceAmount > 0.02 ? Math.round(fl.env.iceAmount * 100) + '%' : '—',
      fl.env.iceAmount > 0.2 ? '#ff7a5c' : fl.env.iceAmount > 0.02 ? '#e8b13a' : '#c8d2dc');
    if (sys) this.cautions(ctx, x + 8, lightsY, w - 16, sys);
    ctx.restore();
  },

  // ---------- the caution lights ----------
  // Under the configuration lines, two by two: only what no other instrument shows. A fire and
  // a failed engine are on the engine gauges (FIRE, FAIL), the ice, the gear and the autopilot
  // are lines of the configuration, a stall is the STALL warning on the view.
  CAUTION_H: 33,
  cautions(ctx, x, y, w, sys) {
    const W = sys.warnings;
    const lights = [
      ['FUEL', W.fuelLeak || W.fuelLow],
      ['HYD', W.hydraulic],
      ['CABIN', W.cabin],
      ['DAMAGE', W.damage]
    ];
    const cw = w / 2, ch = 15;
    ctx.font = '700 9px system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    lights.forEach(([label, on], i) => {
      const lx = x + (i % 2) * cw, ly = y + Math.floor(i / 2) * (ch + 3);
      ctx.fillStyle = on ? '#ffb03a' : '#1c2229';
      roundRect(ctx, lx, ly, cw - 4, ch, 3); ctx.fill();
      ctx.strokeStyle = on ? '#ffb03a' : '#39414a';
      ctx.stroke();
      ctx.fillStyle = on ? '#10141a' : '#5d6874';
      ctx.fillText(label, lx + (cw - 4) / 2, ly + ch / 2 + 0.5);
    });
  }
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// a needle along +x: pointed at `len` (its tip exactly on the value), `wid` wide at the hub,
// with a short tail behind the centre
function pointer(ctx, len, wid, tail, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-tail, -wid * 0.7);
  ctx.lineTo(0, -wid);
  ctx.lineTo(len, 0);
  ctx.lineTo(0, wid);
  ctx.lineTo(-tail, wid * 0.7);
  ctx.closePath(); ctx.fill();
}
