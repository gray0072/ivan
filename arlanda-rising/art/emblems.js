'use strict';

// Arlanda Rising — the airlines' emblems, simplified drawings made for the game (never copied images): on the fin
// of an aircraft on the map (render/aircraft.js) and as a small square logo on the screens (the task tray, the
// cards). An emblem is data in the airline's livery (data/airlines.js): ['text', letters, colour] or ['circle', disc colour,
// letters, letters' colour]. Taken from
// world-aviation/art/emblems.js in spirit; more kinds come with the later chapters' airlines.

const Emblems = {
  // on a fin: the canvas is already turned into the fin's plane, centred on the emblem; size in metres
  drawOnFin(c, e, size) {
    if (e[0] === 'text') {
      c.fillStyle = e[2];
      c.font = 'italic 900 ' + size + 'px Arial, sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      const w = c.measureText(e[1]).width, max = size * 2.2;
      if (w > max) c.scale(max / w, 1);
      c.fillText(e[1], 0, 0);
    } else if (e[0] === 'circle') {
      // ['circle', disc colour, letters, letters' colour]: a disc with letters in it
      c.fillStyle = e[1];
      c.beginPath(); c.arc(0, 0, size * 0.7, 0, Math.PI * 2); c.fill();
      c.fillStyle = e[3];
      c.font = '900 ' + size * 0.62 + 'px Arial, sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(e[2], 0, size * 0.04);
    } else if (e[0] === 'hero') {
      // ['hero', face colour]: Norwegian's "tail hero", a portrait drawn as a simple face and shoulders
      c.fillStyle = e[1];
      c.beginPath(); c.ellipse(0, -size * 0.15, size * 0.32, size * 0.4, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(0, size * 0.62, size * 0.62, size * 0.32, 0, Math.PI, 0); c.fill();
      c.fillStyle = 'rgba(40,30,30,0.5)';
      c.beginPath(); c.ellipse(0, -size * 0.45, size * 0.34, size * 0.16, 0, Math.PI, 0); c.fill();
    } else if (e[0] === 'flag') {
      // ['flag']: the flag of the United Arab Emirates, as Emirates wore it on the fin
      const w = size * 1.6, h = size * 0.9;
      c.fillStyle = '#c8102e'; c.fillRect(-w / 2, -h / 2, w * 0.26, h);
      const st = [['#00843d', 0], ['#ffffff', 1], ['#1a1a1a', 2]];
      for (const [col, i] of st) { c.fillStyle = col; c.fillRect(-w / 2 + w * 0.26, -h / 2 + i * h / 3, w * 0.74, h / 3 + 0.2); }
    }
  },
  cache: {},
  // a square logo as an image URL: the fin's colour with the emblem
  url(code, year) {
    const key = code + ':' + year;
    if (this.cache[key]) return this.cache[key];
    const liv = liveryOf(code, year), n = 64;
    const cv = document.createElement('canvas');
    cv.width = cv.height = n;
    const g = cv.getContext('2d');
    g.beginPath(); g.moveTo(12, 0); g.arcTo(n, 0, n, n, 12); g.arcTo(n, n, 0, n, 12); g.arcTo(0, n, 0, 0, 12); g.arcTo(0, 0, n, 0, 12);
    g.fillStyle = liv.tail; g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.2)'; g.lineWidth = 2; g.stroke();
    // the cheatline under the emblem
    g.fillStyle = liv.line; g.fillRect(0, n * 0.72, n, n * 0.1);
    if (liv.emblem) { g.translate(n / 2, n * 0.42); this.drawOnFin(g, liv.emblem, n * 0.36); }
    return (this.cache[key] = cv.toDataURL());
  }
};
