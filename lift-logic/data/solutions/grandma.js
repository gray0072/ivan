'use strict';

// Lift Logic — the engineer's solutions of chapter 1 (Grandma's House), in the text notation of
// sim/program.js. Used by hint 3, the Engineer's record and tools/missions-check.js.

addSolutions({
  '1-1': `
when ▶ clicked
go to floor 3
go to floor 1`,
  '1-2': `
when ▶ clicked
go to floor 3
go to floor 1
wait 20 seconds
go to floor 3`,
  '1-3': `
when ▶ clicked
go to floor 2
go to floor 3
go to floor 1`,
  '1-4': `
when ▶ clicked
go to floor 3
go to floor 2
go to floor 1`,
  '1-5': `
when ▶ clicked
go to floor 3
say (current floor)
go to floor 2
say (current floor)
go to floor 1
say (current floor)`,
  '1-6': `
when ▶ clicked
repeat 4
  go to floor 3
  go to floor 1
go to floor 3`,
  '1-7': `
when ▶ clicked
forever
  go to floor 1
  go to floor 2
  go to floor 3
  go to floor 4
  go to floor 3
  go to floor 2`,
  '1-8': `
when ▶ clicked
forever
  go to floor 1
  go to floor 2
  go to floor 3
  go to floor 4`,
  '1-9': `
when ▶ clicked
forever
  go to floor 1
  go to floor 4
  go to floor 3
  go to floor 2`
});
