// Beds (bottom centre; x -100..100).
// Cheap to elite; each entry is the catalog item (ITEMS) and its drawing (ROOM_ART), added by addItems.

(() => {
  const { dot, star, sparkle, flame, cloud, crown, gem } = ROOM_KIT;
  // Local helpers: a pillow, an ink-outlined union of circles (clouds, puffs), a heart, a twinkling star,
  // and a looping SMIL animation of one attribute.
  const pillow = (x, y, fill = '#fff', rx = 19, ry = 10) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" ${ln()}/>`;
  const puff = (d, fill) => `<path d="${d}" fill="${INK}" stroke="${INK}" stroke-width="6"/><path d="${d}" fill="${fill}"/>`;
  const heart = (x, y, s) => `M${x} ${y + s}C${x - s * 1.6} ${y - s * 0.2} ${x - s * 0.8} ${y - s * 1.4} ${x} ${y - s * 0.5}` +
    `C${x + s * 0.8} ${y - s * 1.4} ${x + s * 1.6} ${y - s * 0.2} ${x} ${y + s}Z`;
  const tw = (x, y, r, d = '', fill = '#ffe066') => `<path class="an-twinkle ${d}" d="${star(x, y, r)}" fill="${fill}" stroke="#f5a915" stroke-width="1.2"/>`;
  const loop = (attr, a, b, dur, type) => (type ? `<animateTransform attributeName="transform" type="${type}"` : `<animate attributeName="${attr}"`) +
    ` values="${a};${b};${a}" keyTimes="0;0.5;1" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1" dur="${dur}s" repeatCount="indefinite"/>`;
  addItems('bed', ROOM_ART, [
    { id: 'box', name: 'Cardboard box', price: 0,
      box: '-106 -100 212 108',
      draw: () => `<path d="M-84 -46 L-76 -80 L74 -84 L84 -46 Z" fill="#b8854c" ${ln()}/>` +
        `<path d="M-92 -48 L-100 -70 L-38 -68 L-32 -48 Z" fill="#c38c52" ${ln()}/>` +
        `<path d="M92 -48 L100 -64 L46 -66 L40 -48 Z" fill="#c38c52" ${ln()}/>` +
        `<rect x="-92" y="-48" width="184" height="48" rx="3" fill="#d29d62" ${ln()}/>` +
        '<rect x="-7" y="-46" width="14" height="44" fill="#e8c88f"/>' +
        `<path d="M-66 -12 V-32 M-72 -26 L-66 -32 L-60 -26 M-52 -12 V-32 M-58 -26 L-52 -32 L-46 -26" fill="none" ${ln(2)}/>` +
        `<path d="M92 -16 L80 0 L92 0 Z" fill="#a8763f" ${ln(2)}/>` +
        `<ellipse cx="-62" cy="-58" rx="22" ry="9" fill="#e4dccb" ${ln()}/><ellipse cx="-56" cy="-60" rx="6" ry="3" fill="#cfc4ac"/>` +
        `<path d="M-38 -58 Q-6 -68 22 -58 Q48 -66 72 -56 L76 -38 L78 -16 L70 -22 L64 -12 L56 -24 L48 -14 L40 -30 Q14 -44 -20 -46 Q-36 -46 -38 -58 Z" fill="#8ea2b6" ${ln()}/>` +
        '<path d="M-26 -50 Q10 -58 50 -52 M40 -30 Q50 -40 72 -40" fill="none" stroke="#7a8ea3" stroke-width="3"/>' +
        `<rect x="6" y="-62" width="18" height="13" fill="#c9a07a" transform="rotate(-6 15 -55)" ${ln(1.5)}/>` +
        '<rect x="9" y="-59" width="12" height="7" fill="none" stroke="#fff" stroke-width="1.2" stroke-dasharray="2.5 2.5" transform="rotate(-6 15 -55)"/>' +
        `<ellipse cx="54" cy="-48" rx="5" ry="3" fill="#5f7084"/>`,
    },
    { id: 'strawbed', name: 'Straw pile', price: 15,
      box: '-110 -92 220 100',
      draw: () => {
        let s = '';
        for (let i = 0; i < 15; i++) { const x = -76 + i * 11; s += `M${x} -6L${x + ((i * 7) % 9) - 4} ${-24 - ((i * 37) % 13)}`; }
        return `<path d="M-94 0 Q-98 -28 -70 -38 Q-36 -50 4 -48 Q46 -50 74 -38 Q100 -26 94 0 Z" fill="#ecc75e" ${ln()}/>` +
          `<path d="${s}M-92 -16l-12 -6M90 -12l13 -7M-46 -44l-5 -12M34 -47l5 -12M-10 -48l1 -10" stroke="#c99a2e" stroke-width="2.5" stroke-linecap="round"/>` +
          `<path d="M-82 -44 Q-84 -62 -60 -63 Q-38 -63 -36 -48 Q-38 -36 -60 -36 Q-82 -36 -82 -44 Z" fill="#cdb78a" ${ln()}/>` +
          `<path d="M-37 -55l7 -4M-37 -49h8" ${ln(2)}/>` +
          `<path d="M-28 -50 Q22 -58 72 -44 L80 -20 Q30 -12 -24 -24 Z" fill="#8fa6c0" ${ln()}/>` +
          '<path d="M-16 -40 Q20 -46 62 -34" fill="none" stroke="#7a8ea3" stroke-width="2.5"/>' +
          `<rect x="14" y="-42" width="18" height="13" fill="#d98a6a" transform="rotate(8 23 -35)" ${ln(1.5)}/>`;
      },
    },
    { id: 'sleepingbag', name: 'Sleeping bag', price: 30,
      box: '-106 -84 212 92',
      draw: () => `<rect x="-94" y="-36" width="188" height="36" rx="17" fill="#4f9d63" ${ln()}/>` +
        '<path d="M-56 -34 V-2 M-16 -35 V-1 M24 -35 V-1 M62 -34 V-2" stroke="#3f8452" stroke-width="3"/>' +
        `<path d="M-92 -30 Q-90 -42 -60 -42 Q-26 -42 -20 -30 Q-56 -24 -92 -30 Z" fill="#ff9a4a" ${ln(2.5)}/>` +
        `<rect x="-90" y="-54" width="42" height="22" rx="10" fill="#f2ede0" ${ln()}/>` +
        `<path d="M-6 -33 H84" stroke="${INK}" stroke-width="2" stroke-dasharray="3 3"/>` +
        `<rect x="-10" y="-36" width="8" height="10" rx="2" fill="#ffd166" ${ln(1.5)}/>` +
        `<path d="${dot(51, -56, 4)}${dot(65, -56, 4)}" fill="#c98b52" ${ln(2)}/>` +
        `<path d="M48 -50 Q58 -64 68 -50 Q74 -40 66 -36 H50 Q42 -40 48 -50 Z" fill="#c98b52" ${ln(2.5)}/><path d="${dot(55, -48, 1.5)}${dot(61, -48, 1.5)}" fill="${INK}"/>`,
    },
    { id: 'mattress', name: 'Mattress', price: 60,
      box: '-106 -86 212 94',
      draw: () => {
        let s = '';
        for (let x = -82; x <= 82; x += 12) s += `M${x} -32V-4`;
        return `<rect x="-96" y="-36" width="192" height="36" rx="12" fill="#f4efe2" ${ln()}/>` +
          `<path d="${s}" stroke="#a9c3e6" stroke-width="3"/>` +
          `<rect x="-92" y="-58" width="52" height="26" rx="12" fill="#fff" ${ln()}/>` +
          `<path d="M-40 -40 Q20 -48 92 -38 L94 -12 Q40 -6 -36 -14 Z" fill="#ef9a5b" ${ln()}/>` +
          '<path d="M-38 -27 Q20 -33 93 -25" stroke="#fff3d6" stroke-width="4" fill="none"/>' +
          '<path d="M-38 -20 Q20 -26 93 -18" stroke="#d97e40" stroke-width="2" fill="none"/>';
      },
    },
    { id: 'hammockbed', name: 'Hammock', price: 80,
      draw: () => {
        // The cloth sways: its sagging middle swings left and right between the posts.
        const cl = c => `M-82 -94 Q${c} -10 82 -94 Q${c} -44 -82 -94Z`, st = c => `M-80 -91 Q${c} -24 80 -91`;
        return `<rect x="-102" y="-9" width="204" height="9" rx="4" fill="#b07a44" ${ln()}/>` +
          tube('M-90 -6 L-96 -106 M90 -6 L96 -106', '#c98b52', 6) +
          `<path d="M-95 -100 L-82 -94 M95 -100 L82 -94" fill="none" ${ln(2)}/>` +
          `<g>${loop('', '-4 0', '4 0', 3.4, 'translate')}${pillow(-44, -76, '#fff', 17, 9)}` +
          `<path d="M-28 -72 Q4 -88 44 -76 L46 -66 H-28 Z" fill="#8f5ad8" ${ln(2.5)}/></g>` +
          `<path d="${cl(-8)}" fill="#ff8a5c" ${ln()}>${loop('d', cl(-8), cl(8), 3.4)}</path>` +
          `<path d="${st(-8)}" fill="none" stroke="#ffd166" stroke-width="5">${loop('d', st(-8), st(8), 3.4)}</path>`;
      },
    },
    { id: 'kokssoffa', name: 'Swedish kitchen sofa bed', price: 120,
      draw: () => {
        const B = '#8fa6b4', L = '#b3c5cf';
        const fl = (x, y) => `<path d="${dot(x - 5, y, 3.6)}${dot(x + 5, y, 3.6)}${dot(x, y - 5, 3.6)}${dot(x, y + 5, 3.6)}" fill="#e0524b"/>` +
          `<circle cx="${x}" cy="${y}" r="2.6" fill="#fff3c4"/>`;
        let rag = '';
        ['#e0524b', '#5aa7e8', '#ffd166', '#6aa86a'].forEach((c, k) => {
          let d = ''; for (let x = -80 + k * 10; x < 80; x += 40) d += `M${x} -57v13`;
          rag += `<path d="${d}" stroke="${c}" stroke-width="5"/>`;
        });
        return `<path d="M-84 -46 V-102 Q-62 -112 -42 -104 Q-22 -122 0 -112 Q22 -122 42 -104 Q62 -112 84 -102 V-46 Z" fill="${B}" ${ln()}/>` +
          `<rect x="-70" y="-98" width="140" height="36" rx="6" fill="${L}" ${ln(2)}/>` +
          '<path d="M-30 -80 q8 -8 16 0 q-8 6 -16 0Z M14 -80 q8 -8 16 0 q-8 6 -16 0Z M-58 -80 q6 -7 12 0 q-6 5 -12 0Z M46 -80 q6 -7 12 0 q-6 5 -12 0Z" fill="#6aa86a"/>' +
          fl(-40, -80) + fl(0, -84) + fl(40, -80) +
          [-1, 1].map(k => `<rect x="${k < 0 ? -100 : 84}" y="-84" width="16" height="42" rx="7" fill="${B}" ${ln()}/>` +
            `<circle cx="${k * 92}" cy="-86" r="7" fill="#6f8796" ${ln(2)}/>`).join('') +
          `<rect x="-86" y="-60" width="172" height="17" rx="7" fill="#fbf5e6" ${ln()}/>` + rag +
          `<rect x="-86" y="-60" width="172" height="17" rx="7" fill="none" ${ln()}/>` +
          pillow(-62, -66, '#fff', 18, 10) +
          `<rect x="30" y="-74" width="52" height="15" rx="5" fill="#e0524b" ${ln(2.5)}/><path d="M42 -73v13M54 -73v13M66 -73v13" stroke="#fff" stroke-width="3"/>` +
          `<rect x="-92" y="-46" width="184" height="38" rx="4" fill="${B}" ${ln()}/>` +
          `<rect x="-82" y="-40" width="76" height="26" rx="4" fill="${L}" ${ln(2)}/><rect x="6" y="-40" width="76" height="26" rx="4" fill="${L}" ${ln(2)}/>` +
          fl(-44, -27) + fl(44, -27) +
          `<rect x="-88" y="-9" width="12" height="9" fill="#6f8796" ${ln(2)}/><rect x="76" y="-9" width="12" height="9" fill="#6f8796" ${ln(2)}/>`;
      },
    },
    { id: 'falubed', name: 'Falu red cottage bed', price: 180,
      box: '-110 -140 220 148',
      draw: () => {
        const R = '#b8352c', W = '#fbf8f0';
        // A little red cottage with white corners: the headboard (big) and the footboard (small).
        const house = (l, r, top) => {
          const m = (l + r) / 2, eave = top + (r - l) * 0.7, d = `M${l} 0 V${eave} L${m} ${top} L${r} ${eave} V0 Z`;
          return `<path d="${d}" fill="${R}"/><rect x="${l}" y="${eave}" width="6" height="${-eave}" fill="${W}"/>` +
            `<rect x="${r - 6}" y="${eave}" width="6" height="${-eave}" fill="${W}"/><path d="${d}" fill="none" ${ln()}/>` +
            tube(`M${l - 4} ${eave + 3} L${m} ${top - 4} L${r + 4} ${eave + 3}`, W, 3);
        };
        return house(-100, -60, -128) +
          `<rect x="-90" y="-94" width="20" height="20" fill="${W}" ${ln(2)}/><rect x="-87" y="-91" width="14" height="14" fill="#9fd3f5"/>` +
          `<path d="M-80 -91 V-77 M-87 -84 H-73" stroke="${W}" stroke-width="2.5"/>` +
          house(66, 98, -96) + `<path d="${heart(82, -60, 6)}" fill="${W}" ${ln(1.5)}/>` +
          `<rect x="-62" y="-66" width="130" height="22" rx="7" fill="#fff" ${ln()}/>` +
          pillow(-42, -72, '#fff', 18, 10) +
          `<path d="M-24 -72 Q20 -79 68 -70 L68 -42 Q20 -36 -22 -44 Z" fill="#4f7fc9" ${ln()}/>` +
          '<path d="M-23 -57 Q20 -62 67 -55 M14 -77 L12 -40" fill="none" stroke="#ffd23f" stroke-width="5"/>' +
          `<rect x="-62" y="-46" width="130" height="24" fill="${R}" ${ln()}/><path d="M-60 -41 H66" stroke="${W}" stroke-width="3"/>`;
      },
    },
    { id: 'woodbed', name: 'Wooden bed', price: 250,
      draw: () => `<path d="M-98 0 V-108 Q-98 -128 -87 -128 Q-76 -128 -76 -108 V0 Z" fill="#c98b52" ${ln()}/>` +
        `<path d="${'M-87 -92 C-94 -100 -94 -108 -87 -105 C-80 -108 -80 -100 -87 -92 Z'}" fill="#ff8fb0" ${ln(1.5)}/>` +
        `<path d="M76 0 V-74 Q76 -90 87 -90 Q98 -90 98 -74 V0 Z" fill="#c98b52" ${ln()}/>` +
        `<rect x="-78" y="-50" width="156" height="28" rx="3" fill="#c98b52" ${ln()}/>` +
        '<path d="M-70 -40 Q-20 -44 30 -38 M-60 -30 Q0 -34 60 -30" fill="none" stroke="#a8693a" stroke-width="2"/>' +
        `<rect x="-78" y="-70" width="154" height="22" rx="6" fill="#fbfaf5" ${ln()}/>` +
        `<ellipse cx="-54" cy="-76" rx="21" ry="11" fill="#fff" ${ln()}/>` +
        `<path d="M-34 -76 Q20 -82 76 -74 L76 -34 Q20 -28 -32 -38 Z" fill="#7ec8f0" ${ln()}/>` +
        '<path d="M-6 -76 l14 -1 l1 13 l-14 1 z M36 -77 l14 0 l0 13 l-14 0 z M16 -60 l14 0 l0 13 l-14 0 z M-24 -60 l14 0 l0 13 l-14 0 z M56 -60 l14 0 l0 13 l-14 0 z" fill="#ffd166"/>' +
        '<circle cx="-62" cy="-80" r="4" fill="#fff" opacity="0.8"/>',
    },
    { id: 'pumpkinbed', name: 'Pumpkin carriage bed', price: 350,
      box: '-106 -146 212 154',
      draw: () => {
        const O = '#ff9a2e', Od = '#e07a1c';
        return `<g class="an-bob"><path d="M56 -96 Q56 -128 74 -128 Q92 -128 92 -96 L92 -84 L86 -90 L80 -84 L74 -90 L68 -84 L62 -90 L56 -84 Z" fill="#fff" ${ln(2.5)}/>` +
          `<path d="${dot(68, -112, 2.5)}${dot(80, -112, 2.5)}" fill="${INK}"/><ellipse cx="74" cy="-104" rx="3" ry="2.4" fill="#ff8fb0"/></g>` +
          `<ellipse cx="0" cy="-62" rx="92" ry="56" fill="${O}" ${ln()}/>` +
          `<path d="M-50 -114 Q-74 -62 -50 -10 M50 -114 Q74 -62 50 -10 M-20 -117 Q-28 -62 -20 -7 M20 -117 Q28 -62 20 -7" fill="none" stroke="${Od}" stroke-width="3"/>` +
          tube('M4 -128 Q22 -146 34 -132 Q40 -122 30 -120', '#6a9a3a', 3) +
          `<path d="M-6 -116 Q-8 -132 2 -138 L10 -134 Q2 -128 6 -116 Z" fill="#6a9a3a" ${ln(2)}/>` +
          `<path d="M-8 -122 Q-30 -140 -42 -124 Q-26 -114 -8 -122 Z" fill="#7cc04a" ${ln(2)}/>` +
          `<path d="M-74 -46 Q-70 -98 0 -100 Q70 -98 74 -46 Z" fill="#4a2d6b" ${ln(2.5)}/>` +
          `<rect x="-70" y="-62" width="140" height="18" rx="6" fill="#fff4e0" ${ln(2)}/>` + pillow(-46, -66, '#fff', 18, 10) +
          `<path d="M-28 -66 Q20 -76 68 -64 L70 -46 H-26 Z" fill="#8f5ad8" ${ln(2.5)}/>` +
          `<path d="${star(16, -60, 5)}${star(46, -62, 4)}" fill="#ffd166"/>` +
          `<path d="M-88 -46 A92 56 0 0 0 88 -46 Z" fill="${O}" ${ln()}/>` +
          `<path d="M-42 -42 Q-48 -24 -38 -9 M42 -42 Q48 -24 38 -9 M0 -44 V-7" fill="none" stroke="${Od}" stroke-width="3"/>` +
          [-62, 62].map(x => `<circle cx="${x}" cy="-14" r="14" fill="#5c9a3a" ${ln(2.5)}/>` +
            `<path d="M${x - 10} -14 H${x + 10} M${x} -24 V-4" stroke="#3d6d26" stroke-width="2.5"/>` +
            `<circle cx="${x}" cy="-14" r="4" fill="#ffd166" ${ln(1.5)}/>`).join('');
      },
    },
    { id: 'coffinbed', name: 'Coffin bed with a bat', price: 450,
      box: '-106 -146 212 154',
      draw: () => {
        const P = '#5a4682';
        const cof = (x, y, w, h) => `M${x - w * 0.3} ${y}H${x + w * 0.3}L${x + w / 2} ${y + h * 0.3}L${x + w * 0.32} ${y + h}` +
          `H${x - w * 0.32}L${x - w / 2} ${y + h * 0.3}Z`;
        return `<path d="${cof(-76, -142, 48, 100)}" fill="${P}" ${ln()}/><path d="${cof(-76, -132, 32, 80)}" fill="#6d58a0" ${ln(2)}/>` +
          `<path d="${heart(-76, -106, 7)}" fill="#ff9ecb" ${ln(1.5)}/>` +
          `<path d="${cof(80, -96, 36, 54)}" fill="${P}" ${ln()}/><path d="${heart(80, -80, 5)}" fill="#ff9ecb" ${ln(1.5)}/>` +
          `<rect x="-92" y="-62" width="186" height="18" rx="6" fill="#efe4ff" ${ln()}/>` + pillow(-70, -68, '#ff9ecb') +
          `<path d="M-50 -68 Q10 -77 70 -66 L72 -46 H-48 Z" fill="#7b5bb5" ${ln()}/>` +
          `<path d="${dot(-24, -60, 2.5)}${dot(0, -54, 2)}${dot(26, -62, 2.5)}${dot(50, -54, 2)}" fill="#c9b4f2"/>` +
          `<path d="M-98 -48 H96 L100 -32 L92 -6 H-92 L-100 -32 Z" fill="${P}" ${ln()}/>` +
          [-56, 0, 56].map(x => `<rect x="${x - 10}" y="-30" width="20" height="7" rx="3.5" fill="#cfd5e6" ${ln(2)}/>`).join('') +
          `<path d="${dot(-80, -4, 5)}${dot(78, -4, 5)}" fill="#45356a" ${ln(2)}/>` +
          // A friendly bat flaps above the bed.
          `<g class="an-float"><path d="M6 -114 Q-8 -130 -28 -120 Q-22 -114 -22 -106 Q-12 -112 -4 -104 Z M26 -114 Q40 -130 60 -120 Q54 -114 54 -106 Q44 -112 36 -104 Z" fill="#6c5a8e" ${ln(2)}/>` +
          `<path d="M7 -114 L7 -128 L14 -120 Z M25 -114 L25 -128 L18 -120 Z" fill="#7d6aa0" ${ln(2)}/>` +
          `<circle cx="16" cy="-108" r="12" fill="#7d6aa0" ${ln(2)}/>` +
          `<path d="${dot(11, -110, 3.6)}${dot(21, -110, 3.6)}" fill="#fff"/><path d="${dot(11.5, -110, 1.8)}${dot(20.5, -110, 1.8)}" fill="${INK}"/>` +
          `<path d="M12 -102 Q16 -99 20 -102" fill="none" ${ln(1.5)}/><path d="M13 -101.6 l1.2 3 l1.2 -3.2 M17 -101.6 l1.2 3 l1.2 -3.2" fill="#fff"/></g>`;
      },
    },
    { id: 'vikingbed', name: 'Viking longship bed', price: 600,
      box: '-112 -140 224 148',
      draw: () => {
        const W = '#b77a45', Wd = '#8f5a2f', sh = ['#e0524b', '#ffd166', '#4f7fc9'];
        let wave = 'M-98 0';
        for (let x = -98; x < 98; x += 14) wave += `Q${x + 7} -12 ${x + 14} 0`;
        // The ship rocks gently on the waves.
        return `<g>${loop('', '-1.5 0 -20', '1.5 0 -20', 4, 'rotate')}` +
          pillow(-62, -64, '#f3ead8') +
          `<path d="M-44 -54 Q-42 -70 -22 -70 Q-10 -80 6 -72 Q18 -80 32 -72 Q46 -78 58 -70 Q74 -72 76 -54 Z" fill="#c9c3b8" ${ln(2.5)}/>` +
          tube('M-80 -54 Q-102 -86 -90 -106 Q-80 -118 -74 -104 Q-72 -96 -82 -96', W, 5) +
          tube('M80 -54 Q100 -80 90 -110', W, 6) +
          `<path d="M84 -108 Q82 -128 98 -128 L108 -120 Q110 -112 102 -112 L96 -108 Q92 -102 84 -108 Z" fill="${W}" ${ln(2.5)}/>` +
          `<path d="M88 -124 l-8 -8" ${ln(3)}/><circle cx="96" cy="-120" r="2.2" fill="${INK}"/>` +
          `<path d="M-86 -56 H86 Q82 -16 50 -6 H-50 Q-82 -16 -86 -56 Z" fill="${W}" ${ln()}/>` +
          `<path d="M-80 -30 Q0 -20 80 -30 M-66 -16 Q0 -8 66 -16" fill="none" stroke="${Wd}" stroke-width="2.5"/>` +
          tube('M-88 -56 H88', '#d9a066', 3) +
          [-60, -36, -12, 12, 36, 60].map((x, i) => `<circle cx="${x}" cy="-44" r="10" fill="${sh[i % 3]}" ${ln(2.5)}/>` +
            `<circle cx="${x}" cy="-44" r="3" fill="#cfd5e6" ${ln(1.5)}/>`).join('') + '</g>' +
          `<path d="${wave}Z" fill="#7fc4ef" ${ln(2.5)}/>`;
      },
    },
    { id: 'sleighbed', name: 'Christmas sleigh bed', price: 800,
      box: '-108 -140 216 148',
      draw: () => {
        const R = '#d63a3a', G = '#f2bd34';
        const fl = [[-50, -118, ''], [-6, -132, 'an-d2'], [30, -116, 'an-d1'], [70, -128, 'an-d3']];
        return fl.map(([x, y, d]) => `<path class="an-fall ${d}" d="M${x - 5} ${y}h10M${x - 2.5} ${y - 4.3}l5 8.6M${x + 2.5} ${y - 4.3}l-5 8.6" stroke="#8fc0ea" stroke-width="2.2" stroke-linecap="round"/>`).join('') +
          pillow(-52, -66) + `<path d="M-34 -66 Q0 -74 30 -66 V-56 H-34 Z" fill="#3e9b57" ${ln(2.5)}/>` +
          `<path d="${dot(-20, -64, 2)}${dot(0, -66, 2)}${dot(18, -63, 2)}" fill="#fff"/>` +
          `<rect x="24" y="-92" width="30" height="36" rx="2" fill="#4fae5c" ${ln(2.5)}/><path d="M39 -92 V-56 M24 -76 H54" stroke="#e0524b" stroke-width="4"/>` +
          `<rect x="30" y="-110" width="20" height="18" rx="2" fill="#5aa7e8" ${ln(2.5)}/><path d="M40 -110 V-92" stroke="#ffd166" stroke-width="4"/>` +
          `<path d="M40 -110 q-8 -8 -10 -2 q2 4 10 2 q8 -8 10 -2 q-2 4 -10 2" fill="#ffd166" ${ln(1.5)}/>` +
          tube('M-92 -6 H66 Q96 -6 98 -26 Q99 -40 86 -38', G, 4) + tube('M-64 -30 V-8 M40 -30 V-8', G, 4) +
          `<path d="M-90 -28 L-96 -110 Q-98 -126 -82 -122 Q-70 -118 -74 -100 L-70 -58 H58 Q74 -58 80 -76 Q86 -94 98 -90 Q108 -84 98 -60 Q88 -28 60 -28 Z" fill="${R}" ${ln()}/>` +
          `<path d="M-76 -44 H64 Q82 -46 90 -66" fill="none" stroke="${G}" stroke-width="5" stroke-linecap="round"/>` +
          `<path d="M-90 -102 q10 -12 18 0 q-8 6 -18 0 Z M-88 -102 q-10 -12 -2 -20 q6 8 2 20 Z" fill="#3e9b57" ${ln(1.5)}/>` +
          `<path d="${dot(-84, -104, 3)}${dot(-78, -100, 3)}" fill="#ff4f5e" ${ln(1.5)}/>`;
      },
    },
    { id: 'piratebed', name: 'Pirate ship bed', price: 1000,
      box: '-106 -172 212 180',
      draw: () => {
        const W = '#a8693a', Wd = '#7f4c25';
        return `<rect x="6" y="-166" width="7" height="110" fill="${Wd}" ${ln(2)}/>` +
          // The pirate flag waves from the top of the mast.
          `<g transform="translate(13 -164)"><g>${loop('', '0', '-9', 2.4, 'skewY')}` +
          `<path d="M0 0 L32 3 L27 10 L32 17 L0 18 Z" fill="${INK}" ${ln(2)}/><path d="M9 13 l10 -6 M9 7 l10 6" stroke="#fff" stroke-width="2"/>` +
          '<circle cx="14" cy="8" r="3.6" fill="#fff"/></g></g>' +
          `<path d="M-22 -150 Q10 -142 40 -150 L44 -98 Q10 -90 -24 -98 Z" fill="#fbf5e6" ${ln(2.5)}/>` +
          '<path d="M-23 -132 Q10 -124 42 -132 M-24 -114 Q10 -106 43 -114" fill="none" stroke="#e0524b" stroke-width="5"/>' +
          pillow(-42, -68) + `<path d="M-24 -68 Q20 -78 76 -66 V-56 H-24 Z" fill="#d93a5c" ${ln(2.5)}/>` +
          `<path d="M-98 -92 H-58 L-56 -62 H80 L100 -76 Q92 -24 60 -6 H-70 Q-94 -20 -98 -92 Z" fill="${W}" ${ln()}/>` +
          `<path d="M-96 -92 V-106 H-60 V-92 M-87 -106 V-92 M-78 -106 V-92 M-69 -106 V-92" fill="none" ${ln(2.5)}/>` +
          `<path d="M-90 -48 Q0 -40 92 -50 M-80 -20 Q0 -14 74 -22" fill="none" stroke="${Wd}" stroke-width="2.5"/>` +
          tube('M-56 -62 H80 L100 -76', '#f2bd34', 3) +
          [-30, 10, 50].map((x, i) => `<circle cx="${x}" cy="-35" r="8" fill="#5b3a1e" ${ln(2.5)}/>` +
            `<circle class="an-glow an-d${i + 1}" cx="${x}" cy="-35" r="5" fill="#ffe27a"/>`).join('') +
          `<circle cx="-78" cy="-62" r="9" fill="none" stroke="#f2bd34" stroke-width="3"/>`;
      },
    },
    { id: 'carbed', name: 'Race car bed', price: 1200,
      box: '-108 -114 216 122',
      draw: () => `<rect x="-62" y="-76" width="106" height="22" rx="6" fill="#fff" ${ln()}/>` +
        `<ellipse cx="-46" cy="-80" rx="17" ry="9" fill="#fff" ${ln()}/>` +
        `<rect x="-20" y="-78" width="64" height="20" rx="4" fill="#fff" ${ln()}/>` +
        `<path d="M-12 -78h8v10h-8zM4 -78h8v10h-8zM20 -78h8v10h-8zM36 -78h7v10h-7zM-20 -68h8v10h-8zM-4 -68h8v10h-8zM12 -68h8v10h-8zM28 -68h8v10h-8z" fill="${INK}"/>` +
        `<rect x="-88" y="-96" width="7" height="24" fill="#c22c2c" ${ln(2)}/><rect x="-102" y="-104" width="40" height="11" rx="3" fill="#ef3b3b" ${ln()}/>` +
        `<path d="M-94 -24 L-94 -66 Q-94 -74 -84 -74 L-68 -74 L-62 -58 L40 -58 Q70 -58 90 -44 Q98 -38 98 -30 L98 -24 Q98 -18 92 -18 L-88 -18 Q-94 -18 -94 -24 Z" fill="#ef3b3b" ${ln()}/>` +
        '<path d="M-92 -40 H86" stroke="#ffd23f" stroke-width="7"/><path d="M48 -54 Q72 -52 86 -42" fill="none" stroke="#ff9b9b" stroke-width="4" stroke-linecap="round"/>' +
        `<circle cx="8" cy="-38" r="12" fill="#fff" ${ln(2)}/><path d="M4 -42 L9 -46 V-30" fill="none" ${ln(3)}/>` +
        `<ellipse cx="93" cy="-32" rx="4" ry="6" fill="#fff6a8" ${ln(1.5)}/>` +
        [-58, 58].map(x => `<circle cx="${x}" cy="-18" r="18" fill="${INK}"/><circle cx="${x}" cy="-18" r="8" fill="#d6dbe6" ${ln(2)}/>` +
          `<circle cx="${x}" cy="-18" r="2.5" fill="${INK}"/>`).join(''),
    },
    { id: 'cloudbed', name: 'Floating cloud bed', price: 1600,
      box: '-106 -134 212 142',
      draw: () => {
        const cl = `${dot(-74, -50, 20)}${dot(-44, -60, 24)}${dot(-6, -64, 26)}${dot(34, -60, 24)}${dot(72, -50, 22)}` +
          `${dot(-50, -38, 20)}${dot(0, -36, 22)}${dot(48, -38, 20)}M-72 -52 V-26 H74 V-52 Z`;
        return `<ellipse class="an-pulse" cx="0" cy="-3" rx="72" ry="6" fill="${INK}" opacity="0.15"/>` +
          `<g class="an-float">${puff(cl, '#fff')}` +
          '<path d="M-74 -36 Q-52 -26 -30 -32 M14 -24 Q34 -18 56 -28" fill="none" stroke="#cfe4f7" stroke-width="4" stroke-linecap="round"/>' +
          pillow(-54, -82, '#fff3fb', 20, 11) +
          `<path d="M-34 -82 Q12 -94 74 -78 L78 -60 Q20 -52 -30 -64 Z" fill="#a9d4ff" ${ln()}/>` +
          `<path d="${star(0, -76, 5)}${star(30, -78, 4.5)}${star(56, -70, 5)}" fill="#ffe066"/></g>` +
          tw(-90, -100, 7) + tw(84, -106, 6, 'an-d2') + tw(10, -122, 5, 'an-d1');
      },
    },
    { id: 'rocketbed', name: 'Rocket bed', price: 2000,
      box: '-114 -134 220 142',
      draw: () => {
        const R = '#ef3b3b';
        return pillow(-44, -84, '#fff', 16, 9) + `<path d="M-30 -84 Q10 -96 52 -84 V-74 H-30 Z" fill="#6b8bff" ${ln(2.5)}/>` +
          `<g transform="translate(-82 -50) rotate(-90)">${flame(0, 0, 1.5)}</g>` +
          `<path d="M-70 -66 L-86 -72 V-28 L-70 -34 Z" fill="#8e95a3" ${ln(2.5)}/>` +
          `<path d="M-66 -76 L-88 -108 Q-72 -110 -44 -76 Z" fill="${R}" ${ln(2.5)}/>` +
          `<path d="M-66 -24 L-86 0 H-58 L-44 -24 Z" fill="${R}" ${ln(2.5)}/>` + tube('M34 -24 L26 -2 M52 -24 L60 -2', '#8e95a3', 4) +
          `<path d="M-72 -78 H46 Q86 -76 100 -50 Q86 -24 46 -22 H-72 Z" fill="#f4f6fb" ${ln()}/>` +
          `<path d="M60 -75 Q88 -70 100 -50 Q88 -30 60 -25 Q68 -50 60 -75 Z" fill="${R}" ${ln(2.5)}/>` +
          `<path d="M-60 -78 H-48 V-22 H-60 Z" fill="${R}" ${ln(2)}/>` +
          `<circle cx="28" cy="-50" r="13" fill="#cfd5e6" ${ln(3)}/><circle cx="28" cy="-50" r="8" fill="#5ec8ff" ${ln(2)}/>` +
          '<circle cx="25" cy="-53" r="2.5" fill="#fff"/>' +
          `<path d="${star(-16, -50, 8)}" fill="#ffd23f" ${ln(1.5)}/>` +
          tw(-30, -118, 6) + tw(40, -112, 5, 'an-d2') + tw(84, -96, 6, 'an-d1');
      },
    },
    { id: 'unicornbed', name: 'Unicorn rainbow bed', gems: 20,
      box: '-108 -162 216 170',
      draw: () => {
        const bands = ['#ff6b81', '#ffa62b', '#ffe066', '#6fdc6a', '#5ec8ff', '#b46bff'];
        const arc = r => `M${-r} -44 A${r} ${r} 0 0 1 ${r} -44`;
        return `<path d="${arc(74.5)}" fill="none" stroke="${INK}" stroke-width="48"/>` +
          bands.map((c, i) => `<path d="${arc(92 - i * 7)}" fill="none" stroke="${c}" stroke-width="7.4"/>`).join('') +
          `<path class="an-glow" d="${arc(92)}" fill="none" stroke="#fff" stroke-width="2.5"/>` +
          `<rect x="-92" y="-62" width="184" height="18" rx="7" fill="#fff" ${ln()}/>` +
          `<path d="M-38 -66 Q20 -76 90 -62 L90 -42 Q20 -38 -36 -44 Z" fill="#ff9ecb" ${ln()}/>` +
          `<path d="${heart(0, -56, 4)}${heart(30, -60, 4)}${heart(62, -54, 4)}" fill="#fff"/>` +
          // The unicorn-head pillow, fast asleep.
          `<path d="M-66 -92 L-60 -114 L-54 -92 Z" fill="#ffcf3f" ${ln(2)}/>` +
          `<path d="M-80 -86 Q-92 -78 -84 -66 Q-92 -58 -82 -52 L-70 -60 Z" fill="#b46bff" ${ln(2)}/>` +
          `<circle cx="-62" cy="-72" r="17" fill="#fff" ${ln()}/><ellipse cx="-46" cy="-66" rx="9" ry="7" fill="#ffd9ec" ${ln(2)}/>` +
          `<path d="M-74 -88 L-70 -98 L-66 -88" fill="#fff" ${ln(2)}/>` +
          `<path d="M-68 -76 q4 3 8 0" fill="none" ${ln(2)}/><circle cx="-60" cy="-68" r="3" fill="#ff8fb0"/>` +
          `<rect x="-96" y="-46" width="192" height="32" rx="10" fill="#fff" ${ln()}/>` +
          `<path d="M-94 -36 H94" stroke="#ff9ecb" stroke-width="5"/>` + gem(0, -28, 8, '#ff4f7b') +
          `<rect x="-86" y="-16" width="12" height="16" rx="3" fill="#f2bd34" ${ln(2)}/><rect x="74" y="-16" width="12" height="16" rx="3" fill="#f2bd34" ${ln(2)}/>` +
          `<path class="an-rise" d="${heart(40, -84, 5)}" fill="#ff6b9a"/><path class="an-rise an-d3" d="${heart(70, -92, 4)}" fill="#ff6b9a"/>` +
          sparkle(-86, -124, 8) + sparkle(84, -128, 7) + sparkle(0, -150, 6);
      },
    },
    { id: 'royalbed', name: 'Royal bed', gems: 40,
      box: '-130 -262 260 270',
      draw: () => {
        let sc = 'M104 -204';
        for (let x = 104; x > -104; x -= 26) sc += `Q${x - 13} -186 ${x - 26} -204`;
        let fringe = '';
        for (let x = -36; x <= 86; x += 8) fringe += `M${x} -34v7`;
        return `<rect x="-88" y="-202" width="176" height="158" fill="#e8d6ff" ${ln(2)}/>` +
          '<path d="M-60 -200 V-50 M-30 -200 V-50 M0 -200 V-50 M30 -200 V-50 M60 -200 V-50" stroke="#d2b8f5" stroke-width="3"/>' +
          `<rect x="-98" y="-222" width="11" height="222" rx="3" fill="#f2bd34" ${ln(2)}/><rect x="87" y="-222" width="11" height="222" rx="3" fill="#f2bd34" ${ln(2)}/>` +
          `<path d="M-104 -224 Q0 -248 104 -224 Z" fill="#7a3fc4" ${ln()}/>` +
          `<path d="M-104 -226 H104 V-204 ${sc.slice(9)} Z" fill="#8f5ad8" ${ln()}/>` +
          `<path d="${sc.replace('M104 -204', 'M104 -206')}" fill="none" stroke="#ffcf3f" stroke-width="4"/>` + crown(0, -234, 1.2) +
          `<path d="M-98 -202 Q-74 -196 -60 -202 Q-64 -156 -84 -122 Q-70 -90 -80 -44 L-98 -44 Z" fill="#8f5ad8" ${ln()}/>` +
          `<path d="M98 -202 Q74 -196 60 -202 Q64 -156 84 -122 Q70 -90 80 -44 L98 -44 Z" fill="#8f5ad8" ${ln()}/>` +
          `<circle cx="-86" cy="-122" r="6" fill="#ffcf3f" ${ln(2)}/><circle cx="86" cy="-122" r="6" fill="#ffcf3f" ${ln(2)}/>` +
          `<rect x="-96" y="-150" width="22" height="104" rx="8" fill="#ffcf3f" ${ln()}/><circle cx="-85" cy="-136" r="5" fill="#ff4f7b" ${ln(1.5)}/>` +
          `<rect x="-86" y="-80" width="172" height="30" rx="8" fill="#fff6e6" ${ln()}/>` +
          `<rect x="-94" y="-52" width="188" height="34" rx="5" fill="#f2bd34" ${ln()}/>` +
          gem(-50, -35, 8, '#ff4f7b') + gem(0, -35, 8, '#5ec8ff') + gem(50, -35, 8, '#7be07b') +
          `<circle cx="-82" cy="-10" r="9" fill="#e6a823" ${ln(2)}/><circle cx="82" cy="-10" r="9" fill="#e6a823" ${ln(2)}/>` +
          `<rect x="-82" y="-104" width="40" height="28" rx="12" fill="#8f5ad8" ${ln()}/><rect x="-60" y="-98" width="34" height="24" rx="11" fill="#ffcf3f" ${ln()}/>` +
          `<path d="M-40 -84 Q24 -90 90 -82 L90 -34 Q24 -28 -38 -40 Z" fill="#d93a5c" ${ln()}/>` +
          '<path d="M-38 -46 Q24 -36 89 -40" fill="none" stroke="#ffcf3f" stroke-width="4"/>' +
          `<path d="${fringe}" stroke="#ffcf3f" stroke-width="2.5" stroke-linecap="round"/>` +
          `<path d="${star(26, -64, 9)}" fill="#ffcf3f" ${ln(1.5)}/>` +
          sparkle(-56, -186, 10) + sparkle(56, -168, 8) + sparkle(64, -96, 8) + sparkle(-20, -216, 7);
      },
    },
    { id: 'dragonbed', name: 'Dragon nest bed', gems: 50,
      box: '-110 -156 220 164',
      draw: () => {
        const wing = `<path d="M-20 -60 L-58 -140 Q-84 -150 -102 -132 Q-92 -114 -96 -94 Q-84 -100 -78 -86 Q-66 -94 -56 -78 Q-40 -84 -20 -60 Z" fill="#9b5de5" ${ln()}/>` +
          '<path d="M-58 -140 L-94 -96 M-58 -140 L-77 -88 M-58 -140 L-55 -80" fill="none" stroke="#6f3cb8" stroke-width="3"/>';
        // Woven twigs: two zigzags between the rim and the round bottom of the nest.
        const yb = x => -9 - 46 * (x / 98) ** 2, yt = x => -45 - 9 * (x / 98) ** 2;
        let tw2 = '';
        for (const o of [0, 1]) for (let k = 0; k <= 16; k++) { const x = -84 + k * 10.5; tw2 += (k ? 'L' : 'M') + `${x} ${Math.round((k + o) % 2 ? yb(x) : yt(x))}`; }
        return wing + `<g transform="scale(-1 1)">${wing}</g>` +
          `<ellipse cx="0" cy="-58" rx="96" ry="16" fill="#8a5a2e" ${ln()}/>` +
          pillow(-58, -62, '#fff6e0', 17, 9) +
          `<path d="M-42 -62 Q-6 -72 28 -62 V-46 H-42 Z" fill="#e0524b" ${ln(2.5)}/>` +
          `<path d="M-32 -60 q4 4 8 0 q4 4 8 0 q4 4 8 0 q4 4 8 0" fill="none" stroke="#ffcf3f" stroke-width="2.5"/>` +
          `<circle class="an-glow" cx="54" cy="-72" r="34" fill="#ffe27a" fill-opacity="0.55"/>` +
          // The egg wobbles: it is about to hatch!
          `<g class="an-sway"><ellipse cx="54" cy="-66" rx="18" ry="24" fill="#6fd6c4" ${ln()}/>` +
          `<path d="${dot(46, -76, 4)}${dot(62, -62, 5)}${dot(48, -54, 3)}${dot(60, -82, 3)}" fill="#b46bff"/>` +
          `<path d="M38 -70 L44 -66 L48 -72 L54 -66 L58 -72" fill="none" ${ln(2)}/><ellipse cx="47" cy="-82" rx="3" ry="6" fill="#fff" opacity="0.8"/></g>` +
          `<path d="M-98 -58 Q-96 -2 0 -4 Q96 -2 98 -58 Q50 -42 0 -42 Q-50 -42 -98 -58 Z" fill="#b07a44" ${ln()}/>` +
          `<path d="${tw2}" fill="none" stroke="#8a5a2e" stroke-width="3" stroke-linecap="round"/>` +
          `<path d="M-98 -58 Q-96 -2 0 -4 Q96 -2 98 -58 Q50 -42 0 -42 Q-50 -42 -98 -58 Z" fill="none" ${ln()}/>` +
          tube('M-92 -54 l-10 -7 M92 -54 l10 -7 M-30 -6 l-8 5', '#8a5a2e', 3) +
          `<path d="${dot(-70, -46, 6)}${dot(-56, -44, 6)}${dot(-63, -50, 6)}${dot(80, -50, 6)}${dot(10, -42, 6)}" fill="#ffcf3f" ${ln(2)}/>` +
          gem(-30, -42, 7, '#ff4f7b') + gem(30, -44, 7, '#5ec8ff') + gem(-4, -28, 6, '#7be07b') +
          sparkle(54, -112, 9) + sparkle(-86, -150, 7) + sparkle(88, -140, 7) + sparkle(18, -88, 6);
      },
    },
    { id: 'starrybed', name: 'Starry night bed', gems: 60,
      box: '-110 -194 220 202',
      draw: () => {
        const N = '#22306e', G = '#ffcf3f';
        const st = [[-60, -130, 7, ''], [-24, -154, 5, 'an-d2'], [34, -140, 8, 'an-d1'], [66, -112, 6, 'an-d3'],
          [-72, -94, 5, 'an-d4'], [58, -158, 4, 'an-d2'], [10, -106, 4, 'an-d3']];
        return `<path d="M-96 -40 V-120 Q-96 -178 0 -178 Q96 -178 96 -120 V-40 Z" fill="${N}" ${ln()}/>` +
          `<path d="M-86 -44 V-118 Q-86 -166 0 -166 Q86 -166 86 -118 V-44" fill="none" stroke="${G}" stroke-width="4"/>` +
          cloud(30, -96, 0.9) + st.map(([x, y, r, d]) => `<path class="an-twinkle ${d}" d="${star(x, y, r)}" fill="#fff3a0"/>`).join('') +
          `<g class="an-float"><path d="M4 -144 A20 20 0 1 0 4 -112 A22 22 0 0 1 4 -144 Z" fill="${G}" ${ln(2.5)}/>` +
          `<path d="M-18 -128 q3 3 6 0" fill="none" ${ln(2)}/><circle cx="-12" cy="-121" r="2.5" fill="#ff9a7a"/></g>` +
          `<rect x="-90" y="-62" width="180" height="18" rx="6" fill="#fff" ${ln()}/>` + pillow(-66, -68, '#fff3c4') +
          `<path d="M-44 -68 Q20 -77 92 -64 L92 -42 Q20 -36 -42 -44 Z" fill="#3b4fb0" ${ln()}/>` +
          `<path d="${star(-10, -56, 5)}${star(24, -60, 6)}${star(60, -54, 5)}" fill="${G}"/>` +
          `<rect x="-98" y="-46" width="196" height="32" rx="8" fill="${N}" ${ln()}/>` +
          `<path d="M-96 -40 H96" stroke="${G}" stroke-width="4"/><path d="${star(-50, -26, 6)}${star(0, -26, 7)}${star(50, -26, 6)}" fill="${G}" ${ln(1.5)}/>` +
          `<rect x="-90" y="-16" width="12" height="16" rx="3" fill="${G}" ${ln(2)}/><rect x="78" y="-16" width="12" height="16" rx="3" fill="${G}" ${ln(2)}/>` +
          sparkle(-98, -164, 8) + sparkle(98, -150, 8) + sparkle(0, -184, 6);
      },
    },
  ]);
})();
