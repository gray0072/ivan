'use strict';

// ============================================================
// World Aviation — the cabin announcements on a passenger flight,
// spoken by Audio2's voice after the cabin chime, in the game's
// language and units:
//   - taxiing out: welcome aboard, the flight time, seat belts,
//     seat backs upright, window shades open
//   - at the cruise level: the height, the ground speed, the air
//     outside and the time to go
//   - at the top of descent: the time to the landing and the
//     temperature at the arrival
//   - on the approach: seat belts, seat backs, tray tables stowed
//   - off the runway: welcome to the city, the local time, the
//     temperature, ahead of or behind the schedule
// Each is said once a flight, never in a practice, in a cargo
// flight or while a checklist runs (it waits for it). The cockpit
// callouts cut an announcement off (Audio2.say). Off with the
// "Cabin announcements" setting (Career.settings.cabinPa).
// Called every frame from Game.frame (game.js).
// ============================================================

// the words a number takes in each language, for what the voice says: [one, few, many]
// (Russian: 1, 2–4, 5+; English and Swedish: one and the rest)
const CABIN_WORDS = {
  en: { hour: ['hour', 'hours', 'hours'], minute: ['minute', 'minutes', 'minutes'], degree: ['degree', 'degrees', 'degrees'] },
  ru: { hour: ['час', 'часа', 'часов'], minute: ['минуту', 'минуты', 'минут'], degree: ['градус', 'градуса', 'градусов'] },
  sv: { hour: ['timme', 'timmar', 'timmar'], minute: ['minut', 'minuter', 'minuter'], degree: ['grad', 'grader', 'grader'] }
};

const Cabin = {
  fl: null, said: null,

  on() { return Career.settings.cabinPa !== false; },

  update(fl, sys, game) {
    if (!fl) { this.fl = null; return; }
    if (this.fl !== fl) { this.fl = fl; this.said = {}; this.offAt = null; this.downAt = null; }
    const st = fl.st, p = fl.phase;
    // the times the schedule is told by: off the ground and on it again
    if (!st.onGround && this.offAt === null) this.offAt = fl.elapsed;
    if (p === 'ROLLOUT' && this.downAt === null) this.downAt = fl.elapsed;
    if (!this.on() || game.practice || fl.failure || (sys && sys.checklist)) return;
    const c = fl.contract;
    if (!c || c.type !== 'pax') return;
    // (a line on the HUD too, so an announcement a browser cannot voice still shows it was made)
    const once = (key, cond, text) => {
      if (this.said[key] || !cond) return;
      this.said[key] = true;
      Audio2.announce(text());
      if (!Audio2.muted) fl.info('📢 ' + tr('Cabin announcement'));
    };
    once('welcome', p === 'TAXI_OUT' || p === 'HOLD_SHORT' || (p === 'TAKEOFF' && st.onGround && st.ias / KTS < 30),
      () => this.tr('Ladies and gentlemen, welcome aboard this {airline} flight to {city}. Our flight time today will be {time}. Please fasten your seat belts, bring your seat backs to the upright position and open the window shades. Cabin crew, prepare for departure.',
      { airline: c.client, city: aptCity(fl.arrival, this.lang()), time: this.duration(c.blockMin) }));
    once('cruise', p === 'CRUISE' && fl.phaseTime > 20,
      () => this.tr('Ladies and gentlemen, this is your captain speaking. We have reached our cruising altitude of {alt}. Our speed over the ground is {spd}, and the temperature outside is {temp}. We expect to land in {city} in about {time}. Sit back, relax and enjoy the flight.',
      { alt: this.alt(st.pos.y), spd: this.speed(fl.groundSpeedKt()), temp: this.temp(this.oat(fl)), city: aptCity(fl.arrival, this.lang()), time: this.duration(this.minutesToGo(fl)) }));
    once('descent', p === 'DESCENT' && fl.phaseTime > 5,
      () => this.tr('Ladies and gentlemen, we have started our descent into {city} and will be landing in about {time}. The temperature in {city} is {temp}. Please return to your seats and fasten your seat belts.',
      { city: aptCity(fl.arrival, this.lang()), time: this.duration(this.minutesToGo(fl)), temp: this.temp(fl.env.temp) }));
    once('landing', p === 'APPROACH',
      () => this.tr('Cabin crew, prepare for landing. Ladies and gentlemen, please make sure your seat belt is fastened, your seat back is upright, your tray table is stowed and the window shade is open.'));
    once('arrived', p === 'EXIT',
      () => this.tr('Ladies and gentlemen, welcome to {city}. The local time is {clock} and the temperature outside is {temp}. {schedule} Please remain seated with your seat belt fastened until the seat belt sign is switched off. Thank you for flying {airline}.',
      { city: aptCity(fl.arrival, this.lang()), clock: this.localClock(fl), temp: this.temp(fl.env.temp), schedule: this.schedule(c), airline: c.client }));
  },

  // ahead of or behind the planned flight time (off the ground to on it), a couple of minutes either way is on schedule
  schedule(c) {
    if (this.offAt === null || this.downAt === null) return '';
    const diff = Math.round((this.downAt - this.offAt) / 60 - c.blockMin);
    if (Math.abs(diff) < SIM.CABIN_ON_TIME_MIN) return this.tr('We have arrived on schedule.');
    const time = this.duration(Math.abs(diff));
    return diff < 0 ? this.tr('We have arrived {time} ahead of schedule.', { time }) : this.tr('We have arrived {time} behind schedule.', { time });
  },
  minutesToGo(fl) {
    const gs = Math.max(120, fl.groundSpeedKt());
    return fl.distToRunwayNm() / gs * 60 + 4;               // and a few minutes for the approach
  },
  // the air outside at this height, as the contract strip has it (ui/hud.js)
  oat(fl) { return fl.env.temp - WEATHER.LAPSE_RATE * (fl.st.pos.y - (fl.env.tempElev || 0)); },
  // the arrival's clock now: the departure's, moved by the two airports' UTC offsets
  localClock(fl) {
    const c = fl.contract, dep = World.byId[c.fromId], arr = World.byId[c.toId];
    const clock = (fl.env.hour0 || 12) * 3600 + fl.elapsed + (utcOffset(arr) - utcOffset(dep)) * 3600;
    return fmtClock(((clock % 86400) + 86400) % 86400);
  },

  // ---------- the words, in the language the voice speaks ----------
  lang() { return Audio2.speaksEnglish() ? 'en' : I18N.lang; },
  tr(text, params) { return Audio2.tr(text, params); },
  count(n, what) {
    const f = (CABIN_WORDS[this.lang()] || CABIN_WORDS.en)[what];
    if (this.lang() !== 'ru') return n + ' ' + (n === 1 ? f[0] : f[1]);
    const d = n % 10, dd = n % 100;
    return n + ' ' + (d === 1 && dd !== 11 ? f[0] : d >= 2 && d <= 4 && (dd < 12 || dd > 14) ? f[1] : f[2]);
  },
  duration(min) {
    min = Math.max(1, Math.round(min));
    const h = Math.floor(min / 60), m = min % 60;
    if (!h) return this.count(m, 'minute');
    return this.count(h, 'hour') + (m ? ' ' + this.tr('and') + ' ' + this.count(m, 'minute') : '');
  },
  temp(t) {
    const n = Math.round(t);
    return (n < 0 ? this.tr('minus') + ' ' : '') + this.count(Math.abs(n), 'degree');
  },
  // the height to the nearest thousand feet (or hundred metres), the speed to ten
  alt(m) {
    return Units.metric ? this.tr('{v} metres', { v: Math.round(m / 100) * 100 }) : this.tr('{v} feet', { v: Math.round(m / FT / 1000) * 1000 });
  },
  speed(kt) {
    return Units.metric ? this.tr('{v} kilometres per hour', { v: Math.round(Units.kmh(kt) / 10) * 10 }) : this.tr('{v} knots', { v: Math.round(kt / 10) * 10 });
  }
};
