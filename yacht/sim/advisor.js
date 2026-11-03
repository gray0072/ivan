'use strict';

// Yacht — the best move, shown on Easy: an exact calculation over the 252 sets of five dice. For
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

  // writing a set into the best free row: { value, row } for each set, for a first roll or a later one
  function writeTable(cells, free, firstRoll) {
    return SETS.map((s) => {
      let best = -Infinity, row = null;
      for (const r of free) {
        const v = rowScore(r, s.dice, firstRoll ? 1 : 2).p - ROW_WORTH[r];
        if (v > best) { best = v; row = r; }
      }
      return { value: best, row };
    });
  }

  function holdValue(key, values) {
    let v = 0;
    for (const n of HOLDS[key].next) v += n.weight * values[n.set];
    return v;
  }

  // the policy after this roll: for each set the value, and either the row or the kept dice
  function levels(cells, free) {
    const later = writeTable(cells, free, false);
    const v0 = later.map((w) => w.value);
    const lvl1 = SETS.map((s, i) => {
      let best = later[i].value, hold = null;
      for (const key of SET_HOLDS[i]) {
        if (key.length === DICE_COUNT) continue;
        const v = holdValue(key, v0);
        if (v > best + 1e-9) { best = v; hold = key; }
      }
      return { value: best, row: hold === null ? later[i].row : null, hold };
    });
    return { later, v0, lvl1, v1: lvl1.map((e) => e.value) };
  }

  // which row a kept set most likely scores in, and how likely: follows the best moves to the end;
  // an end that gives a row up is no aim
  function aim(key, rollsAfter, lv) {
    const chance = {};
    const add = (row, set, w) => {
      if (!isLoss(row, rowScore(row, SETS[set].dice, 2))) chance[row] = (chance[row] || 0) + w;
    };
    for (const n of HOLDS[key].next) {
      if (rollsAfter === 0) add(lv.later[n.set].row, n.set, n.weight);
      else {
        const e = lv.lvl1[n.set];
        if (e.row) add(e.row, n.set, n.weight);
        else for (const m of HOLDS[e.hold].next) add(lv.later[m.set].row, m.set, n.weight * m.weight);
      }
    }
    let best = null;
    for (const r in chance) if (!best || chance[r] > chance[best]) best = r;
    return { row: best, chance: best ? chance[best] : 0 };
  }

  // The advice for a player's dice after their roll number rollNo (1–3):
  //   { write: rowId } or { hold: [faces], aim: rowId, chance: 0..1 }
  function advise(cells, dice, rollNo) {
    const free = ALL_ROWS.map((r) => r.id).filter((r) => !cells[r]);
    if (!free.length) return null;
    const i = SET_INDEX[keyOf(dice)];
    const lv = levels(cells, free);
    const now = writeTable(cells, free, rollNo === 1)[i];
    if (rollNo >= ROLLS_PER_TURN) return { write: now.row };
    const rollsAfter = ROLLS_PER_TURN - rollNo - 1;
    const values = rollsAfter === 0 ? lv.v0 : lv.v1;
    let best = now.value, hold = null;
    for (const key of SET_HOLDS[i]) {
      if (key.length === DICE_COUNT) continue;
      const v = holdValue(key, values);
      if (v > best + 1e-9) { best = v; hold = key; }
    }
    if (hold === null) return { write: now.row };
    const a = aim(hold, rollsAfter, lv);
    return { hold: hold.split('').map(Number), aim: a.row, chance: a.chance };
  }

  return { advise };
})();
