// Neck: between the chin and the tummy (y 130–190); the head hides the top.
// Cheap to elite; each entry is the catalog item (ITEMS) and its drawing (WEAR_ART), added by addItems.

(() => {
  const { GOLD, GOLD_D, GEM, RUBY, RED, RED_D, BLUE, DARK, f1, both, shine, star, spark, bloom, frame } = WEAR_KIT;
  // n + 1 points spaced evenly along the curve (x0, y0) – (x1, y0) that dips by dip in the middle.
  function along(n, x0, x1, y0, dip) {
    const pt = t => [x0 + (x1 - x0) * t, y0 + 4 * dip * t * (1 - t)], len = [0], m = 60, out = [];
    for (let i = 1; i <= m; i++) {
      const a = pt((i - 1) / m), b = pt(i / m);
      len.push(len[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
    }
    for (let k = 0, i = 0; k <= n; k++) {
      while (i < m && len[i] < len[m] * k / n) i++;
      const [x, y] = pt(i / m);
      out.push([f1(x), f1(y)]);
    }
    return out;
  }
  // The same curve as a cord.
  const cord = (x0, x1, y0, dip, color, w) => tube(`M${x0} ${y0}Q100 ${y0 + 2 * dip} ${x1} ${y0}`, color, w);
  // Swing s to and fro around (cx, cy) (a pendant or a tail hanging from there).
  const swing = (cx, cy, deg, dur, s, begin = 0) => `<g><animateTransform attributeName="transform" type="rotate" ` +
    `values="${-deg} ${cx} ${cy};${deg} ${cx} ${cy};${-deg} ${cx} ${cy}" dur="${dur}s"${begin ? ` begin="-${begin}s"` : ''} repeatCount="indefinite"/>${s}</g>`;
  const sparkD = (x, y, r, d) => spark(x, y, r).replace('an-twinkle', `an-twinkle an-d${d}`);
  const snow = (x, y, r, cls) => {
    let d = '';
    for (let i = 0; i < 3; i++) {
      const a = i * Math.PI / 3 + Math.PI / 2, dx = f1(Math.cos(a) * r), dy = f1(Math.sin(a) * r);
      d += `M${f1(x - dx)} ${f1(y - dy)}L${f1(x + dx)} ${f1(y + dy)}`;
    }
    return `<g class="${cls}"><path d="${d}" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>` +
      `<path d="${d}" stroke="#fff" stroke-width="2" stroke-linecap="round"/></g>`;
  };
  const gem = (x, y, r, fill = GEM) => `<path d="M${x} ${f1(y - r)}L${f1(x + r * 0.8)} ${y}L${x} ${f1(y + r)}L${f1(x - r * 0.8)} ${y}Z" fill="${fill}" ${ln(1.5)}/>`;
  const heart = (x, y, s) => `M${x} ${f1(y + s * 0.9)}C${f1(x - s * 1.6)} ${f1(y - s * 0.2)} ${f1(x - s * 0.6)} ${f1(y - s * 1.3)} ${x} ${f1(y - s * 0.4)}` +
    `C${f1(x + s * 0.6)} ${f1(y - s * 1.3)} ${f1(x + s * 1.6)} ${f1(y - s * 0.2)} ${x} ${f1(y + s * 0.9)}Z`;
  // A little bell hanging from (x, y).
  const bell = (x, y, s = 1) => {
    const p = (dx, dy) => `${f1(x + dx * s)} ${f1(y + dy * s)}`;
    return `<path d="M${p(-11, 20)}Q${p(-11, 4)} ${p(0, 2)}Q${p(11, 4)} ${p(11, 20)}Z" fill="${GOLD}" ${ln(s < 1 ? 2 : 3)}/>` +
      `<path d="M${p(-12, 20)}H${p(12, 20).split(' ')[0]}" ${ln(s < 1 ? 3 : 4)}/>` +
      `<circle cx="${x}" cy="${f1(y + 23 * s)}" r="${f1(3 * s)}" fill="${GOLD_D}" ${ln(1.5)}/>` +
      `<path d="M${p(-5, 8)}Q${p(-6, 13)} ${p(-6, 16)}" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.7"/>`;
  };
  // The wrap and the hanging tail of a scarf (like the striped scarf).
  const WRAP = 'M60 134 Q100 160 140 134 L144 150 Q100 180 56 150 Z', TAIL = 'M112 156 L134 152 L140 204 L116 208 Z';
  // A rainbow fluff ball of the feather boa.
  const fluff = (x, y, r, c) => {
    let d = '';
    for (let i = 0; i <= 7; i++) {
      const a = i * Math.PI * 2 / 7 + x, px = f1(x + Math.cos(a) * r * 0.78), py = f1(y + Math.sin(a) * r * 0.78);
      d += i ? `A${f1(r * 0.4)} ${f1(r * 0.4)} 0 0 1 ${px} ${py}` : `M${px} ${py}`;
    }
    return `<path d="${d}Z" fill="${c}"/>`; // inside a <g> with the ink stroke
  };
  const RAINBOW = ['#ff5a5f', '#ff9f43', '#ffe066', '#5fe08a', '#4fb4ff', '#9b5de5'];

  addItems('neck', WEAR_ART, [
    { id: 'daisychain', name: 'Daisy chain', price: 15,
      box: '50 124 100 72',
      draw: () => cord(62, 138, 140, 22, '#5fc96a', 2.5) +
        `<path d="M74 151 Q70 158 75 160 Q78 155 74 151 Z M126 151 Q130 158 125 160 Q122 155 126 151 Z" fill="#5fc96a" ${ln(1.5)}/>` +
        along(6, 62, 138, 140, 22).map(([x, y]) => bloom(x, y, 7, '#fff')).join(''),
    },
    { id: 'bandana', name: 'Bandana', price: 20,
      box: '54 126 92 68',
      draw: () => `<path d="M64 136 Q100 154 136 136 Q124 160 100 186 Q76 160 64 136 Z" fill="${RED}" ${ln()}/>` +
        [[82, 151], [100, 160], [118, 151], [100, 174], [90, 166], [110, 166]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#fff"/>`).join(''),
    },
    { id: 'scarf', name: 'Striped scarf', price: 35,
      draw: () => {
        const tail = 'M112 156 L134 152 L140 204 L116 208 Z', wrap = 'M60 134 Q100 160 140 134 L144 150 Q100 180 56 150 Z';
        const stripe = '#ffe066';
        return `<path d="M118 208 L117 216 M124 207 L124 215 M131 206 L131.5 214 M137 205 L138 213" ${ln(2.5)}/>` +
          `<path d="${tail}" fill="#5fc96a"/><path d="M113.5 174 L136.5 170 M115 191 L138.5 187" stroke="${stripe}" stroke-width="6"/>` +
          `<path d="${tail}" fill="none" ${ln()}/>` +
          `<path d="${wrap}" fill="#5fc96a"/><path d="M76 143 V160 M92 147 V164 M108 147 V164 M124 143 V160" stroke="${stripe}" stroke-width="6"/>` +
          `<path d="${wrap}" fill="none" ${ln()}/>`;
      },
    },
    { id: 'bellcollar', name: 'Bell collar', price: 50,
      box: '50 124 100 72',
      draw: () => `<path d="M60 139 Q100 165 140 139 L141 148 Q100 175 59 148 Z" fill="${RED}" ${ln()}/>` +
        along(6, 61, 139, 143.5, 13).filter((p, i) => i !== 3).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="#fff"/>`).join('') +
        swing(100, 160, 12, 1.4, `<circle cx="100" cy="161" r="3.5" fill="none" ${ln(2.5)}/>` + bell(100, 162)),
    },
    { id: 'bowtie', name: 'Bow tie', price: 60,
      box: '66 124 68 48',
      draw: () => both(`<path d="M100 150 L78 138 Q72 150 78 162 Z" fill="${RED}" ${ln()}/><circle cx="84" cy="146" r="2.2" fill="#fff"/><circle cx="83" cy="155" r="2.2" fill="#fff"/>`) +
        `<rect x="93" y="143" width="14" height="14" rx="4" fill="${RED_D}" ${ln()}/>`,
    },
    { id: 'crayfishbib', name: 'Crayfish party bib', price: 80,
      box: '50 124 100 90',
      draw: () => {
        // A little red crayfish pointing up, claws first.
        const cray = (x, y) => `<g transform="translate(${x} ${y})">` +
          `<path d="M-2 -5 Q-7 -9 -6 -14 M2 -5 Q7 -9 6 -14" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>` +
          `<path d="M-2 -5 Q-7 -9 -6 -14 M2 -5 Q7 -9 6 -14" fill="none" stroke="${RED}" stroke-width="2.4" stroke-linecap="round"/>` +
          `<ellipse cx="-6" cy="-15" rx="2.6" ry="3.6" fill="${RED}" ${ln(1.5)}/><ellipse cx="6" cy="-15" rx="2.6" ry="3.6" fill="${RED}" ${ln(1.5)}/>` +
          `<path d="M0 -8 Q4.5 -6 3.5 3 L0 7 L-3.5 3 Q-4.5 -6 0 -8 Z M0 6 L4.5 10 L-4.5 10 Z" fill="${RED}" ${ln(1.5)}/></g>`;
        return `<path d="M70 140 L62 135 M130 140 L138 135" ${ln(2.5)}/>` +
          `<path d="M70 140 Q100 156 130 140 L134 194 Q100 208 66 194 Z" fill="#fff" ${ln()}/>` +
          '<path d="M68 186 Q100 200 132 186" fill="none" stroke="#4f8cff" stroke-width="5"/>' +
          along(6, 68, 132, 186.5, 7).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="${GOLD}"/>`).join('') +
          cray(86, 168) + cray(114, 168) + cray(100, 182) + '<path d="M84 152 h4 M112 152 h4" stroke="#ffb347" stroke-width="2.5" stroke-linecap="round"/>';
      },
    },
    { id: 'candynecklace', name: 'Candy necklace', price: 100,
      box: '50 124 100 76',
      draw: () => {
        const c = ['#ff9ccb', '#9be7c4', '#ffe066', '#c9a7ff', '#8fd3ff'];
        return cord(62, 138, 140, 26, '#fff', 1.5) +
          along(10, 62, 138, 140, 26).map(([x, y], i) => i === 5 ? '' :
            `<circle cx="${x}" cy="${y}" r="5.2" fill="${c[i % 5]}" ${ln(2)}/><circle cx="${x}" cy="${y}" r="1.8" fill="#fff"/>`).join('') +
          swing(100, 166, 6, 2.4, `<path d="${heart(100, 177, 9)}" fill="#ff6fae" ${ln(2)}/>` + shine('M93 172 Q94 169 97 169', 2));
      },
    },
    { id: 'lovikkascarf', name: 'Lovikka scarf', price: 150,
      box: '50 124 100 100',
      draw: () => {
        const zig = along(12, 59, 141, 142, 14).map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${f1(y + (i % 2 ? 3 : -3))}`).join('');
        const dots = along(6, 62, 138, 142, 14).map(([x, y], i) => `<circle cx="${x}" cy="${f1(y + 8)}" r="2.2" fill="${['#ff5a5f', '#5fc96a', '#4f8cff'][i % 3]}"/>`).join('');
        const pom = (x, y, c) => `<path d="M${x} ${y - 9} V${y - 3}" ${ln(2)}/><circle cx="${x}" cy="${y}" r="5" fill="${c}" ${ln(2)}/>`;
        return swing(124, 156, 3, 3.2, `<path d="${TAIL}" fill="#f7f1e3" ${ln()}/>` +
          `<path d="M115.5 196 L139.5 192" stroke="${RED}" stroke-width="7"/><path d="${TAIL}" fill="none" ${ln()}/>` +
          '<path d="M115 172 L119 167 L123 172 L127 166 L131 171 L135 165" fill="none" stroke="#ff5a5f" stroke-width="2.5" stroke-linejoin="round"/>' +
          '<circle cx="121" cy="181" r="2.2" fill="#5fc96a"/><circle cx="130" cy="180" r="2.2" fill="#4f8cff"/>' +
          `<g class="an-wiggle">${pom(122, 215, RED)}</g><g class="an-wiggle an-d2">${pom(134, 213, BLUE)}</g>`) +
          `<path d="${WRAP}" fill="#f7f1e3" ${ln()}/><path d="${zig}" fill="none" stroke="${RED}" stroke-width="2.5" stroke-linejoin="round"/>` + dots;
      },
    },
    { id: 'batbowtie', name: 'Bat bow tie', price: 200,
      box: '62 124 76 48',
      draw: () => both(`<g class="an-wiggle"><path d="M100 150 Q90 140 72 136 Q75 142 71 146 Q77 148 74 154 Q80 155 78 162 Q90 158 100 150 Z" fill="#5a3d8a" ${ln()}/></g>` +
        `<path d="M94 144 L92 136 L98 142 Z" fill="#3d2a66" ${ln(1.5)}/>`) +
        `<circle cx="100" cy="150" r="8" fill="#3d2a66" ${ln()}/>` +
        '<circle cx="97" cy="148.5" r="1.8" fill="#ffe066"/><circle cx="103" cy="148.5" r="1.8" fill="#ffe066"/>' +
        '<path d="M97 153 L98 156 L99 153 Z M101 153 L102 156 L103 153 Z" fill="#fff"/>',
    },
    { id: 'luciabow', name: 'Lucia collar with red bow', price: 250,
      box: '54 124 92 72',
      draw: () => both(`<path d="M100 147 Q84 139 66 139 Q61 153 72 163 Q88 165 100 153 Z" fill="#fff" ${ln()}/>` +
        `<path d="M69 147 Q66 154 73 159" fill="none" stroke="#d9d4ec" stroke-width="2" stroke-linecap="round"/>` +
        `<path d="M70 141 Q65 137 66 133 Q71 135 70 141 Z" fill="#5fc96a" ${ln(1.5)}/><circle cx="72" cy="143" r="2.6" fill="${RED}" ${ln(1)}/>`) +
        swing(100, 155, 4, 2.6, `<path d="M98 156 L89 186 L94 183 L97 188 Z M102 156 L111 186 L106 183 L103 188 Z" fill="${RED}" ${ln()}/>`) +
        both(`<path d="M100 153 Q86 140 81 148 Q79 159 100 155 Z" fill="${RED}" ${ln()}/>`) +
        `<rect x="95" y="149" width="10" height="10" rx="3.5" fill="${RED_D}" ${ln()}/>` + shine('M86 147 Q84 150 85 153', 2),
    },
    { id: 'pearls', name: 'Pearl necklace', price: 300,
      box: '56 126 88 64',
      draw: () => {
        // Nine pearls evenly along the curve (64, 138) – (136, 138), dipping to y 160.
        const pt = t => [64 + 72 * t, 138 + 88 * t * (1 - t)], len = [0], n = 40;
        for (let i = 1; i <= n; i++) {
          const a = pt((i - 1) / n), b = pt(i / n);
          len.push(len[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
        }
        let h = `<path d="M100 161 Q109 173 100 183 Q91 173 100 161 Z" fill="#ff6fae" ${ln(2)}/>`;
        for (let k = 0, i = 0; k <= 8; k++) {
          while (i < n && len[i] < len[n] * k / 8) i++;
          const [x, y] = pt(i / n);
          h += `<circle cx="${f1(x)}" cy="${f1(y)}" r="4.3" fill="#fffaf2" ${ln(2)}/>`;
        }
        return h + '<circle cx="97.5" cy="170" r="2" fill="#fff"/>';
      },
    },
    { id: 'pumpkinpendant', name: 'Glowing pumpkin pendant', price: 400,
      box: '50 124 100 80',
      draw: () => `<path d="M64 140 Q100 192 136 140" fill="none" ${ln(3)}/>` +
        swing(100, 167, 5, 2.8, `<circle class="an-glow" cx="100" cy="181" r="19" fill="#ffe066" opacity="0.5"/>` +
          `<circle cx="100" cy="166" r="3" fill="none" ${ln(2)}/>` +
          `<path d="M100 169 Q114 166 115 181 Q114 195 100 194 Q86 195 85 181 Q86 166 100 169 Z" fill="#ff8c1a" ${ln()}/>` +
          '<path d="M94 170 Q90 181 94 193 M106 170 Q110 181 106 193" fill="none" stroke="#d96a00" stroke-width="1.8"/>' +
          tube('M100 169 Q99 165 102 163', '#5fc96a', 2.5) +
          '<path class="an-glow an-d2" d="M91 179 L95 174 L99 179 Z M101 179 L105 174 L109 179 Z M90 184 Q100 193 110 184 Q100 188 90 184 Z" fill="#ffe066" stroke="#d96a00" stroke-width="1" stroke-linejoin="round"/>'),
    },
    { id: 'christmasscarf', name: 'Christmas scarf', price: 500,
      box: '50 124 100 100',
      draw: () => {
        const fl = [[72, 146, ''], [90, 156, 'an-d2'], [110, 156, 'an-d1'], [128, 146, 'an-d3']];
        return swing(124, 156, 3, 3.2, `<path d="${TAIL}" fill="${RED}" ${ln()}/>` +
          '<path d="M113.5 166 L135 162 M116.5 198 L139 194" stroke="#3fae5a" stroke-width="6"/>' + `<path d="${TAIL}" fill="none" ${ln()}/>` +
          snow(125, 180, 5, 'an-twinkle an-d4') +
          `<g class="an-wiggle">${bell(120, 206, 0.6)}</g><g class="an-wiggle an-d2">${bell(134, 204, 0.6)}</g>`) +
          `<path d="${WRAP}" fill="${RED}"/>` + '<path d="M58 140 Q100 166 142 140" fill="none" stroke="#3fae5a" stroke-width="5"/>' +
          `<path d="${WRAP}" fill="none" ${ln()}/>` + fl.map(([x, y, d]) => snow(x, y + 4, 5, `an-twinkle ${d}`)).join('');
      },
    },
    { id: 'vikingamulet', name: 'Viking amulet', price: 600,
      box: '50 124 100 80',
      draw: () => {
        const beads = along(8, 64, 136, 140, 25).filter((p, i) => i > 0 && i < 8 && i !== 4)
          .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="3.6" fill="${i % 2 ? '#4f8cff' : '#ffb347'}" ${ln(1.5)}/>`).join('');
        return cord(64, 136, 140, 25, '#8a5a3c', 2) + beads +
          swing(100, 165, 4, 3, `<circle cx="100" cy="166" r="3.2" fill="none" stroke="${INK}" stroke-width="5"/><circle cx="100" cy="166" r="3.2" fill="none" stroke="#c9d3e6" stroke-width="2"/>` +
            `<rect x="96" y="169" width="8" height="12" rx="2" fill="#c9d3e6" ${ln(2)}/>` +
            '<path d="M96.5 173 H103.5 M96.5 177 H103.5" stroke="#8a5a3c" stroke-width="1.8"/>' +
            `<path d="M87 180 H113 Q113 189 120 197 Q100 192 80 197 Q87 189 87 180 Z" fill="#c9d3e6" ${ln()}/>` +
            '<circle cx="100" cy="188" r="3.5" fill="none" stroke="#8b96b0" stroke-width="1.8"/><path d="M90 184 Q92 189 89 193 M110 184 Q108 189 111 193" fill="none" stroke="#8b96b0" stroke-width="1.8" stroke-linecap="round"/>' +
            sparkD(113, 182, 4, 2));
      },
    },
    { id: 'neckphones', name: 'Headphones', price: 800,
      box: '30 100 140 80',
      draw: () => {
        const note = (x, y, c, d) => `<g class="an-rise ${d}"><path d="M${x} ${y} V${y - 12} L${x + 7} ${y - 9.5} V${y - 6}" fill="none" ${ln(2.5)}/>` +
          `<ellipse cx="${x - 3}" cy="${y}" rx="3.6" ry="2.8" fill="${c}" ${ln(2)}/></g>`;
        return tube('M66 142 Q64 124 100 124 Q136 124 134 142', DARK, 4) +
          both(`<rect x="55" y="138" width="21" height="27" rx="9" fill="#ff4fa3" ${ln()}/>` +
            `<rect class="an-glow" x="60" y="143" width="11" height="17" rx="5.5" fill="#7ad7ff" ${ln(1.5)}/>`) +
          note(43, 150, '#ffe066', '') + note(160, 146, '#7ad7ff', 'an-d3') + note(36, 140, '#ff9ccb', 'an-d2');
      },
    },
    { id: 'featherboa', name: 'Rainbow feather boa', price: 1200,
      box: '44 124 112 100',
      draw: () => {
        const hang = side => {
          const pts = [[60, 153], [57, 166], [56, 179], [56, 192], [58, 205]];
          return pts.map(([x, y], i) => fluff(side ? 200 - x : x, y, 8, RAINBOW[(i + (side ? 3 : 1)) % 6])).join('');
        };
        return `<g ${ln(2)}>` + swing(62, 142, 3, 3.4, hang(0)) + swing(138, 142, 3, 3.4, hang(1), 1.7) +
          along(6, 62, 138, 141, 18).map(([x, y], i) => fluff(x, y, 9, RAINBOW[i % 6])).join('') + '</g>';
      },
    },
    { id: 'medal', name: 'Champion medal', gems: 10,
      box: '58 126 84 84',
      draw: () => `<path d="M72 138 L86 138 L104 178 L92 180 Z" fill="${BLUE}" ${ln()}/><path d="M128 138 L114 138 L96 178 L108 180 Z" fill="${RED}" ${ln()}/>` +
        `<circle cx="100" cy="188" r="16" fill="${GOLD}" ${ln()}/><circle cx="100" cy="188" r="11.5" fill="none" stroke="${GOLD_D}" stroke-width="2.5"/>` +
        `<path d="${star(100, 188, 8)}" fill="#fff3b0" ${ln(1.5)}/>` + spark(122, 176, 6) + spark(78, 202, 5),
    },
    { id: 'starchain', name: 'Gold star chain', gems: 15,
      box: '50 124 100 84',
      draw: () => {
        const links = along(14, 64, 136, 140, 24).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2"/>`).join('');
        return `<g fill="none" stroke="${INK}" stroke-width="5">${links}</g><g fill="none" stroke="${GOLD}" stroke-width="2.4">${links}</g>` +
          swing(100, 166, 5, 3, `<circle cx="100" cy="167" r="3.5" fill="none" ${ln(2.5)}/>` +
            `<path d="${star(100, 185, 17)}" fill="${GOLD}" ${ln()}/><path d="${star(100, 185, 11)}" fill="none" stroke="${GOLD_D}" stroke-width="2"/>` +
            `<circle class="an-pulse" cx="100" cy="186" r="5" fill="${GEM}" ${ln(1.5)}/>` + shine('M90 180 L94 177', 2)) +
          sparkD(124, 172, 6, 1) + sparkD(76, 198, 5, 3) + sparkD(130, 196, 4, 2);
      },
    },
    { id: 'rubypendant', name: 'Ruby heart pendant', gems: 25,
      box: '50 124 100 84',
      draw: () => cord(64, 136, 140, 26, GOLD, 1.5) +
        along(6, 64, 136, 140, 26).filter((p, i) => i === 1 || i === 2 || i === 4 || i === 5).map(([x, y]) => gem(x, y, 4)).join('') +
        swing(100, 167, 5, 2.8, `<circle cx="100" cy="167" r="3" fill="none" stroke="${INK}" stroke-width="5"/><circle cx="100" cy="167" r="3" fill="none" stroke="${GOLD}" stroke-width="2"/>` +
          '<g class="an-pulse">' + frame(heart(100, 182, 12), GOLD, 3.5, `fill="${RUBY}"`) +
          '<path d="M93 177 Q95 173 99 175" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity="0.7"/></g>' + gem(100, 194, 3.5)) +
        sparkD(124, 176, 6, 1) + sparkD(76, 190, 5, 3) + sparkD(118, 200, 4, 2),
    },
    { id: 'diamondcollar', name: 'Diamond collar', gems: 40,
      box: '50 124 100 88',
      draw: () => `<path d="M60 139 Q100 165 140 139 L141 149 Q100 176 59 149 Z" fill="${GOLD}" ${ln()}/>` +
        along(6, 61, 139, 144, 13).map(([x, y], i) => `<g class="an-glow an-d${i % 4 + 1}">${gem(x, y, i === 3 ? 6 : 5)}</g>`).join('') +
        swing(100, 163, 5, 3, `<circle cx="100" cy="166" r="3.5" fill="none" stroke="${INK}" stroke-width="5.5"/><circle cx="100" cy="166" r="3.5" fill="none" stroke="${GOLD}" stroke-width="2.5"/>` +
          `<path d="M100 169 Q113 184 108 194 Q100 202 92 194 Q87 184 100 169 Z" fill="${GOLD}" ${ln()}/>` +
          `<path d="M100 174 Q109 186 105 192 Q100 197 95 192 Q91 186 100 174 Z" fill="${GEM}" ${ln(1.5)}/>` +
          '<path d="M100 174 V196 M95 192 L100 184 L105 192" fill="none" stroke="#fff" stroke-width="1.3" opacity="0.8"/>') +
        sparkD(126, 160, 6, 1) + sparkD(74, 166, 5, 3) + sparkD(120, 196, 5, 2) + sparkD(80, 198, 4, 4) + sparkD(100, 134, 4, 1),
    },
  ]);
})();
