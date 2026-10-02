// Tables (bottom centre; x -105..105).
// Cheap to elite; each entry is the catalog item (ITEMS) and its drawing (ROOM_ART), added by addItems.

(() => {
  const { r1, dot, star, sparkle, flip, flame, cloud, gem } = ROOM_KIT;
  // Local helpers: a heart, a little flower of four dots, a looping SMIL animation, a gear wheel.
  const heart = (x, y, s) => `M${x} ${y + s}C${x - s * 1.6} ${y - s * 0.2} ${x - s * 0.8} ${y - s * 1.4} ${x} ${y - s * 0.5}` +
    `C${x + s * 0.8} ${y - s * 1.4} ${x + s * 1.6} ${y - s * 0.2} ${x} ${y + s}Z`;
  const flower = (x, y, r = 3) => `<path d="${dot(x - r, y, r)}${dot(x + r, y, r)}${dot(x, y - r, r)}${dot(x, y + r, r)}" fill="#e0524b"/>` +
    `<circle cx="${x}" cy="${y}" r="${r * 0.7}" fill="#fff3c4"/>`;
  const loop = (a, b, dur, type) => `<animateTransform attributeName="transform" type="${type}" values="${a};${b};${a}" keyTimes="0;0.5;1"` +
    ` calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1" dur="${dur}s" repeatCount="indefinite"/>`;
  function gearD(cx, cy, r, n) {
    let d = '';
    const h = Math.PI / n;
    for (let i = 0; i < n; i++) {
      const a = i * 2 * h;
      [[r, a - h * 0.75], [r + 5, a - h * 0.4], [r + 5, a + h * 0.4], [r, a + h * 0.75]].forEach(([rr, t], k) => {
        d += (i || k ? 'L' : 'M') + r1(cx + Math.cos(t) * rr) + ' ' + r1(cy + Math.sin(t) * rr);
      });
    }
    return d + 'Z' + dot(cx, cy, r * 0.35);
  }
  addItems('table', ROOM_ART, [
    { id: 'crate', name: 'Wooden crate', price: 0,
      box: '-76 -140 152 148',
      draw: () => `<rect x="-54" y="-80" width="108" height="80" rx="3" fill="#c79157" ${ln()}/>` +
        tube('M-38 -8 L38 -72', '#b07a44', 7) +
        `<path d="M-54 -54 H54 M-54 -27 H54" stroke="${INK}" stroke-width="2.5"/>` +
        `<rect x="-54" y="-80" width="13" height="80" fill="#b07a44" ${ln(2)}/><rect x="41" y="-80" width="13" height="80" fill="#b07a44" ${ln(2)}/>` +
        `<path d="${dot(-47, -72, 1.8)}${dot(-47, -8, 1.8)}${dot(47, -72, 1.8)}${dot(47, -8, 1.8)}" fill="${INK}"/>` +
        '<circle cx="-20" cy="-106" r="24" fill="#ffe58a" opacity="0.25"/>' +
        `<ellipse cx="-20" cy="-82" rx="15" ry="3.5" fill="#e9e2d4" ${ln(2)}/>` +
        `<path d="M-26 -82 V-96 Q-23 -98 -20 -96 Q-17 -98 -14 -96 V-82 Z" fill="#f6edd6" ${ln(2)}/>` +
        `<path d="M-15 -95 Q-12 -90 -14 -87" fill="none" stroke="#f6edd6" stroke-width="3" stroke-linecap="round"/>` +
        `<path d="M-20 -97 V-101" ${ln(1.5)}/>` + flame(-20, -100, 0.85) +
        `<path d="M30 -112 L35 -124 L40 -113" fill="#c3c9d4" ${ln(1.5)}/>` +
        `<rect x="14" y="-112" width="26" height="32" fill="#c3c9d4" ${ln(2)}/>` +
        '<path d="M14 -102 H40 M14 -92 H40" stroke="#a3aab7" stroke-width="2"/>' +
        `<path d="M14 -100 H32 L28 -94 L33 -88 H14 Z" fill="#e9c46a" ${ln(1.5)}/>` +
        `<ellipse cx="27" cy="-112" rx="13" ry="3.5" fill="#8e95a3" ${ln(2)}/>`,
    },
    { id: 'planktable', name: 'Plank on bricks', price: 15,
      box: '-104 -104 208 112',
      draw: () => {
        const br = (x, y) => `<rect x="${x}" y="${y}" width="32" height="14" rx="2" fill="#c8553d" ${ln(2)}/>`;
        return br(-90, -14) + br(-86, -28) + br(58, -14) + br(54, -28) +
          `<rect x="-98" y="-40" width="196" height="12" rx="3" fill="#c79157" ${ln()}/>` +
          '<ellipse cx="20" cy="-34" rx="5" ry="2.5" fill="#a8763f"/><path d="M-80 -35 H0 M34 -33 H86" stroke="#b07a44" stroke-width="2"/>' +
          '<path d="M-52 -62 Q-56 -76 -50 -86" fill="none" stroke="#5c9a3a" stroke-width="3"/>' +
          `<path d="M-50 -82 q-10 -4 -12 4 q8 2 12 -4 Z" fill="#6fcf6a" ${ln(1.5)}/><circle cx="-50" cy="-89" r="7" fill="#ffd23f" ${ln(2)}/>` +
          `<rect x="-62" y="-62" width="18" height="22" fill="#c3c9d4" ${ln(2)}/><path d="M-62 -54 H-44 M-62 -48 H-44" stroke="#a3aab7" stroke-width="2"/>` +
          `<path d="M38 -54 q10 0 10 7 q0 7 -10 6" fill="none" ${ln(3)}/>` +
          `<rect x="20" y="-58" width="20" height="18" rx="3" fill="#fff" ${ln(2)}/><path d="M21 -55 H39" stroke="#5aa7e8" stroke-width="3"/>` +
          `<circle cx="27" cy="-47" r="2.5" fill="${INK}"/>`;
      },
    },
    { id: 'stooltable', name: 'Stool and bucket', price: 30,
      box: '-100 -112 200 120',
      draw: () => tube('M-54 -60 L-62 -2 M8 -60 L16 -2 M-23 -60 V-2', '#b07a44', 5) + tube('M-58 -30 H12', '#b07a44', 3) +
        `<rect x="-66" y="-70" width="86" height="11" rx="5" fill="#c98b52" ${ln()}/>` +
        tube('M-20 -86 L-6 -102', '#d9a066', 3) +
        `<path d="M-48 -84 H-8 Q-10 -70 -28 -70 Q-46 -70 -48 -84 Z" fill="#e9e2d4" ${ln(2)}/>` +
        `<ellipse cx="-28" cy="-84" rx="20" ry="4" fill="#f4e2b8" ${ln(2)}/>` +
        `<rect x="-2" y="-78" width="18" height="8" rx="2" fill="#5aa7e8" ${ln(2)}/>` +
        `<path d="M42 0 L50 -44 H82 L90 0 Z" fill="#9aa5b5" ${ln()}/>` +
        '<path d="M48 -30 H84 M46 -16 H86" stroke="#7f8a9b" stroke-width="2.5"/>' +
        `<rect x="38" y="-8" width="56" height="8" rx="3" fill="#b6c0cd" ${ln(2)}/>` +
        `<path d="M46 -44 Q66 -54 86 -44 Q66 -40 46 -44 Z" fill="#e0524b" ${ln(2)}/>`,
    },
    { id: 'foldtable', name: 'Folding camp table', price: 50,
      box: '-100 -136 200 144',
      draw: () => tube('M-62 -58 L-26 -2 M-26 -58 L-62 -2 M26 -58 L62 -2 M62 -58 L26 -2', '#9aa5b5', 4) +
        `<rect x="-80" y="-66" width="160" height="10" rx="3" fill="#5fae6a" ${ln()}/>` +
        `<rect x="-62" y="-112" width="20" height="46" rx="6" fill="#e0524b" ${ln(2)}/>` +
        `<rect x="-64" y="-122" width="24" height="12" rx="3" fill="#c22c2c" ${ln(2)}/>` +
        '<path d="M-61 -96 H-43" stroke="#fff" stroke-width="3"/>' +
        `<path d="M-14 -80 q9 0 9 6 q0 6 -9 5" fill="none" ${ln(3)}/>` +
        `<rect x="-32" y="-84" width="20" height="18" rx="3" fill="#4f7fc9" ${ln(2)}/>` +
        `<path d="${dot(-26, -77, 1.8)}${dot(-18, -72, 1.8)}" fill="#fff"/>` +
        `<ellipse cx="38" cy="-67" rx="26" ry="4" fill="#c3c9d4" ${ln(2)}/>` +
        `<rect x="20" y="-76" width="36" height="7" rx="2" fill="#f1c27d" ${ln(1.5)}/>` +
        `<path d="M18 -77 q4 -4 8 0 q4 -4 8 0 q4 -4 8 0 q4 -4 8 0 q4 -4 8 0 Z" fill="#6fcf6a" ${ln(1.5)}/>` +
        `<path d="M20 -79 Q38 -92 56 -79 Z" fill="#f1c27d" ${ln(1.5)}/>`,
    },
    { id: 'smalltable', name: 'Table and chair', price: 70,
      box: '-86 -132 192 140',
      draw: () => `<rect x="88" y="-114" width="9" height="114" rx="3" fill="#d9944f" ${ln(2)}/>` +
        `<rect x="76" y="-114" width="26" height="9" rx="4" fill="#e7a35e" ${ln(2)}/>` +
        `<rect x="54" y="-48" width="7" height="48" fill="#d9944f" ${ln(2)}/>` +
        `<rect x="50" y="-54" width="48" height="9" rx="3" fill="#e7a35e" ${ln(2)}/>` +
        `<rect x="-64" y="-70" width="9" height="70" fill="#d9944f" ${ln(2)}/><rect x="25" y="-70" width="9" height="70" fill="#d9944f" ${ln(2)}/>` +
        `<rect x="-66" y="-70" width="102" height="10" fill="#d9944f" ${ln(2)}/>` +
        `<rect x="-74" y="-80" width="118" height="11" rx="4" fill="#f0b26e" ${ln()}/>` +
        `<path d="M-30 -86 Q-21 -88 -22 -93 M-30 -86" fill="none" ${ln(2)}/>` +
        `<path d="M-32 -94 Q-22 -94 -24 -86 Q-26 -82 -32 -84" fill="none" ${ln(2.5)}/>` +
        `<rect x="-50" y="-98" width="18" height="18" rx="3" fill="#ff6b6b" ${ln(2)}/>` +
        '<path d="M-45 -104 Q-42 -110 -45 -116 M-38 -104 Q-35 -110 -38 -116" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>' +
        `<ellipse cx="4" cy="-81" rx="20" ry="4" fill="#fff" ${ln(2)}/>` +
        `<circle cx="4" cy="-91" r="9" fill="#ff5d5d" ${ln(2)}/><path d="M4 -100 Q8 -106 13 -103 Q9 -99 4 -100 Z" fill="#6fcf6a" ${ln(1.5)}/>` +
        '<circle cx="1" cy="-94" r="2" fill="#fff"/>',
    },
    { id: 'schooldesk', name: 'Old school desk', price: 100,
      box: '-104 -134 208 142',
      draw: () => tube('M-6 -2 V-64 M78 -2 V-64 M-12 -2 H84 M-6 -30 Q36 -46 78 -30', '#4a4f63', 4) +
        tube('M-88 -38 V-2 M-46 -38 V-2 M-94 -2 H-40', '#4a4f63', 4) +
        `<rect x="-98" y="-92" width="9" height="50" rx="3" fill="#c98b52" ${ln(2)}/>` +
        `<rect x="-98" y="-86" width="54" height="9" rx="3" fill="#c98b52" ${ln(2)}/>` +
        `<rect x="-100" y="-46" width="62" height="9" rx="3" fill="#c98b52" ${ln(2)}/>` +
        `<path d="M-14 -62 V-82 L60 -94 H84 V-62 Z" fill="#b97843" ${ln()}/>` +
        `<path d="M-20 -82 L60 -96 V-90 L-20 -76 Z" fill="#d29d62" ${ln(2.5)}/>` +
        `<rect x="58" y="-100" width="30" height="7" rx="2" fill="#d29d62" ${ln(2.5)}/>` +
        `<path d="M2 -85 L40 -91.5 L40 -95.5 L2 -89 Z" fill="#ff6b81" ${ln(1.5)}/>` +
        tube('M10 -94 L34 -98', '#ffd23f', 2) +
        `<rect x="62" y="-110" width="10" height="10" rx="2" fill="#2f4a9a" ${ln(2)}/><path d="M66 -110 L72 -124" ${ln(1.5)}/>` +
        `<circle cx="80" cy="-107" r="7" fill="#ff5d5d" ${ln(2)}/><path d="M80 -114 q2 -5 6 -4" fill="none" ${ln(1.5)}/>` +
        '<path d="M2 -72 H40 M2 -66 H40" stroke="#a8693a" stroke-width="2"/>',
    },
    { id: 'fikatable', name: 'Swedish fika table', price: 150,
      box: '-104 -144 208 152',
      draw: () => {
        const B = '#5f8fb5';
        return `<rect x="-82" y="-76" width="11" height="76" rx="3" fill="${B}" ${ln(2)}/><rect x="71" y="-76" width="11" height="76" rx="3" fill="${B}" ${ln(2)}/>` +
          `<rect x="-88" y="-80" width="176" height="18" fill="${B}" ${ln()}/>` +
          '<path d="M-38 -71 q6 -6 12 0 q-6 4 -12 0Z M26 -71 q6 -6 12 0 q-6 4 -12 0Z M-12 -71 q-6 -6 -12 0 q6 4 12 0Z M12 -71 q6 -6 12 0 q-6 4 -12 0Z" fill="#6aa86a"/>' +
          flower(-50, -71) + flower(0, -71) + flower(50, -71) +
          `<rect x="-96" y="-90" width="192" height="11" rx="3" fill="#7aa8c8" ${ln()}/>` +
          `<path d="M-70 -118 Q-84 -110 -70 -98" fill="none" ${ln(3)}/>` +
          `<path d="M-44 -102 L-30 -116 L-27 -112 L-42 -94" fill="#d63a3a" ${ln(2.5)}/>` +
          `<path d="M-70 -90 L-66 -124 Q-56 -130 -46 -124 L-42 -90 Z" fill="#d63a3a" ${ln(2.5)}/>` +
          `<path d="M-64 -126 Q-56 -134 -48 -126" fill="#d63a3a" ${ln(2)}/><circle cx="-56" cy="-133" r="3" fill="${INK}"/>` +
          `<path d="${dot(-62, -112, 2.2)}${dot(-52, -106, 2.2)}${dot(-60, -98, 2.2)}${dot(-50, -117, 2.2)}" fill="#fff"/>` +
          '<path class="an-rise" d="M-10 -108 q-4 -5 0 -10 q4 -5 0 -10" fill="none" stroke="#aab8d4" stroke-width="3" stroke-linecap="round"/>' +
          '<path class="an-rise an-d3" d="M-1 -108 q-4 -5 0 -10 q4 -5 0 -10" fill="none" stroke="#aab8d4" stroke-width="3" stroke-linecap="round"/>' +
          `<ellipse cx="-6" cy="-91" rx="15" ry="3" fill="#fff" ${ln(2)}/>` +
          `<path d="M3 -102 q8 0 8 4 q0 5 -9 4" fill="none" ${ln(2.5)}/>` +
          `<path d="M-16 -106 H4 Q3 -93 -6 -93 Q-15 -93 -16 -106 Z" fill="#fff" ${ln(2)}/><path d="M-15 -102 H3" stroke="#5aa7e8" stroke-width="2.5"/>` +
          `<ellipse cx="38" cy="-91" rx="22" ry="4" fill="#fff" ${ln(2)}/>` +
          `<ellipse cx="38" cy="-100" rx="16" ry="9" fill="#c98a45" ${ln(2.5)}/>` +
          '<path d="M26 -100 Q30 -108 40 -106 Q50 -104 48 -98 Q44 -93 37 -96 Q33 -99 37 -102" fill="none" stroke="#8a5426" stroke-width="2.5" stroke-linecap="round"/>' +
          `<path d="${dot(30, -105, 1.6)}${dot(45, -107, 1.6)}${dot(49, -102, 1.6)}${dot(33, -98, 1.6)}${dot(42, -96, 1.6)}" fill="#fff"/>` +
          `<rect x="68" y="-102" width="12" height="12" rx="3" fill="#cfe8f5" ${ln(2)}/><path d="M74 -102 V-132" ${ln(2)}/>` +
          `<rect x="74" y="-132" width="22" height="14" fill="#2f6fc2" ${ln(1.5)}/><path d="M74 -125 H96 M81 -132 V-118" stroke="#ffd23f" stroke-width="3.5"/>`;
      },
    },
    { id: 'easeltable', name: 'Art table with an easel', price: 200,
      box: '-106 -184 212 192',
      draw: () => {
        const jar = (x, c) => `<rect x="${x}" y="-80" width="13" height="16" rx="3" fill="${c}" ${ln(2)}/><rect x="${x}" y="-84" width="13" height="5" rx="1" fill="#fff" ${ln(1.5)}/>`;
        return tube('M60 -176 L34 -2 M60 -176 L86 -2 M60 -150 V-2', '#c98b52', 4) +
          `<rect x="22" y="-158" width="76" height="86" rx="2" fill="#fff" ${ln()}/>` +
          '<rect x="27" y="-153" width="66" height="76" fill="#bfe6ff"/>' +
          `<circle cx="80" cy="-138" r="9" fill="#ffd23f" ${ln(1.5)}/>` +
          `<path d="M27 -98 Q50 -118 93 -102 V-77 H27 Z" fill="#7bd06b" ${ln(1.5)}/>` +
          `<rect x="40" y="-114" width="18" height="14" fill="#ff6b6b" ${ln(1.5)}/><path d="M37 -114 L49 -124 L61 -114 Z" fill="#8f5a2f" ${ln(1.5)}/>` +
          `<path d="M28 -136 q6 -6 12 0 q6 -6 12 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>` +
          `<rect x="18" y="-75" width="84" height="7" rx="2" fill="#b07a44" ${ln(2)}/>` +
          `<rect x="-94" y="-56" width="9" height="56" fill="#d9944f" ${ln(2)}/><rect x="-14" y="-56" width="9" height="56" fill="#d9944f" ${ln(2)}/>` +
          `<rect x="-102" y="-64" width="104" height="10" rx="3" fill="#f0b26e" ${ln()}/>` +
          '<path d="M-86 -56 v5 M-30 -56 v7" stroke="#5aa7e8" stroke-width="3.5" stroke-linecap="round"/>' +
          jar(-98, '#ff5d5d') + jar(-82, '#5aa7e8') + jar(-66, '#ffd23f') +
          tube('M-38 -80 L-44 -104 M-32 -80 L-32 -108 M-26 -80 L-20 -102', '#c98b52', 2.5) +
          `<path d="${dot(-44, -106, 3)}" fill="#ff5d5d"/><path d="${dot(-32, -110, 3)}" fill="#6fcf6a"/><path d="${dot(-20, -104, 3)}" fill="#b46bff"/>` +
          `<rect x="-42" y="-84" width="20" height="20" rx="3" fill="#5aa7e8" ${ln(2)}/>` +
          `<ellipse cx="-10" cy="-66" rx="15" ry="4" fill="#e7c08a" ${ln(2)}/>` +
          `<path d="${dot(-18, -69, 2.5)}" fill="#ff5d5d"/><path d="${dot(-10, -70, 2.5)}" fill="#ffd23f"/><path d="${dot(-2, -69, 2.5)}" fill="#5aa7e8"/>`;
      },
    },
    { id: 'pumpkintable', name: "Jack-o'-lantern table", price: 250,
      box: '-104 -156 208 164',
      draw: () => {
        let zz = 'M-92 -84 H92 V-52';
        for (let x = 92; x > -92; x -= 11.5) zz += `L${r1(x - 5.75)} -60L${r1(x - 11.5)} -52`;
        const face = 'M-50 -110 L-44 -120 L-38 -110 Z M-30 -110 L-24 -120 L-18 -110 Z M-54 -100 Q-34 -82 -14 -100 Q-34 -92 -54 -100 Z';
        return `<rect x="-82" y="-56" width="10" height="56" fill="#5b3a1e" ${ln(2)}/><rect x="72" y="-56" width="10" height="56" fill="#5b3a1e" ${ln(2)}/>` +
          `<path d="${zz}Z" fill="#6d3fa8" ${ln()}/>` +
          `<path d="${dot(-60, -70, 3)}${dot(-20, -67, 3)}${dot(20, -70, 3)}${dot(60, -67, 3)}" fill="#ff9a2e"/>` +
          `<ellipse cx="-34" cy="-108" rx="34" ry="25" fill="#ff9a2e" ${ln()}/>` +
          '<path d="M-54 -128 Q-64 -108 -54 -86 M-14 -128 Q-4 -108 -14 -86" fill="none" stroke="#e07a1c" stroke-width="3"/>' +
          `<path d="M-38 -131 Q-40 -144 -30 -146 L-26 -142 Q-32 -140 -30 -131 Z" fill="#6a9a3a" ${ln(2)}/>` +
          `<path d="${face}" fill="#5a3a10"/><path class="an-glow" d="${face}" fill="#ffd84a"/>` +
          tube('M54 -92 V-118', '#fff', 2) +
          `<circle cx="54" cy="-122" r="8" fill="#ff8fc8" ${ln(2)}/><path d="M54 -122 m-4 0 a4 4 0 1 1 4 4" fill="none" stroke="#fff" stroke-width="2"/>` +
          [[26, '#5ec8ff'], [40, '#ffe066'], [62, '#7be07b']].map(([x, c]) => `<path d="M${x - 9} -97 l-5 -4 v8 Z M${x + 9} -97 l5 -4 v8 Z" fill="${c}" ${ln(1.5)}/>` +
            `<ellipse cx="${x}" cy="-97" rx="9" ry="6" fill="${c}" ${ln(2)}/>`).join('') +
          `<path d="M14 -96 H74 Q70 -84 44 -84 Q18 -84 14 -96 Z" fill="#2f2b45" ${ln(2.5)}/>` +
          `<rect x="80" y="-108" width="8" height="24" rx="1" fill="#f3ead8" ${ln(2)}/>` + flame(84, -109, 0.7);
      },
    },
    { id: 'desk', name: 'Desk with books', price: 300,
      box: '-110 -166 220 174',
      draw: () => `<rect x="-104" y="-122" width="8" height="78" rx="3" fill="#e7a35e" ${ln(2)}/>` +
        `<rect x="-104" y="-54" width="38" height="9" rx="3" fill="#e7a35e" ${ln(2)}/>` +
        `<rect x="-102" y="-46" width="6" height="46" fill="#d9944f" ${ln(2)}/><rect x="-76" y="-46" width="6" height="46" fill="#d9944f" ${ln(2)}/>` +
        `<rect x="-60" y="-82" width="10" height="82" fill="#a8693a" ${ln(2)}/>` +
        `<rect x="44" y="-82" width="56" height="82" fill="#c98b52" ${ln()}/>` +
        `<rect x="50" y="-74" width="44" height="30" rx="3" fill="#d9a066" ${ln(2)}/><rect x="50" y="-38" width="44" height="30" rx="3" fill="#d9a066" ${ln(2)}/>` +
        `<path d="${dot(72, -59, 3)}${dot(72, -23, 3)}" fill="#ffd166" ${ln(1.5)}/>` +
        `<rect x="-66" y="-92" width="172" height="11" rx="3" fill="#b97843" ${ln()}/>` +
        '<path d="M-20 -92 L-6 -150 L24 -150 L38 -92 Z" fill="#fff6c2" opacity="0.35"/>' +
        `<ellipse cx="-30" cy="-93" rx="14" ry="4" fill="#5aa7e8" ${ln(2)}/>` +
        tube('M-30 -94 L-36 -132 L-8 -148', '#5aa7e8', 4) +
        `<path d="M-16 -156 L6 -164 L14 -140 Z" fill="#5aa7e8" ${ln(2)}/><circle cx="7" cy="-148" r="4" fill="#fff6a8" ${ln(1.5)}/>` +
        `<path d="M-4 -93 L36 -96 L40 -92 L0 -92 Z" fill="#fff" ${ln(1.5)}/>` +
        `<rect x="10" y="-108" width="15" height="16" rx="2" fill="#ffd166" ${ln(2)}/>` +
        `<path d="M13 -108 L11 -122 M18 -108 V-124 M22 -108 L25 -120" stroke="#ff5d5d" stroke-width="3" stroke-linecap="round"/>` +
        `<rect x="56" y="-101" width="44" height="9" rx="2" fill="#5aa7e8" ${ln(2)}/>` +
        `<rect x="60" y="-110" width="38" height="9" rx="2" fill="#ff6b81" ${ln(2)}/>` +
        `<rect x="58" y="-119" width="40" height="9" rx="2" fill="#6fcf6a" ${ln(2)}/>` +
        '<path d="M96 -99 V-94 M94 -108 V-103 M95 -117 V-112" stroke="#fff" stroke-width="2"/>' +
        `<rect x="66" y="-148" width="9" height="29" rx="2" fill="#b892ff" ${ln(2)}/><rect x="77" y="-144" width="9" height="25" rx="2" fill="#ffb562" ${ln(2)}/>`,
    },
    { id: 'crayfishtable', name: 'Crayfish party table', price: 400,
      draw: () => {
        // Smiling paper moon lanterns sway on a string; red crayfish on a big plate.
        const lan = (x, y, c, d) => flip(`an-sway ${d}`, `<path d="M${x} ${y} V${y + 8}" ${ln(1.5)}/>` +
          `<rect x="${x - 5}" y="${y + 6}" width="10" height="5" fill="${INK}"/>` +
          `<circle cx="${x}" cy="${y + 26}" r="16" fill="${c}" ${ln(2.5)}/>` +
          `<path d="M${x - 15} ${y + 21} Q${x} ${y + 17} ${x + 15} ${y + 21} M${x - 15} ${y + 31} Q${x} ${y + 35} ${x + 15} ${y + 31}" fill="none" stroke="#fff" stroke-opacity="0.6" stroke-width="2"/>` +
          `<path d="${dot(x - 5, y + 24, 1.8)}${dot(x + 5, y + 24, 1.8)}" fill="${INK}"/>` +
          `<path d="M${x - 5} ${y + 29} Q${x} ${y + 34} ${x + 5} ${y + 29}" fill="none" ${ln(1.8)}/>` +
          `<rect x="${x - 5}" y="${y + 41}" width="10" height="4" fill="${INK}"/>`);
        const cf = (x, y, s, r) => `<g transform="translate(${x} ${y}) scale(${s} 1) rotate(${r})" fill="#e0352b" ${ln(1.5)}>` +
          '<path d="M-16 -1 L-25 -7 L-25 6 Z"/><ellipse cx="-2" cy="0" rx="14" ry="5.5"/><path d="M-10 -5 V5 M-6 -5.5 V5.5" stroke="#b8241c"/>' +
          '<path d="M10 -2 L17 -7 M10 2 L17 7 M12 -1 Q22 -14 30 -12" fill="none"/><ellipse cx="20" cy="-8" rx="5" ry="3"/><ellipse cx="20" cy="8" rx="5" ry="3"/>' +
          `<circle cx="8" cy="-2" r="1.4" fill="${INK}" stroke="none"/></g>`;
        return `<path d="M-100 -196 Q0 -172 100 -196" fill="none" ${ln(2)}/><path d="${dot(-100, -196, 3)}${dot(100, -196, 3)}" fill="#e0524b" ${ln(1.5)}/>` +
          lan(-62, -189, '#ffb23f', '') + lan(0, -184, '#ff6b6b', 'an-d2') + lan(62, -189, '#ffe066', 'an-d1') +
          `<rect x="-84" y="-56" width="10" height="56" fill="#a8693a" ${ln(2)}/><rect x="74" y="-56" width="10" height="56" fill="#a8693a" ${ln(2)}/>` +
          `<rect x="-96" y="-86" width="192" height="32" rx="3" fill="#fff" ${ln()}/>` +
          '<path d="M-84 -86 V-54 M-60 -86 V-54 M-36 -86 V-54 M-12 -86 V-54 M12 -86 V-54 M36 -86 V-54 M60 -86 V-54 M84 -86 V-54 M-96 -76 H96 M-96 -64 H96" stroke="#5aa7e8" stroke-opacity="0.45" stroke-width="7"/>' +
          `<rect x="-96" y="-86" width="192" height="32" rx="3" fill="none" ${ln()}/>` +
          cf(-44, -94, 1, -6) + cf(-18, -93, -1, 4) + cf(4, -95, 1, 10) + cf(-24, -104, 1, -4) +
          `<path d="M-70 -90 Q-24 -82 22 -90 Q20 -84 -24 -82 Q-68 -84 -70 -90 Z" fill="#5aa7e8" ${ln(2)}/>` +
          '<path d="M26 -88 L34 -104 M30 -96 l7 -2 M32 -100 l-6 -3" stroke="#5c9a3a" stroke-width="2.5" stroke-linecap="round"/>' +
          `<path d="M52 -86 L64 -124 L76 -86 Z" fill="#ffd23f" ${ln(2)}/><path d="M56 -98 Q64 -94 72 -98 M60 -110 Q64 -108 68 -110" fill="none" stroke="#4f7fc9" stroke-width="3"/>` +
          `<circle cx="64" cy="-126" r="4.5" fill="#e0524b" ${ln(1.5)}/>`;
      },
    },
    { id: 'potiontable', name: 'Witch potion table', price: 500,
      box: '-106 -170 212 178',
      draw: () => {
        const bub = [[-72, -80, 5, ''], [-56, -84, 4, 'an-d2'], [-44, -80, 6, 'an-d1'], [-62, -78, 3, 'an-d3']];
        return tube('M-80 -3 L-36 -9 M-80 -9 L-36 -3', '#8a5a2e', 4) + flame(-58, -8, 1.3) +
          `<ellipse class="an-glow" cx="-58" cy="-92" rx="40" ry="24" fill="#9bff8a" fill-opacity="0.4"/>` +
          tube('M-48 -74 L-26 -124', '#8a5a2e', 4) +
          `<path d="M-84 -26 L-90 -4 M-32 -26 L-26 -4" ${ln(4)}/>` +
          `<path d="M-98 -72 Q-102 -18 -58 -18 Q-14 -18 -18 -72 Z" fill="#3a3550" ${ln()}/>` +
          '<path d="M-88 -58 Q-86 -36 -70 -28" fill="none" stroke="#5b5678" stroke-width="4" stroke-linecap="round"/>' +
          `<ellipse cx="-58" cy="-72" rx="42" ry="8" fill="#4a4566" ${ln()}/><ellipse cx="-58" cy="-72" rx="35" ry="5" fill="#7be07b"/>` +
          bub.map(([x, y, r, d]) => `<circle class="an-rise ${d}" cx="${x}" cy="${y}" r="${r}" fill="#b6f7a8" stroke="#3a8a3a" stroke-width="1.5"/>`).join('') +
          `<rect x="4" y="-70" width="9" height="70" fill="#6b4a2e" ${ln(2)}/><rect x="88" y="-70" width="9" height="70" fill="#6b4a2e" ${ln(2)}/>` +
          `<rect x="-2" y="-81" width="106" height="11" rx="3" fill="#8a6440" ${ln()}/>` +
          `<rect x="11" y="-120" width="10" height="12" fill="#d9c6ff" ${ln(2)}/><rect x="10" y="-126" width="12" height="6" rx="2" fill="#a8763f" ${ln(1.5)}/>` +
          `<circle cx="16" cy="-96" r="14" fill="#b46bff" ${ln(2.5)}/><path class="an-twinkle" d="${star(19, -98, 5)}" fill="#fff"/>` +
          `<rect x="38" y="-134" width="8" height="12" fill="#ffc2de" ${ln(2)}/><rect x="37" y="-139" width="10" height="5" rx="2" fill="#a8763f" ${ln(1.5)}/>` +
          `<rect x="34" y="-123" width="16" height="42" rx="5" fill="#ff7ab8" ${ln(2.5)}/><path d="${star(42, -102, 5)}" fill="#ffe066" ${ln(1.2)}/>` +
          `<path d="M56 -81 L58 -98 H70 L72 -81 Z" fill="#6fdc6a" ${ln(2)}/><rect x="60" y="-106" width="8" height="8" fill="#c4f5c0" ${ln(1.5)}/>` +
          `<path d="${heart(64, -90, 4)}" fill="#fff"/>` +
          `<rect x="76" y="-95" width="26" height="14" rx="2" fill="#8f2d56" ${ln(2)}/><path d="M78 -88 H100" stroke="#ffcf3f" stroke-width="2.5"/>` +
          `<rect x="85" y="-117" width="9" height="22" rx="1" fill="#f3ead8" ${ln(2)}/>` + flame(89.5, -118, 0.75);
      },
    },
    { id: 'adventtable', name: 'Advent candle table', price: 600,
      box: '-104 -178 208 186',
      draw: () => {
        const cs = [[-42, 46], [-14, 40], [14, 34], [42, 28]];
        let moss = 'M-62 -96';
        for (let x = -62; x < 62; x += 12.4) moss += `q6.2 -9 12.4 0`;
        return cs.map(([x, h], i) => `<circle class="an-glow an-d${i + 1}" cx="${x}" cy="${-112 - h}" r="15" fill="#ffe58a" fill-opacity="0.5"/>`).join('') +
          `<rect x="-82" y="-58" width="10" height="58" fill="#8a5a2e" ${ln(2)}/><rect x="72" y="-58" width="10" height="58" fill="#8a5a2e" ${ln(2)}/>` +
          `<rect x="-92" y="-86" width="184" height="30" rx="3" fill="#c7302f" ${ln()}/>` +
          `<path d="${[-66, -33, 0, 33, 66].map(x => heart(x, -71, 4.5)).join('')}" fill="#fff"/><path d="M-90 -62 H90" stroke="#fff" stroke-width="2.5" stroke-dasharray="5 4"/>` +
          cs.map(([x, h]) => `<rect x="${x - 6}" y="${-100 - h}" width="12" height="${h}" rx="2" fill="#fbf8f0" ${ln(2)}/>` +
            `<path d="M${x} ${-100 - h} v-3" ${ln(1.5)}/>` + flame(x, -102 - h, 0.9)).join('') +
          `<rect x="-62" y="-102" width="124" height="16" rx="6" fill="#8a5a2e" ${ln()}/>` +
          `<path d="${moss}Z" fill="#4f9a3c" ${ln(2)}/>` +
          `<path d="${dot(-50, -101, 2.6)}${dot(-27, -100, 2.6)}${dot(0, -101, 2.6)}${dot(28, -100, 2.6)}${dot(51, -101, 2.6)}" fill="#e0242f" ${ln(1)}/>` +
          // A tomte (Christmas gnome) and a straw goat (julbock).
          `<path d="M-95 -86 Q-80 -114 -65 -86 Z" fill="#8e95a3" ${ln(2)}/>` +
          `<path d="M-89 -100 Q-80 -82 -71 -100 Q-80 -104 -89 -100 Z" fill="#fff" ${ln(1.5)}/>` +
          `<path d="M-91 -100 L-80 -128 L-69 -100 Z" fill="#e0352b" ${ln(2)}/><circle cx="-80" cy="-100" r="3.5" fill="#ffb39a" ${ln(1.5)}/>` +
          tube('M70 -86 L72 -100 M76 -86 L76 -100 M84 -86 L84 -100 M90 -86 L88 -100', '#e8c35a', 3) +
          tube('M66 -108 L70 -102 H88 L92 -114 L99 -110', '#e8c35a', 7) + tube('M90 -117 Q84 -130 78 -120', '#e8c35a', 3) +
          '<path d="M74 -106 v8 M84 -106 v8 M89 -110 l5 3" stroke="#e0352b" stroke-width="3"/><circle cx="94" cy="-114" r="1.5" fill="#3b2f5c"/>';
      },
    },
    { id: 'gingertable', name: 'Gingerbread house table', price: 800,
      box: '-104 -184 208 192',
      draw: () => {
        const GB = '#c98140';
        const gm = x => tube(`M${x - 11} -104 H${x + 11} M${x} -106 V-96 L${x - 7} -88 M${x} -96 L${x + 7} -88`, GB, 6) +
          `<circle cx="${x}" cy="-112" r="7" fill="${GB}" ${ln(2)}/>` +
          `<path d="${dot(x - 2.5, -113, 1.2)}${dot(x + 2.5, -113, 1.2)}${dot(x, -102, 1.4)}${dot(x, -97, 1.4)}" fill="#fff"/>` +
          `<path d="M${x - 3} -109.5 Q${x} -107 ${x + 3} -109.5" fill="none" stroke="#fff" stroke-width="1.4"/>`;
        return `<rect x="-82" y="-60" width="10" height="60" fill="#8a5a2e" ${ln(2)}/><rect x="72" y="-60" width="10" height="60" fill="#8a5a2e" ${ln(2)}/>` +
          `<rect x="-92" y="-86" width="184" height="28" rx="3" fill="#fff" ${ln()}/>` +
          '<path d="M-90 -72 H90" stroke="#e0352b" stroke-width="4"/><path d="M-90 -65 H90" stroke="#3e9b57" stroke-width="3"/>' +
          `<circle class="an-rise" cx="2" cy="-168" r="5" fill="#eef1f6" stroke="#b9c3d3" stroke-width="1.5"/>` +
          `<circle class="an-rise an-d2" cx="5" cy="-170" r="4" fill="#eef1f6" stroke="#b9c3d3" stroke-width="1.5"/>` +
          `<rect x="-4" y="-162" width="12" height="24" fill="${GB}" ${ln(2)}/>` +
          `<rect x="-58" y="-126" width="64" height="42" fill="${GB}" ${ln()}/>` +
          `<path d="M-66 -124 L-26 -162 L14 -124 Z" fill="#a8693a" ${ln()}/>` +
          tube('M-68 -122 L-26 -164 L16 -122', '#fff', 4) +
          `<path d="${dot(-40, -138, 3)}${dot(-12, -138, 3)}${dot(-26, -150, 3)}" fill="#e0352b" ${ln(1)}/><path d="${dot(-26, -134, 3)}${dot(-50, -128, 2.5)}${dot(-2, -128, 2.5)}" fill="#4fcf6a" ${ln(1)}/>` +
          `<path d="M-34 -84 V-102 Q-26 -110 -18 -102 V-84 Z" fill="#ff8fb0" ${ln(2)}/><circle cx="-22" cy="-93" r="1.8" fill="${INK}"/>` +
          [-54, -8].map(x => `<rect x="${x}" y="-118" width="12" height="12" fill="#5a3a10" ${ln(2)}/>` +
            `<rect class="an-glow" x="${x}" y="-118" width="12" height="12" fill="#ffd84a"/>` +
            `<path d="M${x + 6} -118 v12 M${x} -112 h12" stroke="#fff" stroke-width="2"/><rect x="${x}" y="-118" width="12" height="12" fill="none" ${ln(2)}/>`).join('') +
          '<path d="M-58 -84 q4 -5 8 0 q4 -5 8 0 q4 -5 8 0 q4 -5 8 0 q4 -5 8 0 q4 -5 8 0 q4 -5 8 0 q4 -5 8 0" fill="none" stroke="#fff" stroke-width="2.5"/>' +
          tube('M-80 -86 V-118 Q-80 -127 -72 -127 Q-65 -127 -65 -120', '#fff', 4) +
          '<path d="M-80 -86 V-118 Q-80 -127 -72 -127 Q-65 -127 -65 -120" fill="none" stroke="#e0352b" stroke-width="4" stroke-dasharray="4 4"/>' +
          `<ellipse cx="54" cy="-86" rx="32" ry="4" fill="#fff" ${ln(2)}/>` + gm(40) + gm(68);
      },
    },
    { id: 'aquariumtable', name: 'Aquarium table', price: 1000,
      draw: () => {
        const fish = (x, y, c, dir, d) => `<g class="an-swim ${d}"><path d="M${x - 11 * dir} ${y} L${x - 21 * dir} ${y - 8} L${x - 21 * dir} ${y + 8} Z" fill="${c}" ${ln(2)}/>` +
          `<ellipse cx="${x}" cy="${y}" rx="13" ry="9" fill="${c}" ${ln(2)}/><path d="M${x - 2 * dir} ${y - 8} V${y + 8}" stroke="#fff" stroke-width="3"/>` +
          `<circle cx="${x + 6 * dir}" cy="${y - 2}" r="2" fill="${INK}"/></g>`;
        let surf = 'M-90 -170';
        for (let x = -90; x < 90; x += 22.5) surf += 'q5.6 -4 11.2 0 q5.6 4 11.2 0';
        return `<rect x="-90" y="-74" width="180" height="66" fill="#4a6fa5" ${ln()}/>` +
          `<rect x="-82" y="-66" width="76" height="50" rx="3" fill="#5b82ba" ${ln(2)}/><rect x="6" y="-66" width="76" height="50" rx="3" fill="#5b82ba" ${ln(2)}/>` +
          `<path d="${dot(-12, -41, 3)}${dot(12, -41, 3)}" fill="#ffcf3f" ${ln(1.5)}/>` +
          `<rect x="-86" y="-9" width="14" height="9" fill="#2f4a75" ${ln(2)}/><rect x="72" y="-9" width="14" height="9" fill="#2f4a75" ${ln(2)}/>` +
          `<rect x="-94" y="-186" width="188" height="112" rx="4" fill="#d6f2fd" ${ln(3)}/>` +
          '<rect x="-90" y="-170" width="180" height="94" fill="#5ec0f0"/>' +
          `<path d="${surf}" fill="none" stroke="#a9e3fb" stroke-width="3"/>` +
          `<path d="M-90 -86 Q-60 -98 -20 -90 Q20 -82 60 -94 Q80 -98 90 -90 V-76 H-90 Z" fill="#f2d38b"/>` +
          `<g class="an-sway">${tube('M60 -88 Q52 -106 62 -122 Q70 -136 62 -150', '#3e9b57', 3)}</g>` +
          `<g class="an-sway an-d2">${tube('M76 -90 Q84 -104 76 -118', '#4fcf6a', 3)}</g>` +
          `<rect x="-78" y="-118" width="28" height="30" fill="#b6c0cd" ${ln(2)}/>` +
          `<path d="M-78 -118 v-7 h6 v4 h4 v-4 h8 v4 h4 v-4 h6 v7" fill="#b6c0cd" ${ln(2)}/><path d="M-69 -88 v-12 q5 -6 10 0 v12 Z" fill="#3c3756"/>` +
          `<path d="${dot(-30, -88, 6)}${dot(-18, -86, 4)}${dot(30, -90, 5)}" fill="#8e95a3" ${ln(1.5)}/>` +
          [[-62, -128, 4, ''], [-56, -134, 3, 'an-d2'], [20, -120, 3.5, 'an-d1'], [24, -128, 2.5, 'an-d3']]
            .map(([x, y, r, d]) => `<circle class="an-rise ${d}" cx="${x}" cy="${y}" r="${r}" fill="#dff6ff" stroke="#fff" stroke-width="1.5"/>`).join('') +
          fish(-14, -142, '#ff9a2e', 1, '') + fish(32, -106, '#ffe066', -1, 'an-d2') +
          '<path d="M-84 -160 L-72 -170 M-84 -146 L-60 -168" stroke="#fff" stroke-opacity="0.6" stroke-width="3" stroke-linecap="round"/>' +
          `<rect x="-94" y="-186" width="188" height="112" rx="4" fill="none" ${ln(3)}/>` +
          `<rect x="-98" y="-194" width="196" height="10" rx="3" fill="#3c3756" ${ln()}/>`;
      },
    },
    { id: 'gamingdesk', name: 'Gaming desk', price: 1500,
      draw: () => {
        const rgb = ['#ff4f7b', '#ffa62b', '#ffe066', '#6fdc6a', '#4ee6ff', '#6b8bff', '#b46bff', '#ff6bd8'];
        return '<rect class="an-pulse" x="-50" y="-210" width="150" height="104" rx="20" fill="#62e8ff" opacity="0.28"/>' +
          `<path d="M-100 -6 L-74 -14 M-87 -10 L-87 -4" ${ln(3)}/><circle cx="-100" cy="-5" r="5" fill="${INK}"/><circle cx="-74" cy="-5" r="5" fill="${INK}"/>` +
          `<rect x="-90" y="-50" width="7" height="38" fill="#3c3756" ${ln(2)}/>` +
          `<path d="M-108 -150 Q-108 -160 -98 -160 Q-88 -160 -88 -150 L-86 -60 L-108 -60 Z" fill="#ff4d6d" ${ln()}/>` +
          '<path d="M-98 -156 V-64" stroke="#2f2b45" stroke-width="6"/>' +
          `<rect x="-108" y="-62" width="42" height="12" rx="5" fill="#ff4d6d" ${ln()}/>` +
          `<rect x="-62" y="-84" width="10" height="84" fill="#3c3756" ${ln(2)}/><rect x="88" y="-84" width="10" height="84" fill="#3c3756" ${ln(2)}/>` +
          rgb.map((cl, i) => `<rect x="${-68 + i * 21.5}" y="-82" width="21.5" height="5" fill="${cl}"/>`).join('') +
          `<rect x="-70" y="-94" width="172" height="12" rx="3" fill="#2f2b45" ${ln()}/>` +
          `<rect x="18" y="-120" width="14" height="26" fill="#3c3756" ${ln(2)}/><ellipse cx="25" cy="-95" rx="22" ry="4" fill="#3c3756" ${ln(2)}/>` +
          `<rect x="-38" y="-200" width="126" height="84" rx="7" fill="#2f2b45" ${ln()}/>` +
          '<rect x="-31" y="-193" width="112" height="70" rx="3" fill="#1d2a6b"/>' +
          '<path d="M-31 -139 Q0 -150 30 -139 Q56 -146 81 -139 V-123 H-31 Z" fill="#3ccf6e"/>' +
          `<rect x="30" y="-162" width="32" height="7" rx="2" fill="#ffb84d"/>` +
          `<path d="${dot(36, -172, 3.5)}${dot(46, -172, 3.5)}${dot(56, -172, 3.5)}" fill="#ffe066"/>` +
          '<rect x="-12" y="-156" width="14" height="14" rx="3" fill="#ff5d8f"/><path d="M-7 -152v4M-2 -152v4" stroke="#fff" stroke-width="2"/>' +
          `<path d="${star(-20, -178, 6)}" fill="#ffe066"/>` + cloud(4, -180, 0.6) +
          `<rect x="-26" y="-101" width="80" height="8" rx="2" fill="#3c3756" ${ln(2)}/>` +
          rgb.slice(0, 7).map((cl, i) => `<rect x="${-22 + i * 10.5}" y="-99" width="7" height="3.5" rx="1" fill="${cl}"/>`).join('') +
          `<ellipse cx="72" cy="-97" rx="8" ry="4.5" fill="#3c3756" ${ln(2)}/><circle cx="72" cy="-99" r="1.8" fill="#4ee6ff"/>` +
          `<path d="M78 -186 Q92 -206 106 -186" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>` +
          `<rect x="72" y="-188" width="12" height="18" rx="5" fill="#ff4d6d" ${ln(2)}/><rect x="100" y="-188" width="10" height="18" rx="5" fill="#ff4d6d" ${ln(2)}/>`;
      },
    },
    { id: 'djtable', name: 'DJ table', price: 2000,
      draw: () => {
        const rgb = ['#ff4f7b', '#ffa62b', '#ffe066', '#6fdc6a', '#4ee6ff', '#6b8bff', '#b46bff'];
        const sp = x => `<rect x="${x}" y="-122" width="34" height="122" rx="4" fill="#2f2b45" ${ln()}/>` +
          `<circle cx="${x + 17}" cy="-36" r="13" fill="#4a4566" ${ln(2)}/><circle class="an-pulse" cx="${x + 17}" cy="-36" r="7" fill="#1d1a2e" stroke="#6b8bff" stroke-width="2"/>` +
          `<circle cx="${x + 17}" cy="-90" r="8" fill="#4a4566" ${ln(2)}/><circle class="an-pulse an-d2" cx="${x + 17}" cy="-90" r="3.5" fill="#1d1a2e" stroke="#6b8bff" stroke-width="1.5"/>` +
          `<circle class="an-blink" cx="${x + 17}" cy="-112" r="3" fill="#4ee6ff"/>`;
        const rec = (x, c) => `<g class="an-spin"><circle cx="${x}" cy="-111" r="14" fill="#1d1a2e" ${ln(2)}/>` +
          `<circle cx="${x}" cy="-111" r="9" fill="none" stroke="#4a4566" stroke-width="1.5"/><circle cx="${x}" cy="-111" r="5" fill="${c}"/>` +
          `<circle cx="${x + 3}" cy="-111" r="1.4" fill="#fff"/><path d="M${x - 11} -116 Q${x - 7} -122 ${x - 2} -123" fill="none" stroke="#fff" stroke-opacity="0.5" stroke-width="2"/></g>`;
        const note = (x, y, c, d) => `<g class="an-rise ${d}"><path d="M${x} ${y} V${y - 14} l7 4" fill="none" stroke="${c}" stroke-width="2.5" stroke-linecap="round"/>` +
          `<ellipse cx="${x - 3}" cy="${y}" rx="4" ry="3" fill="${c}"/></g>`;
        return sp(-104) + sp(70) + tube('M-48 -66 L-34 -2 M48 -66 L34 -2 M-41 -32 H41', '#4a4566', 4) +
          `<path d="M-58 -128 H58 L64 -96 H-64 Z" fill="#4a4566" ${ln()}/>` +
          rec(-34, '#ff4f7b') + rec(34, '#ffe066') +
          `<path d="M-18 -126 L-26 -112 M50 -126 L42 -112" fill="none" stroke="#cfd5e6" stroke-width="2.5" stroke-linecap="round"/>` +
          `<rect x="-12" y="-124" width="24" height="24" rx="3" fill="#2f2b45" ${ln(2)}/>` +
          '<path d="M-5 -120 V-104 M5 -120 V-104" stroke="#8e95a3" stroke-width="2"/>' +
          '<rect x="-8" y="-114" width="6" height="4" rx="1" fill="#4ee6ff"/><rect x="2" y="-108" width="6" height="4" rx="1" fill="#ff6bd8"/>' +
          `<rect x="-64" y="-96" width="128" height="30" rx="4" fill="#2f2b45" ${ln()}/>` +
          rgb.map((c, i) => `<rect class="an-blink an-d${(i % 4) + 1}" x="${-52 + i * 15}" y="-84" width="10" height="6" rx="2" fill="${c}"/>`).join('') +
          note(-46, -140, '#ff6bd8', '') + note(30, -150, '#4ee6ff', 'an-d2') + note(-6, -162, '#ffe066', 'an-d4');
      },
    },
    { id: 'crystaltable', name: 'Crystal table with a magic orb', gems: 20,
      draw: () => {
        const C = '#bff3ff', Cd = '#8fe3f7';
        const pr = (x, h, w, c) => `<path d="M${x - w} -92 V${-92 - h} L${x} ${-92 - h - w} L${x + w} ${-92 - h} V-92 Z" fill="${c}" ${ln(2)}/>` +
          `<path d="M${x} -92 V${-92 - h}" stroke="#fff" stroke-opacity="0.6" stroke-width="1.5"/>`;
        return `<circle class="an-glow" cx="0" cy="-134" r="46" fill="#d9b8ff" fill-opacity="0.55"/>` +
          `<path d="M-72 -78 L-64 0 H-50 L-42 -78 Z M42 -78 L50 0 H64 L72 -78 Z" fill="${Cd}" ${ln()}/>` +
          '<path d="M-57 -78 L-57 0 M57 -78 L57 0" stroke="#fff" stroke-opacity="0.6" stroke-width="2"/>' +
          `<path d="M-100 -80 L-90 -94 H90 L100 -80 L90 -70 H-90 Z" fill="${C}" ${ln()}/>` +
          '<path d="M-90 -94 L-80 -80 L-90 -70 M90 -94 L80 -80 L90 -70 M-80 -80 H80" fill="none" stroke="#7fd3ea" stroke-width="2"/>' +
          pr(-84, 12, 5, '#ff9ecb') + pr(-72, 22, 6, '#b98cff') + pr(-61, 9, 4, '#5ec8ff') +
          pr(62, 10, 4, '#7be07b') + pr(73, 20, 6, '#5ec8ff') + pr(84, 12, 5, '#ff9ecb') +
          `<path d="M-18 -93 Q-20 -104 -12 -110 H12 Q20 -104 18 -93 Z" fill="#f2bd34" ${ln()}/>` +
          `<circle cx="0" cy="-134" r="26" fill="#9b6bff" ${ln(3)}/>` +
          '<g class="an-spin"><path d="M-16 -134 A16 16 0 0 1 0 -150 M16 -134 A16 16 0 0 1 0 -118" fill="none" stroke="#e9d8ff" stroke-width="4" stroke-linecap="round"/></g>' +
          '<path class="an-twinkle" d="M6 -140 l1.5 3.5 l3.5 1.5 l-3.5 1.5 l-1.5 3.5 l-1.5 -3.5 l-3.5 -1.5 l3.5 -1.5 Z" fill="#fff"/>' +
          '<ellipse cx="-9" cy="-146" rx="6" ry="4" fill="#fff" opacity="0.8"/>' +
          tube('M-12 -110 Q-24 -116 -20 -128 M12 -110 Q24 -116 20 -128', '#f2bd34', 3) + gem(0, -102, 5, '#ff4f7b') +
          sparkle(-50, -164, 9) + sparkle(54, -154, 8) + sparkle(0, -190, 7) + sparkle(-90, -120, 6);
      },
    },
    { id: 'feasttable', name: 'Golden feast table', gems: 30,
      draw: () => {
        const G = '#f2bd34', Gd = '#d99a1c';
        let fr = '';
        for (let x = -92; x <= 92; x += 8) { const y = r1(-60 + 6 * (1 - (x / 98) ** 2)); fr += `M${x} ${y}v6`; }
        const cnd = (x, top) => `<rect x="${x - 3.5}" y="${top}" width="7" height="18" rx="1" fill="#fbf8f0" ${ln(1.5)}/>` + flame(x, top - 1, 0.7);
        return `<rect x="-88" y="-70" width="12" height="64" rx="4" fill="${G}" ${ln(2)}/><rect x="76" y="-70" width="12" height="64" rx="4" fill="${G}" ${ln(2)}/>` +
          `<path d="${dot(-82, -6, 6)}${dot(82, -6, 6)}" fill="${Gd}" ${ln(2)}/>` +
          `<path d="M-98 -88 H98 V-60 Q0 -48 -98 -60 Z" fill="#b8243f" ${ln()}/>` +
          `<path d="${fr}" stroke="${G}" stroke-width="2.5" stroke-linecap="round"/>` +
          gem(-50, -70, 6, '#7be07b') + gem(0, -70, 7, '#5ec8ff') + gem(50, -70, 6, '#ff4f7b') +
          `<rect x="-100" y="-94" width="200" height="8" rx="3" fill="${G}" ${ln(2)}/>` +
          tube('M-26 -114 Q-26 -106 0 -106 Q26 -106 26 -114', G, 4) +
          `<rect x="-3" y="-134" width="6" height="40" fill="${G}" ${ln(2)}/><ellipse cx="0" cy="-95" rx="12" ry="4" fill="${G}" ${ln(2)}/>` +
          `<rect x="-31" y="-118" width="10" height="5" rx="2" fill="${G}" ${ln(1.5)}/><rect x="21" y="-118" width="10" height="5" rx="2" fill="${G}" ${ln(1.5)}/>` +
          `<rect x="-5" y="-138" width="10" height="5" rx="2" fill="${G}" ${ln(1.5)}/>` +
          cnd(-26, -136) + cnd(26, -136) + cnd(0, -156) +
          `<ellipse cx="-66" cy="-95" rx="30" ry="5" fill="${G}" ${ln(2)}/>` +
          `<ellipse cx="-89" cy="-106" rx="8" ry="6" fill="#c97a2a" ${ln(2)}/><ellipse cx="-43" cy="-106" rx="8" ry="6" fill="#c97a2a" ${ln(2)}/>` +
          `<path d="${dot(-96, -110, 3)}${dot(-36, -110, 3)}" fill="#fff" ${ln(1.5)}/>` +
          `<path d="M-88 -96 Q-90 -122 -66 -122 Q-42 -122 -44 -96 Z" fill="#d98a3a" ${ln()}/>` +
          '<path d="M-76 -114 Q-68 -118 -60 -116" fill="none" stroke="#f2b56b" stroke-width="3" stroke-linecap="round"/>' +
          `<ellipse cx="59" cy="-95" rx="28" ry="4" fill="${G}" ${ln(2)}/>` +
          `<rect x="36" y="-114" width="46" height="20" rx="4" fill="#ffb6d0" ${ln(2)}/>` +
          `<rect x="42" y="-130" width="34" height="16" rx="4" fill="#fff" ${ln(2)}/>` +
          `<rect x="48" y="-144" width="22" height="14" rx="4" fill="#ffb6d0" ${ln(2)}/>` +
          `<path d="${dot(44, -104, 2)}${dot(59, -104, 2)}${dot(74, -104, 2)}${dot(52, -122, 2)}${dot(66, -122, 2)}" fill="${G}"/>` +
          `<circle cx="59" cy="-149" r="5" fill="#e0352b" ${ln(1.5)}/>` +
          `<path d="M86 -126 H98 Q98 -112 92 -110 Q86 -112 86 -126 Z" fill="${G}" ${ln(2)}/><rect x="90.5" y="-110" width="3" height="12" fill="${G}"/>` +
          `<ellipse cx="92" cy="-97" rx="6" ry="2.5" fill="${G}" ${ln(1.5)}/>` +
          sparkle(-80, -142, 8) + sparkle(84, -150, 8) + sparkle(-36, -172, 6) + sparkle(32, -176, 6);
      },
    },
    { id: 'robottable', name: 'Robot workshop', gems: 50,
      draw: () => {
        let holes = '';
        for (let y = -190; y < -110; y += 12) holes += `M34 ${y}H100`;
        return `<rect x="24" y="-200" width="80" height="92" rx="4" fill="#e9d9b8" ${ln()}/>` +
          `<path d="${holes}" stroke="#c9b58f" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="0 12"/>` +
          tube('M40 -190 L50 -160', '#9aa5b5', 4) + `<path d="M34 -196 a8 8 0 1 0 12 0 l-2 6 h-8 Z" fill="#9aa5b5" ${ln(2)}/>` +
          tube('M90 -194 V-166', '#a8693a', 3) + `<rect x="82" y="-198" width="16" height="9" rx="2" fill="#8e95a3" ${ln(2)}/>` +
          `<path class="an-spin" d="${gearD(60, -136, 15, 10)}" fill="#f2bd34" fill-rule="evenodd" ${ln(2)}/>` +
          `<path d="${gearD(86, -116, 8, 6)}" fill="#cfd5e6" fill-rule="evenodd" ${ln(2)}>` +
          '<animateTransform attributeName="transform" type="rotate" values="0 86 -116;-360 86 -116" dur="3.6s" repeatCount="indefinite"/></path>' +
          `<rect x="-92" y="-70" width="12" height="70" fill="#8a5a2e" ${ln(2)}/><rect x="80" y="-70" width="12" height="70" fill="#8a5a2e" ${ln(2)}/>` +
          `<rect x="-92" y="-26" width="184" height="7" fill="#8a5a2e" ${ln(2)}/>` +
          `<rect x="30" y="-48" width="44" height="22" rx="3" fill="#e0524b" ${ln(2)}/><path d="M42 -48 v-5 h20 v5" fill="none" ${ln(2)}/><path d="M30 -40 H74" stroke="#b8241c" stroke-width="2"/>` +
          `<rect x="-100" y="-82" width="200" height="13" rx="3" fill="#c98b52" ${ln()}/><path d="M-98 -75 H98" stroke="#f2bd34" stroke-width="2"/>` +
          tube('M0 -88 H24', '#9aa5b5', 2) + `<rect x="-14" y="-91" width="16" height="7" rx="3" fill="#ffd23f" ${ln(1.5)}/>` +
          // A cute robot, almost done: it blinks, waves and its antenna glows.
          `<rect x="-52" y="-98" width="8" height="16" fill="#9aa5b5" ${ln(2)}/><rect x="-36" y="-98" width="8" height="16" fill="#9aa5b5" ${ln(2)}/>` +
          tube('M-60 -120 Q-72 -110 -70 -98', '#9aa5b5', 4) +
          `<g>${loop('-25 -21 -122', '15 -21 -122', 1.6, 'rotate')}${tube('M-21 -122 Q-8 -130 -6 -146', '#9aa5b5', 4)}` +
          `<circle cx="-6" cy="-150" r="5" fill="#cfd5e6" ${ln(2)}/></g>` +
          `<rect x="-60" y="-130" width="40" height="34" rx="8" fill="#cfd5e6" ${ln()}/>` +
          `<rect x="-52" y="-124" width="24" height="16" rx="3" fill="#f2bd34" ${ln(2)}/>` +
          ['#ff4f7b', '#7be07b', '#4ee6ff'].map((c, i) => `<circle class="an-blink an-d${i + 1}" cx="${-46 + i * 6}" cy="-116" r="2.2" fill="${c}"/>`).join('') +
          `<circle class="an-glow" cx="-40" cy="-186" r="10" fill="#ff4f7b" fill-opacity="0.35"/><path d="M-40 -170 V-182" ${ln(2.5)}/>` +
          `<circle cx="-40" cy="-186" r="5" fill="#ff4f7b" ${ln(2)}/>` +
          `<path d="${dot(-64, -153, 4)}${dot(-16, -153, 4)}" fill="#f2bd34" ${ln(2)}/>` +
          `<rect x="-62" y="-170" width="44" height="34" rx="9" fill="#cfd5e6" ${ln()}/>` +
          '<rect x="-56" y="-164" width="32" height="22" rx="5" fill="#1d2a6b"/>' +
          [-47, -33].map(x => `<ellipse cx="${x}" cy="-155" rx="3.5" ry="4" fill="#4ee6ff">` +
            '<animate attributeName="ry" values="4;4;0.6;4" keyTimes="0;0.9;0.95;1" dur="3.2s" repeatCount="indefinite"/></ellipse>').join('') +
          '<path d="M-46 -148 Q-40 -144 -34 -148" fill="none" stroke="#4ee6ff" stroke-width="2" stroke-linecap="round"/>' +
          sparkle(-8, -120, 7) + sparkle(-84, -150, 7) + sparkle(14, -176, 6);
      },
    },
  ]);
})();
