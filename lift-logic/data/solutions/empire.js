'use strict';

// Lift Logic — the engineer's solutions of chapter 8 (the Empire State Building), in the text notation of
// sim/program.js. Used by hint 3, the Engineer's record and tools/missions-check.js.

(() => {
  const calls = `when call button pressed (floor) (direction)
add floor (floor) to plan`;
  // a lift of a zone takes only the calls it can stop at
  const zoneCalls = `when call button pressed (floor) (direction)
if <can I stop at (floor)?> then
  add floor (floor) to plan`;
  const buttons = `

when button pressed inside (floor)
add floor (floor) to plan`;
  const onTheWay = `

when I'm about to pass floor (floor)
if <<button (floor) pressed inside?> or <<call on floor (floor) (my direction)?> and <can I stop at (floor)?>>> then
  stop here`;
  const onTheWay7 = `

when I'm about to pass floor (floor)
if <<button (floor) pressed inside?> or <call on floor (floor) (my direction)?>> then
  stop here`;
  const lobby = `

when I'm idle
if <not <(current floor) = (1)>> then
  add floor (1) to plan`;
  // from the lobby straight up to the lowest floor anyone pressed, and back down express when idle
  const express = `

define express up
set [low] to (top floor)
for each [k] from (1) to (plan length)
  if <(item (k) of plan) > (1)> then
    set [low] to (min of (low) and (item (k) of plan))
go express to floor (low)

when doors close
if <<(current floor) = (1)> and <(plan length) > (0)>> then
  express up`;
  const expressHome = `

when I'm idle
if <not <(current floor) = (1)>> then
  go express to floor (1)`;
  // the own list kept sorted: a floor goes in before the first bigger one
  const sorted = `define put (f) in order
if <not <[todo] contains (f)?>> then
  set [at] to ((length of [todo]) + (1))
  for each [i] from (1) to (length of [todo])
    if <<(item (i) of [todo]) > (f)> and <(at) > (length of [todo])>> then
      set [at] to (i)
  insert (f) at (at) of [todo]`;
  // the top lift waits on 86 while tickets to 102 are in the lobby
  const tickets = `

every (2) seconds
if <<(my zone highest) = (102)> and <(plan length) = (0)>> then
  if <<(tickets to (102)) > (0)> and <(current floor) = (102)>> then
    add floor (86) to plan`;
  addSolutions({
    '8-1': calls + buttons + onTheWay7 + lobby,
    '8-2': zoneCalls + buttons + onTheWay + lobby,
    '8-3': zoneCalls + buttons + onTheWay + express + expressHome,
    '8-4': sorted + `

when button pressed inside (floor)
put (floor) in order

when ▶ clicked
forever
  if <(length of [todo]) > (0)> then
    go to floor (item (1) of [todo])
    delete (1) of [todo]
  else
    if <call on floor (1) [any]?> then
      go to floor (1)
    else
      wait (0.5) seconds`,
    '8-5': sorted + `

when call button pressed (floor) (direction)
put (floor) in order

when button pressed inside (floor)
put (floor) in order

when ▶ clicked
set [dir] to (1)
forever
  wait until <(length of [todo]) > (0)>
  set [next] to (0)
  for each [k] from (1) to (length of [todo])
    if <(dir) = (1)> then
      if <<(next) = (0)> and <not <(item (k) of [todo]) < (current floor)>>> then
        set [next] to (item (k) of [todo])
    else
      if <not <(item (k) of [todo]) > (current floor)>> then
        set [next] to (item (k) of [todo])
  if <(next) = (0)> then
    set [dir] to ((0) − (dir))
  else
    go to floor (next)
    delete (item # of (next) in [todo]) of [todo]`,
    '8-6': zoneCalls + buttons + `

when doors close
if <(plan length) > (0)> then
  go express to floor (item (1) of plan)` + tickets,
    '8-7': `when call button pressed (floor) (direction)
if <can I stop at (floor)?> then
  if <<(floor) > (19)> and <(floor) < (41)>> then
    set [other] to ((3) − (my number))
    if <<(distance from (current floor) to (floor)) < (distance from (floor of lift (other)) to (floor))> or <<(distance from (current floor) to (floor)) = (distance from (floor of lift (other)) to (floor))> and <(my number) = (1)>>> then
      add floor (floor) to plan
  else
    add floor (floor) to plan` + buttons + `

when I'm about to pass floor (floor)
if <<button (floor) pressed inside?> or <plan contains (floor)?>> then
  stop here` + lobby,
    '8-8': zoneCalls + buttons + onTheWay + express + lobby,
    '8-9': zoneCalls + buttons + onTheWay + express + tickets + `

when message from building [closing soon]
if <(my zone lowest) = (86)> then
  put floor (top floor) first in plan`
  });
})();
