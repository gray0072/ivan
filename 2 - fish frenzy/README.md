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

**On phone/tablet:** tilt the device left/right to steer instead of the arrow keys, tap and hold the screen to boost instead of Ctrl. On iOS you'll get a one-time motion-sensor permission prompt when you tap "Start".

## Gameplay

- The sea is infinite — there's no wall to hit, except one: the **sea floor** below you.
- Depth matters. Near the floor the water is dark, food is abundant, and the fish are the smallest around — a safe place to graze. The higher you swim toward the surface, the brighter the water gets and the bigger (and more dangerous) the rivals become. Watch the "Глубина" (depth) meter to see where you are.
- Every fish on screen is outlined by color: **green** means you can eat it, **red** means it can eat you, faint white means you're too evenly matched — you just bounce off each other.
- Eating plankton always grows you a little. Eating a smaller fish grows you a lot more, and scores points based on its size.
- You need to be noticeably bigger than a fish to eat it (and vice versa) — near-equal sizes don't trigger anything, so close calls aren't unfair.
- You're briefly invulnerable right after spawning (blue glow) so you have time to get your bearings before predators start hunting.
- Jellyfish aren't lethal, but touching one stings you: you shrink a bit and slow down for a moment, so it's worth steering around them.
- The bigger you get, the more the camera zooms out, and the sea around you spawns fish sized relative to you — there's always something to eat and something to fear.
- Reach the final stage (Sea King) to become the sea's apex predator — the game keeps going afterwards so you can keep growing your score.
- Get eaten by something bigger and it's game over — try to beat your score.

## Tech stack

A single HTML file: Canvas 2D, vanilla JavaScript (no frameworks, no build step), sound via the Web Audio API.
