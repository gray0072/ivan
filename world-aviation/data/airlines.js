'use strict';

// ============================================================
// World Aviation — the airlines
// Real airlines, cargo carriers and bush / air ambulance operators
// that hire the player's operator. Each one has:
//   code     a short unique key (the IATA code where there is one)
//   name     the full name, shown on the contract board
//   title    the titles painted on the fuselage
//   kinds    which client groups it belongs to (FACTIONS: pax, cargo, bush)
//   hubs     airports it is based at: it is the likely client there,
//            and its aircraft stand at those gates
//   regions  where else it hires aircraft (REGIONS ids)
//   abroad   (optional) the only foreign countries it flies to (the Russian airlines)
//   livery   body, belly, cheatline colours, titles colour, fin, engines, nose
//   emblem   the fin art: [kind, ...arguments], drawn by art/emblems.js
//   like     copy the livery and emblem of another airline (cargo divisions)
// The liveries and emblems are simplified drawings of the real ones.
// Who may fly a route at all (traffic rights, see airlineMayFly below):
//   - both ends in its regions (or its hubs);
//   - a domestic route only by that country's airlines or one based there (a hub
//     in that country: a local subsidiary) — no Aeroflot from Stockholm to Kiruna;
//   - an international route by a passenger or bush airline only from or to its
//     own country or one of its bases (no fifth-freedom flights); freight flies
//     between third countries too;
//   - no flights at all between Russia and Europe or North America (CLOSED_TO_RUSSIA:
//     the airspace closed both ways since 2022); the Western airlines have no
//     'russia' in their regions, the Russian ones fly abroad only to the countries
//     in their `abroad` list.
// ============================================================

const ALL_REGIONS = ['sweden', 'nordic', 'europe', 'russia', 'caucasus', 'mideast', 'americas', 'asia'];
// everywhere but Russia (closed to European and North American airlines since 2022)
const WORLDWIDE = ALL_REGIONS.filter((r) => r !== 'russia');
// the countries with no flights to and from Russia
const CLOSED_TO_RUSSIA = ['Sweden', 'Norway', 'Finland', 'Denmark', 'Iceland', 'Faroe Islands', 'Greenland', 'United Kingdom',
  'Ireland', 'Netherlands', 'Belgium', 'Luxembourg', 'France', 'Germany', 'Switzerland', 'Austria', 'Czechia', 'Poland',
  'Latvia', 'Estonia', 'Hungary', 'Italy', 'Spain', 'Portugal', 'Greece', 'United States', 'Canada'];
// the state a territory's traffic rights belong to
const STATE_OF = { 'Svalbard': 'Norway' };

const AIRLINES = [
  // ---- Sweden and the Nordic countries
  { code: 'SK', name: 'SAS Scandinavian Airlines', title: 'SCANDINAVIAN', kinds: ['pax'], country: 'Sweden',
    hubs: ['ARN', 'CPH', 'OSL', 'GOT', 'LLA', 'UME', 'TRD', 'BGO', 'SVG', 'AAL', 'KRN'], regions: ['sweden', 'nordic', 'europe', 'americas', 'asia'],
    livery: { body: '#ffffff', belly: '#a9b6c8', title: '#0c1e4f', tail: '#0c1e4f', engine: '#0c1e4f' },
    emblem: ['text', 'SAS', '#ffffff', { italic: true }] },
  { code: 'DY', name: 'Norwegian', title: 'norwegian', kinds: ['pax'], country: 'Norway',
    hubs: ['OSL', 'ARN', 'CPH', 'HEL', 'BGO', 'TRD', 'TOS', 'SVG', 'MMX'], regions: ['sweden', 'nordic', 'europe'],
    livery: { body: '#ffffff', nose: '#d81939', title: '#d81939', tail: '#d81939', engine: '#ffffff', titleFont: 'lower' },
    emblem: ['portrait', '#ffffff'] },
  { code: 'TF', name: 'BRA Braathens Regional Airlines', title: 'BRA', kinds: ['pax'], country: 'Sweden',
    hubs: ['BMA', 'VBY', 'VXO', 'KLR', 'RNB', 'OSD', 'SDL', 'UME', 'MMX', 'GOT'], regions: ['sweden'],
    livery: { body: '#ffffff', title: '#0d5c46', tail: '#0d5c46', engine: '#ffffff' },
    emblem: ['bra'] },
  { code: 'AY', name: 'Finnair', title: 'FINNAIR', kinds: ['pax'], country: 'Finland',
    hubs: ['HEL', 'OUL', 'RVN'], regions: ['nordic', 'europe', 'asia', 'americas'],
    livery: { body: '#ffffff', title: '#0b1560', tail: '#ffffff', engine: '#ffffff' },
    emblem: ['finnair'] },
  { code: 'WF', name: 'Widerøe', title: 'WIDERØE', kinds: ['pax', 'bush'], country: 'Norway',
    hubs: ['BOO', 'TOS', 'EVE', 'ALF', 'KKN', 'VAW', 'RET', 'SOG', 'AES', 'TRD', 'BGO', 'LYR'], regions: ['nordic'],
    livery: { body: '#ffffff', title: '#0a5ea8', tail: '#0a5ea8', engine: '#ffffff' },
    emblem: ['wideroe'] },
  { code: 'FI', name: 'Icelandair', title: 'ICELANDAIR', kinds: ['pax'], country: 'Iceland',
    hubs: ['KEF'], regions: ['nordic', 'europe', 'americas'],
    livery: { body: '#ffffff', belly: '#00336e', title: '#00336e', tail: '#00336e', engine: '#00336e' },
    emblem: ['aurora'] },
  { code: 'RC', name: 'Atlantic Airways', title: 'ATLANTIC AIRWAYS', kinds: ['pax'], country: 'Faroe Islands',
    hubs: ['FAE'], regions: ['nordic'],
    livery: { body: '#ffffff', cheat: ['#003b7a', '#e2231a'], title: '#003b7a', tail: '#003b7a', engine: '#ffffff' },
    emblem: ['bird', '#ffffff', '#e2231a'] },
  { code: 'GL', name: 'Air Greenland', title: 'AIR GREENLAND', kinds: ['pax', 'bush'], country: 'Greenland',
    hubs: ['SFJ'], regions: ['nordic'],
    livery: { body: '#d5202f', belly: '#d5202f', title: '#ffffff', tail: '#d5202f', engine: '#d5202f' },
    emblem: ['greenland'] },
  // ---- Europe
  { code: 'BA', name: 'British Airways', title: 'BRITISH AIRWAYS', kinds: ['pax'], country: 'United Kingdom',
    hubs: ['LHR', 'EDI', 'MAN'], regions: WORLDWIDE,
    livery: { body: '#ffffff', belly: '#0d2b5c', cheat: ['#d52b1e'], title: '#0d2b5c', tail: '#ffffff', engine: '#0d2b5c' },
    emblem: ['chatham'] },
  { code: 'EI', name: 'Aer Lingus', title: 'aer lingus', kinds: ['pax'], country: 'Ireland',
    hubs: ['DUB'], regions: ['europe', 'americas'],
    livery: { body: '#ffffff', belly: '#006272', title: '#006272', tail: '#006272', engine: '#ffffff', titleFont: 'lower' },
    emblem: ['shamrock', '#ffffff', '#6cc24a'] },
  { code: 'FR', name: 'Ryanair', title: 'RYANAIR', kinds: ['pax'], country: 'Ireland',
    hubs: ['DUB', 'PMI', 'BCN', 'MAN', 'FCO', 'MXP', 'LIS'], regions: ['europe', 'sweden', 'nordic'],
    livery: { body: '#ffffff', belly: '#073590', title: '#073590', tail: '#073590', engine: '#073590' },
    emblem: ['harp', '#f1c933'] },
  { code: 'U2', name: 'easyJet', title: 'easyJet', kinds: ['pax'], country: 'United Kingdom',
    hubs: ['MAN', 'GVA', 'BER', 'EDI', 'NCE'], regions: ['europe', 'nordic'],
    livery: { body: '#ffffff', nose: '#ff6600', title: '#ff6600', tail: '#ff6600', engine: '#ff6600', titleFont: 'plain' },
    emblem: ['text', 'easyJet', '#ffffff', { size: 0.42 }] },
  { code: 'W6', name: 'Wizz Air', title: 'wizzair', kinds: ['pax'], country: 'Hungary',
    hubs: ['BUD', 'WAW'], regions: ['europe', 'sweden', 'nordic', 'mideast'],
    livery: { body: '#ffffff', title: '#c6007e', tail: '#c6007e', engine: '#2e2a6b', titleFont: 'lower' },
    emblem: ['wizz'] },
  { code: 'KL', name: 'KLM Royal Dutch Airlines', title: 'KLM', kinds: ['pax'], country: 'Netherlands',
    hubs: ['AMS'], regions: WORLDWIDE,
    livery: { body: '#00a1de', belly: '#ffffff', cheat: ['#003082'], title: '#ffffff', tail: '#00a1de', engine: '#00a1de' },
    emblem: ['crown', '#ffffff'] },
  { code: 'AF', name: 'Air France', title: 'AIRFRANCE', kinds: ['pax'], country: 'France',
    hubs: ['CDG', 'NCE'], regions: WORLDWIDE,
    livery: { body: '#ffffff', title: '#002157', tail: '#ffffff', engine: '#ffffff' },
    emblem: ['afStripes'] },
  { code: 'LH', name: 'Lufthansa', title: 'Lufthansa', kinds: ['pax'], country: 'Germany',
    hubs: ['FRA', 'MUC', 'HAM', 'BER'], regions: WORLDWIDE,
    livery: { body: '#ffffff', title: '#05164d', tail: '#05164d', engine: '#05164d', titleFont: 'serif' },
    emblem: ['crane', '#ffffff'] },
  { code: 'LX', name: 'Swiss International Air Lines', title: 'SWISS', kinds: ['pax'], country: 'Switzerland',
    hubs: ['ZRH', 'GVA'], regions: ['europe', 'americas', 'asia', 'mideast'],
    livery: { body: '#ffffff', title: '#e2001a', tail: '#e2001a', engine: '#ffffff' },
    emblem: ['swissCross'] },
  { code: 'OS', name: 'Austrian Airlines', title: 'Austrian', kinds: ['pax'], country: 'Austria',
    hubs: ['VIE'], regions: ['europe', 'mideast', 'americas'],
    livery: { body: '#ffffff', belly: '#e2001a', title: '#e2001a', tail: '#e2001a', engine: '#ffffff' },
    emblem: ['austrian'] },
  { code: 'SN', name: 'Brussels Airlines', title: 'brussels airlines', kinds: ['pax'], country: 'Belgium',
    hubs: ['BRU'], regions: ['europe', 'mideast'],
    livery: { body: '#ffffff', title: '#002a5c', tail: '#ffffff', engine: '#ffffff', titleFont: 'lower' },
    emblem: ['dotsB', '#e2001a'] },
  { code: 'LO', name: 'LOT Polish Airlines', title: 'LOT', kinds: ['pax'], country: 'Poland',
    hubs: ['WAW', 'PRG'], regions: ['europe', 'americas', 'asia'],
    livery: { body: '#ffffff', title: '#11397e', tail: '#11397e', engine: '#11397e' },
    emblem: ['lotCrane', '#ffffff'] },
  { code: 'BT', name: 'airBaltic', title: 'airBaltic', kinds: ['pax'], country: 'Latvia',
    hubs: ['RIX', 'TLL'], regions: ['europe', 'nordic', 'sweden'],
    livery: { body: '#ffffff', title: '#7a9a01', tail: '#c4d600', engine: '#c4d600', titleFont: 'plain' },
    emblem: ['text', 'aB', '#ffffff'] },
  { code: 'AZ', name: 'ITA Airways', title: 'ITA', kinds: ['pax'], country: 'Italy',
    hubs: ['FCO', 'MXP'], regions: ['europe', 'americas'],
    livery: { body: '#ffffff', title: '#004a9f', tail: '#004a9f', engine: '#004a9f' },
    emblem: ['ita'] },
  { code: 'IB', name: 'Iberia', title: 'IBERIA', kinds: ['pax'], country: 'Spain',
    hubs: ['MAD', 'BCN'], regions: ['europe', 'americas'],
    livery: { body: '#ffffff', title: '#d7192d', tail: '#ffffff', engine: '#ffffff' },
    emblem: ['iberia'] },
  { code: 'VY', name: 'Vueling', title: 'vueling', kinds: ['pax'], country: 'Spain',
    hubs: ['BCN', 'PMI'], regions: ['europe'],
    livery: { body: '#ffffff', title: '#5a5a5a', tail: '#ffcc00', engine: '#ffcc00', titleFont: 'lower' },
    emblem: ['text', 'V', '#5a5a5a', { size: 0.95 }] },
  { code: 'TP', name: 'TAP Air Portugal', title: 'TAP AIR PORTUGAL', kinds: ['pax'], country: 'Portugal',
    hubs: ['LIS'], regions: ['europe', 'americas', 'mideast'],
    livery: { body: '#ffffff', title: '#00843d', tail: '#ffffff', engine: '#ffffff' },
    emblem: ['tap'] },
  { code: 'A3', name: 'Aegean Airlines', title: 'AEGEAN', kinds: ['pax'], country: 'Greece',
    hubs: ['ATH'], regions: ['europe', 'mideast'],
    livery: { body: '#ffffff', title: '#00346b', tail: '#00346b', engine: '#ffffff' },
    emblem: ['aegean'] },
  { code: 'TK', name: 'Turkish Airlines', title: 'TURKISH AIRLINES', kinds: ['pax'], country: 'Turkey',
    hubs: ['IST'], regions: ALL_REGIONS,
    livery: { body: '#ffffff', title: '#c8102e', tail: '#c8102e', engine: '#ffffff' },
    emblem: ['turkish'] },
  // ---- Russia
  { code: 'SU', name: 'Aeroflot', title: 'AEROFLOT', kinds: ['pax'], country: 'Russia',
    hubs: ['SVO', 'LED', 'KGD', 'AER', 'KZN', 'SVX', 'OVB', 'KJA', 'IKT', 'VVO', 'MMK', 'ARH'], regions: ['russia', 'caucasus', 'europe', 'mideast', 'asia'],
    abroad: ['Turkey', 'United Arab Emirates', 'Egypt', 'Thailand', 'China', 'India', 'Indonesia', 'Azerbaijan', 'Armenia', 'Kazakhstan', 'Uzbekistan', 'Kyrgyzstan', 'Tajikistan'],
    livery: { body: '#ffffff', belly: '#c3c8cf', title: '#02458d', tail: '#ffffff', engine: '#02458d' },
    emblem: ['aeroflot'] },
  { code: 'S7', name: 'S7 Airlines', title: 'S7 airlines', kinds: ['pax'], country: 'Russia',
    hubs: ['OVB', 'IKT', 'SVO', 'KJA', 'AER'], regions: ['russia', 'caucasus', 'europe', 'mideast', 'asia'],
    abroad: ['Turkey', 'United Arab Emirates', 'Egypt', 'Thailand', 'China', 'India', 'Georgia', 'Azerbaijan', 'Armenia', 'Kazakhstan', 'Uzbekistan', 'Kyrgyzstan', 'Tajikistan'],
    livery: { body: '#a3c93a', belly: '#ffffff', title: '#ffffff', tail: '#a3c93a', engine: '#a3c93a', titleFont: 'plain' },
    emblem: ['text', 'S7', '#ffffff'] },
  { code: 'U6', name: 'Ural Airlines', title: 'URAL AIRLINES', kinds: ['pax'], country: 'Russia',
    hubs: ['SVX', 'SVO', 'AER', 'KZN', 'IJK'], regions: ['russia', 'caucasus', 'europe', 'mideast', 'asia'],
    abroad: ['Turkey', 'United Arab Emirates', 'Egypt', 'China', 'India', 'Thailand', 'Azerbaijan', 'Armenia', 'Kazakhstan', 'Uzbekistan', 'Kyrgyzstan', 'Tajikistan'],
    livery: { body: '#ffffff', cheat: ['#c8102e'], title: '#c8102e', tail: '#002d72', engine: '#ffffff' },
    emblem: ['bird', '#ffffff', '#c8102e'] },
  { code: 'DP', name: 'Pobeda', title: 'pobeda', kinds: ['pax'], country: 'Russia',
    hubs: ['SVO', 'LED', 'KZN', 'AER', 'KGD', 'MMK', 'ARH'], regions: ['russia', 'caucasus', 'europe', 'mideast'],
    abroad: ['Turkey', 'United Arab Emirates', 'Armenia', 'Kazakhstan', 'Uzbekistan', 'Kyrgyzstan', 'Tajikistan'],
    livery: { body: '#ffffff', title: '#1e4fa0', tail: '#1e4fa0', engine: '#ffffff', titleFont: 'lower' },
    emblem: ['text', 'P', '#ffffff', { size: 1.0 }] },
  { code: 'R3', name: 'Yakutia Airlines', title: 'YAKUTIA', kinds: ['pax'], country: 'Russia',
    hubs: ['YKS', 'NSK', 'PKC'], regions: ['russia'],
    livery: { body: '#ffffff', title: '#00609c', tail: '#00609c', engine: '#ffffff' },
    emblem: ['bird', '#ffffff', '#f2c500'] },
  { code: 'HZ', name: 'Aurora', title: 'AURORA', kinds: ['pax'], country: 'Russia',
    hubs: ['VVO', 'PKC', 'DYR'], regions: ['russia', 'asia'],
    abroad: ['China', 'South Korea', 'Thailand'],
    livery: { body: '#ffffff', title: '#1b2a5c', tail: '#1b2a5c', engine: '#ffffff' },
    emblem: ['aurora'] },
  // ---- the Caucasus and Central Asia
  { code: 'J2', name: 'Azerbaijan Airlines', title: 'AZERBAIJAN AIRLINES', kinds: ['pax'], country: 'Azerbaijan',
    hubs: ['GYD'], regions: ['caucasus', 'russia', 'sweden', 'nordic', 'europe', 'mideast', 'asia'],
    livery: { body: '#ffffff', cheat: ['#00b5e2'], title: '#00b5e2', tail: '#00b5e2', engine: '#ffffff' },
    emblem: ['bird', '#ffffff', '#ef3340'] },
  { code: 'A9', name: 'Georgian Airways', title: 'GEORGIAN AIRWAYS', kinds: ['pax'], country: 'Georgia',
    hubs: ['TBS'], regions: ['caucasus', 'russia', 'europe', 'mideast'],
    livery: { body: '#ffffff', title: '#c8102e', tail: '#ffffff', engine: '#ffffff' },
    emblem: ['text', 'GA', '#c8102e'] },
  { code: 'KC', name: 'Air Astana', title: 'AIR ASTANA', kinds: ['pax'], country: 'Kazakhstan',
    hubs: ['ALA', 'NQZ'], regions: ['caucasus', 'russia', 'sweden', 'nordic', 'europe', 'mideast', 'asia'],
    livery: { body: '#ffffff', title: '#3c3a6e', tail: '#4e5a86', engine: '#ffffff' },
    emblem: ['bird', '#d6a63c', '#ffffff'] },
  { code: 'HY', name: 'Uzbekistan Airways', title: 'UZBEKISTAN', kinds: ['pax', 'cargo'], country: 'Uzbekistan',
    hubs: ['TAS'], regions: ['caucasus', 'russia', 'europe', 'mideast', 'asia'],
    livery: { body: '#ffffff', cheat: ['#0099b5', '#1eb53a'], title: '#0099b5', tail: '#ffffff', engine: '#ffffff' },
    emblem: ['bird', '#0099b5', '#1eb53a'] },
  { code: 'SZ', name: 'Somon Air', title: 'SOMON AIR', kinds: ['pax'], country: 'Tajikistan',
    hubs: ['DYU'], regions: ['caucasus', 'russia', 'mideast', 'asia'],
    livery: { body: '#ffffff', cheat: ['#c8a046'], title: '#1d3f78', tail: '#1d3f78', engine: '#ffffff' },
    emblem: ['text', 'S', '#c8a046', { size: 1.0 }] },
  { code: '7L', name: 'Silk Way West Airlines', title: 'SILK WAY WEST', kinds: ['cargo'], country: 'Azerbaijan',
    hubs: ['GYD'], regions: ALL_REGIONS,
    livery: { body: '#ffffff', belly: '#c9ced4', title: '#0b2a5b', tail: '#0b2a5b', engine: '#0b2a5b' },
    emblem: ['text', 'SW', '#ffffff'] },
  // ---- the Middle East and Africa
  { code: 'LY', name: 'El Al Israel Airlines', title: 'EL AL', kinds: ['pax'], country: 'Israel',
    hubs: ['TLV'], regions: ['europe', 'americas', 'mideast'],
    livery: { body: '#ffffff', cheat: ['#00337f'], title: '#00337f', tail: '#ffffff', engine: '#ffffff' },
    emblem: ['elal'] },
  { code: 'MS', name: 'EgyptAir', title: 'EGYPTAIR', kinds: ['pax'], country: 'Egypt',
    hubs: ['CAI'], regions: ['mideast', 'europe', 'asia'],
    livery: { body: '#ffffff', title: '#00265d', tail: '#00265d', engine: '#ffffff' },
    emblem: ['horus'] },
  { code: 'EK', name: 'Emirates', title: 'Emirates', kinds: ['pax'], country: 'United Arab Emirates',
    hubs: ['DXB'], regions: ALL_REGIONS,
    livery: { body: '#ffffff', title: '#d71921', tail: '#ffffff', engine: '#ffffff', titleFont: 'serif' },
    emblem: ['uaeTail'] },
  { code: 'QR', name: 'Qatar Airways', title: 'QATAR AIRWAYS', kinds: ['pax'], country: 'Qatar',
    hubs: ['DOH'], regions: ALL_REGIONS,
    livery: { body: '#d1d3d4', belly: '#d1d3d4', title: '#5c0632', tail: '#5c0632', engine: '#5c0632' },
    emblem: ['oryx'] },
  { code: 'AT', name: 'Royal Air Maroc', title: 'ROYAL AIR MAROC', kinds: ['pax'], country: 'Morocco',
    hubs: ['CMN'], regions: ['mideast', 'europe', 'americas'],
    livery: { body: '#ffffff', title: '#c1272d', tail: '#c1272d', engine: '#ffffff' },
    emblem: ['ramStar'] },
  { code: 'ET', name: 'Ethiopian Airlines', title: 'Ethiopian', kinds: ['pax'], country: 'Ethiopia',
    hubs: ['ADD'], regions: ['mideast', 'europe', 'asia', 'americas', 'sweden', 'nordic'],
    livery: { body: '#ffffff', title: '#007a3d', tail: '#ffffff', engine: '#ffffff', titleFont: 'serif' },
    emblem: ['ethiopian'] },
  { code: 'KQ', name: 'Kenya Airways', title: 'Kenya Airways', kinds: ['pax'], country: 'Kenya',
    hubs: ['NBO'], regions: ['mideast', 'europe', 'asia'],
    livery: { body: '#ffffff', cheat: ['#000000', '#cc0000', '#00843d'], title: '#cc0000', tail: '#cc0000', engine: '#ffffff' },
    emblem: ['kq'] },
  { code: 'SA', name: 'South African Airways', title: 'SOUTH AFRICAN AIRWAYS', kinds: ['pax'], country: 'South Africa',
    hubs: ['JNB', 'CPT'], regions: ['mideast', 'europe'],
    livery: { body: '#ffffff', title: '#00337f', tail: '#ffffff', engine: '#ffffff' },
    emblem: ['saFlag'] },
  { code: 'P4', name: 'Air Peace', title: 'AIR PEACE', kinds: ['pax'], country: 'Nigeria',
    hubs: ['LOS'], regions: ['mideast'],
    livery: { body: '#ffffff', title: '#173a8c', tail: '#173a8c', engine: '#f39200' },
    emblem: ['dove', '#ffffff', '#f39200'] },
  // ---- the Americas
  { code: 'AA', name: 'American Airlines', title: 'American', kinds: ['pax'], country: 'United States',
    hubs: ['DFW', 'MIA', 'ORD', 'JFK'], regions: ['americas', 'europe', 'asia'],
    livery: { body: '#c9cfd5', belly: '#c9cfd5', title: '#36495a', tail: '#ffffff', engine: '#c9cfd5' },
    emblem: ['aaFlag'] },
  { code: 'DL', name: 'Delta Air Lines', title: 'DELTA', kinds: ['pax'], country: 'United States',
    hubs: ['ATL', 'JFK', 'BOS', 'SEA'], regions: ['americas', 'europe', 'asia'],
    livery: { body: '#ffffff', belly: '#003366', title: '#003366', tail: '#003366', engine: '#003366' },
    emblem: ['deltaWidget'] },
  { code: 'UA', name: 'United Airlines', title: 'UNITED', kinds: ['pax'], country: 'United States',
    hubs: ['ORD', 'DEN', 'SFO'], regions: ['americas', 'europe', 'asia'],
    livery: { body: '#ffffff', belly: '#0033a0', title: '#0033a0', tail: '#0033a0', engine: '#0033a0' },
    emblem: ['globe', '#ffffff', '#5aa0e6'] },
  { code: 'AS', name: 'Alaska Airlines', title: 'Alaska', kinds: ['pax'], country: 'United States',
    hubs: ['SEA', 'ANC'], regions: ['americas'],
    livery: { body: '#ffffff', title: '#01426a', tail: '#01426a', engine: '#01426a', titleFont: 'serif' },
    emblem: ['eskimo'] },
  { code: 'HA', name: 'Hawaiian Airlines', title: 'HAWAIIAN', kinds: ['pax'], country: 'United States',
    hubs: ['HNL'], regions: ['americas', 'asia'],
    livery: { body: '#ffffff', title: '#5e2a84', tail: '#5e2a84', engine: '#ffffff' },
    emblem: ['hibiscus', '#d6006e'] },
  { code: 'B6', name: 'JetBlue', title: 'jetBlue', kinds: ['pax'], country: 'United States',
    hubs: ['BOS', 'JFK'], regions: ['americas'],
    livery: { body: '#ffffff', belly: '#003876', title: '#0033a0', tail: '#003876', engine: '#003876', titleFont: 'plain' },
    emblem: ['dots', '#4f9be0'] },
  { code: 'AC', name: 'Air Canada', title: 'AIR CANADA', kinds: ['pax'], country: 'Canada',
    hubs: ['YYZ', 'YUL', 'YVR'], regions: ['americas', 'europe', 'asia'],
    livery: { body: '#ffffff', belly: '#1a1a1a', title: '#1a1a1a', tail: '#1a1a1a', engine: '#1a1a1a' },
    emblem: ['maple', '#e31837'] },
  { code: 'AM', name: 'Aeroméxico', title: 'AEROMEXICO', kinds: ['pax'], country: 'Mexico',
    hubs: ['MEX', 'CUN'], regions: ['americas', 'europe'],
    livery: { body: '#ffffff', belly: '#0b2343', title: '#0b2343', tail: '#0b2343', engine: '#0b2343' },
    emblem: ['eagleKnight'] },
  { code: 'AV', name: 'Avianca', title: 'avianca', kinds: ['pax'], country: 'Colombia',
    hubs: ['BOG'], regions: ['americas'],
    livery: { body: '#da291c', belly: '#da291c', title: '#ffffff', tail: '#da291c', engine: '#da291c', titleFont: 'lower' },
    emblem: ['text', 'a', '#ffffff', { size: 1.2 }] },
  { code: 'LA', name: 'LATAM Airlines', title: 'LATAM', kinds: ['pax'], country: 'Chile',
    hubs: ['SCL', 'LIM', 'GRU', 'GIG', 'BOG'], regions: ['americas'],
    livery: { body: '#ffffff', belly: '#1b0088', title: '#1b0088', tail: '#1b0088', engine: '#1b0088' },
    emblem: ['latam'] },
  { code: 'AR', name: 'Aerolíneas Argentinas', title: 'AEROLINEAS ARGENTINAS', kinds: ['pax'], country: 'Argentina',
    hubs: ['EZE'], regions: ['americas'],
    livery: { body: '#ffffff', title: '#00447c', tail: '#7fb2e5', engine: '#ffffff' },
    emblem: ['condor'] },
  // ---- Asia and the Pacific
  { code: 'AI', name: 'Air India', title: 'AIR INDIA', kinds: ['pax'], country: 'India',
    hubs: ['DEL', 'BOM'], regions: ['asia', 'europe', 'mideast', 'americas'],
    livery: { body: '#ffffff', title: '#da0e29', tail: '#da0e29', engine: '#7a1a6b' },
    emblem: ['vista'] },
  { code: '6E', name: 'IndiGo', title: 'IndiGo', kinds: ['pax'], country: 'India',
    hubs: ['DEL', 'BOM'], regions: ['asia', 'mideast'],
    livery: { body: '#ffffff', belly: '#001b94', title: '#001b94', tail: '#001b94', engine: '#001b94', titleFont: 'plain' },
    emblem: ['dots', '#ffffff'] },
  { code: 'TG', name: 'Thai Airways', title: 'THAI', kinds: ['pax'], country: 'Thailand',
    hubs: ['BKK'], regions: ['asia', 'europe'],
    livery: { body: '#ffffff', title: '#5b1f69', tail: '#5b1f69', engine: '#ffffff' },
    emblem: ['orchid'] },
  { code: 'SQ', name: 'Singapore Airlines', title: 'SINGAPORE AIRLINES', kinds: ['pax'], country: 'Singapore',
    hubs: ['SIN'], regions: ['asia', 'europe', 'americas', 'mideast'],
    livery: { body: '#ffffff', cheat: ['#1d2c5a', '#f99f1c'], title: '#1d2c5a', tail: '#1d2c5a', engine: '#1d2c5a', titleFont: 'serif' },
    emblem: ['sqBird'] },
  { code: 'MH', name: 'Malaysia Airlines', title: 'malaysia', kinds: ['pax'], country: 'Malaysia',
    hubs: ['KUL'], regions: ['asia', 'europe'],
    livery: { body: '#ffffff', cheat: ['#d71920', '#003d8f'], title: '#003d8f', tail: '#ffffff', engine: '#ffffff', titleFont: 'lower' },
    emblem: ['wau'] },
  { code: 'GA', name: 'Garuda Indonesia', title: 'Garuda Indonesia', kinds: ['pax'], country: 'Indonesia',
    hubs: ['CGK'], regions: ['asia', 'mideast'],
    livery: { body: '#ffffff', title: '#0b6c7a', tail: '#0b4f6c', engine: '#ffffff', titleFont: 'serif' },
    emblem: ['garuda'] },
  { code: 'CX', name: 'Cathay Pacific', title: 'CATHAY PACIFIC', kinds: ['pax'], country: 'China',
    hubs: ['HKG'], regions: ['asia', 'europe', 'americas'],
    livery: { body: '#ffffff', belly: '#d9dcdc', title: '#006564', tail: '#006564', engine: '#ffffff' },
    emblem: ['brushwing', '#ffffff'] },
  { code: 'MU', name: 'China Eastern Airlines', title: 'CHINA EASTERN', kinds: ['pax'], country: 'China',
    hubs: ['PVG'], regions: ['asia', 'europe'],
    livery: { body: '#ffffff', belly: '#1a3f8f', title: '#1a3f8f', tail: '#ffffff', engine: '#ffffff' },
    emblem: ['swallow'] },
  { code: 'CA', name: 'Air China', title: 'AIR CHINA', kinds: ['pax'], country: 'China',
    hubs: ['PEK'], regions: ['asia', 'europe', 'americas'],
    livery: { body: '#ffffff', title: '#1a1a1a', tail: '#ffffff', engine: '#ffffff' },
    emblem: ['phoenix', '#e30613'] },
  { code: 'KE', name: 'Korean Air', title: 'KOREAN AIR', kinds: ['pax'], country: 'South Korea',
    hubs: ['ICN'], regions: ['asia', 'europe', 'americas'],
    livery: { body: '#8cbde8', belly: '#c7c9cc', title: '#00256c', tail: '#ffffff', engine: '#8cbde8' },
    emblem: ['taeguk'] },
  { code: 'NH', name: 'All Nippon Airways', title: 'ANA', kinds: ['pax'], country: 'Japan',
    hubs: ['HND'], regions: ['asia', 'europe', 'americas'],
    livery: { body: '#ffffff', cheat: ['#0a2a7f', '#14a3d9'], title: '#0a2a7f', tail: '#0a2a7f', engine: '#ffffff' },
    emblem: ['text', 'ANA', '#ffffff', { italic: true }] },
  { code: 'JL', name: 'Japan Airlines', title: 'JAPAN AIRLINES', kinds: ['pax'], country: 'Japan',
    hubs: ['HND'], regions: ['asia', 'europe', 'americas'],
    livery: { body: '#ffffff', title: '#333333', tail: '#ffffff', engine: '#ffffff' },
    emblem: ['tsuru', '#cc0000'] },
  { code: 'CI', name: 'China Airlines', title: 'CHINA AIRLINES', kinds: ['pax'], country: 'Taiwan',
    hubs: ['TPE'], regions: ['asia', 'europe', 'americas'],
    livery: { body: '#ffffff', cheat: ['#003b7a'], title: '#003b7a', tail: '#ffffff', engine: '#ffffff' },
    emblem: ['plum'] },
  { code: 'PR', name: 'Philippine Airlines', title: 'PHILIPPINE AIRLINES', kinds: ['pax'], country: 'Philippines',
    hubs: ['MNL'], regions: ['asia', 'americas'],
    livery: { body: '#ffffff', cheat: ['#0038a8', '#ce1126'], title: '#0038a8', tail: '#ffffff', engine: '#ffffff' },
    emblem: ['prSun'] },
  { code: 'QF', name: 'Qantas', title: 'QANTAS', kinds: ['pax'], country: 'Australia',
    hubs: ['SYD', 'MEL', 'PER'], regions: ['asia', 'americas', 'europe'],
    livery: { body: '#ffffff', title: '#e40000', tail: '#e40000', engine: '#ffffff' },
    emblem: ['kangaroo', '#ffffff'] },
  { code: 'NZ', name: 'Air New Zealand', title: 'AIR NEW ZEALAND', kinds: ['pax'], country: 'New Zealand',
    hubs: ['AKL'], regions: ['asia', 'americas'],
    livery: { body: '#ffffff', title: '#111111', tail: '#111111', engine: '#111111' },
    emblem: ['koru', '#ffffff'] },

  // ---- cargo carriers
  { code: 'DHL', name: 'DHL Aviation', title: 'DHL', kinds: ['cargo'], country: 'Germany',
    hubs: ['BRU', 'CPH', 'ARN', 'CDG', 'MIA', 'HKG'], regions: WORLDWIDE,
    livery: { body: '#ffcc00', belly: '#ffcc00', title: '#d40511', tail: '#ffcc00', engine: '#ffcc00' },
    emblem: ['dhl'] },
  { code: 'FX', name: 'FedEx Express', title: 'FedEx', kinds: ['cargo'], country: 'United States',
    hubs: ['CDG', 'ANC'], regions: WORLDWIDE,
    livery: { body: '#ffffff', belly: '#bfc3c7', title: '#4d148c', tail: '#4d148c', engine: '#ffffff', titleFont: 'fedex' },
    emblem: ['fedex'] },
  { code: '5X', name: 'UPS Airlines', title: 'UPS', kinds: ['cargo'], country: 'United States',
    hubs: ['ANC', 'MIA', 'HKG'], regions: WORLDWIDE,
    livery: { body: '#ffffff', belly: '#351c15', title: '#351c15', tail: '#351c15', engine: '#351c15' },
    emblem: ['upsShield'] },
  { code: 'CV', name: 'Cargolux', title: 'CARGOLUX', kinds: ['cargo'], country: 'Luxembourg',
    hubs: [], regions: ['europe', 'americas', 'asia', 'mideast'],
    livery: { body: '#ffffff', title: '#00264d', tail: '#00264d', engine: '#ffffff' },
    emblem: ['cargolux'] },
  { code: 'WT', name: 'West Atlantic', title: 'WEST ATLANTIC', kinds: ['cargo'], country: 'Sweden',
    hubs: ['ARN', 'MMX', 'GOT', 'LLA', 'UME'], regions: ['sweden', 'nordic', 'europe'],
    livery: { body: '#ffffff', title: '#00498f', tail: '#00498f', engine: '#ffffff' },
    emblem: ['westAtlantic'] },
  { code: 'APF', name: 'Amapola Flyg', title: 'AMAPOLA', kinds: ['cargo'], country: 'Sweden',
    hubs: ['ARN', 'SDL', 'OSD', 'KRN', 'VBY'], regions: ['sweden', 'nordic'],
    livery: { body: '#ffffff', title: '#0067a5', tail: '#ffffff', engine: '#ffffff' },
    emblem: ['poppy'] },
  { code: 'LHC', name: 'Lufthansa Cargo', title: 'Lufthansa Cargo', like: 'LH', kinds: ['cargo'], country: 'Germany',
    hubs: ['FRA'], regions: WORLDWIDE },
  { code: 'EKC', name: 'Emirates SkyCargo', title: 'Emirates SkyCargo', like: 'EK', kinds: ['cargo'], country: 'United Arab Emirates',
    hubs: ['DXB'], regions: ALL_REGIONS },
  { code: 'QRC', name: 'Qatar Airways Cargo', title: 'QATAR CARGO', like: 'QR', kinds: ['cargo'], country: 'Qatar',
    hubs: ['DOH'], regions: ALL_REGIONS },
  { code: 'CXC', name: 'Cathay Cargo', title: 'CATHAY CARGO', like: 'CX', kinds: ['cargo'], country: 'China',
    hubs: ['HKG'], regions: ['asia', 'europe', 'americas'] },
  { code: 'KEC', name: 'Korean Air Cargo', title: 'KOREAN AIR CARGO', like: 'KE', kinds: ['cargo'], country: 'South Korea',
    hubs: ['ICN'], regions: ['asia', 'europe', 'americas'] },
  { code: 'ETC', name: 'Ethiopian Cargo', title: 'Ethiopian Cargo', like: 'ET', kinds: ['cargo'], country: 'Ethiopia',
    hubs: ['ADD'], regions: ['mideast', 'europe', 'asia'] },
  { code: 'LAC', name: 'LATAM Cargo', title: 'LATAM CARGO', like: 'LA', kinds: ['cargo'], country: 'Chile',
    hubs: ['SCL', 'GRU', 'MIA'], regions: ['americas', 'europe'] },
  { code: '5Y', name: 'Atlas Air', title: 'ATLAS AIR', kinds: ['cargo'], country: 'United States',
    hubs: ['JFK', 'ANC', 'MIA'], regions: ['americas', 'asia', 'europe'],
    livery: { body: '#ffffff', title: '#002f6c', tail: '#002f6c', engine: '#ffffff' },
    emblem: ['globe', '#ffffff', '#f2a900'] },

  { code: 'RU', name: 'AirBridgeCargo', title: 'AirBridgeCargo', kinds: ['cargo'], country: 'Russia',
    hubs: ['SVO', 'KJA', 'OVB'], regions: ['russia', 'caucasus', 'europe', 'mideast', 'asia'],
    abroad: ['China', 'Turkey', 'United Arab Emirates', 'India', 'Kazakhstan', 'Uzbekistan'],
    livery: { body: '#ffffff', title: '#0d3b84', tail: '#0d3b84', engine: '#ffffff', titleFont: 'plain' },
    emblem: ['text', 'ABC', '#ffffff'] },

  // ---- bush flying and air ambulance
  { code: 'KAX', name: 'Kallax Flyg', title: 'KALLAX FLYG', kinds: ['bush'], country: 'Sweden',
    hubs: ['LLA', 'KRN', 'UME'], regions: ['sweden', 'nordic'],
    livery: { body: '#ffffff', cheat: ['#ffd200'], title: '#00346e', tail: '#00346e', engine: '#ffffff' },
    emblem: ['text', 'K', '#ffd200', { size: 1.1 }] },
  { code: 'SLA', name: 'Svensk Luftambulans', title: 'LUFTAMBULANS', kinds: ['bush'], country: 'Sweden',
    hubs: ['ARN', 'UME', 'OSD', 'GOT', 'VBY'], regions: ['sweden'],
    livery: { body: '#ffffff', cheat: ['#00843d', '#ffd100'], title: '#00843d', tail: '#00843d', engine: '#ffffff' },
    emblem: ['starOfLife', '#ffffff'] },
  { code: 'NLA', name: 'Norsk Luftambulanse', title: 'LUFTAMBULANSE', kinds: ['bush'], country: 'Norway',
    hubs: ['OSL', 'BOO', 'TOS', 'ALF', 'KKN'], regions: ['nordic'],
    livery: { body: '#e30613', belly: '#ffffff', title: '#ffffff', tail: '#e30613', engine: '#ffffff' },
    emblem: ['starOfLife', '#ffffff'] },
  { code: 'LTR', name: 'Lufttransport', title: 'LUFTTRANSPORT', kinds: ['bush'], country: 'Norway',
    hubs: ['LYR', 'TOS', 'KEF'], regions: ['nordic'],
    livery: { body: '#ffffff', cheat: ['#003a70'], title: '#003a70', tail: '#003a70', engine: '#ffffff' },
    emblem: ['text', 'LT', '#ffffff'] },
  { code: 'KBA', name: 'Kenn Borek Air', title: 'KENN BOREK AIR', kinds: ['bush'], country: 'Canada',
    hubs: ['SFJ'], regions: ['nordic', 'americas'],
    livery: { body: '#ffffff', cheat: ['#d22630'], title: '#d22630', tail: '#d22630', engine: '#ffffff' },
    emblem: ['maple', '#ffffff'] },
  { code: 'RVN', name: 'Ravn Alaska', title: 'RAVN ALASKA', kinds: ['bush'], country: 'United States',
    hubs: ['ANC'], regions: ['americas'],
    livery: { body: '#ffffff', title: '#00205b', tail: '#00205b', engine: '#ffffff' },
    emblem: ['raven', '#ffffff'] },
  { code: 'HAR', name: 'Harbour Air', title: 'HARBOUR AIR', kinds: ['bush'], country: 'Canada',
    hubs: ['YVR'], regions: ['americas'],
    livery: { body: '#ffffff', cheat: ['#f7a800'], title: '#00467f', tail: '#00467f', engine: '#ffffff' },
    emblem: ['orca', '#ffffff'] },
  { code: 'AMF', name: 'AMREF Flying Doctors', title: 'AMREF FLYING DOCTORS', kinds: ['bush'], country: 'Kenya',
    hubs: ['NBO', 'ADD'], regions: ['mideast'],
    livery: { body: '#ffffff', cheat: ['#00a3e0'], title: '#00a3e0', tail: '#00a3e0', engine: '#ffffff' },
    emblem: ['starOfLife', '#ffffff'] },
  { code: 'RFD', name: 'Royal Flying Doctor Service', title: 'FLYING DOCTOR', kinds: ['bush'], country: 'Australia',
    hubs: ['SYD', 'MEL', 'PER'], regions: ['asia'],
    livery: { body: '#ffffff', cheat: ['#e4002b'], title: '#003da5', tail: '#003da5', engine: '#ffffff' },
    emblem: ['wingsCross'] },
  { code: 'MAF', name: 'Mission Aviation Fellowship', title: 'MAF', kinds: ['bush'], country: 'United Kingdom',
    hubs: ['NBO', 'CGK', 'MNL', 'LIM'], regions: ['mideast', 'asia', 'americas'],
    livery: { body: '#ffffff', cheat: ['#e0393e'], title: '#1d4f91', tail: '#1d4f91', engine: '#ffffff' },
    emblem: ['text', 'MAF', '#ffffff'] },
  { code: 'PLR', name: 'Polar Airlines', title: 'POLAR AIRLINES', kinds: ['bush'], country: 'Russia',
    hubs: ['YKS', 'HTG', 'DYR'], regions: ['russia'],
    livery: { body: '#ffffff', cheat: ['#0066b3'], title: '#0066b3', tail: '#0066b3', engine: '#ffffff' },
    emblem: ['bird', '#ffffff', '#e2231a'] },
  { code: 'KRS', name: 'KrasAvia', title: 'KRASAVIA', kinds: ['bush'], country: 'Russia',
    hubs: ['KJA', 'NSK', 'HTG'], regions: ['russia'],
    livery: { body: '#ffffff', cheat: ['#e2231a'], title: '#1c4f9c', tail: '#1c4f9c', engine: '#ffffff' },
    emblem: ['text', 'KA', '#ffffff'] },
  { code: 'NSA', name: 'National Air Ambulance Service', title: 'SANAVIATSIYA', kinds: ['bush'], country: 'Russia',
    hubs: ['ARH', 'YKS', 'NSK', 'PKC', 'DYR'], regions: ['russia'],
    livery: { body: '#ffffff', cheat: ['#e2231a', '#1c4f9c'], title: '#e2231a', tail: '#e2231a', engine: '#ffffff' },
    emblem: ['starOfLife', '#ffffff'] }
];

// fill in the airlines that borrow another one's paint (the cargo divisions)
const AIRLINE_BY_CODE = {};
for (const al of AIRLINES) AIRLINE_BY_CODE[al.code] = al;
for (const al of AIRLINES) {
  if (!al.like) continue;
  const src = AIRLINE_BY_CODE[al.like];
  al.livery = Object.assign({}, src.livery);
  al.emblem = src.emblem;
}

// the state an airport's (or an airline's) country belongs to for traffic rights
function stateOf(country) { return STATE_OF[country] || country; }
// the states an airline is based in: its own and those of its hubs (local subsidiaries)
for (const al of AIRLINES) {
  al.bases = [stateOf(al.country)];
  for (const id of al.hubs) {
    const apt = typeof AIRPORTS !== 'undefined' && AIRPORTS.find((a) => a.id === id);
    if (apt && al.bases.indexOf(stateOf(apt.country)) < 0) al.bases.push(stateOf(apt.country));
  }
}

// does the airline work at this airport: one of its hubs, or in its regions (and, abroad,
// in a country it flies to)
function airlineWorksAt(al, apt) {
  if (al.hubs.indexOf(apt.id) >= 0) return true;
  if (al.regions.indexOf(apt.region) < 0) return false;
  const st = stateOf(apt.country);
  return !al.abroad || st === stateOf(al.country) || al.abroad.indexOf(st) >= 0;
}

// may the airline fly this route for this client group (the rules at the top of the file)
function airlineMayFly(al, faction, from, to) {
  if (!airlineWorksAt(al, from) || !airlineWorksAt(al, to)) return false;
  const a = stateOf(from.country), b = stateOf(to.country);
  if ((a === 'Russia' && CLOSED_TO_RUSSIA.indexOf(b) >= 0) || (b === 'Russia' && CLOSED_TO_RUSSIA.indexOf(a) >= 0)) return false;
  if (a === b) return al.bases.indexOf(a) >= 0;                             // cabotage
  return faction === 'cargo' || al.bases.indexOf(a) >= 0 || al.bases.indexOf(b) >= 0;   // no fifth freedoms
}

// The client for a contract among the airlines of that client group that may fly the route:
// one based at either end of it most likely, then one from either country, then any other.
// null when none may fly it.
function pickAirline(faction, from, to, rng) {
  const pool = [];
  for (const al of AIRLINES) {
    if (al.kinds.indexOf(faction) < 0 || !airlineMayFly(al, faction, from, to)) continue;
    let w = 1;
    if (al.hubs.indexOf(from.id) >= 0 || al.hubs.indexOf(to.id) >= 0) w = 6;
    else if (al.country === from.country || al.country === to.country) w = 2;
    pool.push({ al, w });
  }
  return pool.length ? rng.weighted(pool, (p) => p.w).al : null;
}

// The airlines whose aeroplanes stand at an airport's gates: its home carriers first
function airlinesAt(apt) {
  const list = [];
  for (const al of AIRLINES) if (al.hubs.indexOf(apt.id) >= 0 && al.kinds.indexOf('bush') < 0) list.push(al);
  if (list.length < 2) {
    for (const al of AIRLINES) {
      if (list.length >= 3) break;
      if (list.indexOf(al) < 0 && al.kinds.indexOf('pax') >= 0 && al.country === apt.country) list.push(al);
    }
  }
  if (list.length < 2) {
    for (const al of AIRLINES) {
      if (list.length >= 3) break;
      if (list.indexOf(al) < 0 && al.kinds.indexOf('pax') >= 0 && airlineWorksAt(al, apt) &&
        al.regions.length < 5) list.push(al);
    }
  }
  return list;
}
