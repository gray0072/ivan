'use strict';

// ============================================================
// World Aviation — the cockpit: the frame drawn in 2D over the 3D
// world, plus everything you see through the glass (rain, snow,
// frost, cloud, lightning) and a vignette.
// ============================================================

const Cockpit = {
  t: 0,
  drops: [],
  flakes: [],

  init() {
    for (let i = 0; i < 90; i++) {
      this.drops.push({ x: Math.random(), y: Math.random(), v: 0.6 + Math.random() * 1.4, l: 8 + Math.random() * 22 });
    }
    for (let i = 0; i < 70; i++) {
      this.flakes.push({ x: Math.random(), y: Math.random(), v: 0.1 + Math.random() * 0.4, r: 1 + Math.random() * 2.4, w: Math.random() * TAU });
    }
  },

  panelTop(h) {
    return h - Math.min(h * (h < 560 ? 0.34 : 0.30), h < 560 ? 210 : 250);
  },

  // where the centre window post is on the screen: the captain's eye is VIEW.COCKPIT_SEAT_X to
  // the left of it and VIEW.CENTRE_POST_AHEAD in front, seen through the camera's field of view
  postX(w, h) {
    const tanH = Math.tan(VIEW.FOV_DEG * DEG / 2) * w / Math.max(1, h);
    return w / 2 * (1 + (-VIEW.COCKPIT_SEAT_X / VIEW.CENTRE_POST_AHEAD) / tanH);
  },

  draw(ctx, w, h, dpr, fl, sys, dt, inside) {
    this.t += dt;
    const top = this.panelTop(h);
    ctx.save();
    ctx.scale(dpr, dpr);
    const wide = w > 900;
    const frame = 0.055 * h + (wide ? 26 : 12);   // how thick the window frame is

    if (!inside) { ctx.restore(); return; }
    // ---- weather on the glass
    this.weather(ctx, w, top, fl, dt);

    // ---- the cockpit structure
    ctx.fillStyle = '#191d23';
    // top header with a slight curve
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.lineTo(w, frame * 0.95);
    ctx.quadraticCurveTo(w / 2, frame * 1.35, 0, frame * 0.95);
    ctx.closePath(); ctx.fill();
    // glareshield lip just above the panel
    ctx.fillStyle = '#20252c';
    ctx.beginPath();
    ctx.moveTo(0, top + 6);
    ctx.quadraticCurveTo(w / 2, top - frame * 0.5, w, top + 6);
    ctx.lineTo(w, top + 14); ctx.lineTo(0, top + 14);
    ctx.closePath(); ctx.fill();

    // A-pillars
    const pillarW = wide ? frame * 0.85 : frame * 0.55;
    ctx.fillStyle = '#1b2027';
    ctx.fillRect(0, 0, pillarW, top + 12);
    ctx.fillRect(w - pillarW, 0, pillarW, top + 12);
    // the centre post: you sit in the captain's (left) seat, so it is off to the right, leaning
    // in towards the top as the windscreen slopes back
    const postW = Math.max(3, w * 0.012), px = this.postX(w, h), lean = w * 0.012;
    ctx.fillStyle = '#1b2027';
    ctx.beginPath();
    ctx.moveTo(px - postW / 2 + lean, frame * 0.5); ctx.lineTo(px + postW / 2 + lean, frame * 0.5);
    ctx.lineTo(px + postW * 0.7, top + 12); ctx.lineTo(px - postW * 0.7, top + 12);
    ctx.closePath(); ctx.fill();

    // side rails with a highlight
    ctx.strokeStyle = '#39424c';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pillarW, frame * 1.0); ctx.lineTo(pillarW, top);
    ctx.moveTo(w - pillarW, frame * 1.0); ctx.lineTo(w - pillarW, top);
    ctx.stroke();

    // sun visors
    if (wide) {
      ctx.fillStyle = '#242a31';
      for (const s of [-1, 1]) {
        const vx = px + lean + s * postW * 2;
        ctx.beginPath();
        ctx.moveTo(vx, frame * 0.9);
        ctx.lineTo(vx + s * w * 0.16, frame * 1.0);
        ctx.lineTo(vx + s * w * 0.16, frame * 1.5);
        ctx.lineTo(vx, frame * 1.45);
        ctx.closePath(); ctx.fill();
      }
    }

    // window glass reflection
    const g = ctx.createLinearGradient(w * 0.1, 0, w * 0.55, top * 0.7);
    g.addColorStop(0, 'rgba(255,255,255,0.05)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.015)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(pillarW, frame, w - pillarW * 2, top - frame);

    // ---- vignette
    const vg = ctx.createRadialGradient(w / 2, top / 2, Math.min(w, top) * 0.32, w / 2, top / 2, Math.max(w, top) * 0.72);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.34)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, top + 14);

    // ---- lightning
    if (Scene3D.lightning > 0.02) {
      ctx.fillStyle = 'rgba(226,236,255,' + (0.5 * Scene3D.lightning) + ')';
      ctx.fillRect(0, 0, w, top + 14);
    }
    ctx.restore();
  },

  weather(ctx, w, top, fl, dt) {
    const env = fl.env;
    const inCloud = Scene3D.inCloud || 0;
    // cloud whiteout
    if (inCloud > 0.02) {
      ctx.fillStyle = 'rgba(226,232,240,' + clamp(inCloud * 0.92, 0, 0.95) + ')';
      ctx.fillRect(0, 0, w, top + 14);
      if (inCloud > 0.5) {
        ctx.fillStyle = 'rgba(200,210,222,' + (inCloud - 0.5) * 0.5 + ')';
        ctx.fillRect(0, 0, w, top + 14);
      }
    }
    // ice on the inside of the glass
    const ice = env.iceAmount || 0;
    if (ice > 0.05) {
      ctx.save();
      ctx.globalAlpha = clamp((ice - 0.05) * 0.9, 0, 0.55);
      ctx.fillStyle = '#dfe9f2';
      for (let i = 0; i < 5; i++) {
        const r = (w * 0.5) * (0.5 + i * 0.11);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        for (let k = 0; k <= 12; k++) {
          const a = (k / 12) * Math.PI / 2;
          const rr = r * (1 + Math.sin(k * 2.3 + i) * 0.06);
          ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr * 0.8);
        }
        ctx.lineTo(0, 0);
        ctx.closePath(); ctx.fill();
        ctx.save();
        ctx.translate(w, 0); ctx.scale(-1, 1);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        for (let k = 0; k <= 12; k++) {
          const a = (k / 12) * Math.PI / 2;
          const rr = r * (1 + Math.cos(k * 1.9 + i) * 0.06);
          ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr * 0.8);
        }
        ctx.lineTo(0, 0);
        ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }
    // precipitation
    const speed = clamp(fl.st.tas / 200, 0.2, 2.2);
    if (env.precip === 'rain') {
      ctx.strokeStyle = 'rgba(206,224,240,0.5)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      for (const d of this.drops) {
        d.y += (d.v * 0.55 * (0.4 + speed)) * dt;
        d.x += d.v * 0.09 * dt;
        if (d.y > 1) { d.y -= 1; d.x = Math.random(); }
        if (d.x > 1) d.x -= 1;
        const x = d.x * w, y = d.y * top;
        ctx.moveTo(x, y);
        ctx.lineTo(x - d.l * 0.18, y + d.l);
      }
      ctx.stroke();
      // wiper sweep area stays a little clearer
    } else if (env.precip === 'snow') {
      ctx.fillStyle = 'rgba(240,246,252,0.75)';
      for (const f of this.flakes) {
        f.y += f.v * (0.5 + speed) * dt;
        f.x += Math.sin(this.t * 1.6 + f.w) * 0.02 * dt;
        if (f.y > 1) { f.y -= 1; f.x = Math.random(); }
        const x = f.x * w, y = f.y * top;
        ctx.beginPath(); ctx.arc(x, y, f.r, 0, TAU); ctx.fill();
      }
    }
  }
};
