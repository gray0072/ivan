'use strict';

// ============================================================
// World Aviation — screens: title, the ops hub (dispatch, hangar,
// training, career), the briefing, the debrief, failures, pause
// and the course quizzes. Plain DOM; the copy is written in English
// and shown through tr() in the language picked on the title screen.
// Every button carries data-act (and data-v); UI.action routes them.
// ============================================================

const UI = {
  screen: null, tab: 'dispatch', selContract: null, quiz: null, lastContract: null,

  init() {
    this.screen = el('screen');
    window.addEventListener('keydown', (e) => this.key(e), true);
  },

  // Arrow keys move the focus between buttons; Space / Enter press the focused
  // (or the default) button of whatever screen is showing.
  key(e) {
    if (this.screen.hidden || Game.mode === 'flying') return;
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') {
      if (e.key === 'Enter') { const b = this.screen.querySelector('.btn.default'); if (b) { e.preventDefault(); b.click(); } }
      return;
    }
    const btns = Array.from(this.screen.querySelectorAll('button:not([disabled])')).filter((b) => b.offsetParent !== null);
    if (!btns.length) return;
    const dirs = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (dirs[e.key]) {
      e.preventDefault();
      const focused = btns.indexOf(document.activeElement);
      const from = focused >= 0 ? btns[focused] : (this.screen.querySelector('.default:not([disabled])') || btns[0]);
      const f = from.getBoundingClientRect();
      const fx = f.left + f.width / 2, fy = f.top + f.height / 2;
      let best = null, score = Infinity;
      const [dx, dy] = dirs[e.key];
      for (const b of btns) {
        if (b === from) continue;
        const r = b.getBoundingClientRect();
        const bx = r.left + r.width / 2, by = r.top + r.height / 2;
        if ((bx - fx) * dx + (by - fy) * dy <= 1) continue;
        // edge-to-edge gap along the arrow, and the gap across it (0 when the
        // two buttons share a row / column); buttons in the same row or column
        // always win over closer ones off to the side
        const gapAlong = Math.max(0, dx > 0 ? r.left - f.right : dx < 0 ? f.left - r.right : dy > 0 ? r.top - f.bottom : f.top - r.bottom);
        const gapCross = Math.max(0, dx ? Math.max(r.top - f.bottom, f.top - r.bottom) : Math.max(r.left - f.right, f.left - r.right));
        const s = gapAlong + gapCross * 3 + (gapCross > 0 ? 1e5 : 0);
        if (s < score) { score = s; best = b; }
      }
      (best || from).focus();
      (best || from).scrollIntoView({ block: 'nearest' });
      return;
    }
    if (e.code === 'Space' || e.key === 'Enter') {
      const btn = btns.indexOf(document.activeElement) >= 0 ? document.activeElement
        : (this.screen.querySelector('.default:not([disabled])') || btns[0]);
      if (btn) { e.preventDefault(); e.stopPropagation(); btn.click(); }
    }
  },

  panel(html, cls) {
    this.screen.hidden = false;
    this.screen.dataset.view = '';
    this.screen.innerHTML = '<div class="panel ' + (cls || '') + '">' + Units.text(html) + '</div>';
    this.screen.scrollTop = 0;
    this.wire();
    return this.screen.querySelector('.panel');
  },

  wire() {
    this.screen.querySelectorAll('button[data-act]').forEach((b) => {
      b.addEventListener('click', () => {
        if (b.disabled) return;
        Audio2.resume();
        Audio2.cue('page');
        UI.action(b.getAttribute('data-act'), b.getAttribute('data-v'));
      });
    });
    this.screen.querySelectorAll('input[name="startMode"]').forEach((r) => {
      r.addEventListener('change', () => { if (r.checked) Career.setSkipPushback(r.value === 'pushback'); });
    });
    const first = this.screen.querySelector('.default:not([disabled])') || this.screen.querySelector('button');
    if (first && !isCoarsePointer()) first.focus({ preventScroll: true });
  },

  difficultyChips() {
    const s = Career.settings;
    return '<div class="setGroup"><span>' + tr('Difficulty') + '</span>' + ['easy', 'medium', 'hard'].map((d) =>
      '<button class="chip' + (s.difficulty === d ? ' on' : '') + '" data-act="difficulty" data-v="' + d + '">' +
      esc(tr(DIFFICULTY[d].name)) + '</button>').join('') + '</div>' +
      '<p class="fineprint">' + esc(tr(Career.difficulty.description)) + '</p>';
  },

  // the game's language, first thing on the title screen
  langChips() {
    return '<div class="setGroup langPick">' + Object.keys(LANGS).map((l) =>
      '<button class="chip' + (I18N.lang === l ? ' on' : '') + '" data-act="lang" data-v="' + l + '">' + esc(LANGS[l]) + '</button>').join('') + '</div>';
  },

  // ---------- title ----------
  showTitle() {
    if (Game.mode !== 'flying' && Game.mode !== 'paused') Game.mode = 'menu';
    const has = !!Career.data;
    const s = Career.settings;
    const qualBtns = ['auto', 'low', 'medium', 'high'].map((d) =>
      '<button class="chip' + (s.quality === d ? ' on' : '') + '" data-act="quality" data-v="' + d + '">' +
      esc(tr(d === 'auto' ? 'Auto' : QUALITY[d].name)) + '</button>').join('');
    this.panel(
      '<div class="titleWrap">' +
      this.langChips() +
      '<h1 class="logo">World Aviation</h1>' +
      '<p class="tagline">' + tr('A Swedish pilot, one leased turboprop — and the whole world to win, one region at a time.') + '</p>' +
      '<div class="cardRow">' +
      (has ? '<button class="bigBtn default" data-act="continue">' + tr('Continue career') + '<small>' + esc(Career.data.pilot.name) + ' · ' +
        fmtMoney(Career.data.money) + '</small></button>' +
        '<button class="bigBtn" data-act="newcareer">' + tr('New career') + '<small>' + tr('different pilot, fresh start') + '</small></button>'
        : '<button class="bigBtn default" data-act="newcareer">' + tr('Start your career') + '<small>' + tr('based at Stockholm Arlanda') + '</small></button>') +
      '</div>' +
      '<div class="settingsRow">' + this.difficultyChips() + '</div>' +
      '<div class="settingsRow">' +
      '<div class="setGroup"><span>' + tr('Graphics') + '</span>' + qualBtns + '</div>' +
      '<div class="setGroup"><span>' + tr('Sound') + '</span>' +
      '<button class="chip' + (s.sound ? ' on' : '') + '" data-act="sound">' + tr(s.sound ? 'On' : 'Off') + '</button></div>' +
      this.unitChips() + this.aidChip() +
      '</div>' +
      '<div class="titleFoot">' +
      '<button class="btn" data-act="howto">' + tr('How to fly') + '</button>' +
      (has ? '<button class="btn" data-act="wipe">' + tr('Delete career') + '</button>' : '') +
      '</div>' +
      '<p class="fineprint">' + esc(tr(CAREER.INTRO)) + '</p>' +
      '</div>', 'title');
  },

  showNewCareer() {
    this.panel(
      '<h2>' + tr('New career') + '</h2>' +
      '<p class="lead">' + tr('You have an EASA ATPL, one leased turboprop and a base at Stockholm Arlanda. What is your name?') + '</p>' +
      '<div class="form">' +
      '<label>' + tr('Pilot name') + '<input id="pilotName" value="' + esc(CAREER.PILOT_NAME_DEFAULT) + '" maxlength="24"></label>' +
      '</div>' +
      '<div class="settingsRow">' + this.difficultyChips() + '</div>' +
      '<div class="btnRow"><button class="btn default" data-act="startcareer">' + tr('Start flying') + '</button>' +
      '<button class="btn" data-act="back">' + tr('Back') + '</button></div>', 'narrow');
    this.screen.dataset.view = 'newcareer';
  },

  confirmWipe() {
    this.panel(
      '<h2>' + tr('Delete this career?') + '</h2><p class="lead">' + tr('The money, the reputation and every course you have passed will be gone.') + '</p>' +
      '<div class="btnRow"><button class="btn danger" data-act="wipeyes">' + tr('Delete it') + '</button>' +
      '<button class="btn default" data-act="back">' + tr('Keep it') + '</button></div>', 'narrow');
  },

  showHowTo() {
    this.panel(
      '<h2>' + tr('How to fly') + '</h2>' +
      '<div class="cols">' +
      '<div><h3>' + tr('Keyboard') + '</h3><ul class="keys">' +
      keyRow('↑ / ↓ · W / S', tr('pitch — ↓ pulls the nose up')) +
      keyRow('← / → · A / D', tr('roll — and steering on the ground')) +
      keyRow('Q / E', tr('rudder')) +
      keyRow('Z / X · − / +', tr('throttle down / up')) +
      keyRow('1 … 9, 0', tr('throttle to 10 % … 80 %, full power, idle')) +
      keyRow('Enter', tr('push back, start the engines, take-off clearance')) +
      keyRow('Space', tr('parking brake — release it to taxi')) +
      keyRow('G', tr('landing gear')) +
      keyRow('F / V', tr('flaps down / up')) +
      keyRow('B', tr('wheel brakes (hold)')) +
      keyRow('Space', tr('parking brake')) +
      keyRow('/', tr('spoiler: a speed brake in the air, in before the landing, out after touchdown so the brakes bite')) +
      keyRow('K', tr('engine and wing anti-ice')) +
      keyRow('Y', tr('autopilot on / off')) +
      keyRow('N', tr('autopilot NAV: fly the route and the ILS')) +
      keyRow(', / .', tr('selected altitude down / up')) +
      keyRow('; / \'', tr('selected heading (autopilot HDG mode)')) +
      keyRow('T / R', tr('time faster / slower: up to ×128 on the autopilot, by hand ×2 / ×4 / ×8 / ×16 / ×32 / ×64 above 1 000 / 3 000 / 6 000 / 8 000 / 9 000 / 10 000 ft')) +
      keyRow('C / M / I', tr('camera · map (on a big screen: mini, big, off) · instrument lights')) +
      keyRow('H', tr('controls card')) +
      keyRow('Esc', tr('pause')) +
      '</ul></div>' +
      '<div><h3>' + tr('Touch') + '</h3><ul>' +
      '<li>' + tr('The <b>left half</b> of the screen is a floating joystick: it appears where your thumb lands. Drag down to pull the nose up, left and right to roll — and to steer on the ground.') + '</li>' +
      '<li>' + tr('The <b>slider on the right edge</b> is the throttle — its lower half gives fine control of low power for taxiing.') + '</li>' +
      '<li>' + tr('The buttons at the top right: <b>Go</b> (push back, start, taxi, clearance), gear, flaps, brakes, parking brake, autopilot, <b>Time +</b> / <b>Time −</b> and the menu.') + '</li>' +
      '<li>' + tr('Tap the hint text to fold it to one line, tap again to open it.') + '</li>' +
      '<li>' + tr('Both thumbs work at once, so you can fly and work a checklist together.') + '</li>' +
      '</ul>' +
      '<h3>' + tr('How a flight goes') + '</h3><ul>' +
      '<li>' + tr('At the gate press Enter for the push back and to start the engines, release the parking brake with Space and taxi along the arrow to the holding point.') + '</li>' +
      '<li>' + tr('Set take-off flaps, ask for the clearance, line up, full power, rotate at Vr, gear up.') + '</li>' +
      '<li>' + tr('Engage the autopilot (Y): it flies the route in NAV mode, captures the ILS and descends on the glideslope. Speed up the time with T (slow it down with R) — up to ×128 on the autopilot.') + '</li>' +
      '<li>' + tr('When a warning sounds, a checklist opens: do the lit step with the control shown next to it — Enter (Go) for its switches, the real controls (0, K, G, /, Y…) for the rest. The clock is running.') + '</li>' +
      '<li>' + tr('Flaps and gear down on the approach, land by hand from 200 ft, brake, and leave the runway below 35 kt.') + '</li>' +
      '<li>' + tr('The <b>spoiler</b> (/) is a speed brake: out when you are too high or too fast on the descent, in again before the landing. After touchdown put it out with idle and the brakes — it puts the weight on the wheels, so they stop you sooner.') + '</li>' +
      '<li>' + tr('Taxi to your gate, stop in the parking box and set the parking brake.') + '</li>' +
      '</ul></div></div>' +
      '<div class="btnRow"><button class="btn default" data-act="back">' + tr('Got it') + '</button></div>');
  },

  // ---------- ops hub ----------
  showOps() {
    Game.mode = 'ops';
    Input.active = false;
    const d = Career.data;
    if (!d) { this.showTitle(); return; }
    const tabs = ['dispatch', 'network', 'hangar', 'training', 'career'];
    const body = this.tabBody();
    this.panel(
      '<div class="opsHead">' +
      '<div><div class="opsWho">' + esc(d.pilot.name) + '</div>' +
      '<div class="opsSub">' + CAREER.PILOT_LICENSE + ' · ' + tr('base {id}', { id: d.base }) +
      (d.lastTo && d.lastTo !== d.base ? ' · ' + tr('now at {id}', { id: d.lastTo }) : '') + '</div></div>' +
      '<div class="opsMoney">' + fmtMoney(d.money) + '</div>' +
      '<div class="opsReps">' +
      Object.keys(FACTIONS).map((k) =>
        '<span class="rep" title="' + esc(tr(FACTIONS[k].name)) + '"><i style="background:' + FACTIONS[k].color + '"></i>' +
        Math.round(d.rep[k]) + '</span>').join('') +
      '</div></div>' +
      '<div class="tabs">' + tabs.map((t) => {
        const b = this.tabBadge(t);
        return '<button class="tab' + (this.tab === t ? ' on' : '') + '" data-act="tab" data-v="' + t + '"' +
          (b ? ' title="' + esc(b.title) + '"' : '') + '>' + tr(t.charAt(0).toUpperCase() + t.slice(1)) + (b ? b.html : '') + '</button>';
      }).join('') +
      '<button class="tab" data-act="backtitle">' + tr('Menu') + '</button></div>' +
      '<div class="tabBody">' + body + '</div>');
  },

  // what a tab shows next to its name: the hangar counts the types you may lease; training and
  // the network get a gold dot when there is something you can do there right now
  tabBadge(t) {
    if (t === 'hangar') {
      const n = AIRCRAFT.filter((a) => Career.unlocked(a)).length;
      return { html: '<span class="tabCount">' + n + '</span>', title: tr('Aircraft types available: {n} of {m}', { n, m: AIRCRAFT.length }) };
    }
    if (t === 'training' && COURSES.some((c) => Career.courseState(c).available && Career.canAfford(c))) {
      return { html: '<i class="tabDot"></i>', title: tr('A course is open to you') };
    }
    if (t === 'network' && REGIONS.some((rg) => { const st = Career.regionState(rg); return st.available && st.afford; })) {
      return { html: '<i class="tabDot"></i>', title: tr('Traffic rights ready to buy') };
    }
    return null;
  },

  tabBody() {
    switch (this.tab) {
      case 'dispatch': return this.dispatchBody();
      case 'network': return this.networkBody();
      case 'hangar': return this.hangarBody();
      case 'training': return this.trainingBody();
      default: return this.careerBody();
    }
  },

  dispatchBody() {
    const d = Career.data;
    const ac = Career.aircraft();
    const list = (d.contracts || []).map((c) => {
      const from = World.byId[c.fromId], to = World.byId[c.toId];
      const need = this.requirement(c);
      return '<div class="contract' + (this.selContract === c.id ? ' sel' : '') + '">' +
        '<div class="cHead">' + clientLogo(c) + '<b>' + esc(c.client) + '</b><span class="tag ' + c.faction + '">' +
        esc(tr(FACTIONS[c.faction].short)) + '</span></div>' +
        '<div class="cRoute"><b>' + c.fromId + ' → ' + c.toId + '</b>' +
        '<span>' + flagImg(from) + esc(from.city) + ' → ' + flagImg(to) + esc(to.city) + '</span></div>' +
        '<div class="cGrid">' +
        row2(tr('Load'), loadText(c)) +
        row2(tr('Distance'), c.distanceNm + ' nm') +
        row2(tr('Payout'), fmtMoney(c.pay)) +
        row2(tr('Reputation'), '+' + c.repGain + ' ' + esc(tr(FACTIONS[c.faction].short))) +
        row2(tr('Schedule'), Career.difficulty.id === 'easy' ? tr('no deadline') : tr('{t} real time', { t: fmtTime(c.deadline) })) +
        row2(tr('Fuel plan'), c.fuelKg + ' kg') +
        '</div>' +
        '<div class="cFoot"><span class="diff' + (c.difficulty > 2.4 ? ' hard' : c.difficulty > 1.6 ? ' med' : '') + '">' + tr('difficulty {d}', { d: c.difficulty.toFixed(1) }) + '</span>' +
        (need ? '<span class="need">' + esc(need) + '</span>' : '<span class="ok">' + tr('cleared for this type') + '</span>') +
        '<button class="btn' + (need ? ' disabled' : ' default') + '" data-act="briefing" data-v="' + esc(c.id) + '"' +
        (need ? ' disabled' : '') + '>' + tr('Fly this') + '</button></div>' +
        '</div>';
    }).join('');
    const away = d.lastTo && d.lastTo !== d.base;
    return '<div class="hint">' + tr('Aircraft: <b>{ac}</b> ({klass} · max {nm} nm).', { ac: esc(ac.name), klass: esc(tr(ac.klass)), nm: ac.maxRangeNm }) + ' ' +
      (away ? tr('You are at {id} ({city}) — the board shows the flight home to {base} if it is in reach, and onward legs.', { id: d.lastTo, city: esc(World.byId[d.lastTo].city), base: d.base })
        : tr('From your base {base} · open regions: {n} — more in the Network tab.', { base: d.base, n: d.regions.length })) + '</div>' +
      '<div class="contracts">' + (list || '<p class="lead">' + tr('No contracts for this aircraft right now — try another type in the hangar.') + '</p>') + '</div>';
  },

  // the regions of the world and their traffic rights
  networkBody() {
    const d = Career.data;
    const cards = REGIONS.map((rg) => {
      const st = Career.regionState(rg);
      const apts = World.list.filter((a) => a.region === rg.id);
      const status = st.owned ? '<span class="ok">' + tr('Traffic rights held') + '</span>'
        : '<span class="' + (st.repOk ? 'ok' : 'need') + '">' + tr('reputation {a} / {b}', { a: Math.floor(Career.bestRep()), b: rg.rep }) + '</span>' +
          '<span class="' + (st.flightsOk ? 'ok' : 'need') + '">' + tr('flights {a} / {b}', { a: d.stats.flights, b: rg.flights }) + '</span>';
      const can = st.available && st.afford;
      const btn = st.owned ? '' : '<button class="btn' + (can ? ' default' : ' disabled') + '" data-act="buyRegion" data-v="' + rg.id + '"' +
        (can ? '' : ' disabled') + '>' + (st.available ? (st.afford ? tr('Buy the rights · {cost}', { cost: fmtMoney(rg.cost) }) : tr('Needs {cost}', { cost: fmtMoney(rg.cost) })) : tr('Locked')) + '</button>';
      return '<div class="acCard' + (st.owned ? ' sel' : '') + '">' +
        '<div class="acHead"><b>' + esc(tr(rg.name)) + '</b><span class="tag">' + tr('airports: {n}', { n: apts.length }) + '</span></div>' +
        '<p class="acBlurb">' + esc(tr(rg.blurb)) + '</p>' +
        '<p class="acBlurb">' + apts.map((a) => a.id).join(' · ') + '</p>' +
        '<div class="cFoot">' + status + btn + '</div></div>';
    }).join('');
    return '<div class="hint">' + tr('You start with Swedish domestic flying out of Arlanda. Each region of the world needs traffic rights: earn the reputation and the flights, then buy them. A leg may be up to {nm} nm — further than that, fly there in legs and the board offers onward flights.',
      { nm: CONTRACTS.MAX_NM.toLocaleString('en-US') }) + '</div><div class="cards">' + cards + '</div>';
  },

  requirement(c) {
    const ac = Career.aircraft();
    if (c.aircraftId && c.aircraftId !== ac.id) return tr('Offered for another aircraft type');
    if (c.payloadKg + ac.emptyKg > ac.mtow) return tr('Too heavy for {ac}', { ac: ac.name });
    if (c.distanceNm > ac.maxRangeNm) return tr('Beyond the range of {ac}', { ac: ac.name });
    if (c.type === 'hazmat' && !Career.effects().hazmat) return tr('Dangerous goods rating required');
    if (c.type === 'medevac' && !Career.effects().medevac) return tr('Medevac rating required');
    if ((c.type === 'reefer' || c.type === 'fish') && !Career.has('cargo3')) return tr('Arctic ground handling required');
    const to = World.byId[c.toId];
    if (to.rwyLen < ac.takeoffDist * 0.9) return tr('Runway at {id} too short for {ac}', { id: to.id, ac: ac.name });
    if (to.aptClass.length === 1 && to.aptClass[0] === 'bush' && ac.surfaces.indexOf('grass') < 0) return tr('Grass strip — not cleared for {ac}', { ac: ac.name });
    return null;
  },

  hangarBody() {
    const d = Career.data;
    const cards = AIRCRAFT.slice().sort((x, y) => x.mtow - y.mtow).map((a) => {
      const locked = !Career.unlocked(a);
      const sel = d.selected === a.id;
      const course = a.unlock ? COURSES.find((c) => c.id === a.unlock) : null;
      return '<div class="acCard' + (sel ? ' sel' : '') + '">' +
        '<div class="acHead"><b>' + esc(a.name) + '</b><span class="tag">' + esc(tr(a.klass)) + '</span></div>' +
        '<p class="acBlurb">' + esc(tr(a.blurb)) + '</p>' +
        '<div class="cGrid">' +
        row2(tr(a.seats < 10 ? 'Crew / payload' : 'Seats / payload'), a.seats + ' · ' + Math.round(a.payloadKg / 100) / 10 + ' t') +
        row2(tr('Weight: max take-off / empty'), fmtTonnes(a.mtow) + ' t · ' + fmtTonnes(a.emptyKg) + ' t') +
        row2(tr('Length / span'), a.dims.len + ' m · ' + a.dims.span + ' m') +
        row2(tr('Runway needed'), a.takeoffDist + ' m') +
        row2(tr('Cruise'), a.cruiseTas + ' kt') +
        row2(tr('Stall speed'), tr('{v} kt, full flaps, max weight', { v: Math.round(vs0Of(a, a.mtow)) })) +
        row2(tr('Range'), a.maxRangeNm + ' nm') +
        row2(tr('Crosswind limit'), a.crosswindLimit + ' kt') +
        row2(tr('Surfaces'), a.surfaces.map((x) => tr(x)).join(', ')) +
        row2(tr('Lease per block hour'), fmtMoney(a.rent)) +
        '</div>' +
        (locked
          ? '<div class="cFoot"><span class="need">' + tr('Locked — pass {course}', { course: esc(this.courseText(course).name) }) + '</span></div>'
          : '<div class="cFoot"><span class="ok">' + tr(sel ? 'Selected' : 'Available to lease') + '</span>' +
            (sel ? '' : '<button class="btn" data-act="selectAc" data-v="' + a.id + '">' + tr('Select') + '</button>') + '</div>') +
        '</div>';
    }).join('');
    return '<div class="hint">' + tr('Aircraft are leased for each sector — the rent is on every debrief. Bigger is not always better: a heavy jet needs runway, needs a rating, and costs more to lease.') +
      '</div><div class="cards">' + cards + '</div>';
  },

  // The course tree, in the game's language (the exams run in it too)
  trainingBody() {
    const lang = this.quizLang(), T = QUIZ_TEXT[lang];
    const columns = ['general', 'pax', 'cargo', 'bush'].map((b) => {
      const courses = COURSES.filter((c) => c.branch === b).sort((x, y) => x.tier - y.tier);
      const items = courses.map((c) => {
        const st = Career.courseState(c);
        const afford = Career.canAfford(c);
        const tx = this.courseText(c, lang);
        const status = st.bought ? '<span class="ok">' + esc(T.done) + '</span>'
          : st.lockedByCourse ? '<span class="need">' + esc(T.locked) + '</span>'
            : st.lockedByRep ? '<span class="need">' + esc(T.needRep.replace('{n}', c.rep).replace('{b}', T.branches[b === 'general' ? 'pax' : b])) + '</span>'
              : '<span class="price">' + (c.cost ? fmtMoney(c.cost) : esc(T.free)) + '</span>';
        const can = st.available && afford;
        const btn = st.bought ? '' : '<button class="btn small' + (can ? ' default' : ' disabled') + '" data-act="course" data-v="' + c.id + '"' +
          (can ? '' : ' disabled') + '>' + esc(st.available ? (afford ? T.take : T.noMoney) : T.locked) + '</button>';
        return '<div class="course' + (st.bought ? ' done' : '') + '">' +
          '<div class="coHead"><b>' + esc(tx.name) + '</b>' + status + '</div>' +
          '<p>' + esc(tx.blurb) + '</p>' +
          '<p class="effect">' + esc(tx.effect) + '</p>' + btn + '</div>';
      }).join('');
      return '<div class="branch"><h3>' + esc(T.branches[b]) + '</h3>' + items + '</div>';
    }).join('');
    return '<div class="hint">' + esc(T.intro) + '</div><div class="branches">' + columns + '</div>';
  },
  // a course's name, description and effect in the game's language (English from COURSES)
  courseText(c, lang) {
    lang = lang || this.quizLang();
    const t = COURSE_TEXT[lang] && COURSE_TEXT[lang][c.id];
    return t ? { name: t[0], blurb: t[1], effect: t[2] } : { name: c.name, blurb: c.blurb, effect: c.effect };
  },

  careerBody() {
    const d = Career.data;
    const fx = Career.effects();
    const s = d.stats;
    const licences = COURSES.filter((c) => Career.has(c.id)).map((c) => this.courseText(c).name);
    const log = (d.log || []).map((l) => '<li>' + esc(logText(l)) + '</li>').join('');
    return '<div class="careerCols"><div>' +
      '<h3>' + tr('Pilot') + '</h3>' +
      '<div class="cGrid">' + row2(tr('Name'), esc(d.pilot.name)) +
      row2(tr('Licence'), CAREER.PILOT_LICENSE) + row2(tr('Home base'), World.byId[d.base].name) +
      row2(tr('Balance'), fmtMoney(d.money)) + row2(tr('Difficulty'), esc(tr(Career.difficulty.name))) + '</div>' +
      '<h3>' + tr('Reputation') + '</h3>' +
      Object.keys(FACTIONS).map((k) => {
        const v = d.rep[k];
        return '<div class="repRow"><span>' + esc(tr(FACTIONS[k].name)) + '</span>' +
          '<div class="bar"><i style="width:' + v + '%;background:' + FACTIONS[k].color + '"></i></div>' +
          '<b>' + Math.round(v) + '</b></div>';
      }).join('') +
      '<h3>' + tr('Records') + '</h3>' +
      '<div class="cGrid">' + row2(tr('Flights flown'), s.flights) +
      row2(tr('Block time'), fmtTime(s.blockTime)) +
      row2(tr('Landings'), s.landings) +
      row2(tr('Smooth landings'), s.perfect) +
      row2(tr('Flights lost'), s.crashes) +
      row2(tr('Best grade'), s.bestGrade || '—') +
      row2(tr('Best single flight'), fmtMoney(s.bestPay)) +
      row2(tr('Cheats used'), s.cheats) + '</div>' +
      '</div><div><h3>' + tr('Licences and ratings') + '</h3><p class="licList">' +
      (licences.length ? licences.map(esc).join(' · ') : tr('none yet')) + '</p>' +
      '<h3>' + tr('Unlocked by your courses') + '</h3><ul class="unlocks">' +
      unlockLine(fx.hint, tr('Advanced systems — checklist hints and more time')) +
      unlockLine(fx.ifr, tr('Instrument rating — you may fly into low cloud and use the ILS')) +
      unlockLine(fx.hazmat, tr('Dangerous goods contracts')) +
      unlockLine(fx.payloadTol > 1, tr('Weight and balance — 15 % more payload before you are over weight')) +
      unlockLine(fx.iceFactor < 1, tr('De-icing — ice builds {p} % slower', { p: Math.round((1 - fx.iceFactor) * 100) })) +
      unlockLine(fx.medevac, tr('Medevac and search and rescue contracts')) +
      unlockLine(fx.forecast, tr('Full weather reports at both ends, and better fuel planning')) +
      unlockLine(fx.mountain, tr('Mountain and adverse weather routes')) +
      unlockLine(fx.widebody, tr('Widebody procedures — the Airbus A350-900')) +
      unlockLine(fx.remote, tr('Remote strips and ice fields for every type')) +
      '</ul>' +
      '<h3>' + tr('Log') + '</h3><ul class="log">' + (log || '<li>' + tr('Nothing yet.') + '</li>') + '</ul>' +
      '<div class="btnRow"><button class="btn" data-act="backtitle">' + tr('Title screen') + '</button>' +
      '<button class="btn danger" data-act="wipe">' + tr('Delete career') + '</button></div>' +
      '</div></div>';
  },

  // ---------- briefing ----------
  showBriefing(contractId) {
    const c = Career.contractById(contractId);
    if (!c) return;
    const ac = Career.aircraft();
    if (this.requirement(c)) { this.showOps(); return; }
    Game.mode = 'briefing';
    this.selContract = c.id;
    const from = World.byId[c.fromId], to = World.byId[c.toId];
    const setup = Career.flightSetup(c, { seed: 0 });
    const fee = Career.practiceFee();
    const w = (x, a) => {
      const wind = tr('{v} kt from {d}°', { v: Math.round(x.speed), d: String(Math.round(x.dir)).padStart(3, '0') }) +
        (x.gust > 2 ? ', ' + tr('gusting {v}', { v: Math.round(x.speed + x.gust) }) : '');
      const cross = Math.abs(Math.sin((x.dir - a.hdgDeg) * DEG) * x.speed);
      return '<tr><td>' + tr('Runway in use') + '</td><td>' + a.rwyName + ' · ' + a.rwyLen + ' m</td></tr>' +
        '<tr><td>' + tr('Wind') + '</td><td>' + wind + (cross > 4 ? ' · ' + tr('crosswind {v} kt', { v: Math.round(cross) }) : '') + '</td></tr>' +
        '<tr><td>QNH</td><td>' + x.qnh + ' hPa</td></tr>' +
        '<tr><td>' + tr('Visibility') + '</td><td>' + (x.vis / 1000).toFixed(1) + ' km</td></tr>' +
        '<tr><td>' + tr('Cloud') + '</td><td>' + tr('base {b} ft, tops {t} ft', { b: fmtAlt(x.cloudBase), t: fmtAlt(x.cloudTop) }) + '</td></tr>' +
        '<tr><td>' + tr('Temperature') + '</td><td>' + Math.round(x.temp) + ' °C' + (x.snow ? ' · ' + tr('snow') : x.precip === 'rain' ? ' · ' + tr('rain') : '') + '</td></tr>' +
        (x.icing ? '<tr><td>' + tr('ICING') + '</td><td>' + tr('expected in cloud — anti-ice K') + '</td></tr>' : '') +
        (x.stormy ? '<tr><td>' + tr('WIND') + '</td><td>' + tr('stormy — expect turbulence and shear') + '</td></tr>' : '');
    };
    this.panel(
      '<h2 class="clientHead">' + clientLogo(c, true) + esc(c.client) + '</h2>' +
      '<div class="briefTop"><div class="bigRoute">' + c.fromId + ' → ' + c.toId + '</div>' +
      '<div class="bigPay">' + fmtMoney(c.pay) + '</div></div>' +
      '<div class="briefCols"><div>' +
      '<h3>' + flagImg(from) + esc(from.name) + ' · ' + from.id + '</h3><table class="wx">' + w(setup.weather.dep, from) + '</table>' +
      '<h3>' + flagImg(to) + esc(to.name) + ' · ' + to.id + '</h3><table class="wx">' + w(setup.weather.arr, to) + '</table>' +
      '<p class="fineprint">' + (setup.weather.arr.vis < 3000
        ? tr('Low visibility at {id} — fly the ILS, the autopilot can couple to it down to 200 ft.', { id: to.id })
        : tr('Visibility is good for the approach at {id}.', { id: to.id })) + '</p>' +
      '</div><div>' +
      '<h3>' + tr('The job') + '</h3><div class="cGrid">' +
      row2(tr('Aircraft'), esc(ac.name) + ' · ' + esc(tr(ac.klass))) +
      row2(tr('Load'), loadText(c)) +
      row2(tr('Distance'), c.distanceNm + ' nm') +
      row2(tr('En route'), tr('about {m} min at 1× — use the autopilot and time acceleration', { m: c.blockMin })) +
      row2(tr('Deadline'), Career.difficulty.id === 'easy' ? tr('none') : tr('{t} of real time', { t: fmtTime(c.deadline) })) +
      row2(tr('Fuel'), tr('plan {p} kg · on board {b} kg', { p: c.fuelKg, b: Math.round(setup.blockFuel) })) +
      row2(tr('Take-off weight'), tr('{w} t · max {m} t', { w: fmtTonnes(ac.emptyKg + c.payloadKg + setup.blockFuel), m: fmtTonnes(ac.mtow) })) +
      row2(tr('Reputation'), '+' + c.repGain + ' ' + esc(tr(FACTIONS[c.faction].short))) +
      row2(tr('Lease'), '−' + fmtMoney(ac.rent)) +
      '</div>' +
      '<h3>' + tr('Departure time') + '</h3>' +
      '<div class="setGroup todPick">' + Object.keys(TIME_OF_DAY).map((k) => {
        const d = TIME_OF_DAY[k];
        return '<button class="chip' + (Career.timeOfDay === k ? ' on' : '') + '" data-act="tod" data-v="' + k + '">' +
          esc(tr(d.name)) + ' ' + fmtClock(d.hour * 3600) + (d.bonus ? ' · +' + fmtMoney(Math.round(c.pay * d.bonus)) : '') + '</button>';
      }).join('') + '</div>' +
      '<p class="fineprint">' + tr('In the dark the runway is its lights, the PAPI and your landing lights: harder, and paid more.') + '</p>' +
      '<h3>' + tr('How you start') + '</h3>' +
      '<label class="check"><input type="radio" name="startMode" value="gate"' + (Career.skipPushback ? '' : ' checked') + '> ' +
      tr('At the gate — push back, start the engines, taxi out: +{bonus} and reputation for the full ground procedure', { bonus: fmtMoney(Math.round(c.pay * CONTRACTS.FULL_GROUND_BONUS)) }) + '</label>' +
      '<label class="check"><input type="radio" name="startMode" value="pushback"' + (Career.skipPushback ? ' checked' : '') + '> ' +
      tr('After pushback — the tug has taken you to the holding point: about 5 minutes less on the ground, no procedure bonus') + '</label>' +
      '<p class="fineprint">' + tr('The full procedure is the real routine of the job; take the short start when you just want to fly. Your choice is remembered.') + '</p>' +
      '<div class="btnRow"><button class="btn default" data-act="fly">' + tr('Fly it') + '</button>' +
      '<button class="btn" data-act="practice"' + (Career.data.money < fee ? ' disabled' : '') + '>' +
      tr('Practice the landing · {fee}', { fee: fmtMoney(fee) }) + '</button>' +
      '<button class="btn" data-act="tab" data-v="dispatch">' + tr('Back to the board') + '</button></div>' +
      '<p class="fineprint">' + tr('Practice the landing: you start on the final at {id}, clean (gear and flaps up), the autopilot holds the glide path for {s} s and hands over {nm} nm out, then you lower the gear and the flaps, land and brake below {v} kt. Nothing is lost if it goes wrong; a good landing earns a little reputation with {who}.',
        { nm: PRACTICE.HANDOVER_NM, id: to.id, s: PRACTICE.AP_SECONDS, v: SIM.ROLLOUT_EXIT_KT, who: esc(tr(FACTIONS[c.faction].name)) }) + '</p>' +
      '</div></div>');
  },

  // ---------- the practice landing's result ----------
  showPracticeResult(r) {
    Input.active = false;
    const c = r.contract;
    const gradeCls = 'grade' + (!r.ok ? ' bad' : r.grade === 'A+' || r.grade === 'A' ? ' top' : r.grade === 'F' || r.grade === 'E' ? ' bad' : '');
    const best = c.practiceRep || 0;
    const repLine = r.rep > 0
      ? tr('Reputation with {who}', { who: esc(tr(FACTIONS[c.faction].name)) }) + ': <b>+' + r.rep.toFixed(1) + '</b>'
      : !r.ok ? tr('No penalty: a practice costs only its fee.')
        : !PRACTICE.REP[r.grade] ? tr('Grade C or better earns a little reputation.')
          : tr('No new reputation: a practice on this contract already earned it (a better grade earns more).');
    this.panel(
      '<div class="debriefTop">' +
      '<div class="' + gradeCls + '">' + (r.ok ? r.grade : '—') + '</div>' +
      '<div class="debriefTitle">' + tr('Practice landing · {id} runway {rwy}', { id: c.toId, rwy: Game.flight ? Game.flight.arrival.rwyName : '' }) +
      (r.ok ? '' : '<br>' + esc(r.reason)) + '</div>' +
      '</div>' +
      (r.ok ? '<h3>' + tr('Touchdown') + '</h3>' + touchdownGrid(r.landed) : '') +
      '<p class="repGain">' + repLine + '</p>' +
      (r.cheated ? '<p class="need">' + tr('Cheats used — no pay, no reputation, no records') + '</p>' : '') +
      '<p class="fineprint">' + tr('Practice fee {fee}', { fee: fmtMoney(r.fee) }) +
      (best ? ' · ' + tr('best practice on this contract: +{r} reputation', { r: best.toFixed(1) }) : '') + '</p>' +
      '<div class="btnRow">' +
      '<button class="btn default" data-act="practice"' + (Career.data.money < Career.practiceFee() ? ' disabled' : '') + '>' +
      tr('Try again · {fee}', { fee: fmtMoney(Career.practiceFee()) }) + '</button>' +
      '<button class="btn" data-act="brief">' + tr('Back to the briefing') + '</button>' +
      '<button class="btn" data-act="fly">' + tr('Fly it for real') + '</button>' +
      '</div>', 'narrow');
  },

  // ---------- debrief ----------
  showDebrief(result, failed) {
    Input.active = false;
    const p = result.payout || { lines: [], total: 0 };
    const landed = Game.flight && Game.flight.landed;
    const gradeCls = 'grade' + (result.grade === 'A+' || result.grade === 'A' ? ' top' : result.grade === 'F' || result.grade === 'E' ? ' bad' : '');
    const body =
      '<div class="debriefTop">' +
      '<div class="' + gradeCls + '">' + (failed ? tr('LOST') : result.grade) + '</div>' +
      '<div class="debriefTitle">' + (failed ? esc(Game.failure ? Game.failure.text : tr('The flight was lost'))
        : tr('Flight complete · {from} → {to}', { from: result.contract.fromId, to: result.contract.toId })) + '</div>' +
      '</div>' +
      (failed ? '' :
        '<div class="cols"><div><h3>' + tr('Touchdown') + '</h3>' + touchdownGrid(landed) +
        '</div><div><h3>' + tr('In the log') + '</h3><ul class="unlocks">' +
        '<li>' + tr('Block time {b} · real time {r}', { b: fmtTime(result.blockSec), r: fmtTime(result.realSec) }) + ' · ' + tr(result.onTime ? 'on time' : 'late') + '</li>' +
        '<li>' + tr('Fuel used {kg} kg (plan {p} kg)', { kg: Math.round(result.fuelUsed), p: result.contract.fuelKg }) + '</li>' +
        '<li>' + tr('Checklists: {a} worked, {b} mishandled', { a: result.handled, b: result.mishandled }) + '</li>' +
        '<li>' + tr('Damage {p} %', { p: Math.round(result.damage * 100) }) + '</li>' +
        (result.cheated ? '<li class="need">' + tr('Cheats used — no pay, no reputation, no records') + '</li>' : '') +
        '</ul></div></div>') +
      '<h3>' + tr('Invoice') + '</h3><table class="money">' +
      p.lines.map((l) => '<tr><td>' + esc(tr(l.label, l.args)) + '</td><td class="' + (l.value < 0 ? 'neg' : '') + '">' +
        (l.value < 0 ? '−' : '') + fmtMoney(Math.abs(l.value)) + '</td></tr>').join('') +
      '<tr class="total"><td>' + tr(p.total < 0 ? 'Cost to you' : 'Paid to you') + '</td><td>' +
      (p.total < 0 ? '−' : '') + fmtMoney(Math.abs(p.total)) + '</td></tr>' +
      '</table>' +
      (p.rep ? '<p class="repGain">' + tr('Reputation with {who}', { who: esc(tr(FACTIONS[result.contract.faction].name)) }) +
        ': <b>' + (p.rep > 0 ? '+' : '') + p.rep.toFixed(1) + '</b></p>' : '') +
      (p.bankrupt ? '<p class="need">' + tr('Your balance is below −50 000 kr. Nobody will lease you an aeroplane any more — this career is over.') + '</p>' : '') +
      '<div class="settingsRow">' + this.difficultyChips() + '</div>' +
      '<div class="btnRow">' +
      (p.bankrupt ? '<button class="btn default" data-act="gameover">' + tr('Start again') + '</button>'
        : failed ? '<button class="btn default" data-act="retry">' + tr('Try again') + '</button><button class="btn" data-act="ops">' + tr('Back to ops') + '</button>'
          : '<button class="btn default" data-act="ops">' + tr('Next flight') + '</button>') +
      '</div>';
    this.panel(body, 'debrief');
  },

  // ---------- pause ----------
  showPause() {
    const fl = Game.flight;
    this.panel(
      '<h2>' + tr('Paused') + '</h2>' +
      '<p class="lead">' + (fl ? esc(fl.contract.client) + ' · ' + fl.contract.fromId + ' → ' + fl.contract.toId : '') + '</p>' +
      '<div class="btnRow"><button class="btn default" data-act="resume">' + tr('Resume') + '</button>' +
      '<button class="btn" data-act="restart">' + tr('Restart this flight') + '</button>' +
      '<button class="btn" data-act="howto2">' + tr('Controls') + '</button>' +
      '<button class="btn" data-act="ops">' + tr('Abandon, back to ops') + '</button></div>' +
      '<div class="settingsRow">' + this.difficultyChips() + this.unitChips() + this.aidChip() + '</div>' +
      '<p class="fineprint">' + tr('Esc, Space or Enter resumes. A new difficulty applies from the next flight or the restart.') + '</p>', 'narrow');
  },

  // aviation units (ft, kt, nm) or metric (m, km/h, km)
  unitChips() {
    const u = Career.settings.units === 'metric' ? 'metric' : 'aviation';
    return '<div class="setGroup"><span>' + tr('Units') + '</span>' +
      '<button class="chip' + (u === 'aviation' ? ' on' : '') + '" data-act="units" data-v="aviation" title="' + esc(tr('feet, knots, nautical miles')) + '">ft · kt · nm</button>' +
      '<button class="chip' + (u === 'metric' ? ' on' : '') + '" data-act="units" data-v="metric" title="' + esc(tr('metres, km/h, kilometres')) + '">m · km/h · km</button></div>';
  },

  // the landing aid: the ILS scales with plain words and the dotted glide path on the approach
  aidChip() {
    const on = Career.settings.landingAid !== false;
    return '<div class="setGroup"><span>' + tr('Landing aid') + '</span>' +
      '<button class="chip' + (on ? ' on' : '') + '" data-act="landingAid" title="' + esc(tr('the ILS scales and the dotted glide path on the approach')) + '">' +
      tr(on ? 'On' : 'Off') + '</button></div>';
  },

  // ---------- quiz ----------
  // Four questions from the course's pool, the options shuffled; in the game's language
  // (English, Russian or Swedish).
  // A hint can be shown before answering, and after each answer the explanation follows.
  showQuiz(courseId) {
    const course = COURSES.find((c) => c.id === courseId);
    const st = Career.courseState(course);
    if (!st.available || !Career.canAfford(course)) { this.showOps(); return; }
    const pool = (QUIZZES[courseId] || []).slice();
    const rng = makeRng(hashStr(courseId) ^ Date.now());
    const questions = rng.shuffle(pool).slice(0, Math.min(4, pool.length))
      .map((item) => ({ item, order: rng.shuffle([1, 2, 3]) }));
    this.quiz = { course, questions, index: 0, correct: 0, hint: false, answer: null };
    this.renderQuiz();
  },
  quizLang() { return QUIZ_TEXT[I18N.lang] ? I18N.lang : 'en'; },
  renderQuiz() {
    const q = this.quiz;
    if (!q) return;
    const lang = this.quizLang(), T = QUIZ_TEXT[lang], tx = this.courseText(q.course, lang);
    if (q.index >= q.questions.length) {
      const pass = q.correct >= 3 || q.questions.length === 0;
      if (pass && !q.paid) { Career.buyCourse(q.course); q.paid = true; Audio2.cue('good'); }
      if (!pass && !q.told) { q.told = true; Audio2.cue('bad'); }
      this.panel('<h2>' + esc(tx.name) + '</h2>' +
        '<p class="lead">' + (pass
          ? esc(T.passed) + ' — ' + q.correct + ' / ' + q.questions.length + ' ' + esc(T.correct) + '.' +
            (q.course.cost ? ' ' + esc(T.fee) + ' ' + fmtMoney(q.course.cost) + '.' : '')
          : esc(T.failed) + ' — ' + q.correct + ' / ' + q.questions.length + ' ' + esc(T.correct) + '. ' + esc(T.need)) + '</p>' +
        (pass ? '<p class="ok">' + esc(tx.effect) + '</p>' : '') +
        '<div class="btnRow">' + (pass ? '<button class="btn default" data-act="quizdone">' + esc(T.back) + '</button>'
          : '<button class="btn default" data-act="course" data-v="' + q.course.id + '">' + esc(T.again) + '</button>' +
          '<button class="btn" data-act="quizdone">' + esc(T.giveUp) + '</button>') + '</div>', 'narrow');
      return;
    }
    const { item, order } = q.questions[q.index];
    const L = item[lang] || item.en;
    const ans = q.answer;                               // null, or the option (1..3) picked
    const opts = order.map((k) => {
      let cls = 'opt';
      if (ans !== null) cls += k === 1 ? ' right' : k === ans ? ' wrong' : ' dim';
      return '<button class="' + cls + '" data-act="answer" data-v="' + k + '"' + (ans !== null ? ' disabled' : '') + '>' + esc(L[k]) + '</button>';
    }).join('');
    const after = ans === null ? ''
      : '<div class="quizNote ' + (ans === 1 ? 'good' : 'bad') + '"><b>' + esc(ans === 1 ? T.right : T.wrong + ' ' + L[1]) + '</b><br>' + esc(L[4]) + '</div>';
    this.panel(
      '<h2>' + esc(tx.name) + '</h2>' +
      '<div class="quizHead">' + esc(T.question) + ' ' + (q.index + 1) + ' ' + esc(T.of) + ' ' + q.questions.length +
      ' · ' + esc(T.pass) + ' 3</div>' +
      '<p class="qText">' + esc(L[0]) + '</p>' + opts +
      (ans === null && q.hint ? '<div class="quizNote">' + esc(L[4]) + '</div>' : '') + after +
      '<div class="btnRow">' +
      (ans === null
        ? (q.hint ? '' : '<button class="btn" data-act="quizHint">💡 ' + esc(T.hint) + '</button>')
        : '<button class="btn default" data-act="quizNext">' + esc(T.next) + '</button>') +
      '<button class="btn" data-act="quitquiz">' + esc(T.giveUp) + '</button></div>', 'narrow');
  },

  // ---------- every button ----------
  action(name, v) {
    switch (name) {
      case 'continue': enterFullscreen(); Game.mode = 'ops'; this.showOps(); break;
      case 'newcareer': this.showNewCareer(); break;
      case 'startcareer': {
        const pilot = (el('pilotName') || {}).value || '';
        reseed(hashStr(pilot) ^ Date.now());
        Career.new({ pilot });
        enterFullscreen();
        this.tab = 'dispatch';
        this.showOps();
        break;
      }
      case 'difficulty':
        Career.settings.difficulty = v; Career.saveSettings();
        if (Career.data && (Game.mode === 'menu' || Game.mode === 'debrief' || Game.mode === 'failed')) Career.generateContracts();
        this.refresh();
        break;
      case 'quality':
        Career.settings.quality = v; Career.saveSettings();
        Game.quality = pickQuality(v); Scene3D.setQuality(Game.quality);
        this.showTitle();
        break;
      case 'sound':
        Career.settings.sound = !Career.settings.sound; Career.saveSettings();
        Audio2.setMuted(!Career.settings.sound);
        this.showTitle();
        break;
      case 'units':
        Career.settings.units = v; Career.saveSettings();
        Units.metric = v === 'metric';
        if (Game.mode === 'paused') this.showPause(); else this.showTitle();
        break;
      case 'landingAid':
        Career.settings.landingAid = Career.settings.landingAid === false; Career.saveSettings();
        if (Game.mode === 'paused') this.showPause(); else this.showTitle();
        break;
      case 'howto': this.backTo = 'title'; this.showHowTo(); break;
      case 'howto2': this.backTo = 'pause'; this.showHowTo(); break;
      case 'wipe': this.confirmWipe(); break;
      case 'wipeyes': Career.reset(); this.showTitle(); break;
      case 'back':
        if (this.backTo === 'pause' && Game.mode === 'paused') { this.backTo = null; this.showPause(); }
        else this.showTitle();
        break;
      case 'backtitle': Game.mode = 'menu'; this.showTitle(); break;
      case 'tab': this.tab = v; this.showOps(); break;
      case 'briefing': this.showBriefing(v); break;
      case 'selectAc': Career.select(v); this.showOps(); break;
      case 'buyRegion': if (Career.buyRegion(v)) Audio2.cue('good'); this.showOps(); break;
      case 'course': this.showQuiz(v); break;
      case 'answer': {
        const q = this.quiz;
        if (!q || q.answer !== null) break;
        q.answer = parseInt(v, 10);
        if (q.answer === 1) q.correct++;
        Audio2.cue(q.answer === 1 ? 'resolved' : 'bad');
        this.renderQuiz();
        break;
      }
      case 'quizHint': if (this.quiz) { this.quiz.hint = true; this.renderQuiz(); } break;
      case 'quizNext':
        if (this.quiz) { this.quiz.index++; this.quiz.answer = null; this.quiz.hint = false; this.renderQuiz(); }
        break;
      case 'lang':
        Career.settings.lang = v; Career.saveSettings();
        I18N.set(v);
        this.refresh();
        break;
      case 'quizdone': this.quiz = null; this.tab = 'training'; this.showOps(); break;
      case 'quitquiz': this.quiz = null; this.tab = 'training'; this.showOps(); break;
      case 'fly': {
        const c = Career.contractById(this.selContract);
        if (!c) { this.showOps(); break; }
        this.lastContract = c;
        enterFullscreen();
        Game.launch(c, { skipPushback: Career.skipPushback });
        break;
      }
      case 'practice': {
        // from the briefing or the practice result: the same contract, a new paid session
        const c = Career.contractById(this.selContract) || this.lastContract;
        if (!c) { this.showOps(); break; }
        if (Career.data.money < Career.practiceFee()) break;
        this.lastContract = c;
        const fee = Career.payPractice();
        enterFullscreen();
        Game.mode = 'ops';
        Game.launch(c, { practice: true, fee });
        break;
      }
      case 'brief': this.showBriefing(this.selContract); break;
      case 'tod': Career.setTimeOfDay(v); this.showBriefing(this.selContract); break;
      case 'retry':
        if (this.lastContract) { enterFullscreen(); Game.launch(this.lastContract, { skipPushback: Career.skipPushback }); }
        break;
      case 'ops': Game.abortToOps(); break;
      case 'resume': Game.pause(); break;
      case 'restart':
        // a practice restarts as a practice (a new session, paid again)
        if (Game.contract && Game.practice) { this.selContract = Game.contract.id; this.action('practice'); }
        else if (Game.contract) { Game.mode = 'ops'; Game.launch(Game.contract, { skipPushback: Career.skipPushback }); }
        break;
      case 'gameover': Career.reset(); Game.mode = 'menu'; this.showTitle(); break;
      default: break;
    }
  },

  // re-render whichever screen is showing (after a setting changed)
  refresh() {
    if (Game.mode === 'paused') this.showPause();
    else if (Game.mode === 'practice' && Game.result) this.showPracticeResult(Game.result);
    else if ((Game.mode === 'debrief' || Game.mode === 'failed') && Game.result) this.showDebrief(Game.result, Game.mode === 'failed');
    else if (this.screen.dataset.view === 'newcareer' && el('pilotName')) {
      const pn = el('pilotName').value;
      this.showNewCareer();
      el('pilotName').value = pn;
    } else this.showTitle();
  }
};

// the touchdown numbers, in the debrief and after a practice landing
function touchdownGrid(landed) {
  return '<div class="cGrid">' +
    row2(tr('Vertical speed'), (landed ? landed.fpm : 0) + ' fpm') +
    row2(tr('Speed'), (landed ? landed.ias : 0) + ' kt (Vref ' + (landed ? landed.vref : 0) + ')') +
    row2(tr('From the threshold'), (landed ? landed.fromThr : 0) + ' m') +
    row2(tr('Off the centreline'), (landed ? Math.abs(landed.offset) : 0) + ' m') +
    row2(tr('Bank / crab'), (landed ? Math.round(landed.bank) + '° / ' + Math.abs(landed.crab) + '°' : '—')) +
    row2(tr('Surface'), landed ? esc(tr(landed.surf)) : '—') +
    '</div>';
}

function loadText(c) {
  const kg = Math.round(c.payloadKg).toLocaleString('sv-SE');
  return c.type === 'pax' ? tr('{n} passengers · {kg} kg', { n: c.pax, kg })
    : kg + ' ' + esc(tr(c.payloadLabel)) + (c.pax ? ' · ' + tr('{n} on board', { n: c.pax }) : '');
}
// a career log line in the language of the day (old saves: the English text)
function logText(l) {
  if (!l.tpl) return l.text;
  const args = {};
  for (const k in l.args) args[k] = typeof l.args[k] === 'string' ? tr(l.args[k]) : l.args[k];
  return tr(l.tpl, args);
}
function row2(k, v) { return '<div class="row2"><span>' + esc(k) + '</span><b>' + v + '</b></div>'; }
function keyRow(k, d) { return '<li><kbd>' + esc(k) + '</kbd> ' + esc(d) + '</li>'; }
function unlockLine(on, text) { return '<li class="' + (on ? 'ok' : '') + '">' + (on ? '✓ ' : '· ') + esc(text) + '</li>'; }
function vs0Of(a, kg) {
  const cl = a.clMaxClean + a.flaps[a.flaps.length - 1].cl;
  return Math.sqrt(2 * kg * SIM.GRAVITY / (SIM.RHO_SL * a.wingArea * cl)) / KTS;
}

// the client airline's logo (art/emblems.js) and an airport's national flag (art/flags.js)
function clientLogo(c, big) {
  if (!c.airline || !AIRLINE_BY_CODE[c.airline]) return '';
  return '<img class="logo' + (big ? ' big' : '') + '" src="' + Emblems.url(c.airline) + '" alt="">';
}
function flagImg(apt) {
  return '<img class="flag" src="' + Flags.url(apt.country) + '" alt="" title="' + esc(apt.country) + '">';
}
