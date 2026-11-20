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
    check: 'which years it flew from Arlanda (a 1965 photo shows its DC-6 at Bromma); its colours (not described in the sources read)' }
};

// the livery an airline wore in a year (the last one when none fits)
function liveryOf(code, year) {
  const al = AIRLINES[code];
  if (!al || !al.liveries) return { top: '#eeeeee', belly: '#bbbbbb', line: '#555555', tail: '#777777', titles: '', emblem: null };
  return al.liveries.find((l) => year >= l.from && year <= l.to) || al.liveries[al.liveries.length - 1];
}
