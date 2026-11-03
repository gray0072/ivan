'use strict';

// Yacht — game events turned into sounds: the only file that plays them during the game
// (core/audio.js has the recipes).

(() => {
  GameEvents.on('cupShake', (e) => Sfx.rattle(e.ms));
  GameEvents.on('diceSpill', (e) => Sfx.clatter(e.dice, e.ms));
  GameEvents.on('held', (e) => (e.held ? Sfx.hold() : Sfx.release()));
  GameEvents.on('written', (e) => {
    if (e.general) Sfx.general();
    else if (e.loss) Sfx.bad();
    else if (e.d || e.p >= 25) Sfx.good();
    else Sfx.write();
  });
  GameEvents.on('undone', () => Sfx.undo());
  GameEvents.on('gameOver', () => Sfx.fanfare());
})();
