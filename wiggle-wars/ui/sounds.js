'use strict';

// Wiggle Wars — game events turned into sounds (and a short vibration on big blasts on phones).
// The silent demo behind the menu is never heard. The only place that plays sounds besides the
// fireworks.

(function () {
  const on = (type, fn) => GameEvents.on(type, (e) => { if (!e.demo && match && match.mode !== 'demo') fn(e); });
  on('explosion', (e) => {
    Sfx.boom(e.r / 72);
    if (soundOn && e.r >= VIBRATE_BLAST && navigator.vibrate && isCoarsePointer) try { navigator.vibrate(Math.round(e.r * 1.5)); } catch (x) { /* no vibration */ }
  });
  on('fire', (e) => (WEAPONS[e.weapon].kind === 'missile' ? Sfx.launch() : Sfx.throw()));
  on('bounce', () => Sfx.clink());
  on('shotgun', () => Sfx.shotgun());
  on('bat', (e) => Sfx.whack(e.hit));
  on('drop', () => Sfx.throw());
  on('jump', (e) => (e.back ? Sfx.flip() : Sfx.jump()));
  on('land', (e) => Sfx.land(e.hard));
  on('splash', (e) => Sfx.splash(e.small));
  on('drown', () => Sfx.splash(false));
  on('crateDrop', () => Sfx.crate());
  on('crateLand', () => Sfx.crateLand());
  on('pickup', (e) => (e.kind === 'health' ? Sfx.heal() : Sfx.pickup()));
  on('mineTrigger', () => Sfx.mineArm());
  on('mineBeep', () => Sfx.mineBeep());
  on('teleport', () => Sfx.teleport());
  on('plankBuilt', () => Sfx.plank());
  on('power', () => Sfx.power());
  on('turnStart', () => Sfx.turn());
  on('tick', () => Sfx.tick());
  on('damage', () => Sfx.oof());
  on('death', () => Sfx.bye());
  on('airstrike', () => Sfx.airstrike());
  on('select', () => Sfx.select());
  on('refused', () => Sfx.refuse());
  on('suddenDeath', () => Sfx.suddenDeath());
  on('waterRise', () => Sfx.water());
  on('targetBroken', () => Sfx.pickup());
  on('jetpack', (e) => (e.on ? Loops.start('jet') : Loops.stop('jet')));
  on('drill', (e) => (e.on ? Loops.start('drill') : Loops.stop('drill')));
  on('matchOver', () => Loops.stopAll());
})();
