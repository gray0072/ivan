// Things to wear (ITEMS in the wear slots) as SVG in character coordinates (see characters/look.js), drawn on the
// character and alone as shop thumbnails. draw(): the art; box: the thumbnail viewBox (default WEAR_BOX by slot).
// Outfits: sleeve = arm colour (none = bare arms), legs = leg colour (none = fur). Shoes replace the feet. Hand items
// are drawn around the gripping paw at (0, 0) and point up and to the right.

const WEAR_BOX = {
  head: '26 -40 148 112',
  face: '40 62 120 52',
  neck: '50 124 100 96',
  body: '30 118 140 134',
  back: '-6 90 212 164',
  feet: '56 212 88 50',
  hand: '-40 -146 100 180',
};

const WEAR_ART = (() => {
  const GOLD = '#ffd23f', GOLD_D = '#f0a81c', GEM = '#7ad7ff', RUBY = '#ff4f7b';
  const RED = '#ff5a5f', RED_D = '#e8434b', BLUE = '#4f8cff', DARK = '#33324a', WHITE = '#fff';
  const f1 = n => +n.toFixed(1);
  // The left half and its mirror image on the right (around x 100).
  const mirror = s => `<g transform="matrix(-1 0 0 1 200 0)">${s}</g>`;
  const both = s => s + mirror(s);
  const shine = (d, w = 3) => `<path d="${d}" fill="none" stroke="#fff" stroke-width="${w}" stroke-linecap="round" opacity="0.6"/>`;
  // Half width at height y of a shape a bit wider than the body (ellipse (100, 182) 47 × 49).
  const hw = y => 47 * Math.sqrt(Math.max(0, 1 - Math.pow((y - 182) / 49, 2)));
  // A piece of the torso from y top to y hem hugging the body; dt / dh: how much the top / hem edge dips in the middle.
  const part = (top, hem, dt = 10, dh = 8) => {
    const a = f1(hw(top)), b = f1(hw(hem));
    return `M${f1(100 - a)} ${top}Q100 ${top + dt} ${f1(100 + a)} ${top}A47 49 0 0 1 ${f1(100 + b)} ${hem}` +
      `Q100 ${hem + dh} ${f1(100 - b)} ${hem}A47 49 0 0 1 ${f1(100 - a)} ${top}Z`;
  };
  // A stripe across the torso.
  const band = (y1, y2, fill) => `<path d="M${f1(100 - hw(y1))} ${y1}L${f1(100 + hw(y1))} ${y1}L${f1(100 + hw(y2))} ${y2}` +
    `L${f1(100 - hw(y2))} ${y2}Z" fill="${fill}"/>`;
  // Short sleeves at the shoulders: under the arms on a character, seen in the shop.
  const stubs = fill => both(`<path d="M76 144 Q56 144 48 158 L54 176 Q64 176 72 168 Z" fill="${fill}" ${ln()}/>`);
  function star(x, y, r, k = 0.45) {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * k : r;
      d += (i ? 'L' : 'M') + f1(x + Math.cos(a) * rr) + ' ' + f1(y + Math.sin(a) * rr);
    }
    return d + 'Z';
  }
  // A twinkling four-pointed sparkle.
  const spark = (x, y, r) => {
    const c = f1(r * 0.2);
    return `<path class="an-twinkle" d="M${x} ${y - r}Q${x + c} ${y - c} ${x + r} ${y}Q${x + c} ${y + c} ${x} ${y + r}` +
      `Q${x - c} ${y + c} ${x - r} ${y}Q${x - c} ${y - c} ${x} ${y - r}Z" fill="#fff" ${ln(1.5)}/>`;
  };
  // A five-petal flower of radius r.
  function bloom(x, y, r, fill) {
    const R = r * 0.68;
    let d = '';
    for (let i = 0; i <= 5; i++) {
      const a = -Math.PI / 2 + i * Math.PI * 2 / 5, px = f1(x + Math.cos(a) * R), py = f1(y + Math.sin(a) * R);
      d += i ? `A${f1(R * 0.62)} ${f1(R * 0.62)} 0 0 1 ${px} ${py}` : `M${px} ${py}`;
    }
    return `<path d="${d}Z" fill="${fill}" ${ln(2)}/><circle cx="${x}" cy="${y}" r="${f1(r * 0.3)}" fill="${GOLD}" ${ln(1.5)}/>`;
  }
  // A frame line: the ink edge, then the colour on top.
  const frame = (d, color, w, fill = 'fill="none"') => `<path d="${d}" ${fill} stroke="${INK}" stroke-width="${w + 4}" stroke-linejoin="round" stroke-linecap="round"/>` +
    `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;

  return {
    // Hats: sit on the head top (brim y 40–60).
    cap: {
      draw: () => `<path d="M52 60 C50 6 150 6 148 60 Q100 50 52 60 Z" fill="${RED}" ${ln()}/>` +
        `<path d="M100 20 Q86 34 84 56 M100 20 Q114 34 116 56" fill="none" ${ln(2)}/>` + shine('M64 40 Q70 26 84 20') +
        `<path d="M114 57 Q146 49 172 60 Q170 69 150 69 Q130 68 114 63 Z" fill="${RED_D}" ${ln()}/>` +
        `<circle cx="100" cy="19" r="5" fill="${RED_D}" ${ln(2)}/>`,
    },
    bow: {
      box: '46 4 108 70',
      draw: () => '<g transform="rotate(-10 100 40)">' +
        both(`<path d="M96 44 L84 68 L95 64 L99 46 Z" fill="#ff6fae" ${ln()}/>` +
          `<path d="M98 40 C84 12 56 12 56 34 C56 56 84 60 98 40 Z" fill="#ff6fae" ${ln()}/>` +
          `<path d="M92 37 C82 26 70 25 66 33" fill="none" ${ln(2)}/>`) +
        `<ellipse cx="100" cy="40" rx="9" ry="11" fill="#ff4f9a" ${ln()}/></g>`,
    },
    beanie: {
      draw: () => `<path d="M52 54 C46 -8 154 -8 148 54 Z" fill="#36b8c9" ${ln()}/>` +
        '<path d="M76 18 Q71 32 71 46 M100 10 V44 M124 18 Q129 32 129 46" fill="none" stroke="#2a9db0" stroke-width="3" stroke-linecap="round"/>' +
        `<path d="M46 46 Q100 32 154 46 L154 60 Q100 46 46 60 Z" fill="#2a9db0" ${ln()}/>` +
        '<path d="M60 44 V56 M75 41 V53 M91 39 V51 M109 39 V51 M125 41 V53 M140 44 V56" stroke="#1d8598" stroke-width="2.5" stroke-linecap="round"/>' +
        `<circle cx="100" cy="0" r="13" fill="#fff" ${ln()}/><circle cx="96" cy="-4" r="4" fill="#e6f7fa"/>`,
    },
    flowers: {
      box: '36 14 128 66',
      draw: () => tube('M48 60 Q100 26 152 60', '#5fbf5a', 5) +
        `<path d="M70 50 Q62 38 72 34 Q76 44 70 50 Z M130 50 Q138 38 128 34 Q124 44 130 50 Z" fill="#5fbf5a" ${ln(2)}/>` +
        bloom(56, 56, 11, '#ff8fc7') + bloom(144, 56, 11, '#ff8fc7') + bloom(78, 45, 12, '#fff') +
        bloom(122, 45, 12, '#b892ff') + bloom(100, 41, 14, '#ff6f91'),
    },
    pirate: {
      draw: () => `<path d="M34 60 Q100 42 166 60 Q162 34 140 30 Q124 -2 100 0 Q76 -2 60 30 Q38 34 34 60 Z" fill="${DARK}" ${ln()}/>` +
        `<path d="M40 55 Q100 40 160 55" fill="none" stroke="${GOLD}" stroke-width="4" stroke-linecap="round"/>` +
        '<path d="M88 30 L112 44 M112 30 L88 44" stroke="#fff" stroke-width="5" stroke-linecap="round"/>' +
        '<circle cx="100" cy="23" r="9" fill="#fff"/><rect x="95" y="27" width="10" height="7" rx="2" fill="#fff"/>' +
        `<circle cx="96.5" cy="22" r="2.4" fill="${DARK}"/><circle cx="103.5" cy="22" r="2.4" fill="${DARK}"/>`,
    },
    tophat: {
      draw: () => `<ellipse cx="100" cy="54" rx="54" ry="10" fill="${DARK}" ${ln()}/>` +
        `<path d="M70 54 L66 -14 Q100 -20 134 -14 L130 54 Q100 62 70 54 Z" fill="${DARK}" ${ln()}/>` +
        `<path d="M68.7 32 Q100 38 131.3 32 L130.4 46 Q100 53 69.6 46 Z" fill="${RED_D}" ${ln(2)}/>` +
        `<ellipse cx="100" cy="-15" rx="34" ry="7" fill="#4a4766" ${ln()}/>` + shine('M77 -2 L79 24', 4),
    },
    wizard: {
      draw: () => `<ellipse cx="100" cy="54" rx="60" ry="11" fill="#5b4bd6" ${ln()}/>` +
        `<path d="M62 54 Q76 22 92 -6 Q104 -28 138 -32 Q122 -18 120 0 Q122 26 138 54 Q100 62 62 54 Z" fill="#6c5ce7" ${ln()}/>` +
        `<path d="M66 44 Q100 52 134 44 L137 52 Q100 60 63 52 Z" fill="${GOLD}" ${ln(2)}/>` +
        `<path d="${star(88, 24, 8)}" fill="${GOLD}" ${ln(2)}/><path d="${star(116, 30, 5.5)}" fill="${GOLD}" ${ln(2)}/>` +
        `<path d="M104 -2 A9 9 0 1 0 114 12 A7 7 0 0 1 104 -2 Z" fill="#fff3b0" ${ln(2)}/>` +
        `<circle cx="138" cy="-32" r="5" fill="${GOLD}" ${ln(2)}/>`,
    },
    tiara: {
      draw: () => `<path d="M54 53 L62 36 L70 47 L76 22 L88 42 L100 6 L112 42 L124 22 L130 47 L138 36 L146 53 Q100 31 54 53 Z" fill="${GOLD}" ${ln()}/>` +
        `<path d="M52 62 Q100 40 148 62 L146 53 Q100 31 54 53 Z" fill="${GOLD_D}" ${ln()}/>` +
        `<path d="M100 17 L107 28 L100 39 L93 28 Z" fill="${GEM}" ${ln(2)}/>` +
        `<circle cx="76" cy="36" r="4" fill="#ff6fae" ${ln(1.5)}/><circle cx="124" cy="36" r="4" fill="#ff6fae" ${ln(1.5)}/>` +
        `<circle cx="100" cy="6" r="4.5" fill="#fff" ${ln(1.5)}/><circle cx="76" cy="22" r="3.5" fill="#fff" ${ln(1.5)}/><circle cx="124" cy="22" r="3.5" fill="#fff" ${ln(1.5)}/>` +
        `<circle cx="78" cy="51" r="3" fill="${GEM}" ${ln(1.5)}/><circle cx="100" cy="47" r="3" fill="${RUBY}" ${ln(1.5)}/><circle cx="122" cy="51" r="3" fill="${GEM}" ${ln(1.5)}/>` +
        spark(84, 10, 6) + spark(140, 22, 5) + spark(56, 30, 5),
    },
    crown: {
      draw: () => `<path d="M58 62 L52 12 L76 34 L100 0 L124 34 L148 12 L142 62 Q100 70 58 62 Z" fill="${GOLD}" ${ln()}/>` +
        `<path d="M56.3 47 Q100 55 143.7 47 L142 62 Q100 70 58 62 Z" fill="${GOLD_D}" ${ln()}/>` +
        `<circle cx="52" cy="11" r="5.5" fill="#fff3b0" ${ln(2)}/><circle cx="100" cy="-1" r="6" fill="#fff3b0" ${ln(2)}/><circle cx="148" cy="11" r="5.5" fill="#fff3b0" ${ln(2)}/>` +
        `<path d="M100 20 L108 31 L100 42 L92 31 Z" fill="${RUBY}" ${ln(2)}/>` +
        `<circle cx="76" cy="56" r="4" fill="${GEM}" ${ln(1.5)}/><circle cx="100" cy="59" r="5" fill="${RUBY}" ${ln(1.5)}/><circle cx="124" cy="56" r="4" fill="${GEM}" ${ln(1.5)}/>` +
        shine('M61 40 L58 22') + spark(76, 12, 6) + spark(130, 26, 5) + spark(160, 44, 5),
    },

    // Glasses: lenses on the eyes (80, 90) / (120, 90), temples to the head edge.
    glasses: {
      draw: () => both(`<path d="M65 87 L47 82" ${ln()}/>` +
        `<circle cx="80" cy="90" r="15" fill="#d8f1ff" fill-opacity="0.35" stroke="${INK}" stroke-width="4"/>` + shine('M71 85 Q73 80 78 79', 2.5)) +
        `<path d="M95 87 Q100 82 105 87" fill="none" ${ln(3.5)}/>`,
    },
    sunglasses: {
      draw: () => both(`<path d="M62 84 L47 80" ${ln()}/>` +
        `<path d="M60 80 Q80 76 97 81 Q98 104 80 105 Q62 104 60 80 Z" fill="#2d2546" ${ln()}/>` + shine('M67 88 L73 83', 2.5)) +
        `<path d="M97 84 Q100 81 103 84" fill="none" ${ln()}/>`,
    },
    starglasses: {
      draw: () => both(`<path d="M60 84 L47 80" ${ln()}/>` + frame(star(80, 91, 21, 0.55), '#ff4fa3', 4, 'fill="#ffc2e0" fill-opacity="0.4"') +
        shine('M72 88 L76 84', 2.5)),
    },
    goldshades: {
      draw: () => both(frame('M58 82 L47 79', GOLD, 3) + frame('M58 80 H95 Q96 101 84 102 H70 Q58 101 58 80 Z', GOLD, 4, 'fill="#2d2546"') +
        '<path d="M65 95 L77 84 M73 98 L83 89" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity="0.5"/>') +
        frame('M95 82 Q100 78 105 82', GOLD, 3) + spark(56, 70, 6) + spark(146, 101, 5),
    },

    // Neck: between the chin and the tummy (y 130–190); the head hides the top.
    bandana: {
      box: '54 126 92 68',
      draw: () => `<path d="M64 136 Q100 154 136 136 Q124 160 100 186 Q76 160 64 136 Z" fill="${RED}" ${ln()}/>` +
        [[82, 151], [100, 160], [118, 151], [100, 174], [90, 166], [110, 166]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#fff"/>`).join(''),
    },
    scarf: {
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
    bowtie: {
      box: '66 124 68 48',
      draw: () => both(`<path d="M100 150 L78 138 Q72 150 78 162 Z" fill="${RED}" ${ln()}/><circle cx="84" cy="146" r="2.2" fill="#fff"/><circle cx="83" cy="155" r="2.2" fill="#fff"/>`) +
        `<rect x="93" y="143" width="14" height="14" rx="4" fill="${RED_D}" ${ln()}/>`,
    },
    pearls: {
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
    medal: {
      box: '58 126 84 84',
      draw: () => `<path d="M72 138 L86 138 L104 178 L92 180 Z" fill="${BLUE}" ${ln()}/><path d="M128 138 L114 138 L96 178 L108 180 Z" fill="${RED}" ${ln()}/>` +
        `<circle cx="100" cy="188" r="16" fill="${GOLD}" ${ln()}/><circle cx="100" cy="188" r="11.5" fill="none" stroke="${GOLD_D}" stroke-width="2.5"/>` +
        `<path d="${star(100, 188, 8)}" fill="#fff3b0" ${ln(1.5)}/>` + spark(122, 176, 6) + spark(78, 202, 5),
    },

    // Outfits: the torso (the arms come from sleeve); dresses reach down to y ~240.
    tshirt: {
      sleeve: BLUE,
      draw: () => stubs(BLUE) + `<path d="${part(140, 222)}" fill="${BLUE}" ${ln()}/>` +
        '<path d="M80 143 Q100 156 120 143" fill="none" stroke="#3a73e0" stroke-width="4" stroke-linecap="round"/>' +
        '<rect x="110" y="164" width="15" height="14" rx="3" fill="none" stroke="#3a73e0" stroke-width="2.5"/>',
    },
    sweater: {
      sleeve: RED,
      draw: () => stubs(RED) + `<path d="${part(140, 224)}" fill="${RED}"/>` +
        band(160, 170, '#fff3d6') + band(182, 192, '#fff3d6') + band(204, 214, '#fff3d6') +
        `<path d="${part(140, 224)}" fill="none" ${ln()}/>` + tube('M80 142 Q100 154 120 142', RED_D, 4),
    },
    dress: {
      draw: () => `<path d="M76 140 Q100 150 124 140 A47 49 0 0 1 145 194 L156 232 Q142 244 128 236 Q114 246 100 238 Q86 246 72 236 Q58 244 44 232 L55 194 A47 49 0 0 1 76 140 Z" fill="#ff7eb6" ${ln()}/>` +
        [[84, 168], [112, 160], [122, 182], [80, 208], [102, 220], [130, 222], [64, 224], [94, 184], [118, 206]]
          .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.5" fill="#fff"/>`).join('') +
        `<path d="M54 190 Q100 202 146 190 L146 198 Q100 210 54 198 Z" fill="#b892ff" ${ln(2)}/>` +
        both(`<path d="M100 198 L87 190 Q84 198 87 206 Z" fill="#b892ff" ${ln(2)}/>`) + `<circle cx="100" cy="198" r="4" fill="#9b6bff" ${ln(2)}/>`,
    },
    hoodie: {
      sleeve: '#8f7bff',
      draw: () => stubs('#8f7bff') + `<path d="${part(140, 226)}" fill="#8f7bff" ${ln()}/>` +
        `<path d="M70 134 Q62 158 82 162 Q100 166 118 162 Q138 158 130 134 Q100 152 70 134 Z" fill="#7663ea" ${ln()}/>` +
        `<path d="M76 198 H124 L130 220 Q100 226 70 220 Z" fill="#7663ea" ${ln(2)}/>` +
        `<path d="M92 162 L91 180 M108 162 L109 180" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>` +
        `<circle cx="91" cy="182" r="3" fill="#fff" ${ln(1.5)}/><circle cx="109" cy="182" r="3" fill="#fff" ${ln(1.5)}/>`,
    },
    hero: {
      sleeve: '#3d7bff', legs: '#3d7bff',
      draw: () => stubs('#3d7bff') + `<path d="${part(140, 226)}" fill="#3d7bff" ${ln()}/>` +
        `<path d="${part(206, 226, 6)}" fill="${RED}" ${ln()}/>` + `<path d="${part(198, 207, 6, 6)}" fill="${GOLD}" ${ln(2)}/>` +
        `<path d="M100 150 L120 157 Q120 178 100 190 Q80 178 80 157 Z" fill="${GOLD}" ${ln()}/>` +
        `<path d="M105 156 L92 173 L100 173 L95 186 L109 168 L101 168 Z" fill="${RED}" ${ln(1.5)}/>`,
    },
    gown: {
      draw: () => both('<circle cx="66" cy="153" r="11" fill="#ffd1ec" stroke="#3b2f5c" stroke-width="3"/>') +
        `<path d="M56 190 Q42 212 32 234 Q41 244 52 238 Q62 248 74 240 Q87 250 100 242 Q113 250 126 240 Q138 248 148 238 Q159 244 168 234 Q158 212 144 190 Z" fill="#ff8fd0" ${ln()}/>` +
        `<path d="M90 196 H110 L128 238 Q114 248 100 242 Q86 248 72 238 Z" fill="#ffd1ec" ${ln(2)}/>` +
        `<path d="${part(140, 196, 10, 4)}" fill="#ff8fd0" ${ln()}/>` + `<path d="${part(190, 198, 4, 4)}" fill="${GOLD}" ${ln(2)}/>` +
        `<path d="M100 146 L106 154 L100 162 L94 154 Z" fill="${GEM}" ${ln(1.5)}/>` +
        [[88, 216], [112, 216], [100, 230], [60, 228], [140, 228], [78, 172], [122, 172]]
          .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="${GOLD}" ${ln(1)}/>`).join(''),
    },
    tuxedo: {
      sleeve: '#2f2b45', legs: '#2f2b45',
      draw: () => stubs('#2f2b45') + `<path d="${part(140, 226)}" fill="#2f2b45" ${ln()}/>` +
        `<path d="M78 141 Q100 151 122 141 L100 196 Z" fill="#fff" ${ln(2)}/>` +
        both(`<path d="M77 141 L99 194 L84 170 L72 168 L72 150 Z" fill="#47425f" ${ln(2)}/>`) +
        `<path d="M100 155 L89 149 L89 161 Z M100 155 L111 149 L111 161 Z" fill="${DARK}" ${ln(2)}/><circle cx="100" cy="155" r="3" fill="${DARK}"/>` +
        '<circle cx="100" cy="172" r="2" fill="#3b2f5c"/><circle cx="100" cy="184" r="2" fill="#3b2f5c"/>' +
        '<circle cx="100" cy="206" r="3" fill="#fff"/><circle cx="100" cy="218" r="3" fill="#fff"/>' +
        `<path d="M117 176 L131 174 L127 166 Z" fill="${RED}" ${ln(1.5)}/>`,
    },
    spacesuit: {
      sleeve: '#f4f7fc', legs: '#e3e9f3',
      draw: () => stubs('#f4f7fc') + `<path d="${part(140, 226)}" fill="#f4f7fc"/>` + band(198, 206, '#ff9a3d') +
        `<path d="${part(140, 226)}" fill="none" ${ln()}/>` + `<ellipse cx="100" cy="140" rx="33" ry="9" fill="#c9d3e3" ${ln()}/>` +
        `<rect x="84" y="160" width="32" height="24" rx="5" fill="#5b6b8c" ${ln(2)}/>` +
        `<circle cx="92" cy="172" r="3.2" fill="${RED}"/><circle cx="100" cy="172" r="3.2" fill="${GOLD}"/><circle cx="108" cy="172" r="3.2" fill="#5fd068"/>` +
        `<circle cx="72" cy="172" r="7" fill="${BLUE}" ${ln(2)}/><path d="${star(72, 172, 4.5)}" fill="#fff"/>` +
        `<rect x="92" y="212" width="16" height="9" rx="3" fill="#c9d3e3" ${ln(1.5)}/>`,
    },
    armor: {
      sleeve: GOLD, legs: '#f5c033',
      draw: () => both(`<path d="M76 146 Q54 140 48 160 Q56 170 74 166 Z" fill="${GOLD}" ${ln()}/>`) +
        `<path d="${part(140, 224)}" fill="${GOLD}" ${ln()}/>` +
        `<path d="M100 150 V214 M70 198 Q100 208 130 198 M74 212 Q100 222 126 212" fill="none" stroke="${GOLD_D}" stroke-width="3" stroke-linecap="round"/>` +
        `<path d="M66 170 Q83 184 100 172 Q117 184 134 170" fill="none" ${ln(2)}/>` + tube('M78 142 Q100 154 122 142', GOLD_D, 5) +
        `<path d="M100 157 L108 167 L100 177 L92 167 Z" fill="${RUBY}" ${ln(2)}/>` + shine('M70 160 Q72 178 80 190', 4) +
        spark(80, 160, 6) + spark(124, 206, 5),
    },

    // Back: behind everything; only the sides and the bottom show on a character.
    backpack: {
      draw: () => tube('M84 130 Q84 114 100 114 Q116 114 116 130', '#3f9b4a', 4) +
        `<rect x="44" y="128" width="112" height="96" rx="24" fill="#5fbf5a" ${ln()}/>` +
        `<path d="M44 158 Q44 128 68 128 H132 Q156 128 156 158 Q100 172 44 158 Z" fill="#4aa64a" ${ln()}/>` +
        `<rect x="72" y="180" width="56" height="34" rx="10" fill="#4aa64a" ${ln()}/>` +
        `<rect x="94" y="158" width="12" height="11" rx="2" fill="${GOLD}" ${ln(2)}/>` + shine('M52 176 V208', 4),
    },
    cape: {
      draw: () => `<path d="M66 136 Q100 128 134 136 L172 232 Q156 244 138 236 Q120 248 100 240 Q80 248 62 236 Q44 244 28 232 Z" fill="${RED_D}" ${ln()}/>` +
        '<path d="M74 146 L50 222 M126 146 L150 222" stroke="#c7303a" stroke-width="3" stroke-linecap="round"/>' +
        tube('M68 139 Q100 147 132 139', GOLD, 3) + both(`<circle cx="68" cy="139" r="6" fill="${GOLD}" ${ln(2)}/>`),
    },
    fairywings: {
      draw: () => both(`<path d="M96 162 C78 120 30 86 12 102 C-2 118 26 156 96 174 Z" fill="#a9e8ff" ${ln()}/>` +
        `<path d="M96 176 C66 172 24 190 32 220 C42 242 80 224 96 186 Z" fill="#ffc2e6" ${ln()}/>` +
        '<path d="M92 164 Q60 128 24 110 M92 180 Q62 196 42 220" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>' +
        '<circle cx="38" cy="124" r="4" fill="#fff"/><circle cx="54" cy="210" r="3" fill="#fff"/><circle cx="26" cy="108" r="2.5" fill="#fff"/>'),
    },
    jetpack: {
      draw: () => `<rect x="54" y="136" width="92" height="64" rx="12" fill="#8c97ad" ${ln()}/>` + both(
        `<g class="an-flicker"><path d="M36 214 Q45 252 54 214 Z" fill="#ff7a2b" ${ln(2)}/><path d="M40 214 Q45 236 50 214 Z" fill="${GOLD}"/></g>` +
        `<path d="M36 204 H54 L58 216 H32 Z" fill="${DARK}" ${ln()}/>` +
        `<rect x="30" y="134" width="30" height="74" rx="13" fill="#dfe6f0" ${ln()}/>` +
        `<path d="M30 150 Q30 118 45 110 Q60 118 60 150 Z" fill="${RED}" ${ln()}/>` +
        `<rect x="30" y="174" width="30" height="9" fill="${BLUE}" ${ln(2)}/>` + shine('M38 156 V200', 4)),
    },
    angelwings: {
      box: '-6 70 212 170',
      draw: () => both(`<path d="M94 172 C86 126 56 92 8 90 C0 92 -2 102 6 108 Q-6 126 14 130 Q0 150 24 156 Q12 178 38 180 Q32 202 56 200 Q58 222 78 212 L96 190 Z" fill="#fff" ${ln()}/>` +
        `<path d="M92 160 C82 126 56 100 14 98 Q22 112 36 110 Q42 124 54 122 Q62 136 72 134 Q78 148 90 148 Z" fill="#fff3c4" ${ln(2)}/>` +
        '<path d="M14 130 Q40 134 58 134 M24 156 Q50 156 70 150 M38 180 Q60 176 80 166 M56 200 Q72 192 86 180" fill="none" stroke="#c9d3e3" stroke-width="2.5" stroke-linecap="round"/>' +
        `<path d="M90 156 C78 118 50 96 10 94" fill="none" stroke="${GOLD}" stroke-width="3" stroke-linecap="round"/>` +
        spark(26, 80, 6) + spark(18, 196, 5)),
    },

    // Shoes: replace the feet at (85, 245) / (115, 245); the left one is drawn and mirrored.
    slippers: {
      draw: () => both(`<path d="M68 248 Q66 235 85 235 Q104 235 102 248 Q85 254 68 248 Z" fill="#ff9fc8" ${ln()}/>` +
        `<path d="M74 241 Q70 233 77 231 Q80 225 86 228 Q92 225 95 231 Q101 234 96 241 Q85 245 74 241 Z" fill="#fff" ${ln(2)}/>`),
    },
    sneakers: {
      draw: () => both(`<path d="M68 245 Q66 233 78 231 L88 229 Q98 225 100 232 L101 246 Z" fill="${BLUE}" ${ln()}/>` +
        `<path d="M66 247 Q66 243 72 243 H99 Q102 243 102 247 Q102 252 98 252 H71 Q66 252 66 247 Z" fill="#fff" ${ln()}/>` +
        `<path d="M83 232 L88 238 M89 230 L94 236" ${ln(2)}/>` + `<path d="M74 240 Q84 236 96 240" fill="none" stroke="${RED}" stroke-width="2.5" stroke-linecap="round"/>`),
    },
    rainboots: {
      draw: () => both(`<path d="M73 222 H97 L98 244 Q98 250 92 250 H72 Q64 250 66 242 Q68 236 73 234 Z" fill="${GOLD}" ${ln()}/>` +
        `<rect x="71" y="219" width="28" height="7" rx="3" fill="#f0b400" ${ln(2)}/>` +
        `<rect x="64" y="247" width="36" height="6" rx="3" fill="#4a3550" ${ln(2)}/>` + shine('M78 230 V242')),
    },
    skates: {
      draw: () => both(`<circle cx="74" cy="253" r="4.5" fill="${GEM}" ${ln(2)}/><circle cx="93" cy="253" r="4.5" fill="${GEM}" ${ln(2)}/>` +
        `<path d="M74 222 H97 L98 246 H66 Q64 238 74 236 Z" fill="#fff" ${ln()}/>` +
        `<path d="M80 226 L90 232 M90 226 L80 232 M80 234 L90 240" ${ln(1.5)}/>` +
        `<rect x="64" y="245" width="36" height="6" rx="3" fill="#ff6fae" ${ln(2)}/>`),
    },
    rocketboots: {
      draw: () => both(`<g class="an-flicker"><path d="M76 250 Q84 264 92 250 Z" fill="#ff7a2b" ${ln(2)}/><path d="M80 250 Q84 258 88 250 Z" fill="${GOLD}"/></g>` +
        `<path d="M73 222 H97 L98 244 Q98 250 92 250 H72 Q64 250 66 242 Q68 236 73 234 Z" fill="${GOLD}" ${ln()}/>` +
        `<path d="M66 242 Q68 236 73 234 L80 234 Q80 244 82 250 H72 Q64 250 66 242 Z" fill="${RED}" ${ln(2)}/>` +
        `<rect x="71" y="219" width="28" height="7" rx="3" fill="${GOLD_D}" ${ln(2)}/>` +
        `<path d="M74 230 H97" stroke="${RED}" stroke-width="4"/>` + shine('M90 236 V244')) +
        spark(62, 216, 5) + spark(140, 232, 5),
    },

    // In hand: drawn around the paw at (0, 0).
    balloon: {
      draw: () => '<g class="an-sway"><path d="M0 0 Q-10 -40 10 -66 Q22 -80 23 -88" fill="none" stroke="#3b2f5c" stroke-width="2"/>' +
        `<path d="M19 -86 L27 -86 L23 -92 Z" fill="${RED_D}" ${ln(2)}/><ellipse cx="23" cy="-114" rx="22" ry="25" fill="${RED}" ${ln()}/>` +
        '<ellipse cx="15" cy="-122" rx="5" ry="8" transform="rotate(20 15 -122)" fill="#fff" opacity="0.7"/></g>',
    },
    sword: {
      box: '-24 -112 74 136',
      draw: () => '<g transform="rotate(20)">' +
        `<path d="M-5 -12 L-5 -92 L0 -104 L5 -92 L5 -12 Z" fill="#e3b27a" ${ln()}/><path d="M0 -20 V-90" stroke="#c48c52" stroke-width="2"/>` +
        `<rect x="-3.5" y="-10" width="7" height="24" rx="2" fill="#8a5a3a" ${ln(2)}/>` +
        `<rect x="-15" y="-16" width="30" height="8" rx="4" fill="#a8703f" ${ln()}/><circle cx="0" cy="16" r="4.5" fill="#a8703f" ${ln(2)}/></g>`,
    },
    wand: {
      box: '-18 -94 72 116',
      draw: () => tube('M-3 14 L18 -44', DARK, 4) + tube('M15 -36 L18 -44', '#fff', 4) +
        `<g class="an-pulse"><path d="${star(20, -58, 16)}" fill="${GOLD}" ${ln()}/></g>` +
        spark(42, -72, 6) + spark(2, -82, 5) + spark(38, -40, 4),
    },
    guitar: {
      box: '-34 -72 92 110',
      draw: () => '<g transform="rotate(36) scale(1.1)">' +
        `<rect x="-3.5" y="-60" width="7" height="62" fill="#8a5a3a" ${ln(2)}/>` +
        `<path d="M-6 -60 L-5 -74 L5 -74 L6 -60 Z" fill="${DARK}" ${ln(2)}/>` +
        `<path d="M0 0 C-14 -2 -14 12 -9 16 C-18 20 -16 36 0 36 C16 36 18 20 9 16 C14 12 14 -2 0 0 Z" fill="${RED}" ${ln()}/>` +
        `<circle cx="0" cy="14" r="5" fill="${DARK}"/><rect x="-6" y="24" width="12" height="4" rx="1.5" fill="${DARK}"/>` +
        '<path d="M-1.5 -58 V26 M1.5 -58 V26" stroke="#fff" stroke-width="0.8" opacity="0.8"/>' +
        `<circle cx="-7" cy="-70" r="1.8" fill="#fff"/><circle cx="7" cy="-70" r="1.8" fill="#fff"/><circle cx="-7" cy="-64" r="1.8" fill="#fff"/><circle cx="7" cy="-64" r="1.8" fill="#fff"/></g>`,
    },
    scepter: {
      box: '-30 -130 84 166',
      draw: () => '<g transform="rotate(16)">' + tube('M0 22 L0 -82', GOLD, 6) +
        `<circle cx="0" cy="24" r="6" fill="${GOLD_D}" ${ln(2)}/><rect x="-6" y="-14" width="12" height="6" rx="3" fill="${GOLD_D}" ${ln(2)}/>` +
        `<path d="M-14 -84 Q0 -78 14 -84 L10 -92 H-10 Z" fill="${GOLD_D}" ${ln(2)}/>` +
        `<path d="M-14 -104 L-8 -114 H8 L14 -104 L0 -88 Z" fill="${GEM}" ${ln()}/>` +
        `<path d="M-14 -104 H14 M-4 -114 L-6 -104 L0 -88 M4 -114 L6 -104 L0 -88" fill="none" ${ln(1.5)}/>` +
        '<path d="M-9 -108 L-6 -112" stroke="#fff" stroke-width="2" stroke-linecap="round"/></g>' +
        spark(30, -124, 7) + spark(-2, -112, 5) + spark(42, -88, 4),
    },
  };
})();
