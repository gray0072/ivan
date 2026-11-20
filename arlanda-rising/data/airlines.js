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
// Session 4 adds:
//   court    the route it starts when it is courted with a route incentive (the Airlines screen, an offer):
//            [{ from, type, perDay, load, need, months }] — `need` is the share of the fees it wants off for INCENTIVE_MONTHS
//   rival    the airport it moves flights to when it is unhappy (LEAVE_MOOD), once rivals are on

const AIRLINES = {
  SK: { name: 'SAS Scandinavian Airlines', kind: 'home', years: [1959, null], intl: true,
    temper: { patience: 1, contact: true, fees: 1 },
    liveries: [
      { from: 1946, to: 1983, top: '#f4f5f6', belly: '#c3c8cd', line: '#1f3f8f', line2: '#ffffff', tail: '#f4f5f6',
        titles: 'SCANDINAVIAN', emblem: ['text', 'SAS', '#1f3f8f'] },
      { from: 1983, to: 1997, top: '#f6f6f3', belly: '#e9e9e4', line: '#c8102e', line2: '#d9a521', tail: '#f6f6f3',
        titles: 'SCANDINAVIAN', emblem: ['text', 'SAS', '#1f3f8f'] },
      { from: 1998, to: 2019, top: '#f7f7f5', belly: '#e6e8ea', line: '#f7f7f5', tail: '#f7f7f5',
        titles: 'Scandinavian Airlines', emblem: ['text', 'SAS', '#1f3f8f'] }
    ],
    court: [{ from: 1990, type: 'MD87', perDay: 2, load: 0.72, need: 0.1 }], rival: 'Copenhagen',
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
    court: [{ from: 1990, type: 'B737', perDay: 2, load: 0.74, need: 0.1 }], rival: 'Bromma',
    src: 'en.wikipedia Linjeflyg: moved from Bromma to Arlanda\'s terminal 4 in October 1983; Fokker F28s 1973–92 (65–85 seats); Boeing 737-500s 1990–92 (sv.wikipedia); merged into SAS on 1 January 1993',
    check: 'its colours (drawn as white with a red cheatline and a red fin)' },
  AY: { name: 'Finnair', kind: 'network', years: [1960, null], intl: true,
    temper: { patience: 0.9, contact: true, fees: 1 },
    liveries: [
      { from: 1968, to: 2000, top: '#f6f6f3', belly: '#c9ced3', line: '#1b4f9c', line2: '#ffffff', tail: '#f6f6f3',
        titles: 'FINNAIR', emblem: ['text', 'F', '#1b4f9c'] }
    ],
    court: [{ from: 1990, type: 'MD87', perDay: 2, load: 0.7, need: 0.25 }], rival: 'Helsinki',
    src: 'en.wikipedia Finnair',
    check: 'its first year at Arlanda; the livery of the era (drawn as white with a blue cheatline and a blue F on the fin)' },
  LH: { name: 'Lufthansa', kind: 'network', years: [1960, null], intl: true,
    temper: { patience: 0.8, contact: true, fees: 1 },
    liveries: [
      { from: 1967, to: 1988, top: '#f4f5f6', belly: '#c3c8cd', line: '#0a1d4a', line2: '#ffffff', tail: '#0a1d4a',
        titles: 'Lufthansa', emblem: ['circle', '#f5c400', 'LH', '#0a1d4a'] }
    ],
    court: [{ from: 1990, type: 'B737', perDay: 2, load: 0.7, need: 0.25 }], rival: 'Copenhagen',
    src: 'en.wikipedia Lufthansa',
    check: 'its first year at Arlanda; the crane drawn as a yellow disc on the blue fin' },
  // ---------- session 4: the 1990s ----------
  TRANSWEDE: { name: 'Transwede', kind: 'domestic', years: [1986, 1998], intl: false,
    temper: { patience: 1.2, contact: false, fees: 1.6 },
    liveries: [
      { from: 1985, to: 1998, top: '#f6f6f3', belly: '#d9dde1', line: '#1b3e8a', line2: '#f2c230', tail: '#1b3e8a',
        titles: 'TRANSWEDE', emblem: ['text', 'TW', '#f2c230'] }
    ],
    court: [{ from: 1992, type: 'MD87', perDay: 4, load: 0.66, need: 0.25 }], rival: 'Bromma',
    src: 'en.wikipedia Transwede: Arlanda-based from 1986; its first domestic scheduled flight on 22 July 1992, Stockholm–Visby; MD-87s 1989–94, Fokker 100s from 1993, 737-300s 1996–97; bought by Braathens in 1996–97 (Braathens Sverige)',
    check: 'its colours (drawn as white with a blue cheatline and a blue fin)' },
  BRAATHENS: { name: 'Braathens', kind: 'network', years: [1996, null], intl: true,
    temper: { patience: 1, contact: true, fees: 1.3 },
    liveries: [
      { from: 1990, to: 2004, top: '#f6f6f3', belly: '#e3e5e7', line: '#c8102e', line2: '#ffffff', tail: '#c8102e',
        titles: 'BRAATHENS', emblem: ['text', 'B', '#ffffff'] }
    ],
    court: [{ from: 1996, type: 'B737', perDay: 3, load: 0.7, need: 0.25 }], rival: 'Oslo',
    src: 'en.wikipedia History of Braathens 1994–2004: Oslo–Stockholm from 6 November 1996; half of Transwede bought on 25 June 1996, the rest on 18 December 1997',
    check: 'its colours of the 1990s (drawn as white with a red fin)' },
  PREMIAIR: { name: 'Premiair', kind: 'charter', years: [1994, 2002], intl: true,
    temper: { patience: 1.2, contact: false, fees: 1.5 },
    liveries: [
      { from: 1994, to: 2002, top: '#f6f6f3', belly: '#d9dde1', line: '#1d3f8f', line2: '#e8a33d', tail: '#1d3f8f',
        titles: 'PREMIAIR', emblem: ['text', 'P', '#e8a33d'] }
    ],
    court: [{ from: 1994, type: 'A320', perDay: 2, load: 0.9, need: 0.15, months: [6, 7, 8, 12] }], rival: 'Copenhagen',
    src: 'en.wikipedia Sunclass Airlines: Premiair formed on 1 January 1994 from Scanair and Conair, the name kept until 2002; A320s from 1994, DC-10-10s 1995–2001',
    check: 'its colours (drawn as white with a blue fin)' },
  NOVAIR: { name: 'Novair', kind: 'charter', years: [1997, null], intl: true,
    temper: { patience: 1.2, contact: false, fees: 1.5 },
    liveries: [
      { from: 1997, to: 2005, top: '#f6f6f3', belly: '#dfe3e6', line: '#0f7c8c', line2: '#ffffff', tail: '#0f7c8c',
        titles: 'NOVAIR', emblem: ['text', 'N', '#ffffff'] }
    ],
    court: [{ from: 1997, type: 'A320', perDay: 2, load: 0.92, need: 0.15, months: [6, 7, 8, 12] }], rival: 'Copenhagen',
    src: 'en.wikipedia Novair: founded in 1997, flying from November 1997 for Apollo, Arlanda-based; A320s 1997–99',
    check: 'its colours (drawn as white with a teal fin)' },
  RYANAIR: { name: 'Ryanair', kind: 'lowcost', years: [1997, null], intl: true,
    temper: { patience: 1.3, contact: false, fees: 2.5 },
    liveries: [
      { from: 1990, to: 2004, top: '#f6f6f3', belly: '#1c3f94', line: '#f1c933', line2: '#1c3f94', tail: '#1c3f94',
        titles: 'RYANAIR', emblem: ['text', 'R', '#f1c933'] }
    ],
    court: [{ from: 1997, type: 'B737', perDay: 4, load: 0.85, need: 0.5 }], rival: 'Skavsta',
    src: 'en.wikipedia Stockholm Skavsta Airport: Ryanair\'s first Stockholm route, Skavsta–London Stansted, in June 1997',
    check: 'in reality Ryanair flew to Skavsta in the 1990s: at Arlanda it is the game\'s what-if, a choice of the player; its colours (drawn after the 1990s blue and yellow)' }
};

// the livery an airline wore in a year (the last one when none fits)
function liveryOf(code, year) {
  const al = AIRLINES[code];
  if (!al || !al.liveries) return { top: '#eeeeee', belly: '#bbbbbb', line: '#555555', tail: '#777777', titles: '', emblem: null };
  return al.liveries.find((l) => year >= l.from && year <= l.to) || al.liveries[al.liveries.length - 1];
}
