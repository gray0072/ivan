'use strict';

// Arlanda Rising — the money: every income and cost booked by its line (the month's profit and loss in
// Finance), the running costs of what the airport owns prorated to the minute or the day, the month's
// close (the books kept for the charts, the months in debt counted), loans and their interest. Every sum
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
  },
  borrow(amount) {
    const room = Math.max(0, (S.loanLimit || 0) - S.loans);
    amount = Math.min(amount, room);
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

  // what one departure pays the airport in fees: landing (per tonne) and per passenger, × the fee level
  departureFees(type, pax, intl) {
    const a = AIRCRAFT[type], k = FEE_LEVELS[S.airport.fees] || 1;
    return { landing: a.mtow * LANDING_FEE_PER_T * k, pax: pax * (intl ? PAX_FEE : PAX_FEE_DOMESTIC) * k };
  }
};
