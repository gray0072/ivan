'use strict';

// Arlanda Rising — the list of reference strategies, one per mission id; the chapters' files
// (data/strategies/ch1.js, …) fill it. A strategy is described in sim/strategy.js.

const STRATEGIES = {};
// a quick but human player: does a tray task once it has waited a game minute
const REACT_QUICK = { react: 1 };
