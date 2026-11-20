'use strict';

// Lift Logic — the VM: runs the program, a copy per lift. Every step the events of the step are delivered
// (each starts a thread of its hat's script, with the hat's inputs), then every thread runs until it
// yields: at `wait`, `wait until` (false), `go to floor` (until it stopped there and the doors closed),
// `say … for`, `broadcast and wait`, and at the end of each turn of a loop. A thread that runs
// VM_STEPS_MAX blocks without yielding is paused until the next step. A mistake never stops the run: the
// block gets a red mark with the reason (run.errors) and the value used is 0 or nothing. Used by
// sim/run.js; the editor reads which blocks glow (VM.active) and the marks.

const VM = (() => {
  // events that reach every lift of the group; the others reach one lift
  const GROUP_EVENTS = { start: 1, onCall: 1, onEmergency: 1, onReceive: 1 };

  function init() {
    const p = run.program;
    run.queue = [];
    run.vars = {};
    run.lists = {};
    run.monitors = {};
    run.errors = {};
    run.slow = {};
    run.busyLoops = {};
    run.varsRead = {};
    run.varsSet = {};
    run.threadSeq = 0;
    run.hats = {};
    p.scripts.forEach((s, k) => {
      const hat = s.blocks[0];
      if (!hat || BLOCK[hat.op].shape !== 'hat') return;
      (run.hats[hat.op] = run.hats[hat.op] || []).push({ script: s, k });
    });
    for (const v of p.vars) if (v.all) run.vars[v.name] = 0;
    for (const l of p.lists) if (l.all) run.lists[l.name] = [];
    for (const L of run.lifts) {
      L.vars = {};
      L.lists = {};
      for (const v of p.vars) if (!v.all) L.vars[v.name] = 0;
      for (const l of p.lists) if (!l.all) L.lists[l.name] = [];
      L.threads = [];
      L.every = {};
    }
    event('start', null, {});
  }

  function event(type, L, params) {
    if (!run.queue) return;
    run.queue.push({ type, lift: L ? L.n : 0, params: params || {} });
  }

  function startThread(L, entry, params, ev) {
    const hat = entry.script.blocks[0];
    if (L.threads.length >= THREADS_MAX) { fail(null, hat, 'Too many scripts are running at once — some were dropped.'); return null; }
    const th = {
      id: ++run.threadSeq, lift: L, hat, params: params || {}, wait: null, done: false, cur: hat.id,
      frames: [{ list: entry.script.blocks, i: 1, loop: null }], turns: 0, bornAt: run.t
    };
    L.threads.push(th);
    if (ev && ev.started) ev.started.push(th);
    return th;
  }

  function deliver(ev) {
    const entries = run.hats[ev.type];
    if (ev.started) ev.delivered = true;
    if (!entries) return;
    const lifts = ev.lift ? [run.lifts[ev.lift - 1]] : run.lifts;
    for (const L of lifts) {
      if (!L.working) continue;
      for (const e of entries) {
        if (ev.type === 'onReceive' && msgName(e.script.blocks[0].args[0]) !== ev.params.msg) continue;
        startThread(L, e, ev.params, ev);
      }
    }
  }
  function msgName(v) { return String(v === null || v === undefined ? '' : v).trim(); }

  // `every … seconds` and `when clock is …`
  function timers() {
    const every = run.hats.onEvery || [], clocks = run.hats.onClock || [];
    for (const L of run.lifts) {
      if (!L.working) continue;
      for (const e of every) {
        let t = L.every[e.k];
        if (t === undefined) {
          const s = Math.max(0.5, toNum(evalValue(null, e.script.blocks[0].args[0])));
          t = L.every[e.k] = { period: s, next: s };
        }
        if (run.t + 1e-9 >= t.next) { t.next += t.period; startThread(L, e, {}); }
      }
    }
    if (clocks.length) {
      const now = Sensors.clock(), before = now - run.clockRate * SIM_DT;
      for (const e of clocks) {
        const m = String(e.script.blocks[0].args[0] || '').match(/^(\d{1,2}):(\d{2})$/);
        if (!m) { fail(null, e.script.blocks[0], 'Write the time like 17:00'); continue; }
        const at = (+m[1]) * 60 + (+m[2]);
        if (before < at && now >= at) for (const L of run.lifts) if (L.working) startThread(L, e, {});
      }
    }
  }

  function step() {
    timers();
    const q = run.queue;
    run.queue = [];
    for (const ev of q) deliver(ev);
    for (const L of run.lifts) {
      for (let i = 0; i < L.threads.length; i++) {
        const th = L.threads[i];
        if (!th.done) runThread(th);
      }
      if (L.threads.some((th) => th.done)) L.threads = L.threads.filter((th) => !th.done);
    }
  }

  // ---------- running a thread ----------
  function runThread(th) {
    let budget = VM_STEPS_MAX;
    for (;;) {
      if (th.wait) {
        if (!waitOver(th)) return;
        th.wait = null;
      }
      const f = th.frames[th.frames.length - 1];
      if (!f) { th.done = true; return; }
      if (f.i >= f.list.length) {
        if (!f.loop) { th.frames.pop(); continue; }
        if (!loopAgain(th, f)) { th.frames.pop(); continue; }
        f.i = 0;
        // a counted loop (repeat N, for each) runs its turns at once, so two scripts of one lift started in
        // the same moment don't mix up its variables; `forever` and `repeat until` give way every turn
        if (f.loop.kind === 'repeat' || f.loop.kind === 'for') continue;
        // a loop turn that never waited: the Inspector calls a long run of them a busy loop
        if (!f.waited) { f.spins = (f.spins || 0) + 1; if (f.spins >= SPIN_NOTE) run.busyLoops[f.block.id] = true; }
        else f.spins = 0;
        f.waited = false;
        return; // the end of a loop turn yields
      }
      if (--budget < 0) {
        if (!run.slow[th.cur]) { run.slow[th.cur] = true; GameEvents.emit('slow', { id: th.cur }); }
        return;
      }
      const b = f.list[f.i++];
      th.cur = b.id;
      exec(th, b);
      if (th.done) return;
      if (th.wait) {
        for (const fr of th.frames) fr.waited = true;
        return;
      }
    }
  }

  function loopAgain(th, f) {
    const L = f.loop;
    if (L.kind === 'forever') return true;
    if (L.kind === 'repeat') return --L.left > 0;
    if (L.kind === 'until') return !toBool(evalValue(th, f.block.args[0]));
    if (L.kind === 'for') {
      const v = toNum(getVar(th, L.name)) + 1;
      if (v > L.to) return false;
      setVar(th, L.name, v);
      return true;
    }
    return false;
  }

  function waitOver(th) {
    const w = th.wait, L = th.lift;
    if (w.type === 'time') return run.t + 1e-9 >= w.until;
    if (w.type === 'goto') return (L.arrivals[w.floor] || 0) > w.count && L.doorPhase === 'closed';
    if (w.type === 'until') { th.cur = w.block.id; return toBool(evalValue(th, w.block.args[0])); }
    if (w.type === 'bcast') return w.ev.delivered && w.ev.started.every((t) => t.done);
    return true;
  }

  function push(th, b, list, loop) { th.frames.push({ list: list || [], i: 0, loop, block: b }); }

  // ---------- one block ----------
  function exec(th, b) {
    const L = th.lift, a = b.args || [];
    switch (b.op) {
      case 'goto': {
        const f = floorArg(th, b, 0);
        if (f === null) return;
        if (!Lift.canStopAt(L, f)) { fail(th, b, 'This lift doesn\'t stop at floor {n}', { n: f }); return; }
        Lift.planFirst(L, f);
        th.wait = { type: 'goto', floor: f, count: L.arrivals[f] || 0 };
        return;
      }
      case 'say': case 'sayFor': {
        const text = toStr(evalValue(th, a[0]));
        const dur = b.op === 'sayFor' ? Math.max(0, toNum(evalValue(th, a[1]))) : SAY_SHOW;
        L.say = { text, until: run.t + (dur || 0.01), id: b.id };
        run.counters.says++;
        if (L.curStop) L.curStop.said.push(text);
        logEvent('say', { lift: L.n, text });
        GameEvents.emit('say', { lift: L, text });
        if (b.op === 'sayFor') th.wait = { type: 'time', until: run.t + dur };
        return;
      }
      case 'wait':
        th.wait = { type: 'time', until: run.t + Math.max(0, toNum(evalValue(th, a[0]))) };
        return;
      case 'repeat': {
        const n = Math.floor(toNum(evalValue(th, a[0])));
        if (n > 0) push(th, b, b.body, { kind: 'repeat', left: n });
        return;
      }
      case 'forever': push(th, b, b.body, { kind: 'forever' }); return;
      case 'if': if (toBool(evalValue(th, a[0]))) push(th, b, b.body, null); return;
      case 'ifElse': push(th, b, toBool(evalValue(th, a[0])) ? b.body : b.body2, null); return;
      case 'waitUntil':
        if (!toBool(evalValue(th, a[0]))) th.wait = { type: 'until', block: b };
        return;
      case 'repeatUntil':
        if (!toBool(evalValue(th, a[0]))) push(th, b, b.body, { kind: 'until' });
        return;
      case 'forEach': {
        const name = a[0];
        if (!name) { fail(th, b, 'Pick a variable for the loop'); return; }
        const from = toNum(evalValue(th, a[1])), to = toNum(evalValue(th, a[2]));
        if (from > to) return;
        setVar(th, name, from);
        push(th, b, b.body, { kind: 'for', name, to });
        return;
      }
      case 'stop':
        if (String(a[0]) === 'all') { for (const t of L.threads) t.done = true; }
        th.done = true;
        return;
      // the plan
      case 'planAdd': case 'planFirst': case 'planRemove': {
        const f = floorArg(th, b, 0);
        if (f === null) return;
        if (b.op !== 'planRemove' && !Lift.canStopAt(L, f)) { fail(th, b, 'This lift doesn\'t stop at floor {n}', { n: f }); return; }
        if (b.op !== 'planRemove' && run.planMax && L.plan.length >= run.planMax && L.plan.indexOf(f) < 0) { fail(th, b, 'This old lift remembers only {n} floor at a time — keep the rest in your own list', { n: run.planMax }); return; }
        if (b.op === 'planAdd') Lift.planAdd(L, f);
        else if (b.op === 'planFirst') Lift.planFirst(L, f);
        else Lift.planRemove(L, f);
        return;
      }
      case 'planClear': Lift.planClear(L); return;
      case 'cancelButtons': Lift.cancelButtons(L); return;
      case 'stopHere': {
        if (th.hat.op !== 'onPass') { fail(th, b, '"stop here" works only inside "when I\'m about to pass floor"'); return; }
        const f = th.params.floor;
        if (!Lift.stopHere(L, f)) { fail(th, b, 'Too late to stop at floor {n}', { n: f }, true); }
        return;
      }
      case 'setArrow': {
        const v = String(evalValue(th, a[0]) || '').toLowerCase();
        L.arrowOverride = v === 'up' || v === 'down' || v === 'none' ? v : null;
        if (L.doorPhase !== 'closed') Lift.serveCalls(L);
        return;
      }
      case 'holdDoors': {
        const s = Math.max(0, toNum(evalValue(th, a[0])));
        L.holdUntil = Math.max(L.holdUntil, run.t + s);
        if (L.doorPhase === 'closing') Lift.reopen(L);
        return;
      }
      case 'closeDoors': L.closeAsap = true; L.holdUntil = 0; return;
      // variables
      case 'setVar': if (needVar(th, b, a[0])) setVar(th, a[0], evalValue(th, a[1])); return;
      case 'changeVar': if (needVar(th, b, a[0])) setVar(th, a[0], toNum(getVar(th, a[0])) + toNum(evalValue(th, a[1]))); return;
      case 'showVar': if (needVar(th, b, a[0])) run.monitors[a[0]] = true; return;
      case 'hideVar': if (needVar(th, b, a[0])) delete run.monitors[a[0]]; return;
      // lists
      case 'listAdd': { const l = listOf(th, b, a[1]); if (l) l.push(evalValue(th, a[0])); return; }
      case 'listDelete': { const l = listOf(th, b, a[1]); if (!l) return; const i = Math.floor(toNum(evalValue(th, a[0]))); if (i >= 1 && i <= l.length) l.splice(i - 1, 1); else fail(th, b, 'There is no item {n} in the list', { n: i }); return; }
      case 'listClear': { const l = listOf(th, b, a[0]); if (l) l.length = 0; return; }
      case 'listInsert': { const l = listOf(th, b, a[2]); if (!l) return; const i = Math.floor(toNum(evalValue(th, a[1]))); if (i >= 1 && i <= l.length + 1) l.splice(i - 1, 0, evalValue(th, a[0])); else fail(th, b, 'There is no place {n} in the list', { n: i }); return; }
      // messages
      case 'broadcast': case 'broadcastWait': {
        const msg = msgName(evalValue(th, a[0]));
        const ev = { type: 'onReceive', lift: 0, params: { msg }, started: [], delivered: false };
        run.queue.push(ev);
        logEvent('broadcast', { lift: L.n, msg });
        if (b.op === 'broadcastWait') th.wait = { type: 'bcast', ev };
        return;
      }
      default:
        if (BLOCK[b.op] && (BLOCK[b.op].shape === 'reporter' || BLOCK[b.op].shape === 'boolean')) evalValue(th, b);
    }
  }

  // ---------- values ----------
  function toNum(v) {
    if (typeof v === 'number') return isFinite(v) ? v : 0;
    if (typeof v === 'boolean') return v ? 1 : 0;
    if (v === null || v === undefined) return 0;
    const s = String(v).trim();
    if (s === '') return 0;
    const n = Number(s);
    return isNaN(n) ? 0 : n;
  }
  function toBool(v) {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v !== 0;
    const s = String(v === null || v === undefined ? '' : v).trim().toLowerCase();
    return s !== '' && s !== '0' && s !== 'false';
  }
  function toStr(v) {
    if (typeof v === 'number') return String(Math.round(v * 100) / 100);
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    return v === null || v === undefined ? '' : String(v);
  }
  function isNumeric(v) {
    if (typeof v === 'number') return true;
    if (typeof v !== 'string' || v.trim() === '') return false;
    return !isNaN(Number(v));
  }
  function compare(x, y) {
    if (isNumeric(x) && isNumeric(y)) return toNum(x) - toNum(y);
    const a = toStr(x).toLowerCase(), b = toStr(y).toLowerCase();
    return a < b ? -1 : a > b ? 1 : 0;
  }

  function fail(th, b, msg, params, flash) {
    if (!b) return;
    if (!run.errors[b.id]) run.errors[b.id] = { msg, params: params || {}, t: run.t, flash: !!flash };
    logEvent('error', { id: b.id, msg, params: params || {} });
    GameEvents.emit('blockError', { id: b.id, msg, params, flash });
  }

  function floorArg(th, b, k) {
    const raw = evalValue(th, b.args[k]);
    if (raw === null || raw === undefined || (typeof raw === 'string' && raw.trim() === '')) {
      fail(th, b, 'Fill in the floor number');
      return null;
    }
    const n = toNum(raw);
    if (!hasFloor(n)) { fail(th, b, 'There is no floor {n} here', { n: toStr(raw) }); return null; }
    return n;
  }
  function floorOf(th, b, v) {
    const n = toNum(v);
    if (!hasFloor(n)) { fail(th, b, 'There is no floor {n} here', { n: toStr(v) }); return -1; }
    return floorIndex(n);
  }
  function liftOf(th, b, v) {
    const n = Math.floor(toNum(v));
    if (n < 1 || n > run.lifts.length) { fail(th, b, 'There is no lift {n} here', { n: toStr(v) }); return null; }
    return run.lifts[n - 1];
  }
  function dirOf(v) {
    const s = String(v === null || v === undefined ? '' : v).toLowerCase();
    return s === 'up' || s === 'down' ? s : 'any';
  }

  function needVar(th, b, name) {
    if (name === null || name === undefined || name === '') { fail(th, b, 'Pick a variable'); return false; }
    return true;
  }
  function varHome(th, name) {
    if (th && Object.prototype.hasOwnProperty.call(th.lift.vars, name)) return th.lift.vars;
    if (Object.prototype.hasOwnProperty.call(run.vars, name)) return run.vars;
    return th ? th.lift.vars : run.vars;
  }
  function getVar(th, name) { run.varsRead[name] = true; const h = varHome(th, name); return h[name] === undefined ? 0 : h[name]; }
  function setVar(th, name, v) { run.varsSet[name] = true; varHome(th, name)[name] = v; }
  function listOf(th, b, name) {
    if (!name) { fail(th, b, 'Pick a list'); return null; }
    run.varsRead[name] = true;
    if (th && th.lift.lists[name]) return th.lift.lists[name];
    if (!run.lists[name]) run.lists[name] = [];
    return run.lists[name];
  }

  function evalValue(th, v) {
    if (v === null || v === undefined) return '';
    if (typeof v !== 'object') return v;
    const L = th ? th.lift : run.lifts[0], a = v.args || [];
    const n = (k) => toNum(evalValue(th, a[k]));
    const val = (k) => evalValue(th, a[k]);
    const bool = (k) => toBool(evalValue(th, a[k]));
    switch (v.op) {
      case 'curFloor': return Lift.floor(L);
      case 'add': return n(0) + n(1);
      case 'sub': return n(0) - n(1);
      case 'mul': return n(0) * n(1);
      case 'div': { const d = n(1); if (d === 0) { fail(th, v, 'Dividing by zero'); return 0; } return n(0) / d; }
      case 'mod': { const d = n(1); if (d === 0) { fail(th, v, 'Dividing by zero'); return 0; } const r = n(0) % d; return r < 0 ? r + Math.abs(d) : r; }
      case 'round': return Math.round(n(0));
      case 'join': return toStr(val(0)) + toStr(val(1));
      case 'lt': return compare(val(0), val(1)) < 0;
      case 'eq': return compare(val(0), val(1)) === 0;
      case 'gt': return compare(val(0), val(1)) > 0;
      case 'and': return bool(0) && bool(1);
      case 'or': return bool(0) || bool(1);
      case 'not': return !bool(0);
      case 'random': {
        const lo = Math.min(n(0), n(1)), hi = Math.max(n(0), n(1));
        const ints = Number.isInteger(lo) && Number.isInteger(hi);
        const r = run.progRng();
        return ints ? lo + Math.floor(r * (hi - lo + 1)) : lo + r * (hi - lo);
      }
      case 'distance': return Math.abs(n(0) - n(1));
      case 'min': return Math.min(n(0), n(1));
      case 'max': return Math.max(n(0), n(1));
      case 'callOn': { const i = floorOf(th, v, val(0)); return i >= 0 && Building.isLit(i, dirOf(val(1))); }
      case 'buttonIn': { const f = toNum(val(0)); if (!hasFloor(f)) { floorOf(th, v, f); return false; } return L.cabin.has(f); }
      case 'myDir': return Lift.direction(L);
      case 'doorsOpen': return L.doorPhase !== 'closed';
      case 'topFloor': return Sensors.top(L);
      case 'bottomFloor': return Sensors.bottom(L);
      case 'planLength': return L.plan.length;
      case 'planItem': { const i = Math.floor(n(0)); if (i < 1 || i > L.plan.length) { fail(th, v, 'The plan has no item {n}', { n: i }); return ''; } return L.plan[i - 1]; }
      case 'planHas': return L.plan.indexOf(n(0)) >= 0;
      case 'loadPct': return Lift.loadPct(L);
      case 'full': return Lift.load(L) >= L.cap;
      case 'doorway': return L.doorPhase !== 'closed' && L.busyUntil > run.t;
      case 'waitTime': { const i = floorOf(th, v, val(0)); return i >= 0 ? Math.round(Building.waitingTime(i, dirOf(val(1))) * 10) / 10 : 0; }
      case 'emergencyOn': { const i = floorOf(th, v, val(0)); return i >= 0 && run.hall[i].emergency; }
      case 'clock': return Math.floor(Sensors.clock());
      case 'clockHour': return Math.floor(Sensors.clock() / 60) % 24;
      case 'myNumber': return L.n;
      case 'liftsInGroup': return run.lifts.length;
      case 'floorOf': { const o = liftOf(th, v, val(0)); return o ? Lift.floor(o) : 0; }
      case 'dirOf': { const o = liftOf(th, v, val(0)); return o ? Lift.direction(o) : ''; }
      case 'planLenOf': { const o = liftOf(th, v, val(0)); return o ? o.plan.length : 0; }
      case 'loadOf': { const o = liftOf(th, v, val(0)); return o ? Lift.loadPct(o) : 0; }
      case 'working': { const o = liftOf(th, v, val(0)); return o ? o.working : false; }
      case 'buttonsCount': return L.cabin.size;
      case 'listItem': { const l = listOf(th, v, a[1]); if (!l) return ''; const i = Math.floor(n(0)); if (i < 1 || i > l.length) { fail(th, v, 'There is no item {n} in the list', { n: i }); return ''; } return l[i - 1]; }
      case 'listIndex': { const l = listOf(th, v, a[1]); if (!l) return 0; const x = val(0); for (let i = 0; i < l.length; i++) if (compare(l[i], x) === 0) return i + 1; return 0; }
      case 'listLength': { const l = listOf(th, v, a[0]); return l ? l.length : 0; }
      case 'listHas': { const l = listOf(th, v, a[0]); if (!l) return false; const x = val(1); return l.some((y) => compare(y, x) === 0); }
      case 'list': { const l = listOf(th, v, a[0]); return l ? l.map(toStr).join(' ') : ''; }
      case 'var': return getVar(th, a[0]);
      case 'param': {
        if (!th || !(a[0] in th.params)) { fail(th, v, '"{name}" is only known inside its own event script', { name: a[0] }); return ''; }
        return th.params[a[0]];
      }
      default: return '';
    }
  }

  // the blocks running now: id → the numbers of the lifts running them (the editor's glow)
  function active() {
    const out = {};
    if (!run) return out;
    for (const L of run.lifts) for (const th of L.threads) {
      if (th.done) continue;
      (out[th.cur] = out[th.cur] || []).push(L.n);
      if (th.cur !== th.hat.id) (out[th.hat.id] = out[th.hat.id] || []).push(L.n);
    }
    return out;
  }

  // the value of a variable as the followed lift sees it (monitors)
  function peek(name, L) {
    if (L && Object.prototype.hasOwnProperty.call(L.vars, name)) return L.vars[name];
    if (Object.prototype.hasOwnProperty.call(run.vars, name)) return run.vars[name];
    if (L && L.lists[name]) return L.lists[name].map(toStr).join(' ');
    if (run.lists[name]) return run.lists[name].map(toStr).join(' ');
    return 0;
  }

  return { init, event, step, active, peek, toStr, toNum };
})();
