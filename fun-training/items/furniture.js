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

const ROOM_ART = (() => {
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

  return {
    // ---------- walls (0..800 × 0..340) ----------
    plaster: {
      box: '460 0 340 340',
      draw: () => {
        const P = '#cdc4b2';
        let h = `<rect x="0" y="0" width="800" height="340" fill="${P}"/><rect x="0" y="0" width="800" height="8" fill="#b8ad98"/>` +
          '<g fill="#bcb19c" opacity="0.6"><ellipse cx="130" cy="255" rx="80" ry="30"/><ellipse cx="350" cy="60" rx="90" ry="24"/>' +
          '<ellipse cx="700" cy="300" rx="66" ry="24"/><ellipse cx="560" cy="130" rx="44" ry="20"/><ellipse cx="40" cy="120" rx="30" ry="50"/></g>';
        const crack = d => `<path d="${d}" fill="none" stroke="#6f6454" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
        h += crack('M266 8 L272 28 L261 44 L275 64 L268 88 M261 44 L247 54 M275 64 L286 70') +
          crack('M462 132 L478 150 L470 166 L488 182 L484 200 M470 166 L456 178') + crack('M8 300 L30 292 L40 306 L62 298');
        // A patch of missing plaster showing the bricks.
        h += '<rect x="466" y="218" width="150" height="94" fill="#e3cfae"/>';
        for (let r = 0; r < 6; r++) {
          const y = 221 + r * 15, off = r % 2 ? 14 : 0;
          for (let x = 466 + off; x < 590; x += 28) {
            h += `<rect x="${x + 1.5}" y="${y + 1.5}" width="25" height="12" rx="1.5" fill="${mod(r * 2 + x / 28 | 0, 3) ? '#c8653f' : '#b0533a'}"/>`;
          }
        }
        const hole = 'M512 236 L532 229 L552 237 L570 232 L578 252 L571 270 L579 290 L552 299 L530 292 L508 298 L501 274 L507 254 Z';
        h += `<path d="M456 214 H624 V316 H456 Z ${hole}" fill="${P}" fill-rule="evenodd"/><path d="${hole}" fill="none" ${ln(2)}/>`;
        // A cobweb in the top right corner, with a little spider.
        const sp = [0, 22, 45, 68, 90].map(a => [Math.cos(a * Math.PI / 180), Math.sin(a * Math.PI / 180)]);
        let web = sp.map(([cx, cy]) => `M800 0L${r1(800 - 84 * cx)} ${r1(84 * cy)}`).join('');
        for (const rr of [22, 42, 62, 80]) {
          web += sp.map(([cx, cy], i) => {
            const p = `${r1(800 - rr * cx)} ${r1(rr * cy)}`;
            if (!i) return 'M' + p;
            const [px, py] = sp[i - 1], mx = (cx + px) / 2 * rr * 0.8, my = (cy + py) / 2 * rr * 0.8;
            return `Q${r1(800 - mx)} ${r1(my)} ${p}`;
          }).join('');
        }
        h += `<path d="${web}" fill="none" stroke="#f7f4ee" stroke-width="1.6"/>` +
          '<path d="M772 34 V98" stroke="#f7f4ee" stroke-width="1.2"/>' +
          `<path d="M767 100 L758 95 M767 104 L757 106 M767 108 L759 115 M777 100 L786 95 M777 104 L787 106 M777 108 L785 115" ${ln(1.5)}/>` +
          `<circle cx="772" cy="104" r="6.5" fill="${INK}"/><circle cx="770" cy="102" r="1.3" fill="#fff"/><circle cx="774.5" cy="102" r="1.3" fill="#fff"/>`;
        return h;
      },
    },
    stripes: {
      draw: () => {
        let h = '<rect x="0" y="0" width="800" height="340" fill="#eaf8f2"/>';
        for (let x = 0; x < 800; x += 50) h += `<rect x="${x + 6}" y="0" width="22" height="340" fill="#bfe8d6"/><rect x="${x + 38}" y="0" width="4" height="340" fill="#ffc6b0"/>`;
        return h + `<rect x="-5" y="-5" width="810" height="17" fill="#8fd2b8" ${ln(2)}/>`;
      },
    },
    flowerwall: {
      draw: () => {
        const cols = ['#ff8fb0', '#ffc94d', '#8fcfff', '#c3a2ff'];
        let h = '<rect x="0" y="0" width="800" height="340" fill="#ffe8f0"/>', leaves = '';
        for (let r = 0; r < 5; r++) {
          for (let i = 0; i < 11; i++) {
            const x = i * 80 + (r % 2 ? 40 : 0), y = 34 + r * 68;
            let pet = '';
            for (let k = 0; k < 5; k++) { const a = k * 1.2566 - 1.5708; pet += dot(x + Math.cos(a) * 8, y + Math.sin(a) * 8, 6.5); }
            h += `<path d="${pet}" fill="${cols[(r + i) % 4]}"/><circle cx="${x}" cy="${y}" r="4.5" fill="#fff4c2"/>`;
            leaves += dot(x - 13, y + 14, 3.5) + dot(x + 13, y + 14, 3.5);
          }
        }
        return h + `<path d="${leaves}" fill="#9fdc9a"/>`;
      },
    },
    starwall: {
      draw: () => {
        let h = '<rect x="0" y="0" width="800" height="340" fill="#33427f"/>', d = '';
        for (let i = 0; i < 46; i++) d += dot((i * 137 + 11) % 800, (i * 89) % 330 + 5, 1.8);
        h += `<path d="${d}" fill="#9fb0ff"/>`;
        h += `<path d="M311.6 38 A34 34 0 1 0 311.6 102 A40 40 0 0 1 311.6 38 Z" fill="#ffe680" ${ln(2)}/>`;
        for (let i = 0; i < 22; i++) {
          const x = (i * 233 + 40) % 780 + 10, y = (i * 97 + 30) % 300 + 15;
          if (Math.abs(x - 300) < 50 && y < 120) continue;
          h += `<path${i % 4 ? '' : ' class="an-twinkle"'} d="${star(x, y, 9 + (i % 3) * 3)}" fill="#ffe27a"/>`;
        }
        return h + `<ellipse cx="560" cy="246" rx="30" ry="8" transform="rotate(-18 560 246)" fill="none" stroke="#ffd0e4" stroke-width="5"/>` +
          `<circle cx="560" cy="246" r="16" fill="#ff9fbf" ${ln(2)}/>` +
          `<path d="M531 258 Q560 250 589 234" fill="none" stroke="#ffd0e4" stroke-width="5" stroke-linecap="round"/>`;
      },
    },
    castlewall: {
      draw: () => {
        const st = ['#b3afc4', '#a5a1b8', '#bdb9cc'];
        let h = '<rect x="0" y="0" width="800" height="340" fill="#6c6880"/>';
        for (let r = 0; r < 9; r++) {
          const y = r * 40 - 10, off = r % 2 ? 45 : 0;
          for (let x = -45 + off; x < 800; x += 90) {
            h += `<rect x="${x + 3}" y="${y + 3}" width="84" height="34" rx="7" fill="${st[mod(r * 2 + Math.round(x / 90), 3)]}" ${ln(2)}/>`;
          }
        }
        const torch = (x, y) => `<path d="M${x - 12} ${y + 26} L${x} ${y + 40} L${x + 12} ${y + 26}" fill="none" stroke="#4a4458" stroke-width="5" stroke-linecap="round"/>` +
          `<rect x="${x - 5}" y="${y}" width="10" height="48" rx="3" fill="#8a5a34" ${ln(2)}/>` +
          `<circle cx="${x}" cy="${y - 14}" r="22" fill="#ffd36b" opacity="0.25"/>` + flame(x, y - 2, 1.7) +
          `<rect x="${x - 10}" y="${y - 4}" width="20" height="9" rx="3" fill="#5a5468" ${ln(2)}/>`;
        return h + torch(255, 96) + torch(548, 96);
      },
    },
    palace: {
      draw: () => {
        let h = '<rect x="0" y="0" width="800" height="340" fill="#fbe6ad"/>', lat = '';
        for (let x = -340; x < 800; x += 40) lat += `M${x} 0L${x + 340} 340M${x + 340} 0L${x} 340`;
        h += `<path d="${lat}" stroke="#f3d27e" stroke-width="2"/>`;
        for (const cx of [80, 240, 400, 560, 720]) {
          h += `<rect x="${cx - 58}" y="56" width="116" height="234" rx="10" fill="#fff3d2" stroke="#e6a823" stroke-width="7"/>` +
            `<rect x="${cx - 62}" y="52" width="124" height="242" rx="13" fill="none" ${ln(2)}/>` +
            `<rect x="${cx - 54}" y="60" width="108" height="226" rx="7" fill="none" ${ln(1.5)}/>` +
            `<path d="M${cx} 136 L${cx + 24} 170 L${cx} 204 L${cx - 24} 170 Z" fill="#ffcf3f" ${ln(2)}/>` +
            `<path d="M${cx} 152 L${cx + 11} 170 L${cx} 188 L${cx - 11} 170 Z" fill="#ff5d8f" ${ln(1.5)}/>` + crown(cx, 112, 1.1);
        }
        for (const x of [0, 160, 320, 480, 640, 800]) {
          h += `<rect x="${x - 10}" y="22" width="20" height="282" fill="#f2bd34" ${ln(2)}/><path d="M${x} 30 V296" stroke="#ffe08a" stroke-width="3"/>`;
        }
        let sc = 'M-5 22 H805 V28';
        for (let x = 800; x > 0; x -= 40) sc += `Q${x - 20} 48 ${x - 40} 28`;
        h += `<path d="${sc}Z" fill="#f2bd34" ${ln(2)}/><rect x="-5" y="-5" width="810" height="27" fill="#e6a823" ${ln(2)}/>` +
          `<path d="${Array.from({ length: 20 }, (_, i) => dot(i * 40 + 20, 12, 4)).join('')}" fill="#fff3c4"/>` +
          `<rect x="-5" y="300" width="810" height="45" fill="#e6a823" ${ln(2)}/><path d="M0 310 H800" stroke="#ffe08a" stroke-width="4"/>`;
        for (const [x, y] of [[160, 46], [480, 40], [700, 52], [330, 262], [620, 250], [40, 200], [250, 160]]) h += sparkle(x, y, 9);
        return h;
      },
    },

    // ---------- floors (0..800 × 340..500) ----------
    boards: {
      draw: () => {
        let h = '<rect x="0" y="340" width="800" height="160" fill="#b2946f"/>', joints = '', nails = '';
        for (let r = 0; r < 4; r++) {
          const y = 352 + r * 37;
          if (r % 2) h += `<rect x="0" y="${y}" width="800" height="37" fill="#a68866"/>`;
          for (let x = 60 + (r * 170) % 260; x < 800; x += 260) {
            joints += `M${x} ${y}v37`;
            nails += dot(x - 7, y + 8, 2) + dot(x - 7, y + 29, 2) + dot(x + 7, y + 8, 2) + dot(x + 7, y + 29, 2);
          }
        }
        h += '<path d="M40 372 Q120 366 200 374 M420 446 Q500 440 600 450 M660 410 Q700 406 760 412 M150 480 Q220 476 280 482" fill="none" stroke="#c9ad88" stroke-width="3" stroke-linecap="round"/>' +
          '<g fill="#8c6e4e"><ellipse cx="330" cy="408" rx="9" ry="5"/><ellipse cx="610" cy="372" rx="7" ry="4"/><ellipse cx="90" cy="446" rx="8" ry="4.5"/></g>' +
          '<g fill="#b2946f"><ellipse cx="330" cy="408" rx="4" ry="2"/><ellipse cx="90" cy="446" rx="3.5" ry="2"/></g>' +
          `<path d="M0 389H800M0 426H800M0 463H800${joints}" stroke="#6f563f" stroke-width="2.5"/><path d="${nails}" fill="#4f3f33"/>` +
          '<path d="M700 426 L760 426 L740 431 Z M230 463 L300 463 L270 467 Z" fill="#5b4532"/>';
        return h + skirt('#9a7b5a') + `<path d="M180 336 L186 344 L198 344 L204 336 Z M560 352 L566 346 L578 346 L582 352 Z" fill="#6f563f"/>`;
      },
    },
    parquet: {
      draw: () => {
        let h = '<rect x="0" y="340" width="800" height="160" fill="#dca469"/>', alt = '', lines = '', grid = '';
        for (let r = 0; r < 4; r++) {
          const y = 352 + r * 37;
          grid += `M0 ${y}H800`;
          for (let i = 0; i < 20; i++) {
            const x = i * 40;
            if ((r + i) % 2) { alt += `M${x} ${y}h40v37h-40z`; lines += `M${x + 13} ${y}v37M${x + 27} ${y}v37`; }
            else lines += `M${x} ${y + 12}h40M${x} ${y + 25}h40`;
          }
        }
        for (let x = 40; x < 800; x += 40) grid += `M${x} 352V500`;
        return h + `<path d="${alt}" fill="#cd9156"/><path d="${lines}" stroke="#b57a45" stroke-width="1.5"/>` +
          `<path d="${grid}" stroke="#8f5a2e" stroke-width="2"/>` +
          '<path d="M70 490 L150 370 M100 494 L176 380 M540 490 L610 386 M566 494 L632 396" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity="0.22"/>' +
          skirt('#f5e6cc');
      },
    },
    checker: {
      draw: () => {
        let t = '';
        for (let r = 0; r < 4; r++) for (let i = 0; i < 20; i++) if ((r + i) % 2) t += `M${i * 40} ${352 + r * 37}h40v37h-40z`;
        return '<rect x="0" y="340" width="800" height="160" fill="#fffaf2"/>' + `<path d="${t}" fill="#7cc8ec"/>` +
          '<path d="M60 492 L130 372 M90 494 L156 380 M600 492 L660 388" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity="0.35"/>' +
          skirt('#4fa6d4');
      },
    },
    marble: {
      draw: () => {
        let alt = '', grout = 'M0 426H800', inlay = '';
        for (let r = 0; r < 2; r++) for (let i = 0; i < 8; i++) if ((r + i) % 2) alt += `M${i * 100} ${352 + r * 74}h100v74h-100z`;
        for (let x = 100; x < 800; x += 100) { grout += `M${x} 352V500`; inlay += `M${x} 418L${x + 8} 426L${x} 434L${x - 8} 426Z`; }
        return '<rect x="0" y="340" width="800" height="160" fill="#f7f2f6"/>' + `<path d="${alt}" fill="#ece2ee"/>` +
          '<path d="M10 370 Q40 380 60 400 T96 420 M130 440 Q170 450 180 480 M260 360 Q300 380 290 410 M420 450 Q460 460 490 496 ' +
          'M560 362 Q590 372 620 368 T680 400 M720 450 Q750 470 790 474 M330 470 Q360 476 380 494" fill="none" stroke="#cbbfd6" stroke-width="2.5"/>' +
          '<path d="M40 400 Q50 412 70 414 M600 380 Q620 392 640 388 M450 470 Q470 476 478 490" fill="none" stroke="#d9cfe2" stroke-width="1.5"/>' +
          `<path d="${grout}" stroke="#e2b23c" stroke-width="3"/><path d="${inlay}" fill="#ffcf3f" ${ln(1.5)}/>` +
          '<path d="M150 488 L210 366 M180 490 L236 376 M650 488 L700 384" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity="0.6"/>' +
          skirt('#fffaf4', '#f0c44c');
      },
    },

    // ---------- beds (bottom centre; x -100..100) ----------
    box: {
      box: '-106 -100 212 108',
      draw: () => `<path d="M-84 -46 L-76 -80 L74 -84 L84 -46 Z" fill="#b8854c" ${ln()}/>` +
        `<path d="M-92 -48 L-100 -70 L-38 -68 L-32 -48 Z" fill="#c38c52" ${ln()}/>` +
        `<path d="M92 -48 L100 -64 L46 -66 L40 -48 Z" fill="#c38c52" ${ln()}/>` +
        `<rect x="-92" y="-48" width="184" height="48" rx="3" fill="#d29d62" ${ln()}/>` +
        '<rect x="-7" y="-46" width="14" height="44" fill="#e8c88f"/>' +
        `<path d="M-66 -12 V-32 M-72 -26 L-66 -32 L-60 -26 M-52 -12 V-32 M-58 -26 L-52 -32 L-46 -26" fill="none" ${ln(2)}/>` +
        `<path d="M92 -16 L80 0 L92 0 Z" fill="#a8763f" ${ln(2)}/>` +
        `<ellipse cx="-62" cy="-58" rx="22" ry="9" fill="#e4dccb" ${ln()}/><ellipse cx="-56" cy="-60" rx="6" ry="3" fill="#cfc4ac"/>` +
        `<path d="M-38 -58 Q-6 -68 22 -58 Q48 -66 72 -56 L76 -38 L78 -16 L70 -22 L64 -12 L56 -24 L48 -14 L40 -30 Q14 -44 -20 -46 Q-36 -46 -38 -58 Z" fill="#8ea2b6" ${ln()}/>` +
        '<path d="M-26 -50 Q10 -58 50 -52 M40 -30 Q50 -40 72 -40" fill="none" stroke="#7a8ea3" stroke-width="3"/>' +
        `<rect x="6" y="-62" width="18" height="13" fill="#c9a07a" transform="rotate(-6 15 -55)" ${ln(1.5)}/>` +
        '<rect x="9" y="-59" width="12" height="7" fill="none" stroke="#fff" stroke-width="1.2" stroke-dasharray="2.5 2.5" transform="rotate(-6 15 -55)"/>' +
        `<ellipse cx="54" cy="-48" rx="5" ry="3" fill="#5f7084"/>`,
    },
    mattress: {
      box: '-106 -86 212 94',
      draw: () => {
        let s = '';
        for (let x = -82; x <= 82; x += 12) s += `M${x} -32V-4`;
        return `<rect x="-96" y="-36" width="192" height="36" rx="12" fill="#f4efe2" ${ln()}/>` +
          `<path d="${s}" stroke="#a9c3e6" stroke-width="3"/>` +
          `<rect x="-92" y="-58" width="52" height="26" rx="12" fill="#fff" ${ln()}/>` +
          `<path d="M-40 -40 Q20 -48 92 -38 L94 -12 Q40 -6 -36 -14 Z" fill="#ef9a5b" ${ln()}/>` +
          '<path d="M-38 -27 Q20 -33 93 -25" stroke="#fff3d6" stroke-width="4" fill="none"/>' +
          '<path d="M-38 -20 Q20 -26 93 -18" stroke="#d97e40" stroke-width="2" fill="none"/>';
      },
    },
    woodbed: {
      draw: () => `<path d="M-98 0 V-108 Q-98 -128 -87 -128 Q-76 -128 -76 -108 V0 Z" fill="#c98b52" ${ln()}/>` +
        `<path d="${'M-87 -92 C-94 -100 -94 -108 -87 -105 C-80 -108 -80 -100 -87 -92 Z'}" fill="#ff8fb0" ${ln(1.5)}/>` +
        `<path d="M76 0 V-74 Q76 -90 87 -90 Q98 -90 98 -74 V0 Z" fill="#c98b52" ${ln()}/>` +
        `<rect x="-78" y="-50" width="156" height="28" rx="3" fill="#c98b52" ${ln()}/>` +
        '<path d="M-70 -40 Q-20 -44 30 -38 M-60 -30 Q0 -34 60 -30" fill="none" stroke="#a8693a" stroke-width="2"/>' +
        `<rect x="-78" y="-70" width="154" height="22" rx="6" fill="#fbfaf5" ${ln()}/>` +
        `<ellipse cx="-54" cy="-76" rx="21" ry="11" fill="#fff" ${ln()}/>` +
        `<path d="M-34 -76 Q20 -82 76 -74 L76 -34 Q20 -28 -32 -38 Z" fill="#7ec8f0" ${ln()}/>` +
        '<path d="M-6 -76 l14 -1 l1 13 l-14 1 z M36 -77 l14 0 l0 13 l-14 0 z M16 -60 l14 0 l0 13 l-14 0 z M-24 -60 l14 0 l0 13 l-14 0 z M56 -60 l14 0 l0 13 l-14 0 z" fill="#ffd166"/>' +
        '<circle cx="-62" cy="-80" r="4" fill="#fff" opacity="0.8"/>',
    },
    carbed: {
      box: '-108 -114 216 122',
      draw: () => `<rect x="-62" y="-76" width="106" height="22" rx="6" fill="#fff" ${ln()}/>` +
        `<ellipse cx="-46" cy="-80" rx="17" ry="9" fill="#fff" ${ln()}/>` +
        `<rect x="-20" y="-78" width="64" height="20" rx="4" fill="#fff" ${ln()}/>` +
        `<path d="M-12 -78h8v10h-8zM4 -78h8v10h-8zM20 -78h8v10h-8zM36 -78h7v10h-7zM-20 -68h8v10h-8zM-4 -68h8v10h-8zM12 -68h8v10h-8zM28 -68h8v10h-8z" fill="${INK}"/>` +
        `<rect x="-88" y="-96" width="7" height="24" fill="#c22c2c" ${ln(2)}/><rect x="-102" y="-104" width="40" height="11" rx="3" fill="#ef3b3b" ${ln()}/>` +
        `<path d="M-94 -24 L-94 -66 Q-94 -74 -84 -74 L-68 -74 L-62 -58 L40 -58 Q70 -58 90 -44 Q98 -38 98 -30 L98 -24 Q98 -18 92 -18 L-88 -18 Q-94 -18 -94 -24 Z" fill="#ef3b3b" ${ln()}/>` +
        '<path d="M-92 -40 H86" stroke="#ffd23f" stroke-width="7"/><path d="M48 -54 Q72 -52 86 -42" fill="none" stroke="#ff9b9b" stroke-width="4" stroke-linecap="round"/>' +
        `<circle cx="8" cy="-38" r="12" fill="#fff" ${ln(2)}/><path d="M4 -42 L9 -46 V-30" fill="none" ${ln(3)}/>` +
        `<ellipse cx="93" cy="-32" rx="4" ry="6" fill="#fff6a8" ${ln(1.5)}/>` +
        [-58, 58].map(x => `<circle cx="${x}" cy="-18" r="18" fill="${INK}"/><circle cx="${x}" cy="-18" r="8" fill="#d6dbe6" ${ln(2)}/>` +
          `<circle cx="${x}" cy="-18" r="2.5" fill="${INK}"/>`).join(''),
    },
    royalbed: {
      box: '-130 -262 260 270',
      draw: () => {
        let sc = 'M104 -204';
        for (let x = 104; x > -104; x -= 26) sc += `Q${x - 13} -186 ${x - 26} -204`;
        let fringe = '';
        for (let x = -36; x <= 86; x += 8) fringe += `M${x} -34v7`;
        return `<rect x="-88" y="-202" width="176" height="158" fill="#e8d6ff" ${ln(2)}/>` +
          '<path d="M-60 -200 V-50 M-30 -200 V-50 M0 -200 V-50 M30 -200 V-50 M60 -200 V-50" stroke="#d2b8f5" stroke-width="3"/>' +
          `<rect x="-98" y="-222" width="11" height="222" rx="3" fill="#f2bd34" ${ln(2)}/><rect x="87" y="-222" width="11" height="222" rx="3" fill="#f2bd34" ${ln(2)}/>` +
          `<path d="M-104 -224 Q0 -248 104 -224 Z" fill="#7a3fc4" ${ln()}/>` +
          `<path d="M-104 -226 H104 V-204 ${sc.slice(9)} Z" fill="#8f5ad8" ${ln()}/>` +
          `<path d="${sc.replace('M104 -204', 'M104 -206')}" fill="none" stroke="#ffcf3f" stroke-width="4"/>` + crown(0, -234, 1.2) +
          `<path d="M-98 -202 Q-74 -196 -60 -202 Q-64 -156 -84 -122 Q-70 -90 -80 -44 L-98 -44 Z" fill="#8f5ad8" ${ln()}/>` +
          `<path d="M98 -202 Q74 -196 60 -202 Q64 -156 84 -122 Q70 -90 80 -44 L98 -44 Z" fill="#8f5ad8" ${ln()}/>` +
          `<circle cx="-86" cy="-122" r="6" fill="#ffcf3f" ${ln(2)}/><circle cx="86" cy="-122" r="6" fill="#ffcf3f" ${ln(2)}/>` +
          `<rect x="-96" y="-150" width="22" height="104" rx="8" fill="#ffcf3f" ${ln()}/><circle cx="-85" cy="-136" r="5" fill="#ff4f7b" ${ln(1.5)}/>` +
          `<rect x="-86" y="-80" width="172" height="30" rx="8" fill="#fff6e6" ${ln()}/>` +
          `<rect x="-94" y="-52" width="188" height="34" rx="5" fill="#f2bd34" ${ln()}/>` +
          gem(-50, -35, 8, '#ff4f7b') + gem(0, -35, 8, '#5ec8ff') + gem(50, -35, 8, '#7be07b') +
          `<circle cx="-82" cy="-10" r="9" fill="#e6a823" ${ln(2)}/><circle cx="82" cy="-10" r="9" fill="#e6a823" ${ln(2)}/>` +
          `<rect x="-82" y="-104" width="40" height="28" rx="12" fill="#8f5ad8" ${ln()}/><rect x="-60" y="-98" width="34" height="24" rx="11" fill="#ffcf3f" ${ln()}/>` +
          `<path d="M-40 -84 Q24 -90 90 -82 L90 -34 Q24 -28 -38 -40 Z" fill="#d93a5c" ${ln()}/>` +
          '<path d="M-38 -46 Q24 -36 89 -40" fill="none" stroke="#ffcf3f" stroke-width="4"/>' +
          `<path d="${fringe}" stroke="#ffcf3f" stroke-width="2.5" stroke-linecap="round"/>` +
          `<path d="${star(26, -64, 9)}" fill="#ffcf3f" ${ln(1.5)}/>` +
          sparkle(-56, -186, 10) + sparkle(56, -168, 8) + sparkle(64, -96, 8) + sparkle(-20, -216, 7);
      },
    },

    // ---------- tables (bottom centre; x -105..105) ----------
    crate: {
      box: '-76 -140 152 148',
      draw: () => `<rect x="-54" y="-80" width="108" height="80" rx="3" fill="#c79157" ${ln()}/>` +
        tube('M-38 -8 L38 -72', '#b07a44', 7) +
        `<path d="M-54 -54 H54 M-54 -27 H54" stroke="${INK}" stroke-width="2.5"/>` +
        `<rect x="-54" y="-80" width="13" height="80" fill="#b07a44" ${ln(2)}/><rect x="41" y="-80" width="13" height="80" fill="#b07a44" ${ln(2)}/>` +
        `<path d="${dot(-47, -72, 1.8)}${dot(-47, -8, 1.8)}${dot(47, -72, 1.8)}${dot(47, -8, 1.8)}" fill="${INK}"/>` +
        '<circle cx="-20" cy="-106" r="24" fill="#ffe58a" opacity="0.25"/>' +
        `<ellipse cx="-20" cy="-82" rx="15" ry="3.5" fill="#e9e2d4" ${ln(2)}/>` +
        `<path d="M-26 -82 V-96 Q-23 -98 -20 -96 Q-17 -98 -14 -96 V-82 Z" fill="#f6edd6" ${ln(2)}/>` +
        `<path d="M-15 -95 Q-12 -90 -14 -87" fill="none" stroke="#f6edd6" stroke-width="3" stroke-linecap="round"/>` +
        `<path d="M-20 -97 V-101" ${ln(1.5)}/>` + flame(-20, -100, 0.85) +
        `<path d="M30 -112 L35 -124 L40 -113" fill="#c3c9d4" ${ln(1.5)}/>` +
        `<rect x="14" y="-112" width="26" height="32" fill="#c3c9d4" ${ln(2)}/>` +
        '<path d="M14 -102 H40 M14 -92 H40" stroke="#a3aab7" stroke-width="2"/>' +
        `<path d="M14 -100 H32 L28 -94 L33 -88 H14 Z" fill="#e9c46a" ${ln(1.5)}/>` +
        `<ellipse cx="27" cy="-112" rx="13" ry="3.5" fill="#8e95a3" ${ln(2)}/>`,
    },
    smalltable: {
      box: '-86 -132 192 140',
      draw: () => `<rect x="88" y="-114" width="9" height="114" rx="3" fill="#d9944f" ${ln(2)}/>` +
        `<rect x="76" y="-114" width="26" height="9" rx="4" fill="#e7a35e" ${ln(2)}/>` +
        `<rect x="54" y="-48" width="7" height="48" fill="#d9944f" ${ln(2)}/>` +
        `<rect x="50" y="-54" width="48" height="9" rx="3" fill="#e7a35e" ${ln(2)}/>` +
        `<rect x="-64" y="-70" width="9" height="70" fill="#d9944f" ${ln(2)}/><rect x="25" y="-70" width="9" height="70" fill="#d9944f" ${ln(2)}/>` +
        `<rect x="-66" y="-70" width="102" height="10" fill="#d9944f" ${ln(2)}/>` +
        `<rect x="-74" y="-80" width="118" height="11" rx="4" fill="#f0b26e" ${ln()}/>` +
        `<path d="M-30 -86 Q-21 -88 -22 -93 M-30 -86" fill="none" ${ln(2)}/>` +
        `<path d="M-32 -94 Q-22 -94 -24 -86 Q-26 -82 -32 -84" fill="none" ${ln(2.5)}/>` +
        `<rect x="-50" y="-98" width="18" height="18" rx="3" fill="#ff6b6b" ${ln(2)}/>` +
        '<path d="M-45 -104 Q-42 -110 -45 -116 M-38 -104 Q-35 -110 -38 -116" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>' +
        `<ellipse cx="4" cy="-81" rx="20" ry="4" fill="#fff" ${ln(2)}/>` +
        `<circle cx="4" cy="-91" r="9" fill="#ff5d5d" ${ln(2)}/><path d="M4 -100 Q8 -106 13 -103 Q9 -99 4 -100 Z" fill="#6fcf6a" ${ln(1.5)}/>` +
        '<circle cx="1" cy="-94" r="2" fill="#fff"/>',
    },
    desk: {
      box: '-110 -166 220 174',
      draw: () => `<rect x="-104" y="-122" width="8" height="78" rx="3" fill="#e7a35e" ${ln(2)}/>` +
        `<rect x="-104" y="-54" width="38" height="9" rx="3" fill="#e7a35e" ${ln(2)}/>` +
        `<rect x="-102" y="-46" width="6" height="46" fill="#d9944f" ${ln(2)}/><rect x="-76" y="-46" width="6" height="46" fill="#d9944f" ${ln(2)}/>` +
        `<rect x="-60" y="-82" width="10" height="82" fill="#a8693a" ${ln(2)}/>` +
        `<rect x="44" y="-82" width="56" height="82" fill="#c98b52" ${ln()}/>` +
        `<rect x="50" y="-74" width="44" height="30" rx="3" fill="#d9a066" ${ln(2)}/><rect x="50" y="-38" width="44" height="30" rx="3" fill="#d9a066" ${ln(2)}/>` +
        `<path d="${dot(72, -59, 3)}${dot(72, -23, 3)}" fill="#ffd166" ${ln(1.5)}/>` +
        `<rect x="-66" y="-92" width="172" height="11" rx="3" fill="#b97843" ${ln()}/>` +
        '<path d="M-20 -92 L-6 -150 L24 -150 L38 -92 Z" fill="#fff6c2" opacity="0.35"/>' +
        `<ellipse cx="-30" cy="-93" rx="14" ry="4" fill="#5aa7e8" ${ln(2)}/>` +
        tube('M-30 -94 L-36 -132 L-8 -148', '#5aa7e8', 4) +
        `<path d="M-16 -156 L6 -164 L14 -140 Z" fill="#5aa7e8" ${ln(2)}/><circle cx="7" cy="-148" r="4" fill="#fff6a8" ${ln(1.5)}/>` +
        `<path d="M-4 -93 L36 -96 L40 -92 L0 -92 Z" fill="#fff" ${ln(1.5)}/>` +
        `<rect x="10" y="-108" width="15" height="16" rx="2" fill="#ffd166" ${ln(2)}/>` +
        `<path d="M13 -108 L11 -122 M18 -108 V-124 M22 -108 L25 -120" stroke="#ff5d5d" stroke-width="3" stroke-linecap="round"/>` +
        `<rect x="56" y="-101" width="44" height="9" rx="2" fill="#5aa7e8" ${ln(2)}/>` +
        `<rect x="60" y="-110" width="38" height="9" rx="2" fill="#ff6b81" ${ln(2)}/>` +
        `<rect x="58" y="-119" width="40" height="9" rx="2" fill="#6fcf6a" ${ln(2)}/>` +
        '<path d="M96 -99 V-94 M94 -108 V-103 M95 -117 V-112" stroke="#fff" stroke-width="2"/>' +
        `<rect x="66" y="-148" width="9" height="29" rx="2" fill="#b892ff" ${ln(2)}/><rect x="77" y="-144" width="9" height="25" rx="2" fill="#ffb562" ${ln(2)}/>`,
    },
    gamingdesk: {
      draw: () => {
        const rgb = ['#ff4f7b', '#ffa62b', '#ffe066', '#6fdc6a', '#4ee6ff', '#6b8bff', '#b46bff', '#ff6bd8'];
        return '<rect class="an-pulse" x="-50" y="-210" width="150" height="104" rx="20" fill="#62e8ff" opacity="0.28"/>' +
          `<path d="M-100 -6 L-74 -14 M-87 -10 L-87 -4" ${ln(3)}/><circle cx="-100" cy="-5" r="5" fill="${INK}"/><circle cx="-74" cy="-5" r="5" fill="${INK}"/>` +
          `<rect x="-90" y="-50" width="7" height="38" fill="#3c3756" ${ln(2)}/>` +
          `<path d="M-108 -150 Q-108 -160 -98 -160 Q-88 -160 -88 -150 L-86 -60 L-108 -60 Z" fill="#ff4d6d" ${ln()}/>` +
          '<path d="M-98 -156 V-64" stroke="#2f2b45" stroke-width="6"/>' +
          `<rect x="-108" y="-62" width="42" height="12" rx="5" fill="#ff4d6d" ${ln()}/>` +
          `<rect x="-62" y="-84" width="10" height="84" fill="#3c3756" ${ln(2)}/><rect x="88" y="-84" width="10" height="84" fill="#3c3756" ${ln(2)}/>` +
          rgb.map((cl, i) => `<rect x="${-68 + i * 21.5}" y="-82" width="21.5" height="5" fill="${cl}"/>`).join('') +
          `<rect x="-70" y="-94" width="172" height="12" rx="3" fill="#2f2b45" ${ln()}/>` +
          `<rect x="18" y="-120" width="14" height="26" fill="#3c3756" ${ln(2)}/><ellipse cx="25" cy="-95" rx="22" ry="4" fill="#3c3756" ${ln(2)}/>` +
          `<rect x="-38" y="-200" width="126" height="84" rx="7" fill="#2f2b45" ${ln()}/>` +
          '<rect x="-31" y="-193" width="112" height="70" rx="3" fill="#1d2a6b"/>' +
          '<path d="M-31 -139 Q0 -150 30 -139 Q56 -146 81 -139 V-123 H-31 Z" fill="#3ccf6e"/>' +
          `<rect x="30" y="-162" width="32" height="7" rx="2" fill="#ffb84d"/>` +
          `<path d="${dot(36, -172, 3.5)}${dot(46, -172, 3.5)}${dot(56, -172, 3.5)}" fill="#ffe066"/>` +
          '<rect x="-12" y="-156" width="14" height="14" rx="3" fill="#ff5d8f"/><path d="M-7 -152v4M-2 -152v4" stroke="#fff" stroke-width="2"/>' +
          `<path d="${star(-20, -178, 6)}" fill="#ffe066"/>` + cloud(4, -180, 0.6) +
          `<rect x="-26" y="-101" width="80" height="8" rx="2" fill="#3c3756" ${ln(2)}/>` +
          rgb.slice(0, 7).map((cl, i) => `<rect x="${-22 + i * 10.5}" y="-99" width="7" height="3.5" rx="1" fill="${cl}"/>`).join('') +
          `<ellipse cx="72" cy="-97" rx="8" ry="4.5" fill="#3c3756" ${ln(2)}/><circle cx="72" cy="-99" r="1.8" fill="#4ee6ff"/>` +
          `<path d="M78 -186 Q92 -206 106 -186" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>` +
          `<rect x="72" y="-188" width="12" height="18" rx="5" fill="#ff4d6d" ${ln(2)}/><rect x="100" y="-188" width="10" height="18" rx="5" fill="#ff4d6d" ${ln(2)}/>`;
      },
    },

    // ---------- lamps (from the ceiling point (0, 0) down to y 185) ----------
    bulb: {
      draw: () => `<rect x="-11" y="-2" width="22" height="8" rx="2" fill="#9a958a" ${ln(2)}/>` +
        flip('an-sway', '<circle cx="0" cy="146" r="30" fill="#fff4a8" opacity="0.35"/>' +
          `<path d="M0 6 V112" stroke="${INK}" stroke-width="3"/>` +
          `<path d="M-6 126 V134 A15 15 0 1 0 6 134 V126 Z" fill="#fff3b0" ${ln(2)}/>` +
          '<path d="M-4 142 L-2 148 L0 142 L2 148 L4 142" fill="none" stroke="#ff9f1c" stroke-width="1.5"/>' +
          '<ellipse cx="-6" cy="144" rx="2.5" ry="5" fill="#fff"/>' +
          `<rect x="-9" y="110" width="18" height="18" rx="2" fill="#6f6a7d" ${ln(2)}/><path d="M-9 116 H9 M-9 122 H9" stroke="#4f4b5c" stroke-width="2"/>`),
    },
    shade: {
      draw: () => `<rect x="-11" y="-2" width="22" height="8" rx="2" fill="#fff" ${ln(2)}/>` +
        flip('an-sway', '<path d="M-46 134 L46 134 L74 182 L-74 182 Z" fill="#fff5b8" opacity="0.35"/>' +
          `<path d="M0 6 V86" stroke="${INK}" stroke-width="3"/>` +
          `<ellipse cx="0" cy="136" rx="11" ry="8" fill="#fff6c2" ${ln(2)}/>` +
          `<path d="M-16 84 L16 84 L46 134 L-46 134 Z" fill="#5ec2b7" ${ln()}/>` +
          `<path d="M-41 126 H41" stroke="#fff" stroke-width="3"/>` +
          `<path d="${dot(-14, 104, 3)}${dot(6, 98, 3)}${dot(18, 114, 3)}${dot(-26, 120, 3)}${dot(-2, 118, 3)}" fill="#c5f0ea"/>`),
    },
    lantern: {
      draw: () => `<rect x="-6" y="-2" width="12" height="6" rx="2" fill="#ffcf3f" ${ln(2)}/>` +
        flip('an-sway', '<circle cx="0" cy="114" r="60" fill="#ffd0a0" opacity="0.25"/>' +
          `<path d="M0 4 V68" stroke="${INK}" stroke-width="2.5"/>` +
          `<ellipse cx="0" cy="114" rx="46" ry="42" fill="#ff6b81" ${ln()}/>` +
          '<path d="M0 73 V155 M-22 75 Q-40 114 -22 153 M22 75 Q40 114 22 153 M-38 90 Q-50 114 -38 138 M38 90 Q50 114 38 138" fill="none" stroke="#e0475f" stroke-width="2"/>' +
          '<ellipse cx="-18" cy="98" rx="6" ry="10" fill="#fff" opacity="0.5"/>' +
          `<path d="${star(0, 116, 10, 0.5)}" fill="#ffe066" ${ln(1.5)}/>` +
          `<rect x="-14" y="66" width="28" height="9" rx="2" fill="#ffcf3f" ${ln(2)}/><rect x="-12" y="153" width="24" height="8" rx="2" fill="#ffcf3f" ${ln(2)}/>` +
          '<path d="M-4 162 L-6 182 M0 162 V184 M4 162 L6 182" stroke="#ff4f6a" stroke-width="3" stroke-linecap="round"/>' +
          `<circle cx="0" cy="164" r="3.5" fill="#ffcf3f" ${ln(1.5)}/>`),
    },
    discoball: {
      box: '-140 -4 280 196',
      draw: () => {
        const cl = ['#ff7ad9', '#6ef0ff', '#ffe066', '#8dff8a', '#b38cff'];
        const spots = [[-340, 40], [-280, 150], [-215, 70], [-150, 236], [-110, 30], [-120, 130], [130, 30], [110, 140], [190, 210],
          [260, 100], [330, 40], [350, 230], [-330, 270], [-60, 300], [70, 296], [240, 296]];
        let h = spots.map(([x, y], i) => `<ellipse class="an-twinkle" cx="${x}" cy="${y}" rx="9" ry="7" fill="${cl[i % 5]}" opacity="0.8"/>`).join('');
        h += `<path d="M0 0 V72" stroke="#8e8ea6" stroke-width="3"/><rect x="-6" y="64" width="12" height="9" fill="#8e8ea6" ${ln(2)}/>`;
        let grid = 'M0 72 V154';
        for (let k = -3; k <= 3; k++) { const y = 113 + k * 11.5, w = r1(Math.sqrt(41 * 41 - (k * 11.5) ** 2)); grid += `M${-w} ${y}H${w}`; }
        for (const rx of [15, 29]) grid += `M0 72A${rx} 41 0 0 0 0 154M0 72A${rx} 41 0 0 1 0 154`;
        let fac = '';
        for (let i = 0; i < 16; i++) {
          const a = i * 2.4, rr = 6 + (i * 7) % 28, x = r1(Math.cos(a) * rr), y = r1(113 + Math.sin(a) * rr);
          fac += `<rect x="${x - 5}" y="${y - 5}" width="10" height="10" fill="${i % 3 ? cl[i % 5] : '#fff'}"/>`;
        }
        return h + `<circle cx="0" cy="113" r="41" fill="#c9d1e3" ${ln()}/>` +
          `<g class="an-spin"><circle cx="0" cy="113" r="38" fill="none"/>${fac}</g>` +
          `<path d="${grid}" fill="none" stroke="#7d86a3" stroke-width="1.5"/>` +
          `<circle cx="0" cy="113" r="41" fill="none" ${ln()}/><ellipse cx="-16" cy="96" rx="9" ry="6" fill="#fff" opacity="0.8"/>`;
      },
    },
    chandelier: {
      box: '-100 -4 200 192',
      draw: () => {
        const cups = [[-74, 100], [-36, 112], [36, 112], [74, 100]];
        let h = '<circle cx="0" cy="112" r="72" fill="#fff1a8" opacity="0.25"/>' +
          `<path d="M0 0 V60" stroke="#e0a21b" stroke-width="4"/><path d="M-12 2 H12 L6 10 H-6 Z" fill="#ffcf3f" ${ln(2)}/>`;
        h += cups.map(([x, y]) => tube(`M0 ${x < 0 ? 112 : 112} Q${x * 0.6} ${y + 34} ${x} ${y}`, '#ffcf3f', 5)).join('');
        h += `<ellipse cx="0" cy="98" rx="15" ry="26" fill="#ffcf3f" ${ln()}/><circle cx="0" cy="64" r="6" fill="#ffcf3f" ${ln(2)}/>` +
          '<ellipse cx="-5" cy="88" rx="3.5" ry="9" fill="#fff" opacity="0.7"/>';
        for (const [x, y] of [[-56, 128], [-20, 138], [20, 138], [56, 128]]) h += `<path d="M${x} ${y - 10}V${y - 6}" ${ln(1.5)}/>` + gem(x, y, 7, '#bdf3ff');
        h += `<path d="M0 124 V132" ${ln(1.5)}/>` + gem(0, 146, 12, '#bdf3ff') + `<path d="M0 158 V166" ${ln(1.5)}/>` + gem(0, 174, 7, '#ff9fd0');
        for (const [x, y] of cups) {
          h += `<rect x="${x - 4}" y="${y - 22}" width="8" height="22" rx="2" fill="#fffaf0" ${ln(2)}/>` + flame(x, y - 23, 0.85) +
            `<ellipse cx="${x}" cy="${y}" rx="10" ry="4" fill="#ffcf3f" ${ln(2)}/>`;
        }
        return h + sparkle(-58, 70, 8) + sparkle(56, 66, 7) + sparkle(-34, 160, 7) + sparkle(36, 162, 8) + sparkle(0, 40, 6);
      },
    },

    // ---------- windows (centre; x -92..92, y -98..97) ----------
    smallwindow: {
      box: '-80 -76 160 152',
      draw: () => `<rect x="-54" y="-50" width="108" height="98" rx="3" fill="#ddd6c8" ${ln()}/>` +
        '<rect x="-44" y="-40" width="88" height="78" fill="#b5dcef"/>' + cloud(-36, -20, 0.8) +
        '<path d="M8 6 L18 16 L13 24 L27 31 M18 16 L32 12" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M8 6 L18 16 L13 24 L27 31 M18 16 L32 12" fill="none" stroke="#6b8fa8" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>' +
        `<rect x="10" y="12" width="22" height="6" fill="#f1dfa4" opacity="0.9" transform="rotate(35 21 15)"/>` +
        '<path d="M-44 38 L-44 22 L-28 38 Z M44 -40 L28 -40 L44 -26 Z" fill="#9aa6a8" opacity="0.4"/>' +
        `<rect x="-44" y="-40" width="88" height="78" fill="none" ${ln(2)}/>` +
        `<rect x="-3.5" y="-40" width="7" height="78" fill="#ddd6c8" ${ln(2)}/><rect x="-44" y="-4" width="88" height="7" fill="#ddd6c8" ${ln(2)}/>` +
        `<rect x="-62" y="46" width="124" height="9" rx="2" fill="#bdb29d" ${ln(2)}/>`,
    },
    curtains: {
      draw: () => {
        const curtain = s => `<path d="M${s * 90} -82 H${s * 46} Q${s * 50} -10 ${s * 54} 72 Q${s * 60} 78 ${s * 66} 72 Q${s * 72} 78 ${s * 78} 72 ` +
          `Q${s * 84} 78 ${s * 90} 72 Z" fill="#ff9fbf" ${ln()}/>` +
          `<path d="M${s * 62} -78 Q${s * 64} 0 ${s * 66} 70 M${s * 76} -78 Q${s * 77} 0 ${s * 78} 70" fill="none" stroke="#f07aa0" stroke-width="2.5"/>` +
          `<path d="${dot(s * 54, -60, 3)}${dot(s * 70, -40, 3)}${dot(s * 84, -64, 3)}${dot(s * 56, -16, 3)}${dot(s * 82, -6, 3)}${dot(s * 68, 14, 3)}` +
          `${dot(s * 58, 40, 3)}${dot(s * 84, 44, 3)}" fill="#fff"/>`;
        return `<rect x="-64" y="-66" width="128" height="128" rx="4" fill="#fffdf8" ${ln()}/>` +
          '<rect x="-54" y="-56" width="108" height="108" fill="#8fd6ff"/>' +
          '<path d="M-54 52 Q-20 22 14 40 Q34 30 54 40 V52 Z" fill="#8fdc7a"/>' +
          `<circle cx="28" cy="-30" r="13" fill="#ffd23f" ${ln(2)}/>` + cloud(-40, -30, 1) + cloud(10, 4, 0.6) +
          `<rect x="-54" y="-56" width="108" height="108" fill="none" ${ln(2)}/>` +
          `<rect x="-3.5" y="-56" width="7" height="108" fill="#fffdf8" ${ln(2)}/><rect x="-54" y="-6" width="108" height="7" fill="#fffdf8" ${ln(2)}/>` +
          `<rect x="-72" y="60" width="144" height="9" rx="2" fill="#fffdf8" ${ln(2)}/>` +
          `<rect x="-92" y="-87" width="184" height="7" rx="3" fill="#c98b52" ${ln(2)}/>` +
          `<circle cx="-92" cy="-83.5" r="6" fill="#c98b52" ${ln(2)}/><circle cx="92" cy="-83.5" r="6" fill="#c98b52" ${ln(2)}/>` +
          curtain(-1) + curtain(1);
      },
    },
    flowerbox: {
      draw: () => {
        const shutter = x => `<rect x="${x}" y="-76" width="30" height="118" rx="3" fill="#5cbf7a" ${ln()}/>` +
          `<path d="${Array.from({ length: 9 }, (_, i) => `M${x + 5} ${-64 + i * 12}H${x + 25}`).join('')}" stroke="#3f9b5c" stroke-width="2.5"/>`;
        const cols = ['#ff5d6c', '#ffd23f', '#ff8fd0', '#b892ff', '#ff9a3d', '#ff5d6c', '#ffd23f'];
        let fl = '';
        cols.forEach((cl, i) => {
          const x = -60 + i * 20, y = 26 + (i % 2) * 8;
          fl += `<path d="M${x} 48 V${y}" stroke="#3f9b5c" stroke-width="3"/><ellipse cx="${x + 5}" cy="${y + 12}" rx="5" ry="2.5" fill="#6fcf6a" transform="rotate(-30 ${x + 5} ${y + 12})"/>` +
            `<path d="${dot(x - 5, y, 4.5)}${dot(x + 5, y, 4.5)}${dot(x, y - 5, 4.5)}${dot(x, y + 5, 4.5)}" fill="${cl}"/><circle cx="${x}" cy="${y}" r="3" fill="#fff4c2"/>`;
        });
        return shutter(-94) + shutter(64) +
          `<rect x="-62" y="-78" width="124" height="124" rx="4" fill="#fff" ${ln()}/>` +
          '<rect x="-52" y="-68" width="104" height="104" fill="#8fd6ff"/>' +
          '<path d="M-18 36 A34 34 0 0 1 50 36" fill="none" stroke="#ff6b6b" stroke-width="6"/>' +
          '<path d="M-11 36 A27 27 0 0 1 43 36" fill="none" stroke="#ffd23f" stroke-width="6"/>' +
          '<path d="M-4 36 A20 20 0 0 1 36 36" fill="none" stroke="#6b9bff" stroke-width="6"/>' +
          `<circle cx="-28" cy="-42" r="12" fill="#ffd23f" ${ln(2)}/>` + cloud(8, -46, 0.9) + cloud(-44, -6, 0.6) +
          `<path d="M24 -18 Q28 -22 32 -18 Q36 -22 40 -18" fill="none" ${ln(2)}/>` +
          `<rect x="-52" y="-68" width="104" height="104" fill="none" ${ln(2)}/>` +
          `<rect x="-3.5" y="-68" width="7" height="104" fill="#fff" ${ln(2)}/><rect x="-52" y="-18" width="104" height="7" fill="#fff" ${ln(2)}/>` +
          fl + `<rect x="-74" y="46" width="148" height="30" rx="4" fill="#c9733f" ${ln()}/>` +
          '<path d="M-70 61 H70" stroke="#a85a2e" stroke-width="2.5"/>';
      },
    },
    royaldrapes: {
      draw: () => {
        let sc = 'M94 -76';
        for (let x = 94; x > -94; x -= 23.5) sc += `Q${r1(x - 11.75)} -60 ${r1(x - 23.5)} -76`;
        const drape = s => `<path d="M${s * 94} -76 H${s * 52} Q${s * 40} -30 ${s * 70} 6 Q${s * 50} 50 ${s * 58} 96 H${s * 94} Z" fill="#d3264a" ${ln()}/>` +
          `<path d="M${s * 66} -72 Q${s * 60} -30 ${s * 78} 4 M${s * 70} 12 Q${s * 62} 54 ${s * 70} 94 M${s * 84} 12 Q${s * 80} 54 ${s * 84} 94" fill="none" stroke="#a91b3a" stroke-width="2.5"/>` +
          `<ellipse cx="${s * 74}" cy="6" rx="14" ry="6" fill="#ffcf3f" ${ln(2)}/>` +
          `<path d="M${s * 80} 10 L${s * 76} 30 L${s * 88} 30 Z" fill="#ffcf3f" ${ln(1.5)}/>`;
        return `<path d="M-62 92 V-30 A62 62 0 0 1 62 -30 V92 Z" fill="#ffcf3f" ${ln()}/>` +
          '<path d="M-50 84 V-30 A50 50 0 0 1 50 -30 V84 Z" fill="#8fd6ff"/>' +
          '<path d="M-38 84 A38 38 0 0 1 38 84" fill="none" stroke="#ff6b6b" stroke-width="7"/>' +
          '<path d="M-31 84 A31 31 0 0 1 31 84" fill="none" stroke="#ffd23f" stroke-width="7"/>' +
          '<path d="M-24 84 A24 24 0 0 1 24 84" fill="none" stroke="#6fcf6a" stroke-width="7"/>' +
          '<path d="M-17 84 A17 17 0 0 1 17 84" fill="none" stroke="#6b9bff" stroke-width="7"/>' +
          cloud(-40, 0, 0.8) + cloud(16, -40, 0.8) +
          `<path d="M-50 84 V-30 A50 50 0 0 1 50 -30 V84 Z" fill="none" ${ln(2)}/>` +
          `<rect x="-3.5" y="-80" width="7" height="164" fill="#ffcf3f" ${ln(2)}/><rect x="-50" y="16" width="100" height="7" fill="#ffcf3f" ${ln(2)}/>` +
          `<rect x="-68" y="88" width="136" height="9" rx="2" fill="#ffcf3f" ${ln(2)}/>` +
          drape(-1) + drape(1) +
          `<path d="M-94 -98 H94 V-76 ${sc.slice(7)} Z" fill="#7a3fc4" ${ln()}/>` +
          `<path d="${sc}" fill="none" stroke="#ffcf3f" stroke-width="4"/>` + crown(0, -78, 0.9) +
          sparkle(-30, -40, 8) + sparkle(36, 50, 7) + sparkle(-78, 60, 8) + sparkle(76, -40, 7);
      },
    },

    // ---------- rugs (centre; x -170..170, y -35..35) ----------
    roundrug: {
      draw: () => `<ellipse cx="0" cy="0" rx="128" ry="30" fill="#7cc6f2" ${ln()}/>` +
        '<ellipse cx="0" cy="0" rx="114" ry="25" fill="none" stroke="#fff" stroke-width="2.5" stroke-dasharray="7 6"/>' +
        '<ellipse cx="0" cy="0" rx="96" ry="20" fill="#b8e3ff"/><ellipse cx="0" cy="0" rx="64" ry="13" fill="#ffd166"/>' +
        '<ellipse cx="0" cy="0" rx="34" ry="7" fill="#ff9fbf"/>',
    },
    striperug: {
      draw: () => {
        const cols = ['#ffd166', '#ff8fb0', '#8fd6ff', '#9fe39a'];
        let fr = '';
        for (let y = -22; y <= 22; y += 6) fr += `M-152 ${y}H-162M152 ${y}H162`;
        return `<path d="${fr}" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="${fr}" stroke="#fff3d6" stroke-width="2.5" stroke-linecap="round"/>` +
          '<rect x="-150" y="-26" width="300" height="52" rx="6" fill="#b892ff"/>' +
          cols.map((cl, i) => `<rect x="${-100 + i * 50}" y="-26" width="50" height="52" fill="${cl}"/>`).join('') +
          '<path d="M-140 -14 L-130 0 L-140 14 M-120 -14 L-110 0 L-120 14 M140 -14 L130 0 L140 14 M120 -14 L110 0 L120 14" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' +
          `<rect x="-150" y="-26" width="300" height="52" rx="6" fill="none" ${ln()}/>`;
      },
    },
    cloudrug: {
      draw: () => {
        // Bumps at equal steps along an ellipse.
        const pts = [];
        let len = 0, prev = null;
        for (let i = 0; i <= 240; i++) {
          const a = i / 240 * Math.PI * 2, p = [Math.cos(a) * 140, Math.sin(a) * 22];
          if (prev) len += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
          pts.push([p, len]); prev = p;
        }
        const n = 18;
        let d = '', k = 0;
        for (let j = 0; j <= n; j++) {
          const want = len * j / n;
          while (k < pts.length - 1 && pts[k][1] < want) k++;
          const [x, y] = pts[k][0];
          d += j ? `A20 18 0 0 1 ${r1(x)} ${r1(y)}` : `M${r1(x)} ${r1(y)}`;
        }
        return `<path d="${d}Z" fill="#fff" ${ln()}/><ellipse cx="0" cy="4" rx="110" ry="14" fill="#e3f3ff"/>` +
          '<ellipse cx="-70" cy="-6" rx="22" ry="5" fill="#fff"/><ellipse cx="60" cy="-8" rx="26" ry="5" fill="#fff"/>';
      },
    },
    redcarpet: {
      draw: () => {
        let fr = '';
        for (let y = -24; y <= 24; y += 6) fr += `M-166 ${y}H-176M166 ${y}H176`;
        let dia = '';
        for (const x of [-120, -80, 80, 120]) dia += `M${x} -8L${x + 8} 0L${x} 8L${x - 8} 0Z`;
        return `<path d="${fr}" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="${fr}" stroke="#ffcf3f" stroke-width="2.5" stroke-linecap="round"/>` +
          `<rect x="-166" y="-30" width="332" height="60" rx="4" fill="#d0213c" ${ln()}/>` +
          '<rect x="-154" y="-21" width="308" height="42" rx="3" fill="none" stroke="#ffcf3f" stroke-width="4"/>' +
          `<path d="M0 -14 L36 0 L0 14 L-36 0 Z" fill="#ffcf3f" ${ln(2)}/><path d="M0 -7 L16 0 L0 7 L-16 0 Z" fill="#a8122a"/>` +
          `<path d="${dia}" fill="#ffcf3f"/>` + sparkle(-140, -14, 8) + sparkle(144, 12, 8) + sparkle(60, -18, 6);
      },
    },

    // ---------- pictures (centre; x -85..85, y -67..67) ----------
    drawing: {
      draw: () => `<g transform="rotate(-4)"><rect x="-56" y="-44" width="112" height="86" fill="#fffef8" ${ln(2)}/>` +
        '<path d="M-56 26 Q-30 18 -10 26 Q20 16 56 24 V42 H-56 Z" fill="#7fd36a"/>' +
        `<path d="M-30 -26 L-30 -40 M-30 -6 L-30 8 M-46 -16 L-60 -16 M-14 -16 L0 -16 M-41 -27 L-50 -36 M-19 -27 L-10 -36 M-41 -5 L-50 4 M-19 -5 L-10 4" stroke="#ffb321" stroke-width="3" stroke-linecap="round"/>` +
        '<circle cx="-30" cy="-16" r="11" fill="#ffd23f" stroke="#ffb321" stroke-width="2"/>' +
        `<path d="M-34 -18 v1 M-26 -18 v1 M-34 -12 Q-30 -9 -26 -12" fill="none" ${ln(2)}/>` +
        '<path d="M14 26 V2 L28 -10 L42 2 V26 Z" fill="none" stroke="#ff5d6c" stroke-width="3" stroke-linejoin="round"/>' +
        '<path d="M24 26 V14 H32 V26" fill="none" stroke="#6b9bff" stroke-width="3"/>' +
        '<path d="M-2 26 V10 M-6 14 L-2 10 L2 14 M-2 18 L-7 22 M-2 18 L3 22" fill="none" stroke="#b46bff" stroke-width="2.5" stroke-linecap="round"/>' +
        '<circle cx="-2" cy="6" r="4" fill="none" stroke="#b46bff" stroke-width="2.5"/></g>' +
        '<rect x="-64" y="-52" width="26" height="10" fill="#f3e3a0" opacity="0.85" transform="rotate(-30 -51 -47)"/>' +
        '<rect x="36" y="-56" width="26" height="10" fill="#f3e3a0" opacity="0.85" transform="rotate(25 49 -51)"/>',
    },
    landscape: {
      draw: () => `<rect x="-80" y="-60" width="160" height="120" rx="4" fill="#b0703a" ${ln()}/>` +
        `<rect x="-68" y="-48" width="136" height="96" fill="#9fdcff" ${ln(2)}/>` +
        `<circle cx="40" cy="-26" r="10" fill="#ffd23f"/>` +
        '<path d="M-68 24 L-36 -26 L-16 0 L8 -34 L44 18 L68 2 V30 H-68 Z" fill="#8f86b8"/>' +
        '<path d="M-44 -14 L-36 -26 L-28 -14 L-34 -17 Z M0 -22 L8 -34 L16 -22 L8 -26 Z" fill="#fff"/>' +
        '<path d="M-68 20 Q-30 6 0 18 Q34 8 68 18 V48 H-68 Z" fill="#7fd36a"/>' +
        '<path d="M-10 48 Q0 30 30 34 Q50 36 52 48 Z" fill="#5ab8ef"/>' +
        `<path d="M-50 32 L-44 16 L-38 32 Z M-34 34 L-28 20 L-22 34 Z" fill="#3f9b5c"/>` +
        `<rect x="-68" y="-48" width="136" height="96" fill="none" ${ln(2)}/>` +
        '<path d="M-74 -54 L-68 -48 M74 -54 L68 -48 M-74 54 L-68 48 M74 54 L68 48" stroke="#8a5428" stroke-width="2"/>',
    },
    portrait: {
      draw: c => `<rect x="-62" y="-66" width="124" height="132" rx="6" fill="#e0a040" ${ln()}/>` +
        `<rect x="-51" y="-55" width="102" height="110" fill="#ffd6e6" ${ln(2)}/>` +
        `<path d="${dot(-38, -40, 3)}${dot(36, -42, 3)}${dot(-40, 30, 3)}${dot(40, 26, 3)}" fill="#fff"/>` +
        head(c, -50, -54, 100) +
        `<rect x="-51" y="-55" width="102" height="110" fill="none" ${ln(2)}/>` +
        `<path d="${dot(-56, -60, 3.5)}${dot(56, -60, 3.5)}${dot(-56, 60, 3.5)}${dot(56, 60, 3.5)}" fill="#ffe08a" ${ln(1.5)}/>`,
    },
    goldmirror: {
      draw: c => `<path d="M-30 -56 Q0 -70 30 -56" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>` +
        `<ellipse cx="0" cy="2" rx="56" ry="62" fill="#ffcf3f" ${ln()}/>` +
        '<ellipse cx="0" cy="2" rx="50" ry="56" fill="none" stroke="#e6a823" stroke-width="3" stroke-dasharray="4 5"/>' +
        `<ellipse cx="0" cy="2" rx="43" ry="49" fill="#cfeefc" ${ln(2)}/>` +
        head(c, -33, -38, 66) +
        '<path d="M-30 -24 L-18 -36 M-32 -12 L-12 -32" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.7"/>' +
        `<ellipse cx="0" cy="2" rx="43" ry="49" fill="none" ${ln(2)}/>` +
        crown(0, -54, 0.9) + gem(-56, 2, 7, '#ff4f7b') + gem(56, 2, 7, '#5ec8ff') + gem(0, 64, 7, '#7be07b') +
        sparkle(-48, -46, 9) + sparkle(50, 44, 8) + sparkle(26, -30, 6),
    },

    // ---------- plants (bottom centre at the wall base; x -38..38, up to y -190) ----------
    cactus: {
      box: '-46 -124 92 130',
      draw: () => tube('M-10 -66 H-24 V-86', '#5fbf6a', 11) + tube('M10 -76 H24 V-98', '#5fbf6a', 11) +
        `<rect x="-15" y="-112" width="30" height="80" rx="15" fill="#5fbf6a" ${ln()}/>` +
        '<path d="M-6 -100 V-44 M6 -100 V-44" stroke="#4aa356" stroke-width="2.5"/>' +
        `<path d="M-15 -90 l-4 -2 M-15 -60 l-4 -2 M15 -100 l4 -2 M15 -56 l4 -2 M-24 -94 l-4 -3 M24 -104 l4 -3" ${ln(1.5)}/>` +
        `<path d="${dot(-5, -122, 5)}${dot(5, -122, 5)}${dot(0, -128, 5)}${dot(0, -116, 5)}" fill="#ff8fb0" ${ln(1.5)}/><circle cx="0" cy="-122" r="3" fill="#ffd23f"/>` +
        `<ellipse cx="-5" cy="-82" rx="2.5" ry="3.5" fill="${INK}"/><ellipse cx="5" cy="-82" rx="2.5" ry="3.5" fill="${INK}"/>` +
        `<path d="M-4 -75 Q0 -71 4 -75" fill="none" ${ln(2)}/>` +
        `<path d="M-21 -32 L21 -32 L16 0 L-16 0 Z" fill="#d9774a" ${ln()}/><rect x="-25" y="-40" width="50" height="11" rx="3" fill="#e88b5c" ${ln()}/>`,
    },
    flowerpot: {
      box: '-46 -150 92 156',
      draw: () => tube('M0 -36 V-120', '#4aa356', 4) + tube('M-6 -36 Q-20 -70 -22 -100', '#4aa356', 4) + tube('M6 -36 Q22 -64 22 -90', '#4aa356', 4) +
        `<path d="M-2 -60 Q-22 -70 -28 -60 Q-14 -54 -2 -60 Z M2 -76 Q22 -88 28 -78 Q16 -70 2 -76 Z" fill="#6fcf6a" ${ln(2)}/>` +
        `<path d="M-32 -104 L-30 -118 L-22 -110 L-14 -118 L-12 -104 Q-22 -90 -32 -104 Z" fill="#ff5d6c" ${ln(2)}/>` +
        `<path d="M12 -94 L14 -108 L22 -100 L30 -108 L32 -94 Q22 -80 12 -94 Z" fill="#ffd23f" ${ln(2)}/>` +
        `<path d="${[0, 1, 2, 3, 4, 5].map(i => dot(Math.cos(i * 1.047) * 8, -128 + Math.sin(i * 1.047) * 8, 5.5)).join('')}" fill="#fff" ${ln(1.5)}/>` +
        `<circle cx="0" cy="-128" r="5" fill="#ffb321" ${ln(1.5)}/>` +
        `<path d="M-24 -36 L24 -36 L18 0 L-18 0 Z" fill="#5aa7e8" ${ln()}/><rect x="-28" y="-44" width="56" height="11" rx="3" fill="#7cbcf0" ${ln()}/>` +
        `<path d="${dot(-10, -20, 3)}${dot(8, -14, 3)}${dot(0, -26, 2.5)}" fill="#fff"/>`,
    },
    palm: {
      draw: () => {
        const leaf = (tx, ty, bx, by) => `<path d="M2 -150 Q${bx} ${by - 10} ${tx} ${ty} Q${bx} ${by + 8} 2 -146 Z" fill="#4fbf5f" ${ln(2)}/>` +
          `<path d="M2 -148 Q${bx} ${by} ${tx} ${ty}" fill="none" stroke="#3a9a4a" stroke-width="1.5"/>`;
        return tube('M0 -40 Q-6 -90 2 -148', '#b07a44', 10) +
          '<path d="M-6 -60 h10 M-6 -80 h10 M-5 -100 h10 M-3 -120 h10 M-1 -138 h8" stroke="#8a5a34" stroke-width="2.5"/>' +
          leaf(-38, -116, -22, -160) + leaf(38, -112, 26, -158) + leaf(-34, -178, -18, -176) + leaf(34, -182, 20, -180) + leaf(4, -192, -2, -176) +
          `<circle cx="-4" cy="-144" r="6" fill="#8a5a34" ${ln(2)}/><circle cx="7" cy="-142" r="6" fill="#8a5a34" ${ln(2)}/>` +
          `<path d="M-26 -42 L26 -42 L20 0 L-20 0 Z" fill="#d9a066" ${ln()}/>` +
          '<path d="M-24 -28 H24 M-22 -14 H22 M-12 -42 L-10 0 M0 -42 V0 M12 -42 L10 0" stroke="#b07a44" stroke-width="2"/>' +
          `<path d="M-26 -42 L26 -42 L20 0 L-20 0 Z" fill="none" ${ln()}/>`;
      },
    },
    goldtree: {
      draw: () => tube('M0 -40 V-110 M0 -84 L-16 -104 M0 -92 L14 -114', '#e0a21b', 7) +
        `<path d="${dot(-20, -124, 20)}${dot(20, -128, 20)}${dot(0, -156, 24)}${dot(-24, -152, 15)}${dot(24, -156, 15)}${dot(0, -120, 18)}" fill="#ffcf3f" ${ln()}/>` +
        `<path d="${dot(-20, -124, 20)}${dot(20, -128, 20)}${dot(0, -156, 24)}${dot(-24, -152, 15)}${dot(24, -156, 15)}${dot(0, -120, 18)}" fill="#ffcf3f"/>` +
        '<path d="M-14 -168 Q-6 -176 4 -172" fill="none" stroke="#fff3b0" stroke-width="4" stroke-linecap="round"/>' +
        gem(-18, -130, 6, '#ff4f7b') + gem(16, -138, 6, '#5ec8ff') + gem(0, -160, 6, '#7be07b') + gem(-6, -114, 5, '#b892ff') + gem(24, -116, 5, '#ff4f7b') +
        `<path d="M-24 -40 L24 -40 L18 0 L-18 0 Z" fill="#ffcf3f" ${ln()}/><rect x="-28" y="-48" width="56" height="11" rx="3" fill="#e6a823" ${ln()}/>` +
        gem(0, -20, 7, '#ff4f7b') +
        sparkle(-30, -176, 8) + sparkle(30, -100, 7) + sparkle(-32, -96, 6) + sparkle(28, -178, 6),
    },

    // ---------- toys (bottom centre on the floor in front; x -42..42) ----------
    ball: {
      box: '-40 -64 80 70',
      draw: () => '<ellipse cx="0" cy="0" rx="22" ry="4" fill="#000" opacity="0.15"/>' +
        `<circle cx="0" cy="-24" r="24" fill="#ff5d6c" ${ln()}/>` +
        '<path d="M-14 -43.5 Q-2 -24 -14 -4.5 L-4 -0.3 Q8 -24 -4 -47.7 Z" fill="#fff"/>' +
        '<path d="M8 -46.6 Q22 -24 8 -1.4 L17 -7 Q28 -24 17 -41 Z" fill="#5aa7e8"/>' +
        `<circle cx="0" cy="-24" r="24" fill="none" ${ln()}/><ellipse cx="-12" cy="-36" rx="5" ry="3.5" fill="#fff" opacity="0.8"/>`,
    },
    teddy: {
      box: '-40 -100 80 106',
      draw: () => '<ellipse cx="0" cy="0" rx="26" ry="4" fill="#000" opacity="0.15"/>' +
        `<g transform="translate(-38 -96) scale(0.38)">${Look.inner('bear', {}, 'happy')}</g>` +
        `<path d="M0 -44 L-11 -50 L-11 -38 Z M0 -44 L11 -50 L11 -38 Z" fill="#ff5d8f" ${ln(1.5)}/><circle cx="0" cy="-44" r="3.5" fill="#ff5d8f" ${ln(1.5)}/>`,
    },
    rockinghorse: {
      draw: () => '<ellipse cx="0" cy="0" rx="36" ry="4" fill="#000" opacity="0.15"/>' +
        `<g class="an-sway">${tube('M-40 -10 Q0 6 40 -10', '#c98b52', 6)}` +
        `<path d="M-16 -44 L-24 -6 M-6 -44 L-10 -4 M10 -44 L12 -4 M18 -44 L26 -6" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>` +
        '<path d="M-16 -44 L-24 -6 M-6 -44 L-10 -4 M10 -44 L12 -4 M18 -44 L26 -6" stroke="#fff6ea" stroke-width="5" stroke-linecap="round"/>' +
        tube('M-24 -54 Q-36 -50 -36 -32', '#ffd23f', 6) +
        `<ellipse cx="0" cy="-50" rx="27" ry="13" fill="#fff6ea" ${ln()}/>` +
        `<path d="M14 -56 L22 -86 L34 -82 L26 -54 Z" fill="#fff6ea" ${ln()}/>` +
        `<ellipse cx="32" cy="-86" rx="14" ry="9" transform="rotate(20 32 -86)" fill="#fff6ea" ${ln()}/>` +
        `<path d="M22 -94 L24 -104 L30 -96 Z" fill="#fff6ea" ${ln(2)}/>` +
        tube('M20 -92 Q14 -76 12 -60', '#ffd23f', 5) +
        `<circle cx="33" cy="-89" r="2.5" fill="${INK}"/><circle cx="42" cy="-82" r="1.5" fill="${INK}"/>` +
        `<path d="M-10 -63 Q2 -66 10 -62 L10 -46 Q0 -42 -10 -46 Z" fill="#ff5d6c" ${ln(2)}/>` +
        `<path d="M24 -78 L38 -80" stroke="#ff5d6c" stroke-width="2.5"/>` +
        `<path d="${dot(-16, -46, 3)}${dot(-6, -54, 2.5)}${dot(14, -46, 3)}" fill="#b892ff"/></g>`,
    },
    robot: {
      draw: () => '<ellipse cx="0" cy="0" rx="28" ry="4" fill="#000" opacity="0.15"/>' +
        `<rect x="-18" y="-22" width="14" height="20" rx="3" fill="#7d8db0" ${ln(2)}/><rect x="4" y="-22" width="14" height="20" rx="3" fill="#7d8db0" ${ln(2)}/>` +
        `<rect x="-22" y="-6" width="20" height="8" rx="3" fill="#5a6585" ${ln(2)}/><rect x="2" y="-6" width="20" height="8" rx="3" fill="#5a6585" ${ln(2)}/>` +
        tube('M-22 -54 Q-34 -46 -32 -32', '#9fb4d8', 5) + tube('M22 -54 Q34 -46 32 -32', '#9fb4d8', 5) +
        `<path d="M-36 -32 Q-36 -24 -32 -24 M-28 -32 Q-28 -24 -32 -24 M28 -32 Q28 -24 32 -24 M36 -32 Q36 -24 32 -24" fill="none" ${ln(2.5)}/>` +
        `<rect x="-22" y="-62" width="44" height="42" rx="6" fill="#9fb4d8" ${ln()}/>` +
        `<rect x="-14" y="-54" width="28" height="18" rx="3" fill="#2f2b45" ${ln(2)}/>` +
        `<path d="${dot(-7, -45, 3)}" fill="#ff5d6c"/><path d="${dot(1, -45, 3)}" fill="#ffd23f"/><path d="${dot(9, -45, 3)}" fill="#6fdc6a"/>` +
        '<path d="M-10 -30 H10" stroke="#7d8db0" stroke-width="3" stroke-linecap="round"/>' +
        `<rect x="-6" y="-68" width="12" height="7" fill="#7d8db0" ${ln(2)}/>` +
        `<rect x="-20" y="-98" width="40" height="32" rx="8" fill="#9fb4d8" ${ln()}/>` +
        `<rect x="-14" y="-92" width="28" height="18" rx="4" fill="#1d2a6b" ${ln(2)}/>` +
        '<circle cx="-6" cy="-84" r="3.5" fill="#4ee6ff"/><circle cx="6" cy="-84" r="3.5" fill="#4ee6ff"/>' +
        '<path d="M-5 -78 Q0 -75 5 -78" fill="none" stroke="#4ee6ff" stroke-width="2" stroke-linecap="round"/>' +
        `<circle cx="-22" cy="-82" r="4" fill="#7d8db0" ${ln(2)}/><circle cx="22" cy="-82" r="4" fill="#7d8db0" ${ln(2)}/>` +
        `<path d="M0 -98 V-108" ${ln(2.5)}/><circle class="an-pulse" cx="0" cy="-111" r="5" fill="#ff5d6c" ${ln(2)}/>`,
    },
    toycastle: {
      draw: () => {
        const tower = (x, w, top) => `<rect x="${x - w / 2}" y="${top}" width="${w}" height="${-top}" fill="#ffb3d1" ${ln()}/>` +
          `<path d="M${x - w / 2 - 4} ${top} L${x} ${top - 22} L${x + w / 2 + 4} ${top} Z" fill="#9b6bff" ${ln()}/>` +
          `<path d="M${x} ${top - 22} V${top - 34}" ${ln(2)}/><path d="M${x} ${top - 34} L${x + 11} ${top - 30} L${x} ${top - 26} Z" fill="#ffcf3f" ${ln(1.5)}/>`;
        return '<ellipse cx="0" cy="0" rx="40" ry="4" fill="#000" opacity="0.15"/>' +
          tower(-28, 18, -64) + tower(28, 18, -64) + tower(0, 22, -82) +
          `<path d="M-36 0 V-46 h8 v-6 h8 v6 h8 v-6 h8 v6 h8 v-6 h8 v6 h8 v-6 h8 v6 h8 V0 Z" fill="#ffc4dc" ${ln()}/>` +
          `<path d="M-10 0 V-16 A10 10 0 0 1 10 -16 V0 Z" fill="#7a3fc4" ${ln(2)}/>` +
          '<path d="M-36 -40 H36" stroke="#ffcf3f" stroke-width="3"/>' +
          gem(-22, -26, 5, '#5ec8ff') + gem(22, -26, 5, '#7be07b') + gem(0, -60, 5, '#ff4f7b') +
          `<path d="M-31 -54 h6 v-6 h-6 z M25 -54 h6 v-6 h-6 z" fill="#7a3fc4"/>` +
          sparkle(-38, -78, 7) + sparkle(36, -90, 6) + sparkle(16, -12, 5);
      },
    },

    // ---------- pets (bottom centre on the floor in front; x -37..37) ----------
    goldfish: {
      box: '-46 -80 92 86',
      draw: () => '<ellipse cx="0" cy="0" rx="30" ry="4" fill="#000" opacity="0.15"/>' +
        `<path d="M-16 -64 C-46 -58 -46 -4 -16 -1 L16 -1 C46 -4 46 -58 16 -64 Z" fill="#e6f7ff" ${ln()}/>` +
        '<path d="M-31 -46 C-40 -30 -36 -6 -16 -4 L16 -4 C36 -6 40 -30 31 -46 Q0 -42 -31 -46 Z" fill="#7fd0f5"/>' +
        `<path d="${dot(-14, -8, 4)}${dot(-6, -7, 3.5)}${dot(4, -8, 4)}${dot(13, -7, 3.5)}" fill="#ffb3d1"/>` +
        `<path d="M18 -6 Q14 -18 20 -28 Q24 -18 22 -6 Z" fill="#4fbf5f"/>` +
        `<g class="an-swim"><path d="M-14 -28 L-24 -36 L-22 -20 Z" fill="#ff8a2b" ${ln(2)}/>` +
        `<ellipse cx="-4" cy="-28" rx="12" ry="8" fill="#ff8a2b" ${ln(2)}/><path d="M-6 -36 Q-2 -42 2 -35" fill="#ff8a2b" ${ln(1.5)}/>` +
        `<circle cx="3" cy="-30" r="2" fill="${INK}"/></g>` +
        '<circle cx="10" cy="-40" r="2.5" fill="none" stroke="#fff" stroke-width="1.5"/><circle cx="14" cy="-50" r="2" fill="none" stroke="#fff" stroke-width="1.5"/>' +
        `<ellipse cx="0" cy="-63" rx="17" ry="4" fill="#cdeefc" ${ln(2)}/>` +
        '<path d="M-28 -46 Q-34 -32 -28 -16" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.8"/>',
    },
    parrot: {
      draw: () => '<ellipse cx="0" cy="0" rx="26" ry="4" fill="#000" opacity="0.15"/>' +
        `<ellipse cx="0" cy="-5" rx="20" ry="5" fill="#a8693a" ${ln(2)}/><rect x="-3" y="-92" width="6" height="88" fill="#c98b52" ${ln(2)}/><rect x="-22" y="-96" width="44" height="7" rx="3.5" fill="#c98b52" ${ln(2)}/>` +
        `<path d="M14 -94 Q18 -84 24 -94 Z" fill="#c3c9d4" ${ln(1.5)}/>` +
        `<g class="an-bob"><path d="M-6 -100 Q-12 -76 -4 -62 L4 -64 Q4 -82 4 -100 Z" fill="#5aa7e8" ${ln(2)}/>` +
        `<path d="M-2 -100 Q2 -78 10 -68 L14 -72 Q10 -86 6 -100 Z" fill="#ffd23f" ${ln(2)}/>` +
        `<ellipse cx="0" cy="-114" rx="14" ry="20" fill="#ff4f4f" ${ln()}/>` +
        `<path d="M-12 -122 Q-20 -104 -8 -96 Q-2 -108 -4 -122 Z" fill="#5aa7e8" ${ln(2)}/>` +
        `<path d="M-12 -112 Q-10 -104 -6 -100" fill="none" stroke="#ffd23f" stroke-width="3"/>` +
        `<circle cx="2" cy="-136" r="13" fill="#ff4f4f" ${ln()}/>` +
        `<path d="M12 -140 Q24 -138 20 -124 Q16 -130 12 -130 Z" fill="#ffd166" ${ln(2)}/>` +
        `<ellipse cx="6" cy="-139" rx="5" ry="5.5" fill="#fff"/><circle cx="7" cy="-139" r="2.5" fill="${INK}"/>` +
        `<path d="M-4 -148 Q-2 -156 4 -154 M0 -148 Q4 -158 10 -152" fill="none" stroke="#ff4f4f" stroke-width="3" stroke-linecap="round"/>` +
        `<path d="M-5 -94 v4 M5 -94 v4" ${ln(3)}/></g>`,
    },
    babydragon: {
      box: '-48 -110 96 116',
      draw: () => '<ellipse cx="0" cy="0" rx="34" ry="4" fill="#000" opacity="0.15"/>' +
        `<ellipse cx="0" cy="-12" rx="34" ry="10" fill="#8f5ad8" ${ln()}/>` +
        '<path d="M-32 -10 Q0 -2 32 -10" fill="none" stroke="#ffcf3f" stroke-width="3"/>' +
        `<path d="M-34 -12 L-40 -4 L-34 -2 Z M34 -12 L40 -4 L34 -2 Z" fill="#ffcf3f" ${ln(1.5)}/>` +
        `<g class="an-bob"><g transform="translate(-30 -95.6) scale(0.3)">${Look.inner('dragon', {}, 'happy')}</g>` +
        `<g transform="rotate(-12 0 -92)">${crown(0, -86, 0.7)}</g></g>` +
        sparkle(-34, -60, 7) + sparkle(36, -80, 6) + sparkle(30, -34, 5),
    },
  };
})();
