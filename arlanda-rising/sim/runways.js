'use strict';

// Arlanda Rising — the runways and the paved surfaces in an ops stage: the direction in use (into the wind,
// or the player's choice when it is calm), whether a runway takes movements now (snow, a plough convoy on
// it, the dark without lights, fog, Safety under its floor), the separation between movements, the noise
// each movement makes over the towns, snow building up on the surfaces and the plough convoys clearing it.
// Used by sim/flights.js, sim/tasks.js and the screens (braking action, why a runway is closed).

const Runways = {
  main() { return S.airport.runways[0] || null; },
  // the runway the tower uses now: runway 1 unless it cannot take movements (a crosswind, snow, a convoy…) and
  // another one can; with none open, runway 1 (closed)
  inUse() {
    const list = S.airport.runways;
    for (const rw of list) if (!this.closedWhy(rw)) return rw;
    return list[0] || null;
  },
  // session 5: with runway 3 the two parallel runways work independently — the arrivals on runway 1, the departures on
  // runway 3, each taking the other's traffic when its own cannot (without runway 3 both are `inUse`)
  pick(order) {
    for (const id of order) { const rw = Airport.runway(id); if (rw && !this.closedWhy(rw)) return rw; }
    return this.inUse();
  },
  forArr() { return Airport.runway('r3') ? this.pick(['r1', 'r3', 'r2']) : this.inUse(); },
  forDep() { return Airport.runway('r3') ? this.pick(['r3', 'r1', 'r2']) : this.inUse(); },
  // the wind across a runway, kt
  crosswind(rw) {
    const w = Weather.now();
    return Math.abs(w.wind * Math.sin((w.windDir - rw.hdg[0]) * Math.PI / 180));
  },
  // a surface by id: a runway's id or 'apron'
  surface(id) { return id === 'apron' ? S.airport.apron : Airport.runway(id); },
  surfaces() { return S.airport.runways.map((r) => r.id).concat(S.airport.stands.length ? ['apron'] : []); },
  // braking action from the snow on a runway
  braking(rw) { return rw.snow >= SNOW_POOR_MM ? 'poor' : rw.snow >= 1 ? 'medium' : 'good'; },
  // why a runway takes no movement now, or null when it does
  closedWhy(rw) {
    if (!rw) return 'none';
    if (rw.plough) return 'plough';
    if (rw.snow >= SNOW_CLOSE_MM) return 'snow';
    if (S.meters.safety < SAFETY_MIN) return 'safety';
    // closed for a while: after an emergency, or (session 5) a storm, a moose, the ash cloud
    if (rw.closedUntil && rw.closedUntil > S.clock) return rw.closedFor || 'emergency';
    const w = Weather.now();
    if (w.dark && !rw.lit) return 'dark';
    if (w.vis < (rw.ils ? FOG_VIS_ILS : rw.approach ? FOG_VIS_APPROACH : FOG_VIS_MIN)) return 'fog';
    if (this.crosswind(rw) > CROSSWIND_MAX) return 'wind';
    return null;
  },
  // the direction in use: into the wind, or the player's choice when it is calm
  direction(rw) {
    const w = Weather.now();
    if (w.wind < CALM_WIND) { const d = rw.dirs.find((x) => x.slice(0, 2) === S.airport.prefDir); return d || rw.dirs[1]; }
    const off = (h) => Math.abs(((w.windDir - h) % 360 + 540) % 360 - 180);
    return off(rw.hdg[0]) <= off(rw.hdg[1]) ? rw.dirs[0] : rw.dirs[1];
  },
  // a movement on the runway: it is busy for the separation, the towns hear it
  use(rw, f, landing) {
    // low visibility with an instrument landing system: longer separation
    const lvp = rw.ils && Weather.now().vis < FOG_VIS_APPROACH ? LVP_SEP_X : 1;
    rw.busyUntil = S.clock + Airport.sep() * lvp;
    const dir = this.direction(rw);
    S.ops.dir = dir;
    // runway 1: landing on 01 comes in from the south over Märsta, taking off on 19 climbs out over it;
    // runway 2 lies in the forest north-east of the terminals; runway 3 (session 5) the same toward Upplands Väsby
    const overTown = (rw.id === 'r1' && (landing ? dir === '01' : dir === '19')) || (rw.id === 'r3' && (landing ? dir === '01R' : dir === '19L'));
    let n = overTown ? (landing ? NOISE_ARR_TOWN : NOISE_DEP_TOWN) : NOISE_FOREST;
    if (AIRCRAFT[f.type].engines === 'jet') n *= 1.5;
    const night = Calendar.night(S.clock);
    if (night) { n *= NOISE_NIGHT_X; S.mission.st.nightMoves++; }
    S.mission.st.noise += n;
    Meters.noise(n);
    if (landing && this.braking(rw) === 'poor' && rand() < CLOSE_CALL_POOR) Meters.closeCall();
    logEvent(landing ? 'landed' : 'departed', { flight: f.no, rw: rw.name, dir });
  },
  canUse(rw) { return rw && !this.closedWhy(rw) && rw.busyUntil <= S.clock; },

  // every ops step: snow falls, convoys finish, snow tasks appear, closed minutes are counted
  step(dt) {
    const w = Weather.now();
    for (const id of this.surfaces()) {
      const s = this.surface(id);
      if (w.snow > 0) s.snow += w.snow * dt / 60;
      if (s.plough && S.clock >= s.plough) {
        s.plough = null;
        s.snow = PLOUGH_LEFT_MM;
        logEvent('ploughed', { surface: id });
      }
      const queued = S.ops.ploughQueue.indexOf(id) >= 0;
      // a snow chief who "smells snow" sends the ploughs out at a thinner layer
      const at = SNOW_TASK_MM - (S.domains.snow >= 1 ? People.perk('snow', 'warn') : 0);
      if (s.snow >= at && !s.plough && !queued && !Tasks.pending('plough', id)) Tasks.need('plough', id);
    }
    // the next convoy in the queue sets off when the last one is back
    if (S.ops.ploughQueue.length && !(S.ops.convoy > S.clock) && Airport.ploughs() > 0) this.startConvoy(S.ops.ploughQueue.shift());
    const rw = this.inUse();
    if (rw && this.closedWhy(rw)) S.mission.st.closedMin += dt;
  },
  // send the ploughs to a surface: the convoy to a runway (queued when it is out on another one), the apron's
  // own small team to the apron (it works beside the convoy)
  plough(id) {
    const s = this.surface(id);
    if (!s || s.plough || S.ops.ploughQueue.indexOf(id) >= 0) return false;
    if (Airport.ploughs() === 0) return false;
    if (id !== 'apron' && S.ops.convoy > S.clock) S.ops.ploughQueue.push(id);
    else this.startConvoy(id);
    return true;
  },
  startConvoy(id) {
    const s = this.surface(id);
    const kind = id === 'apron' ? 'apron' : 'runway';
    let dur = PLOUGH_MIN[kind] * (kind === 'apron' ? 1 : Math.max(1, PLOUGH_CONVOY / Airport.ploughs()));
    if (S.domains.snow >= 1) dur *= 1 - People.perk('snow', 'convoy');
    s.plough = S.clock + dur;
    s.ploughFrom = S.clock;           // for the map: where the convoy is
    if (kind === 'runway') S.ops.convoy = s.plough;
    S.mission.st.ploughRuns++;
    Finance.book('snow', -PLOUGH_RUN_COST * (S.domains.snow >= 1 && People.perk('snow', 'stormBills') ? 2 : 1));
    logEvent('convoy', { surface: id, until: s.plough });
  }
};
