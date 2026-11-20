'use strict';

// Arlanda Rising — the domains of the airport's work and their automation ladder (SPEC.md "Manual, people,
// systems"), as plain data. Each domain has:
//   name     as shown
//   tasks    the kinds of tray tasks it makes while it is worked by hand (sim/tasks.js)
//   levels   0 by hand (the player), 1 people, 2 a system, 3 integrated; each level above 0:
//            name, staff (jobs), price (SEK to set up), month (SEK running cost besides wages),
//            delay (game minutes before a task is done), right (share of good choices), from (first year)
// Chapter 1 is worked by hand only; the people level is used from chapter 2, the systems from chapter 3
// (session 3 adds their failures, uptime and the fallback readiness).

const DOMAINS = {
  stands: { name: 'Stands', tasks: ['stand'], levels: [
    { name: 'By hand' },
    { name: 'Stand planner', staff: 4, price: 0, month: 0, delay: 1, right: 0.85, from: 1963 }
  ] },
  turnaround: { name: 'Turnaround', tasks: ['fuel'], levels: [
    { name: 'By hand' },
    { name: 'Ramp supervisor', staff: 4, price: 0, month: 0, delay: 1.5, right: 0.9, from: 1963 }
  ] },
  checkin: { name: 'Check-in', tasks: ['checkin'], levels: [
    { name: 'By hand' },
    { name: 'Desk scheduler', staff: 3, price: 0, month: 0, delay: 3, right: 0.9, from: 1963 }
  ] },
  snow: { name: 'Snow and ice', tasks: ['plough'], levels: [
    { name: 'By hand' },
    { name: 'Snow chief with convoys', staff: 4, price: 0, month: 0, delay: 4, right: 0.9, from: 1963 }
  ] }
};

// the domain a kind of task belongs to
const TASK_DOMAIN = {};
for (const d of Object.keys(DOMAINS)) for (const k of DOMAINS[d].tasks) TASK_DOMAIN[k] = d;
