'use strict';

// Lift Logic — the engineer's solutions of chapter 6 (Mega Mall), in the text notation of sim/program.js.
// Used by hint 3, the Engineer's record and tools/missions-check.js.

(() => {
  const buttons = `when button pressed inside (floor)
add floor (floor) to plan`;
  const onTheWay = `

when I'm about to pass floor (floor)
if <<call on floor (floor) (my direction)?> or <button (floor) pressed inside?>> then
  stop here`;
  // a nearly full lift passes the calls by (a cart needs two places)
  const onTheWayRoom = `

when I'm about to pass floor (floor)
if <<button (floor) pressed inside?> or <<call on floor (floor) (my direction)?> and <(load %) < (81)>>> then
  stop here`;
  // the nearest lift takes the call; every floor still in a lift's plan counts as two floors further
  const nearest = `when call button pressed (floor) (direction)
set [best] to 1
for each [k] from (2) to (lifts in group)
  if <((distance from (floor of lift (k)) to (floor)) + ((plan length of lift (k)) × (2))) < ((distance from (floor of lift (best)) to (floor)) + ((plan length of lift (best)) × (2)))> then
    set [best] to (k)
if <(best) = (my number)> then
  add floor (floor) to plan`;
  // the same, skipping the lifts out of order
  const nearestWorking = `when call button pressed (floor) (direction)
set [best] to 0
set [bestCost] to 1000
for each [k] from (1) to (lifts in group)
  set [cost] to ((distance from (floor of lift (k)) to (floor)) + ((plan length of lift (k)) × (2)))
  if <<lift (k) working?> and <(cost) < (bestCost)>> then
    set [best] to (k)
    set [bestCost] to (cost)
if <(best) = (my number)> then
  add floor (floor) to plan`;
  // Tommy's buttons: few riders and many lit buttons — drop the floors pressed inside (but not those with a
  // call waiting) and cancel the buttons; the real riders press their floor again
  const antiPrank = `when doors close
if <<(buttons pressed inside) > (3)> and <(load %) < (50)>> then
  for each [f] from (-3) to (5)
    if <not <(f) = (0)>> then
      if <<button (f) pressed inside?> and <not <call on floor (f) [any]?>>> then
        remove floor (f) from plan
  cancel buttons inside`;
  // an idle lift waits in the car park, each on its own level
  const park = `

when I'm idle
if <not <(current floor) = ((0) − (my number))>> then
  add floor ((0) − (my number)) to plan`;
  // the entrances of the sale, one for each lift
  const entrances = `

when ▶ clicked
add (1) to [entrances]
add (-1) to [entrances]
add (-2) to [entrances]

when clock is [9:59]
add floor (item (my number) of [entrances]) to plan`;
  // an idle lift waits at its entrance
  const parkEntrance = `

when I'm idle
if <not <(current floor) = (item (my number) of [entrances])>> then
  add floor (item (my number) of [entrances]) to plan`;
  addSolutions({
    '6-1': nearest + `

` + buttons + onTheWay,
    '6-2': `when call button pressed (floor) (direction)
if <not <[todo] contains (floor)?>> then
  add (floor) to [todo]

when button pressed inside (floor)
if <not <[todo] contains (floor)?>> then
  add (floor) to [todo]

when ▶ clicked
forever
  wait until <<(plan length) = (0)> and <(length of [todo]) > (0)>>
  add floor (item (1) of [todo]) to plan
  delete (1) of [todo]`,
    '6-3': `when call button pressed (floor) (direction)
if <(load %) < (81)> then
  add floor (floor) to plan

` + buttons + onTheWayRoom + `

when doors close
if <(load %) < (81)> then
  for each [f] from (-3) to (5)
    if <<not <(f) = (0)>> and <call on floor (f) [any]?>> then
      add floor (f) to plan

when I'm idle
for each [f] from (-3) to (5)
  if <<not <(f) = (0)>> and <call on floor (f) [any]?>> then
    add floor (f) to plan`,
    '6-4': nearest + `

` + buttons + `

` + antiPrank + onTheWay + park,
    '6-5': `when ▶ clicked
forever
  for each [f] from (-3) to (5)
    if <<not <(f) = (0)>> and <<call on floor (f) [any]?> or <button (f) pressed inside?>>> then
      go to floor (f)`,
    '6-6': nearest + `

` + buttons + onTheWay + entrances,
    '6-7': nearest + `

` + buttons + park,
    '6-8': nearestWorking + `

` + buttons + onTheWay + park,
    '6-9': nearestWorking + `

` + buttons + `

` + antiPrank + onTheWayRoom + entrances + parkEntrance
  });
})();
