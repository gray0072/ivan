// Plants (bottom centre at the wall base; x -38..38, up to y -190).
// Cheap to elite; each entry is the catalog item (ITEMS) and its drawing (ROOM_ART), added by addItems.

(() => {
  const { r1, dot, star, sparkle, flip, gem } = ROOM_KIT;
  // A pot: body from y -h to 0 (top half-width w), rim on top.
  const pot = (w, h, fill, rim) => `<path d="M${-w} ${-h} L${w} ${-h} L${r1(w * 0.76)} 0 L${r1(-w * 0.76)} 0 Z" fill="${fill}" ${ln()}/>` +
    `<rect x="${-w - 4}" y="${-h - 8}" width="${2 * w + 8}" height="11" rx="3" fill="${rim}" ${ln()}/>`;
  // A leaf from (x, y) at angle a (radians), length l, half-width w.
  const leafD = (x, y, a, l, w) => {
    const c = Math.cos(a), s = Math.sin(a), mx = x + c * l / 2, my = y + s * l / 2;
    return `M${r1(x)} ${r1(y)}Q${r1(mx - s * w)} ${r1(my + c * w)} ${r1(x + c * l)} ${r1(y + s * l)}Q${r1(mx + s * w)} ${r1(my - c * w)} ${r1(x)} ${r1(y)}Z`;
  };
  // n dots of radius r on a ring of radius rr around (x, y).
  const ring = (x, y, rr, n, r, a0 = 0) => Array.from({ length: n }, (_, i) =>
    dot(x + Math.cos(a0 + i * 2 * Math.PI / n) * rr, y + Math.sin(a0 + i * 2 * Math.PI / n) * rr, r)).join('');
  // A bunch of dots as one outlined blob (foliage, clouds).
  const blob = (d, fill, w = 3) => `<path d="${d}" fill="${fill}" ${ln(w)}/><path d="${d}" fill="${fill}"/>`;
  const RAINBOW = ['#ff5d6c', '#ff9f43', '#ffd23f', '#7be07b', '#5ec8ff', '#8f7cff', '#d97bff', '#ff7fc0'];

  addItems('plant', ROOM_ART, [
    { id: 'sprouttin', name: 'Sprout in a tin can', price: 10,
      box: '-32 -72 64 78',
      draw: () => `<rect x="-15" y="-36" width="30" height="36" rx="2" fill="#c3cad6" ${ln()}/>` +
        '<path d="M-13.5 -24 H5 L1 -17 L4 -12 H-13.5 Z" fill="#f0dca0"/>' +
        '<path d="M-14 -29 H14 M-14 -6 H14 M8 -21 q3 2 0 5" fill="none" stroke="#9aa3b2" stroke-width="2"/>' +
        `<ellipse cx="0" cy="-36" rx="15" ry="3.5" fill="#7a5236" ${ln(2)}/>` +
        tube('M0 -37 Q-2 -48 1 -57', '#5fbf6a', 3) +
        `<path d="${leafD(1, -56, -2.7, 16, 6)}${leafD(1, -57, -0.4, 16, 6)}" fill="#7be07b" ${ln(2)}/>`,
    },
    { id: 'dandelionjar', name: 'Dandelion in a jar', price: 15,
      box: '-34 -104 68 110',
      draw: () => {
        const jar = 'M-13 -50 Q-19 -44 -19 -32 V-5 Q-19 0 -14 0 H14 Q19 0 19 -5 V-32 Q19 -44 13 -50 Z';
        return `<path d="${jar}" fill="#e3f6fd"/>` +
          '<path d="M-19 -26 H19 V-5 Q19 0 14 0 H-14 Q-19 0 -19 -5 Z" fill="#a9dcf2"/>' +
          tube('M-3 -6 Q-6 -50 -9 -80', '#5fbf6a', 3) + tube('M4 -6 Q9 -40 13 -62', '#5fbf6a', 3) +
          `<path d="${leafD(-4, -34, -2.3, 18, 5)}" fill="#7be07b" ${ln(1.5)}/>` +
          `<path d="${jar}" fill="none" ${ln()}/><rect x="-15" y="-54" width="30" height="6" rx="2" fill="#e3f6fd" ${ln(2)}/>` +
          `<path d="M-16 -46 Q0 -43 16 -46 M6 -45 q4 6 8 2 M6 -45 q-2 7 3 7" fill="none" stroke="#c9a26a" stroke-width="2.5" stroke-linecap="round"/>` +
          '<path d="M-14 -36 V-12" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.8"/>' +
          `<path d="${ring(-9, -84, 7.5, 10, 4.5)}" fill="#ffd23f" ${ln(1.5)}/><circle cx="-9" cy="-84" r="5" fill="#ffb321" ${ln(1.5)}/>` +
          `<circle cx="13" cy="-66" r="10" fill="#fff" ${ln(1.5)} stroke-dasharray="2 2.5"/><circle cx="13" cy="-66" r="2.5" fill="#d8c79a"/>` +
          `<g class="an-rise an-d2"><path d="M24 -78 V-72" stroke="${INK}" stroke-width="1"/><circle cx="24" cy="-80" r="3" fill="#fff" ${ln(1)}/></g>`;
      },
    },
    { id: 'daisypot', name: 'Potted daisy', price: 20,
      box: '-36 -114 72 120',
      draw: () => tube('M0 -34 Q-3 -64 0 -88', '#4aa356', 4) +
        `<path d="${leafD(-1, -50, -2.6, 20, 7)}${leafD(0, -62, -0.5, 18, 6)}" fill="#6fcf6a" ${ln(2)}/>` +
        `<path d="${ring(0, -92, 10, 9, 6)}" fill="#fff" ${ln(1.5)}/><circle cx="0" cy="-92" r="6.5" fill="#ffd23f" ${ln(1.5)}/>` +
        pot(17, 26, '#d9774a', '#e88b5c') + `<path d="M8 -23 l3 6 l4 -6 Z" fill="#b8613a"/>`,
    },
    { id: 'cactus', name: 'Cactus', price: 30,
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
    { id: 'sunflowerplant', name: 'Sunflower', price: 50,
      draw: () => `<g class="an-sway">` + tube('M0 -38 Q-4 -100 0 -136', '#4aa356', 5) +
        `<path d="${leafD(-2, -70, -2.7, 28, 9)}${leafD(-1, -96, -0.4, 26, 8)}" fill="#6fcf6a" ${ln(2)}/>` +
        `<path d="${ring(0, -150, 20, 14, 7)}" fill="#ffcf3f" ${ln(1.5)}/>` +
        `<circle cx="0" cy="-150" r="14" fill="#9a5f34" ${ln(2)}/>` +
        `<path d="${dot(-8, -158, 1.5)}${dot(8, -157, 1.5)}${dot(0, -161, 1.5)}${dot(-10, -146, 1.5)}${dot(10, -145, 1.5)}" fill="#6e4122"/>` +
        `<ellipse cx="-5" cy="-152" rx="2" ry="3" fill="${INK}"/><ellipse cx="5" cy="-152" rx="2" ry="3" fill="${INK}"/>` +
        '<circle cx="-9" cy="-146" r="2.5" fill="#ff8fb0" opacity="0.8"/><circle cx="9" cy="-146" r="2.5" fill="#ff8fb0" opacity="0.8"/>' +
        `<path d="M-5 -145 Q0 -141 5 -145" fill="none" ${ln(2)}/></g>` +
        pot(20, 30, '#b8c0cc', '#d0d6df') + '<path d="M-14 -22 V-6 M-6 -22 V-6 M2 -22 V-6 M10 -22 V-6" stroke="#9aa3b2" stroke-width="2"/>',
    },
    { id: 'flowerpot', name: 'Flower pot', price: 80,
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
    { id: 'lingonplant', name: 'Lingonberry bush', price: 100,
      box: '-46 -112 92 118',
      draw: () => {
        const berries = [[-14, -56], [10, -62], [-2, -78], [20, -50], [-24, -46], [2, -50]]
          .map(([x, y]) => dot(x, y, 3.5) + dot(x + 6, y + 2, 3.5) + dot(x + 2, y + 6, 3.5)).join('');
        return `<g class="lk-wag"><rect x="14" y="-106" width="20" height="13" fill="#2f6fd6"/>` +
          '<path d="M14 -101.2 H34 M20.5 -106 V-93" stroke="#ffd23f" stroke-width="3.5"/>' +
          `<rect x="14" y="-106" width="20" height="13" fill="none" ${ln(1.5)}/></g>` +
          `<path d="M14 -70 V-106" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/><path d="M14 -70 V-106" stroke="#c9a26a" stroke-width="2"/>` +
          blob(dot(-18, -48, 14) + dot(18, -48, 14) + dot(-8, -64, 16) + dot(10, -66, 15) + dot(0, -78, 12) + dot(-24, -60, 10) + dot(24, -62, 10), '#3f9a4f') +
          `<path d="${leafD(-20, -66, -2.4, 10, 3)}${leafD(4, -82, -1.2, 10, 3)}${leafD(16, -70, -0.6, 10, 3)}${leafD(-8, -52, -2, 9, 3)}" fill="#6fcf6a"/>` +
          `<path d="${berries}" fill="#e8333d" ${ln(1.2)}/>` +
          `<path d="${dot(-15, -57, 1)}${dot(9, -63, 1)}${dot(-3, -79, 1)}${dot(19, -51, 1)}${dot(-25, -47, 1)}${dot(1, -51, 1)}" fill="#fff"/>` +
          pot(22, 30, '#e3c08a', '#c99a5c') +
          '<path d="M-20 -22 H20 M-18 -11 H18 M-12 -30 V0 M0 -30 V0 M12 -30 V0" stroke="#b08048" stroke-width="2"/>';
      },
    },
    { id: 'pumpkinplant', name: 'Pumpkin vine', price: 120,
      box: '-48 -168 96 174',
      draw: () => {
        const lobe = (x, y) => dot(x, y, 9) + dot(x + 8, y - 8, 8) + dot(x - 5, y - 10, 8);
        return tube('M4 -70 Q26 -96 6 -116 Q-14 -134 4 -152', '#4aa356', 4) +
          `<path d="M8 -118 q10 -4 8 -12 q-3 -5 -7 0 M-6 -132 q-10 -2 -10 -10 q1 -5 6 -2" fill="none" stroke="#4aa356" stroke-width="2"/>` +
          blob(lobe(20, -98), '#5fbf6a', 2) + blob(lobe(-12, -126), '#5fbf6a', 2) +
          `<path d="${ring(4, -158, 5, 5, 4)}" fill="#ffcf3f" ${ln(1.5)}/><circle cx="4" cy="-158" r="2.5" fill="#ff9f43"/>` +
          pot(22, 26, '#6b4a3a', '#7f5a46') +
          `<path d="${leafD(-6, -36, -2.9, 26, 7)}${leafD(6, -36, -0.2, 26, 7)}" fill="#5fbf6a" ${ln(2)}/>` +
          `<ellipse cx="-12" cy="-54" rx="13" ry="18" fill="#ff8a2b" ${ln(2.5)}/><ellipse cx="12" cy="-54" rx="13" ry="18" fill="#ff8a2b" ${ln(2.5)}/>` +
          `<ellipse cx="0" cy="-54" rx="12" ry="19" fill="#ff9f43" ${ln(2.5)}/>` +
          `<rect x="-3" y="-80" width="6" height="9" rx="2" fill="#6b8e3a" ${ln(2)}/>` +
          `<path d="M-13 -58 L-5 -58 L-9 -65 Z M5 -58 L13 -58 L9 -65 Z M-13 -50 Q0 -38 13 -50 L9 -48 L6 -52 L3 -48 L0 -52 L-3 -48 L-6 -52 L-9 -48 Z" fill="#7a3a10" ${ln(1.5)}/>` +
          `<path class="an-glow" d="M-13 -58 L-5 -58 L-9 -65 Z M5 -58 L13 -58 L9 -65 Z M-13 -50 Q0 -38 13 -50 L9 -48 L6 -52 L3 -48 L0 -52 L-3 -48 L-6 -52 L-9 -48 Z" fill="#ffe066"/>`;
      },
    },
    { id: 'birchplant', name: 'Midsummer birch', price: 150,
      draw: () => {
        const cols = ['#ff5d6c', '#fff', '#ffd23f', '#b892ff'];
        let wreath = '';
        for (let i = 0; i < 8; i++) wreath += `<path d="${ring(-21 + i * 6, -38, 2.6, 5, 2)}" fill="${cols[i % 4]}" ${ln(1)}/>`;
        return tube('M0 -38 Q-4 -100 2 -150', '#f4f1ea', 8) + tube('M-1 -110 L-22 -126', '#f4f1ea', 4) + tube('M1 -124 L20 -142', '#f4f1ea', 4) +
          `<path d="M-4 -60 h4 M1 -78 h4 M-3 -98 h3 M0 -116 h4 M-12 -118 h3" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>` +
          flip('an-sway', tube('M-24 -124 q-4 14 2 26 q4 10 -2 22', '#2f6fd6', 3) + tube('M-18 -122 q4 14 -2 24 q-4 10 2 20', '#ffd23f', 3) +
            tube('M18 -130 q-4 14 2 26 q4 10 -2 20', '#ffd23f', 3) + tube('M25 -128 q4 14 -2 24 q-4 10 2 18', '#2f6fd6', 3)) +
          blob(dot(-20, -140, 14) + dot(18, -152, 15) + dot(0, -168, 16) + dot(-12, -158, 13) + dot(24, -134, 11) + dot(-28, -124, 10) + dot(2, -146, 12), '#8ed46a') +
          `<path d="${leafD(-18, -150, -2.2, 9, 3)}${leafD(10, -166, -1.4, 9, 3)}${leafD(22, -142, -0.5, 9, 3)}${leafD(-4, -138, -1.8, 9, 3)}" fill="#b5ea8a"/>` +
          pot(22, 30, '#c98b52', '#b07a44') + '<path d="M-20.5 -22 H20.5 M-18 -8 H18" stroke="#8a5a34" stroke-width="2.5"/>' +
          `<path d="${leafD(-24, -38, 3, 8, 3)}${leafD(24, -38, 0.1, 8, 3)}" fill="#6fcf6a" ${ln(1)}/>` + wreath;
      },
    },
    { id: 'bonsai', name: 'Bonsai', price: 200,
      box: '-52 -136 104 142',
      draw: () => {
        const pad = (x, y, w) => dot(x - w * 0.55, y, 9) + dot(x, y - 5, 11) + dot(x + w * 0.55, y, 9) + `M${x - w * 0.55} ${y + 9}H${x + w * 0.55}V${y}H${x - w * 0.55}Z`;
        return tube('M-6 -26 Q-14 -50 4 -64 Q20 -76 2 -92 Q-8 -100 -2 -112', '#8a5a34', 9) +
          tube('M4 -66 Q18 -70 26 -80', '#8a5a34', 5) + tube('M0 -94 Q-16 -96 -24 -104', '#8a5a34', 5) +
          blob(pad(28, -88, 16), '#4f9a4f') + blob(pad(-26, -110, 16), '#4f9a4f') + blob(pad(0, -122, 18), '#4f9a4f') +
          `<path d="${dot(22, -92, 4)}${dot(32, -90, 3)}${dot(-30, -114, 4)}${dot(-20, -112, 3)}${dot(-4, -128, 4)}${dot(8, -126, 3)}" fill="#6fbf5f"/>` +
          `<path d="M-36 -20 H36 L30 0 H-30 Z" fill="#3f6fb5" ${ln()}/><rect x="-40" y="-27" width="80" height="9" rx="3" fill="#5a8ad0" ${ln()}/>` +
          `<path d="${dot(-14, -28, 5)}${dot(-4, -29, 4)}${dot(20, -28, 4)}" fill="#7bc46a" ${ln(1.5)}/>` +
          `<ellipse cx="26" cy="-30" rx="6" ry="4" fill="#b8c0cc" ${ln(1.5)}/>` +
          '<path d="M-22 -10 H22" stroke="#2f5a99" stroke-width="2"/>';
      },
    },
    { id: 'poinsettiaplant', name: 'Poinsettia', price: 250,
      box: '-50 -120 100 126',
      draw: () => {
        let g = '', r = '', r2 = '';
        for (let i = 0; i < 5; i++) g += leafD(0, -74, -Math.PI / 2 + 0.6 + i * 1.26, 34, 9);
        for (let i = 0; i < 7; i++) r += leafD(0, -76, -Math.PI / 2 + i * 0.898, 32, 9);
        for (let i = 0; i < 6; i++) r2 += leafD(0, -76, -Math.PI / 2 + 0.45 + i * 1.047, 19, 6);
        return `<path d="${g}" fill="#3f9a4f" ${ln(2)}/><path d="${r}" fill="#e8333d" ${ln(2)}/><path d="${r2}" fill="#ff5d6c" ${ln(1.5)}/>` +
          `<path d="${dot(-3, -77, 2.5)}${dot(3, -78, 2.5)}${dot(0, -73, 2.5)}${dot(-1, -81, 2)}" fill="#ffd23f" ${ln(1)}/>` +
          `<path d="M-24 -40 L-18 -46 L-12 -40 L-6 -46 L0 -40 L6 -46 L12 -40 L18 -46 L24 -40 L18 0 H-18 Z" fill="#e6c35a" ${ln()}/>` +
          '<path d="M-14 -36 L-12 -6 M6 -38 L5 -4 M16 -30 L12 -12" stroke="#c9a23a" stroke-width="2"/>' +
          `<path d="M-2 -26 L-8 -10 M2 -26 L8 -10" ${ln(4)}/><path d="M-2 -26 L-8 -10 M2 -26 L8 -10" stroke="#e8333d" stroke-width="2.5"/>` +
          `<path d="M0 -28 Q-14 -38 -16 -26 Q-14 -16 0 -28 Z M0 -28 Q14 -38 16 -26 Q14 -16 0 -28 Z" fill="#e8333d" ${ln(2)}/><circle cx="0" cy="-28" r="3.5" fill="#c41f2c" ${ln(1.5)}/>` +
          sparkle(-32, -100, 6) + sparkle(30, -48, 5);
      },
    },
    { id: 'palm', name: 'Palm tree', price: 300,
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
    { id: 'flytrap', name: 'Venus flytrap', price: 400,
      draw: () => {
        // A trap with its hinge at (0, 0), opening to the right; the top jaw open by `open` degrees (or snapping).
        const teeth = s => Array.from({ length: 5 }, (_, i) => `M${4 + i * 5} 0 l1.2 ${s * 5} l1.2 ${-s * 5}`).join('');
        const trap = (snap, eyes) => `<path d="M0 0 Q14 18 28 0 Z" fill="#7be07b" ${ln(2)}/><path d="M3 0 Q14 12 25 0 Z" fill="#ff6f8f"/>` +
          `<path d="${teeth(-1)}" fill="#fff" ${ln(1.2)}/>` +
          `<g transform="rotate(-35)">${snap ? '<animateTransform attributeName="transform" type="rotate" values="-35;-35;0;0;-35" keyTimes="0;0.6;0.66;0.8;1" dur="3.5s" repeatCount="indefinite"/>' : ''}` +
          `<path d="M0 0 Q14 -18 28 0 Z" fill="#7be07b" ${ln(2)}/><path d="M3 0 Q14 -12 25 0 Z" fill="#ff6f8f"/><path d="${teeth(1)}" fill="#fff" ${ln(1.2)}/>` +
          (eyes ? `<circle cx="10" cy="-12" r="4" fill="#fff" ${ln(1.5)}/><circle cx="18" cy="-12" r="4" fill="#fff" ${ln(1.5)}/>` +
            `<circle cx="11" cy="-11" r="1.8" fill="${INK}"/><circle cx="19" cy="-11" r="1.8" fill="${INK}"/>` : '') + '</g>';
        return tube('M-8 -38 Q-16 -70 -18 -96', '#5fbf6a', 4) + tube('M8 -38 Q20 -66 22 -84', '#5fbf6a', 4) + tube('M0 -38 Q2 -90 0 -128', '#5fbf6a', 5) +
          `<path d="${leafD(-4, -40, -2.7, 24, 6)}${leafD(4, -40, -0.4, 24, 6)}" fill="#5fbf6a" ${ln(2)}/>` +
          `<g transform="translate(-5.4 -104.1) scale(-0.9 0.9)"><g class="an-wiggle">${trap(false, false)}</g></g>` +
          `<g transform="translate(9.4 -92.1) scale(0.9)"><g class="an-wiggle an-d2">${trap(false, false)}</g></g>` +
          `<g transform="translate(-19.6 -140.6) scale(1.4)">${trap(true, true)}</g>` +
          `<g class="an-float"><ellipse cx="27" cy="-170" rx="3.5" ry="3" fill="${INK}"/>` +
          `<ellipse cx="24" cy="-175" rx="3.5" ry="2.2" fill="#fff" ${ln(1)}/><ellipse cx="30" cy="-175" rx="3.5" ry="2.2" fill="#fff" ${ln(1)}/></g>` +
          pot(22, 30, '#8f5ad8', '#a77ae6') + `<path d="${dot(-10, -16, 3)}${dot(8, -10, 3)}${dot(2, -22, 2.5)}" fill="#c3a6ff"/>`;
      },
    },
    { id: 'spookytreeplant', name: 'Spooky tree', price: 500,
      draw: () => {
        const bark = '#6a4a8a';
        const bat = `<path d="M22 -136 V-130" ${ln(1.5)}/><path d="M16 -128 Q8 -118 16 -110 Z M28 -128 Q36 -118 28 -110 Z" fill="#4a4466" ${ln(1.5)}/>` +
          `<ellipse cx="22" cy="-120" rx="7" ry="9" fill="#5c5480" ${ln(2)}/><path d="M17 -114 l-2 7 l5 -3 Z M27 -114 l2 7 l-5 -3 Z" fill="#5c5480" ${ln(1.5)}/>` +
          `<circle cx="19.5" cy="-117" r="2.2" fill="#fff"/><circle cx="24.5" cy="-117" r="2.2" fill="#fff"/><circle cx="19.5" cy="-116.5" r="1.1" fill="${INK}"/><circle cx="24.5" cy="-116.5" r="1.1" fill="${INK}"/>` +
          `<path d="M20 -123 Q22 -126 24 -123" fill="none" ${ln(1.2)}/>`;
        const lantern = `<path d="M-24 -132 V-120" ${ln(1.5)}/><circle cx="-24" cy="-112" r="8" fill="#ff8a2b" ${ln(2)}/><rect x="-26" y="-122" width="4" height="4" fill="#6b8e3a" ${ln(1)}/>` +
          `<path class="an-glow" d="M-28 -114 l2 -3 l2 3 Z M-22 -114 l2 -3 l2 3 Z M-28 -109 Q-24 -105 -20 -109 Z" fill="#ffe066"/>`;
        return `<path d="M30 -186 A14 14 0 1 0 30 -158 A18 18 0 0 1 30 -186 Z" fill="#fff3b0" ${ln(2)}/>` + tube('M0 -40 Q-8 -80 0 -110', bark, 11) +
          tube('M-1 -94 Q-20 -102 -26 -124 Q-28 -132 -22 -134', bark, 6) + tube('M1 -102 Q18 -112 24 -134 Q26 -142 20 -144', bark, 6) +
          tube('M0 -110 Q4 -140 -4 -160 q-4 -8 2 -10', bark, 6) + tube('M-14 -104 L-30 -100', bark, 3) + tube('M2 -146 L14 -158', bark, 3) +
          `<ellipse cx="-4" cy="-78" rx="3" ry="4" fill="${INK}"/><ellipse cx="5" cy="-78" rx="3" ry="4" fill="${INK}"/>` +
          `<path d="M-4 -70 Q1 -66 6 -70" fill="none" ${ln(2)}/>` +
          flip('an-sway', `<g transform="translate(22 -136) scale(1.35) translate(-22 136)">${bat}</g>`) + flip('an-sway', lantern) +
          `<circle class="an-glow" cx="-30" cy="-150" r="2.5" fill="#d8ff6a"/><circle class="an-glow an-d3" cx="32" cy="-92" r="2.5" fill="#d8ff6a"/>` +
          `<path d="M-26 -38 Q-30 -8 -16 0 H16 Q30 -8 26 -38 Z" fill="#3b3550" ${ln()}/>` +
          `<ellipse cx="0" cy="-38" rx="28" ry="6" fill="#4a4466" ${ln()}/><ellipse cx="0" cy="-38" rx="22" ry="3" fill="#7be07b"/>` +
          `<circle class="an-rise" cx="-10" cy="-44" r="3" fill="#a8f08a" ${ln(1)}/><circle class="an-rise an-d3" cx="10" cy="-44" r="2.5" fill="#a8f08a" ${ln(1)}/>` +
          '<path d="M-18 -26 Q-16 -12 -10 -6" fill="none" stroke="#6a6290" stroke-width="3" stroke-linecap="round"/>';
      },
    },
    { id: 'christmastreeplant', name: 'Christmas tree', price: 600,
      draw: () => {
        const tier = (yb, w, h) => {
          let d = `M0 ${yb - h}L${w} ${yb}`;
          for (let i = 0; i < 4; i++) d += `Q${r1(w - (i + 0.5) * w / 2)} ${yb + 6} ${r1(w - (i + 1) * w / 2)} ${yb}`;
          return `<path d="${d}Z" fill="#2f9a4f" ${ln()}/>`;
        };
        const flags = pts => pts.map(([x, y]) => `<rect x="${x}" y="${y}" width="7" height="5" fill="#2f6fd6" ${ln(0.8)}/>` +
          `<path d="M${x + 2.4} ${y}V${y + 5}M${x} ${y + 2.5}H${x + 7}" stroke="#ffd23f" stroke-width="1.4"/>`).join('');
        const lights = [[-20, -48, '#ff5d6c'], [12, -46, '#ffd23f'], [-4, -64, '#5ec8ff'], [22, -60, '#ff7fc0'], [-16, -86, '#ffd23f'],
          [14, -88, '#ff5d6c'], [0, -104, '#ff7fc0'], [-8, -124, '#5ec8ff'], [10, -128, '#ffd23f'], [-26, -40, '#5ec8ff']];
        const st = star(0, -164, 14, 0.42);
        return `<rect x="-5" y="-44" width="10" height="12" fill="#8a5a34" ${ln(2)}/>` +
          tier(-40, 36, 50) + tier(-76, 29, 46) + tier(-112, 22, 46) +
          '<path d="M-28 -56 Q0 -44 26 -60 M-22 -94 Q0 -82 20 -96" fill="none" stroke="#fff3b0" stroke-width="1.5"/>' +
          flags([[-25, -55], [-12, -50], [2, -50], [15, -55], [-19, -92], [-6, -88], [8, -90]]) +
          `<path d="${dot(-12, -70, 3.5)}${dot(18, -76, 3.5)}${dot(4, -118, 3.5)}" fill="#e8333d" ${ln(1.5)}/>` +
          lights.map(([x, y, c], i) => `<circle class="an-blink an-d${(i % 4) + 1}" cx="${x}" cy="${y}" r="3" fill="${c}" ${ln(1)}/>`).join('') +
          `<path d="${st}" fill="none" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/><path d="${st}" fill="none" stroke="#f0cf7a" stroke-width="3.5" stroke-linejoin="round"/>` +
          `<path d="M0 -164 L0 -178 M0 -164 L13.3 -168.3 M0 -164 L-13.3 -168.3 M0 -164 L8.2 -152.7 M0 -164 L-8.2 -152.7" stroke="#e0b65a" stroke-width="1.5"/>` +
          `<circle cx="0" cy="-164" r="2.5" fill="#e8333d"/>` +
          pot(18, 24, '#e8333d', '#ff5d6c') + '<path d="M-16 -12 H16" stroke="#ffcf3f" stroke-width="4"/>' +
          `<path d="${dot(-8, -12, 1.5)}${dot(0, -12, 1.5)}${dot(8, -12, 1.5)}" fill="#fff"/>`;
      },
    },
    { id: 'cherryplant', name: 'Cherry blossom', price: 800,
      draw: () => {
        const bark = '#7a4a3a';
        const petals = [[-30, -96, 1], [28, -90, 2], [-12, -84, 3], [12, -102, 4], [34, -70, 1], [-34, -64, 3]];
        return tube('M0 -38 Q-6 -70 2 -96 Q8 -112 0 -124', bark, 8) + tube('M1 -94 Q20 -100 28 -118', bark, 5) + tube('M-2 -102 Q-20 -108 -26 -128', bark, 5) +
          blob(dot(-24, -134, 16) + dot(24, -128, 16) + dot(0, -150, 20) + dot(-14, -164, 14) + dot(16, -162, 14) + dot(0, -126, 14), '#ffb7cf') +
          [[-24, -140], [20, -134], [0, -158], [-12, -124], [14, -152], [30, -122], [-30, -128]]
            .map(([x, y]) => `<path d="${ring(x, y, 3, 5, 2.4)}" fill="#fff"/><circle cx="${x}" cy="${y}" r="1.6" fill="#ff6f9a"/>`).join('') +
          petals.map(([x, y, d]) => `<g class="an-fall an-d${d}"><ellipse cx="${x}" cy="${y}" rx="3.5" ry="2.2" fill="#ffb7cf" ${ln(1)}/></g>`).join('') +
          pot(22, 30, '#f4f6fb', '#ffcf3f') +
          '<path d="M-16 -18 q4 -6 8 0 t8 0 t8 0 t8 0" fill="none" stroke="#3f6fb5" stroke-width="2"/>' +
          `<path d="${dot(-10, -8, 2)}${dot(0, -6, 2)}${dot(10, -8, 2)}" fill="#3f6fb5"/>`;
      },
    },
    { id: 'glowmushroomplant', name: 'Glowing mushrooms', price: 1000,
      draw: () => {
        const mush = (x, yb, h, r, cap) => {
          const yc = yb - h;
          return `<path d="M${r1(x - r * 0.32)} ${yb} Q${r1(x - r * 0.4)} ${r1(yc + h / 2)} ${r1(x - r * 0.26)} ${yc} H${r1(x + r * 0.26)} Q${r1(x + r * 0.4)} ${r1(yc + h / 2)} ${r1(x + r * 0.32)} ${yb} Z" fill="#f4efe0" ${ln(2)}/>` +
            `<path d="M${x - r} ${yc} A${r} ${r1(r * 0.85)} 0 0 1 ${x + r} ${yc} Q${x} ${r1(yc + r * 0.35)} ${x - r} ${yc} Z" fill="${cap}" ${ln(2)}/>` +
            `<path d="${dot(x - r * 0.45, yc - r * 0.35, r * 0.14)}${dot(x + r * 0.3, yc - r * 0.55, r * 0.12)}${dot(x + r * 0.6, yc - r * 0.15, r * 0.1)}" fill="#fff"/>`;
        };
        const halo = (x, y, r, c, d) => `<circle class="an-glow${d}" cx="${x}" cy="${y}" r="${r}" fill="${c}" fill-opacity="0.3"/>`;
        return halo(4, -122, 34, '#5ee0e0', '') + halo(-20, -84, 20, '#b892ff', ' an-d2') + halo(24, -72, 15, '#ff7fc0', ' an-d4') +
          mush(4, -44, 70, 24, '#5ee0e0') + mush(-20, -44, 36, 14, '#b892ff') + mush(24, -44, 24, 10, '#ff7fc0') + mush(-4, -44, 13, 7, '#7be0c8') +
          `<ellipse cx="0" cy="-74" rx="2" ry="3" fill="${INK}"/><ellipse cx="9" cy="-74" rx="2" ry="3" fill="${INK}"/><path d="M1 -67 Q4.5 -64 8 -67" fill="none" ${ln(1.5)}/>` +
          `<path d="M-28 -44 Q-30 -20 -32 0 H32 Q30 -20 28 -44 Z" fill="#a0703f" ${ln()}/>` +
          '<path d="M-20 -32 Q-22 -16 -22 -4 M-6 -34 V-6 M10 -30 Q11 -16 12 -4 M22 -32 Q24 -18 24 -8" fill="none" stroke="#7a5230" stroke-width="2"/>' +
          `<ellipse cx="0" cy="-44" rx="28" ry="6" fill="#d9b27a" ${ln(2)}/>` +
          blob(dot(-24, -44, 6) + dot(-16, -46, 5) + dot(26, -44, 5) + dot(18, -46, 4) + dot(-30, -30, 4), '#6fbf5f', 1.5) +
          `<circle class="an-rise" cx="-26" cy="-70" r="2" fill="#bff6ff"/><circle class="an-rise an-d2" cx="28" cy="-96" r="2" fill="#ffd6f0"/>` +
          `<circle class="an-rise an-d4" cx="-10" cy="-150" r="2" fill="#bff6ff"/>` +
          sparkle(-32, -122, 5) + sparkle(32, -140, 6);
      },
    },
    { id: 'rainbowplant', name: 'Dancing rainbow flower', gems: 10,
      draw: () => {
        const petals = RAINBOW.map((c, i) => {
          const a = i * Math.PI / 4, vals = RAINBOW.slice(i).concat(RAINBOW.slice(0, i + 1)).join(';');
          return `<circle cx="${r1(Math.cos(a) * 21)}" cy="${r1(-142 + Math.sin(a) * 21)}" r="11" fill="${c}" ${ln(2)}>` +
            `<animate attributeName="fill" values="${vals}" dur="8s" repeatCount="indefinite"/></circle>`;
        }).join('');
        return `<g class="an-sway">` + tube('M0 -38 Q-6 -90 0 -126', '#4aa356', 5) +
          `<g class="an-wiggle"><path d="${leafD(-2, -76, -2.7, 26, 8)}" fill="#6fcf6a" ${ln(2)}/></g>` +
          `<g class="an-wiggle an-d2"><path d="${leafD(-1, -96, -0.4, 24, 8)}" fill="#6fcf6a" ${ln(2)}/></g>` +
          petals + `<circle cx="0" cy="-142" r="14" fill="#fff3b0" ${ln(2)}/>` +
          `<path d="M-8 -145 Q-5 -149 -2 -145 M2 -145 Q5 -149 8 -145" fill="none" ${ln(2)}/>` +
          '<circle cx="-9" cy="-139" r="2.5" fill="#ff8fb0" opacity="0.8"/><circle cx="9" cy="-139" r="2.5" fill="#ff8fb0" opacity="0.8"/>' +
          `<path d="M-5 -138 Q0 -132 5 -138 Z" fill="#ff6f8f" ${ln(1.5)}/></g>` +
          pot(20, 30, '#ffcf3f', '#e6a823') + gem(0, -16, 7, '#5ec8ff') + gem(-12, -18, 4, '#ff4f7b') + gem(12, -18, 4, '#7be07b') +
          sparkle(-32, -170, 7) + sparkle(32, -110, 6) + sparkle(-30, -84, 5);
      },
    },
    { id: 'goldtree', name: 'Golden tree', gems: 20,
      draw: () => tube('M0 -40 V-110 M0 -84 L-16 -104 M0 -92 L14 -114', '#e0a21b', 7) +
        `<path d="${dot(-20, -124, 20)}${dot(20, -128, 20)}${dot(0, -156, 24)}${dot(-24, -152, 15)}${dot(24, -156, 15)}${dot(0, -120, 18)}" fill="#ffcf3f" ${ln()}/>` +
        `<path d="${dot(-20, -124, 20)}${dot(20, -128, 20)}${dot(0, -156, 24)}${dot(-24, -152, 15)}${dot(24, -156, 15)}${dot(0, -120, 18)}" fill="#ffcf3f"/>` +
        '<path d="M-14 -168 Q-6 -176 4 -172" fill="none" stroke="#fff3b0" stroke-width="4" stroke-linecap="round"/>' +
        gem(-18, -130, 6, '#ff4f7b') + gem(16, -138, 6, '#5ec8ff') + gem(0, -160, 6, '#7be07b') + gem(-6, -114, 5, '#b892ff') + gem(24, -116, 5, '#ff4f7b') +
        `<path d="M-24 -40 L24 -40 L18 0 L-18 0 Z" fill="#ffcf3f" ${ln()}/><rect x="-28" y="-48" width="56" height="11" rx="3" fill="#e6a823" ${ln()}/>` +
        gem(0, -20, 7, '#ff4f7b') +
        sparkle(-30, -176, 8) + sparkle(30, -100, 7) + sparkle(-32, -96, 6) + sparkle(28, -178, 6),
    },
    { id: 'crystalplant', name: 'Crystal tree', gems: 30,
      draw: () => {
        const crys = (x, y, w, h, c) => `<path d="M${x} ${y - h}L${x + w} ${r1(y - h * 0.7)}L${x + w} ${y}L${x} ${r1(y + w * 0.5)}L${x - w} ${y}L${x - w} ${r1(y - h * 0.7)}Z" fill="${c}" ${ln(2)}/>` +
          `<path class="an-glow" d="M${x} ${y - h + 3}V${r1(y + w * 0.5 - 2)}M${r1(x - w * 0.5)} ${r1(y - h * 0.6)}V${y - 2}" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>`;
        const halo = (x, y, r, c, d) => `<circle class="an-glow${d}" cx="${x}" cy="${y}" r="${r}" fill="${c}" fill-opacity="0.28"/>`;
        return halo(0, -130, 40, '#b892ff', '') + halo(-20, -104, 18, '#ff8fc8', ' an-d2') + halo(20, -114, 18, '#5ec8ff', ' an-d4') +
          tube('M0 -42 V-112 M0 -72 L-20 -92 M0 -86 L18 -104 M0 -104 L-12 -122 M0 -108 L13 -130', '#d8dde8', 6) +
          crys(-21, -96, 7, 26, '#ff8fc8') + crys(19, -106, 7, 28, '#5ec8ff') + crys(-13, -122, 6, 24, '#7be0c8') + crys(14, -132, 6, 24, '#ffd23f') +
          crys(0, -116, 10, 48, '#b892ff') +
          `<g class="an-float">${gem(-32, -150, 6, '#5ec8ff')}</g><g class="an-float an-d3">${gem(32, -160, 6, '#ff8fc8')}</g>` +
          `<path d="M-26 -42 H26 L20 -20 L12 0 H-12 L-20 -20 Z" fill="#bfe9ff" ${ln()}/>` +
          '<path d="M-20 -20 H20 M-14 -42 L-8 -20 L-4 0 M14 -42 L8 -20 L4 0 M0 -42 L-8 -20 M0 -42 L8 -20" fill="none" stroke="#8fd3f5" stroke-width="1.8"/>' +
          `<rect x="-30" y="-50" width="60" height="10" rx="3" fill="#ffcf3f" ${ln()}/>` + gem(0, -45, 4, '#ff4f7b') +
          sparkle(-30, -176, 8) + sparkle(30, -84, 6) + sparkle(-34, -70, 5) + sparkle(26, -182, 6);
      },
    },
    { id: 'beanstalk', name: 'Magic beanstalk', gems: 40,
      draw: () => {
        const leaves = [[-14, -64, -2.6], [16, -96, -0.4], [-14, -128, -2.8], [14, -148, -0.3], [-6, -86, -2.9]]
          .map(([x, y, a]) => leafD(x, y, a, 22, 9)).join('');
        const cl = dot(-22, -168, 9) + dot(-8, -176, 12) + dot(10, -174, 11) + dot(24, -167, 9) + 'M-22 -159H24V-168H-22Z';
        return `<g class="an-sway">` + tube('M-4 -38 C-30 -70 30 -90 0 -120 C-26 -140 20 -156 4 -170', '#4fbf5f', 7) +
          tube('M4 -38 C30 -70 -30 -90 0 -120 C24 -138 -16 -152 -2 -168', '#7be07b', 4) +
          `<path d="${leaves}" fill="#5fcf6a" ${ln(2)}/>` +
          `<path d="${dot(-18, -104, 3.5)}${dot(18, -132, 3.5)}${dot(16, -70, 3.5)}" fill="#ffcf3f" ${ln(1.5)}/></g>` +
          `<g class="an-float">${blob(cl, '#fff')}` +
          `<path d="M-8 -180 V-190 H-4 V-186 H0 V-192 H4 V-186 H8 V-190 H12 V-180 Z" fill="#ffcf3f" ${ln(1.5)}/>` +
          `<path d="M2 -183 v-3 a2 2 0 0 1 4 0 v3 Z" fill="#b07a20"/>` +
          `<path d="M2 -192 V-198 L8 -196 L2 -194" fill="#ff7fc0" ${ln(1)}/>` +
          `${blob(dot(-14, -164, 6) + dot(-4, -166, 7) + dot(8, -164, 6), '#fff', 2)}</g>` +
          pot(20, 30, '#ffcf3f', '#e6a823') + gem(0, -16, 7, '#7be07b') + gem(-12, -18, 4, '#5ec8ff') + gem(12, -18, 4, '#ff4f7b') +
          sparkle(-32, -140, 7) + sparkle(32, -110, 6) + sparkle(-30, -80, 5) + sparkle(34, -150, 5);
      },
    },
  ]);
})();
