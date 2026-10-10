'use strict';

// ============================================================
// World Aviation — screens: title, the ops hub (dispatch, hangar,
// training, career), the briefing, the debrief, failures, pause
// and the course quizzes. Plain DOM; the copy is written in English
// and shown through tr() in the language picked on the title screen.
// Every button carries data-act (and data-v); UI.action routes them.
// ============================================================

const UI = {
  screen: null, tab: 'dispatch', selContract: null, quiz: null, lastContract: null, keyLockUntil: 0,

  init() {
    this.screen = el('screen');
    window.addEventListener('keydown', (e) => this.key(e), true);
  },

  // Arrow keys move the focus between buttons; Space / Enter press the focused
  // (or the default) button of whatever screen is showing; Esc presses its way back
  // (the button marked data-esc), if it has one — in the pause menu itself Esc resumes.
  key(e) {
    if (this.screen.hidden || Game.mode === 'flying') return;
    // a screen with keys of its own first (the Mriya's hall while a part is carried)
    if (this.keyHook && this.keyHook(e)) return;
    if (e.key === 'Escape' && this.renaming) {
      e.preventDefault(); e.stopPropagation(); this.renaming = false; this.showOps();
      return;
    }
    if (e.key === 'Escape') {
      const back = this.screen.querySelector('button[data-esc]:not([disabled])');
      if (back) { e.preventDefault(); e.stopPropagation(); back.click(); }
      return;
    }
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') {
      if (e.key === 'Enter') { const b = this.screen.querySelector('[data-enter]') || this.screen.querySelector('.btn.default'); if (b) { e.preventDefault(); b.click(); } }
      return;
    }
    // keys still held or pressed from the flight (the arrows steer, Space is the parking brake) must not
    // wander onto a setting and press it: a held key's repeats and the first moments of a screen that
    // has just come up over the flight are ignored
    const nav = e.code === 'Space' || e.key === 'Enter' || e.key.indexOf('Arrow') === 0;
    if (nav && (e.repeat || performance.now() < this.keyLockUntil)) { e.preventDefault(); return; }
    const btns = this.buttons();
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
    // the screen being left lets go of what it holds (the Mriya's hall: its renderer)
    if (this.onLeave) { const f = this.onLeave; this.onLeave = null; f(); }
    if (this.screen.hidden) this.keyLockUntil = performance.now() + UI_KEY_LOCK_MS;
    this.screen.hidden = false;
    // in the pause the flight stays in sight behind the glass (styles.css)
    this.screen.dataset.view = Game.mode === 'paused' ? 'pause' : '';
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
        const act = b.getAttribute('data-act'), v = b.getAttribute('data-v');
        const before = { view: this.viewKey(), y: this.screen.scrollTop, index: this.buttons().indexOf(b) };
        UI.action(act, v);
        this.keepPlace(act, v, before);
      });
    });
    const first = this.screen.querySelector('.default:not([disabled])') || this.screen.querySelector('.tab.on') || this.screen.querySelector('button');
    if (first && !isCoarsePointer()) first.focus({ preventScroll: true });
  },

  // the buttons that can be focused now
  buttons() {
    return Array.from(this.screen.querySelectorAll('button:not([disabled])')).filter((b) => b.offsetParent !== null && !b.closest('.folded .brBody'));
  },
  // which screen is showing: the mode, the ops tab and the heading
  viewKey() {
    const h = this.screen.querySelector('h1, h2');
    return Game.mode + '|' + (Game.mode === 'ops' ? this.tab : '') + '|' + (h ? h.textContent : '');
  },
  // After a press the screen is drawn anew: the focus stays on the same button (a tab, a chip, a
  // card's button) and, on the same screen, so does the scroll. If that button is gone, the screen's
  // default keeps the focus, or else the button now in its place.
  keepPlace(act, v, before) {
    if (this.screen.hidden) return;
    const same = this.viewKey() === before.view;
    if (same) this.screen.scrollTop = before.y;
    if (isCoarsePointer()) return;
    const btns = this.buttons();
    const again = btns.find((b) => b.getAttribute('data-act') === act && b.getAttribute('data-v') === v);
    if (again) { again.focus({ preventScroll: true }); return; }
    if (!same || this.screen.querySelector('.default:not([disabled])') || !btns.length) return;
    btns[Math.min(Math.max(before.index, 0), btns.length - 1)].focus({ preventScroll: true });
  },

  // the career's level; on the new career screen the level that career will start at (the last pick)
  difficultyChips(forNew) {
    const cur = forNew ? (DIFFICULTY[Career.settings.difficulty] || DIFFICULTY.medium) : Career.difficulty;
    return '<div class="setGroup"><span>' + tr('Difficulty') + '</span>' + ['easy', 'medium', 'hard'].map((d) =>
      '<button class="chip' + (cur.id === d ? ' on' : '') + '" data-act="difficulty" data-v="' + d + '">' +
      esc(tr(DIFFICULTY[d].name)) + '</button>').join('') + '</div>' +
      '<p class="fineprint">' + esc(tr(cur.description)) + '</p>';
  },

  // the game's language, first thing on the title screen: a flag and a code per language (art/flag-*.svg)
  langChips() {
    const FLAG = { en: 'gb', ru: 'ru', sv: 'se' };
    return '<div class="langPick" role="group" aria-label="Language">' + Object.keys(LANGS).map((l) =>
      '<button type="button" data-act="lang" data-v="' + l + '" aria-pressed="' + (I18N.lang === l) + '" title="' + esc(LANGS[l]) + '">' +
      '<img src="art/flag-' + FLAG[l] + '.svg" alt="">' + l.toUpperCase() + '</button>').join('') + '</div>';
  },

  // ---------- title ----------
  showTitle() {
    if (Game.mode !== 'flying' && Game.mode !== 'paused') Game.mode = 'menu';
    const has = !!Career.data;
    const s = Career.settings;
    const qualBtns = ['auto', 'low', 'medium', 'high'].map((d) =>
      '<button class="chip' + (s.quality === d ? ' on' : '') + '" data-act="quality" data-v="' + d + '">' +
      esc(tr(d === 'auto' ? 'Auto' : QUALITY[d].name)) + '</button>').join('');
    const nRegions = REGIONS.length;
    this.panel(
      '<div class="titleWrap">' +
      '<div class="titleTop"><span class="titleKicker">✈ ' + tr('Based at Stockholm Arlanda · ARN') + '</span>' + this.langChips() + '</div>' +
      '<h1 class="logo"><span>World</span> Aviation</h1>' +
      '<p class="tagline">' + tr('A Swedish pilot, one leased turboprop — and the whole world to win, one region at a time.') + '</p>' +
      '<div class="titleFacts">' +
      '<span><b>' + World.list.length + '</b>' + tr('airports') + '</span>' +
      '<span><b>' + AIRCRAFT.length + '</b>' + tr('aircraft types') + '</span>' +
      '<span><b>' + nRegions + '</b>' + tr('regions of the world') + '</span>' +
      '<span><b>' + Object.keys(AIRLINE_BY_CODE).length + '</b>' + tr('real airlines') + '</span>' +
      '</div>' +
      '<div class="cardRow">' +
      (has ? '<button class="bigBtn default" data-act="continue">' + tr('Continue career') + '<small>' + esc(Career.data.pilot.name) + ' · ' +
        fmtMoney(Career.data.money) + '</small></button>' +
        '<button class="bigBtn" data-act="newcareer">' + tr('New career') + '<small>' + tr('different pilot, fresh start') + '</small></button>'
        : '<button class="bigBtn default" data-act="newcareer">' + tr('Start your career') + '<small>' + tr('based at Stockholm Arlanda') + '</small></button>') +
      '</div>' +
      '<div class="titleSettings">' +
      '<div class="settingsRow">' + this.difficultyChips() + '</div>' +
      '<div class="settingsRow">' +
      '<div class="setGroup"><span>' + tr('Graphics') + '</span>' + qualBtns + '</div>' +
      this.soundChip() + this.unitChips() + this.pitchChips() + this.aidChip() + this.cabinChip() +
      '</div></div>' +
      '<div class="titleFoot">' +
      '<button class="btn" data-act="howto">' + tr('How to fly') + '</button>' +
      (has ? '<button class="btn" data-act="wipe">' + tr('Delete career') + '</button>' : '') +
      '</div>' +
      '<p class="fineprint">' + esc(tr(CAREER.INTRO)) + '</p>' +
      '</div>', 'title');
    this.screen.dataset.view = 'title';
    TitleSky.show();
  },

  showNewCareer() {
    this.panel(
      '<h2>' + tr('New career') + '</h2>' +
      '<p class="lead">' + tr('You have a fresh commercial licence (EASA CPL), one leased turboprop and a base at Stockholm Arlanda. What is your name?') + '</p>' +
      '<div class="form">' +
      '<label>' + tr('Pilot name') + '<span class="nameLine"><input id="pilotName" value="' + esc(Career.randomPilotName()) + '" maxlength="24">' +
      '<button class="chip" data-act="rerollName" title="' + esc(tr('Another name')) + '" aria-label="' + esc(tr('Another name')) + '">🎲</button></span></label>' +
      '</div>' +
      '<div class="settingsRow">' + this.difficultyChips(true) + '</div>' +
      '<div class="btnRow split"><button class="btn back" data-act="back" data-esc>' + tr('Back') + '</button>' +
      '<button class="btn default fwd" data-act="startcareer">' + tr('Start flying') + '</button></div>', 'narrow');
    this.screen.dataset.view = 'newcareer';
  },

  confirmWipe() {
    this.panel(
      '<h2>' + tr('Delete this career?') + '</h2><p class="lead">' + tr('The money, the reputation and every course you have passed will be gone.') + '</p>' +
      '<div class="btnRow"><button class="btn danger" data-act="wipeyes">' + tr('Delete it') + '</button>' +
      '<button class="btn default" data-act="back" data-esc>' + tr('Keep it') + '</button></div>', 'narrow');
  },

  showHowTo() {
    this.panel(
      '<div class="screenBar"><button class="btn back" data-act="back">' + tr('Back') + '</button></div>' +
      '<h2>' + tr('How to fly') + '</h2>' +
      '<div class="cols">' +
      '<div><h3>' + tr('Keyboard') + '</h3><ul class="keys">' +
      keyRow('↑ / ↓ · W / S', tr(Input.invertPitch ? 'pitch — ↑ lifts the nose' : 'pitch — ↓ pulls the nose up')) +
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
      keyRow('T / R', tr('time faster / slower: up to ×512 on the autopilot at any height, by hand ×2 / ×4 / ×8 / ×16 / ×32 / ×64 above 1 000 / 3 000 / 6 000 / 8 000 / 9 000 / 10 000 ft')) +
      keyRow('C / X / Z · M · I', tr('camera: next / back / straight to the cockpit · map (on a big screen: mini, big, off) · instrument lights: dim, medium, bright, hidden')) +
      keyRow('H', tr('controls card')) +
      keyRow('Esc', tr('pause')) +
      '</ul></div>' +
      '<div><h3>' + tr('Touch') + '</h3><ul>' +
      '<li>' + tr(Input.invertPitch
        ? 'The <b>left half</b> of the screen is a floating joystick: it appears where your thumb lands. Drag up to lift the nose, left and right to roll — and to steer on the ground.'
        : 'The <b>left half</b> of the screen is a floating joystick: it appears where your thumb lands. Drag down to pull the nose up, left and right to roll — and to steer on the ground.') + '</li>' +
      '<li>' + tr('The <b>slider on the right edge</b> is the throttle — its lower half gives fine control of low power for taxiing.') + '</li>' +
      '<li>' + tr('The buttons at the top: the menu, the view, the map and anti-ice; the flaps, the gear and the spoiler; and a row that changes with the flight — on the ground and for the landing <b>Go</b> (push back, start, clearance), the brake and the parking brake, in the air the autopilot and <b>Time −</b> / <b>Time +</b>.') + '</li>' +
      '<li>' + tr('Tap the hint text to fold it to one line, tap again to open it.') + '</li>' +
      '<li>' + tr('Both thumbs work at once, so you can fly and work a checklist together.') + '</li>' +
      '</ul>' +
      '<h3>' + tr('How a flight goes') + '</h3><ul>' +
      '<li>' + tr('At the gate press Enter for the push back and to start the engines, release the parking brake with Space and taxi along the arrow to the holding point.') + '</li>' +
      '<li>' + tr('Set take-off flaps, ask for the clearance, line up, full power, rotate at Vr, gear up.') + '</li>' +
      '<li>' + tr('Engage the autopilot (Y): it flies the route in NAV mode, captures the ILS and descends on the glideslope. Speed up the time with T (slow it down with R) — up to ×512 on the autopilot, at any height.') + '</li>' +
      '<li>' + tr('When a warning sounds, a checklist opens: do the lit step with the control shown next to it — Enter (Go) for its switches, the real controls (0, K, G, /, Y…) for the rest. The clock is running.') + '</li>' +
      '<li>' + tr('Flaps and gear down on the approach, land by hand from 200 ft, brake, and leave the runway below 35 kt.') + '</li>' +
      '<li>' + tr('The <b>spoiler</b> (/) is a speed brake: out when you are too high or too fast on the descent, in again before the landing. After touchdown put it out with idle and the brakes — it puts the weight on the wheels, so they stop you sooner.') + '</li>' +
      '<li>' + tr('Taxi to your gate, stop in the parking box and set the parking brake.') + '</li>' +
      '</ul></div></div>' +
      '<div class="btnRow"><button class="btn default" data-act="back" data-esc>' + tr('Got it') + '</button></div>');
  },

  // ---------- ops hub ----------
  showOps() {
    Game.mode = 'ops';
    Input.active = false;
    const d = Career.data;
    if (!d) { this.showTitle(); return; }
    const tabs = ['dispatch', 'network', 'hangar', 'training', 'career'];
    if (this.tab !== 'hangar') this.freshAc = null;     // the new types' frames last while the hangar is open
    const body = this.tabBody();
    this.panel(
      '<div class="opsHead">' +
      '<button class="btn back" data-act="backtitle" data-esc>' + tr('Menu') + '</button>' +
      '<div><div class="opsWho">' + esc(d.pilot.name) + '</div>' +
      '<div class="opsSub">' + Career.rank().licence + ' · ' + tr('base {id}', { id: d.base }) +
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
      }).join('') + '</div>' +
      '<div class="tabBody">' + body + '</div>', 'ops');
    // on a phone the tabs scroll sideways: bring the open one into view, in the middle of the row
    const row = this.screen.querySelector('.tabs'), on = row && row.querySelector('.tab.on');
    if (on && row.scrollWidth > row.clientWidth) row.scrollLeft = on.offsetLeft - (row.clientWidth - on.offsetWidth) / 2;
    if (this.tab === 'hangar' && typeof AircraftPreview !== 'undefined') AircraftPreview.fill(this.screen);
  },

  // what a tab shows next to its name: a gold dot when there is something new or something you
  // can do there right now (the hangar: a type a course has unlocked waits to be seen)
  tabBadge(t) {
    if (t === 'hangar') {
      const fresh = Career.newAircraft();
      if (fresh.length) return { html: '<i class="tabDot"></i>', title: tr('New in the hangar: {list}', { list: fresh.map((a) => a.name).join(', ') }) };
      return null;
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
    const all = d.contracts || [];
    const shown = Filters.boardList(all);
    const list = shown.map((c) => this.contractCard(c, this.requirement(c))).join('');
    const away = d.lastTo && d.lastTo !== d.base;
    return '<div class="hint">' + tr('Aircraft: <b>{ac}</b> ({klass} · max {nm} nm).', { ac: esc(ac.name), klass: esc(tr(ac.klass)), nm: ac.maxRangeNm }) + ' ' +
      (away ? tr('You are at {id} ({city}) — the board shows the flight home to {base} if it is in reach, and onward legs.', { id: d.lastTo, city: esc(aptCity(World.byId[d.lastTo])), base: d.base })
        : tr('From your base {base} · open regions: {n} — more in the Network tab.', { base: d.base, n: d.regions.length })) + '</div>' +
      Filters.boardBar() +
      (!shown.length && FACTIONS[Filters.board().type] ? this.boardGap(Filters.board().type, all.length)
        : '<div class="contracts">' + (list || '<p class="lead">' + tr('No contracts for this aircraft right now — try another type in the hangar.') + '</p>') + '</div>');
  },

  // the board filtered to one client group that has no offer: why (Career.boardGap) and what to
  // do about it — another type from the hangar (filtered to that group), a course, another airport
  boardGap(k, n) {
    const ac = Career.aircraft(), here = Career.here(), group = tr(FACTIONS[k].short);
    const why = Career.boardGap(k);
    let text, more = '';
    if (why === 'seats') text = tr('Passenger flights need a type with more than {n} seats, and {ac} has {s}.', { n: CONTRACTS.PAX_SEATS, ac: esc(ac.name), s: ac.seats });
    else if (why === 'payload') text = tr('Cargo flights need a type that lifts at least {t} t, and {ac} lifts {p} t.', { t: CONTRACTS.CARGO_KG / 1000, ac: esc(ac.name), p: fmtTonnes(ac.payloadKg) });
    else if (why === 'surface') text = tr('Bush and rescue flights need a type cleared for grass or ice strips, and {ac} flies from asphalt only.', { ac: esc(ac.name) });
    else if (why === 'rating') text = tr('Bush and rescue flights need the Short Field Ops course or {n} reputation in any group (you have {r}).', { n: CONTRACTS.BUSH_REP, r: Math.floor(Career.bestRep()) });
    else if (why === 'clients') text = tr('No {group} client flies from {apt} to anywhere {ac} reaches in your open regions. Fly on to another airport, or open more regions in the Network tab.', { group: esc(group), apt: esc(aptName(here)), ac: esc(ac.name) });
    else text = tr('No {group} offers on the board this time ({n} of other kinds). The board is dealt anew after every flight.', { group: esc(group), n });
    if (why === 'seats' || why === 'payload' || why === 'surface') {
      const names = AIRCRAFT.filter((a) => !a.legend && Career.suits(a).indexOf(k) >= 0).map((a) => a.name);
      if (names.length <= 5) text += ' ' + tr('Types for it: {list}.', { list: esc(names.join(', ')) });
      more = '<button class="btn default" data-act="acFor" data-v="' + k + '">' + Filters.useIcon(k) + tr('Aircraft for {group}', { group: esc(group) }) + '</button>';
    } else if (why === 'rating') {
      more = '<button class="btn default" data-act="tab" data-v="training">' + tr('Training') + '</button>';
    }
    return Filters.empty('boardFilter', text, more);
  },

  // a contract's card: on the board (need: why it cannot be flown, or null), or in the pause of
  // its flight (flying: no button)
  contractCard(c, need, flying) {
    const from = World.byId[c.fromId], to = World.byId[c.toId];
    return '<div class="contract' + (!flying && this.selContract === c.id ? ' sel' : '') + '">' +
      '<div class="cHead">' + clientLogo(c) + '<b>' + esc(c.client) + '</b><span class="tag ' + c.faction + '">' +
      UseIcons.svg(c.faction) + esc(tr(FACTIONS[c.faction].short)) + '</span></div>' +
      '<div class="cRoute"><b>' + routeHtml(c.fromId, c.toId) + '</b>' +
      '<span>' + routeHtml(flagImg(from) + esc(aptCity(from)), flagImg(to) + esc(aptCity(to)), 'soft') + '</span></div>' +
      '<div class="cGrid">' +
      (flying && Game.flight ? row2(tr('Aircraft'), esc(Game.flight.ac.name)) : '') +
      row2(tr('Load'), loadText(c)) +
      row2(tr('Distance'), c.distanceNm + ' nm') +
      row2(tr('Payout'), fmtMoney(c.pay)) +
      row2(tr('Reputation'), '+' + c.repGain + ' ' + esc(tr(FACTIONS[c.faction].short))) +
      row2(tr('Fuel plan'), c.fuelKg + ' kg') +
      row2(tr('Flown there'), Career.visitsTo(c.toId) ? Career.visitsTo(c.toId) + '×' : '<span class="newDest">' + tr('never — new') + '</span>') +
      (c.depGate !== undefined ? row2(tr('Stands'), routeHtml(gateLabel(from, c.depGate), gateLabel(to, c.arrGate), 'soft')) : '') +
      '</div>' +
      '<div class="cFoot"><span class="diff' + (c.difficulty > 2.4 ? ' hard' : c.difficulty > 1.6 ? ' med' : '') + '">' + tr('difficulty {d}', { d: c.difficulty.toFixed(1) }) + '</span>' +
      (flying ? '' : (need ? '<span class="need">' + esc(need) + '</span>' : '') +
        '<button class="btn' + (need ? ' disabled' : ' default fwd') + '" data-act="briefing" data-v="' + esc(c.id) + '"' +
        (need ? ' disabled' : '') + '>' + tr('Fly this') + '</button>') + '</div>' +
      '</div>';
  },

  // the regions of the world and their traffic rights: a card per region with its map
  // (art/regionmaps.js), the flags of its countries and what it takes to open it
  networkBody() {
    const d = Career.data;
    const cards = REGIONS.map((rg) => {
      const st = Career.regionState(rg);
      const apts = World.list.filter((a) => a.region === rg.id);
      const countries = [];
      for (const a of apts) if (countries.indexOf(a.country) < 0) countries.push(a.country);
      const status = st.owned ? ''                       // the badge on the map says it
        : '<span class="' + (st.repOk ? 'ok' : 'need') + '">' + tr('reputation {a} / {b}', { a: Math.floor(Career.bestRep()), b: rg.rep }) + '</span>' +
          '<span class="' + (st.flightsOk ? 'ok' : 'need') + '">' + tr('flights {a} / {b}', { a: d.stats.flights, b: rg.flights }) + '</span>';
      const can = st.available && st.afford;
      const btn = st.owned ? '' : '<button class="btn' + (can ? ' default' : ' disabled') + '" data-act="buyRegion" data-v="' + rg.id + '"' +
        (can ? '' : ' disabled') + '>' + (st.available ? (st.afford ? tr('Buy the rights · {cost}', { cost: fmtMoney(rg.cost) }) : tr('Needs {cost}', { cost: fmtMoney(rg.cost) })) : tr('Locked')) + '</button>';
      return '<div class="acCard plane region' + (st.owned ? ' sel' : st.available ? '' : ' locked') + '">' +
        '<div class="acPic map"><img src="' + RegionMaps.url(rg.id) + '" alt="' + esc(tr(rg.name)) + '">' +
        '<span class="acMtow" title="' + esc(tr('airports: {n}', { n: apts.length })) + '">✈ ' + apts.length + '</span>' +
        (st.owned ? '<span class="acBadge sel">✓ ' + tr('Traffic rights held') + '</span>'
          : st.available ? '' : '<span class="acBadge lock">🔒 ' + tr('Locked') + '</span>') +
        '</div><div class="acMain">' +
        '<div class="acHead"><b>' + esc(tr(rg.name)) + '</b></div>' +
        '<div class="rgFlags">' + countries.map((c) => '<img class="flag" src="' + Flags.url(c) + '" alt="" title="' + esc(c) + '">').join('') + '</div>' +
        '<p class="acBlurb">' + esc(tr(rg.blurb)) + '</p>' +
        '<p class="rgCodes">' + apts.map((a) => a.id).join(' · ') + '</p>' +
        '<div class="cFoot">' + status + btn + '</div></div></div>';
    }).join('');
    return '<div class="hint">' + tr('You start with Swedish domestic flying out of Arlanda. Each region of the world needs traffic rights: earn the reputation and the flights, then buy them. A leg may be up to {nm} nm — further than that, fly there in legs and the board offers onward flights.',
      { nm: CONTRACTS.MAX_NM.toLocaleString('en-US') }) + '</div><div class="cards planes">' + cards + '</div>';
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

  // The hangar: a card per type (lightest first, or as the sort bar says), each with its picture (render/preview3d.js),
  // its key figures in tiles and the rest in rows
  // A type a course has just unlocked is shown first, in a gold frame, with the filters cleared
  // if they would hide it; it stays new until the pilot leaves the hangar.
  hangarBody() {
    const fresh = Career.newAircraft();
    if (fresh.length) {
      this.freshAc = fresh.map((a) => a.id);
      if (Filters.hangarList(fresh.slice()).length < fresh.length) Filters.hangarAction('reset');
      Career.seenNewAircraft();
    }
    const isFresh = (a) => !!(this.freshAc && this.freshAc.indexOf(a.id) >= 0);
    // the legend has its own card on top, whatever the filters say
    const legend = AIRCRAFT.find((a) => a.legend);
    const types = Filters.hangarList(AIRCRAFT.filter((a) => !a.legend)).sort((p, q) => isFresh(q) - isFresh(p));
    const cards = types.map((a) => this.aircraftCard(a, false, isFresh(a))).join('');
    const news = AIRCRAFT.filter(isFresh);
    return (news.length
      ? '<div class="hint fresh">★ ' + (news.length === 1 && news[0].legend ? (Career.mriyaOpen() ? tr('The Mriya is yours — select it for your next flight.') : tr('The Mriya is yours — pass every course to fly it.'))
        : tr('Your new rating opens {list} — select it to lease it for your next flight.', { list: '<b>' + news.map((a) => esc(a.name)).join(', ') + '</b>' })) + '</div>'
      : '<div class="hint">' + tr('Aircraft are leased for each sector — the rent is on every debrief. Bigger is not always better: a heavy jet needs runway, needs a rating, and costs more to lease.') + '</div>') +
      (legend ? this.legendCard(legend, isFresh(legend)) : '') +
      Filters.hangarBar() +
      (types.length ? '<div class="cards planes">' + cards + '</div>' : Filters.empty('hangarFilter', tr('No aircraft match the filters.')));
  },

  // The legend's card over the hangar, in a gold frame: the An-225 as a pale hologram, in its finish
  // over as much of it as is built (the parts fitted in its assembly hall, ui/mriya.js), the
  // progress, the hall's door, and its finishes (data/mriya.js: one the pilot has goes on at a press,
  // another is tried on in the hall); built, the whole aeroplane, to select like any other
  legendCard(a, fresh) {
    const m = Career.data.mriya, done = Career.mriyaDone();
    const n = m.placed.length, N = MRIYA_PARTS.length, pct = Math.floor(n / N * 100);
    const sel = Career.data.selected === a.id;
    const passed = COURSES.filter((c) => Career.has(c.id)).length;
    const here = done ? Career.here() : null, misfit = here ? Career.misfit(a, here) : null;
    const tile = (v, k) => '<div class="acStat"><b>' + v + '</b><span>' + esc(k) + '</span></div>';
    return '<div class="legendCard' + (done ? ' done' : '') + (sel ? ' sel' : '') + (fresh ? ' fresh' : '') + '">' +
      '<div class="acPic lgPic loading" style="--p:' + (done ? 100 : pct) + '%">' +
      (done ? '' : '<img class="lgGhost" data-ac="ghost|' + a.id + '" alt="">') +
      '<div class="lgGold"><img data-ac="finish|' + a.id + '|' + Career.mriyaFinish().id + '" alt="' + esc(a.name) + '"></div>' +
      (done ? '' : '<span class="lgEdge"></span>') +
      '<span class="tag lgTag">★ ' + tr('Legend') + '</span>' +
      '<span class="acMtow">' + Math.round(a.mtow / 1000) + ' t</span>' +
      (sel ? '<span class="acBadge sel">✓ ' + tr('Selected') + '</span>' : '') +
      '</div><div class="lgMain">' +
      '<div class="lgKicker">' + (done ? tr('Built with your own hands') : tr('The heaviest aeroplane ever flown')) + '</div>' +
      '<h3 class="lgName">' + esc(a.name) + ' <i lang="uk">' + MRIYA_LEGEND.native + '</i></h3>' +
      '<p class="acBlurb">' + esc(tr(done ? a.blurb : MRIYA_LEGEND.motto)) + '</p>' +
      (done
        ? '<div class="acStats">' + tile(Math.round(a.payloadKg / 1000) + ' t', tr('payload')) + tile(a.engines, tr('engines')) +
          tile(a.maxRangeNm + ' nm', tr('range')) + tile(a.cruiseTas + ' kt', tr('cruise')) + '</div>' +
          '<p class="lgOwn">🔑 ' + tr('Your own aircraft — no lease. Upkeep {kr} per block hour: its crew of six, its maintenance, insurance and hangar.', { kr: fmtMoney(a.rent) }) + '</p>'
        : '<div class="lgBar"><i style="width:' + pct + '%"></i></div>' +
          '<p class="lgCount"><b>' + pct + ' %</b> · ' + tr('{n} of {m} parts fitted', { n, m: N }) +
          (m.bought.length ? ' · ' + tr('{n} on the stand', { n: m.bought.length }) : '') + '</p>') +
      // (built at any time, flown only with every course passed)
      (Career.mriyaOpen() ? '' : '<p class="need">🔒 ' + tr('To fly it: every course passed — {n} of {m}', { n: passed, m: COURSES.length }) + '</p>') +
      '<div class="lgFinishes"><span>' + tr('Colour') + '</span>' + MRIYA_FINISHES.map((f) => {
        const own = Career.hasMriyaFinish(f.id), on = Career.mriyaFinish().id === f.id;
        return '<button class="lgSwatch' + (on ? ' on' : '') + (own ? '' : ' buy') + '" data-act="' + (own ? 'mriyaFinish' : 'mriyaTry') + '" data-v="' + f.id + '" aria-pressed="' + on + '" title="' +
          esc(tr(f.name) + (own ? '' : ' · ' + fmtMoney(finishPrice(f)))) + '" aria-label="' + esc(tr(f.name)) + '">' + finishDot(f) + '</button>';
      }).join('') + '<b class="lgFinName">' + esc(tr(Career.mriyaFinish().name)) + '</b></div>' +
      '<div class="cFoot">' + (misfit ? '<p class="fitWarn">⚠ ' + esc(this.misfitText(a, here, misfit)) + '</p>' : '') +
      (done ? '<button class="btn" data-act="mriya">' + tr('Assembly hall') + '</button>' +
        (Career.mriyaOpen() ? '<button class="btn' + (sel ? ' picked' : ' default') + '" data-act="selectAc" data-v="' + a.id + '">' + (sel ? '✓ ' + tr('Selected') : tr('Select')) + '</button>' : '')
        : '<button class="btn default fwd" data-act="mriya">' + (n || m.bought.length ? tr('Assembly hall') : tr('Build it')) + '</button>') +
      '</div></div></div>';
  },

  // an aircraft type's card: in the hangar, or in the pause of a flight in it (flying: no
  // selection, no lock, no button)
  aircraftCard(a, flying, fresh) {
    const locked = !flying && !Career.unlocked(a);
    const sel = !flying && Career.data.selected === a.id;
    const flights = locked ? 0 : Career.flightsIn(a.id);
    const course = a.unlock ? COURSES.find((c) => c.id === a.unlock) : null;
    const crew = a.seats < 10;
    // a type that does not suit the airport the pilot is at: a warning, but it may still be chosen
    const here = !flying && !locked ? Career.here() : null;
    const misfit = here ? Career.misfit(a, here) : null;
    const tile = (v, k) => '<div class="acStat"><b>' + v + '</b><span>' + esc(k) + '</span></div>';
    return '<div class="acCard plane' + (sel ? ' sel' : '') + (locked ? ' locked' : '') + (fresh ? ' fresh' : '') + '">' +
      '<div class="acPic loading" style="--glow:' + hexAlpha((a.look && a.look.color) || '#6fb1e8', 0.42) + '">' +
      '<img data-ac="' + a.id + '" alt="' + esc(a.name) + '">' +
      '<span class="tag">' + esc(tr(a.klass)) + '</span>' +
      '<span class="acMtow" title="' + esc(tr('Weight: max take-off / empty')) + '">' + Math.round(a.mtow / 1000) + ' t</span>' +
      (flights ? '<span class="acFlights" title="' + esc(tr('Flights you have completed in this type')) + '">✈ ' + tr('Flights: {n}', { n: flights }) + '</span>' : '') +
      (sel ? '<span class="acBadge sel">✓ ' + tr('Selected') + '</span>'
        : fresh ? '<span class="acBadge fresh">★ ' + tr('New') + '</span>'
        : locked ? '<span class="acBadge lock">🔒 ' + esc(this.courseText(course).name) + '</span>' : '') +
      '</div><div class="acMain">' +
      '<div class="acHead"><b>' + esc(a.name) + '</b>' + this.useBadges(a) + '</div>' +
      '<p class="acBlurb">' + esc(tr(a.blurb)) + '</p>' +
      '<div class="acStats">' +
      tile(a.seats, tr(crew ? 'crew' : 'seats')) +
      tile(Math.round(a.payloadKg / 100) / 10 + ' t', tr('payload')) +
      tile(a.maxRangeNm + ' nm', tr('range')) +
      tile(a.cruiseTas + ' kt', tr('cruise')) +
      '</div><div class="cGrid">' +
      row2(tr('Weight: max take-off / empty'), fmtTonnes(a.mtow) + ' t · ' + fmtTonnes(a.emptyKg) + ' t') +
      row2(tr('Length / span'), a.dims.len + ' m · ' + a.dims.span + ' m') +
      row2(tr('Runway needed'), a.takeoffDist + ' m') +
      row2(tr('Stall speed'), tr('{v} kt, full flaps, max weight', { v: Math.round(vs0Of(a, a.mtow)) })) +
      row2(tr('Crosswind limit'), a.crosswindLimit + ' kt') +
      row2(tr('Surfaces'), a.surfaces.map((x) => tr(x)).join(', ')) +
      (a.legend ? row2(tr('Upkeep per block hour'), fmtMoney(a.rent) + ' · ' + tr('your own aircraft')) : row2(tr('Lease per block hour'), fmtMoney(a.rent))) +
      '</div>' +
      (flying ? ''
        : locked
          ? '<div class="cFoot"><span class="need">' + tr('Locked — pass {course}', { course: esc(this.courseText(course).name) }) + '</span></div>'
          : '<div class="cFoot">' + (misfit ? '<p class="fitWarn">⚠ ' + esc(this.misfitText(a, here, misfit)) + '</p>' : '') +
            '<span class="ok">' + tr(sel ? 'Selected' : 'Available to lease') + '</span>' +
            '<button class="btn' + (sel ? ' picked' : ' default') + '" data-act="selectAc" data-v="' + a.id + '">' + (sel ? '✓ ' + tr('Selected') : tr('Select')) + '</button></div>') +
      '</div></div>';
  },

  // what a type is built for (Career.suits): a round badge per client group; bush work dimmed
  // while the pilot is not rated for it yet (Career.bushRated)
  useBadges(a) {
    return '<span class="useBadges">' + Career.suits(a).map((k) => {
      const off = k === 'bush' && !Career.bushRated();
      const title = tr(FACTIONS[k].short) + (off ? ' · ' + tr('needs the Short Field Ops course or {n} reputation', { n: CONTRACTS.BUSH_REP }) : '');
      return '<span class="use ' + k + (off ? ' off' : '') + '" title="' + esc(title) + '" aria-label="' + esc(title) + '">' + UseIcons.svg(k) + '</span>';
    }).join('') + '</span>';
  },

  // why a type does not suit an airport, in words (Career.misfit)
  misfitText(a, apt, why) {
    if (why === 'runway') return tr('Not for {apt}: its runway is {have} m, this type needs {need} m', { apt: aptName(apt), have: apt.rwyLen, need: a.takeoffDist });
    if (why === 'grass') return tr('Not for {apt}: a grass strip, and this type is not cleared for grass', { apt: aptName(apt) });
    return tr('Too big for {apt}: a {span} m wingspan, its stands and taxiways take up to {max} m', { apt: aptName(apt), span: a.dims.span, max: LAYOUT.MAX_SPAN[apt.terminal] });
  },

  // The course tree, in the game's language (the exams run in it too): a card with the courses
  // passed, the ones open now and the one to open next, then a column per branch — every course
  // a card with its picture (art/courseicons.js), what it asks for (the course before it, the
  // flights flown, the reputation) ticked off as it is met, the types it unlocks and its exam
  trainingBody() {
    const lang = this.quizLang(), T = QUIZ_TEXT[lang];
    const flown = Career.data.stats.flights;
    const passed = COURSES.filter((c) => Career.has(c.id)).length;
    const open = COURSES.filter((c) => Career.courseState(c).available);
    // the course to open next: of those still closed, the one that asks for the fewest flights
    const next = COURSES.filter((c) => { const st = Career.courseState(c); return !st.bought && !st.available; })
      .sort((x, y) => (x.flights || 0) - (y.flights || 0))[0];
    const icon = (c) => this.courseIcon(c);
    const head = '<div class="trHead">' +
      '<div class="trRing" style="--p:' + Math.round(passed / COURSES.length * 100) + '"><b>' + passed + '</b><span>/ ' + COURSES.length + '</span></div>' +
      '<div class="trHeadText"><h3>' + tr('Courses passed') + '</h3>' +
      (open.length ? '<p class="trOpen">' + tr('Open now') + ': ' + open.map((c) => '<b>' + esc(this.courseText(c, lang).name) + '</b>').join(', ') + '</p>' : '') +
      (next ? '<p class="trNext">' + icon(next) + '<span>' + tr('Next to open') + ': <b>' + esc(this.courseText(next, lang).name) + '</b><br>' +
        this.courseNeeds(next, true) + '</span></p>'
        : passed === COURSES.length ? '<p class="trOpen ok">' + tr('Every course passed.') + '</p>' : '') +
      '</div></div>';
    const fold = Career.settings.trainingFold || {};
    const branch = (b, order) => {
      const courses = COURSES.filter((c) => c.branch === b).sort((x, y) => x.tier - y.tier || (x.flights || 0) - (y.flights || 0));
      const done = courses.filter((c) => Career.has(c.id)).length;
      // folded: as the pilot left it, or else a branch passed to the end
      const folded = typeof fold[b] === 'boolean' ? fold[b] : done === courses.length;
      const mini = courses.map((c) => {
        const st = Career.courseState(c);
        return '<span class="miniCo ' + (st.bought ? 'done' : st.available ? 'open' : 'locked') + '" title="' + esc(this.courseText(c, lang).name) + '">' + icon(c) + '</span>';
      }).join('');
      const items = courses.map((c) => {
        const st = Career.courseState(c);
        const afford = Career.canAfford(c);
        const tx = this.courseText(c, lang);
        const state = st.bought ? 'done' : st.available ? 'open' : 'locked';
        const badge = st.bought ? '<span class="coState ok">✓ ' + esc(T.done) + '</span>'
          : st.available ? '<span class="price">' + (c.cost ? fmtMoney(c.cost) : esc(T.free)) + '</span>'
            : '<span class="coState">🔒 ' + esc(T.locked) + '</span>';
        const types = AIRCRAFT.filter((a) => a.unlock === c.id);
        const can = st.available && afford;
        return '<div class="course ' + state + '" style="--bc:' + COURSE_COLOR[b] + '">' +
          '<div class="coHead">' + icon(c) + '<div class="coTitle"><small>' + tr('Level {n}', { n: c.tier + (b === 'general' ? 1 : 0) }) + '</small>' +
          '<b>' + esc(tx.name) + '</b></div>' + badge + '</div>' +
          '<p>' + esc(tx.blurb) + '</p>' +
          '<p class="effect">' + esc(tx.effect) + '</p>' +
          (types.length ? '<div class="coTypes">' + types.map((a) => '<span>✈ ' + esc(a.name) + '</span>').join('') + '</div>' : '') +
          (st.bought ? '' : this.courseNeeds(c) +
            (st.available ? '<button class="btn small' + (can ? ' default' : ' disabled') + '" data-act="course" data-v="' + c.id + '"' +
              (can ? '' : ' disabled') + '>' + esc(afford ? T.take : T.noMoney) + '</button>' : '')) +
          '</div>';
      }).join('');
      return '<section class="branch' + (folded ? ' folded' : '') + '" data-b="' + b + '" style="--bc:' + COURSE_COLOR[b] + ';order:' + order + '">' +
        '<button class="brHead" data-act="branch" data-v="' + b + '" aria-expanded="' + !folded + '" title="' + esc(tr('Show or hide the courses')) + '">' +
        '<span class="brIcon">' + (b === 'general' ? CourseIcons.svg('general') : UseIcons.svg(b)) + '</span>' +
        '<span class="brName">' + esc(T.branches[b]) + '</span>' +
        '<span class="cvCount">' + done + ' / ' + courses.length + '</span><i class="brChev"></i>' +
        '<span class="brMini">' + mini + '</span></button>' +
        '<div class="brBody"><div class="brInner">' + items + '</div></div></section>';
    };
    // two columns on a tablet hold two branches each, of about the same length: the general and
    // the cargo courses, the passenger and the bush ones; one or four columns undo the pairs and
    // take the branches in their own order (styles.css)
    return head + '<div class="hint">' + esc(T.intro) + '</div><div class="trTree"><div class="branches">' +
      '<div class="brPair">' + branch('general', 1) + branch('cargo', 3) + '</div>' +
      '<div class="brPair">' + branch('pax', 2) + branch('bush', 4) + '</div></div></div>';
  },
  // a branch folded or unfolded where it is, without drawing the tab anew (so it slides), and
  // remembered: a branch never touched folds by itself once every course in it is passed
  foldBranch(b) {
    const el = this.screen.querySelector('.branch[data-b="' + b + '"]');
    if (!el) return;
    const folded = !el.classList.contains('folded');
    Career.settings.trainingFold = Object.assign({}, Career.settings.trainingFold, { [b]: folded });
    Career.saveSettings();
    // the courses are clipped only while they slide, so the open course's glow is not cut off
    el.classList.add('sliding');
    clearTimeout(el.slideTimer);
    el.slideTimer = setTimeout(() => el.classList.remove('sliding'), UI_FOLD_MS + 60);
    el.classList.toggle('folded', folded);
    el.querySelector('.brHead').setAttribute('aria-expanded', String(!folded));
  },
  // what a course asks for, ticked off as it is met: the courses before it, the flights flown in
  // all, the reputation with its clients — each with how far the pilot has come; `short`: only
  // what is still missing, on one line (the training card's "next to open")
  courseNeeds(c, short) {
    const st = Career.courseState(c), flown = Career.data.stats.flights;
    const rows = [];
    for (const r of c.requires || []) {
      const rc = COURSES.find((x) => x.id === r);
      if (rc) rows.push({ ok: Career.has(r), text: tr('Course: {name}', { name: this.courseText(rc).name }) });
    }
    if (c.flights) rows.push({ ok: st.reqFlights, text: tr('Flights flown'), have: flown, need: c.flights });
    if (c.rep) {
      const who = c.branch === 'general' ? tr('Reputation (any group)') : tr('Reputation · {group}', { group: tr(FACTIONS[c.branch].short) });
      rows.push({ ok: st.reqRep, text: who, have: Math.floor(Career.repFor(c.branch)), need: c.rep });
    }
    if (short) {
      return rows.filter((r) => !r.ok).map((r) => esc(r.text) + (r.need ? ' ' + Math.min(r.have, r.need) + ' / ' + r.need : '')).join(' · ');
    }
    if (!rows.length) return '';
    return '<ul class="coNeeds">' + rows.map((r) => '<li class="' + (r.ok ? 'ok' : 'need') + '"><i>' + (r.ok ? '✓' : '·') + '</i>' +
      '<span>' + esc(r.text) + '</span>' +
      (r.need ? '<em>' + Math.min(r.have, r.need) + ' / ' + r.need + '</em><span class="reqBar"><i style="width:' +
        Math.round(Math.min(1, r.have / r.need) * 100) + '%"></i></span>' : '') + '</li>').join('') + '</ul>';
  },
  // a course's picture in a round badge of its branch's colour
  courseIcon(c) {
    return '<span class="coIcon" style="--bc:' + COURSE_COLOR[c.branch] + '">' + CourseIcons.svg(c.id) + '</span>';
  },
  // a course's name, description and effect in the game's language (English from COURSES)
  courseText(c, lang) {
    lang = lang || this.quizLang();
    const t = COURSE_TEXT[lang] && COURSE_TEXT[lang][c.id];
    return t ? { name: t[0], blurb: t[1], effect: t[2] } : { name: c.name, blurb: c.blurb, effect: c.effect };
  },

  // the Career tab: the pilot's card on top, the records in tiles, then the reputation, the
  // licences, the log as a timeline and what the courses have unlocked
  careerBody() {
    const d = Career.data;
    const fx = Career.effects();
    const s = d.stats;
    const base = World.byId[d.base];
    const passed = COURSES.filter((c) => Career.has(c.id));
    const initials = d.pilot.name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('') || '✈';
    const smoothPct = s.landings ? Math.round(s.perfect / s.landings * 100) : 0;
    const gradeCls = s.bestGrade === 'A+' || s.bestGrade === 'A' ? ' top' : s.bestGrade === 'E' || s.bestGrade === 'F' ? ' bad' : '';
    const tile = (label, value, cls, sub) => '<div class="cvStat' + (cls || '') + '"><b>' + value + '</b><span>' + esc(label) + '</span>' +
      (sub ? '<small>' + sub + '</small>' : '') + '</div>';
    const unlocks = [
      [fx.hint, tr('Advanced systems — checklist hints and more time')],
      [fx.ifr, tr('Instrument rating — you may fly into low cloud and use the ILS')],
      [fx.hazmat, tr('Dangerous goods contracts')],
      [fx.payloadTol > 1, tr('Weight and balance — 15 % more payload before you are over weight')],
      [fx.iceFactor < 1, tr('De-icing — ice builds {p} % slower', { p: Math.round((1 - fx.iceFactor) * 100) })],
      [fx.medevac, tr('Medevac and search and rescue contracts')],
      [fx.forecast, tr('Full weather reports at both ends, and better fuel planning')],
      [fx.mountain, tr('Mountain and adverse weather routes')],
      [fx.turboprop, tr('Regional turboprops — the ATR 72-600, and +10 % on short legs in a turboprop')],
      [fx.fbw, tr('Fly-by-wire jets — the Embraer E195-E2 and the Airbus A220-300')],
      [fx.widebody, tr('Widebody procedures — the Airbus A350-900, the Boeing 777-300ER and the Airbus A380')],
      [fx.etops, tr('ETOPS — the Airbus A330-300 and the Boeing 787-9, and +10 % on long legs in a twin')],
      [fx.outsize, tr('Outsize cargo — the Antonov An-124, onto gravel and ice')],
      [fx.remote, tr('Remote strips and ice fields for every type')],
      [Career.mriyaDone(), tr('The An-225 Mriya — built again with your own hands')]
    ];
    const opened = unlocks.filter((u) => u[0]).length;
    const log = (d.log || []).map((l) => '<li class="' + logKind(l) + '">' + arrowsHtml(esc(logText(l)), 'soft') + '</li>').join('');
    const count = (n, m) => '<span class="cvCount">' + n + ' / ' + m + '</span>';
    const rank = Career.rank();
    const name = this.renaming
      ? '<div class="cvRename"><input id="pilotRename" value="' + esc(d.pilot.name) + '" maxlength="24" aria-label="' + esc(tr('Pilot name')) + '">' +
        '<button class="chip" data-act="rerollName" title="' + esc(tr('Another name')) + '" aria-label="' + esc(tr('Another name')) + '">🎲</button>' +
        '<button class="btn small default" data-act="renameSave" data-enter>' + tr('Save') + '</button>' +
        '<button class="btn small" data-act="renameCancel">' + tr('Cancel') + '</button></div>'
      : '<div class="cvName">' + esc(d.pilot.name) + '<button class="cvEdit" data-act="rename" title="' + esc(tr('Change the name')) + '" aria-label="' +
        esc(tr('Change the name')) + '">' + PENCIL_SVG + '</button></div>';
    return '<div class="cvHero">' +
      '<div class="cvBadge"><span>' + esc(initials) + '</span>' + epaulette(rank) + '</div>' +
      '<div class="cvWho">' + name +
      '<div class="cvChips"><span class="cvChip gold">' + rank.licence + '</span>' +
      '<span class="cvChip">' + esc(tr(rank.title)) + '</span>' +
      '<span class="cvChip">' + (base ? flagImg(base) : '') + esc(tr('Home base')) + ': <b>' + (base ? esc(aptName(base)) : d.base) + '</b></span>' +
      '<span class="cvChip">' + esc(tr('Difficulty')) + ': <b>' + esc(tr(Career.difficulty.name)) + '</b></span></div></div>' +
      '<div class="cvBal"><span>' + esc(tr('Balance')) + '</span><b>' + fmtMoney(d.money) + '</b></div>' +
      '</div>' +
      '<div class="cvStats">' +
      tile(tr('Flights flown'), s.flights) +
      tile(tr('Block time'), fmtTime(s.blockTime)) +
      tile(tr('Landings'), s.landings) +
      tile(tr('Smooth landings'), s.perfect, s.perfect ? ' good' : '', s.landings ? smoothPct + ' %' : '') +
      tile(tr('Flights lost'), s.crashes, s.crashes ? ' bad' : '') +
      tile(tr('Best grade'), s.bestGrade || '—', ' grade' + gradeCls) +
      tile(tr('Best single flight'), fmtMoney(s.bestPay), ' money') +
      tile(tr('Cheats used'), s.cheats, s.cheats ? ' warn' : '') +
      '</div>' +
      '<div class="careerCols"><div>' +
      this.rankCard() +
      '<section class="cvCard"><h3>' + tr('Reputation') + '</h3>' +
      Object.keys(FACTIONS).map((k) => {
        const v = Math.max(0, Math.min(100, d.rep[k]));
        return '<div class="repRow" style="--c:' + FACTIONS[k].color + '">' +
          '<span class="use ' + k + '">' + UseIcons.svg(k) + '</span>' +
          '<span class="repName">' + esc(tr(FACTIONS[k].name)) + '</span><b>' + Math.round(v) + '</b>' +
          '<div class="bar"><i style="width:' + v + '%"></i></div></div>';
      }).join('') + '</section>' +
      '<section class="cvCard"><h3>' + tr('Licences and ratings') + count(passed.length, COURSES.length) + '</h3>' +
      '<div class="cvProgress"><i style="width:' + Math.round(passed.length / COURSES.length * 100) + '%"></i></div>' +
      '<div class="licList">' + (passed.length ? passed.map((c) => '<span class="lic">' + esc(this.courseText(c).name) + '</span>').join('')
        : '<span class="cvNone">' + tr('none yet') + '</span>') + '</div></section>' +
      '<section class="cvCard cvLog"><h3>' + tr('Log') + '</h3><ul class="log">' + (log || '<li>' + tr('Nothing yet.') + '</li>') + '</ul></section>' +
      '</div><div>' +
      '<section class="cvCard"><h3>' + tr('Unlocked by your courses') + count(opened, unlocks.length) + '</h3><ul class="unlocks">' +
      unlocks.map((u) => unlockLine(u[0], u[1])).join('') + '</ul></section>' +
      '</div></div>' +
      '<div class="btnRow"><button class="btn danger" data-act="wipe">' + tr('Delete career') + '</button></div>';
  },

  // the licence and the rank: the ladder of the ranks with their stripes (passed, held, still to
  // earn), then what the next one asks for, ticked off as it is met
  rankCard() {
    const now = Career.data.rank || 0, next = PILOT_RANKS[now + 1];
    const steps = PILOT_RANKS.map((r, i) => '<li class="' + (i < now ? 'done' : i === now ? 'cur' : 'later') + '">' + epaulette(r) +
      '<b>' + esc(tr(r.title)) + '</b><small>' + r.licence + '</small></li>').join('');
    let needs = '';
    if (next) {
      const rows = Career.rankNeeds(next).map((n) => {
        const c = n.course && COURSES.find((x) => x.id === n.course);
        const text = c ? tr('Course: {name}', { name: this.courseText(c).name })
          : n.flights ? tr('Flights flown') : n.all ? tr('Every course passed') : tr('Courses passed');
        const need = n.flights || n.passed;
        return '<li class="' + (n.ok ? 'ok' : 'need') + '"><i>' + (n.ok ? '✓' : '·') + '</i><span>' + esc(text) + '</span>' +
          (need ? '<em>' + Math.min(n.have, need) + ' / ' + need + '</em><span class="reqBar"><i style="width:' +
            Math.round(Math.min(1, n.have / need) * 100) + '%"></i></span>' : '') + '</li>';
      }).join('');
      needs = '<p class="rankNext">' + tr('Next: <b>{rank}</b> · {licence}', { rank: esc(tr(next.title)), licence: next.licence }) + '</p>' +
        '<ul class="coNeeds">' + rows + '</ul>';
    } else needs = '<p class="rankNext ok">' + tr('The highest rank there is.') + '</p>';
    return '<section class="cvCard rankCard"><h3>' + tr('Rank') + '<span class="cvCount">' + (now + 1) + ' / ' + PILOT_RANKS.length + '</span></h3>' +
      '<ol class="rankLadder">' + steps + '</ol>' + needs + '</section>';
  },
  // a new rank, on the screen after the flight or the exam that earned it
  promoHtml(r) {
    return r ? '<div class="promo">' + epaulette(r) + '<div><small>' + tr('Promoted') + '</small><b>' + esc(tr(r.title)) + '</b><span>' + r.licence + '</span></div></div>' : '';
  },

  // an airport's table, in the briefing and in the pause: the stand, the runway in use, the
  // elevation and the weather x
  airportRows(x, a, gate) {
    const wind = tr('{v} kt from {d}°', { v: Math.round(x.speed), d: String(Math.round(x.dir)).padStart(3, '0') }) +
      (x.gust > 2 ? ', ' + tr('gusting {v}', { v: Math.round(x.speed + x.gust) }) : '');
    const cross = Math.abs(Math.sin((x.dir - a.hdgDeg) * DEG) * x.speed);
    return (gate !== undefined ? '<tr><td>' + tr('Stand') + '</td><td>' + gateLabel(a, gate) + '</td></tr>' : '') +
      '<tr><td>' + tr('Runway in use') + '</td><td>' + a.rwyName + ' · ' + a.rwyLen + ' m</td></tr>' +
      '<tr><td>' + tr('Elevation') + '</td><td>' + Math.round(a.elev / FT) + ' ft</td></tr>' +
      '<tr><td>' + tr('Wind') + '</td><td>' + wind + (cross > 4 ? ' · ' + tr('crosswind {v} kt', { v: Math.round(cross) }) : '') + '</td></tr>' +
      '<tr><td>QNH</td><td>' + x.qnh + ' hPa</td></tr>' +
      '<tr><td>' + tr('Visibility') + '</td><td>' + (x.vis / 1000).toFixed(1) + ' km</td></tr>' +
      '<tr><td>' + tr('Cloud') + '</td><td>' + tr('base {b} ft, tops {t} ft', { b: fmtAlt(x.cloudBase), t: fmtAlt(x.cloudTop) }) + '</td></tr>' +
      '<tr><td>' + tr('Temperature') + '</td><td>' + Math.round(x.temp) + ' °C' + (x.snow ? ' · ' + tr('snow') : x.precip === 'rain' ? ' · ' + tr('rain') : '') + '</td></tr>' +
      (x.icing ? '<tr><td>' + tr('ICING') + '</td><td>' + tr('expected in cloud — anti-ice K') + '</td></tr>' : '') +
      (x.stormy ? '<tr><td>' + tr('WIND') + '</td><td>' + tr('stormy — expect turbulence and shear') + '</td></tr>' : '');
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
    const w = (x, a) => this.airportRows(x, a, a === from ? c.depGate : c.arrGate);
    this.panel(
      '<div class="screenBar"><button class="btn back" data-act="tab" data-v="dispatch" data-esc>' + tr('Back to the board') + '</button></div>' +
      '<h2 class="clientHead">' + clientLogo(c, true) + esc(c.client) + '</h2>' +
      '<div class="briefTop"><div class="bigRoute">' + routeHtml(c.fromId, c.toId) + '</div>' +
      '<div class="bigPay">' + fmtMoney(c.pay) + '</div></div>' +
      (typeof RouteMap !== 'undefined' ? '<img class="briefMap" src="' + RouteMap.url(from, to) + '" alt="' + esc(c.fromId + ' → ' + c.toId) + '">' : '') +
      '<div class="briefCols"><div>' +
      '<h3>' + flagImg(from) + esc(aptName(from)) + ' · ' + from.id + '</h3><table class="wx">' + w(setup.weather.dep, from) + '</table>' +
      '<h3>' + flagImg(to) + esc(aptName(to)) + ' · ' + to.id + '</h3><table class="wx">' + w(setup.weather.arr, to) + '</table>' +
      '<p class="fineprint">' + (setup.weather.arr.vis < 3000
        ? tr('Low visibility at {id} — fly the ILS, the autopilot can couple to it down to 200 ft.', { id: to.id })
        : tr('Visibility is good for the approach at {id}.', { id: to.id })) + '</p>' +
      // a free look round either airport (Game.tour)
      '<div class="tourPick">' +
      '<button class="chip" data-act="tour" data-v="dep">' + tr('Look around {id}', { id: from.id }) + '</button>' +
      '<button class="chip" data-act="tour" data-v="arr">' + tr('Look around {id}', { id: to.id }) + '</button></div>' +
      '<p class="fineprint">' + tr('Free: a flight round the airport — the approach, the runway, the terminal and your aircraft where the flight finds it.') + '</p>' +
      '</div><div>' +
      '<h3>' + tr('The job') + '</h3><div class="cGrid">' +
      row2(tr('Aircraft'), esc(ac.name) + ' · ' + esc(tr(ac.klass))) +
      row2(tr('Load'), loadText(c)) +
      row2(tr('Distance'), c.distanceNm + ' nm') +
      row2(tr('En route'), tr('about {t} at 1× — use the autopilot and time acceleration', { t: fmtDuration(c.blockMin) })) +
      row2(tr('Arrival, local time'), this.arrivalClock(c, from, to)) +
      row2(tr('Fuel'), tr('plan {p} kg · on board {b} kg', { p: c.fuelKg, b: Math.round(setup.blockFuel) })) +
      row2(tr('Take-off weight'), tr('{w} t · max {m} t', { w: fmtTonnes(ac.emptyKg + c.payloadKg + setup.blockFuel), m: fmtTonnes(ac.mtow) })) +
      row2(tr('Reputation'), '+' + c.repGain + ' ' + esc(tr(FACTIONS[c.faction].short))) +
      (ac.legend ? row2(tr('Upkeep'), '−' + fmtMoney(ac.rent) + ' · ' + tr('your own aircraft')) : row2(tr('Lease'), '−' + fmtMoney(ac.rent))) +
      '</div>' +
      '<h3>' + tr('Departure time') + '</h3>' +
      '<div class="setGroup todPick">' + Object.keys(TIME_OF_DAY).map((k) => {
        const d = TIME_OF_DAY[k];
        return '<button class="chip' + (Career.timeOfDay === k ? ' on' : '') + '" data-act="tod" data-v="' + k + '">' +
          esc(tr(d.name)) + ' ' + fmtClock(d.hour * 3600) + (d.bonus ? ' · +' + fmtMoney(Math.round(c.pay * d.bonus)) : '') + '</button>';
      }).join('') + '</div>' +
      '<p class="fineprint">' + tr('In the dark the runway is its lights, the PAPI and your landing lights: harder, and paid more.') + '</p>' +
      '<h3>' + tr('How you start') + '</h3>' +
      // two buttons side by side, the pilot's habit lit: the arrows reach them like every other button
      '<div class="startPick">' +
      '<button class="chip' + (Career.skipPushback ? '' : ' on') + '" data-act="startMode" data-v="gate" aria-pressed="' + !Career.skipPushback + '">' +
      '<b>' + tr('At the gate') + '</b><small>' + tr('push back, start the engines, taxi out · +{bonus} and reputation for the full ground procedure', { bonus: fmtMoney(Math.round(c.pay * CONTRACTS.FULL_GROUND_BONUS)) }) + '</small></button>' +
      '<button class="chip' + (Career.skipPushback ? ' on' : '') + '" data-act="startMode" data-v="pushback" aria-pressed="' + Career.skipPushback + '">' +
      '<b>' + tr('At the runway') + '</b><small>' + tr('at the holding point, the engines running, cleared for take-off · about 5 minutes less on the ground, no procedure bonus') + '</small></button>' +
      '</div>' +
      '<p class="fineprint">' + tr('The full procedure is the real routine of the job; take the short start when you just want to fly. Your choice is remembered.') + '</p>' +
      '<div class="btnRow"><button class="btn default fwd big" data-act="fly">' + tr('Fly it') + '</button>' +
      '<button class="btn" data-act="practice"' + (Career.data.money < fee ? ' disabled' : '') + '>' +
      tr('Practice the landing · {fee}', { fee: fmtMoney(fee) }) + '</button></div>' +
      '<p class="fineprint">' + tr('Practice the landing: you start on the final at {id}, clean (gear and flaps up), the autopilot holds the glide path for {s} s and hands over {nm} nm out, then you lower the gear and the flaps, land and brake below {v} kt. Nothing is lost if it goes wrong; a good landing earns a little reputation with {who}.',
        { nm: PRACTICE.HANDOVER_NM, id: to.id, s: PRACTICE.AP_SECONDS, v: SIM.ROLLOUT_EXIT_KT, who: esc(tr(FACTIONS[c.faction].name)) }) + '</p>' +
      '</div></div>');
  },

  // the clock at the arrival when the flight lands: the departure time picked below, the planned
  // flight time, and the two airports' UTC offsets (a day later past midnight)
  arrivalClock(c, from, to) {
    const tod = TIME_OF_DAY[Career.timeOfDay] || TIME_OF_DAY.day;
    const dh = utcOffset(to) - utcOffset(from);
    const min = tod.hour * 60 + c.blockMin + dh * 60;
    const day = Math.floor(min / 1440);
    const zone = dh ? tr('{d} h on {id}', { d: (dh > 0 ? '+' : '−') + Math.abs(dh), id: from.id }) : tr('the same time as {id}', { id: from.id });
    return '<b>' + fmtClock(((min % 1440) + 1440) % 1440 * 60) + '</b> ' + to.id +
      (day > 0 ? ' · ' + tr('the next day') : day < 0 ? ' · ' + tr('the day before') : '') + ' · ' + zone;
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
      '<div class="screenBar"><button class="btn back" data-act="brief" data-esc>' + tr('Back to the briefing') + '</button></div>' +
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
      '<button class="btn fwd" data-act="fly">' + tr('Fly it for real') + '</button>' +
      '</div>', 'narrow');
  },

  // ---------- debrief ----------
  showDebrief(result, failed) {
    Input.active = false;
    const p = result.payout || { lines: [], total: 0 };
    const landed = Game.flight && Game.flight.landed;
    const gradeCls = 'grade' + (result.grade === 'A+' || result.grade === 'A' ? ' top' : result.grade === 'F' || result.grade === 'E' ? ' bad' : '') +
      (failed ? ' word' : '');                     // a word instead of a letter: smaller, so it fits a phone
    const body =
      '<div class="debriefTop">' +
      '<div class="' + gradeCls + '">' + (failed ? tr('LOST') : result.grade) + '</div>' +
      '<div class="debriefTitle">' + (failed ? esc(Game.failure ? Game.failure.text : tr('The flight was lost'))
        : arrowsHtml(tr('Flight complete · {from} → {to}', { from: result.contract.fromId, to: result.contract.toId }))) + '</div>' +
      '</div>' +
      (failed ? '' :
        '<div class="cols"><div><h3>' + tr('Touchdown') + '</h3>' + touchdownGrid(landed) +
        '</div><div><h3>' + tr('In the log') + '</h3><ul class="unlocks">' +
        '<li>' + tr('Block time {b} · real time {r}', { b: fmtTime(result.blockSec), r: fmtTime(result.realSec) }) + '</li>' +
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
      this.promoHtml(p.promoted) +
      (p.rep ? '<p class="repGain">' + tr('Reputation with {who}', { who: esc(tr(FACTIONS[result.contract.faction].name)) }) +
        ': <b>' + (p.rep > 0 ? '+' : '') + p.rep.toFixed(1) + '</b></p>' : '') +
      (p.bankrupt ? '<p class="need">' + tr('Your balance is below −50 000 kr. Nobody will lease you an aeroplane any more — this career is over.') + '</p>' : '') +
      '<div class="settingsRow">' + this.difficultyChips() + '</div>' +
      '<div class="btnRow">' +
      (p.bankrupt ? '<button class="btn default" data-act="gameover">' + tr('Start again') + '</button>'
        : failed ? '<button class="btn default" data-act="retry">' + tr('Try again') + '</button><button class="btn" data-act="ops">' + tr('Back to ops') + '</button>'
          : '<button class="btn default fwd" data-act="ops">' + tr('Next flight') + '</button>') +
      '</div>';
    this.panel(body, 'debrief');
  },

  // ---------- pause ----------
  showPause() {
    const fl = Game.flight;
    this.panel(
      '<h2>' + tr('Paused') + '</h2>' +
      '<p class="lead">' + (fl ? esc(fl.contract.client) + ' · ' + routeHtml(fl.contract.fromId, fl.contract.toId) : '') + '</p>' +
      '<div class="btnRow"><button class="btn default" data-act="resume">' + tr('Resume') + '</button>' +
      (fl ? '<button class="btn" data-act="pauseFlight">' + tr('The flight') + '</button>' +
        '<button class="btn" data-act="pauseAircraft">' + tr('The aircraft') + '</button>' : '') +
      '<button class="btn" data-act="restart">' + tr('Restart this flight') + '</button>' +
      '<button class="btn" data-act="howto2">' + tr('Controls') + '</button>' +
      '<button class="btn" data-act="ops">' + tr('Abandon, back to ops') + '</button></div>' +
      '<div class="settingsRow">' + this.difficultyChips() + this.soundChip() + this.unitChips() + this.pitchChips() + this.aidChip() + this.cabinChip() + '</div>' +
      '<p class="fineprint">' + tr('Esc, Space or Enter resumes. A new difficulty applies from the next flight or the restart.') + '</p>', 'narrow');
  },

  // from the pause: the flight's contract card, or the card of the aircraft flying it, as on the
  // board and in the hangar
  showPauseCard(what) {
    const fl = Game.flight;
    if (!fl) { this.showPause(); return; }
    this.panel(
      '<div class="screenBar"><button class="btn back" data-act="pauseBack" data-esc>' + tr('Back') + '</button></div>' +
      '<h2>' + tr('Paused') + '</h2>' +
      (what === 'aircraft' ? '<div class="cards planes">' + this.aircraftCard(fl.ac, true) + '</div>'
        : '<div class="contracts">' + this.contractCard(fl.contract, null, true) + '</div>' + this.pauseAirports(fl)) +
      '<div class="btnRow"><button class="btn default" data-act="resume">' + tr('Resume') + '</button></div>', 'narrow');
    if (what === 'aircraft' && typeof AircraftPreview !== 'undefined') AircraftPreview.fill(this.screen);
  },

  // the flight's two airports, as in the briefing (the weather the flight was set up with)
  pauseAirports(fl) {
    const c = fl.contract, s = Game.setup;
    if (!s || !s.weather) return '';
    const from = World.byId[c.fromId], to = World.byId[c.toId];
    const block = (a, x, gate) => '<div><h3>' + flagImg(a) + esc(aptName(a)) + ' · ' + a.id + '</h3><table class="wx">' + this.airportRows(x, a, gate) + '</table></div>';
    return '<div class="briefCols pauseApts">' + block(from, s.weather.dep, c.depGate) + block(to, s.weather.arr, c.arrGate) + '</div>';
  },

  // aviation units (ft, kt, nm) or metric (m, km/h, km)
  unitChips() {
    const u = Career.settings.units === 'metric' ? 'metric' : 'aviation';
    return '<div class="setGroup"><span>' + tr('Units') + '</span>' +
      '<button class="chip' + (u === 'aviation' ? ' on' : '') + '" data-act="units" data-v="aviation" title="' + esc(tr('feet, knots, nautical miles')) + '">ft · kt · nm</button>' +
      '<button class="chip' + (u === 'metric' ? ' on' : '') + '" data-act="units" data-v="metric" title="' + esc(tr('metres, km/h, kilometres')) + '">m · km/h · km</button></div>';
  },

  // every sound of the game, the callouts and the cabin announcements included (on the title and in the pause)
  soundChip() {
    const on = Career.settings.sound;
    return '<div class="setGroup"><span>' + tr('Sound') + '</span>' +
      '<button class="chip' + (on ? ' on' : '') + '" data-act="sound">' + tr(on ? 'On' : 'Off') + '</button></div>';
  },

  // which way of the arrow keys and the touch stick lifts the nose: down (pull back, the default) or up
  pitchChips() {
    const up = Career.settings.noseUp === 'up';
    return '<div class="setGroup"><span>' + tr('Nose up') + '</span>' +
      '<button class="chip' + (up ? '' : ' on') + '" data-act="noseUp" data-v="down" title="' + esc(tr('↓ and the stick pulled down lift the nose, like pulling back a yoke')) + '">↓ ' + tr('Down') + '</button>' +
      '<button class="chip' + (up ? ' on' : '') + '" data-act="noseUp" data-v="up" title="' + esc(tr('↑ and the stick pushed up lift the nose')) + '">↑ ' + tr('Up') + '</button></div>';
  },

  // the landing aid: the ILS scales with plain words and the dotted glide path on the approach
  aidChip() {
    const on = Career.settings.landingAid !== false;
    return '<div class="setGroup"><span>' + tr('Landing aid') + '</span>' +
      '<button class="chip' + (on ? ' on' : '') + '" data-act="landingAid" title="' + esc(tr('the ILS scales and the dotted glide path on the approach')) + '">' +
      tr(on ? 'On' : 'Off') + '</button></div>';
  },

  // the cabin announcements on a passenger flight (ui/cabin.js)
  cabinChip() {
    const on = Career.settings.cabinPa !== false;
    return '<div class="setGroup"><span>' + tr('Cabin announcements') + '</span>' +
      '<button class="chip' + (on ? ' on' : '') + '" data-act="cabinPa" title="' + esc(tr('the crew speaks to the passengers: before the take-off, at the cruise level, on the descent, before the landing and at the arrival')) + '">' +
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
      if (pass && !q.paid) { Career.buyCourse(q.course); q.paid = true; q.promoted = Career.promotion; Audio2.cue('good'); }
      if (!pass && !q.told) { q.told = true; Audio2.cue('bad'); }
      this.panel((pass
        ? '<div class="badgeWon">' + this.courseIcon(q.course) + '<b>' + esc(tx.name) + '</b></div>'
        : '<div class="quizTop">' + this.courseIcon(q.course) + '<h2>' + esc(tx.name) + '</h2></div>') +
        '<p class="lead">' + (pass
          ? esc(T.passed) + ' — ' + q.correct + ' / ' + q.questions.length + ' ' + esc(T.correct) + '.' +
            (q.course.cost ? ' ' + esc(T.fee) + ' ' + fmtMoney(q.course.cost) + '.' : '')
          : esc(T.failed) + ' — ' + q.correct + ' / ' + q.questions.length + ' ' + esc(T.correct) + '. ' + esc(T.need)) + '</p>' +
        (pass ? '<p class="ok">' + esc(tx.effect) + '</p>' + this.promoHtml(q.promoted) : '') +
        '<div class="btnRow">' + (pass ? (Career.newAircraft().length
          ? '<button class="btn default fwd" data-act="tab" data-v="hangar">' + tr('To the hangar') + '</button>' +
            '<button class="btn" data-act="quizdone" data-esc>' + esc(T.back) + '</button>'
          : '<button class="btn default" data-act="quizdone" data-esc>' + esc(T.back) + '</button>')
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
      '<div class="quizTop">' + this.courseIcon(q.course) + '<h2>' + esc(tx.name) + '</h2></div>' +
      '<div class="quizHead">' + esc(T.question) + ' ' + (q.index + 1) + ' ' + esc(T.of) + ' ' + q.questions.length +
      ' · ' + esc(T.pass) + ' 3</div>' +
      '<p class="qText">' + esc(L[0]) + '</p>' + opts +
      (ans === null && q.hint ? '<div class="quizNote">' + esc(L[4]) + '</div>' : '') + after +
      '<div class="btnRow">' +
      (ans === null
        ? (q.hint ? '' : '<button class="btn" data-act="quizHint">💡 ' + esc(T.hint) + '</button>')
        : '<button class="btn default fwd" data-act="quizNext">' + esc(T.next) + '</button>') +
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
        Career.new({ pilot, difficulty: Career.settings.difficulty });
        enterFullscreen();
        this.tab = 'dispatch';
        this.showOps();
        break;
      }
      case 'difficulty':
        // (the new career screen picks the next career's level, not the one being left)
        if (this.screen.dataset.view === 'newcareer') { Career.settings.difficulty = v; Career.saveSettings(); }
        else if (v !== Career.difficulty.id) {
          Career.setDifficulty(v);
          if (Career.data && (Game.mode === 'menu' || Game.mode === 'debrief' || Game.mode === 'failed')) Career.generateContracts();
        }
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
        if (Game.mode === 'paused') this.showPause(); else this.showTitle();
        break;
      case 'rename': {
        this.renaming = true; this.showOps();
        const inp = el('pilotRename');
        if (inp) { inp.focus(); inp.select(); }
        break;
      }
      case 'renameSave': {
        const inp = el('pilotRename');
        if (inp && Career.rename(inp.value)) Audio2.cue('good');
        this.renaming = false; this.showOps();
        break;
      }
      case 'renameCancel': this.renaming = false; this.showOps(); break;
      case 'rerollName': {
        const inp = el('pilotName') || el('pilotRename');
        if (inp) { inp.value = Career.randomPilotName(inp.value); inp.focus(); }
        break;
      }
      case 'units':
        Career.settings.units = v; Career.saveSettings();
        Units.metric = v === 'metric';
        if (Game.mode === 'paused') this.showPause(); else this.showTitle();
        break;
      case 'noseUp':
        Career.settings.noseUp = v; Career.saveSettings();
        Input.invertPitch = v === 'up';
        if (Game.mode === 'paused') this.showPause(); else this.showTitle();
        break;
      case 'landingAid':
        Career.settings.landingAid = Career.settings.landingAid === false; Career.saveSettings();
        if (Game.mode === 'paused') this.showPause(); else this.showTitle();
        break;
      case 'cabinPa':
        Career.settings.cabinPa = Career.settings.cabinPa === false; Career.saveSettings();
        if (Career.settings.cabinPa === false && window.speechSynthesis && Audio2.paTalking) window.speechSynthesis.cancel();
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
      case 'tab': this.quiz = null; this.renaming = false; this.tab = v; this.showOps(); break;
      case 'briefing': this.showBriefing(v); break;
      case 'selectAc': Career.select(v); this.showOps(); break;
      case 'mriya': MriyaScreen.show(); break;
      case 'mriyaFinish': Career.setMriyaFinish(v); this.showOps(); break;
      case 'mriyaTry': MriyaScreen.show(v); break;
      case 'boardFilter': Filters.boardAction(v); this.showOps(); break;
      case 'hangarFilter': Filters.hangarAction(v); this.showOps(); break;
      case 'acFor': Filters.hangarFor(v); this.tab = 'hangar'; this.showOps(); break;
      case 'buyRegion': if (Career.buyRegion(v)) Audio2.cue('good'); this.showOps(); break;
      case 'course': this.showQuiz(v); break;
      case 'branch': this.foldBranch(v); break;
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
      case 'tour': {
        const c = Career.contractById(this.selContract);
        if (!c) { this.showOps(); break; }
        enterFullscreen();
        Game.tour(c, v);
        break;
      }
      case 'tod': Career.setTimeOfDay(v); this.showBriefing(this.selContract); break;
      case 'startMode': Career.setSkipPushback(v === 'pushback'); this.showBriefing(this.selContract); break;
      case 'retry':
        if (this.lastContract) { enterFullscreen(); Game.launch(this.lastContract, { skipPushback: Career.skipPushback }); }
        break;
      case 'ops': Game.abortToOps(); break;
      case 'resume': Game.pause(); break;
      case 'pauseFlight': if (Game.mode === 'paused') this.showPauseCard('flight'); break;
      case 'pauseAircraft': if (Game.mode === 'paused') this.showPauseCard('aircraft'); break;
      case 'pauseBack': if (Game.mode === 'paused') this.showPause(); break;
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
function unlockLine(on, text) { return '<li class="' + (on ? 'ok' : 'off') + '"><i>' + (on ? '✓' : '🔒') + '</i>' + esc(text) + '</li>'; }
// a rank's sleeve: a navy patch with its gold stripes, and the senior captain's star above them
function epaulette(r) {
  return '<span class="epaulette' + (r.star ? ' star' : '') + '" title="' + esc(tr(r.title)) + '">' +
    (r.star ? '<b>★</b>' : '') + '<i></i>'.repeat(r.stripes) + '</span>';
}
// the pencil of "change the name"
const PENCIL_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>';
// the training branches' colours: the client groups' own, a light blue for the general courses
const COURSE_COLOR = { general: '#8fc0ea', pax: FACTIONS.pax.color, cargo: FACTIONS.cargo.color, bush: FACTIONS.bush.color };
// what kind of entry a log line is, for its dot on the Career tab's timeline
function logKind(l) {
  const t = l.tpl || l.text || '';
  if (/lost/.test(t)) return 'lost';
  if (/Mriya/.test(t) || /^Promoted/.test(t)) return 'legend';
  if (/^Traffic rights/.test(t)) return 'rights';
  if (l.args && l.args.g) return l.args.g === 'A+' || l.args.g === 'A' ? 'top' : l.args.g === 'E' || l.args.g === 'F' ? 'bad' : 'flight';
  return 'note';
}
// '#rrggbb' as rgba() with the given opacity
function hexAlpha(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + alpha + ')';
}
function vs0Of(a, kg) {
  const cl = a.clMaxClean + a.flaps[a.flaps.length - 1].cl;
  return Math.sqrt(2 * kg * SIM.GRAVITY / (SIM.RHO_SL * a.wingArea * cl)) / KTS;
}

// the client airline's logo (art/emblems.js) and an airport's national flag (art/flags.js)
function clientLogo(c, big) {
  if (!c.airline || !AIRLINE_BY_CODE[c.airline]) return '';
  return '<img class="logo' + (big ? ' big' : '') + '" src="' + Emblems.url(c.airline) + '" alt="">';
}
// a stand by its index at an airport (static data): "T2 · gate 3" where there are several terminals
function gateLabel(apt, i) {
  const n = i + 1;
  return apt.terminals > 1 ? tr('T{t} · gate {n}', { t: World.terminalOf(apt, i), n }) : tr('Gate {n}', { n });
}
function flagImg(apt) {
  return '<img class="flag" src="' + Flags.url(apt.country) + '" alt="" title="' + esc(apt.country) + '">';
}
