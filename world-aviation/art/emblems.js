'use strict';

// ============================================================
// World Aviation — airline emblems
// The fin art of every airline in data/airlines.js: the fin colour
// and its emblem, drawn into a box. Emblems are drawn in a
// 100 x 100 square centred on the box's (cx, cy) with half-size r,
// some (flag tails, stripes) fill the whole box. Used for the fins
// of the 3D models (models.js) and the logos on the HTML screens.
// ============================================================

const Emblems = {
  // b: { w, h, cx, cy, r } — the box, and where the emblem sits in it
  draw(g, al, b) {
    g.save();
    g.fillStyle = al.livery.tail;
    g.fillRect(0, 0, b.w, b.h);
    const e = al.emblem || ['text', al.code, '#ffffff'];
    const fn = EMBLEM_KINDS[e[0]];
    if (fn) fn.apply(null, [g, b, al].concat(e.slice(1)));
    g.restore();
  },

  // a square logo as an image URL (cached), for the contract board and the briefing
  cache: {},
  url(code) {
    if (this.cache[code]) return this.cache[code];
    const al = AIRLINE_BY_CODE[code];
    if (!al) return '';
    const S = 64;
    const cv = document.createElement('canvas');
    cv.width = S; cv.height = S;
    const g = cv.getContext('2d');
    g.beginPath(); g.moveTo(10, 0); g.arcTo(S, 0, S, S, 10); g.arcTo(S, S, 0, S, 10); g.arcTo(0, S, 0, 0, 10); g.arcTo(0, 0, S, 0, 10);
    g.clip();
    this.draw(g, al, { w: S, h: S, cx: S / 2, cy: S / 2, r: S * 0.4 });
    if (lightColor(al.livery.tail)) { g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 2; g.stroke(); }
    this.cache[code] = cv.toDataURL();
    return this.cache[code];
  }
};

function lightColor(hex) {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11 > 200;
}

// run fn in the emblem's 100 x 100 square
function emBox(g, b, fn) {
  g.save();
  g.translate(b.cx - b.r, b.cy - b.r);
  g.scale(b.r / 50, b.r / 50);
  fn();
  g.restore();
}
function emPath(g, b, str, color) {
  emBox(g, b, () => { g.fillStyle = color; g.fill(new Path2D(str), 'evenodd'); });
}
function emCircle(g, b, x, y, r, color) {
  emBox(g, b, () => { g.fillStyle = color; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); });
}
function emStroke(g, b, str, color, w) {
  emBox(g, b, () => { g.strokeStyle = color; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(new Path2D(str)); });
}
function emText(g, b, text, color, size, opts) {
  opts = opts || {};
  emBox(g, b, () => {
    g.fillStyle = color;
    g.font = (opts.italic ? 'italic ' : '') + (opts.weight || '900') + ' ' + size + 'px ' + (opts.serif ? 'Georgia, serif' : 'Arial, sans-serif');
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const m = g.measureText(text).width;
    if (m > 96) { g.translate(50, 52); g.scale(96 / m, 1); g.fillText(text, 0, 0); } else g.fillText(text, 50, 52);
  });
}
// a landmark silhouette (art/landmarks.js) as the emblem
function emSymbol(g, b, id, fg, bg) {
  Landmarks.draw(g, id, b.cx - b.r, b.cy - b.r, b.r * 2, fg, bg);
}
// diagonal bands over the whole box, from the bottom left upwards
function emBands(g, b, bands) {
  for (const [f0, f1, col] of bands) {
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(0, b.h * (1 - f0)); g.lineTo(b.w, b.h * (0.55 - f0)); g.lineTo(b.w, b.h * (0.55 - f1)); g.lineTo(0, b.h * (1 - f1));
    g.closePath(); g.fill();
  }
}
const EM_BIRD = 'M8 60 C24 40 40 34 52 40 C60 30 76 20 94 18 C80 28 70 38 64 50 C56 66 36 70 8 60 Z';

const EMBLEM_KINDS = {
  text(g, b, al, text, color, opts) {
    opts = opts || {};
    emText(g, b, text, color, 60 * (opts.size || 0.7) * (text.length > 3 ? 0.8 : 1), opts);
  },
  portrait(g, b, al, color) {
    emPath(g, b, 'M40 92 C40 80 30 76 30 66 C26 64 26 58 30 56 C28 40 34 22 52 20 C70 18 78 34 74 50 C72 62 66 70 62 76 L64 92 Z', color);
    emPath(g, b, 'M36 52 C38 40 46 32 58 32 C50 38 44 46 36 52 Z', al.livery.tail);
  },
  bra(g, b, al) {
    emPath(g, b, 'M10 80 C30 40 60 24 92 18 C70 32 52 52 40 80 Z', '#7cc242');
    emText(g, b, 'BRA', '#ffffff', 34, {});
  },
  finnair(g, b, al) {
    emText(g, b, 'F', '#0b1560', 96, { weight: '900' });
    emPath(g, b, 'M14 86 H86 V92 H14 Z', '#0b1560');
  },
  wideroe(g, b, al) {
    g.fillStyle = '#5fb84a'; g.beginPath(); g.moveTo(0, b.h); g.lineTo(b.w * 0.5, b.h * 0.62); g.lineTo(b.w, b.h * 0.8); g.lineTo(b.w, b.h); g.fill();
    emText(g, b, 'W', '#ffffff', 80, {});
  },
  aurora(g, b, al) {
    emStroke(g, b, 'M0 62 C24 30 50 74 100 30', '#7fe0b0', 9);
    emStroke(g, b, 'M0 82 C30 50 56 86 100 52', '#f5c400', 6);
    emBox(g, b, () => { g.fillStyle = '#ffffff'; flagStar(g, 70, 22, 8, 4, 0.35); });
  },
  bird(g, b, al, color, accent) {
    emPath(g, b, EM_BIRD, color);
    emPath(g, b, 'M52 40 L60 44 L54 48 Z', accent);
  },
  greenland(g, b, al) {
    emCircle(g, b, 50, 50, 40, '#ffffff');
    emBox(g, b, () => { g.fillStyle = '#d5202f'; g.beginPath(); g.arc(50, 50, 30, 0, Math.PI); g.fill(); });
  },
  chatham(g, b, al) {
    g.save();
    g.translate(0, b.h * 0.15);
    const w = b.w, h = b.h * 0.85;
    for (let i = 0; i < 6; i++) {
      const f = i / 6;
      g.fillStyle = ['#0d2b5c', '#ffffff', '#d52b1e', '#ffffff', '#0d2b5c', '#d52b1e'][i];
      g.beginPath();
      g.moveTo(0, h * (0.2 + f * 0.8));
      g.bezierCurveTo(w * 0.4, h * (0.05 + f * 0.8), w * 0.6, h * (0.35 + f * 0.8), w, h * (0.1 + f * 0.8));
      g.lineTo(w, h * 1.2); g.lineTo(0, h * 1.2); g.fill();
    }
    g.restore();
  },
  shamrock(g, b, al, color, accent) {
    for (const [x, y] of [[50, 30], [32, 54], [68, 54]]) emCircle(g, b, x, y, 17, color);
    emStroke(g, b, 'M50 54 C52 70 56 80 62 92', color, 6);
    emCircle(g, b, 50, 48, 6, accent);
  },
  harp(g, b, al, color) { emSymbol(g, b, 'harp', color, al.livery.tail); },
  wizz(g, b, al) {
    emBands(g, b, [[0.0, 0.18, '#2e2a6b'], [0.25, 0.32, '#ffffff']]);
    emText(g, b, 'W', '#ffffff', 74, { italic: true });
  },
  crown(g, b, al, color) {
    emPath(g, b, 'M22 70 H78 L84 40 L66 54 L50 30 L34 54 L16 40 Z', color);
    emPath(g, b, 'M22 76 H78 V84 H22 Z', color);
    for (const [x, y] of [[16, 34], [50, 23], [84, 34]]) emCircle(g, b, x, y, 6, color);
    emPath(g, b, 'M47 16 H53 V8 H47 Z M44 10 H56 V14 H44 Z', color);
  },
  // the national colours sweeping up the fin, white over blue over red
  aeroflot(g, b, al) {
    emBands(g, b, [[0.0, 0.3, '#d52b1e'], [0.3, 0.6, '#0039a6']]);
  },
  afStripes(g, b, al) {
    emBands(g, b, [[0.08, 0.16, '#002157'], [0.2, 0.26, '#002157'], [0.3, 0.35, '#e1000f']]);
  },
  crane(g, b, al, color) {
    emBox(g, b, () => {
      g.strokeStyle = color; g.lineWidth = 6; g.beginPath(); g.arc(50, 50, 44, 0, TAU); g.stroke();
      g.fillStyle = color;
      g.fill(new Path2D('M18 44 C30 40 40 44 48 50 C54 36 62 26 76 20 C70 30 64 40 62 52 L84 56 C70 60 60 62 52 66 L42 82 L40 66 C34 58 26 50 18 44 Z'));
      g.fill(new Path2D('M60 52 L80 36 L84 40 L66 56 Z'));
    });
  },
  swissCross(g, b, al) {
    emPath(g, b, 'M38 14 H62 V38 H86 V62 H62 V86 H38 V62 H14 V38 H38 Z', '#ffffff');
  },
  austrian(g, b, al) {
    g.fillStyle = '#ffffff'; g.fillRect(0, b.h * 0.42, b.w, b.h * 0.18);
    emPath(g, b, 'M30 30 L50 18 L70 30 L50 24 Z', '#ffffff');
  },
  dotsB(g, b, al, color) {
    emBox(g, b, () => {
      g.fillStyle = color;
      for (let i = 0; i < 7; i++) { g.beginPath(); g.arc(30, 14 + i * 12, 5, 0, TAU); g.fill(); }
      for (let i = 0; i < 12; i++) { const a = -Math.PI / 2 + i * TAU / 12; g.beginPath(); g.arc(52 + Math.cos(a) * 20, 64 + Math.sin(a) * 20, 4.5, 0, TAU); g.fill(); }
    });
  },
  lotCrane(g, b, al, color) {
    emBox(g, b, () => {
      g.strokeStyle = color; g.lineWidth = 5; g.beginPath(); g.arc(50, 50, 42, 0, TAU); g.stroke();
      g.fillStyle = color;
      g.fill(new Path2D('M20 60 C34 48 44 46 52 50 L64 22 L70 24 L60 52 C70 56 80 62 86 70 C70 64 54 64 40 70 Z'));
    });
  },
  ita(g, b, al) {
    emText(g, b, 'ITA', '#ffffff', 46, {});
    emBands(g, b, [[0.0, 0.04, '#009246'], [0.04, 0.08, '#ffffff'], [0.08, 0.12, '#ce2b37']]);
  },
  iberia(g, b, al) {
    emBands(g, b, [[0.0, 0.2, '#d7192d'], [0.2, 0.34, '#fcb520'], [0.36, 0.42, '#d7192d']]);
  },
  tap(g, b, al) {
    emPath(g, b, 'M10 80 C30 40 60 20 94 14 C70 34 54 56 46 84 Z', '#00843d');
    emPath(g, b, 'M40 88 C50 64 70 50 94 44 C78 60 70 74 66 92 Z', '#e30613');
  },
  aegean(g, b, al) {
    emStroke(g, b, 'M50 50 m-38 0 a38 38 0 1 0 76 0 a38 38 0 1 0 -76 0', '#ffffff', 4);
    emPath(g, b, EM_BIRD, '#ffffff');
  },
  turkish(g, b, al) {
    emCircle(g, b, 50, 50, 40, '#ffffff');
    emPath(g, b, 'M22 52 C34 40 46 40 54 46 C60 30 70 22 84 20 C76 32 70 44 68 54 C58 66 40 68 22 52 Z', '#c8102e');
  },
  elal(g, b, al) {
    emBands(g, b, [[0.05, 0.14, '#00337f'], [0.18, 0.22, '#00337f']]);
    emBox(g, b, () => {
      g.strokeStyle = '#00337f'; g.lineWidth = 4;
      for (const rot of [0, Math.PI]) {
        g.beginPath();
        for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + rot + i * TAU / 3; g.lineTo(50 + Math.cos(a) * 22, 40 + Math.sin(a) * 22); }
        g.closePath(); g.stroke();
      }
    });
  },
  horus(g, b, al) {
    emPath(g, b, 'M30 86 C26 60 30 34 50 22 C64 14 80 20 84 30 L94 34 L82 38 C78 44 70 46 62 46 C64 60 60 74 52 86 Z', '#c9a227');
    emPath(g, b, 'M62 30 C66 28 72 28 74 32 C70 34 66 34 62 30 Z M64 36 L60 50 L58 38 Z', al.livery.tail);
  },
  uaeTail(g, b, al) {
    g.save();
    const cols = ['#00732f', '#ffffff', '#000000'];
    for (let i = 0; i < 3; i++) {
      g.fillStyle = cols[i];
      g.beginPath();
      for (let x = 0; x <= b.w; x += b.w / 12) g.lineTo(x, b.h * (0.3 + i * 0.2) + Math.sin(x / b.w * 5) * b.h * 0.04);
      g.lineTo(b.w, b.h); g.lineTo(0, b.h); g.fill();
    }
    g.fillStyle = '#ff0000'; g.fillRect(0, 0, b.w * 0.22, b.h);
    g.restore();
  },
  oryx(g, b, al) {
    emPath(g, b, 'M20 92 L26 60 C22 50 26 40 36 36 L44 34 C50 24 54 14 58 4 C56 16 54 26 54 34 C60 26 66 16 74 8 C68 22 62 32 58 40 C60 48 56 56 50 60 L56 92 H48 L44 66 L34 66 L30 92 Z', '#d1d3d4');
  },
  ramStar(g, b, al) {
    emBox(g, b, () => {
      g.strokeStyle = '#009a44'; g.lineWidth = 5;
      g.beginPath();
      for (let i = 0; i <= 5; i++) { const a = -Math.PI / 2 + i * 4 * Math.PI / 5; g.lineTo(50 + Math.cos(a) * 28, 50 + Math.sin(a) * 28); }
      g.stroke();
      g.strokeStyle = '#ffffff'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(80, 20); g.lineTo(96, 6); g.stroke();
    });
  },
  ethiopian(g, b, al) {
    emBands(g, b, [[0.0, 0.14, '#078930'], [0.14, 0.26, '#fcdd09'], [0.26, 0.38, '#da121a']]);
    emPath(g, b, 'M36 30 C44 18 62 18 66 30 C70 42 62 50 54 50 L58 60 L44 58 C36 50 32 40 36 30 Z', '#078930');
  },
  kq(g, b, al) {
    emCircle(g, b, 50, 50, 40, '#ffffff');
    emText(g, b, 'KQ', '#cc0000', 44, {});
    emStroke(g, b, 'M14 70 C40 86 70 82 88 66', '#000000', 4);
  },
  saFlag(g, b, al) {
    g.save();
    g.translate(0, b.h * 0.25);
    FLAG_SPECIAL.southafrica(g, b.w, b.h * 0.75);
    g.restore();
  },
  dove(g, b, al, color, accent) {
    emPath(g, b, EM_BIRD, color);
    emPath(g, b, 'M86 20 L96 16 L92 26 Z', accent);
  },
  aaFlag(g, b, al) {
    const top = b.h * 0.25;
    g.fillStyle = '#0078d2'; g.fillRect(0, top, b.w, b.h * 0.33);
    for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#c30019'; g.fillRect(0, top + b.h * 0.33 + i * b.h * 0.07, b.w, b.h * 0.07); }
  },
  deltaWidget(g, b, al) {
    emPath(g, b, 'M50 14 L92 86 H8 Z', '#c01933');
    emPath(g, b, 'M50 14 L92 86 L50 66 Z', '#8a1b2b');
  },
  globe(g, b, al, color, accent) {
    emCircle(g, b, 50, 50, 40, accent);
    emStroke(g, b, 'M50 10 C26 30 26 70 50 90 C74 70 74 30 50 10 M10 50 H90 M18 30 H82 M18 70 H82', color, 4);
  },
  eskimo(g, b, al) {
    emCircle(g, b, 50, 52, 40, '#e9e3d2');
    emCircle(g, b, 50, 54, 26, '#c08a5b');
    emBox(g, b, () => {
      g.fillStyle = '#01426a';
      g.fillRect(38, 48, 8, 3); g.fillRect(54, 48, 8, 3);
      g.beginPath(); g.arc(50, 62, 8, 0.2, Math.PI - 0.2); g.lineWidth = 3; g.strokeStyle = '#01426a'; g.stroke();
    });
  },
  hibiscus(g, b, al, color) { emSymbol(g, b, 'hibiscus', color, '#f5d000'); },
  dots(g, b, al, color) {
    emBox(g, b, () => {
      g.fillStyle = color;
      for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) {
        const s = 2 + (r + c) * 0.55;
        g.beginPath(); g.arc(8 + c * 14, 8 + r * 14, s, 0, TAU); g.fill();
      }
    });
  },
  maple(g, b, al, color) { emSymbol(g, b, 'maple', color, al.livery.tail); },
  eagleKnight(g, b, al) {
    emPath(g, b, 'M28 86 C22 60 30 32 52 22 C66 16 82 22 88 34 L74 40 C80 46 80 54 74 60 L62 56 C62 70 56 80 48 86 Z', '#c9ced6');
    emPath(g, b, 'M60 30 C64 28 70 30 70 34 C66 36 62 34 60 30 Z', al.livery.tail);
  },
  latam(g, b, al) {
    emPath(g, b, 'M14 70 C30 40 60 26 92 30 C70 36 54 50 46 74 Z', '#ed1650');
    emPath(g, b, 'M30 80 C46 64 66 58 90 62 C70 66 58 76 52 88 Z', '#ffffff');
  },
  condor(g, b, al) {
    emPath(g, b, 'M4 54 C20 46 36 44 50 48 C64 44 80 46 96 54 C84 54 74 56 66 60 L58 70 L50 62 L42 70 L34 60 C26 56 16 54 4 54 Z', '#00447c');
    emCircle(g, b, 50, 42, 7, '#00447c');
  },
  vista(g, b, al) {
    emPath(g, b, 'M30 92 V40 C30 18 70 18 70 40 V92 Z', '#d7a32b');
    emPath(g, b, 'M36 92 V42 C36 26 64 26 64 42 V92 Z', '#7a1a6b');
  },
  orchid(g, b, al) {
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * TAU / 5;
      emBox(g, b, () => {
        g.fillStyle = i % 2 ? '#c9157e' : '#d4a017';
        g.beginPath(); g.ellipse(50 + Math.cos(a) * 22, 50 + Math.sin(a) * 22, 24, 12, a, 0, TAU); g.fill();
      });
    }
    emCircle(g, b, 50, 50, 9, '#ffffff');
  },
  sqBird(g, b, al) {
    emPath(g, b, 'M14 70 C30 56 46 52 56 54 C62 40 74 28 90 22 C80 36 74 48 72 58 L86 60 C74 64 62 66 52 70 L40 84 Z', '#f99f1c');
  },
  wau(g, b, al) {
    emPath(g, b, 'M50 6 L74 34 L56 44 L80 64 L50 94 L20 64 L44 44 L26 34 Z', '#d71920');
    emPath(g, b, 'M50 20 L62 34 L50 44 L38 34 Z M50 52 L66 64 L50 80 L34 64 Z', '#003d8f');
  },
  garuda(g, b, al) {
    emPath(g, b, 'M50 90 C40 76 38 60 42 48 C30 44 18 34 10 18 C26 28 38 30 48 34 C52 22 56 14 60 6 C62 18 60 28 58 36 C70 32 82 28 92 20 C84 36 72 44 60 48 C64 62 60 78 50 90 Z', '#ffffff');
  },
  brushwing(g, b, al, color) {
    emPath(g, b, 'M6 58 C30 50 50 44 70 30 C78 24 86 20 96 18 C86 28 74 38 62 46 C78 46 88 50 94 56 C70 54 46 60 6 68 Z', color);
  },
  swallow(g, b, al) {
    emCircle(g, b, 50, 50, 40, '#d6001c');
    emPath(g, b, 'M14 40 C30 44 42 50 50 58 C58 46 72 36 90 32 C78 42 68 54 62 66 C70 76 76 84 80 92 C66 82 56 76 48 72 C40 62 28 50 14 40 Z', '#1a3f8f');
  },
  phoenix(g, b, al, color) {
    emBox(g, b, () => {
      g.strokeStyle = color; g.lineWidth = 7; g.lineCap = 'round';
      g.beginPath(); g.arc(50, 50, 30, -0.4, Math.PI * 1.6); g.stroke();
      g.beginPath(); g.moveTo(66, 30); g.bezierCurveTo(80, 18, 92, 22, 94, 30); g.stroke();
      g.beginPath(); g.moveTo(50, 50); g.bezierCurveTo(56, 66, 70, 76, 86, 80); g.stroke();
      g.fillStyle = color; g.beginPath(); g.arc(70, 26, 6, 0, TAU); g.fill();
    });
  },
  taeguk(g, b, al) {
    emBox(g, b, () => {
      g.fillStyle = '#cd2e3a'; g.beginPath(); g.arc(50, 50, 34, Math.PI, TAU); g.fill();
      g.fillStyle = '#0047a0'; g.beginPath(); g.arc(50, 50, 34, 0, Math.PI); g.fill();
      g.fillStyle = '#cd2e3a'; g.beginPath(); g.arc(33, 50, 17, 0, TAU); g.fill();
      g.fillStyle = '#0047a0'; g.beginPath(); g.arc(67, 50, 17, 0, TAU); g.fill();
      g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.beginPath(); g.arc(50, 50, 34, 0, TAU); g.stroke();
    });
  },
  tsuru(g, b, al, color) {
    emCircle(g, b, 50, 50, 40, color);
    emPath(g, b, 'M22 44 C34 30 54 26 70 30 L78 22 L82 30 C88 34 88 44 82 52 C76 44 70 42 64 46 C58 56 44 62 30 60 C40 54 46 50 50 44 C40 46 30 48 22 44 Z', '#ffffff');
  },
  plum(g, b, al) {
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * TAU / 5;
      emCircle(g, b, 50 + Math.cos(a) * 22, 50 + Math.sin(a) * 22, 19, '#e8789a');
    }
    emCircle(g, b, 50, 50, 10, '#ffffff');
    emCircle(g, b, 50, 50, 5, '#e0007a');
  },
  prSun(g, b, al) {
    emBands(g, b, [[0.0, 0.12, '#0038a8'], [0.12, 0.24, '#ce1126']]);
    emBox(g, b, () => { g.fillStyle = '#fcd116'; flagStar(g, 54, 36, 22, 8, 0.45); });
  },
  kangaroo(g, b, al, color) {
    emPath(g, b, 'M14 86 C28 78 40 76 48 72 C40 62 40 48 48 38 C54 30 62 28 66 22 L64 12 L72 18 L80 20 L84 26 L76 30 C76 40 72 50 66 58 L74 86 H66 L58 64 C54 74 46 82 38 84 L60 92 H24 Z', color);
  },
  koru(g, b, al, color) {
    emBox(g, b, () => {
      g.strokeStyle = color; g.lineWidth = 9; g.lineCap = 'round';
      g.beginPath(); g.moveTo(30, 94); g.bezierCurveTo(30, 40, 50, 10, 76, 22); g.bezierCurveTo(92, 30, 86, 56, 66, 52);
      g.bezierCurveTo(54, 50, 56, 36, 66, 38); g.stroke();
    });
  },
  dhl(g, b, al) {
    emBox(g, b, () => {
      g.fillStyle = '#d40511';
      for (let i = 0; i < 3; i++) g.fillRect(0, 34 + i * 6, 100, 3);
    });
    emText(g, b, 'DHL', '#d40511', 44, { italic: true });
  },
  fedex(g, b, al) {
    emBox(g, b, () => {
      g.font = '900 40px Arial, sans-serif'; g.textBaseline = 'middle'; g.textAlign = 'left';
      const w1 = g.measureText('Fed').width, w2 = g.measureText('Ex').width;
      const s = Math.min(1, 96 / (w1 + w2));
      g.translate(50 - (w1 + w2) * s / 2, 52); g.scale(s, 1);
      g.fillStyle = '#ffffff'; g.fillText('Fed', 0, 0);
      g.fillStyle = '#ff6200'; g.fillText('Ex', w1, 0);
    });
  },
  upsShield(g, b, al) {
    emPath(g, b, 'M18 14 C40 8 60 8 82 14 V52 C82 72 66 86 50 94 C34 86 18 72 18 52 Z', '#ffb500');
    emPath(g, b, 'M24 20 C40 16 60 16 76 20 V52 C76 68 64 80 50 86 C36 80 24 68 24 52 Z', '#351c15');
    emText(g, b, 'ups', '#ffb500', 28, {});
  },
  cargolux(g, b, al) {
    emBox(g, b, () => {
      g.strokeStyle = '#ffffff'; g.lineWidth = 12; g.lineCap = 'round';
      g.beginPath(); g.arc(50, 50, 30, 0.6, TAU - 0.6); g.stroke();
      g.strokeStyle = '#e2001a'; g.lineWidth = 6;
      g.beginPath(); g.moveTo(54, 50); g.lineTo(90, 50); g.stroke();
    });
  },
  westAtlantic(g, b, al) {
    emBands(g, b, [[0.0, 0.08, '#f39200']]);
    emText(g, b, 'W', '#ffffff', 72, {});
  },
  poppy(g, b, al) {
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + i * Math.PI / 2;
      emCircle(g, b, 50 + Math.cos(a) * 18, 46 + Math.sin(a) * 18, 22, '#e2231a');
    }
    emCircle(g, b, 50, 46, 9, '#1a1a1a');
    emStroke(g, b, 'M50 70 C52 80 50 88 46 96', '#2e7d32', 5);
  },
  starOfLife(g, b, al, color) {
    emBox(g, b, () => {
      g.fillStyle = color;
      for (let i = 0; i < 3; i++) {
        g.save(); g.translate(50, 50); g.rotate(i * Math.PI / 3);
        g.fillRect(-10, -40, 20, 80);
        g.restore();
      }
      g.strokeStyle = al.livery.tail; g.lineWidth = 4;
      g.beginPath(); g.moveTo(50, 22); g.lineTo(50, 78); g.stroke();
      g.beginPath(); g.moveTo(50, 28); g.bezierCurveTo(60, 34, 40, 42, 50, 48); g.bezierCurveTo(60, 54, 40, 62, 50, 68); g.stroke();
    });
  },
  raven(g, b, al, color) {
    emPath(g, b, 'M10 66 C24 56 36 50 46 50 C52 38 62 30 74 30 L90 34 L76 38 C72 46 66 54 58 58 L70 74 L54 64 C40 66 24 68 10 66 Z', color);
  },
  orca(g, b, al, color) { emSymbol(g, b, 'orca', color, al.livery.tail); },
  // Airbus Beluga Transport: a beluga whale — the big round forehead to the right, no dorsal fin,
  // a flipper and the flukes — with an eye and a smile
  beluga(g, b, al, color) {
    emPath(g, b, 'M95 57 C97 46 91 31 76 31 C62 31 46 37 34 45 C26 50 18 53 12 54 L3 46 C6 52 6 57 4 64 L12 58 ' +
      'C22 61 34 67 52 68 C70 70 86 66 92 62 C94 61 95 59 95 57 Z', color);
    emPath(g, b, 'M66 66 C64 72 59 77 52 79 C56 73 58 69 58 67 Z', color);
    emCircle(g, b, 80, 47, 2.8, al.livery.tail);
    emStroke(g, b, 'M84 59 C88 60.5 91 59.5 93.5 57.5', al.livery.tail, 2);
  },
  wingsCross(g, b, al) {
    emPath(g, b, 'M42 30 H58 V46 H74 V62 H58 V78 H42 V62 H26 V46 H42 Z', '#e4002b');
    emPath(g, b, 'M24 50 C16 44 8 42 2 42 C10 48 14 54 22 56 Z M76 50 C84 44 92 42 98 42 C90 48 86 54 78 56 Z', '#ffffff');
  }
};
