// Star level badges: an SVG star per level (STAR_TIERS) in its material — wood grain, stone speckles,
// metal shine, gem facets, a twinkling diamond. Gradients live once in a hidden <svg> of shared defs.

const Stars = (() => {
  const CX = 12, CY = 12.9, R = 11, IR = 4.7;
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? IR : R;
    return [CX + Math.cos(a) * r, CY + Math.sin(a) * r].map(v => Math.round(v * 100) / 100);
  });
  const PATH = 'M' + pts.map(p => p.join(' ')).join(' L') + ' Z';

  const KIND = {
    wood: dark => [7, 11.5, 16, 20].map((y, i) =>
      `<path d="M0 ${y} Q6 ${y - 1.6 + i % 2} 12 ${y} T24 ${y}" fill="none" stroke="${dark}" stroke-width="0.7" opacity="0.5"/>`).join('') +
      `<ellipse cx="14" cy="13.5" rx="1.6" ry="1" fill="none" stroke="${dark}" stroke-width="0.6" opacity="0.6"/>`,
    stone: dark => [[8, 9, 1], [15, 11, 0.8], [11, 16, 1.1], [16.5, 17, 0.7], [6.5, 15, 0.7], [12, 6, 0.6]]
      .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${dark}" opacity="0.45"/>`).join('') +
      '<circle cx="13.5" cy="8.5" r="0.7" fill="#fff" opacity="0.5"/>',
    metal: () => '<ellipse cx="8.5" cy="9" rx="2.2" ry="6.5" transform="rotate(35 8.5 9)" fill="#fff" opacity="0.5"/>',
    gem: () => pts.map(([x, y]) => `<line x1="${CX}" y1="${CY}" x2="${x}" y2="${y}" stroke="#fff" stroke-width="0.5" opacity="0.5"/>`).join('') +
      `<path d="M${pts[0].join(' ')} L${pts[1].join(' ')} L${CX} ${CY} L${pts[9].join(' ')} Z" fill="#fff" opacity="0.3"/>`,
  };
  KIND.diamond = dark => KIND.gem(dark);
  const SPARK = '<path class="spark" d="M19.5 2 L20.3 4.2 L22.5 5 L20.3 5.8 L19.5 8 L18.7 5.8 L16.5 5 L18.7 4.2 Z" fill="#fff"/>';

  const tierOf = i => STAR_TIERS[Math.min(i, STAR_TIERS.length - 1)];
  const idOf = i => 'starGrad' + Math.min(i, STAR_TIERS.length - 1);

  // The shared gradients and clip path; called once on start.
  function init() {
    const defs = STAR_TIERS.map((t, i) =>
      `<linearGradient id="${idOf(i)}" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0" stop-color="${t.light}"/><stop offset="0.55" stop-color="${t.color}"/><stop offset="1" stop-color="${t.dark}"/></linearGradient>`).join('');
    const holder = document.createElement('div');
    holder.innerHTML = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${defs}` +
      `<clipPath id="starClip"><path d="${PATH}"/></clipPath></defs></svg>`;
    document.body.prepend(holder.firstChild);
  }

  // A star of level i (0-based). cls: size / state classes (small, goal, earned, huge, dim).
  function html(i, cls = '') {
    const t = tierOf(i);
    return `<svg class="star ${t.kind} ${cls}" viewBox="0 0 24 24" role="img"><title>${t.name} star</title>` +
      `<path d="${PATH}" fill="url(#${idOf(i)})"/>` +
      `<g clip-path="url(#starClip)">${KIND[t.kind](t.dark)}</g>` +
      `<path d="${PATH}" fill="none" stroke="${t.dark}" stroke-width="1.2" stroke-linejoin="round"/>` +
      (t.kind === 'diamond' ? SPARK : '') + '</svg>';
  }

  // The road of levels: earned stars bright, the next one marked, the rest dim; with names under each.
  function ladder(earned, next) {
    return '<div class="ladder">' + STAR_TIERS.map((t, i) => {
      const state = earned.includes(i) ? 'got' : i === next ? 'next' : 'later';
      return `<span class="rung ${state}">${html(i)}<small>${t.name}</small></span>`;
    }).join('') + '</div>';
  }

  return { init, html, ladder, tierOf };
})();
