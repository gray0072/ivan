'use strict';

// Lift Logic — the engineer's solutions of chapter 5 (Glass Tower), in the text notation of sim/program.js.
// A `#shared` line names the variables that are for all lifts. Used by hint 3, the Engineer's record and
// tools/missions-check.js.

(() => {
  const buttons = `when button pressed inside (floor)
add floor (floor) to plan`;
  const onTheWay = `

when I'm about to pass floor (floor)
if <<call on floor (floor) (my direction)?> or <button (floor) pressed inside?>> then
  stop here`;
  // of two lifts, the nearer one takes the call (lift 1 on a tie)
  const nearestSimple = `when call button pressed (floor) (direction)
set [mine] to (distance from (current floor) to (floor))
set [other] to (distance from (floor of lift ((3) − (my number))) to (floor))
if <<(mine) < (other)> or <<(mine) = (other)> and <(my number) = (1)>>> then
  add floor (floor) to plan

` + buttons;
  // the same, and every floor a lift still has to visit counts as two floors further
  const nearest = `when call button pressed (floor) (direction)
set [mine] to ((distance from (current floor) to (floor)) + ((plan length) × (2)))
set [other] to ((distance from (floor of lift ((3) − (my number))) to (floor)) + ((plan length of lift ((3) − (my number))) × (2)))
if <<(mine) < (other)> or <<(mine) = (other)> and <(my number) = (1)>>> then
  add floor (floor) to plan

` + buttons;
  // of all the lifts, the nearest one takes the call
  const nearestOfAll = `when call button pressed (floor) (direction)
set [best] to 1
set [k] to 2
repeat ((lifts in group) − (1))
  if <((distance from (floor of lift (k)) to (floor)) + ((plan length of lift (k)) × (2))) < ((distance from (floor of lift (best)) to (floor)) + ((plan length of lift (best)) × (2)))> then
    set [best] to (k)
  change [k] by 1
if <(best) = (my number)> then
  add floor (floor) to plan

` + buttons;
  addSolutions({
    '5-1': `when call button pressed (floor) (direction)
if <<(my number) = (1)> and <(direction) = up>> then
  add floor (floor) to plan
if <<(my number) = (2)> and <(direction) = down>> then
  add floor (floor) to plan

` + buttons,
    '5-2': nearest + onTheWay,
    '5-3': `#shared served
when call button pressed (floor) (direction)
add floor (floor) to plan

` + buttons + `

when I arrive at floor (floor)
set [served] to (floor)
broadcast [served]

when I receive [served]
if <not <button (served) pressed inside?>> then
  remove floor (served) from plan`,
    '5-4': nearest + onTheWay + `

when I'm idle
if <not <(current floor) = (1)>> then
  add floor 1 to plan

when I arrive at floor (floor)
if <(floor) = (1)> then
  hold doors 3 seconds`,
    '5-5': nearest + onTheWay + `

when I'm idle
if <not <(current floor) = (8)>> then
  add floor 8 to plan`,
    '5-6': `#shared evening
` + nearest + onTheWay + `

when clock is [17:00]
set [evening] to 1

when I'm idle
set [park] to 1
if <(evening) = (1)> then
  set [park] to ((8) + ((my number) × (4)))
if <not <(current floor) = (park)>> then
  add floor (park) to plan`,
    '5-7': nearestSimple,
    '5-8': nearestOfAll + onTheWay,
    '5-9': nearestOfAll + onTheWay + `

when I'm idle
set [park] to 1
if <(clock hour) > (10)> then
  set [park] to 8
if <(clock hour) > (15)> then
  set [park] to ((4) × ((my number) + (1)))
if <not <(current floor) = (park)>> then
  add floor (park) to plan`
  });
})();
