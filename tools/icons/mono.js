'use strict';

// The drawings in one colour, shown in the colour of the text around them: arrows, ticks and other simple
// signs. What a 24 × 24 picture holds: `s` a line, `f` a filled shape, `x` the markup as it is. Black is
// replaced by the colour. Read by tools/icons-build.js. Everything else comes from Twemoji (see README.md).

const THICK = 'stroke-width="3.4"';
module.exports = {
  // arrows
  '←': { s: 'M19.5 12h-14M11 5.5 4.5 12l6.5 6.5' },
  '↑': { s: 'M12 19.5v-14M5.5 11 12 4.5l6.5 6.5' },
  '→': { s: 'M4.5 12h14M13 5.5l6.5 6.5-6.5 6.5' },
  '↓': { s: 'M12 4.5v14M5.5 13l6.5 6.5 6.5-6.5' },
  '↖': { s: 'M18 18 6 6M6 15.5V6h9.5' },
  '↗': { s: 'M6 18 18 6M8.5 6H18v9.5' },
  '↘': { s: 'M6 6l12 12M18 8.5V18H8.5' },
  '↙': { s: 'M18 6 6 18M6 8.5V18h9.5' },
  '↩': { s: 'M9 5 4.5 9.5 9 14M4.5 9.5H14a5.5 5.5 0 0 1 0 11h-3' },
  '↶': { s: 'M8 4 3.5 8.5 8 13M3.5 8.5H14a6 6 0 0 1 0 12h-2' },
  '↺': { s: 'M4.5 12a7.5 7.5 0 1 0 2.4-5.5L4 9.2M4 4v5.2h5.2' },
  '↻': { s: 'M19.5 12a7.5 7.5 0 1 1-2.4-5.5L20 9.2M20 4v5.2h-5.2' },
  // triangles
  '▲': { f: 'M12 5 21 19H3z' },
  '▼': { f: 'M12 19 3 5h18z' },
  '▶': { f: 'M6 3.5 20 12 6 20.5z' },
  '◀': { f: 'M18 3.5 4 12l14 8.5z' },
  '▸': { f: 'M8 6.5 17 12l-9 5.5z' },
  '▾': { f: 'M6.5 8h11L12 17z' },
  '◢': { f: 'M21 3v18H3z' },
  // ticks and crosses
  '✓': { s: 'M4.5 12.5 9.8 18 19.5 6.5', a: 'stroke-width="2.8"' },
  '✔': { s: 'M4.5 12.5 9.8 18 19.5 6.5', a: THICK },
  '✕': { s: 'M6 6l12 12M18 6 6 18' },
  '✖': { s: 'M6 6l12 12M18 6 6 18', a: THICK },
  '✗': { s: 'M6.5 5.5l11 13M17.5 5.5l-11 13', a: 'stroke-width="2.8"' },
  // controls
  '⏸': { f: 'M6.5 4.5h4v15h-4zM13.5 4.5h4v15h-4z' },
  '☰': { s: 'M4 6.5h16M4 12h16M4 17.5h16' },
  '⌫': { s: 'M9 5h11a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 20 19H9l-7-7zM12 9.5l5 5M17 9.5l-5 5' },
  '✎': { s: 'M4 20l1-4.5L16.5 4a2.1 2.1 0 0 1 3 3L8.5 19zM14.5 6l3.5 3.5' },
  '⚙': { x: '<circle cx="12" cy="12" r="6" fill="none" stroke="#000" stroke-width="2.6"/><path fill="none" stroke="#000" stroke-width="3" stroke-linecap="round" d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M5.5 18.5l2.1-2.1M16.4 7.6l2.1-2.1"/><circle cx="12" cy="12" r="1.8" fill="#000"/>' },
  // shapes
  '▭': { s: 'M3 7.5h18v9H3z' },
  '◉': { x: '<circle cx="12" cy="12" r="8.8" fill="none" stroke="#000" stroke-width="2.4"/><circle cx="12" cy="12" r="4" fill="#000"/>' },
  '◎': { x: '<circle cx="12" cy="12" r="8.8" fill="none" stroke="#000" stroke-width="2.4"/><circle cx="12" cy="12" r="4" fill="none" stroke="#000" stroke-width="2.4"/>' },
  '⌁': { s: 'M3 13l4-5 5 9 4-7 5 3' },
  '★': { f: 'M12 2.5l2.9 6.1 6.7.8-4.9 4.6 1.3 6.6-6-3.3-6 3.3 1.3-6.6-4.9-4.6 6.7-.8z' },
  '♡': { s: 'M12 20.5S3.5 15.5 3.5 9.2A4.7 4.7 0 0 1 12 6.5a4.7 4.7 0 0 1 8.5 2.7c0 6.3-8.5 11.3-8.5 11.3z' },
  '☁': { f: 'M7 19a4.5 4.5 0 0 1-.6-9 6 6 0 0 1 11.5-1.2A5 5 0 0 1 17.5 19z' },
  // the Twemoji cap is nearly black, lost on a dark screen
  '🎓': { f: 'M12 4 .8 9.5 12 15l11.2-5.5zM5.5 13.6v3.6c0 1.5 3 2.8 6.5 2.8s6.5-1.3 6.5-2.8v-3.6L12 16.8zM21 11.2v5.3a1 1 0 0 0 1.6 0v-6.1z' },
  '✈': { x: '<path fill="#000" transform="rotate(90 12 12)" d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/>' }
};
