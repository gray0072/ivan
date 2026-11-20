'use strict';

// Arlanda Rising — the Challenge Days (session 4): the score of a day (data/challenges.js), which ones are open, and the
// best score and stars kept per challenge and difficulty (arlandaRising.challenges.v1: { best: { id: { difficulty:
// { score, stars } } } }, merged with the cloud's copy by keeping the larger). A challenge runs like a mission from its
// own definition (S.mission.def, so the autosave resumes it at any moment); its goal and stars are scores (the goal
// `score`). A cheated run saves nothing. Used by sim/goals.js, game.js and ui/challenges.js.

const Challenges = {
  // the points of a stage or the whole day
  score(st) {
    const P = CHALLENGE_POINTS;
    const v = st.onTime * P.onTime + (st.dep - st.onTime) * P.late + (S ? S.meters.passengers : 0) * P.paxMeter +
      (st.diverted + st.cancelled) * P.lost + st.closeCalls * P.closeCall + st.unannounced * P.unannounced + st.lostBags * P.lostBag +
      st.adelaySum * P.adelay + st.dep * this.wait(st) * P.wait;
    return Math.max(0, Math.round(v));
  },
  // the average wait at check-in and security
  wait(st) { return (st.paxServed ? st.paxWaitSum / st.paxServed : 0) + (st.secServed ? st.secWaitSum / st.secServed : 0); },
  // the score's parts, for the results
  parts(st) {
    const P = CHALLENGE_POINTS;
    return [
      ['On time', st.onTime, st.onTime * P.onTime],
      ['Late', st.dep - st.onTime, (st.dep - st.onTime) * P.late],
      ['Passengers', Math.round(S.meters.passengers), Math.round(S.meters.passengers * P.paxMeter)],
      ['Sent away or cancelled', st.diverted + st.cancelled, (st.diverted + st.cancelled) * P.lost],
      ['Close calls', st.closeCalls, st.closeCalls * P.closeCall],
      ['Delays not announced', st.unannounced, st.unannounced * P.unannounced],
      ['Bags lost', st.lostBags, st.lostBags * P.lostBag],
      ['Minutes of delay the airport caused', Math.round(st.adelaySum), Math.round(st.adelaySum * P.adelay)],
      ['Minutes of waiting in the queues', Math.round(st.dep * this.wait(st)), Math.round(st.dep * this.wait(st) * P.wait)]
    ].filter((x) => x[1]);
  },
  open(id) { const c = CHALLENGE[id]; return !!c && typeof Progress !== 'undefined' && Progress.best(c.opens) > 0; },
  any() { return CHALLENGES.some((c) => this.open(c.id)); },
  // the definition a run starts from (its own copy, kept in the state)
  def(id) { return JSON.parse(JSON.stringify(CHALLENGE[id])); }
};

// the best of each challenge per difficulty, kept in the browser
const ChallengeSave = {
  data: null,
  load() { this.data = Object.assign({ best: {} }, Store.json(KEYS.challenges, {})); },
  save() { this.data.savedAt = Date.now(); Store.setJson(KEYS.challenges, this.data); },
  best(id, d) { const b = (this.data.best[id] || {}); return d ? b[d] || null : Object.values(b).reduce((m, x) => (!m || x.stars > m.stars || (x.stars === m.stars && x.score > m.score) ? x : m), null); },
  // a run's result; true when it is a new best on its difficulty
  record(id, d, score, stars) {
    const b = this.data.best[id] = this.data.best[id] || {};
    const was = b[d];
    if (was && was.score >= score) return false;
    b[d] = { score, stars: Math.max(stars, was ? was.stars : 0) };
    this.save();
    return true;
  },
  // the cloud's copy folded in: the larger score and stars of each
  merge(a, b) {
    const out = Object.assign({}, a || {}, { best: {} });
    for (const src of [a, b]) {
      for (const id of Object.keys((src && src.best) || {})) {
        const o = out.best[id] = out.best[id] || {};
        for (const d of Object.keys(src.best[id])) {
          const x = src.best[id][d], y = o[d];
          o[d] = y ? { score: Math.max(x.score, y.score), stars: Math.max(x.stars, y.stars) } : Object.assign({}, x);
        }
      }
    }
    out.savedAt = Math.max((a && a.savedAt) || 0, (b && b.savedAt) || 0);
    return out;
  }
};
