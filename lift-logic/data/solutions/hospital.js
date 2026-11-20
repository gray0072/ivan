'use strict';

// Lift Logic — the engineer's solutions of chapter 4 (St. Hope Hospital), in the text notation of
// sim/program.js. Used by hint 3, the Engineer's record and tools/missions-check.js.

(() => {
  const basic = `when call button pressed (floor) (direction)
add floor (floor) to plan

when button pressed inside (floor)
add floor (floor) to plan`;
  const onTheWay = `

when I'm about to pass floor (floor)
if <<call on floor (floor) (my direction)?> or <button (floor) pressed inside?>> then
  stop here`;
  // with a bed on board (half the lift) don't stop on the way
  const bedStraight = `

when I'm about to pass floor (floor)
if <<(load %) < (50)> and <<call on floor (floor) (my direction)?> or <button (floor) pressed inside?>>> then
  stop here`;
  const code = `

when emergency call (floor)
put floor (floor) first in plan`;
  const physio = `

when I arrive at floor (floor)
if <(floor) = (2)> then
  hold doors 9 seconds`;
  addSolutions({
    '4-1': basic + onTheWay + code,
    '4-2': `when call button pressed (floor) (direction)
add floor (floor) to plan

when button pressed inside (floor)
if <(load %) < (50)> then
  add floor (floor) to plan
else
  put floor (floor) first in plan` + bedStraight,
    '4-3': basic + onTheWay + physio,
    '4-4': `when ▶ clicked
forever
  wait until <(plan length) = (0)>
  set [best] to 0
  set [longest] to 0
  set [f] to 1
  repeat 10
    if <(waiting time on floor (f) [any]) > (longest)> then
      set [longest] to (waiting time on floor (f) [any])
      set [best] to (f)
    change [f] by 1
  if <(best) > (0)> then
    add floor (best) to plan
  else
    wait 1 seconds

when button pressed inside (floor)
add floor (floor) to plan` + onTheWay,
    '4-5': basic + onTheWay + `

when I arrive at floor (floor)
if <(plan length) = (0)> then
  if <call on floor (floor) [up]?> then
    set arrow to up
  else
    set arrow to down`,
    '4-6': basic + code,
    '4-7': basic + onTheWay + `

when I arrive at floor (floor)
if <(floor) = (1)> then
  hold doors 10 seconds`,
    '4-8': basic + code,
    '4-9': basic + bedStraight + code + physio
  });
})();
