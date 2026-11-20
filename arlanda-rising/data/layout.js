'use strict';

// Arlanda Rising — where everything lies on the map, as plain data. Metres: x east, y north, from the south
// end of runway 1 (the 01L threshold, 59.6373° N 17.9132° E). The runway's ends are real (OurAirports
// runways.csv, from the Swedish AIP: 01L 59.637298 17.913200, 19R 59.666401 17.923800, 3 301 m × 45 m,
// true heading 10°); runway 3 lies about 2 km east of it and runway 2 crosses north-east (chapters 5 and
// 2). The first apron, its stands, the first terminal and tower, the taxiways and the roads of 1959–62
// are the game's own drawing in the right place (east of runway 1, where the terminals still are), to be
// checked against the aerodrome chart of the era (`check`). The land round the airport — Märsta to the
// south-west, the E4 to the west, forest, bogs, fields and small lakes — is drawn after the real map in
// broad strokes. Read by render/ (the map, the paths of aircraft and vehicles) and ui/ (what a tap hit).

const LAYOUT = {
  // the map's edge
  bounds: { x0: -4600, y0: -3600, x1: 5200, y1: 5200 },

  // runway 1 (01L/19R): the centreline from the 01 threshold to the 19 threshold, its width
  runway1: { from: [0, 0], to: [596, 3236], w: 45, strip: 150 },

  // the parallel taxiway 180 m east of runway 1, its links to the runway (s: 0 the south end, 1 the north)
  // and the link to the apron
  taxi: { offset: 180, w: 23, links: [0, 0.395, 1], apronLink: { s: 0.395, to: [640, 1245] } },

  // the first apron and its stands (in the order apron1 makes them; nose toward the terminal, east)
  apron1: { x0: 640, y0: 1120, x1: 880, y1: 1380 },
  stands: [
    { x: 868, y: 1335, hdg: 90 },   // 1 (D, contact)
    { x: 868, y: 1275, hdg: 90 },   // 2 (D, contact)
    { x: 868, y: 1215, hdg: 90 },   // 3 (C, contact)
    { x: 772, y: 1150, hdg: 90 }    // 4 (C, remote)
  ],
  // the remote stands bought later, one after another (each paved on its own)
  remote: [
    { x: 800, y: 1075, hdg: 90 }, { x: 800, y: 1020, hdg: 90 }, { x: 740, y: 965, hdg: 90 }, { x: 680, y: 1020, hdg: 90 },
    { x: 680, y: 1075, hdg: 90 }, { x: 740, y: 1430, hdg: 90 }
  ],

  // session 3: runway 2 (08/26) from the AIP's ends (59.658419 N 17.936133 E, 59.663897 N 17.979153 E), its taxiway
  // from the jet apron's north end; the jet apron (1965), the domestic apron (1983); where the aircraft on runway 2
  // leave it (m from its threshold)
  runway2: { from: [1290, 2349], to: [3709, 2958], w: 45, exit: 1500 },
  taxi2: [[760, 1650], [800, 1700], [1150, 2250], [1290, 2349]],
  apron2: { x0: 640, y0: 1380, x1: 890, y1: 1650 },
  apron3: { x0: 700, y0: 935, x1: 890, y1: 1110 },

  // buildings: [x0, y0, x1, y1] on the ground and a height in metres
  terminal1: { box: [880, 1180, 925, 1300], h: 9, waiting: [880, 1300, 915, 1335], kiosk: [884, 1165, 896, 1177] },
  tower1: { x: 912, y: 1365, base: 9, h: 28 },
  fireStation: { box: [455, 1470, 505, 1500], h: 8 },
  siteOffice: { x: 720, y: 880 },
  cafe: { box: [880, 1140, 905, 1162], h: 5 },
  intlTerminal: { box: [890, 1390, 965, 1645], h: 14 },
  domTerminal: { box: [895, 955, 975, 1112], h: 10 },
  bagHall: { box: [925, 1180, 955, 1265], h: 6 },
  computerRoom: { box: [925, 1300, 947, 1326], h: 5 },
  generator: { box: [950, 1300, 960, 1312], h: 3 },
  busStop: { x: 1010, y: 1180 },
  restaurant: { box: [905, 1140, 925, 1162], h: 5 },
  dutyFree: { box: [965, 1450, 990, 1520], h: 6 },
  fuelDepot: { x: 690, y: 1400 },      // where the fuel trucks wait
  snowDepot: { x: 560, y: 1430 },      // the ploughs' shed
  parkingSmall: { box: [960, 1180, 1040, 1250] },
  parkingBig: { box: [960, 1260, 1110, 1400] },

  // the road in: from the E4 round the south end of the runway to the terminal (the clearing's line too)
  road: [[-1880, -700], [-900, -760], [200, -620], [700, -200], [1000, 400], [1030, 900], [990, 1240], [930, 1240]],
  // the E4 motorway, west of the airport, north–south
  e4: [[-1700, -3600], [-1820, -1500], [-1880, -700], [-1860, 800], [-1950, 2600], [-2100, 5200]],
  // Märsta, south-west: the town's middle and size (red and white houses, a church)
  town: { x: -3300, y: -1900, r: 950, name: 'Märsta' },

  // land cover: fields (open farmland), lakes, the bog the site must drain, granite outcrops
  fields: [
    [[-4600, -3600], [-2200, -3600], [-2000, -2400], [-2600, -900], [-4600, -700]],
    [[-4600, 400], [-2700, 300], [-2400, 1700], [-4600, 2000]],
    [[2600, -3600], [5200, -3600], [5200, -2200], [3400, -1800]],
    [[-1500, 3600], [-300, 3900], [-500, 5200], [-1700, 5200]]
  ],
  lakes: [
    // Halmsjön, north of where runway 3 will be — its place and outline to be checked
    { pts: [[2650, 1750], [3050, 1650], [3400, 1800], [3300, 2050], [2900, 2120], [2650, 1980]], name: 'Halmsjön', check: true },
    { pts: [[-1000, 3300], [-700, 3250], [-560, 3450], [-850, 3600], [-1080, 3480]] },
    { pts: [[3500, -900], [3850, -1000], [4050, -760], [3700, -600]] }
  ],
  bog: [[500, 1040], [1000, 1060], [1040, 1460], [560, 1470]],
  rocks: [[-600, 1800, 40], [1500, 2600, 55], [2100, -900, 35], [-300, -1700, 45], [3600, 3200, 50], [1300, -1500, 30]],

  // the clearing jobs of the site (project `site`): the runway strip with the taxiway, the apron and the
  // terminal plot (after the bog is drained), the road
  clear: {
    strip: { half: 280 },
    apron: [[560, 1040], [1000, 1040], [1000, 1470], [560, 1470]]
  },

  check: 'the first apron, stands, terminal, tower, taxiways and road of 1959–62 (aerodrome chart of the era); Halmsjön'
};
