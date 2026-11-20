'use strict';

// Lift Logic — the engineer's solutions of chapter 2 (Maple School), in the text notation of
// sim/program.js. Used by hint 3, the Engineer's record and tools/missions-check.js.

(() => {
  // stop at floor f when it was called (in `dir`) or pressed inside
  const stop = (f, dir) => `  if <<call on floor (${f}) [${dir}]?> or <button (${f}) pressed inside?>> then\n    go to floor ${f}\n`;
  const sweep = 'when ▶ clicked\nforever\n' + stop(1, 'up') + stop(2, 'up') + stop(3, 'up') + stop(4, 'up') + stop(5, 'any') + stop(4, 'down') + stop(3, 'down') + stop(2, 'down');
  const patrol = 'when ▶ clicked\nforever\n' + stop(1, 'any') + stop(2, 'any') + stop(3, 'any') + stop(4, 'any') + stop(5, 'any');
  const tiny = `when ▶ clicked
forever
  repeat until <(current floor) = (top floor)>
    go to floor ((current floor) + (1))
  repeat until <(current floor) = (bottom floor)>
    go to floor ((current floor) - (1))`;
  addSolutions({
    '2-1': `when ▶ clicked
forever
  go to floor 1
  if <call on floor (2) [any]?> then
    go to floor 2
  if <call on floor (3) [any]?> then
    go to floor 3
  if <call on floor (4) [any]?> then
    go to floor 4
  if <call on floor (5) [any]?> then
    go to floor 5`,
    '2-2': `when ▶ clicked
forever
  if <call on floor (1) [any]?> then
    go to floor 1
  if <call on floor (2) [any]?> then
    go to floor 2
  if <call on floor (3) [any]?> then
    go to floor 3
  if <call on floor (4) [any]?> then
    go to floor 4
  if <button (5) pressed inside?> then
    go to floor 5`,
    '2-3': patrol,
    '2-4': patrol,
    '2-5': tiny,
    '2-6': sweep,
    '2-7': sweep,
    '2-8': tiny,
    '2-9': sweep
  });
})();
