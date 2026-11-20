'use strict';

// Lift Logic — the engineer's solutions of chapter 3 (Grand Sunrise Hotel), in the text notation of
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
  const lobby = `

when I'm idle
if <not <(current floor) = (1)>> then
  add floor 1 to plan`;
  addSolutions({
    '3-1': basic,
    '3-2': basic,
    '3-3': basic + `

when I arrive at floor (floor)
change [stops] by 1`,
    '3-4': `when call button pressed (floor) (direction)
if <not <full?>> then
  add floor (floor) to plan

when button pressed inside (floor)
add floor (floor) to plan

when doors close
if <not <full?>> then
  set [f] to 1
  repeat 8
    if <call on floor (f) [any]?> then
      add floor (f) to plan
    change [f] by 1

when I'm idle
set [g] to 1
repeat 8
  if <call on floor (g) [any]?> then
    add floor (g) to plan
  change [g] by 1`,
    '3-5': basic,
    '3-6': basic + onTheWay,
    '3-7': basic + onTheWay,
    '3-8': basic + onTheWay + lobby,
    '3-9': basic + onTheWay + lobby
  });
})();
