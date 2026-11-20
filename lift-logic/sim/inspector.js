'use strict';

// Lift Logic — the Inspector: after a run it reads the run's log and picks up to three notes about concrete
// moments ("Mia waited 74 s on floor 4 — your lift passed floor 4 three times without stopping"), each with
// the time to replay to ("Show me"), an idea (Medium) and the block that would help (Easy). Returns text
// keys with params; ui/results.js translates them. Used by ui/results.js and tools/missions-check.js.

const Inspector = {
  notes(r) {
    r = r || run;
    const out = [];
    const end = r.tEnd !== null && r.tEnd !== undefined ? r.tEnd : r.t;
    const passes = r.log.filter((e) => e.type === 'pass');
    const person = (id) => r.people.find((p) => p.id === id);

    // a block that went wrong
    const errs = Object.keys(r.errors || {}).map((id) => Object.assign({ id }, r.errors[id])).filter((e) => !e.flash);
    if (errs.length) {
      const e = errs.sort((a, b) => a.t - b.t)[0];
      out.push({ key: 'A block went wrong: {msg}', params: { msg: e.msg, msgParams: e.params }, t: e.t, blockId: e.id, w: 100,
        tip: 'The block with the red outline says what went wrong.' });
    }
    // still inside when the day ended
    const riding = r.people.filter((p) => p.state === 'riding');
    if (riding.length) {
      const p = riding[0];
      out.push({ key: '{name} is still inside the lift, going to floor {f}.', params: { name: p.name, f: p.to }, t: p.tBoard, floor: p.to, w: 95,
        tip: 'The lift has to stop at every floor that was pressed inside.', block: r.mission.chapter >= 3 ? 'onButton' : 'buttonIn' });
    }
    // someone gave up
    const gave = r.people.filter((p) => p.state === 'gaveup' || p.furious);
    if (gave.length) {
      const p = gave[0];
      const n = passes.filter((e) => e.floor === p.from && e.t >= p.t0 && e.t <= p.tOff).length;
      out.push({ key: n ? '{name} gave up on floor {f} after {s} s — your lift passed floor {f} {n} times without stopping.' : '{name} gave up on floor {f} after {s} s.',
        params: { name: p.name, f: p.from, s: Math.round((p.tOff || end) - p.t0), n }, t: p.t0 + Math.min(p.patience, (p.tOff || end) - p.t0), floor: p.from, w: 90,
        tip: 'Did your lift ever check floor {f}?', block: r.mission.chapter >= 3 ? 'onPass' : 'callOn' });
    }
    // still waiting at the end
    const waiting = r.people.filter((p) => p.state === 'waiting' && !p.furious);
    if (waiting.length && r.endReason === 'time') {
      out.push({ key: '{n} people were still waiting when the day ended.', params: { n: waiting.length }, t: end - 5, floor: waiting[0].from, w: 85,
        tip: 'Every floor with a lit call button needs a visit.', block: r.mission.chapter >= 3 ? 'onCall' : 'callOn' });
    }
    // the longest wait
    const boarded = r.people.filter((p) => p.tBoard !== null);
    if (boarded.length) {
      const p = boarded.reduce((a, b) => (b.tBoard - b.t0 > a.tBoard - a.t0 ? b : a));
      const w = p.tBoard - p.t0;
      const avg = boarded.reduce((s, q) => s + q.tBoard - q.t0, 0) / boarded.length;
      if (w > 25 && w > avg * 1.6) {
        const n = passes.filter((e) => e.floor === p.from && e.t >= p.t0 && e.t <= p.tBoard).length;
        out.push({ key: n ? '{name} waited {s} s on floor {f} — your lift passed floor {f} {n} times without stopping.' : '{name} waited {s} s on floor {f}.',
          params: { name: p.name, f: p.from, s: Math.round(w), n }, t: p.t0 + w * 0.6, floor: p.from, w: 70 + Math.min(20, w / 10),
          tip: n ? 'Your lift can stop where it passes, if someone is waiting there.' : 'Was the lift somewhere far away? Maybe it could wait nearer to where people come.',
          block: n ? (r.mission.chapter >= 3 ? 'onPass' : 'callOn') : (r.mission.chapter >= 3 ? 'onIdle' : 'waitUntil') });
      }
    }
    // a loop that never waits
    const busy = Object.keys(r.busyLoops || {});
    if (busy.length) {
      out.push({ key: 'A loop runs again and again without waiting for anything.', params: {}, t: 10, blockId: busy[0], w: 50,
        tip: 'A "wait until" in the loop lets the lift rest until something happens.', block: 'waitUntil' });
    }
    // empty trips
    const empty = r.log.filter((e) => e.type === 'emptyTrip');
    if (empty.length >= 3) {
      out.push({ key: 'Your lift made {n} empty trips.', params: { n: empty.length }, t: empty[0].t - 6, floor: empty[0].to, w: 60,
        tip: 'Move only where a button is lit.', block: r.mission.chapter >= 3 ? 'onCall' : 'if' });
    }
    // the full lift stopped for nothing
    if (r.counters.fullStops >= 1) {
      const e = r.log.find((x) => x.type === 'refused');
      out.push({ key: 'The full lift stopped {n} times for people it could not take.', params: { n: r.counters.fullStops }, t: e ? e.t - 3 : 0, floor: e ? e.floor : null, w: 55,
        tip: 'A full lift can skip the calls and come back later.', block: 'full' });
    }
    // the wrong way first
    if (r.counters.wrongWay >= 2) {
      out.push({ key: '{n} people rode the wrong way first.', params: { n: r.counters.wrongWay }, t: 0, w: 40,
        tip: 'The arrow tells people which way the lift will go next.', block: r.mission.chapter >= 4 ? 'setArrow' : 'myDir' });
    }
    // a variable set but never read
    for (const name of Object.keys(r.varsSet || {})) {
      if (!r.varsRead[name] && !(r.monitors || {})[name]) {
        out.push({ key: 'The variable "{v}" is set but never used.', params: { v: name }, t: 0, w: 20, tip: 'A variable is useful when another block reads it.', block: 'var' });
        break;
      }
    }
    // a person who comes up for a joke later
    if (!out.length) {
      out.push({ key: 'Nothing to complain about. The lift ran like clockwork!', params: {}, t: null, w: 0 });
    }
    out.sort((a, b) => b.w - a.w);
    return out.slice(0, 3);
  }
};
