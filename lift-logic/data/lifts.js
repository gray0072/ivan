'use strict';

// Lift Logic — the lift types: top speed (floors/s), acceleration (floors/s²), places, and their look in
// the building view. Read by sim/lift.js and art/cabins.js.

const LIFT_TYPES = {
  old:      { name: 'Old lift',      speed: 0.5, accel: 0.5, cap: 4,  body: '#a8743a', trim: '#e2c48e', doors: '#c8a46a' },
  standard: { name: 'Standard lift', speed: 1,   accel: 1,   cap: 8,  body: '#7d8fa3', trim: '#d6e0ea', doors: '#b9c6d3' },
  bed:      { name: 'Bed lift',      speed: 1,   accel: 0.8, cap: 12, body: '#6f9fae', trim: '#d4eef3', doors: '#a9d0d9' },
  fast:     { name: 'Fast lift',     speed: 2.5, accel: 1.5, cap: 12, body: '#4f6f9a', trim: '#cfe0f5', doors: '#9db7d8' },
  express:  { name: 'Express lift',  speed: 6,   accel: 2,   cap: 16, body: '#3b4a6b', trim: '#ffd27a', doors: '#8796b8' }
};
