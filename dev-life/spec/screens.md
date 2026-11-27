# Dev Life — the screens and the graphics

Part of [SPEC.md](../SPEC.md). The look, the main scene, the HUD, the tabs, the cards, the birthday report, the Memoir, the phone layout.

## Look and style

- **2D, cozy, flat vector with soft shading** — a warm "lo-fi study" mood: muted colours, warm lamp light at night, the cool glow of the monitor, gentle animations. Everything is drawn procedurally in Canvas 2D and cached as sprites (no image files), like the other games of this repo; the icons through the Icons engine (`docs/icons.md`).
- **One palette per time of day** (morning, day, evening, night) blended by the clock; **seasons** in the window (snow, rain, autumn leaves, summer green); the **era** in the city outside (a few cranes in 2010, new towers and a tram later, flying delivery drones and solar roofs in the *forecast* years).
- **The hero** is a simple puppet (head, hair, body, arms, legs) with a few poses per activity and smooth tweening between them; it **ages** (hair greys from 40, a beard option, the face a little rounder or thinner), **follows the weight** (the waist and the face), wears **glasses** once bought, changes **clothes by era and occasion** (a student hoodie, office shirt, home sweatpants in 2020, a suit at the wedding).
- **Readable at a glance:** every effect pops above the hero as a small icon with + / − (💰 +, ⚡ −, ✨ +), so the player sees what the hour does without reading.
- **Satisfying moments:** the salary's coins falling into the jar on payday, a skill's level-up ring, the first boot's glow, the box arriving, a new item placed on the desk with a little bounce, the birthday candles.

## The main screen

```
┌──────────────────────────────────────────────────────────────────────┐
│ Mon 14 Mar 2016 · 21:40   ⏸ ▶ ▶▶ ▶▶▶ ⏭   Alex, 23 · Junior dev   💰 3 420 ▲ │
├──────┬───────────────────────────────────────────────────────────────┤
│ ⚡ ███ │                                                               │
│ 😴 ██░ │            THE HOME (cut-away, side view)                     │
│ 💪 ██░ │   ┌────────────┬──────────────┬─────────────┐                 │
│ ❤️ ███ │   │  bedroom   │   the desk    │  kitchen    │   window: city  │
│ 🪑 █░░ │   │            │  hero coding  │             │   night, rain   │
│ 😊 ███ │   └────────────┴──────────────┴─────────────┘                 │
│ 🧘 ██░ │                                                               │
│ ✨ ██░ │   now: 📚 Learning · Backend (course) · until 22:30            │
│ 🤝 █░░ │                                                               │
│ 💞 ███ │   [ Life feed: Salary +2 950 · Backend 5 → 6 · Max's birthday… ] │
├──────┴───────────────────────────────────────────────────────────────┤
│  🗓️ Day   💼 Career   📚 Learn   🖥️ PC & Desk   🏠 Life   💰 Money   🎯 Goals │
└──────────────────────────────────────────────────────────────────────┘
```

- **The top bar:** the date and the clock, the speeds, the hero's name, age and title, the money with the month's trend (▲ saving / ▼ spending more than earning), the **📖** Dictionary. Tapping the money opens 💰.
- **The meters' column:** icon, bar, arrow; the flame of burnout risk when it is high; tapping a meter opens its "why" sheet (the causes listed, the biggest first, with a quick fix button where one exists).
- **The scene:** the home's rooms in a cut-away (one room in the dorm, up to a two-storey house), the hero in the room of the current activity, the partner, the kids and the cat doing their own things. When the hero is out, a **vignette** replaces the home: the lecture hall, the exam room, the campus café and the IT club in the student years, the office (open space, a meeting room, the hero's desk there), the gym, the park run, a café with friends, the conference hall, the kindergarten gate, a train for the commute — small looping scenes.
- **Tapping the desk** zooms into the **desk close-up**: the PC with its side panel (RGB if bought), the monitors showing scrolling code in the language of the era and the skill being used, the items on the desk; buttons into 🖥️.
- **The "now" line** says what the hero does and until when; tapping it opens 🗓️ Day.
- **The Life feed** — the last three lines under the scene, the whole timeline in 🏠 Life.

## The tabs

| Tab | Holds |
|---|---|
| 🗓️ **Day** | The routine (the ring or the sliders), Weekday / Weekend, the presets, the activities' choices (sport kind, hobby kind, side-project kind), the weekly arrows and money per month, special days (vacation planner) |
| 🎓 **University** (while studying, in place of 💼) | The semester's subjects, attendance, the next exams and their chances, the average grade, the stipend now and after the session, the student job, clubs, projects, the thesis, internship offers ([university.md › The 🎓 tab](university.md#the--tab)) |
| 💼 **Career** | The current job card, performance and the next review, *Ask for a raise*, *Quit*; **Open to offers** switch; the offers waiting and the comparison; the profile (CV); the 📈 Market chart |
| 📚 **Learn** | The skills with levels, XP bars and rust marks; the learning plan queue; methods and courses to buy; what the learning speed is limited by |
| 🖥️ **PC & Desk** | The machines and their bars, Upgrade, Build new, the shop, the assembly box waiting, the desk items, the workplace score, the 📘 Hardware Codex |
| 🏠 **Life** | The home and moving, food, the people (partner, kids, friends, parents, the pet) with their meters and the next events, invitations waiting, the Life feed, the autopilot's rules |
| 💰 **Money** | The month's line, the charts, the accounts, Move money, fixed costs, big purchases (vacation, car, wedding, home), the mortgage |
| 🎯 **Goals** | The three Life Dreams with progress, the chapter's three goals, the wheel of life now, the achievements, the 📷 Photo Album, the 🗞️ Tech History cards |

On a desktop a tab opens as a side panel and the scene keeps running beside it; on a phone it opens as a full sheet over the scene (the clock keeps running unless the player pauses).

## Cards

All decisions come as one kind of card: a drawing at the top, the title, two or three lines, the choices as big buttons, under each choice its effects (meter icons with ▲▼, money, time, "?" with *likely* / *maybe* / *a long shot*). The comparison card for offers is the wide variant with two columns ([career.md › Offers](career.md#offers)). **Space**/**Enter** clicks the highlighted (first) choice only on cards where it is harmless (*OK*, *Later*); real choices need a click or a tap.

## The birthday report

On the hero's birthday the game pauses (unless *Auto-pause: None*) and shows the **short report**:

- the cake with the age's candles (blown with a tap), the year's **photo** (the scene's best moment of the year, drawn as a polaroid: the hero with the family, the new PC, the wedding, the conference stage — chosen from the year's biggest event), the title and the employer;
- **five lines:** the money (net worth and its change), the career (title, salary, best skill), the body (weight change, Fitness, illness days), the people (Love, Kids, Friends in words), the year's highlight;
- the **wheel of life** with last year's shape as a ghost outline, the Life Balance score;
- the Life Dreams' progress, one line each;
- buttons **Details**, **Continue**.

**Details** opens the yearly book:

- **The hours of the year** — a stacked bar and a pie: *2 140 h working, 410 h with the family, 120 h of sport…*, compared with the last year;
- **Charts by month** — money in and out, net worth, weight, each meter;
- **Career** — reviews, raises, offers seen and taken, skills gained and rusted;
- **Purchases** and what they did (the chair: Back & Eyes +18 since March);
- **Events** of the year as a list with the choices made;
- **Hints** — three gentle suggestions from the data ("Your back suffered most: a chair, or 30 min of sport, would help"; "You saved 22 % — the emergency fund is full, the rest could go to the index fund");
- **The tech news of the year** — the history cards seen, a little newspaper.

## The Memoir

After the 50th birthday party in 2042 (and on demand from 🎯 after it): a scrolling book of the life — a page per chapter with its photo, the goals, the years' highlights in short sentences generated from the year logs, the people, the PCs built (drawn in a row from the old laptop to the last build), the jobs, the final wheel of life, the **title** of the life (from the shape of the wheel and the biggest numbers) and the achievements. When the book closes, the life goes into the **Life Gallery**, where it can be reread, compared with other lives ("Your second life: more family, less money") and saved as a picture — see [saves.md › The Life Gallery](saves.md#the-life-gallery).

## The start screen

With a life running, the game opens on **Welcome back** over the paused scene ([saves.md › Coming back](saves.md#coming-back)). Otherwise: the game's name over a small looping scene (a desk at night, the city in the window); **Life Gallery** and **Import life** when there is something to show; **New life** → the hero's name, look, birthday, the family's background (*Generous*, *Modest*, *None* — the parents' help in the student years), and the start (only *CS freshman* until the first life reaches the 50th birthday; then the others); the three **Life Dreams**; the difficulty **Easy · Medium · Hard**; **Sound** On / Off; the language **EN · RU · SV**. The pause menu repeats difficulty, sound, music, auto-pause, while-away, new-word bubbles, simple mode and the language, plus **📖 Dictionary**, **Life Gallery**, **Save to Gallery** (from age 30), **Export life** and **New life** (with a confirmation).

## Plain words on every screen

Every screen follows [words.md](words.md): plain words first, the real terms underlined with a bubble, a **📖** button in the top bar for the Dictionary, every number with an arrow tappable for *Why?*. The meters' names are plain (*Energy*, *Rest*, *Back & Eyes*), each with a one-line description in its *Why?* sheet; job titles show a plain helper the first times (*Junior — a beginner programmer*).

## Phone and tablet

- **Landscape** (the main mode on phones): the meters' column narrows to icons with thin bars, the tabs at the bottom as icons, the sheets slide up over two thirds of the screen.
- **Portrait:** the scene on top (smaller, the rooms scroll sideways with a swipe), the meters as a two-row strip under it, the tabs at the bottom.
- **Touch:** big buttons and snap zones; the routine as sliders; the assembly with large magnetic targets; long-press for tooltips; no hover-only information.
- **Performance:** the scene renders at a capped frame rate when nothing moves (idle play on a phone must not drain the battery); at ▶▶▶ only the hero's pose, the clock and the numbers animate.

## Sounds

Through one master gain (the Sound rule of `AGENTS.md`): soft keyboard ticks while coding, a coffee machine, notification blips for cards, coins on payday, a level-up chime, a cork on the wedding, the cat's purr, rain in the window, the PC's first-boot beep; an optional generated lo-fi loop (a few chords and a soft beat, varied by time of day). Sound and Music are separate switches; both off means silence.
