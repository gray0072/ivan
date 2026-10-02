// Room art: walls, floors and furniture of the character's room (ITEMS of a 'room' slot), as SVG fragments.
// Room: viewBox 0 0 800 500 — wall 0..800 × 0..340, floor 0..800 × 340..500 (the skirting at y 340 is floor art).
// The character stands in the middle (x 300–500, feet at y ≈ 465): only the rug (under its feet) and the lamp
// (from the ceiling at x 400, down to y 185) go there. Each slot draws in its own local coordinates, moved to
// ROOM_AT[slot]: bed / table / plant / toy / pet — bottom centre (standing on the floor); window / picture / rug —
// centre; lamp — the ceiling point. draw(c): c = { character, equip } of the player (the portrait shows them).

const ROOM_AT = {
  wall: [0, 0], floor: [0, 0], window: [678, 128], picture: [135, 108], rug: [400, 460], plant: [260, 372],
  bed: [115, 450], table: [685, 455], lamp: [400, 0], toy: [257, 488], pet: [537, 488],
};
// Shop thumbnails: the viewBox of each slot's local drawing (an item's own box overrides it).
const ROOM_BOX = {
  wall: '230 0 340 340', floor: '300 340 200 160', bed: '-106 -134 212 142', table: '-110 -206 220 214',
  lamp: '-96 -4 192 192', window: '-100 -104 200 208', rug: '-176 -60 352 120', picture: '-90 -74 180 148',
  plant: '-52 -196 104 202', toy: '-50 -116 100 122', pet: '-48 -154 96 160',
};
// Drawn before the character; toy and pet go after it.
const ROOM_ORDER = ['wall', 'window', 'picture', 'floor', 'rug', 'plant', 'bed', 'table', 'lamp'];

const ROOM_ART = {}; // item id -> { draw, box?, … }, filled by items/room/*.js

// Shared drawing helpers of the room item files.
const ROOM_KIT = (() => {
  const r1 = n => Math.round(n * 10) / 10;
  // A circle as a sub-path (many dots in one <path>).
  const dot = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r} ${r} 0 1 0 ${r1(2 * r)} 0a${r} ${r} 0 1 0 ${r1(-2 * r)} 0`;
  function star(x, y, r, k = 0.45) {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * k : r;
      d += (i ? 'L' : 'M') + r1(x + Math.cos(a) * rr) + ' ' + r1(y + Math.sin(a) * rr);
    }
    return d + 'Z';
  }
  // A twinkling four-point sparkle (the elite pieces).
  const sparkle = (x, y, r) => `<path class="an-twinkle" d="M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}` +
    `Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z" fill="#fff" stroke="#f5b915" stroke-width="1.5" stroke-linejoin="round"/>`;
  // an-sway pivots at the bottom and an-flicker at the top of the box: turned upside down, a lamp swings from
  // its ceiling hook and a flame flickers from its wick.
  const flip = (cls, s) => `<g transform="scale(1 -1)"><g class="${cls}"><g transform="scale(1 -1)">${s}</g></g></g>`;
  const flameD = (x, y, s) => `M${x} ${r1(y - 18 * s)}C${r1(x + 2 * s)} ${r1(y - 12 * s)} ${r1(x + 7 * s)} ${r1(y - 9 * s)} ${r1(x + 7 * s)} ${r1(y - 4 * s)}` +
    `C${r1(x + 7 * s)} ${y} ${r1(x - 7 * s)} ${y} ${r1(x - 7 * s)} ${r1(y - 4 * s)}C${r1(x - 7 * s)} ${r1(y - 9 * s)} ${r1(x - 2 * s)} ${r1(y - 12 * s)} ${x} ${r1(y - 18 * s)}Z`;
  // A flame standing on (x, y).
  const flame = (x, y, s = 1) => flip('an-flicker', `<path d="${flameD(x, y, s)}" fill="#ffa62b" ${ln(1.5)}/>` +
    `<path d="${flameD(x, y - 1, s * 0.55)}" fill="#fff3a0"/>`);
  const cloud = (x, y, s = 1) => `<path d="${dot(x, y, 8 * s)}${dot(x + 10 * s, y - 5 * s, 10 * s)}${dot(x + 21 * s, y, 8 * s)}` +
    `M${x} ${y + 8 * s}H${x + 21 * s}V${y}H${x}Z" fill="#fff"/>`;
  const crown = (x, y, s = 1, fill = '#ffcf3f') => `<path d="M${x - 14 * s} ${y}L${x - 16 * s} ${y - 16 * s}L${x - 7 * s} ${y - 8 * s}L${x} ${y - 20 * s}` +
    `L${x + 7 * s} ${y - 8 * s}L${x + 16 * s} ${y - 16 * s}L${x + 14 * s} ${y}Z" fill="${fill}" ${ln(2)}/>` +
    `<circle cx="${x}" cy="${y - 5 * s}" r="${2.5 * s}" fill="#ff4f7b"/>`;
  const gem = (x, y, s, fill) => `<path d="M${x} ${y - s}L${x + s * 0.8} ${y}L${x} ${y + s}L${x - s * 0.8} ${y}Z" fill="${fill}" ${ln(1.5)}/>`;
  // The player's own character, head and shoulders (portrait, mirror).
  const head = (c, x, y, w) => `<svg viewBox="22 -22 156 170" x="${x}" y="${y}" width="${w}" height="${r1(w * 170 / 156)}">` +
    `${Look.inner((c && c.character) || 'kitty', (c && c.equip) || {}, 'happy')}</svg>`;
  const skirt = (fill, top) => `<rect x="-5" y="336" width="810" height="16" fill="${fill}" ${ln(2)}/>` +
    (top ? `<rect x="-5" y="336" width="810" height="5" fill="${top}" ${ln(2)}/>` : '');
  const mod = (a, n) => ((a % n) + n) % n;

  return { r1, dot, star, sparkle, flip, flameD, flame, cloud, crown, gem, head, skirt, mod };
})();
