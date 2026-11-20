'use strict';

// Arlanda Rising — the airport itself: what is built (S.airport.items), the runways and the stands, what
// finishing a master-plan project does (`complete`), the small builds bought during a mission (`buy`), and
// the numbers the rest of the sim asks for — runway separation, fuel trucks, ploughs, the shops' and car
// parks' shares, the monthly running cost of everything the airport owns.

const Airport = {
  count(kind) { return S.airport.items.filter((i) => i.kind === kind).length; },
  has(kind) { return this.count(kind) > 0; },
  addItem(kind, extra) {
    const it = Object.assign({ id: nextId(), kind, price: (BUILDINGS[kind] || {}).price || 0 }, extra || {});
    S.airport.items.push(it);
    return it;
  },
  runway(id) { return S.airport.runways.find((r) => r.id === id) || null; },
  stand(id) { return S.airport.stands.find((s) => s.id === id) || null; },
  // minutes between two movements on a runway
  sep() { return this.has('tower') ? RWY_SEP : RWY_SEP_NO_TOWER; },
  fuelTrucks() { return this.count('fuelTruck'); },
  ploughs() { return this.count('plough'); },
  shopShare() {
    let s = 0;
    for (const it of S.airport.items) s += (BUILDINGS[it.kind] || {}).shop || 0;
    return Math.min(SHOP_MAX, s);
  },
  parkingShare() {
    let s = 0;
    for (const it of S.airport.items) s += (BUILDINGS[it.kind] || {}).parking || 0;
    // the airport coaches take some of the drivers
    return Math.min(1, s) * (this.has('busStop') ? 1 - BUS_PARKING : 1);
  },
  // the fire service's category: the first fire station's, and one more for each crash tender bought
  fireCat() { return this.has('fireStation') ? Math.min(FIRE_CAT_MAX, FIRE_CAT_BASE + this.count('crashTender')) : 0; },
  addStand(def) {
    const st = { id: 's' + nextId(), name: def.name, code: def.code, contact: !!def.contact, dist: def.dist, occ: null, res: null };
    if (def.at) st.at = def.at.slice();
    S.airport.stands.push(st);
    return st;
  },

  // what finishing a project, or an optional stage with its own effect, does to the airport
  complete(effect, project, price) {
    const a = S.airport, p = PROJECTS[project] || {};
    switch (effect) {
      case 'site': a.siteReady = true; break;
      case 'runway1':
        a.runways.push({ id: 'r1', name: '01/19', dirs: ['01', '19'], hdg: [10, 190], len: p.len || 3300,
          lit: false, approach: false, snow: 0, plough: null, busyUntil: 0 });
        this.addItem('runway', { price });
        this.addItem('fireStation');
        break;
      case 'apron1':
        for (const s of p.stands) this.addStand(s);
        this.addItem('apron', { price });
        break;
      case 'tower1': this.addItem('tower', { price }); break;
      case 'terminal1': this.addItem('terminal', { price }); a.desks += p.desks || 4; break;
      case 'kiosk': this.addItem('kiosk'); break;
      case 'lights1': for (const r of a.runways) r.lit = true; this.addItem('lights', { price }); break;
      case 'approachLights': for (const r of a.runways) r.approach = true; break;
      case 'apron2': for (const s of p.stands) this.addStand(s); this.addItem('apron2', { price }); break;
      case 'bigStand': this.addStand(p.bigStand); break;
      case 'ils': if (a.runways[0]) a.runways[0].ils = true; this.addItem('ils', { price }); break;
      case 'runway2':
        a.runways.push({ id: 'r2', name: '08/26', dirs: ['08', '26'], hdg: [76, 256], len: p.len || 2500,
          lit: Construction.stageDone('runway2', 'lights'), approach: false, snow: 0, plough: null, busyUntil: 0 });
        this.addItem('runway2', { price });
        break;
      case 'bagHall': this.addItem('bagHall', { price }); break;
      case 'intlTerminal': this.addItem('intlTerminal', { price }); a.desks += p.desks || 12; break;
      case 'restaurant': this.addItem('restaurant'); break;
      case 'domTerminal': for (const s of p.stands) this.addStand(s); this.addItem('domTerminal', { price }); a.desks += p.desks || 8; break;
      case 'computerRoom': this.addItem('computerRoom', { price }); break;
      case 'backupPower': this.addItem('generator'); break;
      // session 4
      case 'terminal2': for (const s of p.stands) this.addStand(s); this.addItem('terminal2', { price }); a.desks += p.desks || 10; Terminal.ensure(); break;
      case 'units': if (!a.units) a.units = []; Terminal.ensure(); break;
      case 'arlandaExpress':
        a.train = a.trainDeal || 'concession';
        a.trainFrom = Calendar.parse(TRAIN_FIRST_DAY);
        a.neighboursBase = (a.neighboursBase || 72) + TRAIN_NEIGHBOURS;
        this.addItem('railStation', { price });
        break;
      case 'sorterHall': this.addItem('sorterHall', { price }); break;
      default: throw new Error('unknown effect ' + effect);
    }
    logEvent('built', { what: effect, project });
  },

  // a small build from the toolbar: paid now; in ops time there at once, in plan time after its days
  buy(kind) {
    const b = BUILDINGS[kind];
    if (!b || !b.small) return false;
    if (b.from && Calendar.year() < b.from) return false;
    Finance.book('build', -b.price);
    if (S.plan && b.days > 0) S.plan.buys.push({ kind, done: S.day + b.days });
    else this.finishBuy(kind);
    return true;
  },
  finishBuy(kind) {
    if (kind === 'stand') this.addStand({ name: String(S.airport.stands.length + 1), code: 'C', contact: false, dist: 4 });
    else if (kind === 'desk') S.airport.desks++;
    else if (kind === 'lane') Terminal.addLane();
    this.addItem(kind);
    logEvent('bought', { kind });
  },

  // SEK a month for everything the airport owns: wages of the jobs, upkeep of the buildings, the domains' staff
  monthlyCost() {
    let jobs = 0, upkeep = 0;
    for (const it of S.airport.items) {
      jobs += (BUILDINGS[it.kind] || {}).staff || 0;
      upkeep += (it.price || 0) * UPKEEP_YEAR / 12;
    }
    // the teams (sim/people.js: their wage levels, IT, the managers, the temps) and the systems' licences
    return { wages: jobs * STAFF_MONTH + People.wages(), upkeep, systems: Systems.monthly(), interest: S.loans * LOAN_RATE / 12,
      security: Terminal.lanes() * LANE_MONTH };
  }
};
