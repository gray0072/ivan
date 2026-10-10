// Walls (0..800 × 0..340).
// Cheap to elite; each entry is the catalog item (ITEMS) and its drawing (ROOM_ART), added by addItems.

(() => {
  const { r1, dot, star, sparkle, flip, flame, cloud, crown, gem, mod } = ROOM_KIT;
  const bg = c => `<rect x="0" y="0" width="800" height="340" fill="${c}"/>`;
  const cornice = (c, h = 17) => `<rect x="-5" y="-5" width="810" height="${h}" fill="${c}" ${ln(2)}/>`;
  // An ellipse as a sub-path (many in one <path>).
  const ell = (x, y, rx, ry) => `M${r1(x - rx)} ${r1(y)}a${rx} ${ry} 0 1 0 ${r1(2 * rx)} 0a${rx} ${ry} 0 1 0 ${r1(-2 * rx)} 0`;
  // A leaf from (x, y) pointing at angle a (degrees), as a sub-path.
  const leaf = (x, y, a, len, w) => {
    const c = Math.cos(a * Math.PI / 180), s = Math.sin(a * Math.PI / 180);
    const mx = x + c * len / 2, my = y + s * len / 2, px = -s * w, py = c * w;
    return `M${r1(x)} ${r1(y)}Q${r1(mx + px)} ${r1(my + py)} ${r1(x + c * len)} ${r1(y + s * len)}Q${r1(mx - px)} ${r1(my - py)} ${r1(x)} ${r1(y)}Z`;
  };
  // Smiling pumpkins [x, y, scale]: bodies, ribs, stems and faces combined into four paths.
  const pumpkins = list => {
    let b = '', r = '', st = '', f = '';
    for (const [x, y, s] of list) {
      b += ell(x, y, 16 * s, 12.5 * s);
      r += `M${x} ${r1(y - 12 * s)}Q${r1(x - 9 * s)} ${y} ${x} ${r1(y + 12 * s)}Q${r1(x + 9 * s)} ${y} ${x} ${r1(y - 12 * s)}`;
      st += `M${r1(x - 2 * s)} ${r1(y - 11 * s)}l${r1(1 * s)} ${r1(-7 * s)}h${r1(3.5 * s)}l${r1(-0.5 * s)} ${r1(7 * s)}z`;
      f += `M${r1(x - 9 * s)} ${r1(y - 1 * s)}l${r1(3 * s)} ${r1(-5 * s)}l${r1(3 * s)} ${r1(5 * s)}z` +
        `M${r1(x + 3 * s)} ${r1(y - 1 * s)}l${r1(3 * s)} ${r1(-5 * s)}l${r1(3 * s)} ${r1(5 * s)}z` +
        `M${r1(x - 9 * s)} ${r1(y + 3 * s)}Q${x} ${r1(y + 13 * s)} ${r1(x + 9 * s)} ${r1(y + 3 * s)}Q${x} ${r1(y + 7 * s)} ${r1(x - 9 * s)} ${r1(y + 3 * s)}z`;
    }
    return `<path d="${st}" fill="#5aa04a" ${ln(1.5)}/><path d="${b}" fill="#ff9a3c" ${ln(2)}/>` +
      `<path d="${r}" fill="none" stroke="#e0761f" stroke-width="2"/><path d="${f}" fill="${INK}"/>`;
  };
  // A little bat with white eyes.
  const bat = (x, y, s) => `<path d="M${x - 4 * s} ${y}Q${x - 12 * s} ${y - 10 * s} ${x - 24 * s} ${y - 4 * s}Q${x - 18 * s} ${y - 2 * s} ${x - 18 * s} ${y + 3 * s}` +
    `Q${x - 12 * s} ${y - 1 * s} ${x - 8 * s} ${y + 5 * s}Q${x - 4 * s} ${y + 2 * s} ${x} ${y + 7 * s}Q${x + 4 * s} ${y + 2 * s} ${x + 8 * s} ${y + 5 * s}` +
    `Q${x + 12 * s} ${y - 1 * s} ${x + 18 * s} ${y + 3 * s}Q${x + 18 * s} ${y - 2 * s} ${x + 24 * s} ${y - 4 * s}Q${x + 12 * s} ${y - 10 * s} ${x + 4 * s} ${y}Z` +
    `M${x - 5 * s} ${y - 2 * s}l${s} ${-7 * s}l${3 * s} ${3 * s}h${2 * s}l${3 * s} ${-3 * s}l${s} ${7 * s}Q${x} ${y + 6 * s} ${x - 5 * s} ${y - 2 * s}Z" fill="#33244c" ${ln(1.5)}/>` +
    `<path d="${dot(x - 2 * s, y - 2 * s, 1.4 * s)}${dot(x + 2 * s, y - 2 * s, 1.4 * s)}" fill="#fff"/>`;
  // A fish facing right (d = 1) or left (d = -1).
  const fish = (x, y, s, col, d) => `<path d="M${x - d * 16 * s} ${y}L${x - d * 28 * s} ${y - 10 * s}L${x - d * 26 * s} ${y}L${x - d * 28 * s} ${y + 10 * s}Z" fill="${col}" ${ln(1.5)}/>` +
    `<path d="${ell(x, y, 18 * s, 11 * s)}" fill="${col}" ${ln(2)}/>` +
    `<path d="M${x - d * 4 * s} ${y - 10 * s}Q${x - d * 8 * s} ${y} ${x - d * 4 * s} ${y + 10 * s}" fill="none" stroke="#fff" stroke-width="${3 * s}" opacity="0.7"/>` +
    `<circle cx="${x + d * 9 * s}" cy="${y - 2 * s}" r="${2.6 * s}" fill="${INK}"/>`;
  // A Dala horse standing on (x, y), facing right; harness flowers on top.
  const DALA = [[-16, 0], [-15, -13], [-19, -17], [-16, -23], [3, -23], [7, -34], [9, -39], [11, -35], [19, -30], [21, -24], [15, -24],
    [11, -21], [12, -13], [14, 0], [7, 0], [5, -7], [-5, -7], [-8, 0]];
  const dalaD = (x, y, s) => DALA.map(([px, py], i) => (i ? 'L' : 'M') + r1(x + px * s) + ' ' + r1(y + py * s)).join('') + 'Z';
  const dalaDeco = (x, y, s) => `M${r1(x - 12 * s)} ${r1(y - 22 * s)}Q${r1(x - 12 * s)} ${r1(y - 14 * s)} ${r1(x - 4.5 * s)} ${r1(y - 14 * s)}` +
    `Q${r1(x + 3 * s)} ${r1(y - 14 * s)} ${r1(x + 3 * s)} ${r1(y - 22 * s)}M${r1(x + 6 * s)} ${r1(y - 31 * s)}Q${r1(x + 2 * s)} ${r1(y - 27 * s)} ${r1(x + 4 * s)} ${r1(y - 22 * s)}`;
  // A Falu-red cottage with white corners standing on (x, y), lit = yellow windows.
  const cottage = (x, y, s, lit) => `<path d="M${x - 26 * s} ${y}V${y - 26 * s}H${x + 26 * s}V${y}Z" fill="#b8392b" ${ln(2)}/>` +
    `<path d="M${x - 32 * s} ${y - 24 * s}L${x} ${y - 46 * s}L${x + 32 * s} ${y - 24 * s}Z" fill="#3b3346" ${ln(2)}/>` +
    `<path d="M${x - 26 * s} ${y - 25 * s}V${y}M${x + 26 * s} ${y - 25 * s}V${y}" stroke="#fff" stroke-width="${4 * s}"/>` +
    `<rect x="${x - 18 * s}" y="${y - 19 * s}" width="${11 * s}" height="${10 * s}" fill="${lit ? '#ffd65a' : '#cfe8ff'}" stroke="#fff" stroke-width="${2.5 * s}"/>` +
    `<rect x="${x + 4 * s}" y="${y - 19 * s}" width="${9 * s}" height="${19 * s}" fill="#fff"/><rect x="${x + 6 * s}" y="${y - 17 * s}" width="${5 * s}" height="${17 * s}" fill="#4f7fae"/>`;
  // Fir / pine silhouettes [x, y bottom, height] in one path.
  const pines = (list, fill) => `<path d="${list.map(([x, y, h]) => {
    const w = h * 0.36;
    return `M${x} ${y - h}L${r1(x + w * 0.6)} ${r1(y - h * 0.62)}H${r1(x + w * 0.3)}L${r1(x + w)} ${r1(y - h * 0.2)}H${r1(x + 3)}V${y}H${x - 3}V${r1(y - h * 0.2)}` +
      `H${r1(x - w)}L${r1(x - w * 0.3)} ${r1(y - h * 0.62)}H${r1(x - w * 0.6)}Z`;
  }).join('')}" fill="${fill}"/>`;

  addItems('wall', ROOM_ART, [
    { id: 'plaster', name: 'Old plaster', price: 0,
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
    // The same old plaster, cracks filled and the brick hole covered with a fresh patch of paint.
    { id: 'patchwall', name: 'Patched plaster', price: 15,
      box: '440 0 340 340',
      draw: () => bg('#d3cab8') + '<rect x="0" y="0" width="800" height="8" fill="#bfb49f"/>' +
        '<g fill="#c4baa6" opacity="0.6"><ellipse cx="130" cy="255" rx="80" ry="30"/><ellipse cx="350" cy="60" rx="90" ry="24"/>' +
        '<ellipse cx="700" cy="300" rx="66" ry="24"/><ellipse cx="40" cy="120" rx="30" ry="50"/></g>' +
        '<path d="M266 8 L272 28 L261 44 L275 64 L268 88 M462 132 L478 150 L470 166 L488 182 L484 200" fill="none" stroke="#efe8d8" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M8 300 L30 292 L40 306 L62 298" fill="none" stroke="#7d7262" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M452 214 Q470 202 540 210 Q612 202 630 220 Q638 262 628 306 Q560 318 468 310 Q446 272 452 214 Z" fill="#f3ecdc" stroke="#e2d8c3" stroke-width="3"/>' +
        '<path d="M478 234 Q540 226 604 236 M472 260 Q540 252 612 262 M478 286 Q540 280 604 290" fill="none" stroke="#fffaf0" stroke-width="6" stroke-linecap="round"/>' +
        '<path d="M500 309 q3 10 0 16 q-3 -6 0 -16 Z" fill="#f3ecdc" stroke="#e2d8c3" stroke-width="1.5"/>' +
        '<path d="M760 36 Q780 30 796 16" fill="none" stroke="#f7f4ee" stroke-width="1.6"/>',
    },
    // Freshly painted in one soft colour, the roller marks still a little visible.
    { id: 'paintwall', name: 'Painted wall', price: 30,
      draw: () => {
        let roll = '';
        for (let i = 0; i < 18; i++) roll += `M${(i * 47 + 12) % 800} ${12 + (i * 31) % 40}v${200 + (i * 53) % 100}`;
        return bg('#f7dcc0') + `<path d="${roll}" stroke="#fbe6d0" stroke-width="22" stroke-linecap="round" opacity="0.5"/>` +
          '<path d="M160 12 v34 M168 12 v20" stroke="#efc9a2" stroke-width="5" stroke-linecap="round"/>' + cornice('#eebd94');
      },
    },
    // Whitewash with a stencilled border of blue tulips along the top.
    { id: 'stencilwall', name: 'Stencil border wall', price: 50,
      draw: () => {
        let brush = '', tul = '', lv = '', dt = '';
        for (let i = 0; i < 14; i++) brush += `M${(i * 173) % 760} ${70 + (i * 61) % 250}h${90 + (i * 37) % 80}`;
        for (let x = 20; x < 800; x += 40) {
          tul += `M${x} 44q-8 -6 -7 -16q4 3 7 5q3 -2 7 -5q1 10 -7 16z`;
          lv += leaf(x - 1, 46, -150, 11, 3) + leaf(x + 1, 46, -30, 11, 3);
          dt += dot(x + 20, 33, 2.2);
        }
        return bg('#f6f3eb') + `<path d="${brush}" stroke="#ece6d8" stroke-width="16" stroke-linecap="round"/>` +
          '<path d="M0 17H800M0 53H800" stroke="#5b86c4" stroke-width="2.5"/>' +
          `<path d="${tul}" fill="#5b86c4"/><path d="${lv}" fill="#7fb07c"/><path d="${dt}" fill="#e57b6a"/>` +
          cornice('#e8e2d4', 12);
      },
    },
    { id: 'stripes', name: 'Striped wallpaper', price: 80,
      draw: () => {
        let h = '<rect x="0" y="0" width="800" height="340" fill="#eaf8f2"/>';
        for (let x = 0; x < 800; x += 50) h += `<rect x="${x + 6}" y="0" width="22" height="340" fill="#bfe8d6"/><rect x="${x + 38}" y="0" width="4" height="340" fill="#ffc6b0"/>`;
        return h + `<rect x="-5" y="-5" width="810" height="17" fill="#8fd2b8" ${ln(2)}/>`;
      },
    },
    // Swedish: Falu-red wooden planks with white trim, like a red cottage.
    { id: 'faluwall', name: 'Falu-red planks', price: 100,
      draw: () => {
        let seams = '', light = '', knots = '';
        for (let x = 18; x < 790; x += 44) {
          seams += `M${x} 20V340`;
          light += `M${x + 10} 24V340`;
          if (mod(x * 7, 5) < 2) knots += ell(x + 24, 60 + (x * 3) % 240, 4, 2.4);
        }
        return bg('#a8372b') + `<path d="${light}" stroke="#b9493b" stroke-width="5"/><path d="${seams}" stroke="#7a271e" stroke-width="2.5"/>` +
          `<path d="${knots}" fill="#7a271e"/>` +
          `<rect x="-5" y="-5" width="810" height="27" fill="#f7f2e8" ${ln(2)}/><path d="M0 14H800" stroke="#e2dccf" stroke-width="2"/>` +
          `<rect x="-5" y="20" width="23" height="325" fill="#f7f2e8" ${ln(2)}/><rect x="782" y="20" width="23" height="325" fill="#f7f2e8" ${ln(2)}/>`;
      },
    },
    // Halloween: lilac wallpaper with rows of smiling pumpkins.
    { id: 'pumpkinwall', name: 'Pumpkin wallpaper', price: 120,
      draw: () => {
        const list = [];
        let st = '';
        for (let r = 0; r < 3; r++) {
          for (let i = 0; i < 8; i++) {
            const x = i * 100 + (r % 2 ? 100 : 50), y = 70 + r * 100;
            if (x < 820) list.push([x, y, 1.35]);
            st += star(x - 50, y + 4, 7) + dot(x - 32, y - 30, 3);
          }
        }
        return bg('#efe3f9') + `<path d="${st}" fill="#c8a8ec"/>` + pumpkins(list) + cornice('#b58ae0');
      },
    },
    { id: 'flowerwall', name: 'Flower wallpaper', price: 150,
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
    // Swedish: wallpaper with red Dala horses and little painted flowers.
    { id: 'dalawall', name: 'Dala horse wallpaper', price: 200,
      draw: () => {
        let horses = '', deco = '', fl = '', fc = '';
        for (let r = 0; r < 3; r++) {
          for (let i = 0; i < 9; i++) {
            const x = i * 100 + (r % 2 ? 0 : 50), y = 100 + r * 100;
            horses += dalaD(x, y, 1.25);
            deco += dalaDeco(x, y, 1.25);
            fl += dot(x - 50, y - 26, 3.2) + dot(x - 43, y - 26, 3.2) + dot(x - 46.5, y - 32, 3.2) + dot(x - 46.5, y - 20, 3.2);
            fc += dot(x - 46.5, y - 26, 2.2) + dot(x - 6, y - 23, 2);
          }
        }
        return bg('#dde9f6') + `<path d="${fl}" fill="#7fb07c"/><path d="${horses}" fill="#d8402f" ${ln(1.5)}/>` +
          `<path d="${deco}" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/><path d="${fc}" fill="#ffd23f"/>` +
          cornice('#4f7fae');
      },
    },
    // Wooden shelves full of books, all the way round.
    { id: 'bookwall', name: 'Library shelves', price: 250,
      draw: () => {
        const cols = ['#c9604a', '#4f7fae', '#e3b44c', '#6aa36f', '#9b6bb0', '#e8d9b8'], books = cols.map(() => '');
        let bands = '';
        [96, 186, 276, 340].forEach((by, r) => {
          for (let bay = 0; bay < 4; bay++) {
            let x = bay * 200 + 12;
            for (let k = 0; x < bay * 200 + 186; k++) {
              const n = r * 31 + bay * 17 + k, w = 13 + (n * 7) % 10, hh = 50 + (n * 13) % 22;
              if (x + w > bay * 200 + 188) break;
              if (n % 9 === 4) { x += 10; continue; }
              books[(n * 5) % 6] += `M${x} ${by}v${-hh}h${w}v${hh}z`;
              if (n % 3 === 0) bands += `M${x + 2} ${by - hh + 8}h${w - 4}M${x + 2} ${by - 10}h${w - 4}`;
              x += w;
            }
          }
        });
        let h = bg('#6b4528') + books.map((d, i) => `<path d="${d}" fill="${cols[i]}" ${ln(1.5)}/>`).join('') +
          `<path d="${bands}" stroke="#fff" stroke-width="2" opacity="0.6"/>`;
        for (const y of [96, 186, 276]) h += `<rect x="-5" y="${y}" width="810" height="10" fill="#b07a46" ${ln(2)}/>`;
        for (const x of [0, 200, 400, 600, 800]) h += `<rect x="${x - 7}" y="0" width="14" height="340" fill="#9a6838" ${ln(2)}/>`;
        return h + cornice('#9a6838', 20);
      },
    },
    { id: 'starwall', name: 'Starry wallpaper', price: 300,
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
    // Jungle: big leaves, vines swinging from the ceiling and a fluttering butterfly.
    { id: 'junglewall', name: 'Jungle wall', price: 400,
      draw: () => {
        let back = '', front = '', top = '';
        for (let i = 0; i < 15; i++) {
          const x = i * 58 - 10;
          back += leaf(x, 345, -60 - (i * 37) % 60, 150 + (i * 23) % 60, 26);
          front += leaf(x + 28, 345, -100 + (i * 29) % 50, 90 + (i * 17) % 40, 18);
          top += leaf(x + 14, -6, 60 + (i * 41) % 60, 60 + (i * 13) % 30, 15);
        }
        const vine = (x, len, d) => {
          let lv = '', p = `M${x} 0`;
          for (let y = 0; y < len; y += 40) p += `Q${x + 14} ${y + 20} ${x} ${y + 40}`;
          for (let y = 30; y < len; y += 34) lv += leaf(x, y, (y / 34) % 2 ? 30 : 150, 22, 7);
          return flip(`an-sway an-d${d}`, `<path d="${p}" fill="none" stroke="#4f8f3a" stroke-width="4"/><path d="${lv}" fill="#6cc05a" ${ln(1.2)}/>`);
        };
        const fly = (x, y, c, d) => `<g class="an-float an-d${d}"><path d="${ell(x - 8, y - 4, 8, 6)}${ell(x + 8, y - 4, 8, 6)}${ell(x - 6, y + 5, 5.5, 4.5)}${ell(x + 6, y + 5, 5.5, 4.5)}" fill="${c}" ${ln(1.5)}/>` +
          `<path d="M${x} ${y - 8}V${y + 9}" ${ln(3)}/></g>`;
        return bg('#cdeeb8') + `<path d="${back}" fill="#a8dc8e"/>` + `<path d="${front}" fill="#5fae4c" ${ln(1.5)}/>` +
          '<path d="M60 250 a9 9 0 1 0 0.1 0 M750 280 a9 9 0 1 0 0.1 0 M280 300 a8 8 0 1 0 0.1 0" fill="#ff7aa8"/>' +
          vine(250, 150, 1) + vine(330, 110, 2) + vine(480, 160, 3) + vine(560, 120, 4) + vine(30, 120, 2) +
          `<path d="${top}" fill="#3f8a3a" ${ln(1.5)}/>` + fly(420, 240, '#ffb84d', 1) + fly(250, 200, '#8fcfff', 3);
      },
    },
    // Swedish: Midsummer meadow mural with the maypole, a red cottage, the flag and butterflies.
    { id: 'midsummerwall', name: 'Midsummer mural', price: 500,
      draw: () => {
        let fl = ['', '', '', ''];
        for (let i = 0; i < 60; i++) fl[i % 4] += dot((i * 137 + 20) % 800, 262 + (i * 53) % 74, 3.2);
        let rays = '';
        for (let k = 0; k < 12; k++) {
          const a = k * Math.PI / 6, c = Math.cos(a), s = Math.sin(a);
          rays += `M${r1(320 + c * 36)} ${r1(66 + s * 36)}L${r1(320 + c * 50 - s * 5)} ${r1(66 + s * 50 + c * 5)}L${r1(320 + c * 50 + s * 5)} ${r1(66 + s * 50 - c * 5)}Z`;
        }
        const ring = x => `<path d="M${x} 117V136" ${ln(2)}/><circle cx="${x}" cy="158" r="22" fill="none" stroke="#4f9a3e" stroke-width="9"/>` +
          `<path d="${dot(x - 22, 158, 3.5)}${dot(x + 22, 158, 3.5)}${dot(x, 136, 3.5)}${dot(x, 180, 3.5)}" fill="#ffe14d"/>` +
          `<path d="${dot(x - 16, 142, 3)}${dot(x + 16, 174, 3)}${dot(x + 16, 142, 3)}${dot(x - 16, 174, 3)}" fill="#ff7aa0"/>`;
        const ribbon = (x, c, d) => flip(`an-sway an-d${d}`, `<path d="M${x} 112 q-8 40 2 84" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round"/>`);
        const fly = (x, y, c, d) => `<g class="an-float an-d${d}"><path d="${ell(x - 7, y, 7, 5.5)}${ell(x + 7, y, 7, 5.5)}" fill="${c}" ${ln(1.5)}/><path d="M${x} ${y - 7}V${y + 7}" ${ln(3)}/></g>`;
        return bg('#bfe6ff') + `<g class="an-spin" style="animation-duration:30s"><path d="${rays}" fill="#ffe680"/></g>` +
          `<circle cx="320" cy="66" r="30" fill="#ffd23f" ${ln(2)}/>` + cloud(420, 46, 1.4) + cloud(150, 30, 1.1) +
          `<path d="M-5 236 Q120 196 260 222 Q420 190 560 222 Q700 200 805 230 V345 H-5 Z" fill="#a6dc8a" ${ln(2)}/>` +
          `<path d="M-5 268 Q200 248 400 262 Q600 248 805 266 V345 H-5 Z" fill="#8bcd68"/>` +
          fl.map((d, i) => `<path d="${d}" fill="${['#fff', '#ffe14d', '#6a9cff', '#ff7aa0'][i]}"/>`).join('') +
          cottage(130, 230, 1.1, false) +
          `<path d="M232 234V176" ${ln(2.5)}/><path d="M233 176h30v20h-30z" fill="#4f7fd0" ${ln(1.5)}/><path d="M243 176v20M233 186h30" stroke="#ffd23f" stroke-width="5"/>` +
          ribbon(448, '#ffd23f', 1) + ribbon(552, '#4f7fd0', 3) + ribbon(456, '#4f7fd0', 2) + ribbon(544, '#ffd23f', 4) +
          `<rect x="493" y="60" width="14" height="210" rx="4" fill="#5aa04a" ${ln(2)}/><rect x="440" y="104" width="120" height="13" rx="5" fill="#5aa04a" ${ln(2)}/>` +
          `<path d="${[80, 130, 180, 230].map(y => leaf(493, y, -40, 14, 4) + leaf(507, y + 22, -140, 14, 4)).join('')}" fill="#86cc6a"/>` +
          `<path d="${dot(500, 92, 3.5)}${dot(500, 150, 3.5)}${dot(500, 200, 3.5)}${dot(500, 250, 3.5)}${dot(470, 110, 3.5)}${dot(530, 110, 3.5)}" fill="#fff"/>` +
          `<path d="${dot(500, 60, 6)}" fill="#ffe14d" ${ln(1.5)}/>` +
          ring(452) + ring(548) + fly(400, 222, '#ffb84d', 1) + fly(580, 250, '#fff', 3);
      },
    },
    // Halloween: a spooky purple night with a pumpkin garland, a friendly ghost and bats flying about.
    { id: 'batwall', name: 'Spooky bat wall', price: 600,
      draw: () => {
        let str = 'M-5 10';
        for (let x = 0; x < 800; x += 200) str += `Q${x + 100} 70 ${x + 200} 10`;
        let stripes = '';
        for (let x = 20; x < 800; x += 80) stripes += `M${x} 0V340`;
        const fly = (x, y, s, d) => `<g class="an-drift an-d${d}"><g class="an-float an-d${(d + 2) % 4 + 1}">${bat(x, y, s)}</g></g>`;
        return bg('#4a3370') + `<path d="${stripes}" stroke="#543c7d" stroke-width="30"/>` +
          `<circle cx="300" cy="120" r="44" fill="#fff2b8" ${ln(2)}/><path d="${dot(288, 108, 7)}${dot(314, 132, 9)}${dot(312, 100, 4)}" fill="#f0dd94"/>` +
          '<path d="M210 160 Q260 146 320 160 Q370 170 400 158 M520 90 Q580 80 640 92" fill="none" stroke="#7a62a6" stroke-width="10" stroke-linecap="round"/>' +
          `<path d="${str}" fill="none" stroke="#c9b2e8" stroke-width="2.5"/>` +
          '<g class="an-glow"><path d="' + [100, 300, 500, 700].map(x => dot(x, 52, 24)).join('') + '" fill="#ffb347" opacity="0.35"/></g>' +
          pumpkins([[100, 52, 1], [300, 52, 1], [500, 52, 1], [700, 52, 1]]) +
          '<g class="an-float an-d2"><path d="M226 250V206Q226 172 254 172Q282 172 282 206V250l-9 -9l-9 9l-10 -9l-10 9l-9 -9z" fill="#fbf8ff" ' + ln(2) + '/>' +
          `<path d="${dot(245, 203, 4)}${dot(263, 203, 4)}" fill="${INK}"/><path d="${dot(239, 214, 4)}${dot(269, 214, 4)}" fill="#ffb3c7"/>` +
          `<path d="M247 216q7 7 14 0" fill="none" ${ln(2.5)}/></g>` +
          fly(430, 104, 2, 1) + fly(560, 196, 1.6, 2) + fly(150, 230, 1.5, 3) + fly(660, 250, 1.3, 4) + fly(380, 250, 1.3, 2) + fly(40, 120, 1.2, 3);
      },
    },
    { id: 'castlewall', name: 'Castle stones', price: 700,
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
    // Christmas: a winter-blue wall with falling snow, a fir garland with blinking lights and swinging baubles.
    { id: 'christmaswall', name: 'Christmas garland wall', price: 800,
      draw: () => {
        const snow = ['', '', '', ''];
        for (let i = 0; i < 64; i++) snow[i % 4] += dot((i * 137 + 23) % 800, 70 + (i * 71) % 250, 2 + (i % 3));
        let sw = 'M-10 8', bulbs = ['', '', '', ''];
        for (let x = 0; x < 800; x += 200) {
          sw += `Q${x + 100} 70 ${x + 200} 8`;
          [0.15, 0.32, 0.5, 0.68, 0.85].forEach((t, k) => {
            const bx = x + 200 * t, by = r1((1 - t) * (1 - t) * 8 + 2 * t * (1 - t) * 70 + t * t * 8 + 7);
            bulbs[(x / 200 + k) % 4] += ell(bx, by, 5, 7);
          });
        }
        const bauble = (x, y, c, d) => flip(`an-sway an-d${d}`, `<path d="M${x} 36V${y - 12}" stroke="#ffd36b" stroke-width="2"/>` +
          `<circle cx="${x}" cy="${y}" r="13" fill="${c}" ${ln(2)}/><rect x="${x - 4}" y="${y - 17}" width="8" height="6" fill="#ffd36b" ${ln(1.2)}/>` +
          `<path d="M${x - 6} ${y - 5}q3 -3 6 -3" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`);
        const bow = x => `<path d="M${x} 12l-16 -9v18zM${x} 12l16 -9v18z" fill="#e2384d" ${ln(1.5)}/><circle cx="${x}" cy="12" r="5" fill="#e2384d" ${ln(1.5)}/>` +
          `<path d="M${x - 2} 15l-6 18M${x + 2} 15l6 18" stroke="#e2384d" stroke-width="4" stroke-linecap="round"/>`;
        return bg('#33558f') + '<path d="M-5 300 Q120 270 260 296 Q420 266 560 294 Q700 272 805 290 V345 H-5 Z" fill="#eef6ff"/>' +
          snow.map((d, i) => `<path class="an-fall an-d${i + 1}" d="${d}" fill="#fff"/>`).join('') +
          bauble(300, 120, '#e2384d', 1) + bauble(500, 110, '#ffd23f', 3) + bauble(100, 104, '#5fb7ff', 2) + bauble(700, 116, '#7ed957', 4) +
          `<path d="${sw}" fill="none" stroke="#24683a" stroke-width="22" stroke-linecap="round"/><path d="${sw}" fill="none" stroke="#3a9a52" stroke-width="10" stroke-linecap="round" stroke-dasharray="6 9"/>` +
          bulbs.map((d, i) => `<path class="an-blink an-d${i + 1}" d="${d}" fill="${['#ff5d6c', '#ffe14d', '#6ec3ff', '#8dff7a'][i]}" ${ln(1.5)}/>`).join('') +
          bow(200) + bow(400) + bow(600);
      },
    },
    // Underwater: a whole aquarium wall with fish swimming, swaying seaweed and bubbles.
    { id: 'aquawall', name: 'Aquarium wall', price: 1000,
      draw: () => {
        const weed = (x, hgt, d) => `<g class="an-sway an-d${d}"><path d="M${x} 345 Q${x - 18} ${345 - hgt / 2} ${x} ${345 - hgt} Q${x + 14} ${345 - hgt / 2} ${x + 10} 345 Z` +
          `M${x + 14} 345 Q${x + 30} ${345 - hgt / 3} ${x + 22} ${345 - hgt * 0.7} Q${x + 10} ${345 - hgt / 3} ${x + 22} 345 Z" fill="#4fbf72" ${ln(1.5)}/></g>`;
        const bub = (x, y, d) => `<g class="an-rise an-d${d}"><path d="${dot(x, y, 5)}${dot(x + 8, y - 22, 3.5)}${dot(x - 4, y - 40, 4)}" fill="none" stroke="#fff" stroke-width="2"/></g>`;
        const sw = (s, d) => `<g class="an-swim an-d${d}">${s}</g>`;
        return bg('#5fc0ea') + '<rect x="0" y="0" width="800" height="70" fill="#86d3f2"/><rect x="0" y="250" width="800" height="90" fill="#4aaedc"/>' +
          '<path d="M60 0 L140 0 L60 340 L0 340 Z M300 0 L360 0 L300 340 L250 340 Z M560 0 L610 0 L560 340 L520 340 Z" fill="#fff" opacity="0.12"/>' +
          weed(30, 150, 1) + weed(230, 110, 3) + weed(540, 140, 2) + weed(740, 170, 4) +
          `<path d="M120 345 V300 M120 316 L104 296 M120 308 L136 288 M660 345 V292 M660 312 L644 290 M660 304 L678 284" stroke="#ff8fa8" stroke-width="9" stroke-linecap="round"/>` +
          sw(fish(320, 70, 1.1, '#ffb347', 1), 1) + sw(fish(470, 140, 0.9, '#ff7aa8', -1), 3) + sw(fish(150, 220, 1, '#ffe14d', 1), 2) +
          sw(fish(620, 240, 1.2, '#b28cff', -1), 4) + sw(fish(400, 250, 0.7, '#7ee0c8', 1), 2) +
          bub(260, 300, 1) + bub(520, 280, 3) + bub(360, 180, 2) + bub(700, 220, 4) +
          `<rect x="-5" y="-5" width="810" height="14" fill="#3d5f80" ${ln(2)}/>`;
      },
    },
    // Space station: metal panels, round portholes with planets and stars, blinking control lights.
    { id: 'spacewall', name: 'Space station', price: 1500,
      draw: () => {
        let panels = '', rivets = '', stars = '';
        for (let r = 0; r < 4; r++) for (let i = 0; i < 8; i++) {
          const x = i * 100 + 4, y = 28 + r * 80;
          panels += `M${x + 6} ${y}h88a6 6 0 0 1 6 6v68a6 6 0 0 1 -6 6h-88a6 6 0 0 1 -6 -6v-68a6 6 0 0 1 6 -6z`;
          rivets += dot(x + 8, y + 8, 2.5) + dot(x + 92, y + 8, 2.5) + dot(x + 8, y + 72, 2.5) + dot(x + 92, y + 72, 2.5);
        }
        for (let i = 0; i < 20; i++) stars += dot(300 + ((i * 47) % 110) - 55, 118 + ((i * 31) % 100) - 50, 1.6) + dot(510 + ((i * 29) % 64) - 32, 96 + ((i * 43) % 64) - 32, 1.4);
        const port = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r + 14}" fill="#8e9bb3" ${ln(2)}/>` +
          `<path d="${Array.from({ length: 8 }, (_, k) => dot(x + Math.cos(k * Math.PI / 4) * (r + 7), y + Math.sin(k * Math.PI / 4) * (r + 7), 2.5)).join('')}" fill="#5c6880"/>` +
          `<circle cx="${x}" cy="${y}" r="${r}" fill="#1b2350" ${ln(2)}/>`;
        let lights = ['', '', ''];
        for (let x = 30; x < 800; x += 40) lights[(x / 40 | 0) % 3] += dot(x, 12, 4);
        return bg('#aab6c9') + `<path d="${panels}" fill="#d3dbe8" ${ln(1.5)}/><path d="${rivets}" fill="#9aa7bb"/>` +
          '<rect x="-5" y="250" width="810" height="14" rx="6" fill="#c0cad9" stroke="#3b2f5c" stroke-width="2"/>' +
          '<path d="M140 250v14M380 250v14M660 250v14" stroke="#3b2f5c" stroke-width="2"/>' +
          port(300, 118, 56) + port(510, 96, 34) + `<path d="${stars}" fill="#dfe6ff"/>` +
          `<circle cx="282" cy="132" r="20" fill="#ff9f6b" ${ln(2)}/><ellipse cx="282" cy="132" rx="32" ry="8" fill="none" stroke="#ffd36b" stroke-width="3" transform="rotate(-16 282 132)"/>` +
          `<circle cx="522" cy="86" r="10" fill="#6ec3ff" ${ln(1.5)}/><path d="M516 82q4 -2 6 2q2 4 6 2" fill="none" stroke="#7ed957" stroke-width="3"/>` +
          `<g class="an-twinkle"><path d="${star(330, 92, 7)}" fill="#ffe680"/></g><g class="an-twinkle an-d2"><path d="${star(494, 110, 5)}" fill="#ffe680"/></g>` +
          `<rect x="-5" y="-5" width="810" height="30" fill="#5c6880" ${ln(2)}/>` +
          lights.map((d, i) => `<path class="an-blink an-d${i + 1}" d="${d}" fill="${['#ff5d6c', '#7ed957', '#ffd23f'][i]}" ${ln(1.2)}/>`).join('');
      },
    },
    // Swedish: northern lights glowing and drifting over a snowy pine forest and a red cottage.
    { id: 'aurorawall', name: 'Northern lights wall', gems: 10,
      draw: () => {
        let st = '';
        for (let i = 0; i < 50; i++) st += dot((i * 137 + 11) % 800, (i * 61) % 250 + 6, 1.5);
        const band = (y0, amp, th, c, d) => {
          const yy = k => r1(y0 + Math.sin(k * 1.3 + d) * amp), tt = k => r1(th * (0.6 + 0.4 * Math.cos(k * 0.9 + d)));
          let top = `M-80 ${yy(0)}`, bot = '', rays = '';
          for (let k = 0; k < 8; k++) top += `Q${-80 + k * 120 + 60} ${yy(k + 0.5)} ${-80 + (k + 1) * 120} ${yy(k + 1)}`;
          for (let k = 8; k > 0; k--) bot += `Q${-80 + k * 120 - 60} ${r1(yy(k - 0.5) + tt(k - 0.5) * 1.3)} ${-80 + (k - 1) * 120} ${r1(yy(k - 1) + tt(k - 1))}`;
          for (let x = -60; x < 880; x += 26) { const k = (x + 80) / 120; rays += `M${x} ${r1(yy(k) + 6)}v${r1(tt(k) * 0.8)}`; }
          return `<g class="an-drift an-d${d}"><g class="an-glow an-d${d % 4 + 1}"><path d="${top}L880 ${r1(yy(8) + tt(8))}${bot}Z" fill="${c}" opacity="0.45"/>` +
            `<path d="${rays}" stroke="${c}" stroke-width="6" stroke-linecap="round" opacity="0.6"/></g></g>`;
        };
        return bg('#17214a') + `<path d="${st}" fill="#d7defc"/>` +
          band(50, 22, 50, '#5fd8e8', 1) + band(104, 30, 70, '#62f2a6', 3) + band(70, 26, 30, '#c79bff', 2) +
          sparkle(120, 30, 7) + sparkle(560, 50, 6) + sparkle(380, 200, 6) +
          `<path d="M-5 262 Q150 230 300 254 Q480 224 620 250 Q720 236 805 252 V345 H-5 Z" fill="#e8f0ff" ${ln(2)}/>` +
          pines([[30, 262, 80], [70, 258, 104], [120, 254, 70], [520, 248, 76], [570, 244, 96], [640, 250, 84], [720, 248, 110], [770, 252, 74]], '#173847') +
          `<circle cx="296" cy="236" r="26" fill="#ffd65a" opacity="0.25"/>` + cottage(300, 258, 1, true) +
          '<path d="M0 300 Q200 286 400 296 Q600 286 800 298" fill="none" stroke="#cbd9f2" stroke-width="3"/>';
      },
    },
    // White marble slabs with gold seams, a gold frieze and medallions.
    { id: 'marblewall', name: 'Marble and gold', gems: 20,
      draw: () => {
        let seams = 'M0 136H800', dent = '';
        for (let x = 200; x < 800; x += 200) seams += `M${x} 26V220`;
        for (let x = 6; x < 800; x += 24) dent += `M${x} 26h12v10h-12z`;
        const medal = x => `<circle cx="${x}" cy="136" r="26" fill="#f2bd34" ${ln(2)}/><circle cx="${x}" cy="136" r="18" fill="#fff6dd" ${ln(1.5)}/>` + gem(x, 136, 11, '#5fb7ff');
        let h = bg('#f7f3f0') + '<rect x="0" y="220" width="800" height="120" fill="#ece3ec"/>' +
          '<path d="M20 60 Q60 80 70 110 T120 130 M240 40 Q280 70 260 110 M330 160 Q370 170 380 210 M440 60 Q480 70 520 60 T580 100 ' +
          'M620 150 Q660 160 690 200 M720 40 Q760 70 790 80 M90 160 Q120 180 140 210" fill="none" stroke="#d2c8d8" stroke-width="2.5"/>' +
          '<path d="M60 250 Q90 270 130 266 M300 280 Q330 300 360 330 M520 250 Q560 270 590 262 M700 290 Q730 310 760 312" fill="none" stroke="#d2c8d8" stroke-width="2.5"/>' +
          `<path d="${seams}" stroke="#e2b23c" stroke-width="4"/>`;
        for (let x = 20; x < 800; x += 200) h += `<rect x="${x}" y="238" width="160" height="86" rx="6" fill="none" stroke="#e6a823" stroke-width="4"/>`;
        h += `<rect x="-5" y="214" width="810" height="14" fill="#f2bd34" ${ln(2)}/><path d="M0 220H800" stroke="#ffe08a" stroke-width="3"/>` +
          `<path d="${dent}" fill="#e6a823" ${ln(1.5)}/>` + cornice('#f2bd34', 31) + '<path d="M0 14H800" stroke="#ffe08a" stroke-width="3"/>' +
          medal(300) + medal(500) + crown(400, 110, 1.3);
        for (const [x, y] of [[240, 60], [560, 190], [120, 200], [460, 280], [720, 160], [360, 50]]) h += sparkle(x, y, 8);
        return h;
      },
    },
    { id: 'palace', name: 'Golden palace', gems: 35,
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
    // A crystal palace: faceted crystals growing up and hanging down, a row of glowing gems, twinkles everywhere.
    { id: 'crystalwall', name: 'Crystal palace', gems: 50,
      draw: () => {
        let lat = '';
        for (let x = -340; x < 800; x += 60) lat += `M${x} 0L${x + 340} 340M${x + 340} 0L${x} 340`;
        const cols = ['#8fd4ff', '#c4a3ff', '#ff9fd6'], body = ['', '', ''];
        let face = '';
        // Crystals [x, base y, width, height, up (1) or hanging (-1)].
        const cr = [[30, 345, 24, 150, 1], [80, 345, 18, 100, 1], [118, 345, 14, 70, 1], [250, 345, 20, 110, 1], [284, 345, 14, 64, 1],
          [520, 345, 14, 70, 1], [560, 345, 22, 120, 1], [610, 345, 16, 80, 1], [712, 345, 16, 96, 1], [760, 345, 26, 160, 1],
          [60, 26, 12, 46, -1], [130, 26, 14, 60, -1], [250, 26, 12, 44, -1], [330, 26, 16, 74, -1], [470, 26, 16, 70, -1], [550, 26, 12, 48, -1],
          [670, 26, 14, 58, -1], [740, 26, 12, 40, -1]];
        cr.forEach(([x, y, w, hh, u], i) => {
          const t = y - u * hh, p = y - u * (hh + w * 1.3);
          body[i % 3] += `M${x - w} ${y}L${x - w} ${t}L${x} ${p}L${x + w} ${t}L${x + w} ${y}Z`;
          face += `M${x - w} ${y}L${x - w} ${t}L${x} ${p}L${x - w * 0.2} ${t}L${x - w * 0.2} ${y}Z`;
        });
        let gems = '';
        const gc = ['#5fb7ff', '#ff5d8f', '#7ed957', '#ffcf3f', '#b28cff'];
        for (let k = 0; k < 10; k++) gems += `<g class="an-glow an-d${k % 4 + 1}">${gem(40 + k * 80, 13, 8, gc[k % 5])}</g>`;
        let h = bg('#e6deff') + `<path d="${lat}" stroke="#d4c8fa" stroke-width="2"/>` +
          '<g class="an-glow"><path d="M120 26 L220 26 L120 345 L40 345 Z M480 26 L560 26 L480 345 L420 345 Z" fill="#fff" opacity="0.5"/></g>' +
          body.map((d, i) => `<path d="${d}" fill="${cols[i]}" ${ln(2)}/>`).join('') + `<path d="${face}" fill="#fff" opacity="0.55"/>` +
          `<rect x="-5" y="-5" width="810" height="31" fill="#c9bff2" ${ln(2)}/>` + gems +
          `<g class="an-pulse"><path d="M400 74 L426 100 L400 140 L374 100 Z" fill="#9fe3ff" ${ln(2)}/><path d="M374 100 H426 M400 74 L390 100 L400 140 L410 100 Z" fill="none" ${ln(1.2)}/></g>`;
        for (const [x, y] of [[60, 60], [200, 120], [290, 240], [520, 60], [600, 190], [720, 90], [160, 280], [460, 230], [340, 150], [700, 260]]) h += sparkle(x, y, 9);
        return h;
      },
    },
  ]);
})();
