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

  // the parallel taxiway 180 m east of runway 1, its links to the runway (s: 0 the south end, 1 the north),
  // the link to the apron the arrivals come in by, and the departures' own link at the apron's north end (one way in,
  // one way out, so they never meet head-on); the departures leave a stand along a lane `outLane` m west of the
  // arrivals' one
  taxi: { offset: 180, w: 23, links: [0, 0.395, 1], apronLink: { s: 0.395, to: [640, 1245] }, apronOut: { s: 0.431, to: [640, 1362] }, outLane: 40 },

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
  // from the jet apron's north end: west along the gap between the jet apron and the aprons of 2002 and later, north
  // along their west edge (x 688, clear of the aprons that start at x 700), east past the north end of the piers and the
  // second arm and up to the 08 threshold — never across an apron or a pier; the jet apron (1965), the domestic apron
  // (1983); where the aircraft on runway 2 leave it (m from its threshold)
  runway2: { from: [1290, 2349], to: [3709, 2958], w: 45, exit: 1500 },
  taxi2: [[760, 1650], [688, 1650], [688, 2450], [1200, 2450], [1290, 2349]],
  apron2: { x0: 640, y0: 1380, x1: 890, y1: 1650 },
  apron3: { x0: 700, y0: 935, x1: 890, y1: 1110 },

  // buildings: [x0, y0, x1, y1] on the ground and a height in metres
  terminal1: { box: [880, 1180, 925, 1300], h: 9, waiting: [880, 1300, 915, 1335] },
  tower1: { x: 912, y: 1365, base: 9, h: 28 },
  fireStation: { box: [482, 1470, 532, 1500], h: 8 },   // east of the parallel taxiway (its edge at x ≈ 468 here)
  siteOffice: { x: 720, y: 880 },
  intlTerminal: { box: [890, 1390, 965, 1645], h: 14 },
  domTerminal: { box: [895, 955, 975, 1112], h: 10 },
  bagHall: { box: [925, 1180, 955, 1265], h: 6 },
  computerRoom: { box: [925, 1300, 947, 1326], h: 5 },
  generator: { box: [950, 1300, 960, 1312], h: 3 },
  busStop: { x: 1010, y: 1180 },
  fuelDepot: { x: 690, y: 1400 },      // where the fuel trucks wait until the jet apron is begun (it is paved over then)
  // the fuel trucks' yard from the jet apron's paving on (render/airport.js fuelSpot): east of the fire station and
  // behind the ploughs (north of their rows, farther from the viewer), a paved pad `box` with a shelter over its back
  // row; the trucks stand nose south in `rows` (their y: the open front row first, then the back row under the shelter)
  // of `cols`, from `x` every `dx` m, drive out along the aisle south of them (`aisle`, its y) and east on their lane to
  // the jet apron's west edge (`gate`), then on the lanes behind the stands
  fuelYard: { box: [548, 1468, 624, 1508], rows: [1486, 1502], x: 554, dx: 5.5, cols: 12, aisle: 1474, gate: [652, 1474] },
  // the ploughs' place: two rows nose south (`rows`, their y; the first filled first) of `cols`, from `x` every `dx` m,
  // on the ground `box` (between the departures' link and the crash tenders' bays)
  snowDepot: { x: 560, y: 1430, rows: [1430, 1414], dx: 9, cols: 6, box: [552, 1405, 612, 1438] },
  // the car parks east of the road in and of the landside road, by the bus stop (west of them the terminals)
  parkingSmall: { box: [1020, 1186, 1100, 1248] },
  parkingBig: { box: [1024, 1258, 1106, 1398] },
  // session 4: Terminal 2 south of the domestic terminal, with its own apron; the sorting hall; Arlanda Express — the
  // line from the East Coast railway in the north-east, the tunnel under the terminals (portals north and south) and
  // its two stations under the landside road (the game's drawing of the course, to be checked)
  terminal2: { box: [895, 775, 975, 930], h: 11 },
  apron4: { x0: 700, y0: 760, x1: 890, y1: 935 },
  sorterHall: { box: [955, 1330, 990, 1385], h: 7 },
  rail: { line: [[4600, 4200], [4000, 2900], [3200, 2500], [1800, 1950], [1150, 1780]], tunnel: [[1150, 1780], [1060, 1600], [1050, 1000], [1080, 640]],
    south: [1050, 1000], north: [1055, 1500], portalN: [1150, 1780], portalS: [1080, 640], out: [[1080, 640], [1300, 200], [1700, -900], [2300, -3600]] },
  // the line passes beyond runway 2's east end (not over the runway) and Cargo City lies west of the line out to the south

  // session 5: runway 3 (01R/19L) from SkyVector's ends (01R 59°37.58′ N 17°57.04′ E, 19L 59°38.91′ N 17°57.52′ E), its
  // exit (a share of its length from 01R) and the taxiway from it west over the railway and the road (the two taxiway
  // bridges, the game's drawing of where they cross) to the south of the aprons; the new tower (83 m); Pier F and its apron
  // north of the international terminal, the A380 gate at its end; Sky City and its hotel between the terminals; Cargo
  // City south of the terminals; the remote de-icing pads (by the south end of runway 1, by runway 3); the aquifer's pump
  // house; the solar parks; the free plots' offices and the hotel's wing (the game's own places)
  runway3: { from: [2108, -1220], to: [2558, 1246], w: 45, exit: 0.576 },
  taxi3: [[2367, 200], [1300, 200], [915, 214], [780, 330], [800, 760]],
  bridges: [[1300, 200], [915, 214]],
  tower2: { x: 1063, y: 1113, base: 11, h: 83 },
  pierF: { box: [890, 1655, 935, 1990], h: 8 },
  apron5: { x0: 700, y0: 1655, x1: 890, y1: 1990 },
  skyCity: { box: [1024, 1402, 1094, 1445], h: 12 },     // east of the landside road, across it from the terminals
  hotel: { box: [1094, 1405, 1124, 1440], h: 36 },
  hotelExt: { box: [1124, 1405, 1152, 1440], h: 28 },
  offices: { box: [1112, 1180, 1150, 1240], h: 18 },     // a second block, when bought, stands at [1112, 1250, 1150, 1300]
  // Cargo City between the taxiway to the bridges and the road in: the halls' landside on the road, their airside on
  // the cargo apron west of them, whose stands (data/buildings.js cargoStand) stand nose east to the halls in a column
  cargoCity: { box: [915, 420, 975, 740], h: 12, yard: [915, 395, 978, 420] },
  cargoApron: { x0: 815, y0: 400, x1: 912, y1: 760 },
  deicePads: [[200, 80, 330, 180], [2250, -940, 2360, -800]],   // the second outside runway 3's strip (its edge x ≈ 2230)
  aquifer: { box: [1190, 1460, 1214, 1480], h: 4 },
  solar: [[1450, 600, 1700, 760], [1450, 800, 1700, 960]],
  // session 6: the cargo stands by Cargo City, the security operations centre, the hydrogen depot, the night train's
  // platform at the station, the player's pier north of Pier F (the finger along the line of the piers, or a satellite
  // out on the apron reached by a tunnel)
  cyberCentre: { box: [1160, 1185, 1188, 1210], h: 9 },   // east of the offices (their second block takes the plot south of it)
  h2depot: { box: [560, 1520, 620, 1560], tanks: 3 },
  nightTrain: { box: [1180, 1748, 1260, 1770], h: 4 },    // beside the line east of the north portal, not on it
  // the player's pier: the finger along the line of the piers; or the satellite, an island in the apron with stands nose
  // east on its west side and nose west on its east side (that apron then paved up to x 935, `satApron`, for their
  // lane); the second arm continues the finger north over its own apron (apron7)
  pier2040: { box: [890, 1995, 935, 2250], h: 10, sat: [800, 2010, 840, 2255], satApron: [890, 1995, 935, 2250], arm: [890, 2250, 935, 2420] },
  apron6: { x0: 700, y0: 1995, x1: 890, y1: 2260 },
  apron7: { x0: 700, y0: 2260, x1: 890, y1: 2425 },

  // the road in: from the E4 round the south end of the runway to the terminal (the clearing's line too)
  // (under the taxiway bridge at [915, 214]); once the baggage hall stands in front of the first terminal's door the road
  // stops at the hall's east face (`roadEnd`, its x)
  road: [[-1880, -700], [-900, -760], [200, -620], [700, -200], [1000, 400], [1030, 900], [990, 1240], [930, 1240]],
  roadEnd: 958,
  // the landside road on from the road in, north along the terminals' kerb to the international terminal and Pier F
  // (from the international terminal's year): west of it the terminals, east of it the car parks, Sky City and the hotel
  landside: [[990, 1240], [1006, 1290], [1006, 1660]],
  // the E4 motorway, west of the airport, north–south, on past the map's edge at both ends (south to Stockholm, north to
  // Uppsala) so that it runs out of sight instead of stopping in the forest
  e4: [[-1100, -32000], [-1560, -6500], [-1700, -3600], [-1820, -1500], [-1880, -700], [-1860, 800], [-1950, 2600], [-2100, 5200],
    [-2350, 9000], [-3200, 36000]],
  // the junction where the road in meets the E4 (`at`, a point of both lines): the E4 goes over the road on a bridge
  // (render/ground.js: a deck `h` m up over the road, `deck` m to each side of the road's line, on embankments `ramp` m
  // long), the road goes on under it west to Märsta (`west`), four slip roads join the two (`ramps`, a diamond), the
  // grass inside them (`verge`); drawn once the road in is finished
  e4Exit: { at: [-1880, -700], h: 8, deck: 17, ramp: 140,
    west: [[-1880, -700], [-2200, -720], [-2640, -1300]],
    ramps: [[[-1790, -706], [-1824, -664], [-1850, -560], [-1861, -420]], [[-1790, -706], [-1822, -750], [-1838, -850], [-1844, -980]],
      [[-1970, -706], [-1936, -664], [-1906, -560], [-1891, -420]], [[-1970, -706], [-1938, -750], [-1912, -850], [-1874, -980]]],
    verge: [[-1835, -1000], [-1772, -706], [-1846, -395], [-1906, -395], [-1988, -706], [-1885, -1000]] },
  // the airside fence (render/fence.js works it out from what is built): it never crosses the landside belt east of the
  // terminal line (`belt`: the road in from Cargo City north, the kerb, the car parks, Sky City, the offices, the
  // railway's south leg), a road, the railway, a car park or Cargo City's yard — except over the two taxiway bridges;
  // the walls of the buildings on the terminal line (`line`) are the fence where they stand, their landside faces outside
  fence: {
    belt: [[943, 285], [1000, 400], [1030, 900], [990, 1240], [1006, 1290], [1006, 1700], [1330, 1700], [1330, 285]],
    line: ['terminal1', 'bagHall', 'computerRoom', 'generator', 'sorterHall', 'intlTerminal', 'domTerminal', 'terminal2',
      'cargoCity']
  },
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
  // terminal plot (after the bog is drained), the road; and the service ground west of the aprons, from the strip's
  // clearing to the apron (render/map.js clearings): round the ploughs' rows and the tenders' bays once the airport has
  // a plough or a fire station (`ploughs`), round the fire station and the fuel yard once the yard is in use (`yard`)
  clear: {
    strip: { half: 280 },
    apron: [[560, 1040], [1000, 1040], [1000, 1470], [560, 1470]],
    ploughs: [490, 1392, 640, 1468],
    yard: [490, 1452, 640, 1545]
  },

  check: 'the first apron, stands, terminal, tower, taxiways and road of 1959–62 (aerodrome chart of the era); Halmsjön'
};
