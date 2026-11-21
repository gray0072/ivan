'use strict';

// Arlanda Rising — the green rating and the environmental permit (session 5, chapter 6; SPEC.md "The five meters").
// Once a mission turns them on (setup `green`), the airport pays for its energy every month (heating in winter; the
// aquifer and the solar park take a share off), may buy biofuel for a share of the fuel (S.airport.biofuel, paid every
// month), and has a green rating 0–100 from what it does: the train and the coaches, the aquifer, the solar park,
// glycol recovery, biofuel, electric apron vehicles — less for each big car park. The permit (setup `permit`:
// { perDay, green, from }) caps the departures a day and asks for a green rating at least, from its day on: each month it is broken costs
// PERMIT_FINE and the neighbours' patience. Used by sim/finance.js (the month's costs and the check), sim/goals.js and
// the screens.

const Green = {
  on() { return !!S.airport.green; },
  rating() {
    let r = GREEN_BASE;
    if (Terminal.trainRuns()) r += GREEN_PTS.train;
    if (Airport.has('busStop')) r += GREEN_PTS.bus;
    if (Airport.has('aquifer')) r += GREEN_PTS.aquifer;
    r += Math.min(2, Airport.count('solar')) * GREEN_PTS.solar;
    if ((S.domains.deice || 0) >= 3) r += GREEN_PTS.glycol;
    r += (S.airport.biofuel || 0) * 100 * GREEN_PTS.biofuel;
    if (Airport.has('evehicles')) r += GREEN_PTS.electric;
    r += Airport.count('parkingBig') * GREEN_PTS.carPark;
    // session 6: charging stands for electric aircraft, the night train, the hydrogen depot, the green pier
    r += Math.min(6, Airport.chargers()) * GREEN_PTS_6.charger;
    if (Airport.has('nightTrain')) r += GREEN_PTS_6.nightTrain;
    if (Airport.has('h2depot')) r += GREEN_PTS_6.h2;
    if (Airport.has('greenPier')) r += GREEN_PTS_6.greenPier;
    return clamp(Math.round(r), 0, 100);
  },
  // SEK a month of heating and power: more in winter, less with the aquifer and the solar park
  energyMonth() {
    const winter = Calendar.winter(S.day) || Calendar.month() === 3 || Calendar.month() === 11;
    let save = 0;
    if (Airport.has('aquifer')) save += ENERGY_SAVE.aquifer;
    save += Math.min(2, Airport.count('solar')) * ENERGY_SAVE.solar;
    // session 6: each terminal mothballed is cold and dark
    save += Terminal.mothballCount() * MOTHBALL_ENERGY;
    return ENERGY_MONTH * (winter ? 1.5 : 1) * (1 - save);
  },
  biofuelMonth() { return BIOFUEL_MONTH * (S.airport.biofuel || 0); },
  // a share of the airlines' fuel made bio, paid by the airport (0 stops it)
  biofuel(share) {
    if (!this.on()) return false;
    S.airport.biofuel = clamp(share, 0, 0.5);
    logEvent('biofuel', { share: S.airport.biofuel });
    return true;
  },
  // departures a day: the last days in summary, or the routes' plan
  perDay() {
    const t = S.traffic || [];
    if (t.length) return t.reduce((s, d) => s + d.flights, 0) / t.length;
    let n = 0;
    for (const code of Object.keys(S.airlines)) n += Airlines.perDay(code);
    return n;
  },
  // what the permit says now: null when there is none, else { moves, green, broken }
  permit() {
    const p = S.airport.permit;
    if (!p || (p.from && S.day < Calendar.parse(p.from))) return null;
    const moves = p.perDay ? this.perDay() > p.perDay : false, green = p.green ? this.rating() < p.green : false;
    return { moves, green, broken: moves || green };
  },
  // once a month: the permit checked; a month broken costs the fine and the neighbours' patience
  month() {
    const p = this.permit();
    if (!p || !p.broken) return;
    Finance.book('permit', -PERMIT_FINE);
    S.meters.neighbours = clamp(S.meters.neighbours - PERMIT_NEIGHBOURS, 0, 100);
    if (S.mission && S.mission.st) S.mission.st.permitFines = (S.mission.st.permitFines || 0) + 1;
    logEvent('permitBroken', { moves: p.moves, green: p.green });
  }
};
