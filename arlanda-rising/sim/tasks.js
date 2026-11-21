'use strict';

// Arlanda Rising — the player's hands: the task tray. Every job of a domain still worked by hand becomes a task
// with a deadline ("SAS 412 lands in 5 min — pick a stand", "Snow on runway 1 — send the ploughs"). One tap
// does the obvious thing (`obvious`), or the player picks (a stand on the map). A task not done by its
// deadline — or one that finds the tray full (TRAY_MAX) — goes to the duty manager, who does it
// DUTY_LATE minutes later and right only MANUAL_SUMMARY_EFF of the time. A domain handed to people or a
// system (S.domains) does its tasks itself after its level's delay; a kind of task this mission does not
// put in the player's hands (S.mission.hands) is done at once by someone else. Used by sim/flights.js,
// sim/turnaround.js, sim/passengers.js, sim/runways.js and sim/actions.js; the tray is S.ops.tasks.

const Tasks = {
  // a task of this kind and target is already in the tray or on its way to being done
  pending(kind, target) {
    return S.ops.tasks.some((k) => k.kind === kind && k.target === target) ||
      S.ops.later.some((k) => k.kind === kind && k.target === target);
  },
  need(kind, target) {
    const st = S.mission.st, dom = TASK_DOMAIN[kind], installed = S.domains[dom] || 0, lv = Systems.working(dom);
    if (S.mission.hands.indexOf(kind) < 0 && !installed) {
      this.execute(kind, target, this.obvious(kind, target), 'auto');
      st.tasksAuto++;
      return;
    }
    if (lv >= 2) {
      const L = DOMAINS[dom].levels[lv];
      S.ops.later.push({ kind, target, at: S.clock + L.delay, by: 'system', right: L.right });
      return;
    }
    if (lv === 1) {
      // the team does it unless it is short (absence, a strike): then it comes to the tray
      const cap = People.capacity(dom);
      if (cap >= 1 || rand() < cap) {
        const w = People.work(dom, DOMAINS[dom].levels[1]);
        let delay = w.delay, right = w.right;
        // the team that stands in for a system that is down: as good as it still knows the manual way
        if (installed >= 2) { const r = Systems.readiness(dom); delay *= 2 - r; right *= 0.5 + 0.5 * r; }
        S.ops.later.push({ kind, target, at: S.clock + delay, by: 'people', right });
        return;
      }
      st.short++;
    }
    const task = { id: nextId(), kind, target, t0: S.clock, due: S.clock + TASK_DEADLINE[kind] * diff().deadline };
    if (S.ops.tasks.length >= TRAY_MAX) { st.overflow++; this.toDuty(task); return; }
    S.ops.tasks.push(task);
    logEvent('task', { kind, target });
  },
  toDuty(task) {
    S.ops.later.push({ kind: task.kind, target: task.target, at: Math.max(S.clock, task.due) + DUTY_LATE[task.kind], by: 'duty', right: MANUAL_SUMMARY_EFF });
  },
  // a flight that left: its tasks go
  drop(flightId) {
    S.ops.tasks = S.ops.tasks.filter((k) => k.target !== flightId);
    S.ops.later = S.ops.later.filter((k) => k.target !== flightId);
  },
  valid(kind, target) {
    if (kind === 'stand') { const f = Flights.get(target); return !!f && !Flights.over(f) && !f.inBlock && f.st !== 'turn'; }
    if (kind === 'fuel') { const f = Flights.get(target); return !!f && f.tr && f.tr.fuel === 'asked'; }
    if (kind === 'checkin') return S.ops.desksOpen < S.airport.desks;
    if (kind === 'plough') { const s = Runways.surface(target); return !!s && !s.plough && s.snow >= 1 && S.ops.ploughQueue.indexOf(target) < 0; }
    if (kind === 'bags') { const f = Flights.get(target); return !!f && f.tr && f.tr.bags === 'asked'; }
    if (kind === 'announce') { const f = Flights.get(target); return !!f && f.ann === 'asked' && !Flights.over(f); }
    // session 5
    if (kind === 'lane') return Terminal.lanes() < Terminal.lanesUp();
    if (kind === 'booth') return Terminal.booths() < (S.airport.booths || 0);
    if (kind === 'deice') { const f = Flights.get(target); return !!f && f.tr && f.tr.deice === 'asked'; }
    // session 6: the mobile charger for an electric aircraft
    if (kind === 'charge') { const f = Flights.get(target); return !!f && f.tr && f.tr.fuel === 'asked' && f.tr.charge === 'mobile'; }
    return false;
  },
  // what one tap does
  obvious(kind, target) {
    if (kind === 'stand') { const f = Flights.get(target); const st = f && Stands.best(f); return st ? st.id : null; }
    return target;
  },
  execute(kind, target, choice, by) {
    if (!this.valid(kind, target)) return true;
    switch (kind) {
      case 'stand': {
        const f = Flights.get(target);
        return Stands.assign(f, Airport.stand(choice));
      }
      case 'fuel': Flights.get(target).tr.fuel = 'queued'; return true;
      case 'checkin': S.ops.desksOpen++; logEvent('desk', { open: S.ops.desksOpen }); return true;
      case 'plough': return Runways.plough(choice || target);
      case 'bags': return Turnaround.bags(Flights.get(target), choice === 'lost');
      case 'announce': { const f = Flights.get(target); f.ann = 'done'; f.annAt = S.clock; logEvent('announced', { flight: f.no }); return true; }
      case 'lane': Terminal.openLane(Terminal.lanes() + 1); logEvent('lane', { open: Terminal.lanes() }); return true;
      case 'booth': Terminal.openBooth(Terminal.booths() + 1); logEvent('booth', { open: Terminal.booths() }); return true;
      case 'deice': Flights.get(target).tr.deice = 'queued'; return true;
      case 'charge': Flights.get(target).tr.fuel = 'cqueued'; return true;
    }
    return false;
  },
  // every ops step: missed deadlines go to the duty manager; the duty manager's and the people's jobs fall due
  step() {
    const t = S.clock, st = S.mission.st;
    const keep = [];
    for (const k of S.ops.tasks) {
      if (!this.valid(k.kind, k.target)) continue;
      if (t >= k.due) this.toDuty(k);
      else keep.push(k);
    }
    S.ops.tasks = keep;
    const later = [];
    for (const k of S.ops.later) {
      if (t < k.at) { later.push(k); continue; }
      if (!this.valid(k.kind, k.target)) continue;
      const right = k.right >= 1 || rand() < k.right;
      let choice = this.obvious(k.kind, k.target);
      if (k.kind === 'stand' && !right) {
        const f = Flights.get(k.target), poor = Stands.poor(f);
        choice = poor ? poor.id : choice;
        f.extraTaxi += WRONG_STAND_DELAY;
      }
      if (k.kind === 'bags' && !right) choice = 'lost';
      // a convoy busy elsewhere, no stand at all: try again in a minute
      if (!this.execute(k.kind, k.target, choice, k.by)) { k.at = t + 1; later.push(k); continue; }
      if (k.by === 'duty') st.tasksDuty++; else if (k.by === 'system') st.tasksSys++; else st.tasksPeople++;
    }
    S.ops.later = later;
  },
  // the player does a task (one tap: the obvious choice, or the one picked)
  doTask(id, choice) {
    const k = S.ops.tasks.find((x) => x.id === id);
    if (!k) return false;
    if (!this.valid(k.kind, k.target)) { S.ops.tasks = S.ops.tasks.filter((x) => x !== k); return false; }
    const ok = this.execute(k.kind, k.target, choice !== undefined && choice !== null ? choice : this.obvious(k.kind, k.target), 'player');
    if (!ok) return false;
    S.ops.tasks = S.ops.tasks.filter((x) => x !== k);
    S.mission.st.tasksPlayer++;
    logEvent('taskDone', { kind: k.kind });
    return true;
  }
};
