// Rugs (centre; x -170..170, y -35..35).
// Cheap to elite; each entry is the catalog item (ITEMS) and its drawing (ROOM_ART), added by addItems.

(() => {
  const { r1, dot, star, sparkle, cloud, gem, crown } = ROOM_KIT;
  // Fringe at both short ends of a rug that ends at x = ±x, from y -h to h.
  const fringe = (x, h, col, step = 6, len = 10) => {
    let fr = '';
    for (let y = -h; y <= h; y += step) fr += `M${-x} ${y}H${-x - len}M${x} ${y}H${x + len}`;
    return `<path d="${fr}" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="${fr}" stroke="${col}" stroke-width="2.5" stroke-linecap="round"/>`;
  };
  // A bumpy (fluffy) edge: n arcs at equal steps along an ellipse rx × ry.
  const bumpy = (rx, ry, n, br) => {
    const pts = [];
    let len = 0, prev = null;
    for (let i = 0; i <= 240; i++) {
      const a = i / 240 * Math.PI * 2, p = [Math.cos(a) * rx, Math.sin(a) * ry];
      if (prev) len += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
      pts.push([p, len]); prev = p;
    }
    let d = '', k = 0;
    for (let j = 0; j <= n; j++) {
      while (k < pts.length - 1 && pts[k][1] < len * j / n) k++;
      const [x, y] = pts[k][0];
      d += j ? `A${br} ${br} 0 0 1 ${r1(x)} ${r1(y)}` : `M${r1(x)} ${r1(y)}`;
    }
    return d + 'Z';
  };
  // A Dala horse facing right, about 50 × 38, centred near (0, 0).
  const dalaHorse = (w = 2) => `<path d="M-20 -5Q-28 -2 -26 9" fill="none" stroke="${INK}" stroke-width="${w + 2}" stroke-linecap="round"/>` +
    `<path d="M-21 -6H6L10 -18Q12 -21 16 -20L24 -14Q27 -11 24 -9L18 -9L16 -2V16H10V6H-12V16H-18V4Q-22 2 -21 -6Z" fill="#d6262e" ${ln(w)}/>` +
    `<path d="M-12 -6Q-4 5 5 -6Z" fill="#ffd23f" ${ln(w * 0.6)}/>` +
    '<path d="M7 -9Q12 -6 16 -12M-17 0Q-15 3 -13 0M-12 6H10" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>' +
    `<path d="${dot(-4, -2, 1.4)}${dot(15, -4, 1.2)}" fill="#5cc05a"/><path d="${dot(18, -15, 1.3)}" fill="${INK}"/>`;
  const snowflake = (x, y, r, col = '#fff', w = 2) => {
    let d = '';
    for (let i = 0; i < 3; i++) {
      const a = i * Math.PI / 3, c = r1(Math.cos(a) * r), s = r1(Math.sin(a) * r);
      d += `M${r1(x - c)} ${r1(y - s)}L${r1(x + c)} ${r1(y + s)}`;
    }
    return `<path d="${d}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/><path d="${dot(x, y, r * 0.22)}" fill="${col}"/>`;
  };
  const fish = (col, fin) => `<path d="M-12 0L-20 -7V7Z" fill="${fin}" ${ln(1.5)}/><ellipse cx="0" cy="0" rx="13" ry="8" fill="${col}" ${ln(1.5)}/>` +
    `<path d="M-2 -7Q2 0 -2 7" fill="none" stroke="${fin}" stroke-width="2"/><path d="${dot(6, -2, 1.6)}" fill="${INK}"/>`;

  addItems('rug', ROOM_ART, [
    { id: 'doormat', name: 'Old doormat', price: 15,
      draw: () => {
        let b = '';
        for (let y = -12; y <= 12; y += 8) for (let x = -96 + (y % 16 ? 4 : 0); x <= 96; x += 8) b += `M${x} ${y - 2}v4`;
        return '<path d="M-110 -18l-7 -3M-110 -2l-8 1M-110 14l-6 5M110 -14l7 -3M110 4l8 2M110 18l5 4" stroke="#a87d48" stroke-width="2.5" stroke-linecap="round"/>' +
          `<rect x="-110" y="-24" width="220" height="48" rx="6" fill="#c9a06a" ${ln()}/>` +
          '<rect x="-100" y="-17" width="200" height="34" rx="3" fill="none" stroke="#9c7140" stroke-width="2.5"/>' +
          `<path d="${b}" stroke="#a5793f" stroke-width="2" stroke-linecap="round"/>` +
          '<ellipse cx="-62" cy="8" rx="18" ry="6" fill="#a98557" opacity="0.6"/>' +
          `<rect x="58" y="-12" width="26" height="18" rx="2" fill="#8fae6a" transform="rotate(-6 71 -3)" ${ln(1.5)}/>` +
          `<rect x="62" y="-9" width="18" height="12" fill="none" stroke="${INK}" stroke-width="1.2" stroke-dasharray="3 3" transform="rotate(-6 71 -3)"/>`;
      },
    },
    { id: 'ragrug', name: 'Rag rug', price: 30,
      draw: () => {
        const cols = ['#5b8fd9', '#efe7d2', '#e5534b', '#efe7d2', '#f2c94c', '#6cbf6a', '#efe7d2', '#ff8fb0'];
        const ws = [16, 8, 20, 8, 12, 18, 8, 14];
        let bands = '', tex = '';
        for (let x = -140, i = 0; x < 140; x += ws[i % 8], i++) {
          const w = Math.min(ws[i % 8], 140 - x);
          bands += `<rect x="${x}" y="-26" width="${w}" height="52" fill="${cols[i % 8]}"/>`;
          for (let y = -20; y <= 20; y += 8) tex += `M${x + 2 + (y % 16 ? 2 : 0)} ${y}h${Math.max(2, w - 7)}`;
        }
        return fringe(140, 22, '#f7f0dc') + bands +
          `<path d="${tex}" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-dasharray="5 4" opacity="0.4"/>` +
          `<rect x="-140" y="-26" width="280" height="52" rx="4" fill="none" ${ln()}/>`;
      },
    },
    { id: 'roundrug', name: 'Round rug', price: 50,
      draw: () => `<ellipse cx="0" cy="0" rx="128" ry="30" fill="#7cc6f2" ${ln()}/>` +
        '<ellipse cx="0" cy="0" rx="114" ry="25" fill="none" stroke="#fff" stroke-width="2.5" stroke-dasharray="7 6"/>' +
        '<ellipse cx="0" cy="0" rx="96" ry="20" fill="#b8e3ff"/><ellipse cx="0" cy="0" rx="64" ry="13" fill="#ffd166"/>' +
        '<ellipse cx="0" cy="0" rx="34" ry="7" fill="#ff9fbf"/>',
    },
    { id: 'hopscotchrug', name: 'Hopscotch mat', price: 80,
      draw: () => {
        const cols = ['#ff8fb0', '#ffd166', '#8fd6ff', '#9fe39a', '#c9a6ff', '#ffb36b', '#8fd6ff'];
        let cells = '';
        for (let i = 0; i < 7; i++) {
          const x = -140 + i * 40;
          if (i === 6) { cells += `<path d="M${x} -24H${x + 18}A24 24 0 0 1 ${x + 18} 24H${x}Z" fill="${cols[i]}" ${ln(2)}/>`; continue; }
          if (i % 2 === 0 && i > 0) {
            cells += `<rect x="${x}" y="-24" width="40" height="24" fill="${cols[i]}" ${ln(2)}/>` +
              `<rect x="${x}" y="0" width="40" height="24" fill="${cols[(i + 3) % 7]}" ${ln(2)}/>`;
          } else cells += `<rect x="${x}" y="-24" width="40" height="48" fill="${cols[i]}" ${ln(2)}/>`;
        }
        return `<rect x="-150" y="-30" width="300" height="60" rx="8" fill="#fff6e6" ${ln()}/>` + cells +
          `<path d="${dot(-120, -12, 2.5)}${dot(-90, 10, 2.5)}${dot(-80, 10, 2.5)}${dot(124, -8, 2.5)}${dot(134, 4, 2.5)}" fill="#fff"/>` +
          `<ellipse cx="-100" cy="-10" rx="8" ry="5" fill="#9aa0b8" ${ln(1.5)}/><ellipse cx="-102" cy="-12" rx="3" ry="1.5" fill="#c9cde0"/>`;
      },
    },
    { id: 'pumpkinrug', name: 'Pumpkin rug', price: 100,
      draw: () => `<path d="M138 -6q14 -10 24 -2q-8 2 -10 10z" fill="#5aa04a" ${ln(2)}/>` +
        `<path d="M150 -10q8 -14 16 -8" fill="none" stroke="#3f8a3a" stroke-width="2.5" stroke-linecap="round"/>` +
        `<ellipse cx="0" cy="0" rx="142" ry="31" fill="#ff9a2e" ${ln()}/>` +
        '<path d="M-100 -22Q-120 0 -100 22M-52 -29Q-64 0 -52 29M52 -29Q64 0 52 29M100 -22Q120 0 100 22" fill="none" stroke="#e57a12" stroke-width="3" stroke-linecap="round"/>' +
        `<path d="M-104 4L-90 -16L-76 4ZM76 4L90 -16L104 4ZM-80 6Q0 52 80 6Q40 15 0 15Q-40 15 -80 6Z" fill="#ffd23f" ${ln(2)}/>` +
        `<path d="M-30 14h12v6h-12zM18 14h12v6h-12z" fill="#ff9a2e" ${ln(1.5)}/>` +
        '<g class="an-glow"><path d="M-97 1L-90 -9L-83 1ZM83 1L90 -9L97 1ZM-50 18Q0 38 50 18Q0 24 -50 18Z" fill="#fff6c0"/></g>',
    },
    { id: 'dalarug', name: 'Dala horse rug', price: 120,
      draw: () => {
        let fl = '', cen = '';
        for (const x of [-56, 56]) for (const y of [-14, 14]) {
          for (let i = 0; i < 5; i++) { const a = i * Math.PI * 0.4; fl += dot(x + Math.cos(a) * 5, y + Math.sin(a) * 5, 3.5); }
          cen += dot(x, y, 2.5);
        }
        return fringe(150, 24, '#ffd23f') +
          `<rect x="-150" y="-28" width="300" height="56" rx="6" fill="#2f6fbf" ${ln()}/>` +
          '<rect x="-142" y="-21" width="284" height="42" rx="3" fill="none" stroke="#ffd23f" stroke-width="3"/>' +
          '<path d="M-142 0H-134M134 0H142" stroke="#fff" stroke-width="3"/>' +
          `<path d="${fl}" fill="#fff" ${ln(1.2)}/><path d="${cen}" fill="#d6262e"/>` +
          `<g transform="translate(-104 1)">${dalaHorse()}</g><g transform="translate(104 1) scale(-1 1)">${dalaHorse()}</g>`;
      },
    },
    { id: 'striperug', name: 'Striped rug', price: 150,
      draw: () => {
        const cols = ['#ffd166', '#ff8fb0', '#8fd6ff', '#9fe39a'];
        let fr = '';
        for (let y = -22; y <= 22; y += 6) fr += `M-152 ${y}H-162M152 ${y}H162`;
        return `<path d="${fr}" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="${fr}" stroke="#fff3d6" stroke-width="2.5" stroke-linecap="round"/>` +
          '<rect x="-150" y="-26" width="300" height="52" rx="6" fill="#b892ff"/>' +
          cols.map((cl, i) => `<rect x="${-100 + i * 50}" y="-26" width="50" height="52" fill="${cl}"/>`).join('') +
          '<path d="M-140 -14 L-130 0 L-140 14 M-120 -14 L-110 0 L-120 14 M140 -14 L130 0 L140 14 M120 -14 L110 0 L120 14" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' +
          `<rect x="-150" y="-26" width="300" height="52" rx="6" fill="none" ${ln()}/>`;
      },
    },
    { id: 'midsummerrug', name: 'Midsummer flower rug', price: 200,
      draw: () => {
        const cols = ['#fff', '#ffd23f', '#ff8fb0', '#7ab8ff', '#c58cff'];
        const pet = cols.map(() => ''), mid = [];
        let leaf = '';
        const n = 22;
        for (let j = 0; j < n; j++) {
          const a = j / n * Math.PI * 2, x = Math.cos(a) * 128, y = Math.sin(a) * 25;
          if (j % 2) { leaf += `M${r1(x - 6)} ${r1(y - 3)}q6 -4 12 0q-6 4 -12 0`; continue; }
          const k = (j / 2) % 5;
          for (let i = 0; i < 5; i++) { const b = i * Math.PI * 0.4; pet[k] += dot(x + Math.cos(b) * 4.5, y + Math.sin(b) * 3.5, 3.4); }
          mid.push(dot(x, y, 2.3));
        }
        const pole = 'M-100 18V-18M-112 -8H-88';
        return `<ellipse cx="0" cy="0" rx="142" ry="31" fill="#9fd98a" ${ln()}/><ellipse cx="0" cy="0" rx="112" ry="19" fill="#c8efb4"/>` +
          '<ellipse cx="0" cy="0" rx="128" ry="25" fill="none" stroke="#4fa64a" stroke-width="5"/>' +
          `<path d="${leaf}" fill="#3f9b3f"/>` + pet.map((d, k) => `<path d="${d}" fill="${cols[k]}" ${ln(1)}/>`).join('') +
          `<path d="${mid.join('')}" fill="#ffb321"/>` +
          tube(pole, '#5aa04a', 3) + `<circle cx="-110" cy="-1" r="5" fill="none" stroke="#5aa04a" stroke-width="3"/>` +
          '<circle cx="-90" cy="-1" r="5" fill="none" stroke="#5aa04a" stroke-width="3"/>' +
          `<path d="${dot(-100, -18, 2.5)}${dot(-112, -8, 2.5)}${dot(-88, -8, 2.5)}" fill="#ff8fb0"/>` +
          `<g class="an-float"><path d="M98 -4Q88 -16 84 -6Q88 0 98 -4ZM102 -4Q112 -16 116 -6Q112 0 102 -4Z" fill="#ffb3d1" ${ln(1.5)}/>` +
          `<path d="M98 -2Q90 8 94 10Q98 8 99 0ZM102 -2Q110 8 106 10Q102 8 101 0Z" fill="#ffd23f" ${ln(1.5)}/>` +
          `<path d="M100 -8V4" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/></g>`;
      },
    },
    { id: 'spiderwebrug', name: 'Spider web rug', price: 250,
      draw: () => {
        const N = 16, rings = [0.3, 0.55, 0.8, 0.97];
        const P = (a, k) => [Math.cos(a) * 140 * k, Math.sin(a) * 30 * k];
        let web = '';
        for (let i = 0; i < N; i++) { const [x, y] = P(i / N * Math.PI * 2, 0.97); web += `M0 0L${r1(x)} ${r1(y)}`; }
        for (const k of rings) for (let i = 0; i < N; i++) {
          const a = i / N * Math.PI * 2, b = (i + 1) / N * Math.PI * 2;
          const [x0, y0] = P(a, k), [x1, y1] = P(b, k), [cx, cy] = P((a + b) / 2, k * 0.86);
          web += `${i ? '' : `M${r1(x0)} ${r1(y0)}`}Q${r1(cx)} ${r1(cy)} ${r1(x1)} ${r1(y1)}`;
        }
        let legs = '';
        for (const s of [-1, 1]) for (let i = 0; i < 4; i++) legs += `M${110 + s * 6} ${2 + i * 3 - 4}q${s * 10} ${-6 + i * 4} ${s * 14} ${2 + i * 3}`;
        return `<ellipse cx="0" cy="0" rx="142" ry="31" fill="#5b4b8a" ${ln()}/>` +
          `<path d="${web}" fill="none" stroke="#e9e4ff" stroke-width="1.8" stroke-linecap="round"/>` +
          `<circle cx="-116" cy="6" r="10" fill="#ff9a2e" ${ln(2)}/><path d="M-116 -4q1 -5 4 -6" fill="none" stroke="#3f8a3a" stroke-width="3" stroke-linecap="round"/>` +
          `<path d="M-120 4v1M-112 4v1M-121 9q5 4 10 0" fill="none" ${ln(1.5)}/>` +
          `<g class="an-bob"><path d="${legs}" fill="none" stroke="#2a2340" stroke-width="2.5" stroke-linecap="round"/>` +
          `<circle cx="110" cy="2" r="11" fill="#2a2340" ${ln(2)}/>` +
          `<path d="${dot(106, -1, 3.2)}${dot(114, -1, 3.2)}" fill="#fff"/><path d="${dot(106.5, -0.5, 1.6)}${dot(114.5, -0.5, 1.6)}" fill="${INK}"/>` +
          '<path d="M106 5Q110 9 114 5" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>' +
          `<path d="${dot(102, 5, 1.8)}${dot(118, 5, 1.8)}" fill="#ff8fb0"/></g>`;
      },
    },
    { id: 'christmasrug', name: 'Christmas rug', price: 300,
      draw: () => {
        let zz = '';
        for (const y of [-19, 19]) { zz += `M-140 ${y}`; for (let x = -135; x <= 140; x += 5) zz += `L${x} ${y + ((x / 5) % 2 ? -3 : 3)}`; }
        const gb = x => `<g transform="translate(${x} 2)"><path d="M-4 -6A6 6 0 1 1 4 -6L10 -2Q12 2 8 2L5 1L8 12Q8 15 4 14L0 8L-4 14Q-8 15 -8 12L-5 1L-8 2Q-12 2 -10 -2Z" fill="#c27a3a" ${ln(1.8)}/>` +
          `<path d="${dot(-2, -10, 1)}${dot(2, -10, 1)}${dot(0, -1, 1.3)}${dot(0, 4, 1.3)}" fill="#fff"/><path d="M-2 -7Q0 -5 2 -7" fill="none" stroke="#fff" stroke-width="1.2"/></g>`;
        const sf = [[-128, -2, 9, ''], [128, 2, 9, ' an-d2'], [-70, 8, 6, ' an-d1'], [72, -8, 6, ' an-d3']];
        return fringe(150, 24, '#fff') +
          `<rect x="-150" y="-28" width="300" height="56" rx="6" fill="#d33a3a" ${ln()}/>` +
          `<path d="${zz}" fill="none" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/>` +
          '<path d="M-150 -9H150M-150 9H150" stroke="#2f8a4a" stroke-width="3"/>' +
          gb(-100) + gb(100) + sf.map(([x, y, r, d]) => `<g class="an-twinkle${d}">${snowflake(x, y, r)}</g>`).join('') +
          `<rect x="-150" y="-28" width="300" height="56" rx="6" fill="none" ${ln()}/>`;
      },
    },
    { id: 'cloudrug', name: 'Fluffy cloud rug', price: 400,
      draw: () => {
        // Bumps at equal steps along an ellipse.
        const pts = [];
        let len = 0, prev = null;
        for (let i = 0; i <= 240; i++) {
          const a = i / 240 * Math.PI * 2, p = [Math.cos(a) * 140, Math.sin(a) * 22];
          if (prev) len += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
          pts.push([p, len]); prev = p;
        }
        const n = 18;
        let d = '', k = 0;
        for (let j = 0; j <= n; j++) {
          const want = len * j / n;
          while (k < pts.length - 1 && pts[k][1] < want) k++;
          const [x, y] = pts[k][0];
          d += j ? `A20 18 0 0 1 ${r1(x)} ${r1(y)}` : `M${r1(x)} ${r1(y)}`;
        }
        return `<path d="${d}Z" fill="#fff" ${ln()}/><ellipse cx="0" cy="4" rx="110" ry="14" fill="#e3f3ff"/>` +
          '<ellipse cx="-70" cy="-6" rx="22" ry="5" fill="#fff"/><ellipse cx="60" cy="-8" rx="26" ry="5" fill="#fff"/>';
      },
    },
    { id: 'polarbearrug', name: 'Polar bear rug', price: 500,
      draw: () => {
        const paw = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="11" ry="7" fill="#fff" ${ln(2)}/><path d="${dot(x - 4, y, 1.6)}${dot(x, y - 1.5, 1.6)}${dot(x + 4, y, 1.6)}" fill="#ffb3c7"/>`;
        return `<circle cx="138" cy="0" r="7" fill="#fff" ${ln(2)}/>` +
          `<path d="${bumpy(130, 23, 30, 8)}" fill="#fff" ${ln()}/><ellipse cx="6" cy="1" rx="100" ry="14" fill="#eef6ff"/>` +
          paw(-72, -24) + paw(-72, 24) + paw(80, -24) + paw(80, 24) +
          `<path d="${dot(-140, -20, 7)}${dot(-114, -20, 7)}" fill="#fff" ${ln(2)}/><path d="${dot(-140, -20, 3.5)}${dot(-114, -20, 3.5)}" fill="#ffc7d6"/>` +
          `<circle cx="-127" cy="-2" r="21" fill="#fff" ${ln()}/><ellipse cx="-127" cy="6" rx="10" ry="7" fill="#f2f2f7" ${ln(1.5)}/>` +
          `<path d="M-131 3h8l-4 4z" fill="${INK}" ${ln(1.5)}/><path d="M-127 7v3M-131 11q4 3 8 0" fill="none" ${ln(1.5)}/>` +
          `<path d="${dot(-135, -6, 2.4)}${dot(-119, -6, 2.4)}" fill="${INK}"/><path d="${dot(-142, 3, 3)}${dot(-112, 3, 3)}" fill="#ffb3c7"/>` +
          `<path d="M-108 -10Q-104 4 -110 16" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>` +
          '<path d="M-108 -10Q-104 4 -110 16" fill="none" stroke="#e5534b" stroke-width="6" stroke-linecap="round"/>' +
          '<path d="M-107 -4h3M-106 4h3M-107 11h3" stroke="#fff" stroke-width="2" stroke-linecap="round"/>' +
          [[30, -6, ''], [96, 6, ' an-d2'], [-40, 10, ' an-d3']].map(([x, y, d]) => `<g class="an-twinkle${d}">${snowflake(x, y, 6, '#8fc8ff', 1.8)}</g>`).join('');
      },
    },
    { id: 'racetrackrug', name: 'Race track mat', price: 600,
      draw: () => {
        const T = 'M-110 20H110A20 20 0 0 0 110 -20H-110A20 20 0 0 0 -110 20Z';
        let chk = '';
        for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) if ((i + j) % 2) chk += `M${60 + j * 3.5} ${13 + i * 3.5}h3.5v3.5h-3.5z`;
        const tree = (x, y) => `<path d="M${x} ${y + 4}V${y + 8}" stroke="${INK}" stroke-width="3"/><path d="${dot(x, y, 6)}" fill="#3f9b5c" ${ln(1.5)}/>`;
        return `<rect x="-160" y="-32" width="320" height="64" rx="12" fill="#7fd36a" ${ln()}/>` +
          `<path d="${T}" fill="none" stroke="${INK}" stroke-width="19"/><path d="${T}" fill="none" stroke="#8a8fa8" stroke-width="14"/>` +
          `<path d="${T}" fill="none" stroke="#fff" stroke-width="1.5" stroke-dasharray="6 6"/>` +
          `<rect x="60" y="13" width="7" height="14" fill="#fff"/><path d="${chk}" fill="${INK}"/>` +
          tree(-110, -4) + tree(-80, -2) + tree(118, -4) +
          `<path d="M-150 26V8" stroke="${INK}" stroke-width="2"/><path d="M-150 8l12 4l-12 4z" fill="#ff4f7b" ${ln(1.5)}/>` +
          `<path d="M150 -10V-28" stroke="${INK}" stroke-width="2"/><path d="M150 -28l-12 4l12 4z" fill="#ffd23f" ${ln(1.5)}/>` +
          `<g><rect x="-6" y="-6" width="3.5" height="12" rx="1" fill="${INK}"/><rect x="3" y="-6" width="3.5" height="12" rx="1" fill="${INK}"/>` +
          `<rect x="-9" y="-4" width="18" height="8" rx="3" fill="#ff4f4f" ${ln(1.5)}/><rect x="0" y="-3" width="4" height="6" rx="1" fill="#bfe8ff"/>` +
          `<animateMotion dur="7s" repeatCount="indefinite" rotate="auto" path="${T}"/></g>`;
      },
    },
    { id: 'oceanrug', name: 'Ocean rug', price: 800,
      draw: () => {
        let wv = '';
        for (const [x, y] of [[-70, -12], [40, -16], [-30, 18], [70, 14], [-130, 2]]) wv += `M${x} ${y}q5 -4 10 0t10 0t10 0`;
        return `<path d="${bumpy(140, 29, 26, 16)}" fill="#3fa7e8" ${ln()}/><ellipse cx="0" cy="0" rx="118" ry="22" fill="#6cc4f5"/>` +
          `<path d="${wv}" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.8"/>` +
          `<g class="an-sway"><path d="M-84 22Q-90 14 -84 6Q-78 -2 -84 -8" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>` +
          '<path d="M-84 22Q-90 14 -84 6Q-78 -2 -84 -8" fill="none" stroke="#3fb36a" stroke-width="3.5" stroke-linecap="round"/></g>' +
          `<path d="${star(122, -10, 10)}" fill="#ff8fb0" ${ln(1.8)}/>` +
          `<path d="M-128 20Q-128 8 -120 8Q-112 8 -112 20Z" fill="#ffe0c2" ${ln(1.8)}/><path d="M-120 9V20M-124 10L-126 20M-116 10L-114 20" stroke="#e8a77a" stroke-width="1.5"/>` +
          `<g class="an-swim"><g transform="translate(-108 -8)">${fish('#ff9a2e', '#fff3d6')}</g></g>` +
          `<g class="an-swim an-d3"><g transform="translate(94 10) scale(-1 1)">${fish('#ffd23f', '#5b8fd9')}</g></g>`;
      },
    },
    { id: 'persianrug', name: 'Persian rug', price: 1200,
      draw: () => {
        const med = (x, s) => `<path d="M${x} ${-16 * s}L${x + 22 * s} 0L${x} ${16 * s}L${x - 22 * s} 0Z" fill="#1d3f7a" ${ln(2)}/>` +
          `<path d="M${x} ${-10 * s}L${x + 13 * s} 0L${x} ${10 * s}L${x - 13 * s} 0Z" fill="#f2c14e"/><path d="${dot(x, 0, 4 * s)}" fill="#9e1b32"/>`;
        let dd = '';
        for (const [x, y] of [[-60, -12], [-60, 12], [60, -12], [60, 12], [-128, -12], [-128, 12], [128, -12], [128, 12]]) dd += dot(x, y, 2.4);
        return fringe(160, 26, '#f5ecd2', 5, 9) +
          `<rect x="-160" y="-31" width="320" height="62" rx="3" fill="#9e1b32" ${ln()}/>` +
          '<rect x="-151" y="-23" width="302" height="46" fill="none" stroke="#1d3f7a" stroke-width="8"/>' +
          '<rect x="-151" y="-23" width="302" height="46" fill="none" stroke="#f2c14e" stroke-width="2.5" stroke-dasharray="2 5" stroke-linecap="round"/>' +
          '<path d="M-145 -17h18l-18 10zM145 -17h-18l18 10zM-145 17h18l-18 -10zM145 17h-18l18 -10z" fill="#1d3f7a"/>' +
          med(-96, 0.9) + med(96, 0.9) + med(0, 1.1) + `<path d="${dd}" fill="#f2c14e"/>` +
          '<path d="M-40 -14q8 6 0 12q-8 6 0 12M40 -14q-8 6 0 12q8 6 0 12" fill="none" stroke="#f2c14e" stroke-width="2"/>';
      },
    },
    { id: 'flyingcarpet', name: 'Magic flying carpet', price: 2000,
      draw: () => {
        const tas = (x, y) => `<path d="M${x} ${y}l${x < 0 ? -6 : 6} 8" stroke="#ffcf3f" stroke-width="2.5"/><path d="${dot(x + (x < 0 ? -7 : 7), y + 10, 3.5)}" fill="#ffcf3f" ${ln(1.5)}/>`;
        return `<ellipse cx="0" cy="26" rx="128" ry="8" fill="${INK}" opacity="0.16"/>` +
          '<g class="an-float">' + tas(-150, -22) + tas(150, -22) + tas(-150, 14) + tas(150, 14) +
          `<path d="M-150 -22Q-75 -32 0 -22Q75 -12 150 -22V14Q75 4 0 14Q-75 24 -150 14Z" fill="#7a4fd1" ${ln()}/>` +
          '<path d="M-140 -16Q-75 -25 0 -16Q75 -7 140 -16V8Q75 -1 0 8Q-75 17 -140 8Z" fill="none" stroke="#ffcf3f" stroke-width="3"/>' +
          '<path d="M-130 -12Q-75 -20 0 -12Q75 -4 130 -12V4Q75 -4 0 4Q-75 12 -130 4Z" fill="#2fb5a6"/>' +
          `<path d="M-100 -12L-88 -4L-100 4L-112 -4ZM100 -12L112 -4L100 4L88 -4Z" fill="#ffcf3f" ${ln(1.5)}/>` +
          `<path d="${dot(-100, -4, 2.5)}${dot(100, -4, 2.5)}" fill="#ff4f7b"/>` +
          `<path d="${dot(-60, -10, 2)}${dot(-60, 4, 2)}${dot(60, -4, 2)}${dot(60, 8, 2)}" fill="#fff3a0"/>` +
          sparkle(-160, -30, 7) + sparkle(162, 4, 6) + '</g>';
      },
    },
    { id: 'redcarpet', name: 'Red carpet', gems: 10,
      draw: () => {
        let fr = '';
        for (let y = -24; y <= 24; y += 6) fr += `M-166 ${y}H-176M166 ${y}H176`;
        let dia = '';
        for (const x of [-120, -80, 80, 120]) dia += `M${x} -8L${x + 8} 0L${x} 8L${x - 8} 0Z`;
        return `<path d="${fr}" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="${fr}" stroke="#ffcf3f" stroke-width="2.5" stroke-linecap="round"/>` +
          `<rect x="-166" y="-30" width="332" height="60" rx="4" fill="#d0213c" ${ln()}/>` +
          '<rect x="-154" y="-21" width="308" height="42" rx="3" fill="none" stroke="#ffcf3f" stroke-width="4"/>' +
          `<path d="M0 -14 L36 0 L0 14 L-36 0 Z" fill="#ffcf3f" ${ln(2)}/><path d="M0 -7 L16 0 L0 7 L-16 0 Z" fill="#a8122a"/>` +
          `<path d="${dia}" fill="#ffcf3f"/>` + sparkle(-140, -14, 8) + sparkle(144, 12, 8) + sparkle(60, -18, 6);
      },
    },
    { id: 'starmaprug', name: 'Star map rug', gems: 15,
      draw: () => {
        // The Big Dipper (Karlavagnen) on the left, a crescent moon on the right.
        const dip = [[-148, -16], [-132, -10], [-118, -12], [-104, -6], [-102, 10], [-78, 12], [-76, -4]];
        let small = '';
        for (let i = 0; i < 14; i++) small += dot(-60 + ((i * 53) % 210), -20 + ((i * 37) % 42), 1.3);
        return `<rect x="-162" y="-31" width="324" height="62" rx="16" fill="#1f2a5c" ${ln()}/>` +
          '<rect x="-154" y="-24" width="308" height="48" rx="11" fill="none" stroke="#ffcf3f" stroke-width="3"/>' +
          `<path d="${small}" fill="#cfd8ff"/>` +
          `<path d="M${dip.map(p => p.join(' ')).join('L')}L-104 -6" fill="none" stroke="#8fa4ff" stroke-width="1.5" stroke-dasharray="3 3"/>` +
          dip.map(([x, y], i) => `<g class="an-twinkle an-d${i % 4 + 1}"><path d="${star(x, y, 5)}" fill="#ffe27a" ${ln(1)}/></g>`).join('') +
          `<g class="an-glow"><ellipse cx="114" cy="-2" rx="24" ry="20" fill="#3d4f9a"/></g>` +
          `<path d="M118 -18A16 16 0 1 0 118 14A21 21 0 0 1 118 -18Z" fill="#fff3a0" ${ln(2)}/>` +
          `<circle cx="64" cy="14" r="7" fill="#ff9fbf" ${ln(1.5)}/><ellipse cx="64" cy="14" rx="13" ry="3.5" fill="none" stroke="#ffcf3f" stroke-width="2"/>` +
          sparkle(-60, 16, 6) + sparkle(146, 16, 6) + sparkle(84, -16, 5);
      },
    },
    { id: 'goldrug', name: 'Gold embroidered rug', gems: 20,
      draw: () => {
        const scroll = s => `M${s * 150} -14Q${s * 128} -20 ${s * 132} -6Q${s * 136} 4 ${s * 124} 2M${s * 150} 14Q${s * 128} 20 ${s * 132} 6`;
        return fringe(164, 26, '#ffcf3f', 5, 9) +
          `<rect x="-164" y="-31" width="328" height="62" rx="6" fill="#4a2fa0" ${ln()}/>` +
          '<rect x="-156" y="-24" width="312" height="48" rx="3" fill="none" stroke="#ffcf3f" stroke-width="5"/>' +
          '<rect x="-148" y="-17" width="296" height="34" rx="2" fill="none" stroke="#ffe08a" stroke-width="1.5" stroke-dasharray="4 3"/>' +
          `<path d="${scroll(-1)}${scroll(1)}M-70 -10Q-56 -18 -46 -8Q-56 0 -46 8Q-56 18 -70 10M70 -10Q56 -18 46 -8Q56 0 46 8Q56 18 70 10" fill="none" stroke="#ffcf3f" stroke-width="2.5" stroke-linecap="round"/>` +
          crown(-100, 8, 0.9) + crown(100, 8, 0.9) +
          ['-156 -24', '156 -24', '-156 24', '156 24'].map((p, i) => {
            const [x, y] = p.split(' ').map(Number);
            return `<g class="an-pulse an-d${i + 1}">${gem(x, y, 7, ['#ff4f7b', '#5ec8ff', '#7be07b', '#ffcf3f'][i])}</g>`;
          }).join('') +
          `<g class="an-pulse">${gem(-30, 18, 6, '#5ec8ff')}${gem(30, 18, 6, '#ff4f7b')}</g>` +
          sparkle(-130, -2, 8) + sparkle(132, -4, 8) + sparkle(-62, 22, 6) + sparkle(66, -20, 6);
      },
    },
    { id: 'dancemat', name: 'Rainbow dance mat', gems: 30,
      draw: () => {
        const cols = ['#ff4f6b', '#ff9a2e', '#ffd23f', '#7be07b', '#3fc4e8', '#5b8fff', '#b46bff', '#ff6fc8', '#ff4f6b', '#ff9a2e'];
        let sq = '';
        for (let r = 0; r < 2; r++) for (let i = 0; i < 10; i++) {
          const k = (i * 3 + r * 2) % 5;
          sq += `<rect class="an-blink${k ? ' an-d' + k : ''}" x="${-150 + i * 30}" y="${r ? 2 : -26}" width="26" height="24" rx="4" fill="${cols[(i + r * 3) % 10]}"/>`;
        }
        return `<rect x="-164" y="-32" width="328" height="64" rx="10" fill="#2b2346" ${ln()}/>` +
          '<rect x="-158" y="-30" width="316" height="60" rx="8" fill="none" stroke="#ffcf3f" stroke-width="3"/>' + sq +
          '<path d="M-137 -8l0 -10M-141 -14l4 -4l4 4M-107 16l0 -10M-111 12l4 4l4 -4M103 -14l10 0M107 -18l-4 4l4 4M133 16l10 0M139 12l4 4l-4 4" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
          sparkle(-160, -30, 8) + sparkle(162, 28, 8) + sparkle(160, -30, 6) + sparkle(-158, 30, 6);
      },
    },
  ]);
})();
