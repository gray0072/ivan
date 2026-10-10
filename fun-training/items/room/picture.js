// Pictures (centre; x -85..85, y -67..67).
// Cheap to elite; each entry is the catalog item (ITEMS) and its drawing (ROOM_ART), added by addItems.

(() => {
  const { r1, dot, star, sparkle, flip, cloud, crown, gem, head } = ROOM_KIT;
  // A wooden picture frame (outer w × h) with the picture area inset by b, filled with bg.
  const frame = (w, h, b, col, bg) => `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="4" fill="${col}" ${ln()}/>` +
    `<rect x="${-w / 2 + b}" y="${-h / 2 + b}" width="${w - 2 * b}" height="${h - 2 * b}" fill="${bg}" ${ln(2)}/>`;
  const edge = (w, h, b) => `<rect x="${-w / 2 + b}" y="${-h / 2 + b}" width="${w - 2 * b}" height="${h - 2 * b}" fill="none" ${ln(2)}/>`;
  const tape = (x, y, a) => `<rect x="${x - 13}" y="${y - 5}" width="26" height="10" fill="#f3e3a0" opacity="0.85" transform="rotate(${a} ${x} ${y})"/>`;
  // A Dala horse facing right, about 50 × 38, centred near (0, 0); w — the outline width.
  const dalaHorse = (w = 2) => `<path d="M-20 -5Q-28 -2 -26 9" fill="none" stroke="${INK}" stroke-width="${w + 2}" stroke-linecap="round"/>` +
    `<path d="M-21 -6H6L10 -18Q12 -21 16 -20L24 -14Q27 -11 24 -9L18 -9L16 -2V16H10V6H-12V16H-18V4Q-22 2 -21 -6Z" fill="#d6262e" ${ln(w)}/>` +
    `<path d="M-12 -6Q-4 5 5 -6Z" fill="#ffd23f" ${ln(w * 0.6)}/>` +
    '<path d="M7 -9Q12 -6 16 -12M-17 0Q-15 3 -13 0M-12 6H10" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>' +
    `<path d="${dot(-4, -2, 1.4)}${dot(15, -4, 1.2)}" fill="#5cc05a"/><path d="${dot(18, -15, 1.3)}" fill="${INK}"/>`;
  const fish = (col, fin) => `<path d="M-9 0L-16 -6V6Z" fill="${fin}" ${ln(1.5)}/><ellipse cx="0" cy="0" rx="11" ry="7" fill="${col}" ${ln(1.5)}/>` +
    `<path d="M-1 -6Q3 0 -1 6" fill="none" stroke="${fin}" stroke-width="2"/><path d="${dot(5, -2, 1.5)}" fill="${INK}"/>`;
  const moon = (x, y, r) => `<path d="M${x} ${y - r}A${r} ${r} 0 1 0 ${x} ${y + r}A${r * 1.3} ${r * 1.3} 0 0 1 ${x} ${y - r}Z" fill="#fff3a0" ${ln(1.5)}/>`;
  // Another character, head and shoulders (friends in the family portrait).
  const friend = (id, x, y, w) => `<svg viewBox="22 -22 156 170" x="${x}" y="${y}" width="${w}" height="${r1(w * 170 / 156)}">` +
    `${Look.inner(id, {}, 'happy')}</svg>`;

  addItems('picture', ROOM_ART, [
    { id: 'stickynote', name: 'Sticky note doodle', price: 10,
      draw: () => `<g transform="rotate(5)"><path d="M-34 -36H34V22L22 34H-34Z" fill="#fff07a" ${ln(2)}/>` +
        '<rect x="-33" y="-35" width="66" height="10" fill="#f5e35a"/>' +
        `<path d="M34 22H22V34Z" fill="#e8d84f" ${ln(2)}/>` +
        '<circle cx="-8" cy="-4" r="13" fill="none" stroke="#3a5bd9" stroke-width="2.5"/>' +
        '<path d="M-13 -8v2M-3 -8v2M-14 0Q-8 6 -2 0M-26 22q5 -4 10 0t10 0t10 0" fill="none" stroke="#3a5bd9" stroke-width="2.5" stroke-linecap="round"/>' +
        '<path d="M18 -14q-4 -6 -8 -1q-3 5 8 11q11 -6 8 -11q-4 -5 -8 1Z" fill="none" stroke="#ff4f6b" stroke-width="2.5" stroke-linejoin="round"/></g>',
    },
    { id: 'drawing', name: 'Sun drawing', price: 15,
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
    { id: 'crayoncat', name: 'Crayon cat drawing', price: 20,
      draw: () => {
        const cr = (d, col, w = 3.5) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
        return `<g transform="rotate(3)"><rect x="-52" y="-44" width="104" height="86" fill="#fffef8" ${ln(2)}/>` +
          cr('M-48 36l5 -8l4 8l5 -8l4 8l5 -8l4 8l5 -8l4 8l5 -8l4 8l5 -8l4 8l5 -8l4 8l5 -8l4 8l5 -8l4 8', '#5cc05a', 3) +
          '<ellipse cx="6" cy="16" rx="22" ry="14" fill="#ffc27a" opacity="0.7"/><circle cx="-16" cy="-6" r="14" fill="#ffc27a" opacity="0.7"/>' +
          cr('M-12 4Q4 0 22 4Q30 14 24 24Q6 32 -12 26Q-20 16 -12 4ZM28 14Q44 10 38 -10', '#ff9a2e') +
          cr('M-29 -6A13 13 0 1 1 -3 -6A13 13 0 1 1 -29 -6ZM-27 -13L-26 -26L-18 -18M-14 -18L-6 -26L-5 -13', '#ff9a2e') +
          cr('M-21 -8v1M-11 -8v1M-18 -2q2 2 4 0', '#3b2f5c', 2.5) +
          cr('M-26 -2H-38M-26 1L-37 5M-6 -2H6M-6 1L5 5', '#8a8fa8', 1.5) +
          cr('M34 -32q-3 -5 -7 -1q-2 4 7 9q9 -5 7 -9q-4 -4 -7 1Z', '#ff4f6b', 2.5) + '</g>' + tape(0, -46, -6);
      },
    },
    { id: 'rocketposter', name: 'Rocket poster', price: 30,
      draw: () => {
        let st = '';
        for (let i = 0; i < 9; i++) st += dot(-42 + ((i * 37) % 84), -52 + ((i * 53) % 100), 1.5);
        return `<path d="M-50 -60H50V46L36 60H-50Z" fill="#2c3e7a" ${ln(2)}/><path d="M50 46H36V60Z" fill="#8fa4d8" ${ln(2)}/>` +
          `<path d="${st}" fill="#fff"/><circle cx="28" cy="-36" r="9" fill="#ff9fbf" ${ln(1.5)}/>` +
          '<ellipse cx="28" cy="-36" rx="16" ry="4" fill="none" stroke="#ffd23f" stroke-width="2"/>' +
          `<g class="an-twinkle"><path d="${star(-30, -40, 6)}" fill="#ffe27a"/></g><g class="an-twinkle an-d2"><path d="${star(34, 30, 5)}" fill="#ffe27a"/></g>` +
          `<g class="an-flicker"><path d="M-14 22Q-4 50 6 22Z" fill="#ffa62b" ${ln(1.5)}/><path d="M-9 22Q-4 38 1 22Z" fill="#fff3a0"/></g>` +
          `<path d="M-14 4L-26 24L-14 18ZM6 4L18 24L6 18Z" fill="#ff4f4f" ${ln(2)}/>` +
          `<path d="M-4 -42Q10 -26 8 18H-16Q-18 -26 -4 -42Z" fill="#fff" ${ln(2)}/>` +
          `<path d="M-4 -42Q4 -34 6 -26H-14Q-12 -34 -4 -42Z" fill="#ff4f4f" ${ln(2)}/>` +
          `<circle cx="-4" cy="-10" r="6" fill="#7fd0f5" ${ln(2)}/>` +
          `<path d="${dot(-44, -54, 3)}${dot(44, -54, 3)}${dot(-44, 54, 3)}" fill="#ff4f6b" ${ln(1)}/>`;
      },
    },
    { id: 'dalaprint', name: 'Dala horse print', price: 40,
      draw: () => {
        let fl = '';
        for (const [x, y] of [[-40, 34], [40, 34]]) for (let i = 0; i < 5; i++) { const a = i * Math.PI * 0.4; fl += dot(x + Math.cos(a) * 4, y + Math.sin(a) * 4, 3); }
        return frame(124, 108, 9, '#e8c48a', '#fdf6e4') +
          '<rect x="-47" y="-39" width="94" height="78" fill="none" stroke="#2f6fbf" stroke-width="2.5"/>' +
          `<g transform="translate(-2 2) scale(1.55)">${dalaHorse(1.6)}</g>` +
          `<path d="${fl}" fill="#2f6fbf"/><path d="${dot(-40, 34, 2)}${dot(40, 34, 2)}" fill="#ffd23f"/>` +
          '<path d="M-30 32H30" stroke="#5cc05a" stroke-width="3" stroke-linecap="round"/>' + edge(124, 108, 9);
      },
    },
    { id: 'falucottage', name: 'Falu-red cottage painting', price: 60,
      draw: () => frame(160, 120, 12, '#8a5428', '#a9dcff') +
        cloud(14, -36, 0.8) + `<circle cx="-46" cy="-30" r="8" fill="#ffd23f"/>` +
        '<path d="M-68 18Q-20 8 20 16Q48 10 68 16V48H-68Z" fill="#7fd36a"/>' +
        `<path d="M-48 -8L-12 -34L24 -8Z" fill="#3e3b4f" ${ln(2)}/><rect x="6" y="-30" width="7" height="12" fill="#b3261e" ${ln(1.5)}/>` +
        `<rect x="-42" y="-8" width="60" height="38" fill="#b3261e" ${ln(2)}/>` +
        '<path d="M-40 -6V28M16 -6V28" stroke="#fff" stroke-width="4"/>' +
        `<rect x="-30" y="8" width="12" height="22" fill="#fff" ${ln(1.5)}/><rect x="-27" y="11" width="6" height="19" fill="#5b8fd9"/>` +
        `<rect x="-6" y="2" width="14" height="13" fill="#7fd0f5" stroke="#fff" stroke-width="3"/><path d="M1 2V15M-6 8.5H8" stroke="#fff" stroke-width="2"/>` +
        '<path d="M44 34V-4" stroke="#fff" stroke-width="5"/><path d="M44 30v-4M44 18v-4M44 6v-3" stroke="#3b2f5c" stroke-width="2"/>' +
        `<path d="${dot(44, -12, 11)}${dot(36, -2, 8)}${dot(52, -2, 8)}" fill="#5ab84f" stroke="${INK}" stroke-width="3"/>` +
        `<path d="${dot(44, -12, 11)}${dot(36, -2, 8)}${dot(52, -2, 8)}" fill="#5ab84f"/>` +
        `<path d="M-58 34V-30" stroke="${INK}" stroke-width="2.5"/>` +
        `<rect x="-57" y="-30" width="20" height="13" fill="#2f6fbf" ${ln(1.2)}/><path d="M-51 -30V-17M-57 -23.5H-37" stroke="#ffd23f" stroke-width="3"/>` +
        edge(160, 120, 12),
    },
    { id: 'moosepainting', name: 'Moose in the forest', price: 80,
      draw: () => {
        const spruce = (x, y, s) => `M${x} ${y - 30 * s}L${x + 10 * s} ${y - 14 * s}H${x + 5 * s}L${x + 14 * s} ${y}H${x - 14 * s}L${x - 5 * s} ${y - 14 * s}H${x - 10 * s}Z`;
        const antler = s => `M${-30 + s * 4} -14Q${-30 + s * 16} -18 ${-30 + s * 20} -30L${-30 + s * 14} -26L${-30 + s * 13} -34L${-30 + s * 8} -26L${-30 + s * 4} -32Q${-30 + s * 2} -22 ${-30 + s * 4} -14Z`;
        return frame(160, 120, 12, '#6b4a2e', '#ffd9a0') +
          '<circle cx="34" cy="-20" r="14" fill="#ffb36b"/>' +
          '<path d="M-68 14Q-30 0 0 10Q36 -2 68 10V48H-68Z" fill="#8fcf6a"/>' +
          `<path d="${spruce(-54, 20, 1.1)}${spruce(-34, 10, 0.8)}${spruce(52, 22, 1.2)}${spruce(34, 8, 0.7)}" fill="#2f7a4a" ${ln(1.5)}/>` +
          `<path d="M-4 24V40M2 26V40M22 26V40M28 24V40" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>` +
          '<path d="M-4 24V40M2 26V40M22 26V40M28 24V40" stroke="#8a5a33" stroke-width="4" stroke-linecap="round"/>' +
          `<path d="M-6 10Q-14 2 -22 -4" stroke="${INK}" stroke-width="13" stroke-linecap="round"/><path d="M-6 10Q-14 2 -22 -4" stroke="#8a5a33" stroke-width="9" stroke-linecap="round"/>` +
          `<ellipse cx="12" cy="16" rx="24" ry="13" fill="#8a5a33" ${ln(2)}/>` +
          `<path d="${antler(-1)}${antler(1)}" fill="#e8c48a" ${ln(1.5)}/>` +
          `<ellipse cx="-30" cy="-8" rx="10" ry="9" fill="#8a5a33" ${ln(2)}/><ellipse cx="-36" cy="0" rx="9" ry="7" fill="#a8744a" ${ln(2)}/>` +
          `<path d="${dot(-30, -11, 1.8)}${dot(-39, -1, 1.2)}${dot(-33, -1, 1.2)}" fill="${INK}"/><path d="M-40 4Q-36 7 -32 4" fill="none" ${ln(1.5)}/>` +
          edge(160, 120, 12);
      },
    },
    { id: 'hauntedpainting', name: 'Haunted house painting', price: 100,
      draw: () => {
        const bat = (x, y) => `M${x - 8} ${y}Q${x - 4} ${y - 6} ${x} ${y - 1}Q${x + 4} ${y - 6} ${x + 8} ${y}Q${x + 4} ${y - 1} ${x} ${y + 3}Q${x - 4} ${y - 1} ${x - 8} ${y}Z`;
        return frame(150, 120, 11, '#4a3f63', '#3b2a6b') +
          `<circle cx="36" cy="-26" r="13" fill="#fff3b0"/><circle cx="41" cy="-30" r="3" fill="#f0e08a"/>` +
          '<path d="M-64 30Q-20 14 20 22Q44 16 64 24V49H-64Z" fill="#2a2140"/>' +
          `<path d="M-34 32V-4L-38 -6L-10 -36L18 -8L14 -4V32Z" fill="#6a5a8f" ${ln(2)}/>` +
          `<path d="M-30 -20V-36H-22V-28" fill="#6a5a8f" ${ln(2)}/>` +
          `<rect x="-26" y="-2" width="10" height="10" fill="#ffd23f" ${ln(1.5)}/>` +
          `<rect class="an-blink" x="0" y="-2" width="10" height="10" fill="#ffd23f" ${ln(1.5)}/>` +
          `<circle class="an-blink an-d2" cx="-10" cy="-16" r="5" fill="#ffd23f" ${ln(1.5)}/>` +
          `<path d="M-14 32V20A5 5 0 0 1 -6 20V32Z" fill="#2a2140" ${ln(1.5)}/>` +
          `<g class="an-float"><path d="${bat(-46, -30)}${bat(-30, -42)}" fill="#1c1630"/></g>` +
          `<circle cx="40" cy="32" r="10" fill="#ff9a2e" ${ln(1.5)}/><path d="M40 22q1 -4 4 -5" stroke="#3f8a3a" stroke-width="2.5" stroke-linecap="round"/>` +
          `<path d="M35 30l2 -3l2 3zM41 30l2 -3l2 3zM35 35q5 4 10 0" fill="#ffd23f" ${ln(1.2)}/>` +
          edge(150, 120, 11);
      },
    },
    { id: 'landscape', name: 'Mountain painting', price: 120,
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
    { id: 'vikingpainting', name: 'Viking ship painting', price: 150,
      draw: () => {
        let sh = '';
        for (let i = 0; i < 6; i++) sh += `<circle cx="${-30 + i * 12}" cy="12" r="5" fill="${i % 2 ? '#ffd23f' : '#e5534b'}" ${ln(1.2)}/>`;
        let st = '';
        for (let i = 0; i < 4; i++) st += `M${-20 + i * 12} -30h6v30h-6z`;
        return frame(160, 120, 12, '#b0703a', '#bfe6ff') +
          '<circle cx="-42" cy="-28" r="9" fill="#ffd23f"/>' + cloud(20, -38, 0.7) +
          '<g class="an-float">' + `<path d="M-2 10V-36" stroke="${INK}" stroke-width="3"/>` +
          `<path d="M-22 -32Q-2 -26 22 -32V2Q-2 6 -22 2Z" fill="#fff" ${ln(2)}/><path d="${st}" fill="#e5534b"/>` +
          `<path d="M-22 -32Q-2 -26 22 -32V2Q-2 6 -22 2Z" fill="none" ${ln(2)}/>` +
          `<path d="M-46 10Q0 30 44 10L50 -2Q56 -12 50 -18Q60 -22 62 -12Q60 -4 52 4L46 14Q0 34 -48 14L-54 2Q-60 -6 -54 -10Q-50 -6 -50 0Z" fill="#9a5b2e" ${ln(2)}/>` +
          `<path d="${dot(55, -14, 1.5)}" fill="#fff"/>` + sh + '</g>' +
          '<path d="M-68 22Q-56 16 -44 22T-20 22T4 22T28 22T52 22Q60 17 68 21V48H-68Z" fill="#3f8ad6"/>' +
          '<path d="M-60 32q6 -4 12 0M-14 38q6 -4 12 0M30 30q6 -4 12 0" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>' +
          edge(160, 120, 12);
      },
    },
    { id: 'ghostportrait', name: 'Friendly ghost portrait', price: 200,
      draw: () => {
        const eye = x => `<ellipse cx="${x}" cy="-8" rx="4.5" ry="6" fill="${INK}"><animate attributeName="ry" values="6;6;0.6;6" keyTimes="0;0.92;0.96;1" dur="4s" repeatCount="indefinite"/></ellipse>`;
        return `<ellipse cx="0" cy="0" rx="62" ry="66" fill="#7b5bb5" ${ln()}/>` +
          '<ellipse cx="0" cy="0" rx="56" ry="60" fill="none" stroke="#ffcf3f" stroke-width="2.5" stroke-dasharray="4 5"/>' +
          `<ellipse cx="0" cy="0" rx="49" ry="53" fill="#d9ccff" ${ln(2)}/>` +
          '<path d="M-42 34Q0 24 42 34" fill="none" stroke="#c4b2f2" stroke-width="10" stroke-linecap="round"/>' +
          '<g class="an-float">' +
          `<path d="M-26 30V-6A26 28 0 0 1 26 -6V30Q20 22 13 30Q6 22 0 30Q-6 22 -13 30Q-20 22 -26 30Z" fill="#fff" ${ln(2.5)}/>` +
          `<path d="M-26 6Q-36 4 -34 -6M26 6Q36 4 34 -6" fill="none" ${ln(2.5)}/>` +
          `<g>${eye(-9)}${eye(9)}<path d="${dot(-8, -11, 1.5)}${dot(10, -11, 1.5)}" fill="#fff"/>` +
          '<animateTransform attributeName="transform" type="translate" values="-3 0;3 0;-3 0" dur="5s" repeatCount="indefinite"/></g>' +
          `<path d="M-5 4Q0 9 5 4" fill="none" ${ln(2)}/><path d="${dot(-17, 2, 3.5)}${dot(17, 2, 3.5)}" fill="#ffb3c7"/>` +
          `<path d="M2 -32l8 -6l1 8zM2 -32l-8 -6l-1 8z" fill="#ff8fb0" ${ln(1.5)}/></g>` +
          `<path d="${dot(0, -63, 5)}" fill="#ffcf3f" ${ln(1.5)}/>`;
      },
    },
    { id: 'wreathpicture', name: 'Christmas wreath', price: 300,
      draw: () => {
        let lv = '', lv2 = '', ber = '';
        const lights = [];
        const cols = ['#ff4f6b', '#ffd23f', '#5ec8ff', '#7be07b'];
        for (let i = 0; i < 24; i++) {
          const a = i / 24 * Math.PI * 2, x = Math.cos(a), y = Math.sin(a);
          lv += dot(x * (i % 2 ? 46 : 34), 8 + y * (i % 2 ? 46 : 34), 7);
          lv2 += dot(x * 40, 8 + y * 40, 5);
          if (i % 3 === 1) lights.push(`<circle class="an-blink${(i % 4) ? ' an-d' + (i % 4) : ''}" cx="${r1(x * 40)}" cy="${r1(8 + y * 40)}" r="3.5" fill="${cols[i % 4]}" ${ln(1)}/>`);
          if (i % 6 === 4) ber += dot(x * 44 - 2, 8 + y * 44, 3) + dot(x * 44 + 3, 10 + y * 44, 3);
        }
        return `<path d="${dot(0, -62, 3)}" fill="#8a8fa8" ${ln(1.5)}/>` +
          flip('an-sway', '<path d="M0 -62L-12 -34M0 -62L12 -34" stroke="#d33a3a" stroke-width="3" stroke-linecap="round"/>' +
            `<circle cx="0" cy="8" r="40" fill="none" stroke="${INK}" stroke-width="31"/><circle cx="0" cy="8" r="40" fill="none" stroke="#2f8a4a" stroke-width="25"/>` +
            `<path d="${lv}" fill="#3a9a52"/><path d="${lv2}" fill="#4cb866"/><path d="${ber}" fill="#e5534b" ${ln(1)}/>` +
            lights.join('') +
            `<path d="M0 46L-18 36Q-24 46 -18 54ZM0 46L18 36Q24 46 18 54Z" fill="#e5534b" ${ln(2)}/>` +
            `<path d="M-2 48L-10 62L-4 60L0 64ZM2 48L10 62L4 60L0 64Z" fill="#c22b3c" ${ln(1.5)}/>` +
            `<circle cx="0" cy="46" r="5" fill="#ff6f80" ${ln(2)}/>` +
            `<path d="${star(0, -32, 7)}" fill="#ffd23f" ${ln(1.5)}/>`);
      },
    },
    { id: 'portrait', name: 'My portrait', price: 400,
      draw: c => `<rect x="-62" y="-66" width="124" height="132" rx="6" fill="#e0a040" ${ln()}/>` +
        `<rect x="-51" y="-55" width="102" height="110" fill="#ffd6e6" ${ln(2)}/>` +
        `<path d="${dot(-38, -40, 3)}${dot(36, -42, 3)}${dot(-40, 30, 3)}${dot(40, 26, 3)}" fill="#fff"/>` +
        head(c, -50, -54, 100) +
        `<rect x="-51" y="-55" width="102" height="110" fill="none" ${ln(2)}/>` +
        `<path d="${dot(-56, -60, 3.5)}${dot(56, -60, 3.5)}${dot(-56, 60, 3.5)}${dot(56, 60, 3.5)}" fill="#ffe08a" ${ln(1.5)}/>`,
    },
    { id: 'aquariumpicture', name: 'Aquarium picture', price: 600,
      draw: () => {
        const weed = (x, h, d) => `<g class="an-sway${d}"><path d="M${x} 44Q${x - 6} ${44 - h / 3} ${x} ${44 - h / 2}T${x} ${44 - h}" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>` +
          `<path d="M${x} 44Q${x - 6} ${44 - h / 3} ${x} ${44 - h / 2}T${x} ${44 - h}" fill="none" stroke="#3fb36a" stroke-width="3.5" stroke-linecap="round"/></g>`;
        return frame(160, 120, 12, '#3a7ca5', '#7fd0f5') +
          '<path d="M-68 -40H68" stroke="#bfeaff" stroke-width="5"/>' +
          '<path d="M-68 34Q-40 28 -10 34Q24 40 68 32V48H-68Z" fill="#f3dc9a"/>' +
          `<path d="M18 46Q18 34 30 34Q42 34 42 46Z" fill="#9aa0b8" ${ln(1.5)}/>` +
          weed(-50, 40, '') + weed(-38, 28, ' an-d2') + weed(54, 34, ' an-d3') +
          `<path d="${star(-12, 40, 6)}" fill="#ff8fb0" ${ln(1.2)}/>` +
          `<g class="an-swim"><g transform="translate(-18 -18)">${fish('#ff9a2e', '#fff3d6')}</g></g>` +
          `<g class="an-swim an-d3"><g transform="translate(20 8) scale(-1 1)">${fish('#ffd23f', '#5b8fd9')}</g></g>` +
          [[-26, 26, 3, ''], [-22, 30, 2, ' an-d2'], [36, 26, 2.5, ' an-d3'], [40, 30, 2, ' an-d1']].map(([x, y, r, d]) =>
            `<circle class="an-rise${d}" cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="0.85" stroke="#4aa8d8" stroke-width="1"/>`).join('') +
          '<path d="M-60 -30L-48 -42M-60 -18L-36 -42" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.5"/>' +
          edge(160, 120, 12);
      },
    },
    { id: 'cuckooclock', name: 'Cuckoo clock', price: 800,
      draw: () => {
        let tk = '';
        for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; tk += dot(Math.cos(a) * 13, -6 + Math.sin(a) * 13, 1.2); }
        const wt = x => `<path d="M${x} 20V40" stroke="${INK}" stroke-width="1.5" stroke-dasharray="2 1.5"/>` +
          `<ellipse cx="${x}" cy="48" rx="5" ry="9" fill="#8a5a33" ${ln(1.5)}/><path d="M${x - 4} 44h8M${x - 4} 50h8" stroke="#5e3a1e" stroke-width="1.5"/>`;
        return wt(-24) + wt(24) +
          flip('an-sway', `<path d="M0 20V46" stroke="${INK}" stroke-width="3"/><circle cx="0" cy="52" r="8" fill="#ffcf3f" ${ln(2)}/>`) +
          `<rect x="-36" y="-40" width="72" height="62" rx="3" fill="#b57a45" ${ln()}/>` +
          `<path d="M-36 14H36" stroke="#8a5428" stroke-width="3"/>` +
          `<path d="M-50 -34L0 -66L50 -34Q40 -38 34 -32Q28 -38 22 -34L0 -50L-22 -34Q-28 -38 -34 -32Q-40 -38 -50 -34Z" fill="#6b3f1e" ${ln(2)}/>` +
          `<path d="M-50 -34L0 -66L50 -34" fill="none" ${ln(2)}/>` +
          `<rect x="-8" y="-50" width="16" height="13" fill="#3b2a1a" ${ln(1.5)}/>` +
          `<g class="an-bob"><circle cx="0" cy="-44" r="5" fill="#ffd23f" ${ln(1.5)}/><path d="M4 -45l5 1l-5 2z" fill="#ff9a2e" ${ln(1)}/>` +
          `<path d="${dot(1, -46, 1)}" fill="${INK}"/></g>` +
          `<path d="M-30 -34Q-24 -26 -30 -18M30 -34Q24 -26 30 -18" fill="none" stroke="#5aa04a" stroke-width="3" stroke-linecap="round"/>` +
          `<circle cx="0" cy="-6" r="18" fill="#fff6e0" ${ln(2)}/><path d="${tk}" fill="${INK}"/>` +
          `<path d="M0 -6V-15" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` +
          `<path d="M0 -6V-20" stroke="#e5534b" stroke-width="2" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" values="0 0 -6;360 0 -6" dur="12s" repeatCount="indefinite"/></path>` +
          `<path d="${dot(0, -6, 2)}" fill="${INK}"/>`;
      },
    },
    { id: 'magicpainting', name: 'Magic painting', price: 1000,
      draw: () => {
        const arc = (r, col) => `<path d="M${-r} 30A${r} ${r * 0.8} 0 0 1 ${r} 30" fill="none" stroke="${col}" stroke-width="5"/>`;
        let rays = '';
        for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; rays += `M${r1(-34 + Math.cos(a) * 14)} ${r1(-24 + Math.sin(a) * 14)}L${r1(-34 + Math.cos(a) * 19)} ${r1(-24 + Math.sin(a) * 19)}`; }
        return `<rect x="-82" y="-62" width="164" height="124" rx="6" fill="#ffcf3f" ${ln()}/>` +
          '<rect x="-76" y="-56" width="152" height="112" rx="3" fill="none" stroke="#e6a823" stroke-width="2.5" stroke-dasharray="4 4"/>' +
          `<rect x="-68" y="-48" width="136" height="96" fill="#9fdcff" ${ln(2)}/>` +
          arc(52, '#ff6f80') + arc(46, '#ffb36b') + arc(40, '#ffe27a') + arc(34, '#7be07b') + arc(28, '#5ec8ff') + arc(22, '#b98cff') +
          `<g class="an-pulse"><path d="${rays}" stroke="#ffb321" stroke-width="3" stroke-linecap="round"/>` +
          `<circle cx="-34" cy="-24" r="10" fill="#ffd23f" stroke="#ffb321" stroke-width="2"/>` +
          `<path d="M-37 -26v1M-31 -26v1M-38 -21Q-34 -18 -30 -21" fill="none" ${ln(1.5)}/></g>` +
          `<g class="an-drift">${cloud(8, -32, 1)}</g><g class="an-drift an-d4">${cloud(-12, -8, 0.7)}</g>` +
          '<path d="M-68 28Q-36 14 -4 26Q30 14 68 26V48H-68Z" fill="#7fd36a"/>' +
          `<path d="${dot(-50, 36, 3)}${dot(-20, 40, 3)}${dot(40, 38, 3)}" fill="#ff8fb0"/><path d="${dot(-34, 40, 3)}${dot(14, 38, 3)}${dot(54, 40, 3)}" fill="#fff"/>` +
          `<rect x="-68" y="-48" width="136" height="96" fill="none" ${ln(2)}/>` +
          sparkle(-74, -54, 7) + sparkle(76, 54, 7) + sparkle(74, -40, 5);
      },
    },
    { id: 'familyportrait', name: 'Family portrait', gems: 10,
      draw: c => {
        const me = (c && c.character) || 'kitty';
        const [f1, f2] = ['bunny', 'puppy', 'panda', 'kitty'].filter(id => id !== me);
        return `<rect x="-84" y="-60" width="168" height="120" rx="6" fill="#ffcf3f" ${ln()}/>` +
          '<rect x="-78" y="-54" width="156" height="108" rx="3" fill="none" stroke="#e6a823" stroke-width="2.5" stroke-dasharray="4 4"/>' +
          `<rect x="-71" y="-47" width="142" height="94" fill="#ffe3c4" ${ln(2)}/>` +
          '<path d="M-71 -36Q-50 -26 -30 -36Q-10 -26 10 -36Q30 -26 50 -36Q60 -30 71 -36" fill="none" stroke="#ff8fb0" stroke-width="3"/>' +
          `<path d="${dot(-50, -31, 3)}${dot(-10, -31, 3)}${dot(30, -31, 3)}" fill="#ffd23f"/><path d="${dot(-30, -36, 3)}${dot(10, -36, 3)}${dot(50, -31, 3)}" fill="#7fd0f5"/>` +
          friend(f1, -72, -8, 54) + friend(f2, 18, -8, 54) + head(c, -30, -26, 60) +
          `<rect x="-71" y="-47" width="142" height="94" fill="none" ${ln(2)}/>` +
          crown(0, -52, 0.8) + gem(-80, 0, 6, '#ff4f7b') + gem(80, 0, 6, '#5ec8ff') +
          sparkle(-72, -54, 8) + sparkle(72, 52, 8) + sparkle(-74, 50, 6);
      },
    },
    { id: 'starrypainting', name: 'Starry night painting', gems: 15,
      draw: () => {
        const stars = [[-50, -34, 5], [-20, -40, 4], [8, -30, 5], [-40, -10, 3.5], [56, -6, 4], [20, -12, 3.5]];
        return `<rect x="-82" y="-62" width="164" height="124" rx="6" fill="#ffcf3f" ${ln()}/>` +
          '<rect x="-76" y="-56" width="152" height="112" rx="3" fill="none" stroke="#e6a823" stroke-width="2.5" stroke-dasharray="4 4"/>' +
          `<rect x="-68" y="-48" width="136" height="96" fill="#1f2f7a" ${ln(2)}/>` +
          '<path d="M-64 -20Q-44 -34 -24 -20T16 -20Q30 -10 24 -2Q16 4 10 -4M-60 6Q-40 -6 -20 4T20 6T60 0" fill="none" stroke="#4f6fd6" stroke-width="4" stroke-linecap="round"/>' +
          '<path d="M30 -38Q44 -46 54 -36" fill="none" stroke="#7f9cf0" stroke-width="3" stroke-linecap="round"/>' +
          stars.map(([x, y, r], i) => `<g class="an-twinkle an-d${i % 4 + 1}"><circle cx="${x}" cy="${y}" r="${r * 1.8}" fill="#fff3a0" opacity="0.35"/>` +
            `<path d="${star(x, y, r)}" fill="#ffe27a"/></g>`).join('') +
          `<g class="an-glow"><circle cx="44" cy="-28" r="19" fill="#fff3a0" opacity="0.35"/></g>` + moon(44, -28, 12) +
          '<path d="M-68 30Q-40 16 -10 26Q30 14 68 24V48H-68Z" fill="#24305e"/>' +
          `<path d="M-14 36V24L-6 18L2 24V36ZM8 38V28L16 22L24 28V38ZM-36 38V30L-30 26L-24 30V38Z" fill="#3d4f9a" ${ln(1.5)}/>` +
          `<path d="M-9 28h5v4h-5zM13 31h5v4h-5zM-32 32h4v4h-4z" fill="#ffd23f"/>` +
          `<path d="M-54 46Q-60 20 -50 -2Q-42 20 -46 46Z" fill="#1d4a3a" ${ln(1.5)}/>` +
          `<rect x="-68" y="-48" width="136" height="96" fill="none" ${ln(2)}/>` +
          gem(0, -62, 6, '#5ec8ff') + gem(0, 62, 6, '#ff4f7b') + gem(-82, 0, 6, '#7be07b') + gem(82, 0, 6, '#b46bff') +
          sparkle(-74, -54, 8) + sparkle(74, 54, 8);
      },
    },
    { id: 'goldmirror', name: 'Golden mirror', gems: 20,
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
    { id: 'crystalportrait', name: 'Crystal portrait', gems: 30,
      draw: c => {
        const oct = k => `M${-38 * k} ${-64 * k}H${38 * k}L${62 * k} ${-40 * k}V${40 * k}L${38 * k} ${64 * k}H${-38 * k}L${-62 * k} ${40 * k}V${-40 * k}Z`;
        const P = [[-38, -64], [38, -64], [62, -40], [62, 40], [38, 64], [-38, 64], [-62, 40], [-62, -40]];
        const fac = P.map(([x, y]) => `M${x} ${y}L${r1(x * 0.8)} ${r1(y * 0.8)}`).join('');
        return `<g class="an-glow"><path d="${oct(1.08)}" fill="none" stroke="#9fe3ff" stroke-width="6" stroke-linejoin="round"/></g>` +
          `<path d="${oct(1)}" fill="#bfeaff" ${ln()}/>` +
          '<path d="M-38 -64L-50 -52L-62 -40ZM62 40L50 52L38 64Z" fill="#e8f9ff"/><path d="M38 -64L50 -52L62 -40ZM-62 40L-50 52L-38 64Z" fill="#8fd3f5"/>' +
          `<path d="${fac}" stroke="#fff" stroke-width="2"/>` +
          `<path d="${oct(0.8)}" fill="#e6d9ff" ${ln(2)}/>` +
          head(c, -42, -48, 84) +
          `<path d="${oct(0.8)}" fill="none" ${ln(2)}/>` +
          '<path d="M-40 -30L-28 -42M-44 -16L-20 -40" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity="0.6"/>' +
          P.filter((p, i) => i % 2 === 0).map(([x, y], i) => `<g class="an-pulse an-d${i + 1}">${gem(r1(x * 0.9), r1(y * 0.9), 6, ['#ff4f7b', '#5ec8ff', '#7be07b', '#b46bff'][i])}</g>`).join('') +
          `<g class="an-pulse">${gem(0, -60, 8, '#ff4f7b')}</g>` +
          sparkle(-64, -56, 8) + sparkle(66, 54, 8) + sparkle(62, -58, 6) + sparkle(-66, 56, 6) + sparkle(30, -40, 5);
      },
    },
  ]);
})();
