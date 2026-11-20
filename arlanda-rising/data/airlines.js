'use strict';

// Arlanda Rising — the airlines, real ones in their real years at Arlanda. Each one has:
//   name     the full name
//   kind     home, domestic, charter, network, lowcost, longhaul, cargo, business, future (see SPEC.md)
//   years    [first, last] year at Arlanda (null: still flying there)
//   temper   from its documented way of doing business: patience (× how fast its mood falls),
//            contact (wants stands next to the terminal), fees (× how much a fee rise hurts its mood)
//   intl     its flights pay the international passenger fee
//   src / check  the sources, and what still has to be checked before it is shown
// Liveries and emblems by era come in session 2 (art/emblems.js, from world-aviation).

const AIRLINES = {
  SK: { name: 'SAS Scandinavian Airlines', kind: 'home', years: [1959, null], intl: true,
    temper: { patience: 1, contact: true, fees: 1 },
    src: 'sv.wikipedia Arlanda: the first landing on 14 December 1959 was an SAS Caravelle from Bromma; the first regular flight, 26 June 1960, an SAS DC-8 to New York' },
  TRANSAIR: { name: 'Transair Sweden', kind: 'charter', years: [1961, 1981], intl: true,
    temper: { patience: 1.2, contact: false, fees: 1.5 },
    src: 'en.wikipedia Transair Sweden: a charter airline 1950–1981, DC-6s from SAS from 1959, based in Malmö',
    check: 'which years it flew from Arlanda (a 1965 photo shows its DC-6 at Bromma)' }
};
