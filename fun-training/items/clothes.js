// Things to wear (ITEMS in the wear slots) as SVG in character coordinates (see characters/look.js), drawn on the
// character and alone as shop thumbnails. draw(): the art; box: the thumbnail viewBox (default WEAR_BOX by slot).
// Outfits: sleeve = arm colour (none = bare arms), legs = leg colour (none = fur). Shoes replace the feet. Hand items
// are drawn around the gripping paw at (0, 0) and point up and to the right.

const WEAR_BOX = {
  head: '26 -40 148 112',
  face: '40 62 120 52',
  neck: '50 124 100 96',
  body: '30 118 140 134',
  back: '-6 90 212 164',
  feet: '56 212 88 50',
  hand: '-40 -146 100 180',
};

const WEAR_ART = {}; // item id -> { draw, box?, … }, filled by items/wear/*.js

// Shared drawing helpers of the clothes files.
const WEAR_KIT = (() => {
  const GOLD = '#ffd23f', GOLD_D = '#f0a81c', GEM = '#7ad7ff', RUBY = '#ff4f7b';
  const RED = '#ff5a5f', RED_D = '#e8434b', BLUE = '#4f8cff', DARK = '#33324a', WHITE = '#fff';
  const f1 = n => +n.toFixed(1);
  // The left half and its mirror image on the right (around x 100).
  const mirror = s => `<g transform="matrix(-1 0 0 1 200 0)">${s}</g>`;
  const both = s => s + mirror(s);
  const shine = (d, w = 3) => `<path d="${d}" fill="none" stroke="#fff" stroke-width="${w}" stroke-linecap="round" opacity="0.6"/>`;
  // Half width at height y of a shape a bit wider than the body (ellipse (100, 182) 47 × 49).
  const hw = y => 47 * Math.sqrt(Math.max(0, 1 - Math.pow((y - 182) / 49, 2)));
  // A piece of the torso from y top to y hem hugging the body; dt / dh: how much the top / hem edge dips in the middle.
  const part = (top, hem, dt = 10, dh = 8) => {
    const a = f1(hw(top)), b = f1(hw(hem));
    return `M${f1(100 - a)} ${top}Q100 ${top + dt} ${f1(100 + a)} ${top}A47 49 0 0 1 ${f1(100 + b)} ${hem}` +
      `Q100 ${hem + dh} ${f1(100 - b)} ${hem}A47 49 0 0 1 ${f1(100 - a)} ${top}Z`;
  };
  // A stripe across the torso.
  const band = (y1, y2, fill) => `<path d="M${f1(100 - hw(y1))} ${y1}L${f1(100 + hw(y1))} ${y1}L${f1(100 + hw(y2))} ${y2}` +
    `L${f1(100 - hw(y2))} ${y2}Z" fill="${fill}"/>`;
  // Short sleeves at the shoulders: under the arms on a character, seen in the shop.
  const stubs = fill => both(`<path d="M76 144 Q56 144 48 158 L54 176 Q64 176 72 168 Z" fill="${fill}" ${ln()}/>`);
  function star(x, y, r, k = 0.45) {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * k : r;
      d += (i ? 'L' : 'M') + f1(x + Math.cos(a) * rr) + ' ' + f1(y + Math.sin(a) * rr);
    }
    return d + 'Z';
  }
  // A twinkling four-pointed sparkle.
  const spark = (x, y, r) => {
    const c = f1(r * 0.2);
    return `<path class="an-twinkle" d="M${x} ${y - r}Q${x + c} ${y - c} ${x + r} ${y}Q${x + c} ${y + c} ${x} ${y + r}` +
      `Q${x - c} ${y + c} ${x - r} ${y}Q${x - c} ${y - c} ${x} ${y - r}Z" fill="#fff" ${ln(1.5)}/>`;
  };
  // A five-petal flower of radius r.
  function bloom(x, y, r, fill) {
    const R = r * 0.68;
    let d = '';
    for (let i = 0; i <= 5; i++) {
      const a = -Math.PI / 2 + i * Math.PI * 2 / 5, px = f1(x + Math.cos(a) * R), py = f1(y + Math.sin(a) * R);
      d += i ? `A${f1(R * 0.62)} ${f1(R * 0.62)} 0 0 1 ${px} ${py}` : `M${px} ${py}`;
    }
    return `<path d="${d}Z" fill="${fill}" ${ln(2)}/><circle cx="${x}" cy="${y}" r="${f1(r * 0.3)}" fill="${GOLD}" ${ln(1.5)}/>`;
  }
  // A frame line: the ink edge, then the colour on top.
  const frame = (d, color, w, fill = 'fill="none"') => `<path d="${d}" ${fill} stroke="${INK}" stroke-width="${w + 4}" stroke-linejoin="round" stroke-linecap="round"/>` +
    `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;

  return { GOLD, GOLD_D, GEM, RUBY, RED, RED_D, BLUE, DARK, WHITE, f1, mirror, both, shine, hw, part, band, stubs, star, spark, bloom, frame };
})();
