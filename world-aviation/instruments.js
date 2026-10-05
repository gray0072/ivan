'use strict';

// ============================================================
// World Aviation — the instrument panel, drawn with Canvas 2D on
// the overlay canvas: airspeed tape with V-speeds, attitude
// indicator, altimeter with the selected altitude bug, heading
// indicator with the route, VSI, engine gauges and the warning
// lights. Everything is vector-drawn so it stays sharp at any size.
// ============================================================

const Instruments = {
  ctx: null, w: 0, h: 0, dpr: 1, bright: 1,

  draw(ctx, w, h, dpr, fl, sys) {
    this.ctx = ctx; this.w = w; this.h = h; this.dpr = dpr;
    const st = fl.st, ac = fl.ac;
    const compact = w < 760 || h < 560;
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

    // blocks: engines on the left, configuration and warnings on the right,
    // the round gauges in a row in the space between
    const y = top + panelH * 0.52;
    if (!compact) {
      const engW = 160, warnW = 128, cfgW = 150;
      const warnX = w - 12 - warnW, cfgX = warnX - 10 - cfgW;
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
      this.warnings(ctx, warnX, top + 10, warnW, panelH - 20, sys, fl);
      this.hsi(ctx, cx, top - 22, Math.min(w * 0.5, 460), 24, fl, sys);
    } else {
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
      ctx.fillStyle = 'rgba(0,0,0,' + (1 - this.bright) * 0.6 + ')';
      ctx.fillRect(0, top, w, panelH);
    }
    ctx.restore();
  },

  // ---------- helpers ----------
  bezel(ctx, x, y, r, label, sub) {
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
      ctx.fillText(label, x, y + r * 0.82);
    }
    if (sub) {
      ctx.fillStyle = '#6f7b88';
      ctx.font = '500 ' + Math.round(r * 0.1) + 'px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(sub, x, y + r * 0.95);
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
    this.bezel(ctx, x, y, r, 'AIRSPEED', Units.metric ? 'km/h' : 'kt');
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
      if (s > 0 && s % label === 0 && r > 40) ctx.fillText(String(s), Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6);
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
    roundRect(ctx, -r * 0.3, r * 0.24, r * 0.6, r * 0.25, 3);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7de08a';
    ctx.font = '700 ' + Math.round(r * 0.18) + 'px ui-monospace, monospace';
    ctx.fillText(String(Math.round(v)), 0, r * 0.37);
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
  },

  // ---------- altimeter ----------
  alt(ctx, x, y, r, fl) {
    const st = fl.st;
    const ft = Units.metric ? st.pos.y : st.pos.y / FT;          // the dial's unit: ft, or m
    this.bezel(ctx, x, y, r, 'ALT', Units.metric ? 'm' : 'ft');
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
    // selected altitude bug on the rim
    const sel = Units.metric ? fl.ap.alt * FT : fl.ap.alt;
    const sa = (sel % 1000) / 1000 * TAU - Math.PI / 2;
    ctx.fillStyle = '#e65cf0';
    ctx.beginPath();
    ctx.moveTo(Math.cos(sa) * r * 0.93, Math.sin(sa) * r * 0.93);
    ctx.lineTo(Math.cos(sa + 0.07) * r * 0.99, Math.sin(sa + 0.07) * r * 0.99);
    ctx.lineTo(Math.cos(sa - 0.07) * r * 0.99, Math.sin(sa - 0.07) * r * 0.99);
    ctx.closePath(); ctx.fill();
    // digital window
    ctx.fillStyle = '#05070a';
    ctx.strokeStyle = '#4c5561';
    ctx.lineWidth = 1;
    roundRect(ctx, -r * 0.42, r * 0.2, r * 0.84, r * 0.3, 3);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7de08a';
    ctx.font = '700 ' + Math.round(r * 0.22) + 'px ui-monospace, monospace';
    ctx.font = '700 ' + Math.round(r * 0.19) + 'px ui-monospace, monospace';
    ctx.fillText(String(Math.round(ft / 10) * 10), 0, r * 0.355);
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
    this.bezel(ctx, x, y, r, 'V/S', metric ? 'm/s' : 'fpm ×1000');
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
    ctx.fillText('UP', -r * 0.22, -r * 0.3);
    ctx.fillText('DN', -r * 0.22, r * 0.3);
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
  config(ctx, x, y, w, h, fl, sys) {
    const st = fl.st;
    ctx.save();
    ctx.fillStyle = 'rgba(14,18,24,0.72)';
    roundRect(ctx, x, y, w, h, 6); ctx.fill();
    ctx.strokeStyle = '#3c444e'; ctx.stroke();
    const line = (i, label, value, color) => {
      const yy = y + 10 + i * 17;
      if (yy > y + h - 8) return;
      ctx.fillStyle = '#8d99a6';
      ctx.font = '600 10px system-ui, sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(label, x + 8, yy);
      ctx.fillStyle = color || '#dfe7ee';
      ctx.font = '700 11px ui-monospace, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(value, x + w - 8, yy);
    };
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
    if (h > 150) {
      line(8, 'GS · SEL', Units.spd(fl.groundSpeedKt()).replace(' ', '') + ' · ' + Units.alt(fl.ap.alt).replace(/ (ft|m)$/, ''), '#dfe7ee');
      line(9, 'NEXT', fl.targetName(), '#e65cf0');
      line(10, 'DIST', fl.st.onGround ? '-' : Units.dist(fl.targetDistNm(), 1), '#e65cf0');
    }
    ctx.restore();
  },

  // ---------- warning lights ----------
  warnings(ctx, x, y, w, h, sys, fl) {
    ctx.save();
    ctx.fillStyle = 'rgba(14,18,24,0.72)';
    roundRect(ctx, x, y, w, h, 6); ctx.fill();
    ctx.strokeStyle = '#3c444e'; ctx.stroke();
    ctx.fillStyle = '#9aa7b4';
    ctx.font = '600 10px system-ui, sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('ANNUNCIATOR', x + 8, y + 6);
    const lights = [
      ['FIRE', sys.warnings.fire, '#ff4d3d'],
      ['ENG', sys.warnings.engine, '#ffb03a'],
      ['FUEL', sys.warnings.fuelLeak || sys.warnings.fuelLow, '#ffb03a'],
      ['HYD', sys.warnings.hydraulic, '#ffb03a'],
      ['ICE', sys.warnings.ice, '#7fc4ff'],
      ['CABIN', sys.warnings.cabin, '#ffb03a'],
      ['STALL', sys.warnings.stall, '#ff4d3d'],
      ['DAMAGE', sys.warnings.damage, '#ffb03a'],
      ['GEAR', sys.warnings.gear || (fl.st.gear < 1 && fl.st.gear > 0), '#ffb03a'],
      ['AP', fl.ap.on, '#7de08a']
    ];
    const cols = 2, cw = (w - 16) / cols, ch = 15;
    for (let i = 0; i < lights.length; i++) {
      const [label, on, color] = lights[i];
      const lx = x + 8 + (i % cols) * cw, ly = y + 24 + Math.floor(i / cols) * (ch + 3);
      ctx.fillStyle = on ? color : '#1c2229';
      roundRect(ctx, lx, ly, cw - 6, ch, 3); ctx.fill();
      ctx.strokeStyle = on ? color : '#39414a';
      ctx.stroke();
      ctx.fillStyle = on ? '#10141a' : '#5d6874';
      ctx.font = '700 9px system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, lx + (cw - 6) / 2, ly + ch / 2 + 0.5);
    }
    ctx.restore();
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
