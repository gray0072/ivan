'use strict';

// Arlanda Rising — the domains of the airport's work and their automation ladder (SPEC.md "Manual, people,
// systems"), as plain data. Each domain has:
//   name     as shown
//   icon     on the Ops Center's rows
//   tasks    the kinds of tray tasks it makes while it is worked by hand (sim/tasks.js)
//   levels   0 by hand (the player), 1 people, 2 a system, 3 integrated; each level above 0:
//            name, staff (jobs), price (SEK to set up), month (SEK running cost besides wages: a licence,
//            spare parts), delay (game minutes before a task is done), right (share of good choices),
//            from (first year); a system (level 2) also: it (IT jobs it needs), mtbf (game hours between
//            failures on average), fix (game minutes a failure takes to mend), days (to install in plan time)
// Level 3 (integrated) comes with chapter 4 for the bags, with chapters 5–6 for the stands (A-CDM), check-in (self bag
// drop), security (CT scanners) and de-icing (glycol recovery): a system that fails falls to the level below it.
// Session 6 adds the apron robots (turnaround level 2), the self-driving ploughs (snow level 3) and biometric boarding
// (border level 3) of chapter 8. Chapter 1 is worked by hand only; the people level comes with chapter 2, the first machines and systems with
// chapters 2 and 3. A domain is part of the game once a mission opens it (S.domains has its key), so the
// baggage and information domains cost nothing in summary before their chapters.

const DOMAINS = {
  stands: { name: 'Stands', icon: '🛬', tasks: ['stand'], levels: [
    { name: 'By hand' },
    { name: 'Stand planner', staff: 4, price: 0, month: 0, delay: 1, right: 0.85, from: 1963 },
    { name: 'Stand allocation computer', staff: 2, price: 25e6, month: 150000, delay: 0.5, right: 0.97, from: 1980,
      it: 3, mtbf: 30, fix: 50, days: 20 },
    // session 5: A-CDM — the airport, the airlines, the handlers and the tower share their times; start-up in sequence
    { name: 'A-CDM (shared times)', staff: 2, price: 60e6, month: 400000, delay: 0.25, right: 0.99, from: 2009,
      it: 4, mtbf: 50, fix: 45, days: 30 }
  ] },
  turnaround: { name: 'Turnaround', icon: '⛽', tasks: ['fuel', 'charge'], levels: [
    { name: 'By hand' },
    { name: 'Ramp supervisor', staff: 4, price: 0, month: 0, delay: 1.5, right: 0.9, from: 1963 },
    // session 6: robots that fuel, charge and tow the aircraft by themselves; the services go faster (ROBOT_X)
    { name: 'Apron robots', staff: 2, price: 70e6, month: 450000, delay: 0.25, right: 1, from: 2030,
      it: 3, mtbf: 40, fix: 45, days: 30 }
  ] },
  checkin: { name: 'Check-in', icon: '🧳', tasks: ['checkin'], levels: [
    { name: 'By hand' },
    { name: 'Desk scheduler', staff: 3, price: 0, month: 0, delay: 3, right: 0.9, from: 1963 },
    { name: 'Check-in computers', staff: 1, price: 18e6, month: 120000, delay: 1, right: 0.97, from: 1985,
      it: 2, mtbf: 25, fix: 40, days: 15 },
    // session 5: kiosks and self bag drop — the passengers do most of it themselves
    { name: 'Kiosks and self bag drop', staff: 1, price: 40e6, month: 300000, delay: 0.5, right: 0.99, from: 2008,
      it: 3, mtbf: 40, fix: 40, days: 25 }
  ] },
  snow: { name: 'Snow and ice', icon: '❄️', tasks: ['plough'], levels: [
    { name: 'By hand' },
    { name: 'Snow chief with convoys', staff: 4, price: 0, month: 0, delay: 4, right: 0.9, from: 1963 },
    { name: 'Weather-based clearing plan', staff: 2, price: 12e6, month: 80000, delay: 1.5, right: 0.97, from: 1985,
      it: 1, mtbf: 40, fix: 60, days: 15 },
    // session 6: ploughs that drive themselves in a convoy (AUTO_PLOUGH_X faster); a failure falls to the clearing plan
    { name: 'Self-driving ploughs', staff: 1, price: 50e6, month: 300000, delay: 0.5, right: 1, from: 2030,
      it: 2, mtbf: 35, fix: 50, days: 25 }
  ] },
  baggage: { name: 'Baggage', icon: '🛄', tasks: ['bags'], levels: [
    { name: 'By hand' },
    { name: 'Baggage handlers', staff: 8, price: 0, month: 0, delay: 1.5, right: 0.92, from: 1963 },
    { name: 'Conveyor belts', staff: 4, price: 30e6, month: 100000, delay: 0.5, right: 0.98, from: 1973,
      it: 0, mtbf: 18, fix: 35, days: 25 },
    // session 4: bar-code tags read by the sorter; it needs the sorting hall, and when it fails the belts take over
    { name: 'Bar-code sorting system', staff: 2, price: 80e6, month: 250000, delay: 0.25, right: 0.995, from: 1990,
      it: 3, mtbf: 40, fix: 45, days: 30 }
  ] },
  info: { name: 'Information', icon: '📢', tasks: ['announce'], levels: [
    { name: 'By hand' },
    { name: 'PA operator', staff: 2, price: 0, month: 0, delay: 1, right: 0.95, from: 1963 },
    { name: 'Flight information screens', staff: 1, price: 10e6, month: 60000, delay: 0.25, right: 1, from: 1980,
      it: 2, mtbf: 30, fix: 40, days: 15 }
  ] },
  // ---------- session 5 ----------
  // security: the lanes opened and closed as the queue grows (from chapter 5 the lanes are a domain of their own)
  security: { name: 'Security', icon: '🛂', tasks: ['lane'], levels: [
    { name: 'By hand' },
    { name: 'Security shift planner', staff: 3, price: 0, month: 0, delay: 2, right: 0.95, from: 1990 },
    { name: 'Queue sensors', staff: 1, price: 15e6, month: 100000, delay: 0.5, right: 1, from: 2004,
      it: 2, mtbf: 40, fix: 30, days: 15 },
    { name: 'CT scanners', staff: 1, price: 120e6, month: 600000, delay: 0.5, right: 1, from: 2018,
      it: 3, mtbf: 50, fix: 40, days: 40 }
  ] },
  // the border (from Schengen): Polisen checks the passports, the airport opens the booths and pays for the space
  border: { name: 'Border', icon: '🛃', tasks: ['booth'], levels: [
    { name: 'By hand' },
    { name: 'Police shift planner', staff: 0, price: 0, month: 0, delay: 2, right: 0.95, from: 2001 },
    { name: 'e-gates', staff: 0, price: 30e6, month: 200000, delay: 0.5, right: 1, from: 2013,
      it: 1, mtbf: 45, fix: 30, days: 20 },
    // session 6: the face is the boarding pass — through the border and onto the aircraft without a document
    { name: 'Biometric boarding', staff: 0, price: 60e6, month: 350000, delay: 0.25, right: 1, from: 2030,
      it: 2, mtbf: 50, fix: 35, days: 25 }
  ] },
  // de-icing: a truck to every departure in the cold, then a crew, then the remote pads by the runways, then glycol
  // recovery (the fluid caught on the pads and cleaned)
  deice: { name: 'De-icing', icon: '🧊', tasks: ['deice'], levels: [
    { name: 'By hand' },
    { name: 'De-icing crew', staff: 6, price: 0, month: 0, delay: 2, right: 0.95, from: 1990 },
    { name: 'Remote de-icing pads', staff: 4, price: 40e6, month: 300000, delay: 0, right: 1, from: 2002,
      it: 1, mtbf: 60, fix: 40, days: 25 },
    { name: 'Glycol recovery', staff: 3, price: 60e6, month: 400000, delay: 0, right: 1, from: 2005,
      it: 1, mtbf: 80, fix: 60, days: 30 }
  ] }
};

// the domain a kind of task belongs to
const TASK_DOMAIN = {};
for (const d of Object.keys(DOMAINS)) for (const k of DOMAINS[d].tasks) TASK_DOMAIN[k] = d;
