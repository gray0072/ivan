'use strict';

// Lift Logic — the few things a lift can sense besides its own state: the clock of the day, the range of
// floors it serves (the whole building, or its zone and the lobby), its zone, and the tickets scanned at the
// entrance. The per-block readings live in sim/vm.js (evalValue);
// this file keeps the ones the run, the HUD and the VM share.

const Sensors = {
  // minutes since midnight
  clock() { return run.clock0 + run.t * run.clockRate; },
  // the range a lift serves: its zone with the lobby when it has one, else the whole building
  top(L) { return L && L.zone ? floorLabel(Math.max(L.zone[1], L.zoneLobby)) : run.floors[run.floors.length - 1]; },
  bottom(L) { return L && L.zone ? floorLabel(L.zoneLobby >= 0 ? Math.min(L.zone[0], L.zoneLobby) : L.zone[0]) : run.floors[0]; },
  // the zone itself, without the lobby
  zoneLow(L) { return L && L.zone ? floorLabel(L.zone[0]) : run.floors[0]; },
  zoneHigh(L) { return L && L.zone ? floorLabel(L.zone[1]) : run.floors[run.floors.length - 1]; },
  // people at the entrance (the lobby) who scanned a ticket for floor f
  tickets(f) {
    const i = floorIndex(run.lobby);
    return i < 0 ? 0 : run.queues[i].filter((p) => p.dest === f).length;
  }
};
