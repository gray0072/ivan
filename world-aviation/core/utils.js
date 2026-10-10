'use strict';

// ============================================================
// World Aviation — shared helpers: math, noise, geodesy, formatting
// ============================================================

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

const KTS = 0.514444;    // knots -> m/s
const FPM = 0.00508;     // feet per minute -> m/s
const FT = 0.3048;       // feet -> m
const NM = 1852;         // nautical mile -> m
const NM_KM = 1.852;

function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function lerp(a, b, t) { return a + (b - a) * t; }
function invLerp(a, b, v) { return b === a ? 0 : (v - a) / (b - a); }
function smoothstep(a, b, v) { const t = clamp(invLerp(a, b, v), 0, 1); return t * t * (3 - 2 * t); }
function sign(v) { return v < 0 ? -1 : (v > 0 ? 1 : 0); }
function approach(current, target, rate) {
  const d = target - current;
  const step = Math.abs(rate);
  if (Math.abs(d) <= step) return target;
  return current + step * sign(d);
}
function wrapRad(a) { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; }
function wrapDeg(d) { d = (d + 180) % 360; if (d < 0) d += 360; return d - 180; }
function lerpAngle(a, b, t) { return a + wrapRad(b - a) * t; }
function expApproach(current, target, rate) { return target + (current - target) * Math.exp(-rate); }

// ---------- Deterministic RNG ----------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function makeRng(seed) {
  const r = mulberry32(seed);
  return {
    next: r,
    range: (a, b) => a + r() * (b - a),
    int: (a, b) => Math.floor(a + r() * (b - a + 1)),
    pick: (arr) => arr[Math.floor(r() * arr.length)],
    chance: (p) => r() < p,
    weighted: (items, weightOf) => {
      let total = 0;
      for (const it of items) total += Math.max(0, weightOf(it));
      let roll = r() * total;
      for (const it of items) {
        roll -= Math.max(0, weightOf(it));
        if (roll <= 0) return it;
      }
      return items[items.length - 1];
    },
    shuffle: (arr) => {
      const a2 = arr.slice();
      for (let i = a2.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1));
        const t = a2[i]; a2[i] = a2[j]; a2[j] = t;
      }
      return a2;
    }
  };
}
let rand = makeRng(12345);          // replaced per session with a seeded rng
function reseed(seed) { rand = makeRng(seed >>> 0); return rand; }

// ---------- Value noise ----------
const NOISE_SIZE = 256;
const noiseTable = new Float32Array(NOISE_SIZE * NOISE_SIZE);
(function buildNoise() {
  const r = mulberry32(987654321);
  for (let i = 0; i < noiseTable.length; i++) noiseTable[i] = r();
})();
function noiseValue(xi, yi) {
  // (floor, not `| 0`: truncating towards zero gave a negative fraction below zero, the curve
  // below extrapolated, and the noise left 0..1 — up to 140 in ridgeNoise, 8 800 m mountains
  // west and south of the equator and the meridian)
  const x = Math.floor(xi), y = Math.floor(yi);
  const fx = xi - x, fy = yi - y;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const idx = (xx, yy) => noiseTable[((yy & (NOISE_SIZE - 1)) * NOISE_SIZE) + (xx & (NOISE_SIZE - 1))];
  const a = idx(x, y), b = idx(x + 1, y), c = idx(x, y + 1), d = idx(x + 1, y + 1);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}
function fbm(x, y, octaves, lacunarity, gain) {
  octaves = octaves || 4; lacunarity = lacunarity || 2.03; gain = gain || 0.5;
  let amp = 1, freq = 1, sum = 0, norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noiseValue(x * freq, y * freq);
    norm += amp;
    amp *= gain; freq *= lacunarity;
  }
  return sum / norm;
}
function ridgeNoise(x, y, octaves) {
  octaves = octaves || 4;
  let amp = 1, freq = 1, sum = 0, norm = 0;
  for (let i = 0; i < octaves; i++) {
    const n = 1 - Math.abs(noiseValue(x * freq, y * freq) * 2 - 1);
    sum += amp * n * n;
    norm += amp;
    amp *= 0.5; freq *= 2.07;
  }
  return sum / norm;
}

// ---------- Geodesy ----------
// The flat game world of one flight: an azimuthal equidistant projection centred on the
// middle of the route, so the route is a straight line of its true length (times
// WORLD.SCALE) and nothing near it is distorted, anywhere on the globe.
// World metres: x = east, z = south (at the centre). One projection per flight.
const Theatre = {
  lat0: 59.65, lon0: 17.92, sin0: 0, cos0: 1,
  set(lat, lon) {
    this.lat0 = lat; this.lon0 = lon;
    this.sin0 = Math.sin(lat * DEG); this.cos0 = Math.cos(lat * DEG);
  },
  // centre it on the great-circle midpoint between two places
  setRoute(lat1, lon1, lat2, lon2) {
    const p1 = lat1 * DEG, p2 = lat2 * DEG, dl = (lon2 - lon1) * DEG;
    const bx = Math.cos(p2) * Math.cos(dl), by = Math.cos(p2) * Math.sin(dl);
    const lat = Math.atan2(Math.sin(p1) + Math.sin(p2), Math.hypot(Math.cos(p1) + bx, by));
    const lon = lon1 * DEG + Math.atan2(by, Math.cos(p1) + bx);
    this.set(lat * RAD, ((lon * RAD + 540) % 360) - 180);
  },
  // real kilometres in the projection plane (x east, y north)
  km(lat, lon) {
    const p = lat * DEG, dl = (lon - this.lon0) * DEG;
    const sp = Math.sin(p), cp = Math.cos(p), cl = Math.cos(dl);
    const cosc = clamp(this.sin0 * sp + this.cos0 * cp * cl, -1, 1);
    const c = Math.acos(cosc);
    const k = c < 1e-9 ? 1 : c / Math.sin(c);
    return { x: EARTH_R_KM * k * cp * Math.sin(dl), y: EARTH_R_KM * k * (this.cos0 * sp - this.sin0 * cp * cl) };
  },
  toWorld(lat, lon) {
    const q = this.km(lat, lon), s = WORLD.SCALE * 1000;
    return { x: q.x * s, z: -q.y * s };
  },
  toGeo(x, z) {
    const s = WORLD.SCALE * 1000;
    const px = x / s / EARTH_R_KM, py = -z / s / EARTH_R_KM;
    const c = Math.hypot(px, py);
    if (c < 1e-12) return { lat: this.lat0, lon: this.lon0 };
    const sc = Math.sin(c), cc = Math.cos(c);
    const lat = Math.asin(clamp(cc * this.sin0 + py * sc * this.cos0 / c, -1, 1));
    const lon = this.lon0 * DEG + Math.atan2(px * sc, c * this.cos0 * cc - py * this.sin0 * sc);
    return { lat: lat * RAD, lon: ((lon * RAD + 540) % 360) - 180 };
  }
};
const EARTH_R_KM = 6371.0088;
// Real great-circle distance in nautical miles between two lat/lon points
function geoDistanceNm(lat1, lon1, lat2, lon2) {
  const R = 6371.0088, d2r = DEG;
  const p1 = lat1 * d2r, p2 = lat2 * d2r;
  const dp = (lat2 - lat1) * d2r, dl = (lon2 - lon1) * d2r;
  const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a))) / NM_KM;
}
function geoBearingDeg(lat1, lon1, lat2, lon2) {
  const d2r = DEG;
  const p1 = lat1 * d2r, p2 = lat2 * d2r, dl = (lon2 - lon1) * d2r;
  const y = Math.sin(dl) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  return (Math.atan2(y, x) * RAD + 360) % 360;
}
// Wind direction (where it comes FROM, meteorological) -> heading it blows TOWARD
function windTowardHeading(windDirDeg) { return (windDirDeg + 180) % 360; }

// World axes: x = east, y = up, z = south (north is -z). A heading (radians,
// clockwise from north) points along hdgX/hdgZ; bearingDeg is its inverse.
// The sun at a local solar hour (0-24) on the generic path of TIME_OF_DAY (the equinox), seen
// from a latitude (degrees, SKY_LATITUDE_DEG if not given): elevation and azimuth (radians,
// azimuth clockwise from north), and the unit vector towards it in world axes (x east, y up, z south)
function sunAt(hour, latDeg) {
  const H = (hour - 12) * 15 * DEG, lat = (latDeg !== undefined ? latDeg : SKY_LATITUDE_DEG) * DEG;
  const el = Math.asin(Math.cos(lat) * Math.cos(H));
  const az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(lat)) + Math.PI;
  const c = Math.cos(el);
  return { el, az, x: Math.sin(az) * c, y: Math.sin(el), z: -Math.cos(az) * c };
}

function hdgX(h) { return Math.sin(h); }
function hdgZ(h) { return -Math.cos(h); }
function bearingDeg(fromX, fromZ, toX, toZ) {
  return (Math.atan2(toX - fromX, -(toZ - fromZ)) * RAD + 360) % 360;
}

// ---------- Formatting ----------
function fmtMoney(v, withUnit) {
  const n = Math.round(v);
  const s = Math.abs(n).toLocaleString('sv-SE', { maximumFractionDigits: 0 }).replace(/ /g, ' ');
  const signStr = n < 0 ? '-' : '';
  return withUnit === false ? signStr + s : signStr + s + ' ' + CURRENCY.symbol;
}
function fmtTime(sec) {
  sec = Math.max(0, Math.round(sec));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}
// a flight's length in minutes: "50 min", "1 h 05 min"
function fmtDuration(min) {
  min = Math.max(1, Math.round(min));
  const h = Math.floor(min / 60), m = min % 60;
  return h > 0 ? tr('{h} h {m} min', { h, m: String(m).padStart(2, '0') }) : tr('{m} min', { m });
}
// an airport's offset from UTC in hours: its own tz, else its country's (data/countries.js)
function utcOffset(a) {
  if (a.tz !== undefined) return a.tz;
  const c = typeof COUNTRIES !== 'undefined' && COUNTRIES[a.country];
  return c && c.tz !== undefined ? c.tz : 0;
}
function fmtClock(sec) {
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600) % 24, m = Math.floor(sec / 60) % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
function fmtDist(m) {
  if (Math.abs(m) < 1000) return Math.round(m) + ' m';
  return (m / 1000).toFixed(m < 20000 ? 2 : 1) + ' km';
}
function fmtAlt(m) { return Math.round(m / FT / 10) * 10; }
// a mass in tonnes to 0.1 t, without the unit: 7766 kg -> "7.8"
function fmtTonnes(kg) { return (kg / 1000).toFixed(1); }

// ---------- Units ----------
// Everything inside the game is in aviation units (ft, kt, nm, fpm). With the metric setting the
// texts are converted where they are shown (Units.text on prompts, messages and screens) and the
// instruments draw metric scales. Values are rounded to sensible metric numbers.
const Units = {
  metric: false,
  // numbers in metric units
  m(ft) { const m = ft * FT; return Math.abs(m) < 1000 ? Math.round(m / 10) * 10 : Math.round(m / 50) * 50; },
  kmh(kt) { const v = kt * 1.852; return Math.abs(v) < 50 ? Math.round(v) : Math.round(v / 5) * 5; },
  km(nm) { const v = nm * 1.852; return Math.abs(v) < 10 ? Math.round(v * 10) / 10 : Math.round(v); },
  ms(fpm) { return Math.round(fpm * FPM * 10) / 10; },
  // a value with its unit, in the chosen system
  alt(ft) { return this.metric ? fmtNum(this.m(ft)) + ' m' : fmtNum(Math.round(ft)) + ' ft'; },
  spd(kt) { return this.metric ? this.kmh(kt) + ' km/h' : Math.round(kt) + ' kt'; },
  dist(nm, dec) { return this.metric ? fmtNum(this.km(nm)) + ' km' : (dec ? nm.toFixed(dec) : fmtNum(Math.round(nm))) + ' nm'; },
  vs(fpm) { return this.metric ? this.ms(fpm).toFixed(1) + ' m/s' : Math.round(fpm) + ' fpm'; },
  // every "<number> ft|kt|nm|fpm" in a text, converted
  text(s) {
    if (!this.metric || !s) return s;
    // an image's data: URL is left as it is ("…A3nm+…" in its base64 is not a distance)
    return String(s).split(/(data:[^"'\s)]+)/).map((part, i) => (i % 2 ? part : this.convert(part))).join('');
  },
  convert(s) {
    return s.replace(/(\d{1,3}(?:[ ,  ]\d{3})+|\d+(?:\.\d+)?)\s?(ft|kt|nm|fpm)\b/g, (all, num, unit) => {
      const v = parseFloat(num.replace(/[ ,  ]/g, ''));
      if (!isFinite(v)) return all;
      if (unit === 'ft') return fmtNum(this.m(v)) + ' m';
      if (unit === 'kt') return this.kmh(v) + ' km/h';
      if (unit === 'nm') return fmtNum(this.km(v)) + ' km';
      return this.ms(v).toFixed(1) + ' m/s';
    });
  }
};
// 12 500 with a thin space for the thousands, 3.5 as it is
function fmtNum(v) {
  if (Math.abs(v) < 10000 || v % 1) return String(v);
  return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// ---------- Small DOM helpers ----------
function el(id) { return document.getElementById(id); }
function show(node, on) { if (node) node.hidden = !on; }
function setText(node, text) { if (node) node.textContent = text; }
