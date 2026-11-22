'use strict';

// Arlanda Rising — plan time on the screen: the panel of the mission's master-plan projects (each stage with its
// days and price: Start or Start fast, its progress, what it waits for; the project's options and how it is paid),
// the crews at work, the fee level when the airport is open, the loans; and the decision card that stops the time
// until the player picks one of its options (the pair of choices of SPEC.md "Offers come as choices"). Used by
// game.js in a plan stage.

const PlanUI = (() => {
  const box = document.getElementById('planPanel');
  const dec = document.getElementById('decision');
  let key = '', decKey = '';
  // whether winter work lies ahead (Construction.winterAhead), worked out once a game day: the tents come and go with it
  let winterDay = '', winter = false;
  function winterAhead() {
    const k = S.mission.id + ':' + S.mission.stage + ':' + S.day;
    if (k !== winterDay) { winterDay = k; winter = Construction.winterAhead(); }
    return winter;
  }

  function stageRow(pid, sid, def, st) {
    const why = Construction.cannot(pid, sid);
    let right;
    if (st.done) right = '<span class="done">✓ ' + Text.esc(tr('Done')) + '</span>';
    else if (st.on) {
      right = '<div class="bar"><i style="width:' + Math.round(st.p * 100) + '%"></i></div>' +
        '<button class="tb small' + (st.pace === 'fast' ? ' on' : '') + '" data-pace="' + (st.pace === 'fast' ? 'normal' : 'fast') + '" data-p="' + pid + '" data-s="' + sid + '">' +
        Text.esc(st.pace === 'fast' ? tr('Fast') : tr('Normal')) + '</button>';
    } else if (why === 'after') {
      const need = (def.after || []).filter((a) => !Construction.stageDone(pid, a)).map((a) => tr(PROJECTS[pid].stages[a].name));
      right = '<span class="wait">' + Text.esc(tr('After: {what}', { what: need.join(', ') })) + '</span>';
    } else if (why === 'crews') {
      right = '<span class="wait">' + Text.esc(tr('No free crew')) + '</span>';
    } else {
      right = '<button class="tb startBtn" data-start="normal" data-p="' + pid + '" data-s="' + sid + '">' + Text.esc(tr('Start')) + '</button>' +
        '<button class="tb small" data-start="fast" data-p="' + pid + '" data-s="' + sid + '" title="' + Text.esc(tr('Faster and dearer')) + '">' + Text.esc(tr('Fast')) + '</button>';
    }
    const p = PROJECTS[pid].stages[sid];
    const days = Math.round((p.days + st.extra) * PACE[st.on ? st.pace : 'normal'].time);
    return '<div class="stageRow' + (st.done ? ' isDone' : '') + '"><div class="sn"><b>' + Text.esc(tr(p.name)) + (p.optional ? ' <em>' + Text.esc(tr('optional')) + '</em>' : '') + '</b>' +
      '<small>' + tr('{n} days', { n: days }) + ' · ' + sekBare(p.price * PACE[st.on ? st.pace : 'normal'].cost) + '</small></div><div class="sr">' + right + '</div></div>';
  }

  function render() {
    if (!S || !S.plan || !S.mission) { box.hidden = true; key = ''; return; }
    const ids = S.mission.projects || [];
    const goals = Goals.all(Missions.stage().goal, S.mission.st), mg = Text.missionGoals();
    const k = JSON.stringify(goals) + mg + JSON.stringify(S.airport.projects) + S.plan.crews + Math.round(S.money / 1e5) + S.loans + S.airport.fees + I18N.lang + Settings.short() + JSON.stringify(S.plan.buys) +
      JSON.stringify(S.domains) + JSON.stringify(S.people && S.people.hiring) + JSON.stringify(S.sys) + JSON.stringify(S.people && [S.people.vacant, S.people.managers]) + (S.people ? S.people.it : 0) + winterAhead();
    box.hidden = false;
    if (k === key) return;
    key = k;
    let html = (goals.length || mg ? '<div class="pGoals">' + (goals.length ? '<b>' + Text.esc(tr(Missions.stage().name)) + '</b>' + Text.goalsHtml(goals) : '') + mg + '</div>' : '') + '<div class="pHead"><b>' + Text.esc(tr('Building')) + '</b><span>👷 ' + Text.esc(tr('Crews at work: {a} of {n}', { a: Construction.active(), n: S.plan.crews })) + '</span></div>';
    for (const pid of ids) {
      const p = Construction.state(pid), def = PROJECTS[pid];
      if (!p) continue;
      html += '<div class="proj"><h3>' + Text.esc(tr(def.name)) + (p.done ? ' <span class="done">✓</span>' : '') + '</h3>';
      for (const sid of Object.keys(def.stages)) html += stageRow(pid, sid, def.stages[sid], p.stages[sid]);
      // the options: one bought shows ✓; heated tents (a mod that only keeps the work at full speed in winter) are
      // offered only while winter work lies ahead in the mission and the project is not finished, with what they do
      const mods = Object.keys(def.mods || {}).filter((mid) => { const why = Construction.modCannot(pid, mid); return !why || why === 'bought'; });
      if (mods.length) {
        let note = '';
        html += '<div class="mods">' + mods.map((mid) => {
          const md = def.mods[mid], has = p.mods[mid], what = md.noWinter ? tr('Work goes on at full speed in December–February (otherwise half speed)') : '';
          if (what && !has) note = what;
          return '<button class="tb small' + (has ? ' on' : '') + '" data-mod="' + mid + '" data-p="' + pid + '"' + (has ? ' disabled' : '') + (what ? ' title="' + Text.esc(what) + '"' : '') + '>' + (has ? '✓ ' : '+ ') +
            Text.esc(tr(md.name)) + '<small>' + sekBare(md.price) + '</small></button>';
        }).join('') + (note ? '<small class="modNote">' + Text.esc(note) + '</small>' : '') + '</div>';
      }
      const grants = S.mission.grants || [];
      html += '<div class="fin"><span>' + Text.esc(tr('Paid with')) + '</span>' + ['cash', 'loan'].concat(grants.indexOf(pid) >= 0 ? ['grant'] : []).map((h) =>
        '<button class="tb small' + (p.finance === h ? ' on' : '') + '" data-fin="' + h + '" data-p="' + pid + '">' + Text.esc(tr({ cash: 'Cash', loan: 'A loan', grant: "The owner's grant" }[h])) + '</button>').join('') + '</div>';
      html += '</div>';
    }
    html += teams();
    for (const b of S.plan.buys) html += '<div class="buyRow">' + BUILD_ICONS[b.kind] + ' ' + Text.esc(tr(BUILDINGS[b.kind].name)) + ' — ' + Text.esc(tr('ready in {n} days', { n: b.done - S.day })) + '</div>';
    if (S.airport.open) {
      html += '<div class="fin"><span>' + Text.esc(tr('Fees')) + '</span>' + ['low', 'normal', 'high'].map((f) =>
        '<button class="tb small' + (S.airport.fees === f ? ' on' : '') + '" data-fees="' + f + '">' + Text.esc(tr({ low: 'Low', normal: 'Normal', high: 'High' }[f])) + '</button>').join('') + '</div>';
    }
    // the loans in short (all of it at the top of Finance): Borrow / Repay a step of the owner's limit (sim/finance.js)
    const step = Finance.step();
    html += '<div class="fin"><span>' + Text.esc(tr('Loans: {m}', { m: sek(S.loans) })) + '</span>' +
      '<button class="tb small" data-loan="borrow"' + (Finance.cannot('borrow') ? ' disabled' : '') + '>+' + sekBare(Math.min(step, Finance.room()) || step) + '</button>' +
      '<button class="tb small" data-loan="repay"' + (Finance.cannot('repay') ? ' disabled' : '') + '>−' + sekBare(Math.min(step, S.loans) || step) + '</button></div>';
    box.innerHTML = html;
  }

  // the teams and systems the mission lets the player add now (Text.ladder): hire a team (ready in two weeks), buy a
  // system (straight from the hands too; from a team, keep it as the fallback or let it go), hire a team back beside a
  // system; a department whose head has left, with a button to People; IT people
  function teams() {
    let html = '';
    for (const d of Object.keys(S.domains)) {
      for (const st of Text.ladder(d)) html += ladderStep(d, st);
      const v = S.people && S.people.vacant && S.people.vacant[d];
      if (v && People.staffed(d) && !People.manager(d)) html += '<div class="stageRow"><div class="sn"><b>👔 ' + Text.esc(tr('No head — find one')) + '</b><small>' + Text.esc(Text.dept(d)) + '</small></div>' +
        '<div class="sr"><button class="tb small" data-people="1">👥 ' + Text.esc(tr('People')) + '</button></div></div>';
    }
    const need = Systems.itNeed();
    if (need || (S.people && S.people.it)) {
      html += '<div class="fin"><span>💻 ' + Text.esc(tr('IT people: {a} of {n} needed', { a: S.people ? S.people.it : 0, n: need })) + '</span>' +
        '<button class="tb small" data-it="1">+1</button><button class="tb small" data-it="-1"' + (!S.people || !S.people.it ? ' disabled' : '') + '>−1</button></div>';
    }
    return html ? '<div class="pHead"><b>' + Text.esc(tr('Teams and systems')) + '</b></div>' + html : '';
  }

  // a step of a domain's ladder: its line (the domain, what, the price and running cost), then its buttons or what it
  // waits for, then its notes
  function ladderStep(d, st) {
    const acts = (st.acts || []).map((a) => '<button class="tb' + (a.main ? ' startBtn' : ' small') + '" ' + a.data + '>' + Text.esc(a.label) + '<small>' + Text.esc(a.sum) + '</small></button>').join('');
    return '<div class="lad"><div class="ladHead"><b>' + DOMAINS[d].icon + ' ' + Text.esc(st.title) + '</b><small>' + Text.esc(Text.dom(d) + (st.sub ? ' · ' + st.sub : '')) + '</small></div>' +
      (st.wait ? '<small class="wait">' + Text.esc(st.wait) + '</small>' : '') + (st.notes || []).slice(0, 1).map((n) => '<small class="ladNote">' + Text.esc(n) + '</small>').join('') +
      (acts ? '<div class="ladActs">' + acts + '</div>' : '') + (st.notes || []).slice(1).map((n) => '<small class="ladNote">' + Text.esc(n) + '</small>').join('') + '</div>';
  }

  box.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    Sfx.play('click');
    const pid = b.dataset.p, sid = b.dataset.s;
    if (b.dataset.people) { Game.openPanel('people'); return; }
    if (b.dataset.up) Actions.upgrade(b.dataset.up, b.dataset.how);
    else if (b.dataset.sys) Actions.system(b.dataset.sys, b.dataset.how);
    else if (b.dataset.back) Actions.hireBack(b.dataset.back);
    else if (b.dataset.it) Actions.hireIT(+b.dataset.it);
    else if (b.dataset.start) Actions.start(pid, sid, b.dataset.start);
    else if (b.dataset.pace) Actions.pace(pid, sid, b.dataset.pace);
    else if (b.dataset.mod) Actions.mod(pid, b.dataset.mod);
    else if (b.dataset.fin) Actions.finance(pid, b.dataset.fin);
    else if (b.dataset.fees) Actions.fees(b.dataset.fees);
    else if (b.dataset.loan === 'borrow') Actions.borrow(Finance.step());
    else if (b.dataset.loan === 'repay') Actions.repay(Finance.step());
    Game.acted();
    key = '';
  });

  // ---------- the decision card ----------
  function decision() {
    const def = S && S.plan && Plan.pendingDef();
    if (!def) { if (!dec.hidden) { dec.hidden = true; decKey = ''; } return; }
    const k = def.id + I18N.lang + Settings.short();
    if (k === decKey) return;
    decKey = k;
    // params: names filled into an offer made by Free Play (translated where they are data)
    const p = {};
    for (const key of Object.keys(def.params || {})) p[key] = typeof def.params[key] === 'string' ? tr(def.params[key]) : key.indexOf('sek') === 0 ? sek(def.params[key]) : def.params[key];
    let extra = '';
    if (def.kind === 'union' && People.has(def.dept)) {
      const u = S.people.depts[def.dept].union;
      extra = '<p class="fine">✊ ' + Text.esc(tr("The union's mood: {m} of 100", { m: Math.round(u.mood) })) + (People.manager(def.dept) ? ' · ' + Text.esc(Text.manager(People.manager(def.dept).id)) : '') + '</p>';
    }
    // session 7: heads for a department with no team: the team comes with the head, and the card says so
    const lead = def.options.find((o) => o.manager && !o.hire && People.needsTeam(o.manager));
    if (lead) extra += '<p class="fine">👷 ' + Text.esc(Text.headTeam(lead.manager)) + '</p>';
    dec.innerHTML = '<div class="decIcon">' + (def.icon || '❓') + '</div><h2>' + Text.esc(tr(def.title || def.id, p)) + '</h2>' +
      '<p>' + Text.esc(tr(def.text || '', p)) + '</p>' + extra + '<div class="opts">' + def.options.map((o) => {
        const lines = o.manager ? '<span class="mgr">' + Text.managerLines(o.manager).map((l) => Text.esc(l)).join('<br>') + '</span>' : '';
        return '<button class="opt" data-opt="' + o.id + '"><b>' + Text.esc(o.manager ? Text.manager(o.manager) : tr(o.label || o.id)) + '</b>' + lines + '<small>' + Text.esc(Text.effects(o)) + '</small></button>';
      }).join('') + '</div>';
    dec.hidden = false;
  }
  dec.addEventListener('click', (e) => {
    const b = e.target.closest('.opt');
    if (!b) return;
    Sfx.play('click');
    Actions.choose(b.dataset.opt);
    Game.acted();
    dec.hidden = true; decKey = '';
  });

  return { render, decision, reset() { key = ''; decKey = ''; dec.hidden = true; } };
})();
