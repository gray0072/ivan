// Math task generator, expected solving time and answer choices.

const Tasks = (() => {
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1)); // integer in [a, b]
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const logRnd = (a, b) => (b <= a ? a : Math.min(b, Math.max(a, Math.round(Math.exp(Math.log(a) + Math.random() * (Math.log(b) - Math.log(a)))))));
  const signOf = id => OPERATIONS.find(o => o.id === id).sign;

  function fmt(n) {
    return n >= 10000 ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : String(n);
  }

  // A run of × / ÷ (one term). Returns { nums, value } or null.
  function buildChain(ops, lim) {
    const nums = [];
    let v;
    let i = 0;
    if (ops[0] === 'div') {
      // Leading divisions are built backwards: dividend = quotient × divisors.
      let k = 0;
      while (k < ops.length && ops[k] === 'div') k++;
      const f = Math.max(2, Math.round(Math.pow(lim.div, 1 / (k + 1))));
      const divisors = [];
      for (let j = 0; j < k; j++) divisors.push(rnd(2, f));
      let q = rnd(1, f);
      v = q * divisors.reduce((a, b) => a * b, 1);
      if (v > lim.div) return null;
      nums.push(v);
      for (const d of divisors) { v /= d; nums.push(d); }
      i = k;
    } else {
      v = logRnd(2, Math.max(2, Math.floor(lim.mul / 2)));
      nums.push(v);
    }
    for (; i < ops.length; i++) {
      if (ops[i] === 'mul') {
        const max = Math.floor(lim.mul / v);
        if (max < 2) return null;
        const b = logRnd(2, max);
        v *= b;
        nums.push(b);
      } else {
        if (v > lim.div) return null;
        const divs = [];
        for (let d = 2; d < v; d++) if (v % d === 0) divs.push(d);
        if (!divs.length) return null;
        const d = pick(divs);
        v /= d;
        nums.push(d);
      }
    }
    return { nums, value: v };
  }

  // One attempt at an expression for the operator sequence; null if the limits can't be met.
  function build(seq, lim) {
    // Split into terms: + and − separate terms, × and ÷ stay inside a term.
    const terms = [{ sign: 'add', ops: [] }];
    for (const op of seq) {
      if (op === 'add' || op === 'sub') terms.push({ sign: op, ops: [] });
      else terms[terms.length - 1].ops.push(op);
    }
    for (const t of terms) {
      if (t.ops.length) {
        const c = buildChain(t.ops, lim);
        if (!c) return null;
        t.nums = c.nums;
        t.value = c.value;
      }
    }
    // Combine the terms left to right, choosing the free single numbers on the way.
    let s;
    const t0 = terms[0];
    if (t0.ops.length) s = t0.value;
    else {
      const next = terms[1] && terms[1].sign;
      s = next === 'sub' ? rnd(2, lim.sub) : rnd(1, Math.max(1, lim.add - 1));
      t0.nums = [s];
      t0.value = s;
    }
    for (let i = 1; i < terms.length; i++) {
      const t = terms[i];
      if (t.sign === 'add') {
        if (!t.ops.length) {
          if (lim.add - s < 1) return null;
          t.value = rnd(1, lim.add - s);
          t.nums = [t.value];
        }
        if (s + t.value > lim.add) return null;
        s += t.value;
      } else {
        if (s > lim.sub) return null;
        if (!t.ops.length) {
          if (s < 2) return null;
          t.value = rnd(1, s - 1);
          t.nums = [t.value];
        }
        if (t.value >= s) return null;
        s -= t.value;
      }
    }
    // Text: numbers of each term joined by their operators.
    const parts = [];
    terms.forEach((t, i) => {
      if (i > 0) parts.push(signOf(t.sign));
      t.nums.forEach((n, j) => {
        if (j > 0) parts.push(signOf(t.ops[j - 1]));
        parts.push(fmt(n));
      });
    });
    return { text: parts.join(' '), answer: s, ops: seq.slice(), terms };
  }

  function make(math) {
    const lim = math.limits;
    const ops = math.ops.length ? math.ops : ['add'];
    for (let attempt = 0; attempt < 600; attempt++) {
      const n = attempt < 300 ? math.operands : attempt < 450 ? Math.max(2, math.operands - 1) : 2;
      const one = pick(ops);
      const seq = [];
      for (let i = 0; i < n - 1; i++) seq.push(math.mix ? pick(ops) : one);
      const t = build(seq, lim);
      if (!t) continue;
      // Single-operator 2-number × / +: swap the operands sometimes for variety.
      if (seq.length === 1 && (seq[0] === 'mul' || seq[0] === 'add') && Math.random() < 0.5) {
        const nums = seq[0] === 'mul' ? t.terms[0].nums : [t.terms[0].nums[0], t.terms[1].nums[0]];
        t.text = fmt(nums[1]) + ' ' + signOf(seq[0]) + ' ' + fmt(nums[0]);
      }
      return t;
    }
    return { text: '1 + 1', answer: 2, ops: ['add'], terms: [] };
  }

  // Expected seconds to solve the task, before the speed multiplier.
  function expectedTime(task, math, answerMode) {
    let t = answerMode === 'type' ? TYPE_TIME + String(task.answer).length * TYPE_DIGIT_TIME : READ_TIME;
    for (const op of task.ops) t += OP_TIME[op][LIMITS.indexOf(math.limits[op])];
    return t;
  }

  function failTime(task, math, answerMode) {
    const sp = SPEEDS.find(s => s.id === math.speed) || SPEEDS[2];
    return Math.max(MIN_TASK_TIME, expectedTime(task, math, answerMode) * sp.mul);
  }

  // CHOICE_COUNT answers including the right one, shuffled; wrong ones are plausible mistakes.
  function choices(task) {
    const a = task.answer;
    const cand = new Map();
    const add = (v, w) => {
      if (Number.isInteger(v) && v >= 0 && v !== a) cand.set(v, Math.max(cand.get(v) || 0, w));
    };
    for (let d = 1; d <= 3; d++) { add(a + d, 4 - d); add(a - d, 4 - d); }
    if (a >= 10) { add(a + 10, 3); add(a - 10, 3); }
    if (a >= 100) { add(a + 100, 2); add(a - 100, 2); }
    if (a >= 10) {
      const s = String(a);
      add(Number(s.slice(0, -2) + s[s.length - 1] + s[s.length - 2]), 2);
    }
    for (const t of task.terms) {
      if (t.ops.length && t.ops.every(o => o === 'mul')) t.nums.forEach(n => { add(a + n, 3); add(a - n, 3); });
    }
    const out = [a];
    while (out.length < CHOICE_COUNT && cand.size) {
      let total = 0;
      cand.forEach(w => { total += w; });
      let r = Math.random() * total;
      for (const [v, w] of cand) {
        r -= w;
        if (r <= 0) { out.push(v); cand.delete(v); break; }
      }
    }
    for (let v = a + 4; out.length < CHOICE_COUNT; v++) if (!out.includes(v)) out.push(v);
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  // Seconds per task for a typical task of the settings (for the settings screen).
  function typicalFailTime(math, answerMode) {
    let sum = 0;
    const N = 40;
    for (let i = 0; i < N; i++) sum += failTime(make(math), math, answerMode);
    return sum / N;
  }

  return { make, choices, failTime, typicalFailTime, fmt };
})();
