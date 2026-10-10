// In hand: drawn around the paw at (0, 0).
// Cheap to elite; each entry is the catalog item (ITEMS) and its drawing (WEAR_ART), added by addItems.

(() => {
  const { GOLD, GOLD_D, GEM, RUBY, RED, RED_D, BLUE, DARK, f1, shine, star, spark } = WEAR_KIT;
  // Flips a class animation upside down so a flame flickers from its foot (as flip() in items/furniture.js).
  const flip = (cls, s) => `<g transform="scale(1 -1)"><g class="${cls}"><g transform="scale(1 -1)">${s}</g></g></g>`;
  // SMIL swing: rotates its parent group to and fro around (x, y).
  const swing = (x, y, a, dur) => `<animateTransform attributeName="transform" type="rotate" values="${-a} ${x} ${y};${a} ${x} ${y};${-a} ${x} ${y}" dur="${dur}s" repeatCount="indefinite"/>`;
  // SMIL flap: squeezes its parent group sideways and back (wings, a flag).
  const flap = (dur, lo = 0.3) => `<animateTransform attributeName="transform" type="scale" values="1 1;${lo} 1;1 1" dur="${dur}s" repeatCount="indefinite"/>`;
  // Circles [x, y, r] with one outline around them all (a cloud).
  const puff = (cs, fill) => cs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r + 1.5}" fill="${INK}"/>`).join('') +
    cs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r - 1.5}" fill="${fill}"/>`).join('');
  // A flame with its foot at (x, y), h tall.
  const fireD = (x, y, w, h) => `M${x} ${y}C${f1(x - w)} ${y} ${f1(x - w)} ${f1(y - h * 0.45)} ${f1(x - w * 0.3)} ${f1(y - h * 0.7)}` +
    `Q${f1(x - w * 0.1)} ${f1(y - h * 0.5)} ${x} ${f1(y - h)}Q${f1(x + w * 0.4)} ${f1(y - h * 0.6)} ${f1(x + w * 0.6)} ${f1(y - h * 0.75)}` +
    `C${f1(x + w * 1.1)} ${f1(y - h * 0.4)} ${f1(x + w)} ${y} ${x} ${y}Z`;

  addItems('hand', WEAR_ART, [
    { id: 'lollipop', name: 'Lollipop', price: 15,
      box: '-22 -90 62 112',
      draw: () => tube('M0 10 L12 -44', '#fff', 4) +
        `<circle cx="15" cy="-58" r="17" fill="#ff6fae" ${ln()}/>` +
        '<path d="M15 -58 A3 3 0 0 1 21 -58 A6 6 0 0 1 9 -58 A9 9 0 0 1 27 -58 A12 12 0 0 1 3 -58" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>' +
        shine('M4 -66 Q6 -72 11 -74', 2.5),
    },
    { id: 'balloon', name: 'Balloon', price: 20,
      draw: () => '<g class="an-sway"><path d="M0 0 Q-10 -40 10 -66 Q22 -80 23 -88" fill="none" stroke="#3b2f5c" stroke-width="2"/>' +
        `<path d="M19 -86 L27 -86 L23 -92 Z" fill="${RED_D}" ${ln(2)}/><ellipse cx="23" cy="-114" rx="22" ry="25" fill="${RED}" ${ln()}/>` +
        '<ellipse cx="15" cy="-122" rx="5" ry="8" transform="rotate(20 15 -122)" fill="#fff" opacity="0.7"/></g>',
    },
    // Christmas: a red and white striped candy cane.
    { id: 'candycanestick', name: 'Candy cane', price: 30,
      box: '-22 -88 76 114',
      draw: () => {
        const d = 'M-2 14 L10 -46 Q14 -68 30 -66 Q44 -64 41 -48';
        return tube(d, '#fff', 8) + `<path d="${d}" fill="none" stroke="${RED}" stroke-width="8" stroke-dasharray="6 7"/>` +
          shine('M5 -20 L11 -48 Q14 -60 24 -62', 2);
      },
    },
    // Swedish fika: a warm cinnamon bun with pearl sugar, steam rising.
    { id: 'fikabun', name: 'Kanelbulle', price: 40,
      box: '-20 -84 66 106',
      draw: () => `<g class="an-rise an-d1"><path d="M8 -44 q-4 -5 0 -10 q4 -5 0 -10" fill="none" stroke="#b3abd3" stroke-width="3" stroke-linecap="round"/></g>` +
        `<g class="an-rise an-d3"><path d="M22 -46 q-4 -5 0 -10 q4 -5 0 -10" fill="none" stroke="#b3abd3" stroke-width="3" stroke-linecap="round"/></g>` +
        `<path d="M-6 -16 C-8 -36 8 -42 18 -40 C34 -38 38 -22 34 -12 C30 0 6 2 -2 -6 Z" fill="#d9954a" ${ln()}/>` +
        '<path d="M15 -20 C20 -20 22 -26 16 -28 C8 -30 4 -22 8 -16 C14 -8 28 -12 28 -24 C28 -34 16 -38 6 -34" fill="none" stroke="#a8642a" stroke-width="3" stroke-linecap="round"/>' +
        [[2, -30], [12, -36], [24, -32], [30, -20], [20, -8], [6, -12], [16, -24]].map(([x, y], i) =>
          `<rect x="${x - 2}" y="${y - 1.5}" width="4" height="3" rx="1.2" transform="rotate(${i * 50} ${x} ${y})" fill="#fff"/>`).join(''),
    },
    { id: 'icecreamcone', name: 'Ice cream cone', price: 50,
      box: '-26 -98 70 120',
      draw: () => '<g transform="rotate(16)">' +
        `<path d="M-13 -30 L0 10 L13 -30 Z" fill="#e8b56a" ${ln()}/>` +
        '<path d="M-8 -30 L5 -6 M0 -30 L8 -16 M8 -30 L10 -24 M8 -30 L-5 -6 M0 -30 L-8 -16 M-8 -30 L-10 -24" stroke="#c48c52" stroke-width="2" stroke-linecap="round"/>' +
        `<circle cx="0" cy="-36" r="14" fill="#ff9ec4" ${ln()}/>` +
        `<path d="M-14 -34 Q-12 -26 -8 -30 Q-6 -22 -2 -28 Q2 -22 6 -28 Q10 -24 14 -32" fill="#ff9ec4" ${ln(2)}/>` +
        `<circle cx="0" cy="-58" r="13" fill="#9be3c4" ${ln()}/>` +
        `<circle cx="-4" cy="-62" r="1.6" fill="${DARK}"/><circle cx="5" cy="-54" r="1.6" fill="${DARK}"/><circle cx="4" cy="-64" r="1.6" fill="${DARK}"/>` +
        tube('M2 -74 Q4 -82 9 -84', '#5fbf5a', 1.5) + `<circle cx="2" cy="-73" r="5" fill="${RED}" ${ln(2)}/>` +
        shine('M-8 -62 Q-7 -67 -3 -69', 2.5) + '</g>',
    },
    // Swedish: the blue and yellow flag on a stick, waving.
    { id: 'flagstick', name: 'Swedish flag', price: 60,
      box: '-22 -112 80 134',
      draw: () => tube('M0 14 L8 -92', '#c48c52', 3) + `<circle cx="8.3" cy="-95" r="4" fill="${GOLD}" ${ln(2)}/>` +
        `<g transform="translate(8 -88)"><g><animateTransform attributeName="transform" type="skewY" values="0;-7;0;7;0" dur="2.4s" repeatCount="indefinite"/>` +
        `<rect x="0" y="0" width="42" height="26" rx="2" fill="#2f6fd0" ${ln()}/>` +
        `<path d="M13 1.5 H18.5 V24.5 H13 Z M1.5 10.4 H40.5 V15.6 H1.5 Z" fill="${GOLD}"/>` +
        '<path d="M28 4 Q32 13 28 22" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.35"/></g></g>',
    },
    { id: 'sword', name: 'Wooden sword', price: 80,
      box: '-24 -112 74 136',
      draw: () => '<g transform="rotate(20)">' +
        `<path d="M-5 -12 L-5 -92 L0 -104 L5 -92 L5 -12 Z" fill="#e3b27a" ${ln()}/><path d="M0 -20 V-90" stroke="#c48c52" stroke-width="2"/>` +
        `<rect x="-3.5" y="-10" width="7" height="24" rx="2" fill="#8a5a3a" ${ln(2)}/>` +
        `<rect x="-15" y="-16" width="30" height="8" rx="4" fill="#a8703f" ${ln()}/><circle cx="0" cy="16" r="4.5" fill="#a8703f" ${ln(2)}/></g>`,
    },
    // New Year / winter: a sparkler, its sparks twinkling.
    { id: 'sparkler', name: 'Sparkler', price: 100,
      box: '-20 -100 80 122',
      draw: () => {
        let rays = '';
        for (let i = 0; i < 10; i++) {
          const a = i * Math.PI / 5 + 0.3, r1 = 7, r2 = i % 2 ? 15 : 20;
          rays += `<path d="M${f1(23 + Math.cos(a) * r1)} ${f1(-60 + Math.sin(a) * r1)} L${f1(23 + Math.cos(a) * r2)} ${f1(-60 + Math.sin(a) * r2)}" stroke="${i % 3 ? GOLD_D : '#ff9d2e'}" stroke-width="2.5" stroke-linecap="round"/>`;
        }
        return tube('M0 12 L22 -58', '#a8a6c0', 2) + tube('M17 -40 L22 -58', '#6d6a85', 3) +
          `<circle class="an-glow" cx="23" cy="-60" r="11" fill="#fff3a0"/>` +
          `<g class="an-twinkle">${rays}</g><g transform="rotate(18 23 -60)"><g class="an-twinkle an-d2">${rays}</g></g>` +
          `<circle cx="23" cy="-60" r="4.5" fill="#fff" ${ln(1.5)}/>` + spark(44, -76, 5) + spark(4, -80, 4) + spark(46, -46, 4);
      },
    },
    // Halloween: a friendly ghost balloon floating on its string.
    { id: 'ghostballoon', name: 'Ghost balloon', price: 120,
      box: '-24 -118 72 142',
      draw: () => '<g class="an-float"><path d="M0 0 Q-8 -30 10 -52 Q16 -58 18 -62" fill="none" stroke="#3b2f5c" stroke-width="2"/>' +
        `<path d="M0 -84 C0 -110 36 -110 36 -84 L36 -62 Q31 -56 27 -62 Q22 -56 18 -62 Q13 -56 9 -62 Q4 -56 0 -62 Z" fill="#fff" ${ln()}/>` +
        `<ellipse cx="12" cy="-86" rx="3" ry="4.5" fill="${INK}"/><ellipse cx="24" cy="-86" rx="3" ry="4.5" fill="${INK}"/>` +
        '<circle cx="11" cy="-87.5" r="1.2" fill="#fff"/><circle cx="23" cy="-87.5" r="1.2" fill="#fff"/>' +
        '<ellipse cx="7" cy="-79" rx="3.5" ry="2" fill="#ffb3c9"/><ellipse cx="29" cy="-79" rx="3.5" ry="2" fill="#ffb3c9"/>' +
        `<ellipse cx="18" cy="-76" rx="3.5" ry="4" fill="${INK}"/><path d="M6 -100 Q8 -104 12 -104" fill="none" stroke="#e6e2f5" stroke-width="3" stroke-linecap="round"/></g>`,
    },
    // Halloween: a trick-or-treat pumpkin bucket full of sweets.
    { id: 'pumpkinbucket', name: 'Trick-or-treat bucket', price: 150,
      box: '-34 -30 68 84',
      draw: () => '<g class="an-bob">' + tube('M12 14 L16 -8', '#fff', 2.5) + `<circle cx="16" cy="-11" r="6.5" fill="#b892ff" ${ln(2)}/>` +
        `<path d="M-15 6 L-19 1 L-18 10 Z M-3 6 L1 1 L0 10 Z" fill="#ff6fae" ${ln(1.5)}/><ellipse cx="-9" cy="6" rx="6.5" ry="4.5" fill="#ff6fae" ${ln(2)}/>` +
        `<circle cx="4" cy="8" r="5" fill="${GOLD}" ${ln(1.5)}/></g>` +
        `<ellipse cx="-11" cy="30" rx="14" ry="17" fill="#ff8a1f" ${ln()}/><ellipse cx="11" cy="30" rx="14" ry="17" fill="#ff8a1f" ${ln()}/>` +
        `<ellipse cx="0" cy="30" rx="14" ry="18" fill="#ff9d2e" ${ln()}/>` +
        `<ellipse cx="0" cy="14" rx="15" ry="3.5" fill="#a84d0c" ${ln(2)}/>` +
        `<path d="M-9 25 L-5 19 L-1 25 Z M1 25 L5 19 L9 25 Z" fill="${DARK}"/><path d="M-9 32 Q0 42 9 32 L5 33 L3 36 L0 34 L-3 36 L-5 33 Z" fill="${DARK}"/>` +
        `<path d="M-15 14 Q-14 -6 0 -2 Q14 -6 15 14" fill="none" ${ln(2.5)}/>` + shine('M-20 24 Q-20 18 -16 15', 2.5),
    },
    // Swedish crayfish party: a paper moon lantern on a stick, swinging.
    { id: 'lanternstick', name: 'Crayfish party lantern', price: 200,
      box: '-22 -108 86 132',
      draw: () => tube('M0 12 L30 -78', '#c48c52', 3) +
        `<g>${swing(31, -80, 7, 2.8)}<path d="M31 -80 V-72" stroke="${INK}" stroke-width="2"/>` +
        `<rect x="24" y="-74" width="14" height="5" rx="2" fill="${DARK}" ${ln(1.5)}/>` +
        `<circle cx="31" cy="-50" r="20" fill="#ffcf3f" ${ln()}/>` +
        '<ellipse cx="31" cy="-50" rx="10" ry="19" fill="none" stroke="#e8a92a" stroke-width="2"/><path d="M31 -69 V-31" stroke="#e8a92a" stroke-width="2"/>' +
        `<path d="M22 -54 Q25 -57 28 -54 M34 -54 Q37 -57 40 -54" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>` +
        `<path d="M25 -46 Q31 -40 37 -46" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>` +
        '<circle cx="21" cy="-47" r="2.5" fill="#ff8f6b"/><circle cx="41" cy="-47" r="2.5" fill="#ff8f6b"/>' +
        `<rect x="26" y="-32" width="10" height="4" rx="1.5" fill="${DARK}" ${ln(1.5)}/><path d="M31 -28 V-20" stroke="${RED}" stroke-width="3" stroke-linecap="round"/></g>`,
    },
    // A butterfly net with a butterfly fluttering just out of reach.
    { id: 'butterflynet', name: 'Butterfly net', price: 250,
      box: '-30 -128 94 152',
      draw: () => {
        const wings = `<ellipse cx="-7" cy="-4" rx="7" ry="6" fill="#ff8fc7" ${ln(1.5)}/><ellipse cx="7" cy="-4" rx="7" ry="6" fill="#ff8fc7" ${ln(1.5)}/>` +
          `<ellipse cx="-5" cy="5" rx="5" ry="4" fill="${GOLD}" ${ln(1.5)}/><ellipse cx="5" cy="5" rx="5" ry="4" fill="${GOLD}" ${ln(1.5)}/>`;
        return tube('M0 14 L28 -70', '#c48c52', 3.5) +
          `<path d="M26 -84 Q30 -54 46 -58 Q56 -64 52 -86 Z" fill="#fff" opacity="0.85" ${ln(2)}/>` +
          '<path d="M32 -84 Q36 -66 44 -60 M40 -86 Q44 -70 50 -64 M28 -74 Q40 -74 52 -76 M30 -64 Q40 -64 50 -68" fill="none" stroke="#c9c3e0" stroke-width="1.5"/>' +
          `<ellipse cx="39" cy="-85" rx="14" ry="5" fill="none" stroke="${INK}" stroke-width="6"/><ellipse cx="39" cy="-85" rx="14" ry="5" fill="none" stroke="#5fbf5a" stroke-width="2.5"/>` +
          `<g class="an-float"><g transform="translate(6 -108) rotate(-15)"><g>${flap(0.45)}${wings}</g>` +
          `<ellipse cx="0" cy="0" rx="2" ry="8" fill="${DARK}"/><path d="M-1 -7 L-4 -12 M1 -7 L4 -12" stroke="${DARK}" stroke-width="1.5" stroke-linecap="round"/></g></g>`;
      },
    },
    // A bubble wand, soap bubbles rising.
    { id: 'bubblewand', name: 'Bubble wand', price: 300,
      box: '-26 -150 90 176',
      draw: () => tube('M0 12 L19 -50', '#7fd4ff', 4) +
        '<circle cx="23" cy="-62" r="10" fill="#d9f4ff" opacity="0.6"/>' +
        `<circle cx="23" cy="-62" r="11" fill="none" stroke="${INK}" stroke-width="8"/><circle cx="23" cy="-62" r="11" fill="none" stroke="#ff6fae" stroke-width="3.5"/>` +
        [[32, -84, 7, 1], [46, -74, 4.5, 2], [16, -92, 5, 3], [42, -100, 6, 4], [26, -108, 4, 0]].map(([x, y, r, d]) =>
          `<g class="an-rise${d ? ' an-d' + d : ''}"><circle cx="${x}" cy="${y}" r="${r}" fill="#bfeaff" fill-opacity="0.45" stroke="#5aa9e6" stroke-width="1.5"/>` +
          `<path d="M${f1(x - r * 0.6)} ${f1(y - r * 0.1)} Q${f1(x - r * 0.5)} ${f1(y - r * 0.6)} ${f1(x - r * 0.1)} ${f1(y - r * 0.65)}" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></g>`).join(''),
    },
    { id: 'wand', name: 'Magic wand', price: 350,
      box: '-18 -94 72 116',
      draw: () => tube('M-3 14 L18 -44', DARK, 4) + tube('M15 -36 L18 -44', '#fff', 4) +
        `<g class="an-pulse"><path d="${star(20, -58, 16)}" fill="${GOLD}" ${ln()}/></g>` +
        spark(42, -72, 6) + spark(2, -82, 5) + spark(38, -40, 4),
    },
    // Knights: a flaming torch, the fire flickering and embers rising.
    { id: 'flametorch', name: 'Knight torch', price: 500,
      box: '-30 -128 84 154',
      draw: () => '<g transform="rotate(16)">' +
        `<path d="M-5 16 L-6 -44 L6 -44 L5 16 Z" fill="#8a5a3a" ${ln()}/>` +
        '<path d="M-6 -30 L6 -36 M-6 -20 L6 -26 M-5 -10 L6 -16" stroke="#e3c48c" stroke-width="3" stroke-linecap="round"/>' +
        flip('an-flicker', `<path d="${fireD(0, -50, 16, 50)}" fill="${RED}" ${ln()}/>` +
          `<path d="${fireD(0, -50, 10, 34)}" fill="#ff9d2e"/><path d="${fireD(0, -50, 5.5, 18)}" fill="#fff3a0"/>`) +
        `<path d="M-12 -52 L12 -52 L8 -40 L-8 -40 Z" fill="#8a96ad" ${ln()}/><path d="M-12 -52 H12" stroke="#b8c2d6" stroke-width="2"/>` +
        '</g>' +
        [[2, -104, 1], [24, -96, 3], [12, -116, 2]].map(([x, y, d]) => `<circle class="an-rise an-d${d}" cx="${x}" cy="${y}" r="2.4" fill="${GOLD}" ${ln(1)}/>`).join(''),
    },
    { id: 'guitar', name: 'Guitar', price: 600,
      box: '-34 -72 92 110',
      draw: () => '<g transform="rotate(36) scale(1.1)">' +
        `<rect x="-3.5" y="-60" width="7" height="62" fill="#8a5a3a" ${ln(2)}/>` +
        `<path d="M-6 -60 L-5 -74 L5 -74 L6 -60 Z" fill="${DARK}" ${ln(2)}/>` +
        `<path d="M0 0 C-14 -2 -14 12 -9 16 C-18 20 -16 36 0 36 C16 36 18 20 9 16 C14 12 14 -2 0 0 Z" fill="${RED}" ${ln()}/>` +
        `<circle cx="0" cy="14" r="5" fill="${DARK}"/><rect x="-6" y="24" width="12" height="4" rx="1.5" fill="${DARK}"/>` +
        '<path d="M-1.5 -58 V26 M1.5 -58 V26" stroke="#fff" stroke-width="0.8" opacity="0.8"/>' +
        `<circle cx="-7" cy="-70" r="1.8" fill="#fff"/><circle cx="7" cy="-70" r="1.8" fill="#fff"/><circle cx="-7" cy="-64" r="1.8" fill="#fff"/><circle cx="7" cy="-64" r="1.8" fill="#fff"/></g>`,
    },
    // A golden wand topped with a rainbow between two clouds, the rainbow glowing.
    { id: 'rainbowwand', name: 'Rainbow wand', price: 800,
      box: '-28 -110 92 134',
      draw: () => {
        const C = ['#ff5a5f', '#ff9d2e', '#ffd23f', '#5fbf5a', '#4f8cff', '#9b6cff'];
        let arcs = `<path d="M2 -64 A20 20 0 0 1 42 -64" fill="none" stroke="${INK}" stroke-width="${C.length * 3.2 + 4}"/>`;
        C.forEach((c, i) => {
          const r = f1(20 + (2.5 - i) * 3.2);
          arcs += `<path d="M${f1(22 - r)} -64 A${r} ${r} 0 0 1 ${f1(22 + r)} -64" fill="none" stroke="${c}" stroke-width="3.4"/>`;
        });
        return tube('M-3 14 L3 -56', GOLD, 4) + `<circle cx="-3" cy="15" r="4" fill="${GOLD_D}" ${ln(2)}/>` +
          `<g class="an-glow"><path d="M-12 -64 A34 34 0 0 1 56 -64" fill="none" stroke="#fff3b0" stroke-width="6" stroke-linecap="round"/></g>` +
          `<g class="an-pulse">${arcs}</g>` +
          puff([[-4, -62, 8], [6, -60, 9], [1, -68, 7]], '#fff') + puff([[38, -60, 9], [48, -62, 8], [43, -68, 7]], '#fff') +
          spark(22, -100, 6) + spark(54, -88, 5) + spark(-14, -86, 4);
      },
    },
    // Sport: a shiny golden trophy cup.
    { id: 'goldtrophy', name: 'Golden trophy', gems: 10,
      box: '-40 -94 96 124',
      draw: () => '<g transform="rotate(12)">' +
        `<path d="M-20 -56 Q-36 -56 -32 -42 Q-28 -32 -14 -32 M20 -56 Q36 -56 32 -42 Q28 -32 14 -32" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>` +
        `<path d="M-20 -56 Q-36 -56 -32 -42 Q-28 -32 -14 -32 M20 -56 Q36 -56 32 -42 Q28 -32 14 -32" fill="none" stroke="${GOLD_D}" stroke-width="3.5" stroke-linecap="round"/>` +
        `<rect x="-4" y="-22" width="8" height="30" fill="${GOLD_D}" ${ln(2)}/>` +
        `<path d="M-22 -64 L22 -64 Q24 -26 0 -20 Q-24 -26 -22 -64 Z" fill="${GOLD}" ${ln()}/>` +
        `<ellipse cx="0" cy="-64" rx="22" ry="5" fill="${GOLD_D}" ${ln(2)}/>` +
        `<path d="${star(0, -44, 9)}" fill="${GOLD_D}" ${ln(1.5)}/><circle cx="0" cy="-44" r="2.5" fill="${RUBY}"/>` +
        `<path d="M-14 8 L14 8 L16 18 L-16 18 Z" fill="#8a5a3a" ${ln()}/><rect x="-7" y="11" width="14" height="4" rx="1" fill="${GOLD}"/>` +
        shine('M-15 -56 Q-14 -38 -8 -30') + '</g>' +
        spark(36, -76, 7) + spark(-26, -70, 5) + spark(44, -34, 4),
    },
    // A glowing dragon egg that wiggles now and then, about to hatch.
    { id: 'dragonegg', name: 'Dragon egg', gems: 15,
      box: '-32 -88 86 108',
      draw: () => '<g><animateTransform attributeName="transform" type="rotate" values="0 16 -6;0 16 -6;-6 16 -6;6 16 -6;-4 16 -6;0 16 -6" dur="2.6s" repeatCount="indefinite"/>' +
        `<path d="M16 -66 C32 -66 40 -38 38 -24 C36 -6 -4 -6 -6 -24 C-8 -38 0 -66 16 -66 Z" fill="#6c5ce7" ${ln()}/>` +
        [[8, -52], [22, -54], [2, -36], [16, -40], [30, -38], [8, -22], [24, -22]].map(([x, y]) =>
          `<path d="M${x - 5} ${y} Q${x} ${y + 6} ${x + 5} ${y}" fill="none" stroke="#9b8cf5" stroke-width="2.5" stroke-linecap="round"/>`).join('') +
        `<path class="an-glow" d="M-3 -32 L5 -28 L11 -36 L18 -28 L25 -35 L31 -29 L37 -31" fill="none" stroke="${GOLD}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>` +
        `<circle cx="10" cy="-46" r="2.5" fill="${GEM}"/><circle cx="26" cy="-48" r="2" fill="${RUBY}"/>` +
        shine('M4 -48 Q6 -58 12 -62') + '</g>' +
        spark(42, -66, 6) + spark(-12, -56, 4) + spark(46, -36, 4),
    },
    { id: 'scepter', name: 'Diamond scepter', gems: 25,
      box: '-30 -130 84 166',
      draw: () => '<g transform="rotate(16)">' + tube('M0 22 L0 -82', GOLD, 6) +
        `<circle cx="0" cy="24" r="6" fill="${GOLD_D}" ${ln(2)}/><rect x="-6" y="-14" width="12" height="6" rx="3" fill="${GOLD_D}" ${ln(2)}/>` +
        `<path d="M-14 -84 Q0 -78 14 -84 L10 -92 H-10 Z" fill="${GOLD_D}" ${ln(2)}/>` +
        `<path d="M-14 -104 L-8 -114 H8 L14 -104 L0 -88 Z" fill="${GEM}" ${ln()}/>` +
        `<path d="M-14 -104 H14 M-4 -114 L-6 -104 L0 -88 M4 -114 L6 -104 L0 -88" fill="none" ${ln(1.5)}/>` +
        '<path d="M-9 -108 L-6 -112" stroke="#fff" stroke-width="2" stroke-linecap="round"/></g>' +
        spark(30, -124, 7) + spark(-2, -112, 5) + spark(42, -88, 4),
    },
    // A crystal ball on a golden stand, glowing, little stars swirling inside.
    { id: 'crystalorb', name: 'Crystal ball', gems: 40,
      box: '-40 -102 102 132',
      draw: () => {
        let stars = '';
        for (let i = 0; i < 4; i++) {
          const a = i * Math.PI / 2;
          stars += `<path d="${star(f1(Math.cos(a) * 11), f1(-48 + Math.sin(a) * 11), i % 2 ? 3.5 : 5)}" fill="#fff"/>`;
        }
        return '<g transform="rotate(14)">' +
          `<circle class="an-glow" cx="0" cy="-48" r="30" fill="#e9dcff"/>` +
          `<rect x="-4" y="-16" width="8" height="26" rx="2" fill="${GOLD_D}" ${ln(2)}/>` +
          `<circle cx="0" cy="-48" r="22" fill="#9b7bff" ${ln()}/><circle cx="-3" cy="-51" r="15" fill="#b9a3ff"/>` +
          `<g class="an-spin">${stars}</g>` + shine('M-14 -58 Q-10 -66 -2 -68') +
          `<path d="M-18 -30 Q-14 -22 0 -20 Q14 -22 18 -30 L14 -16 Q0 -10 -14 -16 Z" fill="${GOLD}" ${ln()}/>` +
          `<circle cx="0" cy="-18" r="3" fill="${RUBY}" ${ln(1.2)}/><circle cx="-10" cy="-21" r="2" fill="${GEM}"/><circle cx="10" cy="-21" r="2" fill="${GEM}"/>` +
          '</g>' + spark(40, -86, 7) + spark(-24, -76, 5) + spark(42, -40, 4) + spark(-6, -96, 4);
      },
    },
  ]);
})();
