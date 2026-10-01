// Food art (FOODS in constants.js): each food is a ready-to-eat portion drawn as an SVG fragment centred on (0, 0),
// fitting within about -42..42. Shown as a shop thumbnail (FOOD_BOX) and flown to the character's mouth at ~40 px,
// so the shapes are bold and simple. Flat fills, ink outlines (INK, ln() from characters/species.js).

const FOOD_BOX = '-50 -50 100 100'; // shop thumbnail viewBox

const FOOD_ART = (() => {
  // Overlapping circles [x, y, r] with one outline around them all: the ink layer, then the fill on top.
  const blob = (circles, color, w = 3) =>
    circles.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r + w / 2}" fill="${INK}"/>`).join('') +
    circles.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r - w / 2}" fill="${color}"/>`).join('');
  // A four-point sparkle at (x, y), size s.
  const sparkle = (x, y, s, cls = 'an-twinkle') =>
    `<path class="${cls}" d="M${x} ${y - s} Q${x + s * 0.2} ${y - s * 0.2} ${x + s} ${y} Q${x + s * 0.2} ${y + s * 0.2} ${x} ${y + s} ` +
    `Q${x - s * 0.2} ${y + s * 0.2} ${x - s} ${y} Q${x - s * 0.2} ${y - s * 0.2} ${x} ${y - s} Z" fill="#fff" ${ln(2)}/>`;
  // A candle flame with its foot at (x, y).
  const flame = (x, y) => `<g class="an-pulse"><path d="M${x} ${y - 14} C${x + 7} ${y - 6} ${x + 6} ${y} ${x} ${y} ` +
    `C${x - 6} ${y} ${x - 7} ${y - 6} ${x} ${y - 14} Z" fill="#ff9d2e" ${ln(2)}/>` +
    `<ellipse cx="${x}" cy="${y - 4}" rx="2.5" ry="4" fill="#ffe14d"/></g>`;

  // An apple (also the golden one).
  const apple = (color, dark) =>
    `<path d="M0 -20 Q2 -32 9 -39" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>` +
    `<path d="M0 -20 Q2 -32 9 -39" fill="none" stroke="#8a5a2b" stroke-width="3.5" stroke-linecap="round"/>` +
    `<path d="M4 -28 C10 -42 26 -40 30 -34 C22 -26 10 -24 4 -28 Z" fill="#6cc04a" ${ln(2.5)}/>` +
    `<path d="M0 -18 C-14 -30 -40 -26 -40 2 C-40 26 -22 40 -9 38 C-5 37 5 37 9 38 C22 40 40 26 40 2 C40 -26 14 -30 0 -18 Z" fill="${color}" ${ln()}/>` +
    `<path d="M22 28 C30 22 34 14 34 6" fill="none" stroke="${dark}" stroke-width="4" stroke-linecap="round"/>` +
    '<ellipse cx="-24" cy="-6" rx="5" ry="10" transform="rotate(25 -24 -6)" fill="#fff"/>' +
    '<circle cx="-27" cy="10" r="2.6" fill="#fff"/>';

  // A strawberry at (x, y), scale s.
  const berry = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">` +
    `<path d="M0 -16 C16 -24 32 -12 28 6 C24 24 8 34 0 38 C-8 34 -24 24 -28 6 C-32 -12 -16 -24 0 -16 Z" fill="#ff4d5e" ${ln(3 / s)}/>` +
    [[-14, -2], [0, -4], [14, -2], [-18, 12], [-6, 10], [6, 10], [18, 12], [-10, 22], [2, 22], [12, 22], [-2, 31]]
      .map(([sx, sy]) => `<ellipse cx="${sx}" cy="${sy}" rx="1.6" ry="2.6" fill="#ffe680"/>`).join('') +
    `<path d="M0 -14 L-16 -22 L-6 -20 L-10 -30 L0 -22 L10 -30 L6 -20 L16 -22 Z" fill="#4caf50" ${ln(2.5 / s)}/>` +
    `<path d="M0 -22 L1 -32" ${ln(3.5 / s)}/>` +
    '<ellipse cx="-16" cy="0" rx="3" ry="6" transform="rotate(25 -16 0)" fill="#fff"/></g>';

  // A dumpling sitting at (x, y): a round bun with pleats on top.
  const dumpling = (x, y) => `<g transform="translate(${x} ${y})">` +
    `<path d="M-15 6 C-18 -6 -10 -16 0 -17 C10 -16 18 -6 15 6 Q0 10 -15 6 Z" fill="#fff8ec" ${ln()}/>` +
    `<path d="M-6 -15 Q-2 -10 0 -6 M0 -17 L0 -6 M6 -15 Q2 -10 0 -6" fill="none" ${ln(2)}/>` +
    '<ellipse cx="-8" cy="-2" rx="2.5" ry="4" fill="#fff"/></g>';

  return {
    // A whole lemon and a slice in front.
    lemon: () =>
      '<g transform="rotate(-20 -8 -8)">' +
      `<ellipse cx="-39" cy="-8" rx="5" ry="4" fill="#ffd43b" ${ln()}/><ellipse cx="23" cy="-8" rx="5" ry="4" fill="#ffd43b" ${ln()}/>` +
      `<ellipse cx="-8" cy="-8" rx="32" ry="22" fill="#ffe14d" ${ln()}/>` +
      '<ellipse cx="-20" cy="-17" rx="9" ry="4" fill="#fff"/></g>' +
      `<circle cx="18" cy="18" r="21" fill="#ffd43b" ${ln()}/>` +
      '<circle cx="18" cy="18" r="16" fill="#fff6b0"/>' +
      [0, 60, 120, 180, 240, 300].map(a => `<path d="M18 18 L${(18 + 14 * Math.cos(a * Math.PI / 180)).toFixed(1)} ` +
        `${(18 + 14 * Math.sin(a * Math.PI / 180)).toFixed(1)}" stroke="#ffd43b" stroke-width="3" stroke-linecap="round"/>`).join('') +
      '<circle cx="18" cy="18" r="3" fill="#fff"/>',

    // A green floret tree on a pale stalk.
    broccoli: () =>
      `<path d="M-10 6 L-8 36 Q0 41 8 36 L10 6 Z" fill="#b7e07a" ${ln()}/>` +
      `<path d="M-4 14 L-14 2 M5 16 L14 2" ${ln(2.5)}/>` +
      blob([[-24, -6, 15], [24, -6, 15], [-12, -22, 17], [12, -22, 17], [0, -6, 16], [0, -30, 12]], '#3fa34d') +
      '<circle cx="-20" cy="-10" r="4" fill="#2f8a3c"/><circle cx="14" cy="-26" r="4" fill="#2f8a3c"/>' +
      '<circle cx="22" cy="-4" r="3.5" fill="#2f8a3c"/><circle cx="-4" cy="-2" r="3" fill="#2f8a3c"/>' +
      '<ellipse cx="-14" cy="-28" rx="5" ry="3" fill="#8fd35a"/><ellipse cx="-28" cy="-12" rx="4" ry="2.5" fill="#8fd35a"/>',

    apple: () => apple('#ff4d4d', '#d13a3a'),

    // A carrot lying on the slant, green tops up right.
    carrot: () => '<g transform="translate(2 -2) rotate(40)">' +
      `<path d="M-2 -22 C-14 -28 -20 -38 -16 -46 C-8 -42 -2 -34 -2 -22 Z" fill="#6cc04a" ${ln(2.5)}/>` +
      `<path d="M2 -22 C10 -32 20 -36 24 -34 C20 -26 12 -22 2 -22 Z" fill="#6cc04a" ${ln(2.5)}/>` +
      `<path d="M0 -22 C-6 -34 -4 -46 3 -50 C8 -42 6 -32 0 -22 Z" fill="#8fd35a" ${ln(2.5)}/>` +
      `<path d="M-17 -22 Q0 -28 17 -22 Q21 -12 14 4 L3 38 Q0 42 -3 38 L-14 4 Q-21 -12 -17 -22 Z" fill="#ff8a2e" ${ln()}/>` +
      `<path d="M8 -8 L15 -8 M-14 4 L-7 4 M3 16 L9 16 M-8 26 L-3 26" ${ln(2.5)}/>` +
      '<ellipse cx="-8" cy="-12" rx="3" ry="8" fill="#fff"/></g>',

    // Three green stalks with joints and leaves.
    bamboo: () =>
      [[-22, -28, 11], [0, -40, 12], [21, -20, 11]].map(([x, top, w]) =>
        `<rect x="${x - w / 2}" y="${top}" width="${w}" height="${78 - top - 38}" rx="4" fill="#7ccf4f" ${ln()}/>`).join('') +
      [[-22, -6], [-22, 18], [0, -18], [0, 8], [21, 2], [21, 22]].map(([x, y]) =>
        `<path d="M${x - 7} ${y} L${x + 7} ${y}" ${ln(3)}/>`).join('') +
      '<path d="M-25 -24 L-25 -10 M-3 -36 L-3 -22 M18 -16 L18 -2" stroke="#c6f08c" stroke-width="3" stroke-linecap="round"/>' +
      `<path d="M0 -18 C10 -30 24 -32 34 -30 C26 -22 12 -18 0 -18 Z" fill="#4caf50" ${ln(2.5)}/>` +
      `<path d="M-22 -6 C-30 -18 -40 -20 -44 -18 C-40 -10 -30 -6 -22 -6 Z" fill="#4caf50" ${ln(2.5)}/>` +
      `<path d="M21 2 C30 -4 38 -4 42 -2 C36 4 28 6 21 2 Z" fill="#4caf50" ${ln(2.5)}/>`,

    // A curved yellow banana.
    banana: () =>
      `<path d="M-26 -30 L-22 -40 L-14 -38 L-16 -28 Z" fill="#8a5a2b" ${ln(2.5)}/>` +
      `<path d="M-26 -30 C-44 2 -16 40 30 26 L38 18 C34 14 30 14 26 16 C-6 22 -22 0 -16 -28 Z" fill="#ffd93b" ${ln()}/>` +
      `<path d="M-20 -22 C-26 6 -4 28 28 20" fill="none" stroke="#e8b923" stroke-width="3" stroke-linecap="round"/>` +
      `<path d="M34 22 L38 18" ${ln(5)}/>` +
      '<path d="M-30 -14 C-32 0 -26 12 -18 20" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>',

    // A red chili with a green cap.
    chili: () =>
      `<path d="M-22 -24 Q-28 -36 -18 -42" fill="none" ${ln(8)}/>` +
      `<path d="M-22 -24 Q-28 -36 -18 -42" fill="none" stroke="#3f9a3f" stroke-width="3" stroke-linecap="round"/>` +
      `<path d="M-30 -14 C-22 -30 4 -28 12 -10 C18 6 24 22 40 34 C14 38 -4 24 -14 8 C-20 -2 -28 -6 -30 -14 Z" fill="#ff3b30" ${ln()}/>` +
      `<path d="M-34 -14 C-34 -28 -18 -30 -10 -22 L-14 -18 L-20 -22 L-24 -16 L-30 -20 Z" fill="#4caf50" ${ln(2.5)}/>` +
      '<path d="M-14 -16 C-4 -16 2 -6 6 4" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>',

    // A milk carton.
    milk: () =>
      `<path d="M8 -12 L26 -20 L26 32 L8 38 Z" fill="#cfe3f5" ${ln()}/>` +
      `<path d="M-22 -12 L8 -12 L26 -20 L11 -38 L-7 -30 Z" fill="#e8f2fb" ${ln()}/>` +
      `<path d="M-22 -12 L-7 -30 L8 -12" fill="none" ${ln()}/>` +
      `<path d="M-7 -30 L-7 -36 L11 -44 L11 -38 Z" fill="#e8f2fb" ${ln(2.5)}/>` +
      `<rect x="-22" y="-12" width="30" height="50" fill="#ffffff" ${ln()}/>` +
      `<rect x="-22" y="4" width="30" height="20" fill="#4fa3ff" ${ln(2.5)}/>` +
      `<path d="M-7 6 C-2 12 0 15 0 18 C0 21 -3 22 -7 22 C-11 22 -14 21 -14 18 C-14 15 -12 12 -7 6 Z" fill="#fff" ${ln(2)}/>` +
      `<path d="M8 4 L26 -2 L26 16 L8 24 Z" fill="#3a86d9" ${ln(2.5)}/>`,

    // A whole cartoon fish.
    fish: () =>
      `<path d="M20 0 L42 -20 Q34 0 42 20 Z" fill="#ff9d2e" ${ln()}/>` +
      `<path d="M-14 -18 Q-2 -34 14 -18 Z" fill="#ff9d2e" ${ln(2.5)}/>` +
      `<path d="M-38 0 C-28 -26 12 -28 28 0 C12 28 -28 26 -38 0 Z" fill="#5bb8ff" ${ln()}/>` +
      '<path d="M-30 6 C-18 18 6 18 20 8 C8 22 -24 20 -30 6 Z" fill="#c9e8ff"/>' +
      `<path d="M-10 -12 Q-4 0 -10 12 M0 -14 Q6 0 0 14 M10 -12 Q16 0 10 12" fill="none" stroke="#3a92e0" stroke-width="3" stroke-linecap="round"/>` +
      `<path d="M-2 8 L8 16 L10 6 Z" fill="#ff9d2e" ${ln(2)}/>` +
      `<circle cx="-24" cy="-5" r="6" fill="#fff" ${ln(2)}/><circle cx="-23" cy="-5" r="3" fill="${INK}"/>` +
      `<path d="M-36 4 Q-32 7 -29 5" fill="none" ${ln(2)}/>`,

    // A grilled sausage on a fork.
    sausage: () => '<g transform="rotate(12 0 20)">' +
      `<path d="M0 8 L0 42" ${ln(10)}/><path d="M0 8 L0 42" stroke="#c9d2de" stroke-width="4" stroke-linecap="round"/>` +
      `<path d="M-12 -14 L-12 2 Q-12 12 0 14 Q12 12 12 2 L12 -14" fill="#c9d2de" ${ln(2.5)}/>` +
      `<path d="M-4 -14 L-4 4 M4 -14 L4 4" ${ln(2.5)}/></g>` +
      tube('M-34 2 Q0 -30 34 2', '#d9654b', 24) +
      '<path d="M-24 -10 Q-4 -26 16 -18" fill="none" stroke="#f08a6c" stroke-width="5" stroke-linecap="round"/>' +
      `<path d="M-20 -2 L-14 -12 M-6 -8 L-2 -18 M8 -9 L10 -18 M20 -3 L24 -10" ${ln(3)}/>` +
      `<path d="M-42 8 L-38 2 L-34 8 M34 8 L38 2 L42 8" fill="none" ${ln(2.5)}/>`,

    // Two strawberries.
    strawberry: () => berry(14, -8, 0.82) + berry(-10, 2, 0.95),

    // A chicken drumstick with its bone.
    drumstick: () =>
      blob([[26, 38, 7], [37, 27, 7]], '#fff8ec') +
      `<path d="M8 8 L30 30" stroke="${INK}" stroke-width="16" stroke-linecap="round"/>` +
      '<path d="M8 8 L30 30" stroke="#fff8ec" stroke-width="10" stroke-linecap="round"/>' +
      '<circle cx="26" cy="38" r="5.5" fill="#fff8ec"/><circle cx="37" cy="27" r="5.5" fill="#fff8ec"/>' +
      `<path d="M16 10 C10 22 -2 26 -18 22 C-40 16 -46 -12 -32 -28 C-20 -42 4 -40 12 -24 C18 -12 20 2 16 10 Z" fill="#d98b3a" ${ln()}/>` +
      '<path d="M-34 -6 C-34 -20 -24 -32 -10 -32" fill="none" stroke="#f2b366" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M-10 14 Q-2 16 6 10 M-24 2 Q-20 6 -14 4 M-2 -12 Q2 -8 8 -10" fill="none" stroke="#b56a24" stroke-width="3" stroke-linecap="round"/>',

    // A honey pot with honey dripping over the rim and a dipper.
    honey: () =>
      `<path d="M12 -12 L30 -40" ${ln(9)}/><path d="M12 -12 L30 -40" stroke="#c98a4b" stroke-width="3" stroke-linecap="round"/>` +
      `<ellipse cx="31" cy="-40" rx="6" ry="5" fill="#c98a4b" ${ln(2.5)}/>` +
      `<path d="M-24 -10 C-40 -2 -40 32 -20 38 L20 38 C40 32 40 -2 24 -10 Z" fill="#d9822b" ${ln()}/>` +
      `<rect x="-28" y="-20" width="56" height="12" rx="5" fill="#c46d1e" ${ln()}/>` +
      `<path d="M-26 -16 L26 -16 L26 -6 Q22 4 18 -4 L10 -4 L10 8 Q6 14 2 8 L2 -4 L-12 -4 L-12 2 Q-16 8 -20 2 L-20 -4 Q-26 -2 -26 -8 Z" fill="#ffc93c" ${ln(2.5)}/>` +
      `<ellipse cx="0" cy="18" rx="16" ry="11" fill="#ffe7b3" ${ln(2.5)}/>` +
      '<path d="M-6 12 L6 12 M-8 18 L8 18 M-6 24 L6 24" stroke="#d9822b" stroke-width="3" stroke-linecap="round"/>' +
      '<ellipse cx="-24" cy="14" rx="3.5" ry="8" fill="#f2a65a"/>' +
      '<ellipse cx="-18" cy="-12" rx="4" ry="1.8" fill="#fff"/>',

    // Three dumplings in a bamboo steamer.
    dumpling: () =>
      `<ellipse cx="0" cy="4" rx="40" ry="11" fill="#c9954d" ${ln()}/>` +
      dumpling(-16, 0) + dumpling(16, 0) + dumpling(0, 8) +
      `<path d="M-40 6 L-40 30 Q0 42 40 30 L40 6 Q0 26 -40 6 Z" fill="#e8b96a" ${ln()}/>` +
      '<path d="M-34 22 Q0 34 34 22" fill="none" stroke="#c9954d" stroke-width="3" stroke-linecap="round"/>' +
      `<path d="M-24 16 L-24 34 M-8 19 L-8 37 M8 19 L8 37 M24 16 L24 34" stroke="#c9954d" stroke-width="2.5" stroke-linecap="round"/>`,

    // A grilled steak with a round bone and a fat edge.
    steak: () =>
      `<path d="M-36 -8 C-38 -30 -4 -36 16 -26 C36 -16 42 8 30 24 C18 40 -20 38 -32 20 C-40 8 -34 2 -36 -8 Z" fill="#fff0dc" ${ln()}/>` +
      '<path d="M-30 -8 C-31 -24 -4 -30 13 -21 C30 -12 34 8 25 20 C14 33 -18 32 -27 17 C-33 7 -28 2 -30 -8 Z" fill="#b5523b"/>' +
      `<circle cx="6" cy="2" r="9" fill="#fff8ec" ${ln(2.5)}/><circle cx="6" cy="2" r="3.5" fill="#e8b96a"/>` +
      '<path d="M-24 -4 L-12 -16 M-24 12 L-4 -10 M-14 22 L-6 14 M16 20 L26 8 M14 -12 L20 -18" stroke="#7a2f22" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M-8 -26 C2 -27 10 -24 16 -20" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>',

    // A cone with two scoops (strawberry and mint) and a cherry.
    icecream: () =>
      `<path d="M-20 2 L20 2 L2 42 Q0 44 -2 42 Z" fill="#f2b766" ${ln()}/>` +
      '<path d="M-14 8 L6 32 M-4 4 L12 22 M8 4 L16 12 M14 8 L-6 32 M4 4 L-12 22 M-8 4 L-16 12" stroke="#c98a3b" stroke-width="2.5" stroke-linecap="round"/>' +
      `<path d="M-21 -4 C-24 -24 24 -24 21 -4 Q24 6 16 4 Q12 12 6 6 Q0 12 -6 6 Q-12 12 -16 4 Q-24 6 -21 -4 Z" fill="#ff9ecb" ${ln()}/>` +
      `<path d="M-17 -24 C-20 -42 20 -42 17 -24 Q19 -16 12 -18 Q6 -12 0 -17 Q-6 -12 -12 -18 Q-19 -16 -17 -24 Z" fill="#9de8c4" ${ln()}/>` +
      `<path d="M2 -36 Q4 -42 10 -46" fill="none" ${ln(2.5)}/><circle cx="1" cy="-35" r="5" fill="#ff3b4e" ${ln(2.5)}/>` +
      '<ellipse cx="-12" cy="-30" rx="2.5" ry="4.5" fill="#fff"/><ellipse cx="-14" cy="-8" rx="2.5" ry="4.5" fill="#fff"/>' +
      '<circle cx="-1" cy="-37" r="1.5" fill="#fff"/>',

    // A pizza slice: crust on top, cheese, pepperoni.
    pizza: () =>
      `<path d="M-34 -24 Q0 -34 34 -24 L3 40 Q0 44 -3 40 Z" fill="#ffd45c" ${ln()}/>` +
      `<path d="M-6 -20 L-6 -2 Q-6 4 -2 4 Q2 4 2 -2 L2 -20 Z" fill="#ffd45c"/>` +
      tube('M-36 -26 Q0 -38 36 -26', '#e8a050', 10) +
      `<circle cx="-12" cy="-10" r="7" fill="#d9453b" ${ln(2)}/><circle cx="12" cy="-6" r="6.5" fill="#d9453b" ${ln(2)}/>` +
      `<circle cx="0" cy="16" r="6" fill="#d9453b" ${ln(2)}/>` +
      '<path d="M-2 -14 L2 -10 M14 8 L18 6 M-8 6 L-4 8 M6 26 L4 30" stroke="#3f9a3f" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M-24 -30 Q-8 -36 6 -34" fill="none" stroke="#f7c983" stroke-width="3" stroke-linecap="round"/>',

    // A cupcake with rainbow frosting and sprinkles.
    cupcake: () =>
      `<path d="M-28 4 L28 4 L20 40 L-20 40 Z" fill="#ff8fc7" ${ln()}/>` +
      '<path d="M-16 8 L-12 37 M-4 8 L-3 37 M8 8 L4 37 M20 8 L13 37" stroke="#e066a6" stroke-width="3" stroke-linecap="round"/>' +
      `<ellipse cx="0" cy="2" rx="34" ry="10" fill="#b892ff" ${ln()}/>` +
      `<ellipse cx="0" cy="-8" rx="28" ry="9" fill="#7ad7ff" ${ln()}/>` +
      `<ellipse cx="0" cy="-17" rx="22" ry="8" fill="#8fe3a1" ${ln()}/>` +
      `<ellipse cx="0" cy="-25" rx="15" ry="7" fill="#ffd166" ${ln()}/>` +
      `<path d="M-9 -29 C-8 -40 8 -40 9 -29 Q0 -26 -9 -29 Z" fill="#ff7a99" ${ln()}/>` +
      `<path d="M2 -38 Q4 -44 10 -46" fill="none" ${ln(2.5)}/>` +
      [[-22, 4, '#fff'], [10, 6, '#ff3b4e'], [-12, -6, '#fff'], [16, -8, '#ff7a99'], [-4, -16, '#b892ff'],
        [10, -18, '#fff'], [-6, -25, '#ff3b4e'], [26, 2, '#ffd166']]
        .map(([x, y, c]) => `<path d="M${x - 2} ${y + 1} L${x + 2} ${y - 1}" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`).join('') +
      '<ellipse cx="-4" cy="-35" rx="1.8" ry="2.6" fill="#fff"/>',

    // A small birthday cake on a plate with three lit candles.
    cake: () =>
      `<ellipse cx="0" cy="34" rx="42" ry="8" fill="#dfe6f2" ${ln()}/>` +
      `<path d="M-34 -2 L-34 30 Q0 40 34 30 L34 -2 Z" fill="#ffb3d9" ${ln()}/>` +
      '<path d="M-34 16 Q0 26 34 16" fill="none" stroke="#ff8fc7" stroke-width="4"/>' +
      `<path d="M-34 -2 L-34 8 Q-30 14 -26 8 L-26 6 Q-22 16 -18 8 Q-12 4 -8 10 Q-4 18 0 10 Q6 4 10 12 Q14 18 18 10 Q22 4 26 10 Q30 14 34 8 L34 -2 Z" fill="#fff8ec" ${ln(2.5)}/>` +
      `<ellipse cx="0" cy="-2" rx="34" ry="9" fill="#fff8ec" ${ln()}/>` +
      [-16, 0, 16].map((x, i) => `<rect x="${x - 3}" y="-24" width="6" height="${i === 1 ? 22 : 20}" rx="2" ` +
        `fill="${['#7ad7ff', '#ffd166', '#8fe3a1'][i]}" ${ln(2)}/>` + flame(x, -26)).join('') +
      [[-24, 22, '#ff3b4e'], [-8, 26, '#7ad7ff'], [10, 26, '#ffd166'], [26, 22, '#8fe3a1']]
        .map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="3" fill="${c}"/>`).join(''),

    // A shiny golden apple with twinkling sparkles.
    goldapple: () => apple('#ffcc2e', '#e0a20f') +
      sparkle(-34, -32, 8) + sparkle(34, -6, 7) + sparkle(-6, 28, 5),
  };
})();
