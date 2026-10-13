'use strict';

// ============================================================
// World Aviation — the flight school's screens (data/lessons.js):
//   the school — on the Dispatch tab of a new career, in place of the
//     contract board, until it is skipped, passed or a flight is flown
//     (Career.schoolFirst); later from a line over the board and a
//     card on the Training tab (UI.school): the three stages with
//     their aircraft and their lessons, each with what it teaches, its
//     minutes and Start / Again;
//   a lesson's result — passed: what it taught, the touchdown if it
//     landed, Next lesson; failed: why, a tip, and the help the next
//     try brings, Try again.
// Used by ui/ui.js (the tabs, UI.action) and game.js (Game.endLesson).
// ============================================================

const School = {
  // ---------- the school ----------
  // first: shown in place of the board (with the way to skip it); else opened from the board
  // or the Training tab (with the way back to the board)
  body(first) {
    const n = Career.schoolCount(), all = LESSONS.length, next = Career.nextLesson();
    const allDone = n >= all;
    const hero = '<div class="schoolHero">' +
      '<div class="schoolTop"><span class="schoolBadge">🎓</span><div><h3>' + tr('Flight school') + '</h3>' +
      '<p>' + tr('Six short lessons in the simulator, from the first taxi to a whole flight in a Boeing 777. Each is one small job of a few minutes; the instructor shows you the buttons and the instruments one at a time, and helps more if a try goes wrong. Free — nothing in your career changes.') + '</p></div></div>' +
      '<div class="schoolProg"><span class="schoolBar" style="--p:' + Math.round(n / all * 100) + '%"><i></i></span>' +
      '<span>' + tr('{n} of {m} lessons passed', { n, m: all }) + '</span></div>' +
      '<div class="btnRow">' +
      (allDone ? '' : '<button class="btn default fwd" data-act="lesson" data-v="' + next.id + '">' +
        tr('Lesson {n}: {title}', { n: Lesson.number(next), title: esc(tr(next.title)) }) + '</button>') +
      (first ? '<button class="btn" data-act="schoolSkip">' + tr('I can fly — show the contracts') + '</button>'
        : '<button class="btn back" data-act="schoolBack" data-esc>' + tr('Back to the board') + '</button>') +
      '</div></div>';
    const stages = SCHOOL_STAGES.map((sg, k) => {
      const ac = AIRCRAFT.find((a) => a.id === sg.aircraft);
      const lessons = LESSONS.filter((l) => l.stage === sg.id).map((l) => this.card(l, l === next && !allDone)).join('');
      return '<section class="schoolStage">' +
        '<div class="stHead"><div class="acPic stPic loading"><img data-ac="' + ac.id + '" alt="' + esc(ac.name) + '"></div>' +
        '<div><small>' + tr('Stage {n}', { n: k + 1 }) + '</small><b>' + esc(tr(sg.name)) + ' · ' + esc(ac.name) + '</b>' +
        '<p>' + esc(tr(sg.blurb)) + '</p></div></div>' +
        '<div class="lessons">' + lessons + '</div></section>';
    }).join('');
    return '<div class="school">' + hero + stages + '</div>';
  },
  // a lesson's card: its number, title, goal, minutes, what it teaches, and its button
  card(l, isNext) {
    const done = Career.lessonDone(l.id);
    return '<div class="lessonCard' + (done ? ' done' : isNext ? ' next' : '') + '">' +
      '<span class="lNum">' + (done ? '✓' : Lesson.number(l)) + '</span>' +
      '<div class="lMain"><div class="lTitle"><b>' + esc(tr(l.title)) + '</b><span class="lMin">' + tr('about {m} min', { m: l.minutes }) + '</span></div>' +
      '<p>' + esc(Units.text(tr(l.goal))) + '</p>' +
      '<div class="lLearn">' + l.learn.map((x) => '<span>' + esc(tr(x)) + '</span>').join('') + '</div></div>' +
      '<button class="btn small' + (isNext ? ' default fwd' : '') + '" data-act="lesson" data-v="' + l.id + '">' +
      tr(done ? 'Again' : 'Start') + '</button></div>';
  },
  // over the contract board, while lessons are left: a line that opens the school
  line() {
    const d = Career.data;
    if (Career.schoolDone() || !d.school.skipped && d.stats.flights === 0) return '';
    return '<div class="schoolLine"><span>🎓 ' + tr('Flight school') + ' · ' + tr('{n} of {m} lessons passed', { n: Career.schoolCount(), m: LESSONS.length }) + '</span>' +
      '<button class="btn small" data-act="schoolOpen">' + tr('Open') + '</button></div>';
  },
  // the Training tab's card for it: always there, the lessons can be flown again
  trainingCard() {
    const n = Career.schoolCount(), all = LESSONS.length;
    return '<div class="schoolLine big"><span><b>🎓 ' + tr('Flight school') + '</b> · ' + tr('free lessons in the simulator: taxi, take-off, landing, the autopilot, a whole flight') +
      '<br><small>' + tr('{n} of {m} lessons passed', { n, m: all }) + '</small></span>' +
      '<button class="btn small" data-act="schoolOpen">' + tr('Open') + '</button></div>';
  },

  // ---------- a lesson's result ----------
  showResult(r) {
    Input.active = false;
    const def = r.lesson, num = Lesson.number(def);
    const allDone = Career.schoolDone();
    const next = LESSONS[num] || null;            // (the lesson after this one; none after the last)
    let body;
    if (r.ok) {
      const graded = r.landed ? '<h3>' + tr('Touchdown') + ' · ' + tr('grade {g}', { g: r.grade }) + '</h3>' + touchdownGrid(r.landed) +
        (r.landed.fpm > SIM.TOUCHDOWN_HARD_FPM ? '<p class="fineprint">' + tr('A hard one: at 30 ft idle and raise the nose a little — the flare.') + '</p>' : '') : '';
      body = '<div class="debriefTop"><div class="grade top">✓</div><div class="debriefTitle">' +
        tr('Lesson {n} passed · {title}', { n: num, title: esc(tr(def.title)) }) + '</div></div>' +
        graded +
        '<h3>' + tr('What you have learned') + '</h3><ul class="unlocks">' + def.learn.map((x) => unlockLine(true, tr(x))).join('') + '</ul>' +
        (r.cheated ? '<p class="need">' + tr('Cheats used — the lesson is not counted') + '</p>' : '') +
        (allDone && r.first ? '<p class="repGain">🎓 <b>' + tr('Flight school passed!') + '</b> ' + tr('You know every button and every instrument. Time for real flights: the contract board is waiting.') + '</p>' : '') +
        '<div class="btnRow">' +
        (next ? '<button class="btn default fwd" data-act="lesson" data-v="' + next.id + '">' + tr('Lesson {n}: {title}', { n: num + 1, title: esc(tr(next.title)) }) + '</button>'
          : '<button class="btn default fwd" data-act="schoolDone">' + tr('To the contracts') + '</button>') +
        '<button class="btn" data-act="lesson" data-v="' + def.id + '">' + tr('Again') + '</button>' +
        '<button class="btn back" data-act="schoolOpen" data-esc>' + tr('The flight school') + '</button></div>';
    } else {
      const more = Lesson.moreHelp(def);
      body = '<div class="debriefTop"><div class="grade bad word">✗</div><div class="debriefTitle">' +
        tr('Lesson {n} · {title}', { n: num, title: esc(tr(def.title)) }) + '<br>' + esc(r.reason || tr('Not this time')) + '</div></div>' +
        '<p class="lead">' + esc(Units.text(this.tip(r.kind))) + '</p>' +
        (more ? '<p class="repGain">' + tr(more === 'second' ? 'On the next try the instructor holds the wings level for you and the autopilot flies the glide path lower, down to 60 ft.'
          : 'On the next try the instructor also flares for you: only watch how it is done.') + '</p>' : '') +
        '<p class="fineprint">' + tr('A lesson costs nothing: try as often as you like.') + '</p>' +
        '<div class="btnRow"><button class="btn default" data-act="lesson" data-v="' + def.id + '">' + tr('Try again') + '</button>' +
        '<button class="btn back" data-act="schoolOpen" data-esc>' + tr('The flight school') + '</button></div>';
    }
    UI.panel(body, 'debrief');
  },
  // what to do better, by what went wrong (the flight's failure kind)
  tip(kind) {
    switch (kind) {
      case 'excursion': return tr('You left the paving: keep the nose on the centreline with small steering, and slow down before a turn.');
      case 'gearbreak': case 'nose': case 'wing': return tr('Too hard a touchdown: keep the wings level and the nose steady, and at 30 ft idle and raise the nose a little.');
      case 'terrain': case 'ditch': return tr('You came down before the runway: keep the triangle of the ILS in the middle and fly through the rings.');
      case 'gearup': return tr('The gear was up: gear down before the landing, GEAR shows DOWN in green.');
      case 'collision': case 'police': return tr('You hit something on the ground: taxi slower and follow the arrow.');
      default: return tr('Stay on the glide path down to the runway, and once on the ground stay there: idle and brakes.');
    }
  },

  // ---------- the buttons (UI.action) ----------
  action(name, v) {
    switch (name) {
      case 'lesson': enterFullscreen(); Game.startLesson(v); break;
      case 'schoolSkip': Career.skipSchool(); UI.school = false; UI.showOps(); break;
      case 'schoolOpen': UI.school = true; UI.tab = 'dispatch'; UI.loading(() => UI.showOps()); break;
      // (a new career's board is the school itself until it is skipped or passed)
      case 'schoolBack': case 'schoolDone': UI.school = false; UI.tab = 'dispatch'; UI.showOps(); break;
      default: return false;
    }
    return true;
  }
};
