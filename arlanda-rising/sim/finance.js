'use strict';

// Arlanda Rising — the money: every income and cost booked by its line (the month's profit and loss in
// Finance), the running costs of what the airport owns prorated to the minute or the day, the month's
// close (the books kept for the charts, the months in debt counted), loans (the owner's limit, borrowing and
// repaying) and their interest. Every sum
// is SEK. Used by every sim/ file that earns or spends.

const Finance = {
  // + income, − cost, under a line of the books ('fees', 'shops', 'wages', 'construction', …)
  book(line, amount) {
    if (!amount) return;
    S.money += amount;
    const c = S.finance.cur;
    if (amount > 0) c.in[line] = (c.in[line] || 0) + amount;
    else c.out[line] = (c.out[line] || 0) - amount;
    const st = S.mission && S.mission.st;
    if (st) { if (amount > 0) st.income += amount; else st.cost -= amount; }
  },
  // the running costs of `minutes` of game time
  running(minutes) {
    const m = Airport.monthlyCost(), k = minutes / (30 * 1440);
    this.book('wages', -m.wages * k);
    this.book('upkeep', -m.upkeep * k);
    this.book('systems', -m.systems * k);
    this.book('interest', -m.interest * k);
    // session 4: the security lanes' screeners, the brands' rent
    if (m.security) this.book('security', -m.security * k);
    if (S.airport.units) this.book('rent', Terminal.rent() * k);
    // session 5: the rents of the airport's real estate, the space of the passport booths; from chapter 6 the energy
    // and the biofuel
    const estate = Airport.rent();
    if (estate) this.book('estate', estate * k);
    if (m.border) this.book('border', -m.border * k);
    if (Green.on()) { this.book('energy', -Green.energyMonth() * k); if (S.airport.biofuel) this.book('biofuel', -Green.biofuelMonth() * k); }
  },
  // at a new month: the month's books kept, the months in debt counted, the airlines' feelings about the fees
  checkMonth() {
    const key = Calendar.monthKey(S.day), f = S.finance;
    if (f.month === null) { f.month = key; return; }
    if (key === f.month) return;
    f.history.push({ month: f.month, in: f.cur.in, out: f.cur.out, money: Math.round(S.money) });
    if (f.history.length > 120) f.history.shift();
    f.cur = { in: {}, out: {} };
    f.month = key;
    S.debtMonths = S.money < 0 ? S.debtMonths + 1 : 0;
    Meters.feesMonth();
    People.month();
    Systems.month();
    Airlines.month();
    Green.month();
    // the month's point of the analytics' history (sim/stats.js: read by nothing in the sim)
    Stats.month();
  },
  // the most the airport may owe: always LOAN_VALUE_SHARE of what it owns (at least LOAN_MIN, × the difficulty's money),
  // so it grows with the airport — or the limit a mission set at its start (S.loanLimit: its setup's room on top of what
  // was owed then) when bigger
  limit() {
    let worth = 0;
    for (const it of S.airport.items) worth += it.price || 0;
    return Math.max(S.loanLimit || 0, Math.max(LOAN_MIN, worth * LOAN_VALUE_SHARE) * diff().money);
  },
  room() { return Math.max(0, this.limit() - S.loans); },
  // one press of Borrow or Repay: about a LOAN_STEPS-th of the limit, rounded to 1, 2 or 5 of its power of ten, at least LOAN_STEP
  step() {
    const x = this.limit() / LOAN_STEPS, p = Math.pow(10, Math.floor(Math.log10(Math.max(1, x))));
    return Math.max(LOAN_STEP, [5, 2, 1].map((k) => k * p).find((v) => v <= x) || p);
  },
  // why Borrow or Repay cannot be pressed now: 'limit', 'debt' (none), 'cash' (none to repay with), or '' when it can
  cannot(what) {
    if (what === 'borrow') return this.room() > 0 ? '' : 'limit';
    return S.loans <= 0 ? 'debt' : S.money <= 0 ? 'cash' : '';
  },
  borrow(amount) {
    amount = Math.min(amount, this.room());
    if (amount <= 0) return 0;
    S.loans += amount;
    this.book('loans', amount);
    return amount;
  },
  repay(amount) {
    amount = Math.min(amount, S.loans, Math.max(0, S.money));
    if (amount <= 0) return 0;
    S.loans -= amount;
    this.book('loans', -amount);
    return amount;
  },
  // the owner replaces the director after too many months below zero
  replaced() { return S.debtMonths >= DEBT_MONTHS[S.difficulty]; },

  // what one departure pays the airport in fees: landing (per tonne) and per passenger, × the fee level (and less
  // while its airline's route incentive runs)
  departureFees(type, pax, intl, code) {
    const a = AIRCRAFT[type], k = (FEE_LEVELS[S.airport.fees] || 1) * Airlines.feeK(code);
    return { landing: a.mtow * LANDING_FEE_PER_T * k, pax: pax * (intl ? PAX_FEE : PAX_FEE_DOMESTIC) * k };
  }
};
