// Scales task type: a ruler-like scale with numbers on the big ticks and a pointer; the answer is the number it points at.

const ScaleTasks = (() => {
  const { rnd, pick, fmt } = Tasks;

  // The scale shows `n` big-tick intervals of `major` each, split into `parts`; ticks are indexed 0 … n × parts.
  function make(sc) {
    const some = sc.labels === 'some';
    for (let attempt = 0; attempt < 60; attempt++) {
      const parts = pick(sc.parts);
      let n = 0, majors = [];
      for (const cnt of [SCALE_BIG_TICKS[sc.labels], 2]) {
        majors = SCALE_MAJORS.filter(m => m % parts === 0 && m >= sc.limit * SCALE_MIN_MAJOR && cnt * m <= sc.limit);
        if (majors.length) { n = cnt; break; }
      }
      if (!n) continue;
      const major = pick(majors);
      const start = major * rnd(0, Math.floor((sc.limit - n * major) / major));
      const labeled = j => !some || j % 2 === 0; // big tick j has a number
      const spots = [];
      for (let i = 1; i < n * parts; i++) if (i % parts || !labeled(i / parts)) spots.push(i);
      const pos = pick(spots);
      return finish({ type: 'scale', start, major, parts, n, some, pos, limit: sc.limit });
    }
    return finish({ type: 'scale', start: 0, major: 10, parts: 2, n: 2, some: false, pos: 1, limit: sc.limit });
  }

  // Answer, the neighbouring numbers and the worked solution.
  function finish(t) {
    const step = t.major / t.parts;
    const labelEvery = (t.some ? 2 : 1) * t.parts; // ticks between two numbers
    const li = Math.floor(t.pos / labelEvery) * labelEvery;
    t.step = step;
    t.answer = t.start + t.pos * step;
    t.left = t.start + li * step;
    t.right = t.left + labelEvery * step;
    t.between = labelEvery;
    t.k = t.pos - li;
    t.solution = `1 part = (${fmt(t.right)} − ${fmt(t.left)}) ÷ ${labelEvery} = ${fmt(step)}\n` +
      `${fmt(t.left)} + ${t.k === 1 ? '' : t.k + ' × '}${fmt(step)} = ${fmt(t.answer)}`;
    return t;
  }

  function expectedTime(t) {
    return SCALE_TIME[t.parts] + SCALE_LIMIT_TIME[SCALE_LIMITS.indexOf(t.limit)] + (t.some ? SCALE_SOME_TIME : 0);
  }

  // Plausible wrong answers with weights: off by a part or two, ticks counted as ones,
  // ticks counted instead of parts, counted from the other number, the blank big ticks missed.
  function mistakes(t) {
    const gap = t.right - t.left;
    const out = [
      [t.answer + t.step, 3], [t.answer - t.step, 3],
      [t.answer + 2 * t.step, 2], [t.answer - 2 * t.step, 2],
      [t.left + t.right - t.answer, 2],
    ];
    if (t.step < 10) out.push([t.left + t.k, 3]);
    if (gap % (t.between - 1) === 0) out.push([t.left + t.k * gap / (t.between - 1), 3]);
    if (t.some && gap % t.parts === 0) out.push([t.left + t.k * gap / t.parts, 3]);
    return out.filter(([v]) => v !== t.left && v !== t.right); // the numbers on the scale are no puzzle
  }

  // SVG markup of the scale. Design units: 600 wide; numbers under the line, the pointer above it.
  const W = 600, X0 = 44, X1 = 556, BASE = 92, H = 138;
  const TICK = { major: 46, mid: 32, minor: 22 };

  function svg(t) {
    const N = t.n * t.parts;
    const ext = Math.floor(t.parts / 2);  // faded ticks past the ends: a piece of a longer ruler
    const extL = t.start > 0 ? ext : 0;
    const x = i => X0 + (i + extL) / (extL + N + ext) * (X1 - X0);
    const r = v => Math.round(v * 10) / 10;
    let h = `<svg class="scaleSvg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`;
    h += `<g stroke="currentColor" stroke-linecap="round">`;
    h += `<line x1="${r(x(0))}" y1="${BASE}" x2="${r(x(N))}" y2="${BASE}" stroke-width="4"/>`;
    if (extL) h += `<line x1="${r(x(-extL))}" y1="${BASE}" x2="${r(x(0))}" y2="${BASE}" stroke-width="4" opacity="0.3"/>`;
    h += `<line x1="${r(x(N))}" y1="${BASE}" x2="${r(x(N + ext))}" y2="${BASE}" stroke-width="4" opacity="0.3"/>`;
    for (let i = -extL; i <= N + ext; i++) {
      const m = ((i % t.parts) + t.parts) % t.parts;
      const kind = m === 0 ? 'major' : t.parts >= 4 && t.parts % 2 === 0 && m === t.parts / 2 ? 'mid' : 'minor';
      const out = i < 0 || i > N;
      h += `<line x1="${r(x(i))}" y1="${BASE}" x2="${r(x(i))}" y2="${BASE - TICK[kind]}" stroke-width="${kind === 'major' ? 4 : 3}"${out ? ' opacity="0.3"' : ''}/>`;
    }
    h += '</g><g fill="currentColor" font-size="34" font-weight="800" text-anchor="middle">';
    for (let j = 0; j <= t.n; j++) {
      if (t.some && j % 2) continue;
      h += `<text x="${r(x(j * t.parts))}" y="${BASE + 38}">${fmt(t.start + j * t.major)}</text>`;
    }
    const px = r(x(t.pos)), tip = BASE - TICK.major - 6;
    h += `</g><path d="M${px} ${tip} L${r(px - 15)} ${tip - 30} L${r(px + 15)} ${tip - 30} Z" fill="#ff4f6d" stroke="#c0304a" stroke-width="3" stroke-linejoin="round"/>`;
    return h + '</svg>';
  }

  // Price steps: points for the numbers' size, + the hardest parts choice, + blank big ticks.
  function price(sc) {
    const hard = sc.parts.reduce((a, b) => (SCALE_PARTS_PRICE[b] > SCALE_PARTS_PRICE[a] ? b : a));
    const steps = [
      { label: `Up to ${fmt(sc.limit)}`, add: SCALE_LIMIT_PRICE[SCALE_LIMITS.indexOf(sc.limit)] },
      { label: `${hard} parts`, add: SCALE_PARTS_PRICE[hard] },
    ];
    if (sc.labels === 'some') steps.push({ label: 'Every other number', add: SCALE_SOME_PRICE });
    return steps;
  }

  return { make, expectedTime, mistakes, price, svg };
})();
