'use strict';

// Lift Logic — every block of the language: its category, shape, template (translated as a whole, the
// slots are %1, %2…), the slots' kinds and default values, the chapter that opens it and its line in
// the Text view. Read by sim/program.js, sim/vm.js (by op), ui/blockview.js, ui/palette.js and
// ui/textview.js.
//
// shapes: hat (starts a script), stack, c (holds blocks), c2 (if / else), cap (nothing below),
//         reporter (a value), boolean (yes / no)
// slots:  num, text, any (a number or a word), bool (a hexagon), dir3 (up/down/any), arrow (up/down/none),
//         var, list, msg, stop (this script/all), clock ("10:00"), param:<name> (a hat's input)

const CATEGORIES = [
  { id: 'lift', name: 'Lift', color: '#3d7be0' },
  { id: 'sensing', name: 'Sensing', color: '#14a0a8' },
  { id: 'events', name: 'Events', color: '#e0a800' },
  { id: 'control', name: 'Control', color: '#ec7d1a' },
  { id: 'operators', name: 'Operators', color: '#3aa64f' },
  { id: 'variables', name: 'Variables', color: '#e8573a' },
  { id: 'lists', name: 'Lists', color: '#c0432b' }
];

const DROPDOWNS = {
  dir3: ['up', 'down', 'any'],
  arrow: ['up', 'down', 'none'],
  stop: ['this script', 'all']
};

// the names a hat gives its inputs, shown as small blocks inside it
const PARAM_NAMES = { floor: 'floor', direction: 'direction', from: 'from', to: 'to' };

const BLOCKS = [
  // ---------- chapter 1 ----------
  { op: 'start', cat: 'events', shape: 'hat', text: 'when ▶ clicked', ch: 1, js: 'when.start(async () => {' },
  { op: 'goto', cat: 'lift', shape: 'stack', text: 'go to floor %1', slots: ['num'], def: [2], ch: 1, js: 'await lift.goTo(%1);', waits: true },
  { op: 'say', cat: 'lift', shape: 'stack', text: 'say %1', slots: ['text'], def: ['Hello!'], ch: 1, js: 'lift.say(%1);' },
  { op: 'sayFor', cat: 'lift', shape: 'stack', text: 'say %1 for %2 seconds', slots: ['text', 'num'], def: ['Hello!', 2], ch: 1, js: 'await lift.say(%1, %2);', waits: true },
  { op: 'wait', cat: 'control', shape: 'stack', text: 'wait %1 seconds', slots: ['num'], def: [1], ch: 1, js: 'await wait(%1);', waits: true },
  { op: 'repeat', cat: 'control', shape: 'c', text: 'repeat %1', slots: ['num'], def: [3], ch: 1, js: 'for (let i = 0; i < %1; i++) {' },
  { op: 'forever', cat: 'control', shape: 'c', cap: true, text: 'forever', ch: 1, js: 'while (true) {' },
  { op: 'curFloor', cat: 'sensing', shape: 'reporter', text: 'current floor', ch: 1, js: 'lift.floor' },

  // ---------- chapter 2 ----------
  { op: 'if', cat: 'control', shape: 'c', text: 'if %1 then', slots: ['bool'], ch: 2, js: 'if (%1) {' },
  { op: 'ifElse', cat: 'control', shape: 'c2', text: 'if %1 then', text2: 'else', slots: ['bool'], ch: 2, js: 'if (%1) {', js2: '} else {' },
  { op: 'waitUntil', cat: 'control', shape: 'stack', text: 'wait until %1', slots: ['bool'], ch: 2, js: 'await until(() => %1);', waits: true },
  { op: 'repeatUntil', cat: 'control', shape: 'c', text: 'repeat until %1', slots: ['bool'], ch: 2, js: 'while (!(%1)) {' },
  { op: 'add', cat: 'operators', shape: 'reporter', text: '%1 + %2', slots: ['num', 'num'], def: ['', ''], ch: 2, js: '(%1 + %2)' },
  { op: 'sub', cat: 'operators', shape: 'reporter', text: '%1 − %2', slots: ['num', 'num'], def: ['', ''], ch: 2, js: '(%1 - %2)' },
  { op: 'mul', cat: 'operators', shape: 'reporter', text: '%1 × %2', slots: ['num', 'num'], def: ['', ''], ch: 2, js: '(%1 * %2)' },
  { op: 'div', cat: 'operators', shape: 'reporter', text: '%1 ÷ %2', slots: ['num', 'num'], def: ['', ''], ch: 2, js: '(%1 / %2)' },
  { op: 'lt', cat: 'operators', shape: 'boolean', text: '%1 < %2', slots: ['any', 'any'], def: ['', 5], ch: 2, js: '(%1 < %2)' },
  { op: 'eq', cat: 'operators', shape: 'boolean', text: '%1 = %2', slots: ['any', 'any'], def: ['', 5], ch: 2, js: '(%1 == %2)' },
  { op: 'gt', cat: 'operators', shape: 'boolean', text: '%1 > %2', slots: ['any', 'any'], def: ['', 5], ch: 2, js: '(%1 > %2)' },
  { op: 'and', cat: 'operators', shape: 'boolean', text: '%1 and %2', slots: ['bool', 'bool'], ch: 2, js: '(%1 && %2)' },
  { op: 'or', cat: 'operators', shape: 'boolean', text: '%1 or %2', slots: ['bool', 'bool'], ch: 2, js: '(%1 || %2)' },
  { op: 'not', cat: 'operators', shape: 'boolean', text: 'not %1', slots: ['bool'], ch: 2, js: '!(%1)' },
  { op: 'random', cat: 'operators', shape: 'reporter', text: 'pick random %1 to %2', slots: ['num', 'num'], def: [1, 5], ch: 2, js: 'random(%1, %2)' },
  { op: 'callOn', cat: 'sensing', shape: 'boolean', text: 'call on floor %1 %2?', slots: ['num', 'dir3'], def: [2, 'any'], ch: 2, js: 'hall.call(%1, %2)' },
  { op: 'buttonIn', cat: 'sensing', shape: 'boolean', text: 'button %1 pressed inside?', slots: ['num'], def: [2], ch: 2, js: 'lift.button(%1)' },
  { op: 'myDir', cat: 'sensing', shape: 'reporter', text: 'my direction', ch: 2, js: 'lift.direction' },
  { op: 'doorsOpen', cat: 'sensing', shape: 'boolean', text: 'doors open?', ch: 2, js: 'lift.doorsOpen' },
  { op: 'topFloor', cat: 'sensing', shape: 'reporter', text: 'top floor', ch: 2, js: 'lift.topFloor' },
  { op: 'bottomFloor', cat: 'sensing', shape: 'reporter', text: 'bottom floor', ch: 2, js: 'lift.bottomFloor' },

  // ---------- chapter 3 ----------
  { op: 'onCall', cat: 'events', shape: 'hat', text: 'when call button pressed %1 %2', slots: ['param:floor', 'param:direction'], ch: 3, js: 'when.callPressed(async (floor, direction) => {' },
  { op: 'onButton', cat: 'events', shape: 'hat', text: 'when button pressed inside %1', slots: ['param:floor'], ch: 3, js: 'when.buttonPressed(async (floor) => {' },
  { op: 'onArrive', cat: 'events', shape: 'hat', text: 'when I arrive at floor %1', slots: ['param:floor'], ch: 3, js: 'when.arrive(async (floor) => {' },
  { op: 'onIdle', cat: 'events', shape: 'hat', text: 'when I\'m idle', ch: 3, js: 'when.idle(async () => {' },
  { op: 'onDoorsClose', cat: 'events', shape: 'hat', text: 'when doors close', ch: 3, js: 'when.doorsClose(async () => {' },
  { op: 'onPass', cat: 'events', shape: 'hat', text: 'when I\'m about to pass floor %1', slots: ['param:floor'], ch: 3, js: 'when.aboutToPass(async (floor) => {' },
  { op: 'planAdd', cat: 'lift', shape: 'stack', text: 'add floor %1 to plan', slots: ['num'], def: [2], ch: 3, js: 'plan.add(%1);' },
  { op: 'planFirst', cat: 'lift', shape: 'stack', text: 'put floor %1 first in plan', slots: ['num'], def: [2], ch: 3, js: 'plan.putFirst(%1);' },
  { op: 'planRemove', cat: 'lift', shape: 'stack', text: 'remove floor %1 from plan', slots: ['num'], def: [2], ch: 3, js: 'plan.remove(%1);' },
  { op: 'planClear', cat: 'lift', shape: 'stack', text: 'clear plan', ch: 3, js: 'plan.clear();' },
  { op: 'stopHere', cat: 'lift', shape: 'stack', text: 'stop here', ch: 3, js: 'lift.stopHere();' },
  { op: 'planLength', cat: 'sensing', shape: 'reporter', text: 'plan length', ch: 3, js: 'plan.length' },
  { op: 'planItem', cat: 'sensing', shape: 'reporter', text: 'item %1 of plan', slots: ['num'], def: [1], ch: 3, js: 'plan.item(%1)' },
  { op: 'planHas', cat: 'sensing', shape: 'boolean', text: 'plan contains %1?', slots: ['num'], def: [2], ch: 3, js: 'plan.includes(%1)' },
  { op: 'loadPct', cat: 'sensing', shape: 'reporter', text: 'load %', ch: 3, js: 'lift.load' },
  { op: 'full', cat: 'sensing', shape: 'boolean', text: 'full?', ch: 3, js: 'lift.full' },
  { op: 'setVar', cat: 'variables', shape: 'stack', text: 'set %1 to %2', slots: ['var', 'any'], def: [null, 0], ch: 3, js: '%1 = %2;' },
  { op: 'changeVar', cat: 'variables', shape: 'stack', text: 'change %1 by %2', slots: ['var', 'num'], def: [null, 1], ch: 3, js: '%1 += %2;' },
  { op: 'showVar', cat: 'variables', shape: 'stack', text: 'show variable %1', slots: ['var'], ch: 3, js: 'show(%1);' },
  { op: 'hideVar', cat: 'variables', shape: 'stack', text: 'hide variable %1', slots: ['var'], ch: 3, js: 'hide(%1);' },
  { op: 'var', cat: 'variables', shape: 'reporter', text: '%1', slots: ['name'], ch: 3, js: '%1', hidden: true },
  { op: 'param', cat: 'events', shape: 'reporter', text: '%1', slots: ['name'], ch: 3, js: '%1', hidden: true },

  // ---------- chapter 4 ----------
  { op: 'onEmergency', cat: 'events', shape: 'hat', text: 'when emergency call %1', slots: ['param:floor'], ch: 4, js: 'when.emergency(async (floor) => {' },
  { op: 'setArrow', cat: 'lift', shape: 'stack', text: 'set arrow to %1', slots: ['arrow'], def: ['up'], ch: 4, js: 'lift.arrow = %1;' },
  { op: 'holdDoors', cat: 'lift', shape: 'stack', text: 'hold doors %1 seconds', slots: ['num'], def: [3], ch: 4, js: 'lift.holdDoors(%1);' },
  { op: 'closeDoors', cat: 'lift', shape: 'stack', text: 'close doors', ch: 4, js: 'lift.closeDoors();' },
  { op: 'doorway', cat: 'sensing', shape: 'boolean', text: 'someone in the doorway?', ch: 4, js: 'lift.doorway' },
  { op: 'waitTime', cat: 'sensing', shape: 'reporter', text: 'waiting time on floor %1 %2', slots: ['num', 'dir3'], def: [2, 'any'], ch: 4, js: 'hall.waitingTime(%1, %2)' },
  { op: 'emergencyOn', cat: 'sensing', shape: 'boolean', text: 'emergency call on floor %1?', slots: ['num'], def: [2], ch: 4, js: 'hall.emergency(%1)' },
  { op: 'distance', cat: 'operators', shape: 'reporter', text: 'distance from %1 to %2', slots: ['num', 'num'], def: ['', ''], ch: 4, js: 'Math.abs(%1 - %2)' },
  { op: 'min', cat: 'operators', shape: 'reporter', text: 'min of %1 and %2', slots: ['num', 'num'], def: ['', ''], ch: 4, js: 'Math.min(%1, %2)' },
  { op: 'max', cat: 'operators', shape: 'reporter', text: 'max of %1 and %2', slots: ['num', 'num'], def: ['', ''], ch: 4, js: 'Math.max(%1, %2)' },

  // ---------- chapter 5 ----------
  { op: 'onEvery', cat: 'events', shape: 'hat', text: 'every %1 seconds', slots: ['num'], def: [10], ch: 5, js: 'when.every(%1, async () => {' },
  { op: 'onClock', cat: 'events', shape: 'hat', text: 'when clock is %1', slots: ['clock'], def: ['17:00'], ch: 5, js: 'when.clock(%1, async () => {' },
  { op: 'onReceive', cat: 'events', shape: 'hat', text: 'when I receive %1', slots: ['msg'], def: ['message1'], ch: 5, js: 'when.receive(%1, async () => {' },
  { op: 'broadcast', cat: 'events', shape: 'stack', text: 'broadcast %1', slots: ['msg'], def: ['message1'], ch: 5, js: 'broadcast(%1);' },
  { op: 'broadcastWait', cat: 'events', shape: 'stack', text: 'broadcast %1 and wait', slots: ['msg'], def: ['message1'], ch: 5, js: 'await broadcast(%1);', waits: true },
  { op: 'clock', cat: 'sensing', shape: 'reporter', text: 'clock', ch: 5, js: 'clock.minutes' },
  { op: 'clockHour', cat: 'sensing', shape: 'reporter', text: 'clock hour', ch: 5, js: 'clock.hour' },
  { op: 'myNumber', cat: 'sensing', shape: 'reporter', text: 'my number', ch: 5, js: 'lift.number' },
  { op: 'liftsInGroup', cat: 'sensing', shape: 'reporter', text: 'lifts in group', ch: 5, js: 'group.length' },
  { op: 'floorOf', cat: 'sensing', shape: 'reporter', text: 'floor of lift %1', slots: ['num'], def: [1], ch: 5, js: 'group[%1].floor' },
  { op: 'dirOf', cat: 'sensing', shape: 'reporter', text: 'direction of lift %1', slots: ['num'], def: [1], ch: 5, js: 'group[%1].direction' },
  { op: 'planLenOf', cat: 'sensing', shape: 'reporter', text: 'plan length of lift %1', slots: ['num'], def: [1], ch: 5, js: 'group[%1].plan.length' },
  { op: 'loadOf', cat: 'sensing', shape: 'reporter', text: 'load % of lift %1', slots: ['num'], def: [1], ch: 5, js: 'group[%1].load' },

  // ---------- chapter 6 ----------
  { op: 'working', cat: 'sensing', shape: 'boolean', text: 'lift %1 working?', slots: ['num'], def: [1], ch: 6, js: 'group[%1].working' },
  { op: 'cancelButtons', cat: 'lift', shape: 'stack', text: 'cancel buttons inside', ch: 6, js: 'lift.cancelButtons();' },
  { op: 'buttonsCount', cat: 'sensing', shape: 'reporter', text: 'buttons pressed inside', ch: 6, js: 'lift.buttonsPressed' },
  { op: 'forEach', cat: 'control', shape: 'c', text: 'for each %1 from %2 to %3', slots: ['var', 'num', 'num'], def: [null, 1, 5], ch: 6, js: 'for (%1 = %2; %1 <= %3; %1++) {' },
  { op: 'stop', cat: 'control', shape: 'stack', capIf: 'all', text: 'stop %1', slots: ['stop'], def: ['this script'], ch: 6, js: 'stop(%1);' },
  { op: 'mod', cat: 'operators', shape: 'reporter', text: '%1 mod %2', slots: ['num', 'num'], def: ['', 2], ch: 6, js: '(%1 % %2)' },
  { op: 'round', cat: 'operators', shape: 'reporter', text: 'round %1', slots: ['num'], def: [''], ch: 6, js: 'Math.round(%1)' },
  { op: 'join', cat: 'operators', shape: 'reporter', text: 'join %1 %2', slots: ['text', 'text'], def: ['floor ', ''], ch: 6, js: '(%1 + %2)' },
  { op: 'listAdd', cat: 'lists', shape: 'stack', text: 'add %1 to %2', slots: ['any', 'list'], def: [1, null], ch: 6, js: '%2.push(%1);' },
  { op: 'listDelete', cat: 'lists', shape: 'stack', text: 'delete %1 of %2', slots: ['num', 'list'], def: [1, null], ch: 6, js: '%2.splice(%1 - 1, 1);' },
  { op: 'listClear', cat: 'lists', shape: 'stack', text: 'delete all of %1', slots: ['list'], ch: 6, js: '%1.length = 0;' },
  { op: 'listInsert', cat: 'lists', shape: 'stack', text: 'insert %1 at %2 of %3', slots: ['any', 'num', 'list'], def: [1, 1, null], ch: 6, js: '%3.splice(%2 - 1, 0, %1);' },
  { op: 'listItem', cat: 'lists', shape: 'reporter', text: 'item %1 of %2', slots: ['num', 'list'], def: [1, null], ch: 6, js: '%2[%1 - 1]' },
  { op: 'listIndex', cat: 'lists', shape: 'reporter', text: 'item # of %1 in %2', slots: ['any', 'list'], def: [1, null], ch: 6, js: '(%2.indexOf(%1) + 1)' },
  { op: 'listLength', cat: 'lists', shape: 'reporter', text: 'length of %1', slots: ['list'], ch: 6, js: '%1.length' },
  { op: 'listHas', cat: 'lists', shape: 'boolean', text: '%1 contains %2?', slots: ['list', 'any'], def: [null, 1], ch: 6, js: '%1.includes(%2)' },
  { op: 'list', cat: 'lists', shape: 'reporter', text: '%1', slots: ['name'], ch: 6, js: '%1', hidden: true }
];

const BLOCK = {};
for (const b of BLOCKS) BLOCK[b.op] = b;
const CATEGORY = {};
for (const c of CATEGORIES) CATEGORY[c.id] = c;
