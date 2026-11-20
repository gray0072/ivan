'use strict';

// Arlanda Rising — the aircraft types, as plain data. Each one has:
//   name     the type's name as shown
//   engines  'jet' or 'prop' (the sounds, the noise)
//   span, length  metres, for drawing to scale and for the stand size code
//   mtow     maximum take-off weight in tonnes (the landing fee)
//   seats    a typical cabin of the era (the passengers)
//   svc      game minutes the cleaning, catering and bags take at the stand
//   cat      the fire service category it needs (ICAO RFF, from its length and fuselage width)
//   src      where the numbers come from; check: what still has to be checked before the facts are shown
// The stand size code (ICAO A–F) is worked out from the span by sim/stands.js (codeOf).

const AIRCRAFT = {
  DC3: { name: 'Douglas DC-3', engines: 'prop', span: 29.0, length: 19.7, mtow: 12.7, seats: 28, svc: 14, cat: 5,
    src: 'en.wikipedia Douglas DC-3', check: 'seats of the Swedish operators' },
  CV44: { name: 'Convair 440 Metropolitan', engines: 'prop', span: 32.1, length: 24.8, mtow: 22.5, seats: 48, svc: 16, cat: 5,
    src: 'en.wikipedia Convair CV-240 family; Linjeflyg flew Convair 340/440 1960–79 (en.wikipedia Linjeflyg)', check: 'seats' },
  DC6B: { name: 'Douglas DC-6B', engines: 'prop', span: 35.8, length: 32.2, mtow: 48.5, seats: 86, svc: 24, cat: 6,
    src: 'en.wikipedia Douglas DC-6; Transair Sweden took DC-6s from SAS in 1959 (en.wikipedia Transair Sweden)', check: 'seats' },
  CRVL: { name: 'Sud Aviation Caravelle III', engines: 'jet', span: 34.3, length: 32.0, mtow: 46.0, seats: 72, svc: 20, cat: 6,
    src: 'en.wikipedia Sud Aviation Caravelle (SAS service from 26 April 1959)', check: 'SAS seats; the variant at Arlanda in 1959' },
  DC8: { name: 'Douglas DC-8-30', engines: 'jet', span: 43.4, length: 45.9, mtow: 140, seats: 132, svc: 34, cat: 7,
    src: 'en.wikipedia Douglas DC-8; SAS DC-8 to New York 26 June 1960 (sv.wikipedia Arlanda)', check: 'the SAS variant and seats' },
  DC9: { name: 'Douglas DC-9-41', engines: 'jet', span: 28.5, length: 38.3, mtow: 52, seats: 110, svc: 20, cat: 6,
    src: 'en.wikipedia McDonnell Douglas DC-9 (the -40 was built for SAS)', check: 'the year SAS brought the DC-9 to Arlanda; seats' },
  B727: { name: 'Boeing 727-200', engines: 'jet', span: 32.9, length: 46.7, mtow: 95, seats: 170, svc: 26, cat: 7,
    src: 'en.wikipedia Boeing 727', check: 'the seats of the charter airlines' },
  B747: { name: 'Boeing 747-200B', engines: 'jet', span: 59.6, length: 70.6, mtow: 378, seats: 400, svc: 50, cat: 9,
    src: 'en.wikipedia Boeing 747; SAS put its first 747-283B into service in 1971 (airhistory.net SE-DDL, worldairlinenews.com)', check: 'SAS seats' },
  DC10: { name: 'McDonnell Douglas DC-10-30', engines: 'jet', span: 50.4, length: 55.5, mtow: 263, seats: 250, svc: 42, cat: 8,
    src: 'en.wikipedia McDonnell Douglas DC-10', check: 'the year SAS flew it from Arlanda; seats' },
  F28: { name: 'Fokker F28 Fellowship', engines: 'jet', span: 25.1, length: 29.6, mtow: 33, seats: 85, svc: 15, cat: 6,
    src: 'en.wikipedia Linjeflyg: F28 1973–92, 65–85 seats; Linjeflyg was the largest F28 operator in 1992', check: '' },
  MD81: { name: 'McDonnell Douglas MD-81', engines: 'jet', span: 32.9, length: 45.1, mtow: 63.5, seats: 140, svc: 22, cat: 7,
    src: 'en.wikipedia McDonnell Douglas MD-80', check: 'the year SAS flew it from Arlanda; seats' },
  // session 4: the 1990s
  B737: { name: 'Boeing 737-300', engines: 'jet', span: 28.9, length: 33.4, mtow: 62.8, seats: 135, svc: 20, cat: 6,
    src: 'en.wikipedia Boeing 737 Classic', check: 'which airlines flew the -300, -400 or -500 at Arlanda; seats' },
  B767: { name: 'Boeing 767-300ER', engines: 'jet', span: 47.6, length: 54.9, mtow: 187, seats: 230, svc: 40, cat: 8,
    src: 'en.wikipedia Boeing 767', check: 'the year SAS flew it from Arlanda; seats' },
  MD87: { name: 'McDonnell Douglas MD-87', engines: 'jet', span: 32.9, length: 39.8, mtow: 63.5, seats: 125, svc: 20, cat: 7,
    src: 'en.wikipedia McDonnell Douglas MD-80', check: 'SAS seats' },
  F100: { name: 'Fokker 100', engines: 'jet', span: 28.1, length: 35.5, mtow: 45.8, seats: 107, svc: 17, cat: 6,
    src: 'en.wikipedia Fokker 100', check: 'which Swedish domestic airlines flew it' },
  F50: { name: 'Fokker 50', engines: 'prop', span: 29.0, length: 25.3, mtow: 20.8, seats: 50, svc: 12, cat: 5,
    src: 'en.wikipedia Fokker 50', check: 'SAS Commuter seats' },
  BA46: { name: 'BAe 146-200', engines: 'jet', span: 26.2, length: 28.6, mtow: 42.2, seats: 95, svc: 16, cat: 6,
    src: 'en.wikipedia British Aerospace 146', check: 'Malmö Aviation seats' },
  A320: { name: 'Airbus A320', engines: 'jet', span: 34.1, length: 37.6, mtow: 73.5, seats: 180, svc: 22, cat: 6,
    src: 'en.wikipedia Airbus A320 family', check: 'seats of the charter airlines' },
  B757: { name: 'Boeing 757-200', engines: 'jet', span: 38.1, length: 47.3, mtow: 115.7, seats: 195, svc: 28, cat: 7,
    src: 'en.wikipedia Boeing 757', check: 'which airlines flew it to Arlanda' },
  // session 5: the 2000s and 2010s
  B736: { name: 'Boeing 737-600', engines: 'jet', span: 34.3, length: 31.2, mtow: 65.5, seats: 120, svc: 19, cat: 6,
    src: 'en.wikipedia Boeing 737 Next Generation (SAS was the launch customer of the -600)', check: 'SAS seats' },
  B738: { name: 'Boeing 737-800', engines: 'jet', span: 35.8, length: 39.5, mtow: 79, seats: 186, svc: 22, cat: 7,
    src: 'en.wikipedia Boeing 737 Next Generation', check: 'the seats of Norwegian and SAS' },
  A321: { name: 'Airbus A321', engines: 'jet', span: 34.1, length: 44.5, mtow: 89, seats: 198, svc: 24, cat: 7,
    src: 'en.wikipedia Airbus A320 family', check: 'SAS seats' },
  A319: { name: 'Airbus A319', engines: 'jet', span: 34.1, length: 33.8, mtow: 75.5, seats: 120, svc: 20, cat: 6,
    src: 'en.wikipedia Airbus A320 family; Qatar Airways opened Doha–Stockholm with an A319 on 27 November 2007 (Qatar Airways)', check: 'seats' },
  CRJ9: { name: 'Bombardier CRJ900', engines: 'jet', span: 24.9, length: 36.4, mtow: 38.3, seats: 88, svc: 15, cat: 6,
    src: 'en.wikipedia Bombardier CRJ700 series', check: 'the year SAS flew it from Arlanda' },
  AT72: { name: 'ATR 72', engines: 'prop', span: 27.1, length: 27.2, mtow: 23, seats: 70, svc: 13, cat: 5,
    src: 'en.wikipedia ATR 72', check: 'which domestic airlines flew it from Arlanda' },
  A333: { name: 'Airbus A330-300', engines: 'jet', span: 60.3, length: 63.7, mtow: 233, seats: 260, svc: 45, cat: 9,
    src: 'en.wikipedia Airbus A330', check: 'the year SAS flew it from Arlanda; seats' },
  A343: { name: 'Airbus A340-300', engines: 'jet', span: 60.3, length: 63.7, mtow: 275, seats: 260, svc: 45, cat: 9,
    src: 'en.wikipedia Airbus A340', check: 'the years SAS flew it from Arlanda; seats' },
  B77W: { name: 'Boeing 777-300ER', engines: 'jet', span: 64.8, length: 73.9, mtow: 351, seats: 360, svc: 55, cat: 9,
    src: 'en.wikipedia Boeing 777; Emirates opened Dubai–Stockholm with a Boeing 777 on 5 September 2013 (swedavia.com)', check: 'the variant of the first flights (sources differ: -200 or -300ER)' },
  B789: { name: 'Boeing 787-9', engines: 'jet', span: 60.1, length: 62.8, mtow: 254, seats: 290, svc: 48, cat: 9,
    src: 'en.wikipedia Boeing 787 Dreamliner', check: 'which airlines flew it to Arlanda' },
  A388: { name: 'Airbus A380', engines: 'jet', span: 79.8, length: 72.7, mtow: 575, seats: 520, svc: 70, cat: 10,
    src: 'en.wikipedia Airbus A380; the first A380 at Arlanda was a Lufthansa demonstration visit on 15 September 2010 (Sveriges Radio)', check: 'no scheduled A380 is known at Arlanda' },
  G550: { name: 'Gulfstream G550', engines: 'jet', span: 28.5, length: 29.4, mtow: 41.3, seats: 14, svc: 10, cat: 6,
    src: 'en.wikipedia Gulfstream G550', check: '' }
};
