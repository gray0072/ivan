'use strict';

// Arlanda Rising — the campaign's chapters and the list of every mission. The chapters' own files
// (data/missions/ch1.js, …) add their missions with addMissions(chapter, [...]). A mission has:
//   name, kind     build, operate, business, crisis, choice, exam (SPEC.md "Mission kinds")
//   date           its first day ("1962-04-01"); the calendar jumps there, the time between run in summary
//   requires       the master-plan projects that stand at its start (the owner builds those still missing —
//                  after a cheat's jump, or the ones history built between missions)
//   setup          budget (SEK from the owner, × the difficulty), loanLimit, open (traffic in summary),
//                  projects (to build), items ({ kind: n } owned at least), desks, airlines ({ code: routes })
//   grants         projects the owner's grant may pay for
//   hands          the kinds of tray tasks the player does (stand, fuel, checkin, plough); a stage may set its own
//   brief          two or three of Astrid's speech bubbles; aim: the one line of its aim; news: [{ icon, text }] what is new
//   stages         [{ name, mode: 'ops' | 'plan', … }]:
//                  ops: from, to (clock), flights (sim/schedule.js), weather (sim/weather.js), desks (open at the
//                       start), snowStart (mm), events ([{ at, do: closeStand | openStand, stand }])
//                  plan: days, crews, endEarly (ends once its goal is met and no work goes on), choices ([{ id, at (day), default,
//                       options: [{ id, money, meters, neighboursBase, extraDays, flag, airline, build, fees, crews }] }])
//                  date (optional: the calendar jumps there first), goal (the stage's goals, sim/goals.js)
//   goal, stars    the mission's own goals for ★ (besides every stage passed), and the two for ★★ and ★★★
//   real           (optional) the Real Arlanda medal: a goal with the real airport's number, its year and source
//   facts          the history the briefing tells, with its source (checked before it is shown)
// Each mission's minutes at ▶ are measured by tools/missions-check.js.

const CHAPTERS = [
  { n: 1, name: 'The Forest Field', years: '1959–1962' },
  { n: 2, name: 'The Jet Age', years: '1963–1979' },
  { n: 3, name: 'Everyone Comes to Arlanda', years: '1980s' },
  { n: 4, name: 'Open Skies', years: '1990s' },
  { n: 5, name: 'A New Millennium', years: '2000–2009' },
  { n: 6, name: 'Bigger and Greener', years: '2010–2019' },
  { n: 7, name: 'Storm Years', years: '2020–2024' },
  { n: 8, name: 'Arlanda 2040', years: '2025–2040' }
];

const MISSIONS = [];
const MISSION = {};
function addMissions(chapter, list) {
  list.forEach((m, i) => {
    m.chapter = chapter;
    m.n = i + 1;
    m.id = chapter + '-' + (i + 1);
    MISSIONS.push(m);
    MISSION[m.id] = m;
  });
}
