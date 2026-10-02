// Back: behind everything; only the sides and the bottom show on a character.
// Cheap to elite; each entry is the catalog item (ITEMS) and its drawing (WEAR_ART), added by addItems.

(() => {
  const { GOLD, GOLD_D, GEM, RUBY, RED, RED_D, BLUE, DARK, f1, both, shine, spark } = WEAR_KIT;
  // A wing (or anything) beating around its root (x, y): turns by a degrees and back, forever.
  const flap = (s, x, y, a, dur) => `<g>${s}<animateTransform attributeName="transform" type="rotate" ` +
    `values="0 ${x} ${y};${a} ${x} ${y};0 ${x} ${y}" dur="${dur}s" repeatCount="indefinite"/></g>`;
  // A wide cape: the outline and its side edges (x at height y), so stripes stay inside it.
  const CAPE = 'M64 134 Q100 126 136 134 L178 234 Q160 248 140 238 Q120 250 100 242 Q80 250 60 238 Q40 248 22 234 Z';
  const HEM = 'M24 234 Q42 246 60 238 Q80 250 100 242 Q120 250 140 238 Q160 246 176 234';
  const capeL = y => f1(64 - 42 * (y - 134) / 100), capeR = y => f1(136 + 42 * (y - 134) / 100);
  // A wavy band across the cape between heights y1 and y2.
  const capeBand = (y1, y2, fill, cls = '') => `<path class="${cls}" d="M${capeL(y1)} ${y1}Q70 ${y1 - 8} 100 ${y1}T${capeR(y1)} ${y1}` +
    `L${capeR(y2)} ${y2}Q130 ${y2 + 8} 100 ${y2}T${capeL(y2)} ${y2}Z" fill="${fill}"/>`;
  const capeTie = (color, w = 3) => tube('M66 137 Q100 147 134 137', color, w);
  const circ = (x, y, r, fill, w = 2) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${ln(w)}/>`;
  // A six-armed snowflake.
  const flake = (x, y, r, cls = '') => {
    const a = f1(r * 0.87), b = f1(r / 2);
    const d = `M${x} ${y - r}V${y + r}M${x - a} ${y - b}L${x + a} ${y + b}M${x - a} ${y + b}L${x + a} ${y - b}`;
    return `<g class="${cls}"><path d="${d}" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>` +
      `<path d="${d}" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></g>`;
  };
  const balloon = (x, y, fill, cls) => `<g class="an-float ${cls}"><path d="M96 168 Q${x + 10} ${y + 60} ${x} ${y + 20}" fill="none" stroke="${INK}" stroke-width="1.5"/>` +
    `<path d="M${x - 4} ${y + 22}L${x + 4} ${y + 22}L${x} ${y + 17}Z" fill="${fill}" ${ln(1.5)}/>` +
    `<ellipse cx="${x}" cy="${y}" rx="15" ry="18" fill="${fill}" ${ln()}/>` +
    `<ellipse cx="${x - 6}" cy="${y - 7}" rx="3.5" ry="5" transform="rotate(25 ${x - 6} ${y - 7})" fill="#fff" opacity="0.7"/></g>`;

  addItems('back', WEAR_ART, [
    { id: 'paperwings', name: 'Paper wings', price: 15,
      draw: () => both(`<path d="M94 150 L30 116 L16 164 L32 210 L94 184 Z" fill="#fbf7ea" ${ln()}/>` +
        '<path d="M94 160 L24 140 M94 174 L26 190" fill="none" stroke="#d9cfb4" stroke-width="2.5" stroke-linecap="round"/>') +
        '<path d="M30 200 L38 192 L46 200 L54 192 L62 200" fill="none" stroke="#5aa7e8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<circle cx="40" cy="136" r="7" fill="none" stroke="#ffb02e" stroke-width="3"/>' +
        '<path d="M156 170 C142 160 144 148 156 154 C168 148 170 160 156 170 Z" fill="none" stroke="#ff6fa0" stroke-width="3" stroke-linejoin="round"/>' +
        `<rect x="86" y="158" width="28" height="14" rx="2" fill="#f4e7b0" ${ln(2)}/>`,
    },
    { id: 'bindle', name: 'Bindle bag', price: 30,
      draw: () => tube('M32 240 L172 104', '#b07a45', 6) +
        `<path d="M162 106 Q130 122 140 150 Q150 172 176 168 Q200 160 196 132 Q192 110 174 106 Z" fill="${RED_D}" ${ln()}/>` +
        '<path d="M150 132a4 4 0 1 0 8 0a4 4 0 1 0 -8 0M166 150a4 4 0 1 0 8 0a4 4 0 1 0 -8 0M178 126a4 4 0 1 0 8 0a4 4 0 1 0 -8 0' +
        'M182 154a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0M148 156a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" fill="#fff"/>' +
        `<path d="M166 108 L156 92 L170 102 Z M172 106 L186 94 L178 108 Z" fill="${RED_D}" ${ln(2)}/>` + circ(170, 106, 5, RED_D),
    },
    { id: 'swedishflagcape', name: 'Swedish flag cape', price: 50,
      draw: () => `<path d="${CAPE}" fill="#2f6fd6"/>` +
        `<path d="M${capeL(204)} 204 H${capeR(204)} L${capeR(218)} 218 H${capeL(218)} Z" fill="${GOLD}"/>` +
        `<path d="M62 132 H78 V246 Q70 246 62 242 Z" fill="${GOLD}"/>` +
        `<path d="${CAPE}" fill="none" ${ln()}/>` + capeTie('#fff', 2.5),
    },
    { id: 'backpack', name: 'Backpack', price: 80,
      draw: () => tube('M84 130 Q84 114 100 114 Q116 114 116 130', '#3f9b4a', 4) +
        `<rect x="44" y="128" width="112" height="96" rx="24" fill="#5fbf5a" ${ln()}/>` +
        `<path d="M44 158 Q44 128 68 128 H132 Q156 128 156 158 Q100 172 44 158 Z" fill="#4aa64a" ${ln()}/>` +
        `<rect x="72" y="180" width="56" height="34" rx="10" fill="#4aa64a" ${ln()}/>` +
        `<rect x="94" y="158" width="12" height="11" rx="2" fill="${GOLD}" ${ln(2)}/>` + shine('M52 176 V208', 4),
    },
    { id: 'turtleshell', name: 'Turtle shell', price: 100,
      draw: () => {
        let rim = '', lines = '', hex = '';
        for (let i = 0; i < 12; i++) {
          const a = i * Math.PI / 6;
          rim += `M${f1(100 + 54 * Math.cos(a))} ${f1(180 + 56 * Math.sin(a))}L${f1(100 + 63 * Math.cos(a))} ${f1(180 + 65 * Math.sin(a))}`;
        }
        for (let i = 0; i < 6; i++) {
          const a = -Math.PI / 2 + i * Math.PI / 3, x = f1(100 + 20 * Math.cos(a)), y = f1(178 + 20 * Math.sin(a));
          hex += (i ? 'L' : 'M') + x + ' ' + y;
          lines += `M${x} ${y}L${f1(100 + 54 * Math.cos(a + Math.PI / 6))} ${f1(180 + 56 * Math.sin(a + Math.PI / 6))}`;
        }
        return `<ellipse cx="100" cy="180" rx="63" ry="65" fill="#e6cf74" ${ln()}/>` +
          `<path d="${rim}" stroke="${INK}" stroke-width="2"/>` +
          `<ellipse cx="100" cy="180" rx="54" ry="56" fill="#5fae4a" ${ln()}/>` +
          `<path d="${hex}Z" fill="#8bd06a" ${ln(2.5)}/><path d="${lines}" ${ln(2.5)}/>` + shine('M60 150 Q54 172 60 196', 4);
      },
    },
    { id: 'pumpkinbackpack', name: 'Pumpkin backpack', price: 150,
      draw: () => tube('M84 130 Q84 112 100 112 Q116 112 116 130', '#3f9b4a', 4) +
        `<path d="M98 132 Q96 120 102 112" fill="none" stroke="#7a4a24" stroke-width="7" stroke-linecap="round"/>` +
        `<ellipse cx="64" cy="184" rx="27" ry="48" fill="#f07f1a" ${ln()}/><ellipse cx="136" cy="184" rx="27" ry="48" fill="#f07f1a" ${ln()}/>` +
        `<ellipse cx="100" cy="182" rx="34" ry="51" fill="#ff9a2e" ${ln()}/>` +
        `<path d="M74 136 Q96 120 116 128 Q100 140 86 138" fill="#6fcf5a" ${ln(2)}/>` +
        `<g class="an-glow"><path d="M76 168 L88 156 L94 172 Z M124 168 L112 156 L106 172 Z" fill="#ffe066" ${ln(2)}/>` +
        `<path d="M78 192 Q100 214 122 192 Q112 198 106 194 L104 200 L96 200 L94 194 Q88 198 78 192 Z" fill="#ffe066" ${ln(2)}/></g>` +
        shine('M48 166 Q44 186 50 206', 4),
    },
    { id: 'balloonbunch', name: 'Balloon bunch', price: 200,
      box: '-8 24 216 230',
      draw: () => balloon(30, 60, '#ff5d6c', '') + balloon(12, 106, GOLD, 'an-d2') +
        balloon(170, 52, '#5aa7e8', 'an-d1') + balloon(188, 102, '#ff8ed0', 'an-d3') +
        `<path d="M90 166 L100 172 L110 166 L104 178 H96 Z" fill="${RED}" ${ln(2)}/>`,
    },
    { id: 'vikingshieldback', name: 'Viking shield', price: 250,
      draw: () => {
        let w = '';
        for (let i = 0; i < 8; i++) {
          const a = i * Math.PI / 4 - Math.PI / 8, b = a + Math.PI / 4;
          w += `<path d="M100 176L${f1(100 + 64 * Math.cos(a))} ${f1(176 + 64 * Math.sin(a))}A64 64 0 0 1 ${f1(100 + 64 * Math.cos(b))} ${f1(176 + 64 * Math.sin(b))}Z" fill="${i % 2 ? '#fff1d6' : RED_D}"/>`;
        }
        let rivets = '';
        for (let i = 0; i < 12; i++) {
          const a = i * Math.PI / 6;
          rivets += `M${f1(98 + 64 * Math.cos(a))} ${f1(176 + 64 * Math.sin(a))}a2 2 0 1 0 4 0a2 2 0 1 0 -4 0`;
        }
        return w + `<circle cx="100" cy="176" r="64" fill="none" stroke="${INK}" stroke-width="12"/>` +
          '<circle cx="100" cy="176" r="64" fill="none" stroke="#a7b0c2" stroke-width="7"/>' +
          `<path d="${rivets}" fill="#5c6680"/>` + circ(100, 176, 15, '#a7b0c2', 3) + shine('M93 168 Q96 164 101 164', 3);
      },
    },
    { id: 'cape', name: 'Hero cape', price: 300,
      draw: () => `<path d="M66 136 Q100 128 134 136 L172 232 Q156 244 138 236 Q120 248 100 240 Q80 248 62 236 Q44 244 28 232 Z" fill="${RED_D}" ${ln()}/>` +
        '<path d="M74 146 L50 222 M126 146 L150 222" stroke="#c7303a" stroke-width="3" stroke-linecap="round"/>' +
        tube('M68 139 Q100 147 132 139', GOLD, 3) + both(`<circle cx="68" cy="139" r="6" fill="${GOLD}" ${ln(2)}/>`),
    },
    { id: 'batwings', name: 'Bat wings', price: 400,
      draw: () => both(flap(`<path d="M94 152 C78 120 46 98 10 96 Q34 120 16 140 Q44 154 34 176 Q60 172 64 196 Q80 182 94 186 Z" fill="#7a5bb5" ${ln()}/>` +
        '<path d="M92 156 L16 140 M92 162 L34 176 M92 168 L64 196" fill="none" stroke="#4a3577" stroke-width="2.5" stroke-linecap="round"/>' +
        `<path d="M50 104 L46 92 L56 100 Z" fill="#4a3577" ${ln(1.5)}/>`, 94, 160, -10, 1.4)),
    },
    { id: 'tomtesack', name: "Tomte's sack of presents", price: 500,
      box: '18 44 196 204',
      draw: () => tube('M150 110 Q84 122 50 216', '#8a5a2e', 4) +
        `<path d="M136 110 Q118 150 132 196 Q146 228 176 222 Q204 212 200 168 Q196 128 170 108 Z" fill="#c9925a" ${ln()}/>` +
        `<rect x="164" y="176" width="20" height="18" rx="3" transform="rotate(10 174 185)" fill="#a8703f" stroke="${INK}" stroke-width="2" stroke-dasharray="3 3"/>` +
        `<g transform="rotate(-12 150 88)"><rect x="136" y="72" width="28" height="30" rx="3" fill="${RED}" ${ln(2.5)}/>` +
        `<path d="M150 72 V102" stroke="${GOLD}" stroke-width="5"/><path d="M144 66 Q150 74 156 66 Q150 62 144 66 Z" fill="${GOLD}" ${ln(1.5)}/></g>` +
        `<g transform="rotate(14 174 94)"><rect x="162" y="82" width="24" height="24" rx="3" fill="#4cbb5f" ${ln(2.5)}/>` +
        `<path d="M162 94 H186 M174 82 V106" stroke="${RED}" stroke-width="4"/></g>` +
        tube('M132 104 V70 Q132 60 141 60 Q150 60 150 68', '#fff', 5) +
        '<path d="M132 104 V70 Q132 60 141 60 Q150 60 150 68" fill="none" stroke="#ff4f5e" stroke-width="5" stroke-dasharray="5 5"/>' +
        tube('M136 110 Q154 116 170 108', '#8a5a2e', 5) +
        spark(122, 76, 6) + spark(196, 76, 5),
    },
    { id: 'fairywings', name: 'Fairy wings', price: 600,
      draw: () => both(`<path d="M96 162 C78 120 30 86 12 102 C-2 118 26 156 96 174 Z" fill="#a9e8ff" ${ln()}/>` +
        `<path d="M96 176 C66 172 24 190 32 220 C42 242 80 224 96 186 Z" fill="#ffc2e6" ${ln()}/>` +
        '<path d="M92 164 Q60 128 24 110 M92 180 Q62 196 42 220" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>' +
        '<circle cx="38" cy="124" r="4" fill="#fff"/><circle cx="54" cy="210" r="3" fill="#fff"/><circle cx="26" cy="108" r="2.5" fill="#fff"/>'),
    },
    { id: 'butterflywings', name: 'Butterfly wings', price: 800,
      draw: () => both(flap(`<path d="M96 166 C80 120 40 76 14 88 C-4 98 6 140 30 158 C50 170 76 170 96 176 Z" fill="#6a3fb5" ${ln()}/>` +
        '<path d="M94 166 C80 128 46 94 24 100 C12 108 18 138 36 152 C54 162 76 164 94 172 Z" fill="#3ec7e0"/>' +
        `<path d="M96 178 C70 176 30 192 36 228 C42 252 74 238 96 192 Z" fill="#6a3fb5" ${ln()}/>` +
        '<path d="M94 182 C72 182 46 196 46 222 C50 236 72 226 94 192 Z" fill="#ff8ed0"/>' +
        '<path d="M94 168 Q62 132 32 108 M94 172 Q62 160 34 148 M94 186 Q70 200 52 224" fill="none" stroke="#3b2f5c" stroke-width="1.5" opacity="0.5"/>' +
        circ(54, 128, 8, GOLD) + circ(72, 152, 5, '#ff8ed0') + circ(66, 206, 5, GOLD) +
        '<path d="M14 104a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M10 126a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M22 148a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0' +
        'M32 90a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0M38 232a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0" fill="#fff"/>', 96, 172, -12, 1.1)),
    },
    { id: 'snowflakecape', name: 'Snowflake cape', price: 1000,
      draw: () => `<path d="${CAPE}" fill="#5aa7e8" ${ln()}/>` +
        `<path d="M80 136 L${capeL(220)} 220 M120 136 L${capeR(220)} 220" stroke="#8fcaff" stroke-width="4" stroke-linecap="round"/>` +
        flake(40, 206, 9, 'an-twinkle') + flake(160, 204, 9, 'an-twinkle an-d2') + flake(52, 168, 6) + flake(148, 168, 6) +
        flake(100, 226, 7, 'an-twinkle an-d1') + flake(30, 230, 5, 'an-twinkle an-d3') + flake(170, 230, 5, 'an-twinkle an-d4') +
        tube(HEM, '#fff', 9) + tube('M64 136 Q100 147 136 136', '#fff', 10) + spark(14, 182, 5) + spark(188, 170, 5),
    },
    { id: 'jetpack', name: 'Jetpack', price: 1200,
      draw: () => `<rect x="54" y="136" width="92" height="64" rx="12" fill="#8c97ad" ${ln()}/>` + both(
        `<g class="an-flicker"><path d="M36 214 Q45 252 54 214 Z" fill="#ff7a2b" ${ln(2)}/><path d="M40 214 Q45 236 50 214 Z" fill="${GOLD}"/></g>` +
        `<path d="M36 204 H54 L58 216 H32 Z" fill="${DARK}" ${ln()}/>` +
        `<rect x="30" y="134" width="30" height="74" rx="13" fill="#dfe6f0" ${ln()}/>` +
        `<path d="M30 150 Q30 118 45 110 Q60 118 60 150 Z" fill="${RED}" ${ln()}/>` +
        `<rect x="30" y="174" width="30" height="9" fill="${BLUE}" ${ln(2)}/>` + shine('M38 156 V200', 4)),
    },
    { id: 'dragonwings', name: 'Dragon wings', price: 1500,
      box: '-8 66 216 186',
      draw: () => both(flap(`<path d="M94 150 L44 94 L4 80 Q24 112 12 142 Q38 140 40 172 Q60 160 70 198 Q82 182 96 188 Z" fill="#6fcf97" ${ln()}/>` +
        '<path d="M84 150 L46 106 L22 96 Q32 116 26 134 Q46 134 48 160 Q64 156 72 182 Q82 172 90 176 Z" fill="#9be6b8"/>' +
        '<path d="M44 96 L12 142 M44 96 L40 172 M44 96 L70 198" fill="none" stroke="#2f8f62" stroke-width="3" stroke-linecap="round"/>' +
        tube('M94 152 L44 94 L4 80', '#2f8f62', 5) +
        `<path d="M38 92 L44 74 L52 92 Z M4 86 L-4 72 L12 78 Z" fill="${GOLD}" ${ln(2)}/>` +
        '<path d="M68 122a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0M56 108a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0" fill="#ffd23f"/>', 94, 158, -12, 1.8)),
    },
    { id: 'northernlightscape', name: 'Northern lights cape', gems: 10,
      draw: () => `<path d="${CAPE}" fill="#1d2a6b" ${ln()}/>` +
        capeBand(160, 174, '#5cf2a0', 'an-glow') + capeBand(184, 194, '#4ee6ff', 'an-glow an-d2') + capeBand(204, 212, '#c78bff', 'an-glow an-d4') +
        '<path d="M44 224a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M150 226a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M62 148a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0' +
        'M136 150a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0M100 232a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" fill="#fff"/>' +
        `<path d="${CAPE}" fill="none" ${ln()}/>` + `<path d="${HEM}" fill="none" stroke="${GOLD}" stroke-width="3" stroke-linecap="round"/>` +
        capeTie(GOLD) + both(circ(68, 139, 7, GOLD) + circ(68, 139, 3, GEM, 1.5)) +
        spark(28, 216, 6) + spark(176, 200, 5) + spark(162, 236, 4),
    },
    { id: 'firewings', name: 'Phoenix fire wings', gems: 15,
      box: '-6 74 212 180',
      draw: () => {
        const W = 'M96 170 C80 130 50 96 6 84 C22 100 20 108 10 116 C30 118 32 126 20 138 C40 140 42 150 30 162 C50 162 54 172 46 186 C66 182 76 190 72 204 C84 196 92 190 96 184 Z';
        const at = s => `transform="translate(96 176) scale(${s}) translate(-96 -176)"`;
        return both(flap(`<path d="${W}" fill="#ff5a2b" ${ln()}/>` +
          `<g class="an-pulse"><g ${at(0.72)}><path d="${W}" fill="#ffa62b"/></g></g>` +
          `<g class="an-pulse an-d2"><g ${at(0.45)}><path d="${W}" fill="#ffe066"/></g></g>` +
          `<path d="M94 172 C78 136 50 106 14 92" fill="none" stroke="${GOLD}" stroke-width="3" stroke-linecap="round"/>` +
          `<circle class="an-rise" cx="22" cy="128" r="3" fill="#ffd23f"/><circle class="an-rise an-d2" cx="40" cy="168" r="2.5" fill="#ff7a2b"/>` +
          `<circle class="an-rise an-d3" cx="12" cy="100" r="2.5" fill="#ffd23f"/>`, 96, 176, -10, 1.6)) +
          spark(18, 210, 6) + spark(186, 214, 5);
      },
    },
    { id: 'angelwings', name: 'Angel wings', gems: 25,
      box: '-6 70 212 170',
      draw: () => both(`<path d="M94 172 C86 126 56 92 8 90 C0 92 -2 102 6 108 Q-6 126 14 130 Q0 150 24 156 Q12 178 38 180 Q32 202 56 200 Q58 222 78 212 L96 190 Z" fill="#fff" ${ln()}/>` +
        `<path d="M92 160 C82 126 56 100 14 98 Q22 112 36 110 Q42 124 54 122 Q62 136 72 134 Q78 148 90 148 Z" fill="#fff3c4" ${ln(2)}/>` +
        '<path d="M14 130 Q40 134 58 134 M24 156 Q50 156 70 150 M38 180 Q60 176 80 166 M56 200 Q72 192 86 180" fill="none" stroke="#c9d3e3" stroke-width="2.5" stroke-linecap="round"/>' +
        `<path d="M90 156 C78 118 50 96 10 94" fill="none" stroke="${GOLD}" stroke-width="3" stroke-linecap="round"/>` +
        spark(26, 80, 6) + spark(18, 196, 5)),
    },
    { id: 'peacocktail', name: 'Peacock tail', gems: 40,
      box: '-14 84 228 170',
      draw: () => {
        let f = '';
        for (let i = 0; i < 11; i++) {
          const deg = -170 + i * 16, L = i % 2 ? 88 : 100, e = 100 + L - 20;
          f += `<g transform="rotate(${deg} 100 206)"><path d="M100 206 H${e}" stroke="#2f8f62" stroke-width="3"/>` +
            `<ellipse cx="${e}" cy="206" rx="26" ry="12" fill="#2fb59a" ${ln(2.5)}/>` +
            `<ellipse cx="${e + 4}" cy="206" rx="11" ry="8" fill="${GOLD}" ${ln(1.5)}/>` +
            `<ellipse cx="${e + 5}" cy="206" rx="6" ry="5" fill="#2f6fd6"/><circle cx="${e + 6}" cy="206" r="2.5" fill="${DARK}"/></g>`;
        }
        return `<g class="an-sway">${f}</g>` + spark(20, 120, 6) + spark(184, 114, 6) + spark(100, 96, 5) + spark(-2, 176, 5);
      },
    },
  ]);
})();
