'use strict';

// Yacht — the moves and what each brings, shown on Easy: an exact calculation over the 252 sets of five dice. For
// each set and rolls left, the best of writing now or holding some dice and rolling, where writing
// is worth the row's points plus what the rows left then can bring (data/state-values.js). So it is
// the best play for the highest average total, to the end of the game. Read by ui/card.js and
// ui/table.js; has no state of the game.

const Advisor = (() => {
  // every sorted set of k dice with its probability
  const outcomes = [];
  const factorial = [1, 1, 2, 6, 24, 120];
  function buildOutcomes(k) {
    const list = [];
    (function walk(start, cur) {
      if (cur.length === k) {
        const n = diceCounts(cur);
        let ways = factorial[k];
        for (let f = 1; f <= 6; f++) ways /= factorial[n[f]];
        list.push({ dice: cur.slice(), weight: ways / Math.pow(6, k) });
        return;
      }
      for (let f = start; f <= 6; f++) { cur.push(f); walk(f, cur); cur.pop(); }
    })(1, []);
    return list;
  }
  for (let k = 0; k <= DICE_COUNT; k++) outcomes[k] = buildOutcomes(k);

  const SETS = outcomes[DICE_COUNT];
  const keyOf = (dice) => dice.slice().sort((a, b) => a - b).join('');
  const SET_INDEX = {};
  SETS.forEach((s, i) => { SET_INDEX[keyOf(s.dice)] = i; });

  // for each kept set of 0–5 dice: which sets of five a roll of the others can give, with what chance
  const HOLDS = {};
  for (let h = 0; h <= DICE_COUNT; h++) {
    for (const held of outcomes[h]) {
      HOLDS[keyOf(held.dice)] = {
        dice: held.dice,
        next: outcomes[DICE_COUNT - h].map((o) => ({ set: SET_INDEX[keyOf(held.dice.concat(o.dice))], weight: o.weight }))
      };
    }
  }

  // the different sets of dice that can be kept out of five
  function holdsOf(dice) {
    const seen = {};
    for (let mask = 0; mask < 32; mask++) {
      const kept = dice.filter((d, i) => mask & (1 << i));
      seen[keyOf(kept)] = true;
    }
    return Object.keys(seen);
  }
  const SET_HOLDS = SETS.map((s) => holdsOf(s.dice));

  // what the free rows can bring with the best play, by a mask of the free rows
  const STATE_VALUE = new Float32Array(STATE_VALUES.length / 2);
  for (let i = 0; i < STATE_VALUE.length; i++) {
    const t = STATE_VALUE_ALPHABET.indexOf(STATE_VALUES[2 * i]) * 64 + STATE_VALUE_ALPHABET.indexOf(STATE_VALUES[2 * i + 1]);
    STATE_VALUE[i] = STATE_VALUE_MIN + t / 10;
  }
  const ROW_BIT = {};
  ALL_ROWS.forEach((r, i) => { ROW_BIT[r.id] = 1 << i; });
  const maskOf = (free) => free.reduce((m, r) => m | ROW_BIT[r], 0);
  // what using up a row costs: the rows left bring this much less than the free rows did
  const rowCost = (r, mask) => STATE_VALUE[mask] - STATE_VALUE[mask ^ ROW_BIT[r]];

  // writing a set into the best free row: { value, row, points, scores } for each set, for a first
  // roll or a later one; `scores` is false when that row would be given up or not closed
  function writeTable(free, firstRoll) {
    const mask = maskOf(free);
    return SETS.map((s) => {
      let best = -Infinity, row = null, score = null;
      for (const r of free) {
        const sc = rowScore(r, s.dice, firstRoll ? 1 : 2);
        const v = sc.p - rowCost(r, mask);
        if (v > best) { best = v; row = r; score = sc; }
      }
      return { value: best, row, points: score.p, scores: !isLoss(row, score) };
    });
  }

  function holdValue(key, values) {
    let v = 0;
    for (const n of HOLDS[key].next) v += n.weight * values[n.set];
    return v;
  }

  // the policy after a roll: for each set the value and the points it ends in, and either the row or
  // the kept dice
  function levels(free) {
    const later = writeTable(free, false);
    const v0 = later.map((w) => w.value);
    const p0 = later.map((w) => w.points);
    const lvl1 = SETS.map((s, i) => {
      let best = later[i].value, hold = null;
      for (const key of SET_HOLDS[i]) {
        if (key.length === DICE_COUNT) continue;
        const v = holdValue(key, v0);
        if (v > best + 1e-9) { best = v; hold = key; }
      }
      return { value: best, row: hold === null ? later[i].row : null, hold, points: hold === null ? p0[i] : holdValue(hold, p0) };
    });
    return { later, v0, p0, lvl1, v1: lvl1.map((e) => e.value), p1: lvl1.map((e) => e.points) };
  }

  // how a kept set can end, following the best moves to the end of the turn. aims: the rows it scores
  // in, the likeliest first; miss: all the ends that give a row up or leave it not closed, named by
  // the likeliest such row. Each with its chance, the points it brings on average, its gain and values:
  // every number of points it can end with and the chance of that, the lowest first. The gains
  // weighted by the chances add up to the gain of the roll, and the values to its points.
  function endings(key, rollsAfter, lv) {
    const hits = {}, misses = {};
    const add = (set, w) => {
      const e = lv.later[set];
      const into = e.scores ? hits : misses;
      const b = into[e.row] || (into[e.row] = { row: e.row, chance: 0, points: 0, gain: 0, values: {} });
      b.chance += w;
      b.points += w * e.points;
      b.gain += w * e.value;
      b.values[e.points] = (b.values[e.points] || 0) + w;
    };
    for (const n of HOLDS[key].next) {
      if (rollsAfter === 0) add(n.set, n.weight);
      else {
        const e = lv.lvl1[n.set];
        if (e.row) add(n.set, n.weight);
        else for (const m of HOLDS[e.hold].next) add(m.set, n.weight * m.weight);
      }
    }
    const byChance = (x, y) => y.chance - x.chance;
    const mean = (b) => ({
      row: b.row, chance: b.chance, points: b.points / b.chance, gain: b.gain / b.chance,
      values: Object.keys(b.values).map(Number).sort((x, y) => x - y).map((p) => ({ points: p, chance: b.values[p] }))
    });
    const failed = Object.values(misses).sort(byChance);
    let miss = null;
    if (failed.length) {
      miss = { row: failed[0].row, chance: 0, points: 0, gain: 0, values: {} };
      for (const b of failed) {
        miss.chance += b.chance; miss.points += b.points; miss.gain += b.gain;
        for (const p of Object.keys(b.values)) miss.values[p] = (miss.values[p] || 0) + b.values[p];
      }
      miss = mean(miss);
    }
    return { aims: Object.values(hits).sort(byChance).map(mean), miss };
  }

  // Every move a player has after their roll number rollNo (1–3), the best first:
  //   { write: rowId, points, doubled, loss, gain } — writing into a free row, or
  //   { hold: [faces], points, gain, aims: [ending], miss: ending | null } — keeping these dice and
  //   rolling, where an ending is { row: rowId, chance: 0..1, points, gain, values: [{ points, chance }] }
  //   (see endings) and an aim also has now: what its row would take from the dice as they lie, null
  //   when it would be given up or not closed.
  // `points` is what goes on the sheet (for a roll: on average, by the best moves to the end of the
  // turn); `gain` is how much the move changes what the player can expect by the end of the game,
  // the number the moves are compared by.
  function options(cells, dice, rollNo) {
    const free = ALL_ROWS.map((r) => r.id).filter((r) => !cells[r]);
    if (!free.length) return [];
    const mask = maskOf(free);
    const list = free.map((r) => {
      const sc = rowScore(r, dice, rollNo);
      return { write: r, points: sc.p, doubled: sc.d, loss: isLoss(r, sc), gain: sc.p - rowCost(r, mask) };
    });
    if (rollNo < ROLLS_PER_TURN) {
      const lv = levels(free);
      const rollsAfter = ROLLS_PER_TURN - rollNo - 1;
      const values = rollsAfter === 0 ? lv.v0 : lv.v1;
      const points = rollsAfter === 0 ? lv.p0 : lv.p1;
      for (const key of SET_HOLDS[SET_INDEX[keyOf(dice)]]) {
        if (key.length === DICE_COUNT) continue;
        const e = endings(key, rollsAfter, lv);
        for (const a of e.aims) {
          const sc = rowScore(a.row, dice, rollNo);
          a.now = isLoss(a.row, sc) ? null : sc.p;
        }
        list.push({ hold: key.split('').map(Number), points: holdValue(key, points), gain: holdValue(key, values), aims: e.aims, miss: e.miss });
      }
    }
    return list.sort((x, y) => y.gain - x.gain);
  }

  // The best move
  function advise(cells, dice, rollNo) {
    return options(cells, dice, rollNo)[0] || null;
  }

  // what a player's free rows can bring from now on, before a roll
  function expected(cells) {
    return STATE_VALUE[maskOf(ALL_ROWS.map((r) => r.id).filter((r) => !cells[r]))];
  }

  return { advise, options, expected };
})();
