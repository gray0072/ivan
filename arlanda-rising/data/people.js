'use strict';

// Arlanda Rising — the people, as plain data (SPEC.md "People"): the departments and the managers who can lead them.
//   DEPTS     one per domain worked by people (its key is the domain's) and IT: name, union (as shown, named by
//             its role, never after a real union), clearance (the first year its new staff need a security
//             clearance, CLEARANCE_DAYS; none before chapter 5)
//   MANAGERS  fictional people: name, dept, from (the first year they can be hired), salary (× MANAGER_SALARY),
//             perks (numbers the sim reads, sim/people.js `perk`), good (two lines on their strengths), bad (the
//             flaw), face (an icon). Candidates come in pairs (a mission's decision, or the Office).
// The perks: right (+ share of good choices), fast (× (1 − fast) the team's delay), slow (× (1 + slow) the delay;
// at check-in the desks work that much slower), mood (× (1 − mood) how far an airline's mood falls), convoy
// (× (1 − convoy) a plough run), warn (mm earlier the ploughs go out), stormBills (each convoy run costs ×2),
// morale (+ the team's morale), absence (× the team's absence), fix (× the time to mend a failure), mtbf (× the
// time between failures), itNeed (× the IT jobs the systems need), strike (+ the union's mood in a wage round),
// newest (the manager's mood drops a month with no new system), oldSystems (years: older systems upset the team).

const DEPTS = {
  stands: { name: 'Operations', union: "The operations staff's union" },
  turnaround: { name: 'Ground handling', union: "The ramp workers' union", clearance: 2002 },
  checkin: { name: 'Terminal service', union: "The terminal staff's union" },
  snow: { name: 'Snow and maintenance', union: "The maintenance workers' union" },
  baggage: { name: 'Baggage', union: "The baggage handlers' union", clearance: 2002 },
  info: { name: 'Information', union: "The terminal staff's union" },
  it: { name: 'IT', union: "The engineers' union" },
  // session 5: security (a clearance for every new screener), the border (the police: the airport pays no wages and
  // the officers' absence is the police's own matter) and de-icing
  security: { name: 'Security', union: "The security staff's union", clearance: 2002 },
  border: { name: 'Border', union: "The police officers' union", police: true },
  deice: { name: 'De-icing', union: "The ramp workers' union", clearance: 2002 }
};

const MANAGERS = {
  karinEk: { name: 'Karin Ek', dept: 'stands', from: 1963, salary: 1.1, face: '👩‍💼',
    perks: { right: 0.12, mood: 0.3, oldSystems: 5 },
    good: ['Plans the stands better: her team picks the right one more often.', "Knows every airline's temper: their mood falls more slowly."],
    bad: 'Will not work with a system more than five years old: her team grumbles.' },
  larsHolm: { name: 'Lars Holm', dept: 'stands', from: 1963, salary: 0.85, face: '👨‍💼',
    perks: { fast: 0.5, right: -0.06 },
    good: ['Quick: his team gives each aircraft its stand twice as fast.', 'Asks for a modest salary.'],
    bad: 'Hasty: a wrong stand now and then.' },
  boLindqvist: { name: 'Bo Lindqvist', dept: 'snow', from: 1963, salary: 1, face: '🧔',
    perks: { convoy: 0.2, warn: 1, stormBills: 1 },
    good: ['His convoys sweep a runway 20 % faster.', 'Smells snow: his ploughs go out at a thinner layer.'],
    bad: 'Overtime bills in every storm: each convoy run costs double.' },
  annaBerg: { name: 'Anna Berg', dept: 'snow', from: 1963, salary: 0.95, face: '👩‍🔧',
    perks: { morale: 8, absence: 0.6, convoy: -0.1 },
    good: ["A calm boss: her team's morale is higher.", 'Fewer sick days in her team.'],
    bad: 'Careful: her convoys are 10 % slower.' },
  miraHaddad: { name: 'Mira Haddad', dept: 'it', from: 1980, salary: 1.2, face: '👩‍💻',
    perks: { fix: 0.5, mtbf: 1.3, newest: 1 },
    good: ['Failures are mended twice as fast.', 'Maintenance on time: the systems fail less often.'],
    bad: 'Wants the newest system every year, and her mood drops when there is none.' },
  jonasWik: { name: 'Jonas Wik', dept: 'it', from: 1980, salary: 0.9, face: '👨‍💻',
    perks: { itNeed: 0.7, fix: 1.3 },
    good: ['Needs fewer IT people for the same systems.', 'Asks for a modest salary.'],
    bad: 'Slow to mend a failure: it takes a third longer.' },
  erikSund: { name: 'Erik Sund', dept: 'checkin', from: 1963, salary: 0.85, face: '👨‍✈️',
    perks: { strike: 0.2, morale: 4, slow: 0.1 },
    good: ['Cheap and calm.', 'A strike is less likely with him: the union trusts him.'],
    bad: 'His desks work 10 % slower.' },
  majaStrom: { name: 'Maja Ström', dept: 'checkin', from: 1963, salary: 1.4, face: '👩‍🏫',
    perks: { fast: 0.6, right: 0.06 },
    good: ['Sees a queue coming: her team opens desks much sooner.', 'Opens the right number of desks.'],
    bad: 'Expensive: her salary is the highest in the building.' },
  sannaLind: { name: 'Sanna Lind', dept: 'turnaround', from: 1963, salary: 1.3, face: '👷‍♀️',
    perks: { fast: 0.5, morale: 5 },
    good: ['Her ramp teams are out to each aircraft twice as fast.', 'The ramp workers like her.'],
    bad: 'Expensive.' },
  pekkaNiemi: { name: 'Pekka Niemi', dept: 'turnaround', from: 1963, salary: 0.9, face: '👷',
    perks: { strike: 0.2, absence: 0.7, slow: 0.25 },
    good: ['An old union man: a strike is less likely.', 'Fewer sick days in his team.'],
    bad: 'Takes his time: his teams are a quarter slower.' },
  // session 5: heads of security
  leilaNordin: { name: 'Leila Nordin', dept: 'security', from: 2001, salary: 1.35, face: '👮‍♀️',
    perks: { fast: 0.6, right: 0.04 },
    good: ['Reads the queue: her planners open a lane much sooner.', 'Opens the right number of lanes.'],
    bad: 'Expensive.' },
  goranFalk: { name: 'Göran Falk', dept: 'security', from: 2001, salary: 0.9, face: '👮',
    perks: { strike: 0.2, absence: 0.7, slow: 0.1 },
    good: ['The screeners trust him: a strike is less likely.', 'Fewer sick days in his team.'],
    bad: 'Thorough: every lane is 10 % slower.' }
};

// The successors: when a department's own heads of MANAGERS have left (retired, poached) or there are none (baggage,
// information, de-icing), the candidates are made of a name of HEAD_NAMES and a style of HEAD_STYLES (sim/people.js
// `mdef`, ids 'next:<dept>:<n>'); two in a row never share a style. The styles use only the perks every team has.
const HEAD_STYLES = [
  { salary: 0.9, perks: { fast: 0.4, right: -0.04 },
    good: ['Quick: the team does its work almost twice as fast.', 'Asks for a modest salary.'], bad: 'Hasty: a wrong choice now and then.' },
  { salary: 1, perks: { right: 0.08, morale: 4, slow: 0.15 },
    good: ['Careful: the team gets it right more often.', 'The team likes the calm pace.'], bad: 'Slow: the team takes 15 % longer.' },
  { salary: 0.95, perks: { morale: 8, absence: 0.6, slow: 0.1 },
    good: ["A calm boss: the team's morale is higher.", 'Fewer sick days in the team.'], bad: 'Takes it easy: the team is 10 % slower.' },
  { salary: 1.4, perks: { fast: 0.5, right: 0.05 },
    good: ['Sees the work coming: the team is twice as fast.', 'Makes the right choice more often.'], bad: 'Expensive: one of the highest salaries in the building.' },
  { salary: 0.85, perks: { strike: 0.2, absence: 0.7, slow: 0.2 },
    good: ['The union trusts this boss: a strike is less likely.', 'Fewer sick days in the team.'], bad: 'Takes time: the team is a fifth slower.' }
];
const HEAD_NAMES = [
  { name: 'Ingrid Sjöberg', face: '👩‍💼' }, { name: 'Per Nyström', face: '👨‍💼' }, { name: 'Helena Dahl', face: '👩‍💼' },
  { name: 'Mats Engström', face: '👨‍💼' }, { name: 'Sofia Lund', face: '👩‍💼' }, { name: 'Ahmed Karimi', face: '👨‍💼' },
  { name: 'Elin Holmgren', face: '👩‍💼' }, { name: 'Johan Strand', face: '👨‍💼' }, { name: 'Nadia Eriksson', face: '👩‍💼' },
  { name: 'Olle Bergman', face: '👨‍💼' }, { name: 'Kristina Ahl', face: '👩‍💼' }, { name: 'Tomas Viklund', face: '👨‍💼' },
  { name: 'Linnea Forsberg', face: '👩‍💼' }, { name: 'Daniel Åkesson', face: '👨‍💼' }, { name: 'Amira Saleh', face: '👩‍💼' },
  { name: 'Henrik Blom', face: '👨‍💼' }
];
