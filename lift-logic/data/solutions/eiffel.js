'use strict';

// Lift Logic — the engineer's solutions of chapter 7 (the Eiffel Tower), in the text notation of
// sim/program.js. Used by hint 3, the Engineer's record and tools/missions-check.js.

(() => {
  // a call this lift can take: in its range, and not ▲ at its top or ▼ at its bottom (that one is for the
  // other bank)
  const calls = `when call button pressed (floor) (direction)
if <<not <(floor) < (bottom floor)>> and <not <(floor) > (top floor)>>> then
  if <not <<(floor) = (top floor)> and <(direction) = [up]>>> then
    if <not <<(floor) = (bottom floor)> and <(direction) = [down]>>> then
      add floor (floor) to plan`;
  const buttons = `

when button pressed inside (floor)
add floor (floor) to plan`;
  const onTheWay = `

when I'm about to pass floor (floor)
if <<call on floor (floor) (my direction)?> or <button (floor) pressed inside?>> then
  stop here`;
  // a long trip up is worth a few seconds of waiting on the ground
  const holdGround = (s) => `

when I arrive at floor (floor)
if <(floor) = (1)> then
  hold doors (${s}) seconds`;
  // the four lifts look at the buttons themselves (the bells ring in the ticket office)
  const look = `define look for calls
for each [f] from (bottom floor) to (top floor)
  if <<<call on floor (f) [up]?> and <(f) < (top floor)>> or <<call on floor (f) [down]?> and <(f) > (bottom floor)>>> then
    add floor (f) to plan`;
  // the summit lift waits on the deck while summit visitors are on their way up, else at the top
  const tickets = `

every (2) seconds
if <<(bottom floor) = (3)> and <(plan length) = (0)>> then
  if <(tickets to (4)) > (0)> then
    if <not <(current floor) = (3)>> then
      add floor (3) to plan
  else
    if <not <(current floor) = (4)>> then
      add floor (4) to plan`;
  // the nearer lift of the two in this bank takes the call (lifts 1 and 2 are the pillars, 3 and 4 the summit)
  const twins = `when call button pressed (floor) (direction)
if <<not <(floor) < (bottom floor)>> and <not <(floor) > (top floor)>>> then
  if <not <<(floor) = (top floor)> and <(direction) = [up]>>> then
    if <not <<(floor) = (bottom floor)> and <(direction) = [down]>>> then
      set [twin] to (((my number) + (1)) − ((2) × (((my number) + (1)) mod (2))))
      if <not <((distance from (floor of lift (twin)) to (floor)) + (plan length of lift (twin))) < ((distance from (current floor) to (floor)) + (plan length))>> then
        add floor (floor) to plan`;
  // an announcement or the wind: the summit lifts go up, the pillar lifts to the deck, and they stay there
  const evacuate = `put floor (top floor) first in plan
set [alarm] to (1)`;
  const stayUp = `

when I'm idle
if <<(alarm) = (1)> and <not <(current floor) = (top floor)>>> then
  add floor (top floor) to plan`;
  addSolutions({
    '7-1': `when call button pressed (floor) (direction)
add floor (floor) to plan` + buttons + onTheWay + holdGround(15),
    '7-2': calls + buttons + onTheWay + holdGround(6),
    '7-3': look + `

when ▶ clicked
forever
  wait until <(plan length) = (0)>
  look for calls
  wait (1) seconds

when doors close
look for calls` + buttons + holdGround(5),
    '7-4': calls + buttons + onTheWay + holdGround(5) + tickets,
    '7-5': calls + buttons + onTheWay + holdGround(4) + `

when weather changes (weather)
if <(weather) = [windy]> then
  put floor (top floor) first in plan
  set [alarm] to (1)
else
  set [alarm] to (0)` + stayUp,
    '7-6': `define check floor (f)
if <<<call on floor (f) [up]?> and <(f) < (top floor)>> or <<call on floor (f) [down]?> and <(f) > (bottom floor)>>> then
  add floor (f) to plan

when ▶ clicked
forever
  wait until <(plan length) = (0)>
  check floor (bottom floor)
  check floor ((bottom floor) + (1))
  check floor (top floor)
  wait (1) seconds` + buttons,
    '7-7': `define wait up to (s) seconds
if <<(load %) < (50)> and <(s) > (0)>> then
  hold doors (1) seconds
  wait (1) seconds
  wait up to ((s) − (1)) seconds

` + calls + buttons + `

when I arrive at floor (floor)
if <(floor) = (1)> then
  wait up to (6) seconds`,
    '7-8': twins + buttons + onTheWay + holdGround(8),
    '7-9': twins + buttons + onTheWay + holdGround(4) + `

when message from building [closing soon]
` + evacuate + stayUp
  });
})();
