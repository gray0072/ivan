// The slides of docs/showcase.gif, from a fry to the Sea King (node --experimental-websocket tools/showcase.js
// fish-frenzy [slide ...], see the header of tools/showcase.js and docs/testing.md). A Medium run on High graphics,
// sound off; the player's size and depth are set from the console (no digit-key cheat, so no banner), the sea is
// respawned around it and the demo pilot plays a few seconds, so the fish around come into view. Each shot is a
// moment of a random sea: retake a slide that came out empty (node tools/showcase.js fish-frenzy 3-big-fish).

async function start(h) {
  await h.page('fish-frenzy');
  await h.ev(`document.querySelector('[data-graphics=high]').click(); document.querySelector('[data-sound=off]').click();
    document.querySelector('[data-difficulty=medium]').click(); 1`);
  await h.sleep(300);
}

// the player of radius r at depth d (0 = the surface, 1 = the floor), the demo pilot playing it for `wait` ms
async function swim(h, r, d, wait) {
  await h.ev(`player.r = ${r}; player.growQueue.length = 0; lastStageIndex = stageIndexForR(${r});
    reachedFinalStage = lastStageIndex >= STAGES.length - 1; player.y = SURFACE_Y + WATER_DEPTH * ${d};
    player.invulnTimer = 0; resetWorld(); demo = true; 1`);
  await h.sleep(wait);
  h.log(await h.ev(`JSON.stringify({ alive: player.alive, r: Math.round(player.r), stage: STAGES[stageIndexForR(player.r)].name, depth: +depthFrac(player.y).toFixed(2), npcs: npcs.length })`));
}

const stage = (r, d, wait = 12000) => async (h) => { await start(h); await swim(h, r, d, wait); };

// the end of a run: the pilot plays a Shark of r 320, the player takes over at r 330 and checkStages opens the
// Sea King dialog (the run's clock set to a real run's 11:11.8); then Continue, a Sea King of r 480, the player
// takes over at MAX_R and "Maximum size reached!" opens with its fireworks (18:32.4); then Change Difficulty
async function kingDialog(h) {
  await start(h);
  await swim(h, 320, 0.45, 6500);
  await h.ev(`demo = false; elapsed = 671.8; player.r = 330; 1`);
  await h.sleep(1200);
}
async function maxDialog(h) {
  await kingDialog(h);
  await h.ev(`document.getElementById('continueBtn').click(); player.r = 480; demo = true; 1`);
  await h.sleep(6000);
  await h.ev(`demo = false; elapsed = 1112.4; player.r = MAX_R; 1`);
  await h.sleep(2400);
}

module.exports = {
  viewport: [1280, 720],
  gif: [],                           // dithered: about 4.5 MB, the water's gradients stay smooth
  slides: [
    { name: '1-fry', take: stage(15, 0.5) },              // among plankton and jellyfish
    { name: '2-small-fish', take: stage(45, 0.15) },      // at the surface: gulls, a palm island
    { name: '3-big-fish', take: stage(100, 0.9) },        // over the seaweed on the floor
    { name: '4-shark', take: stage(220, 0.5) },           // in a school of Big Fish
    { name: '5-sea-king-dialog', take: kingDialog },
    { name: '6-sea-king', take: stage(400, 0.5) },        // hunting a school of Sharks
    { name: '7-max-size', take: maxDialog },              // with the fireworks
    { name: '8-records', take: async (h) => {             // Change Difficulty: the start screen with the run's records
      await maxDialog(h);
      await h.ev(`document.getElementById('kingMenuBtn').click(); 1`);
      await h.sleep(4500);
    } },
  ],
};
