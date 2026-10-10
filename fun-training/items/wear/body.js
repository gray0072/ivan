// Outfits: the torso (the arms come from sleeve); dresses reach down to y ~240.
// Cheap to elite; each entry is the catalog item (ITEMS) and its drawing (WEAR_ART), added by addItems.

(() => {
  const { GOLD, GOLD_D, GEM, RUBY, RED, RED_D, BLUE, DARK, WHITE, f1, both, shine, hw, part, band, stubs, star, spark, bloom } = WEAR_KIT;
  // A long dress / robe from the shoulders to the hem y, half width w at the hem, n scallops dipping dip.
  const robe = (hem, w, n = 4, dip = 8) => {
    let d = `M76 140Q100 150 124 140A47 49 0 0 1 145 194L${100 + w} ${hem}`;
    for (let i = 1; i <= n; i++) {
      const x = f1(100 + w - 2 * w * i / n);
      d += `Q${f1(x + w / n)} ${hem + dip} ${x} ${hem}`;
    }
    return d + 'L55 194A47 49 0 0 1 76 140Z';
  };
  // A snowflake of three crossing strokes.
  const flake = (x, y, r, c = WHITE, w = 2) => '<path d="' + [0, 60, 120].map(a => {
    const dx = f1(Math.cos(a * Math.PI / 180) * r), dy = f1(Math.sin(a * Math.PI / 180) * r);
    return `M${f1(x - dx)} ${f1(y - dy)}L${f1(x + dx)} ${f1(y + dy)}`;
  }).join('') + `" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
  // A crescent moon.
  const moon = (x, y, r, fill) => `<path d="M${x} ${y - r}A${r} ${r} 0 1 0 ${f1(x + r * 0.9)} ${f1(y + r * 0.5)}` +
    `A${f1(r * 0.75)} ${f1(r * 0.75)} 0 0 1 ${x} ${y - r}Z" fill="${fill}" ${ln(1.5)}/>`;
  // Swing a piece to and fro around (x, y) (SMIL).
  const swing = (x, y, deg, dur, begin, s) => `<g><animateTransform attributeName="transform" type="rotate" ` +
    `values="${-deg} ${x} ${y};${deg} ${x} ${y};${-deg} ${x} ${y}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/>${s}</g>`;

  addItems('body', WEAR_ART, [
    { id: 'overalls', name: 'Patched overalls', price: 15,
      legs: '#6f8fd0',
      draw: () => both(`<path d="M74 145 L84 145 L90 170 L82 172 Z" fill="#6f8fd0" ${ln(2)}/>`) +
        `<path d="${part(192, 226, 2, 8)}" fill="#6f8fd0" ${ln()}/>` +
        `<path d="M80 200 V170 Q80 164 86 164 H114 Q120 164 120 170 V200 Z" fill="#6f8fd0" ${ln()}/>` +
        `<rect x="91" y="172" width="18" height="14" rx="2" fill="#5a78b8" ${ln(1.5)}/>` +
        `<circle cx="86" cy="170" r="3" fill="${GOLD}" ${ln(1.5)}/><circle cx="114" cy="170" r="3" fill="${GOLD}" ${ln(1.5)}/>` +
        `<rect x="66" y="204" width="14" height="13" rx="2" fill="#e8b04a" ${ln(1.5)} transform="rotate(-8 73 210)"/>` +
        `<rect x="116" y="200" width="11" height="10" rx="2" fill="${RED}" ${ln(1.5)}/>` +
        '<path d="M69 210 H78 M118 205 H125" stroke="#fff" stroke-width="1.5" stroke-dasharray="2 2"/>',
    },
    { id: 'tshirt', name: 'T-shirt', price: 40,
      sleeve: BLUE,
      draw: () => stubs(BLUE) + `<path d="${part(140, 222)}" fill="${BLUE}" ${ln()}/>` +
        '<path d="M80 143 Q100 156 120 143" fill="none" stroke="#3a73e0" stroke-width="4" stroke-linecap="round"/>' +
        '<rect x="110" y="164" width="15" height="14" rx="3" fill="none" stroke="#3a73e0" stroke-width="2.5"/>',
    },
    { id: 'footballjersey', name: 'Blue-yellow football jersey', price: 60,
      sleeve: GOLD,
      draw: () => stubs(GOLD) + `<path d="${part(140, 216)}" fill="${GOLD}" ${ln()}/>` +
        `<path d="${part(212, 228, 4, 8)}" fill="${BLUE}" ${ln()}/>` +
        `<path d="M80 142 L100 158 L120 142" fill="none" stroke="${BLUE}" stroke-width="6" stroke-linejoin="round"/>` +
        both(`<path d="M57 180 L59 208" stroke="${BLUE}" stroke-width="5"/>`) +
        `<path d="M90 171 L95 167 V190 M106 166 Q113 166 113 178 Q113 190 106 190 Q99 190 99 178 Q99 166 106 166 Z" fill="none" stroke="${BLUE}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
    },
    { id: 'ghostcostume', name: 'Ghost costume', price: 100,
      sleeve: '#f4f4ff',
      draw: () => `<path d="${robe(226, 50, 1, 0)}" fill="#f4f4ff" ${ln()}/>` +
        [0, 1, 2, 3, 4].map(i => {
          const x = 60 + i * 20;
          return swing(x, 220, 7, 2.4, -i * 0.5, `<path d="M${x - 11} 210 V222 Q${x - 11} 244 ${x} 244 Q${x + 11} 244 ${x + 11} 222 V210 Z" fill="#f4f4ff"/>` +
            `<path d="M${x - 11} 226 Q${x - 11} 244 ${x} 244 Q${x + 11} 244 ${x + 11} 226" fill="none" ${ln()}/>`);
        }).join('') +
        `<ellipse cx="88" cy="176" rx="4.5" ry="6.5" fill="${INK}"/><ellipse cx="112" cy="176" rx="4.5" ry="6.5" fill="${INK}"/>` +
        '<circle cx="80" cy="188" r="4" fill="#ffb3cf"/><circle cx="120" cy="188" r="4" fill="#ffb3cf"/>' +
        `<path d="M93 190 Q100 198 107 190" fill="none" ${ln(3)}/>`,
    },
    { id: 'sweater', name: 'Striped sweater', price: 120,
      sleeve: RED,
      draw: () => stubs(RED) + `<path d="${part(140, 224)}" fill="${RED}"/>` +
        band(160, 170, '#fff3d6') + band(182, 192, '#fff3d6') + band(204, 214, '#fff3d6') +
        `<path d="${part(140, 224)}" fill="none" ${ln()}/>` + tube('M80 142 Q100 154 120 142', RED_D, 4),
    },
    { id: 'dress', name: 'Polka-dot dress', price: 150,
      draw: () => `<path d="M76 140 Q100 150 124 140 A47 49 0 0 1 145 194 L156 232 Q142 244 128 236 Q114 246 100 238 Q86 246 72 236 Q58 244 44 232 L55 194 A47 49 0 0 1 76 140 Z" fill="#ff7eb6" ${ln()}/>` +
        [[84, 168], [112, 160], [122, 182], [80, 208], [102, 220], [130, 222], [64, 224], [94, 184], [118, 206]]
          .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.5" fill="#fff"/>`).join('') +
        `<path d="M54 190 Q100 202 146 190 L146 198 Q100 210 54 198 Z" fill="#b892ff" ${ln(2)}/>` +
        both(`<path d="M100 198 L87 190 Q84 198 87 206 Z" fill="#b892ff" ${ln(2)}/>`) + `<circle cx="100" cy="198" r="4" fill="#9b6bff" ${ln(2)}/>`,
    },
    { id: 'hoodie', name: 'Hoodie', price: 200,
      sleeve: '#8f7bff',
      draw: () => stubs('#8f7bff') + `<path d="${part(140, 226)}" fill="#8f7bff" ${ln()}/>` +
        `<path d="M70 134 Q62 158 82 162 Q100 166 118 162 Q138 158 130 134 Q100 152 70 134 Z" fill="#7663ea" ${ln()}/>` +
        `<path d="M76 198 H124 L130 220 Q100 226 70 220 Z" fill="#7663ea" ${ln(2)}/>` +
        `<path d="M92 162 L91 180 M108 162 L109 180" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>` +
        `<circle cx="91" cy="182" r="3" fill="#fff" ${ln(1.5)}/><circle cx="109" cy="182" r="3" fill="#fff" ${ln(1.5)}/>`,
    },
    { id: 'christmasjumper', name: 'Reindeer Christmas jumper', price: 250,
      sleeve: RED,
      draw: () => stubs(RED) + `<path d="${part(140, 224)}" fill="${RED}"/>` + band(204, 214, '#fff') +
        [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => `<path d="M${58 + i * 10} 213 L${62 + i * 10} 205 L${66 + i * 10} 213 Z" fill="#3fae5a"/>`).join('') +
        [70, 82, 118, 130].map(x => `<circle cx="${x}" cy="156" r="2.4" fill="#fff"/>`).join('') +
        `<path d="${part(140, 224)}" fill="none" ${ln()}/>` + tube('M80 142 Q100 154 120 142', '#3fae5a', 5) +
        both(`<path d="M93 171 Q86 164 86 156 M87 164 L80 161 M86 159 L89 152" fill="none" stroke="#7a4a24" stroke-width="3" stroke-linecap="round"/>` +
          `<ellipse cx="88" cy="175" rx="5" ry="3" fill="#a86b3c" ${ln(1.5)} transform="rotate(-25 88 175)"/>`) +
        `<ellipse cx="100" cy="182" rx="11" ry="13" fill="#a86b3c" ${ln(2)}/><ellipse cx="100" cy="190" rx="8" ry="5.5" fill="#d39a64" ${ln(1.5)}/>` +
        `<circle cx="95" cy="179" r="1.8" fill="${INK}"/><circle cx="105" cy="179" r="1.8" fill="${INK}"/>` +
        `<circle class="an-glow" cx="100" cy="188" r="6.5" fill="#ffc2c2"/><circle cx="100" cy="188" r="3.8" fill="${RED_D}" ${ln(1.5)}/>`,
    },
    { id: 'luciagown', name: 'Lucia gown', price: 300,
      sleeve: '#fbfbff',
      draw: () => stubs('#fbfbff') + `<path d="${robe(242, 56, 6, 6)}" fill="#fbfbff" ${ln()}/>` +
        '<path d="M84 210 L78 238 M100 212 V240 M116 210 L122 238" stroke="#dfe2f2" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="M82 143 Q100 155 118 143" fill="none" stroke="#dfe2f2" stroke-width="3"/>' +
        `<path d="${part(192, 203, 4, 4)}" fill="${RED}" ${ln(2)}/>` +
        `<path d="M97 204 L88 232 L95 230 L101 205 Z M103 204 L114 230 L107 232 L99 205 Z" fill="${RED}" ${ln(2)}/>` +
        `<ellipse cx="100" cy="201" rx="6" ry="5" fill="${RED_D}" ${ln(2)}/>`,
    },
    { id: 'midsummerdress', name: 'Midsummer folk costume', price: 400,
      sleeve: '#fff',
      draw: () => stubs('#fff') + `<path d="${robe(240, 54, 5, 5)}" fill="#2f5fb8" ${ln()}/>` +
        `<path d="${part(140, 196, 10, 4)}" fill="#fff" ${ln()}/>` +
        both(`<path d="M80 147 Q86 152 94 156 L95 196 H64 Q60 168 80 147 Z" fill="#d8323c" ${ln(2)}/>`) +
        `<path d="M95 162 L105 168 M105 162 L95 168 M95 172 L105 178 M105 172 L95 178 M95 182 L105 188 M105 182 L95 188" stroke="${GOLD}" stroke-width="2" stroke-linecap="round"/>` +
        `<path d="${part(194, 202, 4, 4)}" fill="${GOLD}" ${ln(2)}/>` +
        `<path d="M84 202 H116 L122 238 Q100 244 78 238 Z" fill="#fff6c8" ${ln(2)}/>` +
        '<path d="M82 212 Q100 216 118 212" fill="none" stroke="#d8323c" stroke-width="2.5"/>' +
        `<g class="an-pulse">${bloom(91, 224, 8, '#ff8fc0')}</g><g class="an-pulse an-d2">${bloom(109, 224, 8, '#b892ff')}</g>`,
    },
    { id: 'hero', name: 'Superhero suit', price: 500,
      sleeve: '#3d7bff', legs: '#3d7bff',
      draw: () => stubs('#3d7bff') + `<path d="${part(140, 226)}" fill="#3d7bff" ${ln()}/>` +
        `<path d="${part(206, 226, 6)}" fill="${RED}" ${ln()}/>` + `<path d="${part(198, 207, 6, 6)}" fill="${GOLD}" ${ln(2)}/>` +
        `<path d="M100 150 L120 157 Q120 178 100 190 Q80 178 80 157 Z" fill="${GOLD}" ${ln()}/>` +
        `<path d="M105 156 L92 173 L100 173 L95 186 L109 168 L101 168 Z" fill="${RED}" ${ln(1.5)}/>`,
    },
    { id: 'vikingtunic', name: 'Viking tunic', price: 600,
      sleeve: '#b5623f', legs: '#7a6650',
      draw: () => stubs('#b5623f') + `<path d="${robe(234, 50, 4, 4)}" fill="#b5623f" ${ln()}/>` +
        `<path d="M51.5 220 H148.5 L149.4 229 H50.6 Z" fill="${GOLD}" ${ln(2)}/>` +
        `<path d="M55 228 ${[...Array(12)].map((_, i) => `L${61 + i * 8} ${i % 2 ? 228 : 221}`).join(' ')}" fill="none" stroke="#2f5fb8" stroke-width="2.5" stroke-linejoin="round"/>` +
        '<path d="M100 150 V194" stroke="#8a4529" stroke-width="3"/>' +
        `<path d="${part(194, 205, 4, 4)}" fill="#6b4428" ${ln(2)}/>` +
        `<circle cx="100" cy="201" r="7" fill="${GOLD}" ${ln(2)}/><circle cx="100" cy="201" r="2.5" fill="#6b4428"/>` +
        [72, 84, 116, 128].map(x => `<circle cx="${x}" cy="200" r="1.8" fill="${GOLD}"/>`).join('') +
        `<path d="M64 152 Q66 138 78 142 Q84 132 94 139 Q100 132 106 139 Q116 132 122 142 Q134 138 136 152 Q120 148 112 158 Q100 150 88 158 Q80 148 64 152 Z" fill="#d6cdbf" ${ln(2)}/>` +
        '<path d="M76 146 L79 150 M90 142 L92 147 M110 142 L108 147 M124 146 L121 150" stroke="#a89c8a" stroke-width="2" stroke-linecap="round"/>',
    },
    { id: 'skeletonsuit', name: 'Glow skeleton suit', price: 800,
      sleeve: DARK, legs: DARK,
      draw: () => {
        const bones = 'M100 152 V206 M100 160 Q82 157 74 167 M100 160 Q118 157 126 167 M100 172 Q80 170 71 181 M100 172 Q120 170 129 181 ' +
          'M100 184 Q82 183 75 193 M100 184 Q118 183 125 193 M84 208 Q100 222 116 208 Q100 213 84 208';
        return stubs(DARK) + `<path d="${part(140, 226)}" fill="${DARK}" ${ln()}/>` +
          `<path class="an-glow" d="${bones}" fill="none" stroke="#8dff9e" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>` +
          `<path d="${bones}" fill="none" stroke="#f2ffe6" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;
      },
    },
    { id: 'gown', name: 'Princess gown', price: 900,
      draw: () => both('<circle cx="66" cy="153" r="11" fill="#ffd1ec" stroke="#3b2f5c" stroke-width="3"/>') +
        `<path d="M56 190 Q42 212 32 234 Q41 244 52 238 Q62 248 74 240 Q87 250 100 242 Q113 250 126 240 Q138 248 148 238 Q159 244 168 234 Q158 212 144 190 Z" fill="#ff8fd0" ${ln()}/>` +
        `<path d="M90 196 H110 L128 238 Q114 248 100 242 Q86 248 72 238 Z" fill="#ffd1ec" ${ln(2)}/>` +
        `<path d="${part(140, 196, 10, 4)}" fill="#ff8fd0" ${ln()}/>` + `<path d="${part(190, 198, 4, 4)}" fill="${GOLD}" ${ln(2)}/>` +
        `<path d="M100 146 L106 154 L100 162 L94 154 Z" fill="${GEM}" ${ln(1.5)}/>` +
        [[88, 216], [112, 216], [100, 230], [60, 228], [140, 228], [78, 172], [122, 172]]
          .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="${GOLD}" ${ln(1)}/>`).join(''),
    },
    { id: 'tuxedo', name: 'Tuxedo', price: 900,
      sleeve: '#2f2b45', legs: '#2f2b45',
      draw: () => stubs('#2f2b45') + `<path d="${part(140, 226)}" fill="#2f2b45" ${ln()}/>` +
        `<path d="M78 141 Q100 151 122 141 L100 196 Z" fill="#fff" ${ln(2)}/>` +
        both(`<path d="M77 141 L99 194 L84 170 L72 168 L72 150 Z" fill="#47425f" ${ln(2)}/>`) +
        `<path d="M100 155 L89 149 L89 161 Z M100 155 L111 149 L111 161 Z" fill="${DARK}" ${ln(2)}/><circle cx="100" cy="155" r="3" fill="${DARK}"/>` +
        '<circle cx="100" cy="172" r="2" fill="#3b2f5c"/><circle cx="100" cy="184" r="2" fill="#3b2f5c"/>' +
        '<circle cx="100" cy="206" r="3" fill="#fff"/><circle cx="100" cy="218" r="3" fill="#fff"/>' +
        `<path d="M117 176 L131 174 L127 166 Z" fill="${RED}" ${ln(1.5)}/>`,
    },
    { id: 'wizardrobe', name: 'Wizard robe', price: 1200,
      sleeve: '#5a48c8',
      draw: () => stubs('#5a48c8') + `<path d="${robe(244, 58, 5, 6)}" fill="#5a48c8" ${ln()}/>` +
        `<path d="M94 146 Q100 150 106 146 L114 244 Q100 250 86 244 Z" fill="#7d6cf0" ${ln(2)}/>` +
        `<path d="M94 147 L86 244 M106 147 L114 244" stroke="${GOLD}" stroke-width="4" stroke-linecap="round"/>` +
        `<path d="M78 141 Q100 154 122 141" fill="none" stroke="${GOLD}" stroke-width="5" stroke-linecap="round"/>` +
        `<path d="M56 194 Q100 206 144 194" fill="none" stroke="${GOLD_D}" stroke-width="4" stroke-linecap="round"/>` +
        `<path d="M68 199 L64 216 M68 199 L71 216" stroke="${GOLD_D}" stroke-width="3" stroke-linecap="round"/><circle cx="68" cy="199" r="3.5" fill="${GOLD}" ${ln(1.5)}/>` +
        moon(124, 170, 8, GOLD) + moon(70, 228, 6, GOLD) +
        [[76, 170, 6, ''], [128, 222, 6, ' an-d2'], [84, 212, 4.5, ' an-d1'], [134, 194, 4.5, ' an-d3'], [120, 238, 4, ' an-d4']]
          .map(([x, y, r, d]) => `<g class="an-twinkle${d}"><path d="${star(x, y, r)}" fill="${GOLD}" ${ln(1.5)}/></g>`).join('') +
        spark(100, 174, 6),
    },
    { id: 'spacesuit', name: 'Space suit', price: 1500,
      sleeve: '#f4f7fc', legs: '#e3e9f3',
      draw: () => stubs('#f4f7fc') + `<path d="${part(140, 226)}" fill="#f4f7fc"/>` + band(198, 206, '#ff9a3d') +
        `<path d="${part(140, 226)}" fill="none" ${ln()}/>` + `<ellipse cx="100" cy="140" rx="33" ry="9" fill="#c9d3e3" ${ln()}/>` +
        `<rect x="84" y="160" width="32" height="24" rx="5" fill="#5b6b8c" ${ln(2)}/>` +
        `<circle cx="92" cy="172" r="3.2" fill="${RED}"/><circle cx="100" cy="172" r="3.2" fill="${GOLD}"/><circle cx="108" cy="172" r="3.2" fill="#5fd068"/>` +
        `<circle cx="72" cy="172" r="7" fill="${BLUE}" ${ln(2)}/><path d="${star(72, 172, 4.5)}" fill="#fff"/>` +
        `<rect x="92" y="212" width="16" height="9" rx="3" fill="#c9d3e3" ${ln(1.5)}/>`,
    },
    { id: 'icequeengown', name: 'Ice queen gown', gems: 20,
      sleeve: '#d8f1ff',
      draw: () => both(`<path d="M77 145 L66 128 L75 134 L76 118 L83 135 L88 127 L89 146 Z" fill="${GEM}" ${ln(2)}/>`) +
        stubs('#d8f1ff') + `<path d="${robe(244, 62, 6, 7)}" fill="#bfe8ff" ${ln()}/>` +
        `<path d="M90 194 H110 L126 244 Q100 252 74 244 Z" fill="#eaf8ff" ${ln(2)}/>` +
        `<path d="${part(140, 196, 10, 4)}" fill="#8fd3ff" ${ln()}/>` + `<path d="${part(190, 198, 4, 4)}" fill="#fff" ${ln(2)}/>` +
        flake(100, 222, 7, '#5fb8f0', 2.5) + flake(64, 222, 6) + flake(136, 222, 6) + flake(80, 170, 5) + flake(120, 170, 5) +
        `<path d="M100 148 L108 158 L100 170 L92 158 Z" fill="${GEM}" ${ln(2)}/>` + shine('M96 155 L100 151', 2) +
        [[52, 184, ''], [148, 178, ' an-d2'], [72, 200, ' an-d1'], [130, 204, ' an-d3'], [44, 212, ' an-d4'], [156, 216, ' an-d1']]
          .map(([x, y, d]) => `<circle class="an-fall${d}" cx="${x}" cy="${y}" r="3.2" fill="#fff" ${ln(1)}/>`).join('') +
        spark(60, 238, 5) + spark(142, 238, 5),
    },
    { id: 'armor', name: 'Golden armor', gems: 40,
      sleeve: GOLD, legs: '#f5c033',
      draw: () => both(`<path d="M76 146 Q54 140 48 160 Q56 170 74 166 Z" fill="${GOLD}" ${ln()}/>`) +
        `<path d="${part(140, 224)}" fill="${GOLD}" ${ln()}/>` +
        `<path d="M100 150 V214 M70 198 Q100 208 130 198 M74 212 Q100 222 126 212" fill="none" stroke="${GOLD_D}" stroke-width="3" stroke-linecap="round"/>` +
        `<path d="M66 170 Q83 184 100 172 Q117 184 134 170" fill="none" ${ln(2)}/>` + tube('M78 142 Q100 154 122 142', GOLD_D, 5) +
        `<path d="M100 157 L108 167 L100 177 L92 167 Z" fill="${RUBY}" ${ln(2)}/>` + shine('M70 160 Q72 178 80 190', 4) +
        spark(80, 160, 6) + spark(124, 206, 5),
    },
    { id: 'dragonarmor', name: 'Dragon-scale armor', gems: 60,
      sleeve: '#2fae7a', legs: '#23845d',
      draw: () => {
        let scales = '', glow = '';
        for (let r = 0; r < 7; r++) {
          const y = 158 + r * 10;
          for (let x = 52 + (r % 2) * 6; x <= 148; x += 12) {
            if (Math.abs(x - 100) > hw(y) - 8 || (Math.abs(x - 100) < 18 && y < 196)) continue;
            scales += `M${x - 6} ${y}Q${x} ${y + 9} ${x + 6} ${y}`;
            if ((r * 3 + x) % 5 === 0) glow += `M${x - 3} ${y + 2}Q${x} ${y + 5} ${x + 3} ${y + 2}`;
          }
        }
        return both(`<path d="M76 146 Q50 132 42 152 Q50 150 52 160 Q57 154 62 166 Q66 158 74 166 Z" fill="${GOLD}" ${ln()}/>`) +
          `<path d="${part(140, 226)}" fill="#36c48a" ${ln()}/>` +
          `<path d="${scales}" fill="none" stroke="#1f8a5c" stroke-width="2.5" stroke-linecap="round"/>` +
          `<path class="an-glow" d="${glow}" fill="none" stroke="#b8ffe0" stroke-width="2.5" stroke-linecap="round"/>` +
          `<path d="${part(198, 207, 4, 4)}" fill="${GOLD}" ${ln(2)}/>` + tube('M78 142 Q100 154 122 142', GOLD_D, 5) +
          `<path d="M100 150 L118 158 Q118 182 100 196 Q82 182 82 158 Z" fill="${GOLD}" ${ln()}/>` +
          `<g class="an-pulse"><path d="M100 160 L109 172 L100 184 L91 172 Z" fill="${RUBY}" ${ln(2)}/></g>` + shine('M96 168 L100 163', 2) +
          `<circle cx="100" cy="203" r="4" fill="${GEM}" ${ln(1.5)}/>` +
          spark(70, 166, 6) + spark(132, 214, 5) + spark(56, 206, 4);
      },
    },
  ]);
})();
