// Math task type: + − × ÷ examples within the chosen number limits.

const MathTasks = (() => {
  const { rnd, pick, fmt } = Tasks;
  const logRnd = (a, b) => (b <= a ? a : Math.min(b, Math.max(a, Math.round(Math.exp(Math.log(a) + Math.random() * (Math.log(b) - Math.log(a)))))));
  const signOf = id => OPERATIONS.find(o => o.id === id).sign;

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
    return { type: 'math', text: parts.join(' '), answer: s, ops: seq.slice(), terms };
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
      t.solution = t.text + ' = ' + fmt(t.answer);
      return t;
    }
    return { type: 'math', text: '1 + 1', answer: 2, ops: ['add'], terms: [], solution: '1 + 1 = 2' };
  }

  // Expected seconds for the operators, by each one's limit.
  function expectedTime(task, math) {
    let t = 0;
    for (const op of task.ops) t += OP_TIME[op][LIMITS.indexOf(math.limits[op])];
    return t;
  }

  // Column helpers: digits from the units up, and back.
  const digits = n => String(n).split('').reverse().map(Number);
  const fromDigits = ds => ds.reduce((s, d, i) => s + d * Math.pow(10, i), 0);
  const columns = (x, y, f) => {
    const a = digits(x), b = digits(y);
    return fromDigits(Array.from({ length: Math.max(a.length, b.length) }, (_, i) => f(a[i] || 0, b[i] || 0)));
  };

  // The task's numbers and operators in reading order.
  function flat(task) {
    const nums = [], ops = [];
    task.terms.forEach((t, i) => {
      if (i > 0) ops.push(t.sign);
      t.nums.forEach((n, j) => {
        if (j > 0) ops.push(t.ops[j - 1]);
        nums.push(n);
      });
    });
    return { nums, ops };
  }

  // Worked left to right, ignoring × and ÷ first; null if it goes wrong on the way.
  function leftToRight({ nums, ops }) {
    let v = nums[0];
    for (let i = 0; i < ops.length; i++) {
      const n = nums[i + 1];
      v = ops[i] === 'add' ? v + n : ops[i] === 'sub' ? v - n : ops[i] === 'mul' ? v * n : v / n;
      if (v < 0 || !Number.isInteger(v)) return null;
    }
    return v;
  }

  // Plausible wrong answers with weights. Close ones keep the units digit (±10, ±20, ±100), so the last digit
  // doesn't give the answer away; plus the typical slips: a forgotten carry or borrow, the smaller digit taken
  // from the bigger one, a neighbouring table result, × and ÷ done after + and −.
  function mistakes(task) {
    const a = task.answer;
    const out = [];
    const near = (d, w) => out.push([a + d, w], [a - d, w]);
    if (a < 10) { near(1, 3); near(2, 2); near(3, 1); } else {
      near(10, 4); near(20, 2); near(1, 1);
      if (a >= 100) near(100, 3);
      if (a >= 1000) near(1000, 2);
      const s = String(a);
      out.push([Number(s.slice(0, -2) + s[s.length - 1] + s[s.length - 2]), 2]); // last two digits swapped
    }
    const f = flat(task);
    if (f.ops.length === 1) {
      const [x, y] = f.nums;
      const op = f.ops[0];
      if (op === 'add') out.push([columns(x, y, (p, q) => (p + q) % 10), 6]);           // carry forgotten
      if (op === 'sub') {
        out.push([columns(x, y, (p, q) => Math.abs(p - q)), 6]);                         // smaller digit from the bigger
        out.push([columns(x, y, (p, q) => (p - q + 10) % 10), 5]);                       // borrowed, next column not lowered
      }
      if (op === 'mul' && Math.min(x, y) < 10 && Math.max(x, y) >= 10) {
        const d = Math.min(x, y);
        out.push([fromDigits(digits(Math.max(x, y)).map(v => (v * d) % 10)), 5]);     // carry forgotten
      }
      if (op === 'div' && a >= 10) near(1, 4);
    }
    if (f.ops.some(o => o === 'add' || o === 'sub') && f.ops.some(o => o === 'mul' || o === 'div')) {
      const w = leftToRight(f);
      if (w !== null) out.push([w, 6]);
    }
    for (const t of task.terms) {
      // Neighbouring table result: one factor off by one changes the product by the other factor.
      if (t.ops.length && t.ops.every(o => o === 'mul')) t.nums.forEach(n => { if (n <= 20) near(n, 4); });
    }
    return out.filter(([v]) => v >= a / 2 - 10 && v <= 2 * a + 20); // a far-off number isn't a believable option
  }

  // Price steps: the hardest operation's points, + each extra operation, + mixing; × by numbers in a task.
  function price(math) {
    const pts = id => OP_PRICE[id][LIMITS.indexOf(math.limits[id])];
    const hard = math.ops.reduce((a, b) => (pts(b) > pts(a) ? b : a));
    const steps = [{ label: `${signOf(hard)} up to ${fmt(math.limits[hard])}`, add: pts(hard) }];
    const extra = math.ops.length - 1;
    if (extra) steps.push({ label: `${extra} more operation${extra > 1 ? 's' : ''}`, add: extra * PRICE_EXTRA_OP });
    if (math.mix && extra && math.operands > 2) steps.push({ label: 'Mixed', add: PRICE_MIX });
    if (math.operands > 2) steps.push({ label: `${math.operands} numbers`, mul: PRICE_OPERANDS[math.operands] });
    return steps;
  }

  return { make, expectedTime, mistakes, price };
})();
