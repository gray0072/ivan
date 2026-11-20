'use strict';

// Arlanda Rising — the colours of the map (SPEC.md "Look and style"): the Arlanda palette tokens and the colours
// of the land by season. Brand and airline colours come from their own data (data/airlines.js), never from
// here. Read by every file of render/.

const PAL = {
  pine: '#2E4A33', spruce: '#1F3326', birch: '#E8E4D8', granite: '#8A8F94', lake: '#3E6E8E', falu: '#8E2A1E',
  snow: '#F4F7FA', asphalt: '#3A3D41', concrete: '#B9B6AE', taxiLine: '#F2C230', glass: '#6F8FA6', wood: '#C89B63',
  hiVis: '#E8F23A', hiVisOrange: '#F28A1E', beacon: '#FFB000',
  sky: '#203445'
};

// the land by season: summer (May–September), autumn (October–November), winter (snow on the ground), spring
const SEASON_LAND = {
  summer: { floor: '#3c5a35', crown: ['#2E4A33', '#1F3326', '#36573a', '#4b6b3d'], grass: '#6f9a4e', field: '#a9b85a',
    field2: '#c9bf6e', soil: '#8a6e4c', bog: '#5b6b3e', lake: PAL.lake, road: '#b7a58a', town: '#7d9663' },
  autumn: { floor: '#4a4a30', crown: ['#2E4A33', '#1F3326', '#b98a2e', '#8c6a2a'], grass: '#7c8a4a', field: '#8a6d48',
    field2: '#7a5f3f', soil: '#7a5f43', bog: '#5a5a38', lake: '#3a6080', road: '#a59478', town: '#7a845c' },
  winter: { floor: '#e8edf2', crown: ['#2c4232', '#1d2e23', '#3a5240', '#e6ebef'], grass: '#eef2f6', field: '#f1f4f8',
    field2: '#e7ecf1', soil: '#dfe5ea', bog: '#e3e8ec', lake: '#c9dbe6', road: '#d8dde2', town: '#e9eef2' },
  spring: { floor: '#4d5a3a', crown: ['#2E4A33', '#1F3326', '#4f6a3a', '#7a9a52'], grass: '#7f9a55', field: '#8d7a56',
    field2: '#9a8a5a', soil: '#7a6248', bog: '#5f6a42', lake: '#4a7896', road: '#a8987c', town: '#869466' }
};

// a colour made lighter (k > 0) or darker (k < 0)
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (k > 0) { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; } else { r *= 1 + k; g *= 1 + k; b *= 1 + k; }
  return '#' + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1);
}
// two colours mixed: t = 0 the first, 1 the second
function mix(a, b, t) {
  const p = parseInt(a.slice(1), 16), q = parseInt(b.slice(1), 16);
  const ch = (s) => Math.round(((p >> s) & 255) * (1 - t) + ((q >> s) & 255) * t);
  return '#' + ((1 << 24) + (ch(16) << 16) + (ch(8) << 8) + ch(0)).toString(16).slice(1);
}
