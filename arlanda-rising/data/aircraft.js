'use strict';

// Arlanda Rising — the aircraft types, as plain data. Each one has:
//   name     the type's name as shown
//   engines  'jet' or 'prop' (the sounds, the noise)
//   span, length  metres, for drawing to scale and for the stand size code
//   mtow     maximum take-off weight in tonnes (the landing fee)
//   seats    a typical cabin of the era (the passengers)
//   svc      game minutes the cleaning, catering and bags take at the stand
//   src      where the numbers come from; check: what still has to be checked before the facts are shown
// The stand size code (ICAO A–F) is worked out from the span by sim/stands.js (codeOf).

const AIRCRAFT = {
  DC3: { name: 'Douglas DC-3', engines: 'prop', span: 29.0, length: 19.7, mtow: 12.7, seats: 28, svc: 14,
    src: 'en.wikipedia Douglas DC-3', check: 'seats of the Swedish operators' },
  CV44: { name: 'Convair 440 Metropolitan', engines: 'prop', span: 32.1, length: 24.8, mtow: 22.5, seats: 48, svc: 16,
    src: 'en.wikipedia Convair CV-240 family; Linjeflyg flew Convair 340/440 1960–79 (en.wikipedia Linjeflyg)', check: 'seats' },
  DC6B: { name: 'Douglas DC-6B', engines: 'prop', span: 35.8, length: 32.2, mtow: 48.5, seats: 86, svc: 24,
    src: 'en.wikipedia Douglas DC-6; Transair Sweden took DC-6s from SAS in 1959 (en.wikipedia Transair Sweden)', check: 'seats' },
  CRVL: { name: 'Sud Aviation Caravelle III', engines: 'jet', span: 34.3, length: 32.0, mtow: 46.0, seats: 72, svc: 20,
    src: 'en.wikipedia Sud Aviation Caravelle (SAS service from 26 April 1959)', check: 'SAS seats; the variant at Arlanda in 1959' },
  DC8: { name: 'Douglas DC-8-30', engines: 'jet', span: 43.4, length: 45.9, mtow: 140, seats: 132, svc: 34,
    src: 'en.wikipedia Douglas DC-8; SAS DC-8 to New York 26 June 1960 (sv.wikipedia Arlanda)', check: 'the SAS variant and seats' }
};
