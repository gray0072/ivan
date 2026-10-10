// Glasses: lenses on the eyes (80, 90) / (120, 90), temples to the head edge.
// Cheap to elite; each entry is the catalog item (ITEMS) and its drawing (WEAR_ART), added by addItems.

(() => {
  const { GOLD, GEM, RUBY, DARK, f1, both, shine, star, spark, bloom, frame } = WEAR_KIT;
  // A temple from the lens edge (x, y) to the head edge.
  const temple = (x = 62, y = 84) => `<path d="M${x} ${y} L47 80" ${ln()}/>`;
  const bridge = (w = 3.5) => `<path d="M95 87 Q100 82 105 87" fill="none" ${ln(w)}/>`;
  // A circle as a path (for frame and for holes with fill-rule evenodd).
  const ring = (x, y, r) => `M${x - r} ${y}A${r} ${r} 0 1 0 ${x + r} ${y}A${r} ${r} 0 1 0 ${x - r} ${y}Z`;
  const tint = (c, o = 0.35) => `fill="${c}" fill-opacity="${o}"`;
  const heart = (x, y, s) => `M${x} ${f1(y + s * 0.9)}C${f1(x - s * 1.6)} ${f1(y - s * 0.2)} ${f1(x - s * 0.6)} ${f1(y - s * 1.3)} ${x} ${f1(y - s * 0.4)}` +
    `C${f1(x + s * 0.6)} ${f1(y - s * 1.3)} ${f1(x + s * 1.6)} ${f1(y - s * 0.2)} ${x} ${f1(y + s * 0.9)}Z`;
  // A sparkle with an animation delay (1–4) so neighbours don't twinkle in step.
  const sparkD = (x, y, r, d) => spark(x, y, r).replace('an-twinkle', `an-twinkle an-d${d}`);
  // A small snowflake: three crossed lines, white on an ink edge.
  const snow = (x, y, r, cls) => {
    let d = '';
    for (let i = 0; i < 3; i++) {
      const a = i * Math.PI / 3, dx = f1(Math.cos(a) * r), dy = f1(Math.sin(a) * r);
      d += `M${f1(x - dx)} ${f1(y - dy)}L${f1(x + dx)} ${f1(y + dy)}`;
    }
    return `<g class="${cls}"><path d="${d}" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>` +
      `<path d="${d}" stroke="#fff" stroke-width="2" stroke-linecap="round"/></g>`;
  };
  // A small faceted gem (rhombus) centred at (x, y).
  const gem = (x, y, r, fill = GEM) => `<path d="M${x} ${f1(y - r)}L${f1(x + r * 0.8)} ${y}L${x} ${f1(y + r)}L${f1(x - r * 0.8)} ${y}Z" fill="${fill}" ${ln(1.5)}/>`;
  // The flag lens: blue with a yellow cross towards the left edge, lens from x0.
  const flagLens = x0 => {
    const d = `M${x0} 80H${x0 + 35}V100Q${x0 + 35} 102 ${x0 + 33} 102H${x0 + 2}Q${x0} 102 ${x0} 100Z`;
    return `<path d="${d}" fill="#2f6fd6" fill-opacity="0.85"/>` +
      `<path d="M${x0 + 11} 80H${x0 + 17}V102H${x0 + 11}ZM${x0} 88H${x0 + 35}V94H${x0}Z" fill="${GOLD}"/>` + frame(d, '#fff', 3);
  };

  addItems('face', WEAR_ART, [
    { id: 'cardboardglasses', name: 'Cardboard glasses', price: 15,
      draw: () => both(temple(62, 85) +
        `<path d="M63 79 L97 81 L98 101 L62 102 Z${ring(80, 90, 10)}" fill="#d9a066" fill-rule="evenodd" ${ln()}/>` +
        '<path d="M66 98 L70 96 M89 83 L94 84" stroke="#b07a42" stroke-width="2" stroke-linecap="round"/>') +
        `<rect x="95" y="83" width="10" height="9" rx="1.5" fill="#f6eecb" ${ln(2)}/>`,
    },
    { id: 'glasses3d', name: '3D glasses', price: 20,
      draw: () => '<rect x="64" y="81" width="31" height="17" fill="#ff5a5f" fill-opacity="0.6"/>' +
        '<rect x="105" y="81" width="31" height="17" fill="#4fb4ff" fill-opacity="0.6"/>' + both(temple(58, 83)) +
        '<path d="M60 76 H140 Q143 76 143 79 V100 Q143 104 139 104 H110 Q100 94 90 104 H61 Q57 104 57 100 V79 Q57 76 60 76 Z ' +
        `M64 81 V98 H95 V81 Z M105 81 V98 H136 V81 Z" fill="#fff" fill-rule="evenodd" ${ln()}/>` +
        shine('M68 94 L74 85', 2.5) + shine('M109 94 L115 85', 2.5),
    },
    { id: 'nerdglasses', name: 'Nerd glasses', price: 30,
      draw: () => both(temple(63, 84) + frame('M64 80 H96 V99 Q96 102 93 102 H67 Q64 102 64 99 Z', DARK, 4.5, tint('#d8f1ff', 0.3)) +
        shine('M69 96 L75 85', 2.5)) +
        `<path d="M94 86 H106" stroke="${DARK}" stroke-width="5"/>` +
        `<rect x="95" y="81" width="10" height="11" rx="2" fill="#fff" ${ln(2)}/>` +
        '<path d="M97.5 84 L102.5 89 M102.5 84 L97.5 89" stroke="#c9c3d9" stroke-width="1.5" stroke-linecap="round"/>',
    },
    { id: 'glasses', name: 'Round glasses', price: 40,
      draw: () => both(`<path d="M65 87 L47 82" ${ln()}/>` +
        `<circle cx="80" cy="90" r="15" fill="#d8f1ff" fill-opacity="0.35" stroke="${INK}" stroke-width="4"/>` + shine('M71 85 Q73 80 78 79', 2.5)) +
        `<path d="M95 87 Q100 82 105 87" fill="none" ${ln(3.5)}/>`,
    },
    { id: 'swimgoggles', name: 'Swim goggles', price: 50,
      draw: () => both(tube('M64 88 L45 85', '#4f8cff', 5) +
        `<ellipse cx="80" cy="90" rx="15" ry="12" fill="#7ad7ff" fill-opacity="0.45" stroke="${INK}" stroke-width="9"/>` +
        '<ellipse cx="80" cy="90" rx="15" ry="12" fill="none" stroke="#5fd0e8" stroke-width="5"/>' + shine('M70 87 Q72 82 77 81', 2.5)) +
        tube('M95 90 Q100 86 105 90', '#4f8cff', 3) +
        [[146, 76, 3.5, ''], [153, 70, 2.5, ' an-d2'], [55, 74, 3, ' an-d3']]
          .map(([x, y, r, d]) => `<circle class="an-rise${d}" cx="${x}" cy="${y}" r="${r}" fill="#fff" fill-opacity="0.75" ${ln(1.5)}/>`).join(''),
    },
    { id: 'heartglasses', name: 'Heart glasses', price: 60,
      draw: () => both(temple(64, 84) + '<g class="an-pulse">' + frame(heart(80, 91, 13), '#ff4f7b', 4, tint('#ff9ccb', 0.45)) +
        shine('M71 86 Q72 82 76 81', 2.5) + '</g>') + bridge(),
    },
    { id: 'flagglasses', name: 'Swedish flag glasses', price: 80,
      draw: () => both(temple(62, 84)) + flagLens(62) + flagLens(103) + `<path d="M97 86 Q100 83 103 86" fill="none" ${ln(3.5)}/>`,
    },
    { id: 'pumpkinglasses', name: 'Pumpkin glasses', price: 100,
      draw: () => {
        const p = 'M80 76 Q93 71 96 82 Q99 91 95 99 Q90 106 80 104 Q70 106 65 99 Q61 91 64 82 Q67 71 80 76 Z';
        return both(temple(63, 84) + `<path d="${p}" ${tint('#ffb347', 0.45)}/>` + `<path class="an-glow" d="${p}" ${tint('#ffe066', 0.4)}/>` +
          frame(p, '#ff8c1a', 4) +
          '<path d="M73 77 Q71 80 72 83 M87 77 Q89 80 88 83 M72 98 Q71 101 73 103 M88 98 Q89 101 87 103" fill="none" stroke="#d96a00" stroke-width="2" stroke-linecap="round"/>' +
          tube('M80 76 Q79 71 82 68', '#5fc96a', 3) + `<path d="M82 70 Q88 65 91 70 Q86 73 82 70 Z" fill="#5fc96a" ${ln(1.5)}/>`) + bridge();
      },
    },
    { id: 'sunglasses', name: 'Sunglasses', price: 120,
      draw: () => both(`<path d="M62 84 L47 80" ${ln()}/>` +
        `<path d="M60 80 Q80 76 97 81 Q98 104 80 105 Q62 104 60 80 Z" fill="#2d2546" ${ln()}/>` + shine('M67 88 L73 83', 2.5)) +
        `<path d="M97 84 Q100 81 103 84" fill="none" ${ln()}/>`,
    },
    { id: 'catglasses', name: 'Cat-eye glasses', price: 150,
      draw: () => {
        const l = 'M97 84 Q97 101 83 102 Q67 103 63 92 Q61 83 51 75 Q66 77 79 79 Q93 80 97 84 Z';
        return both(temple(60, 85) + frame(l, '#9b5de5', 4, tint('#ffc2e0', 0.4)) + shine('M70 95 Q69 88 73 84', 2.5) +
          `<circle cx="57" cy="78.5" r="2.2" fill="#fff" ${ln(1)}/><circle cx="64" cy="80" r="1.8" fill="#fff" ${ln(1)}/>`) + bridge();
      },
    },
    { id: 'midsummerglasses', name: 'Midsummer flower glasses', price: 200,
      box: '40 58 120 56',
      draw: () => both(temple(66, 86) + frame(ring(80, 90, 14), '#5fc96a', 3.5, tint('#d8f1ff', 0.3)) + shine('M72 85 Q74 81 78 80', 2.5) +
        `<path d="M57 90 Q50 86 52 80 Q58 83 57 90 Z M90 72 Q94 66 99 68 Q96 74 90 72 Z" fill="#5fc96a" ${ln(1.5)}/>` +
        `<g class="an-sway">${bloom(65, 77, 10, '#fff')}</g><g class="an-sway an-d2">${bloom(82, 72, 7, '#7ab8ff')}</g>`) +
        bridge() + `<g class="an-sway an-d1">${bloom(100, 79, 6.5, '#ff8fc8')}</g>`,
    },
    { id: 'batglasses', name: 'Bat glasses', price: 250,
      box: '30 60 140 54',
      draw: () => both(`<g class="an-wiggle"><path d="M67 85 Q56 70 40 74 Q44 80 41 86 Q47 85 49 92 Q54 88 59 95 Z" fill="#5a3d8a" ${ln()}/></g>` +
        frame(ring(80, 90, 13.5), '#5a3d8a', 4, tint('#b98cff', 0.4)) + shine('M72 85 Q74 81 78 80', 2.5)) +
        bridge() + '<path d="M96 88 L97.5 92 L99 88 Z M101 88 L102.5 92 L104 88 Z" fill="#fff" stroke="#5a3d8a" stroke-width="1" stroke-linejoin="round"/>',
    },
    { id: 'starglasses', name: 'Star glasses', price: 300,
      draw: () => both(`<path d="M60 84 L47 80" ${ln()}/>` + frame(star(80, 91, 21, 0.55), '#ff4fa3', 4, 'fill="#ffc2e0" fill-opacity="0.4"') +
        shine('M72 88 L76 84', 2.5)),
    },
    { id: 'skigoggles', name: 'Ski goggles', price: 400,
      box: '38 60 124 54',
      draw: () => {
        const l = 'M60 79 Q100 69 140 79 Q147 92 139 104 Q121 109 109 100 Q100 94 91 100 Q79 109 61 104 Q53 92 60 79 Z';
        return both(tube('M58 90 L44 88', '#4f8cff', 7) + '<path d="M50 84.5 L49.5 92.5" stroke="#fff" stroke-width="2.5"/>') +
          `<path d="${l}" ${tint('#ff8a5b', 0.7)}/>` +
          '<path class="an-glow" d="M70 99 L85 79 M80 101 L95 82 M117 97 L130 80" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.6"/>' +
          frame(l, '#fff', 5) + snow(62, 70, 5, 'an-twinkle') + snow(140, 70, 4.5, 'an-twinkle an-d2');
      },
    },
    { id: 'discoglasses', name: 'Disco glasses', price: 600,
      box: '40 64 120 50',
      draw: () => {
        const lights = ['#ffe066', '#7ad7ff', '#5fe08a', '#ff9ccb'];
        const spots = [[63, 75], [72, 74], [81, 74], [90, 75], [57, 85], [57, 96]];
        return both(temple(58, 84) + frame('M60 78 H97 V100 Q97 104 93 104 H64 Q60 104 60 100 Z', '#ff4fa3', 4, 'fill="#2d2546"') +
          '<path d="M64 86 H93 M64 95 H93 M72 81 V101 M82 81 V101" stroke="#6b5c99" stroke-width="1.5"/>' + shine('M66 92 L72 84', 2.5)) +
          frame('M97 86 Q100 83 103 86', '#ff4fa3', 3) +
          [...spots, ...spots.map(([x, y]) => [200 - x, y])].map(([x, y], i) =>
            `<circle class="an-blink an-d${i % 4 + 1}" cx="${x}" cy="${y}" r="3" fill="${lights[(i + (i >= 6 ? 2 : 0)) % 4]}" ${ln(1.5)}/>`).join('');
      },
    },
    { id: 'laservisor', name: 'Laser visor', price: 1000,
      box: '40 64 120 50',
      draw: () => {
        const v = 'M56 80 Q100 70 144 80 L140 100 Q100 108 60 100 Z';
        return both(`<circle cx="52" cy="90" r="6" fill="#c9d3e6" ${ln()}/><circle class="an-blink" cx="52" cy="90" r="2.4" fill="#ff4f7b"/>`) +
          `<path d="${v}" ${tint('#33e0ff', 0.55)}/><path class="an-glow" d="${v}" ${tint('#b8f6ff', 0.55)}/>` +
          '<g class="an-drift"><path d="M100 79 V101" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.85"/></g>' +
          frame(v, '#c9d3e6', 4) + spark(150, 72, 5) +
          '<circle class="an-blink an-d2" cx="80" cy="75" r="2" fill="#5fe08a"/><circle class="an-blink an-d4" cx="120" cy="75" r="2" fill="#ffe066"/>';
      },
    },
    { id: 'auroraglasses', name: 'Northern lights glasses', gems: 10,
      draw: () => both(temple(64, 85) + '<circle cx="80" cy="90" r="14" fill="#1d2a5a" fill-opacity="0.8"/>' +
        '<path class="an-glow" d="M68 95 Q73 85 79 91 Q85 97 92 86" fill="none" stroke="#5fffb0" stroke-width="3" stroke-linecap="round"/>' +
        '<path class="an-glow an-d2" d="M68 89 Q74 80 80 85 Q86 90 91 81" fill="none" stroke="#c08bff" stroke-width="2.5" stroke-linecap="round"/>' +
        '<circle class="an-twinkle" cx="74" cy="81" r="1.4" fill="#fff"/><circle class="an-twinkle an-d3" cx="86" cy="97" r="1.2" fill="#fff"/>' +
        frame(ring(80, 90, 14), '#e8f0ff', 4) + `<path d="${star(66, 77, 5)}" fill="${GOLD}" ${ln(1.5)}/>`) +
        bridge() + sparkD(54, 70, 6, 1) + sparkD(147, 104, 5, 3),
    },
    { id: 'goldshades', name: 'Golden shades', gems: 15,
      draw: () => both(frame('M58 82 L47 79', GOLD, 3) + frame('M58 80 H95 Q96 101 84 102 H70 Q58 101 58 80 Z', GOLD, 4, 'fill="#2d2546"') +
        '<path d="M65 95 L77 84 M73 98 L83 89" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity="0.5"/>') +
        frame('M95 82 Q100 78 105 82', GOLD, 3) + spark(56, 70, 6) + spark(146, 101, 5),
    },
    { id: 'diamondmonocle', name: 'Diamond monocle', gems: 25,
      box: '78 64 80 90',
      draw: () => {
        const chain = 'M133 100 Q146 118 140 137';
        let rim = '';
        for (let i = 0; i < 6; i++) {
          const a = Math.PI * (-0.9 + i * 0.36);
          rim += gem(f1(120 + Math.cos(a) * 16), f1(90 + Math.sin(a) * 16), 3.6);
        }
        return '<g><animateTransform attributeName="transform" type="rotate" values="-6 133 100;6 133 100;-6 133 100" dur="3s" repeatCount="indefinite"/>' +
          `<path d="${chain}" fill="none" stroke="${INK}" stroke-width="6.5" stroke-dasharray="0.1 6" stroke-linecap="round"/>` +
          `<path d="${chain}" fill="none" stroke="${GOLD}" stroke-width="3.5" stroke-dasharray="0.1 6" stroke-linecap="round"/>` +
          gem(140, 142, 6) + '</g>' +
          frame(ring(120, 90, 16), GOLD, 5, tint('#d8f1ff', 0.35)) + shine('M110 85 Q112 80 118 79', 2.5) + rim +
          sparkD(142, 72, 6, 2) + sparkD(98, 104, 4, 4);
      },
    },
    { id: 'rubyshades', name: 'Ruby heart shades', gems: 40,
      draw: () => both(frame('M62 84 L47 80', GOLD, 3) + '<g class="an-pulse">' + frame(heart(80, 91, 13.5), GOLD, 3.5, `fill="${RUBY}" fill-opacity="0.9"`) +
        shine('M71 86 Q72 82 76 81', 2.5) + '</g>' + gem(62, 77, 4.5)) +
        frame('M95 86 Q100 82 105 86', GOLD, 3) + gem(100, 82, 4) +
        sparkD(52, 70, 6, 1) + sparkD(148, 70, 5, 3) + sparkD(150, 105, 4, 2) + sparkD(50, 105, 4, 4),
    },
  ]);
})();
