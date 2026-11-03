# Yacht — SPEC

Developer/agent spec for the `yacht` project. Repo-wide conventions live in the root `SPEC.md` and `AGENTS.md`; this file only describes this game. Keep it in sync with the code.

## Idea

The dice game Yacht (Yahtzee, in Russian tradition "покер на костях"; in Swedish Yatzy), by the rules and the score sheet of a family's paper game. 1 to 10 people play on one device, passing it round: each turn a player rolls five dice up to three times, keeping the ones they like, and must write the result into one free row of their column. After 15 rounds every row is filled and the highest total wins. Groups of players are kept in the browser, each with its own statistics.

## Rules

### A turn

- Up to three rolls. Before the 2nd and the 3rd roll the player taps dice to hold them; held dice can be released again. The first roll always rolls all five.
- After any roll the player writes into one free row of their own column. A row is filled once and for all. There is no passing: if nothing fits, a row must be given up.
- The game has 15 rounds (9 combination rows + 6 school rows), filled in any order.

### The score sheet

The rows, in the order of the paper sheet:

| Row | Name | Needs | Points |
|---|---|---|---|
| G | General | five of a kind | sum of the five dice (5 × face) |
| C | Carré | four of a kind (or five) | 4 × face |
| BS | Big straight | 2-3-4-5-6 | 20 |
| LS | Little straight | 1-2-3-4-5 | 15 |
| 3:2 | Full house, three higher | three of one face and two of a **lower** one | sum of the five dice |
| 2:3 | Full house, pair higher | three of one face and two of a **higher** one | sum of the five dice |
| 2:2 | Two pairs | two pairs of different faces (a full house also has them) | 2 × each pair's face |
| 3:0 | Three of a kind | three of a kind (or more) | 3 × face |
| Ш / Ch | Chance | anything | sum of the five dice |
| *Game sum* | | | sum of the rows above |
| 6 … 1 | School | see below | (count − 3) × face |
| *School sum* | | | sum of the six rows |
| *Total* | | | game sum + school sum |
| *Place* | | | I, II, III … by total; equal totals share a place |

- **First-roll double:** a combination row (G … Ш) written after the first roll of the turn counts **× 2**. School rows are never doubled.
- A combination row given up (the dice do not fit) is written as `—` and counts 0.
- **School row** of face F, with n dice showing F:
  - n = 3: the row is closed, 0 points, written `+`;
  - n > 3: closed with (n − 3) × F, written `+2` (four twos), `+8` (five fours);
  - n < 3: the row is not closed and costs **−40** (`SCHOOL_MISS`), written in red. Each row not closed costs it again.
- There is no other bonus or penalty for the school: the school sum is the sum of its six rows.

**Where the rules come from.** The rows, the first-roll double and the two full houses are read from the family's paper sheet: its column sums check out with these values (42 + 12 + 24 + 23 = 101; 6 + 2 − 40 = −32; 168 − 40 = 128). Values above a row's maximum are doubled ones (52 in Chance, 44 in 2:2, 48 in C, 30 in LS, 40 in BS). 27 can only be pair 6 + three 5 and was written in 2:3; 23 can only be three 5 + pair 4 and was written in 3:2. G's value and the school's rule are the owner's. Other published rules differ in the school (a +40 or +50 bonus, negative rows) and are not used here.

### The end

The game ends when every player has filled all 15 rows. The result goes into the group's statistics (unless a cheat was used).

## Groups

- A **group** has a name and 1–10 players in turn order. Any number of groups, kept in `localStorage`; the last used one is selected on the next visit.
- Editor: the group's name, a name field per player, add (up to 10), remove, move up / down. Empty names and equal names (ignoring case) are refused with a text next to the field. Names up to 16 characters, group names up to 24.
- Players have ids, so a rename keeps their statistics. A removed player's past games stay in the statistics under the name they had.
- Deleting a group asks first and says how many games go with it.
- Each group can have one unfinished game. It is saved after every action (a reload cannot re-roll), and continues with **Continue**. A game keeps the players it began with: changes in the editor apply from the next game (the editor says so).
- The first player moves one seat on with each new game of the group.
- Storage writes only the group that changed, re-reading the rest first, so a second tab's group is not overwritten. A failed write (storage full or blocked) shows a banner; the game goes on.

## Difficulty = how much help

The three levels change only the help, never the rules. The level is per game; it is chosen on the start screen and on the game-over dialog, and remembered.

- **Easy:** free rows show what the current dice would score; the best move is shown: which dice to hold (marked on the dice), or which row to write in (marked in the table), with a line saying what it aims for and how likely that is. 
- **Medium:** free rows show what the current dice would score. No advice.
- **Hard:** no scores shown in free rows. The game still counts the points when a row is tapped.

On every level a tap on a row's label explains the row in the message line.

On all levels, writing `—` or `−40` asks for a second tap on the same row (the row is marked and the message line says what it would write), so a slip cannot cost a row. On Hard the second tap is asked for every row, so it does not give away what the row would score.

**The advice** (`sim/advisor.js`) is an exact calculation over the 252 sets of five dice: for each set and rolls left, the best of writing now or holding some dice and rolling, where writing is worth the row's points minus `ROW_WORTH[row]`, the row's average value in a game (what giving it up costs). It looks at one turn only, and it is not perfect play.

## Screens

- **Start screen:** the language switcher (EN · RU · SV) at the top, the title with a dice logo; the groups as a list (name, players; the selected one marked), **+ New group**; for the selected group: **Continue** (only with an unfinished game, shown with its round; the default button then), **New Game**, **Edit**, **Statistics**; the difficulty (Easy / Medium / Hard toggles with a line on what the level gives), Sound On / Off, the table's colour and texture, a **How to play** toggle with the table of rows. With no group yet, the only large button is **+ New group**.
- **Group editor:** see Groups; **Save**, **Cancel**, **Delete group**.
- **Game:** the top bar has the round (`Round 4 / 15`), 📊 Statistics, 🔊 / 🔇 and ☰ pause. Then:
  - **Player card:** whose turn it is; their place so far, game sum, school sum, total, how far behind the leader (or ahead of the second), rows left (combinations and school). At the start of a turn it is what tells the next player to take the device.
  - **The table:** the page's background is the table top. On it a **leather dice cup** and five 3D dice (CSS, no canvas). At the start of a turn all dice are in the cup. A roll (the **Roll** button with the rolls left, `Roll (3)`, or a tap on the cup): the dice not held fly into the cup, it shakes with a rattle, tips over and they tumble out to random places on the table; the cup stands up again. Held dice wait in a row along the table's edge, outlined. Roll is disabled after the third roll, while the dice tumble, and when all five are held (rolling them would lose the first-roll double for nothing; the message line says so). The roll plays also with the system's reduced motion on (it is short, asked for by the player, and the game's point: Windows with its animations off reports reduced motion); only what moves by itself stops then, the waiting cup and the pulsing hint. A message line under it: hints, what a tap would write.
  - **Score table:** the rows of the paper sheet, a column per player, the current one highlighted and scrolled into view; the labels column stays while scrolling sideways. Free rows of the current player are buttons, with the possible score on Easy and Medium; doubled scores are marked `×2`.
  - In portrait (a phone, a tablet) these stack and the sheet scrolls by itself; in landscape (a desktop, a tablet, a phone on its side) the dice and the card are on the left, the sheet on the right. Screens of 600 × 600 px and up get the big dice; small phones and phones on their side a smaller table, so the sheet keeps its room. On touch screens the sheet's rows are taller, for a finger.
  - **Undo:** after a row is written, an **↩ Undo** button stays until the next player rolls, and takes the row and the dice back.
- **Pause dialog:** Continue (default), Statistics, New Game (asks first, the unfinished game is not counted), Main Menu (the game stays saved), Sound On / Off, the table's colour and texture.
- **Game-over dialog:** the places with names and totals, a line for the winner, the difficulty toggles (pre-selected), **Play Again**, Statistics, Main Menu, Sound On / Off; **View the sheet** hides the dialog to look at the table (a Results button brings it back); fireworks. A note when cheats were used: this game is not in the statistics.
- **Statistics** (from the start screen, the game and the game-over dialog), for the selected group, with three tabs:
  - **Players:** per player: games, wins (first place, shared ones too), average, best and worst total, average place, best game sum, best school sum, Generals, doubled rows, school rows not closed. Sorted by wins, then average. Former players are included.
  - **Rows:** per player, the average per row; given-up rows count as 0.
  - **Games:** the latest games first: date, level, the places with totals.
  - With no finished game yet, a line says so. In a running game the top also shows the game in progress is not counted yet.
  - **Clear statistics** asks first, for this group only.

## Controls

- **Touch:** tap a die to hold it, tap Roll, tap a free row. The Minecraft-style joystick does not apply: a turn-based game with buttons has no direction. New Game and Continue go fullscreen on a touch device (try/catch, iPhone stays windowed). The table scrolls with a finger; there is nothing else to block.
- **Mouse:** the same, with clicks.
- **Keyboard:** Space or Enter rolls, or presses the visible dialog's default button (not while typing in a field); keys 1–5 hold or release a die; Esc opens or closes the pause and closes dialogs. Enter in a name field goes to the next field.

## The table top

A choice of colour and texture, on the start screen and in the pause dialog; it applies at once and is remembered (`yacht.table`). Colours: green, blue, burgundy, charcoal, walnut, sand (`TABLE_COLORS`). Textures: felt, wood, leather, linen, marble (`TABLE_TEXTURES`). The textures are SVG noise overlays in `styles.css` (no image files), over the chosen colour, so every pair works. The score sheet stays cream paper with ink-blue figures on any table.

## Sound

Synthesized (Web Audio): dice rattling (a burst of clicks), a tick on hold and release, a note on writing (higher for a good score, low for `—` and `−40`), a chord for a General, a fanfare at the end. A **Sound** On / Off switch on the start screen, in the pause and game-over dialogs, plus 🔊 / 🔇 in the top bar; remembered as `yacht.sound`, one master gain.

## Cheats

Keyboard only, in a game, not in the instructions. Each shows a banner and marks the game as cheated, so it does not reach the statistics. Alt+1 … Alt+6: all five dice this face; Alt+7: little straight; Alt+8: big straight; Alt+9: full house 6-6-6-5-5; Alt+0: fills every row left, of every player, with random rolls (to reach the end). Setting the dice counts as a roll if there were none yet, and does not use a roll otherwise.

## Storage

Prefix `yacht.`: `yacht.groups.v1` (`{ activeId, groups: [{ id, name, players: [{ id, name }], nextFirst, current, games: [...] }] }`; `current` = the unfinished game, `games` = the finished ones, at most `GAMES_MAX` per group, oldest dropped), `yacht.difficulty`, `yacht.sound`, `yacht.lang`, `yacht.table`. Bad or foreign JSON counts as empty and is not written over until the first change.

## Languages

English, Russian and Swedish (`core/i18n.js`, `data/lang-ru.js`, `data/lang-sv.js`), the switcher on the start screen and the game-over dialog. The row labels are as on the sheet in every language, except Chance: `Ш` in Russian, `Ch` in the others. The title: Yacht / Яхт / Yatzy.

## Files

```
yacht/
├── SPEC.md, README.md, README_RU.md, README_SV.md
├── index.html, styles.css
├── constants.js         # limits, timings, points, the rows' worth
├── game.js              # the flow: screens, buttons and keys to the logic, cheats
├── data/rows.js         # the rows of the sheet, their names and descriptions
├── data/lang-ru.js, lang-sv.js
├── core/                # i18n, utils, events, audio, groups (the saved groups), cursor, update
├── sim/state.js         # the running game's state
├── sim/scoring.js       # what a row scores for five dice; sums and places
├── sim/turn.js          # rolling, holding, writing, undo, next player, the end
├── sim/advisor.js       # the best move (Easy)
├── sim/stats.js         # statistics of a group's finished games
├── art/flag-*.svg       # the language switcher
├── art/cup.svg          # the leather dice cup
├── ui/dice.js           # the 3D dice and the cup: the roll's animation
├── ui/tabletop.js       # the table's colour and texture
├── ui/table.js          # the score table
├── ui/card.js           # the player card and the message line
├── ui/screens.js        # start screen, pause, game over, banner
├── ui/groups.js         # the group editor
├── ui/statsview.js      # the statistics dialog
├── ui/sounds.js         # game events → sounds
├── ui/fireworks.js
├── icon.svg, icon-maskable.svg, icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png
├── manifest.webmanifest
└── screenshot.png
```

## Testing

The logic runs in Node without a page: load `constants.js`, `data/rows.js`, `core/events.js`, `sim/*.js` into a `vm` context. Browser recipe with `tools/cdp.js`: `Groups.create(...)` a group, then `Flow.newGame()`; the cheats for the end of a game.
