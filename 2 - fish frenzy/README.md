# Fish Frenzy

*[Читать на русском](README_RU.md)*

A small arcade game in the browser: you're a tiny fish in the open sea. Eat plankton and fish smaller than you, grow, and climb the food chain — from a fry all the way to the Sea King. Watch out for anything bigger than you.

![Screenshot](screenshot.png)

## How to run

Open [index.html](index.html) in a browser — no build step, no server required.

## Controls

- **← →** — turn
- **Ctrl** (or **↑**) — boost (dash), costs stamina that refills over time
- Mouse is not used — keyboard only

**On phone/tablet:** the game switches to fullscreen when you start (where the browser supports it; on iPhone, add the page to the home screen for a fullscreen view). Drag your thumb in the **left half** of the screen like a joystick — the fish turns toward the direction you push. Touch and hold anywhere in the **right half** to boost. Both work at the same time.

## Difficulty

Pick a difficulty on the start screen (Space/Enter picks Medium):

- **Easy** — 20% more food, other fish swim 10% slower, 50% more boost stamina that also refills 50% faster.
- **Medium** — the standard game.
- **Hard** — 20% less food, other fish swim 10% faster, 25% less boost stamina that refills 25% slower.

## Gameplay

- The sea is infinite — there's no wall to hit, except one: the **sea floor** below you.
- Depth matters. Near the floor the water is dark, food is abundant, and the fish are the smallest around — a safe place to graze. The higher you swim toward the surface, the brighter the water gets and the bigger (and more dangerous) the rivals become. Watch the "Depth" meter to see where you are.
- Every fish on screen is outlined by color: **green** means you can eat it, **red** means it can eat you, faint white means you're too evenly matched — you just bounce off each other.
- You eat with your **mouth** — the head in front of the gills has to reach the food or the fish. The same goes for predators: if you're right behind a big fish's tail, it can't eat you until it turns around.
- Eating plankton always grows you a little. Eating a smaller fish grows you a lot more, and scores points based on its size. Growth from each meal is spread smoothly over 5 seconds.
- You need to be noticeably bigger than a fish to eat it (and vice versa) — near-equal sizes don't trigger anything, so close calls aren't unfair.
- You're briefly invulnerable right after spawning (blue glow) so you have time to get your bearings before predators start hunting.
- Jellyfish aren't lethal, but touching one stings you: you shrink a bit and slow down for a moment, so it's worth steering around them. Other fish get stung too and try to swim around jellyfish.
- The bigger you get, the more the camera zooms out, and the sea around you spawns fish sized relative to you — there's always something to eat and something to fear.
- Reach the final stage (Sea King) to become the sea's apex predator. A celebration dialog shows how long it took and your best time for that difficulty (and congratulates you on a new record). From there you can continue playing to keep growing your score, or start over. As the Sea King, jellyfish can't sting you anymore — you eat them instead.
- The maximum size in the game is r = 500 (no fish is ever bigger). Reaching it sets off fireworks and shows your time and best time for that difficulty; you can keep playing (you won't grow any more) or start over.
- The bigger you get, the fewer (and more spread out) the other fish are, so the sea doesn't turn into a traffic jam of giants.
- Get eaten by something bigger and it's game over — try to beat your score.

## Tech stack

Plain HTML + CSS + a few vanilla JavaScript files (`utils.js`, `audio.js`, `input.js`, `scenery.js`, `fireworks.js`, `game.js`) — no frameworks, no build step. Canvas 2D for rendering, Web Audio API for sound.
