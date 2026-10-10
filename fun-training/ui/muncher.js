// The Coin Muncher: a fluffy purple monster in the pause dialog that eats the current task's coins while the game is
// paused (the rules are in Lesson.pause / pauseTick). It chomps coins flying from the pile, says how many are left, and
// burps when nothing is left. States: eating, full (ate everything).

const Muncher = (() => {
  const $ = id => document.getElementById(id);
  const PILE_X = 228, PILE_Y = 150, MOUTH = [112, 110]; // in the SVG's viewBox 0 0 280 170
  const PILE_MAX = 14;                                  // coins drawn in the pile at most
  let state = '', left = 0, owed = 0, gapT = 0, burpT = 0;

  const coin = (x, y) => `<ellipse cx="${x}" cy="${y + 2.5}" rx="19" ry="7" fill="#d99a00" ${ln(2.5)}/>` +
    `<ellipse cx="${x}" cy="${y}" rx="19" ry="7" fill="#ffcf3f" ${ln(2.5)}/><ellipse cx="${x}" cy="${y}" rx="11" ry="3.6" fill="#ffe680"/>`;

  // A fuzzy round body: bumps around a circle.
  function fluff(cx, cy, r, n) {
    let d = '';
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      if (!i) { d += `M${x.toFixed(1)} ${y.toFixed(1)}`; continue; }
      const m = a - Math.PI / n, bx = cx + Math.cos(m) * (r + 7), by = cy + Math.sin(m) * (r + 7);
      d += `Q${bx.toFixed(1)} ${by.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d + 'Z';
  }

  const teeth = () => [70, 86, 102, 118, 134].map(x => `M${x - 6} 101 L${x} 111 L${x + 6} 101`).join(' ');

  function monster() {
    return `<ellipse cx="96" cy="160" rx="62" ry="7" fill="#000" opacity="0.18"/>` +
      `<g class="mnBody">` +
      `<ellipse cx="72" cy="150" rx="17" ry="9" fill="#7a55e8" ${ln()}/><ellipse cx="122" cy="150" rx="17" ry="9" fill="#7a55e8" ${ln()}/>` +
      `<path d="M66 44 L60 18 L80 38 Z M118 38 L130 14 L134 42 Z" fill="#ffd23f" ${ln(2.5)}/>` +
      `<path d="${fluff(97, 92, 58, 18)}" fill="#8f6cff" ${ln()}/>` +
      `<path d="M50 118 Q36 128 40 140 M146 118 Q160 126 156 140" fill="none" ${ln(5)}/>` +
      `<path d="M50 118 Q36 128 40 140 M146 118 Q160 126 156 140" fill="none" stroke="#8f6cff" stroke-width="7" stroke-linecap="round"/>` +
      // Eyes: open (pupils look at the pile), or happy arcs (full).
      `<g class="mnEyes"><circle cx="76" cy="64" r="15" fill="#fff" ${ln(2.5)}/><circle cx="116" cy="60" r="17" fill="#fff" ${ln(2.5)}/>` +
      `<g class="mnPupils"><circle cx="82" cy="65" r="6.5" fill="${INK}"/><circle cx="123" cy="61" r="7.5" fill="${INK}"/>` +
      `<circle cx="84" cy="62" r="2.2" fill="#fff"/><circle cx="125.5" cy="57.5" r="2.5" fill="#fff"/></g></g>` +
      `<path class="mnHappy" d="M64 66 Q76 54 88 66 M103 62 Q116 49 129 62" fill="none" ${ln(4)}/>` +
      // Mouth: wide open with teeth and a tongue (chomping), or a closed smile.
      `<g class="mnOpen"><path d="M60 100 Q100 92 142 100 Q138 142 100 144 Q64 142 60 100 Z" fill="#5a1f4d" ${ln()}/>` +
      `<path d="${teeth()}" fill="#fff" ${ln(2)}/><ellipse cx="102" cy="132" rx="20" ry="8" fill="#ff7aa8"/></g>` +
      `<path class="mnShut" d="M70 112 Q100 132 132 110" fill="none" ${ln(4)}/>` +
      `<ellipse cx="58" cy="96" rx="8" ry="5" fill="#ff8fb0" opacity="0.6"/><ellipse cx="140" cy="92" rx="8" ry="5" fill="#ff8fb0" opacity="0.6"/>` +
      `</g><g id="mnFx"></g>`;
  }

  function pileHTML(n) {
    let h = '';
    const a = Math.min(n, 8), b = Math.min(n - a, PILE_MAX - 8);
    for (let i = 0; i < b; i++) h += coin(PILE_X + 22, PILE_Y - i * 6);
    for (let i = 0; i < a; i++) h += coin(PILE_X - 6, PILE_Y - i * 6);
    return h;
  }
  const pileTop = () => PILE_Y - Math.max(0, Math.min(left, 8) - 1) * 6;

  function setState(s) {
    if (s === state) return;
    state = s;
    $('muncher').setAttribute('class', 'muncher ' + s);
    $('pauseNote').textContent = s === 'eating'
      ? `😋 Thinking time isn't free: the Coin Muncher eats this task's coins while you pause — all of them in ${PAUSE_EAT_TIME} s!`
      : 'Burp! It ate all the coins of this task. The next tasks pay in full again.';
  }

  function render() {
    $('mnPile').innerHTML = pileHTML(left);
    $('pauseLeft').textContent = left;
  }

  // A coin flies from the pile into the mouth, "−n" floats up.
  function fly(n) {
    const fx = $('mnFx');
    if (!fx) return;
    const top = pileTop() - 6;
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'mnFly');
    g.style.setProperty('--dx', (MOUTH[0] - PILE_X) + 'px');
    g.style.setProperty('--dy', (MOUTH[1] - top) + 'px');
    g.innerHTML = coin(PILE_X - 6, top);
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('class', 'mnMinus');
    t.setAttribute('x', PILE_X + 8);
    t.setAttribute('y', top - 16);
    t.textContent = '−' + n;
    fx.append(g, t);
    setTimeout(() => { g.remove(); t.remove(); }, 800);
    Sfx.chomp();
  }

  // The dialog opens: `fee` coins were eaten at once, `coins` are left.
  function show(fee, coins) {
    $('muncher').innerHTML = monster() + '<g id="mnPile"></g>';
    state = '';
    left = coins + fee;
    owed = 0;
    gapT = 0;
    burpT = 0;
    setState(left > 0 ? 'eating' : 'full');
    render();
    if (fee) eat(fee, coins);
  }

  // n more coins were eaten, `coins` are left.
  function eat(n, coins) {
    owed += n;
    left = coins;
  }

  function update(dt) {
    if (!state) return;
    gapT -= dt;
    if (owed > 0 && gapT <= 0) {
      render();
      fly(owed);
      owed = 0;
      gapT = PAUSE_CHOMP_GAP;
      if (left <= 0) burpT = 0.7;
    }
    if (burpT > 0) {
      burpT -= dt;
      if (burpT <= 0) { setState('full'); Sfx.burp(); }
    }
  }

  // The task's price changed (its speed was changed in the dialog): `coins` are left now.
  function refill(coins) {
    if (!state) return;
    left = coins;
    owed = 0;
    burpT = 0;
    setState(left > 0 ? 'eating' : 'full');
    render();
  }

  const hide = () => { state = ''; };

  return { show, eat, update, refill, hide };
})();
