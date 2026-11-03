'use strict';

// Yacht — the sheet's arithmetic, with no state of its own: what a row scores for five dice, a
// player's sums, and the places. Used by sim/turn.js, sim/advisor.js, sim/stats.js and the screens.

function diceCounts(dice) {
  const n = [0, 0, 0, 0, 0, 0, 0];
  for (const d of dice) n[d]++;
  return n;
}

function diceSum(dice) {
  let s = 0;
  for (const d of dice) s += d;
  return s;
}

// a row's points for the dice, without the first-roll double; 0 when a combination does not fit
function basePoints(rowId, dice) {
  const n = diceCounts(dice);
  const row = ROW_BY_ID[rowId];
  if (row.face) return n[row.face] >= SCHOOL_TARGET ? (n[row.face] - SCHOOL_TARGET) * row.face : -SCHOOL_MISS;
  const faces = [6, 5, 4, 3, 2, 1];
  const atLeast = (k) => faces.find((f) => n[f] >= k);
  switch (rowId) {
    case 'g': { const f = atLeast(5); return f ? 5 * f : 0; }
    case 'c': { const f = atLeast(4); return f ? 4 * f : 0; }
    case 'bs': return n[2] && n[3] && n[4] && n[5] && n[6] ? 20 : 0;
    case 'ls': return n[1] && n[2] && n[3] && n[4] && n[5] ? 15 : 0;
    case 'fh32':
    case 'fh23': {
      const three = faces.find((f) => n[f] === 3);
      const two = faces.find((f) => n[f] === 2);
      if (!three || !two) return 0;
      return (rowId === 'fh32' ? three > two : two > three) ? 3 * three + 2 * two : 0;
    }
    case 'pp': {
      const pairs = faces.filter((f) => n[f] >= 2);
      return pairs.length >= 2 ? 2 * pairs[0] + 2 * pairs[1] : 0;
    }
    case 't3': { const f = atLeast(3); return f ? 3 * f : 0; }
    case 'ch': return diceSum(dice);
    default: return 0;
  }
}

// what writing into a row would give: { p: points, d: true when doubled }
function rowScore(rowId, dice, rollNo) {
  const base = basePoints(rowId, dice);
  const doubled = !ROW_BY_ID[rowId].face && rollNo === 1 && base > 0;
  return { p: doubled ? base * FIRST_ROLL_MULTIPLIER : base, d: doubled };
}

// a score that loses something: a combination given up or a school row not closed. A second tap
// is asked before it is written.
function isLoss(rowId, score) {
  return score.p < 0 || (!ROW_BY_ID[rowId].face && score.p === 0);
}

// A player's sums from their cells ({ rowId: { p, d } })
function gameSum(cells) {
  let s = 0;
  for (const r of COMBO_ROWS) if (cells[r.id]) s += cells[r.id].p;
  return s;
}
function schoolSum(cells) {
  let s = 0;
  for (const r of SCHOOL_ROWS) if (cells[r.id]) s += cells[r.id].p;
  return s;
}
function schoolFilled(cells) {
  return SCHOOL_ROWS.filter((r) => cells[r.id]).length;
}
function totalOf(cells) {
  return gameSum(cells) + schoolSum(cells);
}
function rowsLeft(cells) {
  return ALL_ROWS.filter((r) => !cells[r.id]).length;
}

// 1, 2, 3 … by total, the highest first; equal totals share a place. Takes a list of totals.
function placesOf(totals) {
  return totals.map((t) => 1 + totals.filter((o) => o > t).length);
}

function romanPlace(n) {
  return ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n] || String(n);
}
