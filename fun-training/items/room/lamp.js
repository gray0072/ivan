// Lamps (from the ceiling point (0, 0) down to y 185).
// Cheap to elite; each entry is the catalog item (ITEMS) and its drawing (ROOM_ART), added by addItems.

(() => {
  const { r1, dot, star, sparkle, flip, flame, gem } = ROOM_KIT;
  const cap = (fill, w = 22) => `<rect x="${-w / 2}" y="-2" width="${w}" height="8" rx="2" fill="${fill}" ${ln(2)}/>`;
  const cord = (y, color = INK, w = 3) => `<path d="M0 4 V${y}" stroke="${color}" stroke-width="${w}"/>`;
  const chain = y => `<path d="M0 4 V${y}" stroke="${INK}" stroke-width="6"/><path d="M0 4 V${y}" stroke="#ffcf3f" stroke-width="3" stroke-dasharray="5 2"/>`;
  // A shape with one clean outline (a cloud of circles): the ink path, then the fill on top.
  const blob = (d, fill, w = 6) => `<path d="${d}" fill="${INK}" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round"/><path d="${d}" fill="${fill}"/>`;
  const smile = (x, y, s = 1) => `<path d="M${x - 9 * s} ${y - 4 * s}q3 -4 6 0M${x + 3 * s} ${y - 4 * s}q3 -4 6 0M${x - 5 * s} ${y + 3 * s}q5 5 10 0" fill="none" ${ln(2)}/>` +
    `<path d="${dot(x - 12 * s, y + 2 * s, 3 * s)}${dot(x + 12 * s, y + 2 * s, 3 * s)}" fill="#ff9fb8" opacity="0.8"/>`;
  const spin = (x, y, dur) => `<animateTransform attributeName="transform" type="rotate" values="0 ${x} ${y};360 ${x} ${y}" dur="${dur}s" repeatCount="indefinite"/>`;

  addItems('lamp', ROOM_ART, [
    { id: 'bulb', name: 'Bare bulb', price: 0,
      draw: () => `<rect x="-11" y="-2" width="22" height="8" rx="2" fill="#9a958a" ${ln(2)}/>` +
        flip('an-sway', '<circle cx="0" cy="146" r="30" fill="#fff4a8" opacity="0.35"/>' +
          `<path d="M0 6 V112" stroke="${INK}" stroke-width="3"/>` +
          `<path d="M-6 126 V134 A15 15 0 1 0 6 134 V126 Z" fill="#fff3b0" ${ln(2)}/>` +
          '<path d="M-4 142 L-2 148 L0 142 L2 148 L4 142" fill="none" stroke="#ff9f1c" stroke-width="1.5"/>' +
          '<ellipse cx="-6" cy="144" rx="2.5" ry="5" fill="#fff"/>' +
          `<rect x="-9" y="110" width="18" height="18" rx="2" fill="#6f6a7d" ${ln(2)}/><path d="M-9 116 H9 M-9 122 H9" stroke="#4f4b5c" stroke-width="2"/>`),
    },
    { id: 'tincanlamp', name: 'Tin can lamp', price: 20,
      draw: () => cap('#9a958a', 18) +
        flip('an-sway', '<path d="M-22 132 L22 132 L44 178 L-44 178 Z" fill="#fff4a8" opacity="0.3"/>' + cord(88) +
          `<ellipse cx="0" cy="134" rx="10" ry="6" fill="#fff3b0" ${ln(2)}/>` +
          `<path d="M-20 92 L20 90 L22 132 L-22 133 Z" fill="#b8bec6" ${ln()}/>` +
          '<path d="M-21 101 H21 M-21 112 H21 M-22 123 H22" stroke="#959ca6" stroke-width="2"/>' +
          `<path d="${dot(-12, 106, 2.2)}${dot(0, 106, 2.2)}${dot(12, 106, 2.2)}${dot(-6, 117, 2.2)}${dot(6, 117, 2.2)}" fill="#fff3b0" ${ln(1)}/>` +
          '<path d="M7 92 L12 98 L17 91" fill="none" stroke="#868d97" stroke-width="2"/>' +
          `<rect x="-6" y="84" width="12" height="8" rx="2" fill="#6f6a7d" ${ln(2)}/>`),
    },
    { id: 'shade', name: 'Lamp shade', price: 40,
      draw: () => `<rect x="-11" y="-2" width="22" height="8" rx="2" fill="#fff" ${ln(2)}/>` +
        flip('an-sway', '<path d="M-46 134 L46 134 L74 182 L-74 182 Z" fill="#fff5b8" opacity="0.35"/>' +
          `<path d="M0 6 V86" stroke="${INK}" stroke-width="3"/>` +
          `<ellipse cx="0" cy="136" rx="11" ry="8" fill="#fff6c2" ${ln(2)}/>` +
          `<path d="M-16 84 L16 84 L46 134 L-46 134 Z" fill="#5ec2b7" ${ln()}/>` +
          `<path d="M-41 126 H41" stroke="#fff" stroke-width="3"/>` +
          `<path d="${dot(-14, 104, 3)}${dot(6, 98, 3)}${dot(18, 114, 3)}${dot(-26, 120, 3)}${dot(-2, 118, 3)}" fill="#c5f0ea"/>`),
    },
    { id: 'fireflylamp', name: 'Jar of fireflies', price: 60,
      draw: () => {
        const jar = 'M-26 88 Q-30 92 -30 104 V150 Q-30 164 -16 164 H16 Q30 164 30 150 V104 Q30 92 26 88 Z';
        const flies = [[-14, 116], [10, 108], [2, 132], [-10, 146], [16, 140], [-18, 132]];
        return cap('#c98b52', 14) +
          flip('an-sway', '<circle cx="0" cy="126" r="54" fill="#fff4a0" opacity="0.22"/>' + cord(72, '#a8743e', 3) +
            `<path d="${jar}" fill="#e3f5ff"/>` +
            '<path d="M-26 162 Q-22 138 -16 162 M-10 162 Q-4 132 2 162 M10 162 Q16 142 24 162" fill="#6fcf6a" stroke="#3f9b5c" stroke-width="1.5"/>' +
            flies.map(([x, y], i) => `<g class="an-float an-d${i % 4 + 1}"><g class="an-twinkle an-d${(i + 2) % 4 + 1}">` +
              `<circle cx="${x}" cy="${y}" r="7" fill="#fff36b" opacity="0.45"/><circle cx="${x}" cy="${y}" r="3.5" fill="#fff36b" ${ln(1)}/></g></g>`).join('') +
            '<path d="M-21 104 V146" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.8"/>' +
            `<path d="${jar}" fill="none" ${ln()}/>` +
            `<rect x="-28" y="70" width="56" height="18" rx="4" fill="#c98b52" ${ln()}/><path d="M-28 79 H28" stroke="#a8743e" stroke-width="2.5"/>`);
      },
    },
    { id: 'strawstarlamp', name: 'Straw star mobile', price: 80,
      draw: () => {
        const strawStar = (x, y, r) => {
          let d = '';
          for (let i = 0; i < 4; i++) {
            const a = i * Math.PI / 4, c = r1(Math.cos(a) * r), s = r1(Math.sin(a) * r);
            d += `M${r1(x - c)} ${r1(y - s)}L${r1(x + c)} ${r1(y + s)}`;
          }
          return `<path d="${d}" stroke="${INK}" stroke-width="7.5" stroke-linecap="round"/><path d="${d}" stroke="#f2cf6b" stroke-width="3.5" stroke-linecap="round"/>` +
            `<circle cx="${x}" cy="${y}" r="${r1(r * 0.42)}" fill="none" stroke="#e0313d" stroke-width="2"/><circle cx="${x}" cy="${y}" r="3.5" fill="#e0313d" ${ln(1.5)}/>`;
        };
        return cap('#c98b52', 14) +
          flip('an-sway', `<path d="M0 4 L-60 44 M0 4 L60 44 M0 44 V94 M-58 44 V74 M58 44 V74" stroke="#e0313d" stroke-width="1.5"/>` +
            `<path d="M-66 44 H66" stroke="${INK}" stroke-width="7.5" stroke-linecap="round"/><path d="M-66 44 H66" stroke="#f2cf6b" stroke-width="3.5" stroke-linecap="round"/>` +
            `<g class="an-float">${strawStar(0, 122, 30)}</g><g class="an-float an-d2">${strawStar(-58, 92, 19)}</g>` +
            `<g class="an-float an-d4">${strawStar(58, 92, 19)}</g>` +
            `<path d="M-62 44 l-7 -5 v10 Z M62 44 l7 -5 v10 Z" fill="#e0313d" ${ln(1.5)}/>`);
      },
    },
    { id: 'crayfishlamp', name: 'Crayfish party lanterns', price: 100,
      draw: () => {
        const moon = (x, y, r, fill, rib) => `<rect x="${x - r * 0.4}" y="${y - r - 5}" width="${r * 0.8}" height="7" rx="2" fill="${INK}"/>` +
          `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${ln(2.5)}/>` +
          `<path d="M${x - r} ${y}H${x + r}M${r1(x - r * 0.87)} ${r1(y - r * 0.5)}H${r1(x + r * 0.87)}M${r1(x - r * 0.87)} ${r1(y + r * 0.5)}H${r1(x + r * 0.87)}" stroke="${rib}" stroke-width="1.5" opacity="0.7"/>` +
          smile(x, y, r / 24) + `<rect x="${x - r * 0.4}" y="${y + r - 2}" width="${r * 0.8}" height="7" rx="2" fill="${INK}"/>`;
        // A little crayfish dangling under the big lantern.
        const cray = `<path d="M0 148 V156" stroke="${INK}" stroke-width="1.5"/>` +
          `<path d="M-5 160 L-12 150 M5 160 L12 150" stroke="${INK}" stroke-width="2"/>` +
          `<path d="${dot(-12, 149, 3.5)}${dot(12, 149, 3.5)}" fill="#e8402a" ${ln(1.5)}/>` +
          `<path d="M0 182 L-6 186 H6 Z" fill="#e8402a" ${ln(1.5)}/>` +
          `<ellipse cx="0" cy="170" rx="6" ry="13" fill="#e8402a" ${ln(2)}/><path d="M-5 168 H5 M-5 174 H5" stroke="#b02a1a" stroke-width="1.5"/>` +
          `<path d="${dot(-2.5, 161, 1.2)}${dot(2.5, 161, 1.2)}" fill="${INK}"/>`;
        return cap('#c98b52', 14) +
          flip('an-sway', '<circle class="an-glow" cx="0" cy="104" r="70" fill="#ffd27a" opacity="0.25"/>' + cord(34, INK, 2.5) +
            `<path d="M0 36 V74 M-54 36 V62 M54 36 V62" stroke="${INK}" stroke-width="1.5"/>` +
            `<path d="M-66 36 H66" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M-66 36 H66" stroke="#d9b36a" stroke-width="3" stroke-linecap="round"/>` +
            moon(-54, 84, 20, '#ffcf3f', '#e0a21b') + moon(54, 84, 20, '#ffcf3f', '#e0a21b') + cray + moon(0, 112, 32, '#ff9a3d', '#e06d1a'));
      },
    },
    { id: 'batmobile', name: 'Bat mobile', price: 120,
      draw: () => {
        const bat = (x, y, s) => {
          const wing = k => `M${r1(x + k * 7 * s)} ${r1(y - 3 * s)}C${r1(x + k * 16 * s)} ${r1(y - 14 * s)} ${r1(x + k * 28 * s)} ${r1(y - 10 * s)} ${r1(x + k * 32 * s)} ${r1(y - 4 * s)}` +
            `Q${r1(x + k * 26 * s)} ${r1(y - 2 * s)} ${r1(x + k * 24 * s)} ${r1(y + 4 * s)}Q${r1(x + k * 18 * s)} ${y} ${r1(x + k * 14 * s)} ${r1(y + 5 * s)}Q${r1(x + k * 10 * s)} ${y} ${r1(x + k * 6 * s)} ${r1(y + 4 * s)}Z`;
          return `<path d="${wing(-1)}${wing(1)}" fill="#5a4683" ${ln(2)}/>` +
            `<path d="M${r1(x - 8 * s)} ${r1(y - 4 * s)}L${r1(x - 7 * s)} ${r1(y - 15 * s)}L${r1(x - 2 * s)} ${r1(y - 8 * s)}M${r1(x + 8 * s)} ${r1(y - 4 * s)}L${r1(x + 7 * s)} ${r1(y - 15 * s)}L${r1(x + 2 * s)} ${r1(y - 8 * s)}" fill="#5a4683" ${ln(2)}/>` +
            `<ellipse cx="${x}" cy="${y}" rx="${r1(10 * s)}" ry="${r1(10 * s)}" fill="#5a4683" ${ln(2)}/>` +
            `<path d="${dot(x - 3.5 * s, y - 2 * s, 2.6 * s)}${dot(x + 3.5 * s, y - 2 * s, 2.6 * s)}" fill="#fff"/>` +
            `<path d="${dot(x - 3.5 * s, y - 1.5 * s, 1.2 * s)}${dot(x + 3.5 * s, y - 1.5 * s, 1.2 * s)}" fill="${INK}"/>` +
            `<path d="M${r1(x - 2 * s)} ${r1(y + 4 * s)}l${r1(1 * s)} ${r1(3 * s)}l${r1(1 * s)} ${r1(-3 * s)}" fill="#fff"/>` +
            `<path d="${dot(x - 6.5 * s, y + 3 * s, 1.8 * s)}${dot(x + 6.5 * s, y + 3 * s, 1.8 * s)}" fill="#ff9fb8"/>`;
        };
        const moonD = 'M0 72 A26 26 0 1 0 0 124 A20 26 0 1 1 0 72 Z';
        return cap('#5a4683', 14) +
          flip('an-sway', '<circle class="an-glow" cx="0" cy="98" r="44" fill="#fff1a0" opacity="0.3"/>' +
            `<path d="M0 4 L-60 40 M0 4 L60 40 M0 40 V72 M-58 40 V80 M58 40 V88 M-6 120 V150" stroke="${INK}" stroke-width="1.5"/>` +
            `<path d="M-66 40 Q0 32 66 40" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M-66 40 Q0 32 66 40" fill="none" stroke="#8a6a4a" stroke-width="3" stroke-linecap="round"/>` +
            `<g transform="translate(14 0)"><path d="${moonD}" fill="#ffe680" ${ln(2.5)}/></g>` +
            `<circle cx="-2" cy="88" r="2" fill="${INK}"/><path d="M-6 104 q4 4 8 1" fill="none" ${ln(1.5)}/>` +
            `<g class="an-float">${bat(-58, 86, 0.9)}</g><g class="an-float an-d2">${bat(58, 94, 0.9)}</g><g class="an-float an-d4">${bat(-6, 156, 0.8)}</g>`);
      },
    },
    { id: 'lantern', name: 'Paper lantern', price: 150,
      draw: () => `<rect x="-6" y="-2" width="12" height="6" rx="2" fill="#ffcf3f" ${ln(2)}/>` +
        flip('an-sway', '<circle cx="0" cy="114" r="60" fill="#ffd0a0" opacity="0.25"/>' +
          `<path d="M0 4 V68" stroke="${INK}" stroke-width="2.5"/>` +
          `<ellipse cx="0" cy="114" rx="46" ry="42" fill="#ff6b81" ${ln()}/>` +
          '<path d="M0 73 V155 M-22 75 Q-40 114 -22 153 M22 75 Q40 114 22 153 M-38 90 Q-50 114 -38 138 M38 90 Q50 114 38 138" fill="none" stroke="#e0475f" stroke-width="2"/>' +
          '<ellipse cx="-18" cy="98" rx="6" ry="10" fill="#fff" opacity="0.5"/>' +
          `<path d="${star(0, 116, 10, 0.5)}" fill="#ffe066" ${ln(1.5)}/>` +
          `<rect x="-14" y="66" width="28" height="9" rx="2" fill="#ffcf3f" ${ln(2)}/><rect x="-12" y="153" width="24" height="8" rx="2" fill="#ffcf3f" ${ln(2)}/>` +
          '<path d="M-4 162 L-6 182 M0 162 V184 M4 162 L6 182" stroke="#ff4f6a" stroke-width="3" stroke-linecap="round"/>' +
          `<circle cx="0" cy="164" r="3.5" fill="#ffcf3f" ${ln(1.5)}/>`),
    },
    { id: 'cloudlamp', name: 'Rain cloud lamp', price: 200,
      draw: () => {
        const cl = `${dot(-36, 104, 18)}${dot(-14, 88, 25)}${dot(14, 84, 27)}${dot(38, 102, 19)}M-36 104V122H38V104Z`;
        const drop = (x, y) => `M${x} ${y - 7}Q${x + 5} ${y}${x + 5} ${y + 3}A5 5 0 0 1 ${x - 5} ${y + 3}Q${x - 5} ${y} ${x} ${y - 7}Z`;
        return cap('#fff', 14) +
          flip('an-sway', '<circle class="an-glow" cx="0" cy="104" r="64" fill="#cfe9ff" opacity="0.35"/>' + cord(62, INK, 2.5) +
            [-30, -14, 2, 18, 32].map((x, i) => `<path class="an-fall an-d${i % 4 + 1}" d="${drop(x, 150 + (i % 2) * 6)}" fill="#6ec3ff" ${ln(1.5)}/>`).join('') +
            blob(cl, '#f6fbff') + '<path d="M-26 94 Q-16 74 0 74" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>' +
            '<ellipse cx="0" cy="116" rx="40" ry="5" fill="#d6e8f7"/>' + smile(0, 104, 1.1));
      },
    },
    { id: 'pumpkinlamp', name: 'Jack-o\'-lantern lamp', price: 250,
      draw: () => {
        const face = 'M-24 102 L-12 90 L-6 106 Z M24 102 L12 90 L6 106 Z M-4 114 L0 108 L4 114 Z ' +
          'M-26 122 Q0 150 26 122 Q20 124 14 122 L12 130 L6 126 Q0 128 -6 126 L-12 130 L-14 122 Q-20 124 -26 122 Z';
        return `<rect x="-8" y="-2" width="16" height="7" rx="2" fill="#6b6b7d" ${ln(2)}/>` +
          flip('an-sway', '<circle class="an-glow" cx="0" cy="118" r="64" fill="#ffb347" opacity="0.35"/>' +
            `<path d="M0 4 V58" stroke="#6b6b7d" stroke-width="4" stroke-dasharray="5 3"/>` +
            `<path d="M-24 88 Q-22 54 0 58 Q22 54 24 88" fill="none" ${ln(3)}/>` +
            `<ellipse cx="-24" cy="120" rx="24" ry="36" fill="#ff8c1a" ${ln()}/><ellipse cx="24" cy="120" rx="24" ry="36" fill="#ff8c1a" ${ln()}/>` +
            `<ellipse cx="0" cy="118" rx="26" ry="40" fill="#ffa033" ${ln()}/>` +
            `<path d="M-2 80 Q-4 70 2 66 L7 68 Q2 74 4 80 Z" fill="#5c9b3c" ${ln(2)}/><path d="M4 70 Q14 62 18 70" fill="none" stroke="#5c9b3c" stroke-width="2.5"/>` +
            `<path d="${face}" fill="#a2420a" ${ln(2)}/><path class="an-glow" d="${face}" fill="#ffe066"/>` +
            '<path d="M-36 102 Q-40 118 -36 134" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.5"/>');
      },
    },
    { id: 'adventstarlamp', name: 'Advent star', price: 300,
      draw: () => {
        const cy = 118, R = 56, k = 0.45, P = (a, r) => [r1(Math.cos(a) * r), r1(cy + Math.sin(a) * r)];
        let facets = '', holes = '';
        for (let i = 0; i < 5; i++) {
          const a = -Math.PI / 2 + i * 2 * Math.PI / 5, [tx, ty] = P(a, R), [lx, ly] = P(a - Math.PI / 5, R * k), [rx, ry] = P(a + Math.PI / 5, R * k);
          facets += `<path d="M0 ${cy}L${lx} ${ly}L${tx} ${ty}Z" fill="#ff5a5f"/><path d="M0 ${cy}L${tx} ${ty}L${rx} ${ry}Z" fill="#c9232c"/>`;
          const [hx, hy] = P(a, R * 0.55), [gx, gy] = P(a, R * 0.8);
          holes += dot(hx, hy, 4) + dot(gx, gy, 2.5);
        }
        return cap('#fff', 14) +
          flip('an-sway', `<circle class="an-glow" cx="0" cy="${cy}" r="76" fill="#fff1a0" opacity="0.35"/>` + cord(64, '#fff', 3) +
            `<path d="M0 4 V64" stroke="${INK}" stroke-width="1" opacity="0.5"/>` + facets +
            `<path d="${star(0, cy, R, k)}" fill="none" ${ln()}/><path d="${holes}" fill="#a81b22"/>` +
            `<path class="an-glow" d="${holes}" fill="#fff3a0"/><circle class="an-glow" cx="0" cy="${cy}" r="8" fill="#fff3a0" ${ln(1.5)}/>` +
            `<path d="M-6 ${cy + 30} L-8 ${cy + 60} M6 ${cy + 30} L8 ${cy + 60} M0 ${cy + 30} V${cy + 64}" stroke="#e0313d" stroke-width="2.5" stroke-linecap="round"/>`);
      },
    },
    { id: 'fairylightlamp', name: 'Fairy lights', price: 400,
      box: '-184 -8 368 150',
      draw: () => {
        const cl = ['#ff5d6c', '#ffd23f', '#6fdc6a', '#5cb8ff', '#ff8fd0'];
        let wire = '', bulbs = '', n = 0;
        const bulb = (x, y) => {
          const c = cl[n % 5], d = n++ % 4 + 1;
          bulbs += `<g class="an-blink an-d${d}"><circle cx="${r1(x)}" cy="${r1(y + 12)}" r="10" fill="${c}" opacity="0.3"/>` +
            `<ellipse cx="${r1(x)}" cy="${r1(y + 12)}" rx="4.5" ry="7" fill="${c}" ${ln(1.5)}/></g>`;
        };
        const xs = [-172, -86, 0, 86, 172];
        for (let k = 0; k < 4; k++) {
          const x0 = xs[k], m = x0 + 43, L = k % 3 ? 70 : 46;
          wire += `M${x0} 4Q${m} 84 ${x0 + 86} 4M${m} 44V${44 + L - 14}`;
          for (const t of [0.22, 0.78]) bulb(x0 + 86 * t, 4 + 80 * 2 * t * (1 - t));
          for (let y = 44; y < 44 + L - 10; y += 24) bulb(m, y);
        }
        return `<path d="${wire}" fill="none" stroke="#3f6b4a" stroke-width="2"/>` + bulbs +
          `<path d="${xs.map(x => dot(x, 4, 4)).join('')}" fill="#fff" ${ln(1.5)}/>`;
      },
    },
    { id: 'luciaringlamp', name: 'Lucia candle ring', price: 500,
      draw: () => {
        const ring = 'M-72 140A72 20 0 1 0 72 140A72 20 0 1 0 -72 140Z';
        let berries = '';
        for (let i = 0; i < 18; i++) {
          const a = i * Math.PI / 9, x = r1(Math.cos(a) * 72), y = r1(140 + Math.sin(a) * 20);
          if (i % 3 === 1) berries += dot(r1(x + 4), r1(y - 2), 2.6);
        }
        const candles = Array.from({ length: 7 }, (_, k) => -Math.PI / 2 + k * 2 * Math.PI / 7)
          .map(a => [r1(Math.cos(a) * 66), r1(138 + Math.sin(a) * 17)]).sort((p, q) => p[1] - q[1]);
        return `<rect x="-10" y="-2" width="20" height="8" rx="2" fill="#ffcf3f" ${ln(2)}/>` +
          flip('an-sway', '<ellipse class="an-glow" cx="0" cy="112" rx="94" ry="66" fill="#fff1a8" opacity="0.28"/>' +
            `<path d="M0 6 L-68 138 M0 6 L68 138 M0 6 V122" stroke="#e0a21b" stroke-width="2.5" stroke-dasharray="4 2"/>` +
            `<path d="${ring}" fill="none" stroke="${INK}" stroke-width="18"/><path d="${ring}" fill="none" stroke="#2f7a46" stroke-width="12"/>` +
            `<path d="${ring}" fill="none" stroke="#5cbf7a" stroke-width="7" stroke-dasharray="9 7"/><path d="${berries}" fill="#e0313d" ${ln(1)}/>` +
            candles.map(([x, y]) => `<rect x="${x - 4}" y="${y - 24}" width="8" height="24" rx="2" fill="#fffaf0" ${ln(2)}/>` + flame(x, y - 25, 0.75)).join(''));
      },
    },
    { id: 'planetlamp', name: 'Planet mobile', price: 600,
      draw: () => {
        const cy = 110;
        return `<rect x="-8" y="-2" width="16" height="7" rx="2" fill="#6b9bff" ${ln(2)}/>` + cord(90, INK, 2.5) +
          `<circle class="an-glow" cx="0" cy="${cy}" r="42" fill="#ffe680" opacity="0.35"/>` +
          `<circle cx="0" cy="${cy}" r="60" fill="none" stroke="#9a8cd8" stroke-width="1.5" stroke-dasharray="4 5"/>` +
          `<circle cx="0" cy="${cy}" r="22" fill="#ffcf3f" ${ln()}/>` + smile(0, cy + 1, 0.85) +
          `<g>${spin(0, cy, 18)}` +
          `<circle cx="60" cy="${cy}" r="11" fill="#5cb8ff" ${ln(2)}/><path d="M54 ${cy - 4} q4 -4 8 0 q2 6 -4 8 Z M62 ${cy + 4} q4 0 4 3 q-4 2 -6 -1 Z" fill="#6fdc6a"/>` +
          `<circle cx="0" cy="${cy + 60}" r="8" fill="#ff7a5c" ${ln(2)}/><path d="${dot(-2, cy + 58, 2)}${dot(3, cy + 63, 1.5)}" fill="#d9543a"/>` +
          `<ellipse cx="-60" cy="${cy}" rx="19" ry="5" fill="none" stroke="${INK}" stroke-width="5"/><ellipse cx="-60" cy="${cy}" rx="19" ry="5" fill="none" stroke="#e8c27a" stroke-width="2.5"/>` +
          `<circle cx="-60" cy="${cy}" r="10" fill="#f0b45a" ${ln(2)}/><path d="M-69 ${cy - 3} H-51" stroke="#d48a3a" stroke-width="2"/>` +
          `<path d="M-79 ${cy} A19 5 0 0 0 -41 ${cy}" fill="none" stroke="#e8c27a" stroke-width="2.5"/>` +
          `<circle cx="0" cy="${cy - 60}" r="9" fill="#b38cff" ${ln(2)}/><path d="M-8 ${cy - 62} H8 M-7 ${cy - 57} H7" stroke="#8a62e0" stroke-width="2"/>` +
          `<circle cx="66" cy="${cy}" r="66" fill="none"/></g>` +
          `<path class="an-twinkle" d="${star(-70, 54, 6)}" fill="#ffe066" ${ln(1)}/><path class="an-twinkle an-d2" d="${star(72, 168, 5)}" fill="#ffe066" ${ln(1)}/>` +
          `<path class="an-twinkle an-d3" d="${star(70, 50, 4)}" fill="#ffe066" ${ln(1)}/><path class="an-twinkle an-d4" d="${star(-74, 164, 5)}" fill="#ffe066" ${ln(1)}/>`;
      },
    },
    { id: 'discoball', name: 'Disco ball', price: 800,
      box: '-140 -4 280 196',
      draw: () => {
        const cl = ['#ff7ad9', '#6ef0ff', '#ffe066', '#8dff8a', '#b38cff'];
        const spots = [[-340, 40], [-280, 150], [-215, 70], [-150, 236], [-110, 30], [-120, 130], [130, 30], [110, 140], [190, 210],
          [260, 100], [330, 40], [350, 230], [-330, 270], [-60, 300], [70, 296], [240, 296]];
        let h = spots.map(([x, y], i) => `<ellipse class="an-twinkle" cx="${x}" cy="${y}" rx="9" ry="7" fill="${cl[i % 5]}" opacity="0.8"/>`).join('');
        h += `<path d="M0 0 V72" stroke="#8e8ea6" stroke-width="3"/><rect x="-6" y="64" width="12" height="9" fill="#8e8ea6" ${ln(2)}/>`;
        let grid = 'M0 72 V154';
        for (let k = -3; k <= 3; k++) { const y = 113 + k * 11.5, w = r1(Math.sqrt(41 * 41 - (k * 11.5) ** 2)); grid += `M${-w} ${y}H${w}`; }
        for (const rx of [15, 29]) grid += `M0 72A${rx} 41 0 0 0 0 154M0 72A${rx} 41 0 0 1 0 154`;
        let fac = '';
        for (let i = 0; i < 16; i++) {
          const a = i * 2.4, rr = 6 + (i * 7) % 28, x = r1(Math.cos(a) * rr), y = r1(113 + Math.sin(a) * rr);
          fac += `<rect x="${x - 5}" y="${y - 5}" width="10" height="10" fill="${i % 3 ? cl[i % 5] : '#fff'}"/>`;
        }
        return h + `<circle cx="0" cy="113" r="41" fill="#c9d1e3" ${ln()}/>` +
          `<g class="an-spin"><circle cx="0" cy="113" r="38" fill="none"/>${fac}</g>` +
          `<path d="${grid}" fill="none" stroke="#7d86a3" stroke-width="1.5"/>` +
          `<circle cx="0" cy="113" r="41" fill="none" ${ln()}/><ellipse cx="-16" cy="96" rx="9" ry="6" fill="#fff" opacity="0.8"/>`;
      },
    },
    { id: 'lavalamp', name: 'Lava globe lamp', price: 1000,
      draw: () => {
        const blobs = [[-14, 102, 12, 10, '#ff6fae'], [16, 126, 14, 11, '#ffa94d'], [-10, 140, 9, 7, '#ffa94d'], [18, 98, 7, 6, '#ffa94d'], [-2, 120, 8, 8, '#ff6fae']];
        return cap('#ffcf3f', 16) + chain(60) +
          '<circle class="an-glow" cx="0" cy="116" r="70" fill="#c79bff" opacity="0.28"/>' +
          `<circle cx="0" cy="116" r="48" fill="#5b3fc4" ${ln()}/>` +
          blobs.map(([x, y, rx, ry, c], i) => `<ellipse class="an-float an-d${i % 4 + 1}" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}"/>`).join('') +
          '<ellipse cx="-24" cy="96" rx="7" ry="12" fill="#fff" opacity="0.45" transform="rotate(30 -24 96)"/>' +
          `<path d="M-18 70 H18 L14 60 H-14 Z" fill="#ffcf3f" ${ln(2)}/><path d="M-16 162 H16 L10 172 H-10 Z" fill="#ffcf3f" ${ln(2)}/>` +
          gem(0, 179, 6, '#ff9fd0') + sparkle(-50, 74, 7) + sparkle(52, 150, 7);
      },
    },
    { id: 'auroralamp', name: 'Northern lights lamp', price: 1200,
      draw: () => {
        const dome = 'M-64 150 C-64 96 -36 66 0 66 C36 66 64 96 64 150 Z';
        return cap('#ffcf3f', 16) + chain(66) +
          '<path class="an-glow" d="M-58 156 L58 156 L84 186 L-84 186 Z" fill="#8dffc6" opacity="0.3"/>' +
          `<path d="${dome}" fill="#1f2a6b"/>` +
          '<path class="an-glow" d="M-54 132 Q-30 104 -8 122 Q14 138 34 112 Q46 98 56 106" fill="none" stroke="#6dffb0" stroke-width="7" stroke-linecap="round" opacity="0.9"/>' +
          '<path class="an-glow an-d2" d="M-50 116 Q-28 96 -6 108 Q16 120 32 96 Q42 86 50 92" fill="none" stroke="#5ce1e6" stroke-width="5" stroke-linecap="round" opacity="0.85"/>' +
          '<path class="an-glow an-d4" d="M-56 142 Q-26 126 0 138 Q26 148 58 128" fill="none" stroke="#c58cff" stroke-width="5" stroke-linecap="round" opacity="0.8"/>' +
          [[-26, 84], [10, 80], [32, 90], [-40, 100], [-4, 94]].map(([x, y], i) => `<circle class="an-twinkle an-d${i % 4 + 1}" cx="${x}" cy="${y}" r="2.2" fill="#fff"/>`).join('') +
          `<path d="${dome}" fill="none" ${ln()}/>` +
          `<ellipse cx="0" cy="160" rx="13" ry="8" fill="#e6fff2" ${ln(2)}/>` +
          `<rect x="-70" y="146" width="140" height="10" rx="4" fill="#ffcf3f" ${ln(2.5)}/><circle cx="0" cy="66" r="6" fill="#ffcf3f" ${ln(2)}/>` +
          sparkle(-72, 120, 7) + sparkle(74, 96, 6);
      },
    },
    { id: 'sunlamp', name: 'Golden sun lamp', gems: 15,
      box: '-100 -4 200 192',
      draw: () => {
        const cy = 116;
        let rays = '';
        for (let i = 0; i < 12; i++) {
          const a = i * Math.PI / 6, R = i % 2 ? 54 : 64, w = 0.2;
          const p = (an, r) => `${r1(Math.cos(an) * r)} ${r1(cy + Math.sin(an) * r)}`;
          rays += `<path d="M${p(a - w, 34)}L${p(a, R)}L${p(a + w, 34)}Z" fill="${i % 2 ? '#ffa62b' : '#ffcf3f'}" ${ln(2)}/>`;
        }
        return cap('#ffcf3f', 18) + chain(52) +
          `<circle class="an-glow" cx="0" cy="${cy}" r="80" fill="#ffe680" opacity="0.3"/>` +
          `<g>${spin(0, cy, 24)}${rays}</g>` +
          `<circle cx="0" cy="${cy}" r="38" fill="#ffd23f" ${ln()}/><circle cx="0" cy="${cy}" r="29" fill="#ffe680"/>` +
          smile(0, cy, 1.4) + '<ellipse cx="-16" cy="100" rx="6" ry="4" fill="#fff" opacity="0.8"/>' +
          sparkle(-76, 60, 8) + sparkle(76, 70, 7) + sparkle(-70, 170, 7) + sparkle(72, 164, 8);
      },
    },
    { id: 'chandelier', name: 'Crystal chandelier', gems: 25,
      box: '-100 -4 200 192',
      draw: () => {
        const cups = [[-74, 100], [-36, 112], [36, 112], [74, 100]];
        let h = '<circle cx="0" cy="112" r="72" fill="#fff1a8" opacity="0.25"/>' +
          `<path d="M0 0 V60" stroke="#e0a21b" stroke-width="4"/><path d="M-12 2 H12 L6 10 H-6 Z" fill="#ffcf3f" ${ln(2)}/>`;
        h += cups.map(([x, y]) => tube(`M0 ${x < 0 ? 112 : 112} Q${x * 0.6} ${y + 34} ${x} ${y}`, '#ffcf3f', 5)).join('');
        h += `<ellipse cx="0" cy="98" rx="15" ry="26" fill="#ffcf3f" ${ln()}/><circle cx="0" cy="64" r="6" fill="#ffcf3f" ${ln(2)}/>` +
          '<ellipse cx="-5" cy="88" rx="3.5" ry="9" fill="#fff" opacity="0.7"/>';
        for (const [x, y] of [[-56, 128], [-20, 138], [20, 138], [56, 128]]) h += `<path d="M${x} ${y - 10}V${y - 6}" ${ln(1.5)}/>` + gem(x, y, 7, '#bdf3ff');
        h += `<path d="M0 124 V132" ${ln(1.5)}/>` + gem(0, 146, 12, '#bdf3ff') + `<path d="M0 158 V166" ${ln(1.5)}/>` + gem(0, 174, 7, '#ff9fd0');
        for (const [x, y] of cups) {
          h += `<rect x="${x - 4}" y="${y - 22}" width="8" height="22" rx="2" fill="#fffaf0" ${ln(2)}/>` + flame(x, y - 23, 0.85) +
            `<ellipse cx="${x}" cy="${y}" rx="10" ry="4" fill="#ffcf3f" ${ln(2)}/>`;
        }
        return h + sparkle(-58, 70, 8) + sparkle(56, 66, 7) + sparkle(-34, 160, 7) + sparkle(36, 162, 8) + sparkle(0, 40, 6);
      },
    },
    { id: 'prismlamp', name: 'Rainbow crystal lamp', gems: 40,
      box: '-130 -4 260 196',
      draw: () => {
        const rb = ['#ff5d6c', '#ff9a3d', '#ffd23f', '#6fdc6a', '#5cb8ff', '#8a7dff', '#d07aff'];
        const spots = [[-330, 50], [-250, 160], [-190, 60], [-140, 250], [-120, 120], [120, 40], [130, 150], [200, 240],
          [250, 80], [320, 170], [-320, 280], [340, 290], [-80, 30], [90, 300], [-250, 300]];
        const sd = (x, y, s) => `M${x} ${y - 9 * s}L${x + 6 * s} ${y}L${x} ${y + 9 * s}L${x - 6 * s} ${y}Z`;
        let h = spots.map(([x, y], i) => `<path class="an-twinkle an-d${i % 4 + 1}" d="${sd(x, y, 1 + (i % 3) * 0.25)}" fill="${rb[i % 7]}" opacity="0.75"/>`).join('');
        const T = 66, G = 104, B = 176, W = 32;
        const crystal = `<path d="M0 ${T}L${-W} ${G}L0 ${B}Z" fill="#bfeaff"/><path d="M0 ${T}L${W} ${G}L0 ${B}Z" fill="#effbff"/>` +
          `<path d="M0 ${T}L${-W} ${G}H${W}Z" fill="#dff6ff"/>` +
          rb.map((c, i) => `<path d="M${-W + 9 + i * 3} ${G + 6 + i * 4}L${-4 + i * 2} ${G + 10 + i * 4}" stroke="${c}" stroke-width="3" opacity="0.7"/>`).join('') +
          `<path d="M0 ${T}L${-W} ${G}L0 ${B}L${W} ${G}Z M${-W} ${G}H${W} M0 ${T}L-10 ${G}L0 ${B}L10 ${G}Z" fill="none" ${ln(2.5)}/>`;
        const drops = [[-48, 112, 8, '#ffd6f0'], [48, 112, 8, '#d6fff0'], [-30, 150, 6, '#fff3b0'], [30, 150, 6, '#d6e8ff']];
        h += cap('#ffcf3f', 16) + flip('an-sway', '<circle class="an-glow" cx="0" cy="116" r="74" fill="#fff" opacity="0.3"/>' + chain(56) +
          `<path d="${drops.map(([x, y, s]) => `M${x * 0.7} 64L${x} ${y - s}`).join('')}" stroke="#e0a21b" stroke-width="1.5"/>` +
          `<ellipse cx="0" cy="62" rx="40" ry="7" fill="#ffcf3f" ${ln(2)}/>` +
          drops.map(([x, y, s, c]) => gem(x, y, s, c)).join('') + crystal +
          '<path d="M-14 82 L-22 98" stroke="#fff" stroke-width="3" stroke-linecap="round"/>');
        return h + sparkle(-62, 150, 8) + sparkle(64, 70, 8) + sparkle(-70, 40, 6) + sparkle(14, 186, 6);
      },
    },
    { id: 'phoenixlamp', name: 'Phoenix lamp', gems: 60,
      box: '-110 -4 220 196',
      draw: () => {
        const wing = s => {
          const X = v => s * v;
          const outer = `M${X(-8)} 98C${X(-30)} 70 ${X(-60)} 56 ${X(-86)} 52C${X(-80)} 62 ${X(-82)} 68 ${X(-76)} 74C${X(-82)} 78 ${X(-80)} 86 ${X(-72)} 88` +
            `C${X(-76)} 94 ${X(-72)} 100 ${X(-63)} 100C${X(-63)} 108 ${X(-55)} 112 ${X(-46)} 110C${X(-40)} 118 ${X(-28)} 118 ${X(-10)} 116Z`;
          const inner = `M${X(-10)} 102C${X(-30)} 82 ${X(-54)} 70 ${X(-72)} 66C${X(-62)} 82 ${X(-48)} 98 ${X(-12)} 112Z`;
          return `<g><animateTransform attributeName="transform" type="rotate" values="0 ${X(-8)} 104;${s * 9} ${X(-8)} 104;0 ${X(-8)} 104" dur="1.8s" repeatCount="indefinite"/>` +
            `<path d="${outer}" fill="#ff5a3d" ${ln()}/><path d="${inner}" fill="#ffcf3f"/>` +
            `<path d="M${X(-30)} 104 L${X(-56)} 88 M${X(-26)} 110 L${X(-48)} 104" stroke="#ff8c1a" stroke-width="2.5" stroke-linecap="round"/>` +
            flame(X(-84), 54, 0.7) + '</g>';
        };
        const tail = (x, y, a, c) => `<g transform="rotate(${a} 0 124)"><path d="M0 124 C-10 140 -10 ${y - 14} 0 ${y} C10 ${y - 14} 10 140 0 124Z" fill="${c}" ${ln(2.5)}/>` +
          `<circle cx="0" cy="${y - 12}" r="4" fill="#ffe680" ${ln(1.5)}/></g>`;
        return cap('#ffcf3f', 18) + chain(64) +
          '<circle class="an-glow" cx="0" cy="112" r="84" fill="#ffb347" opacity="0.3"/>' +
          tail(0, 178, 24, '#ff5a3d') + tail(0, 178, -24, '#ff5a3d') + tail(0, 184, 0, '#ffa62b') +
          wing(1) + wing(-1) +
          `<ellipse cx="0" cy="112" rx="14" ry="20" fill="#ff8c1a" ${ln()}/><path d="M-7 104 Q0 128 7 104" fill="#ffcf3f"/>` +
          flame(-7, 76, 0.6) + flame(0, 73, 0.75) + flame(7, 76, 0.6) +
          `<circle cx="0" cy="86" r="12" fill="#ffa62b" ${ln()}/><path d="M-4 92 L0 100 L4 92 Z" fill="#ffcf3f" ${ln(1.5)}/>` +
          `<path d="M-7 84q3 -4 6 0M1 84q3 -4 6 0" fill="none" ${ln(2)}/>` +
          [[-40, 64], [40, 66], [-20, 50], [24, 48]].map(([x, y], i) => `<circle class="an-rise an-d${i + 1}" cx="${x}" cy="${y}" r="3" fill="#ffd23f" ${ln(1)}/>`).join('') +
          `<path d="${dot(0, 54, 4)}" fill="#ffcf3f" ${ln(2)}/>` +
          sparkle(-80, 130, 8) + sparkle(80, 128, 8) + sparkle(-50, 168, 6) + sparkle(52, 170, 6);
      },
    },
  ]);
})();
