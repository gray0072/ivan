// The slides of docs/showcase.gif, the airport through the eras (node --experimental-websocket tools/showcase.js
// arlanda-rising [slide ...], see the header of tools/showcase.js and docs/testing.md). Each slide plays a mission
// at Medium by its reference strategy to a moment and centres the camera on it. `from`: a campaign is started at
// that mission and its missions played as a chain up to this one first, so the money is a real play-through's,
// not the owner's airport of that year (about 9 900 SEK in 1960).

// { id, stage (0-based), at: 'hh:mm' in the ops view or a day of the plan, cam: Cam.centerOn's x, y, zoom, from? }
function mission({ id, stage = 0, at, cam, from }) {
  return async (h) => {
    await h.page('arlanda-rising', 3000);
    await h.ev(`I18N.set('en'); 1`);
    if (from) {
      h.log('chain', await h.ev(`(() => {
        Campaign.start('medium'); Campaign.data.next = ${JSON.stringify(from)}; Campaign.save();
        const out = [];
        let id = ${JSON.stringify(from)};
        while (id && id !== ${JSON.stringify(id)}) {
          Game.startMission(id, 'medium');
          GameEvents.mute(true);
          const r = Strategy.runner(STRATEGIES[id]);
          let n = 0;
          while (n++ < 400000) {
            const st = S.mission.status;
            if (st === 'stageDone') Missions.next();
            else if (st === 'running') { Strategy.act(r); Sim.step(); }
            else break;
          }
          GameEvents.mute(false);
          out.push(id + ' ' + S.mission.status);
          Game.missionEnd();
          if (S.mission.status !== 'done') break;
          id = Campaign.data.next;
        }
        return out.join(', ');
      })()`));
    }
    h.log(id, await h.ev(`(() => {
      Game.startMission(${JSON.stringify(id)}, 'medium');
      GameEvents.mute(true);
      const r = Strategy.runner(STRATEGIES[${JSON.stringify(id)}]);
      const at = ${JSON.stringify(at)};
      const reached = () => S.mission.stage === ${stage} && (S.ops ? S.clock >= clockMin(at) : S.day - S.plan.day0 >= at);
      let n = 0;
      while (!reached() && n++ < 200000) {
        const st = S.mission.status;
        if (st === 'stageDone') Missions.next();
        else if (st === 'running') { Strategy.act(r); Sim.step(); }
        else break;
      }
      GameEvents.mute(false);
      Game.intro();
      Game.play();
      Cam.centerOn(${cam.join(', ')});
      return S.mission.status + ', stage ' + S.mission.stage + ', ' + (S.ops ? 'clock ' + S.clock : 'day ' + (S.day - S.plan.day0)) + ', ' + Math.round(S.money) + ' SEK';
    })()`));
    await h.sleep(2500);
    await h.ev(`Cam.centerOn(${cam.join(', ')}); 1`);
    await h.sleep(500);
  };
}

module.exports = {
  viewport: [1280, 720],
  gif: ['--no-dither'],              // dithered it is over 6 MB
  slides: [
    { name: '1-1958-forest', take: mission({ id: '1-1', at: 75, cam: [380, 1620, 1.3] }) },                          // the strip cut into the forest
    { name: '2-1960-first-jets', take: mission({ id: '1-5', at: '08:20', cam: [650, 1220, 1.1], from: '1-1' }) },
    { name: '3-1976-international', take: mission({ id: '2-11', stage: 1, at: '08:30', cam: [760, 1260, 0.8] }) },  // the international terminal
    { name: '4-1987-big-freeze', take: mission({ id: '3-7', stage: 1, at: '08:45', cam: [760, 1260, 0.85], from: '3-1' }) },
    { name: '5-1999-millennium-night', take: mission({ id: '4-11', stage: 2, at: '23:30', cam: [800, 1300, 0.8], from: '4-1' }) },
    { name: '6-2003-runway-3', take: mission({ id: '5-7', stage: 1, at: '08:00', cam: [1350, 1000, 0.45], from: '5-1' }) },
    { name: '7-2018-record-summer', take: mission({ id: '6-11', stage: 1, at: '07:25', cam: [880, 1560, 0.9] }) },
    { name: '8-2020-empty-apron', take: mission({ id: '7-1', stage: 1, at: 25, cam: [1000, 1480, 0.72] }) },
    { name: '9-2040-green-pier', take: mission({ id: '8-8', stage: 1, at: '14:20', cam: [930, 2000, 0.9], from: '8-5' }) },
  ],
};
