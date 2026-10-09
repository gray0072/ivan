'use strict';

// ============================================================
// World Aviation — the regions' flags
// Simplified drawings of the flags of the Russian regions round
// the airports, of the banners of the Swedish provinces' arms
// (flown as flags in Sweden) and of the Sámi flag (Kiruna), keyed
// as in AIRPORT_REGIONS (data/regions.js). The beasts come from
// the city symbols (art/landmarks.js), the stripes and the stars
// from the national flags (art/flags.js). Used by the third flag
// on the terminal's roof (render/airport3d.js).
// ============================================================

const RegionFlags = {
  has(key) { return !!REGION_FLAGS[key]; },
  // draw the flag `key` into the rectangle x, y, w, h
  draw(g, key, x, y, w, h) {
    g.save();
    g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.translate(x, y);
    g.lineCap = 'round'; g.lineJoin = 'round';
    (REGION_FLAGS[key] || ((gg) => { gg.fillStyle = '#dddddd'; gg.fillRect(0, 0, w, h); }))(g, w, h);
    g.restore();
  }
};

// a city symbol (art/landmarks.js) centred on cx, cy, size px square
function rgSym(g, id, cx, cy, size, fg, bg) { Landmarks.draw(g, id, cx - size / 2, cy - size / 2, size, fg, bg || fg); }
// a filled path given as [x, y] points
function rgPoly(g, color, pts) {
  g.fillStyle = color; g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath(); g.fill();
}
function rgDisc(g, color, cx, cy, r) { g.fillStyle = color; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill(); }
function rgLine(g, color, width, pts) {
  g.strokeStyle = color; g.lineWidth = width; g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.stroke();
}
// a heater shield, its top edge centred on cx, y, w wide and h tall
function rgShield(g, color, cx, y, w, h) {
  g.fillStyle = color; g.beginPath();
  g.moveTo(cx - w / 2, y); g.lineTo(cx + w / 2, y); g.lineTo(cx + w / 2, y + h * 0.55);
  g.quadraticCurveTo(cx + w / 2, y + h * 0.9, cx, y + h);
  g.quadraticCurveTo(cx - w / 2, y + h * 0.9, cx - w / 2, y + h * 0.55);
  g.closePath(); g.fill();
}
// a small open crown, its base at cx, y, w wide
function rgCrown(g, color, cx, y, w) {
  const s = w / 2, hh = w * 0.6;
  rgPoly(g, color, [[cx - s, y], [cx + s, y], [cx + s * 1.1, y - hh], [cx + s * 0.5, y - hh * 0.45], [cx, y - hh * 1.1], [cx - s * 0.5, y - hh * 0.45], [cx - s * 1.1, y - hh]]);
}
// a big cat walking right in a 100 box (the babr of Irkutsk, the Ussuri tiger), centred on cx, cy
function rgCat(g, color, cx, cy, size) {
  g.save(); g.translate(cx - size / 2, cy - size / 2); g.scale(size / 100, size / 100);
  g.fillStyle = color;
  g.beginPath(); g.ellipse(46, 54, 28, 12, 0, 0, TAU); g.fill();
  g.beginPath(); g.arc(78, 44, 11, 0, TAU); g.fill();
  rgPoly(g, color, [[70, 34], [74, 26], [78, 33]]);
  for (const x of [22, 30, 58, 66]) g.fillRect(x, 58, 6, 26);
  rgLine(g, color, 5, [[20, 50], [8, 40], [6, 28]]);
  g.restore();
}

const REGION_FLAGS = {
  // ---- Russia
  // Moscow: St George on a white horse striking the serpent, on dark red
  moscow(g, w, h) {
    g.fillStyle = '#9b1b2a'; g.fillRect(0, 0, w, h);
    const s = h * 0.78;
    g.save(); g.translate(w / 2 - s / 2, h / 2 - s / 2); g.scale(s / 100, s / 100);
    g.fillStyle = '#f2f2f2';
    g.beginPath(); g.ellipse(48, 56, 24, 11, 0, 0, TAU); g.fill();
    rgPoly(g, '#f2f2f2', [[64, 50], [78, 32], [90, 34], [88, 42], [78, 46], [72, 60]]);
    for (const [x0, y0, x1, y1] of [[30, 62, 26, 88], [38, 64, 40, 90], [62, 62, 76, 74], [66, 60, 82, 64]]) rgLine(g, '#f2f2f2', 5, [[x0, y0], [x1, y1]]);
    rgLine(g, '#f2f2f2', 4, [[26, 52], [16, 56], [14, 70]]);
    rgPoly(g, '#2a5aa8', [[42, 26], [56, 26], [58, 48], [30, 50], [24, 40]]);
    g.fillStyle = '#d9dde2'; g.fillRect(44, 22, 10, 22);
    rgDisc(g, '#e8c7a0', 50, 16, 6);
    rgLine(g, '#e8b923', 3, [[40, 24], [90, 88]]);
    rgLine(g, '#1a1a1a', 5, [[58, 92], [70, 84], [80, 94], [94, 86]]);
    g.restore();
  },
  // St Petersburg: two crossed silver anchors and a gold sceptre on red
  spb(g, w, h) {
    g.fillStyle = '#c8102e'; g.fillRect(0, 0, w, h);
    const s = h * 0.7;
    for (const turn of [-0.7, 0.7]) {
      g.save(); g.translate(w / 2, h / 2); g.rotate(turn);
      rgSym(g, 'anchor', 0, 0, s, '#f2f2f2', '#c8102e');
      g.restore();
    }
    g.fillStyle = '#f2c400'; g.fillRect(w / 2 - h * 0.025, h * 0.14, h * 0.05, h * 0.74);
    rgCrown(g, '#f2c400', w / 2, h * 0.15, h * 0.12);
  },
  // Kaliningrad Oblast: red, a thin yellow stripe, blue; a silver castle in the canton
  kaliningrad(g, w, h) {
    flagStripes(g, w, h, 'h', ['#c8102e', '#f2c400', '#1d3f8a'], [13, 1, 6]);
    rgSym(g, 'castle', w * 0.17, h * 0.3, h * 0.42, '#f2f2f2', '#c8102e');
  },
  // Murmansk Oblast: blue over red, a yellow aurora in the blue
  murmansk(g, w, h) {
    flagStripes(g, w, h, 'h', ['#0b5aa8', '#d52b1e'], [4, 1]);
    g.strokeStyle = '#f2c400'; g.lineWidth = h * 0.035;
    for (let i = 0; i <= 12; i++) {
      const f = i / 12, x = w * (0.18 + 0.64 * f), y = h * (0.62 - 0.22 * Math.sin(f * Math.PI));
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + w * 0.02, y - h * (0.16 + 0.08 * Math.sin(f * 9))); g.stroke();
    }
  },
  // Arkhangelsk Oblast: a light blue saltire on white, the oblast's arms in the middle
  arkhangelsk(g, w, h) {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    g.lineCap = 'butt';
    rgLine(g, '#5aa6dc', h * 0.2, [[0, 0], [w, h]]); rgLine(g, '#5aa6dc', h * 0.2, [[w, 0], [0, h]]);
    rgShield(g, '#e8b923', w / 2, h * 0.24, h * 0.44, h * 0.52);
    rgSym(g, 'eagle', w / 2, h * 0.47, h * 0.36, '#2a5aa8', '#e8b923');
  },
  // Tatarstan: green, a thin white stripe, red
  tatarstan(g, w, h) { flagStripes(g, w, h, 'h', ['#00a651', '#ffffff', '#ed1c24'], [7, 1, 7]); },
  // Krasnodar Krai: blue, raspberry, green (1:2:1), the gold arms in the middle
  krasnodar(g, w, h) {
    flagStripes(g, w, h, 'h', ['#3a75c4', '#c8174f', '#3c9f40'], [1, 2, 1]);
    rgShield(g, '#e8b923', w / 2, h * 0.24, h * 0.42, h * 0.56);
    rgShield(g, '#3c9f40', w / 2, h * 0.3, h * 0.3, h * 0.42);
    rgCrown(g, '#e8b923', w / 2, h * 0.22, h * 0.2);
  },
  // Sverdlovsk Oblast: white, light blue, a thin white stripe, green
  sverdlovsk(g, w, h) { flagStripes(g, w, h, 'h', ['#ffffff', '#3a8fd6', '#ffffff', '#1f8a3e'], [7, 9, 1, 3]); },
  // Novosibirsk Oblast: red, white, blue, white, green upright; two sables holding a loaf, a belt across
  novosibirsk(g, w, h) {
    flagStripes(g, w, h, 'v', ['#d52b1e', '#ffffff', '#0039a6', '#ffffff', '#1f8a3e'], [5, 3, 2, 3, 5]);
    const x0 = w * 5 / 18, x1 = w * 13 / 18, bw = w * 2 / 18;
    g.fillStyle = '#1a1a1a'; g.fillRect(x0, h * 0.7, x1 - x0, h * 0.045);
    g.fillStyle = '#ffffff'; g.fillRect(x0 + w * 3 / 18, h * 0.7, bw, h * 0.045);
    rgDisc(g, '#f2c400', w / 2, h * 0.42, h * 0.11);
    for (const s of [-1, 1]) {
      g.fillStyle = '#1a1a1a';
      g.beginPath(); g.ellipse(w / 2 + s * h * 0.2, h * 0.44, h * 0.06, h * 0.15, s * 0.3, 0, TAU); g.fill();
      rgDisc(g, '#1a1a1a', w / 2 + s * h * 0.17, h * 0.27, h * 0.05);
    }
  },
  // Krasnoyarsk Krai: a gold lion in a gold wreath on red
  krasnoyarsk(g, w, h) {
    g.fillStyle = '#c8102e'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#e8b923'; g.lineWidth = h * 0.05;
    g.beginPath(); g.arc(w / 2, h * 0.5, h * 0.3, Math.PI * 0.65, Math.PI * 2.35); g.stroke();
    rgSym(g, 'lion', w / 2, h * 0.48, h * 0.42, '#e8b923', '#c8102e');
  },
  // Irkutsk Oblast: blue, white, blue upright (1:2:1); the black babr with a red sable, cedar branches
  irkutsk(g, w, h) {
    flagStripes(g, w, h, 'v', ['#1f5aa6', '#ffffff', '#1f5aa6'], [1, 2, 1]);
    rgCat(g, '#1a1a1a', w / 2, h * 0.46, h * 0.5);
    g.fillStyle = '#c8102e'; g.beginPath(); g.ellipse(w / 2 + h * 0.23, h * 0.46, h * 0.06, h * 0.025, 0, 0, TAU); g.fill();
    g.strokeStyle = '#1f8a3e'; g.lineWidth = h * 0.035;
    for (const s of [-1, 1]) { g.beginPath(); g.arc(w / 2, h * 0.5, h * 0.3, Math.PI / 2 + s * 0.25, Math.PI / 2 + s * 1.3, s < 0); g.stroke(); }
  },
  // Sakha (Yakutia): light blue, white, red, green, a white sun in the blue
  sakha(g, w, h) {
    flagStripes(g, w, h, 'h', ['#3fa9f5', '#ffffff', '#ed1c24', '#00a651'], [26, 4, 2, 4]);
    rgDisc(g, '#ffffff', w / 2, h * 0.36, h * 0.2);
  },
  // Primorsky Krai: red over the hoist, blue below, a white stripe between; the gold tiger
  primorye(g, w, h) {
    g.fillStyle = '#1d5fb4'; g.fillRect(0, 0, w, h);
    rgPoly(g, '#d52b1e', [[0, 0], [w, 0], [0, h]]);
    g.lineCap = 'butt';
    rgLine(g, '#ffffff', h * 0.14, [[0, h], [w, 0]]);
    rgCat(g, '#f2c400', w * 0.2, h * 0.24, h * 0.36);
  },
  // Kamchatka Krai: white over blue, three snow-capped volcanoes before a red sun
  kamchatka(g, w, h) {
    flagStripes(g, w, h, 'h', ['#ffffff', '#1d5fb4']);
    rgDisc(g, '#d52b1e', w / 2, h * 0.34, h * 0.2);
    for (const [cx, top, bw] of [[-0.2, 0.3, 0.2], [0, 0.2, 0.24], [0.2, 0.32, 0.19]]) {
      const x = w / 2 + cx * h, base = h * 0.6, k = 0.32;
      rgPoly(g, '#163f7a', [[x - bw * h, base], [x, h * top], [x + bw * h, base]]);
      rgPoly(g, '#ffffff', [[x - bw * h * k, h * top + (base - h * top) * k], [x, h * top], [x + bw * h * k, h * top + (base - h * top) * k]]);
    }
    g.fillStyle = '#e8b923'; g.fillRect(w / 2 - h * 0.44, h * 0.62, h * 0.88, h * 0.04);
  },
  // Chukotka: blue, a white triangle at the hoist with a gold-ringed roundel of the Russian flag
  chukotka(g, w, h) {
    g.fillStyle = '#2f6db5'; g.fillRect(0, 0, w, h);
    rgPoly(g, '#ffffff', [[0, 0], [w * 0.42, h / 2], [0, h]]);
    const cx = w * 0.14, cy = h / 2, r = h * 0.16;
    rgDisc(g, '#f2c400', cx, cy, r);
    g.save(); g.beginPath(); g.arc(cx, cy, r * 0.72, 0, TAU); g.clip();
    g.translate(cx - r, cy - r * 0.72); flagStripes(g, r * 2, r * 1.44, 'h', ['#ffffff', '#0039a6', '#d52b1e']);
    g.restore();
  },
  // Udmurtia: black, white, red upright; a red eight-pointed sun sign in the white
  udmurtia(g, w, h) {
    flagStripes(g, w, h, 'v', ['#000000', '#ffffff', '#d52b1e']);
    const cx = w / 2, cy = h / 2, r = Math.min(w / 6 * 0.86, h * 0.3), a = r * 0.13, b = r * 0.34;
    g.fillStyle = '#d52b1e';
    for (let i = 0; i < 8; i++) {
      g.save(); g.translate(cx, cy); g.rotate(i * Math.PI / 4);
      g.beginPath();
      g.moveTo(0, -a); g.lineTo(r * 0.62, -a); g.lineTo(r, -b); g.lineTo(r * 0.8, 0); g.lineTo(r, b); g.lineTo(r * 0.62, a); g.lineTo(0, a);
      g.closePath(); g.fill();
      g.restore();
    }
    g.save(); g.translate(cx, cy); g.rotate(Math.PI / 4); g.fillRect(-r * 0.24, -r * 0.24, r * 0.48, r * 0.48); g.restore();
  },

  // ---- Sweden: the provinces' arms as banners
  // Uppland: a gold orb on red
  uppland(g, w, h) {
    g.fillStyle = '#c8102e'; g.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h * 0.6, r = h * 0.24;
    rgDisc(g, '#f2c400', cx, cy, r);
    g.fillStyle = '#c8102e';
    g.fillRect(cx - r, cy - r * 0.1, r * 2, r * 0.2); g.fillRect(cx - r * 0.1, cy - r, r * 0.2, r);
    g.fillStyle = '#f2c400';
    g.fillRect(cx - r * 0.1, cy - r * 1.75, r * 0.2, r * 0.8); g.fillRect(cx - r * 0.35, cy - r * 1.5, r * 0.7, r * 0.2);
  },
  // Västergötland: black and gold parted per bend sinister, a lion of each other's colour,
  // two silver stars in the black
  vastergotland(g, w, h) {
    g.fillStyle = '#f2c400'; g.fillRect(0, 0, w, h);
    rgPoly(g, '#1a1a1a', [[0, 0], [w, 0], [0, h]]);
    const lion = (color, clip) => {
      g.save(); g.beginPath(); clip.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.clip();
      rgSym(g, 'lion', w / 2, h / 2, h * 0.8, color, color === '#f2c400' ? '#1a1a1a' : '#f2c400');
      g.restore();
    };
    lion('#f2c400', [[0, 0], [w, 0], [0, h]]);
    lion('#1a1a1a', [[w, 0], [w, h], [0, h]]);
    g.fillStyle = '#ffffff';
    flagStar(g, w * 0.72, h * 0.15, h * 0.09, 5); flagStar(g, w * 0.1, h * 0.78, h * 0.09, 5);
  },
  // Skåne: the Skåne flag, a yellow cross on red
  skane(g, w, h) { flagNordic(g, w, h, '#d81e05', '#ffd700'); },
  // Gotland: a silver ram with a red banner on a gold cross staff, on blue
  gotland(g, w, h) {
    g.fillStyle = '#1d4f9c'; g.fillRect(0, 0, w, h);
    rgSym(g, 'sheep', w / 2, h * 0.58, h * 0.66, '#f2f2f2', '#1d4f9c');
    rgLine(g, '#f2c400', h * 0.035, [[w / 2 - h * 0.1, h * 0.5], [w / 2 - h * 0.1, h * 0.08]]);
    rgLine(g, '#f2c400', h * 0.03, [[w / 2 - h * 0.17, h * 0.14], [w / 2 - h * 0.03, h * 0.14]]);
    rgPoly(g, '#f2c400', [[w / 2 - h * 0.09, h * 0.18], [w / 2 + h * 0.26, h * 0.18], [w / 2 + h * 0.2, h * 0.26], [w / 2 + h * 0.26, h * 0.34], [w / 2 - h * 0.09, h * 0.34]]);
    rgPoly(g, '#c8102e', [[w / 2 - h * 0.08, h * 0.2], [w / 2 + h * 0.22, h * 0.2], [w / 2 + h * 0.17, h * 0.26], [w / 2 + h * 0.22, h * 0.32], [w / 2 - h * 0.08, h * 0.32]]);
  },
  // Småland: a red lion holding a crossbow, on gold
  smaland(g, w, h) {
    g.fillStyle = '#f2c400'; g.fillRect(0, 0, w, h);
    rgSym(g, 'lion', w / 2, h / 2, h * 0.8, '#c8102e', '#f2c400');
    rgLine(g, '#4a2a10', h * 0.035, [[w / 2 + h * 0.06, h * 0.62], [w / 2 + h * 0.36, h * 0.3]]);
    rgLine(g, '#4a2a10', h * 0.025, [[w / 2 + h * 0.14, h * 0.32], [w / 2 + h * 0.3, h * 0.52]]);
  },
  // Blekinge: a gold uprooted oak with three gold crowns on its trunk, on blue
  blekinge(g, w, h) {
    g.fillStyle = '#1d4f9c'; g.fillRect(0, 0, w, h);
    const c = '#f2c400', x = w / 2;
    for (const [dx, dy, r] of [[0, 0.2, 0.15], [-0.15, 0.27, 0.12], [0.15, 0.27, 0.12], [-0.08, 0.13, 0.1], [0.08, 0.13, 0.1]]) rgDisc(g, c, x + dx * h, dy * h, r * h);
    g.fillStyle = c; g.fillRect(x - h * 0.035, h * 0.3, h * 0.07, h * 0.52);
    for (const s of [-1, 0, 1]) rgLine(g, c, h * 0.03, [[x, h * 0.8], [x + s * h * 0.14, h * 0.92]]);
    for (const y of [0.48, 0.62, 0.76]) rgCrown(g, c, x, y * h, h * 0.16);
  },
  // Jämtland: a silver elk with a falcon on its back and a gold hound rearing before it, on blue
  jamtland(g, w, h) {
    g.fillStyle = '#1d4f9c'; g.fillRect(0, 0, w, h);
    rgSym(g, 'moose', w * 0.46, h * 0.56, h * 0.78, '#f2f2f2', '#1d4f9c');
    rgPoly(g, '#c8102e', [[w * 0.36, h * 0.3], [w * 0.42, h * 0.22], [w * 0.46, h * 0.3], [w * 0.42, h * 0.36]]);
    const dx = w * 0.8;
    rgPoly(g, '#f2c400', [[dx, h * 0.86], [dx - h * 0.04, h * 0.5], [dx - h * 0.1, h * 0.38], [dx - h * 0.02, h * 0.36], [dx + h * 0.06, h * 0.5], [dx + h * 0.08, h * 0.86]]);
  },
  // Medelpad: wavy bars of blue, silver, red, silver and blue
  medelpad(g, w, h) {
    const cols = ['#1d4f9c', '#ffffff', '#c8102e', '#ffffff', '#1d4f9c'];
    g.fillStyle = cols[4]; g.fillRect(0, 0, w, h);
    for (let k = 3; k >= 0; k--) {
      const y0 = h * (k + 1) / 5;
      g.fillStyle = cols[k]; g.beginPath(); g.moveTo(0, 0);
      for (let x = 0; x <= w; x += w / 48) g.lineTo(x, y0 + Math.sin(x / w * TAU * 3) * h * 0.035);
      g.lineTo(w, 0); g.closePath(); g.fill();
    }
  },
  // Västerbotten: a silver reindeer on blue strewn with gold stars
  vasterbotten(g, w, h) { rgVasterbotten(g, w, h); },
  // Norrbotten (the county's arms): Västerbotten's reindeer quartered with Lappland's wild man
  norrbotten(g, w, h) {
    for (const [qx, qy, lapp] of [[0, 0, false], [1, 0, true], [0, 1, true], [1, 1, false]]) {
      g.save(); g.translate(qx * w / 2, qy * h / 2);
      g.beginPath(); g.rect(0, 0, w / 2, h / 2); g.clip();
      if (lapp) rgLappland(g, w / 2, h / 2); else rgVasterbotten(g, w / 2, h / 2);
      g.restore();
    }
  },
  // the Sámi flag (Kiruna): red and blue, green and yellow upright stripes, a blue and red ring
  sapmi(g, w, h) {
    flagStripes(g, w, h, 'v', ['#d52b1e', '#00843d', '#f2c400', '#0039a6'], [64.5, 14, 14, 109.5]);
    const cx = w * 78.5 / 202, cy = h / 2, r = h * 0.3;
    g.lineWidth = h * 0.06; g.lineCap = 'butt';
    g.strokeStyle = '#0039a6'; g.beginPath(); g.arc(cx, cy, r, Math.PI / 2, Math.PI * 1.5); g.stroke();
    g.strokeStyle = '#d52b1e'; g.beginPath(); g.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2); g.stroke();
  }
};

function rgVasterbotten(g, w, h) {
  g.fillStyle = '#1d4f9c'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#f2c400';
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) flagStar(g, w * (0.12 + 0.25 * i + (j % 2) * 0.12), h * (0.12 + 0.25 * j), h * 0.05, 6, 0.5);
  rgSym(g, 'reindeer', w / 2, h * 0.55, h * 0.72, '#f2f2f2', '#1d4f9c');
}
// Lappland: a red wild man with a club and a green wreath, on silver
function rgLappland(g, w, h) {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
  const x = w / 2, c = '#c8102e';
  rgDisc(g, c, x, h * 0.22, h * 0.08);
  g.strokeStyle = '#1f8a3e'; g.lineWidth = h * 0.03; g.beginPath(); g.arc(x, h * 0.2, h * 0.08, Math.PI, TAU); g.stroke();
  g.fillStyle = c; g.fillRect(x - h * 0.07, h * 0.3, h * 0.14, h * 0.32);
  rgLine(g, c, h * 0.06, [[x - h * 0.04, h * 0.6], [x - h * 0.08, h * 0.9]]);
  rgLine(g, c, h * 0.06, [[x + h * 0.04, h * 0.6], [x + h * 0.08, h * 0.9]]);
  rgLine(g, c, h * 0.05, [[x - h * 0.06, h * 0.34], [x - h * 0.16, h * 0.5]]);
  rgLine(g, c, h * 0.05, [[x + h * 0.06, h * 0.34], [x + h * 0.18, h * 0.22]]);
  rgLine(g, '#6b3a1a', h * 0.06, [[x + h * 0.18, h * 0.24], [x + h * 0.26, h * 0.02]]);
}
