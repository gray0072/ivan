'use strict';

// Lift Logic — the few things a lift can sense besides its own state: the clock of the day and the range of
// floors it serves (the whole building, or its zone). The per-block readings live in sim/vm.js (evalValue);
// this file keeps the ones the run, the HUD and the VM share.

const Sensors = {
  // minutes since midnight
  clock() { return run.clock0 + run.t * run.clockRate; },
  top(L) { return L && L.zone ? floorLabel(L.zone[1]) : run.floors[run.floors.length - 1]; },
  bottom(L) { return L && L.zone ? floorLabel(L.zone[0]) : run.floors[0]; }
};
