// Pets (bottom centre on the floor in front; x -37..37).
// Cheap to elite; each entry is the catalog item (ITEMS) and its drawing (ROOM_ART), added by addItems.

(() => {
  const { r1, dot, star, sparkle, flame, crown, gem } = ROOM_KIT;
  const shadow = rx => `<ellipse cx="0" cy="0" rx="${rx}" ry="4" fill="#000" opacity="0.15"/>`;
  // A leaf from (x, y) at angle a (radians), length l, half-width w.
  const leafD = (x, y, a, l, w) => {
    const c = Math.cos(a), s = Math.sin(a), mx = x + c * l / 2, my = y + s * l / 2;
    return `M${r1(x)} ${r1(y)}Q${r1(mx - s * w)} ${r1(my + c * w)} ${r1(x + c * l)} ${r1(y + s * l)}Q${r1(mx + s * w)} ${r1(my - c * w)} ${r1(x)} ${r1(y)}Z`;
  };
  const ring = (x, y, rr, n, r) => Array.from({ length: n }, (_, i) =>
    dot(x + Math.cos(i * 2 * Math.PI / n) * rr, y + Math.sin(i * 2 * Math.PI / n) * rr, r)).join('');
  const blob = (d, fill, w = 3) => `<path d="${d}" fill="${fill}" ${ln(w)}/><path d="${d}" fill="${fill}"/>`;
  // Two blinking eyes (the characters' own blink).
  const eyes = (x1, x2, y, r = 2.5) => `<g class="lk-eyes"><circle cx="${x1}" cy="${y}" r="${r}" fill="${INK}"/><circle cx="${x2}" cy="${y}" r="${r}" fill="${INK}"/>` +
    `<circle cx="${r1(x1 + r * 0.35)}" cy="${r1(y - r * 0.35)}" r="${r1(r * 0.35)}" fill="#fff"/><circle cx="${r1(x2 + r * 0.35)}" cy="${r1(y - r * 0.35)}" r="${r1(r * 0.35)}" fill="#fff"/></g>`;
  const cheeks = (x1, x2, y, r = 2.5) => `<circle cx="${x1}" cy="${y}" r="${r}" fill="#ff8fb0" opacity="0.7"/><circle cx="${x2}" cy="${y}" r="${r}" fill="#ff8fb0" opacity="0.7"/>`;
  // A four-legged foal facing left (moose, reindeer, unicorn): legs, tail, neck and body; the head nods around the neck.
  const foal = (fill, hoof, tail) => ['M-12 -40 L-15 -5', 'M-2 -40 L-1 -5', 'M15 -40 L14 -5', 'M25 -40 L28 -5'].map(d => tube(d, fill, 4)).join('') +
    `<path d="${[-15, -1, 14, 28].map(x => `M${x - 4} -6h8v6h-8Z`).join('')}" fill="${hoof}" ${ln(1.5)}/>` + tail +
    `<path d="M-19 -56 L-24 -84 L-9 -88 L0 -60 Z" fill="${fill}" ${ln(2.5)}/>` +
    `<ellipse cx="6" cy="-49" rx="24" ry="15" fill="${fill}" ${ln()}/>`;
  const nod = s => `<g>${s}<animateTransform attributeName="transform" type="rotate" values="0 -10 -64;-6 -10 -64;0 -10 -64;0 -10 -64" keyTimes="0;0.3;0.6;1" dur="4s" repeatCount="indefinite"/></g>`;

  addItems('pet', ROOM_ART, [
    { id: 'snailjar', name: 'Snail in a jar', price: 15,
      box: '-34 -74 68 80',
      draw: () => shadow(22) +
        '<path d="M-19 -12 H19 V-6 Q19 -1 14 -1 H-14 Q-19 -1 -19 -6 Z" fill="#9a6a44"/>' +
        `<path d="${leafD(-16, -12, -0.9, 22, 6)}" fill="#6fcf6a" ${ln(1.5)}/>` +
        `<path d="M-14 -12 Q-15 -17 -6 -17 L8 -17 Q10 -27 15 -27 Q19 -27 18 -19 Q17 -12 10 -12 Z" fill="#f2d58a" ${ln(2)}/>` +
        `<g class="an-wiggle"><path d="M13 -26 L11 -34 M17 -26 L19 -33" ${ln(1.5)}/><circle cx="11" cy="-35" r="2" fill="${INK}"/><circle cx="19" cy="-34" r="2" fill="${INK}"/></g>` +
        `<path d="M14 -21 q2 2 4 0" fill="none" ${ln(1.2)}/>` +
        `<circle cx="-3" cy="-26" r="10" fill="#e09a4a" ${ln(2)}/><path d="M-3 -26 m-1 0 a2 2 0 1 1 3 2 a5 5 0 1 1 -7 -6" fill="none" stroke="#b06a2a" stroke-width="2" stroke-linecap="round"/>` +
        `<rect x="-20" y="-56" width="40" height="56" rx="9" fill="#e3f6fd" fill-opacity="0.4" ${ln()}/>` +
        '<path d="M-14 -46 V-22" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.8"/>' +
        `<rect x="-18" y="-63" width="36" height="9" rx="2" fill="#b8c0cc" ${ln(2)}/>` +
        `<path d="${dot(-9, -58.5, 1.2)}${dot(-3, -58.5, 1.2)}${dot(3, -58.5, 1.2)}${dot(9, -58.5, 1.2)}" fill="${INK}"/>`,
    },
    { id: 'ladybugpet', name: 'Ladybug on a leaf', price: 20,
      box: '-40 -50 80 56',
      draw: () => shadow(32) +
        `<path d="${leafD(-36, -4, -0.06, 72, 13)}" fill="#6fcf6a" ${ln(2)}/><path d="M-34 -4 Q0 -8 34 -8" fill="none" stroke="#4aa356" stroke-width="2"/>` +
        `<g class="an-swim"><path d="M-8 -12 l-3 5 M0 -12 v5 M8 -12 l3 5" ${ln(2)}/>` +
        `<path d="M14 -22 q-2 -8 -6 -10 M18 -22 q2 -8 6 -10" fill="none" ${ln(1.5)}/><path d="${dot(8, -32, 1.8)}${dot(24, -32, 1.8)}" fill="${INK}"/>` +
        `<circle cx="16" cy="-16" r="7" fill="#3b3550" ${ln(2)}/>` +
        `<circle cx="13.5" cy="-17" r="2.2" fill="#fff"/><circle cx="18.5" cy="-17" r="2.2" fill="#fff"/><circle cx="14" cy="-16.5" r="1.1" fill="${INK}"/><circle cx="19" cy="-16.5" r="1.1" fill="${INK}"/>` +
        `<path d="M-16 -11 Q-16 -35 -1 -35 Q14 -35 14 -11 Z" fill="#e8333d" ${ln(2)}/><path d="M-1 -35 V-11" ${ln(1.5)}/>` +
        `<path d="${dot(-9, -24, 3)}${dot(7, -25, 3)}${dot(-7, -15, 2.5)}${dot(7, -15, 2.5)}" fill="${INK}"/>` +
        '<path d="M-11 -29 q3 -3 6 -3" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/></g>',
    },
    { id: 'hamsterwheel', name: 'Hamster in a wheel', price: 30,
      box: '-40 -76 80 82',
      draw: () => shadow(26) +
        `<path d="M-16 -2 L0 -38 L16 -2" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>` +
        '<path d="M-16 -2 L0 -38 L16 -2" fill="none" stroke="#c98b52" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>' +
        `<circle cx="0" cy="-38" r="28" fill="#e6f3ff" ${ln()}/>` +
        '<g class="an-spin"><path d="M0 -66 V-10 M-28 -38 H28 M-19.8 -57.8 L19.8 -18.2 M19.8 -57.8 L-19.8 -18.2" stroke="#b8c4d6" stroke-width="2"/>' +
        '<circle cx="0" cy="-38" r="25" fill="none" stroke="#9aa3b2" stroke-width="2" stroke-dasharray="4 5"/></g>' +
        `<circle cx="0" cy="-38" r="4" fill="#c3cad6" ${ln(2)}/>` +
        `<g class="an-bob"><path d="${dot(-8, -32, 4)}${dot(8, -32, 4)}" fill="#f2b36a" ${ln(1.5)}/><path d="${dot(-8, -32, 2)}${dot(8, -32, 2)}" fill="#ff9fb8"/>` +
        `<ellipse cx="0" cy="-21" rx="14" ry="11" fill="#f2b36a" ${ln(2)}/><ellipse cx="0" cy="-17" rx="8" ry="6" fill="#fff4e0"/>` +
        eyes(-5, 5, -24, 2) + '<circle cx="0" cy="-20" r="1.6" fill="#ff6f8f"/>' + cheeks(-9, 9, -20, 2) +
        `<path d="${dot(-5, -11, 2.5)}${dot(5, -11, 2.5)}" fill="#ffd2c2" ${ln(1.2)}/></g>`,
    },
    { id: 'turtlepet', name: 'Turtle', price: 40,
      box: '-44 -58 88 64',
      draw: () => shadow(32) + '<g transform="translate(-4 0)">' +
        `<path d="M-26 -12 Q-28 -2 -20 -1 Q-14 -2 -14 -12 Z M10 -12 Q10 -2 16 -1 Q24 -2 22 -12 Z" fill="#7bc46a" ${ln(2)}/>` +
        `<path d="M-28 -14 L-38 -10 L-28 -8 Z" fill="#7bc46a" ${ln(1.5)}/>` +
        `<g class="lk-wag">${tube('M18 -16 Q24 -22 28 -24', '#8ed46a', 8)}<circle cx="32" cy="-26" r="9" fill="#8ed46a" ${ln(2)}/>` +
        eyes(30, 36, -28, 2) + `<path d="M30 -21 q3 3 6 0" fill="none" ${ln(1.5)}/>` + cheeks(28, 39, -23, 1.6) + '</g>' +
        `<path d="M-28 -12 Q-28 -46 0 -46 Q28 -46 28 -12 Z" fill="#4f9a4f" ${ln()}/>` +
        `<path d="M-8 -36 L8 -36 L12 -26 L8 -16 L-8 -16 L-12 -26 Z M-12 -26 L-24 -26 M12 -26 L24 -26 M-8 -36 L-12 -42 M8 -36 L12 -42 M-8 -16 L-10 -12 M8 -16 L10 -12" fill="#6fbf5f" stroke="#3a7a3a" stroke-width="2"/>` +
        `<path d="M-16 -10 Q-18 0 -10 0 Q-4 0 -4 -10 Z M14 -10 Q14 0 20 0 Q28 0 26 -10 Z" fill="#8ed46a" ${ln(2)}/>` +
        `<rect x="-31" y="-15" width="62" height="7" rx="3.5" fill="#c9a26a" ${ln(2)}/></g>`,
    },
    { id: 'frogpet', name: 'Frog on a lily pad', price: 50,
      box: '-44 -68 88 74',
      draw: () => `<ellipse cx="0" cy="-4" rx="38" ry="7" fill="#7fd0f5" ${ln(2)}/>` +
        `<ellipse cx="2" cy="-8" rx="28" ry="7" fill="#5fbf6a" ${ln(2)}/><path d="M2 -8 L14 -14 L6 -15 Z" fill="#7fd0f5"/>` +
        '<path d="M2 -8 L-18 -10 M2 -8 L22 -6 M2 -8 L-8 -3" stroke="#4aa356" stroke-width="1.5"/>' +
        `<path d="${leafD(-28, -10, -1.9, 10, 4)}${leafD(-28, -10, -1.1, 10, 4)}${leafD(-28, -10, -2.7, 9, 4)}${leafD(-28, -10, -0.3, 9, 4)}" fill="#ffb3d1" ${ln(1.2)}/>` +
        '<circle cx="-28" cy="-11" r="2" fill="#ffd23f"/>' +
        `<g class="an-jump"><path d="M-14 -12 Q-22 -10 -18 -16 M18 -12 Q26 -10 22 -16" fill="none" stroke="#3fa34f" stroke-width="5" stroke-linecap="round"/>` +
        `<ellipse cx="2" cy="-24" rx="18" ry="13" fill="#5fcf6a" ${ln()}/><ellipse cx="2" cy="-19" rx="11" ry="7" fill="#c8f0a0"/>` +
        `<path d="${dot(-7, -38, 7)}${dot(11, -38, 7)}" fill="#5fcf6a" ${ln(2)}/><path d="${dot(-7, -38, 4.5)}${dot(11, -38, 4.5)}" fill="#fff"/>` +
        eyes(-7, 11, -38, 2.5) + `<path d="M-6 -27 Q2 -20 10 -27" fill="none" ${ln(2)}/>` + cheeks(-10, 14, -26, 2.5) +
        `<path d="${dot(-6, -12, 3)}${dot(10, -12, 3)}" fill="#5fcf6a" ${ln(1.5)}/></g>`,
    },
    { id: 'crayfishpet', name: 'Crayfish in a bucket', price: 60,
      box: '-44 -96 88 102',
      draw: () => {
        const claw = '<path d="M0 0 L-10 -12" stroke="#3b2f5c" stroke-width="9" stroke-linecap="round"/><path d="M0 0 L-10 -12" stroke="#e8433d" stroke-width="4" stroke-linecap="round"/>' +
          `<path d="M-10 -12 Q-20 -14 -20 -26 Q-15 -23 -13 -20 Q-11 -28 -4 -29 Q-4 -18 -10 -12 Z" fill="#e8433d" ${ln(2)}/>`;
        return shadow(26) + `<path d="M-21 -38 Q0 -74 21 -38" fill="none" stroke="${INK}" stroke-width="5"/><path d="M-21 -38 Q0 -74 21 -38" fill="none" stroke="#c3cad6" stroke-width="2"/>` +
          '<path d="M-4 -58 Q-18 -84 -32 -80 M4 -58 Q18 -84 32 -84" fill="none" stroke="#c23a30" stroke-width="1.8" stroke-linecap="round"/>' +
          `<ellipse cx="0" cy="-46" rx="13" ry="14" fill="#e8433d" ${ln(2)}/><path d="M-10 -40 H10 M-11 -34 H11" stroke="#c23a30" stroke-width="2"/>` +
          `<path d="M-7 -59 L0 -78 L7 -59 Z" fill="#ffd23f" ${ln(1.5)}/><path d="M-4.5 -66 L4.5 -66 M-2.5 -72 L2.5 -72" stroke="#5aa7e8" stroke-width="2"/><circle cx="0" cy="-79" r="2.5" fill="#ff5d6c" ${ln(1)}/>` +
          `<path d="${dot(-8, -56, 4)}${dot(8, -56, 4)}" fill="#fff" ${ln(1.5)}/>` + eyes(-8, 8, -56, 2) +
          `<path d="M-4 -46 Q0 -42 4 -46" fill="none" ${ln(1.5)}/>` +
          `<path d="M-22 -38 L22 -38 L17 0 H-17 Z" fill="#5aa7e8" ${ln()}/><path d="M-21 -28 H21 M-19 -12 H19" stroke="#3f86c8" stroke-width="2.5"/>` +
          `<rect x="-25" y="-42" width="50" height="7" rx="3" fill="#7cbcf0" ${ln(2)}/>` +
          `<g class="an-wiggle"><g transform="translate(-10 -42)">${claw}</g></g>` +
          `<g class="an-wiggle an-d2"><g transform="translate(10 -42) scale(-1 1)">${claw}</g></g>` +
          '<path d="M-26 -6 Q-30 -30 -34 -46 M-28 -24 l-6 -3 M-30 -32 l6 -4 M-32 -40 l-5 -2 M-29 -16 l5 -3 M-34 -46 l-4 -3 M-34 -46 l3 -4" fill="none" stroke="#4aa356" stroke-width="2.2" stroke-linecap="round"/>';
      },
    },
    { id: 'hedgehogpet', name: 'Hedgehog', price: 80,
      box: '-46 -66 92 72',
      draw: () => {
        let sp = '';
        for (let i = 0; i <= 16; i++) {
          const a = Math.PI + i * (Math.PI * 0.95) / 16, rr = i % 2 ? 1.28 : 1;
          sp += (i ? 'L' : 'M') + r1(-4 + Math.cos(a) * 28 * rr) + ' ' + r1(-12 + Math.sin(a) * 24 * rr);
        }
        return shadow(32) +
          `<path d="${leafD(-36, -2, -0.3, 18, 6)}" fill="#ff9f43" ${ln(1.5)}/><path d="${leafD(36, -2, -2.8, 16, 5)}" fill="#ffcf3f" ${ln(1.5)}/>` +
          `<ellipse cx="-2" cy="-10" rx="27" ry="10" fill="#e8c99a" ${ln(2)}/>` +
          `<path d="${sp}L24 -10 L-32 -10 Z" fill="#8a5a34" ${ln(2)}/>` +
          '<path d="M-20 -24 l4 -6 M-8 -30 l2 -7 M4 -30 l-1 -7 M-14 -18 l3 -5" stroke="#6b4426" stroke-width="2" stroke-linecap="round"/>' +
          `<circle cx="-8" cy="-44" r="7" fill="#e8333d" ${ln(2)}/><path d="M-8 -51 v-4" ${ln(2)}/><path d="${leafD(-8, -53, -0.4, 8, 3)}" fill="#6fcf6a" ${ln(1)}/>` +
          `<path d="M8 -26 Q20 -30 34 -16 Q30 -6 16 -6 Q6 -8 8 -26 Z" fill="#f2d9b0" ${ln(2)}/>` +
          `<circle cx="12" cy="-26" r="4" fill="#d9b27a" ${ln(1.5)}/>` +
          `<circle class="an-pulse" cx="34" cy="-16" r="3" fill="${INK}"/>` +
          `<g class="lk-eyes"><circle cx="21" cy="-20" r="2.3" fill="${INK}"/></g>` + '<circle cx="20" cy="-13" r="2.2" fill="#ff8fb0" opacity="0.7"/>' +
          `<path d="M26 -11 q3 2 5 -1" fill="none" ${ln(1.2)}/>`;
      },
    },
    { id: 'kittenbasket', name: 'Kitten in a basket', price: 100,
      box: '-46 -90 92 96',
      draw: () => shadow(34) + `<ellipse cx="0" cy="-40" rx="34" ry="9" fill="#8a5a34" ${ln(2)}/><ellipse cx="0" cy="-39" rx="28" ry="5" fill="#ff8fb0"/>` +
        `<g class="lk-wag">${tube('M26 -34 Q44 -40 38 -60', '#b8b2cc', 5)}</g>` +
        `<path d="M-15 -66 L-14 -82 L-4 -72 Z M15 -66 L14 -82 L4 -72 Z" fill="#b8b2cc" ${ln(2)}/><path d="M-12 -70 L-12 -77 L-7 -72 Z M12 -70 L12 -77 L7 -72 Z" fill="#ff9fb8"/>` +
        `<circle cx="0" cy="-58" r="16" fill="#b8b2cc" ${ln()}/>` +
        '<path d="M-4 -72 v5 M0 -73 v6 M4 -72 v5" stroke="#8d86a6" stroke-width="2" stroke-linecap="round"/>' +
        eyes(-6, 6, -59, 2.6) + '<path d="M-1.5 -53 h3 l-1.5 2 Z" fill="#ff6f8f"/>' +
        `<path d="M-4 -49 Q-2 -47 0 -49 Q2 -47 4 -49" fill="none" ${ln(1.3)}/>` + cheeks(-10, 10, -52, 2.5) +
        '<path d="M-10 -53 H-20 M-10 -51 L-19 -48 M10 -53 H20 M10 -51 L19 -48" stroke="#8d86a6" stroke-width="1.2"/>' +
        `<path d="M-34 -40 Q-32 -4 -24 0 H24 Q32 -4 34 -40 Q0 -30 -34 -40 Z" fill="#d9a066" ${ln()}/>` +
        '<path d="M-28 -22 Q0 -14 28 -22 M-26 -10 Q0 -3 26 -10 M-16 -34 L-14 0 M0 -32 V0 M16 -34 L14 0" fill="none" stroke="#b07a44" stroke-width="2"/>' +
        tube('M-34 -40 Q0 -30 34 -40', '#c98b52', 4) +
        `<path d="${dot(-9, -40, 5)}${dot(9, -40, 5)}" fill="#c9c4da" ${ln(1.5)}/>` +
        `<circle cx="28" cy="-8" r="8" fill="#5aa7e8" ${ln(2)}/><path d="M22 -12 Q28 -6 34 -10 M23 -4 Q28 -12 33 -2" fill="none" stroke="#3f86c8" stroke-width="1.5"/>` +
        '<path d="M34 -4 Q40 0 36 2" fill="none" stroke="#5aa7e8" stroke-width="1.5"/>',
    },
    { id: 'goldfish', name: 'Goldfish', price: 150,
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
    { id: 'blackcatpet', name: 'Black cat with a witch hat', price: 200,
      box: '-46 -128 92 134',
      draw: () => {
        const fur = '#4a4466';
        return shadow(30) +
          `<g class="lk-wag">${tube('M16 -8 Q36 -8 34 -28 Q33 -40 26 -42', fur, 6)}</g>` +
          `<path d="M-20 -2 Q-26 -40 -10 -58 H10 Q26 -40 20 -2 Z" fill="${fur}" ${ln()}/>` +
          '<path d="M-6 -50 Q0 -40 6 -50 Q4 -30 0 -26 Q-4 -30 -6 -50 Z" fill="#6a6290"/>' +
          `<path d="M-15 -78 L-24 -96 L-6 -88 Z M15 -78 L24 -96 L6 -88 Z" fill="${fur}" ${ln(2)}/><path d="M-15 -82 L-20 -92 L-10 -88 Z M15 -82 L20 -92 L10 -88 Z" fill="#ff9fb8"/>` +
          `<circle cx="0" cy="-72" r="18" fill="${fur}" ${ln()}/>` +
          `<g class="lk-eyes"><ellipse cx="-7" cy="-73" rx="4.5" ry="5.5" fill="#d8ff6a" ${ln(1.5)}/><ellipse cx="7" cy="-73" rx="4.5" ry="5.5" fill="#d8ff6a" ${ln(1.5)}/>` +
          `<ellipse cx="-7" cy="-73" rx="1.5" ry="4" fill="${INK}"/><ellipse cx="7" cy="-73" rx="1.5" ry="4" fill="${INK}"/></g>` +
          '<path d="M-2 -66 h4 l-2 2.5 Z" fill="#ff8fb0"/>' +
          '<path d="M-4 -61 Q-2 -59 0 -61 Q2 -59 4 -61 M-10 -66 H-22 M-10 -64 L-20 -60 M10 -66 H22 M10 -64 L20 -60" fill="none" stroke="#c3bdd8" stroke-width="1.3" stroke-linecap="round"/>' +
          `<ellipse cx="0" cy="-89" rx="17" ry="4.5" fill="#8f5ad8" ${ln(2)}/>` +
          `<path d="M-11 -91 Q-6 -108 6 -122 Q14 -118 12 -112 Q8 -110 10 -91 Z" fill="#8f5ad8" ${ln(2)}/>` +
          `<path d="M-10.5 -95 Q0 -93 10.5 -95 L10.3 -100 Q0 -98 -9 -100 Z" fill="#ff8a2b" ${ln(1.2)}/><rect x="-2.5" y="-100" width="5" height="5" fill="none" stroke="#ffcf3f" stroke-width="1.5"/>` +
          `<path d="${dot(-8, -3, 5)}${dot(8, -3, 5)}" fill="${fur}" ${ln(2)}/>` +
          `<path d="M-30 -2 Q-38 -2 -38 -9 Q-38 -16 -30 -16 Q-22 -16 -22 -9 Q-22 -2 -30 -2 Z" fill="#ff8a2b" ${ln(2)}/><path d="M-31 -16 v-4" ${ln(2)}/>` +
          `<path class="an-glow" d="M-34 -11 l2 -3 l2 3 Z M-30 -11 l2 -3 l2 3 Z M-34 -7 Q-30 -4 -26 -7 Z" fill="#ffe066"/>`;
      },
    },
    { id: 'ghostpet', name: 'Friendly ghost', price: 250,
      box: '-44 -122 88 128',
      draw: () => '<ellipse class="an-pulse" cx="0" cy="0" rx="20" ry="3.5" fill="#000" opacity="0.12"/>' +
        `<g class="an-float"><path d="M-20 -80 Q-34 -80 -32 -66 Q-26 -68 -20 -68 Z M20 -72 Q32 -72 30 -60 Q25 -62 20 -62 Z" fill="#fff" ${ln(2)}/>` +
        `<path d="M-22 -40 V-84 Q-22 -110 0 -110 Q22 -110 22 -84 V-40 Q16 -32 11 -40 Q5.5 -32 0 -40 Q-5.5 -32 -11 -40 Q-16 -32 -22 -40 Z" fill="#fff" ${ln()}/>` +
        `<g class="lk-eyes"><ellipse cx="-7" cy="-82" rx="3.5" ry="5" fill="${INK}"/><ellipse cx="7" cy="-82" rx="3.5" ry="5" fill="${INK}"/>` +
        '<circle cx="-6" cy="-84" r="1.3" fill="#fff"/><circle cx="8" cy="-84" r="1.3" fill="#fff"/></g>' +
        `<ellipse cx="0" cy="-72" rx="3" ry="3.5" fill="#ff6f8f" ${ln(1.5)}/>` + cheeks(-12, 12, -74, 3) +
        `<path d="M22 -62 Q30 -72 38 -62" fill="none" ${ln(1.5)}/>` +
        `<path d="M22 -61 H38 L36 -48 Q30 -45 24 -48 Z" fill="#ff8a2b" ${ln(2)}/><path d="M26 -57 l1.5 -2 l1.5 2 Z M32 -57 l1.5 -2 l1.5 2 Z M26 -53 Q30 -50 34 -53" fill="none" ${ln(1)}/>` +
        `<path d="${dot(26, -63, 2.5)}${dot(32, -64, 2.5)}" fill="#ff5d6c" ${ln(1)}/></g>`,
    },
    { id: 'owlpet', name: 'Wise owl', price: 300,
      box: '-44 -132 88 138',
      draw: () => shadow(26) +
        `<path d="M-18 0 L-16 -26 H16 L18 0 Z" fill="#a0703f" ${ln()}/><path d="M-10 -20 V-4 M2 -22 V-2 M12 -18 V-6" stroke="#7a5230" stroke-width="2"/>` +
        `<ellipse cx="0" cy="-26" rx="16" ry="4.5" fill="#d9b27a" ${ln(2)}/><ellipse cx="0" cy="-26" rx="8" ry="2" fill="none" stroke="#b08048" stroke-width="1.5"/>` +
        `<path d="M22 -2 L36 -2 L36 -14 L22 -14 Z" fill="#5aa7e8" ${ln(2)}/><path d="M24 -11 H34 M24 -7 H32" stroke="#fff" stroke-width="1.5"/>` +
        `<g class="an-sway"><path d="M-14 -88 L-18 -102 L-6 -92 Z M14 -88 L18 -102 L6 -92 Z" fill="#8a5a34" ${ln(2)}/>` +
        `<ellipse cx="0" cy="-60" rx="22" ry="30" fill="#b07a44" ${ln()}/><ellipse cx="0" cy="-50" rx="14" ry="18" fill="#f2d9b0"/>` +
        '<path d="M-6 -56 l3 3 l3 -3 M2 -56 l3 3 l3 -3 M-6 -46 l3 3 l3 -3 M2 -46 l3 3 l3 -3 M-2 -38 l3 3 l3 -3" fill="none" stroke="#c9a26a" stroke-width="1.6"/>' +
        `<path d="M-22 -66 Q-30 -46 -16 -34 Q-18 -50 -14 -62 Z M22 -66 Q30 -46 16 -34 Q18 -50 14 -62 Z" fill="#8a5a34" ${ln(2)}/>` +
        `<path d="${dot(-9, -72, 10)}${dot(9, -72, 10)}" fill="#f7ead0" ${ln(2)}/>` +
        `<g class="lk-eyes"><path d="${dot(-9, -72, 6.5)}${dot(9, -72, 6.5)}" fill="#ffcf3f" ${ln(1.5)}/><path d="${dot(-9, -72, 3.8)}${dot(9, -72, 3.8)}" fill="${INK}"/>` +
        '<circle cx="-7.8" cy="-73.5" r="1.4" fill="#fff"/><circle cx="10.2" cy="-73.5" r="1.4" fill="#fff"/></g>' +
        `<path d="M-3 -63 L3 -63 L0 -57 Z" fill="#ff9f43" ${ln(1.5)}/>` +
        `<path d="M-8 -30 v4 M-5 -30 v4 M5 -30 v4 M8 -30 v4" stroke="#ff9f43" stroke-width="2.5" stroke-linecap="round"/>` +
        `<path d="M-20 -96 L0 -104 L20 -96 L0 -88 Z" fill="#3b3550" ${ln(1.5)}/><path d="M-8 -93 V-88 Q0 -84 8 -88 V-93" fill="#3b3550" ${ln(1.5)}/>` +
        `<path d="M0 -96 L16 -92 V-82" fill="none" stroke="#ffcf3f" stroke-width="1.8"/><circle cx="16" cy="-81" r="2.2" fill="#ffcf3f" ${ln(1)}/></g>`,
    },
    { id: 'axolotltank', name: 'Axolotl in a tank', price: 400,
      box: '-46 -86 92 92',
      draw: () => shadow(38) +
        `<rect x="-36" y="-70" width="72" height="66" rx="4" fill="#d6f0fa" ${ln()}/><rect x="-33" y="-60" width="66" height="54" fill="#7fd0f5"/>` +
        `<path d="${dot(-24, -8, 4)}${dot(-14, -7, 3.5)}${dot(-4, -8, 4)}${dot(8, -7, 3.5)}${dot(18, -8, 4)}${dot(27, -7, 3)}" fill="#e8c99a" ${ln(1)}/>` +
        `<g class="an-sway"><path d="${leafD(-24, -10, -1.75, 34, 4)}${leafD(-22, -10, -1.25, 26, 4)}" fill="#4fbf5f" ${ln(1.5)}/></g>` +
        `<g class="an-sway an-d3"><path d="${leafD(26, -10, -1.45, 30, 4)}" fill="#4fbf5f" ${ln(1.5)}/></g>` +
        `<g class="an-swim"><path d="${leafD(-12, -34, 3.0, 14, 5)}" fill="#ffb3d1" ${ln(1.5)}/>` +
        `<path d="M-6 -28 l-3 5 M6 -28 l3 5" ${ln(2)}/>` +
        `<path d="${leafD(10, -42, -2.3, 9, 2.5)}${leafD(10, -38, -2.9, 10, 2.5)}${leafD(10, -34, 2.8, 9, 2.5)}${leafD(16, -42, -0.8, 9, 2.5)}${leafD(16, -38, -0.2, 10, 2.5)}${leafD(16, -34, 0.3, 9, 2.5)}" fill="#ff6f9f" ${ln(1)}/>` +
        `<ellipse cx="-2" cy="-33" rx="13" ry="7" fill="#ffb3d1" ${ln(2)}/><circle cx="13" cy="-37" r="8" fill="#ffb3d1" ${ln(2)}/>` +
        eyes(10, 17, -38, 1.6) + `<path d="M10 -34 Q13.5 -31 17 -34" fill="none" ${ln(1.2)}/></g>` +
        `<circle class="an-rise" cx="-14" cy="-30" r="2.5" fill="none" stroke="#fff" stroke-width="1.5"/><circle class="an-rise an-d3" cx="20" cy="-22" r="2" fill="none" stroke="#fff" stroke-width="1.5"/>` +
        '<path d="M-30 -56 V-30" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.7"/>' +
        `<rect x="-38" y="-74" width="76" height="6" rx="2" fill="#5a6c8a" ${ln(2)}/><rect x="-38" y="-6" width="76" height="6" rx="2" fill="#5a6c8a" ${ln(2)}/>`,
    },
    { id: 'parrot', name: 'Parrot', price: 500,
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
    { id: 'moosecalf', name: 'Baby moose', price: 600,
      box: '-46 -116 92 122',
      draw: () => {
        const fur = '#9a6a44';
        const fl = ['#ff5d6c', '#fff', '#ffd23f', '#b892ff', '#ff9fb8'];
        const wreath = [[-29, -94], [-24, -98], [-18, -100], [-12, -99], [-7, -96]]
          .map(([x, y], i) => `<path d="${ring(x, y, 2.4, 5, 1.9)}" fill="${fl[i]}" ${ln(0.8)}/>`).join('');
        return shadow(34) + `<ellipse cx="0" cy="-2" rx="36" ry="4" fill="#8ed46a" ${ln(1.5)}/>` +
          foal(fur, '#4a3428', `<g class="lk-wag"><path d="M29 -58 Q38 -60 36 -50 Q32 -52 29 -54 Z" fill="${fur}" ${ln(1.5)}/></g>`) +
          '<path d="M-6 -62 Q8 -68 24 -60" fill="none" stroke="#7a5236" stroke-width="2"/>' +
          nod(`<path d="${leafD(-12, -94, -0.5, 14, 4.5)}" fill="${fur}" ${ln(2)}/>` +
            `<ellipse cx="-18" cy="-88" rx="11" ry="10" fill="${fur}" ${ln()}/><ellipse cx="-28" cy="-79" rx="10" ry="8.5" fill="#b48058" ${ln(2)}/>` +
            `<path d="${dot(-33, -80, 1.6)}${dot(-27, -82, 1.6)}" fill="${INK}"/><path d="M-34 -74 q4 3 8 0" fill="none" ${ln(1.5)}/>` +
            `<g class="lk-eyes"><circle cx="-18" cy="-90" r="2.4" fill="${INK}"/><circle cx="-17.2" cy="-90.8" r="0.8" fill="#fff"/></g>` +
            `<path d="${dot(-21, -97, 2.5)}${dot(-12, -97, 2.5)}" fill="#d9b27a" ${ln(1.2)}/>` + wreath) +
          tube('M-22 -68 Q-11 -62 -1 -68', '#2f6fd6', 5) + tube('M-6 -64 L-4 -50', '#ffd23f', 4) + tube('M-2 -64 L3 -52', '#2f6fd6', 4);
      },
    },
    { id: 'reindeerpet', name: 'Reindeer calf', price: 800,
      box: '-46 -130 92 136',
      draw: () => {
        const fur = '#b07a44';
        const flakes = [[-34, -112, 1], [30, -120, 3], [36, -84, 2], [-30, -66, 4]]
          .map(([x, y, d]) => `<g class="an-fall an-d${d}"><path d="${dot(x, y, 2.2)}" fill="#fff" ${ln(1)}/></g>`).join('');
        return shadow(34) + `<path d="M-36 -1 Q-34 -9 -24 -7 Q-16 -13 -6 -8 Q4 -13 14 -8 Q24 -12 30 -6 Q38 -6 36 -1 Z" fill="#fff" ${ln(1.5)}/>` +
          foal(fur, '#4a3428', `<g class="lk-wag"><path d="M29 -60 Q38 -64 37 -54 Q33 -55 30 -55 Z" fill="#fff" ${ln(1.5)}/></g>`) +
          `<path d="M-6 -64 Q8 -71 22 -63 L20 -50 Q8 -55 -4 -50 Z" fill="#e8333d" ${ln(2)}/><path d="M-4 -53 Q8 -58 20 -53" fill="none" stroke="#ffcf3f" stroke-width="2.5"/>` +
          '<ellipse cx="6" cy="-44" rx="14" ry="4" fill="#f2e3cc"/>' +
          nod(`<path d="M-18 -96 Q-22 -110 -16 -122 M-19 -108 L-28 -116 M-11 -96 Q-6 -110 -2 -120 M-8 -108 L2 -112" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>` +
            '<path d="M-18 -96 Q-22 -110 -16 -122 M-19 -108 L-28 -116 M-11 -96 Q-6 -110 -2 -120 M-8 -108 L2 -112" fill="none" stroke="#8a5a34" stroke-width="2.5" stroke-linecap="round"/>' +
            `<path d="${leafD(-10, -92, -0.3, 12, 4)}" fill="${fur}" ${ln(2)}/>` +
            `<ellipse cx="-18" cy="-88" rx="11" ry="10" fill="${fur}" ${ln()}/><ellipse cx="-26" cy="-81" rx="8" ry="6.5" fill="#d9b27a" ${ln(2)}/>` +
            `<g class="lk-eyes"><circle cx="-17" cy="-90" r="2.4" fill="${INK}"/><circle cx="-16.2" cy="-90.8" r="0.8" fill="#fff"/></g>` +
            `<path d="M-30 -76 q3 2 6 0" fill="none" ${ln(1.3)}/>` +
            '<circle class="an-glow" cx="-33" cy="-82" r="9" fill="#ff4f4f" fill-opacity="0.35"/>' +
            `<circle cx="-33" cy="-82" r="4.5" fill="#ff3b3b" ${ln(1.5)}/><circle cx="-34.5" cy="-83.5" r="1.3" fill="#fff"/>`) +
          tube('M-22 -68 Q-11 -62 -1 -68', '#e8333d', 5) +
          `<g class="an-wiggle"><circle cx="-12" cy="-61" r="3.5" fill="#ffcf3f" ${ln(1.5)}/></g><g class="an-wiggle an-d2"><circle cx="-4" cy="-62" r="3.5" fill="#ffcf3f" ${ln(1.5)}/></g>` +
          flakes;
      },
    },
    { id: 'jellyfishtank', name: 'Jellyfish tank', price: 1000,
      box: '-46 -150 92 156',
      draw: () => {
        const jelly = (x, y, s, c, cls) => `<g class="an-float ${cls}"><circle class="an-glow" cx="${x}" cy="${y - 6 * s}" r="${16 * s}" fill="${c}" fill-opacity="0.3"/>` +
          `<path d="M${x - 7 * s} ${y + 1}q-3 6 0 12t0 12M${x} ${y + 2}q3 6 0 12t0 12M${x + 7 * s} ${y + 1}q-3 6 0 12t0 12" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/>` +
          `<path d="M${x - 12 * s} ${y}Q${x - 12 * s} ${y - 17 * s} ${x} ${y - 17 * s}Q${x + 12 * s} ${y - 17 * s} ${x + 12 * s} ${y}Q${x + 6 * s} ${y + 3} ${x} ${y}Q${x - 6 * s} ${y + 3} ${x - 12 * s} ${y}Z" fill="${c}" ${ln(2)}/>` +
          eyes(x - 4 * s, x + 4 * s, y - 7 * s, 1.8) + `<path d="M${x - 2} ${y - 3 * s}q2 2 4 0" fill="none" ${ln(1.2)}/></g>`;
        return shadow(34) + `<rect x="-28" y="-138" width="56" height="126" rx="14" fill="#2f4f9a" ${ln()}/>` +
          `<path d="${leafD(-18, -14, -1.7, 30, 4)}${leafD(-14, -14, -1.3, 22, 4)}${leafD(18, -14, -1.4, 26, 4)}" fill="#5fcf8a" ${ln(1.5)}/>` +
          `<path d="${dot(-6, -16, 4)}${dot(4, -15, 3.5)}${dot(12, -16, 3)}" fill="#ff8fb0" ${ln(1)}/>` +
          jelly(-4, -100, 1, '#ff8fc8', '') + jelly(8, -58, 0.75, '#5ee0e0', 'an-d3') +
          `<circle class="an-rise" cx="-16" cy="-40" r="2.5" fill="none" stroke="#bfe6f5" stroke-width="1.5"/><circle class="an-rise an-d2" cx="16" cy="-90" r="2" fill="none" stroke="#bfe6f5" stroke-width="1.5"/>` +
          `<circle class="an-rise an-d4" cx="-12" cy="-70" r="2" fill="none" stroke="#bfe6f5" stroke-width="1.5"/>` +
          '<path d="M-22 -120 V-60" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.35"/>' +
          `<rect x="-30" y="-144" width="60" height="9" rx="3" fill="#ffcf3f" ${ln(2)}/>` +
          `<path d="M-34 -14 H34 L30 0 H-30 Z" fill="#ffcf3f" ${ln()}/>` + gem(0, -7, 5, '#5ec8ff') + gem(-16, -7, 3.5, '#ff4f7b') + gem(16, -7, 3.5, '#ff4f7b') +
          sparkle(-36, -120, 6) + sparkle(36, -80, 5);
      },
    },
    { id: 'starpet', name: 'Star buddy', gems: 15,
      box: '-46 -116 92 122',
      draw: () => {
        const orbit = [0, 1, 2].map(i => `<path d="${star(r1(Math.cos(i * 2.094) * 36), r1(-60 + Math.sin(i * 2.094) * 36), 5)}" fill="#fff3a0" ${ln(1.2)}/>`).join('');
        return shadow(28) + blob(dot(-20, -12, 9) + dot(-6, -16, 11) + dot(10, -15, 10) + dot(22, -11, 8) + 'M-28 -6H29V-12H-28Z', '#fff', 2.5) +
          `<g class="an-float"><path class="an-glow" d="${star(0, -60, 40, 0.5)}" fill="#fff3a0" fill-opacity="0.6"/>` +
          `<path d="${star(0, -60, 30, 0.5)}" fill="#ffd23f" ${ln()}/>` +
          `<g class="lk-eyes"><ellipse cx="-6" cy="-60" rx="2.6" ry="3.6" fill="${INK}"/><ellipse cx="6" cy="-60" rx="2.6" ry="3.6" fill="${INK}"/>` +
          '<circle cx="-5" cy="-61.5" r="1" fill="#fff"/><circle cx="7" cy="-61.5" r="1" fill="#fff"/></g>' +
          cheeks(-10, 10, -54, 2.5) + `<path d="M-4 -53 Q0 -49 4 -53" fill="none" ${ln(1.8)}/>` +
          crown(0, -84, 0.45) + '</g>' +
          `<g>${orbit}<animateTransform attributeName="transform" type="rotate" values="0 0 -60;360 0 -60" dur="10s" repeatCount="indefinite"/></g>` +
          sparkle(-34, -100, 6) + sparkle(34, -30, 5);
      },
    },
    { id: 'unicornpet', name: 'Baby unicorn', gems: 25,
      box: '-48 -126 96 132',
      draw: () => {
        const mane = ['#ff8fc8', '#b892ff', '#5ec8ff', '#ff8fc8', '#b892ff'];
        return shadow(36) + `<ellipse cx="2" cy="-4" rx="38" ry="6" fill="#ffb3d9" ${ln(2)}/>` +
          '<path d="M-34 -4 Q2 4 38 -4" fill="none" stroke="#ffcf3f" stroke-width="2"/>' +
          foal('#fff', '#ffcf3f', `<g class="lk-wag">${tube('M29 -58 Q44 -60 40 -40', '#ff8fc8', 5)}${tube('M30 -56 Q40 -52 38 -38', '#5ec8ff', 3)}</g>`) +
          `<path d="${dot(-16, -78, 5)}${dot(-12, -70, 5)}${dot(-8, -62, 4.5)}" fill="#b892ff" ${ln(1.5)}/>` +
          nod('<circle class="an-glow" cx="-20" cy="-106" r="10" fill="#fff3a0" fill-opacity="0.6"/>' +
            `<path d="M-23 -96 L-22 -118 L-15 -97 Z" fill="#ffcf3f" ${ln(1.5)}/><path d="M-22.5 -102 l5 -1 M-22.2 -108 l3.5 -1" stroke="#e6a823" stroke-width="1.5"/>` +
            `<path d="${leafD(-11, -94, -0.6, 12, 4)}" fill="#fff" ${ln(2)}/>` +
            `<ellipse cx="-18" cy="-86" rx="11" ry="10" fill="#fff" ${ln()}/><ellipse cx="-27" cy="-80" rx="8" ry="6.5" fill="#ffe0ec" ${ln(2)}/>` +
            `<path d="${dot(-30, -81, 1.3)}" fill="${INK}"/><path d="M-31 -76 q3 2 6 0" fill="none" ${ln(1.3)}/>` +
            `<g class="lk-eyes"><circle cx="-17" cy="-88" r="2.8" fill="${INK}"/><circle cx="-16" cy="-89" r="1" fill="#fff"/></g>` +
            `<path d="M-19 -91 l-2 -2 M-16 -91.5 l-1 -2.5" ${ln(1)}/>` + '<circle cx="-14" cy="-82" r="2.5" fill="#ff8fb0" opacity="0.7"/>' +
            mane.map((c, i) => `<circle cx="${-11 + i * 2.5}" cy="${-96 + i * 6}" r="5" fill="${c}" ${ln(1.5)}/>`).join('')) +
          sparkle(-36, -60, 7) + sparkle(36, -96, 6) + sparkle(-32, -116, 5);
      },
    },
    { id: 'phoenixpet', name: 'Phoenix chick', gems: 35,
      box: '-48 -118 96 124',
      draw: () => {
        const fl = (x, y, s) => flame(x, y, s);
        return shadow(34) + '<circle class="an-glow" cx="0" cy="-50" r="38" fill="#ffcf3f" fill-opacity="0.3"/>' +
          `<g transform="rotate(-50 -18 -26)">${fl(-18, -26, 1.4)}</g><g transform="rotate(50 18 -26)">${fl(18, -26, 1.4)}</g>` +
          `<g class="an-bob"><circle cx="0" cy="-40" r="19" fill="#ff8a2b" ${ln()}/><ellipse cx="0" cy="-34" rx="11" ry="11" fill="#ffd23f"/>` +
          `<path d="M-18 -46 Q-30 -40 -26 -26 Q-18 -32 -14 -34 Z M18 -46 Q30 -40 26 -26 Q18 -32 14 -34 Z" fill="#ff5d3b" ${ln(2)}/>` +
          fl(-6, -76, 0.8) + fl(6, -76, 0.8) + fl(0, -78, 1.15) +
          `<circle cx="0" cy="-66" r="14" fill="#ff8a2b" ${ln()}/>` +
          eyes(-5, 5, -68, 2.4) + cheeks(-9, 9, -62, 2.4) +
          `<path d="M-3.5 -63 L3.5 -63 L0 -57 Z" fill="#ffcf3f" ${ln(1.5)}/></g>` +
          `<path d="M-32 -18 Q-32 0 0 0 Q32 0 32 -18 Q0 -10 -32 -18 Z" fill="#e6a823" ${ln()}/>` +
          '<path d="M-28 -12 L-10 -8 M-20 -6 L4 -10 M2 -4 L26 -10 M-26 -4 L-12 -2" stroke="#b88214" stroke-width="2" stroke-linecap="round"/>' +
          gem(-14, -10, 4.5, '#ff4f7b') + gem(0, -8, 5, '#5ec8ff') + gem(14, -10, 4.5, '#7be07b') +
          `<circle class="an-rise" cx="-20" cy="-60" r="2" fill="#ffb321"/><circle class="an-rise an-d2" cx="22" cy="-70" r="2" fill="#ff7b3b"/><circle class="an-rise an-d4" cx="12" cy="-92" r="1.8" fill="#ffb321"/>` +
          sparkle(-36, -96, 6) + sparkle(36, -40, 5);
      },
    },
    { id: 'babydragon', name: 'Baby dragon', gems: 45,
      box: '-48 -110 96 116',
      draw: () => '<ellipse cx="0" cy="0" rx="34" ry="4" fill="#000" opacity="0.15"/>' +
        `<ellipse cx="0" cy="-12" rx="34" ry="10" fill="#8f5ad8" ${ln()}/>` +
        '<path d="M-32 -10 Q0 -2 32 -10" fill="none" stroke="#ffcf3f" stroke-width="3"/>' +
        `<path d="M-34 -12 L-40 -4 L-34 -2 Z M34 -12 L40 -4 L34 -2 Z" fill="#ffcf3f" ${ln(1.5)}/>` +
        `<g class="an-bob"><g transform="translate(-30 -95.6) scale(0.3)">${Look.inner('dragon', {}, 'happy')}</g>` +
        `<g transform="rotate(-12 0 -92)">${crown(0, -86, 0.7)}</g></g>` +
        sparkle(-34, -60, 7) + sparkle(36, -80, 6) + sparkle(30, -34, 5),
    },
  ]);
})();
