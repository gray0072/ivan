'use strict';

// ============================================================
// World Aviation — screens: title, the ops hub (dispatch, hangar,
// training, career), the briefing, the debrief, failures, pause
// and the course quizzes. Plain DOM, all copy in English.
// Every button carries data-act (and data-v); UI.action routes them.
// ============================================================

const UI = {
  screen: null, tab: 'dispatch', selContract: null, skipPushback: false, quiz: null, lastContract: null,

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
        const along = (bx - fx) * dx + (by - fy) * dy;
        if (along <= 1) continue;
        const cross = Math.abs((bx - fx) * dy - (by - fy) * dx);
        const s = along + cross * 2;
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
    this.screen.innerHTML = '<div class="panel ' + (cls || '') + '">' + html + '</div>';
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
      r.addEventListener('change', () => { UI.skipPushback = r.value === 'pushback' && r.checked; });
    });
    const first = this.screen.querySelector('.default:not([disabled])') || this.screen.querySelector('button');
    if (first && !isCoarsePointer()) first.focus({ preventScroll: true });
  },

  difficultyChips() {
    const s = Career.settings;
    return '<div class="setGroup"><span>Difficulty</span>' + ['easy', 'medium', 'hard'].map((d) =>
      '<button class="chip' + (s.difficulty === d ? ' on' : '') + '" data-act="difficulty" data-v="' + d + '">' +
      DIFFICULTY[d].name + '</button>').join('') + '</div>' +
      '<p class="fineprint">' + esc(Career.difficulty.description) + '</p>';
  },

  // ---------- title ----------
  showTitle() {
    if (Game.mode !== 'flying' && Game.mode !== 'paused') Game.mode = 'menu';
    const has = !!Career.data;
    const s = Career.settings;
    const qualBtns = ['auto', 'low', 'medium', 'high'].map((d) =>
      '<button class="chip' + (s.quality === d ? ' on' : '') + '" data-act="quality" data-v="' + d + '">' +
      (d === 'auto' ? 'Auto' : QUALITY[d].name) + '</button>').join('');
    this.panel(
      '<div class="titleWrap">' +
      '<h1 class="logo">World Aviation</h1>' +
      '<p class="tagline">A Swedish pilot, one leased turboprop — and the whole world to win, one region at a time.</p>' +
      '<div class="cardRow">' +
      (has ? '<button class="bigBtn default" data-act="continue">Continue career<small>' + esc(Career.data.pilot.airline) + ' · ' +
        fmtMoney(Career.data.money) + '</small></button>' +
        '<button class="bigBtn" data-act="newcareer">New career<small>different pilot, new certificate</small></button>'
        : '<button class="bigBtn default" data-act="newcareer">Start your career<small>based at Stockholm Arlanda</small></button>') +
      '</div>' +
      '<div class="settingsRow">' + this.difficultyChips() + '</div>' +
      '<div class="settingsRow">' +
      '<div class="setGroup"><span>Graphics</span>' + qualBtns + '</div>' +
      '<div class="setGroup"><span>Sound</span>' +
      '<button class="chip' + (s.sound ? ' on' : '') + '" data-act="sound">' + (s.sound ? 'On' : 'Off') + '</button></div>' +
      '</div>' +
      '<div class="titleFoot">' +
      '<button class="btn" data-act="howto">How to fly</button>' +
      (has ? '<button class="btn" data-act="wipe">Delete career</button>' : '') +
      '</div>' +
      '<p class="fineprint">' + esc(CAREER.INTRO) + '</p>' +
      '</div>', 'title');
  },

  showNewCareer() {
    this.panel(
      '<h2>New career</h2>' +
      '<p class="lead">You have an EASA ATPL, one leased turboprop and a fresh operator certificate out of Stockholm Arlanda. ' +
      'Fill this in:</p>' +
      '<div class="form">' +
      '<label>Pilot name<input id="pilotName" value="' + esc(CAREER.PILOT_NAME_DEFAULT) + '" maxlength="24"></label>' +
      '<label>Operator name<input id="airlineName" value="' + esc(CAREER.AIRLINE_DEFAULT) + '" maxlength="24"></label>' +
      '</div>' +
      '<div class="settingsRow">' + this.difficultyChips() + '</div>' +
      '<div class="btnRow"><button class="btn default" data-act="startcareer">Start flying</button>' +
      '<button class="btn" data-act="back">Back</button></div>', 'narrow');
    this.screen.dataset.view = 'newcareer';
  },

  confirmWipe() {
    this.panel(
      '<h2>Delete this career?</h2><p class="lead">The certificate, the money, the reputation and every course you have passed will be gone.</p>' +
      '<div class="btnRow"><button class="btn danger" data-act="wipeyes">Delete it</button>' +
      '<button class="btn default" data-act="back">Keep it</button></div>', 'narrow');
  },

  showHowTo() {
    this.panel(
      '<h2>How to fly</h2>' +
      '<div class="cols">' +
      '<div><h3>Keyboard</h3><ul class="keys">' +
      keyRow('↑ / ↓ or W / S', 'pitch — ↓ pulls the nose up') +
      keyRow('← / → or A / D', 'roll — and steering on the ground') +
      keyRow('Q / E', 'rudder') +
      keyRow('Z / X, or − / +', 'throttle down / up') +
      keyRow('1 … 9, 0', 'throttle to 10 % … 90 %, idle') +
      keyRow('Enter', 'push back, start the engines, taxi, take-off clearance') +
      keyRow('G', 'landing gear') +
      keyRow('F / V', 'flaps down / up') +
      keyRow('B', 'wheel brakes (hold)') +
      keyRow('Space', 'parking brake') +
      keyRow('R', 'spoiler') +
      keyRow('K', 'engine and wing anti-ice') +
      keyRow('Y', 'autopilot on / off') +
      keyRow('N', 'autopilot NAV: fly the route and the ILS') +
      keyRow(', / .', 'selected altitude down / up') +
      keyRow('; / \'', 'selected heading (autopilot HDG mode)') +
      keyRow('T', 'time acceleration (autopilot needed)') +
      keyRow('C / M / I', 'camera · map · instrument lights') +
      keyRow('H', 'controls card') +
      keyRow('Esc', 'pause') +
      '</ul></div>' +
      '<div><h3>Touch</h3><ul>' +
      '<li>The <b>left half</b> of the screen is a floating joystick: it appears where your thumb lands. Drag down to pull the nose up, left and right to roll — and to steer on the ground.</li>' +
      '<li>The <b>slider on the right edge</b> is the throttle.</li>' +
      '<li>The buttons at the top right: <b>Go</b> (push back, start, taxi, clearance), gear, flaps, brakes, parking brake, autopilot, time acceleration and the menu.</li>' +
      '<li>Both thumbs work at once, so you can fly and work a checklist together.</li>' +
      '</ul>' +
      '<h3>How a flight goes</h3><ul>' +
      '<li>At the gate press Enter for the push back, start the engines, release the brake and taxi along the arrow to the holding point.</li>' +
      '<li>Set take-off flaps, ask for the clearance, line up, full power, rotate at Vr, gear up.</li>' +
      '<li>Engage the autopilot (Y): it flies the route in NAV mode, captures the ILS and descends on the glideslope. Use time acceleration (T) en route.</li>' +
      '<li>When a warning sounds, work the checklist — the order matters and so does the clock.</li>' +
      '<li>Flaps and gear down on the approach, land by hand from 200 ft, brake, and leave the runway below 35 kt.</li>' +
      '<li>Taxi to your gate, stop in the parking box and set the parking brake.</li>' +
      '</ul></div></div>' +
      '<div class="btnRow"><button class="btn default" data-act="back">Got it</button></div>');
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
      '<div><div class="opsWho">' + esc(d.pilot.airline) + '</div>' +
      '<div class="opsSub">' + esc(d.pilot.name) + ' · ' + CAREER.PILOT_LICENSE + ' · base ' + d.base +
      (d.lastTo && d.lastTo !== d.base ? ' · now at ' + d.lastTo : '') + '</div></div>' +
      '<div class="opsMoney">' + fmtMoney(d.money) + '</div>' +
      '<div class="opsReps">' +
      Object.keys(FACTIONS).map((k) =>
        '<span class="rep" title="' + esc(FACTIONS[k].name) + '"><i style="background:' + FACTIONS[k].color + '"></i>' +
        Math.round(d.rep[k]) + '</span>').join('') +
      '</div></div>' +
      '<div class="tabs">' + tabs.map((t) =>
        '<button class="tab' + (this.tab === t ? ' on' : '') + '" data-act="tab" data-v="' + t + '">' +
        t.charAt(0).toUpperCase() + t.slice(1) + '</button>').join('') +
      '<button class="tab" data-act="backtitle">Menu</button></div>' +
      '<div class="tabBody">' + body + '</div>');
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
        '<div class="cHead"><b>' + esc(c.client) + '</b><span class="tag ' + c.faction + '">' +
        FACTIONS[c.faction].short + '</span></div>' +
        '<div class="cRoute"><b>' + c.fromId + ' → ' + c.toId + '</b>' +
        '<span>' + esc(from.city) + ' → ' + esc(to.city) + '</span></div>' +
        '<div class="cGrid">' +
        row2('Load', loadText(c)) +
        row2('Distance', c.distanceNm + ' nm') +
        row2('Payout', fmtMoney(c.pay)) +
        row2('Reputation', '+' + c.repGain + ' ' + FACTIONS[c.faction].short) +
        row2('Schedule', Career.difficulty.id === 'easy' ? 'no deadline' : fmtTime(c.deadline) + ' real time') +
        row2('Fuel plan', c.fuelKg + ' kg') +
        '</div>' +
        '<div class="cFoot"><span class="diff' + (c.difficulty > 2.4 ? ' hard' : c.difficulty > 1.6 ? ' med' : '') + '">difficulty ' + c.difficulty.toFixed(1) + '</span>' +
        (need ? '<span class="need">' + esc(need) + '</span>' : '<span class="ok">cleared for this type</span>') +
        '<button class="btn' + (need ? ' disabled' : ' default') + '" data-act="briefing" data-v="' + esc(c.id) + '"' +
        (need ? ' disabled' : '') + '>Fly this</button></div>' +
        '</div>';
    }).join('');
    const away = d.lastTo && d.lastTo !== d.base;
    return '<div class="hint">Aircraft: <b>' + esc(ac.name) + '</b> (' + ac.klass + ' · max ' + ac.maxRangeNm + ' nm). ' +
      (away ? 'You are at ' + d.lastTo + ' (' + esc(World.byId[d.lastTo].city) + ') — the board shows the flight home to ' + d.base + ' if it is in reach, and onward legs.'
        : 'From your base ' + d.base + ' to ' + d.regions.length + ' open region' + (d.regions.length > 1 ? 's' : '') + ' — more in the Network tab.') + '</div>' +
      '<div class="contracts">' + (list || '<p class="lead">No contracts for this aircraft right now — try another type in the hangar.</p>') + '</div>';
  },

  // the regions of the world and their traffic rights
  networkBody() {
    const d = Career.data;
    const cards = REGIONS.map((rg) => {
      const st = Career.regionState(rg);
      const apts = World.list.filter((a) => a.region === rg.id);
      const status = st.owned ? '<span class="ok">Traffic rights held</span>'
        : '<span class="' + (st.repOk ? 'ok' : 'need') + '">reputation ' + Math.floor(Career.bestRep()) + ' / ' + rg.rep + '</span>' +
          '<span class="' + (st.flightsOk ? 'ok' : 'need') + '">flights ' + d.stats.flights + ' / ' + rg.flights + '</span>';
      const can = st.available && st.afford;
      const btn = st.owned ? '' : '<button class="btn' + (can ? ' default' : ' disabled') + '" data-act="buyRegion" data-v="' + rg.id + '"' +
        (can ? '' : ' disabled') + '>' + (st.available ? (st.afford ? 'Buy the rights · ' + fmtMoney(rg.cost) : 'Needs ' + fmtMoney(rg.cost)) : 'Locked') + '</button>';
      return '<div class="acCard' + (st.owned ? ' sel' : '') + '">' +
        '<div class="acHead"><b>' + esc(rg.name) + '</b><span class="tag">' + apts.length + ' airports</span></div>' +
        '<p class="acBlurb">' + esc(rg.blurb) + '</p>' +
        '<p class="acBlurb">' + apts.map((a) => a.id).join(' · ') + '</p>' +
        '<div class="cFoot">' + status + btn + '</div></div>';
    }).join('');
    return '<div class="hint">Your operator starts with Swedish domestic flying out of Arlanda. Each region of the world needs traffic rights: ' +
      'earn the reputation and the flights, then buy them. A leg may be up to ' + CONTRACTS.MAX_NM.toLocaleString('en-US') +
      ' nm — further than that, fly there in legs and the board offers onward flights.</div><div class="cards">' + cards + '</div>';
  },

  requirement(c) {
    const ac = Career.aircraft();
    if (c.aircraftId && c.aircraftId !== ac.id) return 'Offered for another aircraft type';
    if (c.payloadKg + ac.emptyKg > ac.mtow) return 'Too heavy for ' + ac.name;
    if (c.distanceNm > ac.maxRangeNm) return 'Beyond the range of ' + ac.name;
    if (c.type === 'hazmat' && !Career.effects().hazmat) return 'Dangerous goods rating required';
    if (c.type === 'medevac' && !Career.effects().medevac) return 'Medevac rating required';
    if ((c.type === 'reefer' || c.type === 'fish') && !Career.has('cargo3')) return 'Arctic ground handling required';
    const to = World.byId[c.toId];
    if (to.rwyLen < ac.takeoffDist * 0.9) return 'Runway at ' + to.id + ' too short for ' + ac.name;
    if (to.aptClass.length === 1 && to.aptClass[0] === 'bush' && ac.surfaces.indexOf('grass') < 0) return 'Grass strip — not cleared for ' + ac.name;
    return null;
  },

  hangarBody() {
    const d = Career.data;
    const cards = AIRCRAFT.slice().sort((x, y) => x.mtow - y.mtow).map((a) => {
      const locked = !Career.unlocked(a);
      const sel = d.selected === a.id;
      const course = a.unlock ? COURSES.find((c) => c.id === a.unlock) : null;
      return '<div class="acCard' + (sel ? ' sel' : '') + '">' +
        '<div class="acHead"><b>' + esc(a.name) + '</b><span class="tag">' + esc(a.klass) + '</span></div>' +
        '<p class="acBlurb">' + esc(a.blurb) + '</p>' +
        '<div class="cGrid">' +
        row2(a.seats < 10 ? 'Crew / payload' : 'Seats / payload', a.seats + ' · ' + Math.round(a.payloadKg / 100) / 10 + ' t') +
        row2('Length / span', a.dims.len + ' m · ' + a.dims.span + ' m') +
        row2('Runway needed', a.takeoffDist + ' m') +
        row2('Cruise', a.cruiseTas + ' kt') +
        row2('Stall speed', Math.round(vs0Of(a, a.mtow)) + ' kt, full flaps, max weight') +
        row2('Range', a.maxRangeNm + ' nm') +
        row2('Crosswind limit', a.crosswindLimit + ' kt') +
        row2('Surfaces', a.surfaces.join(', ')) +
        row2('Lease per sector', fmtMoney(a.rent)) +
        '</div>' +
        (locked
          ? '<div class="cFoot"><span class="need">Locked — pass ' + esc(course.name) + '</span></div>'
          : '<div class="cFoot"><span class="ok">' + (sel ? 'Selected' : 'Available to lease') + '</span>' +
            (sel ? '' : '<button class="btn" data-act="selectAc" data-v="' + a.id + '">Select</button>') + '</div>') +
        '</div>';
    }).join('');
    return '<div class="hint">Aircraft are leased for each sector — the rent is on every debrief. Bigger is not always better: ' +
      'a heavy jet needs runway, needs a rating, and costs more to lease.</div><div class="cards">' + cards + '</div>';
  },

  trainingBody() {
    const branches = [
      { id: 'general', name: 'General' },
      { id: 'pax', name: 'Passenger' },
      { id: 'cargo', name: 'Cargo' },
      { id: 'bush', name: 'Bush & SAR' }
    ];
    const columns = branches.map((b) => {
      const courses = COURSES.filter((c) => c.branch === b.id).sort((x, y) => x.tier - y.tier);
      const items = courses.map((c) => {
        const st = Career.courseState(c);
        const afford = Career.canAfford(c);
        const status = st.bought ? '<span class="ok">Passed</span>'
          : st.lockedByCourse ? '<span class="need">Locked</span>'
            : st.lockedByRep ? '<span class="need">Needs ' + c.rep + ' ' + FACTIONS[b.id === 'general' ? 'pax' : b.id].short + ' reputation</span>'
              : '<span class="price">' + (c.cost ? fmtMoney(c.cost) : 'free') + '</span>';
        const can = st.available && afford;
        const btn = st.bought ? '' : '<button class="btn small' + (can ? ' default' : ' disabled') + '" data-act="course" data-v="' + c.id + '"' +
          (can ? '' : ' disabled') + '>' + (st.available ? (afford ? 'Take the exam' : 'Not enough money') : 'Locked') + '</button>';
        return '<div class="course' + (st.bought ? ' done' : '') + '">' +
          '<div class="coHead"><b>' + esc(c.name) + '</b>' + status + '</div>' +
          '<p>' + esc(c.blurb) + '</p>' +
          '<p class="effect">' + esc(c.effect) + '</p>' + btn + '</div>';
      }).join('');
      return '<div class="branch"><h3>' + b.name + '</h3>' + items + '</div>';
    }).join('');
    return '<div class="hint">Courses are the only way up. Each one ends in a short exam — 3 of 4 questions right and the course is yours; ' +
      'the fee is paid when you pass. Reputation with each client opens the higher tiers.</div><div class="branches">' + columns + '</div>';
  },

  careerBody() {
    const d = Career.data;
    const fx = Career.effects();
    const s = d.stats;
    const licences = COURSES.filter((c) => Career.has(c.id)).map((c) => c.name);
    const log = (d.log || []).map((l) => '<li>' + esc(l.text) + '</li>').join('');
    return '<div class="careerCols"><div>' +
      '<h3>Pilot</h3>' +
      '<div class="cGrid">' + row2('Name', esc(d.pilot.name)) + row2('Operator', esc(d.pilot.airline)) +
      row2('Licence', CAREER.PILOT_LICENSE) + row2('Home base', World.byId[d.base].name) +
      row2('Balance', fmtMoney(d.money)) + row2('Difficulty', Career.difficulty.name) + '</div>' +
      '<h3>Reputation</h3>' +
      Object.keys(FACTIONS).map((k) => {
        const v = d.rep[k];
        return '<div class="repRow"><span>' + esc(FACTIONS[k].name) + '</span>' +
          '<div class="bar"><i style="width:' + v + '%;background:' + FACTIONS[k].color + '"></i></div>' +
          '<b>' + Math.round(v) + '</b></div>';
      }).join('') +
      '<h3>Records</h3>' +
      '<div class="cGrid">' + row2('Flights flown', s.flights) +
      row2('Block time', fmtTime(s.blockTime)) +
      row2('Landings', s.landings) +
      row2('Smooth landings', s.perfect) +
      row2('Flights lost', s.crashes) +
      row2('Best grade', s.bestGrade || '—') +
      row2('Best single flight', fmtMoney(s.bestPay)) +
      row2('Cheats used', s.cheats) + '</div>' +
      '</div><div><h3>Licences and ratings</h3><p class="licList">' +
      (licences.length ? licences.map(esc).join(' · ') : 'none yet') + '</p>' +
      '<h3>Unlocked by your courses</h3><ul class="unlocks">' +
      unlockLine(fx.hint, 'Advanced systems — checklist hints and more time') +
      unlockLine(fx.ifr, 'Instrument rating — you may fly into low cloud and use the ILS') +
      unlockLine(fx.hazmat, 'Dangerous goods contracts') +
      unlockLine(fx.payloadTol > 1, 'Weight and balance — 15 % more payload before you are over weight') +
      unlockLine(fx.iceFactor < 1, 'De-icing — ice builds ' + Math.round((1 - fx.iceFactor) * 100) + ' % slower') +
      unlockLine(fx.medevac, 'Medevac and search and rescue contracts') +
      unlockLine(fx.forecast, 'Full weather reports at both ends, and better fuel planning') +
      unlockLine(fx.mountain, 'Mountain and adverse weather routes') +
      unlockLine(fx.widebody, 'Widebody procedures — the Nordjet 320') +
      unlockLine(fx.remote, 'Remote strips and ice fields for every type') +
      '</ul>' +
      '<h3>Log</h3><ul class="log">' + (log || '<li>Nothing yet.</li>') + '</ul>' +
      '<div class="btnRow"><button class="btn" data-act="backtitle">Title screen</button>' +
      '<button class="btn danger" data-act="wipe">Delete career</button></div>' +
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
    const w = (x, a) => {
      const wind = Math.round(x.speed) + ' kt from ' + String(Math.round(x.dir)).padStart(3, '0') + '°' +
        (x.gust > 2 ? ', gusting ' + Math.round(x.speed + x.gust) : '');
      const cross = Math.abs(Math.sin((x.dir - a.hdgDeg) * DEG) * x.speed);
      return '<tr><td>Runway in use</td><td>' + a.rwyName + ' · ' + a.rwyLen + ' m</td></tr>' +
        '<tr><td>Wind</td><td>' + wind + (cross > 4 ? ' · crosswind ' + Math.round(cross) + ' kt' : '') + '</td></tr>' +
        '<tr><td>QNH</td><td>' + x.qnh + ' hPa</td></tr>' +
        '<tr><td>Visibility</td><td>' + (x.vis / 1000).toFixed(1) + ' km</td></tr>' +
        '<tr><td>Cloud</td><td>base ' + fmtAlt(x.cloudBase) + ' ft, tops ' + fmtAlt(x.cloudTop) + ' ft</td></tr>' +
        '<tr><td>Temperature</td><td>' + Math.round(x.temp) + ' °C' + (x.snow ? ' · snow' : x.precip === 'rain' ? ' · rain' : '') + '</td></tr>' +
        (x.icing ? '<tr><td>ICING</td><td>expected in cloud — anti-ice K</td></tr>' : '') +
        (x.stormy ? '<tr><td>WIND</td><td>stormy — expect turbulence and shear</td></tr>' : '');
    };
    this.panel(
      '<h2>' + esc(c.client) + '</h2>' +
      '<div class="briefTop"><div class="bigRoute">' + c.fromId + ' → ' + c.toId + '</div>' +
      '<div class="bigPay">' + fmtMoney(c.pay) + '</div></div>' +
      '<div class="briefCols"><div>' +
      '<h3>' + esc(from.name) + ' · ' + from.id + '</h3><table class="wx">' + w(setup.weather.dep, from) + '</table>' +
      '<h3>' + esc(to.name) + ' · ' + to.id + '</h3><table class="wx">' + w(setup.weather.arr, to) + '</table>' +
      '<p class="fineprint">' + (setup.weather.arr.vis < 3000
        ? 'Low visibility at ' + to.id + ' — fly the ILS, the autopilot can couple to it down to 200 ft.'
        : 'Visibility is good for the approach at ' + to.id + '.') + '</p>' +
      '</div><div>' +
      '<h3>The job</h3><div class="cGrid">' +
      row2('Aircraft', esc(ac.name) + ' · ' + ac.klass) +
      row2('Load', loadText(c)) +
      row2('Distance', c.distanceNm + ' nm') +
      row2('En route', 'about ' + c.blockMin + ' min at 1× — use the autopilot and time acceleration') +
      row2('Deadline', Career.difficulty.id === 'easy' ? 'none' : fmtTime(c.deadline) + ' of real time') +
      row2('Fuel', 'plan ' + c.fuelKg + ' kg · on board ' + Math.round(setup.blockFuel) + ' kg') +
      row2('Reputation', '+' + c.repGain + ' ' + FACTIONS[c.faction].short) +
      row2('Lease', '−' + fmtMoney(ac.rent)) +
      '</div>' +
      '<h3>How you start</h3>' +
      '<label class="check"><input type="radio" name="startMode" value="gate"' + (this.skipPushback ? '' : ' checked') + '> ' +
      'At the gate — push back, start the engines, taxi out</label>' +
      '<label class="check"><input type="radio" name="startMode" value="pushback"' + (this.skipPushback ? ' checked' : '') + '> ' +
      'After pushback — the tug has taken you to the holding point, +' + fmtMoney(CONTRACTS.PUSHBACK_BONUS) + ' from the client</label>' +
      '<div class="btnRow"><button class="btn default" data-act="fly">Fly it</button>' +
      '<button class="btn" data-act="tab" data-v="dispatch">Back to the board</button></div>' +
      '</div></div>');
  },

  // ---------- debrief ----------
  showDebrief(result, failed) {
    Input.active = false;
    const p = result.payout || { lines: [], total: 0 };
    const landed = Game.flight && Game.flight.landed;
    const gradeCls = 'grade' + (result.grade === 'A+' || result.grade === 'A' ? ' top' : result.grade === 'F' || result.grade === 'E' ? ' bad' : '');
    const body =
      '<div class="debriefTop">' +
      '<div class="' + gradeCls + '">' + (failed ? 'LOST' : result.grade) + '</div>' +
      '<div class="debriefTitle">' + (failed ? esc(Game.failure ? Game.failure.text : 'The flight was lost')
        : 'Flight complete · ' + result.contract.fromId + ' → ' + result.contract.toId) + '</div>' +
      '</div>' +
      (failed ? '' :
        '<div class="cols"><div><h3>Touchdown</h3><div class="cGrid">' +
        row2('Vertical speed', (landed ? landed.fpm : 0) + ' fpm') +
        row2('Speed', (landed ? landed.ias : 0) + ' kt (Vref ' + (landed ? landed.vref : 0) + ')') +
        row2('From the threshold', (landed ? landed.fromThr : 0) + ' m') +
        row2('Off the centreline', (landed ? Math.abs(landed.offset) : 0) + ' m') +
        row2('Bank / crab', (landed ? Math.round(landed.bank) + '° / ' + Math.abs(landed.crab) + '°' : '—')) +
        row2('Surface', landed ? landed.surf : '—') +
        '</div></div><div><h3>In the log</h3><ul class="unlocks">' +
        '<li>Block time ' + fmtTime(result.blockSec) + ' · real time ' + fmtTime(result.realSec) + (result.onTime ? ' · on time' : ' · late') + '</li>' +
        '<li>Fuel used ' + Math.round(result.fuelUsed) + ' kg (plan ' + result.contract.fuelKg + ' kg)</li>' +
        '<li>Checklists: ' + result.handled + ' worked, ' + result.mishandled + ' mishandled</li>' +
        '<li>Damage ' + Math.round(result.damage * 100) + ' %</li>' +
        (result.cheated ? '<li class="need">Cheats used — no pay, no reputation, no records</li>' : '') +
        '</ul></div></div>') +
      '<h3>Invoice</h3><table class="money">' +
      p.lines.map((l) => '<tr><td>' + esc(l.label) + '</td><td class="' + (l.value < 0 ? 'neg' : '') + '">' +
        (l.value < 0 ? '−' : '') + fmtMoney(Math.abs(l.value)) + '</td></tr>').join('') +
      '<tr class="total"><td>' + (p.total < 0 ? 'Cost to you' : 'Paid to you') + '</td><td>' +
      (p.total < 0 ? '−' : '') + fmtMoney(Math.abs(p.total)) + '</td></tr>' +
      '</table>' +
      (p.rep ? '<p class="repGain">Reputation with ' + esc(FACTIONS[result.contract.faction].name) +
        ': <b>' + (p.rep > 0 ? '+' : '') + p.rep.toFixed(1) + '</b></p>' : '') +
      (p.bankrupt ? '<p class="need">Your balance is below −50 000 kr. The operator certificate has been revoked — this career is over.</p>' : '') +
      '<div class="settingsRow">' + this.difficultyChips() + '</div>' +
      '<div class="btnRow">' +
      (p.bankrupt ? '<button class="btn default" data-act="gameover">Start again</button>'
        : failed ? '<button class="btn default" data-act="retry">Try again</button><button class="btn" data-act="ops">Back to ops</button>'
          : '<button class="btn default" data-act="ops">Next flight</button>') +
      '</div>';
    this.panel(body, 'debrief');
  },

  // ---------- pause ----------
  showPause() {
    const fl = Game.flight;
    this.panel(
      '<h2>Paused</h2>' +
      '<p class="lead">' + (fl ? esc(fl.contract.client) + ' · ' + fl.contract.fromId + ' → ' + fl.contract.toId : '') + '</p>' +
      '<div class="btnRow"><button class="btn default" data-act="resume">Resume</button>' +
      '<button class="btn" data-act="restart">Restart this flight</button>' +
      '<button class="btn" data-act="howto2">Controls</button>' +
      '<button class="btn" data-act="ops">Abandon, back to ops</button></div>' +
      '<div class="settingsRow">' + this.difficultyChips() + '</div>' +
      '<p class="fineprint">Esc, Space or Enter resumes. A new difficulty applies from the next flight or the restart.</p>', 'narrow');
  },

  // ---------- quiz ----------
  showQuiz(courseId) {
    const course = COURSES.find((c) => c.id === courseId);
    const st = Career.courseState(course);
    if (!st.available || !Career.canAfford(course)) { this.showOps(); return; }
    const pool = (QUIZZES[courseId] || []).slice();
    const rng = makeRng(hashStr(courseId) ^ Date.now());
    const questions = rng.shuffle(pool).slice(0, Math.min(4, pool.length));
    this.quiz = { course, questions, index: 0, correct: 0 };
    this.renderQuiz();
  },
  renderQuiz() {
    const q = this.quiz;
    if (!q) return;
    if (q.index >= q.questions.length) {
      const pass = q.correct >= 3 || q.questions.length === 0;
      if (pass) Career.buyCourse(q.course);
      this.panel('<h2>' + esc(q.course.name) + '</h2>' +
        '<p class="lead">' + (pass
          ? 'You passed — ' + q.correct + ' of ' + q.questions.length + ' correct.' + (q.course.cost ? ' Course fee ' + fmtMoney(q.course.cost) + ' paid.' : '')
          : 'Not this time — ' + q.correct + ' of ' + q.questions.length + ' correct. You need 3. Nothing is charged.') + '</p>' +
        (pass ? '<p class="ok">' + esc(q.course.effect) + '</p>' : '') +
        '<div class="btnRow">' + (pass ? '<button class="btn default" data-act="tab" data-v="training">Back to the training tree</button>'
          : '<button class="btn default" data-act="course" data-v="' + q.course.id + '">Try again</button>' +
          '<button class="btn" data-act="tab" data-v="training">Give up</button>') + '</div>', 'narrow');
      Audio2.cue(pass ? 'good' : 'bad');
      this.quiz = null;
      return;
    }
    const item = q.questions[q.index];
    const opts = item.o.map((o, i) =>
      '<button class="opt" data-act="answer" data-v="' + i + '">' + esc(o) + '</button>').join('');
    this.panel(
      '<h2>' + esc(q.course.name) + '</h2>' +
      '<div class="quizHead">Question ' + (q.index + 1) + ' of ' + q.questions.length + ' · pass mark 3</div>' +
      '<p class="qText">' + esc(item.q) + '</p>' + opts +
      '<div class="btnRow"><button class="btn" data-act="quitquiz">Give up</button></div>', 'narrow');
  },

  // ---------- every button ----------
  action(name, v) {
    switch (name) {
      case 'continue': enterFullscreen(); Game.mode = 'ops'; this.showOps(); break;
      case 'newcareer': this.showNewCareer(); break;
      case 'startcareer': {
        const pilot = (el('pilotName') || {}).value || '';
        const airline = (el('airlineName') || {}).value || '';
        reseed(hashStr(pilot + airline) ^ Date.now());
        Career.new({ pilot, airline });
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
        if (!q) break;
        const item = q.questions[q.index];
        if (parseInt(v, 10) === item.a) q.correct++;
        q.index++;
        this.renderQuiz();
        break;
      }
      case 'quitquiz': this.quiz = null; this.tab = 'training'; this.showOps(); break;
      case 'fly': {
        const c = Career.contractById(this.selContract);
        if (!c) { this.showOps(); break; }
        this.lastContract = c;
        enterFullscreen();
        Game.launch(c, { skipPushback: this.skipPushback });
        break;
      }
      case 'retry':
        if (this.lastContract) { enterFullscreen(); Game.launch(this.lastContract, { skipPushback: this.skipPushback }); }
        break;
      case 'ops': Game.abortToOps(); break;
      case 'resume': Game.pause(); break;
      case 'restart':
        if (Game.contract) { Game.mode = 'ops'; Game.launch(Game.contract, { skipPushback: this.skipPushback }); }
        break;
      case 'gameover': Career.reset(); Game.mode = 'menu'; this.showTitle(); break;
      default: break;
    }
  },

  // re-render whichever screen is showing (after a setting changed)
  refresh() {
    if (Game.mode === 'paused') this.showPause();
    else if ((Game.mode === 'debrief' || Game.mode === 'failed') && Game.result) this.showDebrief(Game.result, Game.mode === 'failed');
    else if (this.screen.dataset.view === 'newcareer' && el('pilotName')) {
      const pn = el('pilotName').value, an = el('airlineName').value;
      this.showNewCareer();
      el('pilotName').value = pn; el('airlineName').value = an;
    } else this.showTitle();
  }
};

function loadText(c) {
  const kg = Math.round(c.payloadKg).toLocaleString('sv-SE');
  return c.type === 'pax' ? c.pax + ' passengers · ' + kg + ' kg' : kg + ' ' + esc(c.payloadLabel) + (c.pax ? ' · ' + c.pax + ' on board' : '');
}
function row2(k, v) { return '<div class="row2"><span>' + esc(k) + '</span><b>' + v + '</b></div>'; }
function keyRow(k, d) { return '<li><kbd>' + esc(k) + '</kbd> ' + esc(d) + '</li>'; }
function unlockLine(on, text) { return '<li class="' + (on ? 'ok' : '') + '">' + (on ? '✓ ' : '· ') + esc(text) + '</li>'; }
function vs0Of(a, kg) {
  const cl = a.clMaxClean + a.flaps[a.flaps.length - 1].cl;
  return Math.sqrt(2 * kg * SIM.GRAVITY / (SIM.RHO_SL * a.wingArea * cl)) / KTS;
}
