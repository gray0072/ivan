'use strict';

// Arlanda Rising — the brands' signs, simplified drawings made for the game (never copied logos): a panel in the brand's
// colours from data/brands.js (`sign`) with its letters (`glyph`) in a disc and its name, drawn on a canvas (the
// Terminal view's units) or as a small image for the screens' lists. Used by render/terminal.js and ui/terminalview.js.

const BrandArt = {
  // a sign in a box on the canvas: x, y, w, h in the canvas's pixels
  sign(c, id, x, y, w, h) {
    const b = BRANDS[id];
    if (!b) return;
    const [bg, fg] = b.sign;
    c.save();
    c.fillStyle = bg;
    this.round(c, x, y, w, h, Math.min(6, h / 4));
    c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 1; c.stroke();
    // the letters in a disc on the left, the name beside them
    const r = Math.min(h * 0.36, w * 0.18), cx = x + r + 5, cy = y + h / 2;
    c.fillStyle = fg;
    c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = bg;
    c.font = '900 ' + Math.round(r * (b.glyph.length > 1 ? 0.9 : 1.25)) + 'px Arial, sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(b.glyph, cx, cy + 1);
    c.fillStyle = fg;
    const tx = cx + r + 5, tw = x + w - tx - 4;
    let size = Math.min(h * 0.34, 13);
    c.font = '700 ' + size + 'px Arial, sans-serif';
    c.textAlign = 'left';
    let name = b.name;
    while (c.measureText(name).width > tw && size > 7) { size -= 0.5; c.font = '700 ' + size + 'px Arial, sans-serif'; }
    while (c.measureText(name).width > tw && name.length > 3) name = name.slice(0, -2) + '.';
    c.fillText(name, tx, cy + 1);
    c.restore();
  },
  round(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  },
  cache: {},
  // a small sign as an image URL, for the lists
  url(id) {
    if (this.cache[id]) return this.cache[id];
    const cv = document.createElement('canvas');
    cv.width = 160; cv.height = 40;
    this.sign(cv.getContext('2d'), id, 1, 1, 158, 38);
    return (this.cache[id] = cv.toDataURL());
  }
};
