# <img src="icon.svg" alt="" width="48" height="48" align="center"> Fish Frenzy

*[Читать на русском](README_RU.md)*

A small arcade game in the browser: you're a tiny fish in the open sea. Eat plankton and fish smaller than you, grow, and climb the food chain — from a fry all the way to the Sea King. Watch out for anything bigger than you.

![Screenshot](screenshot.png)

## How to run

Open [index.html](index.html) in a browser — no build step, no server required.

## Controls

- **← →** — turn
- **Ctrl** (or **↑**) — boost (dash), costs stamina that refills over time — twice as fast while you're growing from a fish you just ate
- Mouse is not used — keyboard only

**On phone/tablet:** the game switches to fullscreen when you start (where the browser supports it; on iPhone, add the page to the home screen for a fullscreen view). Drag your thumb in the **left half** of the screen like a joystick — the fish turns toward the direction you push. Touch and hold anywhere in the **right half** to boost. Both work at the same time.

## Difficulty

Pick a difficulty on the start screen (Space/Enter picks Medium):

- **Easy** — twice as much food, other fish swim 10% slower, 50% more boost stamina that also refills 50% faster. Fish flee and chase sloppily — up to 20° off the ideal direction — and react in about 0.3 s.
- **Medium** — 50% more food, other fish swim 5% slower, 25% more boost stamina that also refills 25% faster. Fish aim up to 10° off and react in about 0.25 s.
- **Hard** — the standard game. Fish aim up to 5° off and react in about 0.2 s.

On every level the other fish notice you with a human-like delay, and they turn smoothly rather than twitching toward their target.

## Graphics

The start screen also has a **Graphics** switch (remembered between visits):

- **High** — full quality: sun rays, vignette and glowing plankton, rendered at up to 2560×1440.
- **Low** — for weaker laptops and phones: no sun rays, vignette or plankton glow, rendered at up to 1600×900 and scaled to the screen.

## Demo

The **Demo** button under the graphics switch starts an Easy run where the fish plays by itself: it reacts with the same delay and aim error as the other fish, but sees further and plays smarter: it escapes all nearby predators at once (the ones facing it count the most), chases the tastiest fish in view and aims where the prey is heading, grabs plankton while it's a Fry and stays away from the surface and its gulls, and steers clear of jellyfish. It dashes to escape or to catch prey, spends full stamina on hunting and feeding, and always keeps a reserve for a getaway. When it dies the demo starts over; press any key or tap the screen to go back to the menu. Demo runs never set records.

## Gameplay

- The sea is endless to the left and right. Below you is the **sea floor**, above you is the **surface** with a tropical island, clouds and gulls on the horizon. The water is deep enough that a full-dash climb from the floor to the surface takes about 10 seconds for a fry and about 20 seconds for the biggest fish.
- **Leaps.** Dash upward into the surface and your fish leaps out of the water: it flies along a real ballistic arc (you can't steer in the air) and lands back with a splash — spray, droplets, foam and bubbles. The steeper and faster you hit the surface, the higher the jump; big fish need a dash to break out, otherwise they just skim along the surface with their back out of the water. Other fish near the surface leap too — sometimes for fun, sometimes while chasing prey or escaping; their splashes sound quieter the farther away they are, and louder the bigger the fish. Seagulls glide over the water at different heights… who knows what a good leap could do. Careful as a fry, though: to a gull, you're the snack — it'll grab you and fly off.
- Depth matters. Near the floor the water is dark, food is abundant, and the fish are the smallest around — a safe place to graze. The higher you swim toward the surface, the brighter the water gets and the bigger (and more dangerous) the rivals become. Watch the "Depth" meter to see where you are.
- Every fish on screen is outlined by color: **green** means you can eat it, **red** means it can eat you, faint white means you're too evenly matched — you just bounce off each other.
- Predators you can't see yet show up on the **danger radar**: a pulsing red glow at the edge of the screen on their side, with an arrow pointing at them. The bigger and closer the fish, the larger, brighter and faster-beating the glow; a double arrow means it's heading for you. It fades out as the fish swims into view.
- You eat with your **mouth** — the head in front of the gills has to reach the fish, or just the glow around a piece of food. The same goes for predators: if you're right behind a big fish's tail, it can't eat you until it turns around.
- Eating plankton always grows you a little. Eating a smaller fish grows you a lot more. Growth from each meal is spread smoothly over 3 seconds.
- You need to be noticeably bigger than a fish to eat it (and vice versa) — near-equal sizes don't trigger anything, so close calls aren't unfair.
- You're briefly invulnerable right after spawning (blue glow) so you have time to get your bearings before predators start hunting.
- Jellyfish aren't lethal, but touching one stings you: you shrink a bit and slow down for a moment, so it's worth steering around them. Other fish get stung too and try to swim around jellyfish. Sharks and bigger are immune: jellyfish can't sting them, and they eat jellyfish instead — that goes for you too once you become a Shark.
- The bigger you get, the more the camera zooms out, and the sea around you spawns fish sized relative to you — there's always something to eat and something to fear.
- Reach the final stage (Sea King) to become the sea's apex predator. A celebration dialog shows how long it took and your best time for that difficulty (and congratulates you on a new record). From there you can continue playing to keep growing, or start over.
- The HUD shows your weight and length: a fry starts at 5 cm and about 0.7 g (weight grows with the cube of length), and every step up in size multiplies them, all the way to 33 m and 200 t — as big as the biggest blue whale. That's the maximum size in the game (no fish is ever bigger). Reaching it sets off fireworks and shows your time and best time for that difficulty; you can keep playing (you won't grow any more) or start over.
- The bigger you get, the fewer (and more spread out) the other fish are, so the sea doesn't turn into a traffic jam of giants. Most fish you meet are close to your own size — mostly smaller near the floor, mostly bigger in the shallows — with an occasional small fry mixed in. Real giants are rare, though: the bigger a fish would be, the less likely it is to show up, so as the Sea King you'll mostly meet sharks and smaller kings to eat, and only now and then a rival your size.
- Other fish live by the same rules: bigger fish eat smaller ones they catch with their mouth, and any fish that bumps into food eats it and grows (they don't go looking for food, though).
- Get eaten by something bigger and it's game over — try to grow bigger next time.

## Tech stack

Plain HTML + CSS + a few vanilla JavaScript files (`utils.js`, `audio.js`, `input.js`, `scenery.js`, `fireworks.js`, `constants.js`, `game.js`) — no frameworks, no build step. Canvas 2D for rendering, Web Audio API for sound.
