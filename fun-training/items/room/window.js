// Windows (centre; x -92..92, y -98..97).
// Cheap to elite; each entry is the catalog item (ITEMS) and its drawing (ROOM_ART), added by addItems.

(() => {
  const { r1, dot, star, sparkle, flip, cloud, crown, gem } = ROOM_KIT;
  // A rectangle as a sub-path; a framed window: glass, the scene, the frame on top (it hides anything that strays out of
  // the glass), bars, sill, then things in the room in front of it.
  const box = (x0, y0, x1, y1) => `M${x0} ${y0}H${x1}V${y1}H${x0}Z`;
  const win = ({ g = [-54, -56, 54, 52], t = 10, frame = '#fffdf8', glass = '#8fd6ff', scene = '', bars = 'cross', bar = frame, sill = frame, front = '' }) => {
    const [x0, y0, x1, y1] = g, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    let h = `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="${glass}"/>` + scene +
      `<path d="${box(x0 - t, y0 - t, x1 + t, y1 + t)}${box(x0, y0, x1, y1)}" fill="${frame}" fill-rule="evenodd" ${ln()}/>`;
    if (bars === 'cross' || bars === 'v') h += `<rect x="${cx - 3.5}" y="${y0}" width="7" height="${y1 - y0}" fill="${bar}" ${ln(2)}/>`;
    if (bars === 'cross') h += `<rect x="${x0}" y="${cy - 3.5}" width="${x1 - x0}" height="7" fill="${bar}" ${ln(2)}/>`;
    if (sill) h += `<rect x="${x0 - t - 8}" y="${y1 + t - 4}" width="${x1 - x0 + 2 * t + 16}" height="9" rx="2" fill="${sill}" ${ln(2)}/>`;
    return h + front;
  };
  const ring = (r, k = 1) => `M${-r} 0a${r} ${r} 0 1 ${k ? 0 : 1} ${2 * r} 0a${r} ${r} 0 1 ${k ? 0 : 1} ${-2 * r} 0`;
  const rr = (x0, y0, x1, y1, r) => `M${x0 + r} ${y0}H${x1 - r}A${r} ${r} 0 0 1 ${x1} ${y0 + r}V${y1 - r}A${r} ${r} 0 0 1 ${x1 - r} ${y1}` +
    `H${x0 + r}A${r} ${r} 0 0 1 ${x0} ${y1 - r}V${y0 + r}A${r} ${r} 0 0 1 ${x0 + r} ${y0}Z`;
  const sun = (x, y, r = 12) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffd23f" ${ln(2)}/>`;
  const spinAt = (x, y, dur) => `<animateTransform attributeName="transform" type="rotate" values="0 ${x} ${y};360 ${x} ${y}" dur="${dur}s" repeatCount="indefinite"/>`;
  const rockAt = (x, y, a, dur) => `<animateTransform attributeName="transform" type="rotate" values="${-a} ${x} ${y};${a} ${x} ${y};${-a} ${x} ${y}" dur="${dur}s" repeatCount="indefinite"/>`;
  const twinkles = (pts, r = 2.4, fill = '#fff') => pts.map(([x, y], i) => `<circle class="an-twinkle an-d${i % 4 + 1}" cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`).join('');
  // A smiling pumpkin standing on (x, y), its carved face glowing.
  const pumpkin = (x, y, s = 1) => {
    const P = (a, b) => `${r1(x + a * s)} ${r1(y + b * s)}`;
    const face = `M${P(-8, -13)}L${P(-4, -18)}L${P(-2, -12)}ZM${P(8, -13)}L${P(4, -18)}L${P(2, -12)}ZM${P(-9, -8)}Q${P(0, 1)} ${P(9, -8)}Q${P(0, -4)} ${P(-9, -8)}Z`;
    return `<ellipse cx="${r1(x - 7 * s)}" cy="${r1(y - 11 * s)}" rx="${r1(9 * s)}" ry="${r1(11 * s)}" fill="#ff8c1a" ${ln(2)}/>` +
      `<ellipse cx="${r1(x + 7 * s)}" cy="${r1(y - 11 * s)}" rx="${r1(9 * s)}" ry="${r1(11 * s)}" fill="#ff8c1a" ${ln(2)}/>` +
      `<ellipse cx="${x}" cy="${r1(y - 11 * s)}" rx="${r1(9 * s)}" ry="${r1(12 * s)}" fill="#ffa033" ${ln(2)}/>` +
      `<path d="M${P(-1, -22)}L${P(0, -28)}L${P(4, -27)}L${P(3, -22)}Z" fill="#5c9b3c" ${ln(1.5)}/>` +
      `<path d="${face}" fill="#a2420a"/><path class="an-glow" d="${face}" fill="#ffe066"/>`;
  };

  addItems('window', ROOM_ART, [
    { id: 'smallwindow', name: 'Small window', price: 0,
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
    { id: 'tapedwindow', name: 'Patched window', price: 15,
      box: '-80 -76 160 152',
      draw: () => win({ g: [-44, -40, 44, 38], frame: '#e9dcc0', sill: '#cbb68f', glass: '#a9dcf3',
        scene: sun(26, -24, 9) + cloud(-36, -22, 0.8) + '<path d="M-44 38 V30 Q-14 18 16 28 Q32 22 44 26 V38 Z" fill="#9fd67f"/>' +
          '<path d="M10 8 L18 15 L14 22 L26 28" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
        front: `<g transform="rotate(35 18 17)"><rect x="5" y="13.5" width="26" height="7" fill="#f1dfa4" ${ln(1)}/></g>` +
          `<g transform="rotate(-40 18 17)"><rect x="7" y="13.5" width="22" height="7" fill="#f1dfa4" ${ln(1)}/></g>` }),
    },
    { id: 'plantwindow', name: 'Window with a plant', price: 25,
      draw: () => win({ g: [-50, -52, 50, 44],
        scene: sun(-28, -32, 11) + cloud(10, -36, 0.8) + '<path d="M-50 44 V26 Q-20 8 10 24 Q30 14 50 22 V44 Z" fill="#8fdc7a"/>',
        front: `<g class="an-sway"><path d="M34 30 V10" stroke="#3f9b5c" stroke-width="3"/>` +
          `<ellipse cx="27" cy="17" rx="7" ry="4" fill="#6fcf6a" ${ln(1.5)} transform="rotate(25 27 17)"/>` +
          `<ellipse cx="41" cy="12" rx="7" ry="4" fill="#6fcf6a" ${ln(1.5)} transform="rotate(-25 41 12)"/><circle cx="34" cy="8" r="3.5" fill="#ff8fd0" ${ln(1.5)}/></g>` +
          `<path d="M24 32 H44 L41 50 H27 Z" fill="#d9764a" ${ln(2)}/><rect x="22" y="28" width="24" height="6" rx="2" fill="#e88b5c" ${ln(2)}/>` }),
    },
    { id: 'rainwindow', name: 'Rainy window', price: 40,
      draw: () => win({ frame: '#7fa6c9', sill: '#6a90b3', glass: '#a7b6c6',
        scene: `<path d="${dot(-40, -46, 12)}${dot(-22, -52, 14)}${dot(-4, -46, 11)}${dot(18, -48, 12)}${dot(36, -52, 14)}${dot(52, -44, 11)}M-54 -56V-40H54V-56Z" fill="#d5dde6"/>` +
          '<path d="M-54 52 V34 Q-20 22 10 32 Q34 24 54 30 V52 Z" fill="#7fa88a"/>' +
          Array.from({ length: 10 }, (_, i) => `<path class="an-fall an-d${i % 4 + 1}" d="M${-46 + i * 10} ${-14 + (i * 37) % 30} l-3 9" stroke="#eef6ff" stroke-width="2.5" stroke-linecap="round"/>`).join('') +
          `<path d="${dot(-30, 12, 2.5)}${dot(24, -22, 2)}${dot(38, 18, 2.5)}${dot(-16, -26, 2)}${dot(14, 40, 2)}" fill="#dff0ff" ${ln(1)}/>` }),
    },
    { id: 'curtains', name: 'Curtains', price: 50,
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
    { id: 'catwindow', name: 'Cat at the window', price: 60,
      draw: () => win({ frame: '#ffe9a8', sill: '#f2cf6b',
        scene: sun(30, -34, 11) + cloud(-44, -38, 0.8) +
          `<g>${rockAt(-40, 48, 12, 2.4)}<path d="M-40 48 Q-54 44 -50 30 Q-48 24 -44 26" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>` +
          '<path d="M-40 48 Q-54 44 -50 30 Q-48 24 -44 26" fill="none" stroke="#ffa94d" stroke-width="4" stroke-linecap="round"/></g>' +
          `<ellipse cx="-26" cy="40" rx="16" ry="13" fill="#ffa94d" ${ln(2)}/><ellipse cx="-26" cy="44" rx="8" ry="7" fill="#fff1dc"/>` +
          `<path d="M-37 14 L-36 2 L-28 9 Z M-15 14 L-16 2 L-24 9 Z" fill="#ffa94d" ${ln(2)}/>` +
          `<circle cx="-26" cy="19" r="12.5" fill="#ffa94d" ${ln(2)}/><path d="M-26 7 V11 M-30 8 L-29 11 M-22 8 L-23 11" stroke="#e07a2a" stroke-width="2"/>` +
          `<path d="${dot(-31, 18, 2.2)}${dot(-21, 18, 2.2)}" fill="${INK}"/><path d="M-28 22 H-24 L-26 24 Z" fill="#ff8fa8"/>` +
          `<path d="M-26 24 q-2 3 -4 1 M-26 24 q2 3 4 1 M-34 22 H-42 M-34 25 L-41 27 M-18 22 H-10 M-18 25 L-11 27" fill="none" stroke="${INK}" stroke-width="1.2"/>` +
          `<path d="${dot(-31, 51, 4)}${dot(-21, 51, 4)}" fill="#fff1dc" ${ln(1.5)}/>` +
          `<g class="an-float"><path d="M28 24 q-10 -10 -10 2 q2 6 10 -2 q10 -10 10 2 q-2 6 -10 -2Z" fill="#ff8fd0" ${ln(1.5)}/><path d="M28 18 V30" ${ln(2)}/></g>` }),
    },
    { id: 'faluwindow', name: 'Falu-red cottage window', price: 80,
      draw: () => `<path d="${box(-82, -84, 82, 80)}${box(-64, -66, 64, 62)}" fill="#b0302a" fill-rule="evenodd" ${ln()}/>` +
        '<path d="M-73 -84 V80 M73 -84 V80 M-40 -84 V-66 M-14 -84 V-66 M14 -84 V-66 M40 -84 V-66 M-40 62 V80 M-14 62 V80 M14 62 V80 M40 62 V80" stroke="#8f2420" stroke-width="2"/>' +
        `<path d="${box(-86, -88, -78, 84)}${box(78, -88, 86, 84)}" fill="#fff" ${ln(2)}/>` +
        win({ frame: '#fff', glass: '#a6e1ff',
          scene: sun(-34, -38, 10) + cloud(8, -46, 0.7) +
            '<path d="M-54 14 Q-40 2 -28 10 Q-14 0 0 8 Q16 -2 30 8 Q44 0 54 8 V20 H-54 Z" fill="#3f8a55"/>' +
            '<rect x="-54" y="22" width="108" height="30" fill="#4aa8e8"/><path d="M-54 18 H54 V22 Q0 30 -54 26 Z" fill="#6fbf5c"/>' +
            '<path d="M-40 36 h12 M10 44 h14 M22 32 h10 M-24 46 h10" stroke="#bfe6ff" stroke-width="2.5" stroke-linecap="round"/>' +
            `<rect x="-46" y="6" width="26" height="16" fill="#b0302a" ${ln(1.5)}/><path d="M-49 6 L-33 -6 L-17 6 Z" fill="#4a4a5e" ${ln(1.5)}/>` +
            '<path d="M-44.5 7 V21 M-21.5 7 V21" stroke="#fff" stroke-width="2.5"/>' +
            '<rect x="-30" y="12" width="6" height="10" fill="#fff"/><rect x="-41" y="10" width="7" height="6" fill="#fff3a0" stroke="#fff" stroke-width="1.5"/>' +
            `<rect x="44" y="-6" width="4" height="26" fill="#fff" ${ln(1)}/><path d="M44 2 h2 M46 8 h2 M44 14 h2" stroke="${INK}" stroke-width="1.5"/>` +
            `<path d="${dot(46, -10, 8)}${dot(40, -3, 5)}" fill="#7fd36a" ${ln(1.5)}/>` +
            `<path d="M20 20 V-16" ${ln(2)}/><g>${rockAt(20, -12, 6, 1.6)}<rect x="20" y="-17" width="16" height="10" fill="#2e6fd8" ${ln(1)}/>` +
            '<path d="M26.5 -17 V-7 M20 -12 H36" stroke="#ffd23f" stroke-width="2.5"/></g>',
          bars: 'v', front: `<rect x="-54" y="-30" width="108" height="7" fill="#fff" ${ln(2)}/>` }),
    },
    { id: 'snowwindow', name: 'Snowy window', price: 100,
      draw: () => win({ frame: '#c98b52', sill: '#c98b52', glass: '#2f3f8f',
        scene: `<circle cx="32" cy="-36" r="10" fill="#fff6c8" ${ln(1.5)}/><path d="${dot(-40, -44, 1.5)}${dot(-14, -30, 1.5)}${dot(12, -46, 1.5)}${dot(46, -14, 1.5)}" fill="#fff"/>` +
          '<path d="M-54 52 V24 Q-26 10 0 22 Q26 12 54 20 V52 Z" fill="#f4f8ff"/>' +
          `<rect x="30" y="26" width="5" height="8" fill="#8a5a2e"/><path d="M32 -6 L44 12 H20 Z M32 4 L48 28 H16 Z" fill="#2f7a46" ${ln(1.5)}/>` +
          '<path d="M27 2 Q32 -2 37 2 M21 24 Q32 18 43 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>' +
          `<circle cx="-30" cy="38" r="11" fill="#fff" ${ln(1.5)}/><circle cx="-30" cy="21" r="8" fill="#fff" ${ln(1.5)}/>` +
          `<rect x="-36" y="10" width="12" height="4" fill="${INK}"/><rect x="-34" y="3" width="8" height="8" fill="${INK}"/>` +
          `<path d="${dot(-33, 20, 1.3)}${dot(-27, 20, 1.3)}" fill="${INK}"/><path d="M-30 23 L-22 25 L-30 25 Z" fill="#ff8c1a"/>` +
          '<path d="M-37 28 H-23 M-26 28 L-24 36" stroke="#e0313d" stroke-width="3.5" stroke-linecap="round"/>' +
          Array.from({ length: 9 }, (_, i) => `<circle class="an-fall an-d${i % 4 + 1}" cx="${-48 + i * 12}" cy="${-14 + (i * 29) % 28}" r="2.6" fill="#fff"/>`).join('') +
          '<path d="M-54 -36 Q-46 -40 -44 -48 Q-40 -52 -34 -56 M-54 -46 Q-50 -48 -48 -56 M54 32 Q46 36 44 44 Q42 50 36 52 M54 42 Q50 46 48 52" fill="none" stroke="#fff" stroke-width="2" opacity="0.8"/>',
        front: `<path d="M-68 58 Q-60 50 -48 54 Q-36 48 -22 54 Q-6 48 8 54 Q24 48 38 54 Q52 50 68 58 Z" fill="#fff" ${ln(2)}/>` +
          `<path d="M-66 -63 Q-60 -74 -46 -70 Q-30 -78 -14 -70 Q4 -78 20 -70 Q38 -78 54 -70 Q64 -74 66 -63 Z" fill="#fff" ${ln(2)}/>` +
          `<path d="M-8 -66 L-14 -58 L-6 -60 Z M8 -66 L14 -58 L6 -60 Z" fill="#e0313d" ${ln(1.5)}/><circle cx="0" cy="-65" r="4" fill="#e0313d" ${ln(1.5)}/>` }),
    },
    { id: 'midsummerwindow', name: 'Midsummer window', price: 120,
      draw: () => {
        const fl = ['#ff5d6c', '#ffd23f', '#fff', '#b892ff', '#ff8fd0'];
        const garl = ['', '', '', '', ''];
        let mid = '';
        for (let i = 0; i < 9; i++) {
          const t = 0.1 + i * 0.1, x = r1(-70 + 140 * t), y = r1(-66 + 2 * t * (1 - t) * 22);
          garl[i % 5] += dot(x, y, 4.5);
          mid += dot(x, y, 1.8);
        }
        const wreath = x => flip('an-sway', `<path d="M${x} -31 V-23" stroke="${INK}" stroke-width="1.5"/>` +
          `<circle cx="${x}" cy="-16" r="7" fill="none" stroke="${INK}" stroke-width="5.5"/><circle cx="${x}" cy="-16" r="7" fill="none" stroke="#5cbf7a" stroke-width="3"/>` +
          `<path d="${dot(x, -9, 2)}${dot(x - 6, -19, 2)}" fill="#ff5d6c"/><path d="${dot(x + 6, -19, 2)}" fill="#ffd23f"/>`);
        return win({ glass: '#a6e1ff',
          scene: sun(-34, -38, 10) + cloud(-18, -14, 0.6) + '<path d="M-54 52 V10 Q-20 2 10 8 Q34 2 54 8 V52 Z" fill="#8fdc7a"/>' +
            `<path d="${dot(-44, 22, 2.5)}${dot(-12, 40, 2.5)}${dot(14, 30, 2.5)}${dot(46, 44, 2.5)}" fill="#ff8fd0"/><path d="${dot(-26, 46, 2.5)}${dot(38, 22, 2.5)}${dot(-40, 38, 2)}" fill="#ffd23f"/>` +
            `<rect x="26" y="-44" width="5" height="90" fill="#4f9b4a" ${ln(1.5)}/><rect x="10" y="-36" width="37" height="5" fill="#4f9b4a" ${ln(1.5)}/>` +
            `<path d="${dot(28.5, -20, 1.6)}${dot(28.5, 0, 1.6)}${dot(28.5, 20, 1.6)}${dot(20, -33.5, 1.4)}${dot(38, -33.5, 1.4)}" fill="#bff0a8"/>` +
            '<path d="M24 -30 q-4 10 0 18 M33 -30 q4 10 0 18" fill="none" stroke="#2e6fd8" stroke-width="2.5"/><path d="M26 -30 q-6 14 -2 24 M31 -30 q6 14 2 24" fill="none" stroke="#ffd23f" stroke-width="2.5"/>' +
            `<circle cx="28.5" cy="-46" r="3.5" fill="#ffd23f" ${ln(1.5)}/>` + wreath(13) + wreath(44) +
            `<g class="an-jump"><ellipse cx="-30" cy="36" rx="10" ry="7" fill="#6fcf6a" ${ln(2)}/><path d="${dot(-35, 29, 3.5)}${dot(-25, 29, 3.5)}" fill="#6fcf6a" ${ln(1.5)}/>` +
            `<path d="${dot(-35, 29, 1.5)}${dot(-25, 29, 1.5)}" fill="${INK}"/><path d="M-34 38 q4 3 8 0" fill="none" ${ln(1.5)}/>` +
            `<path d="M-41 42 l-4 4 M-19 42 l4 4" ${ln(2)}/></g>`,
          front: `<path d="M-70 -66 Q0 -44 70 -66" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>` +
            '<path d="M-70 -66 Q0 -44 70 -66" fill="none" stroke="#5cbf7a" stroke-width="5" stroke-linecap="round"/>' +
            garl.map((d, i) => `<path d="${d}" fill="${fl[i]}" ${ln(1.2)}/>`).join('') + `<path d="${mid}" fill="#ffd23f"/>` });
      },
    },
    { id: 'halloweenwindow', name: 'Halloween window', price: 150,
      draw: () => win({ frame: '#5a4683', sill: '#4a3a6b', glass: '#2a1f5c',
        scene: twinkles([[40, -46], [14, -36], [46, -16], [-46, 4]], 2) +
          `<circle cx="-22" cy="-26" r="22" fill="#ffe680" ${ln(2)}/><path d="${dot(-30, -32, 4)}${dot(-14, -18, 3)}${dot(-12, -34, 2.5)}" fill="#f5cf5a"/>` +
          '<path d="M-54 52 V30 Q-24 16 4 28 Q30 20 54 30 V52 Z" fill="#1a1238"/>' +
          `<g class="an-float"><path d="M-44 42 V26 A10 10 0 0 1 -24 26 V42 l-3.3 -4 l-3.3 4 l-3.4 -4 l-3.3 4 l-3.4 -4 Z" fill="#fff" ${ln(1.5)}/>` +
          `<path d="${dot(-38, 27, 2)}${dot(-30, 27, 2)}" fill="${INK}"/><ellipse cx="-34" cy="33" rx="2.5" ry="2" fill="${INK}"/></g>` +
          `<g class="an-drift"><path d="M-14 0 L22 -6" stroke="#8a5a2e" stroke-width="3" stroke-linecap="round"/><path d="M-14 0 L-24 -7 L-25 4 Z" fill="#d9a74a" ${ln(1)}/>` +
          `<path d="M0 -4 L12 -6 L8 -18 Z" fill="#7a3fc4" ${ln(1.5)}/><circle cx="8" cy="-20" r="5" fill="#8fdc7a" ${ln(1.5)}/>` +
          `<path d="M1 -23 H15 M4 -23 L9 -38 L13 -23 Z" fill="#1f1640" stroke="#1f1640" stroke-width="2" stroke-linejoin="round"/><path d="M10 -21 l1 1" ${ln(1.5)}/></g>` +
          `<g class="an-float an-d2"><path d="M30 -50 q-4 -4 -8 0 q2 2 4 0 q2 2 4 0 q2 -2 4 0 q2 2 4 0 q-4 -4 -8 0Z" fill="#1f1640" ${ln(1)}/></g>`,
        front: pumpkin(40, 58, 1) +
          '<path d="M-64 -66 L-40 -66 M-64 -66 L-64 -42 M-64 -66 L-46 -48 M-56 -66 Q-58 -58 -64 -57 M-48 -66 Q-52 -52 -64 -50" fill="none" stroke="#fff" stroke-width="1.5" opacity="0.85"/>' +
          `<g class="an-bob"><path d="M-50 -54 V-40" stroke="#fff" stroke-width="1"/><circle cx="-50" cy="-37" r="4" fill="${INK}"/></g>` }),
    },
    { id: 'seawindow', name: 'Sea view window', price: 200,
      draw: () => win({ sill: '#5cb8ff', glass: '#a6e1ff',
        scene: sun(-38, -38, 10) + cloud(-8, -46, 0.6) + '<rect x="-54" y="4" width="108" height="48" fill="#3fa0e0"/>' +
          '<path d="M-50 18 q5 -4 10 0 q5 -4 10 0 M10 32 q5 -4 10 0 q5 -4 10 0 M-30 44 q5 -4 10 0 q5 -4 10 0" fill="none" stroke="#bfe6ff" stroke-width="2.5" stroke-linecap="round"/>' +
          `<path d="M22 6 Q38 -4 54 6 Z" fill="#e8c27a" ${ln(1.5)}/><path d="M33 4 L35 -24 H41 L43 4 Z" fill="#fff" ${ln(1.5)}/>` +
          '<path d="M34.4 -14 H41.6 M33.8 -4 H42.2" stroke="#e0313d" stroke-width="3"/>' +
          `<rect x="34" y="-32" width="8" height="8" fill="#ffe680" ${ln(1.5)}/><path d="M32 -32 L38 -38 L44 -32 Z" fill="#e0313d" ${ln(1.5)}/>` +
          '<circle class="an-blink" cx="38" cy="-28" r="7" fill="#fff36b" opacity="0.6"/>' +
          `<path class="an-float" d="M-24 -30 q4 -4 8 0 q4 -4 8 0" fill="none" ${ln(2)}/><path class="an-float an-d3" d="M8 -20 q3 -3 6 0 q3 -3 6 0" fill="none" ${ln(2)}/>` +
          `<g class="an-bob"><path d="M-42 12 H-8 L-14 22 H-36 Z" fill="#e0313d" ${ln(2)}/><path d="M-25 12 V-24" ${ln(2)}/>` +
          `<path d="M-23 -22 L-23 9 L-8 9 Z" fill="#fff" ${ln(1.5)}/><path d="M-27 -16 L-27 9 L-40 9 Z" fill="#ffd23f" ${ln(1.5)}/>` +
          `<path d="M-25 -24 L-17 -27 L-25 -30 Z" fill="#5cb8ff" ${ln(1)}/></g>`,
        front: `<path d="${star(-48, 54, 8, 0.5)}" fill="#ff9a3d" ${ln(1.5)}/>` +
          `<path d="M42 58 Q42 46 50 46 Q58 46 58 58 Z" fill="#ffd6e0" ${ln(1.5)}/><path d="M50 58 V47 M46 58 L45 49 M54 58 L55 49" stroke="#e8a0b4" stroke-width="1.5"/>` }),
    },
    { id: 'flowerbox', name: 'Window with flowers', price: 250,
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
    { id: 'adventwindow', name: 'Advent star window', price: 300,
      draw: () => {
        const cy = -16, R = 22;
        let holes = '', candles = '', glow = '';
        for (let i = 0; i < 5; i++) {
          const a = -Math.PI / 2 + i * 2 * Math.PI / 5;
          holes += dot(r1(Math.cos(a) * R * 0.55), r1(cy + Math.sin(a) * R * 0.55), 2.2);
        }
        for (let i = -3; i <= 3; i++) {
          const x = i * 13, y = r1(58 - (46 - Math.abs(x)) * 24 / 46);
          candles += `<rect x="${x - 2.5}" y="${y - 12}" width="5" height="12" fill="#fff" ${ln(1.2)}/><ellipse cx="${x}" cy="${y - 16}" rx="3" ry="4.5" fill="#ffe066" ${ln(1)}/>`;
          glow += `<circle class="an-glow an-d${(i + 3) % 4 + 1}" cx="${x}" cy="${y - 16}" r="7" fill="#fff3a0" opacity="0.6"/>`;
        }
        return win({ glass: '#24346f',
          scene: `<path d="${dot(-44, -44, 1.5)}${dot(-24, -30, 1.5)}${dot(30, -46, 1.5)}${dot(44, -20, 1.5)}${dot(-46, -14, 1.2)}" fill="#fff"/>` +
            '<path d="M-54 52 V30 Q-20 20 10 28 Q34 22 54 28 V52 Z" fill="#eef4ff"/>' +
            `<rect x="-44" y="14" width="20" height="16" fill="#b0302a" ${ln(1.5)}/><path d="M-47 14 L-34 4 L-21 14 Z" fill="#fff" ${ln(1.5)}/><rect x="-38" y="18" width="7" height="6" fill="#ffe066"/>`,
          front: `<path d="M0 -56 V-38" stroke="${INK}" stroke-width="1.5"/><circle class="an-glow" cx="0" cy="${cy}" r="32" fill="#fff1a0" opacity="0.45"/>` +
            `<path d="${star(0, cy, R, 0.45)}" fill="#e8343c" ${ln(2)}/><path d="${holes}" fill="#a81b22"/><path class="an-glow" d="${holes}" fill="#fff3a0"/>` +
            `<path d="M-3 ${cy + 16} L-4 ${cy + 30} M3 ${cy + 16} L4 ${cy + 30}" stroke="#e8343c" stroke-width="2" stroke-linecap="round"/>` +
            glow + `<path d="M-48 58 L0 32 L48 58 Z" fill="#c98b52" ${ln(2)}/>` + candles });
      },
    },
    { id: 'citywindow', name: 'City at night window', price: 400,
      draw: () => {
        const bl = [[-70, 22, 62], [-50, 18, 84], [-34, 26, 52], [-10, 20, 96], [8, 24, 70], [30, 18, 88], [46, 26, 58]];
        const bc = ['#3a4378', '#2f3768', '#454f8a'];
        let b = '', lit = '';
        const blink = ['', '', '', ''];
        bl.forEach(([x, w, h], i) => {
          b += `<rect x="${x}" y="${50 - h}" width="${w}" height="${h}" fill="${bc[i % 3]}" stroke="#1a1f45" stroke-width="1.5"/>`;
          let k = 0;
          for (let wx = x + 3; wx + 4 <= x + w - 1; wx += 7) {
            for (let wy = 50 - h + 6; wy < 44; wy += 11) {
              k++;
              const s = (i * 7 + k * 5) % 11;
              const d = `M${wx} ${wy}h3.5v5h-3.5Z`;
              if (s < 2) blink[s * 2 + (k % 2)] += d; else if (s < 7) lit += d;
            }
          }
        });
        const mull = x => `<rect x="${x - 3.5}" y="-60" width="7" height="110" fill="#4a4f63" ${ln(2)}/>`;
        return win({ g: [-70, -60, 70, 50], t: 9, frame: '#4a4f63', sill: '#5a6078', glass: '#1d2457', bars: 'none',
          scene: `<circle cx="-48" cy="-40" r="10" fill="#fff6c8"/><circle cx="-43" cy="-44" r="9" fill="#1d2457"/>` +
            twinkles([[-20, -50], [24, -48], [56, -42], [-60, -12], [40, -24]], 1.8) + b +
            `<path d="${lit}" fill="#ffe680"/>` + blink.map((d, i) => `<path class="an-blink an-d${i + 1}" d="${d}" fill="#ffe680"/>`).join('') +
            '<path d="M0 -46 V-56" stroke="#9aa0c0" stroke-width="2"/><circle class="an-blink" cx="0" cy="-57" r="3" fill="#ff5d6c"/>',
          front: mull(-23) + mull(23) });
      },
    },
    { id: 'portholewindow', name: 'Submarine porthole', price: 500,
      box: '-86 -86 172 172',
      draw: () => {
        const fish = (x, y, s, c, k) => `<path d="M${x - k * 13 * s} ${y}L${x - k * 22 * s} ${y - 7 * s}L${x - k * 22 * s} ${y + 7 * s}Z" fill="${c}" ${ln(2)}/>` +
          `<ellipse cx="${x}" cy="${y}" rx="${13 * s}" ry="${9 * s}" fill="${c}" ${ln(2)}/><path d="M${x - k * 3 * s} ${y - 8 * s}V${y + 8 * s}" stroke="#fff" stroke-width="${3 * s}"/>` +
          `<circle cx="${x + k * 6 * s}" cy="${y - 2 * s}" r="${2.6 * s}" fill="#fff"/><circle cx="${x + k * 6.6 * s}" cy="${y - 2 * s}" r="${1.3 * s}" fill="${INK}"/>`;
        const weed = (x, cls) => `<g class="an-sway ${cls}"><path d="M${x} 36 Q${x - 8} 22 ${x} 10 Q${x + 8} -2 ${x} -14" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>` +
          `<path d="M${x} 36 Q${x - 8} 22 ${x} 10 Q${x + 8} -2 ${x} -14" fill="none" stroke="#3fb36a" stroke-width="3.5" stroke-linecap="round"/></g>`;
        let bolts = '';
        for (let i = 0; i < 12; i++) bolts += dot(r1(Math.cos(i * Math.PI / 6) * 66), r1(Math.sin(i * Math.PI / 6) * 66), 3.2);
        return `<circle cx="0" cy="0" r="58" fill="#2f8fd6"/>` +
          '<path d="M-24 -60 L-8 -60 L12 36 L-34 36 Z M14 -60 L24 -60 L40 30 L22 30 Z" fill="#fff" opacity="0.12"/>' +
          `<path d="M-54 34 Q0 22 54 38 L40 60 H-40 Z" fill="#f2d08a"/><path d="${dot(-30, 44, 2)}${dot(20, 46, 1.6)}${dot(36, 42, 1.6)}" fill="#d9ae5f"/>` +
          weed(-34, '') + weed(32, 'an-d2') +
          `<ellipse cx="-4" cy="40" rx="9" ry="6" fill="#ff5d4a" ${ln(1.5)}/><path d="M-12 38 l-6 -6 M4 38 l6 -6 M-7 35 V30 M-1 35 V30" ${ln(1.5)}/>` +
          `<path d="${dot(-18, 31, 3)}${dot(10, 31, 3)}" fill="#ff5d4a" ${ln(1.2)}/><path d="${dot(-7, 29, 1.6)}${dot(-1, 29, 1.6)}" fill="${INK}"/>` +
          `<g class="an-swim">${fish(-6, -18, 1, '#ff9a3d', 1)}</g><g class="an-swim an-d3">${fish(16, 12, 0.7, '#ffd23f', -1)}</g>` +
          `<circle class="an-rise" cx="36" cy="6" r="3.5" fill="none" stroke="#dff4ff" stroke-width="2"/><circle class="an-rise an-d2" cx="42" cy="-2" r="2.5" fill="none" stroke="#dff4ff" stroke-width="2"/>` +
          `<circle class="an-rise an-d4" cx="-20" cy="2" r="2.5" fill="none" stroke="#dff4ff" stroke-width="2"/>` +
          '<path d="M-42 -20 A46 46 0 0 1 -20 -42" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.45"/>' +
          `<path d="${ring(78)}${ring(56, 0)}" fill="#e0a21b" fill-rule="evenodd" ${ln()}/>` +
          `<circle cx="0" cy="0" r="66" fill="none" stroke="#ffcf3f" stroke-width="7"/><path d="${bolts}" fill="#c98b1a" ${ln(1.5)}/>`;
      },
    },
    { id: 'stainedwindow', name: 'Stained-glass window', price: 600,
      draw: () => {
        const pal = ['#ff5d6c', '#ffd23f', '#6fdc6a', '#5cb8ff', '#b38cff', '#ff9a3d'];
        const cells = pal.map(() => ''), dia = pal.map(() => ''), shine = ['', '', '', ''];
        for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
          const x = -52 + c * 26, y = -6 + r * 19;
          cells[(c * 2 + r * 3) % 6] += box(x, y, x + 26, y + 19);
          dia[(c * 2 + r * 3 + 3) % 6] += `M${x + 13} ${y + 2}L${x + 24} ${y + 9.5}L${x + 13} ${y + 17}L${x + 2} ${y + 9.5}Z`;
          shine[(c + r * 2) % 4] += box(x, y, x + 26, y + 19);
        }
        let petals = '';
        for (let i = 0; i < 8; i++) {
          const a = i * 45, x = r1(Math.cos(a * Math.PI / 180) * 14), y = r1(-32 + Math.sin(a * Math.PI / 180) * 14);
          petals += `<ellipse cx="${x}" cy="${y}" rx="8" ry="5" fill="${i % 2 ? '#ffd23f' : '#ff5d6c'}" ${ln(1.5)} transform="rotate(${a} ${x} ${y})"/>`;
        }
        const arch = r => `M${-r} ${70 + (r - 52)}V-26A${r} ${r} 0 0 1 ${r} -26V${70 + (r - 52)}Z`;
        return `<path d="${arch(52)}" fill="#3f6fd8"/>` + pal.map((c, i) => `<path d="${cells[i]}" fill="${c}"/>`).join('') +
          pal.map((c, i) => `<path d="${dia[i]}" fill="${c}" ${ln(1.5)}/>`).join('') +
          shine.map((d, i) => `<path class="an-glow an-d${i + 1}" d="${d}" fill="#fff" fill-opacity="0.35"/>`).join('') +
          '<path d="M-52 -6 L-30 -60 M52 -6 L30 -60 M0 -54 V-78" stroke="#b38cff" stroke-width="10"/>' +
          `<circle cx="0" cy="-32" r="24" fill="#6fdc6a" ${ln(2)}/>` + petals + `<circle cx="0" cy="-32" r="7" fill="#5cb8ff" ${ln(2)}/>` +
          `<path d="M-52 -6H52M-52 13H52M-52 32H52M-52 51H52M-26 -6V70M0 -6V70M26 -6V70M-52 -6L-30 -60M52 -6L30 -60M0 -56V-78" fill="none" stroke="${INK}" stroke-width="2.5"/>` +
          `<path d="${arch(64)}${arch(52)}" fill="#d8d2e6" fill-rule="evenodd" ${ln()}/>` +
          '<path d="M-64 -26 H-52 M52 -26 H64 M-64 20 H-52 M52 20 H64 M-45 -71 L-37 -63 M45 -71 L37 -63 M0 -90 V-78" stroke="#a9a1c0" stroke-width="2.5"/>' +
          `<rect x="-76" y="78" width="152" height="11" rx="3" fill="#c9c3d8" ${ln(2)}/>` +
          sparkle(-36, 0, 6) + sparkle(30, 46, 6);
      },
    },
    { id: 'aurorawindow', name: 'Northern lights window', price: 800,
      draw: () => {
        const mull = x => `<rect x="${x - 3.5}" y="-62" width="7" height="112" fill="#e8eef8" ${ln(2)}/>`;
        return win({ g: [-72, -62, 72, 50], frame: '#e8eef8', glass: '#142057', bars: 'none',
          scene: twinkles([[-60, -52], [-30, -8], [6, -54], [36, -6], [62, -20], [-50, -30], [22, -40]], 2) +
            '<path class="an-glow" d="M-74 -8 Q-40 -50 -10 -24 Q20 0 44 -36 Q58 -54 74 -40" fill="none" stroke="#6dffb0" stroke-width="12" stroke-linecap="round" opacity="0.75"/>' +
            '<path class="an-glow an-d2" d="M-74 -20 Q-40 -60 -12 -36 Q18 -12 42 -46 Q56 -62 74 -52" fill="none" stroke="#5ce1e6" stroke-width="6" stroke-linecap="round" opacity="0.8"/>' +
            '<path class="an-glow an-d4" d="M-74 4 Q-44 -30 -16 -10 Q14 10 40 -20 Q56 -36 74 -26" fill="none" stroke="#c58cff" stroke-width="5" stroke-linecap="round" opacity="0.7"/>' +
            '<path d="M-72 50 V18 Q-40 0 -6 16 Q30 4 72 14 V50 Z" fill="#f4f8ff"/>' +
            `<path d="M-58 -6 L-48 18 H-68 Z M-44 0 L-36 20 H-52 Z M54 -8 L64 16 H44 Z M66 0 L72 16 H60 Z" fill="#1f4a4a" ${ln(1.5)}/>` +
            '<g transform="translate(-18 0)">' + `<path d="M4 6 V18 M8 6 V18 M17 6 V18 M21 6 V18" stroke="#2a2f55" stroke-width="3" stroke-linecap="round"/>` +
            '<ellipse cx="12" cy="3" rx="12" ry="7" fill="#2a2f55"/><path d="M20 0 L27 -8 L34 -6 L34 -2 L26 2 Z" fill="#2a2f55" stroke="#2a2f55" stroke-width="2" stroke-linejoin="round"/>' +
            '<path d="M27 -9 Q23 -15 19 -14 M23 -12 L22 -17 M29 -9 Q32 -16 37 -15 M33 -12 L35 -17" fill="none" stroke="#2a2f55" stroke-width="2.5" stroke-linecap="round"/></g>',
          front: mull(-24) + mull(24) +
            `<path d="M-88 56 Q-76 48 -60 52 Q-40 46 -20 52 Q0 46 20 52 Q42 46 60 52 Q78 48 88 56 Z" fill="#fff" ${ln(2)}/>` +
            sparkle(-78, -66, 7) + sparkle(80, 30, 6) });
      },
    },
    { id: 'spacewindow', name: 'Space window', price: 1000,
      draw: () => {
        let rivets = '';
        for (const x of [-48, -24, 0, 24, 48]) rivets += dot(x, -64, 2.6);
        for (const y of [-30, 0, 30]) rivets += dot(-71, y, 2.6) + dot(71, y, 2.6);
        return `<path d="${rr(-62, -56, 62, 48, 18)}" fill="#141a4a"/>` +
          '<ellipse cx="-20" cy="22" rx="30" ry="14" fill="#ff7ad9" opacity="0.15"/>' +
          twinkles([[-50, -40], [-20, -44], [10, -34], [44, -46], [52, -10], [-46, 6], [-6, 30], [20, 6]], 2) +
          `<circle cx="-40" cy="-30" r="7" fill="#c9d1e3" ${ln(1.5)}/><path d="${dot(-42, -32, 1.6)}${dot(-37, -27, 1.2)}" fill="#9aa3bf"/>` +
          '<g transform="rotate(-12 34 24)">' + `<ellipse cx="34" cy="24" rx="25" ry="6" fill="none" stroke="${INK}" stroke-width="6"/><ellipse cx="34" cy="24" rx="25" ry="6" fill="none" stroke="#ffd23f" stroke-width="2.5"/>` +
          `<circle cx="34" cy="24" r="14" fill="#ff9fd0" ${ln(2)}/><path d="M22 18 H46 M21 27 H47" stroke="#f07ab6" stroke-width="2.5"/>` +
          `<path d="M9 24 A25 6 0 0 0 59 24" fill="none" stroke="${INK}" stroke-width="6"/><path d="M9 24 A25 6 0 0 0 59 24" fill="none" stroke="#ffd23f" stroke-width="2.5"/></g>` +
          `<g class="an-drift"><path class="an-pulse" d="M-20 -15 L-34 -10 L-20 -5 Z" fill="#ffa62b" ${ln(1.5)}/>` +
          `<path d="M-16 -16 L-24 -24 L-10 -16 Z M-16 -4 L-24 4 L-10 -4 Z" fill="#e0313d" ${ln(1.5)}/>` +
          `<path d="M-20 -16 H4 Q18 -10 4 -4 H-20 Z" fill="#fff" ${ln(2)}/><path d="M6 -15.5 Q16 -10 6 -4.5 Z" fill="#e0313d"/>` +
          `<circle cx="-4" cy="-10" r="3.5" fill="#5cb8ff" ${ln(1.5)}/></g>` +
          `<path d="${rr(-80, -72, 80, 64, 28)}${rr(-62, -56, 62, 48, 18)}" fill="#b8c2d6" fill-rule="evenodd" ${ln()}/>` +
          `<path d="${rivets}" fill="#8e98b0" ${ln(1)}/>` +
          `<circle class="an-blink" cx="-14" cy="56" r="3.5" fill="#6fdc6a" ${ln(1)}/><circle class="an-blink an-d2" cx="0" cy="56" r="3.5" fill="#ffd23f" ${ln(1)}/>` +
          `<circle class="an-blink an-d4" cx="14" cy="56" r="3.5" fill="#ff5d6c" ${ln(1)}/>` +
          '<path d="M-50 -46 Q-56 -30 -54 -14" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.35"/>';
      },
    },
    { id: 'royaldrapes', name: 'Royal drapes', gems: 15,
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
    { id: 'crystalwindow', name: 'Crystal bay window', gems: 30,
      draw: () => {
        const I = 'M-82 -50 L-44 -64 L44 -64 L82 -50 L82 44 L44 54 L-44 54 L-82 44 Z';
        const O = 'M-92 -58 L-46 -76 L46 -76 L92 -58 L92 52 L46 64 L-46 64 L-92 52 Z';
        const rb = ['#ff6b6b', '#ffd23f', '#6fcf6a', '#6b9bff'];
        const spots = [[-62, -20], [-24, 30], [26, -40], [60, 0], [-56, 26], [20, 36]];
        const sd = (x, y) => `M${x} ${y - 6}L${x + 4} ${y}L${x} ${y + 6}L${x - 4} ${y}Z`;
        return `<path d="${I}" fill="#a6e1ff"/>` + sun(-62, -30, 9) + cloud(40, -46, 0.8) + cloud(-30, -48, 0.6) +
          '<path d="M-82 44 V24 Q-40 6 0 22 Q40 6 82 22 V44 L44 54 H-44 Z" fill="#8fdc7a"/>' +
          rb.map((c, i) => `<path d="M${-40 + i * 7} 40 A${40 - i * 7} ${40 - i * 7} 0 0 1 ${40 - i * 7} 40" fill="none" stroke="${c}" stroke-width="7"/>`).join('') +
          spots.map(([x, y], i) => `<path class="an-twinkle an-d${i % 4 + 1}" d="${sd(x, y)}" fill="${['#ff8fd0', '#6ef0ff', '#ffe066', '#8dff8a', '#b38cff'][i % 5]}" opacity="0.85"/>`).join('') +
          `<path d="${O}${I}" fill="#ffcf3f" fill-rule="evenodd" ${ln()}/>` +
          `<path d="M-48 -64 H-40 V54 H-48 Z M40 -64 H48 V54 H40 Z" fill="#ffcf3f" ${ln(2)}/>` +
          `<path d="M0 -64 V-46" stroke="${INK}" stroke-width="1.5"/>` + `<g class="an-pulse">${gem(0, -32, 13, '#e8fbff')}</g>` +
          '<path d="M-3 -40 L-7 -32" stroke="#fff" stroke-width="2" stroke-linecap="round"/>' +
          gem(-44, -70, 6, '#ff4f7b') + gem(44, -70, 6, '#ff4f7b') + gem(-87, -2, 6, '#6ef0ff') + gem(87, -2, 6, '#6ef0ff') +
          crown(0, -74, 0.9) +
          `<path d="M-96 50 L-46 62 H46 L96 50 V58 L46 70 H-46 L-96 58 Z" fill="#f4f0ff" ${ln(2)}/>` +
          sparkle(-66, 6, 7) + sparkle(64, -24, 7) + sparkle(-80, -72, 6) + sparkle(78, -74, 7) + sparkle(22, 80, 6);
      },
    },
    { id: 'portalwindow', name: 'Magic portal window', gems: 50,
      box: '-100 -102 200 204',
      draw: () => {
        const arms = (cols, r, k) => cols.map((c, i) => `<path d="M0 0 C${r1(r * 0.25)} ${r1(-r * 0.4)} ${r1(r * 0.72)} ${r1(-r * 0.43)} ${r} ${r1(-r * 0.1)} ` +
          `C${r1(r * 0.64)} ${r1(-r * 0.25)} ${r1(r * 0.32)} ${r1(-r * 0.14)} 0 0Z" fill="${c}" opacity="0.85" transform="rotate(${i * 90 + k})"/>`).join('');
        let gems = '';
        for (let i = 0; i < 8; i++) gems += gem(r1(Math.cos(i * Math.PI / 4) * 72), r1(Math.sin(i * Math.PI / 4) * 72), 7, i % 2 ? '#6ef0ff' : '#ff4f7b');
        return '<circle class="an-glow" cx="0" cy="0" r="94" fill="#d6b8ff" opacity="0.3"/>' +
          `<circle cx="0" cy="0" r="64" fill="#2a1060"/>` +
          `<g>${spinAt(0, 0, 12)}${arms(['#8a62e0', '#4f7bff', '#8a62e0', '#4f7bff'], 60, 0)}${arms(['#ff7ad9', '#6ef0ff', '#ff7ad9', '#6ef0ff'], 44, 45)}</g>` +
          '<circle class="an-glow" cx="0" cy="0" r="22" fill="#e8d6ff" opacity="0.6"/><circle class="an-pulse" cx="0" cy="0" r="10" fill="#fff"/>' +
          twinkles([[-36, -24], [30, -36], [40, 22], [-22, 38], [8, -48], [-48, 8]], 2.2) +
          `<path d="${ring(82)}${ring(62, 0)}" fill="#ffcf3f" fill-rule="evenodd" ${ln()}/>` +
          `<circle cx="0" cy="0" r="72" fill="none" stroke="#e0a21b" stroke-width="2.5"/>` + gems + crown(0, -80, 0.8) +
          `<g class="an-float">${gem(-84, 62, 9, '#bdf3ff')}</g><g class="an-float an-d3">${gem(84, 60, 9, '#ff9fd0')}</g>` +
          sparkle(-84, -64, 8) + sparkle(84, -60, 7) + sparkle(0, 92, 6);
      },
    },
  ]);
})();
