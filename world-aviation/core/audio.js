'use strict';

// ============================================================
// World Aviation — synthesized sound (Web Audio, no files)
//
// Continuous voices that follow the aeroplane every frame:
//   - the engines: a jet's fan whine, its roar and core rumble and
//     the buzz-saw at high power; a turboprop's blade beat and its
//     turbine whine. They spool with N1/N2 (the start is heard), and
//     outside the cockpit they are louder, open, fade with distance
//     and shift in pitch as the aeroplane passes (Doppler)
//   - the airflow, louder with the gear, the flaps and the spoiler out
//   - the wheels rolling, the bumps of the slab joints, the brakes
//     (hiss, and a squeal when nearly stopped)
//   - the hydraulics while the gear or the flaps travel
//   - the stick shaker on a stall warning
// One-shots: the gear and the flaps locking, levers, the parking
// brake, the spoiler, the touchdown (tyre chirp and a thump as hard
// as the landing), warnings, the checklist, the 10 000 ft chime.
// Callouts are spoken (speechSynthesis, where the browser has it) in
// the game's language and units: "80 knots" (or 150 km/h), "V one",
// "rotate", "positive rate" on the take-off, the radio heights (feet
// or metres) and "minimums" on the approach.
//
// Two buses: the world (engines, wheels, wind) goes through a filter
// that muffles it in the cockpit; the cockpit (warnings, clicks,
// shaker) does not.
// ============================================================

const Audio2 = {
  ctx: null, master: null, ready: false, muted: false,
  v: null,                 // the continuous voices
  t: null,                 // state tracked between frames (for the one-shots)

  init() {
    if (this.ready) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { this.ctx = new AC(); } catch (err) { return; }
    const c = this.ctx;
    this.master = c.createGain();
    this.master.gain.value = this.muted ? 0 : 0.55;
    this.master.connect(c.destination);
    this.cockpit = c.createGain();
    this.cockpit.connect(this.master);
    // the world bus: muffled in the cockpit, open outside
    this.worldFilt = c.createBiquadFilter();
    this.worldFilt.type = 'lowpass'; this.worldFilt.frequency.value = 2400; this.worldFilt.Q.value = 0.5;
    this.world = c.createGain();
    this.world.connect(this.worldFilt); this.worldFilt.connect(this.master);
    this.noiseBuf = this.makeNoise();

    const osc = (type, f) => { const o = c.createOscillator(); o.type = type; o.frequency.value = f; o.start(); return o; };
    const gain = (to) => { const g = c.createGain(); g.gain.value = 0; g.connect(to || this.world); return g; };
    const filter = (type, f, q) => { const b = c.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q || 0.7; return b; };
    const noise = () => { const s = c.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true; s.start(0, Math.random() * 2); return s; };
    const chain = (...nodes) => { for (let i = 0; i + 1 < nodes.length; i++) nodes[i].connect(nodes[i + 1]); return nodes[nodes.length - 1]; };
    const v = {};
    // jet fan: two detuned tones through a resonant band
    v.fanG = gain(); v.fanF = filter('bandpass', 1200, 5);
    v.fan1 = osc('triangle', 1200); v.fan2 = osc('triangle', 1214);
    v.fan1.connect(v.fanF); v.fan2.connect(v.fanF); v.fanF.connect(v.fanG);
    // the roar: noise through a lowpass that opens with the power
    v.roarG = gain(); v.roarF = filter('lowpass', 400, 0.6);
    chain(noise(), v.roarF, v.roarG);
    // the core rumble
    v.rumG = gain(); v.rum = osc('sine', 45); v.rum.connect(v.rumG);
    // the buzz-saw of the fan tips at high power, and the propellers' blade beat
    v.buzzG = gain(); v.buzzF = filter('lowpass', 900, 1.2);
    v.buzz = osc('sawtooth', 160); v.buzz2 = osc('square', 320);
    v.buzz.connect(v.buzzF); v.buzz2.connect(v.buzzF); v.buzzF.connect(v.buzzG);
    // the airflow
    v.windG = gain(); v.windF = filter('bandpass', 700, 0.6);
    chain(noise(), v.windF, v.windG);
    // the wheels: rolling rumble and the brakes
    v.rollG = gain(); v.rollF = filter('lowpass', 200, 0.8);
    chain(noise(), v.rollF, v.rollG);
    v.brakeG = gain(); v.brakeF = filter('bandpass', 1500, 1.4);
    chain(noise(), v.brakeF, v.brakeG);
    v.squealG = gain(); v.squeal = osc('sine', 2100); v.squeal.connect(v.squealG);
    v.squealLfo = osc('sine', 7); v.squealLfoG = c.createGain(); v.squealLfoG.gain.value = 60;
    v.squealLfo.connect(v.squealLfoG); v.squealLfoG.connect(v.squeal.frequency);
    // the hydraulic pumps (gear, flaps)
    v.hydG = gain(); v.hydF = filter('bandpass', 420, 2);
    v.hyd1 = osc('sawtooth', 96); v.hyd2 = osc('triangle', 388);
    v.hyd1.connect(v.hydF); v.hyd2.connect(v.hydF); v.hydF.connect(v.hydG);
    // the stick shaker (in the cockpit)
    v.shakeG = gain(this.cockpit); v.shakeF = filter('lowpass', 160, 0.8);
    v.shake = osc('square', 22); v.shake.connect(v.shakeF); v.shakeF.connect(v.shakeG);
    this.v = v;
    this.ready = true;
  },

  makeNoise() {
    const c = this.ctx;
    const len = c.sampleRate * 2;
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  },

  resume() {
    if (!this.ready) this.init();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.55;
    if (m && window.speechSynthesis) window.speechSynthesis.cancel();
  },

  // ---------- every frame ----------
  update(dt, fl, sys) {
    if (!this.ready) return;
    const now = this.ctx.currentTime;
    const v = this.v;
    const set = (param, value, tc) => param.setTargetAtTime(value, now, tc || 0.08);
    if (!fl) {
      for (const k of ['fanG', 'roarG', 'rumG', 'buzzG', 'windG', 'rollG', 'brakeG', 'squealG', 'hydG', 'shakeG']) set(v[k].gain, 0, 0.08);
      // the flight is over: its callouts still in the queue go too
      if (this.t && window.speechSynthesis) window.speechSynthesis.cancel();
      this.t = null;
      return;
    }
    const st = fl.st;
    if (!this.t || this.t.fl !== fl) {
      this.t = { fl, gear: st.gear, flaps: st.flaps, spoiler: st.spoiler, rolled: 0, said: {}, agl: null, alt: st.pos.y, dist: null, onGround: st.onGround };
    }
    const t = this.t;

    // --- where the listener is
    const mode = Scene3D.camMode || 'cockpit';
    const inside = mode === 'cockpit';
    const cam = Scene3D.camera ? Scene3D.camera.position : null;
    let dist = 0, doppler = 1, behind = 0;
    if (!inside && cam) {
      const dx = cam.x - st.pos.x, dy = cam.y - st.pos.y, dz = cam.z - st.pos.z;
      dist = Math.hypot(dx, dy, dz);
      // Doppler from how fast the distance changes (the camera may stand still)
      if (t.dist !== null && dt > 0) {
        const vr = clamp((dist - t.dist) / dt, -150, 150);
        doppler = 343 / (343 + vr);
      }
      const ax = st.axes;
      if (ax && dist > 1) behind = clamp(-(dx * ax.nose.x + dy * ax.nose.y + dz * ax.nose.z) / dist, -1, 1);
    }
    t.dist = inside ? null : dist;
    const att = inside ? 1 : clamp(70 / (dist + 25), 0.02, 1.4);
    set(this.worldFilt.frequency, inside ? 2400 : clamp(16000 * 60 / (dist + 60), 1800, 16000), 0.2);

    // --- the engines
    let n1 = 0, n2 = 0, running = 0, egt = 0, fire = 0;
    const engines = sys ? sys.engines : [];
    for (const e of engines) {
      n1 += e.running ? e.n1 : 0;
      n2 += e.n2 || 0;
      if (e.running) running++;
      egt = Math.max(egt, e.egt || 0);
      fire = Math.max(fire, e.fire ? 1 : 0);
    }
    const ne = Math.max(1, engines.length);
    n1 /= ne; n2 /= ne;
    const count = Math.sqrt(Math.max(running, n2 > 0.05 ? 1 : 0) / ne);       // more engines a little louder
    const spool = Math.max(n1, n2 * 0.55);
    const jet = fl.ac.engineType === 'jet';
    const loud = inside ? 1 : 1.7;
    if (jet) {
      const ff = (260 + spool * 2700) * doppler;
      set(v.fan1.frequency, ff); set(v.fan2.frequency, ff * 1.012); set(v.fanF.frequency, ff);
      set(v.fanG.gain, spool * 0.05 * count * att * loud * (1 + Math.max(0, -behind) * 0.6));
      set(v.roarF.frequency, (220 + n1 * 2600 + fire * 600) * doppler, 0.15);
      set(v.roarG.gain, (0.04 + n1 * n1 * 0.32) * count * att * loud * (running ? 1 : 0.3) * (1 + Math.max(0, behind) * 0.7), 0.12);
      set(v.rum.frequency, (32 + n1 * 30) * doppler);
      set(v.rumG.gain, n1 * 0.12 * count * att);
      const saw = clamp((n1 - 0.78) * 4, 0, 1);
      set(v.buzz.frequency, (60 + n1 * 140) * doppler); set(v.buzz2.frequency, (120 + n1 * 280) * doppler);
      set(v.buzzF.frequency, 900);
      set(v.buzzG.gain, saw * 0.04 * count * att * loud * (1 + Math.max(0, -behind)));
    } else {
      // turboprop: the blade-passing beat (4 blades) and a thinner turbine whine
      const bpf = (18 + spool * 92) * doppler;
      set(v.buzz.frequency, bpf); set(v.buzz2.frequency, bpf * 2);
      set(v.buzzF.frequency, 500 + n1 * 1400);
      set(v.buzzG.gain, spool * 0.16 * count * att * loud);
      const ff = (900 + spool * 2600) * doppler;
      set(v.fan1.frequency, ff); set(v.fan2.frequency, ff * 1.01); set(v.fanF.frequency, ff);
      set(v.fanG.gain, spool * 0.025 * count * att * loud);
      set(v.roarF.frequency, (200 + n1 * 1300) * doppler, 0.15);
      set(v.roarG.gain, (0.02 + n1 * 0.14) * count * att * loud * (running ? 1 : 0.3), 0.12);
      set(v.rum.frequency, bpf * 0.5); set(v.rumG.gain, n1 * 0.1 * count * att);
    }

    // --- the airflow: speed, the gear, the flaps, the spoiler in the air
    const tas = st.tas / KTS;
    const sp = clamp(tas / 140, 0, 1.4);
    const extra = (st.gear * 0.5 + st.flaps * 0.08 + (!st.onGround ? st.spoiler * 0.6 : 0)) * clamp(tas / 90, 0, 1);
    set(v.windG.gain, (sp * 0.16 + extra * 0.12 + (Scene3D.inCloud || 0) * 0.04) * (inside ? 1 : 0.6 * att + 0.2), 0.2);
    set(v.windF.frequency, 350 + tas * 3.2 - extra * 150, 0.2);

    // --- the wheels
    const gs = Math.hypot(st.vel.x, st.vel.z);              // m/s
    const grass = st.surface === 'grass' || st.surface === 'ice';
    const rolling = st.onGround ? clamp(gs / 40, 0, 1) : 0;
    set(v.rollG.gain, Math.pow(rolling, 0.7) * (grass ? 0.5 : 0.24) * (inside ? 1 : att), 0.08);
    set(v.rollF.frequency, 90 + gs * 7 + (grass ? 200 : 0), 0.1);
    const braking = st.onGround ? st.brakes * clamp(gs / 25, 0, 1) : 0;
    set(v.brakeG.gain, braking * 0.1 * (inside ? 1 : att), 0.06);
    set(v.squealG.gain, st.onGround && st.brakes > 0.4 && gs > 0.6 && gs < 7 && !grass ? 0.018 * (inside ? 1 : att) : 0, 0.05);
    // the slab joints: a bump every 12 m on the taxiways and the apron, every 30 m on the runway
    if (st.onGround && gs > 0.8 && !grass && dt > 0) {
      t.rolled += gs * dt;
      const pitchM = st.surface === 'runway' ? 30 : 12;
      if (t.rolled > pitchM) { t.rolled = 0; this.bump(clamp(gs / 30, 0.15, 1) * (inside ? 1 : att)); }
    }

    // --- the hydraulics while the gear or the flaps travel; clunks when they lock
    const gearMoving = Math.abs(st.gear - st.gearTarget) > 0.002;
    const flapsMoving = Math.abs(st.flaps - st.flapsTarget) > 0.002;
    set(v.hydG.gain, ((gearMoving ? 0.07 : 0) + (flapsMoving ? 0.04 : 0)) * (inside ? 1 : att * 0.7), 0.15);
    set(v.hyd1.frequency, 90 + (gearMoving ? 12 : 0) + (st.onGround ? 0 : tas * 0.03), 0.3);
    if (t.gear < 0.999 && st.gear >= 0.999) this.cue('gearDown');
    if (t.gear > 0.001 && st.gear <= 0.001) this.cue('gearUp');
    if (Math.abs(t.flaps - st.flapsTarget) > 0.002 && Math.abs(st.flaps - st.flapsTarget) <= 0.002) this.cue('flapStop');
    if (t.spoiler !== st.spoiler) this.cue('spoiler');
    t.gear = st.gear; t.flaps = st.flaps; t.spoiler = st.spoiler;

    // --- the stick shaker
    set(v.shakeG.gain, st.stallWarn ? 0.3 : 0, 0.03);

    // --- the 10 000 ft chime, and the callouts
    const altFt = st.pos.y / FT;
    if ((t.alt / FT < 10000) !== (altFt < 10000) && !st.onGround) this.cue('chime');
    t.alt = st.pos.y;
    this.callouts(fl, t);
  },

  // In the game's language and units: "80 knots" or "150 km/h" (80 kt rounded), and the radio
  // heights in feet or on a metric scale of their own (300, 150, 60 m minimums, 30, 15, 10, 5).
  // The numbers go to the voice as whole numbers in digits; it reads them in its own language.
  callouts(fl, t) {
    const st = fl.st;
    const ias = st.ias / KTS;
    const metric = Units.metric;
    const say = (key, text) => { if (!t.said[key]) { t.said[key] = true; this.say(text()); } };
    if (fl.phase === 'TAKEOFF' && st.onGround) {
      const vr = fl.ac.vr;
      if (vr > 95 && ias >= 80) {
        say('80', () => metric ? this.tr('{v} kilometres per hour', { v: Units.kmh(80) }) : this.tr('{v} knots', { v: 80 }));
      }
      if (ias >= vr - 6) say('v1', () => this.tr('V one'));
      if (ias >= vr) say('vr', () => this.tr('rotate'));
    }
    if (!st.onGround && t.said.vr && st.vel.y > 2 && fl.altAgl() > 8) say('pos', () => this.tr('positive rate'));
    // radio heights on the way down to land
    const agl = metric ? fl.altAgl() : fl.altAgl() / FT;
    const down = !st.onGround && st.vel.y < -0.5 && (fl.phase === 'APPROACH' || fl.phase === 'DESCENT');
    if (down && t.agl !== null && t.aglMetric === metric && (fl.env.timeAccel || 1) <= 1) {
      const heights = metric ? [300, 150, 60, 30, 15, 10, 5] : [1000, 500, 200, 100, 50, 40, 30, 20, 10];
      const minimums = metric ? 60 : 200, quick = metric ? 15 : 50;
      for (const h of heights) {
        if (t.agl > h && agl <= h) this.say(h === minimums ? this.tr('minimums') : String(h), h <= quick);
      }
    }
    t.agl = agl;
    t.aglMetric = metric;
  },

  // the voice's language: the game's, if the browser has a voice for it (the list may still be
  // loading), else English
  voiceFor() {
    const s = window.speechSynthesis;
    const vs = s.getVoices();
    const want = I18N.lang;
    if (this.voice && this.voiceLang === want) return this.voice;
    const tag = { en: /^en[-_]GB/i, ru: /^ru/i, sv: /^sv/i }[want];
    let v = vs.find((x) => tag.test(x.lang)) || (want === 'en' ? vs.find((x) => /^en/i.test(x.lang)) : null);
    // no voice for Russian or Swedish here: English words with an English voice
    if (!v && want !== 'en' && vs.length) v = vs.find((x) => /^en[-_]GB/i.test(x.lang)) || vs.find((x) => /^en/i.test(x.lang)) || null;
    this.voice = v || null;
    this.voiceLang = v ? want : null;
    return this.voice;
  },
  // a callout's text for the voice that will say it
  tr(text, params) {
    const v = window.speechSynthesis ? this.voiceFor() : null;
    const english = I18N.lang === 'en' || (v && !new RegExp('^' + I18N.lang, 'i').test(v.lang));
    if (!english) return tr(text, params);
    return String(text).replace(/\{(\w+)\}/g, (all, k) => (params && params[k] !== undefined ? params[k] : all));
  },

  // a spoken callout; the quick radio heights cut off one that is still talking
  say(text, urgent) {
    if (this.muted || !window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') return;
    const s = window.speechSynthesis;
    if (urgent && s.speaking) s.cancel();
    const voice = this.voiceFor();
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.lang = voice ? voice.lang : { en: 'en-GB', ru: 'ru-RU', sv: 'sv-SE' }[I18N.lang] || 'en-GB';
    u.rate = urgent ? 1.35 : 1.1;
    u.volume = 0.9;
    s.speak(u);
  },

  // ---------- one-shots ----------
  noiseHit(dest, freq, q, dur, gain, type) {
    const c = this.ctx, now = c.currentTime;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = type || 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    s.connect(f); f.connect(g); g.connect(dest);
    s.start(now, Math.random()); s.stop(now + dur + 0.05);
    return f;
  },
  bump(k) {
    if (!this.ready || this.muted) return;
    this.thump(this.world, 55, 0.12, 0.12 * k);
    this.noiseHit(this.world, 180, 1, 0.08, 0.06 * k, 'lowpass');
  },
  thump(dest, freq, dur, gain) {
    const c = this.ctx, now = c.currentTime;
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(freq, now);
    o.frequency.exponentialRampToValueAtTime(freq * 0.35, now + dur);
    g.gain.setValueAtTime(Math.max(0.0002, gain), now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g); g.connect(dest);
    o.start(now); o.stop(now + dur + 0.05);
  },

  cue(name, arg) {
    if (!this.ready || this.muted) return;
    const c = this.ctx;
    const cp = this.cockpit, w = this.world;
    const beep = (freq, dur, type, gain, slide) => {
      const o = c.createOscillator(), g = c.createGain(), now = c.currentTime;
      o.type = type || 'sine'; o.frequency.value = freq;
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, now + dur);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(gain || 0.18, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      o.connect(g); g.connect(cp);
      o.start(now); o.stop(now + dur + 0.05);
    };
    const later = (ms, fn) => setTimeout(() => { if (!this.muted) fn(); }, ms);
    switch (name) {
      case 'caution':
        beep(880, 0.16, 'square', 0.14);
        later(220, () => beep(660, 0.2, 'square', 0.12));
        break;
      case 'warning': beep(440, 0.5, 'sawtooth', 0.16, 300); break;
      case 'click': beep(1200, 0.05, 'square', 0.08); break;
      case 'lever':
        this.noiseHit(cp, 2500, 2, 0.05, 0.25);
        this.thump(cp, 140, 0.08, 0.15);
        break;
      case 'parkbrake':
        this.noiseHit(cp, 2000, 2, 0.05, 0.25);
        if (arg) this.noiseHit(w, 3200, 0.8, 0.5, 0.08, 'highpass');          // the air as it sets
        break;
      case 'resolved': beep(700, 0.1, 'sine', 0.12); later(90, () => beep(1050, 0.14, 'sine', 0.12)); break;
      case 'starter': beep(220, 0.5, 'sawtooth', 0.06, 160); this.noiseHit(w, 1800, 1, 0.4, 0.06); break;
      case 'lightoff': this.thump(w, 90, 0.35, 0.3); this.noiseHit(w, 600, 0.7, 0.6, 0.12, 'lowpass'); break;
      case 'idle': this.thump(w, 70, 0.4, 0.2); break;
      case 'shutdown': this.thump(w, 60, 0.5, 0.18); break;
      case 'touchdown': {
        // the tyres spinning up (a chirp per main gear) and a thump as hard as the landing
        const fpm = arg || 200;
        const k = clamp(fpm / 700, 0.2, 1.6);
        this.noiseHit(w, 2600, 3, 0.14, 0.22);
        later(60, () => this.noiseHit(w, 2300, 3, 0.12, 0.18));
        this.thump(w, 52, 0.4, 0.25 + k * 0.25);
        if (fpm > 600) this.noiseHit(w, 300, 0.6, 0.6, 0.35 * k, 'lowpass');     // a hard one rattles everything
        break;
      }
      case 'crash': this.thump(w, 40, 1.4, 0.6); this.noiseHit(w, 500, 0.5, 1.5, 0.5, 'lowpass'); break;
      case 'gear': case 'gearDown':
        this.thump(w, 75, 0.2, 0.28); later(140, () => this.thump(w, 65, 0.25, 0.3));    // down and locked
        break;
      case 'gearUp': this.thump(w, 85, 0.18, 0.22); break;
      case 'flapStop': this.thump(w, 120, 0.1, 0.1); break;
      case 'spoiler': this.noiseHit(w, 900, 0.7, 0.5, 0.12); break;
      case 'chime': beep(1046, 0.6, 'sine', 0.1); later(380, () => beep(784, 0.9, 'sine', 0.1)); break;
      case 'good': beep(880, 0.12, 'sine', 0.14); later(110, () => beep(1320, 0.2, 'sine', 0.14)); break;
      case 'bad': beep(300, 0.35, 'sawtooth', 0.14, 150); break;
      case 'page': beep(520, 0.06, 'sine', 0.07); break;
      default: beep(600, 0.08, 'sine', 0.1);
    }
  }
};
