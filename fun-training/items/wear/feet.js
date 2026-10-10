// Shoes: replace the feet at (85, 245) / (115, 245); the left one is drawn and mirrored.
// Cheap to elite; each entry is the catalog item (ITEMS) and its drawing (WEAR_ART), added by addItems.

(() => {
  const { GOLD, GOLD_D, GEM, RUBY, RED, BLUE, DARK, both, shine, star, spark, bloom, frame } = WEAR_KIT;
  // The left shoe's outlines: a low shoe, a boot reaching up to y 222, a flat sole.
  const LOW = 'M68 245 Q66 233 78 231 L88 229 Q98 225 100 232 L101 246 Z';
  const BOOT = 'M73 222 H97 L98 244 Q98 250 92 250 H72 Q64 250 66 242 Q68 236 73 234 Z';
  const FLAT = 'M67 247 Q66 236 84 235 Q101 235 101 247 Q84 254 67 247 Z';
  const sole = (fill, y = 247) => `<rect x="64" y="${y}" width="36" height="6" rx="3" fill="${fill}" ${ln(2)}/>`;

  addItems('feet', WEAR_ART, [
    { id: 'wornsneakers', name: 'Worn-out sneakers', price: 15,
      draw: () => both(`<path d="${LOW}" fill="#b8ad9a" ${ln()}/>` + sole('#ddd5c6') +
        `<rect x="86" y="236" width="9" height="7" rx="1.5" fill="#8f9a78" ${ln(1.5)} transform="rotate(10 90 239)"/>` +
        `<ellipse cx="72" cy="241" rx="4" ry="3" fill="#ff9fc8" ${ln(1.5)}/>` +
        `<path d="M84 232 L89 236 M88 230 L93 234 M89 236 Q95 242 92 246" fill="none" stroke="#6e6556" stroke-width="2" stroke-linecap="round"/>`),
    },
    { id: 'woolsocks', name: 'Knitted wool socks', price: 20,
      draw: () => both(`<path d="M73 216 H97 L98 242 Q98 252 88 252 H72 Q63 252 64 245 Q65 238 73 237 Z" fill="#f2ede2" ${ln()}/>` +
        `<rect x="72" y="214" width="26" height="8" rx="3" fill="${RED}" ${ln(2)}/>` +
        '<path d="M74 230 L78 226 L82 230 L86 226 L90 230 L94 226 L97 229" fill="none" stroke="#e8434b" stroke-width="2.5" stroke-linejoin="round"/>' +
        `<path d="M64 245 Q65 238 73 237 Q75 245 72 252 Q63 252 64 245 Z" fill="${RED}" ${ln(2)}/>` +
        '<path d="M78 216 V221 M84 216 V221 M90 216 V221" stroke="#fff" stroke-width="1.5" opacity="0.6"/>'),
    },
    { id: 'slippers', name: 'Fluffy slippers', price: 30,
      draw: () => both(`<path d="M68 248 Q66 235 85 235 Q104 235 102 248 Q85 254 68 248 Z" fill="#ff9fc8" ${ln()}/>` +
        `<path d="M74 241 Q70 233 77 231 Q80 225 86 228 Q92 225 95 231 Q101 234 96 241 Q85 245 74 241 Z" fill="#fff" ${ln(2)}/>`),
    },
    { id: 'swedishclogs', name: 'Swedish clogs', price: 40,
      draw: () => both(`<path d="M64 246 Q64 241 70 241 H96 Q102 241 101 246 L100 254 H66 Z" fill="#e3b77a" ${ln()}/>` +
        `<path d="M68 244 Q68 228 84 228 Q100 228 100 244 Z" fill="#d8323c" ${ln()}/>` +
        [[70, 240], [73, 234], [79, 230], [86, 229], [93, 231], [98, 237]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="${GOLD}"/>`).join('') +
        bloom(84, 237, 7, '#fff') + '<path d="M68 250 H98" stroke="#c99a5c" stroke-width="2"/>'),
    },
    { id: 'sneakers', name: 'Sneakers', price: 50,
      draw: () => both(`<path d="M68 245 Q66 233 78 231 L88 229 Q98 225 100 232 L101 246 Z" fill="${BLUE}" ${ln()}/>` +
        `<path d="M66 247 Q66 243 72 243 H99 Q102 243 102 247 Q102 252 98 252 H71 Q66 252 66 247 Z" fill="#fff" ${ln()}/>` +
        `<path d="M83 232 L88 238 M89 230 L94 236" ${ln(2)}/>` + `<path d="M74 240 Q84 236 96 240" fill="none" stroke="${RED}" stroke-width="2.5" stroke-linecap="round"/>`),
    },
    { id: 'balletshoes', name: 'Ballet slippers', price: 60,
      draw: () => both('<path d="M76 238 L94 224 M94 238 L76 224 M78 222 L92 212" fill="none" stroke="#ff8fb8" stroke-width="3" stroke-linecap="round"/>' +
        `<path d="${FLAT}" fill="#ffc2d9" ${ln()}/>` + `<path d="M74 240 Q85 236 96 240" fill="none" stroke="#ff8fb8" stroke-width="2.5" stroke-linecap="round"/>` +
        `<path d="M75 244 L69 240 L69 248 Z M75 244 L81 240 L81 248 Z" fill="#ff8fb8" ${ln(1.5)}/>` + shine('M90 241 Q95 243 97 246', 2)),
    },
    { id: 'rainboots', name: 'Rain boots', price: 80,
      draw: () => both(`<path d="M73 222 H97 L98 244 Q98 250 92 250 H72 Q64 250 66 242 Q68 236 73 234 Z" fill="${GOLD}" ${ln()}/>` +
        `<rect x="71" y="219" width="28" height="7" rx="3" fill="#f0b400" ${ln(2)}/>` +
        `<rect x="64" y="247" width="36" height="6" rx="3" fill="#4a3550" ${ln(2)}/>` + shine('M78 230 V242')),
    },
    { id: 'footballboots', name: 'Football boots', price: 100,
      draw: () => both(`<rect x="74" y="216" width="22" height="22" rx="3" fill="#fff" ${ln(2)}/><rect x="74" y="221" width="22" height="6" fill="${BLUE}"/>` +
        '<path d="M70 252 V256 M80 252 V256 M90 252 V256 M98 252 V256" stroke="#33324a" stroke-width="4" stroke-linecap="round"/>' +
        `<path d="${LOW}" fill="${DARK}" ${ln()}/>` + sole('#5b5a75') +
        `<path d="M76 241 L84 233 M81 242 L89 234 M86 243 L94 235" stroke="${GOLD}" stroke-width="2.5" stroke-linecap="round"/>`),
    },
    { id: 'witchboots', name: 'Witch boots', price: 150,
      box: '50 210 100 52',
      draw: () => both(`<path d="M74 218 H97 L98 246 Q98 251 92 251 H70 Q60 251 58 236 Q63 243 70 240 Q72 236 74 234 Z" fill="#7a4fc0" ${ln()}/>` +
        `<rect x="72" y="216" width="27" height="7" rx="3" fill="#ff8a2b" ${ln(2)}/>` +
        '<path d="M83 226 L91 232 M91 226 L83 232 M83 234 L91 240 M91 234 L83 240" stroke="#33324a" stroke-width="2" stroke-linecap="round"/>' +
        `<rect x="77" y="243" width="11" height="8" rx="1.5" fill="none" stroke="${GOLD}" stroke-width="2.5"/>` +
        `<path d="M70 245 H96" stroke="${DARK}" stroke-width="3"/>` + shine('M78 226 V236', 2)),
    },
    { id: 'pumpkinshoes', name: 'Pumpkin shoes', price: 200,
      draw: () => both(`<path d="M85 230 Q83 222 88 218" fill="none" stroke="#3f8f3a" stroke-width="4" stroke-linecap="round"/>` +
        `<path d="M86 226 Q94 220 98 226 Q92 230 86 226 Z" fill="#5fd068" ${ln(1.5)}/>` +
        `<ellipse cx="85" cy="241" rx="18" ry="12" fill="#ff8a2b" ${ln()}/>` +
        '<path d="M78 230 Q72 241 78 252 M92 230 Q98 241 92 252" fill="none" stroke="#e86a10" stroke-width="2"/>' +
        '<path d="M76 238 L80 233 L84 238 Z M86 238 L90 233 L94 238 Z M75 243 Q85 251 95 243 L91 245 L88 243 L85 246 L82 243 L79 245 Z" fill="#6b3000"/>' +
        `<path class="an-glow" d="M76 238 L80 233 L84 238 Z M86 238 L90 233 L94 238 Z M75 243 Q85 251 95 243 L91 245 L88 243 L85 246 L82 243 L79 245 Z" fill="${GOLD}"/>`),
    },
    { id: 'iceskates', name: 'Ice skates', price: 250,
      draw: () => both('<path d="M71 250 V255 M93 250 V255" stroke="#9aa6bb" stroke-width="3"/>' +
        `<path d="M64 256 H100 Q104 256 103 252" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>` +
        `<path d="M64 256 H100 Q104 256 103 252" fill="none" stroke="#dfe6f2" stroke-width="2.5" stroke-linecap="round"/>` +
        `<path d="${BOOT}" fill="#e9f6ff" ${ln()}/>` + `<rect x="64" y="247" width="36" height="5" rx="2.5" fill="#9fd4ff" ${ln(2)}/>` +
        `<path d="M70 225 Q69 216 76 218 Q80 213 85 217 Q90 213 94 218 Q101 216 100 225 Z" fill="#fff" ${ln(2)}/>` +
        `<path d="M80 230 L90 236 M90 230 L80 236 M80 238 L90 244" ${ln(1.5)}/>` +
        `<circle cx="85" cy="216" r="4" fill="#9fd4ff" ${ln(1.5)}/>`),
    },
    { id: 'skates', name: 'Roller skates', price: 400,
      draw: () => both(`<circle cx="74" cy="253" r="4.5" fill="${GEM}" ${ln(2)}/><circle cx="93" cy="253" r="4.5" fill="${GEM}" ${ln(2)}/>` +
        `<path d="M74 222 H97 L98 246 H66 Q64 238 74 236 Z" fill="#fff" ${ln()}/>` +
        `<path d="M80 226 L90 232 M90 226 L80 232 M80 234 L90 240" ${ln(1.5)}/>` +
        `<rect x="64" y="245" width="36" height="6" rx="3" fill="#ff6fae" ${ln(2)}/>`),
    },
    { id: 'elfshoes', name: 'Christmas elf shoes', price: 500,
      box: '48 210 104 52',
      draw: () => both(frame('M74 241 Q63 242 62 234 Q61 227 67 228', '#3fae5a', 6) +
        `<path d="M68 248 Q66 236 84 234 Q100 233 101 247 Q84 254 68 248 Z" fill="#3fae5a" ${ln()}/>` +
        `<path d="M72 238 L74 230 L79 236 L84 229 L89 236 L94 229 L97 237 Q86 242 72 238 Z" fill="${RED}" ${ln(2)}/>` +
        `<g class="an-wiggle"><circle cx="67" cy="224" r="4.5" fill="${GOLD}" ${ln(2)}/><path d="M65 225 H69" ${ln(1.5)}/></g>` +
        shine('M88 240 Q94 241 97 245', 2)),
    },
    { id: 'vikingboots', name: 'Viking fur boots', price: 600,
      draw: () => both(`<path d="${BOOT}" fill="#8a5a36" ${ln()}/>` + sole('#4a3550') +
        '<path d="M74 230 L97 238 M74 238 L97 230 M70 244 L97 238" stroke="#5a3a20" stroke-width="3" stroke-linecap="round"/>' +
        `<path d="M71 227 Q68 217 76 217 Q80 211 85 215 Q90 211 94 217 Q101 217 99 227 Q85 231 71 227 Z" fill="#d6cdbf" ${ln(2)}/>` +
        '<path d="M77 220 L79 224 M85 218 V223 M93 220 L91 224" stroke="#a89c8a" stroke-width="2" stroke-linecap="round"/>' +
        `<circle cx="86" cy="234" r="2.5" fill="${GOLD}" ${ln(1)}/>`),
    },
    { id: 'lightsneakers', name: 'Light-up sneakers', price: 800,
      draw: () => both(`<path d="${LOW}" fill="#fff" ${ln()}/>` +
        `<path d="M66 247 Q66 243 72 243 H99 Q102 243 102 247 Q102 252 98 252 H71 Q66 252 66 247 Z" fill="#e8e6ff" ${ln()}/>` +
        `<path d="M72 239 Q84 233 98 238" fill="none" stroke="${GEM}" stroke-width="3" stroke-linecap="round"/>` +
        `<path d="M83 232 L88 238 M89 230 L94 236" ${ln(2)}/>` +
        [[72, RED, ''], [79, GOLD, ' an-d1'], [86, '#5fd068', ' an-d2'], [93, GEM, ' an-d3']]
          .map(([x, c, d]) => `<circle class="an-blink${d}" cx="${x}" cy="247.5" r="2.6" fill="${c}"/>`).join('')),
    },
    { id: 'moonboots', name: 'Moon boots', price: 1000,
      draw: () => both(`<path d="M70 217 H98 Q102 217 101 225 L102 243 Q102 250 94 250 H68 Q60 250 61 243 Q62 235 70 233 Z" fill="#e6ebf5" ${ln()}/>` +
        '<path d="M71 225 Q86 228 100 225 M66 237 Q84 241 101 236" fill="none" stroke="#b9c3d6" stroke-width="2.5"/>' +
        `<rect x="60" y="246" width="44" height="8" rx="4" fill="#9b6bff" ${ln(2)}/>` +
        `<rect x="68" y="214" width="34" height="7" rx="3.5" fill="#c9d3e3" ${ln(2)}/>` +
        `<g class="an-twinkle"><path d="${star(86, 232, 5)}" fill="${GOLD}" ${ln(1.5)}/></g>` + shine('M74 228 V232', 2)),
    },
    { id: 'rocketboots', name: 'Rocket boots', gems: 15,
      draw: () => both(`<g class="an-flicker"><path d="M76 250 Q84 264 92 250 Z" fill="#ff7a2b" ${ln(2)}/><path d="M80 250 Q84 258 88 250 Z" fill="${GOLD}"/></g>` +
        `<path d="M73 222 H97 L98 244 Q98 250 92 250 H72 Q64 250 66 242 Q68 236 73 234 Z" fill="${GOLD}" ${ln()}/>` +
        `<path d="M66 242 Q68 236 73 234 L80 234 Q80 244 82 250 H72 Q64 250 66 242 Z" fill="${RED}" ${ln(2)}/>` +
        `<rect x="71" y="219" width="28" height="7" rx="3" fill="${GOLD_D}" ${ln(2)}/>` +
        `<path d="M74 230 H97" stroke="${RED}" stroke-width="4"/>` + shine('M90 236 V244')) +
        spark(62, 216, 5) + spark(140, 232, 5),
    },
    { id: 'glassslippers', name: 'Glass slippers', gems: 20,
      draw: () => both(`<path d="M67 247 Q65 231 84 230 Q102 231 101 247 Q84 254 67 247 Z" fill="#c8eeff" ${ln()}/>` +
        `<path d="M73 238 Q84 233 96 238 Q84 242 73 238 Z" fill="#a8dcfa" ${ln(1.5)}/>` +
        shine('M70 246 Q70 238 76 235', 2.5) + shine('M93 245 L97 243', 2) +
        `<path d="M84 238 L89 244 L84 251 L79 244 Z" fill="${GEM}" ${ln(1.5)}/>` + shine('M82 243 L84 241', 1.5)) +
        spark(70, 230, 5) + spark(128, 226, 4) + spark(100, 240, 3.5),
    },
    { id: 'wingedshoes', name: 'Winged golden shoes', gems: 30,
      box: '44 204 112 58',
      draw: () => both(`<g class="an-wiggle"><path d="M73 234 Q58 230 50 214 Q58 218 62 216 Q58 222 64 224 Q60 228 68 228 Z" fill="#fff" ${ln(2)}/>` +
        '<path d="M60 222 L68 228 M58 217 L66 225" stroke="#c9d3e3" stroke-width="1.5"/></g>' +
        `<path d="${LOW}" fill="${GOLD}" ${ln()}/>` + sole(GOLD_D) +
        `<path d="M74 240 Q84 236 96 240" fill="none" stroke="${GOLD_D}" stroke-width="2.5" stroke-linecap="round"/>` +
        `<circle cx="90" cy="237" r="3" fill="${RUBY}" ${ln(1.5)}/>` + shine('M73 243 Q72 238 77 235', 2.5)) +
        spark(100, 226, 5) + spark(60, 252, 3.5),
    },
    { id: 'diamondboots', name: 'Diamond boots', gems: 50,
      draw: () => both(`<path d="${BOOT}" fill="${GEM}" ${ln()}/>` +
        '<path d="M73 234 L85 226 L97 236 M73 234 L84 250 L97 236 M85 226 L84 250" fill="none" stroke="#fff" stroke-width="1.5" opacity="0.8"/>' +
        `<g class="an-glow">${shine('M77 236 L82 230', 3)}${shine('M90 240 L94 244', 3)}</g>` +
        `<rect x="70" y="218" width="30" height="8" rx="3" fill="${GOLD}" ${ln(2)}/>` + sole(GOLD) +
        `<path d="M85 217 L89 222 L85 227 L81 222 Z" fill="${RUBY}" ${ln(1.5)}/>`) +
        spark(62, 228, 5) + spark(138, 240, 5) + spark(100, 218, 4),
    },
  ]);
})();
