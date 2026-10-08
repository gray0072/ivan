'use strict';

// Everything the player hears: game events (core/events.js) turned into the sounds of core/audio.js.
// The only file that plays them; leave it out and the game runs silent.

// Another fish's sounds fade with distance and follow its size compared to the player (see splashVolume)
const soundVolume = (fish) => (fish === player ? 1 : splashVolume(fish));

GameEvents.on('splash', ({ fish, entering }) => {
  playSplash(clamp(fish.r / 300, 0, 1), entering, soundVolume(fish), fish === player);
});
// A leaping fish meets a gull: eats it, scares it off, or gets snatched
GameEvents.on('gull', ({ fish, hit }) => {
  const vol = soundVolume(fish);
  if (hit === 'eaten') playDeadGull(vol);
  else if (hit === 'scared') playGullScared(vol);
  else playGullCatch(vol);
});
// Only the player's meals are heard
GameEvents.on('eat', ({ fish, what }) => {
  if (fish !== player) return;
  if (what === 'food') playEatSmall();
  else playEatBig();
});
GameEvents.on('sting', ({ fish }) => { if (fish === player) playSting(); });
GameEvents.on('stageUp', () => playLevelUp());
GameEvents.on('milestone', ({ epic }) => { if (epic) playFanfare(); });
GameEvents.on('gameOver', () => playGameOver());
