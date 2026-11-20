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
  const LOAN_STEP = 5e6;

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
      '<small>' + tr('{n} days', { n: days }) + ' · ' + sek(p.price * PACE[st.on ? st.pace : 'normal'].cost) + '</small></div><div class="sr">' + right + '</div></div>';
  }

  function render() {
    if (!S || !S.plan || !S.mission) { box.hidden = true; key = ''; return; }
    const m = Missions.def();
    const ids = (m.setup && m.setup.projects) || [];
    const goals = Goals.all(Missions.stage().goal, S.mission.st);
    const k = JSON.stringify(goals) + JSON.stringify(S.airport.projects) + S.plan.crews + Math.round(S.money / 1e5) + S.loans + S.airport.fees + I18N.lang + Settings.short() + JSON.stringify(S.plan.buys);
    box.hidden = false;
    if (k === key) return;
    key = k;
    let html = (goals.length ? '<div class="pGoals"><b>' + Text.esc(tr(Missions.stage().name)) + '</b>' + Text.goalsHtml(goals) + '</div>' : '') + '<div class="pHead"><b>' + Text.esc(tr('Building')) + '</b><span>👷 ' + Text.esc(tr('Crews at work: {a} of {n}', { a: Construction.active(), n: S.plan.crews })) + '</span></div>';
    for (const pid of ids) {
      const p = Construction.state(pid), def = PROJECTS[pid];
      if (!p) continue;
      html += '<div class="proj"><h3>' + Text.esc(tr(def.name)) + (p.done ? ' <span class="done">✓</span>' : '') + '</h3>';
      for (const sid of Object.keys(def.stages)) html += stageRow(pid, sid, def.stages[sid], p.stages[sid]);
      const mods = Object.keys(def.mods || {});
      if (mods.length) {
        html += '<div class="mods">' + mods.map((mid) => {
          const md = def.mods[mid], has = p.mods[mid];
          return '<button class="tb small' + (has ? ' on' : '') + '" data-mod="' + mid + '" data-p="' + pid + '"' + (has ? ' disabled' : '') + '>' + (has ? '✓ ' : '+ ') +
            Text.esc(tr(md.name)) + '<small>' + sek(md.price) + '</small></button>';
        }).join('') + '</div>';
      }
      const grants = S.mission.grants || [];
      html += '<div class="fin"><span>' + Text.esc(tr('Paid with')) + '</span>' + ['cash', 'loan'].concat(grants.indexOf(pid) >= 0 ? ['grant'] : []).map((h) =>
        '<button class="tb small' + (p.finance === h ? ' on' : '') + '" data-fin="' + h + '" data-p="' + pid + '">' + Text.esc(tr({ cash: 'Cash', loan: 'A loan', grant: "The owner's grant" }[h])) + '</button>').join('') + '</div>';
      html += '</div>';
    }
    for (const b of S.plan.buys) html += '<div class="buyRow">' + BUILD_ICONS[b.kind] + ' ' + Text.esc(tr(BUILDINGS[b.kind].name)) + ' — ' + Text.esc(tr('ready in {n} days', { n: b.done - S.day })) + '</div>';
    if (S.airport.open) {
      html += '<div class="fin"><span>' + Text.esc(tr('Fees')) + '</span>' + ['low', 'normal', 'high'].map((f) =>
        '<button class="tb small' + (S.airport.fees === f ? ' on' : '') + '" data-fees="' + f + '">' + Text.esc(tr({ low: 'Low', normal: 'Normal', high: 'High' }[f])) + '</button>').join('') + '</div>';
    }
    const room = Math.max(0, (S.loanLimit || 0) - S.loans);
    html += '<div class="fin"><span>' + Text.esc(tr('Loans: {m}', { m: sek(S.loans) })) + '</span>' +
      '<button class="tb small" data-loan="borrow"' + (room <= 0 ? ' disabled' : '') + '>+' + sek(Math.min(LOAN_STEP, room) || LOAN_STEP) + '</button>' +
      '<button class="tb small" data-loan="repay"' + (S.loans <= 0 || S.money <= 0 ? ' disabled' : '') + '>−' + sek(Math.min(LOAN_STEP, S.loans) || LOAN_STEP) + '</button></div>';
    box.innerHTML = html;
  }

  box.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    Sfx.play('click');
    const pid = b.dataset.p, sid = b.dataset.s;
    if (b.dataset.start) Actions.start(pid, sid, b.dataset.start);
    else if (b.dataset.pace) Actions.pace(pid, sid, b.dataset.pace);
    else if (b.dataset.mod) Actions.mod(pid, b.dataset.mod);
    else if (b.dataset.fin) Actions.finance(pid, b.dataset.fin);
    else if (b.dataset.fees) Actions.fees(b.dataset.fees);
    else if (b.dataset.loan === 'borrow') Actions.borrow(LOAN_STEP);
    else if (b.dataset.loan === 'repay') Actions.repay(LOAN_STEP);
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
    dec.innerHTML = '<div class="decIcon">' + (def.icon || '❓') + '</div><h2>' + Text.esc(tr(def.title || def.id)) + '</h2>' +
      '<p>' + Text.esc(tr(def.text || '')) + '</p><div class="opts">' + def.options.map((o) =>
        '<button class="opt" data-opt="' + o.id + '"><b>' + Text.esc(tr(o.label || o.id)) + '</b><small>' + Text.esc(Text.effects(o)) + '</small></button>').join('') + '</div>';
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
