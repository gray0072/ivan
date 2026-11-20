'use strict';

// Lift Logic — the building of a run: its floors and the hall call buttons ▲ ▼ on every landing (shared
// by the lifts of the group), the hospital's emergency keys, and which floors a lift may stop at. A call
// lit from off to on is announced to the program (sim/vm.js) as `when call button pressed` — unless the
// mission's bell is broken (`bellBroken`): then the lift has to look at the buttons itself. Used by
// sim/people.js (pressing), sim/lift.js (clearing) and sim/sensors.js (reading).

const Building = {
  // the landings of a new run
  init() {
    run.hall = run.floors.map(() => ({ up: false, upT: 0, down: false, downT: 0, emergency: false, presses: 0 }));
  },

  // a person presses ▲ (dir 'up') or ▼ ('down') on floor index i
  press(i, dir) {
    const h = run.hall[i];
    h.presses++;
    if (h[dir]) return false;
    h[dir] = true;
    h[dir + 'T'] = run.t;
    logEvent('call', { floor: run.floors[i], dir });
    if (!run.bellBroken) VM.event('onCall', null, { floor: run.floors[i], direction: dir });
    GameEvents.emit('callPressed', { floor: run.floors[i], dir });
    return true;
  },
  // the call is still lit when the doors close there: the controller hears it again
  announce(i) {
    if (run.bellBroken) return;
    const h = run.hall[i];
    for (const dir of ['up', 'down']) if (h[dir]) VM.event('onCall', null, { floor: run.floors[i], direction: dir });
  },
  clear(i, dir) {
    const h = run.hall[i];
    if (!h[dir]) return;
    h[dir] = false;
    logEvent('callServed', { floor: run.floors[i], dir, waited: run.t - h[dir + 'T'] });
  },
  emergency(i) {
    const h = run.hall[i];
    if (h.emergency) return;
    h.emergency = true;
    h.emergencyT = run.t;
    logEvent('emergency', { floor: run.floors[i] });
    VM.event('onEmergency', null, { floor: run.floors[i] });
    GameEvents.emit('emergency', { floor: run.floors[i] });
  },

  isLit(i, dir) {
    const h = run.hall[i];
    if (dir === 'up') return h.up;
    if (dir === 'down') return h.down;
    return h.up || h.down;
  },
  // how long the call has been lit, s (the longer of the two for 'any'); 0 when not lit
  waitingTime(i, dir) {
    const h = run.hall[i];
    const up = h.up ? run.t - h.upT : 0, down = h.down ? run.t - h.downT : 0;
    if (dir === 'up') return up;
    if (dir === 'down') return down;
    return Math.max(up, down);
  }
};
