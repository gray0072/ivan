'use strict';

// City Builder — game events turned into sounds: the only file that plays them during the game
// (core/audio.js has the recipes). Several events in one moment (a line of embankment, a flood
// damaging many houses) play one sound.

(() => {
  let lastAt = {};
  const once = (name, fn, gap = 0.08) => {
    const now = performance.now() / 1000;
    if (now - (lastAt[name] || 0) < gap) return;
    lastAt[name] = now;
    fn();
  };
  GameEvents.on('built', (e) => once('build', () => (e.big ? Sfx.bigBuild() : Sfx.build())));
  GameEvents.on('roadBuilt', () => once('road', Sfx.road));
  GameEvents.on('bulldozed', () => once('bulldoze', Sfx.bulldoze));
  GameEvents.on('cantBuild', () => once('error', Sfx.error, 0.3));
  GameEvents.on('repaired', () => once('repair', Sfx.repair));
  GameEvents.on('month', (e) => { if (e.income > 0) Sfx.coins(Math.ceil(e.income / 500)); });
  GameEvents.on('houseGrew', () => once('grow', Sfx.grow, 0.4));
  GameEvents.on('fire', () => once('alarm', Sfx.alarm, 3));
  GameEvents.on('fireSpread', () => once('alarm', Sfx.alarm, 3));
  GameEvents.on('burnedDown', () => once('burn', Sfx.burnDown));
  GameEvents.on('extinguished', () => once('splash', Sfx.splashOut));
  GameEvents.on('flood', () => Sfx.flood());
  GameEvents.on('milestone', () => Sfx.milestone());
  GameEvents.on('debt', () => Sfx.debt());
  GameEvents.on('bankrupt', () => Sfx.bankrupt());
})();
