'use strict';

// Lift Logic — the lift types: top speed (floors/s), acceleration (floors/s²), places, the top speed of an
// express trip (`go express`, no stops on the way; the local speed when not given) and their look in the
// building view. Read by sim/lift.js and art/cabins.js.

const LIFT_TYPES = {
  pillar:   { name: 'Pillar lift',   speed: 0.22, accel: 0.12, cap: 20, body: '#a0703c', trim: '#f1cf8a', doors: '#c9995c' },
  summit:   { name: 'Summit lift',   speed: 0.09, accel: 0.05, cap: 12, body: '#8a5a2b', trim: '#ffd27a', doors: '#b8864e' },
  sky:      { name: 'Skyscraper lift', speed: 3, accel: 1.2, cap: 16, express: 8, body: '#5b4a3a', trim: '#e8c66a', doors: '#a88d5c' },
  old:      { name: 'Old lift',      speed: 0.5, accel: 0.5, cap: 4,  body: '#a8743a', trim: '#e2c48e', doors: '#c8a46a' },
  standard: { name: 'Standard lift', speed: 1,   accel: 1,   cap: 8,  body: '#7d8fa3', trim: '#d6e0ea', doors: '#b9c6d3' },
  bed:      { name: 'Bed lift',      speed: 1.5, accel: 1.2, cap: 12, body: '#6f9fae', trim: '#d4eef3', doors: '#a9d0d9' },
  glass:    { name: 'Glass lift',    speed: 1.5, accel: 1, cap: 10, body: '#5fa8c8', trim: '#e6f7ff', doors: '#a8d8ea' },
  fast:     { name: 'Fast lift',     speed: 2.5, accel: 1.5, cap: 12, body: '#4f6f9a', trim: '#cfe0f5', doors: '#9db7d8' },
  express:  { name: 'Express lift',  speed: 6,   accel: 2,   cap: 16, body: '#3b4a6b', trim: '#ffd27a', doors: '#8796b8' }
};
