'use strict';

// Arlanda Rising — the airlines, real ones in their real years at Arlanda. Each one has:
//   name     the full name
//   kind     home, domestic, charter, network, lowcost, longhaul, cargo, business, future (see SPEC.md)
//   years    [first, last] year at Arlanda (null: still flying there)
//   temper   from its documented way of doing business: patience (× how fast its mood falls),
//            contact (wants stands next to the terminal), fees (× how much a fee rise hurts its mood)
//   intl     its flights pay the international passenger fee
//   liveries [{ from, to, top, belly, line, line2, tail, titles, emblem }] by era — a simplified drawing
//            (render/aircraft.js, art/emblems.js): the upper fuselage, the lower one, the cheatline (and a thin
//            second one), the fin's colour, the titles over the windows, the fin's emblem
//   src / check  the sources, and what still has to be checked before it is shown

const AIRLINES = {
  SK: { name: 'SAS Scandinavian Airlines', kind: 'home', years: [1959, null], intl: true,
    temper: { patience: 1, contact: true, fees: 1 },
    liveries: [
      { from: 1946, to: 1983, top: '#f4f5f6', belly: '#c3c8cd', line: '#1f3f8f', line2: '#ffffff', tail: '#f4f5f6',
        titles: 'SCANDINAVIAN', emblem: ['text', 'SAS', '#1f3f8f'] },
      { from: 1983, to: 1998, top: '#f6f6f3', belly: '#e9e9e4', line: '#c8102e', line2: '#d9a521', tail: '#f6f6f3',
        titles: 'SCANDINAVIAN', emblem: ['text', 'SAS', '#1f3f8f'] }
    ],
    src: 'sv.wikipedia Arlanda: the first landing on 14 December 1959 was an SAS Caravelle from Bromma; the first regular flight, 26 June 1960, an SAS DC-8 to New York',
    check: 'the livery of 1959–63 (the Wikipedia articles do not describe it): drawn as white over bare metal with a blue cheatline and the SAS letters on the fin, as world-aviation does' },
  TRANSAIR: { name: 'Transair Sweden', kind: 'charter', years: [1961, 1981], intl: true,
    temper: { patience: 1.2, contact: false, fees: 1.5 },
    liveries: [
      { from: 1950, to: 1981, top: '#f4f5f6', belly: '#c3c8cd', line: '#2a5f9e', line2: '#d33a2c', tail: '#2a5f9e',
        titles: 'TRANSAIR', emblem: ['text', 'T', '#ffffff'] }
    ],
    src: 'en.wikipedia Transair Sweden: a charter airline 1950–1981, DC-6s from SAS from 1959, based in Malmö; it flew "under its own colors" after SAS took a majority',
    check: 'which years it flew from Arlanda (a 1965 photo shows its DC-6 at Bromma); its colours (not described in the sources read)' },
  STERLING: { name: 'Sterling Airways', kind: 'charter', years: [1962, 1993], intl: true,
    temper: { patience: 1.2, contact: false, fees: 1.6 },
    liveries: [
      { from: 1962, to: 1993, top: '#f4f5f6', belly: '#c3c8cd', line: '#b8202a', line2: '#d4a017', tail: '#b8202a',
        titles: 'STERLING', emblem: ['text', 'S', '#ffffff'] }
    ],
    src: 'en.wikipedia Sterling Airways: a Danish charter airline 1962–1993 (Caravelles, later Boeing 727s)',
    check: 'its flights from Arlanda and its colours (drawn as white with a red and gold cheatline and a red fin)' },
  LF: { name: 'Linjeflyg', kind: 'domestic', years: [1983, 1993], intl: false,
    temper: { patience: 1.3, contact: true, fees: 1.3 },
    liveries: [
      { from: 1957, to: 1993, top: '#f6f6f3', belly: '#dfe1e3', line: '#d2232a', line2: '#ffffff', tail: '#d2232a',
        titles: 'LINJEFLYG', emblem: ['text', 'LIN', '#ffffff'] }
    ],
    src: 'en.wikipedia Linjeflyg: moved from Bromma to Arlanda\'s terminal 4 in October 1983; Fokker F28s 1973–92 (65–85 seats); merged into SAS in 1993',
    check: 'its colours (drawn as white with a red cheatline and a red fin)' },
  AY: { name: 'Finnair', kind: 'network', years: [1960, null], intl: true,
    temper: { patience: 0.9, contact: true, fees: 1 },
    liveries: [
      { from: 1968, to: 2000, top: '#f6f6f3', belly: '#c9ced3', line: '#1b4f9c', line2: '#ffffff', tail: '#f6f6f3',
        titles: 'FINNAIR', emblem: ['text', 'F', '#1b4f9c'] }
    ],
    src: 'en.wikipedia Finnair',
    check: 'its first year at Arlanda; the livery of the era (drawn as white with a blue cheatline and a blue F on the fin)' },
  LH: { name: 'Lufthansa', kind: 'network', years: [1960, null], intl: true,
    temper: { patience: 0.8, contact: true, fees: 1 },
    liveries: [
      { from: 1967, to: 1988, top: '#f4f5f6', belly: '#c3c8cd', line: '#0a1d4a', line2: '#ffffff', tail: '#0a1d4a',
        titles: 'Lufthansa', emblem: ['circle', '#f5c400', 'LH', '#0a1d4a'] }
    ],
    src: 'en.wikipedia Lufthansa',
    check: 'its first year at Arlanda; the crane drawn as a yellow disc on the blue fin' }
};

// the livery an airline wore in a year (the last one when none fits)
function liveryOf(code, year) {
  const al = AIRLINES[code];
  if (!al || !al.liveries) return { top: '#eeeeee', belly: '#bbbbbb', line: '#555555', tail: '#777777', titles: '', emblem: null };
  return al.liveries.find((l) => year >= l.from && year <= l.to) || al.liveries[al.liveries.length - 1];
}
