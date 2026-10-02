// Toys (bottom centre on the floor in front; x -42..42).
// Cheap to elite; each entry is the catalog item (ITEMS) and its drawing (ROOM_ART), added by addItems.

(() => {
  const { r1, dot, star, sparkle, flame, gem } = ROOM_KIT;
  const shadow = rx => `<ellipse cx="0" cy="0" rx="${rx}" ry="4" fill="#000" opacity="0.15"/>`;
  const circ = (x, y, r, fill, w = 2) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${ln(w)}/>`;
  // A tiny three-petal painted flower (Dala horse).
  const posy = (x, y, fill = '#fff') => `<path d="${dot(x - 2.6, y, 2.4)}${dot(x + 2.6, y, 2.4)}${dot(x, y - 3, 2.4)}" fill="${fill}"/>` +
    `<circle cx="${x}" cy="${y - 1}" r="1.5" fill="#ffd23f"/>`;
  // A music note (an eighth note) at (x, y).
  const note = (x, y, cls) => `<g class="an-rise ${cls}"><path d="${dot(x, y, 4)}" fill="#9b6bff" ${ln(1.5)}/>` +
    `<path d="M${x + 4} ${y} V${y - 14} Q${x + 10} ${y - 10} ${x + 10} ${y - 6}" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/></g>`;
  // A little carousel horse facing right, centred at (x, y).
  const pony = (x, y, fill, mane) => `<path d="M${x - 7} ${y + 3} L${x - 10} ${y + 12} M${x + 7} ${y + 3} L${x + 9} ${y + 12}" ${ln(2.5)}/>` +
    `<ellipse cx="${x}" cy="${y}" rx="11" ry="6" fill="${fill}" ${ln(2)}/>` +
    `<path d="M${x + 6} ${y - 3} L${x + 11} ${y - 14} L${x + 16} ${y - 12} L${x + 12} ${y - 1} Z" fill="${fill}" ${ln(2)}/>` +
    `<ellipse cx="${x + 15}" cy="${y - 14}" rx="6" ry="4" fill="${fill}" ${ln(2)}/>` +
    `<path d="M${x + 10} ${y - 16} Q${x + 6} ${y - 8} ${x + 6} ${y - 3} M${x - 11} ${y - 1} Q${x - 17} ${y + 2} ${x - 15} ${y + 8}" fill="none" stroke="${mane}" stroke-width="3" stroke-linecap="round"/>` +
    `<rect x="${x - 4}" y="${y - 7}" width="8" height="5" rx="1.5" fill="#ffcf3f" ${ln(1.5)}/>` + `<circle cx="${x + 16}" cy="${y - 15}" r="1.2" fill="${INK}"/>`;

  addItems('toy', ROOM_ART, [
    { id: 'woodenblocks', name: 'Wooden blocks', price: 15,
      draw: () => {
        const block = (x, y, c, mark) => `<rect x="${x}" y="${y}" width="28" height="28" rx="3" fill="#e8b877" ${ln(2.5)}/>` +
          `<rect x="${x + 5}" y="${y + 5}" width="18" height="18" rx="2" fill="none" stroke="${c}" stroke-width="2.5"/>` + mark(x + 14, y + 14, c);
        const o = (x, y, c) => `<circle cx="${x}" cy="${y}" r="4.5" fill="${c}"/>`;
        const t = (x, y, c) => `<path d="M${x} ${y - 5} L${x + 5} ${y + 4} H${x - 5} Z" fill="${c}"/>`;
        const s = (x, y, c) => `<path d="${star(x, y, 6)}" fill="${c}"/>`;
        return shadow(34) + block(-31, -28, '#e8434b', o) + block(3, -28, '#4f8cff', t) +
          `<g transform="rotate(-8 -1 -42)">${block(-15, -56, '#3fae55', s)}</g>`;
      },
    },
    { id: 'ball', name: 'Ball', price: 20,
      box: '-40 -64 80 70',
      draw: () => '<ellipse cx="0" cy="0" rx="22" ry="4" fill="#000" opacity="0.15"/>' +
        `<circle cx="0" cy="-24" r="24" fill="#ff5d6c" ${ln()}/>` +
        '<path d="M-14 -43.5 Q-2 -24 -14 -4.5 L-4 -0.3 Q8 -24 -4 -47.7 Z" fill="#fff"/>' +
        '<path d="M8 -46.6 Q22 -24 8 -1.4 L17 -7 Q28 -24 17 -41 Z" fill="#5aa7e8"/>' +
        `<circle cx="0" cy="-24" r="24" fill="none" ${ln()}/><ellipse cx="-12" cy="-36" rx="5" ry="3.5" fill="#fff" opacity="0.8"/>`,
    },
    { id: 'sockpuppet', name: 'Sock puppet', price: 30,
      box: '-44 -96 88 102',
      draw: () => shadow(24) +
        `<path d="M-20 0 V-52 Q-20 -80 6 -80 Q32 -80 34 -58 Q36 -42 18 -40 H12 V0 Z" fill="#8fb3e0" ${ln()}/>` +
        '<path d="M-20 -6 H12 M-20 -14 H12" stroke="#e8434b" stroke-width="4"/>' +
        `<path d="M-20 0 V-20 H12 V0 Z" fill="none" ${ln()}/>` +
        `<path d="M34 -56 Q22 -54 14 -48 Q24 -40 34 -46 Z" fill="#c7303a" ${ln(2)}/><path d="M22 -48 Q28 -44 32 -48" fill="none" stroke="#ff8fa8" stroke-width="3" stroke-linecap="round"/>` +
        circ(-4, -62, 5.5, '#33324a') + '<path d="M-6 -62h1M-2 -62h1" stroke="#fff" stroke-width="1.5"/>' + circ(12, -66, 4.5, '#ffd23f') +
        tube('M-8 -79 q-6 -10 2 -12 q4 6 -2 12 M0 -80 q2 -12 10 -8 q-2 6 -10 8', '#ff9a2e', 2.5),
    },
    { id: 'spinningtop', name: 'Spinning top', price: 40,
      draw: () => shadow(20) +
        '<path d="M-42 -40 q-5 10 0 20 M42 -40 q5 10 0 20 M-36 -52 q-4 6 0 12" fill="none" stroke="#b9b0d0" stroke-width="2.5" stroke-linecap="round"/>' +
        '<g class="an-sway">' +
        `<rect x="-4" y="-80" width="8" height="20" rx="3" fill="#c98b52" ${ln(2)}/>` +
        `<path d="M-28 -42 Q-24 -62 0 -64 Q24 -62 28 -42 Z" fill="#4f8cff" ${ln(2.5)}/>` +
        `<path d="${dot(-12, -52, 2.5)}${dot(0, -56, 2.5)}${dot(12, -52, 2.5)}" fill="#fff"/>` +
        `<path d="M0 0 L-30 -36 Q0 -28 30 -36 Z" fill="#ff5d6c" ${ln(2.5)}/>` +
        `<ellipse cx="0" cy="-39" rx="32" ry="6" fill="#ffd23f" ${ln(2.5)}/></g>`,
    },
    { id: 'rubberduck', name: 'Rubber duck in a tub', price: 50,
      draw: () => shadow(34) +
        '<g class="an-bob">' +
        `<path d="M-22 -38 Q-28 -44 -26 -52 Q-18 -46 -14 -44 Z" fill="#ffd23f" ${ln(2)}/>` +
        `<ellipse cx="-2" cy="-36" rx="21" ry="13" fill="#ffd23f" ${ln()}/>` +
        `<circle cx="10" cy="-58" r="12" fill="#ffd23f" ${ln()}/>` +
        `<path d="M20 -60 Q30 -60 30 -55 Q26 -51 20 -53 Z" fill="#ff9a2e" ${ln(2)}/>` +
        `<circle cx="13" cy="-61" r="2.2" fill="${INK}"/><path d="M-10 -40 Q0 -34 6 -42" fill="none" stroke="#f0a81c" stroke-width="3" stroke-linecap="round"/></g>` +
        `<path d="M-34 -30 H34 L28 0 H-28 Z" fill="#b8c4d6" ${ln()}/>` +
        `<rect x="-38" y="-34" width="76" height="7" rx="3" fill="#d5dde9" ${ln(2.5)}/>` +
        `<path d="${dot(-30, -36, 4)}${dot(-22, -38, 5)}${dot(26, -37, 4.5)}" fill="#fff" ${ln(1.5)}/>` +
        `<circle class="an-rise" cx="-24" cy="-44" r="3" fill="#e6f6ff" ${ln(1.2)}/><circle class="an-rise an-d2" cx="28" cy="-46" r="2.5" fill="#e6f6ff" ${ln(1.2)}/>`,
    },
    { id: 'jackinthebox', name: 'Jack-in-the-box', price: 80,
      draw: () => shadow(32) +
        `<g transform="rotate(-112 -26 -40)"><rect x="-26" y="-43" width="52" height="6" rx="2" fill="#ff5d6c" ${ln(2.5)}/></g>` +
        '<g class="an-jump">' +
        '<path d="M0 -40 L-8 -45 L8 -50 L-8 -55 L8 -60 L0 -64" fill="none" stroke="#7d8db0" stroke-width="3" stroke-linejoin="round"/>' +
        `<path d="M-14 -66 Q-7 -72 0 -66 Q7 -72 14 -66 Q7 -60 0 -64 Q-7 -60 -14 -66 Z" fill="#fff" ${ln(2)}/>` +
        `<circle cx="0" cy="-79" r="13" fill="#fff1dc" ${ln(2.5)}/>` +
        `<path d="M-13 -84 Q-18 -100 -24 -96 Q-12 -96 0 -90 Z" fill="#9b6bff" ${ln(2)}/><path d="M13 -84 Q18 -100 24 -96 Q12 -96 0 -90 Z" fill="#ffd23f" ${ln(2)}/>` +
        `<path d="M-13 -86 Q0 -94 13 -86" fill="none" ${ln(2)}/>` +
        `<path d="${dot(-24, -96, 3)}${dot(24, -96, 3)}" fill="#ffcf3f" ${ln(1.5)}/>` +
        `<circle cx="0" cy="-77" r="3.5" fill="#ff4f5e"/><path d="${dot(-5, -82, 1.8)}${dot(5, -82, 1.8)}" fill="${INK}"/>` +
        `<path d="M-6 -72 Q0 -68 6 -72" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/></g>` +
        `<rect x="-26" y="-40" width="52" height="40" rx="3" fill="#5aa7e8" ${ln()}/>` +
        `<path d="M-13 -30 L-7 -20 L-13 -10 L-19 -20 Z M13 -30 L19 -20 L13 -10 L7 -20 Z" fill="#ffd23f" ${ln(1.5)}/>` +
        `<path d="${dot(0, -20, 4)}" fill="#ff5d6c" ${ln(1.5)}/>` +
        tube('M26 -22 H33 V-30', '#c7cfdc', 3) + circ(33, -32, 3.5, '#ff5d6c', 1.5),
    },
    { id: 'teddy', name: 'Teddy bear', price: 90,
      box: '-40 -100 80 106',
      draw: () => '<ellipse cx="0" cy="0" rx="26" ry="4" fill="#000" opacity="0.15"/>' +
        `<g transform="translate(-38 -96) scale(0.38)">${Look.inner('bear', {}, 'happy')}</g>` +
        `<path d="M0 -44 L-11 -50 L-11 -38 Z M0 -44 L11 -50 L11 -38 Z" fill="#ff5d8f" ${ln(1.5)}/><circle cx="0" cy="-44" r="3.5" fill="#ff5d8f" ${ln(1.5)}/>`,
    },
    { id: 'dalahorse', name: 'Dala horse', price: 120,
      draw: () => shadow(30) +
        `<path d="M-28 0 L-24 -34 Q-34 -38 -32 -50 Q-30 -60 -18 -58 L4 -58 Q8 -58 10 -64 L14 -78 Q16 -88 26 -86 L38 -70 Q40 -62 32 -62 L22 -64 Q20 -52 22 -40 L28 0 L12 0 L10 -20 Q0 -26 -10 -20 L-12 0 Z" fill="#d8322f" ${ln()}/>` +
        `<path d="M18 -84 L20 -96 L26 -86 Z" fill="#d8322f" ${ln(2)}/>` +
        '<path d="M10 -62 Q12 -76 20 -84" fill="none" stroke="#2a2a3a" stroke-width="4" stroke-linecap="round"/>' +
        `<path d="M-14 -58 Q-14 -40 -3 -38 Q8 -40 8 -58 Z" fill="#3f8fd8" ${ln(2)}/>` +
        '<path d="M-14 -58 Q-11 -50 -8 -58 Q-5 -50 -2 -58 Q1 -50 4 -58 Q7 -50 8 -58" fill="none" stroke="#fff" stroke-width="2"/>' +
        '<path d="M-14 -40 Q-3 -34 8 -40 M14 -66 Q22 -62 30 -66 M22 -64 Q26 -76 28 -82" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>' +
        `<path d="M-30 -48 Q-26 -40 -20 -46 Q-16 -38 -10 -44" fill="none" stroke="#5fbf5a" stroke-width="2.5" stroke-linecap="round"/>` +
        posy(-22, -50) + posy(16, -50, '#ffd23f') + posy(-3, -46, '#fff') +
        '<circle cx="28" cy="-78" r="2.6" fill="#fff"/><circle cx="28.6" cy="-78" r="1.3" fill="#2a2a3a"/>',
    },
    { id: 'pumpkinlanterntoy', name: 'Pumpkin lantern', price: 150,
      draw: () => shadow(34) +
        `<g opacity="0.3"><circle class="an-glow" cx="0" cy="-30" r="42" fill="#ffd23f"/></g>` +
        tube('M2 -58 Q4 -66 10 -70', '#7a4a24', 5) +
        `<path d="M6 -62 Q20 -72 26 -62 Q16 -56 6 -62 Z" fill="#6fcf5a" ${ln(2)}/>` +
        `<ellipse cx="-17" cy="-30" rx="18" ry="28" fill="#f07f1a" ${ln()}/><ellipse cx="17" cy="-30" rx="18" ry="28" fill="#f07f1a" ${ln()}/>` +
        `<ellipse cx="0" cy="-30" rx="18" ry="30" fill="#ff9a2e" ${ln()}/>` +
        `<g class="an-glow"><path d="M-16 -34 Q-10 -46 -4 -34 Z M16 -34 Q10 -46 4 -34 Z" fill="#ffe066" ${ln(2)}/>` +
        `<path d="M-18 -22 Q0 -4 18 -22 Q10 -18 6 -20 L4 -15 L-4 -15 L-6 -20 Q-10 -18 -18 -22 Z" fill="#ffe066" ${ln(2)}/></g>` +
        `<path d="${dot(-24, -24, 3)}${dot(24, -24, 3)}" fill="#ff7a6a" opacity="0.6"/>`,
    },
    { id: 'ghosttoy', name: 'Friendly ghost plush', price: 200,
      draw: () => '<ellipse class="an-pulse" cx="0" cy="0" rx="22" ry="4" fill="#000" opacity="0.13"/>' +
        '<g class="an-float">' +
        `<path d="M-24 -46 Q-24 -94 0 -94 Q24 -94 24 -46 L24 -26 Q18 -18 12 -26 Q6 -18 0 -26 Q-6 -18 -12 -26 Q-18 -18 -24 -26 Z" fill="#fff" ${ln()}/>` +
        `<path d="M-24 -52 Q-34 -54 -32 -44 Q-28 -42 -24 -44 M24 -60 Q34 -70 36 -62 Q32 -54 24 -52" fill="#fff" ${ln(2.5)}/>` +
        `<path d="${dot(-8, -66, 3.5)}${dot(8, -66, 3.5)}" fill="${INK}"/><path d="${dot(-7, -67.5, 1.2)}${dot(9, -67.5, 1.2)}" fill="#fff"/>` +
        `<path d="M-6 -56 Q0 -50 6 -56 Z" fill="#ff7a99" ${ln(2)}/>` +
        `<path d="${dot(-15, -58, 3.5)}${dot(15, -58, 3.5)}" fill="#ffb3c9"/>` +
        `<path d="M6 -94 L0 -100 L-2 -90 Z M6 -94 L14 -100 L14 -88 Z" fill="#ff9a2e" ${ln(1.5)}/></g>`,
    },
    { id: 'strawgoattoy', name: 'Straw goat', price: 250,
      draw: () => {
        const STRAW = '#e9c25a';
        return shadow(32) +
          tube('M-20 -32 L-24 -2 M-10 -32 L-10 -2 M8 -32 L8 -2 M16 -32 L20 -2', STRAW, 5) +
          tube('M-34 -40 Q-40 -44 -38 -52', STRAW, 4) +
          tube('M-26 -38 H16', STRAW, 16) +
          tube('M14 -42 L22 -64', STRAW, 10) + tube('M20 -66 L34 -60', STRAW, 9) +
          tube('M20 -68 C18 -84 2 -88 0 -76 M25 -68 C25 -82 14 -86 12 -78', STRAW, 3) +
          '<path d="M-24 -40 H14 M-22 -36 H12" stroke="#c9962f" stroke-width="1.5"/>' +
          `<path d="M-18 -47 V-29 M-4 -47 V-29 M10 -47 V-29 M14 -52 L22 -48 M26 -70 L28 -58" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>` +
          '<path d="M-18 -47 V-29 M-4 -47 V-29 M10 -47 V-29 M14 -52 L22 -48 M26 -70 L28 -58" stroke="#e8434b" stroke-width="3.5" stroke-linecap="round"/>' +
          `<circle cx="24" cy="-66" r="1.8" fill="${INK}"/>` +
          `<path d="M-6 -46 L-12 -56 L-2 -52 L4 -58 L2 -46 Z" fill="#e8434b" ${ln(1.5)}/>`;
      },
    },
    { id: 'rockinghorse', name: 'Rocking horse', price: 350,
      draw: () => '<ellipse cx="0" cy="0" rx="36" ry="4" fill="#000" opacity="0.15"/>' +
        `<g class="an-sway">${tube('M-40 -10 Q0 6 40 -10', '#c98b52', 6)}` +
        `<path d="M-16 -44 L-24 -6 M-6 -44 L-10 -4 M10 -44 L12 -4 M18 -44 L26 -6" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>` +
        '<path d="M-16 -44 L-24 -6 M-6 -44 L-10 -4 M10 -44 L12 -4 M18 -44 L26 -6" stroke="#fff6ea" stroke-width="5" stroke-linecap="round"/>' +
        tube('M-24 -54 Q-36 -50 -36 -32', '#ffd23f', 6) +
        `<ellipse cx="0" cy="-50" rx="27" ry="13" fill="#fff6ea" ${ln()}/>` +
        `<path d="M14 -56 L22 -86 L34 -82 L26 -54 Z" fill="#fff6ea" ${ln()}/>` +
        `<ellipse cx="32" cy="-86" rx="14" ry="9" transform="rotate(20 32 -86)" fill="#fff6ea" ${ln()}/>` +
        `<path d="M22 -94 L24 -104 L30 -96 Z" fill="#fff6ea" ${ln(2)}/>` +
        tube('M20 -92 Q14 -76 12 -60', '#ffd23f', 5) +
        `<circle cx="33" cy="-89" r="2.5" fill="${INK}"/><circle cx="42" cy="-82" r="1.5" fill="${INK}"/>` +
        `<path d="M-10 -63 Q2 -66 10 -62 L10 -46 Q0 -42 -10 -46 Z" fill="#ff5d6c" ${ln(2)}/>` +
        `<path d="M24 -78 L38 -80" stroke="#ff5d6c" stroke-width="2.5"/>` +
        `<path d="${dot(-16, -46, 3)}${dot(-6, -54, 2.5)}${dot(14, -46, 3)}" fill="#b892ff"/></g>`,
    },
    { id: 'snowglobetoy', name: 'Snow globe', price: 500,
      draw: () => {
        let snow = '';
        [[-14, -52], [8, -56], [-4, -46], [18, -48], [-20, -44], [2, -54]].forEach(([x, y], i) => {
          snow += `<circle class="an-fall${i % 5 ? ' an-d' + (i % 5) : ''}" cx="${x}" cy="${y}" r="${i % 2 ? 2 : 2.6}" fill="#fff" stroke="#9fc6e8" stroke-width="1"/>`;
        });
        return shadow(32) +
          `<circle cx="0" cy="-50" r="32" fill="#d9f3ff"/>` +
          `<path d="M-27.7 -34 Q0 -42 27.7 -34 A32 32 0 0 1 -27.7 -34 Z" fill="#fff"/>` +
          `<path d="M-12 -62 L-2 -44 H-22 Z M-12 -70 L-4 -54 H-20 Z" fill="#3fae55" ${ln(2)}/>` +
          `<rect x="-14" y="-44" width="4" height="6" fill="#a8703f"/>` +
          circ(12, -42, 7, '#fff') + circ(12, -53, 5, '#fff') + '<path d="M12 -53 L17 -52" stroke="#ff9a2e" stroke-width="2" stroke-linecap="round"/>' +
          `<path d="M7 -57 H17 M9 -57 V-62 H15 V-57" fill="#e8434b" ${ln(1.5)}/>` +
          snow + `<circle cx="0" cy="-50" r="32" fill="none" ${ln()}/>` +
          '<path d="M-20 -66 Q-14 -76 -4 -78" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.8"/>' +
          `<path d="M-30 0 L-24 -20 H24 L30 0 Z" fill="#c7303a" ${ln()}/>` +
          '<path d="M-27 -10 H27" stroke="#ffcf3f" stroke-width="3"/>' + sparkle(34, -76, 5);
      },
    },
    { id: 'robot', name: 'Toy robot', price: 700,
      draw: () => '<ellipse cx="0" cy="0" rx="28" ry="4" fill="#000" opacity="0.15"/>' +
        `<rect x="-18" y="-22" width="14" height="20" rx="3" fill="#7d8db0" ${ln(2)}/><rect x="4" y="-22" width="14" height="20" rx="3" fill="#7d8db0" ${ln(2)}/>` +
        `<rect x="-22" y="-6" width="20" height="8" rx="3" fill="#5a6585" ${ln(2)}/><rect x="2" y="-6" width="20" height="8" rx="3" fill="#5a6585" ${ln(2)}/>` +
        tube('M-22 -54 Q-34 -46 -32 -32', '#9fb4d8', 5) + tube('M22 -54 Q34 -46 32 -32', '#9fb4d8', 5) +
        `<path d="M-36 -32 Q-36 -24 -32 -24 M-28 -32 Q-28 -24 -32 -24 M28 -32 Q28 -24 32 -24 M36 -32 Q36 -24 32 -24" fill="none" ${ln(2.5)}/>` +
        `<rect x="-22" y="-62" width="44" height="42" rx="6" fill="#9fb4d8" ${ln()}/>` +
        `<rect x="-14" y="-54" width="28" height="18" rx="3" fill="#2f2b45" ${ln(2)}/>` +
        `<path d="${dot(-7, -45, 3)}" fill="#ff5d6c"/><path d="${dot(1, -45, 3)}" fill="#ffd23f"/><path d="${dot(9, -45, 3)}" fill="#6fdc6a"/>` +
        '<path d="M-10 -30 H10" stroke="#7d8db0" stroke-width="3" stroke-linecap="round"/>' +
        `<rect x="-6" y="-68" width="12" height="7" fill="#7d8db0" ${ln(2)}/>` +
        `<rect x="-20" y="-98" width="40" height="32" rx="8" fill="#9fb4d8" ${ln()}/>` +
        `<rect x="-14" y="-92" width="28" height="18" rx="4" fill="#1d2a6b" ${ln(2)}/>` +
        '<circle cx="-6" cy="-84" r="3.5" fill="#4ee6ff"/><circle cx="6" cy="-84" r="3.5" fill="#4ee6ff"/>' +
        '<path d="M-5 -78 Q0 -75 5 -78" fill="none" stroke="#4ee6ff" stroke-width="2" stroke-linecap="round"/>' +
        `<circle cx="-22" cy="-82" r="4" fill="#7d8db0" ${ln(2)}/><circle cx="22" cy="-82" r="4" fill="#7d8db0" ${ln(2)}/>` +
        `<path d="M0 -98 V-108" ${ln(2.5)}/><circle class="an-pulse" cx="0" cy="-111" r="5" fill="#ff5d6c" ${ln(2)}/>`,
    },
    { id: 'faludollhouse', name: 'Falu-red dollhouse', price: 1000,
      box: '-50 -136 100 142',
      draw: () => {
        const win = (x, y) => `<rect x="${x}" y="${y}" width="16" height="16" fill="#d9a640"/><rect class="an-glow" x="${x}" y="${y}" width="16" height="16" fill="#ffe9a0"/>` +
          `<rect x="${x}" y="${y}" width="16" height="16" fill="none" stroke="${INK}" stroke-width="5"/>` +
          `<path d="M${x} ${y}h16v16h-16z M${x + 8} ${y}v16 M${x} ${y + 8}h16" fill="none" stroke="#fff" stroke-width="2.5"/>`;
        return shadow(40) +
          `<circle class="an-rise" cx="20" cy="-96" r="5" fill="#eceff5" ${ln(1.5)}/><circle class="an-rise an-d2" cx="23" cy="-100" r="4" fill="#eceff5" ${ln(1.5)}/>` +
          `<rect x="14" y="-92" width="11" height="18" fill="#b23a2e" ${ln(2.5)}/><rect x="12" y="-95" width="15" height="5" fill="#fff" ${ln(2)}/>` +
          `<rect x="-34" y="-54" width="68" height="54" fill="#b23a2e" ${ln()}/>` +
          `<path d="M-34 -54 L0 -86 L34 -54 Z" fill="#b23a2e" ${ln()}/>` +
          `<path d="M-42 -52 L0 -90 L42 -52" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>` +
          '<path d="M-42 -52 L0 -90 L42 -52" fill="none" stroke="#3d3a4a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>' +
          `<rect x="-34" y="-54" width="6" height="54" fill="#fff" ${ln(2)}/><rect x="28" y="-54" width="6" height="54" fill="#fff" ${ln(2)}/>` +
          win(-24, -44) + win(10, -44) +
          `<rect x="-6" y="-26" width="14" height="26" rx="2" fill="#3f7a54" stroke="#fff" stroke-width="2.5"/><rect x="-6" y="-26" width="14" height="26" rx="2" fill="none" ${ln(1.5)}/>` +
          '<circle cx="5" cy="-13" r="1.5" fill="#ffcf3f"/>' +
          `<circle cx="0" cy="-66" r="6" fill="#ffe9a0" class="an-glow"/><circle cx="0" cy="-66" r="6" fill="none" stroke="#fff" stroke-width="2.5"/><circle cx="0" cy="-66" r="8" fill="none" ${ln(1.5)}/>` +
          `<path d="M-26 -24 H-10 M12 -24 H28" stroke="#fff" stroke-width="2"/>` +
          `<path d="${dot(-22, -27, 2.5)}${dot(-16, -27, 2.5)}${dot(18, -27, 2.5)}${dot(24, -27, 2.5)}" fill="#ff8ed0"/>` +
          '<path d="M-40 0 V-30" stroke="#fff" stroke-width="2"/>' + `<path d="M-40 0 V-30" ${ln(1)}/>` +
          `<path d="M-40 -30 h12 v8 h-12 z" fill="#2f6fd6" ${ln(1.5)}/><path d="M-36 -30 v8 M-40 -26 h12" stroke="#ffd23f" stroke-width="2"/>`;
      },
    },
    { id: 'rockettoy', name: 'Toy rocket', price: 1500,
      box: '-50 -124 100 130',
      draw: () => shadow(38) +
        `<path d="M-36 0 V-90 M-26 0 V-90 M-36 -80 L-26 -70 L-36 -60 L-26 -50 L-36 -40 L-26 -30 L-36 -20 L-26 -10" fill="none" stroke="#7d8db0" stroke-width="2.5"/>` +
        `<path d="M-36 0 V-90 H-26 V0" fill="none" ${ln(1.5)}/><path d="M-26 -60 H-12" stroke="#7d8db0" stroke-width="3"/>` +
        `<circle class="an-blink" cx="-31" cy="-94" r="4" fill="#ff4f5e" ${ln(1.5)}/>` +
        `<rect x="-40" y="-8" width="80" height="8" rx="2" fill="#8c97ad" ${ln(2.5)}/>` +
        `<g class="an-pulse"><path d="${dot(-12, -10, 7)}${dot(0, -12, 8)}${dot(12, -10, 7)}${dot(24, -9, 6)}" fill="#fff" ${ln(1.5)}/></g>` +
        '<g class="an-bob">' +
        `<g class="an-flicker"><path d="M0 -32 Q6 -10 12 -32 Z" fill="#ff7a2b" ${ln(2)}/><path d="M3 -32 Q6 -20 9 -32 Z" fill="#ffd23f"/></g>` +
        `<path d="M-6 -50 L-18 -28 L-6 -34 Z M18 -50 L30 -28 L18 -34 Z" fill="#e8434b" ${ln(2)}/>` +
        `<rect x="-2" y="-38" width="16" height="7" rx="2" fill="#33324a" ${ln(2)}/>` +
        `<path d="M6 -112 Q20 -96 20 -64 V-36 H-8 V-64 Q-8 -96 6 -112 Z" fill="#fff" ${ln()}/>` +
        `<path d="M6 -112 Q16 -102 18 -88 H-6 Q-4 -102 6 -112 Z" fill="#e8434b" ${ln(2)}/>` +
        `<circle cx="6" cy="-68" r="8" fill="#a7b0c2" ${ln(2)}/><circle cx="6" cy="-68" r="5" fill="#4ee6ff"/>` +
        '<path d="M3 -71 Q5 -73 8 -72" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round"/>' +
        '<path d="M-8 -48 H20" stroke="#4f8cff" stroke-width="3"/></g>' + sparkle(34, -96, 5),
    },
    { id: 'unicornplush', name: 'Unicorn plush on a cushion', gems: 10,
      draw: () => shadow(40) +
        tube('M-40 -18 A40 40 0 0 1 40 -18', '#ff5d6c', 5) + '<path d="M-34 -18 A34 34 0 0 1 34 -18" fill="none" stroke="#ffd23f" stroke-width="5"/>' +
        '<path d="M-29 -18 A29 29 0 0 1 29 -18" fill="none" stroke="#6fdc6a" stroke-width="5"/><path d="M-24 -18 A24 24 0 0 1 24 -18" fill="none" stroke="#5ec8ff" stroke-width="5"/>' +
        `<path d="M-38 -2 Q-42 -16 -30 -18 H30 Q42 -16 38 -2 Q0 4 -38 -2 Z" fill="#9b6bff" ${ln()}/>` +
        '<path d="M-36 -8 Q0 -2 36 -8" fill="none" stroke="#ffcf3f" stroke-width="2.5"/>' +
        `<path d="M-38 -4 L-42 4 L-34 2 Z M38 -4 L42 4 L34 2 Z" fill="#ffcf3f" ${ln(1.5)}/>` +
        `<g transform="translate(-30 -89.6) scale(0.3)">${Look.inner('unicorn', {}, 'happy')}</g>` +
        sparkle(-38, -76, 7) + sparkle(36, -62, 6) + sparkle(26, -100, 5),
    },
    { id: 'toycastle', name: 'Toy castle', gems: 25,
      draw: () => {
        const tower = (x, w, top) => `<rect x="${x - w / 2}" y="${top}" width="${w}" height="${-top}" fill="#ffb3d1" ${ln()}/>` +
          `<path d="M${x - w / 2 - 4} ${top} L${x} ${top - 22} L${x + w / 2 + 4} ${top} Z" fill="#9b6bff" ${ln()}/>` +
          `<path d="M${x} ${top - 22} V${top - 34}" ${ln(2)}/><path d="M${x} ${top - 34} L${x + 11} ${top - 30} L${x} ${top - 26} Z" fill="#ffcf3f" ${ln(1.5)}/>`;
        return '<ellipse cx="0" cy="0" rx="40" ry="4" fill="#000" opacity="0.15"/>' +
          tower(-28, 18, -64) + tower(28, 18, -64) + tower(0, 22, -82) +
          `<path d="M-36 0 V-46 h8 v-6 h8 v6 h8 v-6 h8 v6 h8 v-6 h8 v6 h8 v-6 h8 v6 h8 V0 Z" fill="#ffc4dc" ${ln()}/>` +
          `<path d="M-10 0 V-16 A10 10 0 0 1 10 -16 V0 Z" fill="#7a3fc4" ${ln(2)}/>` +
          '<path d="M-36 -40 H36" stroke="#ffcf3f" stroke-width="3"/>' +
          gem(-22, -26, 5, '#5ec8ff') + gem(22, -26, 5, '#7be07b') + gem(0, -60, 5, '#ff4f7b') +
          `<path d="M-31 -54 h6 v-6 h-6 z M25 -54 h6 v-6 h-6 z" fill="#7a3fc4"/>` +
          sparkle(-38, -78, 7) + sparkle(36, -90, 6) + sparkle(16, -12, 5);
      },
    },
    { id: 'musicbox', name: 'Music box with a ballerina', gems: 40,
      draw: () => shadow(38) +
        `<path d="M-34 -34 L-30 -80 H30 L34 -34 Z" fill="#ffcf3f" ${ln()}/>` +
        `<path d="M-27 -40 L-24 -74 H24 L27 -40 Z" fill="#c9f0ff" ${ln(2)}/>` +
        '<path d="M-16 -70 L-20 -46 M-8 -70 L-11 -56" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' +
        `<ellipse cx="0" cy="-36" rx="11" ry="3.5" fill="#ff8ed0" ${ln(1.5)}/>` +
        '<g transform="translate(0 0)"><g>' +
        '<animateTransform attributeName="transform" type="scale" values="1 1;-1 1;1 1" dur="2.4s" repeatCount="indefinite"/>' +
        `<path d="M-2 -38 V-50 M2 -38 L7 -50" ${ln(2.5)}/>` +
        `<path d="M-16 -50 Q0 -60 16 -50 Q0 -44 -16 -50 Z" fill="#ffb3d1" ${ln(2)}/>` +
        `<path d="M-4 -52 L-5 -64 H5 L4 -52 Z" fill="#ff8ed0" ${ln(2)}/>` +
        `<path d="M-5 -63 Q-14 -74 -3 -80 M5 -63 Q14 -74 3 -80" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>` +
        '<path d="M-5 -63 Q-14 -74 -3 -80 M5 -63 Q14 -74 3 -80" fill="none" stroke="#fff1dc" stroke-width="2.5" stroke-linecap="round"/>' +
        circ(0, -69, 5, '#fff1dc', 2) + circ(1, -75, 2.8, '#a8703f', 1.5) + '</g></g>' +
        `<rect x="-36" y="-36" width="72" height="34" rx="4" fill="#ffcf3f" ${ln()}/>` +
        `<rect x="-28" y="-30" width="56" height="22" rx="3" fill="#ff8ed0" ${ln(2)}/>` +
        gem(0, -19, 7, '#5ec8ff') + gem(-17, -19, 4.5, '#ff4f7b') + gem(17, -19, 4.5, '#7be07b') +
        `<path d="${dot(-32, 0, 3.5)}${dot(32, 0, 3.5)}" fill="#f0a81c" ${ln(1.5)}/>` +
        tube('M36 -20 H42', '#f0a81c', 3) + `<path d="M42 -26 Q48 -20 42 -14 Q38 -20 42 -26 Z" fill="#ffcf3f" ${ln(1.5)}/>` +
        note(-34, -72, '') + note(30, -82, 'an-d2') + sparkle(-38, -92, 6) + sparkle(38, -48, 5) + sparkle(14, -100, 4),
    },
    { id: 'rainbowcarousel', name: 'Rainbow carousel', gems: 60,
      draw: () => {
        const RB = ['#ff5d6c', '#ff9a2e', '#ffd23f', '#6fdc6a', '#5ec8ff', '#9b6bff'];
        let roof = '', lights = '';
        RB.forEach((c, i) => {
          roof += `<path d="M0 -104 L${r1(-44 + i * 88 / 6)} -80 L${r1(-44 + (i + 1) * 88 / 6)} -80 Z" fill="${c}"/>`;
        });
        for (let i = 0; i < 7; i++) {
          const x = -39 + i * 13;
          roof += `<path d="M${x - 6.5} -80 A6.5 6.5 0 0 0 ${x + 6.5} -80 Z" fill="${RB[i % 6]}" ${ln(2)}/>`;
          lights += `<circle class="an-blink${i % 2 ? ' an-d2' : ''}" cx="${x}" cy="-78" r="2" fill="#fff6a0"/>`;
        }
        return shadow(42) +
          `<rect x="-4" y="-82" width="8" height="70" fill="#ffcf3f" ${ln(2)}/>` +
          `<path d="M-24 -80 V-12 M24 -80 V-12" stroke="${INK}" stroke-width="5"/><path d="M-24 -80 V-12 M24 -80 V-12" stroke="#ffcf3f" stroke-width="2.5"/>` +
          `<g class="an-bob">${pony(-24, -44, '#fff', '#ff8ed0')}</g>` +
          `<g class="an-bob an-d3">${pony(24, -40, '#ffd6ea', '#9b6bff')}</g>` +
          `<path d="M-40 -12 H40 V-4 Q0 4 -40 -4 Z" fill="#ffcf3f" ${ln(2.5)}/>` +
          `<ellipse cx="0" cy="-12" rx="40" ry="5" fill="#ffb3d1" ${ln(2.5)}/>` +
          roof + `<path d="M0 -104 L-44 -80 H44 Z" fill="none" ${ln(2.5)}/>` + lights +
          `<path d="M0 -104 V-114" ${ln(2)}/><path d="M0 -114 L10 -111 L0 -108 Z" fill="#ff4f7b" ${ln(1.5)}/>` +
          gem(0, -88, 4, '#5ec8ff') + sparkle(-40, -96, 6) + sparkle(40, -60, 6) + sparkle(-34, -30, 4);
      },
    },
  ]);
})();
