// Arlanda Rising — screenshots of the map in its late and middle eras, for a look at what stands where (a steps file
// for tools/cdp.js, see docs/testing.md). Plays 8-8 (the heatwave, July 2040: summer, so the ground is not white) by
// its reference strategy into stage 2 at 14:00, adds three cargo stands and the second arm, and shoots the terminals,
// the north with runway 2's taxiway and the arm, Cargo City and the road in, the landside road; then turns the player's
// pier into the satellite design with four flights moved to its west-facing stands; then 2-11 (June 1976) for the first
// terminal, the road's end and the landside road to the international terminal. Compare with docs/layout.svg (north
// up) — the map is isometric with north to the upper right.
//
// Usage: node --experimental-websocket tools/cdp.js arlanda-rising/tools/map-shots.js [out-dir]   (about a minute)

// a mission at Medium played by its reference strategy until `cond` (JS over S) holds, then shown paused
const run = (id, cond) => `(() => {
  Game.startMission('${id}', 'medium');
  GameEvents.mute(true);
  const r = Strategy.runner(STRATEGIES['${id}']);
  let n = 0;
  while (!(${cond}) && n++ < 200000) {
    const st = S.mission.status;
    if (st === 'stageDone') Missions.next();
    else if (st === 'running') { Strategy.act(r); Sim.step(); }
    else break;
  }
  GameEvents.mute(false);
  Game.intro(); Game.play(); Game.speed = 0;
  return '${id}: ' + S.mission.status + ', stage ' + S.mission.stage + ', clock ' + S.clock;
})()`;
const stands = (re) => `S.airport.stands.filter((s) => ${re}.test(s.name)).map((s) => s.name + ' ' + s.at + (s.hdg ? '/' + s.hdg : '')).join(', ')`;

module.exports = async (h) => {
  const view = async (name, x, y, z) => { await h.ev(`Cam.centerOn(${x}, ${y}, ${z}); 1`); await h.sleep(1200); await h.shot(name); };
  await h.desktop(1280, 720);
  await h.page('arlanda-rising', 3000);
  await h.ev(`I18N.set('en'); 1`);

  h.log(await h.ev(run('8-8', 'S.mission.stage === 1 && S.clock >= 14 * 60')));
  h.log(await h.ev(`(() => { for (let i = 0; i < 3; i++) Airport.finishBuy('cargoStand'); Airport.complete('pierArm', 'pier2040', 0); return ${stands('/^(K|G)/')}; })()`));
  await view('2040-terminals', 950, 1150, 0.8);
  await view('2040-north', 950, 1900, 0.8);
  await view('2040-cargo', 900, 560, 1.3);
  await view('2040-landside', 1000, 1400, 1.3);
  await view('2040-pier', 820, 2250, 1.2);

  // the satellite design: its stands, and four flights at the stands facing west (their aircraft and turnaround kit)
  h.log(await h.ev(`(() => {
    S.airport.stands = S.airport.stands.filter((s) => !/^G[1-6]$/.test(s.name));
    S.airport.pierDesign = 'satellite';
    Airport.complete('pier2040', 'pier2040', 0);
    const g = S.airport.stands.filter((s) => /^G[5-8]$/.test(s.name));
    const fl = S.ops.flights.filter((f) => f.st === 'turn' && f.stand).slice(0, 4);
    fl.forEach((f, i) => { const old = S.airport.stands.find((s) => s.id === f.stand); if (old) old.occ = null; f.stand = g[i].id; g[i].occ = f.id; });
    return ${stands('/^G/')} + ' | moved ' + fl.map((f) => f.id + ' ' + f.type).join(', ');
  })()`));
  await view('2040-satellite', 860, 2120, 2.4);

  h.log(await h.ev(run('2-11', 'S.mission.stage === 1 && S.clock >= 8 * 60 + 30')));
  await view('1976-terminals', 950, 1300, 1.2);
};
