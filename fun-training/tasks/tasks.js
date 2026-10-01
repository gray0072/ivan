// Tasks of every type: picks the type, expected solving time and answer choices.
// Each task type lives in its own file in this folder and exposes make(cfg), expectedTime(task, cfg), mistakes(task) and price(cfg).

const Tasks = (() => {
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1)); // integer in [a, b]
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  function fmt(n) {
    return n >= 10000 ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : String(n);
  }

  // Task type id -> its module (looked up on use: the type files load after this one).
  const typeOf = id => ({ math: MathTasks, scale: ScaleTasks })[id];

  // A task of the given type, or of one picked at random from the enabled types. st = player settings.
  function make(st, type) {
    type = type || pick(st.types);
    return typeOf(type).make(st[type]);
  }

  // Expected seconds to solve the task, before the speed multiplier.
  function expectedTime(task, st) {
    const answer = st.answerMode === 'type' ? TYPE_TIME + String(task.answer).length * TYPE_DIGIT_TIME : READ_TIME;
    return answer + typeOf(task.type).expectedTime(task, st[task.type]);
  }

  function failTime(task, st) {
    const sp = SPEEDS.find(s => s.id === st[task.type].speed) || SPEEDS[2];
    return Math.max(MIN_TASK_TIME, expectedTime(task, st) * sp.mul);
  }

  // CHOICE_COUNT answers including the right one, shuffled; wrong ones are the type's plausible mistakes.
  function choices(task) {
    const a = task.answer;
    const cand = new Map();
    for (const [v, w] of typeOf(task.type).mistakes(task)) {
      if (Number.isInteger(v) && v >= 0 && v !== a) cand.set(v, Math.max(cand.get(v) || 0, w));
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
    const step = task.step || 1;
    for (let v = a + step; out.length < CHOICE_COUNT; v += step) if (!out.includes(v)) out.push(v);
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  // Coins for each correct answer of the type with these settings, and the steps that make it up:
  // { label, add } points are summed, then { label, mul } multipliers applied (typed answers, speed).
  function price(st, type) {
    const steps = typeOf(type).price(st[type]);
    if (st.answerMode === 'type') steps.push({ label: '⌨️ Typed', mul: PRICE_TYPED });
    const sp = SPEEDS.find(s => s.id === st[type].speed) || SPEEDS[2];
    steps.push({ label: `${sp.icon} ${sp.name}`, mul: sp.price });
    let v = 0;
    for (const s of steps) if (s.add) v += s.add;
    for (const s of steps) if (s.mul) v *= s.mul;
    return { coins: Math.max(1, Math.round(v + 1e-9)), steps };
  }

  // Seconds per task for a typical task of the type with these settings (for the settings screen).
  function typicalFailTime(st, type) {
    let sum = 0;
    const N = 40;
    for (let i = 0; i < N; i++) sum += failTime(make(st, type), st);
    return sum / N;
  }

  return { make, choices, failTime, typicalFailTime, price, fmt, rnd, pick };
})();
