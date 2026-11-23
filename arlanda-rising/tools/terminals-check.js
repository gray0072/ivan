#!/usr/bin/env node
'use strict';

// Arlanda Rising — the terminals through the years: their names, Terminal 3 and the first terminal torn down. Loads the
// game's logic in Node (as tools/missions-check.js) and starts missions from the owner's airport of their year
// (Missions.start without a campaign), then checks:
//   - each terminal's name in 1976, 1990, 1995, 2022 and 2030 (data/terminals.js `names`, Terminal.name);
//   - Terminal 3 stands from the exam of 1989 on, a domestic flight by propeller goes through it (an international one
//     or a jet does not), and while it is mothballed its flights go to the domestic terminal;
//   - 7-1's choice "Close Terminals 2, 3 and 4" mothballs all three, and chapter 8 opens Terminal 3 again (as the gates of
//     Terminal 2);
//   - the first terminal stands until 2017 and is gone from the exam of 2018 on: its item is gone, the kerb and the
//     check-in desks' button stay, its shops move to the other terminals' free cells (one with no room is sold back),
//     its brands' units close;
//   - Free Play's 2024 airport and the Challenge Days have Terminal 3 (and the first terminal gone in 2024).
// Prints a line for each check and exits 1 when one fails.
//
// Usage: node arlanda-rising/tools/terminals-check.js   (a few seconds)

const vm = require('vm');
const ctx = require('./sim-files').context();

const out = vm.runInContext(`(() => {
  const lines = [];
  let bad = 0;
  const ok = (cond, text) => { lines.push((cond ? 'ok    ' : 'FAIL  ') + text); if (!cond) bad++; };
  const start = (id) => { GameEvents.mute && GameEvents.mute(true); Missions.start(id, 'medium', null); return Calendar.year(); };
  const names = () => TERMINAL_ORDER.filter((t) => Terminal.built(t)).map((t) => t + '=' + Terminal.name(t)).join(', ');

  // the names by year
  const want = { 1976: { intl: 'The international terminal' }, 1990: { intl: 'The international terminal', dom: 'Domestic 1', t2: 'Domestic 2', t3: 'The regional terminal' },
    1995: { intl: 'Terminal 5', dom: 'Terminal 4', t2: 'Terminal 2', t3: 'Terminal 3' }, 2022: { dom: 'Terminal 4', t3: 'Terminal 3' },
    2030: { dom: 'Terminal 5 · Pier C', t3: 'Terminal 2 · gates 51–59' } };
  for (const y of Object.keys(want)) for (const t of Object.keys(want[y])) ok(Terminal.name(t, +y) === want[y][t], y + ' ' + t + ' is ' + want[y][t] + ' (' + Terminal.name(t, +y) + ')');

  // 1987: no Terminal 3 yet; the exam of 1989: Terminal 3 stands
  start('3-7');
  ok(!Airport.has('terminal3'), '1987 (3-7): no Terminal 3 — ' + names());
  start('3-11');
  ok(Airport.has('terminal3') && Terminal.built('t3'), '1989 (3-11): Terminal 3 stands — ' + names());
  ok(Terminal.of('SK', false, 'F50') === 't3', '1989: a domestic Fokker 50 goes through Terminal 3');
  ok(Terminal.of('SK', false, 'DC9') === 'dom', '1989: a domestic DC-9 goes through the domestic terminal');
  ok(Terminal.of('SK', true, 'F50') === 'intl', '1989: an international Fokker 50 goes through the international terminal');
  ok(Airport.has('terminal'), '1989: the first terminal stands');

  // 1990 (4-1): its units with the others'
  start('4-1');
  ok(Terminal.units('t3').length === TERMINALS.t3.units.length, '1990 (4-1): Terminal 3 has its ' + TERMINALS.t3.units.length + ' units (' + Terminal.units('t3').map((u) => u.id).join(' ') + ')');
  ok(Airport.cellsMax('t3') === TERMINALS.t3.cells, '1990: Terminal 3 has ' + TERMINALS.t3.cells + ' cells for the own shops');

  // 2017 (6-10): the first terminal stands; shops filling its cells, then the owner tears it down
  start('6-10');
  ok(Airport.has('terminal') && !S.airport.t1Gone, '2017 (6-10): the first terminal still stands');
  const before = S.airport.items.filter((it) => Airport.cellsOf(it.kind)).length;
  for (const k of ['restaurant', 'cafe', 'kiosk']) Airport.addItem(k, { price: (BUILDINGS[k] || {}).price, term: 't1' });
  if (S.airport.units) S.airport.units.push({ id: 't1x', term: 't1', size: 'unit', brand: null, since: null });
  const used = Airport.cellsTaken(), max = Airport.cellsMax(), free = max - used, inT1 = Airport.shopsIn('t1').length;
  const money0 = S.money;
  Construction.ownerBuilds('oldHall');
  const after = S.airport.items.filter((it) => Airport.cellsOf(it.kind));
  const moved = after.filter((it) => it.term && it.term !== 't1' && it.term !== 'gone').length, sold = before + 3 - after.length;
  ok(!Airport.has('terminal') && S.airport.t1Gone, 'the old hall torn down: the first terminal\\'s item is gone');
  ok(Terminal.built('kerb') && !Terminal.built('t1'), 'the kerb stays, the first terminal is no terminal any more — ' + names());
  ok(!after.some((it) => it.term === 't1' || it.term === 'gone'), 'no shop is left in the first terminal (' + inT1 + ' there before; ' + free + ' cells were free elsewhere)');
  ok(sold === 0 || S.money > money0, 'the shops with no room are sold back: ' + sold + ' sold, money ' + Math.round(money0 / 1e6) + ' → ' + Math.round(S.money / 1e6) + ' MSEK');
  ok(after.every((it) => !it.term || Airport.cellsTaken(it.term) <= Airport.cellsMax(it.term)), 'no terminal has more shops than cells');
  ok(!Terminal.units('t1').length, 'the first terminal\\'s units are gone');

  // … and again with every other terminal's cells full: the first terminal's shops are sold back
  start('6-10');
  for (const t of Airport.shopTerms()) if (t !== 't1') while (Airport.cellsTaken(t) < Airport.cellsMax(t)) Airport.addItem('kiosk', { price: BUILDINGS.kiosk.price, term: t });
  Airport.addItem('cafe', { price: BUILDINGS.cafe.price, term: 't1' });
  const shops = () => S.airport.items.filter((it) => Airport.cellsOf(it.kind)).length, n0 = shops(), m0 = S.money;
  Construction.ownerBuilds('oldHall');
  ok(shops() === n0 - 1 && S.money > m0 && !S.airport.items.some((it) => it.term === 't1' || it.term === 'gone'),
    'with no room elsewhere the first terminal\\'s café is sold back (+' + Math.round((S.money - m0) / 1e5) / 10 + ' MSEK)');

  // the exam of 2018: torn down by the owner before it
  start('6-11');
  ok(S.airport.t1Gone && !Airport.has('terminal') && Terminal.built('kerb'), '2018 (6-11): the first terminal is gone, the kerb stays — ' + names());

  // 2020 (7-1): the choice closes Terminals 2, 3 and 4
  start('7-1');
  const opt = MISSION['7-1'].stages[1].choices[0].options.find((o) => o.id === 'both');
  for (const t of opt.mothball) Terminal.mothball(t);
  ok(Terminal.mothballed('t2') && Terminal.mothballed('t3') && Terminal.mothballed('dom'), '2020 (7-1): "' + opt.label + '" mothballs ' + opt.mothball.join(', '));
  ok(Terminal.of('SK', false, 'F50') === 'intl', '2020: with Terminal 3 and 4 closed a domestic propeller flight goes through Terminal 5');
  Terminal.reopen('dom'); S.airport.mothballed.dom = S.day;
  ok(Terminal.of('SK', false, 'F50') === 'dom', '2020: with Terminal 4 open again and Terminal 3 closed, through Terminal 4');

  // 2030 (8-1) from a campaign world with Terminal 3 still mothballed: opened again by the chapter's setup
  const world = JSON.parse(JSON.stringify(S));
  Missions.start('8-1', 'medium', world);
  ok(!Terminal.mothballed('t3'), '2030 (8-1): Terminal 3 open again as ' + Terminal.name('t3'));
  ok(Terminal.of('ELECTRIC', false, 'EL30') === 't3', '2030: the electric commuters go through ' + Terminal.name('t3'));

  // Free Play 2024 and the Challenge Days
  const fp = FREE_ERAS.find((e) => e.id === '2024');
  ok(fp.requires.indexOf('terminal3') >= 0 && fp.requires.indexOf('oldHall') >= 0 && (fp.setup.mothball || []).indexOf('t3') >= 0, 'Free Play 2024: Terminal 3 (closed until October), the first terminal gone');
  for (const e of FREE_ERAS) if (e.date >= '1990') ok(e.requires.indexOf('terminal3') >= 0, 'Free Play ' + e.id + ': Terminal 3');
  for (const c of CHALLENGES) if (c.date >= '1989-08') ok(c.requires.indexOf('terminal3') >= 0, 'Challenge ' + c.id + ' (' + c.date + '): Terminal 3');
  return { lines, bad };
})()`, ctx);
for (const l of out.lines) console.log(l);
console.log(out.bad ? out.bad + ' check(s) failed' : 'terminals ok');
process.exit(out.bad ? 1 : 0);
