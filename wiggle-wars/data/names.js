'use strict';

// Wiggle Wars — worm names, the team colours and the default teams of a versus match, as plain
// data. Names are names: the same in every language. Used by sim/match.js and ui/setup.js.

const WORM_NAMES = [
  'Bob', 'Ziggy', 'Noodle', 'Slim', 'Pip', 'Dusty', 'Wally', 'Sprout', 'Boris', 'Ivan', 'Olga', 'Sven',
  'Astrid', 'Nils', 'Kip', 'Mo', 'Gus', 'Lola', 'Rex', 'Tuff', 'Biscuit', 'Turbo', 'Fizz', 'Clod',
  'Mudge', 'Squirm', 'Dot', 'Juno', 'Rocco', 'Pebble', 'Elsa', 'Tilly', 'Bruno', 'Kasha', 'Mila', 'Otto'
];

const TEAM_COLORS = [
  { id: 'red', main: '#e5534b', light: '#ff9a8f', dark: '#8f2620' },
  { id: 'blue', main: '#3d8fe0', light: '#94c6ff', dark: '#1d4f86' },
  { id: 'green', main: '#47b04b', light: '#a2e39a', dark: '#22672a' },
  { id: 'yellow', main: '#e8b52c', light: '#ffe08a', dark: '#8c6510' },
  { id: 'purple', main: '#9b5de5', light: '#d3b3ff', dark: '#56278f' },
  { id: 'orange', main: '#f08a24', light: '#ffc28a', dark: '#8f4a0c' }
];
// the campaign's enemy, not offered in the setup
const ENEMY_COLOR = { id: 'rot', main: '#7d8f5a', light: '#c2d39a', dark: '#3e4a28' };

const DEFAULT_TEAMS = [
  { name: 'Red Team', color: 'red', cpu: false },
  { name: 'Blue Team', color: 'blue', cpu: true }
];

function teamColor(id) { return TEAM_COLORS.find((c) => c.id === id) || (id === 'rot' ? ENEMY_COLOR : TEAM_COLORS[0]); }
