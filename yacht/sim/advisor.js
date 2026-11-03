'use strict';

// Yacht — the moves and what each brings, shown on Easy: an exact calculation over the 252 sets of five dice. For
// each set and rolls left, the best of writing now or holding some dice and rolling, where writing
// is worth the row's points minus ROW_WORTH (what giving the row up costs). It looks at one turn
// only, so it is good advice, not perfect play. Read by ui/card.js and ui/table.js; has no state of the game.

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

  // writing a set into the best free row: { value, row, points, scores } for each set, for a first
  // roll or a later one; `scores` is false when that row would be given up or not closed
  function writeTable(free, firstRoll) {
    return SETS.map((s) => {
      let best = -Infinity, row = null, score = null;
      for (const r of free) {
        const sc = rowScore(r, s.dice, firstRoll ? 1 : 2);
        const v = sc.p - ROW_WORTH[r];
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

  // which row a kept set most likely scores in, and how likely: follows the best moves to the end;
  // an end that gives a row up is no aim
  function aim(key, rollsAfter, lv) {
    const chance = {};
    const add = (set, w) => {
      const e = lv.later[set];
      if (e.scores) chance[e.row] = (chance[e.row] || 0) + w;
    };
    for (const n of HOLDS[key].next) {
      if (rollsAfter === 0) add(n.set, n.weight);
      else {
        const e = lv.lvl1[n.set];
        if (e.row) add(n.set, n.weight);
        else for (const m of HOLDS[e.hold].next) add(m.set, n.weight * m.weight);
      }
    }
    let best = null;
    for (const r in chance) if (!best || chance[r] > chance[best]) best = r;
    return { row: best, chance: best ? chance[best] : 0 };
  }

  // Every move a player has after their roll number rollNo (1–3), the best first:
  //   { write: rowId, points, doubled, loss, gain } — writing into a free row, or
  //   { hold: [faces], points, gain, aim: rowId, chance: 0..1 } — keeping these dice and rolling.
  // `points` is what goes on the sheet (for a roll: on average, by the best moves to the end of the
  // turn); `gain` is how much that beats what the row usually brings (ROW_WORTH), the number the
  // moves are compared by.
  function options(cells, dice, rollNo) {
    const free = ALL_ROWS.map((r) => r.id).filter((r) => !cells[r]);
    if (!free.length) return [];
    const list = free.map((r) => {
      const sc = rowScore(r, dice, rollNo);
      return { write: r, points: sc.p, doubled: sc.d, loss: isLoss(r, sc), gain: sc.p - ROW_WORTH[r] };
    });
    if (rollNo < ROLLS_PER_TURN) {
      const lv = levels(free);
      const rollsAfter = ROLLS_PER_TURN - rollNo - 1;
      const values = rollsAfter === 0 ? lv.v0 : lv.v1;
      const points = rollsAfter === 0 ? lv.p0 : lv.p1;
      for (const key of SET_HOLDS[SET_INDEX[keyOf(dice)]]) {
        if (key.length === DICE_COUNT) continue;
        const a = aim(key, rollsAfter, lv);
        list.push({ hold: key.split('').map(Number), points: holdValue(key, points), gain: holdValue(key, values), aim: a.row, chance: a.chance });
      }
    }
    return list.sort((x, y) => y.gain - x.gain);
  }

  // The best move
  function advise(cells, dice, rollNo) {
    return options(cells, dice, rollNo)[0] || null;
  }

  return { advise, options };
})();
