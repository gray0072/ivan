'use strict';

// Arlanda Rising — the history the analytics tabs of Finance draw (ui/analytics.js): the five meters, the green rating,
// the staff's jobs and absence, and the departures, on-time departures, noise and close calls of each stretch of time.
// A point is taken every STATS_OPS_MIN game minutes of an ops stage (and at its start), every day of a plan stage, and at
// every month's close — also in the time skipped between missions. It only reads the game: nothing in sim/ reads
// S.stats, so the history changes no number of the game (tools/missions-check.js prints the same with it or without it).
// Kept small in the save: rows of whole numbers, the last STATS_RECENT_MAX points (`recent`) and STATS_MONTHS_MAX months
// (`months`); the replays' snapshots leave it out (progress.js). Used by sim/ops.js, sim/plan.js and sim/finance.js.
//
// A row: [day, minute of the day (−1: a day or a month), airlines, passengers, neighbours, staff, safety, green (−1: not
// counted yet), jobs, away (‰ of the staff away today), departures, on time (−1: no flights flown one by one), noise
// (units × 10), close calls, passengers (a day; −1 in an ops stage)]. In an ops stage the departures, on-time departures,
// noise and close calls are those since the point before; on a plan day the airport's flights and passengers that day;
// at a month's close the average day of the last days.

const STAT = { day: 0, min: 1, airlines: 2, passengers: 3, neighbours: 4, staff: 5, safety: 6, green: 7, jobs: 8, away: 9, dep: 10, onTime: 11, noise: 12, cc: 13, pax: 14 };

const Stats = {
  data() {
    if (!S.stats) S.stats = { recent: [], months: [], c: null };
    return S.stats;
  },
  // the jobs of every team and the share away today, weighted by the jobs (‰)
  people() {
    let jobs = 0, away = 0;
    if (S.people) {
      for (const id of Object.keys(S.people.depts)) {
        const n = People.jobs(id);
        if (!n) continue;
        jobs += n;
        if ((DEPTS[id] || {}).police) continue;
        const a = S.ops && S.ops.absence && S.ops.absence[id] !== undefined ? S.ops.absence[id] : People.absence(id);
        away += a * n;
      }
    }
    return [jobs, jobs ? Math.round(away / jobs * 1000) : 0];
  },
  row(min, dep, onTime, noise, cc, pax) {
    const m = S.meters, p = this.people();
    return [S.day, min, Math.round(m.airlines), Math.round(m.passengers), Math.round(m.neighbours), Math.round(m.staff), Math.round(m.safety),
      Green.on() ? Green.rating() : -1, p[0], p[1], dep, onTime, noise, cc, pax];
  },
  push(list, row, max) { list.push(row); if (list.length > max) list.splice(0, list.length - max); },
  // an ops stage: at its start (`start`) and every STATS_OPS_MIN game minutes, with what happened since the last point
  ops(start) {
    const d = this.data(), st = S.mission && S.mission.st;
    if (!st) return;
    const key = S.mission.id + '/' + S.mission.stage + '/' + S.day;
    if (start || !d.c || d.c.key !== key) d.c = { key, dep: 0, onTime: 0, noise: 0, cc: 0 };
    const c = d.c;
    this.push(d.recent, this.row(Math.round(S.clock), st.dep - c.dep, st.onTime - c.onTime, Math.round((st.noise - c.noise) * 10), st.closeCalls - c.cc, -1), STATS_RECENT_MAX);
    c.dep = st.dep; c.onTime = st.onTime; c.noise = st.noise; c.cc = st.closeCalls;
  },
  // after an ops step: a point when the clock has passed the next STATS_OPS_MIN
  opsStep(dt) {
    if (Math.floor(S.clock / STATS_OPS_MIN) !== Math.floor((S.clock - dt) / STATS_OPS_MIN)) this.ops(false);
  },
  // a day of a plan stage: the airport's flights and passengers that day
  day() {
    const t = S.traffic && S.traffic[S.traffic.length - 1];
    this.push(this.data().recent, this.row(-1, t ? Math.round(t.flights) : 0, -1, 0, 0, t ? t.pax : 0), STATS_RECENT_MAX);
  },
  // a month closed: the average day of the last days' traffic
  month() {
    const t = S.traffic || [];
    const avg = (k) => (t.length ? Math.round(t.reduce((s, x) => s + x[k], 0) / t.length) : 0);
    this.push(this.data().months, this.row(-1, avg('flights'), -1, 0, 0, avg('pax')), STATS_MONTHS_MAX);
  }
};
