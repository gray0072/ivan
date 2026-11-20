'use strict';

// Lift Logic — the run's shared state, declared once: the run in progress (`run`, built by sim/run.js)
// with its building, lifts, people, hall calls, the program's threads and variables, the counters the
// stars and the Inspector read, and the log of the day. Every other sim/ file reads and changes it
// here; render/ and ui/ only read it.

let run = null;

// the index of a floor label in the building (floor 1 is the ground floor, −1 the first basement)
function floorIndex(label) {
  const i = run.floors.indexOf(Number(label));
  return i;
}
function floorLabel(i) { return run.floors[Math.round(i)]; }
function hasFloor(label) { return typeof label === 'number' && Number.isInteger(label) && run.floors.indexOf(label) >= 0; }

// the labels of a building of `count` floors with `basements` below floor 1 (there is no floor 0)
function floorLabels(count, basements = 0) {
  const out = [];
  for (let b = basements; b >= 1; b--) out.push(-b);
  for (let f = 1; f <= count - basements; f++) out.push(f);
  return out;
}

// what happened, for the Inspector and the results' chart: { t, type, ... }
function logEvent(type, data) {
  if (!run) return;
  data.t = run.t;
  data.type = type;
  run.log.push(data);
}
