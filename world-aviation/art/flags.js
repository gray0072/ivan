'use strict';

// ============================================================
// World Aviation — national flags
// Simplified drawings of the flags of the airports' countries
// (COUNTRIES in data/countries.js), for the flagpoles and the
// terminal banners (airport3d.js) and the briefing screen.
// ============================================================

const Flags = {
  // draw the flag of `country` into the rectangle x, y, w, h
  draw(g, country, x, y, w, h) {
    const c = COUNTRIES[country];
    const spec = c ? c.flag : ['h', ['#dddddd', '#888888']];
    g.save();
    g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.translate(x, y);
    const kind = spec[0];
    if (kind === 'h' || kind === 'v') flagStripes(g, w, h, kind, spec[1], spec[2]);
    else if (kind === 'nordic') flagNordic(g, w, h, spec[1], spec[2], spec[3]);
    else if (FLAG_SPECIAL[kind]) FLAG_SPECIAL[kind](g, w, h);
    g.restore();
  },

  // a small flag as an image URL for the HTML screens (cached)
  cache: {},
  url(country) {
    if (this.cache[country]) return this.cache[country];
    const cv = document.createElement('canvas');
    cv.width = 48; cv.height = 32;
    this.draw(cv.getContext('2d'), country, 0, 0, 48, 32);
    this.cache[country] = cv.toDataURL();
    return this.cache[country];
  }
};

function flagStripes(g, w, h, dir, cols, weights) {
  weights = weights || cols.map(() => 1);
  const total = weights.reduce((s, v) => s + v, 0);
  let p = 0;
  for (let i = 0; i < cols.length; i++) {
    const f0 = p / total, f1 = (p + weights[i]) / total;
    g.fillStyle = cols[i];
    if (dir === 'h') g.fillRect(0, Math.floor(f0 * h), w, Math.ceil((f1 - f0) * h) + 1);
    else g.fillRect(Math.floor(f0 * w), 0, Math.ceil((f1 - f0) * w) + 1, h);
    p += weights[i];
  }
}

function flagNordic(g, w, h, field, cross, inner) {
  g.fillStyle = field; g.fillRect(0, 0, w, h);
  const t = h * 0.25, cx = w * 0.36;
  g.fillStyle = cross;
  g.fillRect(cx - t / 2, 0, t, h); g.fillRect(0, h / 2 - t / 2, w, t);
  if (inner) {
    const ti = t * 0.5;
    g.fillStyle = inner;
    g.fillRect(cx - ti / 2, 0, ti, h); g.fillRect(0, h / 2 - ti / 2, w, ti);
  }
}

function flagStar(g, cx, cy, r, points, inner) {
  points = points || 5;
  g.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const a = -Math.PI / 2 + i * Math.PI / points, rr = i % 2 ? r * (inner || 0.4) : r;
    g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  g.closePath(); g.fill();
}

function flagCrescent(g, cx, cy, r, off, bg, fg) {
  g.fillStyle = fg; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
  g.fillStyle = bg; g.beginPath(); g.arc(cx + off, cy, r * 0.8, 0, TAU); g.fill();
}

function flagUnion(g, w, h) {
  g.fillStyle = '#012169'; g.fillRect(0, 0, w, h);
  g.save();
  g.lineCap = 'butt';
  g.strokeStyle = '#ffffff'; g.lineWidth = h * 0.2;
  g.beginPath(); g.moveTo(0, 0); g.lineTo(w, h); g.moveTo(w, 0); g.lineTo(0, h); g.stroke();
  g.strokeStyle = '#c8102e'; g.lineWidth = h * 0.07;
  g.beginPath(); g.moveTo(0, 0); g.lineTo(w, h); g.moveTo(w, 0); g.lineTo(0, h); g.stroke();
  g.restore();
  g.fillStyle = '#ffffff';
  g.fillRect(w / 2 - h * 0.17, 0, h * 0.34, h); g.fillRect(0, h * 0.33, w, h * 0.34);
  g.fillStyle = '#c8102e';
  g.fillRect(w / 2 - h * 0.1, 0, h * 0.2, h); g.fillRect(0, h * 0.4, w, h * 0.2);
}

const FLAG_SPECIAL = {
  uk(g, w, h) { flagUnion(g, w, h); },
  greenland(g, w, h) {
    flagStripes(g, w, h, 'h', ['#ffffff', '#d00c33']);
    const cx = w * 0.37, cy = h / 2, r = h * 0.33;
    g.fillStyle = '#d00c33'; g.beginPath(); g.arc(cx, cy, r, Math.PI, TAU); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI); g.fill();
  },
  swiss(g, w, h) {
    g.fillStyle = '#da291c'; g.fillRect(0, 0, w, h);
    const s = h * 0.6, t = s * 0.32;
    g.fillStyle = '#ffffff';
    g.fillRect(w / 2 - t / 2, h / 2 - s / 2, t, s); g.fillRect(w / 2 - s / 2, h / 2 - t / 2, s, t);
  },
  czech(g, w, h) {
    flagStripes(g, w, h, 'h', ['#ffffff', '#d7141a']);
    g.fillStyle = '#11457e'; g.beginPath(); g.moveTo(0, 0); g.lineTo(w * 0.5, h / 2); g.lineTo(0, h); g.fill();
  },
  portugal(g, w, h) {
    flagStripes(g, w, h, 'v', ['#046a38', '#da291c'], [2, 3]);
    g.fillStyle = '#ffe900'; g.beginPath(); g.arc(w * 0.4, h / 2, h * 0.24, 0, TAU); g.fill();
    g.fillStyle = '#da291c'; g.fillRect(w * 0.4 - h * 0.11, h / 2 - h * 0.14, h * 0.22, h * 0.26);
    g.fillStyle = '#ffffff'; g.fillRect(w * 0.4 - h * 0.07, h / 2 - h * 0.1, h * 0.14, h * 0.18);
  },
  greece(g, w, h) {
    for (let i = 0; i < 9; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#0d5eaf'; g.fillRect(0, i * h / 9, w, h / 9 + 1); }
    const s = h * 5 / 9;
    g.fillStyle = '#0d5eaf'; g.fillRect(0, 0, s, s);
    g.fillStyle = '#ffffff'; g.fillRect(s * 0.4, 0, s * 0.2, s); g.fillRect(0, s * 0.4, s, s * 0.2);
  },
  turkey(g, w, h) {
    g.fillStyle = '#e30a17'; g.fillRect(0, 0, w, h);
    flagCrescent(g, w * 0.36, h / 2, h * 0.25, h * 0.06, '#e30a17', '#ffffff');
    g.fillStyle = '#ffffff'; flagStar(g, w * 0.5, h / 2, h * 0.1);
  },
  israel(g, w, h) {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#0038b8'; g.fillRect(0, h * 0.1, w, h * 0.15); g.fillRect(0, h * 0.75, w, h * 0.15);
    g.strokeStyle = '#0038b8'; g.lineWidth = h * 0.04;
    for (const rot of [0, Math.PI]) {
      g.beginPath();
      for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + rot + i * TAU / 3; g.lineTo(w / 2 + Math.cos(a) * h * 0.17, h / 2 + Math.sin(a) * h * 0.17); }
      g.closePath(); g.stroke();
    }
  },
  egypt(g, w, h) {
    flagStripes(g, w, h, 'h', ['#ce1126', '#ffffff', '#000000']);
    g.fillStyle = '#c09300'; g.beginPath(); g.ellipse(w / 2, h / 2, h * 0.08, h * 0.12, 0, 0, TAU); g.fill();
  },
  uae(g, w, h) {
    flagStripes(g, w, h, 'h', ['#00732f', '#ffffff', '#000000']);
    g.fillStyle = '#ff0000'; g.fillRect(0, 0, w * 0.25, h);
  },
  qatar(g, w, h) {
    g.fillStyle = '#8a1538'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffffff';
    g.beginPath(); g.moveTo(0, 0); g.lineTo(w * 0.3, 0);
    const n = 9, step = h / n;
    for (let i = 0; i < n; i++) { g.lineTo(w * 0.4, i * step + step / 2); g.lineTo(w * 0.3, (i + 1) * step); }
    g.lineTo(0, h); g.closePath(); g.fill();
  },
  morocco(g, w, h) {
    g.fillStyle = '#c1272d'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#006233'; g.lineWidth = h * 0.04;
    g.beginPath();
    for (let i = 0; i <= 5; i++) { const a = -Math.PI / 2 + i * 4 * Math.PI / 5; g.lineTo(w / 2 + Math.cos(a) * h * 0.24, h / 2 + Math.sin(a) * h * 0.24); }
    g.stroke();
  },
  ethiopia(g, w, h) {
    flagStripes(g, w, h, 'h', ['#078930', '#fcdd09', '#da121a']);
    g.fillStyle = '#0f47af'; g.beginPath(); g.arc(w / 2, h / 2, h * 0.24, 0, TAU); g.fill();
    g.fillStyle = '#fcdd09'; flagStar(g, w / 2, h / 2, h * 0.17, 5, 0.38);
  },
  kenya(g, w, h) {
    flagStripes(g, w, h, 'h', ['#000000', '#ffffff', '#bb0000', '#ffffff', '#006600'], [6, 1, 6, 1, 6]);
    g.fillStyle = '#bb0000'; g.beginPath(); g.ellipse(w / 2, h / 2, h * 0.12, h * 0.36, 0, 0, TAU); g.fill();
    g.fillStyle = '#000000'; g.beginPath(); g.ellipse(w / 2, h / 2, h * 0.05, h * 0.2, 0, 0, TAU); g.fill();
  },
  southafrica(g, w, h) {
    flagStripes(g, w, h, 'h', ['#e03c31', '#001489']);
    g.fillStyle = '#ffffff';
    g.beginPath(); g.moveTo(0, 0); g.lineTo(w * 0.15, 0); g.lineTo(w * 0.5, h * 0.33); g.lineTo(w, h * 0.33); g.lineTo(w, h * 0.67);
    g.lineTo(w * 0.5, h * 0.67); g.lineTo(w * 0.15, h); g.lineTo(0, h); g.fill();
    g.fillStyle = '#007749';
    g.beginPath(); g.moveTo(0, h * 0.07); g.lineTo(w * 0.07, h * 0.07); g.lineTo(w * 0.46, h * 0.4); g.lineTo(w, h * 0.4); g.lineTo(w, h * 0.6);
    g.lineTo(w * 0.46, h * 0.6); g.lineTo(w * 0.07, h * 0.93); g.lineTo(0, h * 0.93); g.fill();
    g.fillStyle = '#ffb612'; g.beginPath(); g.moveTo(0, h * 0.2); g.lineTo(w * 0.3, h / 2); g.lineTo(0, h * 0.8); g.fill();
    g.fillStyle = '#000000'; g.beginPath(); g.moveTo(0, h * 0.27); g.lineTo(w * 0.24, h / 2); g.lineTo(0, h * 0.73); g.fill();
  },
  us(g, w, h) {
    for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#b22234'; g.fillRect(0, i * h / 13, w, h / 13 + 1); }
    g.fillStyle = '#3c3b6e'; g.fillRect(0, 0, w * 0.4, h * 7 / 13);
    g.fillStyle = '#ffffff';
    for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) {
      const x = w * 0.4 * (c + 0.5 + (r % 2) * 0.25) / 6.3, y = h * 7 / 13 * (r + 0.5) / 5;
      flagStar(g, x, y, h * 0.025);
    }
  },
  canada(g, w, h) {
    flagStripes(g, w, h, 'v', ['#d52b1e', '#ffffff', '#d52b1e'], [1, 2, 1]);
    g.save(); g.translate(w / 2 - h * 0.35, h * 0.12); g.scale(h * 0.007, h * 0.0076);
    g.fillStyle = '#d52b1e';
    g.fill(new Path2D('M50 6 L58 22 L66 18 L62 40 L78 26 L82 34 L94 32 L88 46 L94 50 L74 64 L78 72 L54 70 L54 92 H46 L46 70 L22 72 L26 64 L6 50 L12 46 L6 32 L18 34 L22 26 L38 40 L34 18 L42 22 Z'));
    g.restore();
  },
  mexico(g, w, h) {
    flagStripes(g, w, h, 'v', ['#006847', '#ffffff', '#ce1126']);
    g.fillStyle = '#8c5a2b'; g.beginPath(); g.arc(w / 2, h / 2, h * 0.14, 0, TAU); g.fill();
    g.fillStyle = '#4a7a2a'; g.beginPath(); g.arc(w / 2, h / 2 + h * 0.08, h * 0.12, 0.2, Math.PI - 0.2); g.lineWidth = h * 0.03; g.strokeStyle = '#4a7a2a'; g.stroke();
  },
  brazil(g, w, h) {
    g.fillStyle = '#009c3b'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffdf00'; g.beginPath(); g.moveTo(w * 0.08, h / 2); g.lineTo(w / 2, h * 0.1); g.lineTo(w * 0.92, h / 2); g.lineTo(w / 2, h * 0.9); g.fill();
    g.fillStyle = '#002776'; g.beginPath(); g.arc(w / 2, h / 2, h * 0.24, 0, TAU); g.fill();
    g.strokeStyle = '#ffffff'; g.lineWidth = h * 0.04;
    g.beginPath(); g.arc(w / 2 - h * 0.05, h * 0.95, h * 0.5, -Math.PI * 0.62, -Math.PI * 0.28); g.stroke();
  },
  argentina(g, w, h) {
    flagStripes(g, w, h, 'h', ['#74acdf', '#ffffff', '#74acdf']);
    g.fillStyle = '#f6b40e'; flagStar(g, w / 2, h / 2, h * 0.13, 16, 0.6);
  },
  chile(g, w, h) {
    flagStripes(g, w, h, 'h', ['#ffffff', '#d52b1e']);
    g.fillStyle = '#0039a6'; g.fillRect(0, 0, h / 2, h / 2);
    g.fillStyle = '#ffffff'; flagStar(g, h / 4, h / 4, h * 0.1);
  },
  india(g, w, h) {
    flagStripes(g, w, h, 'h', ['#ff9933', '#ffffff', '#138808']);
    g.strokeStyle = '#000080'; g.lineWidth = Math.max(1, h * 0.02);
    g.beginPath(); g.arc(w / 2, h / 2, h * 0.13, 0, TAU); g.stroke();
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 + Math.cos(a) * h * 0.13, h / 2 + Math.sin(a) * h * 0.13); g.stroke(); }
  },
  singapore(g, w, h) {
    flagStripes(g, w, h, 'h', ['#ef3340', '#ffffff']);
    flagCrescent(g, w * 0.17, h * 0.25, h * 0.16, h * 0.06, '#ef3340', '#ffffff');
    g.fillStyle = '#ffffff';
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU / 5; flagStar(g, w * 0.27 + Math.cos(a) * h * 0.08, h * 0.25 + Math.sin(a) * h * 0.08, h * 0.03); }
  },
  malaysia(g, w, h) {
    for (let i = 0; i < 14; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#cc0001'; g.fillRect(0, i * h / 14, w, h / 14 + 1); }
    g.fillStyle = '#010066'; g.fillRect(0, 0, w / 2, h * 8 / 14);
    flagCrescent(g, w * 0.2, h * 0.29, h * 0.19, h * 0.06, '#010066', '#ffcc00');
    g.fillStyle = '#ffcc00'; flagStar(g, w * 0.36, h * 0.29, h * 0.13, 14, 0.45);
  },
  china(g, w, h) {
    g.fillStyle = '#de2910'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffde00'; flagStar(g, w * 0.17, h * 0.27, h * 0.15);
    for (const [x, y] of [[0.33, 0.1], [0.4, 0.2], [0.4, 0.35], [0.33, 0.45]]) flagStar(g, w * x, h * y, h * 0.05);
  },
  korea(g, w, h) {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    const r = h * 0.25, cx = w / 2, cy = h / 2;
    g.fillStyle = '#cd2e3a'; g.beginPath(); g.arc(cx, cy, r, Math.PI, TAU); g.fill();
    g.fillStyle = '#0047a0'; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI); g.fill();
    g.fillStyle = '#cd2e3a'; g.beginPath(); g.arc(cx - r / 2, cy, r / 2, 0, TAU); g.fill();
    g.fillStyle = '#0047a0'; g.beginPath(); g.arc(cx + r / 2, cy, r / 2, 0, TAU); g.fill();
    g.fillStyle = '#000000';
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      g.save(); g.translate(cx + sx * w * 0.32, cy + sy * h * 0.3); g.rotate(sx * sy * 0.98);
      for (let k = 0; k < 3; k++) g.fillRect(-h * 0.08, -h * 0.07 + k * h * 0.05, h * 0.16, h * 0.03);
      g.restore();
    }
  },
  japan(g, w, h) {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#bc002d'; g.beginPath(); g.arc(w / 2, h / 2, h * 0.3, 0, TAU); g.fill();
  },
  taiwan(g, w, h) {
    g.fillStyle = '#fe0000'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#000095'; g.fillRect(0, 0, w / 2, h / 2);
    g.fillStyle = '#ffffff'; flagStar(g, w / 4, h / 4, h * 0.17, 12, 0.6);
    g.fillStyle = '#000095'; g.beginPath(); g.arc(w / 4, h / 4, h * 0.075, 0, TAU); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(w / 4, h / 4, h * 0.06, 0, TAU); g.fill();
  },
  philippines(g, w, h) {
    flagStripes(g, w, h, 'h', ['#0038a8', '#ce1126']);
    g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(0, 0); g.lineTo(w * 0.43, h / 2); g.lineTo(0, h); g.fill();
    g.fillStyle = '#fcd116'; flagStar(g, w * 0.15, h / 2, h * 0.12, 8, 0.45);
  },
  australia(g, w, h) {
    g.fillStyle = '#012169'; g.fillRect(0, 0, w, h);
    g.save(); g.beginPath(); g.rect(0, 0, w / 2, h / 2); g.clip(); flagUnion(g, w / 2, h / 2); g.restore();
    g.fillStyle = '#ffffff';
    flagStar(g, w * 0.25, h * 0.75, h * 0.12, 7, 0.45);
    for (const [x, y] of [[0.75, 0.2], [0.62, 0.45], [0.85, 0.42], [0.75, 0.82]]) flagStar(g, w * x, h * y, h * 0.06, 7, 0.45);
  },
  newzealand(g, w, h) {
    g.fillStyle = '#012169'; g.fillRect(0, 0, w, h);
    g.save(); g.beginPath(); g.rect(0, 0, w / 2, h / 2); g.clip(); flagUnion(g, w / 2, h / 2); g.restore();
    for (const [x, y] of [[0.75, 0.2], [0.65, 0.45], [0.86, 0.42], [0.75, 0.8]]) {
      g.fillStyle = '#ffffff'; flagStar(g, w * x, h * y, h * 0.075);
      g.fillStyle = '#c8102e'; flagStar(g, w * x, h * y, h * 0.05);
    }
  },
  azerbaijan(g, w, h) {
    flagStripes(g, w, h, 'h', ['#00b5e2', '#ef3340', '#509e2f']);
    flagCrescent(g, w * 0.47, h / 2, h * 0.15, h * 0.04, '#ef3340', '#ffffff');
    g.fillStyle = '#ffffff'; flagStar(g, w * 0.56, h / 2, h * 0.07, 8, 0.45);
  },
  georgia(g, w, h) {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ff0000';
    const t = h * 0.2;
    g.fillRect(w / 2 - t / 2, 0, t, h); g.fillRect(0, h / 2 - t / 2, w, t);
    // the four small crosses in the quarters
    for (const [x, y] of [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) {
      const cx = w * x, cy = h * y, s = h * 0.13, k = h * 0.04;
      g.fillRect(cx - k / 2, cy - s, k, s * 2); g.fillRect(cx - s, cy - k / 2, s * 2, k);
    }
  },
  kazakhstan(g, w, h) {
    g.fillStyle = '#00afca'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fec50c';
    flagStar(g, w / 2, h * 0.42, h * 0.22, 16, 0.75);
    g.fillStyle = '#00afca'; g.beginPath(); g.arc(w / 2, h * 0.42, h * 0.12, 0, TAU); g.fill();
    g.fillStyle = '#fec50c'; g.beginPath(); g.arc(w / 2, h * 0.42, h * 0.1, 0, TAU); g.fill();
    // the eagle under the sun, and the ornament along the hoist
    g.beginPath(); g.moveTo(w * 0.3, h * 0.66); g.quadraticCurveTo(w / 2, h * 0.58, w * 0.7, h * 0.66); g.quadraticCurveTo(w / 2, h * 0.74, w * 0.3, h * 0.66); g.fill();
    for (let y = 0.08; y < 0.95; y += 0.14) g.fillRect(w * 0.06, h * y, w * 0.04, h * 0.08);
  },
  uzbekistan(g, w, h) {
    flagStripes(g, w, h, 'h', ['#0099b5', '#ce1126', '#ffffff', '#ce1126', '#1eb53a'], [10, 1, 8, 1, 10]);
    flagCrescent(g, w * 0.13, h * 0.17, h * 0.11, h * 0.04, '#0099b5', '#ffffff');
    g.fillStyle = '#ffffff';
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3 + Math.min(r, 2); c++) {
      if (r === 0 && c < 2) continue;
      flagStar(g, w * (0.2 + c * 0.055), h * (0.08 + r * 0.09), h * 0.025);
    }
  },
  kyrgyzstan(g, w, h) {
    g.fillStyle = '#e8112d'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffef00';
    flagStar(g, w / 2, h / 2, h * 0.32, 20, 0.7);
    g.beginPath(); g.arc(w / 2, h / 2, h * 0.17, 0, TAU); g.fill();
    // the tunduk, the crown of a yurt
    g.strokeStyle = '#e8112d'; g.lineWidth = h * 0.03;
    g.beginPath(); g.arc(w / 2, h / 2, h * 0.12, 0, TAU); g.stroke();
    for (const k of [-1, 0, 1]) {
      g.beginPath(); g.moveTo(w / 2 - h * 0.12, h / 2 + k * h * 0.05); g.lineTo(w / 2 + h * 0.12, h / 2 + k * h * 0.05); g.stroke();
    }
  },
  tajikistan(g, w, h) {
    flagStripes(g, w, h, 'h', ['#cc0000', '#ffffff', '#006600'], [2, 3, 2]);
    g.fillStyle = '#f8c300';
    g.beginPath(); g.moveTo(w * 0.44, h * 0.55); g.lineTo(w * 0.47, h * 0.45); g.lineTo(w / 2, h * 0.5); g.lineTo(w * 0.53, h * 0.45); g.lineTo(w * 0.56, h * 0.55); g.closePath(); g.fill();
    for (let i = 0; i < 7; i++) {
      const a = Math.PI + (i + 0.5) / 7 * Math.PI;
      flagStar(g, w / 2 + Math.cos(a) * h * 0.17, h * 0.53 + Math.sin(a) * h * 0.17, h * 0.025);
    }
  }
};
