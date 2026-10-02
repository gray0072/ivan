// Hats: sit on the head top (brim y 40–60).
// Cheap to elite; each entry is the catalog item (ITEMS) and its drawing (WEAR_ART), added by addItems.

(() => {
  const { GOLD, GOLD_D, GEM, RUBY, RED, RED_D, BLUE, DARK, f1, both, shine, star, spark, bloom } = WEAR_KIT;
  // A point at t on the quadratic curve a → c (control b), points as [x, y].
  const qp = (a, b, c, t) => [0, 1].map(k => f1((1 - t) * (1 - t) * a[k] + 2 * t * (1 - t) * b[k] + t * t * c[k]));
  // Flips a class animation upside down so a flame flickers from its foot (as flip() in items/furniture.js).
  const flip = (cls, s) => `<g transform="scale(1 -1)"><g class="${cls}"><g transform="scale(1 -1)">${s}</g></g></g>`;
  // A small candle flame standing on (x, y).
  const flame = (x, y, d = '') => flip(`an-flicker${d}`,
    `<path d="M${x} ${y - 16}C${x + 7} ${y - 7} ${x + 6} ${y} ${x} ${y}C${x - 6} ${y} ${x - 7} ${y - 7} ${x} ${y - 16}Z" fill="#ffa62b" ${ln(1.5)}/>` +
    `<path d="M${x} ${y - 9}C${x + 3} ${y - 5} ${x + 3} ${y - 1} ${x} ${y - 1}C${x - 3} ${y - 1} ${x - 3} ${y - 5} ${x} ${y - 9}Z" fill="#fff3a0"/>`);
  // SMIL swing: rotates its parent group to and fro around (x, y).
  const swing = (x, y, a, dur) => `<animateTransform attributeName="transform" type="rotate" values="${-a} ${x} ${y};${a} ${x} ${y};${-a} ${x} ${y}" dur="${dur}s" repeatCount="indefinite"/>`;
  // A leaf of length l at (x, y), turned by deg.
  // (Inside a group that sets the ink stroke, line = false leaves it out.)
  const leaf = (x, y, l, deg, fill, line = true) => `<ellipse cx="${x}" cy="${y}" rx="${l}" ry="${f1(l * 0.45)}" transform="rotate(${f1(deg)} ${x} ${y})" fill="${fill}"${line ? ' ' + ln(1.5) : ''}/>`;

  addItems('head', WEAR_ART, [
    { id: 'partyhat', name: 'Paper party hat', price: 15,
      draw: () => '<g transform="rotate(8 100 50)">' +
        `<path d="M76 52 L100 -8 L124 52 Q100 58 76 52 Z" fill="#7fd4ff" ${ln()}/>` +
        '<circle cx="96" cy="14" r="3.5" fill="#ff6fae"/><circle cx="106" cy="28" r="3.5" fill="#ffd23f"/><circle cx="90" cy="38" r="3.5" fill="#ffd23f"/>' +
        '<circle cx="112" cy="44" r="3.5" fill="#ff6fae"/><circle cx="101" cy="46" r="3" fill="#fff"/>' +
        `<path d="M76 52 L80 46 L84 52 L88 47 L92 53 L96 48 L100 54 L104 48 L108 53 L112 47 L116 52 L120 46 L124 52" fill="none" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/>` +
        `<path d="M100 -8 L92 -16 M100 -8 L100 -19 M100 -8 L108 -16" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>` +
        '<path d="M100 -8 L92 -16 M100 -8 L100 -19 M100 -8 L108 -16" stroke="#ffd23f" stroke-width="3" stroke-linecap="round"/></g>',
    },
    { id: 'cap', name: 'Cap', price: 25,
      draw: () => `<path d="M52 60 C50 6 150 6 148 60 Q100 50 52 60 Z" fill="${RED}" ${ln()}/>` +
        `<path d="M100 20 Q86 34 84 56 M100 20 Q114 34 116 56" fill="none" ${ln(2)}/>` + shine('M64 40 Q70 26 84 20') +
        `<path d="M114 57 Q146 49 172 60 Q170 69 150 69 Q130 68 114 63 Z" fill="${RED_D}" ${ln()}/>` +
        `<circle cx="100" cy="19" r="5" fill="${RED_D}" ${ln(2)}/>`,
    },
    { id: 'bow', name: 'Big bow', price: 25,
      box: '46 4 108 70',
      draw: () => '<g transform="rotate(-10 100 40)">' +
        both(`<path d="M96 44 L84 68 L95 64 L99 46 Z" fill="#ff6fae" ${ln()}/>` +
          `<path d="M98 40 C84 12 56 12 56 34 C56 56 84 60 98 40 Z" fill="#ff6fae" ${ln()}/>` +
          `<path d="M92 37 C82 26 70 25 66 33" fill="none" ${ln(2)}/>`) +
        `<ellipse cx="100" cy="40" rx="9" ry="11" fill="#ff4f9a" ${ln()}/></g>`,
    },
    { id: 'strawhat', name: 'Straw sun hat', price: 40,
      draw: () => `<ellipse cx="100" cy="52" rx="66" ry="12" fill="#f2d27a" ${ln()}/>` +
        '<path d="M44 52 Q48 58 56 60 M60 46 Q58 54 64 62 M140 46 Q142 54 136 62 M156 52 Q152 58 144 60" fill="none" stroke="#d6ad4f" stroke-width="2" stroke-linecap="round"/>' +
        `<path d="M70 52 Q68 12 100 10 Q132 12 130 52 Q100 58 70 52 Z" fill="#f7dd8c" ${ln()}/>` +
        '<path d="M80 22 Q100 16 120 22 M74 32 Q100 26 126 32" fill="none" stroke="#d6ad4f" stroke-width="2" stroke-linecap="round"/>' +
        `<path d="M70 40 Q100 46 130 40 L130 50 Q100 56 70 50 Z" fill="${RED}" ${ln(2)}/>` + bloom(118, 44, 11, '#fff'),
    },
    { id: 'beanie', name: 'Beanie', price: 60,
      draw: () => `<path d="M52 54 C46 -8 154 -8 148 54 Z" fill="#36b8c9" ${ln()}/>` +
        '<path d="M76 18 Q71 32 71 46 M100 10 V44 M124 18 Q129 32 129 46" fill="none" stroke="#2a9db0" stroke-width="3" stroke-linecap="round"/>' +
        `<path d="M46 46 Q100 32 154 46 L154 60 Q100 46 46 60 Z" fill="#2a9db0" ${ln()}/>` +
        '<path d="M60 44 V56 M75 41 V53 M91 39 V51 M109 39 V51 M125 41 V53 M140 44 V56" stroke="#1d8598" stroke-width="2.5" stroke-linecap="round"/>' +
        `<circle cx="100" cy="0" r="13" fill="#fff" ${ln()}/><circle cx="96" cy="-4" r="4" fill="#e6f7fa"/>`,
    },
    // Halloween: a smiling pumpkin worn as a hat, its leaf wiggling.
    { id: 'pumpkinhat', name: 'Pumpkin hat', price: 80,
      draw: () => tube('M100 4 Q100 -6 106 -12', '#7a5a2a', 5) +
        `<g class="an-wiggle">${leaf(116, -8, 10, -20, '#5fbf5a')}</g>` +
        `<ellipse cx="72" cy="32" rx="26" ry="27" fill="#ff8a1f" ${ln()}/><ellipse cx="128" cy="32" rx="26" ry="27" fill="#ff8a1f" ${ln()}/>` +
        `<ellipse cx="100" cy="30" rx="28" ry="30" fill="#ff9d2e" ${ln()}/>` +
        `<path d="M86 22 L92 12 L97 22 Z M103 22 L108 12 L114 22 Z" fill="${DARK}" ${ln(1.5)}/>` +
        `<path d="M84 34 Q100 52 116 34 L110 36 L106 40 L100 37 L94 40 L90 36 Z" fill="${DARK}" ${ln(1.5)}/>` +
        shine('M58 22 Q60 12 68 8') + shine('M128 12 Q138 14 144 24', 2.5),
    },
    // Swedish Midsummer: a wreath of field flowers and leaves, blue and yellow ribbons swaying at the sides.
    { id: 'midsummerwreath', name: 'Midsummer wreath', price: 100,
      box: '28 14 144 114',
      draw: () => {
        const A = [46, 60], B = [100, 24], C = [154, 60];
        const ribbon = (x, c1, c2) => `<g>${swing(x, 58, 6, 3.2)}${tube(`M${x} 58 Q${x - 8} 78 ${x - 2} 96 Q${x + 2} 106 ${x - 4} 116`, c1, 5)}` +
          `${tube(`M${x} 58 Q${x + 4} 76 ${x + 1} 92 Q${x - 2} 100 ${x + 3} 108`, c2, 5)}</g>`;
        let h = ribbon(46, BLUE, GOLD) + ribbon(154, GOLD, BLUE) + tube('M46 60 Q100 24 154 60', '#4f9e3f', 6) + `<g ${ln(1.5)}>`;
        for (let i = 0; i < 11; i++) {
          const t = 0.04 + i * 0.092, [x, y] = qp(A, B, C, t);
          h += leaf(x, y, 7, (t - 0.5) * 70 + (i % 2 ? 40 : -40), i % 2 ? '#7fcf5a' : '#5fbf5a', false);
        }
        h += '</g>';
        const FL = ['#5b8cff', '#fff', '#ff8fc7', GOLD, '#fff', '#b892ff', '#5b8cff'];
        FL.forEach((c, i) => { const [x, y] = qp(A, B, C, 0.08 + i * 0.14); h += bloom(x, y, i === 3 ? 12 : 10, c); });
        return h;
      },
    },
    { id: 'flowers', name: 'Flower crown', price: 120,
      box: '36 14 128 66',
      draw: () => tube('M48 60 Q100 26 152 60', '#5fbf5a', 5) +
        `<path d="M70 50 Q62 38 72 34 Q76 44 70 50 Z M130 50 Q138 38 128 34 Q124 44 130 50 Z" fill="#5fbf5a" ${ln(2)}/>` +
        bloom(56, 56, 11, '#ff8fc7') + bloom(144, 56, 11, '#ff8fc7') + bloom(78, 45, 12, '#fff') +
        bloom(122, 45, 12, '#b892ff') + bloom(100, 41, 14, '#ff6f91'),
    },
    // Christmas, Swedish: the red pointy hat of a tomte, the pompom swinging at its drooping tip.
    { id: 'tomtehat', name: 'Tomte hat', price: 150,
      draw: () => `<path d="M56 52 Q58 4 104 -6 Q146 -12 164 30 Q150 18 136 18 Q142 36 144 52 Z" fill="${RED}" ${ln()}/>` +
        shine('M70 34 Q76 10 98 2') +
        '<path d="M84 20 l3 3 l3 -3 M110 10 l3 3 l3 -3 M120 34 l3 3 l3 -3 M96 38 l3 3 l3 -3 M140 4 l3 3 l3 -3" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.8"/>' +
        `<path d="M48 50 Q100 38 152 50 L152 64 Q100 52 48 64 Z" fill="${RED_D}" ${ln()}/>` +
        '<path d="M60 47 V59 M75 44 V56 M91 42 V54 M109 42 V54 M125 44 V56 M140 47 V59" stroke="#c22f39" stroke-width="2.5" stroke-linecap="round"/>' +
        `<g>${swing(162, 28, 10, 2.4)}<circle cx="164" cy="38" r="10" fill="#fff" ${ln()}/><circle cx="160" cy="35" r="3.5" fill="#eef"/></g>`,
    },
    // A beanie in three colours with a spinning propeller on top.
    { id: 'propellerhat', name: 'Propeller beanie', price: 200,
      draw: () => {
        const seg = c => `<path d="M54 56 C53 18 76 10 100 11 Q82 22 80 51 Q66 52 54 56 Z" fill="${c}" ${ln(2.5)}/>`;
        return `<path d="M54 56 C52 6 148 6 146 56 Q100 46 54 56 Z" fill="${GOLD}" ${ln()}/>` + seg(RED) +
          `<g transform="matrix(-1 0 0 1 200 0)">${seg(BLUE)}</g>` + shine('M64 40 Q66 26 76 20') +
          `<path d="M52 48 Q100 38 148 48 L148 58 Q100 48 52 58 Z" fill="#5fbf5a" ${ln(2.5)}/>` +
          `<rect x="97" y="-6" width="6" height="18" rx="2" fill="#a8a6c0" ${ln(2)}/>` +
          '<g transform="translate(100 -6)"><g><animateTransform attributeName="transform" type="scale" values="1 1;-1 1;1 1" dur="0.5s" repeatCount="indefinite"/>' +
          `<path d="M0 0 C-8 -7 -26 -7 -32 -2 C-26 4 -8 4 0 0 Z" fill="${RED}" ${ln(2)}/><path d="M0 0 C8 -7 26 -7 32 -2 C26 4 8 4 0 0 Z" fill="${BLUE}" ${ln(2)}/></g>` +
          `<circle cx="0" cy="0" r="4.5" fill="${GOLD}" ${ln(2)}/></g>`;
      },
    },
    { id: 'pirate', name: 'Pirate hat', price: 250,
      draw: () => `<path d="M34 60 Q100 42 166 60 Q162 34 140 30 Q124 -2 100 0 Q76 -2 60 30 Q38 34 34 60 Z" fill="${DARK}" ${ln()}/>` +
        `<path d="M40 55 Q100 40 160 55" fill="none" stroke="${GOLD}" stroke-width="4" stroke-linecap="round"/>` +
        '<path d="M88 30 L112 44 M112 30 L88 44" stroke="#fff" stroke-width="5" stroke-linecap="round"/>' +
        '<circle cx="100" cy="23" r="9" fill="#fff"/><rect x="95" y="27" width="10" height="7" rx="2" fill="#fff"/>' +
        `<circle cx="96.5" cy="22" r="2.4" fill="${DARK}"/><circle cx="103.5" cy="22" r="2.4" fill="${DARK}"/>`,
    },
    // Swedish Vikings: an iron helmet with horns (the storybook kind).
    { id: 'vikinghelmet', name: 'Viking helmet', price: 300,
      draw: () => both(`<path d="M68 28 Q46 26 36 8 Q30 -4 34 -18 Q24 4 30 24 Q38 42 66 46 Z" fill="#fff3d6" ${ln()}/>` +
          '<path d="M34 12 Q30 4 31 -4 M46 33 Q38 28 34 22" fill="none" stroke="#d8c39a" stroke-width="3" stroke-linecap="round"/>') +
        `<path d="M54 58 C52 -2 148 -2 146 58 Q100 50 54 58 Z" fill="#b8c2d6" ${ln()}/>` + shine('M64 40 Q66 22 82 14') +
        `<path d="M94 14 Q100 12 106 14 L106 44 Q100 43 94 44 Z" fill="#8a96ad" ${ln(2)}/>` +
        `<path d="M50 46 Q100 36 150 46 L150 62 Q100 52 50 62 Z" fill="#8a96ad" ${ln()}/>` +
        [60, 80, 100, 120, 140].map(x => `<circle cx="${x}" cy="${f1(54 - 5 * (1 - ((x - 100) / 50) ** 2))}" r="2.8" fill="${GOLD}" ${ln(1.2)}/>`).join(''),
    },
    { id: 'tophat', name: 'Top hat', price: 400,
      draw: () => `<ellipse cx="100" cy="54" rx="54" ry="10" fill="${DARK}" ${ln()}/>` +
        `<path d="M70 54 L66 -14 Q100 -20 134 -14 L130 54 Q100 62 70 54 Z" fill="${DARK}" ${ln()}/>` +
        `<path d="M68.7 32 Q100 38 131.3 32 L130.4 46 Q100 53 69.6 46 Z" fill="${RED_D}" ${ln(2)}/>` +
        `<ellipse cx="100" cy="-15" rx="34" ry="7" fill="#4a4766" ${ln()}/>` + shine('M77 -2 L79 24', 4),
    },
    // Halloween: a crooked witch hat with a patch, a buckle and a tiny friendly bat fluttering by.
    { id: 'witchhat', name: 'Witch hat', price: 500,
      draw: () => {
        const wing = `<path d="M146 -12 Q138 -22 126 -16 Q131 -12 130 -7 Q135 -10 138 -5 Q140 -10 146 -8 Z" fill="${DARK}" ${ln(1.5)}/>`;
        return `<ellipse cx="100" cy="54" rx="64" ry="11" fill="#4a3a75" ${ln()}/>` +
          `<path d="M66 54 Q78 24 86 2 Q90 -14 78 -30 Q104 -28 112 -4 Q122 24 134 54 Q100 62 66 54 Z" fill="#5a4790" ${ln()}/>` +
          shine('M78 40 Q86 20 90 4') +
          `<path d="M104 8 L118 6 L120 20 L106 22 Z" fill="#5fbf5a" ${ln(2)}/><path d="M108 11 l3 2 M114 17 l3 -2" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"/>` +
          `<path d="M70 42 Q100 50 130 42 L133 52 Q100 60 67 52 Z" fill="#ff9d2e" ${ln(2)}/>` +
          `<rect x="92" y="42" width="16" height="13" rx="2" fill="${GOLD}" ${ln(2)}/><rect x="97" y="46" width="6" height="5" fill="#ff9d2e"/>` +
          `<g class="an-float">${wing}<g transform="matrix(-1 0 0 1 292 0)">${wing}</g>` +
          `<ellipse cx="146" cy="-10" rx="5.5" ry="6.5" fill="${DARK}" ${ln(1.5)}/><path d="M142 -15 L141 -21 L145 -16 M150 -15 L151 -21 L147 -16" fill="${DARK}" ${ln(1.2)}/>` +
          '<circle cx="144" cy="-11" r="1.4" fill="#fff"/><circle cx="148" cy="-11" r="1.4" fill="#fff"/></g>' +
          `<path d="${star(60, 6, 5)}" fill="${GOLD}" class="an-twinkle" ${ln(1.5)}/>`;
      },
    },
    // Swedish Lucia: a lingonberry wreath with five white candles, flames flickering.
    { id: 'luciacrown', name: 'Lucia candle crown', price: 600,
      draw: () => {
        const A = [50, 56], B = [100, 32], C = [150, 56];
        let candles = '', flames = '', leaves = '';
        [0.1, 0.3, 0.5, 0.7, 0.9].forEach((t, i) => {
          const [x, y] = qp(A, B, C, t), hgt = i === 2 ? 38 : i % 4 ? 32 : 26;
          candles += `<rect x="${x - 5}" y="${f1(y - hgt)}" width="10" height="${hgt}" rx="2" fill="#fff" ${ln(2)}/>` +
            `<path d="M${x} ${f1(y - hgt)} v-4" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`;
          flames += flame(x, f1(y - hgt - 2), ` an-d${(i % 4) + 1}`);
        });
        for (let i = 0; i < 11; i++) {
          const t = 0.03 + i * 0.094, [x, y] = qp(A, B, C, t);
          leaves += leaf(x, y + 2, 7, (t - 0.5) * 50 + (i % 2 ? 35 : -35), i % 2 ? '#3f8f4a' : '#2f7a3f', false);
        }
        for (let i = 0; i < 7; i++) {
          const [x, y] = qp(A, B, C, 0.06 + i * 0.147);
          leaves += `<circle cx="${x}" cy="${f1(y + 6)}" r="3.6" fill="${RED_D}"/>`;
        }
        return tube('M50 58 Q100 34 150 58', '#2f7a3f', 6) + candles + `<g ${ln(1.5)}>${leaves}</g>` + flames;
      },
    },
    { id: 'wizard', name: 'Wizard hat', price: 700,
      draw: () => `<ellipse cx="100" cy="54" rx="60" ry="11" fill="#5b4bd6" ${ln()}/>` +
        `<path d="M62 54 Q76 22 92 -6 Q104 -28 138 -32 Q122 -18 120 0 Q122 26 138 54 Q100 62 62 54 Z" fill="#6c5ce7" ${ln()}/>` +
        `<path d="M66 44 Q100 52 134 44 L137 52 Q100 60 63 52 Z" fill="${GOLD}" ${ln(2)}/>` +
        `<path d="${star(88, 24, 8)}" fill="${GOLD}" ${ln(2)}/><path d="${star(116, 30, 5.5)}" fill="${GOLD}" ${ln(2)}/>` +
        `<path d="M104 -2 A9 9 0 1 0 114 12 A7 7 0 0 1 104 -2 Z" fill="#fff3b0" ${ln(2)}/>` +
        `<circle cx="138" cy="-32" r="5" fill="${GOLD}" ${ln(2)}/>`,
    },
    // A rainbow-flower headband with a glowing golden unicorn horn.
    { id: 'unicornband', name: 'Unicorn headband', price: 1000,
      draw: () => `<path class="an-glow" d="M80 46 L100 -36 L120 46 Z" fill="#fff3b0" opacity="0.8"/>` +
        tube('M48 60 Q100 22 152 60', '#ff8fc7', 6) +
        `<path d="M86 44 L100 -26 L114 44 Q100 50 86 44 Z" fill="${GOLD}" ${ln()}/>` +
        `<path d="M88 34 Q100 24 112 30 M91 20 Q100 12 109 16 M94 6 Q100 0 106 2 M97 -8 L103 -10" fill="none" stroke="${GOLD_D}" stroke-width="3" stroke-linecap="round"/>` +
        shine('M93 30 L99 -10', 2.5) +
        leaf(72, 46, 8, -30, '#7fcf5a') + leaf(128, 46, 8, 30, '#7fcf5a') +
        bloom(60, 54, 10, '#7ad7ff') + bloom(78, 42, 11, '#ff6fae') + bloom(122, 42, 11, '#b892ff') + bloom(140, 54, 10, '#ffd23f') +
        spark(124, -18, 6) + spark(74, -6, 5) + spark(132, 14, 4),
    },
    // Winter: an ice-queen crown of crystals, its snowflake turning slowly.
    { id: 'icecrown', name: 'Ice queen crown', gems: 15,
      draw: () => {
        const A = [54, 56], B = [100, 38], C = [146, 56];
        let h = '';
        [[0.06, 16], [0.2, 28], [0.35, 22], [0.65, 22], [0.8, 28], [0.94, 16], [0.5, 48]].forEach(([t, l]) => {
          const [x, y] = qp(A, B, C, t), w = l > 40 ? 10 : 7;
          h += `<path d="M${f1(x - w)} ${y} L${f1(x - w * 0.4)} ${f1(y - l * 0.7)} L${x} ${f1(y - l)} L${f1(x + w * 0.4)} ${f1(y - l * 0.7)} L${f1(x + w)} ${y} Z" fill="#d9f4ff"/>` +
            `<path d="M${x} ${f1(y - l + 4)} V${f1(y - 3)}" stroke="#a8e4ff" stroke-width="2.5"/>`;
        });
        h = `<g ${ln(2)}>${h}</g>`;
        h += `<path d="M52 62 Q100 42 148 62 L146 54 Q100 34 54 54 Z" fill="${GEM}" ${ln()}/>` + shine('M62 54 Q80 46 92 44', 2.5);
        let arms = '';
        for (let i = 0; i < 6; i++) arms += `<g transform="rotate(${i * 60} 100 22)"><path d="M100 22 V9 M100 14 l-4 -4 M100 14 l4 -4" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/></g>`;
        h += `<circle cx="100" cy="22" r="15" fill="#7ad7ff" ${ln(2.5)}/><g class="an-spin"><circle cx="100" cy="22" r="13" fill="none"/>${arms}</g>` +
          `<circle cx="100" cy="22" r="3" fill="#fff"/>` +
          [70, 100, 130].map((x, i) => `<path d="M${x} ${i === 1 ? 46 : 52} l4 -5 l4 5 l-4 5 Z" fill="${i === 1 ? RUBY : '#fff'}" transform="translate(-4 0)" ${ln(1.2)}/>`).join('');
        return h + spark(66, 18, 6) + spark(136, 12, 5) + spark(118, -12, 5);
      },
    },
    { id: 'tiara', name: 'Diamond tiara', gems: 20,
      draw: () => `<path d="M54 53 L62 36 L70 47 L76 22 L88 42 L100 6 L112 42 L124 22 L130 47 L138 36 L146 53 Q100 31 54 53 Z" fill="${GOLD}" ${ln()}/>` +
        `<path d="M52 62 Q100 40 148 62 L146 53 Q100 31 54 53 Z" fill="${GOLD_D}" ${ln()}/>` +
        `<path d="M100 17 L107 28 L100 39 L93 28 Z" fill="${GEM}" ${ln(2)}/>` +
        `<circle cx="76" cy="36" r="4" fill="#ff6fae" ${ln(1.5)}/><circle cx="124" cy="36" r="4" fill="#ff6fae" ${ln(1.5)}/>` +
        `<circle cx="100" cy="6" r="4.5" fill="#fff" ${ln(1.5)}/><circle cx="76" cy="22" r="3.5" fill="#fff" ${ln(1.5)}/><circle cx="124" cy="22" r="3.5" fill="#fff" ${ln(1.5)}/>` +
        `<circle cx="78" cy="51" r="3" fill="${GEM}" ${ln(1.5)}/><circle cx="100" cy="47" r="3" fill="${RUBY}" ${ln(1.5)}/><circle cx="122" cy="51" r="3" fill="${GEM}" ${ln(1.5)}/>` +
        spark(84, 10, 6) + spark(140, 22, 5) + spark(56, 30, 5),
    },
    { id: 'crown', name: 'Royal crown', gems: 35,
      draw: () => `<path d="M58 62 L52 12 L76 34 L100 0 L124 34 L148 12 L142 62 Q100 70 58 62 Z" fill="${GOLD}" ${ln()}/>` +
        `<path d="M56.3 47 Q100 55 143.7 47 L142 62 Q100 70 58 62 Z" fill="${GOLD_D}" ${ln()}/>` +
        `<circle cx="52" cy="11" r="5.5" fill="#fff3b0" ${ln(2)}/><circle cx="100" cy="-1" r="6" fill="#fff3b0" ${ln(2)}/><circle cx="148" cy="11" r="5.5" fill="#fff3b0" ${ln(2)}/>` +
        `<path d="M100 20 L108 31 L100 42 L92 31 Z" fill="${RUBY}" ${ln(2)}/>` +
        `<circle cx="76" cy="56" r="4" fill="${GEM}" ${ln(1.5)}/><circle cx="100" cy="59" r="5" fill="${RUBY}" ${ln(1.5)}/><circle cx="124" cy="56" r="4" fill="${GEM}" ${ln(1.5)}/>` +
        shine('M61 40 L58 22') + spark(76, 12, 6) + spark(130, 26, 5) + spark(160, 44, 5),
    },
    // A golden crown with fiery phoenix feathers flickering and embers rising.
    { id: 'phoenixcrown', name: 'Phoenix crown', gems: 50,
      draw: () => {
        let h = '';
        [[-56, 0.7], [56, 0.7], [-28, 0.88], [28, 0.88], [0, 1]].forEach(([a, s], i) => {
          const f = (o, k) => `M100 ${52 - o}C${f1(100 - 16 * k)} ${f1(52 - 18 * k - o)} ${f1(100 - 14 * k)} ${f1(52 - 50 * k - o)} 100 ${f1(52 - 76 * k - o)}` +
            `C${f1(100 + 14 * k)} ${f1(52 - 50 * k - o)} ${f1(100 + 16 * k)} ${f1(52 - 18 * k - o)} 100 ${52 - o}Z`;
          h += `<g transform="rotate(${a} 100 54) translate(100 54) scale(${s}) translate(-100 -54)">` +
            `<path d="${f(0, 1)}" fill="${RED_D}" ${ln()}/>` +
            flip(`an-flicker an-d${(i % 4) + 1}`, `<path d="${f(4, 0.7)}" fill="#ff9d2e"/><path d="${f(8, 0.4)}" fill="#fff3a0"/>`) + '</g>';
        });
        h += `<path d="M58 62 L56 42 Q100 34 144 42 L142 62 Q100 70 58 62 Z" fill="${GOLD}" ${ln()}/>` +
          `<path d="M57 52 Q100 60 143 52 L142 62 Q100 70 58 62 Z" fill="${GOLD_D}" ${ln(2)}/>` +
          `<path d="M100 38 L108 47 L100 56 L92 47 Z" fill="${RUBY}" ${ln(2)}/>` +
          `<circle cx="76" cy="50" r="4" fill="${GEM}" ${ln(1.5)}/><circle cx="124" cy="50" r="4" fill="${GEM}" ${ln(1.5)}/>` +
          `<circle cx="64" cy="58" r="3" fill="${RUBY}" ${ln(1.2)}/><circle cx="136" cy="58" r="3" fill="${RUBY}" ${ln(1.2)}/>` + shine('M62 50 L61 44');
        [[80, 14, 1], [118, 8, 2], [136, 22, 3], [66, 26, 4]].forEach(([x, y, d]) => {
          h += `<circle class="an-rise an-d${d}" cx="${x}" cy="${y}" r="2.6" fill="${GOLD}" ${ln(1)}/>`;
        });
        return h + spark(150, -8, 6) + spark(50, 24, 5);
      },
    },
  ]);
})();
