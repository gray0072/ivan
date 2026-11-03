'use strict';

// Yacht — the running game's state, in one plain object so it can be saved as JSON after every
// action: `null` while no game is on. Read by the screens, changed only by sim/turn.js.
//
//   id, groupId, startedAt, difficulty ('easy' | 'medium' | 'hard'), cheated,
//   players: [{ id, name, cells: { rowId: { p, d } } }],
//   turn: index of the player whose turn it is,
//   dice: five faces (0 = in the cup), held: five booleans, rollNo: rolls made this turn (0–3),
//   undo: what ↩ Undo brings back, or null,
//   over: true once every row of every player is filled

let Run = null;

function setRun(run) { Run = run; }
