# Dev Life — SPEC

Developer/agent spec for the `dev-life` project. Repo-wide conventions live in the root `SPEC.md` and `AGENTS.md`; this file only describes this game. Keep it in sync with the code.

> **Status: design — the spec is written and waits for the user's agreement; no code yet.** Settled with the user: the name *Dev Life* (folder `dev-life`); the life starts on the **first day of university** (September 2010, age 18) with the stipend and the student life; **every word is understandable to a schoolkid** — plain words first, the real terms marked with bubbles and a Dictionary; **the phone can be switched off at any moment** and the life continues exactly there; **finished lives are kept in the Life Gallery**. The other open questions are listed at the end ("Open questions") — the defaults written in this spec apply until the user decides otherwise.

## The spec's files

This file holds the game's core: the idea, the story, the loop, the time, the length, the goals, the settings, the files and the build order — read it in full before any change. The large parts by area live in `spec/`; **read the ones the task touches, in full, before changing anything there**.

| Working on… | Read |
|---|---|
| the university (chapter 1): classes, subjects, exams and retakes, the stipend, parents' help, student jobs, clubs, contests, the exchange semester, the internship, the thesis, dropping out | [spec/university.md](spec/university.md) — the student years |
| the meters, the day's routine and its sliders, food, sleep, sport, weight, illness, burnout, money, home, partner, kids, friends, the random events | [spec/life.md](spec/life.md) — the life simulation |
| skills, learning, the market's demand, jobs, offers and their comparison, interviews, reviews and promotions, freelance, side projects, a startup | [spec/career.md](spec/career.md) — the career |
| the computer, its parts, the shop, the assembly, the Hardware Codex, the desk and the workplace, laptops, the company's equipment | [spec/computer.md](spec/computer.md) — the computer and the workplace |
| the chapters, the history events by year, 2010 → 2040, the future after 2026 | [spec/timeline.md](spec/timeline.md) — the timeline |
| a screen, the HUD, the main scene and its drawings, the birthday report, the Memoir, the phone layout | [spec/screens.md](spec/screens.md) — the screens and the graphics |
| **any text the player sees** (writing or translating), a term, the bubbles, the 📖 Dictionary, the "Why?" explanations, `data/glossary.js` | [spec/words.md](spec/words.md) — plain words and hints |
| the autosave, the slots, coming back, two tabs, export / import, the save's versions and size, the Life Gallery | [spec/saves.md](spec/saves.md) — saves and the Life Gallery |
| **starting a session**, the tracks run in parallel, who owns which file, the merge and its checks | [spec/plan.md](spec/plan.md) — the work plan, session by session; `spec/contracts.md` (written in session 1) — what the tracks share |

## Idea

A calm **idle life strategy** about a programmer's life from **2010 to 2042**: from a first-year student with a hand-me-down laptop and a stipend to a 50-year-old with a career, a family, a home and a desk they built themselves. Time flows on its own at a chosen speed; the player decides **how the hero spends the day** (sliders of a 24-hour routine), **what to learn**, **which job to take**, **what to buy and what to save**, **which invitations to accept** — and watches how every choice moves the hero's meters, money and skills.

The heart of the game is **balance**. There is no single right life: a workaholic gets rich and lonely, a homebody is happy and stays junior, a saver has a cushion and an old chair that ruins the back. The game shows the price of every choice in plain arrows ▲▼ before it is made, so the player *understands* how a life works.

**It cannot be lost.** There is no game over, no death, no divorce, no bankruptcy. The worst that can happen is a slide: rusty skills, a tired body, fewer friends, a smaller salary — and every slide has a way back (see "Never lost" in [spec/life.md](spec/life.md)).

What makes it pull in a schoolkid **and** an adult:

- **A life you can watch.** A 2D cut-away home where the hero sleeps, codes at a glowing monitor, plays with the kids, runs in the park; the window shows the day, the night, the seasons and the city changing over 30 years; the hero ages, gains or loses weight, gets glasses. The room grows from a dorm corner to a home office.
- **Build your own computer — and learn it for real.** Every PC upgrade is a small drag-and-drop assembly: CPU into the socket, thermal paste, RAM in the right slots, the cables, the first boot. Each part comes with a short, honest card in the **Hardware Codex** (what it does, what its numbers mean, an analogy a child understands). A wrong part does not break anything — it just does not fit or does not boot, and the hint says why.
- **Real history of the trade.** The smartphone boom, the cloud, React and Docker, the crypto craze and its GPU prices, the pandemic and remote work, the chip shortage, ChatGPT in November 2022, the layoffs, the AI agents — each one changes the market, the prices and the hero's options. After 2026 the future is invented and labelled as such.
- **Offers to compare.** Job offers arrive while the hero is open to them; a side-by-side card compares money, hours, commute, stack, stress, growth, equipment and requirements with the current job ▲▼. Some need a skill or a strong PC; some give a laptop but pay less.
- **Little stories.** An old friend's birthday, a conference, a hackathon, a coffee on the keyboard, a hard disk dying without a backup, a cat walking on the keyboard during a call, a child's first word — small cards with two or three choices and their effects shown.
- **A birthday every year.** A short card with the cake, the year's photo, the wheel of life and three highlights; **Details** opens the charts, the hours of the year by activity, the money, the skills, the goals.
- **Words a kid understands.** The game talks plainly and teaches the real words of the trade on the way: every term (*stipend*, *junior*, *mortgage*, *RAM*, *burnout*) is underlined and explains itself in a bubble with an example; every number answers *Why?* ([spec/words.md](spec/words.md)).
- **Switch off any time.** No save button and nothing to lose: the phone can be locked or switched off mid-card, and the game comes back at the same minute ([spec/saves.md](spec/saves.md)).
- **Collections.** The Hardware Codex, the 📖 Dictionary of the trade's words, the Tech History cards, the Photo Album (one picture a year), the achievements, and the **Life Gallery** of finished lives to reread and compare.

## The story

The hero (default name **Alex**, any look — chosen on the start screen) is **18 on the 1st of September 2010, the first day of a computer science bachelor's** at a university in a medium-sized city. They move into a shared dorm room with **Max**, have an old 2006 laptop from their parents (2 cores, 2 GB of RAM, a slow hard disk), €200 of savings, the parents' monthly help and — if the first session goes well — a **stipend**. Four student years ([spec/university.md](spec/university.md)) teach the game's rhythm: classes and exam sessions, the stipend that depends on the grades, a part-time job that eats study time, clubs, contests, the first love, the summer internship, the thesis.

Seven chapters follow the real eras of the trade ([spec/timeline.md](spec/timeline.md)):

| # | Years | Age | Chapter | What it is about |
|---|---|---|---|---|
| 1 | 2010–2014 | 18–22 | **Hello, World** | The university: classes, exams, the stipend, student jobs, the dorm with Max, the first PC built from parts with saved money, the internship, the thesis, the diploma |
| 2 | 2014–2016 | 22–24 | **Stack Overflow** | The first full-time job, junior to middle, the first rented flat, the first conference, maybe a master's alongside |
| 3 | 2017–2019 | 25–27 | **Merge Request** | Senior, a relationship, the crypto craze and its GPU prices, a relocation offer, rent or a mortgage |
| 4 | 2020–2022 | 28–30 | **Work From Home** | The pandemic: the home office becomes the workplace, the chip shortage, a wedding, ChatGPT at the chapter's end |
| 5 | 2023–2027 | 31–35 | **The AI Era** | Layoffs, AI tools, the juniors' market shrinks, learning to work with agents, the first child, lead or architect |
| 6 | 2028–2034 | 36–42 | **The Long Game** | The invented future begins: the hero's own path (CTO, founder, teacher, architect, part-time), a second child, a house |
| 7 | 2035–2042 | 43–50 | **Legacy** | The kids grow up; a child (or a young mentee) asks to build their first PC together — the bookend of the first laptop; the 50th birthday |

The recurring cast: **Max** (the dorm roommate and the friend for life — birthdays, a startup offer in chapter 3 or 5), **Dana** (a senior colleague at the internship and the first job, a mentor if the hero asks), **the partner** (met by one of several ways, named by the player), **the kids**, **the parents** (send money in the student years, help in hard times, need help later), **Byte** the cat (if adopted). No one dies, no one leaves for good.

**The 50th birthday in autumn 2042 is the end of the story**: a party with everyone the hero kept in touch with, then the **Memoir** tells the life as it was played (from the year logs), with its title (*The Balanced Architect*, *The Workaholic CTO*, *The Family Hacker*…), the wheel of life and the photos, and the life goes into the **Life Gallery** ([spec/saves.md › The Life Gallery](spec/saves.md#the-life-gallery)) — to reread, compare with other lives and share as a picture. Then **Keep living** (the game goes on without chapters, to 2050) or **A new life** (New Game+ with another start: self-taught from 2014, a career switch at 30 in 2018, a freshman of 2022 into the AI era).

## The loop

The game runs by itself; the player steers it.

1. **The routine** — two 24-hour plans, *Weekday* and *Weekend*, set with sliders: sleep, work, learning, side project, sport, family, friends, hobby and rest; commute and chores are filled in automatically from the job, the home and what money buys (a dishwasher saves time). Next to every meter the routine shows its weekly effect (▲▲ / ▲ / – / ▼ / ▼▼), live while a slider moves. Presets: *Balanced*, *Crunch*, *Study sprint*, *Family first*, *Recovery*. See [spec/life.md](spec/life.md).
2. **Time flows** at the chosen speed: the clock runs, the hero does what the routine says, money ticks, the meters move, the skills grow.
3. **Something comes up** — an offer, an invitation, an illness, a market change, a purchase that is due. Important ones pause the game with a card; small ones can be left to the **autopilot** (the player's standing answers, see "Idle play").
4. **Monthly** the salary (in the student years the stipend, the parents' help and the student job's pay) arrives and the bills go out (the Money tab shows the month's line). **Every six months** a performance review (in the student years the exam session). **Every birthday** the yearly report.
5. **Long-term choices** are made any time from the tabs, with the game running or paused: learning plan, job search, purchases, PC upgrades, home, savings and investments, life goals.

### The balances

The game is built on trade-offs, each visible in the numbers:

| Balance | Example |
|---|---|
| **Work ↔ life** | Overtime raises performance and money, lowers Calm, Rest, Family, Friends |
| **Saving ↔ spending** | A cushion and investments vs a good chair, a vacation, a faster PC that pays back in speed and health |
| **Now ↔ later** | Learning and side projects cost evenings today and raise the salary in two years |
| **Depth ↔ breadth** | One skill to a high level (big salary in its niche, a risk when the market turns) vs several skills (safer, lower ceiling) |
| **Stability ↔ risk** | A bank or a big company vs a startup with equity, freelance, an own product |
| **Money ↔ time** | Delivery food, a cleaner, a dishwasher, a home robot, a home close to work: money buys hours |
| **Office ↔ home** | Commute and colleagues vs no commute, isolation and a home office that has to be good |
| **Old ↔ new** | A legacy stack pays well and is calm vs the new trend that may fade or explode |
| **Self ↔ others** | Own sport and hobby vs partner, kids, friends, helping parents |
| **Buy ↔ build** | A ready PC (quick, costlier, less knowledge) vs assembling from parts (cheaper, teaches, fun) |

### Goals

No goal is required and none can be failed; they give a direction and a reason to plan.

- **Life Dreams** — at the start the player picks **three** from a list (changeable once per chapter): *Lead by 35*, *An own home*, *A family with kids*, *Run a marathon*, *The dream PC*, *A year's cushion*, *Speak at a conference*, *Launch an own app*, *Live abroad*, *Teach others*, *Financial freedom by 50*, *Never burn out*. Each shows its progress in 🎯 Goals; a fulfilled dream gets a photo in the album and a line in the Memoir.
- **Chapter goals** — three per chapter, one each of **career**, **health** and **life** (chapter 1: *Graduate with a job offer in hand* · *Keep Rest above 50 through every exam session* · *Build your first PC*). Each gives ★; all three give the chapter's card in the album. A missed one shows "not this time" in the report.
- **The wheel of life** — eight sectors 0–10: Career, Money, Health, Mind, Love & Family, Friends, Growth, Home. Its area is the **Life Balance** score shown in every report; a round wheel scores more than a spiky one of the same total.
- **Achievements** — small and kind (*First salary*, *Never skipped a friend's birthday*, *Built a PC with no hint*, *Backed up before the disk died*, *Ten years of sport*).

## Time and length

The sim steps by the **hour** (the routine's blocks), the screen shows the clock.

| Speed | One game day | One game year | 2010 → 2042 |
|---|---|---|---|
| ⏸ Pause | — | — | — |
| ▶ | 2 s | ≈ 12 min | ≈ 6.5 h |
| ▶▶ | 1 s | ≈ 6 min | ≈ 3.2 h |
| ▶▶▶ | 0.4 s | ≈ 2.5 min | ≈ 1.3 h |
| ⏭ Skip to the next event | as fast as it goes, stops at the next card | | |

With the decisions, the assembly and the reports, **the story takes about 5–8 hours** at a mix of speeds, **40–80 minutes a chapter** (the university, full of sessions and cards, is the longest to play; the later chapters have more calm years for ▶▶▶ and ⏭); a session of **20–40 minutes is 2–3 game years** — the size of a child's daily phone time. The numbers go into `constants.js` (`DAY_SECONDS`) and are measured by the bot (see "Testing").

- **Auto-pause** on a card that needs a decision (an offer, a life event, an illness, a birthday report). A setting chooses which cards pause: *All*, *Important only* (default), *None* (the autopilot answers, see below).
- **Never lost.** The whole state is saved every 5 real seconds while the time runs, at once after every decision and synchronously when the page is hidden (`visibilitychange`, `pagehide`, `freeze`), into two rotating slots plus a birthday slot; the game pauses itself when hidden. Opening it again shows **Welcome back** and **Continue** puts the player on the same minute, the same card, the same assembly step, paused. Details in [spec/saves.md](spec/saves.md).
- **While away** — off by default (the life does not run without the player). A setting *Life goes on while I'm away* runs the routine for the time away, capped at **one game month**, the autopilot answering the cards, and shows a short "While you were away" summary.

### Idle play

The game is meant to be left running: a good routine keeps the hero fine for months.

- **Autopilot for small things** — standing answers the player sets once ("Go to friends' birthdays if Friends < 60", "Buy the same food", "Decline conferences abroad", "See a doctor at the first symptom"). Every answer it gives goes into the **Life feed** with a one-tap *Undo / change the rule* where undo is possible.
- **Gentle nudges** — a meter falling for three weeks gets a small amber hint in the HUD ("Rest falling: −0.5 h of hobby → +0.5 h of sleep?"), with **Apply** in one tap.
- **The Life feed** — a timeline of what happened (salary in, a skill level up, a card answered, a market change), so a player who looked away knows what moved and why.

## Difficulty

All three levels can never be lost; they change how hard the balance is.

| | **Easy** (*Cozy*) | **Medium** | **Hard** (*Realistic*) |
|---|---|---|---|
| Meters' drift | ×0.7 | ×1 | ×1.3 |
| Salaries | +15 % | as table | −10 % |
| Market swings, layoffs | gentle | as history | stronger, more often |
| Inflation | none shown | 2 %/yr | as history (incl. 2022) |
| Exams | chances +15, retakes in the holidays don't shorten them | as written | chances −10, two debts = repeat the year |
| Interviews | no questions | easy questions | harder questions, more rounds |
| Assembly hints | always on | on request | after a failed boot |
| Autopilot | on by default | off by default | off by default |

The choice is on the start screen and in the pause menu (it can be changed in a running life; the Memoir notes the levels played), remembered as `devLife.difficulty`.

## Settings

- **Language** EN · RU · SV (every text through `tr()`, tables `data/lang-ru.js`, `data/lang-sv.js`), see `docs/languages.md`.
- **Sound** On / Off on the start screen and in the pause menu (`devLife.sound`): soft effects (keys, notifications, coins, coffee, the cat), an optional generated lo-fi loop (*Music* On / Off under Sound), all through one master gain.
- **New-word bubbles** On / Off and **Simple mode** (numbers shown as words) — see [spec/words.md › Settings](spec/words.md#settings).
- **Export life** / **Import life** (a JSON file) — see [spec/saves.md](spec/saves.md#coming-back).
- **Speed** default, **Auto-pause** (*All* / *Important only* / *None*), **While away** (Off / On), **Units** (kg/cm or lb/ft for weight and height; money is always one currency, see "Open questions").

## Controls

- **Desktop:** mouse for everything; **Space** pause / play, **1–3** speeds, **N** skip to the next event, **R** routine, **Tab**/**Shift+Tab** the tabs, **Esc** closes a card or opens pause; **Space**/**Enter** click the visible overlay button.
- **Touch:** taps and drags only (the assembly is drag-and-drop with large snap zones); bottom tab bar; cards as bottom sheets in portrait. No joystick — this game has no movement. Fullscreen from **Start** on touch devices (`docs/mobile.md`).

## Cheats

Keyboard only, each with a banner; a life with any cheat is marked *cheated* in its Memoir and does not count achievements.

| Key | Effect |
|---|---|
| `Shift+Y` | +1 game year |
| `Shift+1`…`Shift+7` | Jump to the start of chapter 1–7 (a generated typical life up to there) |
| `Shift+X` | Pass the current exam with Excellent / defend the thesis |
| `Shift+M` | +10 000 money |
| `Shift+F` | All meters to 80 |
| `Shift+O` | A job offer now |
| `Shift+E` | A random event now |
| `Shift+B` | The birthday report now |
| `Shift+H` | Every part of the current year in the shop, the Codex fully open |

## Storage

`localStorage` keys start with `devLife.`: `devLife.life.v1.a` / `.b` (the running life, two rotating slots), `devLife.life.v1.bday` (the last birthday's state), `devLife.life.v1.log` (the past years, compact), `devLife.lock` (the open tab's heartbeat), `devLife.gallery` (the Life Gallery), `devLife.codex` and `devLife.dictionary` (kept across lives), `devLife.settings`, `devLife.difficulty`, `devLife.sound`. All of it under about 1 MB, as the origin is shared ([spec/saves.md › Size](spec/saves.md#size)). A cloud save may come later through `docs/cloud-save.md`; the game never waits for it.

## Files

Plain scripts in dependency order, as `docs/code-layout.md` says:

```
dev-life/
├── SPEC.md, spec/*.md, README.md, README_RU.md, README_SV.md
├── index.html, styles.css, constants.js, game.js       # entry points; game.js the thin loop
├── data/      # eras.js (chapters, history events by year), market.js (demand by skill and year),
│              # university.js (subjects, timetables, the stipend's rules, student jobs, clubs),
│              # skills.js, jobs.js (companies, titles, offer templates), parts.js (PC parts by year),
│              # desk.js (furniture and gear), homes.js, events.js (event cards), questions.js
│              # (interview questions), codex.js (Hardware Codex cards), glossary.js (the Dictionary's
│              # terms in EN, RU, SV), goals.js, lang-ru.js, lang-sv.js
├── core/      # bus.js, rng.js (seeded), i18n.js, icons.js, storage.js, audio.js
├── sim/       # state.js, clock.js, routine.js, meters.js, body.js, money.js, skills.js, market.js,
│              # university.js (semesters, exams, grades, stipend, thesis),
│              # career.js, offers.js, people.js, home.js, events.js, autopilot.js, computer.js
│              # (compatibility and performance), goals.js, yearlog.js, save.js (slots, checksum,
│              # migrations), gallery.js (a finished life turned into a Gallery entry)
├── art/       # hero.js (the puppet: age, weight, clothes, glasses), rooms.js, furniture.js,
│              # pc-parts.js, city.js (the window's view by era), people.js, icons
├── render/    # scene.js (the home cut-away), desk.js (the desk close-up), assembly.js, vignettes.js
├── ui/        # hud.js, routine.js, tabs/*.js, card.js, offer-compare.js, shop.js, codex.js,
│              # birthday.js, memoir.js, start.js (Welcome back), pause.js, glossary.js (term marks,
│              # bubbles, the 📖 Dictionary), why.js (the "Why?" sheets), gallery.js, sounds.js
├── tools/     # life-bot.js (headless lives by policy), save-check.js, terms-check.js, saves/ (old
│              # versions' saves for the migrations), sim-files.js, balance-report.js
├── docs/      # showcase.gif (the chapters), generated balance charts
└── icon.svg, icon-maskable.svg, PNG icons, manifest.webmanifest, update.js, sw.js, screenshot.png
```

## Testing

- **`tools/life-bot.js`** runs whole lives 2010 → 2042 headless in Node with a seed and a **policy**: *Balanced*, *Workaholic*, *Homebody*, *Saver*, *Spender*, *Learner*, *Party student* (skips classes, works and goes out in the student years), *Do nothing* (default routine, autopilot on, never opens a tab). It prints each year's line (title or the student's average grade, money, net worth, weight, meters, wheel) and checks the design's promises:
  - *Do nothing* graduates (maybe with retakes) and ends 2042 alive and well enough (no meter stuck at 0 for over a month, a job most of the time, money ≥ 0) — "cannot be lost";
  - in the student years a balanced routine keeps the base stipend and affords the first PC by the 3rd year; a student job without study loses the stipend but still graduates; *Party student* ends with retakes, not expelled;
  - *Balanced* gets the highest Life Balance, *Workaholic* the highest net worth and the lowest Friends and Family, *Learner* the highest skills — the trade-offs are real;
  - every policy can reach at least one Life Dream; no dream is out of reach for every policy;
  - the measured length of a year at ▶ matches "Time and length".
- Determinism: the same seed and the same inputs give the same life (the bot runs twice and compares).
- **`tools/save-check.js`** — saves and reloads at random moments and expects the same life, survives a half-written slot, migrates old saves, keeps the size budget ([spec/saves.md › Testing the saves](spec/saves.md#testing-the-saves)).
- **`tools/terms-check.js`** — every term mark exists in the glossary in three languages, the same terms in every translation, the texts' lengths ([spec/words.md › Term markup](spec/words.md#term-markup)); run it with `tools/i18n-check.js` before committing.
- Browser checks with `tools/cdp.js`, short, one at a time (`docs/testing.md`); recipes that put the game into a state go into this spec as they appear.

## Build order

Seven sessions, each with up to four tracks in parallel (a sim track and a content track in Node, one or two visual tracks), merged and checked by the main session — the full plan, the files each track owns and the rules that keep parallel work safe are in **[spec/plan.md](spec/plan.md)**:

1. **Foundations and the look** — the contracts, the skeleton, the core sim headless, the save; the art direction on one frame (approved by the user).
2. **Chapter 1 playable** — the university sim, the first terms and student cards, the living scene, the UI kit (HUD, cards, routine, *Why?*, bubbles, Dictionary, Welcome back).
3. **Career and the computer** — the career sim, the parts and their compatibility, the career UI and the offer comparison, the drawings of places and parts.
4. **Life and building a PC** — people, homes, illness, the autopilot, the timeline's content, the shop and the assembly, homes and the family drawn; the first whole-life balance.
5. **Goals, reports, the Gallery, the saves, the sound.**
6. **Balance and polish** — the length and the trade-offs tuned, the texts audited, phones and tablets.
7. **Release** — PWA, READMEs, the showcase GIF, the gallery card.

## Open questions

The defaults below are written into this spec; the user may change them.

1. **Money.** One neutral currency for the whole world of the game, written as **€** with prices and salaries of a typical European city (default), or **$** with US-like numbers, or a fictional **credit** ¤.
2. **Real names of PC parts.** Real model names of iconic parts (*Core i5-2500K*, *GeForce GTX 1060*, *Ryzen 7 1700*) teach what the player will see in a real shop (default), or generic names by class (*6-core CPU, 2017*).
3. **The hero.** Any look and a name of the player's choice (default), or a fixed hero.
4. **The university's length.** A four-year bachelor's with an optional two-year master's (default, the international pattern), or a five-year degree in one piece.
5. **Romance and children** stay family-friendly and gentle (no breakups after moving in, no divorce, no loss), as written; the player decides whether to have a partner and kids at all.
6. **While away** off by default (as written), or on with the one-month cap.
