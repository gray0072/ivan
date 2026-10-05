'use strict';

// ============================================================
// World Aviation — input: keyboard, touch, fullscreen
//
// The aeroplane is flown with the arrow keys or WASD, the throttle
// with Z/X (or 1-9), the rudder with Q/E; T and R make the time run
// faster and slower. On a phone the left half
// of the screen is a floating joystick for pitch and roll, the
// right edge is a throttle slider, and the upper right has big
// buttons for gear, flaps, brakes, autopilot and the menu. Both
// halves work at the same time, so you can fly and work a
// checklist with two thumbs.
// ============================================================

const Input = {
  keys: {},
  pitch: 0, roll: 0, rudder: 0, throttleAxis: 0, brakeAxis: 0,
  touch: { stick: null, thr: null },
  active: false,
  onAction: null,          // set by game.js for one-shot actions
  isCoarse: false,

  init() {
    this.isCoarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    window.addEventListener('keydown', (e) => this.keyDown(e), { passive: false });
    window.addEventListener('keyup', (e) => this.keyUp(e));
    window.addEventListener('blur', () => { this.keys = {}; this.reset(); });
    this.initTouch();
  },

  keyDown(e) {
    const k = keyName(e);
    const code = e.code;
    // cheats need Alt so they cannot fire in normal play (Digit codes: Alt+digit may type a symbol)
    if (e.altKey && /^Digit[0-9]$/.test(code)) {
      e.preventDefault();
      if (!e.repeat) this.fire('cheat', parseInt(code.slice(5), 10));
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (k === 'Escape' && !this.active) { this.fire('pause'); return; }
    if (!this.active) return;
    if (HANDLED[k] || (code && HANDLED[code])) e.preventDefault();
    this.keys[k] = true;
    if (e.repeat) return;
    switch (k) {
      case 'g': this.fire('gear'); break;
      case 'f': this.fire('flapsDown'); break;
      case 'v': this.fire('flapsUp'); break;
      case 'y': this.fire('ap'); break;
      case 'n': this.fire('nav'); break;
      case 't': this.fire('timeFaster'); break;
      case 'r': this.fire('timeSlower'); break;
      case 'c': this.fire('camera', e.shiftKey ? -1 : 1); break;
      case 'm': this.fire('map'); break;
      case 'i': this.fire('brightness'); break;
      case '/': this.fire('spoiler'); break;
      case 'k': this.fire('antiIce'); break;
      case 'Enter': this.fire('starter'); break;
      case ' ': this.fire('parkBrake'); break;
      case 'Escape': this.fire('pause'); break;
      case 'h': this.fire('help'); break;
      case ',': case '<': this.fire('altDown'); break;
      case '.': case '>': this.fire('altUp'); break;
      case ';': case ':': this.fire('hdgDown'); break;
      case "'": case '"': this.fire('hdgUp'); break;
      default:
        if (/^[1-9]$/.test(k)) this.fire('throttlePreset', parseInt(k, 10) / 10);
        else if (k === '0') this.fire('throttlePreset', 0);
    }
  },
  keyUp(e) {
    const k = keyName(e);
    this.keys[k] = false;
    // Shift changes e.key between keydown and keyup ('=' / '+'), so clear both
    if (k === '+' || k === '=') { this.keys['+'] = false; this.keys['='] = false; }
    if (k === '-' || k === '_') { this.keys['-'] = false; this.keys['_'] = false; }
  },

  fire(name, arg) { if (this.onAction) this.onAction(name, arg); },

  reset() {
    this.keys = {};
    this.pitch = 0; this.roll = 0; this.rudder = 0;
    this.touch.stick = null; this.touch.thr = null;
    this.touchThrottle = null; this.touchBrake = false;
    const tb = document.querySelector('#touchButtons [data-act="brake"]');
    if (tb) tb.classList.remove('on');
    const knob = el('throttleKnob');
    if (knob) knob.style.bottom = '';
    this.knobLever = undefined;
  },

  // axis state for this frame
  axes() {
    const k = this.keys;
    const ax = (a, b) => (k[a] ? 1 : 0) - (k[b] ? 1 : 0);
    let pitch = ax('ArrowDown', 'ArrowUp') + ax('s', 'w');           // pull back = nose up
    let roll = ax('ArrowRight', 'ArrowLeft') + ax('d', 'a');
    let rud = ax('e', 'q');
    // the touch stick overrides when it is being used
    if (this.touch.stick) {
      pitch = -this.touch.stick.y;
      roll = this.touch.stick.x;
    }
    let thr = 0;
    if (k.z || k.PageDown || k['_'] || k['-']) thr -= 1;
    if (k.x || k.PageUp || k['+'] || k['=']) thr += 1;
    let brake = k.b ? 1 : 0;
    if (this.touchBrake) brake = 1;
    this.pitch = clamp(pitch, -1, 1);
    this.roll = clamp(roll, -1, 1);
    this.rudder = clamp(rud, -1, 1);
    return { pitch: this.pitch, roll: this.roll, rudder: this.rudder, throttle: thr, brake };
  },

  // ---------- touch ----------
  initTouch() {
    const stick = el('stickZone');
    const knob = el('stickKnob');
    const thr = el('throttleZone');
    const thrKnob = el('throttleKnob');

    // the knob and its ring jump to where the finger lands
    const base = el('stickBase');
    const place = (node, x, y) => {
      const r = stick.getBoundingClientRect();
      node.style.left = (x - r.left) + 'px';
      node.style.top = (y - r.top) + 'px';
      node.style.bottom = 'auto';
    };
    const setKnob = (x, y) => place(knob, x, y);
    if (stick) {
      stick.addEventListener('pointerdown', (e) => {
        stick.setPointerCapture(e.pointerId);
        this.touch.stick = { id: e.pointerId, ox: e.clientX, oy: e.clientY, x: 0, y: 0 };
        stick.classList.add('active');
        place(base, e.clientX, e.clientY);
        setKnob(e.clientX, e.clientY);
        Audio2.resume();
        e.preventDefault();
      }, { passive: false });
      stick.addEventListener('pointermove', (e) => {
        const s = this.touch.stick;
        if (!s || s.id !== e.pointerId) return;
        const r = 78;
        let dx = e.clientX - s.ox, dy = e.clientY - s.oy;
        const len = Math.hypot(dx, dy);
        if (len > r) { dx *= r / len; dy *= r / len; }
        s.x = dx / r; s.y = dy / r;
        setKnob(s.ox + dx, s.oy + dy);
        e.preventDefault();
      }, { passive: false });
      const endStick = (e) => {
        const s = this.touch.stick;
        if (!s || s.id !== e.pointerId) return;
        this.touch.stick = null;
        stick.classList.remove('active');
        for (const node of [knob, base]) { node.style.left = ''; node.style.top = ''; node.style.bottom = ''; }
      };
      stick.addEventListener('pointerup', endStick);
      stick.addEventListener('pointercancel', endStick);
      stick.addEventListener('lostpointercapture', endStick);
    }
    if (thr) {
      thr.addEventListener('pointerdown', (e) => {
        thr.setPointerCapture(e.pointerId);
        this.touch.thr = { id: e.pointerId };
        this.moveThrottle(e, thr, thrKnob);
        e.preventDefault();
      }, { passive: false });
      thr.addEventListener('pointermove', (e) => {
        if (!this.touch.thr || this.touch.thr.id !== e.pointerId) return;
        this.moveThrottle(e, thr, thrKnob);
        e.preventDefault();
      }, { passive: false });
      const endThr = (e) => {
        if (this.touch.thr && this.touch.thr.id === e.pointerId) this.touch.thr = null;
      };
      thr.addEventListener('pointerup', endThr);
      thr.addEventListener('pointercancel', endThr);
    }
    // big on-screen buttons, and the help panel's close button
    document.querySelectorAll('#touchButtons [data-act], #helpPanel [data-act]').forEach((btn) => {
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const act = btn.getAttribute('data-act');
        if (act === 'brake') {
          this.touchBrake = !this.touchBrake;
          btn.classList.toggle('on', this.touchBrake);
        } else {
          this.fire(act);
          btn.classList.add('on');
          setTimeout(() => btn.classList.remove('on'), 130);
        }
        Audio2.resume();
      });
    });
    // touch on the game must not scroll or zoom the page (the screens and panels scroll)
    const block = (e) => { if (e.target.closest && e.target.closest('#screen, .panelBox')) return; e.preventDefault(); };
    document.addEventListener('touchstart', block, { passive: false });
    document.addEventListener('touchmove', block, { passive: false });
  },

  // The slider is the thrust lever: its position maps to thrust on a curve, so the low end
  // (taxi power) has more room under the thumb.
  moveThrottle(e, zone, knob) {
    const r = zone.getBoundingClientRect();
    const v = clamp(1 - (e.clientY - r.top) / r.height, 0, 1);
    this.touchThrottle = throttleFromLever(v);
    this.placeThrottleKnob(v, knob);
  },
  placeThrottleKnob(v, knob) {
    knob = knob || el('throttleKnob');
    if (!knob) return;
    knob.style.bottom = 'calc(' + (v * 100) + '% - 18px)';
  },
  // the knob follows the levers when the thumb is off the slider (the autothrottle, the keys)
  syncThrottle(throttle) {
    if (!this.isCoarse) return;
    const knob = el('throttleKnob');
    if (!knob) return;
    const pct = Math.round(throttle * 100);
    if (pct !== this.knobPct) { this.knobPct = pct; knob.textContent = pct + '%'; }
    if (this.touch.thr) return;
    const v = leverFromThrottle(throttle);
    if (Math.abs(v - (this.knobLever === undefined ? -1 : this.knobLever)) > 0.003) { this.knobLever = v; this.placeThrottleKnob(v, knob); }
  },

  touchThrottle: null,
  touchBrake: false
};

// thrust lever position (0..1) <-> thrust (0..1)
function throttleFromLever(v) { return Math.pow(clamp(v, 0, 1), CONTROLS.THROTTLE_CURVE); }
function leverFromThrottle(t) { return Math.pow(clamp(t, 0, 1), 1 / CONTROLS.THROTTLE_CURVE); }

// The key by its place on the keyboard (e.code), not by the character it types, so the
// controls work in any layout (Russian, Swedish, …): KeyW is 'w' whatever the letter on it.
const CODE_KEYS = {
  Comma: ',', Period: '.', Slash: '/', NumpadDivide: '/', Semicolon: ';', Quote: "'", Minus: '-', Equal: '=', Space: ' ',
  NumpadAdd: '+', NumpadSubtract: '-', NumpadEnter: 'Enter'
};
function keyName(e) {
  const c = e.code || '';
  if (/^Key[A-Z]$/.test(c)) return c.slice(3).toLowerCase();
  if (/^Digit[0-9]$/.test(c)) return c.slice(5);
  if (/^Numpad[0-9]$/.test(c)) return c.slice(6);
  if (CODE_KEYS[c]) return CODE_KEYS[c];
  return e.key && e.key.length === 1 ? e.key.toLowerCase() : e.key;
}

const HANDLED = {
  ArrowUp: 1, ArrowDown: 1, ArrowLeft: 1, ArrowRight: 1, Space: 1, Enter: 1, Escape: 1,
  PageUp: 1, PageDown: 1, "'": 1, '/': 1
};

// ---------- fullscreen ----------
function isCoarsePointer() {
  return !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
}
function enterFullscreen() {
  if (!isCoarsePointer()) return;
  if (document.fullscreenElement || document.webkitFullscreenElement) return;
  const elx = document.documentElement;
  const req = elx.requestFullscreen || elx.webkitRequestFullscreen;
  if (!req) return;
  try {
    const p = req.call(elx, { navigationUI: 'hide' });
    if (p && p.catch) p.catch(() => {});
  } catch (err) { /* iPhone Safari: not supported, the game still works windowed */ }
}
// switching apps drops fullscreen; the first tap after coming back restores it
window.addEventListener('touchend', enterFullscreen);
