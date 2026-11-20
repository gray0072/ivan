'use strict';

// Arlanda Rising — the game's events turned into sounds (core/audio.js plays them through the master gain): a jet or
// a propeller at every landing and take-off, louder when the map is zoomed in; a ping for a new task and a click
// when one is done; the ploughs' rumble; an alarm at a close call; a sad trombone for a flight sent away; a chord
// when something is built; the PA chime before a choice. Nothing here runs in Node (the checker never loads it).

(() => {
  const near = () => clamp(Cam.zoom * 1.1, 0.2, 1);
  const engine = (e) => {
    const f = S && S.ops && S.ops.flights.find((x) => x.no === e.flight);
    return f && AIRCRAFT[f.type].engines === 'prop' ? 'prop' : 'jet';
  };
  GameEvents.on('landed', (e) => Sfx.play(engine(e) === 'prop' ? 'prop' : 'jetLand', near() * 0.8));
  GameEvents.on('departed', (e) => Sfx.play(engine(e), near()));
  GameEvents.on('task', () => Sfx.play('ping'));
  GameEvents.on('taskDone', () => Sfx.play('click'));
  GameEvents.on('convoy', () => Sfx.play('rumble'));
  GameEvents.on('closeCall', () => Sfx.play('alarm'));
  GameEvents.on('diverted', () => Sfx.play('sad'));
  GameEvents.on('stageBuilt', () => Sfx.play('chord'));
  GameEvents.on('decision', () => Sfx.play('chime'));
})();
