// Look: a character as SVG — the shared body, its species parts (species.js), what it wears (WEAR_ART,
// items/clothes.js) and its face (mood or a reaction).
// Character coordinates (viewBox -10 -40 220 300, ground at y 252): head circle (100, 88) r 54; body ellipse (100, 182)
// 44 × 46; legs x 74–96 / 104–126 from y 205; feet ellipses (85, 245) / (115, 245) 15 × 8; arms 12 × 27 ellipses
// hanging from the shoulders, paws at (48, 200) / (152, 200) (arms up: (40, 119) / (160, 119)).
// Draw order: back item, tail / wings, legs, shoes, body, belly, outfit, neck item, arms, item in hand, ears / mane,
// head, face markings, eyes, nose, mouth, glasses, hat, reaction effects.

const Look = (() => {
  const FULL_BOX = '-10 -40 220 300';
  const HEAD_BOX = '22 -22 156 170';
  // Arms: [centre x, centre y, rotation°] of each 12 × 27 ellipse; the paw is 24 along it.
  const ARMS = {
    down: { l: [58, 178, 25], r: [142, 178, -25] },
    up: { l: [52, 140, 150], r: [148, 140, -150] },
  };
  const paw = ([x, y, rot]) => {
    const a = rot * Math.PI / 180;
    return [x - 24 * Math.sin(a), y + 24 * Math.cos(a)];
  };

  // Faces: eyes, brows, mouth and effects. Moods (by fullness) and reactions (to food, a tap, new clothes).
  const FACES = {
    happy: { eyes: 'open', mouth: 'smile' },
    ok: { eyes: 'open', mouth: 'small' },
    hungry: { eyes: 'open', brows: 'sad', mouth: 'frown' },
    starving: { eyes: 'open', brows: 'sad', mouth: 'frown', tear: true },
    love: { eyes: 'love', mouth: 'grin', arms: 'up' },
    yum: { eyes: 'happy', mouth: 'grin' },
    chew: { eyes: 'happy', mouth: 'chew' },
    bleh: { eyes: 'squint', mouth: 'tongue', tint: '#8fd35a' },
    sour: { eyes: 'squint', mouth: 'pucker', tint: '#e2ec4a' },
    spicy: { eyes: 'wide', mouth: 'o', tint: '#ff4f4f', steam: true },
    fire: { eyes: 'happy', mouth: 'fire', arms: 'up' },
    cold: { eyes: 'wide', mouth: 'teeth', tint: '#7ad7ff', shiver: true },
    sparkle: { eyes: 'stars', mouth: 'grin', arms: 'up' },
    full: { eyes: 'closed', mouth: 'smile' },
    giggle: { eyes: 'happy', mouth: 'grin', arms: 'up' },
    proud: { eyes: 'happy', mouth: 'grin' },
  };

  // The face for a fullness level.
  function moodOf(full) {
    return full >= FULL_HAPPY ? 'happy' : full >= FULL_HUNGRY ? 'ok' : full >= FULL_STARVING ? 'hungry' : 'starving';
  }

  const heart = (x, y, s) => `M${x} ${y + s * 0.9} C${x - s * 1.6} ${y - s * 0.2} ${x - s * 0.6} ${y - s * 1.3} ${x} ${y - s * 0.4} ` +
    `C${x + s * 0.6} ${y - s * 1.3} ${x + s * 1.6} ${y - s * 0.2} ${x} ${y + s * 0.9} Z`;
  function star(x, y, r) {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
      d += (i ? 'L' : 'M') + (x + Math.cos(a) * rr).toFixed(1) + ' ' + (y + Math.sin(a) * rr).toFixed(1);
    }
    return d + 'Z';
  }

  function eye(kind, x, sp, left) {
    const y = 90, c = sp.eyeWhite ? '#fff' : INK;
    switch (kind) {
      case 'happy': return `<path d="M${x - 8} ${y + 3} Q${x} ${y - 7} ${x + 8} ${y + 3}" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`;
      case 'closed': return `<path d="M${x - 8} ${y} Q${x} ${y + 5} ${x + 8} ${y}" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`;
      case 'love': return `<path d="${heart(x, y - 1, 8)}" fill="#ff4f7b" ${ln(2)}/>`;
      case 'stars': return `<path d="${star(x, y, 11)}" fill="#ffd23f" ${ln(2)}/>`;
      case 'squint': {
        const s = left ? 1 : -1;
        return `<path d="M${x - 7 * s} ${y - 7} L${x + 6 * s} ${y} L${x - 7 * s} ${y + 7}" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
      }
      case 'wide': return `<circle cx="${x}" cy="${y}" r="9.5" fill="#fff" ${ln(2)}/><circle cx="${x}" cy="${y}" r="4.5" fill="${INK}"/>`;
      default:
        return (sp.eyeWhite ? `<circle cx="${x}" cy="${y}" r="8" fill="#fff"/><ellipse cx="${x}" cy="${y + 0.5}" rx="4.8" ry="6" fill="${INK}"/>`
          : `<ellipse cx="${x}" cy="${y}" rx="6.5" ry="8.5" fill="${INK}"/>`) +
          `<circle cx="${x + 2.4}" cy="${y - 3}" r="2.4" fill="#fff"/>`;
    }
  }

  function mouth(kind, my) {
    const dark = '#8a2b45';
    switch (kind) {
      case 'smile': return `<path d="M90 ${my - 2} Q100 ${my + 8} 110 ${my - 2}" fill="none" ${ln()}/>`;
      case 'small': return `<path d="M94 ${my} Q100 ${my + 4} 106 ${my}" fill="none" ${ln()}/>`;
      case 'frown': return `<path d="M91 ${my + 5} Q100 ${my - 3} 109 ${my + 5}" fill="none" ${ln()}/>`;
      case 'grin': return `<path d="M88 ${my - 3} Q100 ${my + 18} 112 ${my - 3} Z" fill="${dark}" ${ln(2.5)}/>` +
        `<ellipse cx="100" cy="${my + 6}" rx="6" ry="3" fill="#ff8fa3"/>`;
      case 'tongue': return `<path d="M95 ${my + 1} Q95 ${my + 15} 100 ${my + 15} Q105 ${my + 15} 105 ${my + 1} Z" fill="#ff8fa3" ${ln(2)}/>` +
        `<path d="M87 ${my} Q93 ${my - 4} 100 ${my} Q107 ${my + 4} 113 ${my}" fill="none" ${ln()}/>`;
      case 'o': return `<ellipse cx="100" cy="${my + 3}" rx="6" ry="7" fill="${dark}" ${ln(2)}/>`;
      case 'chew': return `<ellipse class="lk-chew" cx="100" cy="${my + 2}" rx="8" ry="4.5" fill="${dark}" ${ln(2)}/>`;
      case 'pucker': return `<circle cx="100" cy="${my + 2}" r="4" fill="none" ${ln()}/>`;
      case 'teeth': return `<rect x="89" y="${my - 3}" width="22" height="10" rx="3" fill="#fff" ${ln(2)}/>` +
        `<path d="M96 ${my - 3} V${my + 7} M104 ${my - 3} V${my + 7}" ${ln(1.5)}/>`;
      case 'fire': return `<ellipse cx="100" cy="${my + 3}" rx="7" ry="8" fill="${dark}" ${ln(2)}/>` +
        `<g class="lk-fire"><path d="M106 ${my} C130 ${my - 22} 168 ${my - 30} 200 ${my - 8} C182 ${my + 2} 192 ${my + 20} 204 ${my + 30} ` +
        `C166 ${my + 32} 134 ${my + 18} 106 ${my + 8} Z" fill="#ff7a2b" ${ln(2)}/>` +
        `<path d="M110 ${my + 3} C134 ${my - 8} 160 ${my - 12} 180 ${my} C164 ${my + 8} 170 ${my + 16} 178 ${my + 20} C150 ${my + 18} 130 ${my + 12} 110 ${my + 6} Z" fill="#ffd23f"/></g>`;
      default: return '';
    }
  }

  // The character's inner SVG. equip: { slot: item id } (only the wear slots matter); face: a FACES name or object.
  function inner(charId, equip, face) {
    const sp = SPECIES[charId] || SPECIES.kitty;
    const f = typeof face === 'string' ? FACES[face] || FACES.happy : face || FACES.happy;
    const art = slot => { const id = equip && equip[slot]; return (id && typeof WEAR_ART !== 'undefined' && WEAR_ART[id]) || null; };
    const outfit = art('body');
    const fur = sp.fur;
    const armC = sp.arm || fur;
    const legC = (outfit && outfit.legs) || sp.leg || fur;
    const pose = ARMS[f.arms || 'down'];
    const my = 116 + (sp.mouthY || 0);
    let h = '';
    const back = art('back');
    if (back) h += back.draw();
    if (sp.back) h += sp.back();
    h += `<rect x="74" y="205" width="22" height="40" rx="10" fill="${legC}" ${ln()}/><rect x="104" y="205" width="22" height="40" rx="10" fill="${legC}" ${ln()}/>`;
    const shoes = art('feet');
    h += shoes ? shoes.draw() : `<ellipse cx="85" cy="245" rx="15" ry="8" fill="${sp.feet || legC}" ${ln()}/><ellipse cx="115" cy="245" rx="15" ry="8" fill="${sp.feet || legC}" ${ln()}/>`;
    h += `<ellipse cx="100" cy="182" rx="44" ry="46" fill="${fur}" ${ln()}/>`;
    if (sp.belly) h += `<ellipse cx="100" cy="190" rx="28" ry="30" fill="${sp.belly}"/>`;
    if (sp.tummy && !outfit) h += sp.tummy();
    if (outfit) h += outfit.draw();
    const neck = art('neck');
    if (neck) h += neck.draw();
    for (const side of ['l', 'r']) {
      const [x, y, rot] = pose[side];
      const sleeve = outfit && outfit.sleeve;
      h += `<ellipse cx="${x}" cy="${y}" rx="12" ry="27" transform="rotate(${rot} ${x} ${y})" fill="${sleeve || armC}" ${ln()}/>`;
      const [px, py] = paw(pose[side]);
      if (sleeve) h += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="10" fill="${armC}" ${ln()}/>`;
    }
    const held = art('hand');
    if (held) {
      const [px, py] = paw(pose.r);
      h += `<g transform="translate(${px.toFixed(1)} ${py.toFixed(1)})">${held.draw()}</g>` +
        `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="10" fill="${armC}" ${ln()}/>`;
    }
    if (sp.ears) h += sp.ears();
    h += `<circle cx="100" cy="88" r="54" fill="${fur}" ${ln()}/>`;
    if (sp.front) h += sp.front();
    if (sp.top) h += sp.top();
    if (f.tint) h += `<circle cx="100" cy="88" r="52" fill="${f.tint}" opacity="0.35"/>`;
    h += '<ellipse cx="68" cy="107" rx="8" ry="5" fill="#ff8fb0" opacity="0.55"/><ellipse cx="132" cy="107" rx="8" ry="5" fill="#ff8fb0" opacity="0.55"/>';
    h += `<g class="lk-eyes">${eye(f.eyes, 80, sp, true)}${eye(f.eyes, 120, sp, false)}</g>`;
    if (f.brows === 'sad') h += `<path d="M69 77 L87 70 M131 77 L113 70" ${ln(3.5)}/>`;
    if (sp.nose) h += sp.nose();
    h += mouth(f.mouth, my);
    if (f.tear) h += `<path class="lk-tear" d="M70 100 Q64 110 70 114 Q76 110 70 100 Z" fill="#7ad7ff" ${ln(1.5)}/>`;
    const glasses = art('face');
    if (glasses) h += glasses.draw();
    const hat = art('head');
    if (hat) h += hat.draw();
    if (f.steam) {
      h += '<g class="lk-steam">' + [[44, 36], [156, 36]].map(([x, y]) =>
        `<circle cx="${x}" cy="${y}" r="9" fill="#fff" ${ln(2)}/><circle cx="${x + (x < 100 ? -8 : 8)}" cy="${y - 12}" r="7" fill="#fff" ${ln(2)}/>`).join('') + '</g>';
    }
    return h;
  }

  // A whole <svg>. box: 'full' or 'head' (head and shoulders, for small avatars).
  function svg(charId, equip, face, cls = '', box = 'full') {
    const f = typeof face === 'string' ? FACES[face] || FACES.happy : face || FACES.happy;
    return `<svg class="look ${cls}" viewBox="${box === 'head' ? HEAD_BOX : FULL_BOX}" aria-hidden="true">` +
      `<g class="lk${f.shiver ? ' lk-shiver' : ''}">${inner(charId, equip, face)}</g></svg>`;
  }

  // A player's character as they look now (outfit, mood by fullness).
  const ofPlayer = (p, cls, box) => svg(p.character, p.equip, moodOf(Shop.fullness(p)), cls, box);

  return { inner, svg, ofPlayer, moodOf, FACES, FULL_BOX };
})();
