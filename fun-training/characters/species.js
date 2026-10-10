// The look of each character (CHARACTERS): colours and the parts that differ — ears, tail, face markings, nose.
// Drawn as SVG in character coordinates (see characters/look.js): head circle (100, 88) r 54, body ellipse
// (100, 182) 44 × 46, eyes at (80, 90) / (120, 90), nose (100, 104), mouth (100, 116), feet at y 245.
// fur: head and body; belly: tummy patch (none = no patch); arm / leg / feet: limbs (default fur);
// back(): behind the body (tail, wings); ears(): behind the head; front(): on the head, under the eyes; top(): over
// the eyes (horn, forelock); tummy(): on the belly, hidden by an outfit; nose(): the nose; eyeWhite: white eyes on dark patches; mouthY: mouth moved down.

const INK = '#3b2f5c';
const ln = (w = 3) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
// A thick outlined stroke (tails): the ink line, then the fill colour on top.
const tube = (d, color, w) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + 6}" stroke-linecap="round"/>` +
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;

const SPECIES = {
  kitty: {
    fur: '#ffb562', belly: '#fff1dc',
    back: () => `<g class="lk-wag">${tube('M136 222 C178 224 188 186 172 158', '#ffb562', 11)}</g>`,
    ears: () => `<path d="M54 66 L58 14 L92 40 Z" fill="#ffb562" ${ln()}/><path d="M146 66 L142 14 L108 40 Z" fill="#ffb562" ${ln()}/>` +
      '<path d="M62 52 L63 29 L81 42 Z" fill="#ff9bb0"/><path d="M138 52 L137 29 L119 42 Z" fill="#ff9bb0"/>',
    front: () => `<path d="M100 36 L100 50 M88 38 L90 49 M112 38 L110 49" stroke="#e08a2e" stroke-width="4" stroke-linecap="round"/>` +
      '<ellipse cx="100" cy="112" rx="19" ry="12" fill="#fff1dc"/>' +
      `<path d="M78 108 L50 102 M78 114 L50 117 M122 108 L150 102 M122 114 L150 117" ${ln(2)}/>`,
    nose: () => `<path d="M94 103 L106 103 L100 110 Z" fill="#ff7a99" ${ln(2)}/>`,
  },
  puppy: {
    fur: '#f2d3a2', belly: '#fff8ec',
    back: () => `<g class="lk-wag">${tube('M138 206 Q170 198 166 168', '#f2d3a2', 10)}</g>`,
    front: () => '<ellipse cx="121" cy="87" rx="15" ry="14" fill="#c8925a"/>' +
      '<ellipse cx="100" cy="112" rx="22" ry="15" fill="#fff8ec"/>' +
      `<ellipse cx="50" cy="86" rx="16" ry="34" transform="rotate(18 50 86)" fill="#a8703f" ${ln()}/>` +
      `<ellipse cx="150" cy="86" rx="16" ry="34" transform="rotate(-18 150 86)" fill="#a8703f" ${ln()}/>`,
    nose: () => `<ellipse cx="100" cy="104" rx="8" ry="6" fill="${INK}"/><circle cx="97" cy="102" r="2" fill="#fff"/>`,
  },
  bunny: {
    fur: '#fbf8fc', belly: '#ffe6f0',
    back: () => `<circle cx="146" cy="222" r="13" fill="#fff" ${ln()}/>`,
    ears: () => `<ellipse cx="79" cy="4" rx="13" ry="40" transform="rotate(-10 79 4)" fill="#fbf8fc" ${ln()}/>` +
      `<ellipse cx="121" cy="4" rx="13" ry="40" transform="rotate(10 121 4)" fill="#fbf8fc" ${ln()}/>` +
      '<ellipse cx="79" cy="8" rx="6" ry="29" transform="rotate(-10 79 8)" fill="#ffb3c9"/>' +
      '<ellipse cx="121" cy="8" rx="6" ry="29" transform="rotate(10 121 8)" fill="#ffb3c9"/>',
    front: () => `<path d="M95 118 L95 126 L105 126 L105 118 M100 118 L100 126" fill="#fff" ${ln(2)}/>`,
    nose: () => '<ellipse cx="100" cy="104" rx="6" ry="4.5" fill="#ff8fb0"/>',
    mouthY: -2,
  },
  panda: {
    fur: '#ffffff', arm: '#33324a', leg: '#33324a', feet: '#33324a', eyeWhite: true,
    ears: () => `<circle cx="57" cy="42" r="17" fill="#33324a" ${ln()}/><circle cx="143" cy="42" r="17" fill="#33324a" ${ln()}/>`,
    front: () => '<ellipse cx="79" cy="92" rx="14" ry="18" transform="rotate(-28 79 92)" fill="#33324a"/>' +
      '<ellipse cx="121" cy="92" rx="14" ry="18" transform="rotate(28 121 92)" fill="#33324a"/>',
    nose: () => `<ellipse cx="100" cy="105" rx="7" ry="5" fill="${INK}"/>`,
  },
  fox: {
    fur: '#ff8a3d', belly: '#fff6ee', feet: '#4a3550',
    back: () => `<g class="lk-wag"><path d="M134 222 C182 234 204 176 170 146 C162 178 152 198 134 204 Z" fill="#ff8a3d" ${ln()}/>` +
      `<path d="M170 146 C186 156 194 172 192 186 C180 178 172 164 170 146 Z" fill="#fff6ee" ${ln()}/></g>`,
    ears: () => `<path d="M50 72 L52 8 L92 40 Z" fill="#ff8a3d" ${ln()}/><path d="M150 72 L148 8 L108 40 Z" fill="#ff8a3d" ${ln()}/>` +
      '<path d="M59 52 L59 26 L80 42 Z" fill="#fff1e6"/><path d="M141 52 L141 26 L120 42 Z" fill="#fff1e6"/>' +
      `<path d="M52 10 L52 26 L66 20 Z M148 10 L148 26 L134 20 Z" fill="${INK}"/>`,
    front: () => '<path d="M48 96 Q66 92 84 104 Q100 112 116 104 Q134 92 152 96 Q144 130 100 142 Q56 130 48 96 Z" fill="#fff6ee"/>',
    nose: () => `<ellipse cx="100" cy="105" rx="7" ry="5" fill="${INK}"/>`,
  },
  bear: {
    fur: '#b07a4f', belly: '#e8c69c',
    back: () => `<circle cx="144" cy="226" r="9" fill="#b07a4f" ${ln()}/>`,
    ears: () => `<circle cx="57" cy="44" r="17" fill="#b07a4f" ${ln()}/><circle cx="143" cy="44" r="17" fill="#b07a4f" ${ln()}/>` +
      '<circle cx="58" cy="45" r="9" fill="#e8c69c"/><circle cx="142" cy="45" r="9" fill="#e8c69c"/>',
    front: () => '<ellipse cx="100" cy="112" rx="21" ry="15" fill="#e8c69c"/>',
    nose: () => `<ellipse cx="100" cy="104" rx="8" ry="6" fill="${INK}"/><circle cx="97" cy="102" r="2" fill="#fff"/>`,
  },
  unicorn: {
    fur: '#fdf5ff', belly: '#ffffff', feet: '#c9a7e8',
    back: () => `<g class="lk-wag">${tube('M138 214 C160 214 170 200 176 182', '#ff8fc7', 7)}${tube('M138 220 C164 222 178 210 186 196', '#ffd166', 7)}` +
      `${tube('M138 226 C166 230 182 222 192 212', '#7ad7ff', 7)}</g>`,
    ears: () => `<path d="M60 58 L62 22 L86 42 Z" fill="#fdf5ff" ${ln()}/><path d="M140 58 L138 22 L114 42 Z" fill="#fdf5ff" ${ln()}/>` +
      '<path d="M66 48 L66 32 L78 42 Z" fill="#ffb3d9"/><path d="M134 48 L134 32 L122 42 Z" fill="#ffb3d9"/>',
    front: () => '<ellipse cx="100" cy="114" rx="20" ry="13" fill="#ffe3f1"/>',
    top: () => `<circle cx="80" cy="42" r="12" fill="#ff8fc7" ${ln()}/><circle cx="66" cy="56" r="11" fill="#b892ff" ${ln()}/>` +
      `<circle cx="58" cy="74" r="10" fill="#8fe3a1" ${ln()}/><circle cx="96" cy="36" r="12" fill="#ffd166" ${ln()}/>` +
      `<circle cx="113" cy="39" r="11" fill="#7ad7ff" ${ln()}/>` +
      `<path d="M92 32 L100 -6 L108 32 Z" fill="#ffd34d" ${ln()}/><path d="M95 22 L105 18 M97 10 L103 7" ${ln(2)}/>`,
    nose: () => `<ellipse cx="94" cy="110" rx="2.5" ry="2" fill="${INK}"/><ellipse cx="106" cy="110" rx="2.5" ry="2" fill="${INK}"/>`,
    mouthY: 4,
  },
  dragon: {
    fur: '#6fcf6a', belly: '#ffe58a',
    back: () => `<path d="M64 158 L14 118 L22 148 L6 160 L30 170 L22 196 L66 186 Z" fill="#4fae58" ${ln()}/>` +
      `<path d="M136 158 L186 118 L178 148 L194 160 L170 170 L178 196 L134 186 Z" fill="#4fae58" ${ln()}/>` +
      `<g class="lk-wag">${tube('M136 224 C170 230 186 214 190 196', '#6fcf6a', 11)}<path d="M180 194 L192 176 L202 196 L190 202 Z" fill="#4fae58" ${ln()}/></g>`,
    ears: () => `<path d="M66 50 L58 12 L84 38 Z" fill="#fff3c4" ${ln()}/><path d="M134 50 L142 12 L116 38 Z" fill="#fff3c4" ${ln()}/>` +
      `<path d="M90 38 L100 20 L110 38 Z" fill="#4fae58" ${ln()}/>`,
    front: () => '<ellipse cx="100" cy="111" rx="21" ry="14" fill="#94e08c"/>',
    tummy: () => '<path d="M78 196 L122 196 M76 208 L124 208" stroke="#e6c25a" stroke-width="3"/>',
    nose: () => `<ellipse cx="94" cy="105" rx="3" ry="2.5" fill="${INK}"/><ellipse cx="106" cy="105" rx="3" ry="2.5" fill="${INK}"/>`,
  },
  penguin: {
    fur: '#33405f', belly: '#ffffff', feet: '#ffa62b',
    front: () => '<path d="M100 64 C90 48 58 52 58 84 C58 116 80 136 100 136 C120 136 142 116 142 84 C142 52 110 48 100 64 Z" fill="#fff"/>',
    nose: () => `<path d="M89 101 L111 101 L100 114 Z" fill="#ffa62b" ${ln(2)}/>`,
    mouthY: 8,
  },
  lion: {
    fur: '#f7c04a', belly: '#ffe9b0',
    back: () => `<g class="lk-wag">${tube('M136 224 C168 230 180 206 178 186', '#f7c04a', 8)}<circle cx="178" cy="180" r="11" fill="#d9772b" ${ln()}/></g>`,
    ears: () => {
      let h = '';
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        h += `<circle cx="${(100 + Math.cos(a) * 62).toFixed(1)}" cy="${(88 + Math.sin(a) * 62).toFixed(1)}" r="17" fill="#d9772b" ${ln()}/>`;
      }
      return h + '<circle cx="100" cy="88" r="64" fill="#d9772b"/>' +
        `<circle cx="60" cy="48" r="13" fill="#f7c04a" ${ln()}/><circle cx="140" cy="48" r="13" fill="#f7c04a" ${ln()}/>` +
        '<circle cx="61" cy="49" r="6" fill="#ffe9b0"/><circle cx="139" cy="49" r="6" fill="#ffe9b0"/>';
    },
    front: () => '<ellipse cx="100" cy="112" rx="20" ry="14" fill="#fff0c8"/>',
    nose: () => `<path d="M93 102 L107 102 L100 110 Z" fill="#7a4a2a" ${ln(2)}/>`,
  },
};
