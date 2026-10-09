'use strict';

// ============================================================
// World Aviation — the advertising boards
// The products of BRANDS (data/regions.js) painted on a board: the
// board in the brand's colour, its mark in a square at the left,
// the name in big letters and its small line under it; or only the
// name, as letters standing on a roof. Not the real logos — the
// brand's name, its colours and a simple mark (BRAND_MARKS).
// Used by render/adverts3d.js.
// ============================================================

const BRAND_FONTS = {
  sans: '900 {s}px Arial, sans-serif',
  serif: '700 {s}px Georgia, "Times New Roman", serif',
  script: 'italic 700 {s}px Georgia, "Times New Roman", serif'
};
const brandFont = (b, size) => (BRAND_FONTS[b.font] || BRAND_FONTS.sans).replace('{s}', Math.round(size));

const Brands = {
  // a board w x h px (about 3:1): the mark, the name and its line
  board(b, w, h) {
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const g = cv.getContext('2d');
    g.fillStyle = b.bg; g.fillRect(0, 0, w, h);
    // a thin frame in the letters' colour on a white board, so it reads against a white wall
    if (/^#f/i.test(b.bg)) { g.strokeStyle = b.fg; g.lineWidth = h * 0.04; g.strokeRect(h * 0.02, h * 0.02, w - h * 0.04, h - h * 0.04); }
    const hasMark = b.mark && b.mark !== 'none' && BRAND_MARKS[b.mark];
    if (hasMark) BRAND_MARKS[b.mark](g, h * 0.52, h * 0.5, h * 0.32, b.mc || b.fg, b.bg);
    const x0 = hasMark ? h * 1.0 : h * 0.3, avail = w - x0 - h * 0.25;
    g.fillStyle = b.fg; g.textBaseline = 'middle';
    g.textAlign = hasMark ? 'left' : 'center';
    const fit = (text, font, y) => {
      g.font = font;
      const tw = g.measureText(text).width;
      g.save(); g.translate(hasMark ? x0 : x0 + avail / 2, y); g.scale(Math.min(1, avail / tw), 1); g.fillText(text, 0, 0); g.restore();
    };
    fit(b.name, brandFont(b, h * 0.46), b.tag ? h * 0.42 : h * 0.52);
    if (b.tag) { g.globalAlpha = 0.85; fit(b.tag, '600 ' + Math.round(h * 0.16) + 'px Arial, sans-serif', h * 0.79); g.globalAlpha = 1; }
    return cv;
  },

  // the name alone, for letters on a roof: the brand's colour (its board's, unless that is white)
  // with a white edge, on a transparent canvas
  letters(b) {
    const ink = /^#f/i.test(b.bg) ? b.fg : b.bg;
    const H = 192, font = brandFont(b, 150);
    const probe = document.createElement('canvas').getContext('2d');
    probe.font = font;
    const cv = document.createElement('canvas');
    cv.width = Math.min(2048, Math.ceil(probe.measureText(b.name).width + 48)); cv.height = H;
    const g = cv.getContext('2d');
    g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
    const tw = g.measureText(b.name).width;
    g.save(); g.translate(cv.width / 2, H / 2 + 6); g.scale(Math.min(1, (cv.width - 40) / tw), 1);
    g.lineJoin = 'round'; g.strokeStyle = '#ffffff'; g.lineWidth = 14; g.strokeText(b.name, 0, 0);
    g.fillStyle = ink; g.fillText(b.name, 0, 0);
    g.restore();
    return cv;
  }
};

// the marks: drawn round cx, cy within radius r, in color, cut-outs in bg
const BRAND_MARKS = {
  tick(g, cx, cy, r, c, bg) {
    g.fillStyle = c; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
    g.strokeStyle = bg; g.lineWidth = r * 0.3; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(cx - r * 0.5, cy); g.lineTo(cx - r * 0.1, cy + r * 0.4); g.lineTo(cx + r * 0.55, cy - r * 0.4); g.stroke();
  },
  drop(g, cx, cy, r, c) {
    g.fillStyle = c; g.beginPath();
    g.moveTo(cx, cy - r); g.bezierCurveTo(cx + r * 0.2, cy - r * 0.5, cx + r * 0.8, cy, cx + r * 0.8, cy + r * 0.35);
    g.arc(cx, cy + r * 0.35, r * 0.8, 0, Math.PI); g.bezierCurveTo(cx - r * 0.8, cy, cx - r * 0.2, cy - r * 0.5, cx, cy - r);
    g.fill();
  },
  leaf(g, cx, cy, r, c, bg) {
    g.fillStyle = c; g.beginPath();
    g.moveTo(cx - r * 0.8, cy + r * 0.8); g.quadraticCurveTo(cx - r * 0.9, cy - r * 0.9, cx + r * 0.9, cy - r * 0.9);
    g.quadraticCurveTo(cx + r * 0.8, cy + r * 0.8, cx - r * 0.8, cy + r * 0.8); g.fill();
    g.strokeStyle = bg; g.lineWidth = r * 0.1; g.beginPath(); g.moveTo(cx - r * 0.7, cy + r * 0.7); g.lineTo(cx + r * 0.6, cy - r * 0.6); g.stroke();
  },
  sun(g, cx, cy, r, c) {
    g.fillStyle = c; g.beginPath(); g.arc(cx, cy, r * 0.55, 0, TAU); g.fill();
    g.strokeStyle = c; g.lineWidth = r * 0.14; g.lineCap = 'round';
    for (let i = 0; i < 12; i++) {
      const a = i * TAU / 12;
      g.beginPath(); g.moveTo(cx + Math.cos(a) * r * 0.72, cy + Math.sin(a) * r * 0.72); g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); g.stroke();
    }
  },
  wave(g, cx, cy, r, c) {
    g.strokeStyle = c; g.lineWidth = r * 0.2; g.lineCap = 'round';
    for (const dy of [-0.45, 0, 0.45]) {
      g.beginPath();
      for (let k = 0; k <= 16; k++) { const x = cx - r + k * r / 8, y = cy + dy * r + Math.sin(k / 16 * TAU * 1.5) * r * 0.16; if (k) g.lineTo(x, y); else g.moveTo(x, y); }
      g.stroke();
    }
  },
  star(g, cx, cy, r, c) { g.fillStyle = c; flagStar(g, cx, cy, r, 5, 0.42); },
  snow(g, cx, cy, r, c) {
    g.strokeStyle = c; g.lineWidth = r * 0.14; g.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3, ux = Math.cos(a), uy = Math.sin(a);
      g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + ux * r, cy + uy * r); g.stroke();
      for (const s of [-1, 1]) {
        const b = a + s * 0.6, px = cx + ux * r * 0.55, py = cy + uy * r * 0.55;
        g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(b) * r * 0.32, py + Math.sin(b) * r * 0.32); g.stroke();
      }
    }
  },
  gear(g, cx, cy, r, c, bg) {
    g.fillStyle = c; g.beginPath();
    for (let i = 0; i < 24; i++) {
      const a = i * TAU / 24, rr = i % 3 === 0 || i % 3 === 1 ? r : r * 0.78;
      g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    g.closePath(); g.fill();
    g.fillStyle = bg; g.beginPath(); g.arc(cx, cy, r * 0.36, 0, TAU); g.fill();
  },
  fish(g, cx, cy, r, c, bg) {
    g.fillStyle = c; g.beginPath(); g.ellipse(cx - r * 0.1, cy, r * 0.7, r * 0.38, 0, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(cx + r * 0.5, cy); g.lineTo(cx + r, cy - r * 0.42); g.lineTo(cx + r, cy + r * 0.42); g.closePath(); g.fill();
    g.fillStyle = bg; g.beginPath(); g.arc(cx - r * 0.5, cy - r * 0.08, r * 0.08, 0, TAU); g.fill();
  },
  diamond(g, cx, cy, r, c, bg) {
    g.fillStyle = c; g.beginPath();
    g.moveTo(cx - r * 0.9, cy - r * 0.3); g.lineTo(cx - r * 0.5, cy - r * 0.75); g.lineTo(cx + r * 0.5, cy - r * 0.75);
    g.lineTo(cx + r * 0.9, cy - r * 0.3); g.lineTo(cx, cy + r * 0.9); g.closePath(); g.fill();
    g.strokeStyle = bg; g.lineWidth = r * 0.08;
    g.beginPath(); g.moveTo(cx - r * 0.9, cy - r * 0.3); g.lineTo(cx + r * 0.9, cy - r * 0.3);
    g.moveTo(cx - r * 0.3, cy - r * 0.3); g.lineTo(cx, cy + r * 0.85); g.lineTo(cx + r * 0.3, cy - r * 0.3); g.stroke();
  },
  wheat(g, cx, cy, r, c) {
    g.strokeStyle = c; g.fillStyle = c; g.lineWidth = r * 0.1; g.lineCap = 'round';
    g.beginPath(); g.moveTo(cx, cy + r); g.lineTo(cx, cy - r * 0.9); g.stroke();
    for (let k = 0; k < 4; k++) {
      const y = cy - r * 0.7 + k * r * 0.38;
      for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * r * 0.2, y, r * 0.13, r * 0.26, s * 0.6, 0, TAU); g.fill(); }
    }
  },
  heart(g, cx, cy, r, c) {
    g.fillStyle = c; g.beginPath();
    g.moveTo(cx, cy + r * 0.85);
    g.bezierCurveTo(cx - r * 1.2, cy, cx - r * 0.7, cy - r * 0.95, cx, cy - r * 0.4);
    g.bezierCurveTo(cx + r * 0.7, cy - r * 0.95, cx + r * 1.2, cy, cx, cy + r * 0.85);
    g.fill();
  },
  house(g, cx, cy, r, c, bg) {
    g.fillStyle = c; g.beginPath();
    g.moveTo(cx - r * 0.9, cy - r * 0.05); g.lineTo(cx, cy - r * 0.9); g.lineTo(cx + r * 0.9, cy - r * 0.05); g.closePath(); g.fill();
    g.fillRect(cx - r * 0.65, cy - r * 0.1, r * 1.3, r * 0.95);
    g.fillStyle = bg; g.fillRect(cx - r * 0.18, cy + r * 0.3, r * 0.36, r * 0.55);
  },
  post(g, cx, cy, r, c, bg) {
    g.fillStyle = c; g.fillRect(cx - r, cy - r * 0.62, r * 2, r * 1.24);
    g.strokeStyle = bg; g.lineWidth = r * 0.12; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(cx - r * 0.9, cy - r * 0.5); g.lineTo(cx, cy + r * 0.12); g.lineTo(cx + r * 0.9, cy - r * 0.5); g.stroke();
  },
  rail(g, cx, cy, r, c) {
    g.strokeStyle = c; g.lineWidth = r * 0.12; g.lineCap = 'butt';
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * r * 0.15, cy - r); g.lineTo(cx + s * r * 0.75, cy + r); g.stroke(); }
    for (let k = 0; k < 4; k++) {
      const f = k / 3, y = cy - r * 0.75 + f * r * 1.6, hw = r * (0.25 + 0.55 * (f * 0.8 + 0.1));
      g.beginPath(); g.moveTo(cx - hw, y); g.lineTo(cx + hw, y); g.stroke();
    }
  },
  ring(g, cx, cy, r, c) {
    g.strokeStyle = c; g.lineWidth = r * 0.24;
    g.beginPath(); g.arc(cx - r * 0.08, cy + r * 0.08, r * 0.68, 0, TAU); g.stroke();
    g.fillStyle = c; g.beginPath(); g.moveTo(cx + r * 0.42, cy - r * 0.42); g.lineTo(cx + r, cy - r); g.lineTo(cx + r * 0.95, cy - r * 0.35); g.closePath(); g.fill();
  },
  plane(g, cx, cy, r, c) {
    g.fillStyle = c; g.save(); g.translate(cx, cy); g.rotate(-Math.PI / 4);
    g.fillRect(-r * 0.12, -r, r * 0.24, r * 2);
    g.beginPath(); g.moveTo(-r * 0.9, r * 0.05); g.lineTo(0, -r * 0.35); g.lineTo(r * 0.9, r * 0.05); g.lineTo(0, -r * 0.05); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(-r * 0.38, r * 0.92); g.lineTo(0, r * 0.68); g.lineTo(r * 0.38, r * 0.92); g.closePath(); g.fill();
    g.restore();
  },
  bars(g, cx, cy, r, c) {
    g.fillStyle = c;
    for (const dy of [-0.6, 0, 0.6]) {
      g.beginPath(); g.moveTo(cx - r * 0.8, cy + dy * r + r * 0.16); g.lineTo(cx + r * 0.5, cy + dy * r - r * 0.34);
      g.lineTo(cx + r * 0.8, cy + dy * r - r * 0.16); g.lineTo(cx - r * 0.5, cy + dy * r + r * 0.34); g.closePath(); g.fill();
    }
  },
  sound(g, cx, cy, r, c, bg) {
    g.fillStyle = c; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
    g.strokeStyle = bg; g.lineCap = 'round';
    [[-0.32, 0.17, 0.62], [0.02, 0.14, 0.5], [0.32, 0.11, 0.38]].forEach(([dy, lw, hw]) => {
      g.lineWidth = r * lw; g.beginPath(); g.moveTo(cx - r * hw, cy + dy * r); g.quadraticCurveTo(cx, cy + dy * r - r * 0.18, cx + r * hw, cy + dy * r + r * 0.08); g.stroke();
    });
  },
  cup(g, cx, cy, r, c) {
    g.strokeStyle = c; g.lineWidth = r * 0.12; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(cx - r * 0.55, cy - r * 0.9); g.quadraticCurveTo(cx - r * 0.6, cy + r * 0.1, cx, cy + r * 0.15);
    g.quadraticCurveTo(cx + r * 0.6, cy + r * 0.1, cx + r * 0.55, cy - r * 0.9); g.stroke();
    g.beginPath(); g.moveTo(cx, cy + r * 0.15); g.lineTo(cx, cy + r * 0.8); g.moveTo(cx - r * 0.4, cy + r * 0.85); g.lineTo(cx + r * 0.4, cy + r * 0.85); g.stroke();
  },
  bolt(g, cx, cy, r, c) {
    g.fillStyle = c; g.beginPath();
    g.moveTo(cx + r * 0.2, cy - r); g.lineTo(cx - r * 0.55, cy + r * 0.12); g.lineTo(cx - r * 0.02, cy + r * 0.12);
    g.lineTo(cx - r * 0.25, cy + r); g.lineTo(cx + r * 0.55, cy - r * 0.15); g.lineTo(cx + r * 0.02, cy - r * 0.15); g.closePath(); g.fill();
  },
  mountain(g, cx, cy, r, c, bg) {
    g.fillStyle = c; g.beginPath();
    g.moveTo(cx - r, cy + r * 0.75); g.lineTo(cx - r * 0.25, cy - r * 0.75); g.lineTo(cx + r * 0.15, cy - r * 0.05);
    g.lineTo(cx + r * 0.45, cy - r * 0.45); g.lineTo(cx + r, cy + r * 0.75); g.closePath(); g.fill();
    g.fillStyle = bg; g.beginPath(); g.moveTo(cx - r * 0.25, cy - r * 0.75); g.lineTo(cx - r * 0.48, cy - r * 0.3); g.lineTo(cx - r * 0.02, cy - r * 0.3); g.closePath(); g.fill();
  }
};
