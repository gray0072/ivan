# Dev Life — saves and the Life Gallery

Part of [SPEC.md](../SPEC.md). How a running life is saved so the player can **switch the phone off at any moment, come back and continue exactly there**, and how finished lives are kept in the **Life Gallery**. The code lives in `sim/save.js` (what a save holds, the slots, the migrations), `core/storage.js` (the prefixed `localStorage` access) and `ui/gallery.js`; the checker is `tools/save-check.js`.

## The promise

**Nothing a player did is ever lost, and nothing has to be done to keep it.** No *Save* button: a phone locked mid-card, an app swiped away, a battery dead, a child's time limit closing the browser, an update reloading the page — the next start shows **Continue** and puts the player back at the same game minute, on the same card or the same step of the PC assembly, **paused**, with one line saying where they were.

## What a save holds

The save is the **whole sim state** plus what the screen needs to look the same:

- **The life:** the date and the clock, the hero (meters, body, skills, money, the routine, the university or the job, the home, the computers and the desk, the people), the market's state, the goals' progress, the autopilot's rules, the difficulty, the *cheated* flag;
- **The randomness:** the seeded RNG's state, so a resumed life plays on exactly as it would have ([SPEC.md › Testing](../SPEC.md#testing): determinism);
- **What is waiting:** the open card (its id and its rolled values — the same choices and chances come back), the cards queued, the offers kept for a week, the boxes not yet assembled;
- **Where the player was:** the open tab, the PC assembly's step and the parts already placed, the open Dictionary entry — the scroll and the bubble are not kept;
- **This year's log** in detail (days' aggregates), the past years as compact monthly series (see "Size").

It never holds translated text: names of things are ids, the Memoir and the Life Feed are rebuilt from facts, so a save shows in whatever language is chosen.

## When it is saved

| Moment | Why |
|---|---|
| **Every 5 real seconds while the time runs**, if anything changed | A phone that is killed without warning (iOS does it) loses at most 5 seconds |
| **At once after every decision** — a card answered, a purchase, a slider released, a job taken, an assembly step done, a setting changed | A decision is never asked twice |
| **When the page is hidden** — `visibilitychange` to *hidden*, `pagehide`, `freeze` | The phone locks, the app switches, the tab closes; these are the last moments a page reliably gets on mobile, so the write is **synchronous** (`localStorage`), never an async one that may not finish |
| **Before an update reloads the page** (`update.js` waits for an idle moment, the game saves first) | A new version never costs progress |
| **On every birthday**, into the birthday slot (below) | A safe point a year apart |

**The time stops when the page is hidden:** the game pauses itself on *hidden* and stays paused on return (with *Life goes on while I'm away* on, the away time is simulated then, see [SPEC.md › Time and length](../SPEC.md#time-and-length)).

## Slots and safety

- **Two rotating slots**, `devLife.life.v1.a` and `.b`: each save writes the older one, with a **sequence number** and a **checksum**; loading takes the newest slot whose checksum is right. A write cut in half (the battery died during it) leaves the other slot whole.
- **The birthday slot**, `devLife.life.v1.bday`: the state at the last birthday. If both rotating slots are broken, the game loads it and says so kindly: *"We couldn't read the last save, so we went back to your birthday, 12 October 2013."*
- **The log**, `devLife.life.v1.log`: the past years' compact series, written once a year (on the birthday) — not every 5 seconds.
- **Versions:** every save has a `version`; a newer game reads every older save through `sim/save.js`'s migrations, step by step; a field the code does not know (a save from a newer version on an older cached copy) is kept as it is and written back, never dropped.
- **Two tabs:** a second tab or window with the game sees the life open elsewhere (a heartbeat key `devLife.lock` with a timestamp, and the `storage` event) and shows *"Dev Life is open in another tab"* with **Continue here** — taking over pauses the other one, which then shows the same message. Two tabs never write the same life.
- **Storage is shared** with every app on the origin (`AGENTS.md`): only keys starting with `devLife.` are ever written or removed, never `localStorage.clear()`. A **quota error** drops the birthday slot first and tries again; if it still fails, a calm banner says the device's storage is full and offers **Export life** (below) — the game keeps running and keeps trying.

### Size

The origin's `localStorage` (about 5 MB on most browsers) is shared with every game on it, so Dev Life keeps under **about 1 MB** in all: the running life's state ≤ 150 KB (three copies: a, b, bday), the log ≤ 200 KB (32 years × monthly values of the meters, money and hours), the Life Gallery ≤ 300 KB, the Codex, the Dictionary and the settings a few KB. `tools/save-check.js` measures a life at 2042 and fails above the budget.

## Coming back

Opening the game with a life running shows the **Welcome back** screen over the paused scene, drawn as it was:

```
   Welcome back, Alex!
   Tue 3 Feb 2013 · 14:20 · 2nd year
   You stopped before the Databases exam (tomorrow, likely Good).

                [ ▶ Continue ]          ← Space / Enter; on a phone also fullscreen
   Life Gallery · New life · Settings
```

- One tap continues: on a phone the same tap goes fullscreen (`docs/mobile.md`); the game comes back **paused** on the card or the tab it was on; ▶ starts the time.
- **New life** with a life running asks first: *"Start a new life? Alex's life (2013, age 20) will end."* with **Save Alex to the Gallery as unfinished** checked by default.
- **Export life** (pause menu → Settings): downloads the save as a file `dev-life-alex-2013-02-03.json`; **Import life** on the start screen loads such a file (checked, migrated, then asks before replacing a running life). This is the way to move a life to another device until a cloud save exists; a cloud save may come later through `docs/cloud-save.md`, the game never waiting for it.

## The Life Gallery

A finished life is kept forever in the **Life Gallery** (`devLife.gallery`), opened from the start screen, the pause menu and 🎯 Goals.

### What goes in

- **A finished life** — at the **50th birthday** (the story's end), after the party and the Memoir, the life is added to the Gallery by itself: *"Alex's life is in the Gallery."* A life that goes on (*Keep living*) updates its entry at 2050 or when the player ends it.
- **An unfinished life** — when a new life replaces it (the checkbox above) or by **Save to Gallery** in the pause menu at any time from the age of 30: marked *unfinished*, with the age it reached; it can later be continued only if it is still the running life.
- **Cheated lives** are kept too, marked 🧪, and are left out of the records.

### An entry

Small (≈ 10 KB) because everything is kept as facts and drawn again, never as images:

- the hero's look at 18 and at 50 (the puppet's parameters), the name, the start, the difficulty, the dates played;
- the **title of the life** (*The Balanced Architect*, *The Family Hacker*…), the **Life Balance** score and the **wheel of life** at 50 with its shape over the years;
- key numbers: the top job title, the best skills, net worth in 2010 money, the people at the 50th party (partner, kids, friends), weight at 18 and 50, the sports kept, the conferences talked at, the countries lived in;
- the **PCs built**, by their parts' ids (drawn in a row, from the old laptop to the last build), and the Codex's and the Dictionary's counts;
- the **Life Dreams** fulfilled, the chapter goals' ★, the achievements;
- the **photo album** — one photo a year as a scene description (the event, the place, who was there), redrawn on demand;
- the **Memoir's facts**, so the Memoir reads again in any language.

### The Gallery screen

- **Cards** in a grid, the newest first: the hero's portrait at 50 (and 18 on hover or a tap), the name, the title of the life, the years, the Life Balance, ★ and the dreams' icons; tags *unfinished*, 🧪, the difficulty.
- **Open** a card → the Memoir of that life (the book, [screens.md › The Memoir](screens.md#the-memoir)) and the album.
- **Compare** two lives side by side: the wheels overlaid, the key numbers with ▲▼, the hours of a life by activity (*"Life 2: 3 000 more hours with the family, 1 800 fewer at work"*).
- **Records** across the Gallery (without 🧪): the best Life Balance, the most dreams fulfilled, the most friends at the party, the most PCs built, the highest title — each with the life that holds it.
- **Save picture** — the card drawn as a PNG (the portrait, the wheel, the title, the key numbers) to download or share through the phone's share sheet (`navigator.share` with a file where supported).
- **Delete** with a confirmation. The Gallery keeps up to **30** lives; the 31st asks which one to remove.
- The Gallery is never touched by *New life*, by an update or by a broken life save; it has its own key and its own checksum.

## Testing the saves

`tools/save-check.js` (headless, Node):

- runs a life with a seed and a policy, **saves and reloads at random moments** (mid-card, mid-assembly, in an exam session, on a birthday) and checks that the reloaded life ends **identical** to the uninterrupted one (a hash of the state at 2042);
- **cuts a write in half** and checks that the other slot loads; breaks both and checks the birthday slot;
- loads saves of every older version from `tools/saves/` (one is added for each version that changes the save) through the migrations;
- measures the sizes against the budget.

In the browser (`tools/cdp.js`, short): open a card, kill the page without `pagehide`, reopen — the same card is on screen; hide the page — the game is paused.
